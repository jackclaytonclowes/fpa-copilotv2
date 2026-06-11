/* Courses — Duolingo-style learning dashboard */
const { useState: useCrsState } = React;

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
    progress: 0.78, // TODO: fetch from /api/user/progress
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
    progress: 0.42, // TODO: fetch from /api/user/progress
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
    progress: 0, // TODO: fetch from /api/user/progress
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
    progress: 0, // TODO: fetch from /api/user/progress
  },
];

const CRS_OPS_PAPERS = [
  {
    id: "e1",
    title: "E1",
    fullTitle: "Managing Finance in a Digital World",
    description:
      "The role of finance in the digital economy and business model transformation.",
    icon: "monitor",
  },
  {
    id: "p1",
    title: "P1",
    fullTitle: "Management Accounting",
    description:
      "Costing, budgeting, performance measurement and decision-support techniques.",
    icon: "trending-up",
  },
  {
    id: "f1",
    title: "F1",
    fullTitle: "Financial Reporting and Taxation",
    description:
      "Financial reporting standards, taxation principles and corporate finance basics.",
    icon: "file-text",
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
            onClick={() => onNavigate && onNavigate("lessons", { paperId: course.id, lessonId: resumeLesson ? resumeLesson.id : undefined })}
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
function CrsOperationalSection({ certCourses, certComplete }) {
  const { Icon } = window;

  /* Build the four unlock criteria from live course progress.
     A paper is "complete" when its progress value reaches 1.0.
     TODO: replace progress with real backend completion flag. */
  const criteria = certCourses.map((c) => ({
    id:       c.id,
    label:    `${c.title} — ${c.fullTitle}`,
    done:     c.progress >= 1,
  }));
  const completedCount = criteria.filter((c) => c.done).length;
  const totalCount     = criteria.length;

  return (
    <div className="crs-section crs-section--locked">
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
            Complete Certificate Level to unlock E1, P1 and F1
          </div>
        </div>

        {/* Aggregate progress: "2 of 4 complete" */}
        <span className={`chip ${completedCount === totalCount ? "fav" : "info"}`}>
          {completedCount} of {totalCount} complete
        </span>
      </div>

      {/* Unlock checklist */}
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

      {/* Locked course cards — always shown regardless of lock state */}
      {!certComplete && (
        <>
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
  const pct = Math.round(course.progress * 100);
  const started = course.progress > 0;
  const done = pct >= 100;
  // TODO: replace with real remaining time from backend
  const timeLabel = done
    ? "Complete"
    : course.progress === 0
    ? `${course.studyHoursTotal}h est.`
    : `~${Math.ceil(course.studyHoursTotal * (1 - course.progress))}h remaining`;

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
        <div className="crs-course-meta">
          <span>
            <Icon name="layers" size={12} color="var(--fg-3)" />
            {course.modules} modules
          </span>
          <span>
            <Icon name="help-circle" size={12} color="var(--fg-3)" />
            {course.questions} questions
          </span>
          <span>
            <Icon name="clipboard-list" size={12} color="var(--fg-3)" />
            {course.mockExams} mock exams
          </span>
        </div>
        <div className="crs-course-time">
          <Icon name="clock" size={12} color="var(--fg-3)" />
          {timeLabel}
        </div>
        <div className="crs-course-progress-row">
          <CrsProgressBar value={course.progress} height={5} />
          <span className="crs-course-pct">{pct}%</span>
        </div>
      </div>
      <div className="crs-course-card-footer">
        <Button
          variant={started ? "primary" : "secondary"}
          icon={started ? "play" : "arrow-right"}
          onClick={() => onNavigate && onNavigate("lessons", { paperId: course.id })}
        >
          {started ? "Continue" : "Start"}
        </Button>
        {availableQuestions > 0 && (
          <button
            className="mex-course-link"
            onClick={() => onNavigate && onNavigate("mockexam", { paperId: course.id })}
          >
            <Icon name="clipboard-list" size={13} />
            Mock exam · {availableQuestions}Q
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

/* ── Courses Page ────────────────────────────────────────────────────────── */
function Courses({ onNavigate }) {
  const { Icon } = window;

  /* Read live values from store; fall back to sensible defaults so the page
     renders correctly even before onboarding is complete. */
  const store = window.aiqStore.get();
  const paperProgress = store.paperProgress || {};
  const dailyGoalMinutes = store.dailyGoalMinutes || 30; // TODO: replace with real API
  const todayMinutes     = store.todayMinutes     || 0;
  const streak           = store.streak           || 0;
  const xp               = store.xp              || 0;

  /* Merge stored progress values into the static catalogue */
  const certCourses = CRS_CERT_COURSES.map((c) => ({
    ...c,
    progress: paperProgress[c.id] !== undefined ? paperProgress[c.id] : c.progress,
  }));

  const inProgress  = certCourses.filter((c) => c.progress > 0 && c.progress < 1).length;
  const certComplete = certCourses.every((c) => c.progress >= 1);
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
        <CrsOperationalSection certCourses={certCourses} certComplete={certComplete} />

      </div>
    </div>
  );
}

Object.assign(window, { Courses, CrsProgressBar, CrsStatCard, CrsLockedCard });
