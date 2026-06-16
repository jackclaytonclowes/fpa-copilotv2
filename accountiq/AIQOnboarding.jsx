/* AccountIQ — Study Plan Onboarding
 *
 * Short 4-step flow captured entirely in local state.
 * No backend write. On completion, writes to aiqStore and calls onComplete().
 *
 * Steps:
 *   1. Target paper selection (BA1–BA4 + Operational papers)
 *   2. Exam sitting / target date
 *   3. Weekly hours available
 *   4. Current confidence level → derives daily goal → summary + confirm
 */
const { useState: useOnbState } = React;

const PAPERS = [
  { id: "ba1", label: "BA1", sub: "Fundamentals of Business Economics" },
  { id: "ba2", label: "BA2", sub: "Fundamentals of Management Accounting" },
  { id: "ba3", label: "BA3", sub: "Fundamentals of Financial Accounting" },
  { id: "ba4", label: "BA4", sub: "Fundamentals of Ethics, Corporate Governance & Business Law" },
  { id: "e1",  label: "E1",  sub: "Managing Finance in a Digital World" },
  { id: "p1",  label: "P1",  sub: "Management Accounting" },
  { id: "f1",  label: "F1",  sub: "Financial Reporting and Taxation" },
];

const SITTINGS = [
  "May 2026", "August 2026", "November 2026",
  "February 2027", "May 2027", "August 2027", "November 2027",
  "Not booked yet",
];

const CONFIDENCE_OPTIONS = [
  {
    id: "beginner",
    label: "New to this",
    sub: "I haven't studied this subject before",
    icon: "seedling",
  },
  {
    id: "some",
    label: "Some knowledge",
    sub: "I've covered some of this material already",
    icon: "book-open",
  },
  {
    id: "solid",
    label: "Solid foundation",
    sub: "I'm comfortable with most of the core concepts",
    icon: "graduation-cap",
  },
];

/* ── Step indicator ───────────────────────────────────────────────────────── */
function OnbSteps({ current, total }) {
  return (
    <div className="onb-steps">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`onb-step-dot${i < current ? " done" : i === current ? " active" : ""}`}
        />
      ))}
    </div>
  );
}

/* ── Step 1: Target paper ─────────────────────────────────────────────────── */
function OnbStep1({ value, onChange }) {
  const { Icon } = window;
  return (
    <div className="onb-step">
      <div className="onb-step-icon onb-step-icon--blue">
        <Icon name="target" size={24} />
      </div>
      <h2 className="onb-step-title">Which paper are you studying for?</h2>
      <p className="onb-step-sub">
        Choose the paper you want to focus on first. You can change this later.
      </p>
      <div className="onb-options">
        {PAPERS.map((p) => (
          <button
            key={p.id}
            className={`onb-option${value === p.id ? " selected" : ""}`}
            onClick={() => onChange(p.id)}
          >
            <span className="onb-option-badge">{p.label}</span>
            <span className="onb-option-sub">{p.sub}</span>
            {value === p.id && <Icon name="check-circle" size={16} color="var(--primary)" style={{ marginLeft: "auto", flexShrink: 0 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Exam sitting ─────────────────────────────────────────────────── */
function OnbStep2({ value, onChange }) {
  const { Icon } = window;
  return (
    <div className="onb-step">
      <div className="onb-step-icon onb-step-icon--amber">
        <Icon name="calendar" size={24} />
      </div>
      <h2 className="onb-step-title">When are you sitting the exam?</h2>
      <p className="onb-step-sub">
        CIMA exams are available on demand. Pick the sitting you're aiming for, or select "Not booked yet" if you haven't scheduled one.
      </p>
      <div className="onb-options onb-options--compact">
        {SITTINGS.map((s) => (
          <button
            key={s}
            className={`onb-option onb-option--compact${value === s ? " selected" : ""}`}
            onClick={() => onChange(s)}
          >
            <Icon
              name={s === "Not booked yet" ? "clock" : "calendar"}
              size={14}
              color={value === s ? "var(--primary)" : "var(--fg-3)"}
            />
            {s}
            {value === s && <Icon name="check-circle" size={14} color="var(--primary)" style={{ marginLeft: "auto" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: Weekly hours ─────────────────────────────────────────────────── */
function OnbStep3({ value, onChange }) {
  const { Icon } = window;
  const options = [1, 2, 3, 5, 7, 10, 15];
  return (
    <div className="onb-step">
      <div className="onb-step-icon onb-step-icon--green">
        <Icon name="clock" size={24} />
      </div>
      <h2 className="onb-step-title">How many hours can you study each week?</h2>
      <p className="onb-step-sub">
        Be realistic — consistency beats intensity. This shapes your daily study goal.
      </p>
      <div className="onb-hours-grid">
        {options.map((h) => (
          <button
            key={h}
            className={`onb-hours-btn${value === h ? " selected" : ""}`}
            onClick={() => onChange(h)}
          >
            <span className="onb-hours-num">{h}</span>
            <span className="onb-hours-unit">hr{h !== 1 ? "s" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 4: Confidence level ─────────────────────────────────────────────── */
function OnbStep4({ value, onChange }) {
  const { Icon } = window;
  return (
    <div className="onb-step">
      <div className="onb-step-icon onb-step-icon--purple">
        <Icon name="bar-chart-2" size={24} />
      </div>
      <h2 className="onb-step-title">How confident are you with this subject?</h2>
      <p className="onb-step-sub">
        This adjusts your daily target to give you enough time for review.
      </p>
      <div className="onb-options">
        {CONFIDENCE_OPTIONS.map((o) => (
          <button
            key={o.id}
            className={`onb-option${value === o.id ? " selected" : ""}`}
            onClick={() => onChange(o.id)}
          >
            <div className="onb-option-conf-icon">
              <Icon name={o.icon} size={18} color={value === o.id ? "var(--primary)" : "var(--fg-3)"} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="onb-option-label">{o.label}</div>
              <div className="onb-option-sub">{o.sub}</div>
            </div>
            {value === o.id && <Icon name="check-circle" size={16} color="var(--primary)" style={{ flexShrink: 0 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 5: Study path ────────────────────────────────────────────────────── */
function OnbStep5({ value, onChange }) {
  const { Icon } = window;
  return (
    <div className="onb-step">
      <div className="onb-step-icon onb-step-icon--amber">
        <Icon name="map" size={24} />
      </div>
      <h2 className="onb-step-title">Which approach suits you?</h2>
      <p className="onb-step-sub">
        You can switch between modes at any time — this just sets your starting point.
      </p>
      <div className="onb-options">
        <button
          className={`onb-option onb-option--path${value === "foundation" ? " selected" : ""}`}
          onClick={() => onChange("foundation")}
        >
          <span className="onb-path-emoji"><Icon name="book-open" size={22} color="var(--primary)" /></span>
          <div style={{ flex: 1 }}>
            <div className="onb-option-label">Deep Learning</div>
            <div className="onb-option-sub">Full explanations, worked examples and quizzes. Best if you're building from scratch.</div>
          </div>
          {value === "foundation" && <Icon name="check-circle" size={16} color="var(--primary)" style={{ flexShrink: 0 }} />}
        </button>
        <button
          className={`onb-option onb-option--path${value === "accelerated" ? " selected" : ""}`}
          onClick={() => onChange("accelerated")}
        >
          <span className="onb-path-emoji"><Icon name="zap" size={22} color="var(--caution)" /></span>
          <div style={{ flex: 1 }}>
            <div className="onb-option-label">Revision Mode</div>
            <div className="onb-option-sub">Key points, formulas and exam traps. Best if you've seen the content before.</div>
          </div>
          {value === "accelerated" && <Icon name="check-circle" size={16} color="var(--primary)" style={{ flexShrink: 0 }} />}
        </button>
      </div>
    </div>
  );
}

/* ── Summary confirmation ─────────────────────────────────────────────────── */
function OnbSummary({ inputs, goalMinutes, onEdit }) {
  const { Icon } = window;
  const paper = PAPERS.find((p) => p.id === inputs.targetPaper);
  const confLabel = CONFIDENCE_OPTIONS.find((c) => c.id === inputs.confidenceLevel)?.label;

  const pathLabel = inputs.studyPath === "accelerated" ? "Revision Mode" : "Deep Learning";

  const rows = [
    { icon: "target",       label: "Target paper",    value: paper ? `${paper.label} — ${paper.sub}` : "—" },
    { icon: "calendar",     label: "Exam sitting",    value: inputs.targetSitting || "—" },
    { icon: "clock",        label: "Weekly study",    value: `${inputs.weeklyHours} hour${inputs.weeklyHours !== 1 ? "s" : ""}` },
    { icon: "bar-chart-2",  label: "Confidence",      value: confLabel || "—" },
    { icon: "map",          label: "Study approach",  value: pathLabel },
  ];

  return (
    <div className="onb-step">
      <div className="onb-step-icon onb-step-icon--blue">
        <Icon name="check-circle" size={24} />
      </div>
      <h2 className="onb-step-title">Your study plan is ready</h2>

      <div className="onb-goal-callout">
        <div className="onb-goal-num">{goalMinutes}</div>
        <div className="onb-goal-label">
          <span>minutes per day</span>
          <span className="onb-goal-hint">recommended daily goal</span>
        </div>
      </div>

      <div className="onb-summary-rows">
        {rows.map((r) => (
          <div key={r.label} className="onb-summary-row">
            <Icon name={r.icon} size={14} color="var(--fg-3)" />
            <span className="onb-summary-key">{r.label}</span>
            <span className="onb-summary-val">{r.value}</span>
          </div>
        ))}
      </div>
      <button className="onb-edit-link" onClick={onEdit}>
        <Icon name="pencil" size={12} />
        Edit answers
      </button>
    </div>
  );
}

/* ── Main Onboarding component ───────────────────────────────────────────── */
function AIQOnboarding({ onComplete }) {
  const { Button } = window;
  const TOTAL_STEPS = 5;

  const [step, setStep]     = useOnbState(0); // 0–4 = inputs; 5 = summary
  const [dir,  setDir]      = useOnbState("fwd");
  const [inputs, setInputs] = useOnbState({
    targetPaper:      null,
    targetSitting:    null,
    weeklyHours:      null,
    confidenceLevel:  null,
    studyPath:        null,
  });

  const patch = (key, val) => setInputs((prev) => ({ ...prev, [key]: val }));

  const canAdvance = [
    !!inputs.targetPaper,
    !!inputs.targetSitting,
    !!inputs.weeklyHours,
    !!inputs.confidenceLevel,
    !!inputs.studyPath,
  ][step] ?? true;

  const goalMinutes = inputs.weeklyHours && inputs.confidenceLevel
    ? window.deriveDailyGoal({ weeklyHours: inputs.weeklyHours, confidenceLevel: inputs.confidenceLevel })
    : null;

  const handleFinish = () => {
    window.aiqStore.set({
      onboardingComplete: true,
      targetPaper:        inputs.targetPaper,
      targetSitting:      inputs.targetSitting,
      targetExamDate:     null,
      weeklyHours:        inputs.weeklyHours,
      confidenceLevel:    inputs.confidenceLevel,
      dailyGoalMinutes:   goalMinutes,
      studyPath:          inputs.studyPath,
    });
    onComplete && onComplete(inputs.targetPaper, inputs.studyPath);
  };

  const goNext = () => { setDir("fwd");  setStep((s) => s + 1); };
  const goBack = () => { setDir("back"); setStep((s) => s - 1); };

  const stepContent = [
    <OnbStep1 key="s1" value={inputs.targetPaper}     onChange={(v) => patch("targetPaper", v)} />,
    <OnbStep2 key="s2" value={inputs.targetSitting}   onChange={(v) => patch("targetSitting", v)} />,
    <OnbStep3 key="s3" value={inputs.weeklyHours}     onChange={(v) => patch("weeklyHours", v)} />,
    <OnbStep4 key="s4" value={inputs.confidenceLevel} onChange={(v) => patch("confidenceLevel", v)} />,
    <OnbStep5 key="s5" value={inputs.studyPath}       onChange={(v) => patch("studyPath", v)} />,
  ];

  const isSummary = step === TOTAL_STEPS;

  return (
    <div className="onb-scrim">
      <div className="onb-modal">
        <div className="onb-header">
          <div className="onb-brand">AccountIQ</div>
          <OnbSteps current={isSummary ? TOTAL_STEPS : step} total={TOTAL_STEPS} />
        </div>

        <div className="onb-body">
          <div key={isSummary ? "summary" : step} className={`onb-step-anim onb-step-anim--${dir}`}>
            {isSummary
              ? <OnbSummary inputs={inputs} goalMinutes={goalMinutes} onEdit={() => { setDir("back"); setStep(0); }} />
              : stepContent[step]
            }
          </div>
        </div>

        <div className="onb-footer">
          {step > 0 && !isSummary && (
            <Button variant="secondary" onClick={goBack}>Back</Button>
          )}
          <div style={{ flex: 1 }} />
          {isSummary ? (
            <Button variant="primary" icon="play" onClick={handleFinish}>
              Start studying
            </Button>
          ) : (
            <Button
              variant="primary"
              iconRight="arrow-right"
              onClick={goNext}
              disabled={!canAdvance}
            >
              {step === TOTAL_STEPS - 1 ? "Review plan" : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AIQOnboarding });
