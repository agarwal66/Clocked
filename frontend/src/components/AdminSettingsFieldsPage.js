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
  group_key: "notifications",
  label: "",
  subtitle: "",
  field_type: "toggle",
  active: true,
  sort_order: 1,
  metadata: "{}",
};

const FIELD_TYPES = ["toggle", "text", "textarea", "select", "number", "json"];

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

export default function AdminSettingsFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

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
      const data = await api("http://localhost:5004/api/admin/meta/settings-fields");
      setFields((data.settingsFields || []).sort((a, b) => {
        if ((a.group_key || "") !== (b.group_key || "")) return (a.group_key || "").localeCompare(b.group_key || "");
        return (a.sort_order || 0) - (b.sort_order || 0);
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const groupOptions = useMemo(() => {
    return [...new Set(fields.map((f) => f.group_key).filter(Boolean))].sort();
  }, [fields]);

  const filtered = useMemo(() => {
    return fields.filter((f) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || f.label?.toLowerCase().includes(s)
        || f.key?.toLowerCase().includes(s)
        || f.group_key?.toLowerCase().includes(s)
        || f.subtitle?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && f.active) || (status === "inactive" && !f.active);
      const okGroup = groupFilter === "all" || f.group_key === groupFilter;
      return okSearch && okStatus && okGroup;
    });
  }, [fields, search, status, groupFilter]);

  const groupedFiltered = useMemo(() => {
    return filtered.reduce((acc, item) => {
      if (!acc[item.group_key]) acc[item.group_key] = [];
      acc[item.group_key].push(item);
      return acc;
    }, {});
  }, [filtered]);

  function select(field) {
    setSelectedId(field._id);
    setForm({
      key: field.key || "",
      group_key: field.group_key || "notifications",
      label: field.label || "",
      subtitle: field.subtitle || "",
      field_type: field.field_type || "toggle",
      active: !!field.active,
      sort_order: field.sort_order || 1,
      metadata: prettyJson(field.metadata),
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
        key: form.key.trim(),
        group_key: form.group_key.trim(),
        label: form.label.trim(),
        subtitle: form.subtitle.trim() || null,
        field_type: form.field_type,
        active: !!form.active,
        sort_order: Number(form.sort_order || 1),
        metadata: parseJson(form.metadata),
      };

      if (!payload.key || !payload.group_key || !payload.label) {
        throw new Error("Key, group key and label are required");
      }

      if (selectedId) {
        await api(`http://localhost:5004/api/admin/meta/settings-fields/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("Settings field updated");
      } else {
        await api(`http://localhost:5004/api/admin/meta/settings-fields`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Settings field created");
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
    if (!window.confirm("Delete this settings field?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/meta/settings-fields/${selectedId}`, { method: "DELETE" });
      setSuccess("Settings field deleted");
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-fields-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Settings Fields</h2>
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
              {groupOptions.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="group-list-wrap">
              {Object.keys(groupedFiltered).sort().map((groupKey) => (
                <div key={groupKey} className="group-block">
                  <div className="group-head">{groupKey}</div>
                  <div className="list">
                    {groupedFiltered[groupKey].map((field) => (
                      <button key={field._id} className={"item " + (selectedId === field._id ? "sel" : "")} onClick={() => select(field)}>
                        <div>
                          <div className="title">{field.label}</div>
                          <div className="sub">{field.group_key} / {field.key}</div>
                        </div>
                        <div className="item-right">
                          <span className="type-pill">{field.field_type || "toggle"}</span>
                          <span className={"pill " + (field.active ? "a" : "i")}>{field.active ? "Active" : "Inactive"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No settings fields</div>
          )}
        </div>

        <form className="card form-card" onSubmit={save}>
          <div className="form-head">
            <h3>{selectedId ? "Edit Settings Field" : "Create Settings Field"}</h3>
            {selectedId ? <button type="button" className="danger" onClick={remove}>Delete</button> : null}
          </div>

          <div className="row row-2">
            <label>
              <span>Key</span>
              <input value={form.key} disabled={!!selectedId} onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))} placeholder="notif.handle_searched" />
            </label>
            <label>
              <span>Group Key</span>
              <input value={form.group_key} onChange={(e) => setForm((s) => ({ ...s, group_key: e.target.value }))} placeholder="notifications" />
            </label>
          </div>

          <div className="row row-2">
            <label>
              <span>Label</span>
              <input value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} placeholder="Someone searched my handle" />
            </label>
            <label>
              <span>Field Type</span>
              <select value={form.field_type} onChange={(e) => setForm((s) => ({ ...s, field_type: e.target.value }))}>
                {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span>Subtitle</span>
            <textarea rows={3} value={form.subtitle} onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))} placeholder="Optional helper copy" />
          </label>

          <div className="row row-2">
            <label>
              <span>Sort Order</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((s) => ({ ...s, sort_order: e.target.value }))} />
            </label>
            <label className="chk">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
              <span>Active</span>
            </label>
          </div>

          <label>
            <span>Metadata (JSON)</span>
            <textarea className="code" rows={8} value={form.metadata} onChange={(e) => setForm((s) => ({ ...s, metadata: e.target.value }))} spellCheck={false} />
          </label>

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
  .filters-3{grid-template-columns:1fr 160px 120px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .group-list-wrap{display:flex;flex-direction:column;gap:14px;max-height:640px;overflow:auto}
  .group-head{font-size:12px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:.7px}
  .list{display:flex;flex-direction:column;gap:8px;margin-top:6px}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer;text-align:left}
  .item.sel{border-color:#000;background:#f2f1ec}
  .item-right{display:flex;align-items:center;gap:8px}
  .title{font-weight:700}
  .sub{font-size:12px;color:#666}
  .pill,.type-pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.a{background:#ecfff5;color:#1a9e5f}
  .pill.i{background:#f2f1ec;color:#666}
  .type-pill{background:#eef3ff;color:#3355aa}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:grid;gap:10px}
  .row-2{grid-template-columns:1fr 1fr}
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
  @media(max-width:1200px){.grid{grid-template-columns:1fr}.filters-3{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}}
`;
