/* AccountIQ — Quiz Engine
 *
 * Question-by-question MCQ flow. No answer feedback until the end —
 * all results are revealed on the AIQQuiz results screen.
 *
 * Entry:  navigateToAiq("quizengine", { paperId, lessonId })
 * Exit:   navigateToAiq("quiz", { quizResult })
 *
 * Sources questions from lesson.practiceQuestions (same data used by the
 * lesson viewer's inline practice, re-used here as the formal quiz).
 * TODO: add a separate quizQuestions[] field per lesson for unique questions.
 */
const { useState: useQeState, useEffect: useQeEffect } = React;

function AIQQuizEngine({ paperId, lessonId, onNavigate }) {
  const { Icon, Button } = window;

  const [currentIdx, setCurrentIdx] = useQeState(0);
  const [answers, setAnswers]       = useQeState([]);
  const [selected, setSelected]     = useQeState(null);

  // Resolve lesson from CIMA papers or Skills Lab tracks
  const catalogue = window.AIQ_COURSE_DATA || {};
  const papers    = catalogue.papers || [];
  const tracks    = (catalogue.skillsLab || {}).tracks || [];
  const source    = papers.find((p) => p.id === paperId)
                 || tracks.find((t) => t.id === paperId);
  const lessons   = source ? source.lessons : [];
  const lesson    = lessonId
    ? lessons.find((l) => l.id === lessonId) || lessons[0]
    : lessons[0];
  const questions = (lesson && lesson.practiceQuestions) || [];

  const goBack = () => onNavigate && onNavigate("lessons", { paperId, lessonId });

  // Track active quiz time; record on unmount regardless of completion path
  useQeEffect(() => {
    const startedAt = Date.now();
    return () => {
      const minutes = Math.round((Date.now() - startedAt) / 60000);
      if (minutes > 0 && window.aiqStore) window.aiqStore.recordActivity({ minutes });
    };
  }, []);

  // ── No questions available ──────────────────────────────────────────────
  if (!lesson || questions.length === 0) {
    return (
      <div className="content">
        <div className="qe-page">
          <div className="lsn-breadcrumb">
            <button className="lsn-back" onClick={goBack}>
              <Icon name="arrow-left" size={14} />
              Back to lesson
            </button>
          </div>
          <div className="card">
            <div className="qe-empty">
              <div className="qe-empty-icon">
                <Icon name="help-circle" size={28} color="var(--fg-3)" />
              </div>
              <h3 className="qe-empty-title">Questions coming soon</h3>
              <p className="qe-empty-sub">Practice questions for this lesson are being prepared.</p>
              <Button variant="secondary" icon="arrow-left" onClick={goBack}>
                Back to lesson
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q            = questions[currentIdx];
  const isLast       = currentIdx === questions.length - 1;
  const progressPct  = (currentIdx / questions.length) * 100;

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (isLast) {
      onNavigate && onNavigate("quiz", {
        quizResult: { paperId, lessonId, questions, answers: newAnswers },
      });
    } else {
      setAnswers(newAnswers);
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  };

  return (
    <div className="content">
      <div className="qe-page">

        {/* Progress header */}
        <div className="qe-header">
          <button className="lsn-back qe-exit" onClick={goBack}>
            <Icon name="x" size={14} />
            Exit
          </button>
          <div className="qe-progress-track">
            <div className="qe-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="qe-counter">{currentIdx + 1} / {questions.length}</span>
        </div>

        {/* Question card */}
        <div className="qe-question-card card">
          <div className="qe-question-body">
            {q.topic && (
              <div className="qe-question-topic">{q.topic}</div>
            )}
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
              {isLast ? "Finish quiz" : "Next question"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { AIQQuizEngine });
