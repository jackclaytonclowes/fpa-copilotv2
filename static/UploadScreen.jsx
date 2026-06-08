/* FP&A Copilot — upload screen with real API integration */
const { useState: useStateUpload, useRef: useRefUpload } = React;

function UploadScreen({ onLoad, onLoadDemo }) {
  const { Icon, Button } = window;
  const [dragging,     setDragging]     = useStateUpload(false);
  const [loading,      setLoading]      = useStateUpload(false);
  const [demoLoading,  setDemoLoading]  = useStateUpload(false);
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

  const loadDemo = async () => {
    if (!onLoadDemo) return;
    setDemoLoading(true);
    setError(null);
    try {
      const endpoint = mode === "budget_vs_actual" ? "/api/demo-bva" : "/api/demo";
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
      setDemoLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
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

        {/* Analysis mode selector */}
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

        {/* Demo data button */}
        {onLoadDemo && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
              or try without uploading
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
        )}
        {onLoadDemo && (
          <button
            onClick={loadDemo}
            disabled={demoLoading || loading}
            style={{
              marginTop: 10, width: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, padding: "10px 0",
              borderRadius: "var(--radius-sm)", border: "1.5px dashed var(--primary)",
              background: "var(--primary-soft)", color: "var(--primary)",
              font: "var(--text-body-strong)", fontSize: 13.5, cursor: "pointer",
              opacity: demoLoading ? 0.7 : 1,
            }}
          >
            {demoLoading
              ? <React.Fragment><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading demo…</React.Fragment>
              : <React.Fragment><Icon name="play-circle" size={16} />{mode === "budget_vs_actual" ? "Use Demo Data — BvA (Meridian Software Ltd)" : "Use Demo Data — Month-on-Month (Meridian Software Ltd)"}</React.Fragment>
            }
          </button>
        )}

        {/* Error display */}
        {error && (
          <div className="upload-err" style={{ marginTop: 12, whiteSpace: "pre-line", lineHeight: 1.6 }}>
            {error}
          </div>
        )}

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
      </div>
    </div>
  );
}
Object.assign(window, { UploadScreen });
