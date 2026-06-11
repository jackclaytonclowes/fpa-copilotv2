/* AccountIQ — Mock Exam Mode
 *
 * Full exam simulation: timed, randomised, with per-topic score breakdown.
 *
 * Entry:  navigateToAiq("mockexam", { paperId })
 * Phases: "setup" → "running" → "results"
 *
 * Questions are gathered from all lesson.practiceQuestions in the paper.
 * TODO: add dedicated examQuestions[] arrays per lesson for richer pools.
 */
const { useState: useMexState, useEffect: useMexEffect, useRef: useMexRef } = React;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function mexShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mexGatherQuestions(paperId) {
  const catalogue = window.AIQ_COURSE_DATA || {};
  const papers    = catalogue.papers || [];
  const tracks    = (catalogue.skillsLab || {}).tracks || [];
  const source    = papers.find((p) => p.id === paperId) || tracks.find((t) => t.id === paperId);
  if (!source) return [];
  const out = [];
  (source.lessons || []).forEach((lesson) => {
    (lesson.practiceQuestions || []).forEach((q) => {
      out.push({ ...q, lessonTitle: lesson.title, lessonId: lesson.id });
    });
  });
  return out;
}

function mexBuildBreakdown(questions, answers) {
  const map = {};
  questions.forEach((q, i) => {
    const topic = q.topic || "General";
    if (!map[topic]) map[topic] = { topic, correct: 0, total: 0 };
    map[topic].total++;
    if (answers[i] !== undefined && answers[i] === q.correct) map[topic].correct++;
  });
  return Object.values(map)
    .map((t) => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);
}

function mexFmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function mexFmtDuration(secs) {
  if (!secs || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function mexGetSource(paperId) {
  const catalogue = window.AIQ_COURSE_DATA || {};
  const papers    = catalogue.papers || [];
  const tracks    = (catalogue.skillsLab || {}).tracks || [];
  return papers.find((p) => p.id === paperId) || tracks.find((t) => t.id === paperId);
}

/* ── Setup Screen ────────────────────────────────────────────────────────── */
function MexSetup({ paperId, allQuestions, onStart, onBack }) {
  const { Icon, Button } = window;
  const source = mexGetSource(paperId);
  const total  = allQuestions.length;

  // Deduplicated question count options
  const rawCounts  = [5, 10, total];
  const countOpts  = [...new Set(rawCounts.map((n) => Math.min(n, total)))]
    .filter((n) => n > 0)
    .map((n) => ({ value: n, label: n === total ? `All (${total})` : String(n) }));

  const timeOpts = [
    { value: 0,    label: "Untimed" },
    { value: 300,  label: "5 min"   },
    { value: 900,  label: "15 min"  },
    { value: 1800, label: "30 min"  },
  ];

  const [qCount,   setQCount]   = useMexState(Math.min(total, 10));
  const [timeSecs, setTimeSecs] = useMexState(0);

  // Past attempts for this paper
  const store   = window.aiqStore ? window.aiqStore.get() : {};
  const history = (store.mockExamHistory || [])
    .filter((e) => e.paperId === paperId)
    .slice(-3)
    .reverse();

  return (
    <div className="mex-setup">
      <div>
        <button className="lsn-back" onClick={onBack}>
          <Icon name="arrow-left" size={14} />
          Back to courses
        </button>
      </div>

      <div className="card mex-setup-card">
        {/* Header */}
        <div className="mex-setup-header">
          <div className="mex-setup-icon">
            <Icon name="clipboard-list" size={26} color="var(--primary)" />
          </div>
          <div>
            <div className="mex-setup-eyebrow">Mock Exam</div>
            <h2 className="mex-setup-title">
              {source ? (source.title || paperId) : paperId}
            </h2>
            {source && (source.fullTitle || source.description) && (
              <p className="mex-setup-sub">{source.fullTitle || source.description}</p>
            )}
          </div>
        </div>

        {/* Question pool info */}
        <div className="mex-setup-pool">
          <Icon name="help-circle" size={14} color="var(--fg-3)" />
          <span>
            {total === 0
              ? "No questions available yet — complete lesson content first"
              : `${total} question${total !== 1 ? "s" : ""} available across your lessons`}
          </span>
        </div>

        {total > 0 && (
          <>
            {/* Question count */}
            <div className="mex-setup-group">
              <div className="mex-setup-group-label">
                <Icon name="layers" size={12} color="var(--fg-3)" />
                Questions
              </div>
              <div className="mex-setup-options">
                {countOpts.map((o) => (
                  <button
                    key={o.value}
                    className={`mex-setup-opt${qCount === o.value ? " selected" : ""}`}
                    onClick={() => setQCount(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time limit */}
            <div className="mex-setup-group">
              <div className="mex-setup-group-label">
                <Icon name="clock" size={12} color="var(--fg-3)" />
                Time limit
              </div>
              <div className="mex-setup-options">
                {timeOpts.map((o) => (
                  <button
                    key={o.value}
                    className={`mex-setup-opt${timeSecs === o.value ? " selected" : ""}`}
                    onClick={() => setTimeSecs(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam conditions note */}
            <div className="mex-setup-note">
              <Icon name="info" size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              Questions are randomised. No feedback until the end — just like the real CIMA OT exam.
            </div>
          </>
        )}

        {/* Past attempts */}
        {history.length > 0 && (
          <div className="mex-setup-history">
            <div className="mex-setup-group-label" style={{ padding: "18px 24px 10px" }}>
              <Icon name="history" size={12} color="var(--fg-3)" />
              Past attempts
            </div>
            <div style={{ padding: "0 24px" }}>
              {history.map((h) => (
                <div key={h.id} className="mex-history-row">
                  <div className="mex-history-date">{h.date}</div>
                  <div className="mex-history-detail">{h.total} questions</div>
                  <div
                    className="mex-history-score"
                    style={{ color: h.passed ? "var(--favourable)" : "var(--adverse)" }}
                  >
                    {h.score}/{h.total} &middot; {h.pct}%
                  </div>
                  <span
                    style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-pill)",
                      background: h.passed ? "var(--favourable-soft)" : "var(--adverse-soft)",
                      color: h.passed ? "var(--favourable-text)" : "var(--adverse-text)",
                      border: `1px solid ${h.passed ? "var(--favourable-border)" : "var(--adverse-border)"}`,
                      fontWeight: 600, whiteSpace: "nowrap",
                    }}
                  >
                    {h.passed ? "Pass" : "Fail"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mex-setup-footer">
          {total > 0 ? (
            <Button
              variant="primary"
              icon="play"
              style={{ minHeight: 48, paddingLeft: 32, paddingRight: 32 }}
              onClick={() => onStart({ questionCount: qCount, timeLimitSeconds: timeSecs })}
            >
              Start Exam
            </Button>
          ) : (
            <Button variant="secondary" icon="arrow-left" onClick={onBack}>
              Back to courses
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Running Screen ──────────────────────────────────────────────────────── */
function MexRunning({ questions, timeLimitSeconds, onFinish, onExit }) {
  const { Icon, Button } = window;

  const [currentIdx, setCurrentIdx] = useMexState(0);
  const [answers, setAnswers]       = useMexState([]);
  const [selected, setSelected]     = useMexState(null);
  const [secondsLeft, setSecondsLeft] = useMexState(timeLimitSeconds);
  const answersRef  = useMexRef([]);
  const startedAt   = useMexRef(Date.now());
  const timerRef    = useMexRef(null);
  const finishedRef = useMexRef(false);

  // Keep answersRef current without triggering re-renders
  useMexEffect(() => { answersRef.current = answers; }, [answers]);

  // Countdown timer
  useMexEffect(() => {
    if (timeLimitSeconds === 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-submit when timer expires
  useMexEffect(() => {
    if (timeLimitSeconds > 0 && secondsLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
      onFinish(answersRef.current, elapsed);
    }
  }, [secondsLeft]);

  const q      = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (isLast) {
      clearInterval(timerRef.current);
      finishedRef.current = true;
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
      onFinish(newAnswers, elapsed);
    } else {
      setAnswers(newAnswers);
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const timed   = timeLimitSeconds > 0;
  const warning = timed && secondsLeft <= 300;
  const danger  = timed && secondsLeft <= 60;
  const progress = currentIdx / questions.length;

  return (
    <div className="mex-run-page">

      {/* Exam topbar */}
      <div className="mex-run-topbar">
        <button className="lsn-back" onClick={onExit} style={{ flexShrink: 0 }}>
          <Icon name="x" size={14} />
          Exit
        </button>
        <div className="qe-progress-track" style={{ flex: 1 }}>
          <div className="qe-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="qe-counter" style={{ flexShrink: 0 }}>
          {currentIdx + 1} / {questions.length}
        </span>
        {timed && (
          <div className={`mex-timer${warning ? " mex-timer--warning" : ""}${danger ? " mex-timer--danger" : ""}`}>
            <Icon name="clock" size={12} />
            {mexFmtTime(secondsLeft)}
          </div>
        )}
      </div>

      {/* Question card — reuses qe-* styles for consistency */}
      <div className="qe-question-card card">
        <div className="qe-question-body">
          {q.topic && <div className="qe-question-topic">{q.topic}</div>}
          <p className="qe-question-text">{q.question}</p>
        </div>

        <div className="qe-options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`qe-option${selected === i ? " selected" : ""}`}
              onClick={() => setSelected(i)}
            >
              <span className="qe-option-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>

        <div className="qe-footer">
          <Button
            variant="primary"
            iconRight={isLast ? "check" : "arrow-right"}
            onClick={handleNext}
            style={{
              opacity: selected === null ? 0.4 : 1,
              pointerEvents: selected === null ? "none" : "auto",
              transition: "opacity 0.15s",
            }}
          >
            {isLast ? "Submit exam" : "Next question"}
          </Button>
        </div>
      </div>

    </div>
  );
}

/* ── Results Screen ──────────────────────────────────────────────────────── */
function MexResults({ paperId, result, onRetake, onBack, onNavigate }) {
  const { Icon, Button } = window;
  const { questions, answers, durationSeconds } = result;

  const correct   = answers.filter((a, i) => a !== undefined && a === questions[i].correct).length;
  const total     = questions.length;
  const answered  = answers.filter((a) => a !== undefined).length;
  const pct       = Math.round((correct / total) * 100);
  const passed    = pct >= 70;
  const breakdown = mexBuildBreakdown(questions, answers);
  const source    = mexGetSource(paperId);
  const durationLabel = mexFmtDuration(durationSeconds);

  // SVG ring: circumference of r=32 circle = 201.06
  const dashOffset = (201.06 * (1 - pct / 100)).toFixed(2);

  const weakTopics = breakdown.filter((t) => t.pct < 70);

  return (
    <div className="mex-results-page">

      {/* ── Score hero ──────────────────────────────────────────────────── */}
      <div className="card mex-results-hero">
        <div className="mex-results-hero-body">

          {/* Score ring */}
          <div className="mex-score-ring">
            <svg viewBox="0 0 80 80" className="mex-score-svg">
              <circle cx="40" cy="40" r="32" className="mex-score-track" />
              <circle
                cx="40" cy="40" r="32"
                className="mex-score-arc"
                style={{
                  stroke: passed ? "var(--favourable)" : "var(--adverse)",
                  strokeDashoffset: dashOffset,
                }}
              />
            </svg>
            <div className="mex-score-inner">
              <span className="mex-score-num" style={{ color: passed ? "var(--favourable)" : "var(--adverse)" }}>
                {pct}%
              </span>
            </div>
          </div>

          <div className="mex-results-hero-text">
            <div className="mex-results-eyebrow">Mock Exam Complete</div>
            <h2 className="mex-results-title">
              {source ? (source.fullTitle || source.title || paperId) : paperId}
            </h2>
            <div className="mex-results-meta">
              <span
                className="mex-results-verdict-badge"
                style={{
                  background: passed ? "var(--favourable-soft)" : "var(--adverse-soft)",
                  color:      passed ? "var(--favourable-text)" : "var(--adverse-text)",
                  borderColor: passed ? "var(--favourable-border)" : "var(--adverse-border)",
                }}
              >
                <Icon name={passed ? "check-circle" : "x-circle"} size={12} />
                {passed ? "Pass" : "Fail"} — {passed ? "70% achieved" : "70% required to pass"}
              </span>
              <span className="mex-results-tally">
                {correct} / {total} correct
              </span>
              {answered < total && (
                <span className="mex-results-tally" style={{ color: "var(--fg-3)" }}>
                  {total - answered} unanswered
                </span>
              )}
              {durationLabel && (
                <span className="mex-results-tally">
                  <Icon name="clock" size={12} color="var(--fg-3)" />
                  {durationLabel}
                </span>
              )}
            </div>
            <p className="mex-results-summary">
              {passed
                ? pct >= 90
                  ? "Excellent result — you have a strong command of this topic."
                  : "Good pass. Review the weak topics below to sharpen your score."
                : weakTopics.length > 0
                  ? `Focus on ${weakTopics.slice(0, 2).map((t) => t.topic).join(" and ")} to push past the pass mark.`
                  : "Keep revising and try again — you're close."}
            </p>
          </div>
        </div>

        <div className="mex-results-hero-actions">
          <Button variant="secondary" icon="rotate-ccw" onClick={onRetake}>Retake</Button>
          <Button variant="secondary" icon="book-open"
            onClick={() => onNavigate && onNavigate("lessons", { paperId })}>
            Review lessons
          </Button>
          <Button variant="primary" icon="arrow-left" onClick={onBack}>Courses</Button>
        </div>
      </div>

      {/* ── Topic breakdown ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="mex-card-header">
          <Icon name="bar-chart-2" size={16} color="var(--fg-3)" />
          <h3 className="mex-card-title">Topic Breakdown</h3>
        </div>
        <div className="mex-card-body">
          {breakdown.length === 0 ? (
            <div className="prf-empty">No topic data available.</div>
          ) : (
            <div className="mex-topic-list">
              {breakdown.map((t) => {
                const ok = t.pct >= 70;
                return (
                  <div key={t.topic} className={`mex-topic-row${ok ? "" : " mex-topic-row--weak"}`}>
                    <div className="mex-topic-name">
                      <Icon
                        name={ok ? "check-circle" : "alert-circle"}
                        size={13}
                        color={ok ? "var(--favourable)" : "var(--adverse)"}
                      />
                      <span>{t.topic}</span>
                    </div>
                    <div className="mex-topic-bar-wrap">
                      <div className="mex-topic-bar-track">
                        <div
                          className="mex-topic-bar-fill"
                          style={{
                            width: t.pct + "%",
                            background: ok ? "var(--favourable)" : "var(--adverse)",
                          }}
                        />
                      </div>
                    </div>
                    <span className="mex-topic-fraction" style={{ color: ok ? "var(--favourable)" : "var(--adverse)" }}>
                      {t.correct}/{t.total}
                    </span>
                    <span className="mex-topic-pct" style={{ color: ok ? "var(--favourable)" : "var(--adverse)" }}>
                      {t.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Per-question review ─────────────────────────────────────────── */}
      <div className="card">
        <div className="mex-card-header">
          <Icon name="list-checks" size={16} color="var(--fg-3)" />
          <h3 className="mex-card-title">Question Review</h3>
        </div>
        <div className="mex-card-body">
          <div className="qz-review-list">
            {questions.map((q, i) => {
              const userAns  = answers[i];
              const isRight  = userAns !== undefined && userAns === q.correct;
              const skipped  = userAns === undefined;
              return (
                <div key={i} className={`qz-review-item${isRight ? " correct" : " wrong"}`}>
                  <div className="qz-review-header">
                    <span className="qz-review-num">Q{i + 1}</span>
                    {q.topic && (
                      <span className="crs-course-badge crs-course-badge--muted">{q.topic}</span>
                    )}
                    <span
                      style={{
                        marginLeft: "auto", fontSize: 11, padding: "2px 8px",
                        borderRadius: "var(--radius-pill)", fontWeight: 600,
                        background: skipped
                          ? "var(--surface-2)"
                          : isRight ? "var(--favourable-soft)" : "var(--adverse-soft)",
                        color: skipped
                          ? "var(--fg-3)"
                          : isRight ? "var(--favourable-text)" : "var(--adverse-text)",
                        border: `1px solid ${skipped ? "var(--border)" : isRight ? "var(--favourable-border)" : "var(--adverse-border)"}`,
                      }}
                    >
                      {skipped ? "Skipped" : isRight ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <p className="qz-review-q">{q.question}</p>
                  <div className="qz-review-options">
                    {q.options.map((opt, j) => {
                      let cls = "qz-review-opt";
                      if (j === q.correct)                   cls += " correct";
                      else if (j === userAns && !isRight)    cls += " chosen-wrong";
                      return (
                        <div key={j} className={cls}>
                          <span style={{ minWidth: 20, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {String.fromCharCode(65 + j)}
                          </span>
                          {opt}
                          {j === q.correct && (
                            <Icon name="check-circle" size={14} color="var(--favourable)" style={{ marginLeft: "auto", flexShrink: 0 }} />
                          )}
                          {j === userAns && !isRight && (
                            <Icon name="x-circle" size={14} color="var(--adverse)" style={{ marginLeft: "auto", flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="qz-review-explain">
                      <Icon name="info" size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Root component ──────────────────────────────────────────────────────── */
function AIQMockExam({ paperId, onNavigate }) {
  const [phase, setPhase]             = useMexState("setup");
  const [examConfig, setExamConfig]   = useMexState(null);
  const [examQuestions, setExamQuestions] = useMexState([]);
  const [examResult, setExamResult]   = useMexState(null);

  const allQuestions = mexGatherQuestions(paperId);

  const handleStart = (config) => {
    const shuffled = mexShuffle(allQuestions).slice(0, config.questionCount);
    setExamConfig(config);
    setExamQuestions(shuffled);
    setPhase("running");
  };

  const handleFinish = (answers, durationSeconds) => {
    const questions = examQuestions;
    const result    = { questions, answers, durationSeconds };
    setExamResult(result);

    // Persist result and award XP
    const breakdown = mexBuildBreakdown(questions, answers);
    const correct   = answers.filter((a, i) => a !== undefined && a === questions[i].correct).length;
    const total     = questions.length;
    const pct       = Math.round((correct / total) * 100);
    if (window.aiqStore) {
      window.aiqStore.recordMockExam({
        id:             Date.now().toString(),
        paperId,
        score:          correct,
        total,
        pct,
        topicBreakdown: breakdown,
        durationSeconds,
        passed:         pct >= 70,
      });
      // Award XP (10 per correct answer) and record study time
      const mins = Math.max(1, Math.round((durationSeconds || 60) / 60));
      window.aiqStore.recordActivity({ minutes: mins, xpDelta: correct * 10 });
    }

    setPhase("results");
  };

  if (phase === "setup") {
    return (
      <div className="content">
        <MexSetup
          paperId={paperId}
          allQuestions={allQuestions}
          onStart={handleStart}
          onBack={() => onNavigate && onNavigate("courses")}
        />
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="content">
        <MexRunning
          key={examQuestions.map((q) => q.question).join(",")}
          questions={examQuestions}
          timeLimitSeconds={examConfig.timeLimitSeconds}
          onFinish={handleFinish}
          onExit={() => setPhase("setup")}
        />
      </div>
    );
  }

  return (
    <div className="content">
      <MexResults
        paperId={paperId}
        result={examResult}
        onRetake={() => { setExamResult(null); setPhase("setup"); }}
        onBack={() => onNavigate && onNavigate("courses")}
        onNavigate={onNavigate}
      />
    </div>
  );
}

Object.assign(window, { AIQMockExam });
