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

function cx(...v) {
  return v.filter(Boolean).join(" ");
}

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
  if (n >= 70) return "bad";
  if (n >= 40) return "mid";
  return "good";
}

const DEFAULT_DETAIL = {
  status: "pending",
  visibility: "public",
  severity_score: "",
  toxicity_score: "",
  moderation_note: "",
  admin_tags: "",
  legal_risk: false,
  sensitive: false,
};

const DEFAULT_BULK = {
  status: "approved",
  visibility: "public",
  moderation_note: "",
};

export default function AdminCommentsRepliesModerationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [reportedOnly, setReportedOnly] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detail, setDetail] = useState(DEFAULT_DETAIL);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulk, setBulk] = useState(DEFAULT_BULK);
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
      const data = await api("http://localhost:5004/api/admin/flag-replies");
      setItems((data.replies || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || item._id?.toLowerCase().includes(s)
        || item.flag_id?.toLowerCase().includes(s)
        || item.content?.toLowerCase().includes(s)
        || item.author_username?.toLowerCase().includes(s)
        || item.handle_username?.toLowerCase().includes(s)
        || item.reply_type?.toLowerCase().includes(s);
      const okStatus = status === "all" || (item.status || "pending") === status;
      const okType = typeFilter === "all" || (item.reply_type || "comment") === typeFilter;
      const okVisibility = visibilityFilter === "all" || (item.visibility || "public") === visibilityFilter;
      const risk = Boolean(item.legal_risk || item.sensitive || Number(item.toxicity_score) >= 70 || Number(item.severity_score) >= 70);
      const okRisk = riskFilter === "all" || (riskFilter === "risk" && risk) || (riskFilter === "clean" && !risk);
      const okReported = !reportedOnly || Number(item.report_count || 0) > 0;
      return okSearch && okStatus && okType && okVisibility && okRisk && okReported;
    });
  }, [items, search, status, typeFilter, visibilityFilter, riskFilter, reportedOnly]);

  function select(item) {
    setSelectedId(item._id);
    setSelectedItem(item);
    setDetail({
      status: item.status || "pending",
      visibility: item.visibility || "public",
      severity_score: item.severity_score ?? "",
      toxicity_score: item.toxicity_score ?? "",
      moderation_note: item.moderation_note || "",
      admin_tags: Array.isArray(item.admin_tags) ? item.admin_tags.join(", ") : (item.admin_tags || ""),
      legal_risk: !!item.legal_risk,
      sensitive: !!item.sensitive,
    });
  }

  function toggleRow(id) {
    setSelectedRows((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    const ids = filtered.map((x) => x._id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedRows.includes(id));
    setSelectedRows(allSelected ? selectedRows.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedRows, ...ids])));
  }

  async function saveDetail(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        status: detail.status,
        visibility: detail.visibility,
        severity_score: detail.severity_score === "" ? null : Number(detail.severity_score),
        toxicity_score: detail.toxicity_score === "" ? null : Number(detail.toxicity_score),
        moderation_note: detail.moderation_note.trim() || null,
        admin_tags: detail.admin_tags ? detail.admin_tags.split(",").map((x) => x.trim()).filter(Boolean) : [],
        legal_risk: !!detail.legal_risk,
        sensitive: !!detail.sensitive,
      };
      await api(`http://localhost:5004/api/admin/flag-replies/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSuccess("Reply/comment updated");
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
      await api(`http://localhost:5004/api/admin/flag-replies/${selectedId}/${action}`, { method: "POST" });
      setSuccess(`Reply/comment ${action}`);
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
      await api(`http://localhost:5004/api/admin/flag-replies/bulk-action`, {
        method: "POST",
        body: JSON.stringify({
          reply_ids: selectedRows,
          status: bulk.status,
          visibility: bulk.visibility,
          moderation_note: bulk.moderation_note.trim() || null,
        }),
      });
      setSuccess("Bulk action applied");
      setSelectedRows([]);
      setBulk(DEFAULT_BULK);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-replies-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Comments / Replies Moderation</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="filters-card card">
        <div className="filters filters-6">
          <input placeholder="Search by handle, author, flag id, reply id, content" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All status</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="hidden">hidden</option>
            <option value="shadowed">shadowed</option>
            <option value="review">review</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="comment">comment</option>
            <option value="poster_reply">poster_reply</option>
            <option value="handle_owner_reply">handle_owner_reply</option>
            <option value="both_sides">both_sides</option>
          </select>
          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
            <option value="all">All visibility</option>
            <option value="public">public</option>
            <option value="hidden">hidden</option>
            <option value="limited">limited</option>
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">All risk</option>
            <option value="risk">Risk only</option>
            <option value="clean">Clean only</option>
          </select>
          <label className="chk inline-check"><input type="checkbox" checked={reportedOnly} onChange={(e) => setReportedOnly(e.target.checked)} /><span>Reported only</span></label>
        </div>
      </div>

      <div className="grid">
        <div className="left-col">
          <div className="card bulk-card">
            <div className="bulk-top">
              <label className="chk master-check">
                <input type="checkbox" checked={filtered.length > 0 && filtered.every((x) => selectedRows.includes(x._id))} onChange={toggleAllVisible} />
                <span>{selectedRows.length} selected</span>
              </label>
              <div className="bulk-actions">
                <select value={bulk.status} onChange={(e) => setBulk((s) => ({ ...s, status: e.target.value }))}>
                  <option value="approved">approve</option>
                  <option value="rejected">reject</option>
                  <option value="hidden">hide</option>
                  <option value="shadowed">shadow</option>
                  <option value="review">send to review</option>
                </select>
                <select value={bulk.visibility} onChange={(e) => setBulk((s) => ({ ...s, visibility: e.target.value }))}>
                  <option value="public">public</option>
                  <option value="hidden">hidden</option>
                  <option value="limited">limited</option>
                </select>
                <button className="btn primary" disabled={!selectedRows.length || saving} onClick={applyBulk}>Apply Bulk</button>
              </div>
            </div>
            <textarea rows={2} placeholder="Bulk moderation note" value={bulk.moderation_note} onChange={(e) => setBulk((s) => ({ ...s, moderation_note: e.target.value }))} />
          </div>

          <div className="card list-card">
            {loading ? (
              <div className="empty">Loading…</div>
            ) : filtered.length ? (
              <div className="list">
                {filtered.map((item) => {
                  const sevTone = scoreTone(item.severity_score);
                  const toxTone = scoreTone(item.toxicity_score);
                  return (
                    <div key={item._id} className={cx("item-row", selectedId === item._id && "sel")}>
                      <label className="row-check">
                        <input type="checkbox" checked={selectedRows.includes(item._id)} onChange={() => toggleRow(item._id)} />
                      </label>
                      <button className="item" onClick={() => select(item)}>
                        <div className="item-top">
                          <span className="type-pill">{item.reply_type || "comment"}</span>
                          <span className="status-pill">{item.status || "pending"}</span>
                          <span className="category-pill">flag {item.flag_id?.slice(-6) || "—"}</span>
                        </div>
                        <div className="title">@{item.handle_username || "unknown"}</div>
                        <div className="sub">by @{item.author_username || "anonymous"} · {timeAgo(item.created_at)}</div>
                        <div className="comment-preview">{item.content || "No content provided."}</div>
                        <div className="metrics-row">
                          <span className={cx("metric-pill", sevTone)}>Severity {item.severity_score ?? "—"}</span>
                          <span className={cx("metric-pill", toxTone)}>Toxicity {item.toxicity_score ?? "—"}</span>
                          <span className="metric-pill neutral">Reports {item.report_count ?? 0}</span>
                          {item.legal_risk ? <span className="metric-pill risk">Legal risk</span> : null}
                          {item.sensitive ? <span className="metric-pill sensitive">Sensitive</span> : null}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty">No comments / replies found</div>
            )}
          </div>
        </div>

        <div className="right-col">
          <form className="card detail-card" onSubmit={saveDetail}>
            <div className="form-head">
              <h3>{selectedId ? "Reply / Comment Detail" : "Select an Item"}</h3>
              {selectedId ? (
                <div className="quick-actions">
                  <button type="button" className="btn success" onClick={() => quickAction("approve")}>Approve</button>
                  <button type="button" className="btn danger" onClick={() => quickAction("reject")}>Reject</button>
                  <button type="button" className="btn" onClick={() => quickAction("hide")}>Hide</button>
                </div>
              ) : null}
            </div>

            {selectedId ? (
              <>
                <div className="meta-strip">
                  <span>ID: {selectedItem?._id}</span>
                  <span>Flag: {selectedItem?.flag_id || "—"}</span>
                  <span>Handle: @{selectedItem?.handle_username || "unknown"}</span>
                  <span>Author: @{selectedItem?.author_username || "anonymous"}</span>
                </div>

                <div className="info-grid">
                  <div className="info-card"><span>Type</span><strong>{selectedItem?.reply_type || "comment"}</strong></div>
                  <div className="info-card"><span>Status</span><strong>{selectedItem?.status || "pending"}</strong></div>
                  <div className="info-card"><span>Reports</span><strong>{selectedItem?.report_count ?? 0}</strong></div>
                  <div className="info-card"><span>Linked Flag Status</span><strong>{selectedItem?.flag_status || "—"}</strong></div>
                  <div className="info-card"><span>Created</span><strong>{timeAgo(selectedItem?.created_at)}</strong></div>
                  <div className="info-card"><span>Updated</span><strong>{timeAgo(selectedItem?.updated_at)}</strong></div>
                </div>

                <label>
                  <span>Reply / Comment Content</span>
                  <textarea rows={5} value={selectedItem?.content || ""} readOnly />
                </label>

                <label>
                  <span>Linked Flag Context</span>
                  <textarea rows={4} value={selectedItem?.flag_comment || selectedItem?.flag_content || ""} readOnly />
                </label>

                <div className="row row-2">
                  <label>
                    <span>Status</span>
                    <select value={detail.status} onChange={(e) => setDetail((s) => ({ ...s, status: e.target.value }))}>
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                      <option value="hidden">hidden</option>
                      <option value="shadowed">shadowed</option>
                      <option value="review">review</option>
                    </select>
                  </label>
                  <label>
                    <span>Visibility</span>
                    <select value={detail.visibility} onChange={(e) => setDetail((s) => ({ ...s, visibility: e.target.value }))}>
                      <option value="public">public</option>
                      <option value="hidden">hidden</option>
                      <option value="limited">limited</option>
                    </select>
                  </label>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Severity Score</span>
                    <input type="number" min="0" max="100" value={detail.severity_score} onChange={(e) => setDetail((s) => ({ ...s, severity_score: e.target.value }))} />
                  </label>
                  <label>
                    <span>Toxicity Score</span>
                    <input type="number" min="0" max="100" value={detail.toxicity_score} onChange={(e) => setDetail((s) => ({ ...s, toxicity_score: e.target.value }))} />
                  </label>
                </div>

                <label>
                  <span>Admin Tags</span>
                  <input value={detail.admin_tags} onChange={(e) => setDetail((s) => ({ ...s, admin_tags: e.target.value }))} placeholder="spam, abusive, escalated" />
                </label>

                <label>
                  <span>Moderation Note</span>
                  <textarea rows={5} value={detail.moderation_note} onChange={(e) => setDetail((s) => ({ ...s, moderation_note: e.target.value }))} placeholder="Internal moderation note" />
                </label>

                <div className="row row-2">
                  <label className="chk"><input type="checkbox" checked={detail.legal_risk} onChange={(e) => setDetail((s) => ({ ...s, legal_risk: e.target.checked }))} /><span>Legal Risk</span></label>
                  <label className="chk"><input type="checkbox" checked={detail.sensitive} onChange={(e) => setDetail((s) => ({ ...s, sensitive: e.target.checked }))} /><span>Sensitive</span></label>
                </div>

                <div className="actions">
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save Moderation"}</button>
                </div>
              </>
            ) : (
              <div className="empty">Select a reply/comment from the left to review and moderate it.</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}
  .left-col,.right-col{display:grid;gap:16px;align-content:start}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .filters-card{margin-bottom:12px}
  .filters{display:grid;gap:8px}.filters-6{grid-template-columns:2fr repeat(4,1fr) auto}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .bulk-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}.bulk-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .master-check,.chk{display:flex;align-items:center;gap:8px}.inline-check{margin-top:8px}
  .list{display:flex;flex-direction:column;gap:10px;max-height:740px;overflow:auto}
  .item-row{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:stretch}.row-check{display:flex;align-items:flex-start;justify-content:center;padding-top:16px}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item-row.sel .item{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.title{font-weight:800}.sub,.comment-preview{font-size:12px;color:#555}.comment-preview{margin-top:6px;line-height:1.5}
  .type-pill,.status-pill,.category-pill,.metric-pill{font-size:11px;padding:4px 8px;border-radius:999px}.type-pill{background:#eef3ff;color:#3355aa}.status-pill{background:#f2f1ec;color:#555}.category-pill{background:#f7f0ff;color:#6b2bbd}
  .metrics-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.metric-pill.good{background:#ecfff5;color:#1a9e5f}.metric-pill.mid{background:#fff7e8;color:#b26a00}.metric-pill.bad{background:#fff0f0;color:#a11}.metric-pill.neutral{background:#f2f1ec;color:#666}.metric-pill.risk{background:#111;color:#fff}.metric-pill.sensitive{background:#f7f0ff;color:#6b2bbd}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:12px}.quick-actions{display:flex;gap:8px;flex-wrap:wrap}
  .meta-strip{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-bottom:10px;background:#faf9f6;border:1px solid #ecebe6;padding:10px;border-radius:10px}
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}.info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:18px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.row{display:grid;gap:10px}.row-2{grid-template-columns:1fr 1fr}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}.btn.primary{background:#000;color:#fff;border-color:#000}.btn.success{background:#ecfff5;color:#1a9e5f;border-color:#cdebdc}.btn.danger,.danger{background:#fff0f0;color:#c62828;border-color:#ffbcbc}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.grid{grid-template-columns:1fr}.filters-6{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}}
`;
