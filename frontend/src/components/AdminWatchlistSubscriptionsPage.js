import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  // Use the backend API base URL - ensure no double slashes
  const apiUrl = url.startsWith('http') ? url : `http://localhost:5004${url}`;
  
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  console.log('🔗 Watchlist Subscriptions API Request:', apiUrl);
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
      console.log('❌ Watchlist Subscriptions API Error:', data);
      throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error('❌ Watchlist Subscriptions API Request Error:', error.message);
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

const DEFAULT_FORM = {
  notify_new_flag: true,
  notify_reply: true,
  notify_report: false,
  muted: false,
  active: true,
  source: "manual",
};

export default function AdminWatchlistSubscriptionsPage() {
  const [watchlists, setWatchlists] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [muteFilter, setMuteFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [handleFilter, setHandleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
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
      const [watchRes, trendRes] = await Promise.all([
        api("/api/watchlists/admin"),
        api("/api/watchlists/admin/trending/summary"),
      ]);
      setWatchlists((watchRes.watchlists || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      setTrending((trendRes.trending || []).sort((a, b) => (b.watchers_count || 0) - (a.watchers_count || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const sourceOptions = useMemo(() => [...new Set(watchlists.map((w) => w.source).filter(Boolean))].sort(), [watchlists]);

  const metrics = useMemo(() => {
    const total = watchlists.length;
    const active = watchlists.filter((w) => w.active !== false).length;
    const muted = watchlists.filter((w) => !!w.muted).length;
    const uniqueHandles = new Set(watchlists.map((w) => String(w.handle_id || "")).filter(Boolean)).size;
    const uniqueUsers = new Set(watchlists.map((w) => String(w.user_id || "")).filter(Boolean)).size;
    return { total, active, muted, uniqueHandles, uniqueUsers };
  }, [watchlists]);

  const filtered = useMemo(() => {
    return watchlists.filter((w) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || String(w._id || "").toLowerCase().includes(s)
        || String(w.user_id || "").toLowerCase().includes(s)
        || String(w.handle_id || "").toLowerCase().includes(s)
        || String(w.username || "").toLowerCase().includes(s)
        || String(w.email || "").toLowerCase().includes(s)
        || String(w.handle_username || w.instagram_handle || "").toLowerCase().includes(s)
        || String(w.source || "").toLowerCase().includes(s);
      const okStatus = statusFilter === "all" || (statusFilter === "active" && w.active !== false) || (statusFilter === "inactive" && w.active === false);
      const okMute = muteFilter === "all" || (muteFilter === "muted" && !!w.muted) || (muteFilter === "unmuted" && !w.muted);
      const okSource = sourceFilter === "all" || w.source === sourceFilter;
      const okHandle = !handleFilter.trim() || String(w.handle_username || w.instagram_handle || w.handle_id || "").toLowerCase().includes(handleFilter.toLowerCase());
      const okUser = !userFilter.trim() || String(w.username || w.email || w.user_id || "").toLowerCase().includes(userFilter.toLowerCase());
      return okSearch && okStatus && okMute && okSource && okHandle && okUser;
    });
  }, [watchlists, search, statusFilter, muteFilter, sourceFilter, handleFilter, userFilter]);

  function select(item) {
    setSelectedId(item._id);
    setSelectedItem(item);
    setForm({
      notify_new_flag: item.notify_new_flag !== false,
      notify_reply: item.notify_reply !== false,
      notify_report: !!item.notify_report,
      muted: !!item.muted,
      active: item.active !== false,
      source: item.source || "manual",
    });
  }

  async function save(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/watchlists/admin/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setSuccess("Watchlist updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSelected() {
    if (!selectedId) return;
    const shouldDelete = window.confirm("Delete this watchlist subscription?");
    if (!shouldDelete) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/watchlists/admin/${selectedId}`, { method: "DELETE" });
      setSuccess("Watchlist deleted");
      setSelectedId(null);
      setSelectedItem(null);
      setForm(DEFAULT_FORM);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-watchlists-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Watchlist / Subscriptions</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="metrics-grid">
        <div className="metric-card"><span>Total Subs</span><strong>{metrics.total}</strong></div>
        <div className="metric-card"><span>Active</span><strong>{metrics.active}</strong></div>
        <div className="metric-card"><span>Muted</span><strong>{metrics.muted}</strong></div>
        <div className="metric-card"><span>Unique Handles</span><strong>{metrics.uniqueHandles}</strong></div>
        <div className="metric-card"><span>Unique Users</span><strong>{metrics.uniqueUsers}</strong></div>
      </div>

      <div className="top-grid">
        <div className="card filters-card">
          <div className="filters filters-6">
            <input placeholder="Search by id, user, handle, source" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={muteFilter} onChange={(e) => setMuteFilter(e.target.value)}>
              <option value="all">All mute states</option>
              <option value="muted">Muted</option>
              <option value="unmuted">Unmuted</option>
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
          <div className="card-head"><h3>Top Watched Handles</h3></div>
          {loading ? (
            <div className="empty">Loading…</div>
          ) : trending.length ? (
            <div className="trending-list">
              {trending.slice(0, 12).map((item, idx) => (
                <div key={`${item._id || item.handle_id}-${idx}`} className="trend-item">
                  <div>
                    <div className="trend-title">{item.handle_username ? `@${item.handle_username}` : (item._id || item.handle_id || "unknown")}</div>
                    <div className="trend-sub">Muted {item.muted_count || 0}</div>
                  </div>
                  <span className="trend-count">{item.watchers_count || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No watch trends yet</div>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="left-col card">
          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((item) => (
                <button key={item._id} className={cx("item", selectedId === item._id && "sel")} onClick={() => select(item)}>
                  <div className="item-top">
                    <span className="source-pill">{item.source || "manual"}</span>
                    <span className={cx("status-pill", item.active !== false ? "active" : "inactive")}>{item.active !== false ? "active" : "inactive"}</span>
                    {item.muted ? <span className="muted-pill">muted</span> : null}
                  </div>
                  <div className="title">{item.handle_username ? `@${item.handle_username}` : (item.instagram_handle ? `@${item.instagram_handle}` : (item.handle_id || "unknown handle"))}</div>
                  <div className="sub">{item.username ? `@${item.username}` : (item.email || item.user_id || "unknown user")}</div>
                  <div className="prefs-row">
                    <span className={cx("pref-pill", item.notify_new_flag && "on")}>flag</span>
                    <span className={cx("pref-pill", item.notify_reply && "on")}>reply</span>
                    <span className={cx("pref-pill", item.notify_report && "on")}>report</span>
                  </div>
                  <div className="meta-row">Created {timeAgo(item.created_at)}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No subscriptions found</div>
          )}
        </div>

        <div className="right-col card">
          <div className="form-head">
            <h3>{selectedItem ? "Subscription Detail" : "Select a Subscription"}</h3>
            {selectedItem ? <button className="btn danger" disabled={saving} onClick={removeSelected}>Delete</button> : null}
          </div>

          {selectedItem ? (
            <form onSubmit={save}>
              <div className="info-grid">
                <div className="info-card"><span>User</span><strong>{selectedItem.username ? `@${selectedItem.username}` : (selectedItem.email || selectedItem.user_id || "—")}</strong></div>
                <div className="info-card"><span>Handle</span><strong>{selectedItem.handle_username ? `@${selectedItem.handle_username}` : (selectedItem.instagram_handle || selectedItem.handle_id || "—")}</strong></div>
                <div className="info-card"><span>Created</span><strong>{formatDate(selectedItem.created_at)}</strong></div>
              </div>

              <div className="row row-2">
                <label className="chk"><input type="checkbox" checked={form.notify_new_flag} onChange={(e) => setForm((s) => ({ ...s, notify_new_flag: e.target.checked }))} /><span>Notify New Flag</span></label>
                <label className="chk"><input type="checkbox" checked={form.notify_reply} onChange={(e) => setForm((s) => ({ ...s, notify_reply: e.target.checked }))} /><span>Notify Reply</span></label>
              </div>

              <div className="row row-2">
                <label className="chk"><input type="checkbox" checked={form.notify_report} onChange={(e) => setForm((s) => ({ ...s, notify_report: e.target.checked }))} /><span>Notify Report</span></label>
                <label className="chk"><input type="checkbox" checked={form.muted} onChange={(e) => setForm((s) => ({ ...s, muted: e.target.checked }))} /><span>Muted</span></label>
              </div>

              <div className="row row-2">
                <label className="chk"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
                <label>
                  <span>Source</span>
                  <select value={form.source} onChange={(e) => setForm((s) => ({ ...s, source: e.target.value }))}>
                    <option value="manual">manual</option>
                    <option value="auto">auto</option>
                    <option value="suggested">suggested</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
              </div>

              <div className="row row-2">
                <label>
                  <span>Watchlist ID</span>
                  <input value={selectedItem._id || ""} readOnly />
                </label>
                <label>
                  <span>Updated</span>
                  <input value={formatDate(selectedItem.updated_at)} readOnly />
                </label>
              </div>

              <div className="actions">
                <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save Subscription"}</button>
              </div>
            </form>
          ) : (
            <div className="empty">Select a watchlist subscription from the left to inspect and update preferences.</div>
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
  .filters{display:grid;gap:8px}.filters-6{grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .card-head{margin-bottom:8px}.card-head h3,.form-head h3{margin:0}
  .trending-list{display:flex;flex-direction:column;gap:10px;max-height:220px;overflow:auto}
  .trend-item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:10px}
  .trend-title{font-weight:800}.trend-sub{font-size:12px;color:#666}.trend-count{font-size:13px;font-weight:800;background:#eef3ff;color:#3355aa;padding:4px 8px;border-radius:999px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .list{display:flex;flex-direction:column;gap:10px;max-height:760px;overflow:auto}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .item-top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.title{font-weight:800}.sub{font-size:12px;color:#555}.meta-row{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#666;margin-top:8px}
  .source-pill,.status-pill,.muted-pill,.pref-pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .source-pill{background:#eef3ff;color:#3355aa}.status-pill.active{background:#ecfff5;color:#1a9e5f}.status-pill.inactive{background:#f2f1ec;color:#666}.muted-pill{background:#fff0f0;color:#a11}
  .prefs-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.pref-pill{background:#f2f1ec;color:#666}.pref-pill.on{background:#ecfff5;color:#1a9e5f}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px}
  .info-card{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:12px}.info-card span{display:block;font-size:12px;color:#666;margin-bottom:6px}.info-card strong{font-size:15px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.chk{display:flex;align-items:center;gap:8px;margin-top:22px}.row{display:grid;gap:10px}.row-2{grid-template-columns:1fr 1fr}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}.btn.primary{background:#000;color:#fff;border-color:#000}.btn.danger{background:#fff0f0;color:#a11;border-color:#ffbcbc}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px}
  @media(max-width:1250px){.metrics-grid{grid-template-columns:1fr 1fr}.top-grid,.grid{grid-template-columns:1fr}.filters-6{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}}
`;
