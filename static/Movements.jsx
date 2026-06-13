/* MonthEndIQ — Variance Movements page */
const { useState: useStateM, useEffect: useEffectM, useRef: useRefM, useMemo: useMemoM } = React;

/* ── Inline SVG sparkline ────────────────────────────────────────────────── */
function Sparkline({ values, isFav }) {
  if (!values || values.length < 2) return null;
  const clean = values.filter(v => v != null);
  if (clean.length < 2) return null;
  const W = 56, H = 20, PAD = 2;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max === min ? 1 : max - min;
  const n = values.length;
  const pts = values
    .map((v, i) => {
      const x = PAD + (i / (n - 1)) * (W - 2 * PAD);
      const y = H - PAD - ((v ?? min) - min) / range * (H - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const colour = isFav ? "var(--favourable)" : "var(--adverse)";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={colour}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Movements({ sessionId, initialData, periodMode, controlledPeriod, onDataChange, analysisType, onNavigateCopilot }) {
  const { Icon, Card, Button, Delta, Chip } = window;
  const [data, setData]               = useStateM(initialData);
  const [loading, setLoading]         = useStateM(false);
  const [activeTab, setActiveTab]     = useStateM("top");
  const [search, setSearch]           = useStateM("");
  const [sortCol, setSortCol]         = useStateM("abs_variance");
  const [sortAsc, setSortAsc]         = useStateM(false);
  const [expandedRow, setExpandedRow]     = useStateM(null);
  const [categories, setCategories]       = useStateM([]);
  const [reclassState, setReclassState]   = useStateM({});
  const [alertThreshold, setAlertThreshold] = useStateM(null); // null = off, number = %
  const lastFetched = useRefM({ period: initialData?.selected_period, mode: periodMode });

  // Load available categories once on mount
  useEffectM(() => {
    fetch(apiUrl("/api/categories"))
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const fmtGBP = (v) => {
    if (v == null || isNaN(v)) return "—";
    return (v < 0 ? "-£" : "£") + Math.abs(Math.round(v)).toLocaleString("en-GB");
  };
  const fmtSignedGBP = (v) => {
    if (v == null || isNaN(v)) return "—";
    return (v > 0 ? "+" : v < 0 ? "-" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB");
  };
  const fmtPct = (v) => {
    if (v == null || isNaN(v)) return "—";
    return (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v).toFixed(1) + "%";
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

  useEffectM(() => {
    if (!controlledPeriod) return;
    if (controlledPeriod === lastFetched.current.period && periodMode === lastFetched.current.mode) return;
    fetchPeriod(controlledPeriod, periodMode);
  }, [controlledPeriod, periodMode]);

  if (!data) return <div className="loading"><div className="spinner" />Loading...</div>;

  const isBvA = (analysisType || data.analysis_type) === "budget_vs_actual";
  const { movements, period, selected_period } = data;
  const allRows = movements || [];

  const tabFiltered = useMemoM(() => {
    if (activeTab === "revenue") return allRows.filter(m => m.category === "Revenue");
    if (activeTab === "costs")   return allRows.filter(m => m.category !== "Revenue");
    return allRows;
  }, [allRows, activeTab]);

  const searched = useMemoM(() => {
    if (!search.trim()) return tabFiltered;
    const q = search.toLowerCase();
    return tabFiltered.filter(m =>
      m.account.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [tabFiltered, search]);

  const sorted = useMemoM(() => {
    const copy = [...searched];
    const dir = sortAsc ? 1 : -1;
    copy.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case "account":      va = a.account.toLowerCase(); vb = b.account.toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0;
        case "category":     va = a.category.toLowerCase(); vb = b.category.toLowerCase(); return va < vb ? -dir : va > vb ? dir : 0;
        case "actual":       return dir * ((a.value || 0) - (b.value || 0));
        case "budget":       return dir * ((a.prior_value || 0) - (b.prior_value || 0));
        case "variance":     return dir * ((a.variance || 0) - (b.variance || 0));
        case "variance_pct": return dir * ((a.variance_pct || 0) - (b.variance_pct || 0));
        case "abs_variance": default: return dir * (Math.abs(a.variance || 0) - Math.abs(b.variance || 0));
      }
    });
    return copy;
  }, [searched, sortCol, sortAsc]);

  const handleSort = (col) => {
    if (sortCol === col) { setSortAsc(!sortAsc); }
    else { setSortCol(col); setSortAsc(col === "account" || col === "category"); }
  };

  const SortHeader = ({ col, label, align }) => {
    const active = sortCol === col;
    return (
      <th className={align || ""} onClick={() => handleSort(col)}
        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
        {label}
        <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 10 }}>
          {active ? (sortAsc ? "▲" : "▼") : "▼"}
        </span>
      </th>
    );
  };

  // Summary stats
  const favRows = allRows.filter(m => m.is_fav && m.variance !== 0);
  const advRows = allRows.filter(m => !m.is_fav && m.variance !== 0);
  const largestFav = favRows.length ? favRows.reduce((a, b) => Math.abs(a.variance) > Math.abs(b.variance) ? a : b) : null;
  const largestAdv = advRows.length ? advRows.reduce((a, b) => Math.abs(a.variance) > Math.abs(b.variance) ? a : b) : null;
  const totalFav = favRows.reduce((s, m) => s + Math.abs(m.variance || 0), 0);
  const totalAdv = advRows.reduce((s, m) => s + Math.abs(m.variance || 0), 0);

  // Insights: most volatile category
  const catVariances = {};
  allRows.forEach(m => {
    if (!catVariances[m.category]) catVariances[m.category] = 0;
    catVariances[m.category] += Math.abs(m.variance || 0);
  });
  const mostVolatile = Object.entries(catVariances).sort((a, b) => b[1] - a[1])[0];

  const generateExplanation = (m) => {
    const dir = m.is_fav ? "favourable" : "adverse";
    const pctStr = m.variance_pct != null ? ` (${Math.abs(m.variance_pct).toFixed(1)}%)` : "";
    if (isBvA) {
      if (m.category === "Revenue") {
        return m.is_fav
          ? `${m.account} exceeded budget by ${fmtGBP(Math.abs(m.variance))}${pctStr} and was a favourable revenue variance.`
          : `${m.account} fell short of budget by ${fmtGBP(Math.abs(m.variance))}${pctStr} and was an adverse revenue variance.`;
      }
      return m.is_fav
        ? `${m.account} came in under budget by ${fmtGBP(Math.abs(m.variance))}${pctStr}, a favourable cost variance.`
        : `${m.account} exceeded budget by ${fmtGBP(Math.abs(m.variance))}${pctStr} and was the largest ${dir} variance in the period.`;
    }
    return m.is_fav
      ? `${m.account} improved by ${fmtGBP(Math.abs(m.variance))}${pctStr} versus the prior period — a ${dir} movement.`
      : `${m.account} worsened by ${fmtGBP(Math.abs(m.variance))}${pctStr} versus the prior period — a ${dir} movement.`;
  };

  const handleReclassify = async (account, category) => {
    setReclassState(prev => ({ ...prev, [account]: { saving: true, category } }));
    try {
      const res = await fetch(apiUrl(`/api/reclassify/${sessionId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, category }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Reclassify failed." }));
        throw new Error(err.detail || "Reclassify failed.");
      }
      // Reload current period data to reflect the updated category
      const period = data?.selected_period || data?.selected_bva_period || "";
      await fetchPeriod(period, periodMode);
      setReclassState(prev => ({ ...prev, [account]: { saved: true, category } }));
      setTimeout(() => setReclassState(prev => {
        const n = { ...prev };
        delete n[account];
        return n;
      }), 2500);
    } catch (e) {
      setReclassState(prev => ({ ...prev, [account]: { error: e.message } }));
    }
  };

  const handleExplainVariance = (m) => {
    if (!onNavigateCopilot) return;
    const context = [
      `Analysis Type: ${isBvA ? "Budget vs Actual" : "Month-on-Month"}`,
      `Period: ${period?.label || selected_period || ""}`,
      `Account: ${m.account}`,
      `Category: ${m.category}`,
      `Actual: ${fmtGBP(m.value)}`,
      `${isBvA ? "Budget" : "Prior"}: ${fmtGBP(m.prior_value)}`,
      `Variance: ${fmtSignedGBP(m.variance)}`,
      `Variance %: ${fmtPct(m.variance_pct)}`,
    ].join("\n");
    onNavigateCopilot(`Given this context:\n${context}\n\nExplain this variance.`);
  };

  const tabs = [
    { id: "top", label: "Top Movements" },
    { id: "revenue", label: "Revenue" },
    { id: "costs", label: "Costs" },
  ];

  return (
    <div className="content">
      <div className="content-inner reveal" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ font: "var(--text-metric)", fontSize: 22, color: "var(--ink)", margin: 0 }}>
            Variance Movements
          </h2>
          <p style={{ font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-3)", margin: "4px 0 0" }}>
            {isBvA ? "Largest variances versus budget" : "Largest movements between periods"}
          </p>
        </div>

        {/* Summary bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Largest Favourable", value: largestFav ? fmtSignedGBP(largestFav.variance) : "—", sub: largestFav?.account || "", tone: "fav" },
            { label: "Largest Adverse", value: largestAdv ? fmtSignedGBP(largestAdv.variance) : "—", sub: largestAdv?.account || "", tone: "adv" },
            { label: "Total Favourable", value: fmtGBP(totalFav), sub: `${favRows.length} items`, tone: "fav" },
            { label: "Total Adverse", value: fmtGBP(totalAdv), sub: `${advRows.length} items`, tone: "adv" },
          ].map((c) => (
            <div key={c.label} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6 }}>
                {c.label}
              </div>
              <div style={{
                font: "var(--text-metric)", fontSize: 20, fontVariantNumeric: "tabular-nums",
                color: c.tone === "fav" ? "var(--favourable-text)" : "var(--adverse-text)",
              }}>
                {c.value}
              </div>
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
                {c.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Insights panel */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20,
        }}>
          {largestFav && (
            <div style={{
              padding: "12px 16px", borderRadius: "var(--radius-sm)",
              background: "var(--favourable-soft)", borderLeft: "3px solid var(--favourable)",
            }}>
              <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", color: "var(--favourable-text)", marginBottom: 4 }}>
                Largest Favourable
              </div>
              <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>{largestFav.account}</div>
              <div style={{ font: "var(--text-body)", fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                {fmtSignedGBP(largestFav.variance)} ({fmtPct(largestFav.variance_pct)})
              </div>
            </div>
          )}
          {largestAdv && (
            <div style={{
              padding: "12px 16px", borderRadius: "var(--radius-sm)",
              background: "var(--adverse-soft)", borderLeft: "3px solid var(--adverse)",
            }}>
              <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", color: "var(--adverse-text)", marginBottom: 4 }}>
                Largest Adverse
              </div>
              <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>{largestAdv.account}</div>
              <div style={{ font: "var(--text-body)", fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                {fmtSignedGBP(largestAdv.variance)} ({fmtPct(largestAdv.variance_pct)})
              </div>
            </div>
          )}
          {mostVolatile && (
            <div style={{
              padding: "12px 16px", borderRadius: "var(--radius-sm)",
              background: "var(--primary-soft)", borderLeft: "3px solid var(--primary)",
            }}>
              <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", color: "var(--primary)", marginBottom: 4 }}>
                Most Volatile Category
              </div>
              <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>{mostVolatile[0]}</div>
              <div style={{ font: "var(--text-body)", fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                {fmtGBP(mostVolatile[1])} total absolute variance
              </div>
            </div>
          )}
        </div>

        {/* Tabs + search */}
        <Card title="" style={{ padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{
              display: "flex", gap: 4,
              borderBottom: "1px solid var(--border)", paddingBottom: 0, flex: 1,
            }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{
                    font: "var(--text-body-strong)", fontSize: 13, padding: "8px 14px",
                    border: "none", background: "transparent",
                    color: activeTab === t.id ? "var(--primary)" : "var(--fg-3)",
                    borderBottom: activeTab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
                    cursor: "pointer",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Alert threshold toggle */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: alertThreshold != null ? "var(--adverse-soft)" : "var(--surface)",
              border: `1px solid ${alertThreshold != null ? "var(--adverse)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)", padding: "0 10px", height: 34, cursor: "pointer",
            }}
              title="Flag rows where |Var %| exceeds this threshold"
            >
              <Icon name="bell" size={13} color={alertThreshold != null ? "var(--adverse)" : "var(--fg-3)"} />
              <select
                value={alertThreshold ?? ""}
                onChange={e => setAlertThreshold(e.target.value === "" ? null : Number(e.target.value))}
                style={{
                  font: "var(--text-body)", fontSize: 13,
                  color: alertThreshold != null ? "var(--adverse-text)" : "var(--fg-2)",
                  background: "transparent", border: "none", outline: "none", cursor: "pointer",
                }}>
                <option value="">Alerts off</option>
                <option value={5}>Flag &gt;5%</option>
                <option value={10}>Flag &gt;10%</option>
                <option value={20}>Flag &gt;20%</option>
                <option value={50}>Flag &gt;50%</option>
              </select>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "0 10px", height: 34,
            }}>
              <Icon name="search" size={14} color="var(--fg-3)" />
              <input
                type="text" placeholder="Search accounts..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  font: "var(--text-body)", fontSize: 13, color: "var(--ink)",
                  background: "transparent", border: "none", outline: "none", width: 180,
                }}
              />
            </div>
          </div>

          {/* Alert count banner */}
          {alertThreshold != null && (() => {
            const count = sorted.filter(m => m.variance_pct != null && Math.abs(m.variance_pct) >= alertThreshold).length;
            return count > 0 ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                padding: "8px 14px", borderRadius: "var(--radius-sm)",
                background: "var(--adverse-soft)", border: "1px solid var(--adverse)",
                font: "var(--text-body-strong)", fontSize: 13, color: "var(--adverse-text)",
              }}>
                <Icon name="bell" size={14} color="var(--adverse)" />
                {count} account{count !== 1 ? "s" : ""} flagged with variance &gt;{alertThreshold}%
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                padding: "8px 14px", borderRadius: "var(--radius-sm)",
                background: "var(--favourable-soft)", border: "1px solid var(--favourable)",
                font: "var(--text-body-strong)", fontSize: 13, color: "var(--favourable-text)",
              }}>
                <Icon name="check-circle" size={14} color="var(--favourable)" />
                No accounts exceed the {alertThreshold}% threshold
              </div>
            );
          })()}

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="var">
              <thead>
                <tr>
                  <SortHeader col="account" label="Account" align="l" />
                  <SortHeader col="category" label="Category" align="l" />
                  {!isBvA && <th style={{ width: 64 }}>Trend</th>}
                  <SortHeader col="actual" label={isBvA ? "Actual" : "Current"} />
                  <SortHeader col="budget" label={isBvA ? "Budget" : "Prior"} />
                  <SortHeader col="variance" label="Variance" />
                  <SortHeader col="variance_pct" label="Var %" />
                  <th>Impact</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, i) => {
                  const isExpanded = expandedRow === i;
                  const isAlert = alertThreshold != null
                    && m.variance_pct != null
                    && Math.abs(m.variance_pct) >= alertThreshold;
                  return (
                    <React.Fragment key={i}>
                      <tr onClick={() => setExpandedRow(isExpanded ? null : i)}
                        style={{ cursor: "pointer", background: isExpanded ? "var(--surface-2)" : (isAlert ? "var(--adverse-soft)" : undefined) }}>
                        <td className="l" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isAlert && (
                            <span title={`Variance ${Math.abs(m.variance_pct).toFixed(1)}% exceeds ${alertThreshold}% threshold`}>
                              <Icon name="bell" size={13} color="var(--adverse)" />
                            </span>
                          )}
                          {m.account}
                        </td>
                        <td className="l">{m.category}</td>
                        {!isBvA && (
                          <td style={{ padding: "6px 8px" }}>
                            <Sparkline values={m.history} isFav={m.is_fav} />
                          </td>
                        )}
                        <td>{fmtGBP(m.value)}</td>
                        <td>{fmtGBP(m.prior_value)}</td>
                        <td className={m.is_fav ? "fav" : m.variance !== 0 ? "adv" : ""}>{fmtSignedGBP(m.variance)}</td>
                        <td className={m.is_fav ? "fav" : m.variance !== 0 ? "adv" : ""}>{fmtPct(m.variance_pct)}</td>
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
                        <td>
                          <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="var(--fg-3)" />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={isBvA ? 8 : 9} style={{ padding: 0, border: "none" }}>
                            <div style={{
                              padding: "16px 20px", background: "var(--surface)",
                              borderBottom: "1px solid var(--border)",
                            }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, auto)", gap: "12px 24px", marginBottom: 12 }}>
                                <div>
                                  <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", color: "var(--fg-3)" }}>
                                    {isBvA ? "Actual" : "Current"}
                                  </div>
                                  <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--ink)" }}>{fmtGBP(m.value)}</div>
                                </div>
                                <div>
                                  <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", color: "var(--fg-3)" }}>
                                    {isBvA ? "Budget" : "Prior"}
                                  </div>
                                  <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--ink)" }}>{fmtGBP(m.prior_value)}</div>
                                </div>
                                <div>
                                  <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", color: "var(--fg-3)" }}>Variance</div>
                                  <div style={{
                                    font: "var(--text-body-strong)", fontSize: 14,
                                    color: m.is_fav ? "var(--favourable-text)" : "var(--adverse-text)",
                                  }}>{fmtSignedGBP(m.variance)}</div>
                                </div>
                                <div>
                                  <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", color: "var(--fg-3)" }}>Var %</div>
                                  <div style={{
                                    font: "var(--text-body-strong)", fontSize: 14,
                                    color: m.is_fav ? "var(--favourable-text)" : "var(--adverse-text)",
                                  }}>{fmtPct(m.variance_pct)}</div>
                                </div>
                                <div>
                                  <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", color: "var(--fg-3)" }}>Category</div>
                                  <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--ink)" }}>{m.category}</div>
                                </div>
                              </div>

                              <div style={{
                                padding: "10px 14px", background: "var(--surface-2)",
                                borderRadius: "var(--radius-sm)", marginBottom: 12,
                                font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5,
                              }}>
                                {generateExplanation(m)}
                              </div>

                              {/* ── Category reclassification ── */}
                              {categories.length > 0 && (
                                <div style={{
                                  marginBottom: 12, padding: "10px 14px",
                                  background: "var(--surface)", borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border)",
                                  display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                                }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <span style={{ font: "var(--text-label)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: ".06em", flexShrink: 0 }}>
                                    Reclassify
                                  </span>
                                  <select
                                    defaultValue={m.category}
                                    id={`cat-sel-${i}`}
                                    style={{
                                      font: "var(--text-body)", fontSize: 13, color: "var(--ink)",
                                      background: "var(--surface-2)", border: "1px solid var(--border)",
                                      borderRadius: "var(--radius-sm)", padding: "4px 8px", cursor: "pointer",
                                    }}
                                  >
                                    {categories.map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const sel = document.getElementById(`cat-sel-${i}`);
                                      if (sel) handleReclassify(m.account, sel.value);
                                    }}
                                    disabled={reclassState[m.account]?.saving}
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 5,
                                      font: "var(--text-body-strong)", fontSize: 12.5,
                                      padding: "5px 12px", borderRadius: "var(--radius-sm)",
                                      border: "1px solid var(--border)",
                                      background: "var(--surface-2)", color: "var(--fg-2)",
                                      cursor: "pointer", opacity: reclassState[m.account]?.saving ? 0.6 : 1,
                                    }}
                                  >
                                    {reclassState[m.account]?.saving
                                      ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />Saving…</>
                                      : <><Icon name="tag" size={13} />Save</>
                                    }
                                  </button>
                                  {reclassState[m.account]?.saved && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "var(--text-body)", fontSize: 12.5, color: "var(--favourable-text)" }}>
                                      <Icon name="check-circle" size={13} color="var(--favourable)" />
                                      Updated to {reclassState[m.account]?.category}
                                    </span>
                                  )}
                                  {reclassState[m.account]?.error && (
                                    <span style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--adverse-text)" }}>
                                      {reclassState[m.account].error}
                                    </span>
                                  )}
                                </div>
                              )}

                              <button onClick={(e) => { e.stopPropagation(); handleExplainVariance(m); }}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  font: "var(--text-body-strong)", fontSize: 12.5,
                                  padding: "6px 14px", borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--primary)", background: "var(--primary-soft)",
                                  color: "var(--primary)", cursor: "pointer",
                                }}>
                                <Icon name="sparkles" size={13} />
                                Explain this variance
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {sorted.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--fg-3)" }}>No matching accounts</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
Object.assign(window, { Movements });
