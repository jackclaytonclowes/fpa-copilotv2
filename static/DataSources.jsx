/* FP&A Copilot — Data sources view */
const { useState: useStateDS, useRef: useRefDS } = React;

function DataSources({ sessionData, availablePeriods, onLoad,
                       entities, onAddEntity, onConsolidate,
                       consolidating, isConsolidated, onExitConsolidated }) {
  const { Icon, MethodCard, DemoCard, Button } = window;

  const [importMethod,      setImportMethod]      = useStateDS("upload");
  const [mode,              setMode]              = useStateDS(sessionData?.analysis_type === "budget_vs_actual" ? "budget_vs_actual" : "month_on_month");
  const [dragging,          setDragging]          = useStateDS(false);
  const [loading,           setLoading]           = useStateDS(false);
  const [demoLoading,       setDemoLoading]       = useStateDS(null);
  const [error,             setError]             = useStateDS(null);
  const [entityDragging,    setEntityDragging]    = useStateDS(false);

  // Xero OAuth state
  const [xeroStatus,    setXeroStatus]    = useStateDS("idle"); // idle | checking | unconfigured | ready | connecting | connected | importing | error
  const [xeroState,     setXeroState]     = useStateDS(null);   // OAuth state param
  const [xeroTenants,   setXeroTenants]   = useStateDS([]);
  const [xeroTenant,    setXeroTenant]    = useStateDS("");
  const [xeroError,     setXeroError]     = useStateDS(null);
  const [xeroFromDate,  setXeroFromDate]  = useStateDS("");
  const [xeroToDate,    setXeroToDate]    = useStateDS("");
  const [entityLoading,     setEntityLoading]     = useStateDS(false);
  const [entityError,       setEntityError]       = useStateDS(null);
  const inputRef       = useRefDS(null);
  const entityInputRef = useRefDS(null);

  /* ── helpers ── */
  const fmtPeriod = (p) => {
    if (!p) return "";
    const parts = String(p).split("-");
    if (parts.length < 2) return String(p);
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };

  const fmtMoney = (v) => {
    if (v == null || isNaN(Number(v))) return "—";
    return window.fmtCurrency(Number(v), { compact: true });
  };

  /* ── derived dataset info ── */
  const isBvA   = sessionData?.analysis_type === "budget_vs_actual";
  const periods = availablePeriods || [];
  const periodRange = isBvA
    ? "Full Year"
    : periods.length >= 2
      ? `${fmtPeriod(periods[0])} – ${fmtPeriod(periods[periods.length - 1])}`
      : periods.length === 1
        ? fmtPeriod(periods[0])
        : "—";

  const kpis = sessionData?.kpis || [];
  const revKpi = kpis.find(k =>
    k.label && (k.label.toLowerCase().includes("turnover") || k.label.toLowerCase().includes("revenue"))
  );
  const opKpi  = kpis.find(k => k.label === "Operating Profit");

  /* ── upload handler ── */
  const upload = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Please upload a CSV or Excel file (.csv, .xlsx).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(apiUrl(`/api/upload?mode=${mode}`), { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed." }));
        throw new Error(err.detail || "Upload failed.");
      }
      onLoad(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = async (endpoint, key) => {
    setDemoLoading(key);
    setError(null);
    try {
      const res = await fetch(apiUrl(endpoint));
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Demo load failed." }));
        throw new Error(err.detail || "Demo load failed.");
      }
      onLoad(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setDemoLoading(null);
    }
  };

  const uploadEntity = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setEntityError("Please upload a CSV or Excel file (.csv, .xlsx).");
      return;
    }
    setEntityLoading(true);
    setEntityError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(apiUrl("/api/upload?mode=month_on_month"), { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed." }));
        throw new Error(err.detail || "Upload failed.");
      }
      onAddEntity(await res.json());
      setImportMethod("upload");
    } catch (e) {
      setEntityError(e.message);
    } finally {
      setEntityLoading(false);
    }
  };

  const switchMethod = (m) => { setImportMethod(m); setError(null); setEntityError(null); };

  // Check Xero config status when tab selected
  React.useEffect(() => {
    if (importMethod !== "xero" || xeroStatus !== "idle") return;
    setXeroStatus("checking");
    fetch(apiUrl("/api/xero/status"))
      .then(r => r.json())
      .then(d => setXeroStatus(d.configured ? "ready" : "unconfigured"))
      .catch(() => setXeroStatus("unconfigured"));
  }, [importMethod]);

  // Listen for OAuth callback postMessage
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "xero_connected" && e.data.state) {
        setXeroState(e.data.state);
        setXeroStatus("connected");
        // Fetch tenants
        fetch(apiUrl(`/api/xero/tenants?state=${e.data.state}`))
          .then(r => r.json())
          .then(d => {
            setXeroTenants(d.tenants || []);
            if (d.tenants?.length === 1) setXeroTenant(d.tenants[0].id);
          })
          .catch(() => setXeroError("Failed to fetch organisations."));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const startXeroAuth = async () => {
    setXeroStatus("connecting");
    setXeroError(null);
    try {
      const resp = await fetch(apiUrl("/api/xero/auth"));
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      const { auth_url, state } = await resp.json();
      setXeroState(state);
      window.open(auth_url, "xero_auth", "width=600,height=700,popup=1");
    } catch (e) {
      setXeroError(e.message);
      setXeroStatus("ready");
    }
  };

  const importFromXero = async () => {
    if (!xeroTenant) return;
    setXeroStatus("importing");
    setXeroError(null);
    try {
      const params = new URLSearchParams({ state: xeroState, tenant_id: xeroTenant });
      if (xeroFromDate) params.set("from_date", xeroFromDate);
      if (xeroToDate) params.set("to_date", xeroToDate);
      const resp = await fetch(apiUrl(`/api/xero/import?${params}`));
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      onLoad && onLoad(data);
    } catch (e) {
      setXeroError(e.message);
      setXeroStatus("connected");
    }
  };

  /* ── shared section-label style ── */
  const secLabel = {
    font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
    letterSpacing: ".07em", color: "var(--fg-3)", marginBottom: 12,
  };

  const card = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "18px 20px",
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 680, margin: "0 auto" }}>

      {/* ── CURRENT DATASET ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={secLabel}>Current dataset</div>
        <div style={{ ...card, display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "var(--radius-sm)",
            background: "var(--primary-soft)", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name={isBvA ? "target" : "file-bar-chart"} size={20} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--fg-1)" }}>
                {sessionData?.file_name || "Untitled dataset"}
              </span>
              <span style={{
                font: "var(--text-label)", fontSize: 10, textTransform: "uppercase",
                letterSpacing: ".06em", padding: "2px 7px", borderRadius: 20,
                background: "var(--primary-soft)", color: "var(--primary)",
                whiteSpace: "nowrap",
              }}>
                {isBvA ? "Budget vs Actual" : "P&L Variance Analysis"}
              </span>
            </div>
            <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-3)", marginBottom: 12 }}>
              {periodRange}
              {!isBvA && periods.length > 0 && ` · ${periods.length} period${periods.length !== 1 ? "s" : ""}`}
            </div>
            {(revKpi || opKpi) && (
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {revKpi && (
                  <div>
                    <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--fg-3)", marginBottom: 2 }}>
                      {isBvA ? "Revenue (Actual)" : "Revenue"}
                    </div>
                    <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--fg-1)" }}>
                      {fmtMoney(revKpi.value)}
                    </div>
                  </div>
                )}
                {opKpi && (
                  <div>
                    <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--fg-3)", marginBottom: 2 }}>
                      {isBvA ? "Op. Profit (Actual)" : "Op. Profit"}
                    </div>
                    <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--fg-1)" }}>
                      {fmtMoney(opKpi.value)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MULTI-ENTITY SECTION ── */}
      {entities && entities.length >= 1 && (
        <div style={{ marginBottom: 28 }}>
          <div style={secLabel}>
            {entities.length >= 2 ? `Group entities (${entities.length})` : "Entity"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {entities.map((e, i) => (
              <div key={e.sessionId} style={{
                ...card, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
                background: i === 0 ? "var(--surface)" : "var(--surface-2)",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "var(--primary-soft)", color: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  font: "var(--text-label)", fontSize: 11, fontWeight: 700,
                }}>
                  {i + 1}
                </div>
                <span style={{ flex: 1, font: "var(--text-body)", fontSize: 13, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.fileName}
                </span>
                {i === 0 && (
                  <span style={{
                    font: "var(--text-label)", fontSize: 9.5, textTransform: "uppercase",
                    letterSpacing: ".06em", padding: "2px 6px", borderRadius: 20,
                    background: "var(--primary-soft-2)", color: "var(--primary)", whiteSpace: "nowrap",
                  }}>Primary</span>
                )}
              </div>
            ))}
          </div>
          {entities.length >= 2 && (
            <div style={{ display: "flex", gap: 8 }}>
              {isConsolidated ? (
                <button
                  onClick={onExitConsolidated}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "9px 16px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                    border: "1px solid var(--border-strong)", background: "var(--surface-2)",
                    color: "var(--fg-2)", font: "var(--text-body-strong)", fontSize: 13,
                  }}
                >
                  <Icon name="layers" size={14} /> Exit consolidated view
                </button>
              ) : (
                <button
                  onClick={() => onConsolidate(entities)}
                  disabled={consolidating}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "9px 16px", borderRadius: "var(--radius-sm)", cursor: consolidating ? "default" : "pointer",
                    border: "1.5px solid var(--primary)", background: "var(--primary-soft)",
                    color: "var(--primary)", font: "var(--text-body-strong)", fontSize: 13,
                    opacity: consolidating ? 0.7 : 1,
                  }}
                >
                  {consolidating
                    ? <React.Fragment><div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Consolidating…</React.Fragment>
                    : <React.Fragment><Icon name="layers" size={14} /> Consolidate {entities.length} entities</React.Fragment>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 28 }} />

      {/* ── REPLACE / ADD DATASET ── */}
      <div>
        <div style={secLabel}>{entities && entities.length >= 1 ? "Load a different dataset" : "Import data"}</div>

        {/* Method selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <MethodCard icon="upload-cloud" label="Upload file"  active={importMethod === "upload"}     onClick={() => switchMethod("upload")}     />
          <MethodCard icon="play-circle"  label="Demo data"    active={importMethod === "demo"}       onClick={() => switchMethod("demo")}       />
          <MethodCard icon="link"         label="Connect Xero" active={importMethod === "xero"}       onClick={() => switchMethod("xero")}       />
          {sessionData && (
            <MethodCard icon="layers"     label="Add entity"   active={importMethod === "add-entity"} onClick={() => switchMethod("add-entity")} />
          )}
        </div>

        {/* Upload */}
        {importMethod === "upload" && (
          <React.Fragment>
            <div style={{ marginBottom: 14 }}>
              <div className="seg" style={{ display: "inline-flex" }}>
                <button
                  className={mode === "month_on_month" ? "on" : ""}
                  onClick={() => setMode("month_on_month")}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="calendar-days" size={13} /> P&L Variance Analysis
                </button>
                <button
                  className={mode === "budget_vs_actual" ? "on" : ""}
                  onClick={() => setMode("budget_vs_actual")}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="target" size={13} /> Budget vs Actual
                </button>
              </div>
            </div>
            <div
              className={`dropzone${dragging ? " drag" : ""}`}
              onClick={() => !loading && inputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
            >
              {loading ? (
                <React.Fragment>
                  <div className="spinner" style={{ margin: "0 auto 12px" }} />
                  <div className="dz-t">Analysing your P&amp;L…</div>
                  <div className="dz-s">
                    {mode === "budget_vs_actual"
                      ? "Detecting Actual and Budget columns, calculating variances"
                      : "Classifying accounts and building variance analysis"}
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="dz-ic"><Icon name="upload-cloud" size={34} /></div>
                  <div className="dz-t">Drag &amp; drop your P&amp;L file</div>
                  <div className="dz-s">CSV or XLSX · exported straight from Xero, Sage or your ledger</div>
                </React.Fragment>
              )}
            </div>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
              onChange={(e) => upload(e.target.files[0])} />
          </React.Fragment>
        )}

        {/* Demo */}
        {importMethod === "demo" && (
          <div>
            <DemoCard
              icon="calendar-days"
              title="Meridian Software Ltd"
              badge="P&L Variance Analysis"
              description="12-month P&L — software licences and consulting revenue"
              detail="Jul 2024 – Jun 2025 · £1.26m revenue · Full cost structure"
              endpoint="/api/demo"
              demoKey="mom"
              demoLoading={demoLoading}
              loading={loading}
              onDemo={loadDemo}
            />
            <DemoCard
              icon="target"
              title="Meridian Software Ltd"
              badge="Budget vs Actual"
              description="Full-year actuals vs budget — favourable and adverse variances"
              detail="FY 2025 · £1.36m actual vs £1.38m budget · −£35.8k operating profit variance"
              endpoint="/api/demo-bva"
              demoKey="bva"
              demoLoading={demoLoading}
              loading={loading}
              onDemo={loadDemo}
            />
            <DemoCard
              icon="zap"
              title="Apex Digital Ltd"
              badge="Xero format"
              description="Digital agency P&L — Xero account codes (200–470 series)"
              detail="Jul 2024 – Jun 2025 · £1.29m revenue · 16.8% operating margin"
              endpoint="/api/demo-xero"
              demoKey="xero"
              demoLoading={demoLoading}
              loading={loading}
              onDemo={loadDemo}
            />
          </div>
        )}

        {/* Xero */}
        {importMethod === "xero" && (
          <div style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "var(--radius-sm)",
                background: "#13B5EA22", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="link" size={18} color="#13B5EA" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: "var(--text-body-strong)", fontSize: 13.5, color: "var(--fg-1)" }}>Connect to Xero</div>
                <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>Import your P&amp;L directly from Xero</div>
              </div>
              {xeroStatus === "connected" && (
                <span style={{
                  font: "var(--text-label)", fontSize: 10, textTransform: "uppercase",
                  letterSpacing: ".06em", padding: "3px 8px", borderRadius: 20,
                  background: "var(--favourable-soft)", color: "var(--favourable-text)",
                  border: "1px solid var(--favourable)", whiteSpace: "nowrap",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}><Icon name="check-circle" size={11} />Connected</span>
              )}
            </div>

            {/* Error banner */}
            {xeroError && (
              <div style={{
                padding: "10px 14px", marginBottom: 12, borderRadius: "var(--radius-sm)",
                background: "var(--adverse-soft)", border: "1px solid var(--adverse-border)",
                font: "var(--text-body)", fontSize: 12.5, color: "var(--adverse-text)",
              }}>{xeroError}</div>
            )}

            {/* Step 1: Not configured */}
            {xeroStatus === "unconfigured" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  padding: "14px 16px", borderRadius: "var(--radius-sm)",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.55,
                }}>
                  <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--fg-1)", marginBottom: 6 }}>
                    Xero integration not configured
                  </div>
                  To connect, set these environment variables and restart the server:
                  <div style={{ font: "12px var(--font-mono)", marginTop: 8, padding: "8px 10px", background: "var(--surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border)" }}>
                    XERO_CLIENT_ID=your_client_id<br/>
                    XERO_CLIENT_SECRET=your_secret<br/>
                    XERO_REDIRECT_URI=http://localhost:8000/api/xero/callback
                  </div>
                  <div style={{ marginTop: 8, font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)" }}>
                    Register an app at{" "}
                    <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener"
                      style={{ color: "var(--primary)" }}>developer.xero.com</a>
                    {" "}with redirect URI matching the value above.
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Ready to connect */}
            {(xeroStatus === "ready" || xeroStatus === "connecting") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
                  {[
                    { step: "1", text: "Authenticate securely via Xero OAuth 2.0", active: true },
                    { step: "2", text: "Choose your organisation", active: false },
                    { step: "3", text: "Import Profit & Loss for your date range", active: false },
                  ].map(({ step, text, active }) => (
                    <div key={step} style={{ display: "flex", gap: 9, alignItems: "flex-start", opacity: active ? 1 : 0.5 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: active ? "var(--primary-soft)" : "var(--surface-2)",
                        color: active ? "var(--primary)" : "var(--fg-3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        font: "var(--text-label)", fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                      }}>{step}</div>
                      <div style={{ font: "var(--text-body)", fontSize: 12.5, color: active ? "var(--fg-1)" : "var(--fg-3)", paddingTop: 2 }}>{text}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={startXeroAuth}
                  disabled={xeroStatus === "connecting"}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, padding: "11px 0",
                    borderRadius: "var(--radius-sm)", border: "none",
                    background: "#13B5EA", color: "#fff",
                    font: "var(--text-body-strong)", fontSize: 14, cursor: "pointer",
                    opacity: xeroStatus === "connecting" ? 0.7 : 1,
                  }}
                >
                  {xeroStatus === "connecting"
                    ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: "#fff transparent #fff transparent" }} /> Waiting for Xero…</React.Fragment>
                    : <React.Fragment><Icon name="log-in" size={16} /> Connect to Xero</React.Fragment>
                  }
                </button>
              </div>
            )}

            {/* Step 2+3: Connected — pick tenant & date range, then import */}
            {(xeroStatus === "connected" || xeroStatus === "importing") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Tenant picker */}
                <div>
                  <div style={{ ...secLabel, marginBottom: 6 }}>Organisation</div>
                  {xeroTenants.length === 0 ? (
                    <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-3)" }}>No organisations found.</div>
                  ) : (
                    <select
                      value={xeroTenant}
                      onChange={e => setXeroTenant(e.target.value)}
                      style={{
                        width: "100%", padding: "8px 10px",
                        font: "var(--text-body)", fontSize: 13, color: "var(--ink)",
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)", cursor: "pointer",
                      }}
                    >
                      <option value="">Select an organisation…</option>
                      {xeroTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Date range */}
                <div>
                  <div style={{ ...secLabel, marginBottom: 6 }}>Date range (optional — defaults to last 12 months)</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="date" value={xeroFromDate} onChange={e => setXeroFromDate(e.target.value)}
                      placeholder="From"
                      style={{
                        flex: 1, padding: "7px 10px",
                        font: "var(--text-body)", fontSize: 12.5, color: "var(--ink)",
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                      }} />
                    <input type="date" value={xeroToDate} onChange={e => setXeroToDate(e.target.value)}
                      placeholder="To"
                      style={{
                        flex: 1, padding: "7px 10px",
                        font: "var(--text-body)", fontSize: 12.5, color: "var(--ink)",
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                      }} />
                  </div>
                </div>

                {/* Import button */}
                <button
                  onClick={importFromXero}
                  disabled={!xeroTenant || xeroStatus === "importing"}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, padding: "11px 0",
                    borderRadius: "var(--radius-sm)", border: "none",
                    background: "var(--primary)", color: "#fff",
                    font: "var(--text-body-strong)", fontSize: 14, cursor: "pointer",
                    opacity: !xeroTenant || xeroStatus === "importing" ? 0.6 : 1,
                  }}
                >
                  {xeroStatus === "importing"
                    ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: "#fff transparent #fff transparent" }} /> Importing P&amp;L…</React.Fragment>
                    : <React.Fragment><Icon name="download" size={16} /> Import Profit &amp; Loss</React.Fragment>
                  }
                </button>
              </div>
            )}

            {/* Loading / checking state */}
            {(xeroStatus === "idle" || xeroStatus === "checking") && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto 10px" }} />
                <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-3)" }}>Checking Xero configuration…</div>
              </div>
            )}

            {/* Demo fallback — always available */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 14 }}>
              <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", marginBottom: 10 }}>
                Try a Xero-format demo dataset:
              </div>
              <button
                onClick={() => loadDemo("/api/demo-xero", "xero")}
                disabled={demoLoading !== null || loading}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, padding: "9px 0",
                  borderRadius: "var(--radius-sm)", border: "1.5px dashed var(--primary)",
                  background: "var(--primary-soft)", color: "var(--primary)",
                  font: "var(--text-body-strong)", fontSize: 13.5, cursor: "pointer",
                  opacity: demoLoading !== null ? 0.7 : 1,
                }}
              >
                {demoLoading === "xero"
                  ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading demo…</React.Fragment>
                  : <React.Fragment><Icon name="play-circle" size={15} /> Try Xero-Style Demo — Apex Digital Ltd</React.Fragment>
                }
              </button>
            </div>
          </div>
        )}

        {/* Add entity */}
        {importMethod === "add-entity" && (
          <React.Fragment>
            <div style={{ ...card, marginBottom: 14, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Icon name="layers" size={16} color="var(--primary)" />
                <span style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--fg-1)" }}>
                  Add another P&amp;L entity
                </span>
              </div>
              <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-3)" }}>
                Upload a second entity's P&amp;L for consolidation. Once two or more entities are loaded you can merge them into a group view.
              </div>
            </div>
            <div
              className={`dropzone${entityDragging ? " drag" : ""}`}
              onClick={() => !entityLoading && entityInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setEntityDragging(true); }}
              onDragLeave={() => setEntityDragging(false)}
              onDrop={(e) => { e.preventDefault(); setEntityDragging(false); uploadEntity(e.dataTransfer.files[0]); }}
            >
              {entityLoading ? (
                <React.Fragment>
                  <div className="spinner" style={{ margin: "0 auto 12px" }} />
                  <div className="dz-t">Analysing entity P&amp;L…</div>
                  <div className="dz-s">Building variance analysis for the new entity</div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="dz-ic"><Icon name="layers" size={34} /></div>
                  <div className="dz-t">Drag &amp; drop entity P&amp;L</div>
                  <div className="dz-s">CSV or XLSX · monthly P&L, same format as your primary file</div>
                </React.Fragment>
              )}
            </div>
            <input ref={entityInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
              onChange={(e) => uploadEntity(e.target.files[0])} />
            {entityError && (
              <div className="upload-err" style={{ marginTop: 12 }}>{entityError}</div>
            )}
          </React.Fragment>
        )}

        {/* Error */}
        {error && (
          <div className="upload-err" style={{ marginTop: 12, whiteSpace: "pre-line", lineHeight: 1.6 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { DataSources });
