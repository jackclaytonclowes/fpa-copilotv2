/* FP&A Copilot — settings view */
const { useState: useStateSV, useEffect: useEffectSV } = React;

function SettingsView({ onToast }) {
  const { Icon, Button } = window;

  // ── Firm branding ──────────────────────────────────────────────────────────
  const [firmName, setFirmName] = useStateSV(() => {
    try { return localStorage.getItem("meiq_firm_name") || ""; } catch { return ""; }
  });
  const [firmSaved, setFirmSaved] = useStateSV(false);

  const saveFirm = () => {
    try {
      if (firmName.trim()) {
        localStorage.setItem("meiq_firm_name", firmName.trim());
      } else {
        localStorage.removeItem("meiq_firm_name");
      }
      // Notify other components in the same tab
      window.dispatchEvent(new CustomEvent("meiq:firm-updated", { detail: firmName.trim() }));
      setFirmSaved(true);
      setTimeout(() => setFirmSaved(false), 2200);
      onToast?.("Firm name saved");
    } catch (e) {
      onToast?.("Could not save — localStorage unavailable");
    }
  };

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useStateSV(() => {
    return document.documentElement.dataset.theme || "light";
  });

  const toggleTheme = (next) => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("monthendiq_theme", next); } catch {}
    setTheme(next);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const sectionHdr = {
    font: "var(--text-label)", fontSize: 10.5, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".07em",
    color: "var(--primary)", marginBottom: 14,
  };

  const fieldLbl = {
    display: "block", font: "var(--text-label)", fontSize: 11,
    fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em",
    color: "var(--fg-3)", marginBottom: 6,
  };

  const inp = {
    width: "100%", padding: "9px 12px", boxSizing: "border-box",
    font: "var(--text-body)", fontSize: 14, color: "var(--ink)",
    background: "var(--surface-2)", border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)", outline: "none",
  };

  const themeBtn = (id, label, icon) => (
    <button
      key={id}
      onClick={() => toggleTheme(id)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "9px 14px", border: "none", borderRadius: "var(--radius-sm)",
        background: theme === id ? "var(--primary)" : "var(--surface-2)",
        color: theme === id ? "#fff" : "var(--fg-2)",
        font: "var(--text-body-strong)", fontSize: 13, cursor: "pointer",
        transition: "all .15s",
      }}
    >
      <Icon name={icon} size={14} /> {label}
    </button>
  );

  return (
    <div className="content">
      <div className="content-inner" style={{ maxWidth: 620 }}>

        {/* ── Firm branding ── */}
        <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <div style={sectionHdr}>Firm branding</div>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLbl}>Practice name</label>
            <input
              type="text"
              value={firmName}
              onChange={e => { setFirmName(e.target.value); setFirmSaved(false); }}
              onKeyDown={e => e.key === "Enter" && saveFirm()}
              placeholder="e.g. Harrison & Co. Chartered Accountants"
              style={inp}
            />
            <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 6, lineHeight: 1.5 }}>
              Appears on PDF management pack cover pages as "Prepared by [Practice name]".
              Leave blank to omit.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button
              variant="primary"
              icon={firmSaved ? "check" : "save"}
              onClick={saveFirm}
            >
              {firmSaved ? "Saved" : "Save"}
            </Button>
            {firmName && (
              <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
                PDF will show: <em>Prepared by {firmName.trim()}</em>
              </div>
            )}
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <div style={sectionHdr}>Appearance</div>
          <label style={fieldLbl}>Theme</label>
          <div style={{ display: "flex", gap: 8, border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)", padding: 4, background: "var(--surface-2)" }}>
            {themeBtn("light", "Light",  "sun")}
            {themeBtn("dark",  "Dark",   "moon")}
          </div>
        </div>

        {/* ── Session data ── */}
        <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <div style={sectionHdr}>Session data</div>
          {(() => {
            let session = null;
            try { session = JSON.parse(localStorage.getItem("monthendiq_session") || "null"); } catch {}
            const fileName = session?.filename;
            const ts       = session?.timestamp ? new Date(session.timestamp) : null;
            const tsLabel  = ts ? ts.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
            return (
              <div>
                {fileName ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 0 }}>
                      <span style={{ font: "var(--text-caption)", fontSize: 12.5, color: "var(--fg-3)", minWidth: 110 }}>Active file</span>
                      <span style={{ font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--ink)" }}>{fileName}</span>
                    </div>
                    {tsLabel && (
                      <div style={{ display: "flex", gap: 0 }}>
                        <span style={{ font: "var(--text-caption)", fontSize: 12.5, color: "var(--fg-3)", minWidth: 110 }}>Loaded</span>
                        <span style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--ink)" }}>{tsLabel}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)", marginBottom: 14 }}>
                    No session active — upload a P&amp;L file to begin.
                  </div>
                )}
                <Button
                  variant="secondary"
                  icon="log-out"
                  onClick={() => {
                    try { localStorage.removeItem("monthendiq_session"); } catch {}
                    onToast?.("Session cleared — you can now upload a new file");
                    setTimeout(() => window.location.reload(), 1200);
                  }}
                >
                  Start fresh
                </Button>
                <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 8, lineHeight: 1.5 }}>
                  Clears the active session. Your firm name and theme settings are kept.
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Keyboard shortcuts ── */}
        <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <div style={sectionHdr}>Keyboard shortcuts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["⌘K / Ctrl+K", "Open command palette"],
              ["↑ ↓ + Enter",  "Navigate command palette"],
              ["Escape",        "Close modals and palette"],
            ].map(([keys, desc]) => (
              <div key={keys} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  display: "inline-flex", gap: 4, flexShrink: 0,
                  font: "var(--font-mono, monospace)", fontSize: 11.5,
                  color: "var(--fg-2)", background: "var(--surface-2)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-xs)", padding: "2px 8px",
                  minWidth: 110, justifyContent: "center",
                }}>{keys}</span>
                <span style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── About ── */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={sectionHdr}>About MonthEndIQ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {[
              ["Product",  "MonthEndIQ"],
              ["Version",  "2.0"],
              ["Purpose",  "FP&A intelligence for accounting practices"],
              ["Stack",    "FastAPI · React 18 · OpenAI GPT-4o"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 0 }}>
                <span style={{ font: "var(--text-caption)", fontSize: 12.5, color: "var(--fg-3)",
                  minWidth: 90 }}>{k}</span>
                <span style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--ink)" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.6 }}>
            MonthEndIQ automates month-end financial analysis for accounting practices —
            variance analysis, AI commentary, board packs, and client-ready digests.
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { SettingsView });
