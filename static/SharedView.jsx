/* FP&A Copilot — read-only shared client digest */
const { useState: useSVState, useEffect: useSVEffect } = React;

function SharedView({ sessionId }) {
  const { Icon } = window;
  const [data,     setData]       = useSVState(null);
  const [loading,  setLoading]    = useSVState(true);
  const [fetching, setFetching]   = useSVState(false);
  const [errMsg,   setErrMsg]     = useSVState(null);
  const [selPeriod, setSelPeriod] = useSVState("");
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

  // ── Colour palette (mirrors analysis.py brand colours) ────────────────────
  const NAVY    = "#0C1726";
  const PRIMARY = "#2F62E8";
  const FAV     = "#0E8A57";
  const ADV     = "#D02B45";
  const FAV_BG  = "#E6F4EE";
  const ADV_BG  = "#FDE8EC";
  const BORDER  = "#E2E8F0";
  const FG2     = "#344054";
  const FG3     = "#667085";
  const SOFT    = "#F7F9FC";
  const BG      = "#F0F2F5";

  const card = { background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10 };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: "50%",
          animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 13.5, color: FG3 }}>Loading report…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (errMsg || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <Icon name="file-x" size={40} color={FG3} />
        <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: NAVY }}>Report not found</div>
        <div style={{ marginTop: 8, fontSize: 13.5, color: FG2, lineHeight: 1.6 }}>
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
  const periodLabel  = data.period?.label || data.selected_period || "Period";
  const priorLabel   = data.period?.prior || "Prior";
  const isBvA        = data.analysis_type === "budget_vs_actual";
  const analysisLbl  = isBvA ? "Budget vs Actual" : "P&L Variance Analysis";
  const today        = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const kpis         = (data.kpis       || []).slice(0, 6);
  const commentary   = (data.commentary || []);
  const movements    = (data.movements  || []);
  const favMvts      = movements.filter(m => m.is_fav  && m.variance !== 0)
                                .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);
  const advMvts      = movements.filter(m => !m.is_fav && m.variance !== 0)
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
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ─── Header band ─── */}
      <div style={{ background: NAVY }}>
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
                  background: downloading ? "rgba(255,255,255,0.08)" : PRIMARY,
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
          {/* Company + period */}
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
            {/* Period selector — only shown when multiple periods available */}
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
                    <option key={p} value={p} style={{ background: NAVY, color: "#fff" }}>
                      {(data.period_labels || [])[i] || p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 3, background: PRIMARY }} />
      </div>

      {/* ─── Body ─── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 28px 52px" }}>

        {/* KPI tiles */}
        {kpis.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}>
            {kpis.map((k, i) => {
              const fav = k.is_fav;
              return (
                <div key={i} style={{ ...card, padding: "16px 18px", borderTop: `3px solid ${fav ? FAV : ADV}` }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: FG3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: NAVY, letterSpacing: "-0.5px", lineHeight: 1 }}>
                    {k.pct_only ? fmtP(k.pct) : fmt(k.value)}
                  </div>
                  {!k.pct_only && (
                    <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11.5, fontWeight: 600, color: fav ? FAV : ADV,
                        background: fav ? FAV_BG : ADV_BG,
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        {fmtP(k.pct)}
                      </span>
                      <span style={{ fontSize: 11, color: FG3 }}>vs {priorLabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Board Commentary */}
        {commentary.length > 0 && (
          <div style={{ ...card, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: PRIMARY, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
              Board Commentary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {commentary.map((line, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: FG2, lineHeight: 1.6 }}>
                  <span style={{ color: PRIMARY, flexShrink: 0, fontWeight: 600, lineHeight: 1.6 }}>·</span>
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
          gap: 12,
          marginBottom: 28,
        }}>
          {[
            { label: "Favourable Variances", rows: favMvts, c: FAV, bg: FAV_BG, icon: "trending-up" },
            { label: "Adverse Variances",    rows: advMvts, c: ADV, bg: ADV_BG, icon: "trending-down" },
          ].map(({ label, rows, c, bg, icon }) => (
            <div key={label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Icon name={icon} size={13} color={c} />
                <div style={{ fontSize: 10.5, fontWeight: 600, color: c, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {label}
                </div>
              </div>
              {rows.length === 0 ? (
                <div style={{ fontSize: 13, color: FG3 }}>None in this period</div>
              ) : rows.map((m, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: FG2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.account}
                    </div>
                    <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>{m.category}</div>
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
        <div style={{ textAlign: "center", borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
          <div style={{ fontSize: 12, color: FG3, lineHeight: 1.5 }}>
            {firmName
              ? <span>Prepared by <span style={{ fontWeight: 600, color: NAVY }}>{firmName}</span></span>
              : "Prepared by your accountant"}
            <span style={{ margin: "0 6px", color: BORDER }}>·</span>
            Powered by <span style={{ fontWeight: 600, color: NAVY }}>MonthEndIQ</span>
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
