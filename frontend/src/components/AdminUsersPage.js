import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  // Use the backend API base URL - ensure no double slashes
  const apiUrl = url.startsWith('http') ? url : `http://localhost:5004${url}`;
  
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  console.log('🔗 Users API Request:', apiUrl);
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
      console.log('❌ Users API Error:', data);
      throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error('❌ Users API Request Error:', error.message);
    throw error;
  }
}

const DEFAULT_FORM = {
  username: "",
  email: "",
  instagram_handle: "",
  role: "user",
  active: true,
  email_verified: false,
  default_identity: "anonymous",
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [verification, setVerification] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
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
      const data = await api("http://localhost:5004/api/admin/users");
      setUsers((data.users || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || u.username?.toLowerCase().includes(s)
        || u.email?.toLowerCase().includes(s)
        || u.instagram_handle?.toLowerCase().includes(s)
        || u._id?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && u.is_banned !== true) || (status === "inactive" && u.is_banned === true);
      const okVerification = verification === "all"
        || (verification === "verified" && u.email_verified)
        || (verification === "unverified" && !u.email_verified);
      return okSearch && okStatus && okVerification;
    });
  }, [users, search, status, verification]);

  function select(user) {
    setSelectedId(user._id);
    setSelectedUser(user);
    setForm({
      username: user.username || "",
      email: user.email || "",
      instagram_handle: user.instagram_handle || "",
      role: user.role || "user",
      active: user.is_banned !== true,
      email_verified: !!user.email_verified,
      default_identity: user.default_identity || "anonymous",
      admin_note: user.admin_note || "",
    });
  }

  function reset() {
    setSelectedId(null);
    setSelectedUser(null);
    setForm(DEFAULT_FORM);
  }

  async function save(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        instagram_handle: form.instagram_handle.trim() || null,
        role: form.role,
        is_banned: !form.active,
        email_verified: !!form.email_verified,
        default_identity: form.default_identity,
        admin_note: form.admin_note.trim() || null,
      };
      await api(`http://localhost:5004/api/admin/users/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSuccess("User updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspend() {
    if (!selectedId || !selectedUser) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/users/${selectedId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_banned: !selectedUser.is_banned }),
      });
      setSuccess(selectedUser.is_banned ? "User reactivated" : "User suspended");
      await load();
      const fresh = users.find((u) => u._id === selectedId);
      if (fresh) select(fresh);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function impersonationSafeVerify() {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/users/${selectedId}/verify-email`, {
        method: "POST",
      });
      setSuccess("Email marked verified");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-users-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Users</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters filters-3">
            <input placeholder="Search by username, email, handle, id" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={verification} onChange={(e) => setVerification(e.target.value)}>
              <option value="all">All verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((user) => (
                <button key={user._id} className={"item " + (selectedId === user._id ? "sel" : "")} onClick={() => select(user)}>
                  <div>
                    <div className="title">@{user.username || "unknown"}</div>
                    <div className="sub">{user.email || "—"}</div>
                    <div className="tiny">{user.instagram_handle ? `IG: @${user.instagram_handle}` : "No Instagram"}</div>
                  </div>
                  <div className="item-right">
                    <span className={"pill " + (user.email_verified ? "verified" : "unverified")}>{user.email_verified ? "Verified" : "Unverified"}</span>
                    <span className={"pill " + (user.is_banned !== true ? "active" : "inactive")}>{user.is_banned !== true ? "Active" : "Inactive"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No users found</div>
          )}
        </div>

        <div className="right-col">
          <form className="card form-card" onSubmit={save}>
            <div className="form-head">
              <h3>{selectedId ? "Edit User" : "Select a User"}</h3>
              {selectedId ? (
                <button type="button" className="danger" onClick={toggleSuspend}>
                  {selectedUser?.is_banned !== true ? "Suspend" : "Reactivate"}
                </button>
              ) : null}
            </div>

            {selectedId ? (
              <>
                <div className="meta-strip">
                  <span>ID: {selectedUser?._id}</span>
                  <span>Joined: {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}</span>
                  <span>Last seen: {timeAgo(selectedUser?.last_active_at || selectedUser?.updated_at)}</span>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Username</span>
                    <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
                  </label>
                  <label>
                    <span>Email</span>
                    <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                  </label>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Instagram Handle</span>
                    <input value={form.instagram_handle} onChange={(e) => setForm((s) => ({ ...s, instagram_handle: e.target.value }))} placeholder="rohanverma__" />
                  </label>
                  <label>
                    <span>Role</span>
                    <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                  </label>
                </div>

                <div className="row row-2">
                  <label>
                    <span>Default Identity</span>
                    <select value={form.default_identity} onChange={(e) => setForm((s) => ({ ...s, default_identity: e.target.value }))}>
                      <option value="anonymous">anonymous</option>
                      <option value="named">named</option>
                    </select>
                  </label>
                  <div className="stack-checks">
                    <label className="chk"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
                    <label className="chk"><input type="checkbox" checked={form.email_verified} onChange={(e) => setForm((s) => ({ ...s, email_verified: e.target.checked }))} /><span>Email Verified</span></label>
                  </div>
                </div>

                <label>
                  <span>Admin Note</span>
                  <textarea rows={5} value={form.admin_note} onChange={(e) => setForm((s) => ({ ...s, admin_note: e.target.value }))} placeholder="Internal note visible only to admins" />
                </label>

                <div className="info-grid">
                  <div className="info-card"><span>Flags Posted</span><strong>{selectedUser?.flags_posted_count ?? 0}</strong></div>
                  <div className="info-card"><span>Flags On Me</span><strong>{selectedUser?.flags_on_me_count ?? 0}</strong></div>
                  <div className="info-card"><span>Watches</span><strong>{selectedUser?.watches_count ?? 0}</strong></div>
                  <div className="info-card"><span>Notifications</span><strong>{selectedUser?.notifications_count ?? 0}</strong></div>
                </div>

                <div className="actions">
                  <button type="button" className="btn" onClick={reset}>Reset</button>
                  <button type="button" className="btn" onClick={impersonationSafeVerify}>Mark Verified</button>
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : "Update User"}</button>
                </div>
              </>
            ) : (
              <div className="empty">Select a user from the left to inspect and update details.</div>
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
  .filters-3{grid-template-columns:1fr 140px 160px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .list{display:flex;flex-direction:column;gap:8px;max-height:760px;overflow:auto}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer;text-align:left}
  .item.sel{border-color:#000;background:#f2f1ec}
  .item-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
  .title{font-weight:700}
  .sub{font-size:12px;color:#444}
  .tiny{font-size:11px;color:#777;margin-top:2px}
  .pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.active{background:#ecfff5;color:#1a9e5f}
  .pill.inactive{background:#f2f1ec;color:#666}
  .pill.verified{background:#eef8ff;color:#2463a6}
  .pill.unverified{background:#fff0f0;color:#a11}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:grid;gap:10px}
  .row-2{grid-template-columns:1fr 1fr}
  .stack-checks{display:flex;flex-direction:column;gap:10px;justify-content:center}
  .chk{display:flex;align-items:center;gap:8px;margin-top:22px}
  .meta-strip{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#666;margin-bottom:10px;background:#faf9f6;border:1px solid #ecebe6;padding:10px;border-radius:10px}
  .info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:6px}
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
