/* AccountIQ — Courses learning dashboard (Duolingo-style) */
const { useState: useStateCourses } = React;

// ── Static course data ───────────────────────────────────────────────────────
const CERT_COURSES = [
  {
    id: "ba1",
    code: "BA1",
    title: "Fundamentals of Business Economics",
    color: "#5C7FC0",
    colorSoft: "#EEF2FA",
    progress: 68,
    modules: 8,
    modulesCompleted: 5,
    questions: 320,
    questionsCompleted: 218,
    mockExams: 3,
    mocksDone: 1,
    xp: 1840,
    xpTotal: 2700,
    hoursLeft: 14,
    lastStudied: "Today",
    nextTopic: "Market Structures",
  },
  {
    id: "ba2",
    code: "BA2",
    title: "Fundamentals of Management Accounting",
    color: "#4F9EA3",
    colorSoft: "#EAF7F8",
    progress: 41,
    modules: 10,
    modulesCompleted: 4,
    questions: 280,
    questionsCompleted: 115,
    mockExams: 3,
    mocksDone: 0,
    xp: 1100,
    xpTotal: 2400,
    hoursLeft: 28,
    lastStudied: "Yesterday",
    nextTopic: "Cost Behaviour & CVP Analysis",
  },
  {
    id: "ba3",
    code: "BA3",
    title: "Fundamentals of Financial Accounting",
    color: "#8E84C2",
    colorSoft: "#F0EEF9",
    progress: 22,
    modules: 11,
    modulesCompleted: 2,
    questions: 350,
    questionsCompleted: 77,
    mockExams: 3,
    mocksDone: 0,
    xp: 640,
    xpTotal: 2800,
    hoursLeft: 42,
    lastStudied: "3 days ago",
    nextTopic: "Double Entry Bookkeeping",
  },
  {
    id: "ba4",
    code: "BA4",
    title: "Fundamentals of Ethics, Corporate Governance and Business Law",
    color: "#5FA083",
    colorSoft: "#EAF4EF",
    progress: 5,
    modules: 9,
    modulesCompleted: 0,
    questions: 260,
    questionsCompleted: 13,
    mockExams: 3,
    mocksDone: 0,
    xp: 190,
    xpTotal: 2200,
    hoursLeft: 51,
    lastStudied: "Not started",
    nextTopic: "Fundamental Principles of Ethics",
  },
];

const OP_COURSES = [
  {
    id: "e1",
    code: "E1",
    title: "Managing Finance in a Digital World",
    desc: "Digital technologies, data analytics and their role in modern finance.",
  },
  {
    id: "p1",
    code: "P1",
    title: "Management Accounting",
    desc: "Planning, decision-making and operational control for managers.",
  },
  {
    id: "f1",
    code: "F1",
    title: "Financial Reporting",
    desc: "Preparation, analysis and interpretation of financial statements.",
  },
];

// ── Unique SVG icons for each BA paper ──────────────────────────────────────
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

// ── Circular progress ring ───────────────────────────────────────────────────
function Ring({ pct, size = 54, stroke = 5, color = "var(--primary)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, children }) {
  const { Icon } = window;
  return (
    <div className="crs-stat-card">
      <div className="crs-stat-icon" style={{ background: accent + "20", color: accent }}>
        <Icon name={icon} size={18} />
      </div>
      <div className="crs-stat-body">
        {children || (
          <>
            <div className="crs-stat-value">{value}</div>
            <div className="crs-stat-label">{label}</div>
            {sub && <div className="crs-stat-sub">{sub}</div>}
          </>
        )}
      </div>
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

// ── Individual course card ───────────────────────────────────────────────────
function CourseCard({ course, onContinue }) {
  const { Icon, Button } = window;
  const isStarted = course.progress > 0;
  const btnLabel = isStarted ? "Continue" : "Start";
  const btnIcon  = isStarted ? "play"     : "rocket";

  return (
    <div className="crs-card reveal">
      <div className="crs-card-top">
        <PaperIcon id={course.id} color={course.color} size={44} />
        <div className="crs-card-title-wrap">
          <span className="crs-code-badge" style={{ background: course.colorSoft, color: course.color }}>
            {course.code}
          </span>
          <div className="crs-card-title">{course.title}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="crs-progress-row">
        <div className="crs-progress-track">
          <div className="crs-progress-fill"
            style={{ width: course.progress + "%", background: course.color }} />
        </div>
        <span className="crs-progress-pct" style={{ color: course.color }}>
          {course.progress}%
        </span>
      </div>

      {/* Metadata */}
      <div className="crs-meta-row">
        <MetaPill icon="layers"      value={course.modulesCompleted + "/" + course.modules}  label="modules"  color={course.color} />
        <MetaPill icon="help-circle" value={course.questionsCompleted + "/" + course.questions} label="Qs"  color={course.color} />
        <MetaPill icon="clipboard-list" value={course.mocksDone + "/" + course.mockExams}    label="mocks"    color={course.color} />
      </div>

      <div className="crs-card-footer">
        <span className="crs-time-chip">
          <Icon name="clock" size={12} color="var(--fg-3)" />
          {course.hoursLeft}h remaining
        </span>
        <Button variant="ghost" size="sm" icon={btnIcon} onClick={() => onContinue && onContinue(course)}>
          {btnLabel}
        </Button>
      </div>
    </div>
  );
}

// ── Locked operational-level card ────────────────────────────────────────────
function LockedCard({ course }) {
  const { Icon } = window;
  const codes = ["E1", "P1", "F1"];
  const colors = ["#C7A24E", "#D29478", "#C0788C"];
  const idx = codes.indexOf(course.code);
  const color = colors[idx] || "#8895A4";

  return (
    <div className="crs-card crs-card-locked">
      <div className="crs-locked-overlay">
        <div className="crs-lock-badge">
          <Icon name="lock" size={16} color="var(--fg-3)" />
        </div>
      </div>
      <div className="crs-card-top">
        <div className="crs-locked-icon-wrap">
          <span className="crs-code-badge" style={{ background: "var(--surface-2)", color: "var(--fg-3)" }}>
            {course.code}
          </span>
        </div>
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

// ── Continue Learning hero ───────────────────────────────────────────────────
function ContinueHero({ course, onContinue }) {
  const { Icon, Button } = window;
  const pctDone = course.progress;

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
            Next up: <strong>{course.nextTopic}</strong>
          </div>
        </div>
      </div>

      <div className="crs-hero-right">
        <div className="crs-hero-ring-wrap">
          <Ring pct={pctDone} size={64} stroke={6} color={course.color} />
          <span className="crs-hero-ring-label" style={{ color: course.color }}>
            {pctDone}%
          </span>
        </div>
        <Button variant="primary" icon="play" onClick={() => onContinue && onContinue(course)}
          style={{ background: course.color, borderColor: "transparent" }}>
          Resume
        </Button>
      </div>
    </div>
  );
}

// ── Main Courses page ────────────────────────────────────────────────────────
function Courses() {
  const { Icon } = window;
  const [activeCourse, setActiveCourse] = useStateCourses(null);

  // Derive "continue learning" course — highest progress that's not 100%
  const continueCourse = [...CERT_COURSES]
    .filter((c) => c.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  // Aggregate stats
  const totalXp          = CERT_COURSES.reduce((s, c) => s + c.xp, 0);
  const totalHoursLeft   = CERT_COURSES.reduce((s, c) => s + c.hoursLeft, 0);
  const streak           = 7;
  const dailyGoalMin     = 30;
  const dailyDoneMin     = 20;
  const dailyPct         = Math.round((dailyDoneMin / dailyGoalMin) * 100);
  const certPct          = Math.round(
    CERT_COURSES.reduce((s, c) => s + c.progress, 0) / CERT_COURSES.length
  );

  return (
    <div className="content">
      <div className="crs-page">

        {/* ── Continue Learning hero ── */}
        {continueCourse && (
          <section className="crs-section">
            <div className="crs-section-head">
              <Icon name="play-circle" size={16} color="var(--primary)" />
              <span>Continue Learning</span>
            </div>
            <ContinueHero course={continueCourse} onContinue={setActiveCourse} />
          </section>
        )}

        {/* ── Stats row ── */}
        <section className="crs-section">
          <div className="crs-stats-grid">

            {/* Daily goal */}
            <div className="crs-stat-card crs-stat-card--goal">
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Ring pct={dailyPct} size={54} stroke={5} color="var(--primary)" />
                <span className="crs-ring-center" style={{ color: "var(--primary)" }}>
                  {dailyPct}%
                </span>
              </div>
              <div className="crs-stat-body">
                <div className="crs-stat-value">{dailyDoneMin} min</div>
                <div className="crs-stat-label">Daily goal</div>
                <div className="crs-stat-sub">{dailyGoalMin - dailyDoneMin} min to go</div>
              </div>
            </div>

            {/* Streak */}
            <StatCard icon="flame" label="Day streak" value={streak} sub="Keep it up!"
              accent="#C77D11">
              <div className="crs-stat-value" style={{ color: "#C77D11" }}>
                {streak}
                <span style={{ fontSize: 13, fontWeight: 400, color: "var(--fg-3)", marginLeft: 4 }}>
                  days
                </span>
              </div>
              <div className="crs-stat-label">Current streak</div>
              <div className="crs-stat-sub">🔥 Keep it up!</div>
            </StatCard>

            {/* XP */}
            <StatCard icon="zap" label="Total XP" value={totalXp.toLocaleString()} accent="var(--primary)">
              <div className="crs-stat-value" style={{ color: "var(--primary)" }}>
                {totalXp.toLocaleString()}
              </div>
              <div className="crs-stat-label">XP earned</div>
              <div className="crs-stat-sub">Across all papers</div>
            </StatCard>

            {/* Study time */}
            <StatCard icon="clock" label="Study time left" accent="var(--favourable)">
              <div className="crs-stat-value" style={{ color: "var(--favourable)" }}>
                {totalHoursLeft}h
              </div>
              <div className="crs-stat-label">Est. remaining</div>
              <div className="crs-stat-sub">Certificate level</div>
            </StatCard>
          </div>
        </section>

        {/* ── Certificate level ── */}
        <section className="crs-section">
          <div className="crs-section-head">
            <Icon name="award" size={16} color="var(--primary)" />
            <span>Certificate Level</span>
            <span className="crs-level-badge">CIMA</span>
            <div className="crs-section-progress">
              <div className="crs-progress-track crs-progress-track--sm">
                <div className="crs-progress-fill"
                  style={{ width: certPct + "%", background: "var(--primary)" }} />
              </div>
              <span className="crs-section-pct">{certPct}% complete</span>
            </div>
          </div>

          <div className="crs-courses-grid">
            {CERT_COURSES.map((c) => (
              <CourseCard key={c.id} course={c} onContinue={setActiveCourse} />
            ))}
          </div>
        </section>

        {/* ── Operational level (locked) ── */}
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
            {OP_COURSES.map((c) => (
              <LockedCard key={c.id} course={c} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

Object.assign(window, { Courses });
