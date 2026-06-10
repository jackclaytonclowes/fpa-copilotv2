/* AccountIQ — LessonView: lesson reader + inline quiz */
const { useState: useStateLesson } = React;

// ── Content block renderer ───────────────────────────────────────────────────
function ContentBlock({ block }) {
  if (block.type === "heading") {
    return <h3 className="lv-content-h3">{block.text}</h3>;
  }
  if (block.type === "paragraph") {
    return <p className="lv-content-p">{block.text}</p>;
  }
  if (block.type === "list") {
    return (
      <div className="lv-content-list">
        {block.heading && <div className="lv-list-head">{block.heading}</div>}
        <ul className="lv-ul">
          {block.items.map((item, i) => (
            <li key={i} className="lv-li">{item}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (block.type === "callout") {
    const toneClass = { info: "lv-callout--info", tip: "lv-callout--tip", warn: "lv-callout--warn" }[block.tone] || "lv-callout--info";
    const icons = { info: "info", tip: "lightbulb", warn: "alert-triangle" };
    const { Icon } = window;
    return (
      <div className={`lv-callout ${toneClass}`}>
        <span className="lv-callout-icon">
          <Icon name={icons[block.tone] || "info"} size={15} />
        </span>
        <span className="lv-callout-text">{block.text}</span>
      </div>
    );
  }
  return null;
}

// ── Single quiz question ─────────────────────────────────────────────────────
function QuizQuestion({ question, index, selected, onSelect, locked }) {
  const answered = selected !== undefined && selected !== null;
  const isCorrect = answered && selected === question.correct;

  return (
    <div className={`lv-q ${answered ? (isCorrect ? "lv-q--correct" : "lv-q--wrong") : ""}`}>
      <div className="lv-q-num">Q{index + 1}</div>
      <div className="lv-q-body">
        <div className="lv-q-text">{question.question}</div>

        <div className="lv-q-options">
          {question.options.map((opt, i) => {
            let cls = "lv-opt";
            if (answered) {
              if (i === question.correct) cls += " lv-opt--correct";
              else if (i === selected && !isCorrect) cls += " lv-opt--wrong";
              else cls += " lv-opt--dim";
            } else {
              cls += " lv-opt--idle";
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => !answered && !locked && onSelect(question.id, i)}
                disabled={answered || locked}
              >
                <span className="lv-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="lv-opt-text">{opt}</span>
                {answered && i === question.correct && (
                  <span className="lv-opt-tick">✓</span>
                )}
                {answered && i === selected && !isCorrect && (
                  <span className="lv-opt-cross">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`lv-explanation ${isCorrect ? "lv-explanation--correct" : "lv-explanation--wrong"}`}>
            <strong>{isCorrect ? "Correct!" : "Incorrect."}</strong>{" "}
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Score summary card ───────────────────────────────────────────────────────
function ScoreSummary({ score, total, alreadyComplete, onComplete }) {
  const { Icon, Button } = window;
  const pct = Math.round((score / total) * 100);
  const xp  = score * 50;
  const passed = pct >= 75;

  if (alreadyComplete) {
    return (
      <div className="lv-score lv-score--done">
        <div className="lv-score-icon lv-score-icon--done">
          <Icon name="check-circle-2" size={22} color="var(--favourable)" />
        </div>
        <div className="lv-score-text">
          <div className="lv-score-headline">Lesson already completed</div>
          <div className="lv-score-sub">You scored {score}/{total} on this quiz.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`lv-score ${passed ? "lv-score--pass" : "lv-score--fail"}`}>
      <div className={`lv-score-icon ${passed ? "lv-score-icon--pass" : "lv-score-icon--fail"}`}>
        <Icon name={passed ? "trophy" : "refresh-cw"} size={22}
          color={passed ? "var(--favourable)" : "var(--caution)"} />
      </div>
      <div className="lv-score-text">
        <div className="lv-score-headline">
          {passed ? `Great work — ${score}/${total} correct!` : `${score}/${total} correct — almost there!`}
        </div>
        <div className="lv-score-sub">
          {passed
            ? `You earned +${xp} XP. Mark this lesson complete to continue.`
            : "Review the explanations above, then complete the lesson to move on."}
        </div>
      </div>
      <Button variant="primary" icon="check" onClick={onComplete}
        style={passed ? {} : { background: "var(--caution)", borderColor: "transparent" }}>
        {passed ? "Complete Lesson" : "Complete Anyway"}
      </Button>
    </div>
  );
}

// ── Main LessonView ──────────────────────────────────────────────────────────
function LessonView({ lesson, course, lessonIndex, totalLessons, progress, onComplete, onBack }) {
  const { Icon, Button } = window;

  const savedScore = progress.quizScores[lesson.id];
  const alreadyDone = progress.completedLessons.includes(lesson.id);

  // Initialise selected answers from saved state if re-viewing a completed lesson
  const [selected, setSelected] = useStateLesson(() => savedScore ? savedScore.selected : {});

  const answeredCount = Object.keys(selected).length;
  const allAnswered   = answeredCount === lesson.quiz.length;
  const score         = lesson.quiz.filter((q) => selected[q.id] === q.correct).length;

  const handleSelect = (qId, optIndex) => {
    setSelected((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleComplete = () => {
    onComplete(lesson.id, { score, total: lesson.quiz.length, selected });
  };

  return (
    <div className="content">
      <div className="lv-page">

        {/* ── Back navigation ── */}
        <div className="lv-nav">
          <button className="lv-back-btn" onClick={onBack}>
            <Icon name="arrow-left" size={16} />
            Back to {course.code}
          </button>
          <div className="lv-nav-progress">
            <span className="lv-nav-label">Lesson {lessonIndex + 1} of {totalLessons}</span>
            <div className="lv-nav-dots">
              {Array.from({ length: totalLessons }).map((_, i) => (
                <span key={i} className={`lv-dot ${
                  i < lessonIndex ? "lv-dot--done"
                  : i === lessonIndex ? "lv-dot--active"
                  : "lv-dot--future"
                }`}
                  style={i === lessonIndex ? { background: course.color } : {}}
                />
              ))}
            </div>
          </div>
          {alreadyDone && (
            <span className="lv-done-badge">
              <Icon name="check-circle-2" size={13} color="var(--favourable)" />
              Completed
            </span>
          )}
        </div>

        {/* ── Lesson hero ── */}
        <div className="lv-hero">
          <div className="lv-hero-eyebrow">
            <span className="crs-code-badge" style={{ background: course.colorSoft, color: course.color }}>
              {course.code}
            </span>
            <span className="lv-hero-time">
              <Icon name="clock" size={13} color="var(--fg-3)" />
              {lesson.estimatedMinutes} min
            </span>
          </div>
          <h1 className="lv-hero-title">{lesson.title}</h1>
          <p className="lv-hero-summary">{lesson.summary}</p>

          <div className="lv-objectives">
            <div className="lv-objectives-head">
              <Icon name="target" size={14} color="var(--primary)" />
              Learning objectives
            </div>
            <ul className="lv-objectives-list">
              {lesson.objectives.map((obj, i) => (
                <li key={i} className="lv-obj-item">
                  <Icon name="check" size={13} color="var(--primary)" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Lesson content ── */}
        <div className="lv-content">
          {lesson.content.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}
        </div>

        {/* ── Quiz section ── */}
        <div className="lv-quiz-section">
          <div className="lv-quiz-header">
            <div className="lv-quiz-title-row">
              <Icon name="help-circle" size={18} color={course.color} />
              <h2 className="lv-quiz-title">Knowledge Check</h2>
              <span className="lv-quiz-count"
                style={{ background: course.colorSoft, color: course.color }}>
                {lesson.quiz.length} questions
              </span>
            </div>
            <p className="lv-quiz-sub">
              Answer all questions to complete this lesson. You will see explanations immediately after each answer.
            </p>
          </div>

          <div className="lv-questions">
            {lesson.quiz.map((q, i) => (
              <QuizQuestion
                key={q.id}
                question={q}
                index={i}
                selected={selected[q.id]}
                onSelect={handleSelect}
                locked={alreadyDone}
              />
            ))}
          </div>

          {/* Score summary — shown once all questions are answered */}
          {allAnswered && (
            <ScoreSummary
              score={score}
              total={lesson.quiz.length}
              alreadyComplete={alreadyDone}
              onComplete={handleComplete}
            />
          )}
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { LessonView });
