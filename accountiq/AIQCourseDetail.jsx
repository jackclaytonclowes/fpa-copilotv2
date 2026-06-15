/* AccountIQ — Course Detail Page
 *
 * Intermediate view between the course list and individual lessons.
 * Shows two learning paths per paper with independent progress, and a lesson
 * list that toggles between ⚡ Revision Mode and 📚 Deep Learning.
 *
 * Navigation:
 *   Courses → coursedetail → lessons (with mode: "revision" | "deep")
 */
const { useState: useCdtState, useEffect: useCdtEffect } = React;

/* ── Dual progress card ──────────────────────────────────────────────────── */
function CdtProgressCard({ mode, completed, total, onSelect, isActive }) {
  const { Icon } = window;
  const { CrsProgressBar } = window;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isRevision = mode === "revision";

  return (
    <button
      className={`cdt-progress-card${isActive ? " cdt-progress-card--active" : ""}${isRevision ? " cdt-progress-card--revision" : " cdt-progress-card--deep"}`}
      onClick={onSelect}
    >
      <div className="cdt-progress-card-header">
        <span className="cdt-mode-icon">{isRevision ? "⚡" : "📚"}</span>
        <span className="cdt-progress-card-label">{isRevision ? "Revision Mode" : "Deep Learning"}</span>
        {isActive && <span className="cdt-active-dot" />}
      </div>
      <div className="cdt-progress-pct">{pct}%</div>
      <CrsProgressBar
        value={pct / 100}
        height={5}
        color={isRevision ? "var(--caution)" : "var(--primary)"}
      />
      <div className="cdt-progress-count">{completed} of {total} complete</div>
    </button>
  );
}

/* ── Lesson row ──────────────────────────────────────────────────────────── */
function CdtLessonRow({ lesson, index, mode, paperId, isComplete, hasRevisionContent, onNavigate }) {
  const { Icon, Button } = window;
  const isRevision = mode === "revision";
  const canStart = !isRevision || hasRevisionContent;

  return (
    <div className={`cdt-lesson-row${isComplete ? " cdt-lesson-row--complete" : ""}`}>
      <div className="cdt-lesson-num">
        {isComplete
          ? <Icon name="check-circle" size={16} color="var(--favourable)" />
          : <span className="cdt-lesson-num-text">{String(index + 1).padStart(2, "0")}</span>
        }
      </div>
      <div className="cdt-lesson-body">
        <div className="cdt-lesson-title">{lesson.title}</div>
        <div className="cdt-lesson-meta">
          <span>{lesson.topic}</span>
          {lesson.estimatedMinutes && (
            <>
              <span className="cdt-meta-sep">·</span>
              <Icon name="clock" size={11} color="var(--fg-3)" />
              <span>
                {isRevision
                  ? `~${Math.max(5, Math.round(lesson.estimatedMinutes * 0.4))} min`
                  : `~${lesson.estimatedMinutes} min`}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="cdt-lesson-action">
        {!canStart ? (
          <span className="cdt-coming-soon-tag">Coming soon</span>
        ) : isComplete ? (
          <Button
            variant="secondary"
            size="sm"
            icon="rotate-ccw"
            onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: lesson.id, mode })}
          >
            Review
          </Button>
        ) : (
          <Button
            variant={isRevision ? "secondary" : "primary"}
            size="sm"
            iconRight="arrow-right"
            onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: lesson.id, mode })}
          >
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── No revision content placeholder ────────────────────────────────────── */
function CdtRevisionComingSoon({ paper }) {
  const { Icon } = window;
  return (
    <div className="cdt-revision-coming-soon">
      <div className="cdt-revision-coming-soon-icon">
        <Icon name="zap" size={28} color="var(--caution)" />
      </div>
      <h3>Revision Mode coming soon for {paper.title}</h3>
      <p>
        We're building ⚡ Revision lessons for {paper.fullTitle}.
        In the meantime, use 📚 Deep Learning to study the full content.
      </p>
    </div>
  );
}

/* ── Duolingo-style winding lesson path ─────────────────────────────────── */
function CdtLessonPath({ lessons, mode, paperId, completedSet, revisionData, onNavigate }) {
  const { Icon } = window;
  const isRevision = mode === "revision";

  /* Zigzag X positions as % from left (bubble center) */
  const ZIGZAG  = [20, 35, 50, 65, 80, 65, 50, 35];
  const BUBBLE_D = 56;
  const BUBBLE_R = BUBBLE_D / 2;
  const LABEL_W  = 88;

  const firstIncompleteIdx = lessons.findIndex((l) =>
    isRevision
      ? !completedSet.includes(l.id) && !!revisionData[l.id]
      : !completedSet.includes(l.id)
  );

  /* Group consecutive lessons by topic for section banners */
  const groups = [];
  lessons.forEach((lesson, i) => {
    const last = groups[groups.length - 1];
    if (!last || last.topic !== lesson.topic) {
      groups.push({ topic: lesson.topic, startIdx: i, lessons: [lesson] });
    } else {
      last.lessons.push(lesson);
    }
  });

  /* Render flat list of nodes, inserting a banner before each topic group */
  const rows = [];
  let globalIdx = 0;

  groups.forEach((group) => {
    rows.push({ type: "banner", topic: group.topic, key: `banner-${group.topic}` });
    group.lessons.forEach((lesson) => {
      rows.push({ type: "node", lesson, globalIdx });
      globalIdx++;
    });
  });

  return (
    <div className="cdt-path">
      {rows.map((row) => {
        if (row.type === "banner") {
          return (
            <div key={row.key} className="cdt-path-banner">
              {row.topic}
            </div>
          );
        }

        const { lesson, globalIdx: idx } = row;
        const isDone    = completedSet.includes(lesson.id);
        const isCurrent = idx === firstIncompleteIdx;
        const isLocked  = isRevision && !revisionData[lesson.id];
        const canTap    = !isLocked;

        const pct = ZIGZAG[idx % ZIGZAG.length];
        const bubbleML = `calc(${pct}% - ${BUBBLE_R}px)`;
        const labelML  = `calc(${pct}% - ${LABEL_W / 2}px)`;

        let bubbleMod = isDone ? "done" : isCurrent ? "current" : "future";
        if (isLocked) bubbleMod = "locked";

        return (
          <div key={lesson.id} className="cdt-path-node">
            <button
              className={`cdt-path-bubble cdt-path-bubble--${bubbleMod}`}
              style={{ marginLeft: bubbleML }}
              disabled={!canTap}
              onClick={() => canTap && onNavigate && onNavigate("lessons", { paperId, lessonId: lesson.id, mode })}
              title={lesson.title}
            >
              {isDone ? (
                <Icon name="check" size={22} color="#fff" />
              ) : isCurrent ? (
                <Icon name="star" size={22} color="#fff" />
              ) : isLocked ? (
                <Icon name="lock" size={18} color="var(--fg-3)" />
              ) : (
                <span className="cdt-path-num">{String(idx + 1).padStart(2, "0")}</span>
              )}
            </button>
            <div
              className={`cdt-path-label${isDone ? " cdt-path-label--done" : isCurrent ? " cdt-path-label--current" : ""}`}
              style={{ marginLeft: labelML, width: LABEL_W }}
            >
              {lesson.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Level badge ─────────────────────────────────────────────────────────── */
function levelBadge(paperId) {
  if (["ba1","ba2","ba3","ba4"].includes(paperId)) return "Certificate Level";
  if (["e1","p1","f1"].includes(paperId)) return "Operational Level";
  if (["e2","p2","f2"].includes(paperId)) return "Management Level";
  if (["e3","p3","f3"].includes(paperId)) return "Strategic Level";
  return "Skills Lab";
}

/* ── Main component ──────────────────────────────────────────────────────── */
function AIQCourseDetail({ paperId, mode: initialMode, onNavigate }) {
  const { Icon, Button } = window;

  /* Reactive store — updates on any progress change */
  const [store, setStore] = useCdtState(() => window.aiqStore ? window.aiqStore.get() : {});
  useCdtEffect(() => {
    const h = (e) => setStore(e.detail);
    window.addEventListener("aiq-store-update", h);
    return () => window.removeEventListener("aiq-store-update", h);
  }, []);

  /* Mode toggle state — defaults to onboarding preference or passed prop */
  const defaultMode = initialMode || (store.studyPath === "accelerated" ? "revision" : "deep");
  const [mode, setMode] = useCdtState(defaultMode);

  /* Resolve paper from catalogue */
  const catalogue = window.AIQ_COURSE_DATA || {};
  const revisionData = window.AIQ_REVISION_DATA || {};
  const paper = (catalogue.papers || []).find((p) => p.id === paperId);

  if (!paper) {
    return (
      <div className="content">
        <div className="cdt-page">
          <div className="loading">
            <Icon name="book-open" size={20} color="var(--fg-3)" />
            Course not found.
          </div>
        </div>
      </div>
    );
  }

  const lessons = paper.lessons || [];
  const total   = lessons.length;

  /* Progress from store */
  const completedDeep     = (store.completedLessons  || {})[paperId] || [];
  const completedRevision = (store.revisionLessons   || {})[paperId] || [];
  const deepProgress      = store.paperProgress?.[paperId] || 0;
  const revProgress       = store.revisionProgress?.[paperId] || 0;

  /* Find the next incomplete lesson for each mode */
  const nextDeepLesson     = lessons.find((l) => !completedDeep.includes(l.id));
  const nextRevisionLesson = lessons.find((l) => !completedRevision.includes(l.id) && revisionData[l.id]);

  /* Does this paper have any revision content? */
  const hasAnyRevisionContent = lessons.some((l) => !!revisionData[l.id]);

  /* CTA button: jump straight to next lesson in current mode */
  const nextLesson = mode === "revision" ? nextRevisionLesson : nextDeepLesson;
  const activeCompleted = mode === "revision" ? completedRevision.length : completedDeep.length;
  const isAllDone = activeCompleted >= total;

  return (
    <div className="content">
      <div className="cdt-page">

        {/* Breadcrumb */}
        <div className="lsn-breadcrumb">
          <button className="lsn-back" onClick={() => onNavigate && onNavigate("courses")}>
            <Icon name="arrow-left" size={14} />
            Courses
          </button>
          <span className="lsn-breadcrumb-sep">/</span>
          <span className="lsn-breadcrumb-current">{paper.title} — {paper.fullTitle}</span>
        </div>

        {/* Paper header card */}
        <div className="cdt-header card">
          <div className="cdt-header-body">
            <div className="cdt-header-icon">
              <Icon name={paper.icon} size={24} color="var(--primary)" />
            </div>
            <div className="cdt-header-text">
              <div className="cdt-header-meta">
                <span className="crs-course-badge">{paper.title}</span>
                <span className="chip info">{levelBadge(paperId)}</span>
              </div>
              <h1 className="cdt-header-title">{paper.fullTitle}</h1>
              <div className="cdt-header-sub">
                {total} lessons
                <span className="cdt-meta-sep">·</span>
                {paper.studyHoursTotal}h estimated total
              </div>
            </div>
            {nextLesson && !isAllDone && (
              <div className="cdt-header-cta">
                <Button
                  variant="primary"
                  iconRight="arrow-right"
                  onClick={() => onNavigate && onNavigate("lessons", { paperId, lessonId: nextLesson.id, mode })}
                >
                  {activeCompleted > 0 ? "Continue" : "Start"}
                </Button>
                <div className="cdt-cta-mode">
                  {mode === "revision" ? "⚡ Revision Mode" : "📚 Deep Learning"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dual progress cards */}
        <div className="cdt-progress-row">
          <CdtProgressCard
            mode="revision"
            completed={completedRevision.length}
            total={total}
            isActive={mode === "revision"}
            onSelect={() => setMode("revision")}
          />
          <CdtProgressCard
            mode="deep"
            completed={completedDeep.length}
            total={total}
            isActive={mode === "deep"}
            onSelect={() => setMode("deep")}
          />
        </div>

        {/* Mode toggle + lesson list */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Lessons</h3>
              <div className="sub">
                {mode === "revision"
                  ? "⚡ Revision — key concepts, formulas and exam traps"
                  : "📚 Deep Learning — full explanations with worked examples"}
              </div>
            </div>
            {/* Inline toggle */}
            <div className="cdt-mode-toggle">
              <button
                className={`cdt-mode-btn${mode === "revision" ? " cdt-mode-btn--active cdt-mode-btn--rev" : ""}`}
                onClick={() => setMode("revision")}
              >
                ⚡ Revision
              </button>
              <button
                className={`cdt-mode-btn${mode === "deep" ? " cdt-mode-btn--active cdt-mode-btn--deep" : ""}`}
                onClick={() => setMode("deep")}
              >
                📚 Deep Learning
              </button>
            </div>
          </div>

          <div className="card-b cdt-card-path">
            {mode === "revision" && !hasAnyRevisionContent ? (
              <CdtRevisionComingSoon paper={paper} />
            ) : (
              <CdtLessonPath
                lessons={lessons}
                mode={mode}
                paperId={paperId}
                completedSet={mode === "revision" ? completedRevision : completedDeep}
                revisionData={revisionData}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { AIQCourseDetail });
