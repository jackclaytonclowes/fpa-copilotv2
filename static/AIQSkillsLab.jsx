/* AccountIQ — Skills Lab
 *
 * Finance Skills Track  (category: "finance-skills")
 *   1. Advanced Excel for Finance  (12 modules)
 *   2. SQL for Finance             (10 modules)
 *
 * Productivity Tools              (category: "tools")
 *   3. Power BI for Finance        (6 modules)
 *   4. AI for Finance              (6 modules)
 *
 * IMPORTANT: Finance Skills content is practical, employer-focused training.
 * It is NOT part of the official CIMA syllabus.
 *
 * Track overview → module list (internal state) → lesson viewer (AIQLessons)
 * Progress sourced from aiqStore.paperProgress using track IDs as keys.
 * TODO: replace with real API progress from /api/user/skills-progress
 */
const { useState: useSlbState } = React;

/* ── Track accent colours ────────────────────────────────────────────────── */
const TRACK_PALETTE = {
  excel:   { bg: "#E8F5EE", border: "#B2D8BF", icon: "#217346" },
  sql:     { bg: "#EEF3FF", border: "#BDD0FF", icon: "#2563eb" },
  powerbi: { bg: "#FFFBE8", border: "#F5E49A", icon: "#c29000" },
  ai:      { bg: "#F5F0FF", border: "#D4C5FF", icon: "#7c3aed" },
};
function trackPalette(id) {
  return TRACK_PALETTE[id] || { bg: "var(--surface-2)", border: "var(--border)", icon: "var(--fg-2)" };
}

/* ── "Not CIMA syllabus" disclaimer badge ────────────────────────────────── */
function SlbNotCimaBadge() {
  const { Icon } = window;
  return (
    <span className="slb-not-cima-badge">
      <Icon name="info" size={11} />
      Practical skills — not CIMA syllabus
    </span>
  );
}

/* ── Track overview card ─────────────────────────────────────────────────── */
function SlbTrackCard({ track, progress, onClick }) {
  const { Icon } = window;
  const { CrsProgressBar } = window;
  const pal  = trackPalette(track.id);
  const pct  = Math.round((progress || 0) * 100);
  const total = (track.lessons || []).length;
  const done  = Math.round((progress || 0) * total);

  return (
    <div
      className="slb-track-card card"
      onClick={onClick}
      style={{ borderColor: pal.border, cursor: "pointer" }}
    >
      <div className="slb-track-top">
        <div className="slb-track-icon" style={{ background: pal.bg }}>
          <Icon name={track.icon} size={22} color={pal.icon} />
        </div>
        <div className="slb-track-meta">
          <span className="slb-track-modules">{total} modules</span>
          <span className="slb-track-hours">{track.estimatedHours}h est.</span>
        </div>
      </div>
      <div className="slb-track-body">
        <div className="slb-track-title">{track.title}</div>
        <div className="slb-track-desc">{track.description}</div>
      </div>
      <div className="slb-track-footer">
        <div className="slb-track-progress-row">
          <CrsProgressBar value={progress || 0} height={5} />
          <span className="slb-track-pct">{pct}%</span>
        </div>
        {done > 0 && (
          <div className="slb-track-status">{done} of {total} complete</div>
        )}
      </div>
    </div>
  );
}

/* ── Module list row ─────────────────────────────────────────────────────── */
function SlbModuleRow({ module, index, trackId, onNavigate, isComplete }) {
  const { Icon, Button } = window;
  const pal = trackPalette(trackId);
  return (
    <div className={`slb-module-row${isComplete ? " slb-module-row--done" : ""}`}>
      <div className="slb-module-num" style={{ color: isComplete ? "var(--favourable)" : pal.icon }}>
        {isComplete ? <Icon name="check-circle" size={16} /> : index + 1}
      </div>
      <div className="slb-module-info">
        <div className="slb-module-title">{module.title}</div>
        <div className="slb-module-topic">{module.topic}</div>
      </div>
      {!isComplete && module.estimatedMinutes && (
        <div className="slb-module-time">
          <Icon name="clock" size={12} color="var(--fg-3)" />
          {module.estimatedMinutes}m
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onNavigate && onNavigate("lessons", { paperId: trackId, lessonId: module.id })}
      >
        {isComplete ? "Review" : "Start"}
      </Button>
    </div>
  );
}

/* ── Track detail view ───────────────────────────────────────────────────── */
function SlbTrackDetail({ track, onBack, onNavigate }) {
  const { Icon, Button, CrsProgressBar } = window;
  const pal        = trackPalette(track.id);
  const modules    = track.lessons || [];
  const isFinance  = track.category === "finance-skills";

  const store        = window.aiqStore ? window.aiqStore.get() : {};
  const completedSet = (store.completedLessons || {})[track.id] || [];
  const progress     = (store.paperProgress || {})[track.id] || 0;
  const doneCnt      = completedSet.length;
  const pct          = Math.round(progress * 100);

  return (
    <div className="content">
      <div className="crs-page">
        <div>
          <button className="lsn-back" onClick={onBack}>
            <Icon name="arrow-left" size={14} />
            {isFinance ? "Finance Skills" : "Skills Lab"}
          </button>
        </div>

        <div className="slb-detail-header card" style={{ borderColor: pal.border }}>
          <div className="slb-detail-header-body">
            <div className="slb-detail-icon" style={{ background: pal.bg }}>
              <Icon name={track.icon} size={26} color={pal.icon} />
            </div>
            <div>
              <div className="slb-detail-eyebrow-row">
                <div className="slb-detail-eyebrow">
                  {isFinance ? "Finance Skills Track" : "Productivity Tools"}
                </div>
                {isFinance && <SlbNotCimaBadge />}
              </div>
              <h1 className="slb-detail-title">{track.title}</h1>
              <div className="slb-detail-desc">{track.description}</div>
              <div className="slb-detail-meta">
                <span><Icon name="layers" size={13} color="var(--fg-3)" />{modules.length} modules</span>
                <span><Icon name="clock" size={13} color="var(--fg-3)" />~{track.estimatedHours}h total</span>
              </div>
              {doneCnt > 0 && (
                <div className="slb-detail-progress">
                  <CrsProgressBar value={progress} height={5} color={pal.icon} />
                  <span className="slb-track-pct">{pct}% · {doneCnt} of {modules.length} complete</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Modules</h3>
              <div className="sub">Click any module to open the lesson</div>
            </div>
            {modules.length > 0 && (() => {
              const nextMod = modules.find((m) => !completedSet.includes(m.id)) || modules[0];
              const allDone = doneCnt >= modules.length;
              return (
                <Button
                  variant="primary"
                  size="sm"
                  icon={allDone ? "rotate-ccw" : "play"}
                  onClick={() => onNavigate && onNavigate("lessons", { paperId: track.id, lessonId: nextMod.id })}
                >
                  {allDone ? "Review track" : doneCnt > 0 ? "Continue" : "Start from beginning"}
                </Button>
              );
            })()}
          </div>
          <div className="card-b">
            <div className="slb-module-list">
              {modules.map((mod, i) => (
                <SlbModuleRow
                  key={mod.id}
                  module={mod}
                  index={i}
                  trackId={track.id}
                  onNavigate={onNavigate}
                  isComplete={completedSet.includes(mod.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section group header ────────────────────────────────────────────────── */
function SlbSectionHeader({ title, badge, description }) {
  return (
    <div className="slb-section-header">
      <div className="slb-section-header-left">
        <h3 className="slb-section-title">{title}</h3>
        {badge && badge}
      </div>
      {description && <p className="slb-section-desc">{description}</p>}
    </div>
  );
}

/* ── Finance Skills info banner ──────────────────────────────────────────── */
function SlbFinanceSkillsBanner() {
  const { Icon } = window;
  return (
    <div className="slb-finance-banner">
      <div className="slb-finance-banner-icon">
        <Icon name="graduation-cap" size={18} color="#217346" />
      </div>
      <div className="slb-finance-banner-body">
        <div className="slb-finance-banner-title">Finance Skills Track</div>
        <div className="slb-finance-banner-text">
          Practical, employer-focused training in Excel and SQL for finance.
          This content is <strong>separate from the CIMA qualification syllabus</strong> and does not
          contribute to CIMA exam preparation. Use it to build the day-to-day tools your
          role demands.
        </div>
      </div>
    </div>
  );
}

/* ── Main Skills Lab component ───────────────────────────────────────────── */
function AIQSkillsLab({ onNavigate }) {
  const { Icon } = window;
  const [selectedTrack, setSelectedTrack] = useSlbState(null);

  const catalogue = window.AIQ_COURSE_DATA || {};
  const tracks    = (catalogue.skillsLab || {}).tracks || [];

  const store         = window.aiqStore ? window.aiqStore.get() : {};
  const paperProgress = store.paperProgress || {};

  const financeSkillsTracks = tracks.filter((t) => t.category === "finance-skills");
  const toolsTracks         = tracks.filter((t) => t.category === "tools");

  if (selectedTrack) {
    return (
      <SlbTrackDetail
        track={selectedTrack}
        onBack={() => setSelectedTrack(null)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="content">
      <div className="crs-page">

        <div className="slb-page-header">
          <div className="slb-page-icon">
            <Icon name="flask-conical" size={22} color="var(--primary)" />
          </div>
          <div>
            <h2 className="slb-page-title">Skills Lab</h2>
            <div className="slb-page-sub">
              Practical tools employers expect finance professionals to know
            </div>
          </div>
        </div>

        {/* Finance Skills Track ─────────────────────────────────────────── */}
        {financeSkillsTracks.length > 0 && (
          <div className="slb-section-group">
            <SlbSectionHeader
              title="Finance Skills Track"
              badge={<SlbNotCimaBadge />}
              description={null}
            />
            <SlbFinanceSkillsBanner />
            <div className="slb-tracks-grid">
              {financeSkillsTracks.map((track) => (
                <SlbTrackCard
                  key={track.id}
                  track={track}
                  progress={paperProgress[track.id] || 0}
                  onClick={() => setSelectedTrack(track)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Productivity Tools ──────────────────────────────────────────── */}
        {toolsTracks.length > 0 && (
          <div className="slb-section-group">
            <SlbSectionHeader
              title="Productivity Tools"
              badge={<SlbNotCimaBadge />}
              description={null}
            />
            <div className="slb-tracks-grid">
              {toolsTracks.map((track) => (
                <SlbTrackCard
                  key={track.id}
                  track={track}
                  progress={paperProgress[track.id] || 0}
                  onClick={() => setSelectedTrack(track)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Fallback: render all tracks ungrouped if categories not set */}
        {financeSkillsTracks.length === 0 && toolsTracks.length === 0 && (
          <div className="slb-tracks-grid">
            {tracks.map((track) => (
              <SlbTrackCard
                key={track.id}
                track={track}
                progress={paperProgress[track.id] || 0}
                onClick={() => setSelectedTrack(track)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

Object.assign(window, { AIQSkillsLab });
