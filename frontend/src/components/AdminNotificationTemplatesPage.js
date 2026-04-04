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
  type: "",
  label: "",
  title_template: "",
  body_template: "",
  icon: "",
  tone: "gray",
  active: true,
  metadata: "{}",
};

const DEFAULT_PREVIEW_INPUT = "{}";
const TONE_OPTIONS = ["gray", "red", "green", "amber", "black"];

function prettyJson(value) {
  try {
    if (!value) return "{}";
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return "{}";
  }
}

function parseJson(value, label = "JSON") {
  if (!value || !value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

function extractVariables(...templates) {
  const found = new Set();
  const re = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
  templates.forEach((tpl) => {
    if (!tpl) return;
    let m;
    while ((m = re.exec(tpl)) !== null) {
      found.add(m[1]);
    }
  });
  return Array.from(found);
}

function resolvePath(source, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source);
}

function renderTemplate(template, vars) {
  if (!template) return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key) => {
    const value = resolvePath(vars, key);
    return value === undefined || value === null ? `{{${key}}}` : String(value);
  });
}

export default function AdminNotificationTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [previewInput, setPreviewInput] = useState(DEFAULT_PREVIEW_INPUT);
  const [previewError, setPreviewError] = useState("");

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
      const data = await api("http://localhost:5004/api/admin/meta/notification-templates");
      setTemplates((data.notificationTemplates || []).sort((a, b) => (a.type || "").localeCompare(b.type || "")));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return templates.filter((tpl) => {
      const s = search.trim().toLowerCase();
      const okSearch = !s
        || tpl.label?.toLowerCase().includes(s)
        || tpl.type?.toLowerCase().includes(s)
        || tpl.title_template?.toLowerCase().includes(s)
        || tpl.body_template?.toLowerCase().includes(s);
      const okStatus = status === "all" || (status === "active" && tpl.active) || (status === "inactive" && !tpl.active);
      const okTone = toneFilter === "all" || tpl.tone === toneFilter;
      return okSearch && okStatus && okTone;
    });
  }, [templates, search, status, toneFilter]);

  const variables = useMemo(() => extractVariables(form.title_template, form.body_template), [form.title_template, form.body_template]);

  const preview = useMemo(() => {
    try {
      const vars = parseJson(previewInput, "Preview JSON");
      setPreviewError("");
      return {
        title: renderTemplate(form.title_template, vars),
        body: renderTemplate(form.body_template, vars),
      };
    } catch (e) {
      setPreviewError(e.message);
      return { title: form.title_template, body: form.body_template };
    }
  }, [form.title_template, form.body_template, previewInput]);

  function select(tpl) {
    setSelectedId(tpl._id);
    setForm({
      type: tpl.type || "",
      label: tpl.label || "",
      title_template: tpl.title_template || "",
      body_template: tpl.body_template || "",
      icon: tpl.icon || "",
      tone: tpl.tone || "gray",
      active: !!tpl.active,
      metadata: prettyJson(tpl.metadata),
    });
    setPreviewInput(DEFAULT_PREVIEW_INPUT);
  }

  function reset() {
    setSelectedId(null);
    setForm(DEFAULT_FORM);
    setPreviewInput(DEFAULT_PREVIEW_INPUT);
    setPreviewError("");
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const metadata = parseJson(form.metadata, "Metadata JSON");
      const payload = {
        type: form.type.trim(),
        label: form.label.trim(),
        title_template: form.title_template,
        body_template: form.body_template,
        icon: form.icon.trim() || null,
        tone: form.tone,
        active: !!form.active,
        metadata,
      };

      if (!payload.type || !payload.label || !payload.title_template || !payload.body_template) {
        throw new Error("Type, label, title template and body template are required");
      }

      if (selectedId) {
        await api(`http://localhost:5004/api/admin/meta/notification-templates/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("Notification template updated");
      } else {
        await api(`http://localhost:5004/api/admin/meta/notification-templates`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Notification template created");
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
    if (!window.confirm("Delete this notification template?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`http://localhost:5004/api/admin/meta/notification-templates/${selectedId}`, { method: "DELETE" });
      setSuccess("Notification template deleted");
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="notification-templates-page">
      <style>{styles}</style>

      <div className="header">
        <h2>Notification Templates</h2>
        <button className="btn" onClick={reset}>New</button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}
      {success ? <div className="banner success">{success}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="filters filters-3">
            <input placeholder="Search by type, label, content" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={toneFilter} onChange={(e) => setToneFilter(e.target.value)}>
              <option value="all">All tones</option>
              {TONE_OPTIONS.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
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
            <div className="list">
              {filtered.map((tpl) => (
                <button key={tpl._id} className={"item " + (selectedId === tpl._id ? "sel" : "")} onClick={() => select(tpl)}>
                  <div>
                    <div className="title">{tpl.icon ? `${tpl.icon} ` : ""}{tpl.label}</div>
                    <div className="sub">{tpl.type}</div>
                  </div>
                  <div className="item-right">
                    <span className={"tone-pill tone-" + (tpl.tone || "gray")}>{tpl.tone || "gray"}</span>
                    <span className={"pill " + (tpl.active ? "a" : "i")}>{tpl.active ? "Active" : "Inactive"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">No notification templates</div>
          )}
        </div>

        <div className="right-col">
          <form className="card form-card" onSubmit={save}>
            <div className="form-head">
              <h3>{selectedId ? "Edit Notification Template" : "Create Notification Template"}</h3>
              {selectedId ? <button type="button" className="danger" onClick={remove}>Delete</button> : null}
            </div>

            <div className="row row-2">
              <label>
                <span>Type</span>
                <input value={form.type} disabled={!!selectedId} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} placeholder="new_flag_on_me" />
              </label>
              <label>
                <span>Label</span>
                <input value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} placeholder="New Flag on Me" />
              </label>
            </div>

            <div className="row row-2">
              <label>
                <span>Icon</span>
                <input value={form.icon} onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))} placeholder="🚩" />
              </label>
              <label>
                <span>Tone</span>
                <select value={form.tone} onChange={(e) => setForm((s) => ({ ...s, tone: e.target.value }))}>
                  {TONE_OPTIONS.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
                </select>
              </label>
            </div>

            <label>
              <span>Title Template</span>
              <textarea rows={3} value={form.title_template} onChange={(e) => setForm((s) => ({ ...s, title_template: e.target.value }))} placeholder="New flag on @{{handle}}" />
            </label>

            <label>
              <span>Body Template</span>
              <textarea rows={5} value={form.body_template} onChange={(e) => setForm((s) => ({ ...s, body_template: e.target.value }))} placeholder="{{category}}" />
            </label>

            <label>
              <span>Metadata (JSON)</span>
              <textarea className="code" rows={6} value={form.metadata} onChange={(e) => setForm((s) => ({ ...s, metadata: e.target.value }))} spellCheck={false} />
            </label>

            <div className="row row-2 last-row">
              <label className="chk"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /><span>Active</span></label>
            </div>

            <div className="actions">
              <button type="button" className="btn" onClick={reset}>Reset</button>
              <button type="submit" className="btn primary" disabled={saving}>{saving ? "Saving…" : selectedId ? "Update" : "Create"}</button>
            </div>
          </form>

          <div className="card preview-card">
            <div className="form-head">
              <h3>Live Preview</h3>
            </div>

            <div className="vars-row">
              {variables.length ? variables.map((v) => <span key={v} className="var-chip">{v}</span>) : <span className="muted">No variables found</span>}
            </div>

            <label>
              <span>Preview Variables JSON</span>
              <textarea className="code" rows={6} value={previewInput} onChange={(e) => setPreviewInput(e.target.value)} spellCheck={false} placeholder='{"handle":"rohanverma__","category":"Love bombing"}' />
            </label>

            {previewError ? <div className="banner error small">{previewError}</div> : null}

            <div className="preview-box">
              <div className="preview-top">
                <span className={"tone-pill tone-" + (form.tone || "gray")}>{form.tone || "gray"}</span>
                <span className="preview-icon">{form.icon || "🔔"}</span>
              </div>
              <div className="preview-title">{preview.title || "Preview title"}</div>
              <div className="preview-body">{preview.body || "Preview body"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:420px 1fr;gap:16px}
  .right-col{display:grid;gap:16px}
  .card{background:#fff;border:1px solid #e6e4de;border-radius:16px;padding:14px}
  .filters{display:grid;gap:8px;margin-bottom:10px}
  .filters-3{grid-template-columns:1fr 140px 120px}
  input,textarea,select{border:1px solid #d2d0c8;border-radius:10px;padding:10px}
  .list{display:flex;flex-direction:column;gap:8px;max-height:720px;overflow:auto}
  .item{display:flex;justify-content:space-between;align-items:center;border:1px solid #ecebe6;border-radius:12px;padding:10px;background:#faf9f6;cursor:pointer;text-align:left}
  .item.sel{border-color:#000;background:#f2f1ec}
  .item-right{display:flex;align-items:center;gap:8px}
  .title{font-weight:700}
  .sub{font-size:12px;color:#666}
  .pill,.tone-pill{font-size:11px;padding:4px 8px;border-radius:999px}
  .pill.a{background:#ecfff5;color:#1a9e5f}
  .pill.i{background:#f2f1ec;color:#666}
  .tone-gray{background:#f2f1ec;color:#666}
  .tone-red{background:#fff0f0;color:#c62828}
  .tone-green{background:#ecfff5;color:#1a9e5f}
  .tone-amber{background:#fff7e8;color:#b26a00}
  .tone-black{background:#111;color:#fff}
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
  .banner.small{margin-top:8px;margin-bottom:0}
  .empty,.muted{color:#666;padding:10px}
  .vars-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
  .var-chip{font-size:11px;padding:4px 8px;border-radius:999px;background:#f2f1ec;color:#444}
  .preview-box{border:1px solid #ecebe6;border-radius:14px;padding:14px;background:#faf9f6}
  .preview-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  .preview-icon{font-size:18px}
  .preview-title{font-weight:800;margin-bottom:6px}
  .preview-body{color:#444;line-height:1.5;white-space:pre-wrap}
  @media(max-width:1200px){.grid{grid-template-columns:1fr}.filters-3{grid-template-columns:1fr}.row-2{grid-template-columns:1fr}}
`;
