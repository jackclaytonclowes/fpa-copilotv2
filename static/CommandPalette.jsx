/* MonthEndIQ — ⌘K Command Palette
 *
 * Opens on Ctrl+K / Cmd+K (wired from App.jsx via window.__openPalette).
 * Closes on Escape or click outside.
 *
 * Command sources:
 *   static  — navigation, tools, preferences (always available)
 *   dynamic — account-level actions built from current movements data
 *   ai      — any typed text can be sent directly to Q&A Copilot
 *
 * Keyboard: ↑↓ to navigate, Enter to execute, Escape to close.
 */
const { useState: useStatePal, useEffect: useEffectPal, useRef: useRefPal, useMemo: useMemoMemo } = React;

function CommandPalette({ onNav, hasData, movements, onAsk, onExport, onThemeToggle }) {
  const { Icon } = window;
  const [open,  setOpen]  = useStatePal(false);
  const [query, setQuery] = useStatePal("");
  const [cursor, setCursor] = useStatePal(0);
  const inputRef = useRefPal(null);
  const listRef  = useRefPal(null);

  /* ── Register global open hook ── */
  useEffectPal(() => {
    window.__openPalette = () => { setOpen(true); setQuery(""); setCursor(0); };
    return () => { delete window.__openPalette; };
  }, []);

  /* ── Global keyboard listener for ⌘K / Ctrl+K ── */
  useEffectPal(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Focus input when opened ── */
  useEffectPal(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  /* ── Build command list ── */
  const VIEWS = [
    { id: "dashboard", icon: "layout-dashboard", label: "Dashboard",         group: "Navigate" },
    { id: "copilot",   icon: "sparkles",          label: "AI Analyst",        group: "Navigate" },
    { id: "movements", icon: "list-tree",          label: "Movements",         group: "Navigate" },
    { id: "reports",   icon: "file-bar-chart",     label: "Reports",           group: "Navigate" },
    { id: "scenarios", icon: "sliders-horizontal", label: "Scenario Analysis", group: "Navigate" },
    { id: "portfolio", icon: "briefcase",          label: "Client Portfolio",  group: "Navigate" },
    { id: "data",      icon: "database",           label: "Data & Connections",group: "Navigate" },
    { id: "settings",  icon: "settings",           label: "Settings",          group: "Navigate" },
  ];

  const TOOLS = [
    {
      icon: "download", label: "Export management pack", group: "Actions",
      action: () => { onExport && onExport(); close(); },
    },
    {
      icon: "moon", label: "Toggle dark / light mode", group: "Actions",
      action: () => { onThemeToggle && onThemeToggle(); close(); },
    },
  ];

  const accountCmds = useMemoMemo(() => {
    if (!hasData || !movements) return [];
    return (movements || []).slice(0, 30).map((m) => ({
      icon: m.is_fav ? "trending-up" : "trending-down",
      label: `Analyse: ${m.account}`,
      sub: `${m.category} · ${m.variance != null ? window.fmtCurrency(m.variance, { signed: true }) : ""}`,
      group: "Accounts",
      action: () => {
        const q = `Explain the variance for ${m.account} (${m.category}, ${m.is_fav ? "favourable" : "adverse"}).`;
        onAsk && onAsk(q);
        close();
      },
      iconColor: m.is_fav ? "var(--favourable)" : "var(--adverse)",
    }));
  }, [hasData, movements]);

  const staticCmds = useMemoMemo(() => [
    ...VIEWS
      .filter((v) => hasData || ["data", "portfolio", "settings"].includes(v.id))
      .map((v) => ({
        icon: v.icon,
        label: `Go to ${v.label}`,
        group: v.group,
        action: () => { onNav && onNav(v.id); close(); },
      })),
    ...TOOLS,
    ...(hasData ? [
      {
        icon: "sparkles", label: "Summarise key movements this period", group: "Quick questions",
        iconColor: "var(--primary)",
        action: () => { onAsk?.("Summarise the key financial movements this period in 3-4 concise bullet points."); close(); },
      },
      {
        icon: "alert-triangle", label: "What are the biggest risks this period?", group: "Quick questions",
        iconColor: "var(--caution, #b45309)",
        action: () => { onAsk?.("What are the biggest financial risks or concerns highlighted by this period's data? Be specific."); close(); },
      },
      {
        icon: "user", label: "Draft a plain-English client narrative", group: "Quick questions",
        iconColor: "var(--primary)",
        action: () => { onAsk?.("Write a brief, plain-English narrative summarising this period's financial performance for a business owner — no jargon, 3-4 sentences."); close(); },
      },
      {
        icon: "trending-up", label: "What's driving profit improvement?", group: "Quick questions",
        iconColor: "var(--favourable)",
        action: () => { onAsk?.("Which line items are driving profit improvement this period, and why?"); close(); },
      },
    ] : []),
  ], [hasData]);

  const close = () => { setOpen(false); setQuery(""); setCursor(0); };

  /* ── Filter commands by query ── */
  const allCmds = useMemoMemo(() => [...staticCmds, ...accountCmds], [staticCmds, accountCmds]);

  const filtered = useMemoMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCmds.slice(0, 16);
    return allCmds.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.sub || "").toLowerCase().includes(q) ||
        (c.group || "").toLowerCase().includes(q)
    ).slice(0, 12);
  }, [allCmds, query]);

  /* synthetic "Ask AI" command when typing */
  const askCmd = query.trim()
    ? {
        icon: "sparkles",
        label: `Ask AI: "${query.trim()}"`,
        group: "AI",
        action: () => { onAsk && onAsk(query.trim()); close(); },
        iconColor: "var(--primary)",
        ai: true,
      }
    : null;

  const visible = askCmd ? [askCmd, ...filtered] : filtered;

  /* ── Keyboard navigation within the list ── */
  const handleKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      visible[cursor]?.action?.();
    } else if (e.key === "Escape") {
      close();
    }
  };

  /* ── Scroll selected item into view ── */
  useEffectPal(() => {
    const el = listRef.current?.children[cursor];
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  /* ── Reset cursor when results change ── */
  useEffectPal(() => { setCursor(0); }, [query]);

  if (!open) return null;

  /* ── Group headers ── */
  const groups = [];
  let lastGroup = null;
  for (let i = 0; i < visible.length; i++) {
    const cmd = visible[i];
    if (cmd.group !== lastGroup) {
      groups.push({ type: "heading", label: cmd.group, idx: i });
      lastGroup = cmd.group;
    }
    groups.push({ type: "cmd", cmd, idx: i });
  }

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "14vh",
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}>

        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <Icon name="search" size={17} color="var(--fg-3)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search views, accounts or ask AI…"
            style={{
              flex: 1, border: "none", outline: "none",
              font: "var(--text-body)", fontSize: 15, color: "var(--ink)",
              background: "transparent",
            }}
          />
          <kbd style={{
            font: "var(--text-label)", fontSize: 11, color: "var(--fg-3)",
            padding: "2px 6px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)", background: "var(--surface-2)",
            flexShrink: 0,
          }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{ maxHeight: 420, overflowY: "auto", padding: "6px 0" }}>
          {visible.length === 0 && (
            <div style={{
              padding: "24px 16px", textAlign: "center",
              font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)",
            }}>
              No results — try a different query
            </div>
          )}

          {groups.map((item, gi) => {
            if (item.type === "heading") {
              return (
                <div key={`h-${gi}`} style={{
                  padding: "8px 16px 3px",
                  font: "var(--text-label)", fontSize: 10, textTransform: "uppercase",
                  letterSpacing: ".08em", color: "var(--fg-3)",
                }}>
                  {item.label}
                </div>
              );
            }

            const { cmd, idx } = item;
            const active = cursor === idx;
            return (
              <div
                key={`c-${gi}`}
                onClick={cmd.action}
                onMouseEnter={() => setCursor(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 16px", cursor: "pointer",
                  background: active ? "var(--primary-soft)" : "transparent",
                  borderLeft: active ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                  transition: "background .08s",
                }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "var(--radius-sm)",
                  background: active ? "var(--primary-soft)" : "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon
                    name={cmd.icon}
                    size={14}
                    color={active ? "var(--primary)" : (cmd.iconColor || "var(--fg-2)")}
                  />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    font: "var(--text-body-strong)", fontSize: 13.5,
                    color: active ? "var(--primary)" : "var(--ink)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {cmd.label}
                  </div>
                  {cmd.sub && (
                    <div style={{
                      font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)",
                      marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {cmd.sub}
                    </div>
                  )}
                </div>
                {active && (
                  <kbd style={{
                    font: "var(--text-label)", fontSize: 10.5, color: "var(--primary)",
                    padding: "2px 6px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--primary)", background: "var(--primary-soft)",
                    flexShrink: 0,
                  }}>
                    ↵
                  </kbd>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "8px 16px", borderTop: "1px solid var(--border)",
          font: "var(--text-label)", fontSize: 11, color: "var(--fg-3)",
        }}>
          <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
          <span><kbd style={kbdStyle}>↵</kbd> select</span>
          <span><kbd style={kbdStyle}>esc</kbd> close</span>
          <span style={{ marginLeft: "auto" }}><kbd style={kbdStyle}>⌘K</kbd> open anytime</span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle = {
  font: "var(--text-label)", fontSize: 10.5, color: "var(--fg-3)",
  padding: "1px 5px", borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-strong)", background: "var(--surface-2)",
  marginRight: 4,
};

Object.assign(window, { CommandPalette });
