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
  { key: "notifications", label: "Notifications" },
  { key: "search", label: "Search Logs" },
  { key: "watchlists", label: "Watchlists" },
  { key: "trending", label: "Trending" },
];

function prettyJson(value) {
  try {
    if (!value) return "{}";
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value || "{}");
  }
}

export default function AdminActivityPage() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [logs, setLogs] = useState([]);
  const [searchLogs, setSearchLogs] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [watchTrending, setWatchTrending] = useState([]);

  const [query, setQuery] = useState("");
  const [filterA, setFilterA] = useState("all");
  const [filterB, setFilterB] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      const [logsRes, searchRes, searchTrendingRes, watchRes, watchTrendingRes] = await Promise.all([
        api("/api/notifications/admin/log"),
        api("/api/admin/search-logs"),
        api("/api/admin/search-logs/trending"),
        api("/api/watchlists/admin"),
        api("/api/watchlists/admin/trending/summary"),
      ]);

      setLogs(logsRes.logs || []);
      setSearchLogs(searchRes.logs || []);
      setTrendingSearches(searchTrendingRes.trending || []);
      setWatchlists(watchRes.watchlists || []);
      setWatchTrending(watchTrendingRes.trending || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setQuery("");
    setFilterA("all");
    setFilterB("all");
    setSelectedId(null);
    setSelectedItem(null);
  }

  const metrics = useMemo(() => ({
    notifications: logs.length,
    unreadNotifications: logs.filter((x) => x.channel === "in_app" && !x.read_at).length,
    searches: searchLogs.length,
    uniqueSearchedHandles: new Set(searchLogs.map((x) => x.searched_handle || x.handle_id).filter(Boolean)).size,
    watchlists: watchlists.length,
    mutedWatchlists: watchlists.filter((x) => x.muted).length,
  }), [logs, searchLogs, watchlists]);

  const currentList = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (activeTab === "notifications") {
      return logs.filter((x) => {
        const okQ = !q || x.type?.toLowerCase().includes(q) || x.title?.toLowerCase().includes(q) || x.body?.toLowerCase().includes(q) || x.username?.toLowerCase().includes(q) || x.handle_username?.toLowerCase().includes(q);
        const okChannel = filterA === "all" || x.channel === filterA;
        const okStatus = filterB === "all" || x.delivery_status === filterB;
        return okQ && okChannel && okStatus;
      });
    }

    if (activeTab === "search") {
      return searchLogs.filter((x) => {
        const okQ = !q || x.searched_handle?.toLowerCase().includes(q) || x.username?.toLowerCase().includes(q) || x.reason?.toLowerCase().includes(q) || x.source?.toLowerCase().includes(q);
        const okReason = filterA === "all" || x.reason === filterA;
        const okSource = filterB === "all" || x.source === filterB;
        return okQ && okReason && okSource;
      });
    }

    if (activeTab === "watchlists") {
      return watchlists.filter((x) => {
        const okQ = !q || x.username?.toLowerCase().includes(q) || x.email?.toLowerCase().includes(q) || x.handle_username?.toLowerCase().includes(q) || x.source?.toLowerCase().includes(q);
        const okStatus = filterA === "all" || (filterA === "active" && x.active !== false) || (filterA === "inactive" && x.active === false);
        const okMute = filterB === "all" || (filterB === "muted" && x.muted) || (filterB === "unmuted" && !x.muted);
        return okQ && okStatus && okMute;
      });
    }

    return trendingSearches.filter((x) => {
      const okQ = !q || String(x.searched_handle || x.handle_username || "").toLowerCase().includes(q);
      return okQ;
    });
  }, [activeTab, logs, searchLogs, watchlists, trendingSearches, query, filterA, filterB]);

  function select(item) {
    setSelectedId(item._id || item.handle_id || item.searched_handle);
    setSelectedItem(item);
  }

  async function markRead() {
    if (!selectedItem?._id) return;
    setActionLoading(true);
    setError("");
    try {
      await api(`/api/notifications/admin/log/${selectedItem._id}/mark-read`, { method: "POST" });
      setSuccess("Notification marked read");
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function retryPush() {
    if (!selectedItem?._id) return;
    setActionLoading(true);
    setError("");
    try {
      await api(`/api/notifications/admin/log/${selectedItem._id}/retry`, { method: "POST" });
      setSuccess("Retry triggered");
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function updateWatchlist(patch) {
    if (!selectedItem?._id) return;
    setActionLoading(true);
    setError("");
    try {
      await api(`/api/watchlists/admin/${selectedItem._id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setSuccess("Watchlist updated");
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const filterOptions = useMemo(() => {
    if (activeTab === "notifications") {
      return {
        a: ["all", "in_app", "push", "email", "sms", "whatsapp"],
        b: ["all", "queued", "sent", "failed", "read"],
        aLabel: "Channel",
        bLabel: "Status",
      };
    }
    if (activeTab === "search") {
      return {
        a: ["all", ...Array.from(new Set(searchLogs.map((x) => x.reason).filter(Boolean))).sort()],
        b: ["all", ...Array.from(new Set(searchLogs.map((x) => x.source).filter(Boolean))).sort()],
        aLabel: "Reason",
        bLabel: "Source",
      };
    }
    if (activeTab === "watchlists") {
      return {
        a: ["all", "active", "inactive"],
        b: ["all", "muted", "unmuted"],
        aLabel: "Status",
        bLabel: "Mute",
      };
    }
    return {
      a: ["all"],
      b: ["all"],
      aLabel: "A",
      bLabel: "B",
    };
  }, [activeTab, searchLogs]);

  return (
    <div className="admin-activity-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Activity</h2>
        <button className="btn" onClick={loadAll}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="metrics-grid">
        <div className="metric-card"><span>Notifications</span><strong>{metrics.notifications}</strong></div>
        <div className="metric-card"><span>Unread In-App</span><strong>{metrics.unreadNotifications}</strong></div>
        <div className="metric-card"><span>Searches</span><strong>{metrics.searches}</strong></div>
        <div className="metric-card"><span>Searched Handles</span><strong>{metrics.uniqueSearchedHandles}</strong></div>
        <div className="metric-card"><span>Watchlists</span><strong>{metrics.watchlists}</strong></div>
        <div className="metric-card"><span>Muted Subs</span><strong>{metrics.mutedWatchlists}</strong></div>
      </div>

      <div className="tabs-row">
        {TABS.map((tab) => (
          <button key={tab.key} className={cx("tab-btn", activeTab === tab.key && "active")} onClick={() => switchTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filters-card">
        <input placeholder={`Search ${activeTab}`} value={query} onChange={(e) => setQuery(e.target.value)} />
        {filterOptions.a.length > 1 ? (
          <select value={filterA} onChange={(e) => setFilterA(e.target.value)}>
            {filterOptions.a.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        ) : null}
        {filterOptions.b.length > 1 ? (
          <select value={filterB} onChange={(e) => setFilterB(e.target.value)}>
            {filterOptions.b.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        ) : null}
      </div>

      <div className="grid">
        <div className="left-col card">
          {loading ? <div className="empty">Loading…</div> : currentList.length ? (
            <div className="list">
              {currentList.map((item, idx) => (
                <button
                  key={item._id || item.handle_id || item.searched_handle || idx}
                  className={cx("item", selectedId === (item._id || item.handle_id || item.searched_handle) && "sel")}
                  onClick={() => select(item)}
                >
                  {activeTab === "notifications" && (
                    <>
                      <div className="item-top">
                        <span className="pill blue">{item.type || "unknown"}</span>
                        <span className={cx("pill", item.delivery_status === "failed" ? "red" : item.delivery_status === "sent" ? "green" : "gray")}>{item.delivery_status || "queued"}</span>
                        <span className="pill purple">{item.channel || "in_app"}</span>
                      </div>
                      <div className="title">{item.title || "Untitled"}</div>
                      <div className="sub">{item.username ? `@${item.username}` : (item.email || item.user_id || "unknown user")}</div>
                      <div className="meta-row"><span>{item.read_at ? `Read ${timeAgo(item.read_at)}` : "Unread"}</span><span>{timeAgo(item.created_at)}</span></div>
                    </>
                  )}

                  {activeTab === "search" && (
                    <>
                      <div className="item-top">
                        <span className="pill purple">{item.reason || "unknown"}</span>
                        <span className="pill blue">{item.source || "search"}</span>
                      </div>
                      <div className="title">@{item.searched_handle || item.handle_username || "unknown"}</div>
                      <div className="sub">{item.username ? `@${item.username}` : (item.email || item.user_id || "anonymous")}</div>
                      <div className="meta-row"><span>{timeAgo(item.created_at)}</span></div>
                    </>
                  )}

                  {activeTab === "watchlists" && (
                    <>
                      <div className="item-top">
                        <span className={cx("pill", item.active !== false ? "green" : "gray")}>{item.active !== false ? "active" : "inactive"}</span>
                        <span className={cx("pill", item.muted ? "red" : "blue")}>{item.muted ? "muted" : "unmuted"}</span>
                        <span className="pill purple">{item.source || "manual"}</span>
                      </div>
                      <div className="title">{item.handle_username ? `@${item.handle_username}` : (item.instagram_handle ? `@${item.instagram_handle}` : (item.handle_id || "unknown handle"))}</div>
                      <div className="sub">{item.username ? `@${item.username}` : (item.email || item.user_id || "unknown user")}</div>
                      <div className="meta-row"><span>{timeAgo(item.created_at)}</span></div>
                    </>
                  )}

                  {activeTab === "trending" && (
                    <>
                      <div className="item-top">
                        <span className="pill blue">searches</span>
                        <span className="pill green">{item.search_count || 0}</span>
                      </div>
                      <div className="title">@{item.searched_handle || item.handle_username || "unknown"}</div>
                      <div className="sub">{item.reason ? `Top reason: ${item.reason}` : "Trending handle"}</div>
                      <div className="meta-row"><span>Handle ID: {item.handle_id || item._id || "—"}</span></div>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : <div className="empty">No records found</div>}
        </div>

        <div className="right-col card">
          <div className="detail-head">
            <h3>{selectedItem ? "Detail" : "Select an Item"}</h3>
            {selectedItem && activeTab === "notifications" ? (
              <div className="head-actions">
                {!selectedItem.read_at ? <button className="btn" disabled={actionLoading} onClick={markRead}>Mark Read</button> : null}
                {selectedItem.delivery_status === "failed" && selectedItem.channel === "push" ? <button className="btn primary" disabled={actionLoading} onClick={retryPush}>Retry Push</button> : null}
              </div>
            ) : null}
            {selectedItem && activeTab === "watchlists" ? (
              <div className="head-actions">
                <button className="btn" disabled={actionLoading} onClick={() => updateWatchlist({ muted: !selectedItem.muted })}>{selectedItem.muted ? "Unmute" : "Mute"}</button>
                <button className="btn primary" disabled={actionLoading} onClick={() => updateWatchlist({ active: !(selectedItem.active !== false) })}>{selectedItem.active !== false ? "Deactivate" : "Activate"}</button>
              </div>
            ) : null}
          </div>

          {selectedItem ? (
            <div className="detail-body">
              {activeTab === "notifications" && (
                <>
                  <div className="info-grid">
                    <div className="info-card"><span>Type</span><strong>{selectedItem.type || "—"}</strong></div>
                    <div className="info-card"><span>Channel</span><strong>{selectedItem.channel || "—"}</strong></div>
                    <div className="info-card"><span>Status</span><strong>{selectedItem.delivery_status || "—"}</strong></div>
                    <div className="info-card"><span>Created</span><strong>{formatDate(selectedItem.created_at)}</strong></div>
                    <div className="info-card"><span>Sent</span><strong>{formatDate(selectedItem.sent_at)}</strong></div>
                    <div className="info-card"><span>Read</span><strong>{formatDate(selectedItem.read_at)}</strong></div>
                  </div>
                  <label><span>Title</span><textarea rows={2} readOnly value={selectedItem.title || ""}></textarea></label>
                  <label><span>Body</span><textarea rows={4} readOnly value={selectedItem.body || ""}></textarea></label>
                  <label><span>Payload</span><textarea rows={10} className="code" readOnly value={prettyJson(selectedItem.payload)}></textarea></label>
                  <label><span>Provider Response</span><textarea rows={8} className="code" readOnly value={prettyJson(selectedItem.provider_response)}></textarea></label>
                  <label><span>Error</span><textarea rows={3} readOnly value={selectedItem.error_message || ""}></textarea></label>
                </>
              )}

              {activeTab === "search" && (
                <>
                  <div className="info-grid">
                    <div className="info-card"><span>Searched Handle</span><strong>@{selectedItem.searched_handle || selectedItem.handle_username || "—"}</strong></div>
                    <div className="info-card"><span>Reason</span><strong>{selectedItem.reason || "—"}</strong></div>
                    <div className="info-card"><span>Source</span><strong>{selectedItem.source || "—"}</strong></div>
                    <div className="info-card"><span>User</span><strong>{selectedItem.username ? `@${selectedItem.username}` : (selectedItem.email || selectedItem.user_id || "—")}</strong></div>
                    <div className="info-card"><span>Created</span><strong>{formatDate(selectedItem.created_at)}</strong></div>
                    <div className="info-card"><span>Handle ID</span><strong>{selectedItem.handle_id || "—"}</strong></div>
                  </div>
                  <label><span>Raw Log</span><textarea rows={12} className="code" readOnly value={prettyJson(selectedItem)}></textarea></label>
                </>
              )}

              {activeTab === "watchlists" && (
                <>
                  <div className="info-grid">
                    <div className="info-card"><span>User</span><strong>{selectedItem.username ? `@${selectedItem.username}` : (selectedItem.email || selectedItem.user_id || "—")}</strong></div>
                    <div className="info-card"><span>Handle</span><strong>{selectedItem.handle_username ? `@${selectedItem.handle_username}` : (selectedItem.instagram_handle || selectedItem.handle_id || "—")}</strong></div>
                    <div className="info-card"><span>Source</span><strong>{selectedItem.source || "manual"}</strong></div>
                    <div className="info-card"><span>Created</span><strong>{formatDate(selectedItem.created_at)}</strong></div>
                    <div className="info-card"><span>Active</span><strong>{selectedItem.active !== false ? "Yes" : "No"}</strong></div>
                    <div className="info-card"><span>Muted</span><strong>{selectedItem.muted ? "Yes" : "No"}</strong></div>
                  </div>
                  <div className="prefs-box">
                    <div className="pref-chip">New Flag: {selectedItem.notify_new_flag !== false ? "On" : "Off"}</div>
                    <div className="pref-chip">Reply: {selectedItem.notify_reply !== false ? "On" : "Off"}</div>
                    <div className="pref-chip">Report: {selectedItem.notify_report ? "On" : "Off"}</div>
                  </div>
                  <label><span>Raw Subscription</span><textarea rows={10} className="code" readOnly value={prettyJson(selectedItem)}></textarea></label>
                </>
              )}

              {activeTab === "trending" && (
                <>
                  <div className="info-grid">
                    <div className="info-card"><span>Handle</span><strong>@{selectedItem.searched_handle || selectedItem.handle_username || "—"}</strong></div>
                    <div className="info-card"><span>Search Count</span><strong>{selectedItem.search_count || 0}</strong></div>
                    <div className="info-card"><span>Top Reason</span><strong>{selectedItem.reason || "—"}</strong></div>
                  </div>
                  <label><span>Raw Trend</span><textarea rows={10} className="code" readOnly value={prettyJson(selectedItem)}></textarea></label>
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
  .metrics-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:12px}
  .metric-card,.card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .metric-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.metric-card strong{font-size:20px}
  .tabs-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.tab-btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:999px;padding:8px 14px;cursor:pointer}.tab-btn.active{background:#000;color:#fff;border-color:#000}
  .filters-card{display:flex;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px;margin-bottom:12px} input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px} .filters-card input{flex:1;min-width:260px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.list{display:flex;flex-direction:column;gap:10px;max-height:780px;overflow:auto}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.title{font-weight:800}.sub{font-size:12px;color:#555;margin-top:4px}.meta-row{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-top:8px}
  .detail-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.detail-head h3{margin:0}.head-actions{display:flex;gap:8px;flex-wrap:wrap}
  .detail-body{display:flex;flex-direction:column;gap:10px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:14px;word-break:break-word}
  .pill{font-size:11px;padding:4px 8px;border-radius:999px}.pill.blue{background:#eef3ff;color:#3355aa}.pill.green{background:#ecfff5;color:#1a9e5f}.pill.red{background:#fff0f0;color:#a11}.pill.gray{background:#f2f1ec;color:#666}.pill.purple{background:#f7f0ff;color:#6b2bbd}
  .prefs-box{display:flex;gap:8px;flex-wrap:wrap}.pref-chip{font-size:12px;padding:8px 10px;border-radius:999px;background:#f2f1ec;color:#555}
  label{display:flex;flex-direction:column;gap:6px}.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}.btn.primary{background:#000;color:#fff;border-color:#000}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.metrics-grid{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}}
`;
