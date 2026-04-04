import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

const DEFAULT_FORM = {
  instagram_handle: "",
  city: "",
  vibe_score: "",
  me_misunderstood: "",
  me_pride: "",
  active: true,
  claimed_by_user_id: "",
  admin_note: "",
};

function timeAgo(value) {
  if (!value) return "—";
  const date = new Date(value);
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  const units = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
    [1, "s"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "—";
}

function scoreTone(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "neutral";
  if (n >= 70) return "good";
  if (n >= 40) return "mid";
  return "bad";
}

export default function AdminHandlesPage() {
  const [handles, setHandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [claimFilter, setClaimFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedHandle, setSelectedHandle] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 1800);
    return () => clearTimeout(t);
  }, [success]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api("http://localhost:5004/api/admin/handles");
      setHandles((data.handles || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return handles.filter((h) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || h.instagram_handle?.toLowerCase().includes(s)
        || h.city?.toLowerCase().includes(s)
        || h._id?.toLowerCase().includes(s)
        || h.claimed_by_username?.toLowerCase().includes(s)
        || h.claimed_by_email?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && h.is_suspended !== true) || (status === "inactive" && h.is_suspended === true);
      const claimed = !!(h.claimed_by_user_id || h.claimed_by);
      const okClaim = claimFilter === "all"
        || (claimFilter === "claimed" && claimed)
        || (claimFilter === "unclaimed" && !claimed);
      return okSearch && okStatus && okClaim;
    });
  }, [handles, search, status, claimFilter]);

  function select(handle) {
    setSelectedId(handle._id);
    setSelectedHandle(handle);
    setForm({
      instagram_handle: handle.instagram_handle || "",
      city: handle.city || "",
      vibe_score: handle.vibe_score ?? handle.stats?.vibe_score ?? "",
      me_misunderstood: handle.me_misunderstood || "",
      me_pride: handle.me_pride || "",
      active: handle.is_suspended !== true,
      claimed_by_user_id: handle.claimed_by_user_id || handle.claimed_by || "",
      admin_note: handle.admin_note || "",
    });
  }

  function reset() {
    setSelectedId(null);
    setSelectedHandle(null);
    setForm(DEFAULT_FORM);
  }

  async function save(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        instagram_handle: form.instagram_handle.trim().toLowerCase(),
        city: form.city.trim() || null,
        vibe_score: form.vibe_score === "" ? null : Number(form.vibe_score),
        me_misunderstood: form.me_misunderstood.trim() || null,
        me_pride: form.me_pride.trim() || null,
        is_suspended: !form.active,
        claimed_by_user_id: form.claimed_by_user_id.trim() || null,
        admin_note: form.admin_note.trim() || null,
      };

      await api(`http://localhost:5004/api/admin/handles/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSuccess("Handle updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!selectedId || !selectedHandle) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/handles/${selectedId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_suspended: !selectedHandle.is_suspended }),
      });
      setSuccess(selectedHandle.is_suspended ? "Handle activated" : "Handle suspended");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function unclaimHandle() {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/handles/${selectedId}/unclaim`, { method: "POST" });
      setSuccess("Handle unclaimed");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-handles-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Handles</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters filters-3">
            <input placeholder="Search by handle, city, claim, id" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={claimFilter} onChange={(e) => setClaimFilter(e.target.value)}>
              <option value="all">All claim states</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((handle) => {
                const score = handle.vibe_score ?? handle.stats?.vibe_score;
                const tone = scoreTone(score);
                return (
                  <button key={handle._id} className={"item " + (selectedId === handle._id ? "sel" : "")} onClick={() => select(handle)}>
                    <div>
                      <div className="title">@{handle.instagram_handle || "unknown"}</div>
                      <div className="sub">{handle.city || "No city"}</div>
                      <div className="tiny">{handle.claimed_by_username ? `Claimed by @${handle.claimed_by_username}` : "Unclaimed"}</div>
                    </div>
                    <div className="item-right">
                      <span className={"score-pill " + tone}>{score == null ? "No score" : `${Math.round(score)}%`}</span>
                      <span className={"pill " + (handle.is_suspended !== true ? "active" : "inactive")}>{handle.is_suspended !== true ? "Active" : "Inactive"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty">No handles found</div>
          )}
        </div>

        <div className="right-col">
          <form className="card form-card" onSubmit={save}>
            <div className="form-head">
              <h3>{selectedId ? "Edit Handle" : "Select a Handle"}</h3>
              {selectedId ? (
                <div className="head-actions">
                  <button type="button" className="danger" onClick={toggleStatus}>
                    {selectedHandle?.is_suspended ? "Activate" : "Suspend"}
                  </button>
                  {!!(selectedHandle?.claimed_by_user_id || selectedHandle?.claimed_by) ? (
                    <button type="button" className="btn" onClick={unclaimHandle}>Unclaim</button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {selectedId ? (
              <>
                <div className="meta-strip">
                  <span>ID: {selectedHandle?._id}</span>
                  <span>Created: {selectedHandle?.created_at ? new Date(selectedHandle.created_at).toLocaleDateString() : "—"}</span>
                  <span>Updated: {timeAgo(selectedHandle?.updated_at)}</span>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Instagram Handle</span>
                    <input value={form.instagram_handle} onChange={(e) => setForm((s) => ({ ...s, instagram_handle: e.target.value }))} />
                  </label>
                  <label>
                    <span>City</span>
                    <input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="Jaipur" />
                  </label>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Vibe Score</span>
                    <input type="number" min="0" max="100" value={form.vibe_score} onChange={(e) => setForm((s) => ({ ...s, vibe_score: e.target.value }))} />
                  </label>
                  <label className="chk">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
                    <span>Active</span>
                  </label>
                </div>

                <label>
                  <span>Claimed By User ID</span>
                  <input value={form.claimed_by_user_id} onChange={(e) => setForm((s) => ({ ...s, claimed_by_user_id: e.target.value }))} placeholder="Optional user id" />
                </label>

                <label>
                  <span>What people misunderstand</span>
                  <textarea rows={4} value={form.me_misunderstood} onChange={(e) => setForm((s) => ({ ...s, me_misunderstood: e.target.value }))} />
                </label>

                <label>
                  <span>What they pride themselves on</span>
                  <textarea rows={4} value={form.me_pride} onChange={(e) => setForm((s) => ({ ...s, me_pride: e.target.value }))} />
                </label>

                <label>
                  <span>Admin Note</span>
                  <textarea rows={4} value={form.admin_note} onChange={(e) => setForm((s) => ({ ...s, admin_note: e.target.value }))} placeholder="Internal note visible only to admins" />
                </label>

                <div className="info-grid">
                  <div className="info-card"><span>Flags</span><strong>{selectedHandle?.stats?.total_flag_count ?? 0}</strong></div>
                  <div className="info-card"><span>Red</span><strong>{selectedHandle?.stats?.red_flag_count ?? 0}</strong></div>
                  <div className="info-card"><span>Green</span><strong>{selectedHandle?.stats?.green_flag_count ?? 0}</strong></div>
                  <div className="info-card"><span>Searches</span><strong>{selectedHandle?.stats?.search_count ?? 0}</strong></div>
                  <div className="info-card"><span>Know Count</span><strong>{selectedHandle?.stats?.know_count ?? 0}</strong></div>
                  <div className="info-card"><span>Vibe Score</span><strong>{selectedHandle?.stats?.vibe_score ?? "—"}</strong></div>
                </div>

                <div className="actions">
                  <button type="button" className="btn" onClick={reset}>Reset</button>
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : "Update Handle"}</button>
                </div>
              </>
            ) : (
              <div className="empty">Select a handle from the left to inspect and update details.</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:460px 1fr;gap:16px}
  .right-col{display:grid;gap:16px}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .filters{display:grid;gap:8px;margin-bottom:10px}
  .filters-3{grid-template-columns:1fr 140px 170px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .list{display:flex;flex-direction:column;gap:8px;max-height:760px;overflow:auto}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer;text-align:left}
  .item.sel{border-color:#000;background:#f2f1ec}
  .item-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
  .title{font-weight:700}
  .sub{font-size:12px;color:#444}
  .tiny{font-size:11px;color:#777;margin-top:2px}
  .pill,.score-pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.active{background:#ecfff5;color:#1a9e5f}
  .pill.inactive{background:#f2f1ec;color:#666}
  .score-pill.good{background:#ecfff5;color:#1a9e5f}
  .score-pill.mid{background:#fff7e8;color:#b26a00}
  .score-pill.bad{background:#fff0f0;color:#a11}
  .score-pill.neutral{background:#f2f1ec;color:#666}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .head-actions{display:flex;gap:8px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:grid;gap:10px}
  .row-2{grid-template-columns:1fr 1fr}
  .chk{display:flex;align-items:center;gap:8px;margin-top:22px}
  .meta-strip{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#666;margin-bottom:10px;background:#faf9f6;border:1px solid #ecebe6;padding:10px;border-radius:10px}
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}
  .info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}
  .info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}
  .info-card strong{font-size:20px}
  .actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:10px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}
  .btn.primary{background:#000;color:#fff;border-color:#000}
  .danger{border:1px solid #ffbcbc;background:#fff0f0;color:#c62828;border-radius:10px;padding:6px 10px}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}
  .banner.error{background:#fff0f0;color:#a11}
  .banner.success{background:#ecfff5;color:#1a9e5f}
  .empty{color:#666;padding:10px}
  @media(max-width:1200px){.grid{grid-template-columns:1fr}.filters-3{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}}
`;
