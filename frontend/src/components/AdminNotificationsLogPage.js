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

export default function AdminNotificationsLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [failedOnly, setFailedOnly] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      const data = await api("/api/admin/notifications-log");
      setLogs((data.logs || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const typeOptions = useMemo(() => {
    return [...new Set(logs.map((l) => l.type).filter(Boolean))].sort();
  }, [logs]);

  const metrics = useMemo(() => {
    const total = logs.length;
    const inAppUnread = logs.filter((l) => l.channel === "in_app" && !l.read_at).length;
    const pushSent = logs.filter((l) => l.channel === "push" && l.delivery_status === "sent").length;
    const failed = logs.filter((l) => l.delivery_status === "failed").length;
    const queued = logs.filter((l) => l.delivery_status === "queued").length;
    return { total, inAppUnread, pushSent, failed, queued };
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || log._id?.toLowerCase().includes(s)
        || log.type?.toLowerCase().includes(s)
        || log.title?.toLowerCase().includes(s)
        || log.body?.toLowerCase().includes(s)
        || log.username?.toLowerCase().includes(s)
        || log.email?.toLowerCase().includes(s)
        || log.handle_username?.toLowerCase().includes(s)
        || String(log.user_id || "").toLowerCase().includes(s)
        || String(log.handle_id || "").toLowerCase().includes(s);
      const okChannel = channelFilter === "all" || log.channel === channelFilter;
      const okStatus = statusFilter === "all" || log.delivery_status === statusFilter;
      const okType = typeFilter === "all" || log.type === typeFilter;
      const okUnread = !unreadOnly || !log.read_at;
      const okFailed = !failedOnly || log.delivery_status === "failed";
      return okSearch && okChannel && okStatus && okType && okUnread && okFailed;
    });
  }, [logs, search, channelFilter, statusFilter, typeFilter, unreadOnly, failedOnly]);

  function select(log) {
    setSelectedId(log._id);
    setSelectedLog(log);
  }

  async function markRead() {
    if (!selectedLog?._id) return;
    setActionLoading(true);
    setError("");
    try {
      await api(`/api/admin/notifications-log/${selectedLog._id}/mark-read`, { method: "POST" });
      setSuccess("Notification marked read");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function retryPush() {
    if (!selectedLog?._id) return;
    setActionLoading(true);
    setError("");
    try {
      await api(`/api/admin/notifications-log/${selectedLog._id}/retry`, { method: "POST" });
      setSuccess("Retry triggered");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="admin-notifications-log-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Notifications Log</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="metrics-grid">
        <div className="metric-card"><span>Total</span><strong>{metrics.total}</strong></div>
        <div className="metric-card"><span>Unread In-App</span><strong>{metrics.inAppUnread}</strong></div>
        <div className="metric-card"><span>Push Sent</span><strong>{metrics.pushSent}</strong></div>
        <div className="metric-card"><span>Failed</span><strong>{metrics.failed}</strong></div>
        <div className="metric-card"><span>Queued</span><strong>{metrics.queued}</strong></div>
      </div>

      <div className="filters-card card">
        <div className="filters filters-6">
          <input placeholder="Search by id, user, handle, title, body, type" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
            <option value="all">All channels</option>
            <option value="in_app">in_app</option>
            <option value="push">push</option>
            <option value="email">email</option>
            <option value="sms">sms</option>
            <option value="whatsapp">whatsapp</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="queued">queued</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="read">read</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <label className="chk inline-check"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /><span>Unread only</span></label>
          <label className="chk inline-check"><input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} /><span>Failed only</span></label>
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
                    <span className="type-pill">{log.type || "unknown"}</span>
                    <span className={cx("status-pill", log.delivery_status)}>{log.delivery_status || "queued"}</span>
                    <span className="channel-pill">{log.channel || "in_app"}</span>
                  </div>
                  <div className="title">{log.title || "Untitled notification"}</div>
                  <div className="sub">{log.username ? `@${log.username}` : (log.email || log.user_id || "unknown user")} {log.handle_username ? `· @${log.handle_username}` : ""}</div>
                  <div className="body-preview">{log.body || "No body"}</div>
                  <div className="meta-row">
                    <span>Created {timeAgo(log.created_at)}</span>
                    <span>{log.read_at ? `Read ${timeAgo(log.read_at)}` : "Unread"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No notification logs found</div>
          )}
        </div>

        <div className="right-col card">
          <div className="form-head">
            <h3>{selectedLog ? "Notification Detail" : "Select a Notification"}</h3>
            {selectedLog ? (
              <div className="head-actions">
                {!selectedLog.read_at ? <button className="btn" disabled={actionLoading} onClick={markRead}>Mark Read</button> : null}
                {selectedLog.delivery_status === "failed" && selectedLog.channel === "push" ? <button className="btn primary" disabled={actionLoading} onClick={retryPush}>Retry Push</button> : null}
              </div>
            ) : null}
          </div>

          {selectedLog ? (
            <>
              <div className="meta-strip">
                <span>ID: {selectedLog._id}</span>
                <span>User: {selectedLog.user_id || "—"}</span>
                <span>Handle: {selectedLog.handle_id || "—"}</span>
              </div>

              <div className="info-grid">
                <div className="info-card"><span>Type</span><strong>{selectedLog.type || "—"}</strong></div>
                <div className="info-card"><span>Channel</span><strong>{selectedLog.channel || "—"}</strong></div>
                <div className="info-card"><span>Status</span><strong>{selectedLog.delivery_status || "—"}</strong></div>
                <div className="info-card"><span>Created</span><strong>{formatDate(selectedLog.created_at)}</strong></div>
                <div className="info-card"><span>Sent</span><strong>{formatDate(selectedLog.sent_at)}</strong></div>
                <div className="info-card"><span>Read</span><strong>{formatDate(selectedLog.read_at)}</strong></div>
              </div>

              <label>
                <span>Title</span>
                <textarea rows={2} value={selectedLog.title || ""} readOnly />
              </label>

              <label>
                <span>Body</span>
                <textarea rows={4} value={selectedLog.body || ""} readOnly />
              </label>

              <div className="row row-2">
                <label>
                  <span>Provider</span>
                  <input value={selectedLog.provider || "—"} readOnly />
                </label>
                <label>
                  <span>User / Handle</span>
                  <input value={`${selectedLog.username ? `@${selectedLog.username}` : (selectedLog.email || selectedLog.user_id || "—")}${selectedLog.handle_username ? ` / @${selectedLog.handle_username}` : ""}`} readOnly />
                </label>
              </div>

              <label>
                <span>Payload JSON</span>
                <textarea className="code" rows={10} value={prettyJson(selectedLog.payload)} readOnly spellCheck={false} />
              </label>

              <label>
                <span>Provider Response</span>
                <textarea className="code" rows={8} value={prettyJson(selectedLog.provider_response)} readOnly spellCheck={false} />
              </label>

              <label>
                <span>Error Message</span>
                <textarea rows={3} value={selectedLog.error_message || ""} readOnly />
              </label>
            </>
          ) : (
            <div className="empty">Select a notification from the left to inspect delivery and payload details.</div>
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
  .metric-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.metric-card strong{font-size:24px}
  .filters-card{margin-bottom:12px}.filters{display:grid;gap:8px}.filters-6{grid-template-columns:2fr repeat(3,1fr) auto auto}
  .chk{display:flex;align-items:center;gap:8px}.inline-check{margin-top:8px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.left-col,.right-col{align-content:start}
  .list{display:flex;flex-direction:column;gap:10px;max-height:760px;overflow:auto}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.title{font-weight:800}.sub,.body-preview{font-size:12px;color:#555}.body-preview{margin-top:6px;line-height:1.5}
  .meta-row{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-top:8px}
  .type-pill,.status-pill,.channel-pill{font-size:11px;padding:4px 8px;border-radius:999px}.type-pill{background:#eef3ff;color:#3355aa}.channel-pill{background:#f7f0ff;color:#6b2bbd}
  .status-pill.queued{background:#f2f1ec;color:#666}.status-pill.sent{background:#ecfff5;color:#1a9e5f}.status-pill.failed{background:#fff0f0;color:#a11}.status-pill.read{background:#eef8ff;color:#2463a6}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:12px}.head-actions{display:flex;gap:8px;flex-wrap:wrap}
  .meta-strip{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-bottom:10px;background:#faf9f6;border:1px solid #ecebe6;padding:10px;border-radius:10px}
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}.info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:15px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.row{display:grid;gap:10px}.row-2{grid-template-columns:1fr 1fr}.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}.btn.primary{background:#000;color:#fff;border-color:#000}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.metrics-grid{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.filters-6{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}}
`;
