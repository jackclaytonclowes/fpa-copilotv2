/* AccountIQ — Lesson viewer
 *
 * Renders a single lesson using the structured format:
 *   objectives → explanation → worked example → summary → practice questions
 *
 * Receives { paperId, lessonId } via props (passed from App aiqContext).
 * All lesson content lives in the LESSONS catalogue in AIQCourseData.js.
 */
const { useState: useLsnState, useEffect: useLsnEffect, useRef: useLsnRef } = React;

/* ── Section renderer ────────────────────────────────────────────────────── */
function LsnSection({ icon, title, children, tone }) {
  const { Icon } = window;
  const toneMap = {
    primary:  { bg: "var(--primary-soft)",    border: "var(--primary-soft-2)", ic: "var(--primary)" },
    green:    { bg: "var(--favourable-soft)",  border: "var(--favourable-border)", ic: "var(--favourable)" },
    amber:    { bg: "var(--caution-soft)",     border: "var(--caution-border)", ic: "var(--caution)" },
    neutral:  { bg: "var(--surface-2)",        border: "var(--border)", ic: "var(--fg-3)" },
  };
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <div className="lsn-section" style={{ background: t.bg, borderColor: t.border }}>
      <div className="lsn-section-header">
        <div className="lsn-section-icon" style={{ color: t.ic }}>
          <Icon name={icon} size={16} />
        </div>
        <h3 className="lsn-section-title">{title}</h3>
      </div>
      <div className="lsn-section-body">{children}</div>
    </div>
  );
}

/* ── Practice question ───────────────────────────────────────────────────── */
function LsnPracticeQ({ q, index, onAnswer }) {
  const { Icon } = window;
  const [chosen, setChosen] = useLsnState(null);

  const handlePick = (i) => {
    if (chosen !== null) return;
    setChosen(i);
    onAnswer && onAnswer(i === q.correct);
  };

  return (
    <div className="lsn-pq">
      <div className="lsn-pq-num">Q{index + 1}</div>
      <div className="lsn-pq-body">
        <p className="lsn-pq-text">{q.question}</p>
        <div className="lsn-pq-options">
          {q.options.map((opt, i) => {
            const isChosen  = chosen === i;
            const isCorrect = q.correct === i;
            let cls = "lsn-pq-opt";
            if (chosen !== null) {
              if (isCorrect)       cls += " correct";
              else if (isChosen)   cls += " wrong";
            }
            return (
              <button key={i} className={cls} onClick={() => handlePick(i)} disabled={chosen !== null}>
                <span className="lsn-pq-opt-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
                {chosen !== null && isCorrect && (
                  <Icon name="check-circle" size={14} color="var(--favourable)" style={{ marginLeft: "auto" }} />
                )}
                {chosen !== null && isChosen && !isCorrect && (
                  <Icon name="x-circle" size={14} color="var(--adverse)" style={{ marginLeft: "auto" }} />
                )}
              </button>
            );
          })}
        </div>
        {chosen !== null && (
          <div className={`lsn-pq-explain${chosen === q.correct ? " correct" : " wrong"}`}>
            <Icon
              name={chosen === q.correct ? "check-circle" : "alert-circle"}
              size={14}
              color={chosen === q.correct ? "var(--favourable)" : "var(--adverse)"}
            />
            {q.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section definitions ─────────────────────────────────────────────────── */
const LSN_SECTIONS = [
  { id: "intro",       label: "Intro",       icon: "target" },
  { id: "explanation", label: "Explanation",  icon: "book-open" },
  { id: "example",     label: "Example",     icon: "pencil-ruler" },
  { id: "summary",     label: "Summary",     icon: "list-checks" },
  { id: "quiz",        label: "Quiz",        icon: "help-circle" },
];

/* ── Main Lesson component ───────────────────────────────────────────────── */
function AIQLessons({ paperId, lessonId, onNavigate }) {
  const { Icon, Button } = window;
  const catalogue = window.AIQ_COURSE_DATA || {};
  const papers    = catalogue.papers || [];
  const tracks    = (catalogue.skillsLab || {}).tracks || [];

  const isTrack = tracks.some((t) => t.id === paperId);
  const paper   = papers.find((p) => p.id === paperId)
               || tracks.find((t) => t.id === paperId)
               || papers[0];
  const lessons = (paper && paper.lessons) ? paper.lessons : [];
  const lesson  = lessonId
    ? lessons.find((l) => l.id === lessonId) || lessons[0]
    : lessons[0];

  const [sectionIdx, setSectionIdx] = useLsnState(0);
  const [score, setScore]           = useLsnState({ correct: 0, total: 0 });
  const [revealedSteps, setRevealedSteps] = useLsnState(1);

  const store        = window.aiqStore ? window.aiqStore.get() : {};
  const completedSet = (store.completedLessons || {})[paperId] || [];
  const isComplete   = lesson ? completedSet.includes(lesson.id) : false;

  if (!paper || !lesson) {
    return (
      <div className="content">
        <div className="lsn-page">
          <div className="loading">
            <Icon name="book-open" size={20} color="var(--fg-3)" />
            No lesson found.
          </div>
        </div>
      </div>
    );
  }

  // Only surface sections that have content
  const availSections = LSN_SECTIONS.filter((s) => {
    if (s.id === "intro")       return lesson.objectives || (lesson.keyTerms && lesson.keyTerms.length > 0);
    if (s.id === "explanation") return !!lesson.explanation;
    if (s.id === "example")     return !!lesson.workedExample;
    if (s.id === "summary")     return !!lesson.summary;
    if (s.id === "quiz")        return !!(lesson.practiceQuestions && lesson.practiceQuestions.length > 0);
    return false;
  });

  // Clamp index if lesson changed
  const safeSectionIdx = Math.min(sectionIdx, availSections.length - 1);
  const curSectionId   = availSections[safeSectionIdx]?.id;
  const isFirstSection = safeSectionIdx === 0;
  const isLastSection  = safeSectionIdx === availSections.length - 1;

  // Track time spent on this lesson; record on unmount
  const openedAt = useLsnRef(Date.now());
  useLsnEffect(() => {
    openedAt.current = Date.now();
    setSectionIdx(0);
    return () => {
      const minutes = Math.round((Date.now() - openedAt.current) / 60000);
      if (minutes > 0 && window.aiqStore) window.aiqStore.recordActivity({ minutes });
    };
  }, [lesson.id]);

  const handleAnswer = (correct) => {
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson  = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson  = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const goNext = () => {
    if (!isLastSection) {
      setSectionIdx(safeSectionIdx + 1);
    } else if (nextLesson) {
      onNavigate && onNavigate("lessons", { paperId, lessonId: nextLesson.id });
    } else {
      onNavigate && onNavigate(isTrack ? "skillslab" : "courses");
    }
  };

  return (
    <div className="content">
      <div className="lsn-page">

        {/* Breadcrumb */}
        <div className="lsn-breadcrumb">
          <button className="lsn-back" onClick={() => onNavigate && onNavigate(isTrack ? "skillslab" : "courses")}>
            <Icon name="arrow-left" size={14} />
            {paper.title}
          </button>
          <span className="lsn-breadcrumb-sep">/</span>
          <span className="lsn-breadcrumb-current">{lesson.title}</span>
        </div>

        {/* Lesson header */}
        <div className="lsn-header card">
          <div className="lsn-header-body">
            <div className="lsn-header-meta">
              <span className="crs-course-badge">{paper.title}</span>
              <span className="lsn-header-topic">{lesson.topic}</span>
            </div>
            <div className="lsn-header-title-row">
              <h1 className="lsn-header-title">{lesson.title}</h1>
              {isComplete && (
                <span className="chip fav" style={{ fontSize: 11, flexShrink: 0 }}>
                  <Icon name="check-circle" size={11} />
                  Complete
                </span>
              )}
            </div>
            {lesson.estimatedMinutes && (
              <div className="lsn-header-time">
                <Icon name="clock" size={13} color="var(--fg-3)" />
                ~{lesson.estimatedMinutes} min
              </div>
            )}
          </div>

          {/* Section tab strip */}
          <div className="lsn-section-tabs">
            {availSections.map((s, i) => (
              <button
                key={s.id}
                className={`lsn-section-tab${i === safeSectionIdx ? " active" : ""}${i < safeSectionIdx ? " done" : ""}`}
                onClick={() => setSectionIdx(i)}
              >
                <Icon
                  name={i < safeSectionIdx ? "check" : s.icon}
                  size={11}
                  color={i === safeSectionIdx ? "var(--primary)" : i < safeSectionIdx ? "var(--favourable)" : "var(--fg-3)"}
                />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section panels — all stay mounted so state (quiz answers, step reveal) persists */}
        <div className="lsn-section-panels">

          {/* Intro: objectives + key terms */}
          <div className={`lsn-section-panel${curSectionId === "intro" ? " active" : ""}`}>
            {lesson.objectives && (
              <LsnSection icon="target" title="Learning Objectives" tone="primary">
                <ul className="lsn-list">
                  {lesson.objectives.map((o, i) => (
                    <li key={i}><Icon name="check" size={12} color="var(--primary)" />{o}</li>
                  ))}
                </ul>
              </LsnSection>
            )}
            {lesson.keyTerms && lesson.keyTerms.length > 0 && (
              <LsnSection icon="bookmark" title="Key Terms" tone="primary">
                <div className="lsn-key-terms">
                  {lesson.keyTerms.map((kt, i) => (
                    <div key={i} className="lsn-key-term-card">
                      <div className="lsn-key-term-name">{kt.term}</div>
                      <div className="lsn-key-term-def">{kt.definition}</div>
                    </div>
                  ))}
                </div>
              </LsnSection>
            )}
          </div>

          {/* Explanation */}
          <div className={`lsn-section-panel${curSectionId === "explanation" ? " active" : ""}`}>
            {lesson.explanation && (
              <LsnSection icon="book-open" title="Explanation" tone="neutral">
                <div className="lsn-prose" dangerouslySetInnerHTML={{ __html: lesson.explanation }} />
              </LsnSection>
            )}
          </div>

          {/* Worked example */}
          <div className={`lsn-section-panel${curSectionId === "example" ? " active" : ""}`}>
            {lesson.workedExample && (
              <LsnSection icon="pencil-ruler" title="Worked Example" tone="amber">
                <div className="lsn-example">
                  {lesson.workedExample.setup && (
                    <div className="lsn-example-setup">{lesson.workedExample.setup}</div>
                  )}
                  {lesson.workedExample.steps ? (
                    <>
                      <ol className="lsn-example-steps">
                        {lesson.workedExample.steps.slice(0, revealedSteps).map((s, i) => (
                          <li key={i} className="lsn-example-step-item">{s}</li>
                        ))}
                      </ol>
                      {revealedSteps < lesson.workedExample.steps.length ? (
                        <button className="lsn-step-reveal-btn" onClick={() => setRevealedSteps((r) => r + 1)}>
                          <Icon name="chevron-down" size={14} />
                          Step {revealedSteps + 1} of {lesson.workedExample.steps.length}
                        </button>
                      ) : lesson.workedExample.answer && (
                        <div className="lsn-example-answer">
                          <Icon name="check-circle" size={14} color="var(--favourable)" />
                          <strong>Answer:</strong> {lesson.workedExample.answer}
                        </div>
                      )}
                    </>
                  ) : lesson.workedExample.answer && (
                    <div className="lsn-example-answer">
                      <Icon name="check-circle" size={14} color="var(--favourable)" />
                      <strong>Answer:</strong> {lesson.workedExample.answer}
                    </div>
                  )}
                </div>
              </LsnSection>
            )}
          </div>

          {/* Summary */}
          <div className={`lsn-section-panel${curSectionId === "summary" ? " active" : ""}`}>
            {lesson.summary && (
              <LsnSection icon="list-checks" title="Summary" tone="green">
                <ul className="lsn-list lsn-list--summary">
                  {lesson.summary.map((s, i) => (
                    <li key={i}><Icon name="arrow-right" size={12} color="var(--favourable)" />{s}</li>
                  ))}
                </ul>
              </LsnSection>
            )}
          </div>

          {/* Quiz / practice questions */}
          <div className={`lsn-section-panel${curSectionId === "quiz" ? " active" : ""}`}>
            {lesson.practiceQuestions && lesson.practiceQuestions.length > 0 && (
              <LsnSection icon="help-circle" title="Practice Questions" tone="primary">
                <div className="lsn-pq-list">
                  {lesson.practiceQuestions.map((q, i) => (
                    <LsnPracticeQ key={i} q={q} index={i} onAnswer={handleAnswer} />
                  ))}
                </div>
                {score.total > 0 && (
                  <div className="lsn-score">
                    <Icon name="zap" size={14} color="var(--primary)" />
                    {score.correct} / {score.total} correct
                    {score.total === lesson.practiceQuestions.length && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon="arrow-right"
                        style={{ marginLeft: "auto" }}
                        onClick={() => onNavigate && onNavigate("quizengine", { paperId, lessonId: lesson.id })}
                      >
                        Take full quiz
                      </Button>
                    )}
                  </div>
                )}
              </LsnSection>
            )}
          </div>

        </div>

        {/* Section navigation */}
        <div className="lsn-nav-row">
          {!isFirstSection ? (
            <Button variant="secondary" icon="arrow-left" onClick={() => setSectionIdx(safeSectionIdx - 1)}>
              Previous
            </Button>
          ) : prevLesson ? (
            <Button variant="secondary" icon="arrow-left"
              onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: prevLesson.id })}>
              {prevLesson.title}
            </Button>
          ) : <div />}

          <Button
            variant="primary"
            iconRight="arrow-right"
            onClick={goNext}
          >
            {isLastSection
              ? (nextLesson ? nextLesson.title : "Back to course")
              : (availSections[safeSectionIdx + 1]?.label || "Next")}
          </Button>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { AIQLessons });
