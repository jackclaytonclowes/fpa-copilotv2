/* MonthEndIQ — Practice Portfolio (firm mode): multi-client month-end triage */

// ── Firm token — persisted per browser so the same firm's clients reload ──
function getFirmToken() {
  let t = localStorage.getItem("meiq_firm_token");
  if (!t) { t = crypto.randomUUID(); localStorage.setItem("meiq_firm_token", t); }
  return t;
}

const SECTORS = [
  "Accountancy", "Construction", "E-commerce", "Hospitality",
  "Manufacturing", "Professional services", "Property", "Retail",
  "SaaS", "Other",
];

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
  const [cash, setCash]       = React.useState("");
  const [file, setFile]       = React.useState(null);
  const [status, setStatus]   = React.useState("idle"); // idle | uploading | error
  const [errMsg, setErrMsg]   = React.useState("");
  const fileRef               = React.useRef();

  const canSubmit = name.trim() && file && status !== "uploading";

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("uploading");
    setErrMsg("");
    const fd = new FormData();
    fd.append("firm_token",   firmToken);
    fd.append("name",         name.trim());
    fd.append("sector",       sector);
    fd.append("cash_balance", cash ? parseFloat(cash) : 0);
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

// ── Main Portfolio component ───────────────────────────────────────────────
function Portfolio({ onOpenClient }) {
  const { Icon } = window;
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
      alert("Could not delete client. Please try again.");
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
        apiUrl(`/api/portfolio/briefing?firm_token=${encodeURIComponent(firmToken)}`),
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

  function fmtGBP(v) {
    if (v == null || isNaN(v)) return "—";
    const a = Math.abs(v), s = v < 0 ? "-£" : "£";
    return a >= 1e6 ? `${s}${(a / 1e6).toFixed(2)}m` : a >= 1e3 ? `${s}${(a / 1e3).toFixed(0)}k` : `${s}${Math.round(a)}`;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return ""; }
  }

  const isDemo = mode === "demo";
  const hasClients = data?.clients?.length > 0;

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

            {/* Triage list */}
            {hasClients && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.clients.map((c) => {
                  const t = TIER[c.tier] || TIER.healthy;
                  const isConfirmingDelete = deleting === c.session_id;
                  return (
                    <div key={c.session_id} className="card" style={{
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
                        <div style={{ font: "var(--text-body-strong)", fontSize: 14.5, color: "var(--fg-1)" }}>
                          {c.name}
                        </div>
                        <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginBottom: 4 }}>
                          {c.sector}
                          {c.updated_at && (
                            <span style={{ marginLeft: 8, opacity: .7 }}>
                              · updated {fmtDate(c.updated_at)}
                            </span>
                          )}
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
                      <div style={{ display: "flex", gap: 22, flexShrink: 0 }}>
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
                                const base = `${window.location.origin}/view/${c.session_id}`;
                                const url  = firm ? `${base}?firm=${encodeURIComponent(firm)}` : base;
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
    </div>
  );
}

Object.assign(window, { Portfolio });
