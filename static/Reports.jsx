/* MonthEndIQ — Reports page
 *
 * Architecture: each ReportSection_* component renders a self-contained report
 * block and exposes a static .toPlainText(data) method. Export generators
 * (PDF, PPTX, Board Pack) should consume the same data model — the report
 * object returned by buildReportModel() — so reporting logic lives here once.
 */
const { useState: useStateR, useEffect: useEffectR, useRef: useRefR, useMemo: useMemoR } = React;

/* ── Report data model builder ───────────────────────────────────────────── */
function buildReportModel(data, analysisType, periodMode) {
  if (!data) return null;
  const isBvA = (analysisType || data.analysis_type) === "budget_vs_actual";
  const { kpis, movements, commentary, waterfall, period, selected_period,
          revenue_split, expense_split } = data;

  const allRows = movements || [];
  const favRows = allRows.filter(m => m.is_fav && m.variance !== 0);
  const advRows = allRows.filter(m => !m.is_fav && m.variance !== 0);
  const largestFav = favRows.length ? favRows.reduce((a, b) => Math.abs(a.variance) > Math.abs(b.variance) ? a : b) : null;
  const largestAdv = advRows.length ? advRows.reduce((a, b) => Math.abs(a.variance) > Math.abs(b.variance) ? a : b) : null;

  const profKpi = (kpis || []).find(k => !k.pct_only && k.icon === "wallet");
  const revKpi  = (kpis || []).find(k => !k.pct_only && k.icon === "trending-up");

  const topFav = favRows.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);
  const topAdv = advRows.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);

  return {
    isBvA,
    periodLabel: period?.label || selected_period || "",
    priorLabel: period?.prior || (isBvA ? "Budget" : "Prior"),
    periodMode,
    kpis: kpis || [],
    profKpi,
    revKpi,
    movements: allRows,
    commentary: commentary || [],
    waterfall,
    revenue_split: revenue_split || [],
    expense_split: expense_split || [],
    largestFav,
    largestAdv,
    topFav,
    topAdv,
    favCount: favRows.length,
    advCount: advRows.length,
    totalFav: favRows.reduce((s, m) => s + Math.abs(m.variance || 0), 0),
    totalAdv: advRows.reduce((s, m) => s + Math.abs(m.variance || 0), 0),
  };
}

/* ── Formatters (shared) ─────────────────────────────────────────────────── */
const rfmtGBP       = (v) => window.fmtCurrency(v);
const rfmtSignedGBP = (v) => window.fmtCurrency(v, { signed: true });
const rfmtPct = (v) => {
  if (v == null || isNaN(v)) return "—";
  return (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v).toFixed(1) + "%";
};

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function ReportSection({ id, title, sub, icon, children, className, action }) {
  const { Icon } = window;
  return (
    <div id={`report-${id}`} style={{ marginBottom: 18 }}>
      <div className={`card${className ? " " + className : ""}`}>
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name={icon} size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: 0 }}>{title}</h3>
              {sub && <div className="sub">{sub}</div>}
            </div>
          </div>
          {action}
        </div>
        <div className="card-b">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REPORT SECTIONS — each is a reusable component
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── Executive Summary ───────────────────────────────────────────────────── */
function ReportExecutiveSummary({ model }) {
  const { Icon } = window;
  if (!model) return null;
  const { isBvA, periodLabel, priorLabel, profKpi, revKpi, largestFav, largestAdv,
          favCount, advCount, totalFav, totalAdv } = model;

  const profVar = profKpi?.variance;
  const profFav = profKpi?.is_fav;
  const headline = profKpi
    ? (isBvA
      ? `Operating Profit was ${rfmtGBP(Math.abs(profVar))} ${profFav ? "above" : "below"} budget at ${rfmtGBP(profKpi.value)}, versus a budget of ${rfmtGBP(profKpi.prior)}.`
      : `Operating Profit ${profVar >= 0 ? "increased" : "decreased"} by ${rfmtGBP(Math.abs(profVar))} to ${rfmtGBP(profKpi.value)}, from ${rfmtGBP(profKpi.prior)} in the prior period.`)
    : "";

  const revLine = revKpi
    ? (isBvA
      ? `Total Revenue was ${rfmtGBP(revKpi.value)} against a budget of ${rfmtGBP(revKpi.prior)} (${rfmtPct(revKpi.pct)}).`
      : `Total Revenue was ${rfmtGBP(revKpi.value)}, ${revKpi.variance >= 0 ? "up" : "down"} ${rfmtGBP(Math.abs(revKpi.variance))} (${rfmtPct(revKpi.pct)}) versus the prior period.`)
    : "";

  const varSummary = `There were ${favCount} favourable variance${favCount !== 1 ? "s" : ""} totalling ${rfmtGBP(totalFav)} and ${advCount} adverse variance${advCount !== 1 ? "s" : ""} totalling ${rfmtGBP(totalAdv)}.`;

  return (
    <ReportSection id="executive-summary" title="Executive Summary" icon="file-text">
      <div style={{
        padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
        font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.7,
      }}>
        <p style={{ margin: "0 0 8px" }}><strong>Period:</strong> {periodLabel}{isBvA ? " — Actual vs Budget" : ` vs ${priorLabel}`}</p>
        <p style={{ margin: "0 0 8px" }}>{headline}</p>
        {revLine && <p style={{ margin: "0 0 8px" }}>{revLine}</p>}
        <p style={{ margin: "0 0 8px" }}>{varSummary}</p>
        {largestFav && (
          <p style={{ margin: "0 0 4px" }}>
            <span style={{ color: "var(--favourable-text)" }}>Largest favourable variance:</span>{" "}
            {largestFav.account} ({rfmtSignedGBP(largestFav.variance)})
          </p>
        )}
        {largestAdv && (
          <p style={{ margin: 0 }}>
            <span style={{ color: "var(--adverse-text)" }}>Largest adverse variance:</span>{" "}
            {largestAdv.account} ({rfmtSignedGBP(largestAdv.variance)})
          </p>
        )}
      </div>
    </ReportSection>
  );
}

/* ── KPI Summary ─────────────────────────────────────────────────────────── */
function ReportKpiSummary({ model }) {
  const { Icon, Delta } = window;
  if (!model) return null;

  return (
    <ReportSection id="kpi-summary" title="KPI Summary" icon="bar-chart-2">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {model.kpis.filter(k => !k.pct_only).map(k => (
          <div key={k.label} className={`card kpi${k.icon === "wallet" ? " kpi-hero" : ""}`} style={{ padding: "16px 18px" }}>
            <div className="kpi-top">
              <span className="lbl">{k.label}</span>
              <div className="kpi-ic"><Icon name={k.icon} size={16} /></div>
            </div>
            <div className="val" style={{ fontSize: 22, margin: "10px 0 8px" }}>
              {rfmtGBP(k.value)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ font: "var(--text-caption)", fontSize: 11, color: k.icon === "wallet" ? "var(--fg-on-dark-2)" : "var(--fg-3)" }}>
                {model.isBvA ? "Budget" : "Prior"}: {rfmtGBP(k.prior)}
              </span>
              <Delta fav={k.is_fav} up={k.variance >= 0}>
                {rfmtSignedGBP(k.variance)} · {rfmtPct(k.pct)}
              </Delta>
            </div>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

/* ── AI Narrative Commentary ─────────────────────────────────────────────── */
function ReportAINarrative({ sessionId, period, periodMode, analysisType }) {
  const { Icon, Button } = window;
  const [status,       setStatus]       = React.useState("idle"); // idle | loading | done | error
  const [narrative,    setNarrative]    = React.useState(null);
  const [verification, setVerification] = React.useState(null);
  const [copied,       setCopied]       = React.useState(false);
  const [errMsg,       setErrMsg]       = React.useState("");
  const [contextNotes, setContextNotes] = React.useState("");
  const [tonePreset,   setTonePreset]   = React.useState(() => {
    try { return localStorage.getItem("meiq_default_tone") || "board"; } catch { return "board"; }
  }); // board | management | client

  const generate = async () => {
    setStatus("loading");
    try {
      const isBvA = analysisType === "budget_vs_actual";
      const periodParam = isBvA
        ? (period?.label === "Actual" ? "full_year" : (period?.label || "full_year"))
        : (period?.label || null);
      const res = await fetch(apiUrl(`/api/commentary/${sessionId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: periodParam, mode: periodMode || "monthly", context_notes: contextNotes.trim() || null, tone: tonePreset, currency_sym: (() => { try { return localStorage.getItem("meiq_currency_sym") || "£"; } catch { return "£"; } })() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setNarrative(data.narrative);
      setVerification(data.verification || null);
      setStatus("done");
    } catch (e) {
      console.error("[Commentary]", e);
      setErrMsg(e.message || "");
      setStatus("error");
    }
  };

  const copy = () => {
    const div = document.createElement("div");
    div.innerHTML = narrative;
    const text = div.innerText || div.textContent || "";
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ReportSection id="ai-narrative" title="AI Narrative Commentary" icon="sparkles" className="card-ai"
      action={<span className="ai-badge"><Icon name="sparkles" size={11} />AI</span>}>
      {status === "idle" && (
        <div style={{
          padding: "20px 16px",
          background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
          border: "1px dashed var(--primary-soft-2)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Icon name="sparkles" size={28} color="var(--primary)" />
            </div>
            <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>
              Generate board-ready narrative commentary
            </div>
            <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)" }}>
              AI writes a full management pack narrative — revenue, costs, profitability and recommended actions.
            </div>
          </div>
          {/* Tone preset selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              font: "var(--text-label)", fontSize: 11.5, color: "var(--fg-2)", marginBottom: 7, textAlign: "left",
            }}>
              Commentary tone
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { key: "board",      label: "Board Pack",        desc: "Formal, CFO-level" },
                { key: "management", label: "Management Review", desc: "Detailed & operational" },
                { key: "client",     label: "Client Digest",     desc: "Plain English" },
              ].map(t => (
                <button key={t.key} onClick={() => setTonePreset(t.key)} style={{
                  padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                  border: tonePreset === t.key ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                  background: tonePreset === t.key ? "var(--primary-soft)" : "var(--surface)",
                  color: tonePreset === t.key ? "var(--primary)" : "var(--fg-2)",
                  transition: "all .12s", textAlign: "left",
                }}>
                  <div style={{ font: "var(--text-body-strong)", fontSize: 12.5 }}>{t.label}</div>
                  <div style={{ font: "var(--text-caption)", fontSize: 11, color: tonePreset === t.key ? "var(--primary)" : "var(--fg-3)", marginTop: 1 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: "block", font: "var(--text-label)", fontSize: 11.5,
              color: "var(--fg-2)", marginBottom: 5, textAlign: "left",
            }}>
              Period notes <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={contextNotes}
              onChange={e => setContextNotes(e.target.value)}
              placeholder="e.g. Large one-off rent payment in March. Revenue delayed due to contract renewal. Staff costs include £12k redundancy."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box", resize: "vertical",
                font: "var(--text-body)", fontSize: 13, lineHeight: 1.5,
                color: "var(--ink)", background: "var(--surface)",
                border: "1.5px solid var(--border)", borderRadius: "var(--radius-xs)",
                padding: "9px 11px", outline: "none", transition: "border-color .15s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4, textAlign: "left" }}>
              These notes are injected into the AI prompt so commentary reflects your context.
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Button variant="primary" icon="sparkles" onClick={generate}>
              Generate Commentary
            </Button>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 14px" }} />
          <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)" }}>
            Writing board-ready commentary…
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={{
          padding: "16px 18px", background: "var(--adverse-soft)", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--adverse-border)",
        }}>
          <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--adverse-text)", marginBottom: 4 }}>
            Failed to generate commentary.
          </div>
          {errMsg && (
            <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--adverse-text)", marginBottom: 10, opacity: 0.8 }}>
              {errMsg}
            </div>
          )}
          <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)", marginBottom: 12 }}>
            Check that <code>OPENAI_API_KEY</code> is set on the server and try again.
          </div>
          <Button variant="secondary" icon="refresh-cw" onClick={generate}>
            Retry
          </Button>
        </div>
      )}

      {status === "done" && narrative && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => { setStatus("idle"); setNarrative(null); }} style={{
                background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                font: "var(--text-caption)", fontSize: 11.5, color: "var(--primary)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Icon name="pencil" size={12} />Edit notes &amp; regenerate
              </button>
              <span style={{
                padding: "2px 8px", borderRadius: "var(--radius-pill)",
                background: "var(--primary-soft)", color: "var(--primary)",
                font: "var(--text-label)", fontSize: 10.5,
              }}>
                {{ board: "Board Pack", management: "Management Review", client: "Client Digest" }[tonePreset] || "Board Pack"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" icon={copied ? "check" : "copy"} onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" icon="refresh-cw" onClick={generate}>
                Regenerate
              </Button>
            </div>
          </div>
          <div style={{
            padding: "16px 18px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
            font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.75,
          }}
            className="ai-narrative"
            dangerouslySetInnerHTML={{ __html: narrative }}
          />
          {/* Ledger-grounding verification — "AI writes the words, your ledger writes the numbers" */}
          {verification && verification.total > 0 && (
            verification.all_verified ? (
              <div style={{
                marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8,
                padding: "9px 12px", borderRadius: "var(--radius-sm)",
                background: "var(--favourable-soft)", border: "1px solid var(--favourable-border)",
              }}>
                <Icon name="shield-check" size={15} color="var(--favourable-text)" />
                <div>
                  <div style={{ font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--favourable-text)" }}>
                    All {verification.total} figures verified against the ledger
                  </div>
                  <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 1 }}>
                    Every £ amount above traces to your imported P&amp;L — none were generated by the AI.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8,
                padding: "9px 12px", borderRadius: "var(--radius-sm)",
                background: "var(--caution-soft, var(--adverse-soft))", border: "1px solid var(--caution-border, var(--adverse-border))",
              }}>
                <Icon name="alert-triangle" size={15} color="var(--caution-text, var(--adverse-text))" />
                <div>
                  <div style={{ font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--caution-text, var(--adverse-text))" }}>
                    {verification.verified} of {verification.total} figures verified —
                    {" "}{verification.unverified.length} need checking
                  </div>
                  <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>
                    Could not trace to your P&amp;L: {verification.unverified.join(", ")}. Review before use.
                  </div>
                </div>
              </div>
            )
          )}
          <div style={{
            marginTop: 10, display: "flex", alignItems: "center", gap: 6,
            font: "var(--text-caption)", fontSize: 11, color: "var(--primary-press)",
          }}>
            <Icon name="sparkles" size={11} color="var(--primary)" />
            AI-generated — review before use in board packs
          </div>
        </div>
      )}
    </ReportSection>
  );
}

/* ── Board Pack Commentary ───────────────────────────────────────────────── */
function ReportBoardCommentary({ model, sessionId, periodLabel }) {
  const { Icon } = window;

  const storageKey = `monthendiq_cedit_${sessionId}_${(periodLabel || "").replace(/\s/g, "_")}`;

  const [edits,      setEdits]      = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });
  const [editingIdx, setEditingIdx] = React.useState(null);
  const [draftText,  setDraftText]  = React.useState("");
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  React.useEffect(() => {
    try { setEdits(JSON.parse(localStorage.getItem(storageKey) || "{}")); } catch { setEdits({}); }
    setEditingIdx(null);
    setDraftText("");
  }, [storageKey]);

  const persistEdits = (next) => {
    setEdits(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const startEdit = (i, html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    setDraftText(div.innerText || div.textContent || "");
    setEditingIdx(i);
  };

  const saveEdit = () => {
    const trimmed = draftText.trim();
    if (trimmed && editingIdx !== null) {
      persistEdits({ ...edits, [editingIdx]: trimmed });
    }
    setEditingIdx(null);
    setDraftText("");
  };

  const cancelEdit = () => { setEditingIdx(null); setDraftText(""); };

  const clearEdit = (i) => {
    const next = { ...edits };
    delete next[i];
    persistEdits(next);
  };

  const clearAll = () => persistEdits({});

  const hasEdits = Object.keys(edits).length > 0;

  React.useEffect(() => {
    if (!hasEdits) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasEdits]);

  if (!model || !model.commentary.length) return null;

  const action = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {hasEdits && (
        <button onClick={clearAll} style={{
          background: "none", border: "none", cursor: "pointer", padding: "3px 8px",
          font: "var(--text-label)", fontSize: 11, color: "var(--fg-2)",
          borderRadius: "var(--radius-xs)", display: "flex", alignItems: "center", gap: 5,
        }}
          title="Reset all edits to AI originals">
          <Icon name="rotate-ccw" size={11} />Reset all
        </button>
      )}
      <span className="ai-badge"><Icon name="sparkles" size={11} />AI</span>
    </div>
  );

  return (
    <ReportSection id="board-commentary" title="Board Pack Commentary" icon="message-square"
      className="card-ai" action={action}>
      <ul className="ai-list" style={{ margin: 0 }}>
        {model.commentary.map((c, i) => {
          const isEditing = editingIdx === i;
          const editedText = edits[i];
          const isEdited = editedText != null;
          const isHovered = hoveredIdx === i;

          return (
            <li key={i}
              onMouseEnter={() => !isEditing && setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ position: "relative", paddingRight: 28 }}>
              <span className="ic">
                <Icon name={c.icon} size={15} color={c.fav ? "var(--favourable)" : "var(--adverse)"} />
              </span>

              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    autoFocus
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    onKeyDown={e => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); saveEdit(); }
                      if (e.key === "Escape") cancelEdit();
                    }}
                    rows={3}
                    style={{
                      width: "100%", boxSizing: "border-box", resize: "vertical",
                      font: "var(--text-body)", fontSize: 13.5, lineHeight: 1.55,
                      color: "var(--ink)", background: "var(--surface)",
                      border: "1.5px solid var(--primary)", borderRadius: "var(--radius-xs)",
                      padding: "8px 10px", outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    <button onClick={saveEdit} style={{
                      padding: "4px 12px", borderRadius: "var(--radius-xs)",
                      background: "var(--primary)", color: "#fff", border: "none",
                      font: "var(--text-label)", fontSize: 12, cursor: "pointer",
                    }}>Save</button>
                    <button onClick={cancelEdit} style={{
                      padding: "4px 12px", borderRadius: "var(--radius-xs)",
                      background: "none", color: "var(--fg-2)", border: "1px solid var(--border-strong)",
                      font: "var(--text-label)", fontSize: 12, cursor: "pointer",
                    }}>Cancel</button>
                    <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                      Cmd+Enter to save · Esc to cancel
                    </span>
                  </div>
                </div>
              ) : (
                <span style={{ flex: 1, position: "relative" }}>
                  {isEdited
                    ? <span>{editedText}</span>
                    : <span dangerouslySetInnerHTML={{ __html: c.html }} />
                  }
                  {isEdited && (
                    <span style={{
                      marginLeft: 8, padding: "1px 6px",
                      background: "var(--primary-soft-2)", color: "var(--primary)",
                      borderRadius: "var(--radius-pill)", font: "var(--text-label)", fontSize: 10,
                    }}>edited</span>
                  )}
                </span>
              )}

              {/* hover controls */}
              {!isEditing && (
                <div style={{
                  position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                  display: "flex", gap: 4,
                  opacity: isHovered ? 1 : 0, transition: "opacity 0.15s",
                  pointerEvents: isHovered ? "auto" : "none",
                }}>
                  <button onClick={() => startEdit(i, isEdited ? editedText : c.html)} title="Edit"
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 4,
                      color: "var(--fg-2)", borderRadius: "var(--radius-xs)",
                      display: "flex", alignItems: "center",
                    }}>
                    <Icon name="pencil" size={13} />
                  </button>
                  {isEdited && (
                    <button onClick={() => clearEdit(i)} title="Reset to original"
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 4,
                        color: "var(--fg-3)", borderRadius: "var(--radius-xs)",
                        display: "flex", alignItems: "center",
                      }}>
                      <Icon name="rotate-ccw" size={13} />
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ReportSection>
  );
}

/* ── Key Findings ────────────────────────────────────────────────────────── */
function ReportKeyFindings({ model }) {
  const { Icon } = window;
  if (!model) return null;
  const { topFav, topAdv, isBvA, waterfall } = model;

  return (
    <ReportSection id="key-findings" title="Key Findings" icon="search">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Favourable */}
        <div>
          <div style={{
            font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
            letterSpacing: ".05em", color: "var(--favourable-text)", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Icon name="trending-up" size={13} color="var(--favourable)" />
            Top Favourable Variances
          </div>
          {topFav.length === 0 && (
            <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)", padding: 12 }}>None</div>
          )}
          {topFav.map((m, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", marginBottom: 4, borderRadius: "var(--radius-sm)",
              background: "var(--favourable-soft)",
            }}>
              <div>
                <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>{m.account}</div>
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>{m.category}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ font: "600 13px var(--font-mono)", color: "var(--favourable-text)", fontVariantNumeric: "tabular-nums" }}>
                  {rfmtSignedGBP(m.variance)}
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>{rfmtPct(m.variance_pct)}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Adverse */}
        <div>
          <div style={{
            font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
            letterSpacing: ".05em", color: "var(--adverse-text)", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Icon name="trending-down" size={13} color="var(--adverse)" />
            Top Adverse Variances
          </div>
          {topAdv.length === 0 && (
            <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)", padding: 12 }}>None</div>
          )}
          {topAdv.map((m, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", marginBottom: 4, borderRadius: "var(--radius-sm)",
              background: "var(--adverse-soft)",
            }}>
              <div>
                <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>{m.account}</div>
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>{m.category}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ font: "600 13px var(--font-mono)", color: "var(--adverse-text)", fontVariantNumeric: "tabular-nums" }}>
                  {rfmtSignedGBP(m.variance)}
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>{rfmtPct(m.variance_pct)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profit drivers summary */}
      {waterfall && (
        <div style={{ marginTop: 16, padding: "14px 18px", background: "var(--surface)", borderRadius: "var(--radius-sm)" }}>
          <div style={{
            font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
            letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 10,
          }}>
            Profit Drivers
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>{model.isBvA ? "Budget Profit" : "Prior Profit"}</div>
              <div style={{ font: "var(--text-metric)", fontSize: 18, color: "var(--ink)" }}>{rfmtGBP(waterfall.prior_profit)}</div>
            </div>
            <div style={{ color: "var(--fg-3)", fontSize: 18, alignSelf: "center" }}>→</div>
            <div>
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>{model.isBvA ? "Actual Profit" : "Current Profit"}</div>
              <div style={{ font: "var(--text-metric)", fontSize: 18, color: "var(--ink)" }}>{rfmtGBP(waterfall.current_profit)}</div>
            </div>
            <div>
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>Net Change</div>
              <div style={{
                font: "var(--text-metric)", fontSize: 18,
                color: waterfall.net_change >= 0 ? "var(--favourable-text)" : "var(--adverse-text)",
              }}>{rfmtSignedGBP(waterfall.net_change)}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {waterfall.bars.map((b, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "5px 10px", borderRadius: "var(--radius-sm)",
                background: b.fav ? "var(--favourable-soft)" : "var(--adverse-soft)",
              }}>
                <Icon name={b.fav ? "trending-up" : "trending-down"} size={13}
                  color={b.fav ? "var(--favourable)" : "var(--adverse)"} />
                <span style={{ flex: 1, font: "var(--text-body)", fontSize: 13, color: "var(--ink)" }}>{b.label}</span>
                <span style={{
                  font: "600 13px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                  color: b.fav ? "var(--favourable-text)" : "var(--adverse-text)",
                }}>{rfmtSignedGBP(b.impact)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportSection>
  );
}

/* ── Recommended Actions ─────────────────────────────────────────────────── */
function ReportRecommendedActions({ model }) {
  const { Icon } = window;
  if (!model) return null;
  const { topAdv, largestAdv, largestFav, isBvA, profKpi } = model;

  const actions = [];

  if (largestAdv) {
    const pctStr = largestAdv.variance_pct != null ? ` (${Math.abs(largestAdv.variance_pct).toFixed(1)}%)` : "";
    actions.push({
      priority: "high",
      text: `Investigate ${largestAdv.account} — largest adverse variance at ${rfmtGBP(Math.abs(largestAdv.variance))}${pctStr}. ${isBvA ? "Determine whether this is a timing difference or a structural budget miss." : "Understand whether this movement is recurring or one-off."}`,
    });
  }

  topAdv.slice(1, 3).forEach(m => {
    actions.push({
      priority: "medium",
      text: `Review ${m.account} (${m.category}) — adverse variance of ${rfmtGBP(Math.abs(m.variance))}. ${isBvA ? "Confirm if a budget reforecast is needed." : "Assess trend direction."}`,
    });
  });

  if (largestFav) {
    actions.push({
      priority: "low",
      text: `Validate ${largestFav.account} favourable variance of ${rfmtGBP(Math.abs(largestFav.variance))} — ${isBvA ? "confirm this is a genuine saving and not a timing or phasing issue." : "confirm this is sustainable and not a one-off gain."}`,
    });
  }

  if (profKpi && !profKpi.is_fav) {
    actions.push({
      priority: "high",
      text: `Operating Profit is ${rfmtGBP(Math.abs(profKpi.variance))} ${isBvA ? "below budget" : "below prior period"}. Prepare a remediation plan for the next reporting period.`,
    });
  }

  const priorityColor = { high: "var(--adverse)", medium: "var(--c-4)", low: "var(--favourable)" };
  const priorityLabel = { high: "High", medium: "Medium", low: "Low" };

  return (
    <ReportSection id="recommended-actions" title="Recommended Actions" icon="list-checks">
      {actions.length === 0 && (
        <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)", padding: 12 }}>
          No specific actions to recommend for this period.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((a, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            padding: "12px 16px", borderRadius: "var(--radius-sm)",
            background: "var(--surface)", borderLeft: `3px solid ${priorityColor[a.priority]}`,
          }}>
            <span style={{
              font: "var(--text-body-strong)", fontSize: 10.5, padding: "2px 8px",
              borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
              background: a.priority === "high" ? "var(--adverse-soft)" : a.priority === "low" ? "var(--favourable-soft)" : "var(--surface-2)",
              color: priorityColor[a.priority],
            }}>
              {priorityLabel[a.priority]}
            </span>
            <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
              {a.text}
            </span>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

/* ── Variance Table (for report preview) ─────────────────────────────────── */
function ReportVarianceTable({ model }) {
  const [showAll, setShowAll] = useStateR(false);
  if (!model || !model.movements.length) return null;

  const PAGE = 20;
  const rows = showAll ? model.movements : model.movements.slice(0, PAGE);
  const hidden = model.movements.length - PAGE;

  return (
    <ReportSection id="variance-table" title="Variance Analysis" icon="table">
      <div style={{ overflowX: "auto" }}>
        <table className="var">
          <thead>
            <tr>
              <th className="l">Account</th>
              <th className="l">Category</th>
              <th>{model.isBvA ? "Actual" : "Current"}</th>
              <th>{model.isBvA ? "Budget" : "Prior"}</th>
              <th>Variance</th>
              <th>Var %</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={i}>
                <td className="l">{m.account}</td>
                <td className="l">{m.category}</td>
                <td>{rfmtGBP(m.value)}</td>
                <td>{rfmtGBP(m.prior_value)}</td>
                <td className={m.is_fav ? "fav" : m.variance !== 0 ? "adv" : ""}>{rfmtSignedGBP(m.variance)}</td>
                <td className={m.is_fav ? "fav" : m.variance !== 0 ? "adv" : ""}>{rfmtPct(m.variance_pct)}</td>
                <td>
                  <span style={{
                    font: "var(--text-body-strong)", fontSize: 11, padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    background: m.is_fav ? "var(--favourable-soft)" : (m.variance !== 0 ? "var(--adverse-soft)" : "var(--surface-2)"),
                    color: m.is_fav ? "var(--favourable-text)" : (m.variance !== 0 ? "var(--adverse-text)" : "var(--fg-3)"),
                  }}>
                    {m.is_fav ? "Favourable" : (m.variance !== 0 ? "Adverse" : "—")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {model.movements.length > PAGE && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            display: "block", margin: "12px auto 0",
            padding: "6px 18px", borderRadius: "var(--radius-pill)",
            background: "transparent", border: "1px solid var(--border-strong)",
            font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)",
            cursor: "pointer", transition: "background .12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {showAll ? "Show fewer rows" : `Show ${hidden} more row${hidden !== 1 ? "s" : ""}…`}
        </button>
      )}
    </ReportSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REPORTS PAGE — assembles all sections as a management pack preview
 * ═══════════════════════════════════════════════════════════════════════════ */
function Reports({ sessionId, initialData, periodMode, controlledPeriod, onDataChange, analysisType, period, onToast }) {
  const { Icon, Button, Card } = window;
  const [data, setData]       = useStateR(initialData);
  const [loading, setLoading] = useStateR(false);
  const [exporting, setExporting] = useStateR(null);
  const lastFetched = useRefR({ period: initialData?.selected_period, mode: periodMode });

  const doExport = async (fmt) => {
    setExporting(fmt);
    try {
      const isBvA = (analysisType || data?.analysis_type) === "budget_vs_actual";
      const periodParam = isBvA
        ? (period?.label === "Actual" ? "full_year" : (period?.label || "full_year"))
        : (period?.label || "");
      const params = new URLSearchParams({ period: periodParam, fmt });
      const res = await fetch(apiUrl(`/api/export/${sessionId}?${params}`));
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j.detail || detail; } catch (_) {}
        console.error("[MonthEndIQ Export]", detail);
        onToast?.("Export failed: " + detail);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `management_pack.${fmt === "pdf" ? "pdf" : "zip"}`;
      a.click();
      URL.revokeObjectURL(url);
      onToast && onToast(`${fmt.toUpperCase()} exported successfully`);
    } catch (e) {
      console.error("[MonthEndIQ Export] Failed:", e);
      onToast?.("Export failed: " + e.message);
    } finally {
      setExporting(null);
    }
  };

  const copyFullReport = () => {
    const el = document.querySelector('.content-inner');
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      onToast?.("Report copied to clipboard");
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onToast?.("Report copied to clipboard");
    });
  };

  const fetchPeriod = async (period, mode) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, mode });
      const res = await fetch(apiUrl(`/api/data/${sessionId}?${params}`));
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        onDataChange && onDataChange(newData);
        lastFetched.current = { period: newData.selected_period, mode };
      }
    } finally { setLoading(false); }
  };

  useEffectR(() => {
    if (!controlledPeriod) return;
    if (controlledPeriod === lastFetched.current.period && periodMode === lastFetched.current.mode) return;
    fetchPeriod(controlledPeriod, periodMode);
  }, [controlledPeriod, periodMode]);

  const model = useMemoR(() => buildReportModel(data, analysisType, periodMode), [data, analysisType, periodMode]);

  if (!data) return <div className="loading"><div className="spinner" />Loading...</div>;

  const sections = [
    { id: "executive-summary",  label: "Executive Summary" },
    { id: "kpi-summary",        label: "KPI Summary" },
    { id: "ai-narrative",       label: "AI Narrative" },
    { id: "board-commentary",   label: "Board Commentary" },
    { id: "key-findings",       label: "Key Findings" },
    { id: "variance-table",     label: "Variance Analysis" },
    { id: "recommended-actions",label: "Recommended Actions" },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(`report-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="content">
      <div className="content-inner reveal" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
          <div className="editorial-header" style={{ marginBottom: 0 }}>
            <div className="editorial-eyebrow">
              <span className="e-label">Management Report</span>
              <span className="e-sep" />
              <span className="e-period">{model?.isBvA ? "Budget vs Actual" : "Period on Period"}</span>
            </div>
            <h1 className="editorial-h1" style={{ fontSize: "clamp(22px, 2.8vw, 36px)" }}>
              {model?.periodLabel || "Financial Summary"}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <Button variant="secondary" icon="copy" onClick={copyFullReport}>
              Copy
            </Button>
            <Button variant="secondary" icon="printer" onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="secondary" icon="file-archive"
              onClick={() => doExport("zip")}
              disabled={!!exporting}>
              {exporting === "zip" ? "Exporting..." : "CSV"}
            </Button>
            <Button variant="secondary" icon="table-2"
              onClick={() => doExport("xlsx")}
              disabled={!!exporting}>
              {exporting === "xlsx" ? "Exporting..." : "Excel"}
            </Button>
            <Button variant="primary" icon={exporting === "pdf" ? "loader" : "download"}
              onClick={() => doExport("pdf")}
              disabled={!!exporting}>
              {exporting === "pdf" ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Section quick-nav */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className="suggest">
              {s.label}
            </button>
          ))}
        </div>

        {/* Report sections */}
        <ReportExecutiveSummary model={model} />
        <ReportKpiSummary model={model} />
        <ReportAINarrative
          sessionId={sessionId}
          period={period}
          periodMode={periodMode}
          analysisType={analysisType}
        />
        <ReportBoardCommentary model={model} sessionId={sessionId} periodLabel={model?.periodLabel} />
        <ReportKeyFindings model={model} />
        <ReportVarianceTable model={model} />
        <ReportRecommendedActions model={model} />

        {/* Footer */}
        <div style={{
          marginTop: 12, padding: "14px 18px",
          background: "var(--primary-soft)", borderRadius: "var(--radius-md)",
          border: "1px solid var(--primary-soft-2)",
          display: "flex", alignItems: "center", gap: 10,
          font: "var(--text-body)", fontSize: 12.5, color: "var(--primary)",
        }}>
          <Icon name="info" size={14} color="var(--primary)" />
          This report preview shows the content that will appear in exported management packs (PDF, PowerPoint, Board Pack).
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Reports,
  buildReportModel,
  ReportExecutiveSummary,
  ReportKpiSummary,
  ReportAINarrative,
  ReportBoardCommentary,
  ReportKeyFindings,
  ReportRecommendedActions,
  ReportVarianceTable,
});
