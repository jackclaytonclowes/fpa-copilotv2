/* AccountIQ — Courses learning dashboard */
const { useState: useStateCourses, useEffect: useEffectCourses } = React;

// ── Seed course metadata (icons, colours, static metadata) ──────────────────
const CERT_COURSES = [
  {
    id: "ba1",
    code: "BA1",
    title: "Fundamentals of Business Economics",
    color: "#5C7FC0",
    colorSoft: "#EEF2FA",
    mockExams: 3,
    hoursTotal: 44,
    lastStudied: "Today",
  },
  {
    id: "ba2",
    code: "BA2",
    title: "Fundamentals of Management Accounting",
    color: "#4F9EA3",
    colorSoft: "#EAF7F8",
    mockExams: 3,
    hoursTotal: 48,
    lastStudied: "Yesterday",
  },
  {
    id: "ba3",
    code: "BA3",
    title: "Fundamentals of Financial Accounting",
    color: "#8E84C2",
    colorSoft: "#F0EEF9",
    mockExams: 3,
    hoursTotal: 54,
    lastStudied: "3 days ago",
  },
  {
    id: "ba4",
    code: "BA4",
    title: "Fundamentals of Ethics, Corporate Governance and Business Law",
    color: "#5FA083",
    colorSoft: "#EAF4EF",
    mockExams: 3,
    hoursTotal: 54,
    lastStudied: "Not started",
  },
];

const OP_COURSES = [
  { id: "e1", code: "E1", title: "Managing Finance in a Digital World",      desc: "Digital technologies, data analytics and their role in modern finance." },
  { id: "p1", code: "P1", title: "Management Accounting",                     desc: "Planning, decision-making and operational control for managers." },
  { id: "f1", code: "F1", title: "Financial Reporting",                       desc: "Preparation, analysis and interpretation of financial statements." },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getLessonStatus(lessons, idx, completedLessons) {
  if (completedLessons.includes(lessons[idx].id)) return "done";
  if (idx === 0 || completedLessons.includes(lessons[idx - 1].id)) return "active";
  return "locked";
}

function getNextLesson(lessons, completedLessons) {
  return lessons.find((l) => !completedLessons.includes(l.id)) || null;
}

function enrichCourse(course, progress, content) {
  if (!content || !window.computeLiveStats) return {
    ...course, progress: 0, xp: 0, completedLessons: 0, totalLessons: 4,
    hoursLeft: course.hoursTotal, nextTopic: "Start learning",
  };
  const live = window.computeLiveStats(course.id, progress, content);
  const lessons = content.lessons || [];
  const next    = getNextLesson(lessons, progress.completedLessons);
  return {
    ...course,
    progress:         live.progressPct,
    xp:               live.xpEarned,
    completedLessons: live.completedCount,
    totalLessons:     live.totalLessons,
    hoursLeft:        Math.round(course.hoursTotal * (1 - live.progressPct / 100)),
    nextTopic:        next ? next.title : "All lessons complete",
  };
}

// ── Paper icons (unique SVG per paper) ───────────────────────────────────────
function PaperIcon({ id, color, size = 44 }) {
  const bg = color + "28";
  if (id === "ba1") return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect width="44" height="44" rx="12" fill={bg} />
      <polyline points="9,33 17,22 23,27 35,13"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9"  cy="33" r="2.5" fill={color} />
      <circle cx="17" cy="22" r="2.5" fill={color} />
      <circle cx="23" cy="27" r="2.5" fill={color} />
      <circle cx="35" cy="13" r="2.5" fill={color} />
      <line x1="9" y1="37" x2="35" y2="37"
        stroke={color} strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
  if (id === "ba2") return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect width="44" height="44" rx="12" fill={bg} />
      <rect x="11" y="8" width="22" height="28" rx="3.5" stroke={color} strokeWidth="2" />
      <rect x="14" y="12" width="16" height="7" rx="2"
        fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      <circle cx="16" cy="25" r="1.8" fill={color} />
      <circle cx="22" cy="25" r="1.8" fill={color} />
      <circle cx="28" cy="25" r="1.8" fill={color} />
      <circle cx="16" cy="31" r="1.8" fill={color} />
      <circle cx="22" cy="31" r="1.8" fill={color} />
      <rect x="26.5" y="29.5" width="3" height="3" rx="0.8" fill={color} />
    </svg>
  );
  if (id === "ba3") return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect width="44" height="44" rx="12" fill={bg} />
      <path d="M22 13 C18 11 11 12 9 13 L9 34 C11 33 18 32 22 34"
        stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 13 C26 11 33 12 35 13 L35 34 C33 33 26 32 22 34"
        stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="22" y1="13" x2="22" y2="34"
        stroke={color} strokeWidth="1.5" strokeDasharray="2 3" strokeOpacity="0.45" />
      <line x1="12" y1="19"   x2="19" y2="18.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="12" y1="23.5" x2="19" y2="22.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="12" y1="28"   x2="19" y2="27.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  );
  if (id === "ba4") return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect width="44" height="44" rx="12" fill={bg} />
      <path d="M22 9 L33 13.5 L33 22 C33 28.5 28 34 22 36 C16 34 11 28.5 11 22 L11 13.5 Z"
        stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.1" strokeLinejoin="round" />
      <polyline points="16.5,22.5 20,26 27.5,18"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return null;
}

// ── Circular ring ────────────────────────────────────────────────────────────
function Ring({ pct, size = 54, stroke = 5, color = "var(--primary)" }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, accent, children }) {
  const { Icon } = window;
  return (
    <div className="crs-stat-card">
      <div className="crs-stat-icon" style={{ background: accent + "20", color: accent }}>
        <Icon name={icon} size={18} />
      </div>
      <div className="crs-stat-body">{children}</div>
    </div>
  );
}

// ── Metadata pill ────────────────────────────────────────────────────────────
function MetaPill({ icon, value, label, color }) {
  const { Icon } = window;
  return (
    <span className="crs-meta-pill">
      <Icon name={icon} size={12} color={color} />
      <span className="crs-meta-value">{value}</span>
      <span className="crs-meta-label">{label}</span>
    </span>
  );
}

// ── Course card (dashboard grid) ─────────────────────────────────────────────
function CourseCard({ course, enriched, onOpen }) {
  const { Icon } = window;
  const isStarted = enriched.progress > 0;
  return (
    <div className="crs-card reveal" onClick={() => onOpen(course)} style={{ cursor: "pointer" }}>
      <div className="crs-card-top">
        <PaperIcon id={course.id} color={course.color} size={44} />
        <div className="crs-card-title-wrap">
          <span className="crs-code-badge" style={{ background: course.colorSoft, color: course.color }}>
            {course.code}
          </span>
          <div className="crs-card-title">{course.title}</div>
        </div>
      </div>

      <div className="crs-progress-row">
        <div className="crs-progress-track">
          <div className="crs-progress-fill" style={{ width: enriched.progress + "%", background: course.color }} />
        </div>
        <span className="crs-progress-pct" style={{ color: course.color }}>{enriched.progress}%</span>
      </div>

      <div className="crs-meta-row">
        <MetaPill icon="layers"         value={enriched.completedLessons + "/" + enriched.totalLessons} label="lessons"  color={course.color} />
        <MetaPill icon="clipboard-list" value={"0/" + course.mockExams}                                 label="mocks"    color={course.color} />
        <MetaPill icon="zap"            value={enriched.xp.toLocaleString()}                            label="XP"       color={course.color} />
      </div>

      <div className="crs-card-footer">
        <span className="crs-time-chip">
          <Icon name="clock" size={12} color="var(--fg-3)" />
          {enriched.hoursLeft}h remaining
        </span>
        <span style={{ display:"inline-flex",alignItems:"center",gap:5,font:"var(--text-body-strong)",fontSize:13,color:course.color }}>
          {isStarted ? "Continue" : "Start"}
          <Icon name="arrow-right" size={14} color={course.color} />
        </span>
      </div>
    </div>
  );
}

// ── Locked operational card ──────────────────────────────────────────────────
function LockedCard({ course }) {
  const { Icon } = window;
  return (
    <div className="crs-card crs-card-locked">
      <div className="crs-locked-overlay">
        <div className="crs-lock-badge"><Icon name="lock" size={16} color="var(--fg-3)" /></div>
      </div>
      <div className="crs-card-top">
        <span className="crs-code-badge" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
          {course.code}
        </span>
        <div className="crs-card-title-wrap">
          <div className="crs-card-title" style={{ color: "var(--fg-3)" }}>{course.title}</div>
          <div className="crs-card-desc">{course.desc}</div>
        </div>
      </div>
      <div className="crs-locked-req">
        <Icon name="shield" size={12} color="var(--fg-3)" />
        Complete all Certificate papers to unlock
      </div>
    </div>
  );
}

// ── Continue Learning hero ────────────────────────────────────────────────────
function ContinueHero({ course, enriched, onOpen }) {
  const { Icon, Button } = window;
  return (
    <div className="crs-hero reveal">
      <div className="crs-hero-left">
        <PaperIcon id={course.id} color={course.color} size={52} />
        <div className="crs-hero-text">
          <div className="crs-hero-eyebrow">
            <span className="crs-code-badge" style={{ background: course.colorSoft, color: course.color }}>
              {course.code}
            </span>
            <span className="crs-hero-last">Last studied: {course.lastStudied}</span>
          </div>
          <div className="crs-hero-title">{course.title}</div>
          <div className="crs-hero-next">
            <Icon name="arrow-right" size={13} color="var(--fg-3)" />
            Next up: <strong>{enriched.nextTopic}</strong>
          </div>
        </div>
      </div>
      <div className="crs-hero-right">
        <div className="crs-hero-ring-wrap">
          <Ring pct={enriched.progress} size={64} stroke={6} color={course.color} />
          <span className="crs-hero-ring-label" style={{ color: course.color }}>{enriched.progress}%</span>
        </div>
        <Button variant="primary" icon="play" onClick={() => onOpen(course)}
          style={{ background: course.color, borderColor: "transparent" }}>
          Resume
        </Button>
      </div>
    </div>
  );
}

// ── Course Detail — lesson list ───────────────────────────────────────────────
function CourseDetail({ course, progress, onOpenLesson, onBack }) {
  const { Icon } = window;
  const content  = (window.COURSE_CONTENT && window.COURSE_CONTENT[course.id]) || { lessons: [] };
  const lessons  = content.lessons || [];
  const done     = lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
  const pct      = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  return (
    <div className="content">
      <div className="cd-page">
        <button className="cd-back-btn" onClick={onBack}>
          <Icon name="arrow-left" size={15} />
          All Courses
        </button>

        {/* Course header */}
        <div className="cd-header">
          <PaperIcon id={course.id} color={course.color} size={52} />
          <div className="cd-header-text">
            <div style={{ marginBottom: 8 }}>
              <span className="crs-code-badge" style={{ background: course.colorSoft, color: course.color }}>
                {course.code}
              </span>
            </div>
            <h2 className="cd-header-title">{course.title}</h2>
            <div className="cd-header-meta">
              <span className="cd-header-stat">
                <Icon name="layers" size={13} color="var(--fg-3)" />
                {lessons.length} lessons
              </span>
              <span className="cd-header-stat">
                <Icon name="clock" size={13} color="var(--fg-3)" />
                ~{lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0)} min total
              </span>
              <span className="cd-header-stat">
                <Icon name="help-circle" size={13} color="var(--fg-3)" />
                {lessons.length * 4} quiz questions
              </span>
            </div>
            <div className="cd-prog-row">
              <span className="cd-prog-label">Progress</span>
              <div className="cd-prog-track">
                <div className="cd-prog-fill" style={{ width: pct + "%", background: course.color }} />
              </div>
              <span className="cd-prog-pct" style={{ color: course.color }}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* Lesson list */}
        <div className="cd-lesson-list">
          {lessons.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--fg-3)", font: "var(--text-body)" }}>
              Content loading…
            </div>
          )}
          {lessons.map((lesson, idx) => {
            const status = getLessonStatus(lessons, idx, progress.completedLessons);
            const score  = progress.quizScores[lesson.id];
            const isDone = status === "done";
            const isLocked = status === "locked";
            return (
              <div
                key={lesson.id}
                className={`cd-lesson${isDone ? " cd-lesson--done" : isLocked ? " cd-lesson--locked" : ""}`}
                onClick={() => !isLocked && onOpenLesson(lesson, idx)}
              >
                {/* Number badge */}
                <div className={`cd-lesson-num ${isDone ? "cd-lesson-num--done" : isLocked ? "cd-lesson-num--locked" : "cd-lesson-num--active"}`}
                  style={!isDone && !isLocked ? { background: course.color } : {}}>
                  {isDone
                    ? <Icon name="check" size={14} color="#fff" />
                    : isLocked
                      ? <Icon name="lock" size={13} color="var(--fg-3)" />
                      : idx + 1}
                </div>

                <div className="cd-lesson-body">
                  <div className="cd-lesson-title">{lesson.title}</div>
                  <div className="cd-lesson-summary">{lesson.summary}</div>
                </div>

                <div className="cd-lesson-right">
                  {isDone && score && (
                    <span className="cd-lesson-score">
                      <Icon name="zap" size={12} color="var(--favourable)" />
                      {score.score * 50} XP
                    </span>
                  )}
                  <span className="cd-lesson-time">
                    <Icon name="clock" size={12} color="var(--fg-3)" />
                    {lesson.estimatedMinutes} min
                  </span>
                  {!isLocked && (
                    <Icon name={isDone ? "rotate-ccw" : "arrow-right"} size={15} color={isDone ? "var(--fg-3)" : course.color} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Courses component ────────────────────────────────────────────────────
function Courses() {
  const { Icon } = window;

  const [screen,       setScreen]       = useStateCourses("dashboard");
  const [activeCourse, setActiveCourse] = useStateCourses(null);
  const [activeLesson, setActiveLesson] = useStateCourses(null);
  const [lessonIdx,    setLessonIdx]    = useStateCourses(0);
  const [progress,     setProgress]     = useStateCourses(() => {
    if (window.loadProgress) return window.loadProgress();
    return { completedLessons: [], quizScores: {} };
  });

  // Reload progress from localStorage whenever we return to dashboard/detail
  useEffectCourses(() => {
    if (window.loadProgress) setProgress(window.loadProgress());
  }, [screen]);

  const handleCompleteLesson = (lessonId, quizScore) => {
    const p = window.loadProgress ? window.loadProgress() : progress;
    const updated = {
      completedLessons: p.completedLessons.includes(lessonId)
        ? p.completedLessons
        : [...p.completedLessons, lessonId],
      quizScores: { ...p.quizScores, [lessonId]: quizScore },
    };
    if (window.saveProgress) window.saveProgress(updated);
    setProgress(updated);
    setScreen("detail");
  };

  const openCourse = (course) => {
    setActiveCourse(course);
    setScreen("detail");
  };

  const openLesson = (lesson, idx) => {
    setActiveLesson(lesson);
    setLessonIdx(idx);
    setScreen("lesson");
  };

  // ── LessonView screen ──
  if (screen === "lesson" && activeCourse && activeLesson) {
    const content     = (window.COURSE_CONTENT && window.COURSE_CONTENT[activeCourse.id]) || { lessons: [] };
    const totalLessons = content.lessons ? content.lessons.length : 4;
    return (
      <LessonView
        lesson={activeLesson}
        course={activeCourse}
        lessonIndex={lessonIdx}
        totalLessons={totalLessons}
        progress={progress}
        onComplete={handleCompleteLesson}
        onBack={() => setScreen("detail")}
      />
    );
  }

  // ── CourseDetail screen ──
  if (screen === "detail" && activeCourse) {
    return (
      <CourseDetail
        course={activeCourse}
        progress={progress}
        onOpenLesson={openLesson}
        onBack={() => setScreen("dashboard")}
      />
    );
  }

  // ── Dashboard screen ──
  const content = window.COURSE_CONTENT || {};
  const enriched = CERT_COURSES.map((c) => enrichCourse(c, progress, content[c.id]));

  const continueCourse = enriched
    .filter((e) => e.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];
  const continueSeed = continueCourse
    ? CERT_COURSES.find((c) => c.id === continueCourse.id)
    : null;

  const totalXp        = enriched.reduce((s, e) => s + e.xp, 0);
  const totalHoursLeft = enriched.reduce((s, e) => s + e.hoursLeft, 0);
  const streak         = 7;
  const dailyGoalMin   = 30;
  const dailyDoneMin   = 20;
  const dailyPct       = Math.round((dailyDoneMin / dailyGoalMin) * 100);
  const certPct        = Math.round(enriched.reduce((s, e) => s + e.progress, 0) / enriched.length);

  return (
    <div className="content">
      <div className="crs-page">

        {/* Continue Learning hero */}
        {continueSeed && (
          <section className="crs-section">
            <div className="crs-section-head">
              <Icon name="play-circle" size={16} color="var(--primary)" />
              <span>Continue Learning</span>
            </div>
            <ContinueHero
              course={continueSeed}
              enriched={continueCourse}
              onOpen={openCourse}
            />
          </section>
        )}

        {/* Stats row */}
        <section className="crs-section">
          <div className="crs-stats-grid">
            <div className="crs-stat-card crs-stat-card--goal">
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Ring pct={dailyPct} size={54} stroke={5} color="var(--primary)" />
                <span className="crs-ring-center" style={{ color: "var(--primary)" }}>{dailyPct}%</span>
              </div>
              <div className="crs-stat-body">
                <div className="crs-stat-value">{dailyDoneMin} min</div>
                <div className="crs-stat-label">Daily goal</div>
                <div className="crs-stat-sub">{dailyGoalMin - dailyDoneMin} min to go</div>
              </div>
            </div>

            <StatCard icon="flame" accent="#C77D11">
              <div className="crs-stat-value" style={{ color: "#C77D11" }}>
                {streak}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--fg-3)", marginLeft: 4 }}>days</span>
              </div>
              <div className="crs-stat-label">Current streak</div>
              <div className="crs-stat-sub">🔥 Keep it up!</div>
            </StatCard>

            <StatCard icon="zap" accent="var(--primary)">
              <div className="crs-stat-value" style={{ color: "var(--primary)" }}>{totalXp.toLocaleString()}</div>
              <div className="crs-stat-label">XP earned</div>
              <div className="crs-stat-sub">Across all papers</div>
            </StatCard>

            <StatCard icon="clock" accent="var(--favourable)">
              <div className="crs-stat-value" style={{ color: "var(--favourable)" }}>{totalHoursLeft}h</div>
              <div className="crs-stat-label">Est. remaining</div>
              <div className="crs-stat-sub">Certificate level</div>
            </StatCard>
          </div>
        </section>

        {/* Certificate level */}
        <section className="crs-section">
          <div className="crs-section-head">
            <Icon name="award" size={16} color="var(--primary)" />
            <span>Certificate Level</span>
            <span className="crs-level-badge">CIMA</span>
            <div className="crs-section-progress">
              <div className="crs-progress-track crs-progress-track--sm">
                <div className="crs-progress-fill" style={{ width: certPct + "%", background: "var(--primary)" }} />
              </div>
              <span className="crs-section-pct">{certPct}% complete</span>
            </div>
          </div>
          <div className="crs-courses-grid">
            {CERT_COURSES.map((c, i) => (
              <CourseCard key={c.id} course={c} enriched={enriched[i]} onOpen={openCourse} />
            ))}
          </div>
        </section>

        {/* Operational level */}
        <section className="crs-section">
          <div className="crs-section-head">
            <Icon name="lock" size={16} color="var(--fg-3)" />
            <span style={{ color: "var(--fg-3)" }}>Operational Level</span>
            <span className="crs-level-badge crs-level-badge--locked">LOCKED</span>
          </div>
          <p className="crs-locked-hint">
            Complete all four Certificate papers to unlock the Operational Level pathway.
          </p>
          <div className="crs-courses-grid">
            {OP_COURSES.map((c) => <LockedCard key={c.id} course={c} />)}
          </div>
        </section>

      </div>
    </div>
  );
}

Object.assign(window, { Courses });
