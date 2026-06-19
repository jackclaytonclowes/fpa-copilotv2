/* MonthEndIQ — Q&A Copilot  (localStorage-persisted chat history)
 *
 * Storage design:
 *   Primary key:  monthendiq_chat_f_<encoded-filename>   (stable across session IDs)
 *   Legacy key:   monthendiq_chat_<sessionId>            (migrated on first load)
 *
 *   Keying by filename (not sessionId) means chat history survives backend
 *   restarts (Render free tier) and re-uploads of the same file — the session
 *   ID changes but the filename key stays the same.
 *
 * Lifecycle:
 *   LOAD  — useState lazy initialiser reads localStorage on every mount.
 *            Tries the filename key first; if empty, checks the legacy session
 *            key and migrates it across.
 *
 *   SAVE  — useEffect([msgs]) writes after every message update (filename key).
 *            Also fires a best-effort POST /api/chat/{sessionId} for in-session
 *            server persistence (silent failure — localStorage is the source of truth).
 *
 *   CLEAR — clearChat() removes both keys and resets to the welcome message.
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
const CHAT_KEY_BY_FILE    = (name) => `monthendiq_chat_f_${encodeURIComponent((name || "").trim())}`;
const CHAT_KEY_BY_SESSION = (sid)  => `monthendiq_chat_${sid}`;  // legacy

function _tryReadKey(key) {
  try {
    const raw = key && localStorage.getItem(key);
    if (!raw) return null;
    const turns = JSON.parse(raw);
    return Array.isArray(turns) ? turns : null;
  } catch { return null; }
}

function chatLoad(sessionId, fileName) {
  const fileKey    = fileName ? CHAT_KEY_BY_FILE(fileName) : null;
  const sessionKey = CHAT_KEY_BY_SESSION(sessionId);

  // Prefer filename-keyed (stable across sessions)
  const fromFile = fileKey ? _tryReadKey(fileKey) : null;
  if (fromFile && fromFile.length > 0) {
    console.log("[Chat] LOAD  file-key  turns=" + fromFile.length);
    return fromFile;
  }

  // Fall back to legacy session key and migrate
  const fromSession = _tryReadKey(sessionKey);
  if (fromSession && fromSession.length > 0) {
    console.log("[Chat] LOAD  legacy session-key  turns=" + fromSession.length + "  migrating…");
    if (fileKey) {
      try { localStorage.setItem(fileKey, JSON.stringify(fromSession)); } catch {}
    }
    try { localStorage.removeItem(sessionKey); } catch {}
    return fromSession;
  }

  console.log("[Chat] LOAD  empty (no history)");
  return [];
}

function chatSave(sessionId, fileName, msgs) {
  const turns = msgs.slice(1);  // index 0 is always the welcome message — never stored
  const key   = fileName ? CHAT_KEY_BY_FILE(fileName) : CHAT_KEY_BY_SESSION(sessionId);
  try {
    localStorage.setItem(key, JSON.stringify(turns));
    console.log("[Chat] SAVE  key=" + key + "  turns=" + turns.length);
  } catch (err) {
    console.warn("[Chat] SAVE  failed (quota?):", err);
  }
}

function chatClear(sessionId, fileName) {
  try {
    if (fileName) localStorage.removeItem(CHAT_KEY_BY_FILE(fileName));
    localStorage.removeItem(CHAT_KEY_BY_SESSION(sessionId));
    console.log("[Chat] CLEAR");
  } catch {}
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
function QnaCopilot({ sessionId, fileName, period, periodMode, selectedPeriod, analysisType, prefillQuestion, onPrefillConsumed }) {
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
    console.log("[Chat] MOUNT sessionId=" + sessionId + " fileName=" + fileName);
    const saved = chatLoad(sessionId, fileName);
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
    chatSave(sessionId, fileName, msgs);
  }, [msgs, sessionId]);

  /* Scroll to bottom after each message */
  useEffectQna(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  /* ── Clear chat ──────────────────────────────────────────────────────── */
  const clearChat = () => {
    chatClear(sessionId, fileName);
    setMsgs([makeWelcome(period?.label)]);
    // Clear server-side history too (best-effort)
    fetch(apiUrl("/api/chat/" + sessionId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turns: [] }),
    }).catch(() => {});
  };

  /* ── Markdown → HTML (applied once stream is complete) ──────────────── */
  const mdToHtml = (raw) =>
    raw
      .replace(/\*\*(.+?)\*\*/gs, "<b>$1</b>")
      .replace(/\*(.+?)\*/gs,     "<i>$1</i>")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g,   "<br>");

  /* ── Send question (streaming via SSE) ──────────────────────────────── */
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

    /* Add an empty streaming placeholder immediately */
    setMsgs((m) => [...m, { who: "ai", html: "", streaming: true }]);

    try {
      const res = await fetch(apiUrl("/api/ask-stream/" + sessionId), {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          question: q,
          period:   period?.label || null,
          mode:     periodMode    || "monthly",
          history,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", rawText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const { delta } = JSON.parse(raw);
            if (delta) {
              rawText += delta;
              const partialHtml = rawText
                .replace(/\n\n/g, "<br><br>")
                .replace(/\n/g,   "<br>");
              setMsgs((m) => {
                const next = [...m];
                next[next.length - 1] = { who: "ai", html: partialHtml, streaming: true };
                return next;
              });
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      /* Apply full markdown conversion once stream ends */
      const finalHtml = mdToHtml(rawText) ||
        "I couldn't generate an answer — please try again.";
      const aiMsg = { who: "ai", html: finalHtml, streaming: false };
      setMsgs((m) => {
        const next = [...m];
        next[next.length - 1] = aiMsg;
        return next;
      });

      /* Best-effort server sync */
      const allTurns = [...msgs.slice(1), { who: "user", html: q }, aiMsg];
      fetch(apiUrl("/api/chat/" + sessionId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns: allTurns }),
      }).catch(() => {});
    } catch {
      setMsgs((m) => {
        const next = [...m];
        next[next.length - 1] = {
          who: "ai",
          html: "Sorry, there was a network error. Please check the server is running and try again.",
          streaming: false,
        };
        return next;
      });
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
    <div className="content-inner" style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
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
          {msgs.map((m, i) => {
            const isLiveStream = m.streaming && i === msgs.length - 1;
            return (
              <div key={i} className={"msg " + m.who}>
                <div className="av">
                  {m.who === "ai" ? <Icon name="sparkles" size={16} /> : "FP"}
                </div>
                <div
                  className="bubble"
                  dangerouslySetInnerHTML={{
                    __html: m.html + (isLiveStream
                      ? '<span class="stream-cursor">▍</span>'
                      : ""),
                  }}
                />
              </div>
            );
          })}

          {/* Spinner only shown while waiting for the first token */}
          {loading && !msgs[msgs.length - 1]?.streaming && (
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
