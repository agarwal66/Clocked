import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  // Use the backend API base URL - ensure no double slashes
  const apiUrl = url.startsWith('http') ? url : `http://localhost:5004${url}`;
  
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  console.log('🔗 Watchlist API Request:', apiUrl);
  console.log('🔑 Token exists:', !!adminToken);
  
  try {
    const res = await fetch(apiUrl, {
      headers: { 
        "Content-Type": "application/json",
        ...(adminToken && { "Authorization": `Bearer ${adminToken}` })
      },
      credentials: "include",
      ...options,
    });
    
    console.log('📊 Response Status:', res.status);
    console.log('📊 Response OK:', res.ok);
    
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    
    if (!res.ok) {
      console.log('❌ Watchlist API Error:', data);
      throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error('❌ Watchlist API Request Error:', error.message);
    throw error;
  }
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

function prettyJson(value) {
  try {
    if (!value) return "{}";
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value || "{}");
  }
}

export default function AdminWatchlistPage() {
  const [watchlists, setWatchlists] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  console.log('AdminWatchlistPage component rendering...');

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);

  useEffect(() => {
    console.log('AdminWatchlistPage useEffect running...');
    load();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 1800);
    return () => clearTimeout(t);
  }, [success]);

  async function load() {
    console.log('AdminWatchlistPage load() function called...');
    setLoading(true);
    setError("");
    try {
      console.log('Making API calls...');
      const [watchlistsRes, trendingRes] = await Promise.all([
        api("/api/watchlists/admin"),
        api("/api/watchlists/admin/trending/summary"),
      ]);
      console.log('API responses received:', { watchlistsRes, trendingRes });
      setWatchlists((watchlistsRes.watchlists || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      setTrending((trendingRes.trending || []).sort((a, b) => (b.watchers_count || 0) - (a.watchers_count || 0)));
    } catch (e) {
      console.error('AdminWatchlistPage load() error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const sourceOptions = useMemo(() => [...new Set(watchlists.map((w) => w.source).filter(Boolean))].sort(), [watchlists]);
  const notificationOptions = useMemo(() => {
    const types = new Set();
    watchlists.forEach(w => {
      if (w.notify_new_flag) types.add('new_flag');
      if (w.notify_reply) types.add('reply');
      if (w.notify_report) types.add('report');
    });
    return Array.from(types).sort();
  }, [watchlists]);

  const filtered = useMemo(() => {
    return watchlists.filter((watchlist) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || watchlist._id?.toLowerCase().includes(s)
        || watchlist.user_id?.toLowerCase().includes(s)
        || watchlist.handle_id?.toLowerCase().includes(s)
        || String(watchlist.user_id || "").toLowerCase().includes(s)
        || String(watchlist.handle_id || "").toLowerCase().includes(s);
      const okSource = sourceFilter === "all" || watchlist.source === sourceFilter;
      const okStatus = statusFilter === "all" || 
        (statusFilter === "active" && watchlist.active) ||
        (statusFilter === "inactive" && !watchlist.active) ||
        (statusFilter === "muted" && watchlist.muted) ||
        (statusFilter === "unmuted" && !watchlist.muted);
      const okNotification = notificationFilter === "all" || 
        (notificationFilter === 'new_flag' && watchlist.notify_new_flag) ||
        (notificationFilter === 'reply' && watchlist.notify_reply) ||
        (notificationFilter === 'report' && watchlist.notify_report);
      return okSearch && okSource && okStatus && okNotification;
    });
  }, [watchlists, search, sourceFilter, statusFilter, notificationFilter]);

  const metrics = useMemo(() => {
    const total = watchlists.length;
    const active = watchlists.filter(w => w.active).length;
    const muted = watchlists.filter(w => w.muted).length;
    const notifyNewFlag = watchlists.filter(w => w.notify_new_flag).length;
    const notifyReply = watchlists.filter(w => w.notify_reply).length;
    const notifyReport = watchlists.filter(w => w.notify_report).length;
    return { total, active, muted, notifyNewFlag, notifyReply, notifyReport };
  }, [watchlists]);

  function select(watchlist) {
    setSelectedId(watchlist._id);
    setSelectedWatchlist(watchlist);
  }

  async function updateWatchlist(id, updates) {
    try {
      await api(`/api/watchlists/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      setSuccess("Watchlist updated successfully");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteWatchlist(id) {
    const shouldDelete = window.confirm("Are you sure you want to delete this watchlist entry?");
    if (!shouldDelete) return;
    
    try {
      await api(`/api/watchlists/admin/${id}`, { method: "DELETE" });
      setSuccess("Watchlist deleted successfully");
      await load();
      setSelectedId(null);
      setSelectedWatchlist(null);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="admin-watchlist-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Watchlist Management</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="metrics-grid">
        <div className="metric-card"><span>Total Watchlists</span><strong>{metrics.total}</strong></div>
        <div className="metric-card"><span>Active</span><strong>{metrics.active}</strong></div>
        <div className="metric-card"><span>Muted</span><strong>{metrics.muted}</strong></div>
        <div className="metric-card"><span>Flag Notifications</span><strong>{metrics.notifyNewFlag}</strong></div>
        <div className="metric-card"><span>Reply Notifications</span><strong>{metrics.notifyReply}</strong></div>
      </div>

      <div className="top-grid">
        <div className="card filters-card">
          <div className="filters filters-4">
            <input placeholder="Search by user ID, handle ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="all">All sources</option>
              {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="muted">Muted</option>
              <option value="unmuted">Unmuted</option>
            </select>
            <select value={notificationFilter} onChange={(e) => setNotificationFilter(e.target.value)}>
              <option value="all">All notifications</option>
              <option value="new_flag">New Flag</option>
              <option value="reply">Reply</option>
              <option value="report">Report</option>
            </select>
          </div>
        </div>

        <div className="card trending-card">
          <div className="card-head"><h3>Trending Handles</h3></div>
          {loading ? (
            <div className="empty">Loading…</div>
          ) : trending.length ? (
            <div className="trending-list">
              {trending.slice(0, 8).map((item, idx) => (
                <div key={item._id} className="trend-item">
                  <div>
                    <div className="trend-title">Handle {item._id}</div>
                    <div className="trend-sub">{item.muted_count} muted</div>
                  </div>
                  <span className="trend-count">{item.watchers_count || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No trending data</div>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="left-col card">
          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((watchlist) => (
                <button key={watchlist._id} className={cx("item", selectedId === watchlist._id && "sel")} onClick={() => select(watchlist)}>
                  <div className="item-top">
                    <span className={cx("source-pill", watchlist.source)}>{watchlist.source || "manual"}</span>
                    <span className={cx("status-pill", watchlist.active ? "active" : "inactive")}>{watchlist.active ? "active" : "inactive"}</span>
                    {watchlist.muted && <span className="muted-pill">muted</span>}
                  </div>
                  <div className="title">User: {watchlist.user_id}</div>
                  <div className="sub">Handle: {watchlist.handle_id} · {timeAgo(watchlist.created_at)}</div>
                  <div className="notification-row">
                    <span className={cx("notif-badge", watchlist.notify_new_flag && "active")}>Flag</span>
                    <span className={cx("notif-badge", watchlist.notify_reply && "active")}>Reply</span>
                    <span className={cx("notif-badge", watchlist.notify_report && "active")}>Report</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No watchlist entries found</div>
          )}
        </div>

        <div className="right-col card">
          <div className="form-head">
            <h3>{selectedWatchlist ? "Watchlist Detail" : "Select a Watchlist Entry"}</h3>
            {selectedWatchlist ? (
              <div className="head-actions">
                <button className="btn" onClick={() => deleteWatchlist(selectedWatchlist._id)}>Delete</button>
              </div>
            ) : null}
          </div>

          {selectedWatchlist ? (
            <>
              <div className="info-grid">
                <div className="info-card"><span>User ID</span><strong>{selectedWatchlist.user_id || "—"}</strong></div>
                <div className="info-card"><span>Handle ID</span><strong>{selectedWatchlist.handle_id || "—"}</strong></div>
                <div className="info-card"><span>Source</span><strong>{selectedWatchlist.source || "—"}</strong></div>
                <div className="info-card"><span>Created</span><strong>{formatDate(selectedWatchlist.created_at)}</strong></div>
                <div className="info-card"><span>Updated</span><strong>{formatDate(selectedWatchlist.updated_at)}</strong></div>
                <div className="info-card"><span>Status</span><strong>{selectedWatchlist.active ? "Active" : "Inactive"}</strong></div>
              </div>

              <label>
                <span>Watchlist ID</span>
                <input value={selectedWatchlist._id || ""} readOnly />
              </label>

              <div className="preferences-section">
                <h4>Notification Preferences</h4>
                <div className="preference-grid">
                  <label className="chk">
                    <input 
                      type="checkbox" 
                      checked={selectedWatchlist.notify_new_flag}
                      onChange={(e) => updateWatchlist(selectedWatchlist._id, { notify_new_flag: e.target.checked })}
                    />
                    <span>New Flag Notifications</span>
                  </label>
                  <label className="chk">
                    <input 
                      type="checkbox" 
                      checked={selectedWatchlist.notify_reply}
                      onChange={(e) => updateWatchlist(selectedWatchlist._id, { notify_reply: e.target.checked })}
                    />
                    <span>Reply Notifications</span>
                  </label>
                  <label className="chk">
                    <input 
                      type="checkbox" 
                      checked={selectedWatchlist.notify_report}
                      onChange={(e) => updateWatchlist(selectedWatchlist._id, { notify_report: e.target.checked })}
                    />
                    <span>Report Notifications</span>
                  </label>
                </div>
              </div>

              <div className="status-section">
                <h4>Status Controls</h4>
                <div className="status-grid">
                  <label className="chk">
                    <input 
                      type="checkbox" 
                      checked={selectedWatchlist.active}
                      onChange={(e) => updateWatchlist(selectedWatchlist._id, { active: e.target.checked })}
                    />
                    <span>Active</span>
                  </label>
                  <label className="chk">
                    <input 
                      type="checkbox" 
                      checked={selectedWatchlist.muted}
                      onChange={(e) => updateWatchlist(selectedWatchlist._id, { muted: e.target.checked })}
                    />
                    <span>Muted</span>
                  </label>
                </div>
              </div>

              <label>
                <span>Raw Data</span>
                <textarea className="code" rows={10} value={prettyJson(selectedWatchlist)} readOnly spellCheck={false} />
              </label>
            </>
          ) : (
            <div className="empty">Select a watchlist entry from the left to inspect and edit details.</div>
          )}
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
  .top-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:16px;margin-bottom:12px}
  .filters{display:grid;gap:8px}.filters-4{grid-template-columns:2fr 1fr 1fr 1fr}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .card-head{margin-bottom:8px}.card-head h3,.form-head h3{margin:0}
  .trending-list{display:flex;flex-direction:column;gap:10px;max-height:220px;overflow:auto}
  .trend-item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:10px}
  .trend-title{font-weight:800}.trend-sub{font-size:12px;color:#666}.trend-count{font-size:13px;font-weight:800;background:#eef3ff;color:#3355aa;padding:4px 8px;border-radius:999px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .list{display:flex;flex-direction:column;gap:10px;max-height:760px;overflow:auto}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.title{font-weight:800}.sub{font-size:12px;color:#555}.notification-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .source-pill,.status-pill,.muted-pill,.notif-badge{font-size:11px;padding:4px 8px;border-radius:999px}
  .source-pill.manual{background:#eef3ff;color:#3355aa}.source-pill.auto{background:#ecfff5;color:#1a9e5f}.source-pill.suggested{background:#fff8e1;color:#f57c00}.source-pill.admin{background:#f3e5f5;color:#7b1fa2}
  .status-pill.active{background:#ecfff5;color:#1a9e5f}.status-pill.inactive{background:#fff0f0;color:#a11}.muted-pill{background:#fff3e0;color:#e65100}
  .notif-badge{background:#f5f5f5;color:#666}.notif-badge.active{background:#e8f5e8;color:#2e7d32}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.head-actions{display:flex;gap:8px}
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}
  .info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:15px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.chk{display:flex;align-items:center;gap:8px}
  .preferences-section,.status-section{margin-bottom:20px}.preferences-section h4,.status-section h4{margin:0 0 10px 0;color:#333}
  .preference-grid,.status-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.metrics-grid{grid-template-columns:1fr 1fr}.top-grid,.grid{grid-template-columns:1fr}.filters-4{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}.preference-grid,.status-grid{grid-template-columns:1fr}}
`;
