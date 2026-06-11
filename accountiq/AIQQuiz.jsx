/* AccountIQ — Quiz Results screen (Item 3)
 *
 * Spec: improve the results screen only.
 * Shows: score, percentage, per-topic breakdown, weak areas flagged,
 * recommended follow-up lesson (linked), "Review answers" CTA with explanations.
 *
 * Receives quizResult from App aiqContext:
 *   { paperId, lessonId, questions: [{q, options, correct, explanation, topic}],
 *     answers: [chosenIndex, ...] }
 *
 * Per-topic mastery is persisted to aiqStore.
 * TODO: replace aiqStore.recordTopicResult with a real API write to /api/user/mastery
 */
const { useState: useQzState, useEffect: useQzEffect } = React;

/* ── Score ring (SVG) ────────────────────────────────────────────────────── */
function ScoreRing({ pct, size = 120 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 70 ? "var(--favourable)" : pct >= 50 ? "var(--caution)" : "var(--adverse)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        style={{ font: "700 22px var(--font-mono)", fill: color }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

/* ── Topic breakdown row ─────────────────────────────────────────────────── */
function TopicRow({ topic, correct, total, isWeak }) {
  const { Icon } = window;
  const pct = total > 0 ? (correct / total) * 100 : 0;
  const { CrsProgressBar } = window;
  const barColor = pct >= 70 ? "var(--favourable)" : pct >= 50 ? "var(--caution)" : "var(--adverse)";
  return (
    <div className={`qz-topic-row${isWeak ? " weak" : ""}`}>
      <div className="qz-topic-name">
        {isWeak && <Icon name="alert-circle" size={13} color="var(--caution)" />}
        {topic}
      </div>
      <div className="qz-topic-bar">
        <CrsProgressBar value={pct / 100} height={6} color={barColor} />
      </div>
      <div className="qz-topic-score" style={{ color: barColor }}>
        {correct}/{total}
      </div>
    </div>
  );
}

/* ── Review answer item ──────────────────────────────────────────────────── */
function ReviewItem({ q, chosen, index }) {
  const { Icon } = window;
  const correct = chosen === q.correct;
  return (
    <div className={`qz-review-item${correct ? " correct" : " wrong"}`}>
      <div className="qz-review-header">
        <span className="qz-review-num">Q{index + 1}</span>
        {correct
          ? <span className="chip fav"><Icon name="check-circle" size={11} />Correct</span>
          : <span className="chip adv"><Icon name="x-circle" size={11} />Incorrect</span>
        }
      </div>
      <p className="qz-review-q">{q.question}</p>
      <div className="qz-review-options">
        {q.options.map((opt, i) => (
          <div
            key={i}
            className={`qz-review-opt${i === q.correct ? " correct" : ""}${i === chosen && !correct ? " chosen-wrong" : ""}`}
          >
            <span className="lsn-pq-opt-letter">{String.fromCharCode(65 + i)}</span>
            {opt}
            {i === q.correct && <Icon name="check" size={13} color="var(--favourable)" style={{ marginLeft: "auto" }} />}
          </div>
        ))}
      </div>
      <div className="qz-review-explain">
        <Icon name="info" size={13} color="var(--primary)" />
        {q.explanation}
      </div>
    </div>
  );
}

/* ── Main Quiz Results component ─────────────────────────────────────────── */
function AIQQuiz({ quizResult, onNavigate }) {
  const { Icon, Button } = window;
  const [showReview, setShowReview] = useQzState(false);

  if (!quizResult) {
    return (
      <div className="content">
        <div className="loading"><Icon name="help-circle" size={20} color="var(--fg-3)" />No quiz results.</div>
      </div>
    );
  }

  const { paperId, lessonId, questions = [], answers = [] } = quizResult;

  /* ── Score calculation ── */
  const total   = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.correct).length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;

  const scoreLabel = pct >= 70 ? "Pass" : pct >= 50 ? "Near miss" : "Needs work";
  const scoreTone  = pct >= 70 ? "fav" : pct >= 50 ? "cau" : "adv";

  /* ── Per-topic breakdown ── */
  const topicMap = {};
  questions.forEach((q, i) => {
    const t = q.topic || "General";
    if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
    topicMap[t].total++;
    if (answers[i] === q.correct) topicMap[t].correct++;
  });
  const topics = Object.entries(topicMap).map(([name, data]) => ({
    name,
    correct: data.correct,
    total:   data.total,
    pct:     data.total > 0 ? (data.correct / data.total) * 100 : 0,
  }));

  /* ── Weak areas: topics below 60% ── */
  const weakTopics = topics.filter((t) => t.pct < 60);

  /* ── Recommended lesson ── */
  const catalogue = window.AIQ_COURSE_DATA || {};
  const paper     = (catalogue.papers || []).find((p) => p.id === paperId);
  const lesson    = paper && lessonId
    ? paper.lessons.find((l) => l.id === lessonId)
    : null;
  // Find the next lesson as recommended follow-up
  const lessonIdx     = paper ? paper.lessons.findIndex((l) => l.id === lessonId) : -1;
  const nextLesson    = paper && lessonIdx >= 0 && lessonIdx < paper.lessons.length - 1
    ? paper.lessons[lessonIdx + 1]
    : null;
  // If score is low, recommend revisiting the same lesson
  const recommendedLesson = pct < 70 ? lesson : nextLesson;

  /* ── Persist mastery to store ── */
  useQzEffect(() => {
    if (!paperId || !questions.length) return;
    // TODO: replace with real API write to /api/user/mastery
    topics.forEach((t) => {
      const key = `${paperId}-${t.name.toLowerCase().replace(/\s+/g, "-")}`;
      window.aiqStore.recordTopicResult(key, t.correct, t.total);
    });
    // Award XP: 5 per correct answer
    window.aiqStore.recordActivity({ xpDelta: correct * 5 });
    window.aiqStore.recordQuizResult({ paperId, lessonId, score: correct, total, pct });
    // Mark lesson complete → updates paperProgress for progress bars
    if (lessonId) {
      const catalogue = window.AIQ_COURSE_DATA || {};
      const source = (catalogue.papers || []).find((p) => p.id === paperId)
                  || ((catalogue.skillsLab || {}).tracks || []).find((t) => t.id === paperId);
      const totalLessons = source ? (source.lessons || []).length : 0;
      if (totalLessons > 0) window.aiqStore.markLessonComplete(paperId, lessonId, totalLessons);
    }
  }, []);

  return (
    <div className="content">
      <div className="qz-page">

        {/* ── Header ── */}
        <div className="qz-header card">
          <div className="qz-header-body">
            <div className="qz-score-ring">
              <ScoreRing pct={pct} size={130} />
            </div>
            <div className="qz-header-text">
              <div className="qz-header-eyebrow">Quiz complete</div>
              <h1 className="qz-header-title">
                {correct} out of {total} correct
              </h1>
              <div className="qz-header-meta">
                <span className={`chip ${scoreTone}`}>{scoreLabel}</span>
                {lesson && <span className="qz-header-lesson">{lesson.title}</span>}
              </div>
              {pct >= 70 ? (
                <p className="qz-header-verdict">
                  Great work — you're demonstrating solid understanding of this topic.
                </p>
              ) : pct >= 50 ? (
                <p className="qz-header-verdict">
                  Close! Review the weak areas below and try again.
                </p>
              ) : (
                <p className="qz-header-verdict">
                  More practice needed — revisit the lesson before attempting the quiz again.
                </p>
              )}
            </div>
          </div>
          <div className="qz-header-actions">
            <Button variant="secondary" icon="rotate-ccw" onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId, mode: "deep" })}>
              Back to lesson
            </Button>
            <Button variant="primary" icon="eye" onClick={() => setShowReview(true)}>
              Review answers
            </Button>
          </div>
        </div>

        {/* ── Per-topic breakdown ── */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Topic Breakdown</h3>
              {weakTopics.length > 0 && (
                <div className="sub">{weakTopics.length} weak area{weakTopics.length !== 1 ? "s" : ""} flagged</div>
              )}
            </div>
          </div>
          <div className="card-b">
            <div className="qz-topics">
              {topics.map((t) => (
                <TopicRow
                  key={t.name}
                  topic={t.name}
                  correct={t.correct}
                  total={t.total}
                  isWeak={t.pct < 60}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Weak areas flagged ── */}
        {weakTopics.length > 0 && (
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Focus Areas</h3>
                <div className="sub">Topics where you scored below 60%</div>
              </div>
            </div>
            <div className="card-b">
              <div className="qz-weak-list">
                {weakTopics.map((t) => (
                  <div key={t.name} className="qz-weak-item">
                    <Icon name="alert-circle" size={15} color="var(--caution)" />
                    <span className="qz-weak-name">{t.name}</span>
                    <span className="qz-weak-score">{Math.round(t.pct)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Recommended next lesson ── */}
        {recommendedLesson && (
          <div className="card qz-recommend">
            <div className="card-b" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="qz-recommend-icon">
                <Icon name={pct < 70 ? "rotate-ccw" : "arrow-right"} size={20} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="qz-recommend-label">
                  {pct < 70 ? "Recommended: revisit this lesson" : "Up next"}
                </div>
                <div className="qz-recommend-title">{recommendedLesson.title}</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: recommendedLesson.id })}
              >
                Go to lesson
              </Button>
            </div>
          </div>
        )}

        {/* ── Review answers panel ── */}
        {showReview && (
          <div className="card">
            <div className="card-h">
              <div><h3>Answer Review</h3><div className="sub">All questions with explanations</div></div>
              <button
                className="btn secondary sm"
                onClick={() => setShowReview(false)}
              >
                <Icon name="chevron-up" size={14} /> Hide
              </button>
            </div>
            <div className="card-b">
              <div className="qz-review-list">
                {questions.map((q, i) => (
                  <ReviewItem key={i} q={q} chosen={answers[i]} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

Object.assign(window, { AIQQuiz });
