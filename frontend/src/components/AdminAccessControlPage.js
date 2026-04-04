import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  // Use the backend API base URL - ensure no double slashes
  const apiUrl = url.startsWith('http') ? url : `http://localhost:5004${url}`;
  
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  console.log('🔗 API Request:', apiUrl);
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
      console.log('❌ API Error:', data);
      throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error('❌ API Request Error:', error.message);
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

const DEFAULT_USER_FORM = {
  name: "",
  email: "",
  role_id: "",
  is_active: true,
};

const DEFAULT_ROLE_FORM = {
  key: "",
  label: "",
  description: "",
  is_active: true,
};

const PERMISSION_KEYS = [
  ["can_manage_meta", "Manage Meta"],
  ["can_manage_content", "Manage Content"],
  ["can_manage_notifications", "Manage Notifications"],
  ["can_manage_widgets", "Manage Widgets"],
  ["can_manage_settings", "Manage Settings"],
  ["can_manage_users", "Manage Users"],
  ["can_manage_handles", "Manage Handles"],
  ["can_moderate_flags", "Moderate Flags"],
  ["can_moderate_replies", "Moderate Replies"],
  ["can_manage_reports", "Manage Reports"],
  ["can_view_analytics", "View Analytics"],
  ["can_manage_system", "Manage System"],
];

function emptyPermissions() {
  return PERMISSION_KEYS.reduce((acc, [key]) => {
    acc[key] = false;
    return acc;
  }, {});
}

export default function AdminAccessControlPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionsMap, setPermissionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [roleForm, setRoleForm] = useState(DEFAULT_ROLE_FORM);
  const [permissionForm, setPermissionForm] = useState(emptyPermissions());

  const [savingUser, setSavingUser] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

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
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        api("/api/admin/access/users"),
        api("/api/admin/access/roles"),
        api("/api/admin/access/permissions"),
      ]);

      const usersList = usersRes.users || [];
      const rolesList = rolesRes.roles || [];
      const permissionsList = permsRes.permissions || [];
      const byRole = permissionsList.reduce((acc, item) => {
        acc[String(item.role_id)] = item;
        return acc;
      }, {});

      setUsers(usersList);
      setRoles(rolesList);
      setPermissionsMap(byRole);

      if (!selectedUserId && usersList[0]) selectUser(usersList[0], rolesList);
      if (!selectedRoleId && rolesList[0]) selectRole(rolesList[0], byRole);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    return roles.filter((r) => !q || r.key?.toLowerCase().includes(q) || r.label?.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  function selectUser(user, currentRoles = roles) {
    setSelectedUserId(user._id);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      role_id: user.role_id || currentRoles[0]?._id || "",
      is_active: user.is_active !== false,
    });
  }

  function selectRole(role, currentPermissions = permissionsMap) {
    setSelectedRoleId(role._id);
    setRoleForm({
      key: role.key || "",
      label: role.label || "",
      description: role.description || "",
      is_active: role.is_active !== false,
    });
    setPermissionForm({
      ...emptyPermissions(),
      ...(currentPermissions[String(role._id)]?.permissions || {}),
    });
  }

  async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    setSavingUser(true);
    setError("");
    try {
      await api(`/api/admin/access/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      setSuccess(`User ${action}d successfully`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingUser(false);
    }
  }

  async function saveUser(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setSavingUser(true);
    setError("");
    try {
      await api(`/api/admin/access/users/${selectedUserId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: userForm.name.trim(),
          email: userForm.email.trim().toLowerCase(),
          role_id: userForm.role_id || null,
          is_active: !!userForm.is_active,
        }),
      });
      setSuccess("Admin user updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingUser(false);
    }
  }

  async function createRole() {
    setSavingRole(true);
    setError("");
    try {
      const created = await api(`/api/admin/access/roles`, {
        method: "POST",
        body: JSON.stringify({
          key: roleForm.key.trim(),
          label: roleForm.label.trim(),
          description: roleForm.description.trim() || null,
          is_active: !!roleForm.is_active,
        }),
      });
      setSuccess("Role created");
      await load();
      if (created.role) selectRole(created.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingRole(false);
    }
  }

  async function saveRole(e) {
    e.preventDefault();
    if (!selectedRoleId) return;
    setSavingRole(true);
    setError("");
    try {
      await api(`/api/admin/access/roles/${selectedRoleId}`, {
        method: "PATCH",
        body: JSON.stringify({
          label: roleForm.label.trim(),
          description: roleForm.description.trim() || null,
          is_active: !!roleForm.is_active,
        }),
      });
      setSuccess("Role updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingRole(false);
    }
  }

  async function savePermissions() {
    if (!selectedRoleId) return;
    setSavingPermissions(true);
    setError("");
    try {
      await api(`/api/admin/access/permissions/${selectedRoleId}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: permissionForm }),
      });
      setSuccess("Permissions updated");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingPermissions(false);
    }
  }

  return (
    <div className="admin-access-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Admin Access Control</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card column users-col">
          <div className="section-head">
            <h3>Admin Users</h3>
          </div>
          <input placeholder="Search users" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          {loading ? <div className="empty">Loading…</div> : (
            <div className="list">
              {filteredUsers.map((u) => (
                <button key={u._id} className={cx("item", selectedUserId === u._id && "sel")} onClick={() => selectUser(u)}>
                  <div className="title">{u.name || "Unnamed"}</div>
                  <div className="sub">{u.email}</div>
                  <div className="meta-row">
                    <span className={cx("pill", u.is_active !== false ? "green" : "gray")}>{u.is_active !== false ? "active" : "inactive"}</span>
                    <span className="pill blue">{roles.find((r) => String(r._id) === String(u.role_id))?.label || "no role"}</span>
                  </div>
                  <div className="meta-row">
                    <button 
                      className={cx("btn", "small", u.is_active !== false ? "danger" : "success")} 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserStatus(u._id, u.is_active !== false);
                      }}
                      disabled={savingUser}
                    >
                      {u.is_active !== false ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUserId ? (
            <form className="panel-form" onSubmit={saveUser}>
              <label><span>Name</span><input value={userForm.name} onChange={(e) => setUserForm((s) => ({ ...s, name: e.target.value }))} /></label>
              <label><span>Email</span><input value={userForm.email} onChange={(e) => setUserForm((s) => ({ ...s, email: e.target.value }))} /></label>
              <label>
                <span>Role</span>
                <select value={userForm.role_id} onChange={(e) => setUserForm((s) => ({ ...s, role_id: e.target.value }))}>
                  <option value="">No role</option>
                  {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
                </select>
              </label>
              <label className="chk"><input type="checkbox" checked={userForm.is_active} onChange={(e) => setUserForm((s) => ({ ...s, is_active: e.target.checked }))} /><span>Active</span></label>
              <div className="meta-strip"><span>Last login: {formatDate(users.find((u) => u._id === selectedUserId)?.last_login_at)}</span></div>
              <div className="actions"><button className="btn primary" disabled={savingUser}>{savingUser ? "Saving…" : "Save User"}</button></div>
            </form>
          ) : <div className="empty">Select an admin user.</div>}
        </div>

        <div className="card column roles-col">
          <div className="section-head">
            <h3>Roles</h3>
          </div>
          <input placeholder="Search roles" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} />
          {loading ? <div className="empty">Loading…</div> : (
            <div className="list">
              {filteredRoles.map((r) => (
                <button key={r._id} className={cx("item", selectedRoleId === r._id && "sel")} onClick={() => selectRole(r)}>
                  <div className="title">{r.label}</div>
                  <div className="sub">{r.key}</div>
                  <div className="meta-row"><span className={cx("pill", r.is_active !== false ? "green" : "gray")}>{r.is_active !== false ? "active" : "inactive"}</span></div>
                </button>
              ))}
            </div>
          )}

          <form className="panel-form" onSubmit={saveRole}>
            <label><span>Key</span><input value={roleForm.key} disabled={!!selectedRoleId} onChange={(e) => setRoleForm((s) => ({ ...s, key: e.target.value }))} placeholder="moderator" /></label>
            <label><span>Label</span><input value={roleForm.label} onChange={(e) => setRoleForm((s) => ({ ...s, label: e.target.value }))} placeholder="Moderator" /></label>
            <label><span>Description</span><textarea rows={3} value={roleForm.description} onChange={(e) => setRoleForm((s) => ({ ...s, description: e.target.value }))} /></label>
            <label className="chk"><input type="checkbox" checked={roleForm.is_active} onChange={(e) => setRoleForm((s) => ({ ...s, is_active: e.target.checked }))} /><span>Active</span></label>
            <div className="actions">
              {!selectedRoleId ? <button type="button" className="btn primary" disabled={savingRole} onClick={createRole}>{savingRole ? "Creating…" : "Create Role"}</button> : <button className="btn primary" disabled={savingRole}>{savingRole ? "Saving…" : "Save Role"}</button>}
            </div>
          </form>
        </div>

        <div className="card column perms-col">
          <div className="section-head">
            <h3>Permissions</h3>
          </div>
          {selectedRoleId ? (
            <>
              <div className="meta-strip"><span>Role: {roles.find((r) => r._id === selectedRoleId)?.label || "—"}</span></div>
              <div className="perm-grid">
                {PERMISSION_KEYS.map(([key, label]) => (
                  <label key={key} className="chk perm-item">
                    <input type="checkbox" checked={!!permissionForm[key]} onChange={(e) => setPermissionForm((s) => ({ ...s, [key]: e.target.checked }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="actions"><button className="btn primary" disabled={savingPermissions} onClick={savePermissions}>{savingPermissions ? "Saving…" : "Save Permissions"}</button></div>
            </>
          ) : <div className="empty">Select a role to manage permissions.</div>}
        </div>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:16px}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .column{min-height:760px;display:flex;flex-direction:column}
  .section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.section-head h3{margin:0}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .list{display:flex;flex-direction:column;gap:10px;max-height:300px;overflow:auto;margin:12px 0}
  .item{display:block;border:1px solid #ecebe6;border-radius:12px;padding:12px;background:#faf9f6;cursor:pointer;text-align:left}.item.sel{border-color:#000;background:#f2f1ec}
  .title{font-weight:800}.sub{font-size:12px;color:#555}.meta-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.pill{font-size:11px;padding:4px 8px;border-radius:999px}.pill.green{background:#ecfff5;color:#1a9e5f}.pill.gray{background:#f2f1ec;color:#666}.pill.blue{background:#eef3ff;color:#3355aa}
  .panel-form{display:flex;flex-direction:column;gap:10px;margin-top:6px} label{display:flex;flex-direction:column;gap:6px}.chk{display:flex;align-items:center;gap:8px;flex-direction:row}
  .meta-strip{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#666;background:#faf9f6;border:1px solid #ecebe6;padding:10px;border-radius:10px}
  .perm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.perm-item{border:1px solid #ecebe6;background:#faf9f6;border-radius:12px;padding:10px}
  .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}.btn.primary{background:#000;color:#fff;border-color:#000}.btn.small{font-size:11px;padding:4px 8px}.btn.danger{background:#fff0f0;color:#a11;border-color:#ffbcbc}.btn.success{background:#ecfff5;color:#1a9e5f;border-color:#cdebdc}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}.banner.error{background:#fff0f0;color:#a11}.banner.success{background:#ecfff5;color:#1a9e5f}.empty{color:#666;padding:10px 0}
  @media(max-width:1250px){.grid{grid-template-columns:1fr}.perm-grid{grid-template-columns:1fr}}
`;
