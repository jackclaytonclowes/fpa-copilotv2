/* FP&A Copilot — app shell, routing, state */
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp, useCallback: useCallbackApp } = React;

/* ── Session persistence (localStorage) ─────────────────── */
const SESSION_STORAGE_KEY = "monthendiq_session";
const CHAT_STORAGE_KEY_FN = (sid) => `monthendiq_chat_${sid}`;

function saveSessionPointer(sessionId, filename) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      sessionId, filename, timestamp: Date.now(),
    }));
  } catch (e) { /* quota — non-critical */ }
}

function loadSessionPointer() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function migrateChatHistory(oldSessionId, newSessionId) {
  try {
    const oldKey = CHAT_STORAGE_KEY_FN(oldSessionId);
    const newKey = CHAT_STORAGE_KEY_FN(newSessionId);
    const data = localStorage.getItem(oldKey);
    if (data) {
      const turns = JSON.parse(data);
      if (Array.isArray(turns) && turns.length > 0) {
        localStorage.setItem(newKey, data);
        console.log("[MonthEndIQ] Migrated " + turns.length + " chat turns from " + oldSessionId.slice(0,8) + " → " + newSessionId.slice(0,8));
      }
      localStorage.removeItem(oldKey);
    }
  } catch (e) {
    console.warn("[MonthEndIQ] Chat migration failed:", e);
  }
}

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
                  periods, selectedPeriod, onPeriodChange, analysisType,
                  bvaPeriods, bvaPeriod, onBvaPeriodChange,
                  aiqStats, aiqViews }) {
  const { Icon, Button } = window;
  const showAiqStats = aiqViews && aiqViews.includes(view) && aiqStats && (aiqStats.xp > 0 || aiqStats.streak > 0);

  // Format a BvA period ISO string as a short month label ("Apr") or "Full Year"
  const fmtBvaPeriod = (p) => {
    if (!p || p === "full_year") return "Full Year";
    try {
      const d = new Date(p + "T00:00:00");
      return d.toLocaleDateString("en-GB", { month: "short" });
    } catch (_) { return p; }
  };

  const momLabel = periodMode === "monthly" ? "MoM" : "QoQ";

  const subtitle = hasData && period
    ? (analysisType === "budget_vs_actual"
        ? "Actual vs Budget"
        : "Month-on-Month Variance")
    : "Upload a P&L to begin";

  const titles = {
    dashboard: "Variance dashboard",
    copilot:   "Q&A Copilot",
    movements: "Movements",
    reports:   "Reports",
    data:      "Data sources",
    settings:  "Settings",
    courses:   "Courses",
    skillslab:  "Skills Lab",
    lessons:    "Lesson",
    quizengine: "Quiz",
    quiz:      "Quiz",
    mockexam:  "Mock Exam",
    tutor:     "Study Tutor",
    profile:   "My Progress",
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
      {hasData && view === "dashboard" && analysisType !== "budget_vs_actual" && (
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
      {hasData && view === "dashboard" && analysisType === "budget_vs_actual" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Mode badge */}
          <span style={{
            font: "var(--text-body-strong)", fontSize: 12, padding: "4px 12px",
            borderRadius: "var(--radius-pill)",
            background: "var(--primary-soft)", color: "var(--primary)",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <Icon name="target" size={13} />
            Budget vs Actual
          </span>

          {/* Period selector — only shown when per-period data is available */}
          {(bvaPeriods || []).length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "var(--surface)", border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)", padding: "0 10px", height: 36,
            }}>
              <Icon name="calendar" size={14} color="var(--fg-3)" />
              <select
                value={bvaPeriod || "full_year"}
                onChange={(e) => onBvaPeriodChange(e.target.value)}
                style={{
                  font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)",
                  background: "transparent", border: "none", outline: "none",
                  cursor: "pointer", padding: "0 2px", minWidth: 110,
                }}>
                <option value="full_year">Full Year</option>
                {(bvaPeriods || []).map((p) => (
                  <option key={p} value={p}>{fmtBvaPeriod(p)}</option>
                ))}
              </select>
            </div>
          )}

          <Button variant="primary" icon="download" onClick={onExport}>
            Export pack
          </Button>
        </div>
      )}

      {/* AccountIQ live stats — shown on all Learn views */}
      {showAiqStats && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          {aiqStats.streak > 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              font: "var(--text-body-strong)", fontSize: 13, color: "var(--caution)",
            }}>
              <Icon name="flame" size={15} />
              {aiqStats.streak}
            </div>
          )}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            font: "var(--text-body-strong)", fontSize: 13, color: "var(--primary)",
          }}>
            <Icon name="zap" size={15} />
            {aiqStats.xp.toLocaleString()} XP
          </div>
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
  const { Sidebar, Dashboard, QnaCopilot, UploadScreen, ExportModal, Movements, Reports, Courses, AIQOnboarding, AIQSkillsLab, AIQQuizEngine, AIQMockExam } = window;

  // Upload / session
  const [sessionData, setSessionData]     = useStateApp(null);
  const [view, setView]                   = useStateApp("dashboard");
  const [periodMode, setPeriodMode]       = useStateApp("monthly");
  const [showExport, setShowExport]       = useStateApp(false);
  const [toast, setToast]                 = useStateApp(null);
  const [restoring, setRestoring]         = useStateApp(true);
  const staleSessionRef                   = useRefApp(null);

  // Period control state — lifted from Dashboard so TopBar can render selectors
  const [availablePeriods, setAvailablePeriods] = useStateApp([]);
  const [selectedPeriod, setSelectedPeriod]     = useStateApp(null);
  const [currentPeriodObj, setCurrentPeriodObj] = useStateApp(null); // {label, prior}
  // BvA period selector
  const [bvaPeriods, setBvaPeriods]   = useStateApp([]);  // ISO date strings
  const [bvaPeriod,  setBvaPeriod]    = useStateApp("full_year");

  const fireToast = (msg) => {
    setToast(msg);
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => setToast(null), 3200);
  };

  // Restore previous session on mount (if backend is still alive)
  useEffectApp(() => {
    const saved = loadSessionPointer();
    if (!saved) { setRestoring(false); return; }
    fetch("/api/data/" + saved.sessionId + "?period=&mode=monthly")
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        data.session_id = saved.sessionId;
        data.file_name  = saved.filename;
        setSessionData(data);
        setAvailablePeriods(data.periods || []);
        setSelectedPeriod(data.selected_period || null);
        setCurrentPeriodObj(data.period || null);
        setBvaPeriods(data.available_bva_periods || []);
        setBvaPeriod(data.selected_bva_period   || "full_year");
        setView("dashboard");
        fireToast("Session restored");
      })
      .catch(() => {
        staleSessionRef.current = saved;
      })
      .finally(() => setRestoring(false));
  }, []);

  const onLoad = (data) => {
    // Migrate chat from stale session if same filename
    const stale = staleSessionRef.current;
    if (stale && stale.filename === data.file_name && stale.sessionId !== data.session_id) {
      migrateChatHistory(stale.sessionId, data.session_id);
    }
    staleSessionRef.current = null;

    saveSessionPointer(data.session_id, data.file_name);
    setSessionData(data);
    setAvailablePeriods(data.periods || []);
    setSelectedPeriod(data.selected_period || null);
    setCurrentPeriodObj(data.period || null);
    setBvaPeriods(data.available_bva_periods || []);
    setBvaPeriod(data.selected_bva_period   || "full_year");
    setView("dashboard");
    fireToast(`Analysed ${data.file_name}`);
  };

  // Called by Dashboard whenever it loads new data (period or mode change)
  const onDataChange = (data) => {
    setAvailablePeriods(data.periods || []);
    setSelectedPeriod(data.selected_period || null);
    setCurrentPeriodObj(data.period || null);
    if (data.available_bva_periods) setBvaPeriods(data.available_bva_periods);
    if (data.selected_bva_period  ) setBvaPeriod(data.selected_bva_period);
  };

  const hasData      = !!sessionData;
  const sessionId    = sessionData?.session_id;
  const analysisType = sessionData?.analysis_type || "month_on_month";

  // AccountIQ live stats — kept in React state so TopBar stays in sync
  const [aiqStats, setAiqStats] = useStateApp({ xp: 0, streak: 0 });
  useEffectApp(() => {
    const refresh = (e) => {
      const s = e ? e.detail : (window.aiqStore ? window.aiqStore.get() : {});
      setAiqStats({ xp: s.xp || 0, streak: s.streak || 0 });
    };
    refresh(null); // read on mount
    window.addEventListener("aiq-store-update", refresh);
    return () => window.removeEventListener("aiq-store-update", refresh);
  }, []);

  // AccountIQ onboarding gate — checked each time Courses section is entered
  const [showOnboarding, setShowOnboarding] = useStateApp(false);
  const AIQ_VIEWS = ["courses", "skillslab", "tutor", "profile", "lessons", "quiz", "quizengine", "mockexam"];
  const handleNavToLearn = (targetView) => {
    const store = window.aiqStore && window.aiqStore.get();
    if (store && !store.onboardingComplete) {
      setShowOnboarding(true);
    }
    setView(targetView);
  };

  // AccountIQ sub-navigation (lessons, quiz, tutor, profile)
  const [aiqContext, setAiqContext] = useStateApp({}); // e.g. { paperId: "ba2" }
  const navigateToAiq = (aiqView, ctx) => {
    setAiqContext(ctx || {});
    setView(aiqView);
  };

  // Pre-filled question for copilot (set by Movements "Explain this variance")
  const [copilotQuestion, setCopilotQuestion] = useStateApp(null);
  const navigateToCopilot = (question) => {
    setCopilotQuestion(question);
    setView("copilot");
  };

  const { AIQLessons, AIQQuiz, AIQTutor, AIQProfile } = window;

  let body;
  if (restoring) {
    body = null;
  } else if (view === "skillslab") {
    body = <AIQSkillsLab onNavigate={navigateToAiq} />;
  } else if (view === "courses") {
    body = <Courses onNavigate={navigateToAiq} />;
  } else if (view === "lessons") {
    body = <AIQLessons
        key={`${aiqContext.paperId}-${aiqContext.lessonId}`}
        paperId={aiqContext.paperId}
        lessonId={aiqContext.lessonId}
        onNavigate={navigateToAiq}
      />;
  } else if (view === "quizengine") {
    body = <AIQQuizEngine
        key={`${aiqContext.paperId}-${aiqContext.lessonId}`}
        paperId={aiqContext.paperId}
        lessonId={aiqContext.lessonId}
        onNavigate={navigateToAiq}
      />;
  } else if (view === "mockexam") {
    body = <AIQMockExam
        key={aiqContext.paperId}
        paperId={aiqContext.paperId}
        onNavigate={navigateToAiq}
      />;
  } else if (view === "quiz") {
    body = <AIQQuiz quizResult={aiqContext.quizResult} onNavigate={navigateToAiq} />;
  } else if (view === "tutor") {
    body = <AIQTutor onNavigate={navigateToAiq} />;
  } else if (view === "profile") {
    body = <AIQProfile onNavigate={navigateToAiq} />;
  } else if (!hasData) {
    body = <UploadScreen onLoad={onLoad} />;
  } else if (view === "copilot") {
    body = <QnaCopilot
        sessionId={sessionId}
        period={currentPeriodObj}
        periodMode={periodMode}
        selectedPeriod={selectedPeriod}
        analysisType={analysisType}
        prefillQuestion={copilotQuestion}
        onPrefillConsumed={() => setCopilotQuestion(null)}
      />;
  } else if (view === "reports") {
    body = (
      <Reports
        sessionId={sessionId}
        initialData={sessionData}
        periodMode={periodMode}
        controlledPeriod={selectedPeriod}
        onDataChange={onDataChange}
        analysisType={analysisType}
        period={currentPeriodObj}
      />
    );
  } else if (view === "movements") {
    body = (
      <Movements
        sessionId={sessionId}
        initialData={sessionData}
        periodMode={periodMode}
        controlledPeriod={selectedPeriod}
        onDataChange={onDataChange}
        analysisType={analysisType}
        onNavigateCopilot={navigateToCopilot}
      />
    );
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
          analysisType={analysisType}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        active={view}
        onNav={(v) => (AIQ_VIEWS.includes(v) ? handleNavToLearn(v) : setView(v))}
        hasData={hasData}
      />
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
          analysisType={analysisType}
          bvaPeriods={bvaPeriods}
          bvaPeriod={bvaPeriod}
          onBvaPeriodChange={(p) => { setBvaPeriod(p); setSelectedPeriod(p); }}
          aiqStats={aiqStats}
          aiqViews={AIQ_VIEWS}
        />
        {body}
      </div>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          sessionId={sessionId}
          period={currentPeriodObj}
          analysisType={analysisType}
        />
      )}
      <Toast message={toast} />

      {/* AccountIQ onboarding overlay — shown when entering Courses without a study plan */}
      {showOnboarding && (
        <AIQOnboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
