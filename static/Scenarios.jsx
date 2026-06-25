/* MonthEndIQ — What-if Scenario Analysis
 *
 * Pure-frontend calculation: adjustments are applied to the current period's
 * actual values from initialData.movements. No backend call needed.
 *
 * localStorage key: monthendiq_scenarios_f_{encodeURIComponent(fileName)}
 * Stores up to 4 named scenarios (oldest dropped when limit exceeded).
 */
const { useState: useStateSc, useMemo: useMemoSc } = React;

const SC_KEY = (f) =>
  `monthendiq_scenarios_f_${encodeURIComponent((f || "").trim())}`;

function loadScenarios(fileName) {
  try {
    const raw = localStorage.getItem(SC_KEY(fileName));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveScenarios(fileName, arr) {
  try { localStorage.setItem(SC_KEY(fileName), JSON.stringify(arr)); } catch {}
}

/* ── Scenarios view ─────────────────────────────────────────────────────── */
function Scenarios({ initialData, fileName, analysisType }) {
  const { Icon, Button, Card, Delta } = window;

  /* ── derive line items from movements (non-subtotal rows only) ── */
  const lineItems = useMemoSc(() => {
    if (!initialData?.movements) return [];
    return (initialData.movements || []).filter(
      (m) => !m.is_subtotal && m.value != null
    );
  }, [initialData]);

  const revenueItems = useMemoSc(
    () => lineItems.filter((m) => m.category === "Revenue"),
    [lineItems]
  );
  const costItems = useMemoSc(
    () => lineItems.filter((m) => m.category !== "Revenue"),
    [lineItems]
  );

  /* ── state ── */
  const [adjustments, setAdjustments] = useStateSc({}); // { account: pct }
  const [filter, setFilter]           = useStateSc("all"); // all|revenue|costs
  const [saved, setSaved]             = useStateSc(() => loadScenarios(fileName));
  const [activeIdx, setActiveIdx]     = useStateSc(null);
  const [showSave, setShowSave]       = useStateSc(false);
  const [saveName, setSaveName]       = useStateSc("Scenario 1");
  const [renamingIdx, setRenamingIdx] = useStateSc(null);
  const [renameVal, setRenameVal]     = useStateSc("");

  /* ── computed totals ── */
  const sum = (items, adj) =>
    items.reduce((s, m) => s + (m.value || 0) * (1 + (adj[m.account] || 0) / 100), 0);

  const baseRevenue = useMemoSc(() => revenueItems.reduce((s, m) => s + (m.value || 0), 0), [revenueItems]);
  const baseCosts   = useMemoSc(() => costItems.reduce((s, m) => s + (m.value || 0), 0), [costItems]);
  const baseProfit  = baseRevenue - baseCosts;

  const adjRevenue  = useMemoSc(() => sum(revenueItems, adjustments), [revenueItems, adjustments]);
  const adjCosts    = useMemoSc(() => sum(costItems,    adjustments), [costItems,    adjustments]);
  const adjProfit   = adjRevenue - adjCosts;
  const profitDelta = adjProfit - baseProfit;
  const profitDeltaPct = baseProfit !== 0 ? (profitDelta / Math.abs(baseProfit)) * 100 : 0;
  const hasAdj      = Object.values(adjustments).some((v) => v !== 0);

  /* ── handlers ── */
  const setAdj = (account, pct) => {
    setAdjustments((prev) => ({ ...prev, [account]: pct }));
    setActiveIdx(null);
  };

  const reset = () => { setAdjustments({}); setActiveIdx(null); };

  const saveScenario = () => {
    if (!saveName.trim()) return;
    const sc = {
      name:        saveName.trim(),
      adjustments: { ...adjustments },
      profit:      adjProfit,
      impact:      profitDelta,
    };
    const next = [...saved.slice(-3), sc]; // keep ≤4
    setSaved(next);
    saveScenarios(fileName, next);
    setSaveName(`Scenario ${next.length + 1}`);
    setShowSave(false);
  };

  const loadSaved = (i) => {
    setAdjustments({ ...saved[i].adjustments });
    setActiveIdx(i);
  };

  const deleteSaved = (i) => {
    const next = saved.filter((_, idx) => idx !== i);
    setSaved(next);
    saveScenarios(fileName, next);
    if (activeIdx === i) { setAdjustments({}); setActiveIdx(null); }
    else if (activeIdx > i) setActiveIdx((p) => p - 1);
  };

  const startRename = (e, i) => {
    e.stopPropagation();
    setRenamingIdx(i);
    setRenameVal(saved[i].name);
  };

  const commitRename = () => {
    if (renamingIdx === null) return;
    const name = renameVal.trim();
    if (name) {
      const next = saved.map((sc, i) => i === renamingIdx ? { ...sc, name } : sc);
      setSaved(next);
      saveScenarios(fileName, next);
    }
    setRenamingIdx(null);
  };

  /* ── formatters ── */
  const fmtGBP = (v) => {
    if (v == null || isNaN(v)) return "—";
    const abs = Math.abs(v), sign = v < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(2)}m`;
    if (abs >= 1_000)     return `${sign}£${(abs / 1_000).toFixed(0)}k`;
    return `${sign}£${Math.round(abs).toLocaleString("en-GB")}`;
  };
  const fmtSgn = (v) => (v > 0 ? "+" : "") + fmtGBP(v);

  /* ── active items for the slider panel ── */
  const activeItems =
    filter === "revenue" ? revenueItems :
    filter === "costs"   ? costItems    : lineItems;

  /* ── group active items by category for section headers ── */
  const grouped = useMemoSc(() => {
    const map = new Map();
    for (const item of activeItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return [...map.entries()];
  }, [activeItems]);

  if (!initialData) {
    return <div className="loading"><div className="spinner" />Loading…</div>;
  }

  /* ── render ── */
  return (
    <div className="content-inner reveal">

      {/* ── Page header ── */}
      <div className="editorial-header">
        <div className="editorial-eyebrow">
          <span className="e-label">Scenarios</span>
          <span className="e-sep" />
          <span className="e-period">What-if modeling</span>
        </div>
        <h1 className="editorial-h1" style={{ fontSize: "clamp(20px, 2.6vw, 32px)" }}>
          Model assumptions &amp; explore outcomes
        </h1>
      </div>

      {/* ── KPI summary row ── */}
      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        {[
          {
            label: "Baseline Revenue",
            val: baseRevenue,
            delta: adjRevenue - baseRevenue,
            fav: adjRevenue > baseRevenue,
            icon: "trending-up",
          },
          {
            label: "Baseline Costs",
            val: baseCosts,
            delta: adjCosts - baseCosts,
            fav: adjCosts < baseCosts,
            icon: "receipt",
          },
          {
            label: "Baseline Profit",
            val: baseProfit,
            delta: null,
            icon: "wallet",
          },
          {
            label: "Adjusted Profit",
            val: adjProfit,
            delta: profitDelta,
            fav: profitDelta >= 0,
            icon: "sparkles",
            highlight: true,
          },
        ].map((card) => (
          <div key={card.label} className="card kpi" style={
            card.highlight && hasAdj
              ? {
                  borderColor: profitDelta >= 0 ? "var(--favourable)" : "var(--adverse)",
                  background:  profitDelta >= 0 ? "var(--favourable-soft)" : "var(--adverse-soft)",
                }
              : {}
          }>
            <div className="lbl">
              <span className="ic"><Icon name={card.icon} size={15} /></span>
              {card.label}
            </div>
            <div className="val" style={
              card.highlight && hasAdj
                ? { color: profitDelta >= 0 ? "var(--favourable-text)" : "var(--adverse-text)" }
                : {}
            }>
              {fmtGBP(card.val)}
            </div>
            {hasAdj && card.delta != null && card.delta !== 0 && (
              <Delta fav={card.fav} up={card.delta > 0}>
                {fmtSgn(card.delta)}
              </Delta>
            )}
            {!hasAdj && (
              <span className="delta neu">→ adjust sliders</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Main two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

        {/* ── Left: slider panel ── */}
        <Card
          title="Adjust assumptions"
          sub={`${lineItems.length} line items · drag or type a % change`}
          action={
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {["all", "revenue", "costs"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "3px 10px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                  border: filter === f ? "1.5px solid var(--primary)" : "1px solid var(--border-strong)",
                  background: filter === f ? "var(--primary-soft)" : "transparent",
                  color: filter === f ? "var(--primary)" : "var(--fg-3)",
                  font: "var(--text-label)", fontSize: 11, textTransform: "capitalize",
                }}>
                  {f === "all" ? "All" : f === "revenue" ? "Revenue" : "Costs"}
                </button>
              ))}
              {hasAdj && (
                <button onClick={reset} style={{
                  padding: "3px 10px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                  border: "1px solid var(--border-strong)", background: "transparent",
                  color: "var(--fg-3)", font: "var(--text-label)", fontSize: 11,
                }}>
                  Reset all
                </button>
              )}
            </div>
          }
        >
          {grouped.map(([category, items]) => (
            <div key={category} style={{ marginBottom: 4 }}>
              {/* Category heading */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 0 6px",
                font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
                letterSpacing: ".06em", color: "var(--fg-3)",
                borderTop: "1px solid var(--border)",
              }}>
                <Icon
                  name={category === "Revenue" ? "trending-up" : "trending-down"}
                  size={12}
                  color={category === "Revenue" ? "var(--favourable)" : "var(--adverse)"}
                />
                {category}
              </div>

              {/* Line items */}
              {items.map((item) => {
                const pct     = adjustments[item.account] || 0;
                const adjVal  = (item.value || 0) * (1 + pct / 100);
                const isRev   = item.category === "Revenue";
                const impact  = isRev ? (adjVal - item.value) : -(adjVal - item.value);
                const impFav  = impact > 0;

                return (
                  <div key={item.account} style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) 2fr 60px 110px",
                    gap: 10, alignItems: "center",
                    padding: "7px 0",
                    borderBottom: "1px solid var(--border)",
                  }}>
                    {/* Account name */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--ink)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.account}
                      </div>
                      <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 1 }}>
                        base {fmtGBP(item.value)}
                      </div>
                    </div>

                    {/* Slider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ font: "var(--text-label)", fontSize: 10, color: "var(--fg-3)", flexShrink: 0 }}>−50%</span>
                      <input
                        type="range" min={-50} max={50} step={1}
                        value={pct}
                        onChange={(e) => setAdj(item.account, Number(e.target.value))}
                        style={{
                          flex: 1, cursor: "pointer",
                          accentColor: pct === 0
                            ? "var(--fg-3)"
                            : impFav ? "var(--favourable)" : "var(--adverse)",
                        }}
                      />
                      <span style={{ font: "var(--text-label)", fontSize: 10, color: "var(--fg-3)", flexShrink: 0 }}>+50%</span>
                    </div>

                    {/* % number input */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <input
                        type="number" min={-50} max={50} step={1}
                        value={pct}
                        onChange={(e) =>
                          setAdj(item.account, Math.max(-50, Math.min(50, Number(e.target.value))))
                        }
                        style={{
                          width: "100%", textAlign: "right", padding: "3px 4px",
                          border: "1px solid var(--border-strong)",
                          borderRadius: "var(--radius-sm)",
                          font: "600 12px var(--font-mono)", background: "var(--surface)",
                          color: pct === 0
                            ? "var(--fg-2)"
                            : impFav ? "var(--favourable-text)" : "var(--adverse-text)",
                        }}
                      />
                      <span style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", flexShrink: 0 }}>%</span>
                    </div>

                    {/* Adjusted value + profit impact */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        font: "600 12.5px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                        color: pct !== 0
                          ? (impFav ? "var(--favourable-text)" : "var(--adverse-text)")
                          : "var(--ink)",
                      }}>
                        {fmtGBP(adjVal)}
                      </div>
                      {pct !== 0 && (
                        <div style={{
                          font: "var(--text-caption)", fontSize: 10.5, marginTop: 1,
                          color: impFav ? "var(--favourable-text)" : "var(--adverse-text)",
                        }}>
                          {impact > 0 ? "+" : ""}{fmtGBP(impact)} profit
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </Card>

        {/* ── Right: impact + scenarios ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Profit impact card */}
          <Card title="Profit impact" sub="vs current period baseline">
            <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
              <div style={{
                font: "var(--text-metric)", fontSize: 36,
                fontVariantNumeric: "tabular-nums",
                color: hasAdj
                  ? (profitDelta >= 0 ? "var(--favourable-text)" : "var(--adverse-text)")
                  : "var(--fg-3)",
              }}>
                {hasAdj ? fmtSgn(profitDelta) : "—"}
              </div>
              <div style={{
                font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)", marginTop: 4,
              }}>
                {hasAdj
                  ? `${profitDeltaPct > 0 ? "+" : ""}${profitDeltaPct.toFixed(1)}% vs baseline`
                  : "Adjust sliders to model scenarios"}
              </div>
            </div>

            {hasAdj && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "Revenue Δ", val: adjRevenue - baseRevenue, fav: adjRevenue > baseRevenue },
                  { label: "Cost Δ",    val: adjCosts - baseCosts,     fav: adjCosts < baseCosts },
                  { label: "Profit Δ",  val: profitDelta,              fav: profitDelta >= 0 },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 10px", borderRadius: "var(--radius-sm)",
                    background: Math.abs(row.val) < 1
                      ? "var(--surface)"
                      : row.fav ? "var(--favourable-soft)" : "var(--adverse-soft)",
                  }}>
                    <span style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)" }}>
                      {row.label}
                    </span>
                    <span style={{
                      font: "600 12.5px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                      color: Math.abs(row.val) < 1
                        ? "var(--fg-3)"
                        : row.fav ? "var(--favourable-text)" : "var(--adverse-text)",
                    }}>
                      {row.val > 0 ? "+" : ""}{fmtGBP(row.val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Save scenario */}
          {hasAdj && (
            <Card title="Save scenario" sub="Preserve this configuration for comparison">
              {!showSave ? (
                <Button
                  variant="primary" icon="bookmark"
                  onClick={() => setShowSave(true)}
                  style={{ width: "100%", justifyContent: "center" }}>
                  Save scenario
                </Button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveScenario();
                      if (e.key === "Escape") setShowSave(false);
                    }}
                    placeholder="Name this scenario…"
                    autoFocus
                    style={{
                      padding: "8px 10px", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--primary)", outline: "none",
                      font: "var(--text-body)", fontSize: 13,
                      background: "var(--surface)", color: "var(--ink)",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button variant="primary"    icon="check"  onClick={saveScenario}>Save</Button>
                    <Button variant="secondary"               onClick={() => setShowSave(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Saved scenarios list + comparison */}
          {saved.length > 0 && (
            <Card
              title="Saved scenarios"
              sub={`${saved.length} of 4 · click to load · double-click name to rename`}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {saved.map((sc, i) => (
                  <div key={i}
                    onClick={() => loadSaved(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", borderRadius: "var(--radius-sm)",
                      border: `1px solid ${activeIdx === i ? "var(--primary)" : "var(--border)"}`,
                      background: activeIdx === i ? "var(--primary-soft)" : "var(--surface)",
                      cursor: "pointer",
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renamingIdx === i ? (
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingIdx(null); }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--ink)",
                            background: "var(--surface-2)", border: "1px solid var(--primary)",
                            borderRadius: "var(--radius-sm)", padding: "1px 6px", width: "100%",
                            outline: "none",
                          }}
                        />
                      ) : (
                        <div
                          onDoubleClick={(e) => startRename(e, i)}
                          title="Double-click to rename"
                          style={{
                            font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--ink)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            cursor: "text",
                          }}>
                          {sc.name}
                        </div>
                      )}
                      <div style={{
                        font: "600 11.5px var(--font-mono)", fontVariantNumeric: "tabular-nums",
                        marginTop: 2,
                        color: sc.impact >= 0 ? "var(--favourable-text)" : "var(--adverse-text)",
                      }}>
                        {sc.impact >= 0 ? "+" : ""}{fmtGBP(sc.impact)} profit impact
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSaved(i); }}
                      title="Delete scenario"
                      style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "var(--fg-3)", padding: 4,
                        borderRadius: "var(--radius-sm)", flexShrink: 0,
                        display: "flex", alignItems: "center",
                      }}>
                      <Icon name="trash-2" size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Comparison hint when only 1 scenario */}
              {saved.length === 1 && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: "var(--radius-sm)",
                  background: "var(--primary-soft)", border: "1px solid var(--primary-border)",
                  font: "var(--text-body)", fontSize: 12, color: "var(--primary)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Icon name="info" size={13} color="var(--primary)" />
                  Save a second scenario to unlock the comparison table.
                </div>
              )}

              {/* Comparison table — visible when ≥2 scenarios saved */}
              {saved.length >= 2 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{
                    font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
                    letterSpacing: ".06em", color: "var(--fg-3)", marginBottom: 6,
                  }}>
                    Scenario comparison
                  </div>
                  <table className="var" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th className="l">Scenario</th>
                        <th>Profit</th>
                        <th>vs Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="l" style={{ color: "var(--fg-3)", fontStyle: "italic" }}>
                          Baseline
                        </td>
                        <td>{fmtGBP(baseProfit)}</td>
                        <td>—</td>
                      </tr>
                      {saved.map((sc, i) => (
                        <tr key={i}>
                          <td className="l">{sc.name}</td>
                          <td>{fmtGBP(sc.profit)}</td>
                          <td className={sc.impact >= 0 ? "fav" : "adv"}>
                            {sc.impact >= 0 ? "+" : ""}{fmtGBP(sc.impact)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Help text */}
          {!hasAdj && saved.length === 0 && (
            <div style={{
              padding: "16px 18px", borderRadius: "var(--radius-sm)",
              background: "var(--primary-soft)", border: "1px solid var(--primary-border)",
              font: "var(--text-body)", fontSize: 12.5, color: "var(--primary)", lineHeight: 1.55,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <Icon name="info" size={14} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                Drag sliders or type a % to model "what if" scenarios — e.g. revenue up 10%, headcount costs down 5%.
                Save up to 4 named scenarios and compare them in a table.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Scenarios });
