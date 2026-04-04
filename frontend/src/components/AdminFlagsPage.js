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

const EMPTY_BULK = {
  status: "approved",
  visibility: "public",
  moderation_note: "",
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

function cx(...v) {
  return v.filter(Boolean).join(" ");
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const [detailForm, setDetailForm] = useState({
    status: "pending",
    visibility: "public",
    severity_score: "",
    credibility_score: "",
    moderation_note: "",
    admin_tags: "",
    legal_risk: false,
    sensitive: false,
  });

  const [bulkForm, setBulkForm] = useState(EMPTY_BULK);
  const [saving, setSaving] = useState(false);

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
      const data = await api("http://localhost:5004/api/admin/flags");
      setFlags((data.flags || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return flags.filter((f) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || f._id?.toLowerCase().includes(s)
        || f.comment?.toLowerCase().includes(s)
        || f.category_name?.toLowerCase().includes(s)
        || f.handle_username?.toLowerCase().includes(s)
        || f.posted_by_username?.toLowerCase().includes(s);
      const okStatus = status === "all" || (f.status || "pending") === status;
      const okType = typeFilter === "all" || f.flag_type === typeFilter;
      const okVisibility = visibilityFilter === "all" || (f.visibility || "public") === visibilityFilter;
      const sev = Number(f.severity_score);
      const okSeverity = severityFilter === "all"
        || (severityFilter === "high" && sev >= 70)
        || (severityFilter === "medium" && sev >= 40 && sev < 70)
        || (severityFilter === "low" && (Number.isNaN(sev) || sev < 40));
      return okSearch && okStatus && okType && okVisibility && okSeverity;
    });
  }, [flags, search, status, typeFilter, visibilityFilter, severityFilter]);

  const selectedCount = selectedRows.length;

  function selectFlag(flag) {
    setSelectedId(flag._id);
    setSelectedFlag(flag);
    setDetailForm({
      status: flag.status || "pending",
      visibility: flag.visibility || "public",
      severity_score: flag.severity_score ?? "",
      credibility_score: flag.credibility_score ?? "",
      moderation_note: flag.moderation_note || "",
      admin_tags: Array.isArray(flag.admin_tags) ? flag.admin_tags.join(", ") : (flag.admin_tags || ""),
      legal_risk: !!flag.legal_risk,
      sensitive: !!flag.sensitive,
    });
  }

  function toggleRow(id) {
    setSelectedRows((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  function toggleAllVisible() {
    const ids = filtered.map((f) => f._id);
    const allSelected = ids.every((id) => selectedRows.includes(id));
    setSelectedRows(allSelected ? selectedRows.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedRows, ...ids])));
  }

  async function saveDetail(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        status: detailForm.status,
        visibility: detailForm.visibility,
        severity_score: detailForm.severity_score === "" ? null : Number(detailForm.severity_score),
        credibility_score: detailForm.credibility_score === "" ? null : Number(detailForm.credibility_score),
        moderation_note: detailForm.moderation_note.trim() || null,
        admin_tags: detailForm.admin_tags
          ? detailForm.admin_tags.split(",").map((x) => x.trim()).filter(Boolean)
          : [],
        legal_risk: !!detailForm.legal_risk,
        sensitive: !!detailForm.sensitive,
      };

      await api(`http://localhost:5004/api/admin/flags/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSuccess("Flag updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function quickAction(action) {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/flags/${selectedId}/${action}`, { method: "POST" });
      setSuccess(`Flag ${action}`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function applyBulk() {
    if (!selectedRows.length) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/flags/bulk-action`, {
        method: "POST",
        body: JSON.stringify({
          flag_ids: selectedRows,
          status: bulkForm.status,
          visibility: bulkForm.visibility,
          moderation_note: bulkForm.moderation_note.trim() || null,
        }),
      });
      setSuccess("Bulk action applied");
      setSelectedRows([]);
      setBulkForm(EMPTY_BULK);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-flags-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Flags Moderation</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="filters-card card">
        <div className="filters filters-5">
          <input placeholder="Search by handle, poster, category, id, comment" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All status</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="shadowed">shadowed</option>
            <option value="review">review</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="red">red</option>
            <option value="green">green</option>
          </select>
          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
            <option value="all">All visibility</option>
            <option value="public">public</option>
            <option value="hidden">hidden</option>
            <option value="limited">limited</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All severity</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </div>
      </div>

      <div className="grid">
        <div className="left-col">
          <div className="card bulk-card">
            <div className="bulk-top">
              <label className="chk master-check">
                <input type="checkbox" checked={filtered.length > 0 && filtered.every((f) => selectedRows.includes(f._id))} onChange={toggleAllVisible} />
                <span>{selectedCount} selected</span>
              </label>
              <div className="bulk-actions">
                <select value={bulkForm.status} onChange={(e) => setBulkForm((s) => ({ ...s, status: e.target.value }))}>
                  <option value="approved">approve</option>
                  <option value="rejected">reject</option>
                  <option value="shadowed">shadow</option>
                  <option value="review">send to review</option>
                </select>
                <select value={bulkForm.visibility} onChange={(e) => setBulkForm((s) => ({ ...s, visibility: e.target.value }))}>
                  <option value="public">public</option>
                  <option value="hidden">hidden</option>
                  <option value="limited">limited</option>
                </select>
                <button className="btn primary" disabled={!selectedCount || saving} onClick={applyBulk}>Apply Bulk</button>
              </div>
            </div>
            <textarea rows={2} placeholder="Bulk moderation note" value={bulkForm.moderation_note} onChange={(e) => setBulkForm((s) => ({ ...s, moderation_note: e.target.value }))} />
          </div>

          <div className="card list-card">
            {loading ? (
              <div className="empty">Loading…</div>
            ) : filtered.length ? (
              <div className="list">
                {filtered.map((flag) => {
                  const sevTone = scoreTone(flag.severity_score);
                  const credTone = scoreTone(flag.credibility_score);
                  return (
                    <div key={flag._id} className={cx("item-row", selectedId === flag._id && "sel") }>
                      <label className="row-check">
                        <input type="checkbox" checked={selectedRows.includes(flag._id)} onChange={() => toggleRow(flag._id)} />
                      </label>
                      <button className="item" onClick={() => selectFlag(flag)}>
                        <div className="item-top">
                          <span className={cx("type-pill", flag.flag_type === "red" ? "red" : "green")}>{flag.flag_type}</span>
                          <span className="status-pill">{flag.status || "pending"}</span>
                          <span className="category-pill">{flag.category_name || flag.category_id || "uncategorized"}</span>
                        </div>
                        <div className="title">@{flag.handle_username || flag.handle_instagram_handle || "unknown"}</div>
                        <div className="sub">by @{flag.posted_by_username || "anonymous"} · {timeAgo(flag.created_at)}</div>
                        <div className="comment-preview">{flag.comment || "No comment provided."}</div>
                        <div className="metrics-row">
                          <span className={cx("metric-pill", sevTone)}>Severity {flag.severity_score ?? "—"}</span>
                          <span className={cx("metric-pill", credTone)}>Credibility {flag.credibility_score ?? "—"}</span>
                          <span className="metric-pill neutral">Visibility {flag.visibility || "public"}</span>
                          {flag.legal_risk ? <span className="metric-pill risk">Legal risk</span> : null}
                          {flag.sensitive ? <span className="metric-pill sensitive">Sensitive</span> : null}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty">No flags found</div>
            )}
          </div>
        </div>

        <div className="right-col">
          <form className="card detail-card" onSubmit={saveDetail}>
            <div className="form-head">
              <h3>{selectedId ? "Flag Detail" : "Select a Flag"}</h3>
              {selectedId ? (
                <div className="quick-actions">
                  <button type="button" className="btn success" onClick={() => quickAction("approve")}>Approve</button>
                  <button type="button" className="btn danger" onClick={() => quickAction("reject")}>Reject</button>
                  <button type="button" className="btn" onClick={() => quickAction("shadow")}>Shadow</button>
                </div>
              ) : null}
            </div>

            {selectedId ? (
              <>
                <div className="meta-strip">
                  <span>ID: {selectedFlag?._id}</span>
                  <span>Handle: @{selectedFlag?.handle_username || selectedFlag?.handle_instagram_handle || "unknown"}</span>
                  <span>Poster: @{selectedFlag?.posted_by_username || "anonymous"}</span>
                </div>

                <div className="info-grid">
                  <div className="info-card"><span>Status</span><strong>{selectedFlag?.status || "pending"}</strong></div>
                  <div className="info-card"><span>Type</span><strong>{selectedFlag?.flag_type || "—"}</strong></div>
                  <div className="info-card"><span>Category</span><strong>{selectedFlag?.category_name || selectedFlag?.category_id || "—"}</strong></div>
                  <div className="info-card"><span>Know Count</span><strong>{selectedFlag?.know_count ?? 0}</strong></div>
                  <div className="info-card"><span>Replies</span><strong>{selectedFlag?.reply_count ?? 0}</strong></div>
                  <div className="info-card"><span>Reports</span><strong>{selectedFlag?.report_count ?? 0}</strong></div>
                </div>

                <label>
                  <span>Flag Comment</span>
                  <textarea rows={5} value={selectedFlag?.comment || ""} readOnly />
                </label>

                <div className="row row-2">
                  <label>
                    <span>Status</span>
                    <select value={detailForm.status} onChange={(e) => setDetailForm((s) => ({ ...s, status: e.target.value }))}>
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                      <option value="shadowed">shadowed</option>
                      <option value="review">review</option>
                    </select>
                  </label>
                  <label>
                    <span>Visibility</span>
                    <select value={detailForm.visibility} onChange={(e) => setDetailForm((s) => ({ ...s, visibility: e.target.value }))}>
                      <option value="public">public</option>
                      <option value="hidden">hidden</option>
                      <option value="limited">limited</option>
                    </select>
                  </label>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Severity Score</span>
                    <input type="number" min="0" max="100" value={detailForm.severity_score} onChange={(e) => setDetailForm((s) => ({ ...s, severity_score: e.target.value }))} />
                  </label>
                  <label>
                    <span>Credibility Score</span>
                    <input type="number" min="0" max="100" value={detailForm.credibility_score} onChange={(e) => setDetailForm((s) => ({ ...s, credibility_score: e.target.value }))} />
                  </label>
                </div>

                <label>
                  <span>Admin Tags</span>
                  <input value={detailForm.admin_tags} onChange={(e) => setDetailForm((s) => ({ ...s, admin_tags: e.target.value }))} placeholder="spam, coordinated-attack, review-needed" />
                </label>

                <label>
                  <span>Moderation Note</span>
                  <textarea rows={5} value={detailForm.moderation_note} onChange={(e) => setDetailForm((s) => ({ ...s, moderation_note: e.target.value }))} placeholder="Internal moderation decision note" />
                </label>

                <div className="row row-2">
                  <label className="chk"><input type="checkbox" checked={detailForm.legal_risk} onChange={(e) => setDetailForm((s) => ({ ...s, legal_risk: e.target.checked }))} /><span>Legal Risk</span></label>
                  <label className="chk"><input type="checkbox" checked={detailForm.sensitive} onChange={(e) => setDetailForm((s) => ({ ...s, sensitive: e.target.checked }))} /><span>Sensitive</span></label>
                </div>

                <div className="actions">
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save Moderation"}</button>
                </div>
              </>
            ) : (
              <div className="empty">Select a flag from the left to review and moderate it.</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:16px}
  .left-col,.right-col{display:grid;gap:16px;align-content:start}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .filters-card{margin-bottom:12px}
  .filters{display:grid;gap:8px}.filters-5{grid-template-columns:2fr repeat(4,1fr)}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .bulk-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}
  .bulk-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .master-check,.chk{display:flex;align-items:center;gap:8px}
  .list{display:flex;flex-direction:column;gap:10px;max-height:740px;overflow:auto}
  .item-row{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:stretch}
  .row-check{display:flex;align-items:flex-start;justify-content:center;padding-top:16px}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}
  .item-row.sel .item{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
  .title{font-weight:800}
  .sub,.comment-preview{font-size:12px;color:#555}
  .comment-preview{margin-top:6px;line-height:1.5}
  .type-pill,.status-pill,.category-pill,.metric-pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .type-pill.red{background:#fff0f0;color:#a11}.type-pill.green{background:#ecfff5;color:#1a9e5f}
  .status-pill{background:#f2f1ec;color:#555}.category-pill{background:#eef3ff;color:#3355aa}
  .metrics-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .metric-pill.good{background:#ecfff5;color:#1a9e5f}.metric-pill.mid{background:#fff7e8;color:#b26a00}.metric-pill.bad{background:#fff0f0;color:#a11}
  .metric-pill.neutral{background:#f2f1ec;color:#666}.metric-pill.risk{background:#111;color:#fff}.metric-pill.sensitive{background:#f7f0ff;color:#6b2bbd}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:12px}
  .quick-actions{display:flex;gap:8px;flex-wrap:wrap}
  .meta-strip{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-bottom:10px;background:#faf9f6;border:1px solid #ecebe6;padding:10px;border-radius:10px}
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}
  .info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}
  .info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:18px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:grid;gap:10px}.row-2{grid-template-columns:1fr 1fr}
  .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}
  .btn.primary{background:#000;color:#fff;border-color:#000}.btn.success{background:#ecfff5;color:#1a9e5f;border-color:#cdebdc}.btn.danger,.danger{background:#fff0f0;color:#c62828;border-color:#ffbcbc}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}
  .empty{color:#666;padding:10px}
  @media(max-width:1200px){.grid{grid-template-columns:1fr}.filters-5{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}}
`;
