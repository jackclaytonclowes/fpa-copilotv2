/* FP&A Copilot — Insights view: margins, pareto, momentum, SPPY, run-rate, common-size P&L */

function Insights({ sessionId, selectedPeriod, periodMode, analysisType, sessionData }) {
  const { Icon, Card, RagBadge } = window;
  const fmt   = (v) => window.fmtCurrency(v);
  const fmtC  = (v) => window.fmtCurrency(v, { compact: true });
  const fmtS  = (v) => window.fmtCurrency(v, { signed: true });
  const fmtSC = (v) => window.fmtCurrency(v, { signed: true, compact: true });

  const [data,        setData]        = React.useState(null);
  const [loading,     setLoading]     = React.useState(true);
  const [error,       setError]       = React.useState(null);
  const [csOpen,      setCsOpen]      = React.useState(false);
  const [nrThreshold, setNrThreshold] = React.useState(0.5);

  const [strategy,     setStrategy]     = React.useState(null);
  const [stratLoading, setStratLoading] = React.useState(false);
  const [stratError,   setStratError]   = React.useState(null);

  React.useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    const p = new URLSearchParams({ period: selectedPeriod || "", mode: periodMode || "monthly" });
    fetch(apiUrl(`/api/insights/${sessionId}?${p}`))
      .then(async r => { if (!r.ok) { let msg; try { const e = await r.json(); msg = e.detail || "Failed"; } catch { msg = (await r.text()) || "Failed"; } throw new Error(msg); } return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, selectedPeriod, periodMode]);

  React.useEffect(() => {
    setStrategy(null);
    setStratError(null);
    setStratLoading(false);
  }, [sessionId, selectedPeriod, periodMode]);

  if (analysisType === "budget_vs_actual") return (
    <div style={{ padding: "40px 24px", color: "var(--fg-2)", textAlign: "center" }}>
      <Icon name="info" size={20} color="var(--fg-3)" />
      <div style={{ marginTop: 8, font: "var(--text-body)", fontSize: 14 }}>
        Insights are available for month-on-month sessions. Switch to MoM mode to use this view.
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ padding: "40px 24px", color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name="loader" size={16} color="var(--fg-3)" />
      <span style={{ font: "var(--text-body)", fontSize: 14 }}>Loading insights…</span>
    </div>
  );

  if (error) return (
    <div style={{ padding: "40px 24px", color: "var(--adverse)", font: "var(--text-body)", fontSize: 14 }}>
      {error}
    </div>
  );

  if (!data) return null;

  const { margins, common_size, r12, run_rate, pareto, sppy, momentum, fixed_variable, nonrecurring, period_label } = data;

  const ragThresholds = window.loadRagThresholds ? window.loadRagThresholds() : {};
  const opMarginSt    = window.ragStatus ? window.ragStatus(margins.op_pct, ragThresholds.op_margin) : null;
  const payrollSt     = window.ragStatus ? window.ragStatus(margins.payroll_pct, ragThresholds.payroll_pct) : null;

  /* ── helpers ─────────────────────────────────────────────────────── */
  const pctFmt = (v) => v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}pp`;
  const pcFmt  = (v) => v == null ? "—" : `${v.toFixed(1)}%`;

  const dirIcon = (d) => d === "improving" ? "trending-up" : d === "worsening" ? "trending-down" : "minus";
  const dirColor = (d) => d === "improving" ? "var(--favourable)" : d === "worsening" ? "var(--adverse)" : "var(--fg-3)";
  const dirBg   = (d) => d === "improving" ? "var(--favourable-soft)" : d === "worsening" ? "var(--adverse-soft)" : "var(--surface-2)";
  const dirLabel = (d) => d === "improving" ? "Improving" : d === "worsening" ? "Declining" : "Stable";

  const Divider = () => (
    <div style={{ borderTop: "1px solid var(--border)", margin: "28px 0" }} />
  );

  const SectionTitle = ({ icon, title, sub }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <Icon name={icon} size={16} color="var(--fg-3)" />
      <span style={{ font: "var(--text-body-strong)", fontSize: 15, color: "var(--ink)" }}>{title}</span>
      {sub && <span style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>{sub}</span>}
    </div>
  );

  const MetricCard = ({ label, value, sub, color, icon, small, badge }) => (
    <div style={{
      flex: 1, minWidth: 140, padding: "16px 18px",
      borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
      background: "var(--surface)",
    }}>
      {(icon || badge) ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          {icon && <Icon name={icon} size={14} color={color || "var(--fg-3)"} />}
          {badge}
        </div>
      ) : null}
      <div style={{
        font: "var(--text-mono)", fontSize: small ? 22 : 26, fontWeight: 700,
        color: color || "var(--ink)", lineHeight: 1.1,
      }}>{value}</div>
      <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );

  /* ── Margin sparkline (% over time) ─────────────────────────────── */
  const MarginSparkline = ({ trend }) => {
    if (!trend || trend.length < 2) return null;
    const vals = trend.map(t => t.op_pct).filter(v => v != null);
    if (!vals.length) return null;
    const W = 320, H = 56, pad = 6;
    const mn = Math.min(...vals) - 2, mx = Math.max(...vals) + 2;
    const xs = trend.map((_, i) => pad + (W - 2 * pad) * i / Math.max(trend.length - 1, 1));
    const ys = trend.map(t => t.op_pct != null ? H - pad - (H - 2 * pad) * (t.op_pct - mn) / (mx - mn || 1) : null);
    const pts = trend.map((t, i) => t.op_pct != null ? `${xs[i].toFixed(1)},${ys[i].toFixed(1)}` : null).filter(Boolean);
    const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p).join(" ");
    const latest = trend[trend.length - 1];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible", flexShrink: 0, maxWidth: "100%" }}>
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
          {trend.map((t, i) => t.op_pct != null && (
            <g key={i}>
              <circle cx={xs[i]} cy={ys[i]} r={3} fill="var(--primary)" />
              <text x={xs[i]} y={H + 12} textAnchor="middle"
                style={{ font: "500 9px var(--font-mono)", fill: "var(--fg-3)" }}>{t.m}</text>
            </g>
          ))}
        </svg>
        <div>
          <div style={{ font: "var(--text-mono)", fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>
            {latest.op_pct != null ? `${latest.op_pct.toFixed(1)}%` : "—"}
          </div>
          <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
            Operating margin · {latest.full}
          </div>
          {margins.payroll_pct != null && (
            <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>
              Payroll {margins.payroll_pct.toFixed(1)}% of revenue
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Momentum traffic lights ─────────────────────────────────────── */
  const MomentumRow = () => {
    if (!momentum.available) return (
      <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
        Requires 6+ months of data to compute momentum.
      </div>
    );
    const items = [
      { label: "Revenue",  dir: momentum.revenue_dir },
      { label: "Costs",    dir: momentum.cost_dir    },
      { label: "Profit",   dir: momentum.profit_dir  },
    ];
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {items.map(({ label, dir }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: "var(--radius-pill)",
            background: dirBg(dir), border: "1px solid var(--border)",
          }}>
            <Icon name={dirIcon(dir)} size={14} color={dirColor(dir)} />
            <span style={{ font: "var(--text-label)", fontSize: 13, color: dirColor(dir) }}>{label}</span>
            <span style={{ font: "var(--text-caption)", fontSize: 11, color: dirColor(dir), opacity: 0.85 }}>
              {dirLabel(dir)}
            </span>
          </div>
        ))}
        <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", alignSelf: "center", marginLeft: 4 }}>
          avg last 3 periods vs prior 3
        </div>
      </div>
    );
  };

  /* ── SPPY ────────────────────────────────────────────────────────── */
  const SPPYSection = () => {
    if (!sppy.available) return (
      <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
        Requires 13+ months of data — {period_label} compared to same month last year.
      </div>
    );
    const rows = [
      { label: "Revenue", curr: sppy.revenue,  prev: sppy.revenue, delta: sppy.rev_delta,  pct: sppy.rev_pct,  fav: sppy.rev_delta >= 0 },
      { label: "Costs",   curr: sppy.costs,    prev: sppy.costs,   delta: sppy.cost_delta, pct: null,          fav: sppy.cost_delta <= 0 },
      { label: "Profit",  curr: sppy.profit,   prev: sppy.profit,  delta: sppy.prof_delta, pct: sppy.prof_pct, fav: sppy.prof_delta >= 0 },
    ];
    return (
      <div>
        <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>
          Comparing {period_label} vs {sppy.period_label} (same month, prior year)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {rows.map(({ label, delta, pct, fav }) => delta != null && (
            <div key={label} style={{
              padding: "14px 16px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)", background: "var(--surface)",
            }}>
              <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-3)", marginBottom: 6 }}>
                {label} YoY
              </div>
              <div style={{
                font: "var(--text-mono)", fontSize: 20, fontWeight: 700,
                color: fav ? "var(--favourable)" : "var(--adverse)",
              }}>
                {fmtSC(delta)}
              </div>
              {pct != null && (
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: fav ? "var(--favourable)" : "var(--adverse)", marginTop: 3 }}>
                  {pct > 0 ? "+" : ""}{pct.toFixed(1)}% vs PY
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── Run-rate & R12 ─────────────────────────────────────────────── */
  const ProjectionSection = () => {
    const rrRows = [
      { label: "Revenue",  val: run_rate.revenue },
      { label: "Costs",    val: run_rate.costs   },
      { label: "Profit",   val: run_rate.profit  },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: r12.available ? "repeat(auto-fit, minmax(240px, 1fr))" : "1fr", gap: 24 }}>
        {/* Run-rate */}
        <div>
          <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)", marginBottom: 12 }}>
            Run-rate annualisation <span style={{ fontWeight: 400, color: "var(--fg-3)" }}>(current month × 12)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rrRows.map(({ label, val }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--surface-2)",
              }}>
                <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)" }}>{label}</span>
                <span style={{ font: "var(--text-mono)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  {val != null ? fmt(val) : "—"}
                </span>
              </div>
            ))}
            {run_rate.op_pct != null && (
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
                Operating margin {run_rate.op_pct.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
        {/* R12 */}
        {r12.available && (
          <div>
            <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)", marginBottom: 12 }}>
              Rolling 12-month (R12) <span style={{ fontWeight: 400, color: "var(--fg-3)" }}>({r12.periods_used} periods)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Revenue", r12.revenue, r12.prior_revenue], ["Costs", r12.costs, r12.prior_costs], ["Profit", r12.profit, r12.prior_profit]].map(([label, val, prior]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)", background: "var(--surface-2)",
                }}>
                  <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)" }}>{label}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ font: "var(--text-mono)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                      {val != null ? fmt(val) : "—"}
                    </span>
                    {prior != null && val != null && (
                      <div style={{ font: "var(--text-caption)", fontSize: 10, color: "var(--fg-3)" }}>
                        vs {fmt(prior)} prior R12
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {r12.op_pct != null && (
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
                  R12 operating margin {r12.op_pct.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Pareto chart ────────────────────────────────────────────────── */
  const ParetoSection = () => {
    if (!pareto.lines.length) return null;
    const top = pareto.lines[0]?.value || 1;
    return (
      <div>
        <div style={{
          display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap",
        }}>
          {[["Top 3 lines", pareto.top3_pct], ["Top 5 lines", pareto.top5_pct]].map(([label, pct]) => (
            <div key={label} style={{
              padding: "6px 14px", borderRadius: "var(--radius-pill)",
              background: "var(--primary-soft)", color: "var(--primary)",
              font: "var(--text-label)", fontSize: 12,
            }}>
              {label} = <strong>{pct}%</strong> of cost base
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pareto.lines.map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 18, flexShrink: 0, font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", textAlign: "right" }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{
                    font: "var(--text-body)", fontSize: 13, color: "var(--ink)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%",
                  }} title={line.account}>{line.account}</span>
                  <span style={{ font: "var(--text-mono)", fontSize: 12, color: "var(--fg-2)", flexShrink: 0 }}>
                    {fmtC(line.value)} · {line.pct_of_total}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${(line.value / top) * 100}%`,
                    background: i < 3 ? "var(--primary)" : "var(--border-strong)",
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
              <div style={{ width: 48, flexShrink: 0, font: "var(--text-caption)", fontSize: 10, color: "var(--fg-3)", textAlign: "right" }}>
                {line.cum_pct}% cum
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── Fixed vs Variable ───────────────────────────────────────────── */
  const FixedVarSection = () => {
    const { fixed_cost, variable_cost, total_classified, contribution_margin_pct, breakeven_revenue, has_revenue } = fixed_variable;
    const total = total_classified || 1;
    const fixedPct = Math.round(fixed_cost / total * 100);
    const varPct   = Math.round(variable_cost / total * 100);
    const coveragePct = pareto.total_cost > 0
      ? Math.round(total_classified / pareto.total_cost * 100) : null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
        <div>
          <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>
            Cost structure (classified lines only)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Fixed costs", fixed_cost, fixedPct, "var(--primary)"], ["Variable costs", variable_cost, varPct, "var(--c-3)"]].map(([label, val, pct, color]) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)" }}>{label}</span>
                  <span style={{ font: "var(--text-mono)", fontSize: 13, color: "var(--ink)" }}>
                    {fmtC(val)} · {pct}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--surface-3)" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          {coveragePct != null && (
            <div style={{
              marginTop: 12, padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: coveragePct < 60 ? "var(--caution-soft)" : "var(--surface-2)",
              border: "1px solid var(--border)",
              font: "var(--text-caption)", fontSize: 11,
              color: coveragePct < 60 ? "var(--caution)" : "var(--fg-3)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon name={coveragePct < 60 ? "alert-triangle" : "info"} size={11}
                color={coveragePct < 60 ? "var(--caution)" : "var(--fg-3)"} />
              {coveragePct}% of cost base classified — break-even is approximate.
              {coveragePct < 60 && " Many lines are uncategorised; reclassify in Movements for a more accurate result."}
            </div>
          )}
        </div>
        <div>
          {has_revenue && contribution_margin_pct != null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                padding: "16px 18px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)", background: "var(--surface)",
              }}>
                <div style={{ font: "var(--text-mono)", fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>
                  {contribution_margin_pct.toFixed(1)}%
                </div>
                <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>
                  Contribution margin
                </div>
                <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>
                  Revenue remaining after variable costs
                </div>
              </div>
              {breakeven_revenue != null && (
                <div style={{
                  padding: "16px 18px", borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)", background: "var(--surface)",
                }}>
                  <div style={{ font: "var(--text-mono)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
                    {fmt(breakeven_revenue)}
                  </div>
                  <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>
                    Break-even revenue
                  </div>
                  <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>
                    Fixed costs ÷ contribution margin %
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
              Break-even analysis requires revenue data.
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Common-size P&L ─────────────────────────────────────────────── */
  const CommonSizeTable = () => {
    if (!common_size.length) return null;
    const COL_HD = { font: "var(--text-label)", fontSize: 11, color: "var(--fg-3)", padding: "6px 8px", whiteSpace: "nowrap" };
    const ROW_CELL = { font: "var(--text-mono)", fontSize: 12.5, color: "var(--ink)", padding: "7px 8px", whiteSpace: "nowrap" };
    let lastCat = null;
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <th style={{ ...COL_HD, textAlign: "left", width: "99%" }}>Account</th>
              <th style={{ ...COL_HD, textAlign: "right" }}>Actual</th>
              <th style={{ ...COL_HD, textAlign: "right" }}>% Rev</th>
              <th style={{ ...COL_HD, textAlign: "right" }}>Prior %</th>
              <th style={{ ...COL_HD, textAlign: "right" }}>Δ pp</th>
            </tr>
          </thead>
          <tbody>
            {common_size.map((row, i) => {
              const catHeader = row.category !== lastCat ? (() => { lastCat = row.category; return row.category; })() : null;
              const favourable = row.delta_pp != null && (
                (row.category === "Revenue" && row.delta_pp > 0) ||
                (row.category !== "Revenue" && row.delta_pp < 0)
              );
              return (
                <React.Fragment key={i}>
                  {catHeader && (
                    <tr>
                      <td colSpan={5} style={{
                        padding: "10px 8px 4px", font: "var(--text-label)", fontSize: 10.5,
                        color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em",
                        borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      }}>{catHeader}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseOver={e => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseOut={e  => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ ...ROW_CELL, color: "var(--fg-2)", font: "var(--text-body)", fontSize: 13 }}>
                      {row.account}
                    </td>
                    <td style={{ ...ROW_CELL, textAlign: "right" }}>
                      {row.value != null ? fmtC(row.value) : "—"}
                    </td>
                    <td style={{ ...ROW_CELL, textAlign: "right", color: "var(--ink)" }}>
                      {row.pct_of_rev != null ? `${row.pct_of_rev.toFixed(1)}%` : "—"}
                    </td>
                    <td style={{ ...ROW_CELL, textAlign: "right", color: "var(--fg-3)" }}>
                      {row.prior_pct_of_rev != null ? `${row.prior_pct_of_rev.toFixed(1)}%` : "—"}
                    </td>
                    <td style={{ ...ROW_CELL, textAlign: "right",
                      color: row.delta_pp == null ? "var(--fg-3)" : favourable ? "var(--favourable)" : "var(--adverse)" }}>
                      {row.delta_pp != null ? pctFmt(row.delta_pp) : "—"}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* ── Non-recurring flags ─────────────────────────────────────────── */
  const NonRecurringSection = () => {
    const visible = nonrecurring.filter(item =>
      item.present_count / item.check_periods < nrThreshold
    );
    if (!nonrecurring.length) return (
      <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
        No potentially one-off items detected in the last 6 periods.
      </div>
    );
    return (
      <div>
        {visible.length === 0 ? (
          <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
            No items match the current sensitivity — try "Loose".
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {visible.map((item, i) => (
              <div key={i} title={`Present in ${item.present_count} of ${item.check_periods} recent periods`}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border)",
                  background: item.in_current ? "var(--caution-soft)" : "var(--surface-2)",
                }}>
                {item.in_current && <Icon name="alert-triangle" size={12} color="var(--caution)" />}
                <span style={{ font: "var(--text-label)", fontSize: 12, color: "var(--ink)" }}>{item.account}</span>
                <span style={{ font: "var(--text-caption)", fontSize: 10, color: "var(--fg-3)" }}>
                  {item.present_count}/{item.check_periods} periods
                  {item.in_current && item.value != null ? ` · ${fmtC(item.value)}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ── Strategy review ────────────────────────────────────────────── */
  const generateStrategy = (refresh = false) => {
    setStratLoading(true);
    setStratError(null);
    if (refresh) setStrategy(null);
    const p = new URLSearchParams({
      period: selectedPeriod || "", mode: periodMode || "monthly",
      ...(refresh ? { refresh: "1" } : {}),
    });
    fetch(apiUrl(`/api/strategy/${sessionId}?${p}`))
      .then(r => { if (!r.ok) return r.json().then(e => { throw new Error(e.detail || "Failed"); }); return r.json(); })
      .then(setStrategy)
      .catch(e => setStratError(e.message))
      .finally(() => setStratLoading(false));
  };

  const StrategyPanel = () => (
    <div style={{ marginBottom: 28, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 18px",
        borderBottom: (strategy || stratLoading || stratError) ? "1px solid var(--border)" : "none",
        background: "var(--surface-2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="cpu" size={15} color="var(--primary)" />
          <span style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--ink)" }}>AI Strategy Review</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {strategy && !stratLoading && (
            <button onClick={() => generateStrategy(true)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--fg-2)", font: "var(--text-label)", fontSize: 11, cursor: "pointer",
              }}>
              <Icon name="refresh-cw" size={11} color="var(--fg-2)" /> Regenerate
            </button>
          )}
          {!strategy && (
            <button onClick={() => generateStrategy()} disabled={stratLoading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: "var(--radius-sm)",
                border: "none", background: "var(--primary)",
                color: "#fff", font: "var(--text-label)", fontSize: 12,
                cursor: stratLoading ? "not-allowed" : "pointer", opacity: stratLoading ? 0.7 : 1,
              }}>
              {stratLoading
                ? <><Icon name="loader" size={13} color="#fff" /> Generating…</>
                : <><Icon name="zap" size={13} color="#fff" /> Generate</>}
            </button>
          )}
        </div>
      </div>
      {/* Body */}
      {stratError && (
        <div style={{ padding: "12px 18px", color: "var(--adverse)", font: "var(--text-body)", fontSize: 13 }}>{stratError}</div>
      )}
      {stratLoading && (
        <div style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="loader" size={14} color="var(--fg-3)" />
          <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)" }}>Analysing {period_label}…</span>
        </div>
      )}
      {strategy && !stratLoading && (
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {strategy.executive_summary && (
            <div style={{ font: "var(--text-body)", fontSize: 14, color: "var(--ink)", lineHeight: 1.65 }}>
              {strategy.executive_summary}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {strategy.whats_working?.length > 0 && (
              <div style={{ padding: "13px 15px", borderRadius: "var(--radius-md)", background: "var(--favourable-soft)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
                  <Icon name="check-circle" size={13} color="var(--favourable)" />
                  <span style={{ font: "var(--text-label)", fontSize: 12, color: "var(--favourable)" }}>What's working</span>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {strategy.whats_working.map((item, i) => (
                    <li key={i} style={{ font: "var(--text-body)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategy.areas_of_concern?.length > 0 && (
              <div style={{ padding: "13px 15px", borderRadius: "var(--radius-md)", background: "var(--caution-soft)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
                  <Icon name="alert-triangle" size={13} color="var(--caution)" />
                  <span style={{ font: "var(--text-label)", fontSize: 12, color: "var(--caution)" }}>Areas of concern</span>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {strategy.areas_of_concern.map((item, i) => (
                    <li key={i} style={{ font: "var(--text-body)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategy.recommended_actions?.length > 0 && (
              <div style={{ padding: "13px 15px", borderRadius: "var(--radius-md)", background: "var(--primary-soft)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
                  <Icon name="arrow-right-circle" size={13} color="var(--primary)" />
                  <span style={{ font: "var(--text-label)", fontSize: 12, color: "var(--primary)" }}>Recommended actions</span>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {strategy.recommended_actions.map((item, i) => (
                    <li key={i} style={{ font: "var(--text-body)", fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      {!strategy && !stratLoading && !stratError && (
        <div style={{ padding: "13px 18px", color: "var(--fg-3)", font: "var(--text-body)", fontSize: 13 }}>
          Get an AI-powered strategic review of {period_label} — key trends, risks, and recommended next actions.
        </div>
      )}
    </div>
  );

  /* ── NHS GP Insights panel ──────────────────────────────────────── */
  const NhsPanel = () => {
    const nhsKpis = sessionData?.nhs_kpis || {};
    const util    = sessionData?.nhs_utilisation || {};
    const wf      = sessionData?.workforce_breakdown || {};

    const arrs = nhsKpis.arrs || util.arrs;
    const qof  = nhsKpis.qof  || util.qof;

    const hasAny = nhsKpis.income_per_patient != null || arrs || qof ||
      Object.values(wf).some(r => r?.total > 0);
    if (!hasAny) return null;

    const UtilBar = ({ pct, color, bg }) => (
      <div style={{ height: 8, borderRadius: 4, background: bg || "var(--surface-2)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          width: `${Math.min(100, Math.max(0, pct || 0)).toFixed(1)}%`,
          background: color,
          transition: "width .4s ease",
        }} />
      </div>
    );

    const wfRoles = ["clinical", "locum", "management", "admin", "other"];
    const wfColors = {
      clinical:   "var(--primary)",
      locum:      "var(--adverse)",
      management: "rgba(99,102,241,.7)",
      admin:      "rgba(245,158,11,.7)",
      other:      "var(--fg-3)",
    };
    const wfTotal = wfRoles.reduce((s, r) => s + (wf[r]?.total || 0), 0);

    return (
      <div style={{
        marginBottom: 28, borderRadius: "var(--radius-md)",
        border: "1px solid rgba(20,184,166,.25)",
        background: "rgba(20,184,166,.04)",
        overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 18px", borderBottom: "1px solid rgba(20,184,166,.18)",
          background: "rgba(20,184,166,.07)",
        }}>
          <Icon name="activity" size={15} color="#0f766e" />
          <span style={{ font: "var(--text-body-strong)", fontSize: 14, color: "#0f766e" }}>NHS GP Practice Metrics</span>
          {sessionData?.list_size > 0 && (
            <span style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", marginLeft: 4 }}>
              {sessionData.list_size.toLocaleString()} patients · {sessionData.wte_partners || "—"} WTE partners
            </span>
          )}
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Per-patient / per-partner KPIs */}
          {nhsKpis.income_per_patient != null && (
            <div>
              <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>
                Per-patient &amp; per-partner
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Income / patient", value: fmt(nhsKpis.income_per_patient), sub: "Benchmark £130–160/yr", color: "var(--ink)" },
                  nhsKpis.cost_per_patient != null && { label: "Cost / patient",   value: fmt(nhsKpis.cost_per_patient),  sub: null, color: "var(--ink)" },
                  nhsKpis.profit_per_patient != null && { label: "Surplus / patient", value: fmt(nhsKpis.profit_per_patient), sub: "Target £5–15", color: nhsKpis.profit_per_patient >= 5 ? "var(--favourable)" : "var(--adverse)" },
                  nhsKpis.income_per_partner != null && { label: "Income / partner",  value: fmt(nhsKpis.income_per_partner), sub: null, color: "var(--ink)" },
                  nhsKpis.profit_per_partner != null && { label: "Surplus / partner", value: fmt(nhsKpis.profit_per_partner), sub: null, color: nhsKpis.profit_per_partner >= 0 ? "var(--favourable)" : "var(--adverse)" },
                ].filter(Boolean).map((card, i) => (
                  <div key={i} style={{
                    flex: 1, minWidth: 130, padding: "14px 16px",
                    borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}>
                    <div style={{ font: "var(--text-mono)", fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.1 }}>{card.value}</div>
                    <div style={{ font: "var(--text-label)", fontSize: 11.5, color: "var(--fg-2)", marginTop: 4 }}>{card.label}</div>
                    {card.sub && <div style={{ font: "var(--text-caption)", fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{card.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ARRS utilisation */}
          {arrs && (
            <div>
              <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>
                ARRS utilisation
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--ink)" }}>
                      {fmt(arrs.spend)} <span style={{ color: "var(--fg-3)" }}>of {fmt(arrs.allocation)}</span>
                    </span>
                    <span style={{
                      font: "var(--text-label)", fontSize: 12, fontWeight: 700,
                      color: arrs.utilisation_pct >= 80 ? "var(--favourable)" : arrs.utilisation_pct >= 50 ? "var(--caution)" : "var(--adverse)",
                    }}>
                      {arrs.utilisation_pct.toFixed(1)}%
                    </span>
                  </div>
                  <UtilBar
                    pct={arrs.utilisation_pct}
                    color={arrs.utilisation_pct >= 80 ? "var(--favourable)" : arrs.utilisation_pct >= 50 ? "var(--caution)" : "var(--adverse)"}
                    bg="var(--surface-2)"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                      {fmt(arrs.remaining)} remaining
                    </span>
                    <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                      ≥80% = good utilisation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QOF achievement */}
          {qof && (
            <div>
              <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>
                QOF achievement
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--ink)" }}>
                    {fmt(qof.income)} <span style={{ color: "var(--fg-3)" }}>of {fmt(qof.entitlement)}</span>
                  </span>
                  <span style={{
                    font: "var(--text-label)", fontSize: 12, fontWeight: 700,
                    color: qof.achievement_pct >= 95 ? "var(--favourable)" : qof.achievement_pct >= 80 ? "var(--caution)" : "var(--adverse)",
                  }}>
                    {qof.achievement_pct.toFixed(1)}%
                  </span>
                </div>
                <UtilBar
                  pct={qof.achievement_pct}
                  color={qof.achievement_pct >= 95 ? "var(--favourable)" : qof.achievement_pct >= 80 ? "var(--caution)" : "var(--adverse)"}
                  bg="var(--surface-2)"
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                    {fmt(qof.gap)} gap to entitlement
                  </span>
                  <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                    ≥95% = excellent
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Workforce breakdown */}
          {wfTotal > 0 && (
            <div>
              <div style={{ font: "var(--text-label)", fontSize: 12, color: "var(--fg-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>
                Workforce cost breakdown
              </div>
              {/* stacked bar */}
              <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
                {wfRoles.map(r => {
                  const w = wf[r]?.total || 0;
                  if (!w) return null;
                  return (
                    <div key={r} style={{
                      width: `${(w / wfTotal * 100).toFixed(1)}%`,
                      background: wfColors[r],
                    }} title={`${r}: ${fmt(w)}`} />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {wfRoles.map(r => {
                  const total = wf[r]?.total || 0;
                  if (!total) return null;
                  return (
                    <div key={r} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: wfColors[r], display: "inline-block", flexShrink: 0 }} />
                      <span style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-2)" }}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}: {fmt(total)} ({(total / wfTotal * 100).toFixed(0)}%)
                        {r === "locum" && total / wfTotal > 0.15 && (
                          <span style={{ marginLeft: 5, color: "var(--caution)", fontSize: 11 }}>↑ high</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>

      {/* ── AI Strategy Review ─────────────────────────────────── */}
      <StrategyPanel />

      {/* ── NHS GP Metrics (shown only for nhs_gp sector) ──────── */}
      {sessionData?.sector === "nhs_gp" && <NhsPanel />}

      {/* ── Margin summary ─────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <MetricCard
          label="Operating margin"
          value={margins.op_pct != null ? `${margins.op_pct.toFixed(1)}%` : "—"}
          icon="percent"
          color={margins.op_pct != null && margins.op_pct >= 0 ? "var(--favourable)" : "var(--adverse)"}
          sub={`Profit ÷ Revenue · ${period_label}`}
          badge={opMarginSt ? <RagBadge status={opMarginSt} /> : null}
        />
        <MetricCard
          label="Payroll % of revenue"
          value={margins.payroll_pct != null ? `${margins.payroll_pct.toFixed(1)}%` : "—"}
          icon="users"
          sub={margins.staff_value ? `Staff costs ${fmtC(margins.staff_value)}` : ""}
          badge={payrollSt ? <RagBadge status={payrollSt} /> : null}
        />
        {momentum.available && (
          <MetricCard
            label="Business momentum"
            value={dirLabel(momentum.overall)}
            icon={dirIcon(momentum.overall)}
            color={dirColor(momentum.overall)}
            sub="3-period rolling average"
            small
          />
        )}
        {sppy.available && sppy.prof_delta != null && (
          <MetricCard
            label="Profit vs same month PY"
            value={fmtSC(sppy.prof_delta)}
            icon="calendar"
            color={sppy.prof_delta >= 0 ? "var(--favourable)" : "var(--adverse)"}
            sub={`vs ${sppy.period_label}`}
            small
          />
        )}
      </div>

      {/* ── Margin trend ───────────────────────────────────────── */}
      {margins.trend.length >= 2 && (
        <>
          <SectionTitle icon="line-chart" title="Margin trend" sub="Operating margin % by period" />
          <MarginSparkline trend={margins.trend} />
          <Divider />
        </>
      )}

      {/* ── Momentum ───────────────────────────────────────────── */}
      <SectionTitle icon="activity" title="Momentum" sub="Is performance improving or declining?" />
      <MomentumRow />
      <Divider />

      {/* ── SPPY ───────────────────────────────────────────────── */}
      <SectionTitle icon="calendar" title="Same-period prior year" sub="Year-on-year comparison for the selected month" />
      <SPPYSection />
      <Divider />

      {/* ── Run-rate & R12 ─────────────────────────────────────── */}
      <SectionTitle icon="trending-up" title="Projections" sub="Run-rate and rolling 12-month" />
      <ProjectionSection />
      <Divider />

      {/* ── Pareto ─────────────────────────────────────────────── */}
      <SectionTitle
        icon="bar-chart-2"
        title="Cost concentration (Pareto)"
        sub={pareto.total_cost ? `Total cost base ${fmtC(pareto.total_cost)}` : ""}
      />
      <ParetoSection />
      <Divider />

      {/* ── Fixed vs Variable ──────────────────────────────────── */}
      <SectionTitle icon="layers" title="Fixed vs variable costs" sub="Break-even analysis" />
      <FixedVarSection />
      <Divider />

      {/* ── Non-recurring ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
          <Icon name="alert-circle" size={16} color="var(--fg-3)" />
          <span style={{ font: "var(--text-body-strong)", fontSize: 15, color: "var(--ink)" }}>Potentially non-recurring</span>
          <span style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>Lines with irregular presence across recent periods</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[[0.34, "Strict", "< 1 in 3 periods"], [0.5, "Normal", "< 1 in 2 periods"], [0.67, "Loose", "< 2 in 3 periods"]].map(([val, label, tip]) => (
            <button key={label} onClick={() => setNrThreshold(val)} title={tip}
              style={{
                padding: "3px 10px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                border: nrThreshold === val ? "1.5px solid var(--primary)" : "1px solid var(--border-strong)",
                background: nrThreshold === val ? "var(--primary-soft)" : "transparent",
                color: nrThreshold === val ? "var(--primary)" : "var(--fg-3)",
                font: "var(--text-label)", fontSize: 11,
              }}>{label}</button>
          ))}
        </div>
      </div>
      <NonRecurringSection />
      <Divider />

      {/* ── Common-size P&L ────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
          <Icon name="table" size={16} color="var(--fg-3)" />
          <span style={{ font: "var(--text-body-strong)", fontSize: 15, color: "var(--ink)" }}>Common-size P&L</span>
          <span style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>Every line as % of revenue</span>
        </div>
        <button
          onClick={() => setCsOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--fg-2)", font: "var(--text-label)", fontSize: 12, cursor: "pointer",
          }}
        >
          <Icon name={csOpen ? "chevron-up" : "chevron-down"} size={13} />
          {csOpen ? "Hide" : "Show table"}
        </button>
      </div>
      {csOpen && <CommonSizeTable />}

    </div>
  );
}

Object.assign(window, { Insights });
