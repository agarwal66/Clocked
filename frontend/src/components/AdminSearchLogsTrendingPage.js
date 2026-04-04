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

function prettyJson(value) {
  try {
    if (!value) return "{}";
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value || "{}");
  }
}

export default function AdminSearchLogsTrendingPage() {
  const [logs, setLogs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [handleFilter, setHandleFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

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
      const [logsRes, trendingRes] = await Promise.all([
        api("/api/admin/search-logs"),
        api("/api/admin/search-logs/trending"),
      ]);
      setLogs((logsRes.logs || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      setTrending((trendingRes.trending || []).sort((a, b) => (b.search_count || 0) - (a.search_count || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const reasonOptions = useMemo(() => [...new Set(logs.map((l) => l.reason).filter(Boolean))].sort(), [logs]);
  const sourceOptions = useMemo(() => [...new Set(logs.map((l) => l.source).filter(Boolean))].sort(), [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || log._id?.toLowerCase().includes(s)
        || log.searched_handle?.toLowerCase().includes(s)
        || log.reason?.toLowerCase().includes(s)
        || log.source?.toLowerCase().includes(s)
        || log.username?.toLowerCase().includes(s)
        || log.email?.toLowerCase().includes(s)
        || String(log.user_id || "").toLowerCase().includes(s)
        || String(log.handle_id || "").toLowerCase().includes(s);
      const okReason = reasonFilter === "all" || log.reason === reasonFilter;
      const okSource = sourceFilter === "all" || log.source === sourceFilter;
      const okUser = !userFilter.trim() || log.username?.toLowerCase().includes(userFilter.toLowerCase()) || log.email?.toLowerCase().includes(userFilter.toLowerCase()) || String(log.user_id || "").toLowerCase().includes(userFilter.toLowerCase());
      const okHandle = !handleFilter.trim() || log.searched_handle?.toLowerCase().includes(handleFilter.toLowerCase()) || log.handle_username?.toLowerCase().includes(handleFilter.toLowerCase()) || String(log.handle_id || "").toLowerCase().includes(handleFilter.toLowerCase());
      return okSearch && okReason && okSource && okUser && okHandle;
    });
  }, [logs, search, reasonFilter, sourceFilter, userFilter, handleFilter]);

  const metrics = useMemo(() => {
    const total = logs.length;
    const uniqueHandles = new Set(logs.map((l) => l.searched_handle || l.handle_id).filter(Boolean)).size;
    const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size;
    const today = new Date();
    const sameDay = (d) => {
      const x = new Date(d);
      return x.getFullYear() === today.getFullYear() && x.getMonth() === today.getMonth() && x.getDate() === today.getDate();
    };
    const todayCount = logs.filter((l) => l.created_at && sameDay(l.created_at)).length;
    const topReason = Object.entries(logs.reduce((acc, l) => {
      const k = l.reason || "unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, uniqueHandles, uniqueUsers, todayCount, topReason };
  }, [logs]);

  function select(log) {
    setSelectedId(log._id);
    setSelectedLog(log);
  }

  return (
    <div className="admin-search-logs-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Search Logs / Trending</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="metrics-grid">
        <div className="metric-card"><span>Total Searches</span><strong>{metrics.total}</strong></div>
        <div className="metric-card"><span>Unique Handles</span><strong>{metrics.uniqueHandles}</strong></div>
        <div className="metric-card"><span>Unique Users</span><strong>{metrics.uniqueUsers}</strong></div>
        <div className="metric-card"><span>Today</span><strong>{metrics.todayCount}</strong></div>
        <div className="metric-card"><span>Top Reason</span><strong>{metrics.topReason}</strong></div>
      </div>

      <div className="top-grid">
        <div className="card filters-card">
          <div className="filters filters-5">
            <input placeholder="Search by id, handle, user, reason, source" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}>
              <option value="all">All reasons</option>
              {reasonOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="all">All sources</option>
              {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Filter by user" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
            <input placeholder="Filter by handle" value={handleFilter} onChange={(e) => setHandleFilter(e.target.value)} />
          </div>
        </div>

        <div className="card trending-card">
          <div className="card-head"><h3>Trending Handles</h3></div>
          {loading ? (
            <div className="empty">Loading…</div>
          ) : trending.length ? (
            <div className="trending-list">
              {trending.slice(0, 12).map((item, idx) => (
                <div key={`${item.handle_id || item.searched_handle}-${idx}`} className="trend-item">
                  <div>
                    <div className="trend-title">@{item.searched_handle || item.handle_username || "unknown"}</div>
                    <div className="trend-sub">{item.reason ? `Top reason: ${item.reason}` : ""}</div>
                  </div>
                  <span className="trend-count">{item.search_count || 0}</span>
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
              {filtered.map((log) => (
                <button key={log._id} className={cx("item", selectedId === log._id && "sel")} onClick={() => select(log)}>
                  <div className="item-top">
                    <span className="reason-pill">{log.reason || "unknown"}</span>
                    <span className="source-pill">{log.source || "search"}</span>
                  </div>
                  <div className="title">@{log.searched_handle || log.handle_username || "unknown"}</div>
                  <div className="sub">{log.username ? `@${log.username}` : (log.email || log.user_id || "anonymous")} · {timeAgo(log.created_at)}</div>
                  <div className="meta-row">
                    <span>Handle ID: {log.handle_id || "—"}</span>
                    <span>User ID: {log.user_id || "—"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No search logs found</div>
          )}
        </div>

        <div className="right-col card">
          <div className="form-head">
            <h3>{selectedLog ? "Search Detail" : "Select a Search Log"}</h3>
          </div>

          {selectedLog ? (
            <>
              <div className="info-grid">
                <div className="info-card"><span>Searched Handle</span><strong>@{selectedLog.searched_handle || selectedLog.handle_username || "—"}</strong></div>
                <div className="info-card"><span>Reason</span><strong>{selectedLog.reason || "—"}</strong></div>
                <div className="info-card"><span>Source</span><strong>{selectedLog.source || "search"}</strong></div>
                <div className="info-card"><span>Created</span><strong>{formatDate(selectedLog.created_at)}</strong></div>
                <div className="info-card"><span>User</span><strong>{selectedLog.username ? `@${selectedLog.username}` : (selectedLog.email || selectedLog.user_id || "—")}</strong></div>
                <div className="info-card"><span>Handle ID</span><strong>{selectedLog.handle_id || "—"}</strong></div>
              </div>

              <label>
                <span>Search ID</span>
                <input value={selectedLog._id || ""} readOnly />
              </label>

              <div className="row row-2">
                <label>
                  <span>User ID</span>
                  <input value={selectedLog.user_id || ""} readOnly />
                </label>
                <label>
                  <span>Handle ID</span>
                  <input value={selectedLog.handle_id || ""} readOnly />
                </label>
              </div>

              <div className="row row-2">
                <label>
                  <span>Username / Email</span>
                  <input value={`${selectedLog.username ? `@${selectedLog.username}` : ""}${selectedLog.email ? ` ${selectedLog.email}` : ""}`.trim() || "—"} readOnly />
                </label>
                <label>
                  <span>Matched Handle Username</span>
                  <input value={selectedLog.handle_username || "—"} readOnly />
                </label>
              </div>

              <label>
                <span>Raw Payload</span>
                <textarea className="code" rows={10} value={prettyJson(selectedLog)} readOnly spellCheck={false} />
              </label>
            </>
          ) : (
            <div className="empty">Select a search log from the left to inspect details.</div>
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
  .filters{display:grid;gap:8px}.filters-5{grid-template-columns:2fr 1fr 1fr 1fr 1fr}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .card-head{margin-bottom:8px}.card-head h3,.form-head h3{margin:0}
  .trending-list{display:flex;flex-direction:column;gap:10px;max-height:220px;overflow:auto}
  .trend-item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:10px}
  .trend-title{font-weight:800}.trend-sub{font-size:12px;color:#666}.trend-count{font-size:13px;font-weight:800;background:#eef3ff;color:#3355aa;padding:4px 8px;border-radius:999px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .list{display:flex;flex-direction:column;gap:10px;max-height:760px;overflow:auto}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.title{font-weight:800}.sub{font-size:12px;color:#555}.meta-row{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-top:8px}
  .reason-pill,.source-pill{font-size:11px;padding:4px 8px;border-radius:999px}.reason-pill{background:#f7f0ff;color:#6b2bbd}.source-pill{background:#eef3ff;color:#3355aa}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}
  .info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:15px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.row{display:grid;gap:10px}.row-2{grid-template-columns:1fr 1fr}.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.metrics-grid{grid-template-columns:1fr 1fr}.top-grid,.grid{grid-template-columns:1fr}.filters-5{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}}
`;
