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
  sort_order: 1,
  active: true,
};

export default function AdminMetaGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
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
      const data = await api("http://localhost:5004/api/admin/meta/groups");
      setGroups((data.groups || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s || g.label?.toLowerCase().includes(s) || g.key?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && g.active) || (status === "inactive" && !g.active);
      return okSearch && okStatus;
    });
  }, [groups, search, status]);

  function select(g) {
    setSelectedId(g._id);
    setForm({
      key: g.key || "",
      label: g.label || "",
      description: g.description || "",
      sort_order: g.sort_order || 1,
      active: !!g.active,
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
        label: form.label.trim(),
        description: form.description?.trim() || null,
        sort_order: Number(form.sort_order || 1),
        active: !!form.active,
      };
      if (!payload.key || !payload.label) throw new Error("Key and label are required");

      if (selectedId) {
        await api(`http://localhost:5004/api/admin/meta/groups/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("Group updated");
      } else {
        await api(`http://localhost:5004/api/admin/meta/groups`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Group created");
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
    if (!window.confirm("Delete this group?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/meta/groups/${selectedId}`, { method: "DELETE" });
      setSuccess("Group deleted");
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="meta-groups-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Meta Groups</h2>
        <button className="btn" onClick={reset}>New</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters">
            <input placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <select value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((g) => (
                <button key={g._id} className={"item " + (selectedId===g._id?"sel":"")} onClick={()=>select(g)}>
                  <div>
                    <div className="title">{g.label}</div>
                    <div className="sub">{g.key}</div>
                  </div>
                  <span className={"pill " + (g.active?"a":"i")}>{g.active?"Active":"Inactive"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No groups</div>
          )}
        </div>

        <form className="card" onSubmit={save}>
          <div className="form-head">
            <h3>{selectedId?"Edit Group":"Create Group"}</h3>
            {selectedId ? <button type="button" className="danger" onClick={remove}>Delete</button> : null}
          </div>

          <label>
            <span>Key</span>
            <input value={form.key} disabled={!!selectedId} onChange={(e)=>setForm(s=>({...s,key:e.target.value}))} placeholder="search_reasons" />
          </label>

          <label>
            <span>Label</span>
            <input value={form.label} onChange={(e)=>setForm(s=>({...s,label:e.target.value}))} />
          </label>

          <label>
            <span>Description</span>
            <textarea rows={4} value={form.description} onChange={(e)=>setForm(s=>({...s,description:e.target.value}))} />
          </label>

          <div className="row">
            <label>
              <span>Sort</span>
              <input type="number" value={form.sort_order} onChange={(e)=>setForm(s=>({...s,sort_order:e.target.value}))} />
            </label>
            <label className="chk">
              <input type="checkbox" checked={form.active} onChange={(e)=>setForm(s=>({...s,active:e.target.checked}))} />
              <span>Active</span>
            </label>
          </div>

          <div className="actions">
            <button type="button" className="btn" onClick={reset}>Reset</button>
            <button type="submit" className="btn primary" disabled={saving}>{saving?"Saving…": selectedId?"Update":"Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:420px 1fr;gap:16px}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .filters{display:grid;grid-template-columns:1fr 120px;gap:8px;margin-bottom:10px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .list{display:flex;flex-direction:column;gap:8px;max-height:520px;overflow:auto}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer}
  .item.sel{border-color:#000;background:#f2f1ec}
  .title{font-weight:700}
  .sub{font-size:12px;color:#666}
  .pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.a{background:#ecfff5;color:#1a9e5f}
  .pill.i{background:#f2f1ec;color:#666}
  .form-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  label{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .chk{flex-direction:row;align-items:center;gap:8px;margin-top:22px}
  .actions{display:flex;justify-content:flex-end;gap:8px}
  .btn{border:1px solid #d2d0c8;background:#f2f1ec;border-radius:10px;padding:8px 12px;cursor:pointer}
  .btn.primary{background:#000;color:#fff;border-color:#000}
  .danger{border:1px solid #ffbcbc;background:#fff0f0;color:#c62828;border-radius:10px;padding:6px 10px}
  .banner{padding:8px 10px;border-radius:10px;margin-bottom:10px}
  .banner.error{background:#fff0f0;color:#a11}
  .banner.success{background:#ecfff5;color:#1a9e5f}
  .empty{color:#666;padding:10px}
  @media(max-width:1000px){.grid{grid-template-columns:1fr}}
`;
