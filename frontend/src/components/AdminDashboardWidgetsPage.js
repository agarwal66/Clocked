import React, { useEffect, useMemo, useState } from "react";

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

const DEFAULT_FORM = {
  key: "",
  label: "",
  description: "",
  icon: "",
  sort_order: 1,
  active: true,
  visible_mobile: true,
  visible_desktop: true,
  metadata: "{}",
};

function prettyJson(value) {
  try {
    if (!value) return "{}";
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return "{}";
  }
}

function parseJson(value) {
  if (!value || !value.trim()) return {};
  return JSON.parse(value);
}

export default function AdminDashboardWidgetsPage() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
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
      const data = await api("http://localhost:5004/api/admin/meta/dashboard-widgets");
      setWidgets((data.widgets || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return widgets.filter((w) => {
      const s = search.toLowerCase();
      const okSearch = !s || w.label?.toLowerCase().includes(s) || w.key?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && w.active) || (status === "inactive" && !w.active);
      return okSearch && okStatus;
    });
  }, [widgets, search, status]);

  function select(w) {
    setSelectedId(w._id);
    setForm({
      key: w.key,
      label: w.label,
      description: w.description || "",
      icon: w.icon || "",
      sort_order: w.sort_order || 1,
      active: !!w.active,
      visible_mobile: !!w.visible_mobile,
      visible_desktop: !!w.visible_desktop,
      metadata: prettyJson(w.metadata),
    });
  }

  function reset() {
    setSelectedId(null);
    setForm(DEFAULT_FORM);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        key: form.key.trim(),
        label: form.label.trim(),
        sort_order: Number(form.sort_order || 1),
        metadata: parseJson(form.metadata),
      };

      if (!payload.key || !payload.label) {
        throw new Error("Key and label are required");
      }

      if (selectedId) {
        await api(`http://localhost:5004/api/admin/meta/dashboard-widgets/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("Widget updated");
      } else {
        await api(`http://localhost:5004/api/admin/meta/dashboard-widgets`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Widget created");
      }

      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedId) return;
    if (!window.confirm("Delete this widget?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/meta/dashboard-widgets/${selectedId}`, { method: "DELETE" });
      setSuccess("Widget deleted");
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-widgets-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Dashboard Widgets</h2>
        <button className="btn" onClick={reset}>New</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters filters-2">
            <input placeholder="Search by label or key" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((w) => (
                <button key={w._id} className={"item " + (selectedId === w._id ? "sel" : "")} onClick={() => select(w)}>
                  <div>
                    <div className="title">{w.icon ? `${w.icon} ` : ""}{w.label}</div>
                    <div className="sub">{w.key}</div>
                  </div>
                  <div className="item-right">
                    <span className="visibility-pill">
                      {w.visible_mobile && w.visible_desktop ? "📱💻" : w.visible_mobile ? "📱" : w.visible_desktop ? "💻" : "🚫"}
                    </span>
                    <span className={"pill " + (w.active ? "a" : "i")}>{w.active ? "Active" : "Inactive"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No widgets</div>
          )}
        </div>

        <form className="card form-card" onSubmit={save}>
          <div className="form-head">
            <h3>{selectedId ? "Edit Widget" : "Create Widget"}</h3>
            {selectedId ? <button type="button" className="danger" onClick={remove}>Delete</button> : null}
          </div>

          <div className="row row-2">
            <label>
              <span>Key</span>
              <input value={form.key} disabled={!!selectedId} onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))} placeholder="stats_overview" />
            </label>
            <label>
              <span>Label</span>
              <input value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} placeholder="Stats Overview" />
            </label>
          </div>

          <div className="row row-2">
            <label>
              <span>Icon</span>
              <input value={form.icon} onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))} placeholder="📊" />
            </label>
            <label>
              <span>Sort Order</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((s) => ({ ...s, sort_order: e.target.value }))} />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Widget description for admin reference" />
          </label>

          <label>
            <span>Metadata (JSON)</span>
            <textarea className="code" rows={6} value={form.metadata} onChange={(e) => setForm((s) => ({ ...s, metadata: e.target.value }))} spellCheck={false} />
          </label>

          <div className="row row-3 last-row">
            <label className="chk"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
            <label className="chk"><input type="checkbox" checked={form.visible_mobile} onChange={(e) => setForm((s) => ({ ...s, visible_mobile: e.target.checked }))} /><span>Mobile</span></label>
            <label className="chk"><input type="checkbox" checked={form.visible_desktop} onChange={(e) => setForm((s) => ({ ...s, visible_desktop: e.target.checked }))} /><span>Desktop</span></label>
          </div>

          <div className="actions">
            <button type="button" className="btn" onClick={reset}>Reset</button>
            <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : selectedId ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:460px 1fr;gap:16px}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .filters{display:grid;gap:8px;margin-bottom:10px}
  .filters-2{grid-template-columns:1fr 120px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .list{display:flex;flex-direction:column;gap:8px;max-height:640px;overflow:auto}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer;text-align:left}
  .item.sel{border-color:#000;background:#f2f1ec}
  .item-right{display:flex;align-items:center;gap:8px}
  .title{font-weight:700}
  .sub{font-size:12px;color:#666}
  .pill,.visibility-pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.a{background:#ecfff5;color:#1a9e5f}
  .pill.i{background:#f2f1ec;color:#666}
  .visibility-pill{background:#f2f1ec;color:#444}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:grid;gap:10px}
  .row-2{grid-template-columns:1fr 1fr}
  .row-3{grid-template-columns:1fr 1fr 1fr}
  .chk{flex-direction:row;align-items:center;gap:8px;margin-top:22px}
  .code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
  .actions{display:flex;justify-content:flex-end;gap:8px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}
  .btn.primary{background:#000;color:#fff;border-color:#000}
  .danger{border:1px solid #ffbcbc;background:#fff0f0;color:#c62828;border-radius:10px;padding:6px 10px}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}
  .banner.error{background:#fff0f0;color:#a11}
  .banner.success{background:#ecfff5;color:#1a9e5f}
  .empty{color:#666;padding:10px}
  @media(max-width:1200px){.grid{grid-template-columns:1fr}.filters-2{grid-template-columns:1fr}.row-2,.row-3{grid-template-columns:1fr}}
`;
