/* AccountIQ — Lesson viewer
 *
 * Renders a single lesson. Supports two modes:
 *   mode="deep"     — full lesson (objectives → explanation → worked example → summary → quiz)
 *   mode="revision" — compact revision lesson from AIQ_REVISION_DATA (key points, formulas, exam traps)
 *
 * Deep learning content lives in AIQCourseData.js (never modified here).
 * Revision content lives in AIQRevisionData.js.
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

/* ══════════════════════════════════════════════════════════════════════════
   REVISION MODE renderer — reads from AIQ_REVISION_DATA, never from AIQCourseData
   ══════════════════════════════════════════════════════════════════════════ */

/* Quick check question (revision mode) */
function RevQuickCheck({ q, index }) {
  const { Icon } = window;
  const [chosen, setChosen] = useLsnState(null);
  const pick = (i) => { if (chosen !== null) return; setChosen(i); };
  return (
    <div className="lsn-pq">
      <div className="lsn-pq-num">Q{index + 1}</div>
      <div className="lsn-pq-body">
        <p className="lsn-pq-text">{q.question}</p>
        <div className="lsn-pq-options">
          {q.options.map((opt, i) => {
            let cls = "lsn-pq-opt";
            if (chosen !== null) {
              if (i === q.correct) cls += " correct";
              else if (i === chosen) cls += " wrong";
            }
            return (
              <button key={i} className={cls} onClick={() => pick(i)} disabled={chosen !== null}>
                <span className="lsn-pq-opt-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
                {chosen !== null && i === q.correct && <Icon name="check-circle" size={14} color="var(--favourable)" style={{ marginLeft: "auto" }} />}
                {chosen !== null && i === chosen && i !== q.correct && <Icon name="x-circle" size={14} color="var(--adverse)" style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
        {chosen !== null && (
          <div className={`lsn-pq-explain${chosen === q.correct ? " correct" : " wrong"}`}>
            <Icon name={chosen === q.correct ? "check-circle" : "alert-circle"} size={14}
              color={chosen === q.correct ? "var(--favourable)" : "var(--adverse)"} />
            {q.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

/* Main revision lesson renderer */
function RevisionLesson({ paperId, lesson, paper, onNavigate, lessons }) {
  const { Icon, Button } = window;
  const revData = (window.AIQ_REVISION_DATA || {})[lesson.id];

  const store    = window.aiqStore ? window.aiqStore.get() : {};
  const revDone  = ((store.revisionLessons || {})[paperId] || []).includes(lesson.id);

  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson  = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson  = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const totalLessons = lessons.length;

  const [marked, setMarked] = useLsnState(revDone);

  const handleComplete = () => {
    if (window.aiqStore) window.aiqStore.markRevisionComplete(paperId, lesson.id, totalLessons);
    setMarked(true);
  };

  const openedAt = useLsnRef(Date.now());
  useLsnEffect(() => {
    openedAt.current = Date.now();
    return () => {
      const minutes = Math.round((Date.now() - openedAt.current) / 60000);
      if (minutes > 0 && window.aiqStore) window.aiqStore.recordActivity({ minutes });
    };
  }, [lesson.id]);

  /* No revision data for this lesson */
  if (!revData) {
    return (
      <div className="content">
        <div className="lsn-page">
          <div className="lsn-breadcrumb">
            <button className="lsn-back" onClick={() => onNavigate && onNavigate("coursedetail", { paperId, mode: "revision" })}>
              <Icon name="arrow-left" size={14} />
              {paper.title}
            </button>
            <span className="lsn-breadcrumb-sep">/</span>
            <span className="lsn-breadcrumb-current">{lesson.title}</span>
          </div>
          <div className="rev-coming-soon card">
            <Icon name="zap" size={28} color="var(--caution)" />
            <h3>Revision lesson coming soon</h3>
            <p>Full revision content for <strong>{lesson.title}</strong> is being prepared.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <Button variant="secondary" icon="arrow-left" onClick={() => onNavigate && onNavigate("coursedetail", { paperId, mode: "revision" })}>
                Back to course
              </Button>
              <Button variant="primary" icon="book-open" onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: lesson.id, mode: "deep" })}>
                Switch to Deep Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="lsn-page">

        {/* Breadcrumb */}
        <div className="lsn-breadcrumb">
          <button className="lsn-back" onClick={() => onNavigate && onNavigate("coursedetail", { paperId, mode: "revision" })}>
            <Icon name="arrow-left" size={14} />
            {paper.title}
          </button>
          <span className="lsn-breadcrumb-sep">/</span>
          <span className="lsn-breadcrumb-current">{lesson.title}</span>
        </div>

        {/* Header */}
        <div className="rev-header card">
          <div className="rev-header-top">
            <span className="crs-course-badge">{paper.title}</span>
            <span className="rev-mode-badge">⚡ Revision Mode</span>
            {marked && <span className="chip fav"><Icon name="check-circle" size={11} />Complete</span>}
          </div>
          <h1 className="lsn-header-title" style={{ marginTop: 10 }}>{lesson.title}</h1>
          <div className="lsn-header-time">
            <Icon name="clock" size={13} color="var(--fg-3)" />
            ~{revData.estimatedMinutes} min
            <span style={{ margin: "0 8px", color: "var(--border)" }}>·</span>
            <button
              className="rev-switch-link"
              onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: lesson.id, mode: "deep" })}
            >
              <Icon name="book-open" size={12} />
              Switch to Deep Learning
            </button>
          </div>
        </div>

        {/* Key Points */}
        {revData.keyPoints && revData.keyPoints.length > 0 && (
          <div className="lsn-section" style={{ background: "var(--primary-soft)", borderColor: "var(--primary-soft-2)" }}>
            <div className="lsn-section-header">
              <div className="lsn-section-icon" style={{ color: "var(--primary)" }}><Icon name="list-checks" size={16} /></div>
              <h3 className="lsn-section-title">Key Points</h3>
            </div>
            <div className="lsn-section-body">
              <ul className="lsn-list">
                {revData.keyPoints.map((pt, i) => (
                  <li key={i}><Icon name="check" size={12} color="var(--primary)" />{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Formula Sheet */}
        {revData.formulaSheet && revData.formulaSheet.length > 0 && (
          <div className="lsn-section" style={{ background: "var(--caution-soft)", borderColor: "var(--caution-border)" }}>
            <div className="lsn-section-header">
              <div className="lsn-section-icon" style={{ color: "var(--caution)" }}><Icon name="function-square" size={16} /></div>
              <h3 className="lsn-section-title">Formula Sheet</h3>
            </div>
            <div className="lsn-section-body">
              <div className="rev-formula-grid">
                {revData.formulaSheet.map((f, i) => (
                  <div key={i} className="rev-formula-card">
                    <div className="rev-formula-name">{f.name}</div>
                    <div className="rev-formula-expr">{f.formula}</div>
                    {f.example && <div className="rev-formula-example">{f.example}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exam Traps */}
        {revData.examTraps && revData.examTraps.length > 0 && (
          <div className="lsn-section" style={{ background: "var(--adverse-soft)", borderColor: "var(--adverse-border)" }}>
            <div className="lsn-section-header">
              <div className="lsn-section-icon" style={{ color: "var(--adverse)" }}><Icon name="alert-triangle" size={16} /></div>
              <h3 className="lsn-section-title">Exam Traps</h3>
            </div>
            <div className="lsn-section-body">
              <ul className="lsn-list">
                {revData.examTraps.map((trap, i) => (
                  <li key={i}><Icon name="alert-circle" size={12} color="var(--adverse)" />{trap}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Memory Aids */}
        {revData.memoryAids && revData.memoryAids.length > 0 && (
          <div className="lsn-section" style={{ background: "var(--favourable-soft)", borderColor: "var(--favourable-border)" }}>
            <div className="lsn-section-header">
              <div className="lsn-section-icon" style={{ color: "var(--favourable)" }}><Icon name="lightbulb" size={16} /></div>
              <h3 className="lsn-section-title">Memory Aids</h3>
            </div>
            <div className="lsn-section-body">
              <ul className="lsn-list">
                {revData.memoryAids.map((aid, i) => (
                  <li key={i}><Icon name="zap" size={12} color="var(--favourable)" />{aid}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Quick Example */}
        {revData.quickExample && (
          <div className="lsn-section" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <div className="lsn-section-header">
              <div className="lsn-section-icon" style={{ color: "var(--fg-3)" }}><Icon name="pencil-ruler" size={16} /></div>
              <h3 className="lsn-section-title">Quick Example</h3>
            </div>
            <div className="lsn-section-body">
              <div className="lsn-example">
                <div className="lsn-example-setup">{revData.quickExample.setup}</div>
                <div className="lsn-example-answer">
                  <Icon name="check-circle" size={14} color="var(--favourable)" />
                  <strong>Answer:</strong> {revData.quickExample.answer}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Checks */}
        {revData.quickChecks && revData.quickChecks.length > 0 && (
          <div className="lsn-section" style={{ background: "var(--primary-soft)", borderColor: "var(--primary-soft-2)" }}>
            <div className="lsn-section-header">
              <div className="lsn-section-icon" style={{ color: "var(--primary)" }}><Icon name="help-circle" size={16} /></div>
              <h3 className="lsn-section-title">Quick Checks</h3>
            </div>
            <div className="lsn-section-body">
              <div className="lsn-pq-list">
                {revData.quickChecks.map((q, i) => (
                  <RevQuickCheck key={i} q={q} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Complete / navigation row */}
        <div className="lsn-nav-row">
          {prevLesson ? (
            <Button variant="secondary" icon="arrow-left"
              onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: prevLesson.id, mode: "revision" })}>
              {prevLesson.title}
            </Button>
          ) : <div />}

          {marked ? (
            nextLesson ? (
              <Button variant="primary" iconRight="arrow-right"
                onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: nextLesson.id, mode: "revision" })}>
                Next: {nextLesson.title}
              </Button>
            ) : (
              <Button variant="primary" icon="graduation-cap"
                onClick={() => onNavigate && onNavigate("coursedetail", { paperId, mode: "revision" })}>
                Back to course
              </Button>
            )
          ) : (
            <Button variant="primary" icon="check-circle" onClick={handleComplete}>
              Mark as complete · +25 XP
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Explanation page splitter ───────────────────────────────────────────── */
function splitExplanation(html) {
  if (!html) return [];
  const pages = html.split(/(?=<h3[\s>])/i).filter(p => p.trim());
  return pages.length > 1 ? pages : [html];
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
function AIQLessons({ paperId, lessonId, mode = "deep", onNavigate }) {
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
  const [expPage, setExpPage]       = useLsnState(0);
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

  /* ── Revision mode: delegate to separate renderer ── */
  if (mode === "revision") {
    return (
      <RevisionLesson
        paperId={paperId}
        lesson={lesson}
        paper={paper}
        lessons={lessons}
        onNavigate={onNavigate}
      />
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
    setExpPage(0);
    return () => {
      const minutes = Math.round((Date.now() - openedAt.current) / 60000);
      if (minutes > 0 && window.aiqStore) window.aiqStore.recordActivity({ minutes });
    };
  }, [lesson.id]);

  const expPages    = lesson.explanation ? splitExplanation(lesson.explanation) : [];
  const totalExp    = expPages.length;
  const safeExpPage = Math.min(expPage, Math.max(0, totalExp - 1));
  const isLastExpPage = safeExpPage >= totalExp - 1;

  const handleAnswer = (correct) => {
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson  = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson  = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const goNext = () => {
    if (curSectionId === "explanation" && !isLastExpPage) {
      setExpPage(p => p + 1);
      return;
    }
    if (!isLastSection) {
      setSectionIdx(safeSectionIdx + 1);
    } else if (nextLesson) {
      onNavigate && onNavigate("lessons", { paperId, lessonId: nextLesson.id, mode: "deep" });
    } else {
      onNavigate && onNavigate(isTrack ? "skillslab" : "coursedetail", isTrack ? undefined : { paperId, mode: "deep" });
    }
  };

  const goPrev = () => {
    if (curSectionId === "explanation" && safeExpPage > 0) {
      setExpPage(p => p - 1);
      return;
    }
    if (!isFirstSection) {
      setSectionIdx(safeSectionIdx - 1);
    } else if (prevLesson) {
      onNavigate && onNavigate("lessons", { paperId, lessonId: prevLesson.id, mode: "deep" });
    }
  };

  return (
    <div className="content">
      <div className="lsn-page">

        {/* Breadcrumb */}
        <div className="lsn-breadcrumb">
          <button className="lsn-back" onClick={() => onNavigate && onNavigate(isTrack ? "skillslab" : "coursedetail", isTrack ? undefined : { paperId, mode: "deep" })}>
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

          {/* Explanation — split into pages at <h3> boundaries */}
          <div className={`lsn-section-panel${curSectionId === "explanation" ? " active" : ""}`}>
            {lesson.explanation && (
              <LsnSection icon="book-open" title="Explanation" tone="neutral">
                {totalExp > 1 && (
                  <div className="lsn-exp-pager">
                    <div className="lsn-exp-dots">
                      {expPages.map((_, i) => (
                        <button
                          key={i}
                          className={`lsn-exp-dot${i === safeExpPage ? " active" : i < safeExpPage ? " done" : ""}`}
                          onClick={() => setExpPage(i)}
                          aria-label={`Page ${i + 1} of ${totalExp}`}
                        />
                      ))}
                    </div>
                    <span className="lsn-exp-count">{safeExpPage + 1} of {totalExp}</span>
                  </div>
                )}
                <div className="lsn-prose" dangerouslySetInnerHTML={{ __html: expPages[safeExpPage] || "" }} />
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
          {(curSectionId === "explanation" && safeExpPage > 0) || !isFirstSection || prevLesson ? (
            <Button variant="secondary" icon="arrow-left" onClick={goPrev}>
              {(!isFirstSection || (curSectionId === "explanation" && safeExpPage > 0))
                ? "Previous"
                : prevLesson ? prevLesson.title : "Previous"}
            </Button>
          ) : <div />}

          <Button
            variant="primary"
            iconRight="arrow-right"
            onClick={goNext}
          >
            {curSectionId === "explanation" && !isLastExpPage
              ? "Continue"
              : isLastSection
                ? (nextLesson ? nextLesson.title : "Back to course")
                : (availSections[safeSectionIdx + 1]?.label || "Next")}
          </Button>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { AIQLessons });
