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

/* ── Key-term question builder ───────────────────────────────────────────── */
function buildKeyTermQuestions(lesson, allLessons) {
  if (!lesson.keyTerms || !lesson.keyTerms.length) return [];
  const pool = [];
  for (const l of allLessons) {
    if (l.id === lesson.id || !l.keyTerms) continue;
    for (const kt of l.keyTerms) pool.push(kt.definition);
  }
  const seed = lesson.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  function seededShuffle(arr, s) {
    const a = [...arr]; let n = s;
    for (let i = a.length - 1; i > 0; i--) {
      n = (n * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(n) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const trunc = (s) => s.length > 110 ? s.slice(0, 110) + "…" : s;
  return lesson.keyTerms.map((kt, ki) => {
    const correctDef = kt.definition;
    const wrong = seededShuffle(pool.filter(d => d !== correctDef), seed + ki).slice(0, 3);
    const opts  = seededShuffle([trunc(correctDef), ...wrong.map(trunc)], seed + ki + 77);
    return {
      question: `Which best describes "${kt.term}"?`,
      options: opts,
      correct: opts.indexOf(trunc(correctDef)),
      explanation: correctDef,
    };
  });
}

/* ── One-at-a-time quiz ──────────────────────────────────────────────────── */
function LsnQuiz({ lesson, allLessons }) {
  const { Icon } = window;
  const questions = React.useMemo(
    () => [...buildKeyTermQuestions(lesson, allLessons), ...(lesson.practiceQuestions || [])],
    [lesson.id]
  );
  const [qIdx, setQIdx]         = useLsnState(0);
  const [results, setResults]   = useLsnState([]);
  const [showNext, setShowNext] = useLsnState(false);

  const total   = questions.length;
  const isDone  = results.length === total;
  const correct = results.filter(Boolean).length;

  const handleAnswer = (isCorrect) => {
    setResults(r => [...r, isCorrect]);
    setShowNext(true);
  };
  const advance = () => { setShowNext(false); setQIdx(i => i + 1); };

  if (isDone) {
    return (
      <div className="lsn-quiz-complete">
        <div className="lsn-quiz-complete-emoji">
          {correct === total ? "🎉" : correct >= Math.ceil(total * 0.6) ? "👍" : "💪"}
        </div>
        <div className="lsn-quiz-complete-title">
          {correct === total ? "Perfect score!" : `${correct} / ${total} correct`}
        </div>
        <p className="lsn-quiz-complete-sub">
          {correct === total
            ? "You nailed every question — ready for the full quiz?"
            : correct >= Math.ceil(total * 0.6)
              ? "Good effort — review the explanation then take the full quiz."
              : "Keep reviewing — the full quiz will help lock it in."}
        </p>
      </div>
    );
  }

  return (
    <div className="lsn-quiz-flow">
      <div className="lsn-quiz-progress">
        {questions.map((_, i) => (
          <div key={i} className={
            `lsn-quiz-pdot${
              i < results.length ? (results[i] ? " correct" : " wrong") :
              i === qIdx ? " active" : ""
            }`
          } />
        ))}
      </div>
      <LsnPracticeQ key={qIdx} q={questions[qIdx]} index={qIdx} onAnswer={handleAnswer} />
      {showNext && qIdx < total - 1 && (
        <button className="lsn-quiz-next-btn" onClick={advance}>
          Next <Icon name="arrow-right" size={14} />
        </button>
      )}
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
  const pages = html.split(/(?=<h[34][\s>])/i).filter(p => p.trim());
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
  const [slideDir, setSlideDir]     = useLsnState("fwd");
  const [score, setScore]           = useLsnState({ correct: 0, total: 0 });
  const [revealedSteps, setRevealedSteps] = useLsnState(1);
  const swipeOrigin = useLsnRef(null);

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
    if (s.id === "quiz")        return !!(lesson.practiceQuestions?.length || lesson.keyTerms?.length);
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

  // Overall lesson progress (explanation counts as N sub-steps)
  const totalSteps   = availSections.reduce((a, s) => a + (s.id === "explanation" ? Math.max(totalExp, 1) : 1), 0);
  const currentStep  = availSections.slice(0, safeSectionIdx).reduce((a, s) => a + (s.id === "explanation" ? Math.max(totalExp, 1) : 1), 0)
                     + (curSectionId === "explanation" ? safeExpPage + 1 : 1);

  const handleAnswer = (correct) => {
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson  = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson  = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const goNext = () => {
    setSlideDir("fwd");
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
    setSlideDir("back");
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

  const onSwipeStart = (e) => {
    const t = e.touches[0];
    swipeOrigin.current = { x: t.clientX, y: t.clientY };
  };
  const onSwipeEnd = (e) => {
    if (!swipeOrigin.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeOrigin.current.x;
    const dy = t.clientY - swipeOrigin.current.y;
    swipeOrigin.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goNext();
    else goPrev();
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
          {/* Progress bar — fills as steps are completed */}
          <div className="lsn-lesson-progress">
            <div className="lsn-lesson-progress-fill" style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }} />
          </div>

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
                <span className="lsn-step-counter">{currentStep} / {totalSteps} steps</span>
              </div>
            )}
          </div>

          {/* Step-dot progress (replaces pill tabs) */}
          <div className="lsn-step-progress">
            {availSections.map((s, i) => {
              const isDone   = i < safeSectionIdx;
              const isActive = i === safeSectionIdx;
              return (
                <React.Fragment key={s.id}>
                  <button
                    className={`lsn-step-dot${isActive ? " active" : isDone ? " done" : ""}`}
                    onClick={() => { setSlideDir(i > safeSectionIdx ? "fwd" : "back"); setSectionIdx(i); }}
                    title={s.label}
                  >
                    {isDone
                      ? <Icon name="check" size={10} color="#fff" />
                      : <span className="lsn-step-num">{i + 1}</span>
                    }
                  </button>
                  {i < availSections.length - 1 && (
                    <div className={`lsn-step-line${isDone ? " done" : ""}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Section panels — all stay mounted so state (quiz answers, step reveal) persists */}
        <div className={`lsn-section-panels lsn-slide-${slideDir}`} onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>

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
                <div key={safeExpPage} className="lsn-prose" dangerouslySetInnerHTML={{ __html: expPages[safeExpPage] || "" }} />
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
            {(lesson.practiceQuestions?.length || lesson.keyTerms?.length) ? (
              <LsnSection icon="help-circle" title="Practice Questions" tone="primary">
                <LsnQuiz lesson={lesson} allLessons={lessons} />
              </LsnSection>
            ) : null}
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
