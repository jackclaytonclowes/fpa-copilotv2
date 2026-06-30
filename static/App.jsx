/* FP&A Copilot — app shell, routing, state */
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

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

// Detect a /view/{id} shared link — computed once at load time
const _SHARED_SESSION_ID = (() => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "view" && parts[1] ? parts[1] : null;
})();

// Detect a /portal/neighbourhood/{token} public portal link
const _NEIGHBOURHOOD_SHARE_TOKEN = (() => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "portal" && parts[1] === "neighbourhood" && parts[2] ? parts[2] : null;
})();

/* ── TopBar ─────────────────────────────────────────────── */
function TopBar({ view, period, periodMode, onMode, onExport, hasData,
                  periods, selectedPeriod, onPeriodChange, analysisType,
                  bvaPeriods, bvaPeriod, onBvaPeriodChange, sessionId, onShareToast,
                  isConsolidated, entityCount, fromPortfolio, onBackToPortfolio }) {
  const { Icon, Button } = window;

  const [shareCopied, setShareCopied] = useStateApp(false);
  const shareSession = () => {
    if (!sessionId) return;
    const firm = (() => { try { return localStorage.getItem("meiq_firm_name") || ""; } catch { return ""; } })();
    const cur  = (() => { try { return localStorage.getItem("meiq_currency_sym") || ""; } catch { return ""; } })();
    const ps   = [firm ? "firm=" + encodeURIComponent(firm) : "", cur && cur !== "£" ? "cur=" + encodeURIComponent(cur) : ""].filter(Boolean).join("&");
    const url  = `${window.location.origin}/view/${sessionId}${ps ? "?" + ps : ""}`;
    navigator.clipboard.writeText(url).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    });
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
    onShareToast && onShareToast("Share link copied — valid while session is active");
  };

  const BVA_QUARTER_LABELS = { q1: "Q1 (Jan–Mar)", q2: "Q2 (Apr–Jun)", q3: "Q3 (Jul–Sep)", q4: "Q4 (Oct–Dec)" };
  const BVA_QUARTER_MONTHS = { q1: [1,2,3], q2: [4,5,6], q3: [7,8,9], q4: [10,11,12] };

  // Format a BvA period value for display
  const fmtBvaPeriod = (p) => {
    if (!p || p === "full_year") return "Full Year";
    if (BVA_QUARTER_LABELS[p]) return BVA_QUARTER_LABELS[p];
    try {
      const d = new Date(p + "T00:00:00");
      return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    } catch (_) { return p; }
  };

  const momLabel = periodMode === "monthly" ? "MoM" : periodMode === "quarterly" ? "QoQ" : "YTD";

  const subtitle = view === "portfolio"
    ? "Client month-end triage"
    : hasData && period
    ? (isConsolidated
        ? `Consolidated group · ${entityCount || 2} entities`
        : analysisType === "budget_vs_actual"
          ? "Actual vs Budget"
          : "P&L Variance Analysis")
    : "Upload your first P&L to get started";

  const titles = {
    dashboard: "Variance dashboard",
    copilot:   "AI Analyst",
    movements: "Movements",
    insights:  "Insights",
    reports:   "Reports",
    scenarios: "Scenario Analysis",
    portfolio: "Client Portfolio",
    data:      "Data & Connections",
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

      {/* Back to clients — shown when a client was opened from Portfolio */}
      {fromPortfolio && view === "dashboard" && (
        <button onClick={onBackToPortfolio} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-strong)",
          background: "var(--surface)", color: "var(--fg-2)",
          font: "var(--text-body)", fontSize: 12.5, cursor: "pointer",
          flexShrink: 0,
        }}>
          <Icon name="arrow-left" size={13} /> Back to clients
        </button>
      )}

      {/* ⌘K trigger — hidden on mobile (bottom nav handles navigation there) */}
      {hasData && (
        <button
          onClick={() => window.__openPalette?.()}
          title="Command palette (⌘K / Ctrl+K)"
          className="tb-controls-hide"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--fg-3)",
            font: "var(--text-body)", fontSize: 12.5, cursor: "pointer",
            flexShrink: 0,
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
          onMouseOut={(e)  => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--fg-3)"; }}
        >
          <Icon name="search" size={13} />
          <span>Search</span>
          <kbd style={{
            font: "var(--text-label)", fontSize: 10, color: "var(--fg-3)",
            padding: "1px 5px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)", background: "var(--surface-2)",
          }}>⌘K</kbd>
        </button>
      )}

      {/* Right controls — hidden on mobile (bottom nav + full-screen views handle it) */}
      {hasData && (view === "dashboard" || view === "insights") && analysisType !== "budget_vs_actual" && (
        <div className="tb-controls-hide" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Consolidated badge */}
          {isConsolidated && (
            <span style={{
              font: "var(--text-label)", fontSize: 12, padding: "4px 12px",
              borderRadius: "var(--radius-pill)",
              background: "var(--primary-soft)", color: "var(--primary)",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Icon name="layers" size={13} />
              Group · {entityCount} entities
            </span>
          )}
          {/* Monthly / Quarterly / YTD toggle */}
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
            <button
              className={periodMode === "ytd" ? "on" : ""}
              onClick={() => onMode("ytd")}>
              YTD
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

          {/* Share */}
          <Button variant="secondary" icon={shareCopied ? "check" : "share-2"} onClick={shareSession}>
            {shareCopied ? "Copied!" : "Share"}
          </Button>

          {/* Export */}
          <Button variant="primary" icon="download" onClick={onExport}>
            Export pack
          </Button>
        </div>
      )}
      {hasData && view === "dashboard" && analysisType === "budget_vs_actual" && (
        <div className="tb-controls-hide" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
                  cursor: "pointer", padding: "0 2px", minWidth: 140,
                }}>
                <option value="full_year">Full Year</option>
                {/* Quarter groups — only show quarters that have at least one month in the data */}
                {(() => {
                  const periodMonths = new Set(
                    (bvaPeriods || []).map(p => new Date(p + "T00:00:00").getMonth() + 1)
                  );
                  const activeQs = ["q1","q2","q3","q4"].filter(q =>
                    BVA_QUARTER_MONTHS[q].some(m => periodMonths.has(m))
                  );
                  return activeQs.length > 0 ? (
                    <optgroup label="Quarters">
                      {activeQs.map(q => (
                        <option key={q} value={q}>{BVA_QUARTER_LABELS[q]}</option>
                      ))}
                    </optgroup>
                  ) : null;
                })()}
                <optgroup label="Months">
                  {(bvaPeriods || []).map((p) => (
                    <option key={p} value={p}>{fmtBvaPeriod(p)}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Share */}
          <Button variant="secondary" icon={shareCopied ? "check" : "share-2"} onClick={shareSession}>
            {shareCopied ? "Copied!" : "Share"}
          </Button>

          <Button variant="primary" icon="download" onClick={onExport}>
            Export pack
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Mobile bottom nav ──────────────────────────────────── */
function MobileNav({ active, onNav, hasData }) {
  const { Icon } = window;
  const ALWAYS = ["data", "settings"];
  const items = [
    { id: "dashboard", icon: "layout-dashboard", label: "Home" },
    { id: "copilot",   icon: "sparkles",          label: "AI" },
    { id: "movements", icon: "list-tree",          label: "Moves" },
    { id: "insights",  icon: "lightbulb",          label: "Insights" },
    { id: "reports",   icon: "file-bar-chart",     label: "Reports" },
    { id: "settings",  icon: "settings",           label: "Settings" },
  ];
  return (
    <nav className="mobile-nav">
      {items.map((it) => (
        <button
          key={it.id}
          className={`mobile-nav-item${active === it.id ? " on" : ""}${!hasData && !ALWAYS.includes(it.id) ? " disabled" : ""}`}
          onClick={() => (hasData || ALWAYS.includes(it.id)) && onNav(it.id)}
          style={!hasData && !ALWAYS.includes(it.id) ? { opacity: 0.35 } : {}}
        >
          <Icon name={it.icon} size={20} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Post-upload onboarding checklist ──────────────────── */
function OnboardingChecklist({ onNav, onExport, onDismiss, sessionId }) {
  const { Icon } = window;
  const firm = (() => { try { return localStorage.getItem("meiq_firm_name") || ""; } catch { return ""; } })();
  const cur  = (() => { try { return localStorage.getItem("meiq_currency_sym") || ""; } catch { return ""; } })();
  const _sharePs = [firm ? "firm=" + encodeURIComponent(firm) : "", cur && cur !== "£" ? "cur=" + encodeURIComponent(cur) : ""].filter(Boolean).join("&");
  const shareUrl = sessionId
    ? `${window.location.origin}/view/${sessionId}${_sharePs ? "?" + _sharePs : ""}`
    : null;
  const steps = [
    { icon: "sparkles",   label: "Review the AI commentary",         desc: "Your board-ready analysis is on the dashboard",          action: () => { onNav("dashboard"); onDismiss(); } },
    { icon: "share-2",    label: "Share the client digest",          desc: shareUrl ? "Copied to clipboard" : "Open a session first",
      action: () => { if (shareUrl) { navigator.clipboard?.writeText(shareUrl).catch(() => {}); } onDismiss(); } },
    { icon: "download",   label: "Export the management pack",       desc: "Download a board-ready PDF",                             action: () => { onExport(); onDismiss(); } },
    { icon: "file-plus",  label: "Add another client",               desc: "Switch to Portfolio to manage multiple clients",         action: () => { onNav("portfolio"); onDismiss(); } },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 300, zIndex: 70,
      background: "var(--surface)", border: "1px solid var(--border-strong)",
      borderRadius: 14, boxShadow: "var(--shadow-hover)",
      animation: "fadeIn .3s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check-circle" size={15} color="var(--primary)" />
          <span style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>
            Analysis ready — what next?
          </span>
        </div>
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", padding: 2, lineHeight: 0 }}>
          <Icon name="x" size={15} />
        </button>
      </div>
      <div style={{ padding: "10px 0 8px" }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={s.action}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12, width: "100%",
              padding: "9px 16px", background: "none", border: "none", cursor: "pointer",
              textAlign: "left",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseOut={(e)  => { e.currentTarget.style.background = "none"; }}
          >
            <span style={{ marginTop: 1, flexShrink: 0 }}>
              <Icon name={s.icon} size={15} color="var(--primary)" />
            </span>
            <div>
              <div style={{ font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--ink)" }}>{s.label}</div>
              <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 1 }}>{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────────── */
function Toast({ message, onDismiss }) {
  const { Icon } = window;
  if (!message) return null;
  return (
    <div className="toast">
      <span className="ic"><Icon name="check-circle" size={16} /></span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={{
          display: "inline-flex", alignItems: "center",
          background: "none", border: "none", padding: "0 0 0 8px",
          cursor: "pointer", color: "inherit", opacity: 0.65, lineHeight: 0,
        }}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────── */
function App() {
  const { Sidebar, Dashboard, QnaCopilot, UploadScreen, ExportModal, Movements, Reports, DataSources, Scenarios, CommandPalette, Portfolio, Insights } = window;

  // Diagnostic: log any undefined components so we can spot load failures
  React.useEffect(() => {
    const check = { Sidebar, Dashboard, QnaCopilot, UploadScreen, ExportModal, Movements, Reports, DataSources, Scenarios, CommandPalette };
    const missing = Object.entries(check).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) console.error("[MonthEndIQ] Missing window components:", missing);
  }, []);

  // Upload / session
  const [sessionData, setSessionData]     = useStateApp(null);
  const [view, setView]                   = useStateApp("dashboard");
  const [fromPortfolio, setFromPortfolio] = useStateApp(false);
  const [periodMode, setPeriodMode]       = useStateApp("monthly");
  const [showExport, setShowExport]       = useStateApp(false);
  const [toast, setToast]                 = useStateApp(null);
  const [restoring, setRestoring]         = useStateApp(true);
  const staleSessionRef                   = useRefApp(null);

  // Multi-entity consolidation
  const [entities, setEntities]               = useStateApp([]);
  const [consolidatedData, setConsolidatedData] = useStateApp(null);
  const [isConsolidated, setIsConsolidated]   = useStateApp(false);
  const [consolidating, setConsolidating]     = useStateApp(false);

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

  // Restore previous session on mount (if backend is still alive).
  // Also handles shared /view/{session_id} URLs.
  useEffectApp(() => {
    // Check for shared view URL: /view/{session_id}
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const sharedId = pathParts[0] === "view" && pathParts[1] ? pathParts[1] : null;

    const sessionId = sharedId || loadSessionPointer()?.sessionId;
    const saved     = sharedId ? null : loadSessionPointer();

    if (!sessionId) { setRestoring(false); return; }

    fetch(apiUrl("/api/data/" + sessionId + "?period=&mode=monthly"))
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        data.session_id = sessionId;
        if (!data.file_name && saved) data.file_name = saved.filename;
        setSessionData(data);
        setAvailablePeriods(data.periods || []);
        setSelectedPeriod(data.selected_period || null);
        setCurrentPeriodObj(data.period || null);
        setBvaPeriods(data.available_bva_periods || []);
        setBvaPeriod(data.selected_bva_period   || "full_year");
        setView("dashboard");
        fireToast(sharedId ? "Viewing shared session" : "Session restored");
      })
      .catch(() => {
        if (saved) staleSessionRef.current = saved;
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
    setEntities([{ sessionId: data.session_id, fileName: data.file_name }]);
    setConsolidatedData(null);
    setIsConsolidated(false);
    setView("dashboard");
    fireToast(`Analysed ${data.file_name}`);
    // Show the onboarding checklist once per page load (not on restore)
    if (!checklistShownRef.current) {
      checklistShownRef.current = true;
      setTimeout(() => setShowChecklist(true), 1800);
    }
  };

  // Open a client from the practice portfolio — load its session as the active one
  const openClient = (clientSessionId, clientName) => {
    fetch(apiUrl(`/api/data/${clientSessionId}?period=&mode=monthly`))
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        data.session_id = clientSessionId;
        if (!data.file_name) data.file_name = clientName;
        onLoad(data);
        setFromPortfolio(true);
      })
      .catch(() => fireToast("Session not found — re-upload the client P&L to continue"));
  };

  const handleNav = (v) => {
    setFromPortfolio(false);
    setView(v);
  };

  const onAddEntity = (data) => {
    const newEntity = { sessionId: data.session_id, fileName: data.file_name };
    setEntities((prev) => {
      if (prev.some((e) => e.sessionId === data.session_id)) return prev;
      return [...prev, newEntity];
    });
    setConsolidatedData(null);
    setIsConsolidated(false);
  };

  const onConsolidate = async (entityList) => {
    const list = entityList || entities;
    if (list.length < 2) return;
    setConsolidating(true);
    try {
      const res = await fetch(apiUrl("/api/consolidate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_ids: list.map((e) => e.sessionId),
          period: selectedPeriod || null,
          mode: periodMode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Consolidation failed" }));
        throw new Error(err.detail || "Consolidation failed");
      }
      const data = await res.json();
      data.session_id = list[0].sessionId;
      data.file_name  = `Consolidated (${list.length} entities)`;
      setConsolidatedData(data);
      setIsConsolidated(true);
      onDataChange(data);
      setView("dashboard");
      fireToast(`Consolidated ${list.length} entities`);
    } catch (e) {
      fireToast(e.message);
    } finally {
      setConsolidating(false);
    }
  };

  const onExitConsolidated = () => {
    setIsConsolidated(false);
    setConsolidatedData(null);
    onDataChange(sessionData);
  };

  // Called by Dashboard whenever it loads new data (period or mode change)
  const onDataChange = (data) => {
    setAvailablePeriods(data.periods || []);
    setSelectedPeriod(data.selected_period || null);
    setCurrentPeriodObj(data.period || null);
    if (data.available_bva_periods) setBvaPeriods(data.available_bva_periods);
    if (data.selected_bva_period  ) setBvaPeriod(data.selected_bva_period);
  };

  const effectiveData  = isConsolidated && consolidatedData ? consolidatedData : sessionData;
  const hasData        = !!sessionData;
  const sessionId      = effectiveData?.session_id || sessionData?.session_id;
  const analysisType   = effectiveData?.analysis_type || "month_on_month";

  // Onboarding checklist (shown once after first upload in the session)
  const [showChecklist, setShowChecklist] = useStateApp(false);
  const checklistShownRef = useRefApp(false);

  // Pre-filled question for copilot (set by Movements "Explain this variance")
  const [copilotQuestion, setCopilotQuestion] = useStateApp(null);
  const navigateToCopilot = (question) => {
    setCopilotQuestion(question);
    handleNav("copilot");
  };

  const { ViewErrorBoundary } = window;
  const eb = (key, el) => ViewErrorBoundary
    ? <ViewErrorBoundary key={key}>{el}</ViewErrorBoundary>
    : el;

  let body;
  if (restoring) {
    body = null;
  } else if (view === "portfolio") {
    body = eb("portfolio", Portfolio
      ? <Portfolio onOpenClient={openClient} onToast={fireToast} />
      : <div className="content"><div style={{ padding: "40px 24px", color: "var(--fg-2)" }}>Practice view failed to load.</div></div>);
  } else if (view === "settings") {
    body = window.SettingsView
      ? eb("settings", <SettingsView onToast={fireToast} />)
      : null;
  } else if (view === "data") {
    body = eb("data", (
      <DataSources
        sessionData={sessionData}
        availablePeriods={availablePeriods}
        onLoad={onLoad}
        entities={entities}
        onAddEntity={onAddEntity}
        onConsolidate={onConsolidate}
        consolidating={consolidating}
        isConsolidated={isConsolidated}
        onExitConsolidated={onExitConsolidated}
      />
    ));
  } else if (!hasData) {
    body = <UploadScreen onLoad={onLoad} onLoadDemo={onLoad} />;
  } else if (view === "copilot") {
    body = eb("copilot", <QnaCopilot
        sessionId={sessionData?.session_id}
        fileName={sessionData?.file_name}
        period={currentPeriodObj}
        periodMode={periodMode}
        selectedPeriod={selectedPeriod}
        analysisType={analysisType}
        sector={sessionData?.sector}
        prefillQuestion={copilotQuestion}
        onPrefillConsumed={() => setCopilotQuestion(null)}
      />);
  } else if (view === "reports") {
    body = eb("reports", (
      <Reports
        sessionId={sessionId}
        initialData={effectiveData}
        periodMode={periodMode}
        controlledPeriod={selectedPeriod}
        onDataChange={onDataChange}
        analysisType={analysisType}
        period={currentPeriodObj}
        onToast={fireToast}
      />
    ));
  } else if (view === "movements") {
    const movEl = !Movements
      ? <div className="content"><div style={{ padding: "40px 24px", color: "var(--fg-2)" }}>Movements failed to load — check the browser console (F12) for errors.</div></div>
      : (
      <Movements
        sessionId={sessionId}
        initialData={effectiveData}
        periodMode={periodMode}
        controlledPeriod={selectedPeriod}
        onDataChange={onDataChange}
        analysisType={analysisType}
        onNavigateCopilot={navigateToCopilot}
        fileName={sessionData?.file_name}
      />
    );
    body = eb("movements", movEl);
  } else if (view === "insights") {
    body = eb("insights", (
      <div className="content">
        {Insights
          ? <Insights
              sessionId={sessionId}
              selectedPeriod={selectedPeriod}
              periodMode={periodMode}
              analysisType={analysisType}
              sessionData={effectiveData}
            />
          : <div style={{ padding: "40px 24px", color: "var(--fg-2)" }}>Insights failed to load.</div>
        }
      </div>
    ));
  } else if (view === "scenarios") {
    body = eb("scenarios", (
      <div className="content">
        <Scenarios
          initialData={effectiveData}
          fileName={sessionData?.file_name}
          analysisType={analysisType}
        />
      </div>
    ));
  } else {
    body = eb("dashboard", (
      <div className="content">
        <Dashboard
          sessionId={sessionId}
          initialData={effectiveData}
          periodMode={periodMode}
          controlledPeriod={selectedPeriod}
          onDataChange={onDataChange}
          onModeChange={setPeriodMode}
          analysisType={analysisType}
        />
      </div>
    ));
  }

  // Render the public neighbourhood portal
  if (_NEIGHBOURHOOD_SHARE_TOKEN) {
    return window.NeighbourhoodPortal
      ? <NeighbourhoodPortal shareToken={_NEIGHBOURHOOD_SHARE_TOKEN} />
      : null;
  }

  // Render the read-only digest for shared /view/{id} links
  if (_SHARED_SESSION_ID) {
    return window.SharedView
      ? <SharedView sessionId={_SHARED_SESSION_ID} />
      : null;
  }

  return (
    <div className="app">
      <Sidebar active={view} onNav={handleNav} hasData={hasData} />
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
          sessionId={sessionId}
          onShareToast={fireToast}
          isConsolidated={isConsolidated}
          entityCount={entities.length}
          fromPortfolio={fromPortfolio}
          onBackToPortfolio={() => { setFromPortfolio(false); setView("portfolio"); }}
        />
        {body}
      </div>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          sessionId={sessionId}
          period={currentPeriodObj}
          analysisType={analysisType}
          firmName={(() => { try { return localStorage.getItem("meiq_firm_name") || ""; } catch { return ""; } })()}
        />
      )}
      <MobileNav active={view} onNav={handleNav} hasData={hasData} />
      <Toast message={toast} onDismiss={() => { clearTimeout(window.__toastTimer); setToast(null); }} />
      {showChecklist && hasData && (
        <OnboardingChecklist
          onNav={setView}
          onExport={() => setShowExport(true)}
          onDismiss={() => setShowChecklist(false)}
          sessionId={sessionId}
        />
      )}

      <CommandPalette
        onNav={setView}
        hasData={hasData}
        movements={effectiveData?.movements}
        onAsk={navigateToCopilot}
        onExport={() => setShowExport(true)}
        onThemeToggle={() => {
          const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next;
          try { localStorage.setItem("monthendiq_theme", next); } catch {}
        }}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
