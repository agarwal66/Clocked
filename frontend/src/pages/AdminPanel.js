"use client";

import React, { useEffect, useMemo, useState, useReducer } from "react";
import AdminMetaGroupsPage from "../components/AdminMetaGroupsPage";
import AdminMetaItemsPage from "../components/AdminMetaItemsPage";
import AdminContentBlocksPage from "../components/AdminContentBlocksPage";
import AdminNotificationTemplatesPage from "../components/AdminNotificationTemplatesPage";
import AdminDashboardWidgetsPage from "../components/AdminDashboardWidgetsPage";
import AdminSettingsFieldsPage from "../components/AdminSettingsFieldsPage";
import AdminUsersPage from "../components/AdminUsersPage";
import AdminUsersOverviewPage from "../components/AdminUsersOverviewPage";
import AdminHandlesPage from "../components/AdminHandlesPage";
import AdminFlagsPage from "../components/AdminFlagsPage";
import AdminCommentsRepliesModerationPage from "../components/AdminCommentsRepliesModerationPage";
import AdminNotificationsLogPage from "../components/AdminNotificationsLogPage";
import TestNotifications from "../components/TestNotifications";
import SimpleNotificationsLog from "../components/SimpleNotificationsLog";
import NotificationsTest from "../pages/NotificationsTest";
import AdminSearchLogsTrendingPage from "../components/AdminSearchLogsTrendingPage";
import AdminWatchlistPage from "../components/AdminWatchlistPage";
import SimpleWatchlistTest from "../components/SimpleWatchlistTest";
import AdminAccessControlPage from "../components/AdminAccessControlPage";
import AdminWatchlistSubscriptionsPage from "../components/AdminWatchlistSubscriptionsPage";
import AdminActivityPage from "../components/AdminActivityPage";
import AdminOperationsPage from "../components/AdminOperationsPage";

const ADMIN_ROUTES = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "users-overview", label: "Users Overview", icon: "👥" },
  { key: "users", label: "Users", icon: "👤" },
  { key: "handles", label: "Handles", icon: "🏷️" },
  { key: "flags", label: "Flags", icon: "🚩" },
  { key: "flag-replies", label: "Comments/Replies", icon: "💬" },
  { key: "search-logs", label: "Search Logs", icon: "🔍" },
  { key: "watchlists", label: "Watchlists", icon: "👁️" },
  { key: "watchlist-subs", label: "Watchlist Subs", icon: "📋" },
  { key: "access-control", label: "Access Control", icon: "🔐" },
  { key: "activity", label: "Activity", icon: "📊" },
  { key: "operations", label: "Operations", icon: "⚙️" },
  { key: "simple-watchlist", label: "Watchlist Test", icon: "🧪" },
  { key: "meta-groups", label: "Meta Groups", icon: "🧩" },
  { key: "meta-items", label: "Meta Items", icon: "🏷️" },
  { key: "content", label: "Content Blocks", icon: "📝" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
  { key: "notifications-log", label: "Notifications Log", icon: "📋" },
  { key: "simple-notifications", label: "Simple Notifications", icon: "🔍" },
  { key: "notifications-test", label: "Notifications Test", icon: "🧪" },
  { key: "test-notifications", label: "Test Component", icon: "🧮" },
  { key: "widgets", label: "Widgets", icon: "🧱" },
  { key: "settings-fields", label: "Settings Fields", icon: "⚙️" },
];

const LOGIN_FORM_DEFAULT = {
  email: "",
  password: "",
};

const GROUP_FORM_DEFAULT = {
  key: "",
  label: "",
  description: "",
  sort_order: 1,
  active: true,
};

async function apiRequest(url, options = {}) {
  // Use the backend API base URL
  const apiUrl = `http://localhost:5004${url}`;
  
  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('clocked_admin_token');
  
  const response = await fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(adminToken && { "Authorization": `Bearer ${adminToken}` }),
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
  }

  return data;
}

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ClockedAdminFoundation() {
  const [bootLoading, setBootLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState("dashboard");
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  console.log('ClockedAdminFoundation component rendering, activeRoute:', activeRoute);

  const [loginForm, setLoginForm] = useState(LOGIN_FORM_DEFAULT);
  const [loginLoading, setLoginLoading] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    groups: 0,
    activeGroups: 0,
    inactiveGroups: 0,
    recentEdits: [],
  });

  // Debug: Watch for activeRoute changes
  useEffect(() => {
    console.log('activeRoute changed to:', activeRoute);
  }, [activeRoute]);

  // Force re-render when activeRoute changes
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  useEffect(() => {
    forceUpdate();
  }, [activeRoute]);

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupStatusFilter, setGroupStatusFilter] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupForm, setGroupForm] = useState(GROUP_FORM_DEFAULT);
  const [groupSaving, setGroupSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function boot() {
      setBootLoading(true);
      try {
        const session = await apiRequest("/api/admin/session");
        if (ignore) return;
        setIsAuthenticated(Boolean(session?.authenticated));
        setAdminUser(session?.admin || null);
        if (session?.authenticated) {
          await Promise.all([loadDashboardHome(), loadGroups()]);
        }
      } catch {
        if (!ignore) {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } finally {
        if (!ignore) {
          setSessionChecked(true);
          setBootLoading(false);
        }
      }
    }

    boot();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 2200);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch = !groupSearch.trim()
        || group.label.toLowerCase().includes(groupSearch.toLowerCase())
        || group.key.toLowerCase().includes(groupSearch.toLowerCase());
      const matchesStatus = groupStatusFilter === "all"
        || (groupStatusFilter === "active" && group.active)
        || (groupStatusFilter === "inactive" && !group.active);
      return matchesSearch && matchesStatus;
    });
  }, [groups, groupSearch, groupStatusFilter]);

  async function loadDashboardHome() {
    try {
      const data = await apiRequest("/api/admin/meta/dashboard-home");
      setDashboardStats({
        groups: data?.groups ?? 0,
        activeGroups: data?.activeGroups ?? 0,
        inactiveGroups: data?.inactiveGroups ?? 0,
        recentEdits: data?.recentEdits || [],
      });
    } catch {
      // silent fallback
    }
  }

  async function loadGroups() {
    setGroupsLoading(true);
    try {
      const data = await apiRequest("/api/admin/meta/groups");
      setGroups((data?.groups || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (error) {
      setGlobalError(error.message || "Could not load meta groups.");
    } finally {
      setGroupsLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setGlobalError("");
    try {
      const data = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      setIsAuthenticated(true);
      setAdminUser(data?.admin || null);
      setLoginForm(LOGIN_FORM_DEFAULT);
      
      // Store admin token in localStorage
      if (data?.token) {
        localStorage.setItem('clocked_admin_token', data.token);
      }
      
      await Promise.all([loadDashboardHome(), loadGroups()]);
    } catch (error) {
      setGlobalError(error.message || "Admin login failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
    } catch {
      // no-op
    }
    setIsAuthenticated(false);
    setAdminUser(null);
    
    // Clear admin token from localStorage
    localStorage.removeItem('clocked_admin_token');
    
    setActiveRoute("dashboard");
    setSelectedGroupId(null);
    setGroupForm(GROUP_FORM_DEFAULT);
  }

  function selectGroup(group) {
    setSelectedGroupId(group._id);
    setGroupForm({
      key: group.key || "",
      label: group.label || "",
      description: group.description || "",
      sort_order: group.sort_order || 1,
      active: Boolean(group.active),
    });
  }

  function resetGroupForm() {
    setSelectedGroupId(null);
    setGroupForm(GROUP_FORM_DEFAULT);
  }

  async function saveGroup(e) {
    e.preventDefault();
    setGroupSaving(true);
    setGlobalError("");
    try {
      const payload = {
        key: groupForm.key.trim(),
        label: groupForm.label.trim(),
        description: groupForm.description.trim(),
        sort_order: Number(groupForm.sort_order || 1),
        active: Boolean(groupForm.active),
      };

      if (!payload.key || !payload.label) {
        throw new Error("Group key and label are required.");
      }

      const url = selectedGroupId
        ? `/api/admin/meta/groups/${selectedGroupId}` 
        : "/api/admin/meta/groups";
      const method = selectedGroupId ? "PATCH" : "POST";

      await apiRequest(url, {
        method,
        body: JSON.stringify(payload),
      });

      await Promise.all([loadGroups(), loadDashboardHome()]);
      resetGroupForm();
      setSuccessMessage(selectedGroupId ? "Group updated." : "Group created.");
    } catch (error) {
      setGlobalError(error.message || "Could not save group.");
    } finally {
      setGroupSaving(false);
    }
  }

  async function deleteGroup() {
    if (!selectedGroupId) return;
    const confirmed = window.confirm("Delete this meta group?");
    if (!confirmed) return;

    setGroupSaving(true);
    setGlobalError("");
    try {
      await apiRequest(`/api/admin/meta/groups/${selectedGroupId}`, {
        method: "DELETE",
      });
      await Promise.all([loadGroups(), loadDashboardHome()]);
      resetGroupForm();
      setSuccessMessage("Group deleted.");
    } catch (error) {
      setGlobalError(error.message || "Could not delete group.");
    } finally {
      setGroupSaving(false);
    }
  }

  if (bootLoading || !sessionChecked) {
    return (
      <div className="admin-loading-screen">
        <style>{styles}</style>
        <div className="loading-card">Loading admin…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-screen">
        <style>{styles}</style>
        <div className="login-shell">
          <div className="login-card">
            <div className="eyebrow">Clocked Admin</div>
            <h1 className="login-title">Admin Login</h1>
            <p className="login-subtitle">Sign in to manage product configuration and admin tools.</p>

            {globalError ? <div className="banner error">{globalError}</div> : null}

            <form onSubmit={handleLogin}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="admin@clocked.in"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </label>

              <button className="primary-btn full" type="submit" disabled={loginLoading}>
                {loginLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <style>{styles}</style>

      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">Clocked Admin</div>
            <div className="brand-sub">Control layer</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {ADMIN_ROUTES.map((route) => (
            <button
              key={route.key}
              className={cx("nav-item", activeRoute === route.key && "active", route.disabled && "disabled")}
              onClick={() => {
                console.log("Route clicked:", route.key);
                console.log("Current route:", activeRoute);
                console.log("Setting activeRoute to:", route.key);
                !route.disabled && setActiveRoute(route.key);
              }}
              disabled={route.disabled}
            >
              <span className="nav-icon">{route.icon}</span>
              <span>{route.label}</span>
              {route.disabled ? <span className="soon-badge">Soon</span> : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <div className="eyebrow">Admin</div>
            <h1 className="page-title">
              {activeRoute === "dashboard" ? "Dashboard Home" : 
               activeRoute === "meta-groups" ? "Meta Groups" :
               activeRoute === "meta-items" ? "Meta Items" :
               activeRoute === "content" ? "Content Blocks" :
               activeRoute === "notifications" ? "Notifications" :
               activeRoute === "widgets" ? "Widgets" :
               activeRoute === "settings-fields" ? "Settings Fields" :
               "Admin"}
            </h1>
          </div>
          <div className="topbar-right">
            <div className="admin-chip">
              <span className="admin-avatar">{(adminUser?.name || adminUser?.email || "A").charAt(0).toUpperCase()}</span>
              <div>
                <div className="admin-name">{adminUser?.name || "Admin"}</div>
                <div className="admin-email">{adminUser?.email || "admin"}</div>
              </div>
            </div>
            <button className="secondary-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="content-area">
          {globalError ? <div className="banner error">{globalError}</div> : null}
          {successMessage ? <div className="banner success">{successMessage}</div> : null}

          {activeRoute === "dashboard" ? (
            <section className="main-content">
              <div className="page-header">
                <h1>{ADMIN_ROUTES.find(r => r.key === activeRoute)?.label || "Dashboard"}</h1>
              </div>

              <div className="content">
                {console.log("Rendering main content, activeRoute:", activeRoute)}
                {console.log("Available routes:", ADMIN_ROUTES.map(r => r.key))}
                Dashboard analytics and overview coming soon.
              </div>
            </section>
          ) : null}

          {activeRoute === "dashboard" ? (
            <>
              <div className="card">
                <div className="card-header-row">
                  <h2>Quick Actions</h2>
                </div>
                <div className="quick-actions">
                  <button className="quick-action" onClick={() => setActiveRoute("users")}>Manage Users</button>
                  <button className="quick-action" onClick={() => setActiveRoute("meta-groups")}>+ Create meta group</button>
                  <button className="quick-action" onClick={() => setActiveRoute("meta-items")}>+ Create meta item</button>
                  <button className="quick-action" onClick={() => setActiveRoute("content")}>+ Create content block</button>
                </div>
              </div>

              <div className="card">
                <div className="card-header-row">
                  <h2>Recent Edits</h2>
                </div>
                {dashboardStats.recentEdits.length ? (
                  <div className="recent-list">
                    {dashboardStats.recentEdits.map((item, index) => (
                      <div key={`${item.collection}-${index}`} className="recent-item">
                        <div className="recent-title">{item.label || item.key || item.collection}</div>
                        <div className="recent-sub">{item.collection} · {item.updated_at ? new Date(item.updated_at).toLocaleString() : "Recently updated"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-note">No recent edits available yet.</div>
                )}
              </div>
            </>
          ) : null}

          {activeRoute === "users-overview" ? (
            <AdminUsersOverviewPage />
          ) : null}

          {activeRoute === "users" ? (
            <AdminUsersPage />
          ) : null}

          {activeRoute === "handles" ? (
            <AdminHandlesPage />
          ) : null}

          {activeRoute === "flags" ? (
            <AdminFlagsPage />
          ) : null}

          {activeRoute === "search-logs" ? (
            (() => {
              console.log("Rendering search-logs component, activeRoute:", activeRoute);
              return <AdminSearchLogsTrendingPage />;
            })()
          ) : null}

          {activeRoute === "watchlists" ? (
            (() => {
              console.log("Rendering watchlists component, activeRoute:", activeRoute);
              console.log("Watchlists route matched!");
              return <AdminWatchlistPage />;
            })()
          ) : null}

          {activeRoute === "meta-groups" ? (
            <AdminMetaGroupsPage />
          ) : null}
          {activeRoute === "simple-watchlist" ? (
            (() => {
              console.log("Rendering simple-watchlist component, activeRoute:", activeRoute);
              return <SimpleWatchlistTest />;
            })()
          ) : null}

          {activeRoute === "watchlist-subs" ? (
            (() => {
              console.log("Rendering watchlist-subs component, activeRoute:", activeRoute);
              return <AdminWatchlistSubscriptionsPage />;
            })()
          ) : null}

          {activeRoute === "activity" ? (
            (() => {
              console.log("Rendering activity component, activeRoute:", activeRoute);
              return <AdminActivityPage />;
            })()
          ) : null}

          {activeRoute === "operations" ? (
            (() => {
              console.log("Rendering operations component, activeRoute:", activeRoute);
              return <AdminOperationsPage />;
            })()
          ) : null}

          {activeRoute === "access-control" ? (
            (() => {
              console.log("Rendering access-control component, activeRoute:", activeRoute);
              return <AdminAccessControlPage />;
            })()
          ) : null}

          {activeRoute === "widgets" ? (
            <AdminDashboardWidgetsPage />
          ) : null}

          {activeRoute === "settings-fields" ? (
            <AdminSettingsFieldsPage />
          ) : null}
        </section>
      </main>
    </div>
  );
}

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f8f7f3; color: #0c0c0a; }
  .admin-loading-screen, .admin-login-screen { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
  .loading-card, .login-card { width: 100%; max-width: 460px; background: #fff; border: 1px solid #e5e4de; border-radius: 24px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.05); }
  .login-shell { width: 100%; max-width: 520px; }
  .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 1.3px; color: #9e9d97; font-weight: 700; margin-bottom: 8px; }
  .login-title, .page-title { margin: 0; font-size: 30px; line-height: 1.05; }
  .login-subtitle { margin: 8px 0 0; color: #5e5d58; font-size: 14px; line-height: 1.6; }
  .field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .field span { font-size: 13px; font-weight: 700; color: #5e5d58; }
  input, textarea, select { width: 100%; border: 1.5px solid #cccbc4; border-radius: 14px; padding: 12px 14px; font: inherit; color: #0c0c0a; background: #fff; outline: none; }
  textarea { resize: vertical; }
  input:focus, textarea:focus, select:focus { border-color: #0c0c0a; box-shadow: 0 0 0 3px rgba(0,0,0,.05); }
  .primary-btn, .secondary-btn, .danger-btn, .quick-action { border: none; border-radius: 14px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
  .primary-btn { background: #0c0c0a; color: #fff; }
  .primary-btn.full { width: 100%; margin-top: 8px; }
  .secondary-btn { background: #f2f1ec; color: #0c0c0a; border: 1px solid #cccbc4; }
  .danger-btn { background: #fff0f0; color: #e2353a; border: 1px solid #ffbdbe; }
  .banner { border-radius: 14px; padding: 12px 14px; font-size: 14px; margin-bottom: 14px; }
  .banner.error { background: #fff0f0; color: #a91d22; border: 1px solid #ffbdbe; }
  .banner.success { background: #f0fff8; color: #1a9e5f; border: 1px solid #a3e6c8; }
  .admin-shell { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr; }
  .sidebar { background: #0c0c0a; color: #fff; padding: 20px 16px; display: flex; flex-direction: column; }
  .brand-block { display: flex; align-items: center; gap: 12px; padding: 8px 10px 18px; border-bottom: 1px solid rgba(255,255,255,.09); margin-bottom: 18px; }
  .brand-mark { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(135deg,#e2353a,#ff8a65); font-weight: 800; }
  .brand-name { font-size: 16px; font-weight: 800; }
  .brand-sub { font-size: 12px; color: rgba(255,255,255,.55); margin-top: 2px; }
  .sidebar-nav { display: flex; flex-direction: column; gap: 8px; }
  .nav-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 12px; background: transparent; border: 1px solid transparent; color: rgba(255,255,255,.82); border-radius: 14px; cursor: pointer; text-align: left; }
  .nav-item.active { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.14); }
  .nav-item.disabled { opacity: .55; cursor: not-allowed; }
  .nav-icon { width: 20px; text-align: center; }
  .soon-badge { margin-left: auto; font-size: 11px; background: rgba(255,255,255,.14); padding: 4px 8px; border-radius: 999px; }
  .main-panel { display: flex; flex-direction: column; min-width: 0; }
  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 24px; border-bottom: 1px solid #e5e4de; background: rgba(248,247,243,.92); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 10; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .admin-chip { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e5e4de; padding: 8px 10px; border-radius: 16px; }
  .admin-avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #0c0c0a; color: #fff; font-weight: 800; }
  .admin-name { font-size: 13px; font-weight: 700; }
  .admin-email { font-size: 12px; color: #5e5d58; }
  .content-area { padding: 24px; }
  .dashboard-grid, .meta-groups-layout { display: grid; gap: 18px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .stat-card, .card { background: #fff; border: 1px solid #e5e4de; border-radius: 20px; padding: 18px; }
  .stat-label { font-size: 13px; color: #5e5d58; margin-bottom: 8px; }
  .stat-value { font-size: 36px; font-weight: 800; line-height: 1; }
  .success-text { color: #1a9e5f; }
  .muted-text { color: #9e9d97; }
  .card-header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .card-header-row h2 { margin: 0; font-size: 18px; }
  .quick-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  .quick-action { background: #0c0c0a; color: #fff; }
  .quick-action.muted { background: #f2f1ec; color: #5e5d58; border: 1px solid #e5e4de; }
  .recent-list { display: flex; flex-direction: column; gap: 10px; }
  .recent-item { border: 1px solid #f0efea; background: #faf9f6; border-radius: 14px; padding: 12px 14px; }
  .recent-title { font-weight: 700; }
  .recent-sub, .empty-note { font-size: 13px; color: #5e5d58; }
  .meta-groups-layout { grid-template-columns: minmax(320px, 460px) minmax(0, 1fr); align-items: start; }
  .list-card { min-height: 540px; }
  .filters-row { display: grid; grid-template-columns: 1fr 140px; gap: 10px; margin-bottom: 14px; }
  .search-input { padding: 11px 12px; }
  .record-list { display: flex; flex-direction: column; gap: 10px; max-height: 560px; overflow: auto; }
  .record-item { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e5e4de; background: #f8f7f3; border-radius: 16px; padding: 12px 14px; cursor: pointer; text-align: left; }
  .record-item.selected { border-color: #0c0c0a; background: #f2f1ec; }
  .record-title { font-size: 14px; font-weight: 700; color: #0c0c0a; }
  .record-sub { font-size: 12px; color: #5e5d58; margin-top: 4px; }
  .status-pill { border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 700; }
  .status-pill.active { background: #f0fff8; color: #1a9e5f; }
  .status-pill.inactive { background: #f2f1ec; color: #5e5d58; }
  .form-card { min-height: 540px; }
  .row-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .checkbox-field { display: flex; align-items: center; gap: 10px; margin-top: 30px; font-size: 14px; color: #0c0c0a; }
  .checkbox-field input { width: 16px; height: 16px; }
  .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  @media (max-width: 1100px) {
    .admin-shell { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .stats-grid, .meta-groups-layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 700px) {
    .topbar { padding: 16px; flex-direction: column; align-items: flex-start; }
    .content-area { padding: 16px; }
    .filters-row, .row-2 { grid-template-columns: 1fr; }
    .topbar-right { width: 100%; justify-content: space-between; }
  }
`;