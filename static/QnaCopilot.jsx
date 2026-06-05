/* MonthEndIQ — Q&A Copilot  (localStorage-persisted chat history)
 *
 * Storage design:
 *   Key:   monthendiq_chat_<sessionId>   (one key per uploaded analysis)
 *   Value: JSON array of {who, html} objects  (conversation turns only, no welcome msg)
 *
 * Lifecycle:
 *   LOAD  — useState lazy initialiser reads localStorage on every mount.
 *            This fires once per component instance, before the first render.
 *            Because QnaCopilot fully unmounts on navigation (App.jsx renders it
 *            conditionally), the lazy init reliably reloads history on return.
 *
 *   SAVE  — useEffect([msgs]) writes after every message update.
 *            Only writes; never deletes unless the user explicitly clears.
 *
 *   CLEAR — clearChat() deletes the key and resets to the welcome message.
 *
 *   NEW SESSION — when sessionId changes (new file uploaded), the key changes,
 *            so the new session starts with empty history automatically.
 *
 * Previous bug (now fixed):
 *   A redundant useEffect([sessionId]) was also calling setMsgs on every mount.
 *   Combined with saveTurns() auto-deleting when turns.length === 0, this could
 *   race with the lazy init and permanently delete stored history.
 *   Both causes are removed: the redundant effect and the auto-delete.
 */
const { useState: useStateQna, useRef: useRefQna, useEffect: useEffectQna } = React;

/* ── Suggested questions ─────────────────────────────────────────────────── */
const SUGGESTIONS_MOM = [
  "Why did operating profit change this month?",
  "What were the largest positive profit drivers?",
  "What were the largest negative profit drivers?",
  "Which revenue accounts moved the most?",
  "Which cost categories changed the most?",
  "Summarise this month for a Finance Director.",
  "What should I investigate further?",
];

const SUGGESTIONS_BVA = [
  "Why did profit differ from budget?",
  "Which areas are most over budget?",
  "What were the largest favourable budget variances?",
  "What were the largest adverse budget variances?",
  "Which cost categories exceeded budget?",
  "Summarise budget performance for a Finance Director.",
  "What should I investigate first?",
];

/* ── Storage helpers ─────────────────────────────────────────────────────── */
const CHAT_STORAGE_KEY = (sid) => `monthendiq_chat_${sid}`;

function chatLoad(sessionId) {
  const key = CHAT_STORAGE_KEY(sessionId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      console.log("[MonthEndIQ Chat] LOAD  key=" + key + "  result=empty (no history)");
      return [];
    }
    const turns = JSON.parse(raw);
    console.log("[MonthEndIQ Chat] LOAD  key=" + key + "  result=" + turns.length + " turns restored");
    return Array.isArray(turns) ? turns : [];
  } catch (err) {
    console.warn("[MonthEndIQ Chat] LOAD  key=" + key + "  parse error:", err);
    return [];
  }
}

function chatSave(sessionId, msgs) {
  const key  = CHAT_STORAGE_KEY(sessionId);
  const turns = msgs.slice(1);   // index 0 is always the welcome message — never stored
  try {
    // Always write; never auto-delete (deletion is only ever done by clearChat)
    localStorage.setItem(key, JSON.stringify(turns));
    console.log("[MonthEndIQ Chat] SAVE  key=" + key + "  turns=" + turns.length);
  } catch (err) {
    console.warn("[MonthEndIQ Chat] SAVE  key=" + key + "  failed (quota?):", err);
  }
}

function chatClear(sessionId) {
  const key = CHAT_STORAGE_KEY(sessionId);
  try {
    localStorage.removeItem(key);
    console.log("[MonthEndIQ Chat] CLEAR key=" + key);
  } catch (err) {
    console.warn("[MonthEndIQ Chat] CLEAR key=" + key + "  failed:", err);
  }
}

/* ── Misc helpers ────────────────────────────────────────────────────────── */
function stripHtml(html) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}

function makeWelcome(periodLabel) {
  return {
    who: "ai",
    html:
      "Ask me anything about <b>" + (periodLabel || "your P&L") + "</b>. " +
      "I can explain what drove profit changes, identify cost pressures, " +
      "highlight revenue movements, or draft board-ready commentary — " +
      "all based on the data currently loaded.",
  };
}

/* ── Component ───────────────────────────────────────────────────────────── */
function QnaCopilot({ sessionId, period, periodMode, selectedPeriod, analysisType, prefillQuestion, onPrefillConsumed }) {
  const { Icon } = window;

  /*
   * LOAD on mount — lazy useState initialiser.
   *
   * React calls this function exactly once per component instance, synchronously,
   * before the first render. Because QnaCopilot is conditionally rendered in App
   * (it unmounts when the user navigates away), this runs fresh on every return,
   * reliably reading whatever was saved to localStorage.
   *
   * NOTE: There is intentionally NO useEffect([sessionId]) that also calls setMsgs.
   * That pattern (present in the previous version) caused a second setMsgs call on
   * every mount which, combined with the saveTurns auto-delete, could wipe history.
   */
  const [msgs, setMsgs] = useStateQna(() => {
    console.log("[MonthEndIQ Chat] MOUNT sessionId=" + sessionId);
    const saved = chatLoad(sessionId);
    return [makeWelcome(period?.label), ...saved];
  });

  const [text, setText]       = useStateQna("");
  const [loading, setLoading] = useStateQna(false);
  const scrollRef             = useRefQna(null);
  const mountedRef            = useRefQna(false);

  /*
   * SAVE on every message update — but skip the very first render.
   * On mount, msgs is initialised from localStorage (via the lazy init above).
   * Saving immediately would write that same data back (harmless) OR, if the
   * session was just restored and the component mounts with only the welcome
   * message before chat loads, would overwrite real history with [].
   * After the first render, every change is user-driven and should be saved.
   */
  useEffectQna(() => {
    if (!sessionId) return;
    if (!mountedRef.current) { mountedRef.current = true; return; }
    chatSave(sessionId, msgs);
  }, [msgs, sessionId]);

  /* Scroll to bottom after each message */
  useEffectQna(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  /* ── Clear chat ──────────────────────────────────────────────────────── */
  const clearChat = () => {
    chatClear(sessionId);
    setMsgs([makeWelcome(period?.label)]);
  };

  /* ── Send question ───────────────────────────────────────────────────── */
  const ask = async (q) => {
    if (!q.trim() || loading) return;
    setMsgs((m) => [...m, { who: "user", html: q }]);
    setText("");
    setLoading(true);

    /* Last 6 exchanges (12 messages) as AI context; skip welcome message */
    const history = msgs
      .slice(1)
      .slice(-12)
      .map((m) => ({
        role:    m.who === "user" ? "user" : "assistant",
        content: m.who === "user" ? m.html : stripHtml(m.html),
      }));

    try {
      const res = await fetch("/api/ask/" + sessionId, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          question: q,
          period:   period?.label || null,
          mode:     periodMode    || "monthly",
          history,
        }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        { who: "ai", html: data.answer || "I couldn't generate an answer. Please try again." },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        { who: "ai", html: "Sorry, there was a network error. Please check the server is running and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffectQna(() => {
    if (prefillQuestion) {
      ask(prefillQuestion);
      onPrefillConsumed && onPrefillConsumed();
    }
  }, [prefillQuestion]);

  const hasHistory = msgs.length > 1;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="content-inner" style={{ height: "calc(100vh - 62px)", display: "flex", flexDirection: "column" }}>
      <div className="qna" style={{ flex: 1 }}>

        {/* Clear chat — only visible once conversation has started */}
        {hasHistory && (
          <div style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            padding: "8px 4px 6px",
            borderBottom: "1px solid var(--border)",
          }}>
            <button
              onClick={clearChat}
              disabled={loading}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                font: "var(--text-body-strong)", fontSize: 12,
                color: "var(--fg-3)", background: "transparent", border: "none",
                cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-sm)",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseOut ={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}
              title="Clear conversation — history will be deleted from this browser"
            >
              <Icon name="trash-2" size={13} />
              Clear chat
            </button>
          </div>
        )}

        {/* Message thread */}
        <div className="qna-scroll" ref={scrollRef}>
          {msgs.map((m, i) => (
            <div key={i} className={"msg " + m.who}>
              <div className="av">
                {m.who === "ai" ? <Icon name="sparkles" size={16} /> : "FP"}
              </div>
              <div className="bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
            </div>
          ))}

          {loading && (
            <div className="msg ai">
              <div className="av"><Icon name="sparkles" size={16} /></div>
              <div className="bubble" style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--fg-3)" }}>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                Analysing your P&amp;L…
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        <div className="qna-suggest">
          {(analysisType === "budget_vs_actual" ? SUGGESTIONS_BVA : SUGGESTIONS_MOM).map((s) => (
            <button key={s} className="suggest" onClick={() => ask(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="composer">
          <input
            value={text}
            placeholder="Ask MonthEndIQ about your P&amp;L…"
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
Object.assign(window, { QnaCopilot });
