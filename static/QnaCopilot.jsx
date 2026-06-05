/* FP&A Copilot — Q&A Copilot (OpenAI-powered) */
const { useState: useStateQna, useRef: useRefQna, useEffect: useEffectQna } = React;

const SUGGESTIONS = [
  "Why did operating profit change this month?",
  "What were the largest positive profit drivers?",
  "What were the largest negative profit drivers?",
  "Which revenue accounts moved the most?",
  "Which cost categories changed the most?",
  "Summarise this month for a Finance Director.",
  "What should I investigate further?",
];

/* Strip HTML tags — used to sanitise AI answers before sending as history */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function QnaCopilot({ sessionId, period, periodMode, selectedPeriod }) {
  const { Icon } = window;

  const [msgs, setMsgs] = useStateQna([
    {
      who: "ai",
      html:
        `Ask me anything about <b>${period?.label || "your P&L"}</b>. ` +
        "I can explain what drove profit changes, identify cost pressures, " +
        "highlight revenue movements, or draft board-ready commentary — " +
        "all based on the data currently loaded.",
    },
  ]);
  const [text, setText] = useStateQna("");
  const [loading, setLoading] = useStateQna(false);
  const scrollRef = useRefQna(null);

  useEffectQna(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const ask = async (q) => {
    if (!q.trim() || loading) return;
    setMsgs((m) => [...m, { who: "user", html: q }]);
    setText("");
    setLoading(true);

    /* Build conversation history for multi-turn context.
       Skip the initial greeting (index 0).
       Last 6 exchanges = 12 messages. Strip HTML from AI answers. */
    const history = msgs
      .slice(1)           // drop welcome message
      .slice(-12)
      .map((m) => ({
        role:    m.who === "user" ? "user" : "assistant",
        content: m.who === "user" ? m.html : stripHtml(m.html),
      }));

    try {
      const res = await fetch(`/api/ask/${sessionId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          question: q,
          period:   period?.label   || null,
          mode:     periodMode      || "monthly",
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

  return (
    <div className="content-inner" style={{ height: "calc(100vh - 62px)", display: "flex", flexDirection: "column" }}>
      <div className="qna" style={{ flex: 1 }}>

        {/* Message thread */}
        <div className="qna-scroll" ref={scrollRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.who}`}>
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
                Analysing your P&L…
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        <div className="qna-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggest" onClick={() => ask(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="composer">
          <input
            value={text}
            placeholder="Ask MonthEndIQ about your P&L…"
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
