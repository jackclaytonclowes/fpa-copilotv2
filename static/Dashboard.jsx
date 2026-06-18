/* FP&A Copilot — main variance dashboard (real API data) */
const { useState: useStateDash, useEffect: useEffectDash, useRef: useRefDash } = React;

/* ── AnomalyPanel ───────────────────────────────────────────────────────── */
function AnomalyPanel({ sessionId, selectedPeriod, periodMode }) {
  const { Icon } = window;
  const [result,   setResult]   = React.useState(null);
  const [loading,  setLoading]  = React.useState(true);
  const [sigma,    setSigma]    = React.useState(1.5);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    const params = new URLSearchParams({
      period: selectedPeriod || "",
      mode:   periodMode || "monthly",
      sigma,
    });
    fetch(apiUrl(`/api/anomalies/${sessionId}?${params}`))
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [sessionId, selectedPeriod, periodMode, sigma]);

  const fmtGBP = (v) => {
    if (v == null || isNaN(v)) return "—";
    const abs = Math.abs(v), sign = v < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(2)}m`;
    if (abs >= 1_000)     return `${sign}£${(abs / 1_000).toFixed(0)}k`;
    return `${sign}£${Math.round(abs).toLocaleString("en-GB")}`;
  };

  const anomalies = result?.anomalies || [];
  const note      = result?.note;

  if (note || (!loading && anomalies.length === 0)) return null;

  const visible = expanded ? anomalies : anomalies.slice(0, 3);
  const sigmaColor = (z) =>
    z >= 3 ? "var(--adverse)" : z >= 2 ? "var(--caution)" : "var(--fg-3)";
  const sigmaLabel = (z) =>
    z >= 3 ? "High" : z >= 2 ? "Moderate" : "Low";

  return (
    <div style={{
      marginBottom: 20,
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      background: "var(--surface)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
        borderBottom: loading || !anomalies.length ? "none" : "1px solid var(--border)",
        background: "var(--surface-2)",
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: anomalies.length ? "var(--caution-soft)" : "var(--surface-3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="zap" size={15} color={anomalies.length ? "var(--caution)" : "var(--fg-3)"} />
        </span>
        <div style={{ flex: 1 }}>
          <span style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--ink)" }}>
            Statistical anomalies
          </span>
          <span style={{ marginLeft: 10, font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
            {loading ? "Scanning…"
              : anomalies.length
                ? `${anomalies.length} account${anomalies.length > 1 ? "s" : ""} deviate from historical pattern · ${result?.period}`
                : `No unusual movements detected · ${result?.period}`}
          </span>
        </div>
        {/* Sensitivity selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>Sensitivity</span>
          {[[1.5, "High"], [2.0, "Med"], [2.5, "Low"]].map(([s, lbl]) => (
            <button key={s} onClick={() => setSigma(s)}
              style={{
                padding: "3px 9px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                border: sigma === s ? "1.5px solid var(--primary)" : "1px solid var(--border-strong)",
                background: sigma === s ? "var(--primary-soft)" : "transparent",
                color: sigma === s ? "var(--primary)" : "var(--fg-3)",
                font: "var(--text-label)", fontSize: 10.5,
              }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Anomaly cards */}
      {!loading && anomalies.length > 0 && (
        <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: a.is_fav ? "var(--favourable-soft)" : "var(--adverse-soft)",
              border: `1px solid ${a.is_fav ? "var(--favourable-border)" : "var(--adverse-border)"}`,
            }}>
              {/* Sigma badge */}
              <div style={{
                flexShrink: 0, textAlign: "center", minWidth: 44,
                padding: "4px 8px", borderRadius: "var(--radius-sm)",
                background: "rgba(0,0,0,0.06)",
              }}>
                <div style={{ font: "700 13px var(--font-mono)", color: sigmaColor(a.z_score) }}>
                  {a.z_score.toFixed(1)}σ
                </div>
                <div style={{ font: "var(--text-label)", fontSize: 9, textTransform: "uppercase", color: sigmaColor(a.z_score) }}>
                  {sigmaLabel(a.z_score)}
                </div>
              </div>

              {/* Account info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.account}
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>
                  {a.category} ·{" "}
                  {a.change_pct != null
                    ? `${a.change_pct > 0 ? "+" : ""}${a.change_pct.toFixed(1)}% vs avg`
                    : "unusual value"}
                  {" "}· avg {fmtGBP(a.historical_mean)}
                </div>
              </div>

              {/* Current vs mean */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ font: "600 13px var(--font-mono)", color: a.is_fav ? "var(--favourable-text)" : "var(--adverse-text)", fontVariantNumeric: "tabular-nums" }}>
                  {fmtGBP(a.current_value)}
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>
                  {a.is_fav ? "Favourable" : "Adverse"}
                </div>
              </div>
            </div>
          ))}

          {anomalies.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                alignSelf: "flex-start", padding: "4px 12px", borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-strong)", background: "transparent",
                color: "var(--fg-3)", font: "var(--text-body-strong)", fontSize: 12.5, cursor: "pointer",
              }}>
              {expanded
                ? "Show fewer"
                : `Show ${anomalies.length - 3} more anomal${anomalies.length - 3 > 1 ? "ies" : "y"}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ForecastPanel ──────────────────────────────────────────────────────── */
function ForecastPanel({ sessionId, periodMode }) {
  const { Icon, Card, Chip, TrendChart } = window;
  const [fcData,   setFcData]   = React.useState(null);
  const [lookback, setLookback] = React.useState(3);
  const [loading,  setLoading]  = React.useState(false);
  const [error,    setError]    = React.useState(null);

  React.useEffect(() => {
    if (!sessionId || periodMode === "ytd") return;
    setLoading(true);
    setError(null);
    fetch(apiUrl(`/api/forecast/${sessionId}?lookback=${lookback}&mode=${periodMode}`))
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setFcData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, lookback, periodMode]);

  const fmtGBP = (v) => {
    if (v == null || isNaN(v)) return "—";
    return (v < 0 ? "-£" : "£") + Math.abs(Math.round(v)).toLocaleString("en-GB");
  };

  const combined     = fcData?.combined || [];
  const forecastFrom = fcData ? (fcData.actuals || []).length : 0;
  const hasProjection = (fcData?.forecast || []).length > 0;

  return (
    <Card
      title="Rolling forecast"
      sub={loading ? "Loading…" : fcData ? `${fcData.lookback_used}-period trailing average · ${(fcData.forecast||[]).length} periods projected` : ""}
      action={<Chip tone="info" icon="trending-up">Forecast</Chip>}
    >
      {/* Lookback selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--fg-2)" }}>
          Trailing average:
        </span>
        {[3, 6, 12].map((n) => (
          <button key={n} onClick={() => setLookback(n)}
            style={{
              padding: "4px 12px", borderRadius: "var(--radius-pill)",
              border: lookback === n ? "1.5px solid var(--primary)" : "1px solid var(--border-strong)",
              background: lookback === n ? "var(--primary-soft)" : "var(--surface-2)",
              color: lookback === n ? "var(--primary)" : "var(--fg-2)",
              font: "var(--text-body-strong)", fontSize: 12.5, cursor: "pointer",
            }}>
            {n}m
          </button>
        ))}
        <span style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginLeft: 4 }}>
          {loading ? "Loading…" : error ? "Error — is the session still active?" : ""}
        </span>
      </div>

      {/* Chart */}
      {!loading && combined.length > 1 && (
        <TrendChart
          data={combined}
          series={[
            { key: "revenue", label: "Revenue", color: "var(--c-1)" },
            { key: "costs",   label: "Costs",   color: "var(--c-6)" },
            { key: "profit",  label: "Profit",  color: "var(--c-5)" },
          ]}
          forecastFrom={forecastFrom}
        />
      )}

      {/* Projection summary table */}
      {!loading && hasProjection && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <div style={{
            font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
            letterSpacing: ".06em", color: "var(--fg-3)", marginBottom: 8,
          }}>Projected periods (trailing {lookback}m avg)</div>
          <table className="var">
            <thead>
              <tr>
                <th className="l">Period</th>
                <th>Revenue</th>
                <th>Costs</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {(fcData.forecast || []).map((r, i) => (
                <tr key={i}>
                  <td className="l" style={{ color: "var(--fg-2)", fontStyle: "italic" }}>{r.full}</td>
                  <td>{fmtGBP(r.revenue)}</td>
                  <td>{fmtGBP(r.costs)}</td>
                  <td style={{ color: r.profit >= 0 ? "var(--favourable-text)" : "var(--adverse-text)" }}>
                    {fmtGBP(r.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
            * Projections use a simple trailing average — not a statistical model. Review assumptions before using in management packs.
          </div>
        </div>
      )}

      {!loading && !hasProjection && combined.length > 0 && (
        <div style={{ textAlign: "center", padding: "12px 0", font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
          All months in the current year already have actuals — no forecast periods needed.
        </div>
      )}
    </Card>
  );
}

const CHART_COLORS = ["var(--c-1)","var(--c-2)","var(--c-3)","var(--c-4)","var(--c-5)","var(--c-6)","var(--c-7)","var(--c-8)"];

function Dashboard({ sessionId, initialData, periodMode, controlledPeriod, onDataChange, onModeChange, analysisType }) {
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
      const res = await fetch(apiUrl(`/api/data/${sessionId}?${params}`));
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

  const isBvA = (analysisType || data.analysis_type) === "budget_vs_actual";
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

  // ── BvA KPI helpers ────────────────────────────────────────────────
  const bvaRevKpi  = isBvA ? (kpis || []).find(k => !k.pct_only && k.icon === "trending-up")  : null;
  const bvaProfKpi = isBvA ? (kpis || []).find(k => !k.pct_only && k.icon === "wallet")        : null;

  // ── BvA account-level profit waterfall bars ─────────────────────
  // Profit impact: Revenue variance improves profit; cost overspend reduces it.
  let bvaWaterfallBars  = null;
  let bvaWaterfallReady = false;
  if (isBvA && bvaProfKpi && bvaProfKpi.prior != null && bvaProfKpi.value != null) {
    const budgetProfit = bvaProfKpi.prior;
    const actualProfit = bvaProfKpi.value;
    const netVariance  = actualProfit - budgetProfit;

    const rawBars = (movements || [])
      .filter(m => m.variance != null && m.variance !== 0)
      .map(m => ({
        label:  m.account,
        impact: m.category === "Revenue" ? Number(m.variance) : -Number(m.variance),
        fav:    m.is_fav,
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 8);

    // Residual: keep waterfall balanced
    const explained = rawBars.reduce((s, b) => s + b.impact, 0);
    const residual  = Math.round(netVariance - explained);
    if (Math.abs(residual) > 1) {
      rawBars.push({ label: "Other", impact: residual, fav: residual > 0 });
    }

    bvaWaterfallBars  = rawBars;
    bvaWaterfallReady = true;
  }

  return (
    <div className="content-inner reveal" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>

      {/* ── BvA analysis context badge ─────────────────────────────── */}
      {isBvA && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            font: "var(--text-body-strong)", fontSize: 11.5,
            padding: "3px 10px", borderRadius: "var(--radius-pill)",
            background: "var(--primary-soft)", color: "var(--primary)",
          }}>
            <Icon name="target" size={12} />
            Budget vs Actual
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            font: "var(--text-body)", fontSize: 11.5,
            padding: "3px 10px", borderRadius: "var(--radius-pill)",
            background: "var(--surface-2)", color: "var(--fg-2)",
          }}>
            <Icon name="calendar" size={12} />
            {(() => {
              const sp = data.selected_bva_period;
              if (!sp || sp === "full_year") return "Full Year";
              try { return new Date(sp + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
              catch (_) { return sp; }
            })()}
          </span>
        </div>
      )}

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

      {/* ── BvA Revenue & Profit summary cards ────────────────────── */}
      {isBvA && (bvaRevKpi || bvaProfKpi) && (
        <div className="bva-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {[
            bvaRevKpi  && { label: "Actual Revenue",  value: bvaRevKpi.value,    isVar: false },
            bvaRevKpi  && { label: "Budget Revenue",  value: bvaRevKpi.prior,    isVar: false },
            bvaRevKpi  && { label: "Revenue Variance",value: bvaRevKpi.variance, isVar: true,  isFav: bvaRevKpi.is_fav,  pct: bvaRevKpi.pct },
            bvaProfKpi && { label: "Actual Profit",   value: bvaProfKpi.value,   isVar: false },
            bvaProfKpi && { label: "Budget Profit",   value: bvaProfKpi.prior,   isVar: false },
            bvaProfKpi && { label: "Profit Variance", value: bvaProfKpi.variance,isVar: true,  isFav: bvaProfKpi.is_fav, pct: bvaProfKpi.pct },
          ].filter(Boolean).map((c) => (
            <div key={c.label} className="card" style={{ padding: "14px 16px" }}>
              <div style={{
                font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
                letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6,
              }}>{c.label}</div>
              <div style={{
                font: "var(--text-metric)", fontSize: 20, fontVariantNumeric: "tabular-nums",
                color: c.isVar
                  ? (c.isFav ? "var(--favourable-text)" : "var(--adverse-text)")
                  : "var(--ink)",
              }}>
                {c.isVar ? fmtSignedGBP(c.value) : fmtGBP(c.value)}
              </div>
              {c.isVar && c.pct != null && (
                <div style={{
                  marginTop: 4, font: "var(--text-body-strong)", fontSize: 12,
                  color: c.isFav ? "var(--favourable-text)" : "var(--adverse-text)",
                }}>
                  {fmtPct(c.pct)} vs budget
                </div>
              )}
              {!c.isVar && (
                <div style={{ marginTop: 4, font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                  {c.label.startsWith("Actual") ? "Actual performance" : "Original budget"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistical anomaly detection */}
      {!isBvA && periodMode !== "ytd" && (
        <AnomalyPanel
          sessionId={sessionId}
          selectedPeriod={selected_period}
          periodMode={periodMode}
        />
      )}

      {/* Trend + AI commentary */}
      <div className="grid-2">
        {!isBvA && (
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
        )}
        <Card
          title="AI commentary"
          sub={isBvA ? "Budget vs Actual · key variances" : `${period?.label || selected_period} · vs prior period`}
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

      {/* ── BvA Profit Variance Waterfall ──────────────────────────── */}
      {isBvA && bvaWaterfallReady && (
        <Card
          title="Profit Variance Waterfall"
          sub="How Budget Profit becomes Actual Profit — top account drivers"
          action={<Chip tone="info" icon="bar-chart-2">Waterfall</Chip>}
        >
          {/* Summary row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            paddingBottom: 14, marginBottom: 14,
            borderBottom: "1px solid var(--border)",
          }}>
            <div>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5, marginBottom: 3 }}>
                Budget Profit
              </div>
              <div style={{ font: "var(--text-metric)", fontSize: 21, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {fmtGBP(bvaProfKpi.prior)}
              </div>
            </div>
            <div style={{ color: "var(--fg-3)", fontSize: 20, flexShrink: 0 }}>→</div>
            <div>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5, marginBottom: 3 }}>
                Actual Profit
              </div>
              <div style={{ font: "var(--text-metric)", fontSize: 21, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {fmtGBP(bvaProfKpi.value)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5 }}>Net Variance</div>
              <Delta fav={bvaProfKpi.variance >= 0} up={bvaProfKpi.variance >= 0}>
                {fmtSignedGBP(bvaProfKpi.variance)}
              </Delta>
            </div>
          </div>

          {/* Account-level waterfall chart */}
          <WaterfallChart
            prior={bvaProfKpi.prior}
            current={bvaProfKpi.value}
            bars={bvaWaterfallBars}
            priorLabel="Budget"
            currentLabel="Actual"
          />

          {/* Account legend — scrollable list with fav/adv colour coding */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 5 }}>
            {bvaWaterfallBars.map((b, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "5px 10px", borderRadius: "var(--radius-sm)",
                background: b.fav ? "var(--favourable-soft)" : "var(--adverse-soft)",
              }}>
                <span style={{ flexShrink: 0 }}>
                  <Icon
                    name={b.fav ? "trending-up" : "trending-down"}
                    size={13}
                    color={b.fav ? "var(--favourable)" : "var(--adverse)"}
                  />
                </span>
                <span style={{ flex: 1, font: "var(--text-body)", fontSize: 13, color: "var(--ink)" }}>
                  {b.label}
                </span>
                <span style={{
                  font: "600 13px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                  color: b.fav ? "var(--favourable-text)" : "var(--adverse-text)",
                  whiteSpace: "nowrap",
                }}>
                  {fmtSignedGBP(b.impact)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Revenue + Expense splits */}
      <div className="grid-2b">
        <Card title="Revenue split" sub={period?.label || selected_period}>
          <div className="donut-wrap" style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <Donut data={revSplit} total={"£" + Math.round(revTotal / 1000) + "k"} label="revenue" />
            <div className="legend" style={{ flex: 1, minWidth: 0 }}>
              {revSplit.map((it) => (
                <div className="lg" key={it.name}>
                  <span className="sw" style={{ background: it.c }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
                  <span className="v">{fmtGBP(it.value)}</span>
                  <span className="pct">{revTotal > 0 ? ((it.value / revTotal) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Expense split" sub={period?.label || selected_period}>
          <div className="donut-wrap" style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <Donut data={expSplit} total={"£" + Math.round(expTotal / 1000) + "k"} label="costs" />
            <div className="legend" style={{ flex: 1, minWidth: 0 }}>
              {expSplit.map((it) => (
                <div className="lg" key={it.name}>
                  <span className="sw" style={{ background: it.c }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
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
          title={isBvA ? "Budget vs Actual Profit Drivers" : "Profit Drivers"}
          sub={isBvA
            ? "What drove the difference between Actual and Budget profit?"
            : `${period?.label || selected_period} · vs ${period?.prior || "prior period"} · what drove the change?`}
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
                {isBvA ? "Budget profit" : (period?.prior || "Prior period")}
              </div>
              <div style={{ font: "var(--text-metric)", fontSize: 21, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {fmtGBP(waterfall.prior_profit)}
              </div>
            </div>

            <div style={{ color: "var(--fg-3)", fontSize: 20, flexShrink: 0 }}>→</div>

            {/* Current / Actual profit */}
            <div>
              <div style={{ font: "var(--text-label)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", fontSize: 10.5, marginBottom: 3 }}>
                {isBvA ? "Actual profit" : (period?.label || selected_period)}
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
                    if (isBvA) {
                      if (b.label === "Revenue") {
                        subLabel = b.fav ? "Revenue above budget" : "Revenue below budget";
                      } else if (b.label === "Other Movements") {
                        subLabel = b.fav ? "Other items above budget (net)" : "Other items below budget (net)";
                      } else {
                        subLabel = b.fav ? "Costs below budget (favourable)" : "Costs above budget (adverse)";
                      }
                    } else if (b.label === "Revenue") {
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
        sub={isBvA ? "Actual vs Budget · sorted by absolute variance" : `${period?.label || selected_period} vs prior period`}>
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
                  <th>{isBvA ? "Actual" : "Current"}</th>
                  <th>{isBvA ? "Budget" : "Prior"}</th>
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

      {/* ── Rolling Forecast ─────────────────────────────────── */}
      {!isBvA && periodMode !== "ytd" && (trend || []).length > 2 && (
        <ForecastPanel sessionId={sessionId} periodMode={periodMode} />
      )}
    </div>
  );
}
Object.assign(window, { Dashboard });
