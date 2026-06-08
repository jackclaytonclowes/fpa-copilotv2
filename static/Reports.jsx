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
const rfmtGBP = (v) => {
  if (v == null || isNaN(v)) return "—";
  return (v < 0 ? "-£" : "£") + Math.abs(Math.round(v)).toLocaleString("en-GB");
};
const rfmtSignedGBP = (v) => {
  if (v == null || isNaN(v)) return "—";
  return (v > 0 ? "+" : v < 0 ? "-" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB");
};
const rfmtPct = (v) => {
  if (v == null || isNaN(v)) return "—";
  return (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v).toFixed(1) + "%";
};

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function ReportSection({ id, title, icon, children }) {
  const { Icon } = window;
  return (
    <div id={`report-${id}`} style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        paddingBottom: 10, borderBottom: "1px solid var(--border)",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: "var(--radius-sm)",
          background: "var(--primary-soft)", display: "inline-flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name={icon} size={14} color="var(--primary)" />
        </span>
        <h3 style={{ font: "var(--text-body-strong)", fontSize: 15, color: "var(--ink)", margin: 0 }}>
          {title}
        </h3>
      </div>
      {children}
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
        padding: "16px 20px", background: "var(--surface)", borderRadius: "var(--radius-sm)",
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {model.kpis.filter(k => !k.pct_only).map(k => (
          <div key={k.label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Icon name={k.icon} size={14} color="var(--fg-3)" />
              <span style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)" }}>
                {k.label}
              </span>
            </div>
            <div style={{ font: "var(--text-metric)", fontSize: 20, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
              {rfmtGBP(k.value)}
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
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

/* ── Board Pack Commentary ───────────────────────────────────────────────── */
function ReportBoardCommentary({ model }) {
  const { Icon } = window;
  if (!model || !model.commentary.length) return null;

  return (
    <ReportSection id="board-commentary" title="Board Pack Commentary" icon="message-square">
      <div style={{
        padding: "16px 20px", background: "var(--surface)", borderRadius: "var(--radius-sm)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
          font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
          letterSpacing: ".05em", color: "var(--fg-3)",
        }}>
          <Icon name="sparkles" size={12} color="var(--primary)" />
          AI-generated commentary
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {model.commentary.map((c, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, marginTop: 2 }}>
                <Icon name={c.icon} size={15} color={c.fav ? "var(--favourable)" : "var(--adverse)"} />
              </span>
              <span style={{ font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: c.html }} />
            </li>
          ))}
        </ul>
      </div>
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
  const priorityBg    = { high: "var(--adverse-soft)", medium: "rgba(var(--c-4-rgb, 245, 158, 11), 0.1)", low: "var(--favourable-soft)" };
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
  if (!model || !model.movements.length) return null;

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
            {model.movements.slice(0, 20).map((m, i) => (
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
    </ReportSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REPORTS PAGE — assembles all sections as a management pack preview
 * ═══════════════════════════════════════════════════════════════════════════ */
function Reports({ sessionId, initialData, periodMode, controlledPeriod, onDataChange, analysisType, period }) {
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
        alert("Export failed: " + detail);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `management_pack.${fmt === "pdf" ? "pdf" : "zip"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[MonthEndIQ Export] Failed:", e);
      alert("Export failed: " + e.message);
    } finally {
      setExporting(null);
    }
  };

  const copyFullReport = () => {
    const el = document.querySelector('.content-inner');
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      alert("Report copied to clipboard");
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Report copied to clipboard");
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
    { id: "executive-summary", label: "Executive Summary" },
    { id: "kpi-summary",       label: "KPI Summary" },
    { id: "board-commentary",  label: "Board Commentary" },
    { id: "key-findings",      label: "Key Findings" },
    { id: "variance-table",    label: "Variance Analysis" },
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ font: "var(--text-metric)", fontSize: 22, color: "var(--ink)", margin: 0 }}>
              Management Report
            </h2>
            <p style={{ font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-3)", margin: "4px 0 0" }}>
              {model?.isBvA ? "Budget vs Actual" : "Period-on-Period"} · {model?.periodLabel || ""}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: "var(--radius-sm)",
              background: "var(--surface)", border: "1px solid var(--border)",
              font: "var(--text-body)", fontSize: 12, color: "var(--fg-3)",
            }}>
              <Icon name="eye" size={13} />
              Report Preview
            </div>
            <Button variant="secondary" icon="copy" onClick={copyFullReport}>
              Copy Report
            </Button>
            <Button variant="secondary" icon="file-archive"
              onClick={() => doExport("zip")}
              disabled={!!exporting}>
              {exporting === "zip" ? "Exporting..." : "CSV Pack"}
            </Button>
            <Button variant="primary" icon={exporting === "pdf" ? "loader" : "download"}
              onClick={() => doExport("pdf")}
              disabled={!!exporting}>
              {exporting === "pdf" ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Section quick-nav */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap",
        }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              style={{
                font: "var(--text-body)", fontSize: 12, padding: "5px 12px",
                borderRadius: "var(--radius-pill)", border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--fg-2)", cursor: "pointer",
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Report sections */}
        <ReportExecutiveSummary model={model} />
        <ReportKpiSummary model={model} />
        <ReportBoardCommentary model={model} />
        <ReportKeyFindings model={model} />
        <ReportVarianceTable model={model} />
        <ReportRecommendedActions model={model} />

        {/* Footer */}
        <div style={{
          marginTop: 12, padding: "14px 18px",
          background: "var(--primary-soft)", borderRadius: "var(--radius-sm)",
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
  ReportBoardCommentary,
  ReportKeyFindings,
  ReportRecommendedActions,
  ReportVarianceTable,
});
