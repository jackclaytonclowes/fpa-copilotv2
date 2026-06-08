/* FP&A Copilot — Data sources view */
const { useState: useStateDS, useRef: useRefDS } = React;

function DataSources({ sessionData, availablePeriods, onLoad }) {
  const { Icon, MethodCard, DemoCard } = window;

  const [importMethod, setImportMethod] = useStateDS("upload");
  const [mode,         setMode]         = useStateDS(sessionData?.analysis_type === "budget_vs_actual" ? "budget_vs_actual" : "month_on_month");
  const [dragging,     setDragging]     = useStateDS(false);
  const [loading,      setLoading]      = useStateDS(false);
  const [demoLoading,  setDemoLoading]  = useStateDS(null);
  const [error,        setError]        = useStateDS(null);
  const inputRef = useRefDS(null);

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
    const n = Number(v);
    if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
    if (Math.abs(n) >= 1_000)     return `£${(n / 1_000).toFixed(0)}k`;
    return `£${n.toLocaleString("en-GB")}`;
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
      const res = await fetch(`/api/upload?mode=${mode}`, { method: "POST", body: fd });
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
      const res = await fetch(endpoint);
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

  const switchMethod = (m) => { setImportMethod(m); setError(null); };

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
                {isBvA ? "Budget vs Actual" : "Month-on-Month"}
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

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 28 }} />

      {/* ── REPLACE DATASET ── */}
      <div>
        <div style={secLabel}>Load a different dataset</div>

        {/* Method selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <MethodCard icon="upload-cloud" label="Upload file"  active={importMethod === "upload"} onClick={() => switchMethod("upload")} />
          <MethodCard icon="play-circle"  label="Demo data"    active={importMethod === "demo"}   onClick={() => switchMethod("demo")}   />
          <MethodCard icon="link"         label="Connect Xero" active={importMethod === "xero"}   onClick={() => switchMethod("xero")}   />
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
                  <Icon name="calendar-days" size={13} /> Month-on-Month
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
              badge="Month-on-Month"
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
              <span style={{
                font: "var(--text-label)", fontSize: 10, textTransform: "uppercase",
                letterSpacing: ".06em", padding: "3px 8px", borderRadius: 20,
                background: "var(--surface-2)", color: "var(--fg-3)",
                border: "1px solid var(--border)", whiteSpace: "nowrap",
              }}>Coming soon</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { step: "1", text: "Authenticate securely via Xero OAuth 2.0" },
                { step: "2", text: "Choose your organisation from connected Xero tenants" },
                { step: "3", text: "Import the Profit & Loss report for your date range" },
                { step: "4", text: "Select month-by-month, quarterly, or year-to-date views" },
                { step: "5", text: "Generate your variance dashboard and management pack" },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--primary-soft)", color: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    font: "var(--text-label)", fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                  }}>{step}</div>
                  <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5, paddingTop: 2 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
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
