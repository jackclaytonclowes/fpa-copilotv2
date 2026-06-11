/* AccountIQ — localStorage-backed state store with server-side sync
 *
 * Single key: "aiq_state" in localStorage (fast reads, offline-capable).
 * When a Supabase session is active, every write is also pushed to
 * PUT /api/aiq/state (debounced 1 s) so progress persists across devices.
 *
 * Consumers call aiqStore.get() / aiqStore.set(patch) / aiqStore.reset().
 * Call aiqStore.loadFromServer(token) after login to pull server state.
 */

const AIQ_KEY = "aiq_state";

const DEFAULT_STATE = {
  /* Onboarding ---------------------------------------------------------------- */
  onboardingComplete: false,
  targetPaper:        null,
  targetExamDate:     null,
  targetSitting:      null,
  weeklyHours:        null,
  confidenceLevel:    null,

  /* Derived goal -------------------------------------------------------------- */
  dailyGoalMinutes: null,

  /* Progress per paper -------------------------------------------------------- */
  paperProgress: {},

  /* Per-topic mastery --------------------------------------------------------- */
  // Shape: { "ba2-cost-behaviour": { correct: 7, total: 10, lastSeen: "ISO" } }
  topicMastery: {},

  /* Quiz history -------------------------------------------------------------- */
  quizHistory: [],

  /* Streak & XP --------------------------------------------------------------- */
  streak:          0,
  streakLastDate:  null,
  xp:              0,
  todayMinutes:    0,
  todayDate:       null,

  /* Completed lessons --------------------------------------------------------- */
  completedLessons: {},

  /* Study path ---------------------------------------------------------------- */
  studyPath: null,   // "foundation" (deep-first) | "accelerated" (revision-first)

  /* Revision progress --------------------------------------------------------- */
  revisionLessons:  {},  // { [paperId]: lessonId[] }
  revisionProgress: {},  // { [paperId]: 0–1 }

  /* Mocks --------------------------------------------------------------------- */
  mocksTaken:        0,
  questionsAnswered: 0,
  mockExamHistory:   [],
};

function deriveDailyGoal({ weeklyHours, confidenceLevel }) {
  const STUDY_DAYS_PER_WEEK = 5;
  const CONFIDENCE_MULTIPLIER = { solid: 1.0, some: 1.15, beginner: 1.3 };
  const weeklyMinutes = (weeklyHours || 1) * 60;
  const rawDaily = weeklyMinutes / STUDY_DAYS_PER_WEEK;
  const multiplier = CONFIDENCE_MULTIPLIER[confidenceLevel] || 1.0;
  const adjusted = rawDaily * multiplier;
  const clamped = Math.min(120, Math.max(15, adjusted));
  return Math.round(clamped / 5) * 5;
}

function resetTodayIfNeeded(state) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.todayDate !== today) {
    return { ...state, todayMinutes: 0, todayDate: today };
  }
  return state;
}

/* ── Server sync (debounced) ─────────────────────────────────────────────── */
let _syncTimer = null;

function _scheduleSync(state) {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => _pushToServer(state), 1000);
}

async function _pushToServer(state) {
  const token = window._aiqToken; // set by App.jsx after login
  if (!token) return;
  try {
    await fetch("/api/aiq/state", {
      method:  "PUT",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ state }),
    });
  } catch (_) { /* non-critical — localStorage is always the source of truth */ }
}

/* ── Store API --------------------------------------------------------------- */
const aiqStore = {
  get() {
    try {
      const raw    = localStorage.getItem(AIQ_KEY);
      const saved  = raw ? JSON.parse(raw) : {};
      const merged = { ...DEFAULT_STATE, ...saved };
      return resetTodayIfNeeded(merged);
    } catch {
      return { ...DEFAULT_STATE };
    }
  },

  set(patch) {
    try {
      const current = this.get();
      const next    = { ...current, ...patch };
      localStorage.setItem(AIQ_KEY, JSON.stringify(next));
      _scheduleSync(next);
      window.dispatchEvent(new CustomEvent("aiq-store-update", { detail: next }));
      return next;
    } catch {
      return this.get();
    }
  },

  reset() {
    try { localStorage.removeItem(AIQ_KEY); } catch { /* noop */ }
  },

  /* Pull server state and merge (deeper fields win server-side) */
  async loadFromServer(token) {
    window._aiqToken = token;
    try {
      const res = await fetch("/api/aiq/state", {
        headers: { "Authorization": "Bearer " + token },
      });
      if (!res.ok) return;
      const { state: serverState } = await res.json();
      if (!serverState || typeof serverState !== "object") return;

      const local  = this.get();
      // Server wins on arrays and objects; local wins on scalars when server is default
      const merged = {
        ...local,
        ...serverState,
        // Deep-merge collections — combine rather than overwrite
        completedLessons: _mergeLessons(local.completedLessons, serverState.completedLessons),
        revisionLessons:  _mergeLessons(local.revisionLessons,  serverState.revisionLessons),
        quizHistory:      _mergeHistory(local.quizHistory,  serverState.quizHistory),
        mockExamHistory:  _mergeHistory(local.mockExamHistory, serverState.mockExamHistory),
        topicMastery:     _mergeMastery(local.topicMastery, serverState.topicMastery),
        // Take the higher XP / streak from either side
        xp:     Math.max(local.xp || 0,     serverState.xp || 0),
        streak: Math.max(local.streak || 0, serverState.streak || 0),
      };

      localStorage.setItem(AIQ_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("aiq-store-update", { detail: merged }));
    } catch (_) { /* offline or not configured — localStorage remains authoritative */ }
  },

  recordActivity({ minutes = 0, xpDelta = 0 }) {
    const state     = this.get();
    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak   = state.streak;
    if      (state.streakLastDate === today)      { /* already counted */ }
    else if (state.streakLastDate === yesterday)  { newStreak = state.streak + 1; }
    else                                          { newStreak = 1; }
    return this.set({
      streak: newStreak, streakLastDate: today,
      xp: state.xp + xpDelta,
      todayMinutes: state.todayMinutes + minutes,
      todayDate: today,
    });
  },

  recordTopicResult(topicKey, correct, total) {
    const state = this.get();
    const prev  = state.topicMastery[topicKey] || { correct: 0, total: 0 };
    return this.set({
      topicMastery: {
        ...state.topicMastery,
        [topicKey]: {
          correct:  prev.correct + correct,
          total:    prev.total   + total,
          lastSeen: new Date().toISOString().slice(0, 10),
        },
      },
      questionsAnswered: state.questionsAnswered + total,
    });
  },

  markLessonComplete(paperId, lessonId, totalLessons) {
    const state = this.get();
    const prev  = state.completedLessons[paperId] || [];
    if (prev.includes(lessonId)) return state;
    const updated  = [...prev, lessonId];
    const progress = totalLessons > 0 ? Math.min(1, updated.length / totalLessons) : 0;
    this.recordActivity({ xpDelta: 100 });
    return this.set({
      completedLessons: { ...state.completedLessons, [paperId]: updated },
      paperProgress:    { ...state.paperProgress,    [paperId]: progress },
    });
  },

  markRevisionComplete(paperId, lessonId, totalLessons) {
    const state = this.get();
    const prev  = state.revisionLessons[paperId] || [];
    if (prev.includes(lessonId)) return state;
    const updated  = [...prev, lessonId];
    const progress = totalLessons > 0 ? Math.min(1, updated.length / totalLessons) : 0;
    this.recordActivity({ xpDelta: 25 });
    return this.set({
      revisionLessons:  { ...state.revisionLessons,  [paperId]: updated },
      revisionProgress: { ...state.revisionProgress, [paperId]: progress },
    });
  },

  recordQuizResult(result) {
    const state = this.get();
    return this.set({
      quizHistory: [...state.quizHistory, { ...result, date: new Date().toISOString().slice(0, 10) }],
    });
  },

  recordMockExam(result) {
    const state = this.get();
    return this.set({
      mockExamHistory: [
        ...state.mockExamHistory,
        { ...result, date: new Date().toISOString().slice(0, 10) },
      ],
      mocksTaken: state.mocksTaken + 1,
    });
  },
};

/* ── Merge helpers ─────────────────────────────────────────────────────────── */

function _mergeLessons(local = {}, server = {}) {
  const out = { ...local };
  for (const [paper, ids] of Object.entries(server)) {
    const combined = new Set([...(out[paper] || []), ...(Array.isArray(ids) ? ids : [])]);
    out[paper] = [...combined];
  }
  return out;
}

function _mergeHistory(local = [], server = []) {
  // Deduplicate by date + score + total (close enough for v1)
  const seen = new Set(local.map((r) => `${r.date}-${r.score}-${r.total}`));
  const extras = (Array.isArray(server) ? server : []).filter(
    (r) => !seen.has(`${r.date}-${r.score}-${r.total}`)
  );
  return [...local, ...extras];
}

function _mergeMastery(local = {}, server = {}) {
  const out = { ...local };
  for (const [topic, s] of Object.entries(server)) {
    const l = out[topic] || { correct: 0, total: 0 };
    out[topic] = {
      correct:  Math.max(l.correct || 0, s.correct || 0),
      total:    Math.max(l.total   || 0, s.total   || 0),
      lastSeen: s.lastSeen || l.lastSeen,
    };
  }
  return out;
}

window.aiqStore        = aiqStore;
window.deriveDailyGoal = deriveDailyGoal;
