/* FP&A Copilot — read-only shared client digest */
const { useState: useSVState, useEffect: useSVEffect } = React;

// ── Shared colour palette ──────────────────────────────────────────────────
const SV_NAVY    = "#0C1726";
const SV_PRIMARY = "#2F62E8";
const SV_FAV     = "#0E8A57";
const SV_ADV     = "#D02B45";
const SV_FAV_BG  = "#E6F4EE";
const SV_ADV_BG  = "#FDE8EC";
const SV_BORDER  = "#E2E8F0";
const SV_FG2     = "#344054";
const SV_FG3     = "#667085";
const SV_BG      = "#F0F2F5";

// ── Trend chart ────────────────────────────────────────────────────────────
function SvTrendChart({ trend }) {
  if (!trend || trend.length < 2) return null;

  const W = 600, H = 200;
  const PAD = { top: 16, right: 20, bottom: 36, left: 64 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top  - PAD.bottom;

  const series = [
    { key: "revenue", label: "Revenue", color: SV_PRIMARY },
    { key: "costs",   label: "Costs",   color: SV_ADV },
    { key: "profit",  label: "Profit",  color: SV_FAV },
  ];

  const allVals = trend.flatMap(d => series.map(s => d[s.key] ?? 0));
  let minV = Math.min(...allVals);
  let maxV = Math.max(...allVals);
  const spread = (maxV - minV) || 1;
  minV -= spread * 0.1;
  maxV += spread * 0.1;
  const vRange = maxV - minV;

  const xScale = i => PAD.left + (i / (trend.length - 1)) * pw;
  const yScale = v => PAD.top + ph - ((v - minV) / vRange) * ph;

  const fmtY = v => {
    const a = Math.abs(v);
    const s = v < 0 ? "-£" : "£";
    if (a >= 1e6) return `${s}${(a / 1e6).toFixed(1)}m`;
    if (a >= 1e3) return `${s}${(a / 1e3).toFixed(0)}k`;
    return `${s}${Math.round(a)}`;
  };

  const yTicks = Array.from({ length: 5 }, (_, i) => minV + vRange * i / 4);
  const pts = key => trend.map((d, i) => `${xScale(i)},${yScale(d[key] ?? 0)}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Grid + Y labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
              stroke={SV_BORDER} strokeWidth={1} />
            <text x={PAD.left - 8} y={yScale(v) + 4}
              textAnchor="end" fontSize={9.5} fill={SV_FG3} fontFamily="system-ui, sans-serif">
              {fmtY(v)}
            </text>
          </g>
        ))}

        {/* Zero line */}
        {minV < 0 && maxV > 0 && (
          <line x1={PAD.left} y1={yScale(0)} x2={W - PAD.right} y2={yScale(0)}
            stroke={SV_FG3} strokeWidth={1} strokeDasharray="4,3" opacity={0.4} />
        )}

        {/* X labels */}
        {trend.map((d, i) => (
          <text key={i} x={xScale(i)} y={H - PAD.bottom + 16}
            textAnchor="middle" fontSize={10} fill={SV_FG3} fontFamily="system-ui, sans-serif">
            {d.m}
          </text>
        ))}

        {/* Lines */}
        {series.map(s => (
          <polyline key={s.key} points={pts(s.key)}
            fill="none" stroke={s.color} strokeWidth={2.5}
            strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {/* Dots */}
        {series.map(s => trend.map((d, i) => (
          <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(d[s.key] ?? 0)}
            r={3.5} fill={s.color} />
        )))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 6 }}>
        {series.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 3, background: s.color, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: SV_FG3, fontFamily: "system-ui, sans-serif" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main shared view ───────────────────────────────────────────────────────
function SharedView({ sessionId }) {
  const { Icon } = window;
  const [data,        setData]        = useSVState(null);
  const [loading,     setLoading]     = useSVState(true);
  const [fetching,    setFetching]    = useSVState(false);
  const [errMsg,      setErrMsg]      = useSVState(null);
  const [selPeriod,   setSelPeriod]   = useSVState("");
  const [downloading, setDownloading] = useSVState(false);

  const firmName = (() => {
    try { return new URLSearchParams(window.location.search).get("firm") || ""; } catch { return ""; }
  })();

  useSVEffect(() => {
    if (data) setFetching(true); else setLoading(true);
    const qs = selPeriod
      ? `period=${encodeURIComponent(selPeriod)}&mode=monthly`
      : `period=&mode=monthly`;
    fetch(apiUrl(`/api/data/${sessionId}?${qs}`))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setData(d); setLoading(false); setFetching(false); })
      .catch(() => { setErrMsg("This report link has expired or is no longer available."); setLoading(false); setFetching(false); });
  }, [sessionId, selPeriod]);

  // ── Number formatters ──────────────────────────────────────────────────────
  const fmt = v => {
    const n = parseFloat(v);
    if (v == null || isNaN(n)) return "—";
    return (n < 0 ? "-£" : "£") + Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 });
  };
  const fmtS = v => {
    const n = parseFloat(v);
    if (v == null || isNaN(n)) return "—";
    return (n >= 0 ? "+£" : "-£") + Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 });
  };
  const fmtP = v => {
    const n = parseFloat(v);
    if (v == null || isNaN(n)) return "—";
    return (n > 0 ? "+" : "") + n.toFixed(1) + "%";
  };

  const card = { background: "#fff", border: `1px solid ${SV_BORDER}`, borderRadius: 10 };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: SV_BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${SV_BORDER}`, borderTopColor: SV_PRIMARY, borderRadius: "50%",
          animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 13.5, color: SV_FG3 }}>Loading report…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (errMsg || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: SV_BG, padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <Icon name="file-x" size={40} color={SV_FG3} />
        <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: SV_NAVY }}>Report not found</div>
        <div style={{ marginTop: 8, fontSize: 13.5, color: SV_FG2, lineHeight: 1.6 }}>
          {errMsg || "This report link has expired or is no longer available."}
        </div>
      </div>
    </div>
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const companyName = (data.file_name || "Report")
    .replace(/\.[a-zA-Z]{2,5}$/, "")
    .replace(/[_-]/g, " ")
    .trim();
  const periodLabel = data.period?.label || data.selected_period || "Period";
  const priorLabel  = data.period?.prior || "Prior";
  const isBvA       = data.analysis_type === "budget_vs_actual";
  const analysisLbl = isBvA ? "Budget vs Actual" : "P&L Variance Analysis";
  const today       = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const kpis      = (data.kpis       || []).slice(0, 6);
  const commentary = (data.commentary || []);
  const movements  = (data.movements  || []);
  const trend      = (data.trend      || []);
  const favMvts   = movements.filter(m => m.is_fav  && m.variance !== 0)
                              .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);
  const advMvts   = movements.filter(m => !m.is_fav && m.variance !== 0)
                              .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);

  // ── PDF download ───────────────────────────────────────────────────────────
  async function downloadPdf() {
    setDownloading(true);
    try {
      const period = selPeriod || data.selected_period || "";
      const params = new URLSearchParams({ period, fmt: "pdf" });
      if (firmName) params.set("firm", firmName);
      const r = await fetch(apiUrl(`/api/export/${sessionId}?${params}`));
      if (!r.ok) throw new Error(r.status);
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${companyName.replace(/\s+/g, "_")}_${periodLabel}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setDownloading(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: SV_BG, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ─── Header band ─── */}
      <div style={{ background: SV_NAVY }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "22px 28px 20px" }}>

          {/* Top row: wordmark + actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>MonthEndIQ</span>
              <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 12.5, color: "#94A3B8" }}>Management Pack</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 20,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 11.5, fontWeight: 500, color: "#94A3B8",
              }}>
                <Icon name="lock" size={11} color="#94A3B8" />
                Read-only
              </span>
              <button
                onClick={downloadPdf}
                disabled={downloading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 13px", borderRadius: 20,
                  background: downloading ? "rgba(255,255,255,0.08)" : SV_PRIMARY,
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontSize: 12, fontWeight: 600, color: "#fff",
                  cursor: downloading ? "default" : "pointer",
                  opacity: downloading ? 0.7 : 1, transition: "opacity .15s",
                }}
              >
                {downloading
                  ? <React.Fragment>
                      <span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
                        borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Preparing…
                    </React.Fragment>
                  : <React.Fragment>
                      <Icon name="download" size={12} color="#fff" />
                      Download PDF
                    </React.Fragment>
                }
              </button>
            </div>
          </div>

          {/* Company name + period selector */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                {companyName}
              </div>
              <div style={{ marginTop: 7, fontSize: 13, color: "#94A3B8" }}>
                {analysisLbl} · Prepared {today}
                {fetching && (
                  <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 5, verticalAlign: "middle" }}>
                    <span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                      borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  </span>
                )}
              </div>
            </div>
            {(data.periods || []).length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Icon name="calendar" size={13} color="#94A3B8" />
                <select
                  value={selPeriod || data.selected_period || ""}
                  onChange={e => setSelPeriod(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 6, padding: "5px 10px", color: "#fff",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none",
                  }}
                >
                  {(data.periods || []).map((p, i) => (
                    <option key={p} value={p} style={{ background: SV_NAVY, color: "#fff" }}>
                      {(data.period_labels || [])[i] || p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

        </div>
        <div style={{ height: 3, background: SV_PRIMARY }} />
      </div>

      {/* ─── Body ─── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 28px 52px" }}>

        {/* KPI tiles */}
        {kpis.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12, marginBottom: 20,
          }}>
            {kpis.map((k, i) => {
              const fav = k.is_fav;
              return (
                <div key={i} style={{ ...card, padding: "16px 18px", borderTop: `3px solid ${fav ? SV_FAV : SV_ADV}` }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: SV_FG3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: SV_NAVY, letterSpacing: "-0.5px", lineHeight: 1 }}>
                    {k.pct_only ? fmtP(k.pct) : fmt(k.value)}
                  </div>
                  {!k.pct_only && (
                    <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11.5, fontWeight: 600, color: fav ? SV_FAV : SV_ADV,
                        background: fav ? SV_FAV_BG : SV_ADV_BG, padding: "2px 8px", borderRadius: 20,
                      }}>
                        {fmtP(k.pct)}
                      </span>
                      <span style={{ fontSize: 11, color: SV_FG3 }}>vs {priorLabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trend chart */}
        {trend.length >= 2 && (
          <div style={{ ...card, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: SV_PRIMARY, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>
              Financial Trend
            </div>
            <SvTrendChart trend={trend} />
          </div>
        )}

        {/* Board Commentary */}
        {commentary.length > 0 && (
          <div style={{ ...card, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: SV_PRIMARY, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
              Board Commentary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {commentary.map((line, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: SV_FG2, lineHeight: 1.6 }}>
                  <span style={{ color: SV_PRIMARY, flexShrink: 0, fontWeight: 600, lineHeight: 1.6 }}>·</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fav / Adv variance panels */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 12, marginBottom: 28,
        }}>
          {[
            { label: "Favourable Variances", rows: favMvts, c: SV_FAV, bg: SV_FAV_BG, icon: "trending-up" },
            { label: "Adverse Variances",    rows: advMvts, c: SV_ADV, bg: SV_ADV_BG, icon: "trending-down" },
          ].map(({ label, rows, c, bg, icon }) => (
            <div key={label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Icon name={icon} size={13} color={c} />
                <div style={{ fontSize: 10.5, fontWeight: 600, color: c, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {label}
                </div>
              </div>
              {rows.length === 0 ? (
                <div style={{ fontSize: 13, color: SV_FG3 }}>None in this period</div>
              ) : rows.map((m, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < rows.length - 1 ? `1px solid ${SV_BORDER}` : "none",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: SV_FG2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.account}
                    </div>
                    <div style={{ fontSize: 11, color: SV_FG3, marginTop: 2 }}>{m.category}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: c }}>{fmtS(m.variance)}</div>
                    <div style={{ fontSize: 11, color: c, marginTop: 2 }}>{fmtP(m.variance_pct)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: `1px solid ${SV_BORDER}`, paddingTop: 18 }}>
          <div style={{ fontSize: 12, color: SV_FG3, lineHeight: 1.5 }}>
            {firmName
              ? <span>Prepared by <span style={{ fontWeight: 600, color: SV_NAVY }}>{firmName}</span></span>
              : "Prepared by your accountant"}
            <span style={{ margin: "0 6px", color: SV_BORDER }}>·</span>
            Powered by <span style={{ fontWeight: 600, color: SV_NAVY }}>MonthEndIQ</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, color: "#C0C8D4" }}>
            Financial intelligence for modern accounting practices
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { SharedView });
