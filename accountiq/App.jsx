/* AccountIQ — standalone app shell with Supabase auth */
const { useState: useStateApp, useEffect: useEffectApp } = React;

/* ── Sidebar ──────────────────────────────────────────────── */
function Sidebar({ active, onNav, onSignOut }) {
  const { Icon, Logo } = window;
  const items = [
    { id: "courses",   icon: "graduation-cap", label: "Courses" },
    { id: "skillslab", icon: "flask-conical",  label: "Skills Lab" },
    { id: "tutor",     icon: "message-circle", label: "Study Tutor" },
    { id: "profile",   icon: "user",           label: "My Progress" },
  ];
  return (
    <aside className="sidebar">
      <Logo />
      <div className="sb-sec">Learn</div>
      {items.map((it) => (
        <div
          key={it.id}
          className={`sb-item${active === it.id ? " on" : ""}`}
          onClick={() => onNav(it.id)}
        >
          <span className="ic"><Icon name={it.icon} size={18} /></span>{it.label}
        </div>
      ))}
      <div className="sb-foot">
        <div className="sb-user" style={{ cursor: "pointer" }} onClick={onSignOut} title="Sign out">
          <div className="av">AQ</div>
          <div>
            <div className="nm">My Account</div>
            <div className="rl" style={{ color: "var(--fg-3)", fontSize: 11 }}>Sign out</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── TopBar ──────────────────────────────────────────────── */
function TopBar({ view, aiqStats }) {
  const titles = {
    courses:      "Courses",
    coursedetail: "Course",
    skillslab:    "Skills Lab",
    lessons:      "Lesson",
    quizengine:   "Quiz",
    quiz:         "Quiz",
    mockexam:     "Mock Exam",
    tutor:        "Study Tutor",
    profile:      "My Progress",
  };
  const showStats = aiqStats && (aiqStats.xp > 0 || aiqStats.streak > 0);
  return (
    <div className="topbar">
      {/* Mobile only: AccountIQ brand (sidebar hidden on mobile) */}
      <div className="tb-mobile-brand">
        Account<span className="tb-mobile-iq">IQ</span>
      </div>
      {/* Desktop only: page title */}
      <div className="tb-page-info" style={{ minWidth: 0 }}>
        <div className="tb-title">{titles[view] || "Courses"}</div>
        <div className="tb-sub">CIMA Certificate in Business Accounting</div>
      </div>
      <div className="tb-spacer" />
      {showStats && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {aiqStats.streak > 0 && (
            <div className="tb-stat-pill tb-stat-pill--flame">
              <span style={{ fontSize: 13, lineHeight: 1 }}>🔥</span>
              <span className="tb-stat-num">{aiqStats.streak}</span>
            </div>
          )}
          <div className="tb-stat-pill tb-stat-pill--xp">
            <span style={{ fontSize: 13, lineHeight: 1 }}>⭐</span>
            <span className="tb-stat-num">{aiqStats.xp.toLocaleString()}</span>
          </div>
        </div>
      )}
      <div className="tb-avatar">A</div>
    </div>
  );
}

/* ── BottomNav (mobile) ──────────────────────────────────── */
function BottomNav({ active, onNav }) {
  const { Icon } = window;
  const items = [
    { id: "courses",   icon: "book-open",     label: "Courses" },
    { id: "skillslab", icon: "flask-conical", label: "Skills Lab" },
    { id: "tutor",     icon: "message-circle", label: "Tutor" },
    { id: "profile",   icon: "user",          label: "Profile" },
  ];
  const courseViews = ["courses","coursedetail","lessons","quizengine","quiz","mockexam"];
  return (
    <nav className="aiq-bnav">
      <div className="aiq-bnav-inner">
        {items.map((it) => {
          const isActive = it.id === "courses"
            ? courseViews.includes(active)
            : active === it.id;
          return (
            <button
              key={it.id}
              className="aiq-bnav-item"
              onClick={() => onNav(it.id)}
            >
              {isActive && <span className="aiq-bnav-indicator" />}
              <Icon
                name={it.icon}
                size={21}
                color={isActive ? "#0C0E1A" : "var(--sand-400)"}
                stroke={isActive ? 2.25 : 1.75}
              />
              <span
                className="aiq-bnav-label"
                style={{ color: isActive ? "#0C0E1A" : "var(--sand-400)", fontWeight: isActive ? 700 : 500 }}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ── App ────────────────────────────────────────────────── */
function App() {
  const {
    AIQAuth, Courses, AIQOnboarding, AIQSkillsLab, AIQQuizEngine, AIQMockExam,
    AIQLessons, AIQQuiz, AIQTutor, AIQProfile, AIQCourseDetail,
  } = window;

  const [view, setView]                     = useStateApp("courses");
  const [aiqContext, setAiqContext]          = useStateApp({});
  const [showOnboarding, setShowOnboarding] = useStateApp(false);
  const [aiqStats, setAiqStats]             = useStateApp({ xp: 0, streak: 0 });

  // Auth state
  const [authReady, setAuthReady]   = useStateApp(false);  // Supabase client initialised
  const [session, setSession]       = useStateApp(null);   // null = not logged in

  // Initialise Supabase on mount
  useEffectApp(() => {
    (async () => {
      try {
        const cfg = await fetch("/api/config").then((r) => r.json());
        if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
          const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
          window.supabaseClient = sb;

          // Restore existing session
          const { data } = await sb.auth.getSession();
          if (data.session) {
            await _onSignIn(data.session);
          }

          // Listen for auth changes (sign-in / sign-out)
          sb.auth.onAuthStateChange(async (_event, sess) => {
            if (sess) {
              await _onSignIn(sess);
            } else {
              window._aiqToken = null;
              setSession(null);
            }
          });
        }
      } catch (_) { /* Supabase not configured — app works without auth */ }
      setAuthReady(true);
    })();
  }, []);

  async function _onSignIn(sess) {
    window._aiqToken = sess.access_token;
    setSession(sess);
    // Merge server state into localStorage store
    await window.aiqStore.loadFromServer(sess.access_token);
    // Refresh stats display
    const s = window.aiqStore.get();
    setAiqStats({ xp: s.xp || 0, streak: s.streak || 0 });
  }

  const handleSignOut = async () => {
    const sb = window.supabaseClient;
    if (sb) await sb.auth.signOut();
    window._aiqToken = null;
    setSession(null);
  };

  // Keep TopBar stats in sync with store
  useEffectApp(() => {
    const refresh = (e) => {
      const s = e ? e.detail : (window.aiqStore ? window.aiqStore.get() : {});
      setAiqStats({ xp: s.xp || 0, streak: s.streak || 0 });
    };
    refresh(null);
    window.addEventListener("aiq-store-update", refresh);
    return () => window.removeEventListener("aiq-store-update", refresh);
  }, []);

  const navigateToAiq = (aiqView, ctx) => {
    setAiqContext(ctx || {});
    setView(aiqView);
  };

  const handleNav = (v) => {
    const store = window.aiqStore && window.aiqStore.get();
    if (store && !store.onboardingComplete) {
      setShowOnboarding(true);
    }
    setView(v);
  };

  // Auto-show onboarding for new users once auth is resolved
  useEffectApp(() => {
    if (!authReady) return;
    const store = window.aiqStore && window.aiqStore.get();
    if (store && !store.onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [authReady]);

  // Splash while initialising
  if (!authReady) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--bg)",
      }}>
        <div style={{ color: "var(--fg-2)", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  // Auth gate — show login/signup if Supabase is configured but no session
  const supabaseConfigured = !!window.supabaseClient;
  if (supabaseConfigured && !session) {
    return <AIQAuth onAuth={_onSignIn} />;
  }

  let body;
  if (view === "skillslab") {
    body = <AIQSkillsLab onNavigate={navigateToAiq} />;
  } else if (view === "coursedetail") {
    body = <AIQCourseDetail
        key={aiqContext.paperId}
        paperId={aiqContext.paperId}
        mode={aiqContext.mode || "deep"}
        onNavigate={navigateToAiq}
      />;
  } else if (view === "lessons") {
    body = <AIQLessons
        key={`${aiqContext.paperId}-${aiqContext.lessonId}-${aiqContext.mode}`}
        paperId={aiqContext.paperId}
        lessonId={aiqContext.lessonId}
        mode={aiqContext.mode || "deep"}
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
  } else {
    body = <Courses onNavigate={navigateToAiq} />;
  }

  return (
    <div className="app">
      <Sidebar active={view} onNav={handleNav} onSignOut={handleSignOut} />
      <div className="main">
        <TopBar view={view} aiqStats={aiqStats} />
        {body}
      </div>
      {showOnboarding && (
        <AIQOnboarding onComplete={(paperId, studyPath) => {
          setShowOnboarding(false);
          if (paperId) {
            const defaultMode = studyPath === "accelerated" ? "revision" : "deep";
            navigateToAiq("coursedetail", { paperId, mode: defaultMode });
          }
        }} />
      )}
      <BottomNav active={view} onNav={handleNav} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
