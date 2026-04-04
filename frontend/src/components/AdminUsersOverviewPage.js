import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  // Use the backend API base URL - ensure no double slashes
  const apiUrl = url.startsWith('http') ? url : `http://localhost:5004${url}`;
  
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  console.log('🔗 Users Overview API Request:', apiUrl);
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
      console.log('❌ Users Overview API Error:', data);
      throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error('❌ Users Overview API Request Error:', error.message);
    throw error;
  }
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
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
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [secondsInUnit, label] of units) {
    if (seconds >= secondsInUnit) {
      const count = Math.floor(seconds / secondsInUnit);
      return `${count}${label} ago`;
    }
  }
  return "Just now";
}

export default function AdminUsersOverviewPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    unverified: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await api("/api/admin/users");
      const usersList = response.users || [];
      setUsers(usersList);
      calculateStats(usersList);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(usersList) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats = {
      total: usersList.length,
      active: usersList.filter(u => u.active).length,
      inactive: usersList.filter(u => !u.active).length,
      verified: usersList.filter(u => u.email_verified).length,
      unverified: usersList.filter(u => !u.email_verified).length,
      today: usersList.filter(u => new Date(u.created_at) >= today).length,
      thisWeek: usersList.filter(u => new Date(u.created_at) >= weekAgo).length,
      thisMonth: usersList.filter(u => new Date(u.created_at) >= monthAgo).length
    };

    setStats(newStats);
  }

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.instagram_handle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(user => 
        filterStatus === "active" ? user.active : !user.active
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "created_at" || sortBy === "last_login_at") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [users, searchTerm, filterStatus, filterRole, sortBy, sortOrder]);

  function selectUser(user) {
    setSelectedUser(user);
    setShowUserDetails(true);
  }

  async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      await api(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !currentStatus }),
      });
      setSuccess(`User ${action}d successfully`);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleEmailVerification(userId, currentStatus) {
    const action = currentStatus ? 'unverify' : 'verify';
    if (!window.confirm(`Are you sure you want to ${action} this user's email?`)) return;
    
    try {
      await api(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ email_verified: !currentStatus }),
      });
      setSuccess(`Email ${action}d successfully`);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-950"></div>
          <div className="mt-2 text-sm text-zinc-500">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-950">Users Overview</h2>
        <p className="text-sm text-zinc-600">Manage all user accounts and their activities</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✅</span>
            <span className="text-sm text-emerald-700">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-2xl font-bold text-zinc-950">{stats.total}</div>
          <div className="text-xs text-zinc-500">Total Users</div>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          <div className="text-xs text-emerald-600">Active Users</div>
        </div>
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
          <div className="text-xs text-blue-600">Verified Emails</div>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.today}</div>
          <div className="text-xs text-amber-600">Joined Today</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Sort by</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="username-asc">Username A-Z</option>
              <option value="username-desc">Username Z-A</option>
              <option value="last_login_at-desc">Recent Login</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">
                  <button 
                    onClick={() => handleSort('username')}
                    className="hover:text-zinc-950"
                  >
                    Username {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">Instagram</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">
                  <button 
                    onClick={() => handleSort('created_at')}
                    className="hover:text-zinc-950"
                  >
                    Joined {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => selectUser(user)}
                      className="font-medium text-zinc-950 hover:text-zinc-700 hover:underline"
                    >
                      @{user.username}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-600">{user.email}</div>
                    {user.email_verified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        ✓ Verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.instagram_handle ? (
                      <span className="text-sm text-zinc-600">@{user.instagram_handle}</span>
                    ) : (
                      <span className="text-sm text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'moderator' ? 'bg-amber-100 text-amber-800' :
                      'bg-stone-100 text-stone-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-600">{formatDate(user.created_at)}</div>
                    <div className="text-xs text-zinc-400">{timeAgo(user.created_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-600">
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {user.last_login_at ? timeAgo(user.last_login_at) : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleUserStatus(user._id, user.active)}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          user.active 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => toggleEmailVerification(user._id, user.email_verified)}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          user.email_verified 
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {user.email_verified ? 'Unverify' : 'Verify'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-zinc-400">No users found</div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-950">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Username</label>
                    <div className="text-sm text-zinc-950">@{selectedUser.username}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Email</label>
                    <div className="text-sm text-zinc-950">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Role</label>
                    <div className="text-sm text-zinc-950">{selectedUser.role}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Status</label>
                    <div className="text-sm text-zinc-950">{selectedUser.active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Email Verified</label>
                    <div className="text-sm text-zinc-950">{selectedUser.email_verified ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Default Identity</label>
                    <div className="text-sm text-zinc-950">{selectedUser.default_identity}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Instagram Handle</label>
                    <div className="text-sm text-zinc-950">
                      {selectedUser.instagram_handle ? `@${selectedUser.instagram_handle}` : '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Created At</label>
                    <div className="text-sm text-zinc-950">{formatDate(selectedUser.created_at)}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Last Login</label>
                    <div className="text-sm text-zinc-950">
                      {selectedUser.last_login_at ? formatDate(selectedUser.last_login_at) : 'Never'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-zinc-600">Admin Note</label>
                    <div className="text-sm text-zinc-950">
                      {selectedUser.admin_note || 'No notes'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
