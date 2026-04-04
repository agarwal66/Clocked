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
  page: "dashboard",
  block_key: "",
  label: "",
  content: "",
  content_type: "text",
  description: "",
  active: true,
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

export default function AdminContentBlocksPage() {
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [search, setSearch] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
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
      const data = await api("http://localhost:5004/api/admin/meta/content-blocks");
      setBlocks((data.contentBlocks || []).sort((a, b) => {
        if ((a.page || "") !== (b.page || "")) return (a.page || "").localeCompare(b.page || "");
        return (a.block_key || "").localeCompare(b.block_key || "");
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const pageOptions = useMemo(() => {
    return [...new Set(blocks.map((b) => b.page).filter(Boolean))].sort();
  }, [blocks]);

  const filtered = useMemo(() => {
    return blocks.filter((b) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || b.label?.toLowerCase().includes(s)
        || b.block_key?.toLowerCase().includes(s)
        || b.page?.toLowerCase().includes(s)
        || b.content?.toLowerCase().includes(s);
      const okPage = pageFilter === "all" || b.page === pageFilter;
      const okStatus = status === "all" || (status === "active" && b.active) || (status === "inactive" && !b.active);
      return okSearch && okPage && okStatus;
    });
  }, [blocks, search, pageFilter, status]);

  const groupedFiltered = useMemo(() => {
    return filtered.reduce((acc, item) => {
      if (!acc[item.page]) acc[item.page] = [];
      acc[item.page].push(item);
      return acc;
    }, {});
  }, [filtered]);

  function select(block) {
    setSelectedId(block._id);
    setForm({
      page: block.page || "dashboard",
      block_key: block.block_key || "",
      label: block.label || "",
      content: block.content || "",
      content_type: block.content_type || "text",
      description: block.description || "",
      active: !!block.active,
      metadata: prettyJson(block.metadata),
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
        page: form.page.trim().toLowerCase(),
        block_key: form.block_key.trim().toLowerCase(),
        label: form.label.trim(),
        content: form.content,
        content_type: form.content_type.trim() || "text",
        description: form.description.trim() || null,
        active: !!form.active,
        metadata,
      };

      if (!payload.page || !payload.block_key || !payload.label || !payload.content) {
        throw new Error("Page, block key, label and content are required");
      }

      if (selectedId) {
        await api(`http://localhost:5004/api/admin/meta/content-blocks/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("Content block updated");
      } else {
        await api(`http://localhost:5004/api/admin/meta/content-blocks`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Content block created");
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
    if (!window.confirm("Delete this content block?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/meta/content-blocks/${selectedId}`, { method: "DELETE" });
      setSuccess("Content block deleted");
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-blocks-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Content Blocks</h2>
        <button className="btn" onClick={reset}>New</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters filters-3">
            <input placeholder="Search by label, key, page, content" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
              <option value="all">All pages</option>
              {pageOptions.map((page) => <option key={page} value={page}>{page}</option>)}
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
              {Object.keys(groupedFiltered).sort().map((page) => (
                <div key={page} className="group-block">
                  <div className="group-head">{page}</div>
                  <div className="list">
                    {groupedFiltered[page].map((block) => (
                      <button key={block._id} className={"item " + (selectedId === block._id ? "sel" : "")} onClick={() => select(block)}>
                        <div>
                          <div className="title">{block.label}</div>
                          <div className="sub">{block.page} / {block.block_key}</div>
                        </div>
                        <span className={"pill " + (block.active ? "a" : "i")}>{block.active ? "Active" : "Inactive"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No content blocks</div>
          )}
        </div>

        <form className="card form-card" onSubmit={save}>
          <div className="form-head">
            <h3>{selectedId ? "Edit Content Block" : "Create Content Block"}</h3>
            {selectedId ? <button type="button" className="danger" onClick={remove}>Delete</button> : null}
          </div>

          <div className="row row-2">
            <label>
              <span>Page</span>
              <input value={form.page} onChange={(e) => setForm((s) => ({ ...s, page: e.target.value }))} placeholder="dashboard" />
            </label>
            <label>
              <span>Content Type</span>
              <input value={form.content_type} onChange={(e) => setForm((s) => ({ ...s, content_type: e.target.value }))} placeholder="text" />
            </label>
          </div>

          <div className="row row-2">
            <label>
              <span>Block Key</span>
              <input value={form.block_key} disabled={!!selectedId} onChange={(e) => setForm((s) => ({ ...s, block_key: e.target.value }))} placeholder="overview_title" />
            </label>
            <label>
              <span>Label</span>
              <input value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} placeholder="Overview Title" />
            </label>
          </div>

          <label>
            <span>Content</span>
            <textarea rows={8} value={form.content} onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))} placeholder="Write the live content here" />
          </label>

          <label>
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Optional admin note" />
          </label>

          <label>
            <span>Metadata (JSON)</span>
            <textarea className="code" rows={8} value={form.metadata} onChange={(e) => setForm((s) => ({ ...s, metadata: e.target.value }))} spellCheck={false} />
          </label>

          <div className="row row-2 last-row">
            <label className="chk"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
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
