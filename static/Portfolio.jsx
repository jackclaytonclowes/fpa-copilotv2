/* MonthEndIQ — Practice Portfolio (firm mode): multi-client month-end triage */

// ── Firm token — persisted per browser so the same firm's clients reload ──
function getFirmToken() {
  let t = localStorage.getItem("meiq_firm_token");
  if (!t) { t = crypto.randomUUID(); localStorage.setItem("meiq_firm_token", t); }
  return t;
}

const SECTORS = [
  "Accountancy", "Construction", "E-commerce", "Hospitality",
  "Manufacturing", "NHS GP Practice", "NHS Federation", "Professional services",
  "Property", "Retail", "SaaS", "Other",
];

// Maps display sector to the internal sector value used by the API
const SECTOR_VALUE_MAP = {
  "NHS GP Practice": "nhs_gp",
  "NHS Federation":  "nhs_federation",
};

const TIER = {
  action:  { label: "Action needed", color: "var(--adverse-text)",    bg: "var(--adverse-soft)",    border: "var(--adverse-border)",    icon: "alert-octagon" },
  watch:   { label: "Watch",         color: "var(--caution-text, #b45309)", bg: "var(--caution-soft, #fef3c7)", border: "var(--caution-border, #fcd34d)", icon: "eye" },
  healthy: { label: "Healthy",       color: "var(--favourable-text)", bg: "var(--favourable-soft)", border: "var(--favourable-border)", icon: "check-circle" },
};

// ── Add-client modal ───────────────────────────────────────────────────────
function AddClientModal({ firmToken, onClose, onAdded }) {
  const { Icon } = window;
  const [name, setName]       = React.useState("");
  const [sector, setSector]   = React.useState("Other");
  const [listSize, setListSize] = React.useState("");
  const [cash, setCash]       = React.useState("");
  const [file, setFile]       = React.useState(null);
  const [status, setStatus]   = React.useState("idle"); // idle | uploading | error
  const [errMsg, setErrMsg]   = React.useState("");
  const fileRef               = React.useRef();

  const isNhsGp    = sector === "NHS GP Practice";
  const canSubmit  = name.trim() && file && status !== "uploading";
  const apiSector  = SECTOR_VALUE_MAP[sector] || sector.toLowerCase().replace(/\s+/g, "_");

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("uploading");
    setErrMsg("");
    const fd = new FormData();
    fd.append("firm_token",   firmToken);
    fd.append("name",         name.trim());
    fd.append("sector",       apiSector);
    fd.append("cash_balance", cash ? parseFloat(cash) : 0);
    fd.append("list_size",    isNhsGp && listSize ? parseInt(listSize, 10) || 0 : 0);
    fd.append("file",         file);
    try {
      const r = await fetch(apiUrl("/api/portfolio/clients"), { method: "POST", body: fd });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `Error ${r.status}`);
      }
      const client = await r.json();
      onAdded(client);
    } catch (ex) {
      setErrMsg(ex.message);
      setStatus("error");
    }
  }

  // Close on Escape
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const inputStyle = {
    width: "100%", padding: "9px 12px", fontSize: 13.5,
    border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
    background: "var(--surface)", color: "var(--ink)", outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { font: "var(--text-label)", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)",
    display: "block", marginBottom: 5 };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 20, padding: "28px 28px 24px",
        width: "100%", maxWidth: 480, boxShadow: "var(--shadow-hover)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, font: "700 17px/1.2 var(--font-display)", color: "var(--ink)" }}>Add client</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", padding: 4 }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Client name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Harbour Retail Ltd" style={inputStyle} autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} style={inputStyle}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {isNhsGp && (
            <div>
              <label style={labelStyle}>Weighted list size (registered patients)</label>
              <input type="number" min="0" step="100" value={listSize} onChange={e => setListSize(e.target.value)}
                placeholder="e.g. 8500" style={inputStyle} />
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
                Used for per-patient benchmarking. Leave blank if unknown.
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Cash balance (optional — for runway)</label>
            <input type="number" min="0" step="1000" value={cash} onChange={e => setCash(e.target.value)}
              placeholder="e.g. 250000" style={inputStyle} />
            <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
              Used to calculate months of runway. Leave blank if unknown.
            </div>
          </div>

          <div>
            <label style={labelStyle}>P&amp;L file * (Excel or CSV, MoM format)</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
              style={{
                border: `2px dashed ${file ? "var(--primary)" : "var(--border-strong)"}`,
                borderRadius: "var(--radius-sm)", padding: "18px 16px", textAlign: "center",
                cursor: "pointer", background: file ? "var(--primary-soft)" : "var(--surface-2)",
                transition: "all .15s",
              }}
            >
              <Icon name={file ? "check-circle" : "upload-cloud"} size={20}
                style={{ color: file ? "var(--primary)" : "var(--fg-3)", marginBottom: 6 }} />
              <div style={{ font: "var(--text-body)", fontSize: 13, color: file ? "var(--primary)" : "var(--fg-2)" }}>
                {file ? file.name : "Click or drag file here"}
              </div>
              {!file && <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>
                .xlsx, .xls, .csv
              </div>}
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
              onChange={e => setFile(e.target.files[0])} />
          </div>

          {errMsg && (
            <div style={{ padding: "10px 14px", background: "var(--adverse-soft)", border: "1px solid var(--adverse-border)",
              borderRadius: "var(--radius-sm)", color: "var(--adverse-text)", font: "var(--text-body)", fontSize: 12.5, lineHeight: 1.5 }}>
              {errMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: "9px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--fg-2)", font: "var(--text-body)", fontSize: 13.5, cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={!canSubmit} style={{
              padding: "9px 20px", borderRadius: "var(--radius-sm)", border: "none",
              background: canSubmit ? "var(--primary)" : "var(--border-strong)",
              color: canSubmit ? "#fff" : "var(--fg-3)",
              font: "var(--text-body-strong)", fontSize: 13.5, cursor: canSubmit ? "pointer" : "default",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              {status === "uploading"
                ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14 }} /> Analysing…</React.Fragment>
                : <React.Fragment><Icon name="plus" size={14} /> Add client</React.Fragment>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Update-cash modal (lightweight re-upload or cash edit) ─────────────────
function UpdateCashModal({ client, firmToken, onClose, onUpdated }) {
  const { Icon } = window;
  const [cash, setCash]     = React.useState(client.cash ? String(client.cash) : "");
  const [file, setFile]     = React.useState(null);
  const [status, setStatus] = React.useState("idle");
  const [errMsg, setErrMsg] = React.useState("");
  const fileRef             = React.useRef();

  async function submit(e) {
    e.preventDefault();
    setStatus("uploading"); setErrMsg("");
    const fd = new FormData();
    fd.append("firm_token",   firmToken);
    fd.append("cash_balance", cash ? parseFloat(cash) : 0);
    if (file) fd.append("file", file);
    try {
      const r = await fetch(apiUrl(`/api/portfolio/clients/${client.session_id}`), { method: "PUT", body: fd });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.detail || `Error ${r.status}`); }
      onUpdated(await r.json());
    } catch (ex) { setErrMsg(ex.message); setStatus("error"); }
  }

  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const inputStyle = { width: "100%", padding: "9px 12px", fontSize: 13.5,
    border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
    background: "var(--surface)", color: "var(--ink)", outline: "none", boxSizing: "border-box" };
  const labelStyle = { font: "var(--text-label)", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", display: "block", marginBottom: 5 };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 20, padding: "28px 28px 24px",
        width: "100%", maxWidth: 400, boxShadow: "var(--shadow-hover)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, font: "700 17px/1.2 var(--font-display)", color: "var(--ink)" }}>
            Update — {client.name}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", padding: 4 }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Cash balance</label>
            <input type="number" min="0" step="1000" value={cash} onChange={e => setCash(e.target.value)}
              placeholder="e.g. 250000" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>New P&amp;L file (optional — replaces current)</label>
            <div onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
              style={{
                border: `2px dashed ${file ? "var(--primary)" : "var(--border-strong)"}`,
                borderRadius: "var(--radius-sm)", padding: "14px 16px", textAlign: "center",
                cursor: "pointer", background: file ? "var(--primary-soft)" : "var(--surface-2)",
              }}>
              <div style={{ font: "var(--text-body)", fontSize: 13, color: file ? "var(--primary)" : "var(--fg-2)" }}>
                {file ? file.name : "Drop new file here to re-analyse"}
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
              onChange={e => setFile(e.target.files[0])} />
          </div>
          {errMsg && (
            <div style={{ padding: "10px 14px", background: "var(--adverse-soft)", border: "1px solid var(--adverse-border)",
              borderRadius: "var(--radius-sm)", color: "var(--adverse-text)", fontSize: 12.5, lineHeight: 1.5 }}>
              {errMsg}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              padding: "9px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--fg-2)", fontSize: 13.5, cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={status === "uploading"} style={{
              padding: "9px 20px", borderRadius: "var(--radius-sm)", border: "none",
              background: "var(--primary)", color: "#fff", fontSize: 13.5, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              {status === "uploading"
                ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</React.Fragment>
                : <React.Fragment><Icon name="save" size={14} /> Save</React.Fragment>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Neighbourhood modal ─────────────────────────────────────────────
function CreateNeighbourhoodModal({ firmToken, nhsClients, onClose, onCreated }) {
  const { Icon } = window;
  const [name, setName]       = React.useState("");
  const [selected, setSelected] = React.useState(new Set());
  const [status, setStatus]   = React.useState("idle");
  const [errMsg, setErrMsg]   = React.useState("");

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const canSubmit = name.trim() && selected.size >= 1 && status !== "loading";

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading"); setErrMsg("");
    try {
      const r = await fetch(apiUrl("/api/portfolio/neighbourhoods"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firm_token: firmToken, name: name.trim(), client_ids: [...selected] }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.detail || `Error ${r.status}`); }
      onCreated(await r.json());
    } catch (ex) { setErrMsg(ex.message); setStatus("error"); }
  }

  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const inputStyle = { width: "100%", padding: "9px 12px", fontSize: 13.5,
    border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
    background: "var(--surface)", color: "var(--ink)", outline: "none", boxSizing: "border-box" };
  const labelStyle = { font: "var(--text-label)", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", display: "block", marginBottom: 5 };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 20, padding: "28px 28px 24px",
        width: "100%", maxWidth: 500, boxShadow: "var(--shadow-hover)", maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, font: "700 17px/1.2 var(--font-display)", color: "var(--ink)" }}>
            Create neighbourhood
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", padding: 4 }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Neighbourhood name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. North Islington Neighbourhood" style={inputStyle} autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Select PCNs * ({selected.size} selected)</label>
            <div style={{ border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
                          maxHeight: 200, overflowY: "auto" }}>
              {nhsClients.length === 0 && (
                <div style={{ padding: "14px 16px", color: "var(--fg-3)", fontSize: 13 }}>
                  No NHS GP clients uploaded yet. Add NHS GP Practice clients first.
                </div>
              )}
              {nhsClients.map((c, i) => (
                <label key={c.session_id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer",
                  borderBottom: i < nhsClients.length - 1 ? "1px solid var(--border)" : "none",
                  background: selected.has(c.session_id) ? "var(--primary-soft,#eff6ff)" : "transparent",
                }}>
                  <input type="checkbox" checked={selected.has(c.session_id)} onChange={() => toggle(c.session_id)}
                    style={{ width: 15, height: 15, accentColor: "var(--primary)" }} />
                  <span style={{ flex: 1, font: "500 13px/1.3 var(--font-display)", color: "var(--ink)" }}>
                    {c.name}
                  </span>
                  {c.list_size > 0 && (
                    <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{c.list_size.toLocaleString()} pts</span>
                  )}
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 5 }}>
              Each PCN keeps its own books — data is never merged.
            </div>
          </div>

          {errMsg && (
            <div style={{ padding: "10px 14px", background: "var(--adverse-soft)", border: "1px solid var(--adverse-border)",
              borderRadius: "var(--radius-sm)", color: "var(--adverse-text)", fontSize: 12.5 }}>
              {errMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              padding: "9px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--fg-2)", fontSize: 13.5, cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={!canSubmit} style={{
              padding: "9px 20px", borderRadius: "var(--radius-sm)", border: "none",
              background: canSubmit ? "var(--primary)" : "var(--border-strong)",
              color: canSubmit ? "#fff" : "var(--fg-3)",
              fontSize: 13.5, cursor: canSubmit ? "pointer" : "default",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              {status === "loading"
                ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14 }} /> Creating…</React.Fragment>
                : <React.Fragment><Icon name="map-pin" size={14} /> Create</React.Fragment>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Main Portfolio component ───────────────────────────────────────────────
function Portfolio({ onOpenClient, onToast }) {
  const { Icon, RagBadge } = window;
  const firmToken = React.useMemo(() => getFirmToken(), []);

  const [mode, setMode]           = React.useState("real"); // "real" | "demo"
  const [status, setStatus]       = React.useState("loading");
  const [data, setData]           = React.useState(null);
  const [showAdd, setShowAdd]     = React.useState(false);
  const [updating, setUpdating]   = React.useState(null); // client object being updated
  const [deleting, setDeleting]   = React.useState(null); // client_id being confirmed
  const [briefStatus, setBriefStatus] = React.useState("idle"); // idle | loading | done | error
  const [briefs, setBriefs]           = React.useState({});     // {session_id: text}
  const [copiedLink, setCopiedLink]   = React.useState(null);  // session_id of last copied card
  const [emailedLink, setEmailedLink] = React.useState(null); // session_id of last emailed card
  const [search, setSearch]           = React.useState("");
  const [tierFilter, setTierFilter]   = React.useState("all"); // "all" | "action" | "watch" | "healthy"
  const [, setRagRev]                 = React.useState(0);
  const [neighbourhoods, setNeighbourhoods] = React.useState([]);
  const [showNeighModal, setShowNeighModal] = React.useState(false);
  const [neighShareStates, setNeighShareStates] = React.useState({}); // {id: "idle"|"loading"|"copied"}

  const load = React.useCallback((m) => {
    const which = m ?? mode;
    setStatus("loading");
    const url = which === "demo"
      ? apiUrl("/api/portfolio/demo")
      : apiUrl(`/api/portfolio/clients?firm_token=${encodeURIComponent(firmToken)}`);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setData(d); setStatus("done"); })
      .catch(() => setStatus("error"));
  }, [mode, firmToken]);

  React.useEffect(() => { load(); }, [load]);

  const loadNeighbourhoods = React.useCallback(() => {
    if (mode === "demo") { setNeighbourhoods([]); return; }
    fetch(apiUrl(`/api/portfolio/neighbourhoods?firm_token=${encodeURIComponent(firmToken)}`))
      .then(r => r.json())
      .then(d => setNeighbourhoods(d.neighbourhoods || []))
      .catch(() => {});
  }, [mode, firmToken]);

  React.useEffect(() => { loadNeighbourhoods(); }, [loadNeighbourhoods]);

  React.useEffect(() => {
    const h = () => setRagRev(v => v + 1);
    window.addEventListener("meiq:thresholds-updated", h);
    return () => window.removeEventListener("meiq:thresholds-updated", h);
  }, []);

  function switchMode(m) { setMode(m); load(m); }

  function handleAdded(client) {
    setShowAdd(false);
    if (mode === "real") {
      setData(prev => {
        const clients = [client, ...(prev?.clients || [])].sort((a, b) => b.score - a.score);
        return { clients, summary: buildSummary(clients) };
      });
    }
  }

  function handleUpdated(updated) {
    setUpdating(null);
    setData(prev => {
      const clients = (prev?.clients || []).map(c => c.session_id === updated.session_id ? updated : c)
        .sort((a, b) => b.score - a.score);
      return { clients, summary: buildSummary(clients) };
    });
  }

  async function confirmDelete(clientId) {
    setDeleting(null);
    try {
      const r = await fetch(
        apiUrl(`/api/portfolio/clients/${clientId}?firm_token=${encodeURIComponent(firmToken)}`),
        { method: "DELETE" }
      );
      if (!r.ok) throw new Error();
      setData(prev => {
        const clients = (prev?.clients || []).filter(c => c.session_id !== clientId);
        return { clients, summary: buildSummary(clients) };
      });
    } catch {
      onToast?.("Could not delete client. Please try again.");
    }
  }

  function buildSummary(clients) {
    return {
      total:         clients.length,
      action:        clients.filter(c => c.tier === "action").length,
      watch:         clients.filter(c => c.tier === "watch").length,
      healthy:       clients.filter(c => c.tier === "healthy").length,
      total_revenue: clients.reduce((s, c) => s + (c.revenue || 0), 0),
      burning:       clients.filter(c => c.burning).length,
    };
  }

  async function generateBriefing() {
    setBriefStatus("loading");
    setBriefs({});
    try {
      const r = await fetch(
        apiUrl(`/api/portfolio/briefing?firm_token=${encodeURIComponent(firmToken)}&currency=${encodeURIComponent((() => { try { return localStorage.getItem("meiq_currency_sym") || "£"; } catch { return "£"; } })())}`),
        { method: "POST" }
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `Error ${r.status}`);
      }
      const { briefs: b } = await r.json();
      setBriefs(b || {});
      setBriefStatus("done");
    } catch (ex) {
      console.error("[Briefing]", ex);
      setBriefStatus("error");
    }
  }

  function fmtGBP(v) { return window.fmtCurrency(v, { compact: true }); }

  function fmtDate(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return ""; }
  }

  function dataFreshness(iso) {
    if (!iso) return null;
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 35)  return { label: "Data current", color: "var(--favourable-text)", bg: "var(--favourable-soft)", border: "var(--favourable-border, #86efac)" };
    if (days <= 65)  return { label: "Due for update", color: "var(--caution-text, #b45309)", bg: "var(--caution-soft, #fef3c7)", border: "var(--caution-border, #fcd34d)" };
    return { label: "Data overdue", color: "var(--adverse-text)", bg: "var(--adverse-soft)", border: "var(--adverse-border)" };
  }

  const ragThresholds = window.loadRagThresholds ? window.loadRagThresholds() : {};

  const isDemo = mode === "demo";
  const hasClients = data?.clients?.length > 0;

  const visibleClients = React.useMemo(() => {
    let list = data?.clients || [];
    if (tierFilter !== "all") list = list.filter(c => c.tier === tierFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) || (c.sector || "").toLowerCase().includes(q)
    );
    return list;
  }, [data, tierFilter, search]);

  return (
    <div className="content">
      <div className="content-inner reveal">
        {/* Header */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ font: "600 22px/1.2 var(--font-display)", color: "var(--ink)", margin: 0 }}>
              Practice Portfolio
            </h2>
            <p style={{ font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-3)", margin: "4px 0 0" }}>
              Month-end triage across your clients — sorted by who needs attention first
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Real / Demo toggle */}
            <div style={{
              display: "inline-flex", background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)", padding: 3, border: "1px solid var(--border)",
            }}>
              {["real", "demo"].map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  padding: "5px 13px", borderRadius: "calc(var(--radius-sm) - 2px)", border: "none",
                  background: mode === m ? "var(--surface)" : "transparent",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,.12)" : "none",
                  color: mode === m ? "var(--primary)" : "var(--fg-3)",
                  font: "var(--text-body)", fontSize: 12.5, fontWeight: mode === m ? 600 : 400,
                  cursor: "pointer", transition: "all .15s",
                }}>
                  {m === "real" ? "My clients" : "Demo"}
                </button>
              ))}
            </div>
            {/* Morning briefing (real mode, has clients) */}
            {!isDemo && hasClients && (
              <button
                onClick={generateBriefing}
                disabled={briefStatus === "loading"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: "var(--radius-sm)", border: "1px solid var(--primary)",
                  background: briefStatus === "done" ? "var(--primary-soft)" : "var(--surface)",
                  color: "var(--primary)",
                  font: "var(--text-body-strong)", fontSize: 13,
                  cursor: briefStatus === "loading" ? "default" : "pointer",
                  opacity: briefStatus === "loading" ? .7 : 1,
                }}
              >
                {briefStatus === "loading"
                  ? <React.Fragment><div className="spinner" style={{ width: 13, height: 13, borderColor: "var(--primary)", borderTopColor: "transparent" }} /> Generating…</React.Fragment>
                  : <React.Fragment><Icon name="sun" size={14} /> Morning briefing</React.Fragment>}
              </button>
            )}
            {/* Add client (real mode only) */}
            {!isDemo && (
              <button onClick={() => setShowAdd(true)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: "var(--radius-sm)", border: "none",
                background: "var(--primary)", color: "#fff",
                font: "var(--text-body-strong)", fontSize: 13, cursor: "pointer",
              }}>
                <Icon name="plus" size={14} /> Add client
              </button>
            )}
            <button onClick={() => load()} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
              borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--fg-2)", fontSize: 13, cursor: "pointer",
            }}>
              <Icon name="refresh-cw" size={14} />
            </button>
          </div>
        </div>

        {status === "loading" && (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)" }}>
              {isDemo ? "Building demo portfolio…" : "Loading your clients…"}
            </div>
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: "16px 18px", background: "var(--adverse-soft)",
            borderRadius: "var(--radius-sm)", border: "1px solid var(--adverse-border)",
            color: "var(--adverse-text)", fontSize: 13 }}>
            Could not load the portfolio.{" "}
            <button onClick={() => load()} style={{ marginLeft: 8, textDecoration: "underline",
              background: "none", border: "none", color: "inherit", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {status === "done" && data && (
          <React.Fragment>
            {/* Empty state — real mode, no clients yet */}
            {!isDemo && !hasClients && (
              <div style={{
                padding: "52px 24px", textAlign: "center",
                background: "var(--surface-2)", borderRadius: 16,
                border: "2px dashed var(--border-strong)",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <h3 style={{ font: "600 17px/1.3 var(--font-display)", color: "var(--ink)", margin: "0 0 8px" }}>
                  No clients yet
                </h3>
                <p style={{ font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-3)",
                  maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.6 }}>
                  Upload a client's month-on-month P&amp;L and MonthEndIQ will triage them into
                  Action&nbsp;/ Watch&nbsp;/ Healthy — automatically, every time you refresh.
                </p>
                <button onClick={() => setShowAdd(true)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px",
                  borderRadius: "var(--radius-sm)", border: "none",
                  background: "var(--primary)", color: "#fff",
                  font: "var(--text-body-strong)", fontSize: 14, cursor: "pointer",
                }}>
                  <Icon name="plus" size={15} /> Add first client
                </button>
                <div style={{ marginTop: 14, font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)" }}>
                  Or switch to <button onClick={() => switchMode("demo")} style={{
                    background: "none", border: "none", color: "var(--primary)",
                    cursor: "pointer", fontSize: 11.5, padding: 0, textDecoration: "underline",
                  }}>Demo</button> to see how the triage works with sample data.
                </div>
              </div>
            )}

            {/* Summary stat strip */}
            {hasClients && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
                {[
                  { label: "Clients",         value: data.summary.total,          tone: "var(--ink)" },
                  { label: "Need action",     value: data.summary.action,         tone: "var(--adverse-text)" },
                  { label: "Watch",           value: data.summary.watch,          tone: "var(--caution-text, #b45309)" },
                  { label: "Healthy",         value: data.summary.healthy,        tone: "var(--favourable-text)" },
                  { label: "Revenue managed", value: fmtGBP(data.summary.total_revenue), tone: "var(--ink)" },
                  { label: "Burning cash",    value: data.summary.burning,        tone: data.summary.burning ? "var(--adverse-text)" : "var(--fg-2)" },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
                    <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
                      letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ font: "var(--text-metric)", fontSize: 24,
                      fontVariantNumeric: "tabular-nums", color: s.tone }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Search + tier filter */}
            {hasClients && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  flex: "1 1 200px", padding: "7px 12px",
                  background: "var(--surface)", border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <Icon name="search" size={14} color="var(--fg-3)" style={{ flexShrink: 0 }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search clients…"
                    style={{
                      flex: 1, border: "none", outline: "none",
                      font: "var(--text-body)", fontSize: 13, color: "var(--ink)",
                      background: "transparent",
                    }}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--fg-3)", padding: 0, display: "flex", alignItems: "center",
                    }}>
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {[
                    { key: "all",     label: "All" },
                    { key: "action",  label: "Action", color: "var(--adverse-text)",         bg: "var(--adverse-soft)",    border: "var(--adverse-border)" },
                    { key: "watch",   label: "Watch",  color: "var(--caution-text, #b45309)",bg: "var(--caution-soft, #fef3c7)", border: "var(--caution-border, #fcd34d)" },
                    { key: "healthy", label: "Healthy",color: "var(--favourable-text)",      bg: "var(--favourable-soft)", border: "var(--favourable-border)" },
                  ].map(f => {
                    const active = tierFilter === f.key;
                    return (
                      <button key={f.key} onClick={() => setTierFilter(f.key)} style={{
                        padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                        font: "var(--text-label)", fontSize: 11.5, fontWeight: 600,
                        border: `1px solid ${active && f.border ? f.border : "var(--border-strong)"}`,
                        background: active && f.bg ? f.bg : (active ? "var(--surface-2)" : "var(--surface)"),
                        color: active && f.color ? f.color : (active ? "var(--ink)" : "var(--fg-3)"),
                        transition: "all .12s",
                      }}>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Triage list */}
            {hasClients && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {visibleClients.length === 0 && (
                  <div style={{ padding: "28px 16px", textAlign: "center",
                    font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)" }}>
                    No clients match your filter.
                  </div>
                )}
                {visibleClients.map((c) => {
                  const t = TIER[c.tier] || TIER.healthy;
                  const isConfirmingDelete = deleting === c.session_id;
                  const ragSt = window.ragStatus ? window.ragStatus(c.margin, ragThresholds.op_margin) : null;
                  return (
                    <div key={c.session_id} className="card portfolio-row" style={{
                      padding: "16px 18px", display: "flex", alignItems: "center", gap: 16,
                      borderLeft: `3px solid ${t.color}`, position: "relative",
                    }}>
                      {/* Tier badge */}
                      <div style={{ flexShrink: 0, width: 116 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          font: "var(--text-label)", fontSize: 10.5, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: ".04em",
                          color: t.color, background: t.bg, border: `1px solid ${t.border}`,
                          borderRadius: 20, padding: "3px 9px",
                        }}>
                          <Icon name={t.icon} size={11} /> {t.label}
                        </span>
                      </div>

                      {/* Name + sector + reasons + brief */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ font: "var(--text-body-strong)", fontSize: 14.5, color: "var(--fg-1)" }}>
                            {c.name}
                          </span>
                          {c.sector === "nhs_gp" && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              font: "var(--text-label)", fontSize: 10, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: ".04em",
                              color: "#005eb8", background: "#e8f0fe",
                              border: "1px solid #b3c9f5",
                              borderRadius: 20, padding: "2px 8px", flexShrink: 0,
                            }}>
                              NHS GP
                            </span>
                          )}
                          {c.sector === "nhs_federation" && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              font: "var(--text-label)", fontSize: 10, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: ".04em",
                              color: "#005eb8", background: "#cce0f5",
                              border: "1px solid #7fb3e8",
                              borderRadius: 20, padding: "2px 8px", flexShrink: 0,
                            }}>
                              NHS Federation
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                          font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginBottom: 4 }}>
                          <span>{c.sector}</span>
                          {c.updated_at && (
                            <span style={{ opacity: .7 }}>· updated {fmtDate(c.updated_at)}</span>
                          )}
                          {(() => {
                            const f = dataFreshness(c.updated_at);
                            if (!f) return null;
                            return (
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                font: "var(--text-label)", fontSize: 10, fontWeight: 700,
                                textTransform: "uppercase", letterSpacing: ".04em",
                                color: f.color, background: f.bg, border: `1px solid ${f.border}`,
                                borderRadius: 20, padding: "2px 7px",
                              }}>
                                <Icon name="circle" size={7} style={{ fill: f.color }} /> {f.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(c.reasons || []).map((r, i) => (
                            <span key={i} style={{
                              font: "var(--text-caption)", fontSize: 11,
                              color: c.tier === "healthy" ? "var(--favourable-text)" : t.color,
                              background: c.tier === "healthy" ? "var(--favourable-soft)" : t.bg,
                              border: `1px solid ${t.border}`, borderRadius: 6, padding: "2px 8px",
                            }}>{r}</span>
                          ))}
                        </div>
                        {/* Morning brief — shown when generated */}
                        {briefStatus === "loading" && !briefs[c.session_id] && (
                          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7,
                            font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
                            <div className="spinner" style={{ width: 12, height: 12, flexShrink: 0 }} />
                            Generating brief…
                          </div>
                        )}
                        {briefs[c.session_id] && (
                          <div style={{
                            marginTop: 10, padding: "9px 12px",
                            background: "var(--primary-soft)", borderRadius: 8,
                            border: "1px solid var(--primary-border, rgba(var(--primary-rgb,79,70,229),.2))",
                            animation: "fadeIn .35s ease",
                          }}>
                            <div style={{ font: "var(--text-caption)", fontSize: 10.5, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: ".05em",
                              color: "var(--primary)", marginBottom: 4 }}>
                              AI Brief
                            </div>
                            <p style={{ margin: 0, font: "var(--text-body)", fontSize: 13, lineHeight: 1.6,
                              color: "var(--fg-1)" }}>
                              {briefs[c.session_id]}
                            </p>
                            <button
                              onClick={() => navigator.clipboard?.writeText(briefs[c.session_id])}
                              style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer",
                                font: "var(--text-caption)", fontSize: 11, color: "var(--primary)",
                                padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <Icon name="copy" size={11} /> Copy
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Figures */}
                      <div className="portfolio-row-figures" style={{ display: "flex", gap: 22, flexShrink: 0 }}>
                        {[
                          { k: "Revenue",   v: fmtGBP(c.revenue),   color: "var(--ink)" },
                          { k: "Op profit", v: fmtGBP(c.op_profit), color: c.op_profit != null && c.op_profit < 0 ? "var(--adverse-text)" : "var(--ink)" },
                          { k: "Margin",    v: c.margin != null ? `${c.margin.toFixed(1)}%` : "—", color: "var(--fg-2)" },
                          { k: "Runway",    v: c.runway_months != null ? `${Math.floor(c.runway_months)} mo` : (c.burning ? "—" : "n/a"),
                            color: c.runway_months != null && c.runway_months < 6 ? "var(--adverse-text)" : "var(--fg-2)" },
                        ].map((f) => (
                          <div key={f.k} style={{ textAlign: "right", minWidth: 64 }}>
                            <div style={{ font: "var(--text-label)", fontSize: 9.5, textTransform: "uppercase",
                              letterSpacing: ".04em", color: "var(--fg-3)", marginBottom: 2 }}>{f.k}</div>
                            <div style={{ font: "var(--text-data)", fontSize: 14,
                              fontVariantNumeric: "tabular-nums", color: f.color }}>{f.v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Margin RAG badge — hidden on mobile via .portfolio-row-rag */}
                      {ragSt && (
                        <div className="portfolio-row-rag" style={{ flexShrink: 0, alignSelf: "center" }}>
                          <RagBadge status={ragSt} />
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
                        {!isDemo && !isConfirmingDelete && (
                          <React.Fragment>
                            <button onClick={() => setUpdating(c)} title="Update" style={{
                              background: "var(--surface-2)", border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)", padding: "6px 8px",
                              cursor: "pointer", color: "var(--fg-2)", display: "flex", alignItems: "center",
                            }}>
                              <Icon name="refresh-cw" size={13} />
                            </button>
                            <button
                              title="Copy share link"
                              onClick={() => {
                                const firm = (() => { try { return localStorage.getItem("meiq_firm_name") || ""; } catch { return ""; } })();
                                const cur  = (() => { try { return localStorage.getItem("meiq_currency_sym") || ""; } catch { return ""; } })();
                                const ps   = [firm ? "firm=" + encodeURIComponent(firm) : "", cur && cur !== "£" ? "cur=" + encodeURIComponent(cur) : ""].filter(Boolean).join("&");
                                const base = `${window.location.origin}/view/${c.session_id}`;
                                const url  = ps ? `${base}?${ps}` : base;
                                navigator.clipboard?.writeText(url);
                                setCopiedLink(c.session_id);
                                setTimeout(() => setCopiedLink(null), 2000);
                              }}
                              style={{
                                background: copiedLink === c.session_id ? "var(--favourable-soft)" : "var(--surface-2)",
                                border: `1px solid ${copiedLink === c.session_id ? "var(--favourable-border)" : "var(--border)"}`,
                                borderRadius: "var(--radius-sm)", padding: "6px 8px",
                                cursor: "pointer",
                                color: copiedLink === c.session_id ? "var(--favourable-text)" : "var(--fg-2)",
                                display: "flex", alignItems: "center",
                                transition: "all .15s",
                              }}
                            >
                              <Icon name={copiedLink === c.session_id ? "check" : "share-2"} size={13} />
                            </button>
                            <button
                              title="Email share link to client"
                              onClick={() => {
                                const firm = (() => { try { return localStorage.getItem("meiq_firm_name") || ""; } catch { return ""; } })();
                                const cur  = (() => { try { return localStorage.getItem("meiq_currency_sym") || ""; } catch { return ""; } })();
                                const ps   = [firm ? "firm=" + encodeURIComponent(firm) : "", cur && cur !== "£" ? "cur=" + encodeURIComponent(cur) : ""].filter(Boolean).join("&");
                                const base = `${window.location.origin}/view/${c.session_id}`;
                                const url  = ps ? `${base}?${ps}` : base;
                                const sign = firm ? `Kind regards,\n${firm}` : "Kind regards";
                                const body = `Hi,\n\nYour latest management pack is ready to view online:\n\n${url}\n\nYou can browse by period and download a PDF copy directly from the link.\n\n${sign}`;
                                const mailto = `mailto:?subject=${encodeURIComponent(`Your management pack — ${c.name}`)}&body=${encodeURIComponent(body)}`;
                                window.location.href = mailto;
                                setEmailedLink(c.session_id);
                                setTimeout(() => setEmailedLink(null), 2500);
                              }}
                              style={{
                                background: emailedLink === c.session_id ? "var(--primary-soft)" : "var(--surface-2)",
                                border: `1px solid ${emailedLink === c.session_id ? "var(--primary)" : "var(--border)"}`,
                                borderRadius: "var(--radius-sm)", padding: "6px 8px",
                                cursor: "pointer",
                                color: emailedLink === c.session_id ? "var(--primary)" : "var(--fg-2)",
                                display: "flex", alignItems: "center",
                                transition: "all .15s",
                              }}
                            >
                              <Icon name={emailedLink === c.session_id ? "check" : "mail"} size={13} />
                            </button>
                            <button onClick={() => setDeleting(c.session_id)} title="Remove client" style={{
                              background: "var(--surface-2)", border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)", padding: "6px 8px",
                              cursor: "pointer", color: "var(--adverse-text)", display: "flex", alignItems: "center",
                            }}>
                              <Icon name="trash-2" size={13} />
                            </button>
                          </React.Fragment>
                        )}
                        {!isDemo && isConfirmingDelete && (
                          <React.Fragment>
                            <span style={{ fontSize: 12, color: "var(--adverse-text)", fontWeight: 600 }}>Remove?</span>
                            <button onClick={() => confirmDelete(c.session_id)} style={{
                              padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "none",
                              background: "var(--adverse-text)", color: "#fff", fontSize: 12, cursor: "pointer",
                            }}>Yes</button>
                            <button onClick={() => setDeleting(null)} style={{
                              padding: "5px 10px", borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-strong)", background: "var(--surface)",
                              color: "var(--fg-2)", fontSize: 12, cursor: "pointer",
                            }}>No</button>
                          </React.Fragment>
                        )}
                        <button onClick={() => onOpenClient && onOpenClient(c.session_id, c.name)} style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "none",
                          background: "var(--primary)", color: "#fff",
                          font: "var(--text-body-strong)", fontSize: 13, cursor: "pointer",
                        }}>
                          Open <Icon name="arrow-right" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* NHS GP Benchmarking table */}
            {(() => {
              const gpPractices = (data?.clients || []).filter(
                c => c.sector === "nhs_gp" && c.list_size > 0
              );
              if (gpPractices.length < 2) return null;

              const rows = gpPractices.map(c => {
                const rev  = c.revenue    || 0;
                const cost = rev - (c.op_profit || 0);
                const nonClinical = cost * 0.6; // approx overhead share
                return {
                  name:             c.name,
                  list_size:        c.list_size,
                  income_per_pt:    c.list_size > 0 ? rev  / c.list_size : null,
                  cost_per_pt:      c.list_size > 0 ? cost / c.list_size : null,
                  overhead_pct:     rev > 0 ? (nonClinical / rev * 100) : null,
                  revenue:          rev,
                  total_cost:       cost,
                };
              });

              // Sort by income per patient descending
              rows.sort((a, b) => (b.income_per_pt || 0) - (a.income_per_pt || 0));

              // Federation totals row
              const totRev  = rows.reduce((s, r) => s + r.revenue, 0);
              const totCost = rows.reduce((s, r) => s + r.total_cost, 0);
              const totLS   = rows.reduce((s, r) => s + r.list_size, 0);
              const fedRow  = {
                name:          "Federation totals",
                list_size:     totLS,
                income_per_pt: totLS > 0 ? totRev  / totLS : null,
                cost_per_pt:   totLS > 0 ? totCost / totLS : null,
                overhead_pct:  totRev > 0 ? ((totCost * 0.6) / totRev * 100) : null,
                revenue:       totRev,
                total_cost:    totCost,
                isFedTotal:    true,
              };

              const fmt2 = v => v != null ? `£${v.toFixed(2)}` : "—";
              const fmtP = v => v != null ? `${v.toFixed(1)}%` : "—";
              const thStyle = {
                font: "var(--text-label)", fontSize: 10.5, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: ".05em",
                color: "var(--fg-3)", padding: "8px 12px",
                textAlign: "right", borderBottom: "1px solid var(--border)",
                whiteSpace: "nowrap",
              };
              const tdStyle = {
                padding: "10px 12px", font: "var(--text-body)", fontSize: 13,
                color: "var(--ink)", borderBottom: "1px solid var(--border)",
                fontVariantNumeric: "tabular-nums", textAlign: "right",
              };
              const tdNameStyle = { ...tdStyle, textAlign: "left", fontWeight: 500 };
              const fedStyle = { background: "var(--surface-2)", fontWeight: 700 };

              return (
                <div style={{ marginTop: 28 }}>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ font: "600 15px/1.2 var(--font-display)", color: "var(--ink)", margin: "0 0 3px" }}>
                      NHS GP Benchmarking
                    </h3>
                    <p style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", margin: 0 }}>
                      Per-patient metrics across {gpPractices.length} NHS GP practices
                    </p>
                  </div>
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, textAlign: "left" }}>Practice</th>
                          <th style={thStyle}>List size</th>
                          <th style={thStyle}>Income / patient</th>
                          <th style={thStyle}>Cost / patient</th>
                          <th style={thStyle}>Overhead %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.name}>
                            <td style={tdNameStyle}>
                              {i === 0 && (
                                <span style={{
                                  display: "inline-block", marginRight: 6,
                                  font: "var(--text-label)", fontSize: 9.5, fontWeight: 700,
                                  textTransform: "uppercase", letterSpacing: ".04em",
                                  color: "var(--favourable-text)", background: "var(--favourable-soft)",
                                  border: "1px solid var(--favourable-border)", borderRadius: 20,
                                  padding: "1px 6px",
                                }}>Top</span>
                              )}
                              {r.name}
                            </td>
                            <td style={tdStyle}>{r.list_size.toLocaleString()}</td>
                            <td style={tdStyle}>{fmt2(r.income_per_pt)}</td>
                            <td style={tdStyle}>{fmt2(r.cost_per_pt)}</td>
                            <td style={tdStyle}>{fmtP(r.overhead_pct)}</td>
                          </tr>
                        ))}
                        {/* Federation totals row */}
                        <tr style={fedStyle}>
                          <td style={{ ...tdNameStyle, ...fedStyle, borderBottom: "none", borderTop: "2px solid var(--border)" }}>
                            Federation totals
                          </td>
                          <td style={{ ...tdStyle, ...fedStyle, borderBottom: "none", borderTop: "2px solid var(--border)" }}>
                            {fedRow.list_size.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, ...fedStyle, borderBottom: "none", borderTop: "2px solid var(--border)" }}>
                            {fmt2(fedRow.income_per_pt)}
                          </td>
                          <td style={{ ...tdStyle, ...fedStyle, borderBottom: "none", borderTop: "2px solid var(--border)" }}>
                            {fmt2(fedRow.cost_per_pt)}
                          </td>
                          <td style={{ ...tdStyle, ...fedStyle, borderBottom: "none", borderTop: "2px solid var(--border)" }}>
                            {fmtP(fedRow.overhead_pct)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 6, font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                    Overhead % approximated as 60% of total costs ÷ revenue. Income and cost per patient based on weighted list size.
                  </div>
                </div>
              );
            })()}

            {/* Neighbourhoods */}
            {!isDemo && (() => {
              const nhsClients = (data?.clients || []).filter(c => c.sector === "nhs_gp");

              const fmt = v => v == null ? "—" : "£" + Math.round(v).toLocaleString();
              const pct = v => v == null ? "—" : v.toFixed(1) + "%";
              const pctColor = (v, low, high) => {
                if (v == null) return "var(--fg-3)";
                if (v >= high) return "var(--favourable-text,#15803d)";
                if (v >= low) return "var(--caution-text,#b45309)";
                return "var(--adverse-text,#b91c1c)";
              };

              async function generateShare(n) {
                setNeighShareStates(p => ({ ...p, [n.id]: "loading" }));
                try {
                  const r = await fetch(
                    apiUrl(`/api/portfolio/neighbourhoods/${n.id}/share?firm_token=${encodeURIComponent(firmToken)}`),
                    { method: "POST" }
                  );
                  if (!r.ok) throw new Error();
                  const { share_token } = await r.json();
                  const url = `${window.location.origin}/portal/neighbourhood/${share_token}`;
                  await navigator.clipboard?.writeText(url);
                  setNeighbourhoods(prev => prev.map(x => x.id === n.id ? { ...x, has_share: true, share_token } : x));
                  setNeighShareStates(p => ({ ...p, [n.id]: "copied" }));
                  setTimeout(() => setNeighShareStates(p => ({ ...p, [n.id]: "idle" })), 2500);
                } catch { setNeighShareStates(p => ({ ...p, [n.id]: "idle" })); }
              }

              async function copyShare(n) {
                const url = `${window.location.origin}/portal/neighbourhood/${n.share_token}`;
                await navigator.clipboard?.writeText(url);
                setNeighShareStates(p => ({ ...p, [n.id]: "copied" }));
                setTimeout(() => setNeighShareStates(p => ({ ...p, [n.id]: "idle" })), 2500);
              }

              async function revokeShare(n) {
                await fetch(
                  apiUrl(`/api/portfolio/neighbourhoods/${n.id}/share?firm_token=${encodeURIComponent(firmToken)}`),
                  { method: "DELETE" }
                );
                setNeighbourhoods(prev => prev.map(x => x.id === n.id ? { ...x, has_share: false, share_token: null } : x));
              }

              async function deleteNeigh(id) {
                await fetch(
                  apiUrl(`/api/portfolio/neighbourhoods/${id}?firm_token=${encodeURIComponent(firmToken)}`),
                  { method: "DELETE" }
                );
                setNeighbourhoods(prev => prev.filter(x => x.id !== id));
              }

              return (
                <div style={{ marginTop: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", font: "700 15px/1.2 var(--font-display)", color: "var(--ink)" }}>
                        Neighbourhoods
                      </h3>
                      <p style={{ margin: 0, font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
                        Borough-level reporting across PCNs &mdash; individual books stay separate
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNeighModal(true)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "none",
                        background: "var(--primary)", color: "#fff",
                        font: "var(--text-body-strong)", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      <Icon name="plus" size={13} /> New
                    </button>
                  </div>

                  {neighbourhoods.length === 0 && (
                    <div style={{ padding: "18px 20px", border: "1px dashed var(--border-strong)", borderRadius: 12,
                                  textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
                      No neighbourhoods yet. Create one to generate a borough-level portal link for external stakeholders.
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {neighbourhoods.map(n => {
                      const agg = n.aggregate || {};
                      const shareState = neighShareStates[n.id] || "idle";
                      return (
                        <div key={n.id} style={{
                          border: "1px solid var(--border)", borderRadius: 14,
                          overflow: "hidden", background: "var(--surface)",
                        }}>
                          {/* Neighbourhood header */}
                          <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start",
                                        justifyContent: "space-between", gap: 12,
                                        borderBottom: "1px solid var(--border)", background: "var(--surface-2,#f8fafc)" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <Icon name="map-pin" size={14} style={{ color: "var(--primary,#2563eb)" }} />
                                <span style={{ font: "700 14px/1 var(--font-display)", color: "var(--ink)" }}>
                                  {n.name}
                                </span>
                              </div>
                              <div style={{ marginTop: 4, fontSize: 12, color: "var(--fg-3)" }}>
                                {agg.pcn_count} PCN{agg.pcn_count !== 1 ? "s" : ""}&nbsp;&middot;&nbsp;
                                {agg.total_list_size ? agg.total_list_size.toLocaleString() + " patients" : ""}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {/* Share link controls */}
                              {n.has_share ? (
                                <React.Fragment>
                                  <button onClick={() => copyShare(n)} style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "6px 12px", borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--primary-border,rgba(37,99,235,.25))",
                                    background: shareState === "copied" ? "var(--primary)" : "var(--primary-soft,#eff6ff)",
                                    color: shareState === "copied" ? "#fff" : "var(--primary)",
                                    fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
                                  }}>
                                    <Icon name={shareState === "copied" ? "check" : "copy"} size={12} />
                                    {shareState === "copied" ? "Copied!" : "Copy portal link"}
                                  </button>
                                  <button onClick={() => revokeShare(n)} title="Revoke link" style={{
                                    padding: "6px 8px", borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--adverse-border,#fecaca)",
                                    background: "var(--adverse-soft,#fef2f2)", color: "var(--adverse-text,#b91c1c)",
                                    fontSize: 12, cursor: "pointer",
                                  }}>
                                    <Icon name="link-off" size={12} />
                                  </button>
                                </React.Fragment>
                              ) : (
                                <button onClick={() => generateShare(n)} style={{
                                  display: "inline-flex", alignItems: "center", gap: 5,
                                  padding: "6px 12px", borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-strong)",
                                  background: "var(--surface)", color: "var(--fg-2)",
                                  fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
                                }}>
                                  {shareState === "loading"
                                    ? <React.Fragment><div className="spinner" style={{ width: 10, height: 10 }} /> Generating…</React.Fragment>
                                    : <React.Fragment><Icon name="share-2" size={12} /> Generate portal link</React.Fragment>}
                                </button>
                              )}
                              <button onClick={() => deleteNeigh(n.id)} title="Delete neighbourhood" style={{
                                padding: "6px 8px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-strong)", background: "none",
                                color: "var(--fg-3)", cursor: "pointer",
                              }}>
                                <Icon name="trash-2" size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Aggregate KPI row */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                                        gap: 0, padding: "12px 18px 14px" }}>
                            {[
                              { label: "Income/patient",  value: fmt(agg.income_per_patient) },
                              { label: "Surplus/patient", value: fmt(agg.surplus_per_patient) },
                              { label: "ARRS util.",
                                value: pct(agg.avg_arrs_utilisation_pct),
                                color: pctColor(agg.avg_arrs_utilisation_pct, 50, 80) },
                              { label: "QOF ach.",
                                value: pct(agg.avg_qof_achievement_pct),
                                color: pctColor(agg.avg_qof_achievement_pct, 80, 95) },
                            ].map(kpi => (
                              <div key={kpi.label} style={{ padding: "4px 0" }}>
                                <div style={{ fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase",
                                              letterSpacing: ".05em", fontWeight: 600, marginBottom: 2 }}>
                                  {kpi.label}
                                </div>
                                <div style={{ font: "700 15px/1 var(--font-display)", color: kpi.color || "var(--ink)" }}>
                                  {kpi.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Briefing error */}
            {briefStatus === "error" && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--adverse-soft)",
                border: "1px solid var(--adverse-border)", borderRadius: "var(--radius-sm)",
                font: "var(--text-body)", fontSize: 13, color: "var(--adverse-text)" }}>
                Briefing failed. Make sure <code>OPENAI_API_KEY</code> is set on the server.{" "}
                <button onClick={generateBriefing} style={{ marginLeft: 8, textDecoration: "underline",
                  background: "none", border: "none", color: "inherit", cursor: "pointer" }}>Retry</button>
              </div>
            )}

            {/* Copy all briefs to clipboard */}
            {briefStatus === "done" && Object.keys(briefs).length > 0 && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "var(--primary-soft)",
                borderRadius: "var(--radius-sm)", border: "1px solid var(--primary-border, rgba(79,70,229,.2))" }}>
                <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--primary)" }}>
                  <Icon name="check-circle" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Morning briefing ready — {Object.keys(briefs).length} client{Object.keys(briefs).length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => {
                    const lines = (data?.clients || [])
                      .filter(c => briefs[c.session_id])
                      .map(c => `${c.name}\n${briefs[c.session_id]}`);
                    navigator.clipboard?.writeText(lines.join("\n\n"));
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--primary)",
                    display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <Icon name="copy" size={13} /> Copy all
                </button>
              </div>
            )}

            {isDemo && (
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 16, lineHeight: 1.5 }}>
                <Icon name="info" size={11} /> Demo portfolio with synthetic data. Switch to{" "}
                <button onClick={() => switchMode("real")} style={{
                  background: "none", border: "none", color: "var(--primary)",
                  cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline",
                }}>My clients</button>{" "}
                and upload real P&amp;Ls to build your live practice triage.
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddClientModal firmToken={firmToken} onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}
      {updating && (
        <UpdateCashModal client={updating} firmToken={firmToken}
          onClose={() => setUpdating(null)} onUpdated={handleUpdated} />
      )}
      {showNeighModal && (
        <CreateNeighbourhoodModal
          firmToken={firmToken}
          nhsClients={(data?.clients || []).filter(c => c.sector === "nhs_gp")}
          onClose={() => setShowNeighModal(false)}
          onCreated={(n) => {
            setNeighbourhoods(prev => [n, ...prev]);
            setShowNeighModal(false);
          }}
        />
      )}
    </div>
  );
}

Object.assign(window, { Portfolio });
