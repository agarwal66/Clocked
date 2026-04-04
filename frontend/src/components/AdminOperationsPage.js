import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  const res = await fetch(url, {
    headers: { 
      "Content-Type": "application/json",
      ...(adminToken && { "Authorization": `Bearer ${adminToken}` })
    },
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

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
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

const TABS = [
  { key: "users", label: "Users" },
  { key: "handles", label: "Handles" },
  { key: "flags", label: "Flags" },
  { key: "replies", label: "Replies" },
  { key: "reports", label: "Reports" },
];

export default function AdminOperationsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers] = useState([]);
  const [handles, setHandles] = useState([]);
  const [flags, setFlags] = useState([]);
  const [replies, setReplies] = useState([]);
  const [reports, setReports] = useState([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 1800);
    return () => clearTimeout(t);
  }, [success]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [usersRes, handlesRes, flagsRes, repliesRes, reportsRes] = await Promise.all([
        api("/api/admin/users"),
        api("/api/admin/handles"),
        api("/api/admin/flags"),
        api("/api/admin/flag-replies"),
        api("/api/admin/reports"),
      ]);
      setUsers(usersRes.users || []);
      setHandles(handlesRes.handles || []);
      setFlags(flagsRes.flags || []);
      setReplies(repliesRes.replies || []);
      setReports(reportsRes.reports || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function resetSelection() {
    setSelectedId(null);
    setSelectedItem(null);
  }

  function onTabChange(tab) {
    setActiveTab(tab);
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    resetSelection();
  }

  const metrics = useMemo(() => ({
    users: users.length,
    handles: handles.length,
    flags: flags.length,
    replies: replies.length,
    reports: reports.length,
  }), [users, handles, flags, replies, reports]);

  const currentList = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (activeTab === "users") {
      return users.filter((x) => {
        const okQ = !q || x.username?.toLowerCase().includes(q) || x.email?.toLowerCase().includes(q) || String(x._id).toLowerCase().includes(q);
        const okStatus = statusFilter === "all" || (statusFilter === "active" && x.active !== false) || (statusFilter === "inactive" && x.active === false);
        return okQ && okStatus;
      });
    }

    if (activeTab === "handles") {
      return handles.filter((x) => {
        const okQ = !q || x.instagram_handle?.toLowerCase().includes(q) || x.city?.toLowerCase().includes(q) || String(x._id).toLowerCase().includes(q);
        const okStatus = statusFilter === "all" || (statusFilter === "active" && x.active !== false) || (statusFilter === "inactive" && x.active === false);
        return okQ && okStatus;
      });
    }

    if (activeTab === "flags") {
      return flags.filter((x) => {
        const okQ = !q || x.comment?.toLowerCase().includes(q) || x.handle_username?.toLowerCase().includes(q) || x.posted_by_username?.toLowerCase().includes(q) || String(x._id).toLowerCase().includes(q);
        const okStatus = statusFilter === "all" || (x.status || "pending") === statusFilter;
        const okType = typeFilter === "all" || x.flag_type === typeFilter;
        return okQ && okStatus && okType;
      });
    }

    if (activeTab === "replies") {
      return replies.filter((x) => {
        const okQ = !q || x.content?.toLowerCase().includes(q) || x.handle_username?.toLowerCase().includes(q) || x.author_username?.toLowerCase().includes(q) || String(x._id).toLowerCase().includes(q);
        const okStatus = statusFilter === "all" || (x.status || "pending") === statusFilter;
        const okType = typeFilter === "all" || (x.reply_type || "comment") === typeFilter;
        return okQ && okStatus && okType;
      });
    }

    return reports.filter((x) => {
      const okQ = !q || x.description?.toLowerCase().includes(q) || x.reason?.toLowerCase().includes(q) || x.reporter_username?.toLowerCase().includes(q) || x.target_username?.toLowerCase().includes(q) || String(x._id).toLowerCase().includes(q);
      const okStatus = statusFilter === "all" || (x.status || "open") === statusFilter;
      const okType = typeFilter === "all" || x.entity_type === typeFilter;
      return okQ && okStatus && okType;
    });
  }, [activeTab, users, handles, flags, replies, reports, query, statusFilter, typeFilter]);

  function select(item) {
    setSelectedId(item._id);
    setSelectedItem(item);
  }

  async function quickAction(action) {
    if (!selectedItem?._id) return;
    setSaving(true);
    setError("");
    try {
      let url = "";
      let method = "POST";
      let body;

      if (activeTab === "users") {
        url = `/api/admin/users/${selectedItem._id}/status`;
        method = "PATCH";
        body = JSON.stringify({ active: action === "activate" });
      } else if (activeTab === "handles") {
        url = `/api/admin/handles/${selectedItem._id}/status`;
        method = "PATCH";
        body = JSON.stringify({ active: action === "activate" });
      } else if (activeTab === "flags") {
        url = `/api/admin/flags/${selectedItem._id}/${action}`;
      } else if (activeTab === "replies") {
        url = `/api/admin/flag-replies/${selectedItem._id}/${action}`;
      } else if (activeTab === "reports") {
        url = `/api/admin/reports/${selectedItem._id}/${action}`;
      }

      await api(url, { method, body });
      setSuccess(`${activeTab.slice(0, -1)} ${action}d`.replace("replys", "replys"));
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = useMemo(() => {
    if (activeTab === "flags") return ["all", "red", "green"];
    if (activeTab === "replies") return ["all", "comment", "poster_reply", "handle_owner_reply", "both_sides"];
    if (activeTab === "reports") return ["all", "flag", "reply", "handle", "user"];
    return ["all"];
  }, [activeTab]);

  const statusOptions = useMemo(() => {
    if (activeTab === "users" || activeTab === "handles") return ["all", "active", "inactive"];
    if (activeTab === "flags") return ["all", "pending", "approved", "rejected", "shadowed", "review"];
    if (activeTab === "replies") return ["all", "pending", "approved", "rejected", "hidden", "shadowed", "review"];
    return ["all", "open", "investigating", "resolved", "dismissed", "escalated"];
  }, [activeTab]);

  return (
    <div className="admin-operations-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Operations</h2>
        <button className="btn" onClick={loadAll}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="metrics-grid">
        <div className="metric-card"><span>Users</span><strong>{metrics.users}</strong></div>
        <div className="metric-card"><span>Handles</span><strong>{metrics.handles}</strong></div>
        <div className="metric-card"><span>Flags</span><strong>{metrics.flags}</strong></div>
        <div className="metric-card"><span>Replies</span><strong>{metrics.replies}</strong></div>
        <div className="metric-card"><span>Reports</span><strong>{metrics.reports}</strong></div>
      </div>

      <div className="tabs-row">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={cx("tab-btn", activeTab === tab.key && "active")}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filters-card">
        <input placeholder={`Search ${activeTab}`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {typeOptions.length > 1 ? (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : null}
      </div>

      <div className="grid">
        <div className="left-col card">
          {loading ? <div className="empty">Loading…</div> : currentList.length ? (
            <div className="list">
              {currentList.map((item) => (
                <button key={item._id} className={cx("item", selectedId === item._id && "sel")} onClick={() => select(item)}>
                  {activeTab === "users" && (
                    <>
                      <div className="title">@{item.username || "unknown"}</div>
                      <div className="sub">{item.email || "—"}</div>
                      <div className="meta-row"><span>{item.active !== false ? "Active" : "Inactive"}</span></div>
                    </>
                  )}
                  {activeTab === "handles" && (
                    <>
                      <div className="title">@{item.instagram_handle || item.handle_username || "unknown"}</div>
                      <div className="sub">{item.city || "No city"}</div>
                      <div className="meta-row"><span>{item.active !== false ? "Active" : "Inactive"}</span><span>{item.total_flag_count || item.stats?.total_flag_count || 0} flags</span></div>
                    </>
                  )}
                  {activeTab === "flags" && (
                    <>
                      <div className="title">@{item.handle_username || "unknown"}</div>
                      <div className="sub">{item.comment || "No comment"}</div>
                      <div className="meta-row"><span>{item.flag_type || "—"}</span><span>{item.status || "pending"}</span></div>
                    </>
                  )}
                  {activeTab === "replies" && (
                    <>
                      <div className="title">@{item.handle_username || "unknown"}</div>
                      <div className="sub">{item.content || "No content"}</div>
                      <div className="meta-row"><span>{item.reply_type || "comment"}</span><span>{item.status || "pending"}</span></div>
                    </>
                  )}
                  {activeTab === "reports" && (
                    <>
                      <div className="title">{item.reason || "other"}</div>
                      <div className="sub">{item.description || "No description"}</div>
                      <div className="meta-row"><span>{item.entity_type || "—"}</span><span>{item.status || "open"}</span></div>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : <div className="empty">No records found</div>}
        </div>

        <div className="right-col card">
          <div className="detail-head">
            <h3>{selectedItem ? `${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)} Detail` : "Select an Item"}</h3>
            {selectedItem ? (
              <div className="head-actions">
                {activeTab === "users" && (
                  <button className="btn" disabled={saving} onClick={() => quickAction(selectedItem.active !== false ? "deactivate" : "activate")}>
                    {selectedItem.active !== false ? "Deactivate" : "Activate"}
                  </button>
                )}
                {activeTab === "handles" && (
                  <button className="btn" disabled={saving} onClick={() => quickAction(selectedItem.active !== false ? "deactivate" : "activate")}>
                    {selectedItem.active !== false ? "Deactivate" : "Activate"}
                  </button>
                )}
                {activeTab === "flags" && (
                  <>
                    <button className="btn success" disabled={saving} onClick={() => quickAction("approve")}>Approve</button>
                    <button className="btn danger" disabled={saving} onClick={() => quickAction("reject")}>Reject</button>
                  </>
                )}
                {activeTab === "replies" && (
                  <>
                    <button className="btn success" disabled={saving} onClick={() => quickAction("approve")}>Approve</button>
                    <button className="btn danger" disabled={saving} onClick={() => quickAction("reject")}>Reject</button>
                    <button className="btn" disabled={saving} onClick={() => quickAction("hide")}>Hide</button>
                  </>
                )}
                {activeTab === "reports" && (
                  <>
                    <button className="btn" disabled={saving} onClick={() => quickAction("investigate")}>Investigate</button>
                    <button className="btn success" disabled={saving} onClick={() => quickAction("resolve")}>Resolve</button>
                    <button className="btn danger" disabled={saving} onClick={() => quickAction("dismiss")}>Dismiss</button>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {selectedItem ? (
            <div className="detail-body">
              <div className="info-grid">
                <div className="info-card"><span>ID</span><strong>{selectedItem._id}</strong></div>
                <div className="info-card"><span>Status</span><strong>{selectedItem.status || (selectedItem.active !== false ? "active" : "inactive")}</strong></div>
                <div className="info-card"><span>Created</span><strong>{formatDate(selectedItem.created_at)}</strong></div>
              </div>

              {activeTab === "users" && (
                <>
                  <label><span>Username</span><input readOnly value={selectedItem.username || ""} /></label>
                  <label><span>Email</span><input readOnly value={selectedItem.email || ""} /></label>
                  <div className="info-grid">
                    <div className="info-card"><span>Flags Posted</span><strong>{selectedItem.flags_posted_count ?? selectedItem.stats?.flags_posted_count ?? 0}</strong></div>
                    <div className="info-card"><span>Flags On Me</span><strong>{selectedItem.flags_on_me_count ?? selectedItem.stats?.flags_on_me_count ?? 0}</strong></div>
                    <div className="info-card"><span>Last Seen</span><strong>{selectedItem.last_seen_at ? timeAgo(selectedItem.last_seen_at) : "—"}</strong></div>
                  </div>
                </>
              )}

              {activeTab === "handles" && (
                <>
                  <label><span>Handle</span><input readOnly value={selectedItem.instagram_handle || selectedItem.handle_username || ""} /></label>
                  <label><span>City</span><input readOnly value={selectedItem.city || ""} /></label>
                  <label><span>Misunderstood</span><textarea readOnly rows={3} value={selectedItem.me_misunderstood || ""}></textarea></label>
                  <label><span>Pride</span><textarea readOnly rows={3} value={selectedItem.me_pride || ""}></textarea></label>
                </>
              )}

              {activeTab === "flags" && (
                <>
                  <label><span>Handle</span><input readOnly value={selectedItem.handle_username || ""} /></label>
                  <label><span>Poster</span><input readOnly value={selectedItem.posted_by_username || ""} /></label>
                  <label><span>Comment</span><textarea readOnly rows={6} value={selectedItem.comment || ""}></textarea></label>
                </>
              )}

              {activeTab === "replies" && (
                <>
                  <label><span>Handle</span><input readOnly value={selectedItem.handle_username || ""} /></label>
                  <label><span>Author</span><input readOnly value={selectedItem.author_username || ""} /></label>
                  <label><span>Content</span><textarea readOnly rows={6} value={selectedItem.content || ""}></textarea></label>
                  <label><span>Flag Context</span><textarea readOnly rows={4} value={selectedItem.flag_comment || selectedItem.flag_content || ""}></textarea></label>
                </>
              )}

              {activeTab === "reports" && (
                <>
                  <label><span>Reason</span><input readOnly value={selectedItem.reason || ""} /></label>
                  <label><span>Reporter</span><input readOnly value={selectedItem.reporter_username || ""} /></label>
                  <label><span>Description</span><textarea readOnly rows={6} value={selectedItem.description || ""}></textarea></label>
                  <label><span>Linked Content</span><textarea readOnly rows={4} value={selectedItem.linked_content_preview || selectedItem.flag_comment || selectedItem.reply_content || ""}></textarea></label>
                </>
              )}
            </div>
          ) : <div className="empty">Select an item from the left.</div>}
        </div>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .metrics-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:12px}
  .metric-card,.card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .metric-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.metric-card strong{font-size:22px}
  .tabs-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.tab-btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:999px;padding:8px 14px;cursor:pointer}.tab-btn.active{background:#000;color:#fff;border-color:#000}
  .filters-card{display:flex;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px;margin-bottom:12px} input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px} .filters-card input{flex:1;min-width:260px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.list{display:flex;flex-direction:column;gap:10px;max-height:780px;overflow:auto}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .title{font-weight:800}.sub{font-size:12px;color:#555;margin-top:4px}.meta-row{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-top:8px}
  .detail-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.detail-head h3{margin:0}.head-actions{display:flex;gap:8px;flex-wrap:wrap}
  .detail-body{display:flex;flex-direction:column;gap:10px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:14px;word-break:break-word}
  label{display:flex;flex-direction:column;gap:6px}.btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}.btn.success{background:#ecfff5;color:#1a9e5f;border-color:#cdebdc}.btn.danger{background:#fff0f0;color:#a11;border-color:#ffbcbc}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.metrics-grid{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}}
`;
