/* AccountIQ — Study Tutor (Item 4)
 *
 * Chat interface for CIMA Certificate study questions.
 * Four suggested prompt chips pre-wired.
 * Scope note prominently displayed.
 * Lesson links injected when a relevant lesson is detected in the reply.
 * Fallback message shown when confidence is low.
 *
 * API: calls /api/aiq/tutor (POST) with { question, history, context }.
 * TODO: create /api/aiq/tutor endpoint in api.py with a CIMA-scoped system prompt.
 *       Until the endpoint exists, all responses use the stub fallback below.
 */
const { useState: useTtrState, useRef: useTtrRef, useEffect: useTtrEffect } = React;

const AIQ_TUTOR_KEY = "aiq_tutor_chat";

const SUGGESTED_PROMPTS = [
  { id: "sp1", text: "Explain my weakest topic",       icon: "bar-chart-2" },
  { id: "sp2", text: "Quiz me on BA2 variances",        icon: "help-circle" },
  { id: "sp3", text: "Explain why my answer was wrong", icon: "alert-circle" },
  { id: "sp4", text: "Build a 20-minute revision plan", icon: "clock" },
];

const SCOPE_NOTE =
  "This tutor covers the CIMA Certificate syllabus. For complex technical queries, refer to your study texts.";

const FALLBACK_MSG =
  "I'm not certain — please check your official CIMA study materials for authoritative guidance on this.";

/* Lesson catalogue flat map: { topicKeyword: { paperId, lessonId, title } } */
function buildLessonIndex() {
  const catalogue = window.AIQ_COURSE_DATA || {};
  const index = {};
  (catalogue.papers || []).forEach((paper) => {
    (paper.lessons || []).forEach((lesson) => {
      // Index by lowercased title words and topic
      const words = `${lesson.title} ${lesson.topic}`.toLowerCase().split(/\W+/);
      words.forEach((w) => {
        if (w.length >= 4) {
          index[w] = { paperId: paper.id, lessonId: lesson.id, title: lesson.title, paperTitle: paper.title };
        }
      });
    });
  });
  return index;
}

function findRelatedLesson(text) {
  const index = buildLessonIndex();
  const words = text.toLowerCase().split(/\W+/);
  for (const w of words) {
    if (index[w]) return index[w];
  }
  return null;
}

/* ── Storage helpers ─────────────────────────────────────────────────────── */
function ttrLoad() {
  try {
    const raw = localStorage.getItem(AIQ_TUTOR_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function ttrSave(turns) {
  try { localStorage.setItem(AIQ_TUTOR_KEY, JSON.stringify(turns.slice(-40))); } catch { /* noop */ }
}
function ttrClear() {
  try { localStorage.removeItem(AIQ_TUTOR_KEY); } catch { /* noop */ }
}

/* ── Weak-topic prompt builder ───────────────────────────────────────────── */
function buildWeakTopicPrompt() {
  const state = window.aiqStore ? window.aiqStore.get() : {};
  const mastery = state.topicMastery || {};
  const entries = Object.entries(mastery)
    .map(([k, v]) => ({ key: k, pct: v.total > 0 ? (v.correct / v.total) * 100 : 0 }))
    .sort((a, b) => a.pct - b.pct);
  if (!entries.length) return "Explain my weakest topic";
  const weakest = entries[0].key.replace(/-/g, " ");
  return `Explain my weakest topic: ${weakest}`;
}

/* ── Message renderer ────────────────────────────────────────────────────── */
function TtrMsg({ msg, onNavigate }) {
  const { Icon } = window;
  const isUser = msg.who === "user";

  /* Detect a lesson link payload */
  const lesson = msg.lessonRef || null;

  return (
    <div className={`msg ${isUser ? "user" : "ai"}`}>
      <div className="av">
        {isUser ? "IQ" : <Icon name="sparkles" size={16} />}
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 8, minWidth: 0, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div className="bubble" dangerouslySetInnerHTML={{ __html: msg.html }} />
        {lesson && !isUser && (
          <button
            className="ttr-lesson-link"
            onClick={() => onNavigate && onNavigate("lessons", { paperId: lesson.paperId, lessonId: lesson.lessonId })}
          >
            <Icon name="book-open" size={13} color="var(--primary)" />
            {lesson.paperTitle} — {lesson.title}
            <Icon name="arrow-right" size={12} color="var(--primary)" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Tutor component ────────────────────────────────────────────────── */
function AIQTutor({ onNavigate }) {
  const { Icon, Button } = window;

  const [msgs, setMsgs] = useTtrState(() => {
    const saved = ttrLoad();
    return [
      {
        who: "ai",
        html:
          "Hi! I'm your AccountIQ study tutor. Ask me anything about the " +
          "<strong>CIMA Certificate syllabus</strong> — I can explain concepts, " +
          "work through examples, and help you revise. Use the quick prompts below " +
          "to get started.",
      },
      ...saved,
    ];
  });

  const [text, setText]       = useTtrState("");
  const [loading, setLoading] = useTtrState(false);
  const scrollRef             = useTtrRef(null);
  const mountedRef            = useTtrRef(false);

  /* Save on message change, skip first render */
  useTtrEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    ttrSave(msgs.slice(1)); // skip welcome msg
  }, [msgs]);

  useTtrEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const clearChat = () => {
    ttrClear();
    setMsgs([msgs[0]]); // keep welcome message
  };

  const ask = async (q) => {
    if (!q.trim() || loading) return;
    setMsgs((m) => [...m, { who: "user", html: q }]);
    setText("");
    setLoading(true);

    /* Build history for context (last 8 turns) */
    const history = msgs.slice(1).slice(-8).map((m) => ({
      role:    m.who === "user" ? "user" : "assistant",
      content: m.html.replace(/<[^>]+>/g, ""),
    }));

    /* Enrich prompt with weak-topic context if relevant */
    const store   = window.aiqStore ? window.aiqStore.get() : {};
    const context = {
      targetPaper:    store.targetPaper    || null,
      targetSitting:  store.targetSitting  || null,
      weeklyHours:    store.weeklyHours    || null,
      topicMastery:   store.topicMastery   || {},
    };

    try {
      /* TODO: create /api/aiq/tutor endpoint — this stub will fail until it exists */
      const res = await fetch("/api/aiq/tutor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: q, history, context }),
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const answerText = data.answer || FALLBACK_MSG;

      /* Detect lesson reference */
      const lessonRef = findRelatedLesson(answerText);

      setMsgs((m) => [...m, { who: "ai", html: answerText, lessonRef }]);
    } catch {
      /* Endpoint not yet available — show informative fallback */
      setMsgs((m) => [
        ...m,
        {
          who: "ai",
          html: FALLBACK_MSG + " <em>(Tutor API not yet connected — see setup notes.)</em>",
          lessonRef: findRelatedLesson(q),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hasHistory = msgs.length > 1;

  /* Build "Explain my weakest topic" dynamically */
  const prompts = SUGGESTED_PROMPTS.map((p) =>
    p.id === "sp1" ? { ...p, text: buildWeakTopicPrompt() } : p
  );

  return (
    <div className="content-inner" style={{ height: "calc(100vh - 62px)", display: "flex", flexDirection: "column" }}>
      <div className="qna" style={{ flex: 1 }}>

        {/* Scope note */}
        <div className="ttr-scope-note">
          <Icon name="info" size={14} color="var(--primary)" />
          {SCOPE_NOTE}
        </div>

        {/* Clear chat */}
        {hasHistory && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 4px 4px", borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={clearChat}
              disabled={loading}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                font: "var(--text-body-strong)", fontSize: 12, color: "var(--fg-3)",
                background: "transparent", border: "none", cursor: "pointer",
                padding: "4px 8px", borderRadius: "var(--radius-sm)",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseOut ={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}
            >
              <Icon name="trash-2" size={13} /> Clear chat
            </button>
          </div>
        )}

        {/* Message thread */}
        <div className="qna-scroll" ref={scrollRef}>
          {msgs.map((m, i) => (
            <TtrMsg key={i} msg={m} onNavigate={onNavigate} />
          ))}
          {loading && (
            <div className="msg ai">
              <div className="av"><Icon name="sparkles" size={16} /></div>
              <div className="bubble" style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--fg-3)" }}>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="qna-suggest">
          {prompts.map((p) => (
            <button
              key={p.id}
              className="suggest"
              onClick={() => ask(p.text)}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Icon name={p.icon} size={12} />
              {p.text}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="composer">
          <input
            value={text}
            placeholder="Ask about the CIMA Certificate syllabus…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(text); }
            }}
            disabled={loading}
          />
          <button className="send" onClick={() => ask(text)} disabled={loading || !text.trim()}>
            <Icon name="arrow-up" size={18} color="#fff" />
          </button>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { AIQTutor });
