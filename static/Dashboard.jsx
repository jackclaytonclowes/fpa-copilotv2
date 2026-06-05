/* FP&A Copilot — main variance dashboard (real API data) */
const { useState: useStateDash, useEffect: useEffectDash, useRef: useRefDash } = React;

const CHART_COLORS = ["var(--c-1)","var(--c-2)","var(--c-3)","var(--c-4)","var(--c-5)","var(--c-6)","var(--c-7)","var(--c-8)"];

function Dashboard({ sessionId, initialData, periodMode, controlledPeriod, onDataChange, onModeChange }) {
  const { Icon, Card, Button, Delta, Chip, TrendChart, Donut, WaterfallChart } = window;
  const [data, setData]       = useStateDash(initialData);
  const [loading, setLoading] = useStateDash(false);
  const [activeTab, setActiveTab] = useStateDash("movements");

  // Track what we last fetched so we don't re-fetch on initial mount
  const lastFetched = useRefDash({ period: initialData?.selected_period, mode: periodMode });

  /* ── formatters ── */
  const fmtGBP = (v) => {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return (v < 0 ? "-£" : "£") + Math.abs(Math.round(v)).toLocaleString("en-GB");
  };
  const fmtSignedGBP = (v) => {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return (v > 0 ? "+" : v < 0 ? "-" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB");
  };
  const fmtPct = (v) => {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v).toFixed(1) + "%";
  };

  /* ── data fetching ── */
  const fetchPeriod = async (period, mode) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, mode });
      const res = await fetch(`/api/data/${sessionId}?${params}`);
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        onDataChange && onDataChange(newData);
        lastFetched.current = { period: newData.selected_period, mode };
      }
    } finally {
      setLoading(false);
    }
  };

  // React to TopBar period change (controlledPeriod prop)
  useEffectDash(() => {
    if (!controlledPeriod) return;
    if (controlledPeriod === lastFetched.current.period && periodMode === lastFetched.current.mode) return;
    fetchPeriod(controlledPeriod, periodMode);
  }, [controlledPeriod, periodMode]);

  if (!data) return <div className="loading"><div className="spinner" />Loading…</div>;

  const { kpis, trend, revenue_split, expense_split, movements, commentary, waterfall, period, selected_period } = data;

  // Short month labels for waterfall x-axis  e.g. "August 2025" → "Aug"
  const shortLabel = (lbl) => lbl ? lbl.split(" ")[0].slice(0, 3) : "";

  // Log full waterfall source values to browser console for inspection
  React.useEffect(() => {
    if (!waterfall) return;

    const fmtGBPc = (v) => (v < 0 ? "-£" : "£") + Math.abs(Math.round(v)).toLocaleString("en-GB");
    const fmtDiff = (v) => (v >= 0 ? "+" : "") + fmtGBPc(v);

    console.group("[FP&A Copilot] Profit Drivers — source values");
    console.log("Period        :", period?.label, "vs", period?.prior);
    console.log("Prior profit  :", fmtGBPc(waterfall.prior_profit));
    console.log("Current profit:", fmtGBPc(waterfall.current_profit));
    console.log("Net change    :", fmtDiff(waterfall.net_change));
    console.log("Reconciles    :", waterfall.reconciles);
    console.log("");
    console.log("Category detail (Prior → Current → Raw Variance → Profit Impact):");
    (waterfall.category_detail || []).forEach((d) => {
      const type   = d.is_revenue ? "revenue  [formula: current − prior]" : "cost     [formula: prior − current]";
      const verify = d.is_revenue
        ? (d.current - d.prior).toFixed(2)
        : (d.prior   - d.current).toFixed(2);
      console.log(
        `  ${d.category.padEnd(30)} ` +
        `Prior=${fmtGBPc(d.prior).padStart(12)}  ` +
        `Current=${fmtGBPc(d.current).padStart(12)}  ` +
        `RawVar=${fmtDiff(d.raw_variance).padStart(12)}  ` +
        `ProfitImpact=${fmtDiff(d.profit_impact).padStart(12)}  ` +
        `(${type}, check=${verify})`
      );
    });
    console.log("");
    const barSum = waterfall.bars.reduce((s, b) => s + b.impact, 0);
    console.log("Bar sum       :", fmtDiff(Math.round(barSum)));
    console.log("Net change    :", fmtDiff(waterfall.net_change));
    console.log("Diff          :", fmtDiff(Math.round(waterfall.net_change - barSum)));
    if (!waterfall.reconciles) {
      console.warn("[FP&A Copilot] ⚠ Waterfall does not reconcile — check account categorisation");
    }
    console.groupEnd();
  }, [waterfall]);

  // Donut colours
  const revSplit = (revenue_split || []).map((d, i) => ({ ...d, c: CHART_COLORS[i % 8] }));
  const expSplit = (expense_split || []).map((d, i) => ({ ...d, c: CHART_COLORS[i % 8] }));
  const revTotal = revSplit.reduce((a, b) => a + b.value, 0);
  const expTotal = expSplit.reduce((a, b) => a + b.value, 0);

  const tabs = ["movements", "revenue", "costs", "commentary"];

  return (
    <div className="content-inner reveal" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>

      {/* KPI row */}
      <div className="grid-kpi">
        {(kpis || []).map((k) => (
          <div key={k.label} className="card kpi">
            <div className="lbl">
              <span className="ic"><Icon name={k.icon} size={15} /></span>
              {k.label}
            </div>
            <div className="val">{k.pct_only ? fmtPct(k.pct) : fmtGBP(k.value)}</div>
            {!k.pct_only && k.variance !== null && (
              <Delta fav={k.is_fav} up={k.variance >= 0}>
                {fmtSignedGBP(k.variance)} · {fmtPct(k.pct)}
              </Delta>
            )}
            {k.pct_only && (
              <Delta fav={k.is_fav} up={k.variance >= 0}>
                vs {period?.prior || "prior"}
              </Delta>
            )}
          </div>
        ))}
      </div>

      {/* Trend + AI commentary */}
      <div className="grid-2">
        <Card
          title="Revenue vs costs vs profit"
          sub={`Last ${(trend || []).length} periods · ${periodMode}`}
          action={<Chip tone="info" icon="line-chart">Trend</Chip>}>
          {trend && trend.length > 1 ? (
            <TrendChart data={trend} series={[
              { key: "revenue", label: "Revenue", color: "var(--c-1)" },
              { key: "costs",   label: "Costs",   color: "var(--c-6)" },
              { key: "profit",  label: "Profit",  color: "var(--c-5)" },
            ]} />
          ) : (
            <div className="loading">Not enough periods for a trend chart</div>
          )}
        </Card>
        <Card
          title="AI commentary"
          sub={`${period?.label || selected_period} · vs prior period`}
          action={<span className="ai-badge"><Icon name="sparkles" size={13} />AI</span>}>
          <ul className="ai-list">
            {(commentary || []).map((c, i) => (
              <li key={i}>
                <span className="ic">
                  <Icon name={c.icon} size={16} color={c.fav ? "var(--favourable)" : "var(--adverse)"} />
                </span>
                <span dangerouslySetInnerHTML={{ __html: c.html }} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Revenue + Expense splits */}
      <div className="grid-2b">
        <Card title="Revenue split" sub={period?.label || selected_period}>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <Donut data={revSplit} total={"£" + Math.round(revTotal / 1000) + "k"} label="revenue" />
            <div className="legend" style={{ flex: 1 }}>
              {revSplit.map((it) => (
                <div className="lg" key={it.name}>
                  <span className="sw" style={{ background: it.c }} />{it.name}
                  <span className="v">{fmtGBP(it.value)}</span>
                  <span className="pct">{revTotal > 0 ? ((it.value / revTotal) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Expense split" sub={period?.label || selected_period}>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <Donut data={expSplit} total={"£" + Math.round(expTotal / 1000) + "k"} label="costs" />
            <div className="legend" style={{ flex: 1 }}>
              {expSplit.map((it) => (
                <div className="lg" key={it.name}>
                  <span className="sw" style={{ background: it.c }} />{it.name}
                  <span className="v">{fmtGBP(it.value)}</span>
                  <span className="pct">{expTotal > 0 ? ((it.value / expTotal) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Profit Drivers / Waterfall ─────────────────────────── */}
      {waterfall && (
        <Card
          title="Profit Drivers"
          sub={`${period?.label || selected_period} · vs ${period?.prior || "prior period"} · what drove the change?`}
          action={<Chip tone="info" icon="bar-chart-2">Waterfall</Chip>}
        >
          {/* ── Summary row ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            paddingBottom: 14, marginBottom: 14,
            borderBottom: "1px solid var(--border)",
          }}>
            {/* Prior profit */}
            <div>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5, marginBottom: 3 }}>
                {period?.prior || "Prior period"}
              </div>
              <div style={{ font: "var(--text-metric)", fontSize: 21, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {fmtGBP(waterfall.prior_profit)}
              </div>
            </div>

            <div style={{ color: "var(--fg-3)", fontSize: 20, flexShrink: 0 }}>→</div>

            {/* Current profit */}
            <div>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5, marginBottom: 3 }}>
                {period?.label || selected_period}
              </div>
              <div style={{ font: "var(--text-metric)", fontSize: 21, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {fmtGBP(waterfall.current_profit)}
              </div>
            </div>

            {/* Net change delta */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5 }}>Net change</div>
              <Delta fav={waterfall.net_change >= 0} up={waterfall.net_change >= 0}>
                {fmtSignedGBP(waterfall.net_change)}
              </Delta>
            </div>

            {/* Largest driver pills */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {waterfall.largest_positive && (
                <span style={{
                  font: "var(--text-body-strong)", fontSize: 12, padding: "4px 11px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--favourable-soft)", color: "var(--favourable-text)",
                  display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                }}>
                  <Icon name="trending-up" size={12} />
                  {waterfall.largest_positive.label}: {fmtSignedGBP(waterfall.largest_positive.impact)}
                </span>
              )}
              {waterfall.largest_negative && (
                <span style={{
                  font: "var(--text-body-strong)", fontSize: 12, padding: "4px 11px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--adverse-soft)", color: "var(--adverse-text)",
                  display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                }}>
                  <Icon name="trending-down" size={12} />
                  {waterfall.largest_negative.label}: {fmtSignedGBP(waterfall.largest_negative.impact)}
                </span>
              )}
            </div>
          </div>

          {/* ── Category impact table + Waterfall chart ── */}
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start" }}>
            {/* Left: category impact table */}
            <div>
              {/* Section title + helper text */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--fg-3)", fontSize: 10.5, marginBottom: 4 }}>
                  Impact on Profit
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.4 }}>
                  Positive values improved profit.{" "}
                  Negative values reduced profit.
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {waterfall.bars.map((b, i) => {
                    const det = (waterfall.category_detail || []).find(d => d.category === b.label);
                    const priorLbl   = period?.prior  || "Prior";
                    const currentLbl = period?.label  || "Current";

                    // ── Rich tooltip ──────────────────────────────────────
                    let tooltip = null;
                    if (det) {
                      const rawAbs   = Math.abs(Math.round(det.raw_variance));
                      const rawDir   = det.raw_variance >= 0 ? "increased" : "decreased";
                      if (det.is_revenue) {
                        tooltip = [
                          b.label,
                          `${priorLbl}: ${fmtGBP(det.prior)}`,
                          `${currentLbl}: ${fmtGBP(det.current)}`,
                          `Movement: revenue ${rawDir} by £${rawAbs.toLocaleString("en-GB")}`,
                          `Profit impact: ${fmtSignedGBP(b.impact)}`,
                        ].join("\n");
                      } else {
                        const costDir  = det.raw_variance >= 0 ? "increased" : "decreased";
                        const effLabel = b.impact >= 0
                          ? "lower costs improved profit"
                          : "higher costs reduced profit";
                        tooltip = [
                          b.label,
                          `${priorLbl}: ${fmtGBP(det.prior)}`,
                          `${currentLbl}: ${fmtGBP(det.current)}`,
                          `Movement: costs ${costDir} by £${rawAbs.toLocaleString("en-GB")}`,
                          `Profit impact: ${fmtSignedGBP(b.impact)} (${effLabel})`,
                        ].join("\n");
                      }
                    }

                    // ── Sub-label (plain-English explanation) ─────────────
                    let subLabel = null;
                    if (b.label === "Revenue") {
                      subLabel = b.fav ? "Higher revenue improved profit" : "Lower revenue reduced profit";
                    } else if (b.label === "Other Movements") {
                      subLabel = b.fav ? "Net other movements improved profit" : "Net other movements reduced profit";
                    } else {
                      subLabel = b.fav ? "Lower costs improved profit" : "Higher costs reduced profit";
                    }

                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
                          title={tooltip || undefined}>
                        <td style={{ padding: "8px 0 6px", cursor: tooltip ? "help" : "default" }}>
                          <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)" }}>
                            {b.label}
                          </div>
                          <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 1, lineHeight: 1.3 }}>
                            {subLabel}
                          </div>
                        </td>
                        <td style={{
                          padding: "8px 0 6px", textAlign: "right", verticalAlign: "top",
                          font: "600 13px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                          color: b.fav ? "var(--favourable-text)" : "var(--adverse-text)",
                          cursor: tooltip ? "help" : "default",
                          whiteSpace: "nowrap",
                        }}>
                          {fmtSignedGBP(b.impact)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Net total row */}
                  <tr>
                    <td style={{ padding: "10px 0 2px" }}>
                      <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>
                        Net profit impact
                      </div>
                    </td>
                    <td style={{
                      padding: "10px 0 2px", textAlign: "right",
                      font: "700 13.5px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                      color: waterfall.net_change >= 0 ? "var(--favourable-text)" : "var(--adverse-text)",
                      borderTop: "1px solid var(--border-strong)",
                    }}>
                      {fmtSignedGBP(waterfall.net_change)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: SVG waterfall */}
            <div>
              <WaterfallChart
                prior={waterfall.prior_profit}
                current={waterfall.current_profit}
                bars={waterfall.bars}
                priorLabel={shortLabel(period?.prior)}
                currentLabel={shortLabel(period?.label)}
              />
            </div>
          </div>

          {/* ── AI commentary ── */}
          <div style={{
            marginTop: 14,
            padding: "11px 15px",
            background: "var(--primary-soft)",
            borderLeft: "3px solid var(--primary)",
            borderRadius: "var(--radius-sm)",
            display: "flex", gap: 10, alignItems: "flex-start",
            font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6,
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}><Icon name="sparkles" size={14} color="var(--primary)" /></span>
            <span>{waterfall.commentary}</span>
          </div>
        </Card>
      )}

      {/* ── Variance movements table — tabbed ─────────────────── */}
      <Card
        title="Variance movements"
        sub={`${period?.label || selected_period} vs prior period`}>
        <div style={{
          display: "flex", gap: 6, marginBottom: 16,
          borderBottom: "1px solid var(--border)", paddingBottom: 0,
        }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{
                font: "var(--text-body-strong)", fontSize: 13, padding: "8px 14px",
                border: "none", background: "transparent",
                color: activeTab === t ? "var(--primary)" : "var(--fg-3)",
                borderBottom: activeTab === t ? "2px solid var(--primary)" : "2px solid transparent",
                cursor: "pointer", textTransform: "capitalize",
              }}>
              {t === "commentary" ? "Commentary"
                : t === "revenue" ? "Revenue"
                : t === "costs"   ? "Costs"
                : "Top movements"}
            </button>
          ))}
        </div>

        {activeTab !== "commentary" && (
          <div style={{ overflowX: "auto" }}>
            <table className="var">
              <thead>
                <tr>
                  <th className="l">Account</th>
                  <th className="l">Category</th>
                  <th>Current</th>
                  <th>Prior</th>
                  <th>Variance</th>
                  <th>Var %</th>
                </tr>
              </thead>
              <tbody>
                {(movements || [])
                  .filter((m) => {
                    if (activeTab === "revenue") return m.category === "Revenue";
                    if (activeTab === "costs")   return m.category !== "Revenue";
                    return true;
                  })
                  .slice(0, 15)
                  .map((m, i) => (
                    <tr key={i}>
                      <td className="l">{m.account}</td>
                      <td className="l">
                        <span className="cat-dot" style={{ background: CHART_COLORS[i % 8] }} />
                        {m.category}
                      </td>
                      <td>{fmtGBP(m.value)}</td>
                      <td>{fmtGBP(m.prior_value)}</td>
                      <td className={m.is_fav ? "fav" : m.variance !== 0 ? "adv" : ""}>
                        {fmtSignedGBP(m.variance)}
                      </td>
                      <td className={m.is_fav ? "fav" : m.variance !== 0 ? "adv" : ""}>
                        {fmtPct(m.variance_pct)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "commentary" && (
          <ul className="ai-list">
            {(commentary || []).map((c, i) => (
              <li key={i}>
                <span className="ic">
                  <Icon name={c.icon} size={16} color={c.fav ? "var(--favourable)" : "var(--adverse)"} />
                </span>
                <span dangerouslySetInnerHTML={{ __html: c.html }} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
Object.assign(window, { Dashboard });
