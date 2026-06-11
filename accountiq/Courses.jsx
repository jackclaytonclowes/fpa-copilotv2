/* Courses — Duolingo-style learning dashboard */
const { useState: useCrsState, useEffect: useCrsEffect } = React;

/* ── Static course catalogue ───────────────────────────────────────────────
   Progress values are overridden at render-time from aiqStore.paperProgress.
   TODO: replace all static metadata with real API responses from the backend.
   ───────────────────────────────────────────────────────────────────────── */

const CRS_CERT_COURSES = [
  {
    id: "ba1",
    title: "BA1",
    fullTitle: "Fundamentals of Business Economics",
    description:
      "Core macroeconomic and microeconomic principles as they apply to business decisions.",
    icon: "book-open",
    modules: 10,
    questions: 200,
    mockExams: 2,
    studyHoursTotal: 36,
    progress: 0,
  },
  {
    id: "ba2",
    title: "BA2",
    fullTitle: "Fundamentals of Management Accounting",
    description:
      "Cost classification, budgeting, variance analysis and short-term decision making.",
    icon: "calculator",
    modules: 12,
    questions: 240,
    mockExams: 3,
    studyHoursTotal: 40,
    progress: 0,
  },
  {
    id: "ba3",
    title: "BA3",
    fullTitle: "Fundamentals of Financial Accounting",
    description:
      "Financial statements, double-entry bookkeeping and interpretation of accounts.",
    icon: "bar-chart-2",
    modules: 11,
    questions: 220,
    mockExams: 2,
    studyHoursTotal: 38,
    progress: 0,
  },
  {
    id: "ba4",
    title: "BA4",
    fullTitle: "Fundamentals of Ethics, Corporate Governance & Business Law",
    description:
      "Business ethics, governance frameworks, and the legal context of business operations.",
    icon: "globe",
    modules: 9,
    questions: 180,
    mockExams: 2,
    studyHoursTotal: 32,
    progress: 0,
  },
];

const CRS_OPS_PAPERS = [
  {
    id: "e1",
    title: "E1",
    fullTitle: "Managing Finance in a Digital World",
    description:
      "Digital transformation, finance technology, data governance, business models and ESG reporting.",
    icon: "monitor",
    modules: 4,
    questions: 280,
    mockExams: 3,
    studyHoursTotal: 80,
    progress: 0,
  },
  {
    id: "p1",
    title: "P1",
    fullTitle: "Management Accounting",
    description:
      "Advanced costing, pricing decisions, decision making under uncertainty, performance measurement.",
    icon: "trending-up",
    modules: 4,
    questions: 300,
    mockExams: 3,
    studyHoursTotal: 90,
    progress: 0,
  },
  {
    id: "f1",
    title: "F1",
    fullTitle: "Financial Reporting and Taxation",
    description:
      "IFRS standards, consolidated financial statements, ratio analysis, corporation tax and deferred tax.",
    icon: "file-text",
    modules: 5,
    questions: 350,
    mockExams: 3,
    studyHoursTotal: 100,
    progress: 0,
  },
];

const CRS_MGMT_PAPERS = [
  {
    id: "e2",
    title: "E2",
    fullTitle: "Managing Performance",
    description:
      "Organisational structure, leadership, motivation, strategic analysis, change management and project management.",
    icon: "users",
    modules: 12,
    questions: 60,
    mockExams: 1,
    studyHoursTotal: 90,
    progress: 0,
  },
  {
    id: "p2",
    title: "P2",
    fullTitle: "Advanced Management Accounting",
    description:
      "Value chain analysis, advanced pricing, risk management, budgeting, variance analysis and divisional performance.",
    icon: "calculator",
    modules: 12,
    questions: 60,
    mockExams: 1,
    studyHoursTotal: 90,
    progress: 0,
  },
  {
    id: "f2",
    title: "F2",
    fullTitle: "Advanced Financial Reporting",
    description:
      "Group accounts, foreign currency, financial instruments, IFRS 16 leases, IFRS 15 revenue and sustainability reporting.",
    icon: "book-open",
    modules: 12,
    questions: 60,
    mockExams: 1,
    studyHoursTotal: 90,
    progress: 0,
  },
];

const CRS_STRAT_PAPERS = [
  {
    id: "e3",
    title: "E3",
    fullTitle: "Strategic Management",
    description:
      "Corporate strategy, business-level strategy, stakeholder management and the role of the strategist.",
    icon: "compass",
    modules: 0,
    questions: 0,
    mockExams: 0,
    studyHoursTotal: 90,
    progress: 0,
  },
  {
    id: "p3",
    title: "P3",
    fullTitle: "Risk Management",
    description:
      "Enterprise risk management, risk identification and response, internal controls and governance.",
    icon: "shield",
    modules: 0,
    questions: 0,
    mockExams: 0,
    studyHoursTotal: 90,
    progress: 0,
  },
  {
    id: "f3",
    title: "F3",
    fullTitle: "Financial Strategy",
    description:
      "Capital structure, financing decisions, valuations, mergers and acquisitions and financial risk management.",
    icon: "bar-chart",
    modules: 0,
    questions: 0,
    mockExams: 0,
    studyHoursTotal: 90,
    progress: 0,
  },
];

/* ── ProgressBar ─────────────────────────────────────────────────────────── */
function CrsProgressBar({ value, height = 6, color }) {
  const pct = Math.min(100, Math.max(0, (value || 0) * 100));
  return (
    <div
      className="crs-progress-track"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="crs-progress-fill"
        style={{ width: pct + "%", background: color || undefined }}
      />
    </div>
  );
}

/* ── Continue Learning Hero ──────────────────────────────────────────────── */
function CrsHero({ courses, onNavigate }) {
  const { Icon, Button } = window;

  /* Pick the most recently active course (first in-progress, else first course) */
  const store  = window.aiqStore.get();
  const target = store.targetPaper;
  const course = (courses || CRS_CERT_COURSES).find((c) => c.id === target)
    || (courses || CRS_CERT_COURSES).find((c) => c.progress > 0 && c.progress < 1)
    || (courses || CRS_CERT_COURSES)[0];

  const pct = Math.round(course.progress * 100);
  const remainingHrs = Math.ceil(course.studyHoursTotal * (1 - course.progress));
  const isStarted = course.progress > 0;

  // Find the first lesson that hasn't been completed yet
  const completedSet = (store.completedLessons || {})[course.id] || [];
  const catalogue    = window.AIQ_COURSE_DATA || {};
  const paper        = (catalogue.papers || []).find((p) => p.id === course.id);
  const allLessons   = paper ? (paper.lessons || []) : [];
  const resumeLesson = allLessons.find((l) => !completedSet.includes(l.id)) || allLessons[0];

  return (
    <div className="crs-hero card">
      <div className="crs-hero-body">
        <div className="crs-hero-left">
          <div className="crs-hero-eyebrow">
            <Icon name="play-circle" size={14} />
            {isStarted ? "Continue where you left off" : "Ready to start?"}
          </div>
          <h2 className="crs-hero-title">
            <span className="crs-course-badge">{course.title}</span>
            {course.fullTitle}
          </h2>
          <div className="crs-hero-next">
            <Icon name="bookmark" size={13} color="var(--fg-3)" />
            {resumeLesson
              ? (isStarted ? `Next: ${resumeLesson.title}` : `Start with: ${resumeLesson.title}`)
              : (isStarted ? "Next: pick up from your last lesson" : "Start with lesson 1")}
          </div>
          <div className="crs-hero-progress">
            <CrsProgressBar value={course.progress} height={10} />
            <div className="crs-hero-pct">
              {pct}% complete &middot; ~{remainingHrs}h remaining
            </div>
          </div>
        </div>
        <div className="crs-hero-actions">
          <Button
            variant="primary"
            icon={isStarted ? "play" : "arrow-right"}
            style={{ minHeight: 44, paddingLeft: 22, paddingRight: 22 }}
            onClick={() => onNavigate && onNavigate("coursedetail", { paperId: course.id, mode: "deep" })}
          >
            {isStarted ? "Resume" : "Start"}
          </Button>
          {isStarted && (
            <div className="crs-hero-stat">
              <Icon name="clock" size={13} color="var(--fg-3)" />
              {remainingHrs}h left
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Operational Level Section with unlock checklist ────────────────────── */
function CrsOperationalSection({ certCourses, certComplete, paperProgress, onNavigate }) {
  const { Icon } = window;

  /* Build the four unlock criteria from live course progress. */
  const criteria = certCourses.map((c) => ({
    id:       c.id,
    label:    `${c.title} — ${c.fullTitle}`,
    done:     c.progress >= 1,
  }));
  const completedCount = criteria.filter((c) => c.done).length;
  const totalCount     = criteria.length;

  const opCourses = CRS_OPS_PAPERS.map((p) => ({
    ...p,
    progress: (paperProgress || {})[p.id] ?? 0,
  }));

  return (
    <div className={`crs-section${certComplete ? "" : " crs-section--locked"}`}>
      <div className="crs-section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className={`crs-section-title${certComplete ? "" : " crs-section-title--muted"}`}>
              Operational Level
            </h2>
            {certComplete ? (
              <span className="chip fav">
                <Icon name="unlock" size={11} />
                Unlocked
              </span>
            ) : (
              <span className="crs-lock-badge">
                <Icon name="lock" size={12} />
                Locked
              </span>
            )}
          </div>
          <div className={`crs-section-sub${certComplete ? "" : " crs-section-sub--muted"}`}>
            {certComplete
              ? "E1, P1 and F1 · Operational Level papers"
              : "Complete Certificate Level to unlock E1, P1 and F1"}
          </div>
        </div>

        {/* Aggregate progress: "2 of 4 complete" or ops progress when unlocked */}
        {certComplete ? (
          <span className="chip info">
            {opCourses.filter((p) => p.progress >= 1).length} of {opCourses.length} complete
          </span>
        ) : (
          <span className={`chip ${completedCount === totalCount ? "fav" : "info"}`}>
            {completedCount} of {totalCount} complete
          </span>
        )}
      </div>

      {/* When locked: show unlock checklist + greyed-out cards */}
      {!certComplete && (
        <>
          <div className="crs-unlock-checklist">
            {criteria.map((c) => (
              <div key={c.id} className={`crs-unlock-check${c.done ? " done" : ""}`}>
                <div className={`crs-unlock-check-icon${c.done ? " done" : ""}`}>
                  <Icon
                    name={c.done ? "check" : "circle"}
                    size={14}
                    color={c.done ? "#fff" : "var(--fg-3)"}
                  />
                </div>
                <span className={`crs-unlock-check-label${c.done ? " done" : ""}`}>
                  {c.label}
                </span>
                {c.done && (
                  <span className="chip fav" style={{ marginLeft: "auto", fontSize: 11 }}>
                    Complete
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="crs-courses-grid">
            {CRS_OPS_PAPERS.map((paper) => (
              <CrsLockedCard key={paper.id} paper={paper} />
            ))}
          </div>
          <div className="crs-unlock-hint">
            <Icon name="lock" size={14} color="var(--fg-3)" />
            Complete all Certificate Level papers to unlock Operational Level courses
          </div>
        </>
      )}

      {/* When unlocked: show full interactive course cards */}
      {certComplete && (
        <div className="crs-courses-grid">
          {opCourses.map((course) => {
            const catalogue = window.AIQ_COURSE_DATA || {};
            const paper = (catalogue.papers || []).find((p) => p.id === course.id);
            const qCount = paper
              ? (paper.lessons || []).reduce((n, l) => n + ((l.practiceQuestions || []).length), 0)
              : 0;
            return (
              <CrsCourseCard
                key={course.id}
                course={course}
                onNavigate={onNavigate}
                availableQuestions={qCount}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */
function CrsStatCard({ icon, tone, label, value, children }) {
  const { Icon } = window;
  return (
    <div className="crs-stat-card card">
      <div className={`crs-stat-icon crs-stat-icon--${tone}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="crs-stat-body">
        <div className="crs-stat-label">{label}</div>
        <div className="crs-stat-value">{value}</div>
        {children && <div className="crs-stat-sub">{children}</div>}
      </div>
    </div>
  );
}

/* ── Certificate Course Card ─────────────────────────────────────────────── */
function CrsCourseCard({ course, onNavigate, availableQuestions }) {
  const { Icon, Button } = window;
  const store = window.aiqStore ? window.aiqStore.get() : {};
  const deepPct = Math.round(course.progress * 100);
  const revProgress = (store.revisionProgress || {})[course.id] || 0;
  const revPct = Math.round(revProgress * 100);
  const started = course.progress > 0 || revProgress > 0;
  const done = deepPct >= 100;

  const openCourse = (mode) => onNavigate && onNavigate("coursedetail", { paperId: course.id, mode });

  return (
    <div className={`crs-course-card card${started ? " crs-course-card--active" : ""}`}>
      <div className="crs-course-card-header">
        <div className="crs-course-icon-wrap">
          <Icon name={course.icon} size={22} color="var(--primary)" />
        </div>
        <div className="crs-course-code">
          <span className="crs-course-badge">{course.title}</span>
          {done && (
            <span className="chip fav" style={{ fontSize: 11, gap: 4 }}>
              <Icon name="check-circle" size={11} />
              Complete
            </span>
          )}
        </div>
      </div>
      <div className="crs-course-card-body">
        <h3 className="crs-course-title">{course.fullTitle}</h3>
        <p className="crs-course-desc">{course.description}</p>

        {/* Dual progress display */}
        <div className="crs-dual-progress">
          <div className="crs-dual-row">
            <span className="crs-dual-label">📚 Deep Learning</span>
            <span className="crs-dual-pct">{deepPct}%</span>
          </div>
          <CrsProgressBar value={course.progress} height={4} />
          <div className="crs-dual-row" style={{ marginTop: 8 }}>
            <span className="crs-dual-label">⚡ Revision</span>
            <span className="crs-dual-pct">{revPct}%</span>
          </div>
          <CrsProgressBar value={revProgress} height={4} color="var(--caution)" />
        </div>
      </div>
      <div className="crs-course-card-footer">
        <Button
          variant="primary"
          icon="arrow-right"
          onClick={() => openCourse("deep")}
        >
          {course.progress > 0 ? "Continue" : "Open"}
        </Button>
        {availableQuestions > 0 && (
          <button
            className="mex-course-link"
            onClick={() => onNavigate && onNavigate("mockexam", { paperId: course.id })}
          >
            <Icon name="clipboard-list" size={13} />
            Mock · {availableQuestions}Q
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Locked Operational Paper Card ──────────────────────────────────────── */
function CrsLockedCard({ paper }) {
  const { Icon } = window;
  return (
    <div className="crs-locked-card card">
      <div className="crs-locked-overlay">
        <div className="crs-locked-icon">
          <Icon name="lock" size={14} color="var(--fg-3)" />
        </div>
      </div>
      <div className="crs-course-card-header">
        <div className="crs-course-icon-wrap crs-course-icon-wrap--muted">
          <Icon name={paper.icon} size={22} color="var(--fg-3)" />
        </div>
        <span className="crs-course-badge crs-course-badge--muted">{paper.title}</span>
      </div>
      <div className="crs-course-card-body">
        <h3 className="crs-course-title crs-course-title--muted">{paper.fullTitle}</h3>
        <p className="crs-course-desc crs-course-desc--muted">{paper.description}</p>
      </div>
    </div>
  );
}

/* ── Coming-Soon card (for unpopulated papers) ───────────────────────────── */
function CrsComingSoonCard({ paper }) {
  const { Icon } = window;
  return (
    <div className="crs-locked-card card" style={{ opacity: 0.7 }}>
      <div className="crs-locked-overlay">
        <div className="crs-locked-icon">
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.04em" }}>SOON</span>
        </div>
      </div>
      <div className="crs-course-card-header">
        <div className="crs-course-icon-wrap crs-course-icon-wrap--muted">
          <Icon name={paper.icon} size={22} color="var(--fg-3)" />
        </div>
        <span className="crs-course-badge crs-course-badge--muted">{paper.title}</span>
      </div>
      <div className="crs-course-card-body">
        <h3 className="crs-course-title crs-course-title--muted">{paper.fullTitle}</h3>
        <p className="crs-course-desc crs-course-desc--muted">{paper.description}</p>
      </div>
    </div>
  );
}

/* ── Management Level Section ────────────────────────────────────────────── */
function CrsManagementSection({ opsCourses, opsComplete, paperProgress, onNavigate }) {
  const { Icon } = window;

  const criteria = opsCourses.map((c) => ({
    id:    c.id,
    label: `${c.title} — ${c.fullTitle}`,
    done:  c.progress >= 1,
  }));
  const completedCount = criteria.filter((c) => c.done).length;
  const totalCount     = criteria.length;

  const mgmtCourses = CRS_MGMT_PAPERS.map((p) => ({
    ...p,
    progress: paperProgress[p.id] !== undefined ? paperProgress[p.id] : 0,
  }));

  return (
    <div className={`crs-section${opsComplete ? "" : " crs-section--locked"}`}>
      <div className="crs-section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className={`crs-section-title${opsComplete ? "" : " crs-section-title--muted"}`}>
              Management Level
            </h2>
            {opsComplete ? (
              <span className="chip fav"><Icon name="unlock" size={11} />Unlocked</span>
            ) : (
              <span className="crs-lock-badge"><Icon name="lock" size={12} />Locked</span>
            )}
          </div>
          <div className={`crs-section-sub${opsComplete ? "" : " crs-section-sub--muted"}`}>
            {opsComplete
              ? "E2, P2 and F2 · Management Level papers"
              : "Complete Operational Level to unlock E2, P2 and F2"}
          </div>
        </div>
        {opsComplete ? (
          <span className="chip info">
            {mgmtCourses.filter((p) => p.progress >= 1).length} of {mgmtCourses.length} complete
          </span>
        ) : (
          <span className={`chip ${completedCount === totalCount ? "fav" : "info"}`}>
            {completedCount} of {totalCount} complete
          </span>
        )}
      </div>

      {!opsComplete && (
        <>
          <div className="crs-unlock-checklist">
            {criteria.map((c) => (
              <div key={c.id} className={`crs-unlock-check${c.done ? " done" : ""}`}>
                <div className={`crs-unlock-check-icon${c.done ? " done" : ""}`}>
                  <Icon name={c.done ? "check" : "circle"} size={14} color={c.done ? "#fff" : "var(--fg-3)"} />
                </div>
                <span className={`crs-unlock-check-label${c.done ? " done" : ""}`}>{c.label}</span>
                {c.done && <span className="chip fav" style={{ marginLeft: "auto", fontSize: 11 }}>Complete</span>}
              </div>
            ))}
          </div>
          <div className="crs-courses-grid">
            {CRS_MGMT_PAPERS.map((paper) => (
              <CrsLockedCard key={paper.id} paper={paper} />
            ))}
          </div>
          <div className="crs-unlock-hint">
            <Icon name="lock" size={14} color="var(--fg-3)" />
            Complete all Operational Level papers to unlock Management Level courses
          </div>
        </>
      )}

      {opsComplete && (
        <div className="crs-courses-grid">
          {mgmtCourses.map((course) => {
            const catalogue = window.AIQ_COURSE_DATA || {};
            const paper = (catalogue.papers || []).find((p) => p.id === course.id);
            const qCount = paper
              ? (paper.lessons || []).reduce((n, l) => n + ((l.practiceQuestions || []).length), 0)
              : 0;
            return (
              <CrsCourseCard key={course.id} course={course} onNavigate={onNavigate} availableQuestions={qCount} />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Strategic Level Section ─────────────────────────────────────────────── */
function CrsStrategicSection({ mgmtCourses, mgmtComplete }) {
  const { Icon } = window;

  const criteria = mgmtCourses.map((c) => ({
    id:    c.id,
    label: `${c.title} — ${c.fullTitle}`,
    done:  c.progress >= 1,
  }));
  const completedCount = criteria.filter((c) => c.done).length;
  const totalCount     = criteria.length;

  return (
    <div className="crs-section crs-section--locked">
      <div className="crs-section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className="crs-section-title crs-section-title--muted">Strategic Level</h2>
            <span className="crs-lock-badge"><Icon name="lock" size={12} />Locked</span>
          </div>
          <div className="crs-section-sub crs-section-sub--muted">
            {mgmtComplete
              ? "E3, P3 and F3 content coming soon"
              : "Complete Management Level to unlock E3, P3 and F3"}
          </div>
        </div>
        <span className={`chip ${completedCount === totalCount ? "fav" : "info"}`}>
          {completedCount} of {totalCount} complete
        </span>
      </div>

      {!mgmtComplete && (
        <div className="crs-unlock-checklist">
          {criteria.map((c) => (
            <div key={c.id} className={`crs-unlock-check${c.done ? " done" : ""}`}>
              <div className={`crs-unlock-check-icon${c.done ? " done" : ""}`}>
                <Icon name={c.done ? "check" : "circle"} size={14} color={c.done ? "#fff" : "var(--fg-3)"} />
              </div>
              <span className={`crs-unlock-check-label${c.done ? " done" : ""}`}>{c.label}</span>
              {c.done && <span className="chip fav" style={{ marginLeft: "auto", fontSize: 11 }}>Complete</span>}
            </div>
          ))}
        </div>
      )}

      <div className="crs-courses-grid">
        {CRS_STRAT_PAPERS.map((paper) => (
          <CrsComingSoonCard key={paper.id} paper={paper} />
        ))}
      </div>
      <div className="crs-unlock-hint">
        <Icon name="clock" size={14} color="var(--fg-3)" />
        Strategic Level content is in development — check back soon
      </div>
    </div>
  );
}

/* ── Courses Page ────────────────────────────────────────────────────────── */
function Courses({ onNavigate }) {
  const { Icon } = window;

  /* Subscribe to store updates so progress bars update without navigation */
  const [store, setStore] = useCrsState(() => window.aiqStore.get());
  useCrsEffect(() => {
    const handler = (e) => setStore(e.detail);
    window.addEventListener("aiq-store-update", handler);
    return () => window.removeEventListener("aiq-store-update", handler);
  }, []);

  const paperProgress    = store.paperProgress    || {};
  const dailyGoalMinutes = store.dailyGoalMinutes || 30;
  const todayMinutes     = store.todayMinutes     || 0;
  const streak           = store.streak           || 0;
  const xp               = store.xp              || 0;

  /* Merge stored progress values into the static catalogues */
  const certCourses = CRS_CERT_COURSES.map((c) => ({
    ...c,
    progress: paperProgress[c.id] ?? 0,
  }));

  const opsCourses = CRS_OPS_PAPERS.map((p) => ({
    ...p,
    progress: paperProgress[p.id] ?? 0,
  }));

  const mgmtCourses = CRS_MGMT_PAPERS.map((p) => ({
    ...p,
    progress: paperProgress[p.id] ?? 0,
  }));

  const inProgress   = certCourses.filter((c) => c.progress > 0 && c.progress < 1).length;
  const certComplete  = certCourses.every((c) => c.progress >= 1);
  const opsComplete   = opsCourses.every((c) => c.progress >= 1);
  const mgmtComplete  = mgmtCourses.every((c) => c.progress >= 1);
  const dailyPct    = Math.min(1, todayMinutes / dailyGoalMinutes);

  /* Derive streak label */
  const streakLabel = streak === 1 ? "1 day" : `${streak} days`;
  const streakSub   = streak === 0
    ? "Start studying to begin your streak"
    : streak >= 7
    ? "Amazing streak — keep it up!"
    : "Keep it going!";

  return (
    <div className="content">
      <div className="crs-page">

        {/* ── 1. Continue Learning Hero ───────────────────────────────── */}
        <CrsHero courses={certCourses} onNavigate={onNavigate} />

        {/* ── 2. Stats Row ────────────────────────────────────────────── */}
        <div className="crs-stats-row">
          <CrsStatCard
            icon={dailyPct >= 1 ? "check-circle" : "clock"}
            tone="green"
            label="Daily Study Goal"
            value={dailyPct >= 1 ? "Goal reached!" : `${todayMinutes} / ${dailyGoalMinutes} min`}
          >
            <CrsProgressBar value={dailyPct} height={4} color="var(--favourable)" />
          </CrsStatCard>

          <CrsStatCard icon="flame" tone="amber" label="Current Streak" value={streakLabel}>
            {streakSub}
          </CrsStatCard>

          <CrsStatCard icon="zap" tone="blue" label="XP Points" value={xp.toLocaleString()}>
            Total earned
          </CrsStatCard>
        </div>

        {/* ── 3. Certificate Level Courses ────────────────────────────── */}
        <div className="crs-section">
          <div className="crs-section-header">
            <div>
              <h2 className="crs-section-title">Certificate Level</h2>
              <div className="crs-section-sub">
                BA1 – BA4 · Complete all four papers to unlock Operational Level
              </div>
            </div>
            {inProgress > 0 && (
              <span className="chip info">{inProgress} in progress</span>
            )}
          </div>
          <div className="crs-courses-grid">
            {certCourses.map((course) => {
              const catalogue = window.AIQ_COURSE_DATA || {};
              const paper = (catalogue.papers || []).find((p) => p.id === course.id);
              const qCount = paper
                ? (paper.lessons || []).reduce((n, l) => n + ((l.practiceQuestions || []).length), 0)
                : 0;
              return (
                <CrsCourseCard key={course.id} course={course} onNavigate={onNavigate} availableQuestions={qCount} />
              );
            })}
          </div>
        </div>

        {/* ── 4. Operational Level ────────────────────────────────────── */}
        <CrsOperationalSection certCourses={certCourses} certComplete={certComplete} paperProgress={paperProgress} onNavigate={onNavigate} />

        {/* ── 5. Management Level ─────────────────────────────────────── */}
        <CrsManagementSection
          opsCourses={opsCourses}
          opsComplete={opsComplete}
          paperProgress={paperProgress}
          onNavigate={onNavigate}
        />

        {/* ── 6. Strategic Level (Coming Soon) ────────────────────────── */}
        <CrsStrategicSection mgmtCourses={mgmtCourses} mgmtComplete={mgmtComplete} />

      </div>
    </div>
  );
}

Object.assign(window, { Courses, CrsProgressBar, CrsStatCard, CrsLockedCard, CrsComingSoonCard });
