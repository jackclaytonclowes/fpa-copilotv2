/* FP&A Copilot — app shell, routing, state */
const { useState: useStateApp, useEffect: useEffectApp } = React;

/* ── helpers ────────────────────────────────────────────── */
function formatPeriod(p, mode) {
  if (!p) return "";
  // Monthly: "2025-01-01 00:00:00" → "January 2025"
  if (mode !== "quarterly" && /^\d{4}-\d{2}/.test(String(p))) {
    const parts = String(p).split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  // Quarterly labels pass through as-is
  return String(p);
}

/* ── TopBar ─────────────────────────────────────────────── */
function TopBar({ view, period, periodMode, onMode, onExport, hasData,
                  periods, selectedPeriod, onPeriodChange }) {
  const { Icon, Button } = window;

  const momLabel = periodMode === "monthly" ? "MoM" : "QoQ";

  const subtitle = hasData && period
    ? `${period.label} · vs ${period.prior} · ${momLabel}`
    : "Upload a P&L to begin";

  const titles = {
    dashboard: "Variance dashboard",
    copilot:   "Q&A Copilot",
    movements: "Movements",
    reports:   "Reports",
    data:      "Data sources",
    settings:  "Settings",
  };

  return (
    <div className="topbar">
      {/* Left: title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <div className="tb-title">{titles[view] || "Variance dashboard"}</div>
        <div className="tb-sub">{subtitle}</div>
      </div>

      <div className="tb-spacer" />

      {/* Right controls — only when data is loaded on dashboard view */}
      {hasData && view === "dashboard" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Monthly / Quarterly toggle */}
          <div className="seg">
            <button
              className={periodMode === "monthly" ? "on" : ""}
              onClick={() => onMode("monthly")}>
              Monthly
            </button>
            <button
              className={periodMode === "quarterly" ? "on" : ""}
              onClick={() => onMode("quarterly")}>
              Quarterly
            </button>
          </div>

          {/* Period selector */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--surface)", border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)", padding: "0 10px 0 10px", height: 36,
          }}>
            <Icon name="calendar" size={14} color="var(--fg-3)" />
            <select
              value={selectedPeriod || ""}
              onChange={(e) => onPeriodChange(e.target.value)}
              style={{
                font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)",
                background: "transparent", border: "none", outline: "none",
                cursor: "pointer", padding: "0 2px", minWidth: 130,
              }}>
              {(periods || []).map((p) => (
                <option key={p} value={p}>{formatPeriod(p, periodMode)}</option>
              ))}
            </select>
          </div>

          {/* Export */}
          <Button variant="primary" icon="download" onClick={onExport}>
            Export pack
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────────── */
function Toast({ message }) {
  const { Icon } = window;
  if (!message) return null;
  return (
    <div className="toast">
      <span className="ic"><Icon name="check-circle" size={16} /></span>
      {message}
    </div>
  );
}

/* ── App ────────────────────────────────────────────────── */
function App() {
  const { Sidebar, Dashboard, QnaCopilot, UploadScreen, ExportModal } = window;

  // Upload / session
  const [sessionData, setSessionData]     = useStateApp(null);
  const [view, setView]                   = useStateApp("dashboard");
  const [periodMode, setPeriodMode]       = useStateApp("monthly");
  const [showExport, setShowExport]       = useStateApp(false);
  const [toast, setToast]                 = useStateApp(null);

  // Period control state — lifted from Dashboard so TopBar can render selectors
  const [availablePeriods, setAvailablePeriods] = useStateApp([]);
  const [selectedPeriod, setSelectedPeriod]     = useStateApp(null);
  const [currentPeriodObj, setCurrentPeriodObj] = useStateApp(null); // {label, prior}

  const fireToast = (msg) => {
    setToast(msg);
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => setToast(null), 3200);
  };

  const onLoad = (data) => {
    setSessionData(data);
    setAvailablePeriods(data.periods || []);
    setSelectedPeriod(data.selected_period || null);
    setCurrentPeriodObj(data.period || null);
    setView("dashboard");
    fireToast(`Analysed ${data.file_name}`);
  };

  // Called by Dashboard whenever it loads new data (period or mode change)
  const onDataChange = (data) => {
    setAvailablePeriods(data.periods || []);
    setSelectedPeriod(data.selected_period || null);
    setCurrentPeriodObj(data.period || null);
  };

  const hasData    = !!sessionData;
  const sessionId  = sessionData?.session_id;

  let body;
  if (!hasData) {
    body = <UploadScreen onLoad={onLoad} />;
  } else if (view === "copilot") {
    body = <QnaCopilot
        sessionId={sessionId}
        period={currentPeriodObj}
        periodMode={periodMode}
        selectedPeriod={selectedPeriod}
      />;
  } else {
    body = (
      <div className="content">
        <Dashboard
          sessionId={sessionId}
          initialData={sessionData}
          periodMode={periodMode}
          controlledPeriod={selectedPeriod}
          onDataChange={onDataChange}
          onModeChange={setPeriodMode}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar active={view} onNav={setView} hasData={hasData} />
      <div className="main">
        <TopBar
          view={view}
          period={currentPeriodObj}
          periodMode={periodMode}
          onMode={(mode) => { setPeriodMode(mode); }}
          onExport={() => setShowExport(true)}
          hasData={hasData}
          periods={availablePeriods}
          selectedPeriod={selectedPeriod}
          onPeriodChange={(p) => setSelectedPeriod(p)}
        />
        {body}
      </div>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          sessionId={sessionId}
          period={currentPeriodObj}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
