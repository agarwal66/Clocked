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
  group_key: "",
  key: "",
  label: "",
  short_label: "",
  description: "",
  icon: "",
  color_token: "black",
  route: "",
  parent_key: "",
  sort_order: 1,
  active: true,
  editable: true,
  system_key: true,
  visible_mobile: true,
  visible_desktop: true,
  metadata: "{}",
};

const COLOR_OPTIONS = ["black", "red", "green", "amber", "gray"];

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

export default function AdminMetaItemsPage() {
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 1800);
    return () => clearTimeout(t);
  }, [success]);

  async function boot() {
    setLoading(true);
    setError("");
    try {
      const [groupsRes, itemsRes] = await Promise.all([
        api("http://localhost:5004/api/admin/meta/groups"),
        api("http://localhost:5004/api/admin/meta/items"),
      ]);
      setGroups((groupsRes.groups || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setItems((itemsRes.items || []).sort((a, b) => {
        if ((a.group_key || "") !== (b.group_key || "")) return (a.group_key || "").localeCompare(b.group_key || "");
        return (a.sort_order || 0) - (b.sort_order || 0);
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setItemsLoading(false);
    }
  }

  async function loadItems() {
    setItemsLoading(true);
    setError("");
    try {
      const data = await api("http://localhost:5004/api/admin/meta/items");
      setItems((data.items || []).sort((a, b) => {
        if ((a.group_key || "") !== (b.group_key || "")) return (a.group_key || "").localeCompare(b.group_key || "");
        return (a.sort_order || 0) - (b.sort_order || 0);
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setItemsLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || item.label?.toLowerCase().includes(s)
        || item.key?.toLowerCase().includes(s)
        || item.group_key?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && item.active) || (status === "inactive" && !item.active);
      const okGroup = groupFilter === "all" || item.group_key === groupFilter;
      return okSearch && okStatus && okGroup;
    });
  }, [items, search, status, groupFilter]);

  const groupedFiltered = useMemo(() => {
    return filtered.reduce((acc, item) => {
      if (!acc[item.group_key]) acc[item.group_key] = [];
      acc[item.group_key].push(item);
      return acc;
    }, {});
  }, [filtered]);

  function select(item) {
    setSelectedId(item._id);
    setForm({
      group_key: item.group_key || "",
      key: item.key || "",
      label: item.label || "",
      short_label: item.short_label || "",
      description: item.description || "",
      icon: item.icon || "",
      color_token: item.color_token || "black",
      route: item.route || "",
      parent_key: item.parent_key || "",
      sort_order: item.sort_order || 1,
      active: !!item.active,
      editable: item.editable !== false,
      system_key: item.system_key !== false,
      visible_mobile: item.visible_mobile !== false,
      visible_desktop: item.visible_desktop !== false,
      metadata: prettyJson(item.metadata),
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
      let metadata = {};
      try {
        metadata = parseJson(form.metadata);
      } catch {
        throw new Error("Metadata must be valid JSON");
      }

      const payload = {
        group_key: form.group_key.trim(),
        key: form.key.trim(),
        label: form.label.trim(),
        short_label: form.short_label.trim() || null,
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        color_token: form.color_token,
        route: form.route.trim() || null,
        parent_key: form.parent_key.trim() || null,
        sort_order: Number(form.sort_order || 1),
        active: !!form.active,
        editable: !!form.editable,
        system_key: !!form.system_key,
        visible_mobile: !!form.visible_mobile,
        visible_desktop: !!form.visible_desktop,
        metadata,
      };

      if (!payload.group_key || !payload.key || !payload.label) {
        throw new Error("Group, key and label are required");
      }

      if (selectedId) {
        await api(`http://localhost:5004/api/admin/meta/items/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("Meta item updated");
      } else {
        await api(`http://localhost:5004/api/admin/meta/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Meta item created");
      }

      await loadItems();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedId) return;
    if (!window.confirm("Delete this meta item?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/meta/items/${selectedId}`, { method: "DELETE" });
      setSuccess("Meta item deleted");
      await loadItems();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="meta-items-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Meta Items</h2>
        <button className="btn" onClick={reset}>New</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters filters-3">
            <input placeholder="Search by label, key, group" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="all">All groups</option>
              {groups.map((g) => (
                <option key={g._id} value={g.key}>{g.label}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading || itemsLoading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="group-list-wrap">
              {Object.keys(groupedFiltered).sort().map((groupKey) => (
                <div key={groupKey} className="group-block">
                  <div className="group-head">{groups.find((g) => g.key === groupKey)?.label || groupKey}</div>
                  <div className="list">
                    {groupedFiltered[groupKey].map((item) => (
                      <button key={item._id} className={"item " + (selectedId === item._id ? "sel" : "")} onClick={() => select(item)}>
                        <div>
                          <div className="title">{item.icon ? `${item.icon} ` : ""}{item.label}</div>
                          <div className="sub">{item.group_key} / {item.key}</div>
                        </div>
                        <span className={"pill " + (item.active ? "a" : "i")}>{item.active ? "Active" : "Inactive"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No items</div>
          )}
        </div>

        <form className="card form-card" onSubmit={save}>
          <div className="form-head">
            <h3>{selectedId ? "Edit Meta Item" : "Create Meta Item"}</h3>
            {selectedId ? <button type="button" className="danger" onClick={remove}>Delete</button> : null}
          </div>

          <div className="row row-2">
            <label>
              <span>Group</span>
              <select value={form.group_key} onChange={(e) => setForm((s) => ({ ...s, group_key: e.target.value }))}>
                <option value="">Select group</option>
                {groups.map((g) => (
                  <option key={g._id} value={g.key}>{g.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Color Token</span>
              <select value={form.color_token} onChange={(e) => setForm((s) => ({ ...s, color_token: e.target.value }))}>
                {COLOR_OPTIONS.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>
          </div>

          <div className="row row-2">
            <label>
              <span>Key</span>
              <input value={form.key} disabled={!!selectedId} onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))} placeholder="date" />
            </label>
            <label>
              <span>Label</span>
              <input value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} placeholder="Going on a date" />
            </label>
          </div>

          <div className="row row-2">
            <label>
              <span>Short Label</span>
              <input value={form.short_label} onChange={(e) => setForm((s) => ({ ...s, short_label: e.target.value }))} placeholder="Date" />
            </label>
            <label>
              <span>Icon</span>
              <input value={form.icon} onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))} placeholder="👀" />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </label>

          <div className="row row-2">
            <label>
              <span>Route</span>
              <input value={form.route} onChange={(e) => setForm((s) => ({ ...s, route: e.target.value }))} placeholder="/dashboard" />
            </label>
            <label>
              <span>Parent Key</span>
              <input value={form.parent_key} onChange={(e) => setForm((s) => ({ ...s, parent_key: e.target.value }))} placeholder="optional" />
            </label>
          </div>

          <label>
            <span>Metadata (JSON)</span>
            <textarea className="code" rows={8} value={form.metadata} onChange={(e) => setForm((s) => ({ ...s, metadata: e.target.value }))} spellCheck={false} />
          </label>

          <div className="row row-3">
            <label>
              <span>Sort</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((s) => ({ ...s, sort_order: e.target.value }))} />
            </label>
            <label className="chk"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
            <label className="chk"><input type="checkbox" checked={form.editable} onChange={(e) => setForm((s) => ({ ...s, editable: e.target.checked }))} /><span>Editable</span></label>
          </div>

          <div className="row row-2">
            <label className="chk"><input type="checkbox" checked={form.system_key} onChange={(e) => setForm((s) => ({ ...s, system_key: e.target.checked }))} /><span>System Key</span></label>
            <label className="chk"><input type="checkbox" checked={form.visible_mobile} onChange={(e) => setForm((s) => ({ ...s, visible_mobile: e.target.checked }))} /><span>Visible Mobile</span></label>
          </div>

          <div className="row row-2 last-row">
            <label className="chk"><input type="checkbox" checked={form.visible_desktop} onChange={(e) => setForm((s) => ({ ...s, visible_desktop: e.target.checked }))} /><span>Visible Desktop</span></label>
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
  .filters-3{grid-template-columns:1fr 150px 120px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .group-list-wrap{display:flex;flex-direction:column;gap:14px;max-height:640px;overflow:auto}
  .group-head{font-size:12px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:.7px}
  .list{display:flex;flex-direction:column;gap:8px;margin-top:6px}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer;text-align:left}
  .item.sel{border-color:#000;background:#f2f1ec}
  .title{font-weight:700}
  .sub{font-size:12px;color:#666}
  .pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.a{background:#ecfff5;color:#1a9e5f}
  .pill.i{background:#f2f1ec;color:#666}
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
  @media(max-width:1200px){.grid{grid-template-columns:1fr}.filters-3{grid-template-columns:1fr}.row-2,.row-3{grid-template-columns:1fr}}
`;
