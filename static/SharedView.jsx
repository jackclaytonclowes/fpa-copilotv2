/* FP&A Copilot — read-only shared client digest */
const { useState: useSVState, useEffect: useSVEffect } = React;

// ── Light palette ──────────────────────────────────────────────────────────
const SV_LIGHT = {
  navy:    "#0C1726",
  bg:      "#F0F2F5",
  card:    "#ffffff",
  border:  "#E2E8F0",
  fg1:     "#0C1726",
  fg2:     "#344054",
  fg3:     "#667085",
  favBg:   "#E6F4EE",
  advBg:   "#FDE8EC",
  header:  "rgba(255,255,255,0.08)",
  hborder: "rgba(255,255,255,0.14)",
};

// ── Dark palette ───────────────────────────────────────────────────────────
const SV_DARK = {
  navy:    "#0C1726",
  bg:      "#0F172A",
  card:    "#1A2235",
  border:  "#2D3748",
  fg1:     "#F1F5F9",
  fg2:     "#CBD5E1",
  fg3:     "#94A3B8",
  favBg:   "rgba(14,138,87,0.18)",
  advBg:   "rgba(208,43,69,0.18)",
  header:  "rgba(255,255,255,0.08)",
  hborder: "rgba(255,255,255,0.14)",
};

// Brand colours — same in both modes
const SV_PRIMARY = "#2F62E8";
const SV_FAV     = "#0E8A57";
const SV_ADV     = "#D02B45";

// ── Trend chart ────────────────────────────────────────────────────────────
function SvTrendChart({ trend, p }) {
  const [hoveredIdx, setHoveredIdx] = useSVState(null);
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
    const a = Math.abs(v), s = v < 0 ? "-£" : "£";
    if (a >= 1e6) return `${s}${(a / 1e6).toFixed(1)}m`;
    if (a >= 1e3) return `${s}${(a / 1e3).toFixed(0)}k`;
    return `${s}${Math.round(a)}`;
  };

  const yTicks = Array.from({ length: 5 }, (_, i) => minV + vRange * i / 4);
  const pts = key => trend.map((d, i) => `${xScale(i)},${yScale(d[key] ?? 0)}`).join(" ");

  // Always-dark tooltip for contrast
  const TT_BG = "#0F1D2F", TT_BD = "#2D3B4E", TT_F1 = "#F1F5F9", TT_F3 = "#94A3B8";
  const hovD = hoveredIdx !== null ? trend[hoveredIdx] : null;
  const hovX = hoveredIdx !== null ? xScale(hoveredIdx) : 0;
  const TW = 150, TH = 72;
  const ttX = hovX + TW + 14 > W - PAD.right ? hovX - TW - 8 : hovX + 8;
  const ttY = PAD.top + 4;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
              stroke={p.border} strokeWidth={1} />
            <text x={PAD.left - 8} y={yScale(v) + 4}
              textAnchor="end" fontSize={9.5} fill={p.fg3} fontFamily="system-ui, sans-serif">
              {fmtY(v)}
            </text>
          </g>
        ))}
        {minV < 0 && maxV > 0 && (
          <line x1={PAD.left} y1={yScale(0)} x2={W - PAD.right} y2={yScale(0)}
            stroke={p.fg3} strokeWidth={1} strokeDasharray="4,3" opacity={0.4} />
        )}
        {trend.map((d, i) => (
          <text key={i} x={xScale(i)} y={H - PAD.bottom + 16}
            textAnchor="middle" fontSize={10}
            fill={hoveredIdx === i ? p.fg1 : p.fg3}
            fontFamily="system-ui, sans-serif">
            {d.m}
          </text>
        ))}
        {series.map(s => (
          <polyline key={s.key} points={pts(s.key)}
            fill="none" stroke={s.color} strokeWidth={2.5}
            strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map(s => trend.map((d, i) => (
          <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(d[s.key] ?? 0)}
            r={hoveredIdx === i ? 6 : 5} fill={s.color}
            opacity={hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 1} />
        )))}

        {/* Invisible hit areas per column */}
        {trend.map((d, i) => {
          const x0 = i === 0 ? PAD.left : (xScale(i) + xScale(i - 1)) / 2;
          const x1 = i === trend.length - 1 ? W - PAD.right : (xScale(i) + xScale(i + 1)) / 2;
          return (
            <rect key={`hit-${i}`} x={x0} y={PAD.top} width={x1 - x0} height={ph}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)} />
          );
        })}

        {/* Crosshair */}
        {hovD && (
          <line x1={hovX} y1={PAD.top} x2={hovX} y2={PAD.top + ph}
            stroke={p.fg3} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
        )}

        {/* Tooltip */}
        {hovD && (
          <g>
            <rect x={ttX} y={ttY} width={TW} height={TH} rx={6}
              fill={TT_BG} stroke={TT_BD} strokeWidth={1} />
            <text x={ttX + 10} y={ttY + 15} fontSize={9.5} fontWeight={600}
              fill={TT_F3} fontFamily="system-ui, sans-serif">{hovD.m}</text>
            {series.map((s, si) => (
              <g key={s.key}>
                <circle cx={ttX + 11} cy={ttY + 28 + si * 14} r={3} fill={s.color} />
                <text x={ttX + 20} y={ttY + 32 + si * 14} fontSize={9.5}
                  fill={TT_F1} fontFamily="system-ui, sans-serif">
                  {s.label}: {fmtY(hovD[s.key] ?? 0)}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
        {series.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", minHeight: 32 }}>
            <div style={{ width: 24, height: 4, background: s.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: p.fg3, fontFamily: "system-ui, sans-serif" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main shared view ───────────────────────────────────────────────────────
function SharedView({ sessionId }) {
  const { Icon } = window;

  // Dark mode — init from localStorage, fall back to OS preference
  const [isDark, setIsDark] = useSVState(() => {
    try {
      const stored = localStorage.getItem("meiq_sv_dark");
      if (stored !== null) return stored === "1";
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // Sync to OS changes when no explicit preference stored
  useSVEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = e => {
      try { if (localStorage.getItem("meiq_sv_dark") === null) setIsDark(e.matches); } catch { setIsDark(e.matches); }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem("meiq_sv_dark", next ? "1" : "0"); } catch {}
  };

  const p = isDark ? SV_DARK : SV_LIGHT;

  const [data,        setData]        = useSVState(null);
  const [loading,     setLoading]     = useSVState(true);
  const [fetching,    setFetching]    = useSVState(false);
  const [errMsg,      setErrMsg]      = useSVState(null);
  const [selPeriod,   setSelPeriod]   = useSVState("");
  const [downloading, setDownloading] = useSVState(false);
  const [showAllMvts, setShowAllMvts] = useSVState(false);

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

  const fmt  = v => { const n = parseFloat(v); if (v == null || isNaN(n)) return "—"; return (n < 0 ? "-£" : "£") + Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 }); };
  const fmtS = v => { const n = parseFloat(v); if (v == null || isNaN(n)) return "—"; return (n >= 0 ? "+£" : "-£") + Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 }); };
  const fmtP = v => { const n = parseFloat(v); if (v == null || isNaN(n)) return "—"; return (n > 0 ? "+" : "") + n.toFixed(1) + "%"; };

  const card = { background: p.card, border: `1px solid ${p.border}`, borderRadius: 10 };

  const spinStyle = (color = SV_PRIMARY, size = 36, border = 3) => ({
    width: size, height: size,
    border: `${border}px solid ${p.border}`, borderTopColor: color,
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  });

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: p.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...spinStyle(), margin: "0 auto 14px" }} />
        <div style={{ fontSize: 13.5, color: p.fg3 }}>Loading report…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (errMsg || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: p.bg, padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <Icon name="file-x" size={40} color={p.fg3} />
        <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: p.fg1 }}>Report not found</div>
        <div style={{ marginTop: 8, fontSize: 13.5, color: p.fg2, lineHeight: 1.6 }}>
          {errMsg || "This report link has expired or is no longer available."}
        </div>
      </div>
    </div>
  );

  const companyName = (data.file_name || "Report").replace(/\.[a-zA-Z]{2,5}$/, "").replace(/[_-]/g, " ").trim();
  const periodLabel = data.period?.label || data.selected_period || "Period";
  const priorLabel  = data.period?.prior || "Prior";
  const isBvA       = data.analysis_type === "budget_vs_actual";
  const analysisLbl = isBvA ? "Budget vs Actual" : "P&L Variance Analysis";
  const today       = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const kpis       = (data.kpis       || []).slice(0, 6);
  const commentary = (data.commentary || []);
  const movements  = (data.movements  || []);
  const trend      = (data.trend      || []);
  const favMvts    = movements.filter(m => m.is_fav  && m.variance !== 0).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);
  const advMvts    = movements.filter(m => !m.is_fav && m.variance !== 0).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);

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
      a.href = url; a.download = `${companyName.replace(/\s+/g, "_")}_${periodLabel}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch {}
    setDownloading(false);
  }

  const miniSpinner = (
    <span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
      borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
  );

  return (
    <div style={{ minHeight: "100vh", background: p.bg, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ─── Header band ─── */}
      <div style={{ background: SV_DARK.navy }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "22px 28px 20px" }}>

          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>MonthEndIQ</span>
              <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 12.5, color: "#94A3B8" }}>Management Pack</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Dark mode toggle */}
              <button onClick={toggleDark} title={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 30, height: 30, borderRadius: 20,
                background: p.header, border: `1px solid ${p.hborder}`,
                cursor: "pointer", color: "#94A3B8",
              }}>
                <Icon name={isDark ? "sun" : "moon"} size={13} color="#94A3B8" />
              </button>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 20,
                background: p.header, border: `1px solid ${p.hborder}`,
                fontSize: 11.5, fontWeight: 500, color: "#94A3B8",
              }}>
                <Icon name="lock" size={11} color="#94A3B8" /> Read-only
              </span>
              <button onClick={downloadPdf} disabled={downloading} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 13px", borderRadius: 20,
                background: downloading ? p.header : SV_PRIMARY,
                border: `1px solid ${p.hborder}`,
                fontSize: 12, fontWeight: 600, color: "#fff",
                cursor: downloading ? "default" : "pointer",
                opacity: downloading ? 0.7 : 1, transition: "opacity .15s",
              }}>
                {downloading
                  ? <React.Fragment>{miniSpinner} Preparing…</React.Fragment>
                  : <React.Fragment><Icon name="download" size={12} color="#fff" /> Download PDF</React.Fragment>
                }
              </button>
            </div>
          </div>

          {/* Company + period selector */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                {companyName}
              </div>
              <div style={{ marginTop: 7, fontSize: 13, color: "#94A3B8" }}>
                {analysisLbl} · Prepared {today}
                {firmName && <span> · by <span style={{ color: "#CBD5E1", fontWeight: 500 }}>{firmName}</span></span>}
                {fetching && <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>{miniSpinner}</span>}
              </div>
            </div>
            {(data.periods || []).length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Icon name="calendar" size={13} color="#94A3B8" />
                <select value={selPeriod || data.selected_period || ""} onChange={e => setSelPeriod(e.target.value)} style={{
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 6, padding: "5px 10px", color: "#fff",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none",
                }}>
                  {(data.periods || []).map((pd, i) => (
                    <option key={pd} value={pd} style={{ background: SV_DARK.navy, color: "#fff" }}>
                      {(data.period_labels || [])[i] || pd}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            {kpis.map((k, i) => {
              const fav = k.is_fav;
              return (
                <div key={i} style={{ ...card, padding: "16px 18px", borderTop: `3px solid ${fav ? SV_FAV : SV_ADV}` }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: p.fg3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: p.fg1, letterSpacing: "-0.5px", lineHeight: 1 }}>
                    {k.pct_only ? fmtP(k.pct) : fmt(k.value)}
                  </div>
                  {!k.pct_only && (
                    <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: fav ? SV_FAV : SV_ADV, background: fav ? p.favBg : p.advBg, padding: "2px 8px", borderRadius: 20 }}>
                        {fmtP(k.pct)}
                      </span>
                      <span style={{ fontSize: 11, color: p.fg3 }}>vs {priorLabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trend outlook signal — forward-looking indicator derived from last 3 periods */}
        {trend.length >= 3 && (() => {
          const signals = ["revenue", "profit"].map(key => {
            const vals = trend.map(d => d[key] ?? 0);
            const last  = vals[vals.length - 1];
            const prev2 = vals.slice(-3, -1);
            const avg   = prev2.reduce((s, v) => s + v, 0) / prev2.length;
            const pct   = avg !== 0 ? (last - avg) / Math.abs(avg) * 100 : 0;
            const up    = pct > 3;
            const down  = pct < -3;
            return {
              label: key.charAt(0).toUpperCase() + key.slice(1),
              icon: up ? "trending-up" : down ? "trending-down" : "minus",
              text: up ? `Trending up ${pct.toFixed(0)}%` : down ? `Trending down ${Math.abs(pct).toFixed(0)}%` : "Holding steady",
              color: up ? SV_FAV : down ? SV_ADV : "#B45309",
              bg: up ? p.favBg : down ? p.advBg : (isDark ? "rgba(180,83,9,.15)" : "#FEF3C7"),
            };
          });
          return (
            <div style={{ ...card, padding: "14px 20px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: p.fg3, textTransform: "uppercase", letterSpacing: ".07em", alignSelf: "center", flexShrink: 0 }}>
                Trend outlook
              </div>
              {signals.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, background: s.bg, borderRadius: 20, padding: "5px 12px" }}>
                  <Icon name={s.icon} size={12} color={s.color} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                  <span style={{ fontSize: 11.5, color: p.fg3, marginLeft: 2 }}>{s.text}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: p.fg3, alignSelf: "center", marginLeft: "auto" }}>
                Based on last 3 periods
              </div>
            </div>
          );
        })()}

        {/* Trend chart */}
        {trend.length >= 2 && (
          <div style={{ ...card, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: SV_PRIMARY, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>
              Financial Trend
            </div>
            <SvTrendChart trend={trend} p={p} />
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
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: p.fg2, lineHeight: 1.6 }}>
                  <span style={{ color: SV_PRIMARY, flexShrink: 0, fontWeight: 600, lineHeight: 1.6 }}>·</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fav / Adv variance panels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 12 }}>
          {[
            { label: "Favourable Variances", rows: favMvts, c: SV_FAV, bg: p.favBg, icon: "trending-up" },
            { label: "Adverse Variances",    rows: advMvts, c: SV_ADV, bg: p.advBg, icon: "trending-down" },
          ].map(({ label, rows, c, bg, icon }) => (
            <div key={label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Icon name={icon} size={13} color={c} />
                <div style={{ fontSize: 10.5, fontWeight: 600, color: c, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {label}
                </div>
              </div>
              {rows.length === 0 ? (
                <div style={{ fontSize: 13, color: p.fg3 }}>None in this period</div>
              ) : rows.map((m, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "8px 0", borderBottom: i < rows.length - 1 ? `1px solid ${p.border}` : "none",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: p.fg2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.account}</div>
                    <div style={{ fontSize: 11, color: p.fg3, marginTop: 2 }}>{m.category}</div>
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

        {/* Full variance breakdown — collapsible */}
        {movements.length > 0 && (
          <div style={{ ...card, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: SV_PRIMARY, textTransform: "uppercase", letterSpacing: ".07em" }}>
                Full Variance Breakdown
              </div>
              <button onClick={() => setShowAllMvts(v => !v)} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 20,
                background: "transparent", border: `1px solid ${p.border}`,
                fontSize: 11.5, fontWeight: 500, color: p.fg2, cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
              }}>
                {showAllMvts ? "Hide" : `Show all ${movements.length} lines`}
                <Icon name={showAllMvts ? "chevron-up" : "chevron-down"} size={11} color={p.fg3} />
              </button>
            </div>
            {showAllMvts && (
              <div style={{ marginTop: 14, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontFamily: "system-ui, sans-serif" }}>
                  <thead>
                    <tr>
                      {["Account", "Category", isBvA ? "Actual" : "Current", isBvA ? "Budget" : "Prior", "Variance", "%"].map(h => (
                        <th key={h} style={{
                          textAlign: h === "Account" || h === "Category" ? "left" : "right",
                          padding: "6px 10px", fontSize: 10, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: ".06em",
                          color: p.fg3, borderBottom: `2px solid ${p.border}`, whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...movements].sort((a, b) => Math.abs(b.variance || 0) - Math.abs(a.variance || 0)).map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)") }}>
                        <td style={{ padding: "7px 10px", color: p.fg1, fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.account}</td>
                        <td style={{ padding: "7px 10px", color: p.fg3, fontSize: 11.5 }}>{m.category}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: p.fg2 }}>{m.value != null ? fmt(m.value) : "—"}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: p.fg2 }}>{m.prior_value != null ? fmt(m.prior_value) : "—"}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, color: m.variance !== 0 ? (m.is_fav ? SV_FAV : SV_ADV) : p.fg3 }}>
                          {m.variance != null ? fmtS(m.variance) : "—"}
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "right" }}>
                          {m.variance !== 0 && m.variance_pct != null && (
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                              background: m.is_fav ? p.favBg : p.advBg,
                              color: m.is_fav ? SV_FAV : SV_ADV,
                            }}>{fmtP(m.variance_pct)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: `1px solid ${p.border}`, paddingTop: 18 }}>
          <div style={{ fontSize: 12, color: p.fg3, lineHeight: 1.5 }}>
            {firmName
              ? <span>Prepared by <span style={{ fontWeight: 600, color: p.fg1 }}>{firmName}</span></span>
              : "Prepared by your accountant"}
            <span style={{ margin: "0 6px", color: p.border }}>·</span>
            Powered by <span style={{ fontWeight: 600, color: p.fg1 }}>MonthEndIQ</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, color: p.fg3, opacity: 0.6 }}>
            Financial intelligence for modern accounting practices
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { SharedView });
