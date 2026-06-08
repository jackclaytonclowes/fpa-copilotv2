/* FP&A Copilot — upload screen with Xero integration UI */
const { useState: useStateUpload, useRef: useRefUpload } = React;

function MethodCard({ icon, label, active, onClick }) {
  const { Icon } = window;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        gap: 6, padding: "12px 8px",
        borderRadius: "var(--radius-sm)",
        border: active ? "2px solid var(--primary)" : "1.5px solid var(--border)",
        background: active ? "var(--primary-soft)" : "var(--surface)",
        color: active ? "var(--primary)" : "var(--fg-2)",
        cursor: "pointer", transition: "all .15s",
        font: "var(--text-body)", fontSize: 12.5,
      }}
    >
      <Icon name={icon} size={18} color={active ? "var(--primary)" : "var(--fg-3)"} />
      {label}
    </button>
  );
}

function DemoCard({ icon, title, badge, description, detail, endpoint, demoKey, demoLoading, loading, onDemo }) {
  const { Icon } = window;
  const isLoading = demoLoading === demoKey;
  return (
    <button
      onClick={() => onDemo(endpoint, demoKey)}
      disabled={demoLoading !== null || loading}
      style={{
        width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px", marginBottom: 10,
        borderRadius: "var(--radius-sm)",
        border: isLoading ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
        background: isLoading ? "var(--primary-soft)" : "var(--surface)",
        cursor: demoLoading !== null || loading ? "default" : "pointer",
        textAlign: "left", transition: "border-color .15s, background .15s",
        opacity: (demoLoading !== null && !isLoading) ? 0.5 : 1,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "var(--radius-sm)",
        background: "var(--primary-soft)", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        {isLoading
          ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          : <Icon name={icon} size={16} color="var(--primary)" />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ font: "var(--text-body-strong)", fontSize: 13.5, color: "var(--fg-1)" }}>
            {title}
          </span>
          <span style={{
            font: "var(--text-label)", fontSize: 10, textTransform: "uppercase",
            letterSpacing: ".06em", padding: "2px 6px",
            borderRadius: 20, background: "var(--primary-soft)", color: "var(--primary)",
            whiteSpace: "nowrap",
          }}>
            {badge}
          </span>
        </div>
        <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", marginBottom: 2 }}>
          {description}
        </div>
        <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)" }}>
          {detail}
        </div>
      </div>
      <div style={{ color: "var(--fg-3)", flexShrink: 0, paddingTop: 2 }}>
        <Icon name="chevron-right" size={14} />
      </div>
    </button>
  );
}

function UploadScreen({ onLoad, onLoadDemo }) {
  const { Icon } = window;
  const [importMethod, setImportMethod] = useStateUpload("upload");
  const [dragging,     setDragging]     = useStateUpload(false);
  const [loading,      setLoading]      = useStateUpload(false);
  const [demoLoading,  setDemoLoading]  = useStateUpload(null);
  const [error,        setError]        = useStateUpload(null);
  const [mode,         setMode]         = useStateUpload("month_on_month");
  const [showGuide,    setShowGuide]    = useStateUpload(false);
  const inputRef = useRefUpload(null);

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
      const data = await res.json();
      onLoad(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = async (endpoint, key) => {
    if (!onLoadDemo) return;
    setDemoLoading(key);
    setError(null);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Demo load failed." }));
        throw new Error(err.detail || "Demo load failed.");
      }
      const data = await res.json();
      onLoadDemo(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDemoLoading(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  };

  const switchMethod = (method) => {
    setImportMethod(method);
    setError(null);
  };

  return (
    <div className="upload-wrap reveal">
      <div className="upload-card">
        <div className="hero-mark"><Icon name="bar-chart-3" size={30} color="#fff" /></div>
        <h1>Upload a P&amp;L to begin</h1>
        <p className="sub">
          Drop a monthly profit &amp; loss export (CSV or Excel) and MonthEndIQ will
          analyse variance, surface key movements, write commentary, and build a management pack.
        </p>

        {/* Import method selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <MethodCard icon="upload-cloud" label="Upload file"  active={importMethod === "upload"} onClick={() => switchMethod("upload")} />
          <MethodCard icon="play-circle"  label="Demo data"    active={importMethod === "demo"}   onClick={() => switchMethod("demo")}   />
          <MethodCard icon="link"         label="Connect Xero" active={importMethod === "xero"}   onClick={() => switchMethod("xero")}   />
        </div>

        {/* ── Upload section ── */}
        {importMethod === "upload" && (
          <React.Fragment>
            <div style={{ marginBottom: 20 }}>
              <div style={{ font: "var(--text-label)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--fg-3)", marginBottom: 8 }}>
                Analysis mode
              </div>
              <div className="seg" style={{ display: "inline-flex" }}>
                <button
                  className={mode === "month_on_month" ? "on" : ""}
                  onClick={() => setMode("month_on_month")}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="calendar-days" size={13} />
                  Month-on-Month
                </button>
                <button
                  className={mode === "budget_vs_actual" ? "on" : ""}
                  onClick={() => setMode("budget_vs_actual")}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="target" size={13} />
                  Budget vs Actual
                </button>
              </div>
              <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 7, lineHeight: 1.5 }}>
                {mode === "month_on_month"
                  ? "Upload a monthly P&L export. MonthEndIQ will compare each period against the prior period."
                  : "Upload a file with Actual and Budget columns. MonthEndIQ will calculate variances against budget."}
              </div>
            </div>

            <div
              className={`dropzone${dragging ? " drag" : ""}`}
              onClick={() => !loading && inputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
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

            {/* Format guide (collapsible) */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowGuide(!showGuide)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "none",
                  border: "none", cursor: "pointer", padding: 0,
                  font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-3)",
                }}
              >
                <Icon name={showGuide ? "chevron-up" : "chevron-down"} size={14} />
                File format guide
              </button>
              {showGuide && (
                <div style={{
                  marginTop: 10, padding: "14px 16px",
                  background: "var(--surface)", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.7,
                }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Month-on-Month (CSV or XLSX)</p>
                  <div style={{
                    fontFamily: "var(--font-mono, monospace)", fontSize: 11.5,
                    background: "var(--surface-2)", padding: "8px 12px",
                    borderRadius: "var(--radius-sm)", marginBottom: 10, overflowX: "auto",
                  }}>
                    Section&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Account&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Apr 2024&nbsp;| May 2024&nbsp;| Jun 2024<br/>
                    Turnover&nbsp;&nbsp;&nbsp;&nbsp;| Product Sales&nbsp;| 50,000&nbsp;&nbsp;&nbsp;| 55,000&nbsp;&nbsp;&nbsp;| 52,000<br/>
                    Staff Costs&nbsp;| Staff Wages&nbsp;&nbsp;&nbsp;| 20,000&nbsp;&nbsp;&nbsp;| 21,000&nbsp;&nbsp;&nbsp;| 22,000
                  </div>
                  <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Budget vs Actual (XLSX — two sheets)</p>
                  <p style={{ margin: "0 0 4px" }}>
                    Sheet 1 named <strong>Actuals</strong> and Sheet 2 named <strong>Budget</strong>,
                    each with Section | Account | month columns.
                  </p>
                  <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Budget vs Actual (CSV or single-sheet XLSX)</p>
                  <div style={{
                    fontFamily: "var(--font-mono, monospace)", fontSize: 11.5,
                    background: "var(--surface-2)", padding: "8px 12px",
                    borderRadius: "var(--radius-sm)", overflowX: "auto",
                  }}>
                    Account&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Actual&nbsp;&nbsp;| Budget<br/>
                    Product Sales&nbsp;| 52,000&nbsp;&nbsp;| 50,000<br/>
                    Staff Wages&nbsp;&nbsp;&nbsp;| 22,500&nbsp;&nbsp;| 21,000
                  </div>
                  <p style={{ margin: "8px 0 0", color: "var(--fg-3)", fontSize: 12 }}>
                    The <strong>Account</strong> column must be present. The Section column is optional.
                    Months can be any date format: Apr 2024, 2024-04, Apr-24, April 2024.
                  </p>
                </div>
              )}
            </div>
          </React.Fragment>
        )}

        {/* ── Demo section ── */}
        {importMethod === "demo" && (
          <div>
            <div style={{ font: "var(--text-label)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--fg-3)", marginBottom: 12 }}>
              Choose a demo dataset
            </div>
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

        {/* ── Xero section ── */}
        {importMethod === "xero" && (
          <div style={{
            padding: "20px", borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border)", background: "var(--surface)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "var(--radius-sm)",
                background: "#13B5EA22", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="link" size={20} color="#13B5EA" />
              </div>
              <div>
                <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--fg-1)" }}>
                  Connect to Xero
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
                  Import your P&amp;L directly from Xero
                </div>
              </div>
              <span style={{
                marginLeft: "auto", font: "var(--text-label)", fontSize: 10,
                textTransform: "uppercase", letterSpacing: ".06em",
                padding: "3px 8px", borderRadius: 20,
                background: "var(--surface-2)", color: "var(--fg-3)",
                border: "1px solid var(--border)", whiteSpace: "nowrap",
              }}>
                Coming soon
              </span>
            </div>

            <p style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", margin: "0 0 14px", lineHeight: 1.6 }}>
              Once connected, MonthEndIQ will guide you through five steps:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                { step: "1", text: "Authenticate securely via Xero OAuth 2.0 — MonthEndIQ never stores your Xero password" },
                { step: "2", text: "Choose your organisation from the list of connected Xero tenants" },
                { step: "3", text: "Import the Profit & Loss report for your selected date range" },
                { step: "4", text: "Select month-by-month, quarterly, or year-to-date comparison views" },
                { step: "5", text: "Generate your variance dashboard, AI commentary, and management pack instantly" },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--primary-soft)", color: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    font: "var(--text-label)", fontSize: 11, fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {step}
                  </div>
                  <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5, paddingTop: 3 }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", marginBottom: 10 }}>
                Want to see how it will look? Try a Xero-format demo dataset:
              </div>
              <button
                onClick={() => loadDemo("/api/demo-xero", "xero")}
                disabled={demoLoading !== null || loading}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, padding: "10px 0",
                  borderRadius: "var(--radius-sm)", border: "1.5px dashed var(--primary)",
                  background: "var(--primary-soft)", color: "var(--primary)",
                  font: "var(--text-body-strong)", fontSize: 13.5, cursor: "pointer",
                  opacity: demoLoading !== null ? 0.7 : 1,
                }}
              >
                {demoLoading === "xero"
                  ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading demo…</React.Fragment>
                  : <React.Fragment><Icon name="play-circle" size={16} /> Try Xero-Style Demo — Apex Digital Ltd</React.Fragment>
                }
              </button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="upload-err" style={{ marginTop: 12, whiteSpace: "pre-line", lineHeight: 1.6 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { UploadScreen });
