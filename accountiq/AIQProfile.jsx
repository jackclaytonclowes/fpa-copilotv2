/* AccountIQ — Profile Progress Dashboard (Item 5)
 *
 * Extends the existing profile concept (new page, does not replace any existing component).
 * Sections:
 *   1. Summary header (streak, XP, daily goal progress, questions answered, mocks taken)
 *   2. Per-paper progress / mastery bars (derive readiness label — see comment below)
 *   3. Career pathway (which level am I in, what does it unlock)
 *   4. Per-topic mastery (from quiz history)
 *
 * All data sourced from aiqStore (localStorage).
 * TODO: replace every aiqStore.get() call with real API data from /api/user/progress
 */
const { useState: usePrfState } = React;

/* ── Predicted readiness derivation ────────────────────────────────────────
 * Readiness label is derived from per-paper progress (0–1) as follows:
 *
 *   ≥ 0.85  → "Exam ready"     — studied the vast majority; good for exam
 *   ≥ 0.60  → "On track"       — solid progress, keep going
 *   ≥ 0.30  → "In progress"    — meaningful start, more to do
 *   ≥ 0.01  → "Just started"   — early stages
 *   0       → "Not started"    — no progress recorded
 *
 * This is a simple heuristic based on coverage only.
 * TODO: weight by quiz mastery scores once quiz history is available.
 * ─────────────────────────────────────────────────────────────────────────── */
function deriveReadiness(progress) {
  if (progress >= 0.85) return { label: "Exam ready",  tone: "fav" };
  if (progress >= 0.60) return { label: "On track",    tone: "info" };
  if (progress >= 0.30) return { label: "In progress", tone: "cau" };
  if (progress >= 0.01) return { label: "Just started", tone: "cau" };
  return { label: "Not started", tone: "neutral" };
}

/* ── Paper mastery card ──────────────────────────────────────────────────── */
function PaperCard({ paper, progress }) {
  const { Icon, Chip } = window;
  const { CrsProgressBar } = window;
  const pct = Math.round(progress * 100);
  const readiness = deriveReadiness(progress);

  return (
    <div className="prf-paper-card card">
      <div className="prf-paper-icon">
        <Icon name={paper.icon} size={20} color="var(--primary)" />
      </div>
      <div className="prf-paper-body">
        <div className="prf-paper-header">
          <span className="crs-course-badge">{paper.title}</span>
          <span className={`chip ${readiness.tone}`}>{readiness.label}</span>
        </div>
        <div className="prf-paper-name">{paper.fullTitle}</div>
        <div className="prf-paper-progress">
          <CrsProgressBar value={progress} height={7} />
          <span className="prf-paper-pct">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Topic mastery row ───────────────────────────────────────────────────── */
function TopicMasteryRow({ topicKey, data }) {
  const { CrsProgressBar } = window;
  const pct = data.total > 0 ? (data.correct / data.total) * 100 : 0;
  const name = topicKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const barColor = pct >= 70 ? "var(--favourable)" : pct >= 50 ? "var(--caution)" : "var(--adverse)";
  return (
    <div className="prf-topic-row">
      <span className="prf-topic-name">{name}</span>
      <div className="prf-topic-bar">
        <CrsProgressBar value={pct / 100} height={5} color={barColor} />
      </div>
      <span className="prf-topic-score" style={{ color: barColor }}>
        {data.correct}/{data.total}
      </span>
    </div>
  );
}

/* ── Career pathway stage ────────────────────────────────────────────────── */
function CareerStage({ stage, isCurrent, isUnlocked }) {
  const { Icon } = window;
  return (
    <div className={`prf-career-stage${isCurrent ? " current" : ""}${isUnlocked ? " unlocked" : ""}`}>
      <div className="prf-career-icon">
        <Icon
          name={isUnlocked ? "check-circle" : isCurrent ? stage.icon : "lock"}
          size={18}
          color={isUnlocked ? "var(--favourable)" : isCurrent ? "var(--primary)" : "var(--fg-3)"}
        />
      </div>
      <div className="prf-career-body">
        <div className="prf-career-stage-name">{stage.stage}</div>
        <div className="prf-career-qual">{stage.qualification}</div>
        {isCurrent && stage.typicalRoles && (
          <div className="prf-career-roles">
            {stage.typicalRoles.slice(0, 3).join(" · ")}
          </div>
        )}
      </div>
      {isCurrent && <span className="chip info">Current level</span>}
    </div>
  );
}

/* ── Main Profile component ──────────────────────────────────────────────── */
function AIQProfile({ onNavigate }) {
  const { Icon, Button } = window;
  const { CrsProgressBar, CrsStatCard } = window;

  // TODO: replace with real API data from /api/user/profile
  const store = window.aiqStore ? window.aiqStore.get() : {};
  const paperProgress = store.paperProgress  || {};
  const topicMastery  = store.topicMastery   || {};
  const streak        = store.streak         || 0;
  const xp            = store.xp            || 0;
  const todayMin      = store.todayMinutes   || 0;
  const goalMin       = store.dailyGoalMinutes || 30;
  const qAnswered     = store.questionsAnswered || 0;
  // TODO: replace with real API data for mocks taken
  const mocksTaken    = store.mocksTaken     || 0;
  const dailyPct      = Math.min(1, todayMin / goalMin);

  const catalogue = window.AIQ_COURSE_DATA || {};
  const allPapers = catalogue.papers || [];
  const certPapers = allPapers.filter((p) => ["ba1","ba2","ba3","ba4"].includes(p.id));
  const opsPapers  = allPapers.filter((p) => ["e1","p1","f1"].includes(p.id));
  const careerPath = catalogue.careerPathway || [];

  const certComplete = certPapers.every((p) => (paperProgress[p.id] || 0) >= 1);

  // Derive current career stage
  const currentStageId = certComplete ? "operational" : "certificate";
  const unlockedIds    = certComplete ? ["certificate"] : [];

  const hasTopicData = Object.keys(topicMastery).length > 0;
  const topicEntries = Object.entries(topicMastery)
    .sort((a, b) => {
      const pctA = a[1].total > 0 ? a[1].correct / a[1].total : 0;
      const pctB = b[1].total > 0 ? b[1].correct / b[1].total : 0;
      return pctA - pctB; // weakest first
    });

  return (
    <div className="content">
      <div className="prf-page">

        {/* ── 0. Profile hero (ink card) ── */}
        <div className="prf-hero">
          <div className="prf-hero-top">
            <div className="prf-hero-avatar">A</div>
            <div>
              <div className="prf-hero-name">My Progress</div>
              <div className="prf-hero-qual">CIMA Certificate in Business Accounting</div>
            </div>
          </div>
          <div className="prf-hero-stats">
            <div className="prf-hero-stat">
              <span className="prf-hero-stat-val">{streak}</span>
              <span className="prf-hero-stat-label">Day streak 🔥</span>
            </div>
            <div className="prf-hero-stat prf-hero-stat--citron">
              <span className="prf-hero-stat-val">{xp.toLocaleString()}</span>
              <span className="prf-hero-stat-label">Total XP ⭐</span>
            </div>
            <div className="prf-hero-stat">
              <span className="prf-hero-stat-val">{mocksTaken}</span>
              <span className="prf-hero-stat-label">Mocks taken 🏆</span>
            </div>
          </div>
        </div>

        {/* ── 1. Summary header ── */}
        <div className="prf-summary-row">
          <CrsStatCard icon="clock" tone="green" label="Today's Goal" value={`${todayMin} / ${goalMin} min`}>
            <CrsProgressBar value={dailyPct} height={4} color="var(--favourable)" />
          </CrsStatCard>
          <CrsStatCard icon="help-circle" tone="blue" label="Questions Answered" value={qAnswered.toLocaleString()}>
            Across all papers
          </CrsStatCard>
          <CrsStatCard icon="clipboard-list" tone="amber" label="Mocks Taken" value={mocksTaken}>
            Full paper mock exams
          </CrsStatCard>
        </div>

        {/* ── 2. Per-paper progress / predicted readiness ── */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Certificate Level Progress</h3>
              <div className="sub">
                {/* Readiness label derived from coverage — see deriveReadiness() */}
                BA1–BA4 · {certPapers.filter((p) => (paperProgress[p.id] || 0) >= 0.6).length} of 4 papers on track
              </div>
            </div>
            <Button variant="secondary" size="sm" icon="graduation-cap" onClick={() => onNavigate && onNavigate("courses")}>
              Go to courses
            </Button>
          </div>
          <div className="card-b">
            <div className="prf-papers-grid">
              {certPapers.map((p) => (
                <PaperCard key={p.id} paper={p} progress={paperProgress[p.id] || 0} />
              ))}
            </div>
          </div>
        </div>

        {/* Operational Level papers — show progress or locked status */}
        {certComplete && (
          <div className="card">
            <div className="card-h">
              <div><h3>Operational Level Progress</h3><div className="sub">E1, P1, F1</div></div>
            </div>
            <div className="card-b">
              <div className="prf-papers-grid">
                {opsPapers.map((p) => (
                  <PaperCard key={p.id} paper={p} progress={paperProgress[p.id] || 0} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Career Pathway ── */}
        {careerPath.length > 0 && (
          <div className="card">
            <div className="card-h">
              <div><h3>Career Pathway</h3><div className="sub">CIMA qualification route</div></div>
            </div>
            <div className="card-b">
              <div className="prf-career-list">
                {careerPath.map((stage) => (
                  <CareerStage
                    key={stage.id}
                    stage={stage}
                    isCurrent={stage.id === currentStageId}
                    isUnlocked={unlockedIds.includes(stage.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Per-topic mastery ── */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Topic Mastery</h3>
              <div className="sub">Based on quiz answers — weakest topics first</div>
            </div>
          </div>
          <div className="card-b">
            {hasTopicData ? (
              <div className="prf-topic-list">
                {topicEntries.map(([key, data]) => (
                  <TopicMasteryRow key={key} topicKey={key} data={data} />
                ))}
              </div>
            ) : (
              <div className="prf-empty">
                <Icon name="help-circle" size={18} color="var(--fg-3)" />
                <span>Complete quizzes to see your topic mastery here.</span>
                <Button variant="primary" size="sm" icon="graduation-cap" onClick={() => onNavigate && onNavigate("courses")}>
                  Start studying
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { AIQProfile });
