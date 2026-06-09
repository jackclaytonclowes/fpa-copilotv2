/* AccountIQ — localStorage-backed state store
 *
 * Single key: "aiq_state"
 * Shape documented below in DEFAULT_STATE.
 *
 * All writes are fire-and-forget; quota failures are silently swallowed.
 * Consumers call aiqStore.get() / aiqStore.set(patch) / aiqStore.reset().
 * TODO: replace localStorage persistence with real API writes when backend
 *       user-progress endpoints are available.
 */

const AIQ_KEY = "aiq_state";

const DEFAULT_STATE = {
  /* Onboarding ---------------------------------------------------------------- */
  onboardingComplete: false,  // true once the study-plan flow is finished
  targetPaper: null,          // e.g. "ba2" — the paper the user is actively targeting
  targetExamDate: null,       // ISO date string "YYYY-MM-DD"
  targetSitting: null,        // e.g. "November 2026"
  weeklyHours: null,          // number — hours per week user committed to
  confidenceLevel: null,      // "beginner" | "some" | "solid"

  /* Derived goal (written by onboarding, readable by dashboard) --------------- */
  dailyGoalMinutes: null,     // derived — see deriveDailyGoal() below

  /* Progress per paper -------------------------------------------------------- */
  // Shape: { ba1: 0.78, ba2: 0.42, ba3: 0, ba4: 0, e1: 0, p1: 0, f1: 0 }
  // TODO: replace with real API data from /api/user/progress
  paperProgress: {},

  /* Per-topic mastery --------------------------------------------------------- */
  // Shape: { "ba2-cost-behaviour": { correct: 7, total: 10, lastSeen: "ISO" } }
  // TODO: replace with real API data from /api/user/mastery
  topicMastery: {},

  /* Quiz history -------------------------------------------------------------- */
  // Array of { quizId, paperId, score, total, pct, topicBreakdown, date }
  // TODO: replace with real API data from /api/user/quiz-history
  quizHistory: [],

  /* Streak & XP --------------------------------------------------------------- */
  streak: 0,           // days
  streakLastDate: null, // ISO date — last day study activity was recorded
  xp: 0,               // total XP earned
  todayMinutes: 0,     // minutes studied today (resets at midnight)
  todayDate: null,      // ISO date — which day todayMinutes belongs to

  /* Completed lessons --------------------------------------------------------- */
  // Shape: { ba2: ["ba2-l1", "ba2-l2"], excel: ["excel-l1", ...] }
  // Drives paperProgress — written by markLessonComplete()
  completedLessons: {},

  /* Mocks --------------------------------------------------------------------- */
  // TODO: replace with real API data
  mocksTaken: 0,
  questionsAnswered: 0,

  /* Mock exam history --------------------------------------------------------- */
  // Array of { id, paperId, date, score, total, pct, topicBreakdown, durationSeconds, passed }
  mockExamHistory: [],
};

/* ── deriveDailyGoal ---------------------------------------------------------
 * Given onboarding inputs, derive a recommended daily study goal in minutes.
 *
 * Logic:
 *   1. Convert weeklyHours → weekly minutes.
 *   2. Distribute over 5 study days (assume weekends optional).
 *   3. Apply a confidence multiplier:
 *        solid     → 1.0  (no adjustment — student is efficient)
 *        some      → 1.15 (15% buffer for review time)
 *        beginner  → 1.3  (30% buffer for slower initial progress)
 *   4. Clamp to [15, 120] minutes — below 15 min is too short to be effective;
 *      above 120 min risks burnout for self-study alongside work.
 *   5. Round to nearest 5 minutes for a clean display value.
 * --------------------------------------------------------------------------- */
function deriveDailyGoal({ weeklyHours, confidenceLevel }) {
  const STUDY_DAYS_PER_WEEK = 5;
  const CONFIDENCE_MULTIPLIER = {
    solid:    1.0,
    some:     1.15,
    beginner: 1.3,
  };
  const weeklyMinutes = (weeklyHours || 1) * 60;
  const rawDaily = weeklyMinutes / STUDY_DAYS_PER_WEEK;
  const multiplier = CONFIDENCE_MULTIPLIER[confidenceLevel] || 1.0;
  const adjusted = rawDaily * multiplier;
  const clamped = Math.min(120, Math.max(15, adjusted));
  return Math.round(clamped / 5) * 5;
}

/* ── resetTodayIfNeeded ------------------------------------------------------
 * Resets todayMinutes to 0 when the stored todayDate is before today.
 * --------------------------------------------------------------------------- */
function resetTodayIfNeeded(state) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.todayDate !== today) {
    return { ...state, todayMinutes: 0, todayDate: today };
  }
  return state;
}

/* ── Store API --------------------------------------------------------------- */
const aiqStore = {
  get() {
    try {
      const raw = localStorage.getItem(AIQ_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      const merged = { ...DEFAULT_STATE, ...saved };
      return resetTodayIfNeeded(merged);
    } catch {
      return { ...DEFAULT_STATE };
    }
  },

  set(patch) {
    try {
      const current = this.get();
      const next = { ...current, ...patch };
      localStorage.setItem(AIQ_KEY, JSON.stringify(next));
      // Notify any subscriber (e.g. App.jsx TopBar) that state changed
      window.dispatchEvent(new CustomEvent("aiq-store-update", { detail: next }));
      return next;
    } catch {
      /* localStorage quota — non-critical */
      return this.get();
    }
  },

  reset() {
    try { localStorage.removeItem(AIQ_KEY); } catch { /* noop */ }
  },

  /* Convenience: add XP and record study minutes; handles streak logic */
  recordActivity({ minutes = 0, xpDelta = 0 }) {
    const state = this.get();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let newStreak = state.streak;
    if (state.streakLastDate === today) {
      // already counted today — no streak change
    } else if (state.streakLastDate === yesterday) {
      newStreak = state.streak + 1;
    } else {
      newStreak = 1; // streak broken — restart
    }

    return this.set({
      streak: newStreak,
      streakLastDate: today,
      xp: state.xp + xpDelta,
      todayMinutes: state.todayMinutes + minutes,
      todayDate: today,
    });
  },

  /* Convenience: update per-topic mastery after a quiz */
  recordTopicResult(topicKey, correct, total) {
    const state = this.get();
    const prev = state.topicMastery[topicKey] || { correct: 0, total: 0 };
    return this.set({
      topicMastery: {
        ...state.topicMastery,
        [topicKey]: {
          correct: prev.correct + correct,
          total:   prev.total  + total,
          lastSeen: new Date().toISOString().slice(0, 10),
        },
      },
      questionsAnswered: state.questionsAnswered + total,
    });
  },

  /* Convenience: mark a lesson as complete; recalculates paperProgress */
  markLessonComplete(paperId, lessonId, totalLessons) {
    const state = this.get();
    const prev = state.completedLessons[paperId] || [];
    if (prev.includes(lessonId)) return state; // idempotent
    const updated  = [...prev, lessonId];
    const progress = totalLessons > 0 ? Math.min(1, updated.length / totalLessons) : 0;
    return this.set({
      completedLessons: { ...state.completedLessons, [paperId]: updated },
      paperProgress:    { ...state.paperProgress,    [paperId]: progress },
    });
  },

  /* Convenience: save a completed quiz result */
  recordQuizResult(result) {
    const state = this.get();
    return this.set({
      quizHistory: [...state.quizHistory, { ...result, date: new Date().toISOString().slice(0, 10) }],
    });
  },

  /* Convenience: save a completed mock exam result */
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

/* Expose deriveDailyGoal for use by the onboarding component */
window.aiqStore = aiqStore;
window.deriveDailyGoal = deriveDailyGoal;
