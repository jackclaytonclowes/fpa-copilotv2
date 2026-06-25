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

  if (result === null && !loading) return null;

  if (note) return (
    <div style={{
      marginBottom: 20, padding: "12px 18px", borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)", background: "var(--surface-2)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <Icon name="zap" size={15} color="var(--fg-3)" />
      <span style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)" }}>
        Statistical anomalies — {note}
      </span>
    </div>
  );

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

      {/* Empty state — no anomalies at this sensitivity */}
      {!loading && anomalies.length === 0 && (
        <div style={{ padding: "14px 18px", font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)" }}>
          No unusual movements detected at this sensitivity level.
        </div>
      )}

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
              <div
                title={`${a.z_score.toFixed(1)} standard deviations from the historical average\n\nσ (sigma) measures how unusual this value is compared to the account's typical range.`}
                style={{
                  flexShrink: 0, textAlign: "center", minWidth: 44,
                  padding: "4px 8px", borderRadius: "var(--radius-sm)",
                  background: "var(--surface-3)", cursor: "help",
                }}
              >
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
      .then((r) => {
        if (!r.ok) {
          const code = r.status;
          if (code === 401 || code === 403) throw new Error("Authentication failed — check your API key.");
          if (code === 404) throw new Error("Session expired — please re-upload your file.");
          if (code === 429) throw new Error("Rate limited — wait a moment and try again.");
          if (code >= 500) throw new Error("Server error — try again shortly.");
          throw new Error(`Request failed (HTTP ${code}).`);
        }
        return r.json();
      })
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

/* ── SmartInsights — auto-computed data highlights (no API call) ───────────── */
function SmartInsights({ movements, kpis, isBvA }) {
  const { Icon } = window;
  const all  = movements || [];
  const favM = all.filter(m => m.is_fav  && m.variance !== 0);
  const advM = all.filter(m => !m.is_fav && m.variance !== 0);
  const revM = all.filter(m => m.category === "Revenue");

  const fmt = (v) => {
    if (v == null || isNaN(v)) return "—";
    const abs = Math.abs(v), s = v < 0 ? "-£" : "£";
    return abs >= 1e6 ? `${s}${(abs/1e6).toFixed(1)}m` : abs >= 1e3 ? `${s}${Math.round(abs/1e3)}k` : `${s}${Math.round(abs)}`;
  };
  const fmtS = (v) => {
    if (v == null || isNaN(v)) return "—";
    const abs = Math.abs(v), s = v > 0 ? "+£" : v < 0 ? "-£" : "£";
    return abs >= 1e6 ? `${s}${(abs/1e6).toFixed(1)}m` : abs >= 1e3 ? `${s}${Math.round(abs/1e3)}k` : `${s}${Math.round(abs)}`;
  };

  const items = [];

  const profKpi = (kpis || []).find(k => k.icon === "wallet");
  if (profKpi?.variance != null) {
    items.push({
      icon: profKpi.is_fav ? "trending-up" : "trending-down", tone: profKpi.is_fav ? "fav" : "adv",
      label: "Operating profit",
      text: `${fmtS(profKpi.variance)} vs ${isBvA ? "budget" : "prior"}`,
    });
  }

  if (favM.length + advM.length > 0) {
    const more = favM.length >= advM.length;
    items.push({
      icon: more ? "check-circle" : "alert-circle", tone: more ? "fav" : "adv",
      label: "Movement split",
      text: `${favM.length} favourable · ${advM.length} adverse`,
    });
  }

  if (all.length > 0) {
    const top = all.reduce((a, b) => Math.abs(a.variance||0) > Math.abs(b.variance||0) ? a : b);
    if (Math.abs(top.variance||0) > 0) {
      const nm = top.account.length > 26 ? top.account.slice(0, 24) + "…" : top.account;
      items.push({
        icon: "zap", tone: top.is_fav ? "fav" : "adv",
        label: "Biggest movement",
        text: `${nm}: ${fmtS(top.variance)}`,
      });
    }
  }

  const catAdv = {};
  advM.filter(m => m.category !== "Revenue").forEach(m => {
    catAdv[m.category] = (catAdv[m.category] || 0) + Math.abs(m.variance || 0);
  });
  const [topCat, topAmt] = Object.entries(catAdv).sort((a, b) => b[1] - a[1])[0] || [];
  if (topCat) {
    items.push({
      icon: "alert-triangle", tone: "adv",
      label: "Most pressure",
      text: `${topCat}: ${fmt(topAmt)} adverse`,
    });
  }

  if (!isBvA && revM.length >= 3) {
    const total = revM.reduce((s, m) => s + Math.abs(m.value || 0), 0);
    if (total > 0) {
      const top3pct = Math.round(
        [...revM].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 3)
          .reduce((s, m) => s + Math.abs(m.value || 0), 0) / total * 100
      );
      items.push({
        icon: "pie-chart", tone: "info",
        label: "Revenue concentration",
        text: `Top 3 accounts: ${top3pct}% of total`,
      });
    }
  }

  if (items.length === 0) return null;

  const toneCol = (t) => t === "fav" ? "var(--favourable-text)" : t === "adv" ? "var(--adverse-text)" : "var(--primary)";
  const toneBg  = (t) => t === "fav" ? "var(--favourable-soft)" : t === "adv" ? "var(--adverse-soft)" : "var(--primary-soft)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 12, marginBottom: 20 }}>
      {items.map((item, i) => (
        <div key={i} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "var(--radius-sm)", flexShrink: 0,
            background: toneBg(item.tone), display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={item.icon} size={15} color={toneCol(item.tone)} />
          </div>
          <div>
            <div style={{ font: "var(--text-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--fg-3)", marginBottom: 3 }}>
              {item.label}
            </div>
            <div style={{ font: "var(--text-body-strong)", fontSize: 13, color: "var(--fg-1)", lineHeight: 1.3 }}>
              {item.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── SpotlightModal ─────────────────────────────────────────────────────── */
function SpotlightModal({ spotlight, onClose }) {
  const { Icon, Delta } = window;
  const { period, loading, data, error } = spotlight;

  React.useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const fmt = (v) => {
    if (v == null || isNaN(v)) return "—";
    const a = Math.abs(v), s = v < 0 ? "-" : "";
    if (a >= 1e6) return `${s}£${(a / 1e6).toFixed(2)}m`;
    if (a >= 1e3) return `${s}£${(a / 1e3).toFixed(0)}k`;
    return `${s}£${Math.round(a).toLocaleString("en-GB")}`;
  };
  const fmtS = (v) => {
    if (v == null || isNaN(v)) return "—";
    return (v > 0 ? "+" : v < 0 ? "-" : "") + "£" + Math.abs(Math.round(v)).toLocaleString("en-GB");
  };
  const fmtPct = (v) => (v == null || isNaN(v)) ? "—"
    : (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v).toFixed(1) + "%";

  const movements = data?.movements || [];
  const kpis      = (data?.kpis || []).filter(k => !k.pct_only);
  const favRows   = movements.filter(m =>  m.is_fav && m.variance !== 0)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);
  const advRows   = movements.filter(m => !m.is_fav && m.variance !== 0)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 5);

  const movCol = (rows, tone) => {
    const fav = tone === "fav";
    return (
      <div>
        <div style={{
          font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 8,
          color: fav ? "var(--favourable-text)" : "var(--adverse-text)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icon name={fav ? "trending-up" : "trending-down"} size={12}
            color={fav ? "var(--favourable)" : "var(--adverse)"} />
          {fav ? "Top favourable" : "Top adverse"}
        </div>
        {rows.length === 0 && (
          <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)", padding: "4px 0" }}>None</div>
        )}
        {rows.map((m, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 10px", marginBottom: 4, borderRadius: "var(--radius-sm)",
            background: fav ? "var(--favourable-soft)" : "var(--adverse-soft)",
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "var(--text-body-strong)", fontSize: 12.5, color: "var(--ink)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.account}
              </div>
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                {m.category}
              </div>
            </div>
            <span style={{ font: "600 12px var(--font-mono)", fontVariantNumeric: "tabular-nums",
              color: fav ? "var(--favourable-text)" : "var(--adverse-text)",
              flexShrink: 0, marginLeft: 8 }}>
              {fmtS(m.variance)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ width: 680, maxWidth: "calc(100vw - 48px)" }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h3>{period}</h3>
            <div className="sub">Period spotlight · movements vs prior period</div>
          </div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="modal-b" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {loading && (
            <div className="loading" style={{ height: 160 }}>
              <div className="spinner" />Loading {period}…
            </div>
          )}
          {error && (
            <div style={{ color: "var(--adverse-text)", font: "var(--text-body)", fontSize: 13 }}>
              {error}
            </div>
          )}
          {data && !loading && (
            <>
              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {kpis.map(k => (
                  <div key={k.label} className={`card kpi${k.icon === "wallet" ? " kpi-hero" : ""}`}
                    style={{ padding: "14px 16px" }}>
                    <div className="kpi-top">
                      <span className="lbl">{k.label}</span>
                      <div className="kpi-ic"><Icon name={k.icon} size={16} /></div>
                    </div>
                    <div className="val" style={{ fontSize: 20, margin: "8px 0 6px" }}>{fmt(k.value)}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ font: "var(--text-caption)", fontSize: 11,
                        color: k.icon === "wallet" ? "var(--fg-on-dark-2)" : "var(--fg-3)" }}>
                        Prior: {fmt(k.prior)}
                      </span>
                      <Delta fav={k.is_fav} up={k.variance >= 0}>
                        {fmtS(k.variance)} · {fmtPct(k.pct)}
                      </Delta>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top movements */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {movCol(favRows, "fav")}
                {movCol(advRows, "adv")}
              </div>
            </>
          )}
        </div>

        <div className="modal-f">
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Cash & Runway ───────────────────────────────────────────────────────────
   The headline SMB metric. Burn is estimated from the operating-result trend;
   true runway needs an actual cash balance, which the user enters (persisted)
   or — when connected — is prefilled from Xero's balance sheet. We label the
   basis honestly rather than presenting a P&L approximation as real cash. */
function CashRunway({ trend, periodMode, sessionId, isBvA, xeroCash }) {
  const { Icon, Card } = window;
  const KEY = `monthendiq_cash_${sessionId || "x"}`;

  const [cash, setCash]       = React.useState(() => {
    try { const v = localStorage.getItem(KEY); return v != null && v !== "" ? Number(v) : null; } catch { return null; }
  });
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft]     = React.useState("");

  // Prefill from Xero balance sheet if we have it and the user hasn't set one
  React.useEffect(() => {
    if (xeroCash != null && cash == null) {
      setCash(xeroCash);
      try { localStorage.setItem(KEY, String(xeroCash)); } catch {}
    }
  }, [xeroCash]);

  const results = (trend || [])
    .map(t => isBvA ? (t.actual_profit != null ? t.actual_profit : t.profit) : t.profit)
    .filter(v => typeof v === "number" && !isNaN(v));

  if (results.length < 2 || periodMode === "ytd") return null;

  const avgPeriod   = results.reduce((a, b) => a + b, 0) / results.length;
  const perMonth    = periodMode === "quarterly" ? avgPeriod / 3 : avgPeriod;
  const burning     = perMonth < 0;
  const monthlyBurn = Math.abs(perMonth);
  const nPeriods    = results.length;

  const fmtMoney = (v) => {
    if (v == null || isNaN(v)) return "—";
    const a = Math.abs(v), s = v < 0 ? "-£" : "£";
    return a >= 1e6 ? `${s}${(a / 1e6).toFixed(2)}m` : `${s}${Math.round(a).toLocaleString("en-GB")}`;
  };

  const saveCash = () => {
    const n = Number(String(draft).replace(/[^0-9.\-]/g, ""));
    if (!isNaN(n) && draft.trim() !== "") { setCash(n); try { localStorage.setItem(KEY, String(n)); } catch {} }
    else if (draft.trim() === "") { setCash(null); try { localStorage.removeItem(KEY); } catch {} }
    setEditing(false);
  };

  const runwayMonths = (burning && cash != null && cash > 0) ? cash / monthlyBurn : null;
  const runoutDate = runwayMonths != null ? (() => {
    const d = new Date(); d.setMonth(d.getMonth() + Math.floor(runwayMonths));
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  })() : null;

  const runwayTone = runwayMonths == null ? "neutral"
    : runwayMonths < 6 ? "adv" : runwayMonths < 12 ? "caution" : "fav";
  const toneColor = { adv: "var(--adverse-text)", caution: "var(--caution-text, #b45309)", fav: "var(--favourable-text)", neutral: "var(--fg-2)" }[runwayTone];

  const startEdit = () => { setDraft(cash != null ? String(cash) : ""); setEditing(true); };

  const tile = { padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" };
  const tileLbl = { font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6 };

  return (
    <Card title="Cash & Runway"
      sub={`Operating ${burning ? "burn" : "surplus"} from the last ${nPeriods} ${periodMode === "quarterly" ? "quarters" : "months"}`}
      action={<span className="ai-badge" style={{ background: burning ? "var(--adverse-soft)" : "var(--favourable-soft)", color: burning ? "var(--adverse-text)" : "var(--favourable-text)" }}>
        <Icon name={burning ? "trending-down" : "trending-up"} size={12} />{burning ? "Burning" : "Generative"}</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {/* Cash on hand — editable */}
        <div style={tile}>
          <div style={tileLbl}>Cash on hand</div>
          {editing ? (
            <div style={{ display: "flex", gap: 4 }}>
              <input autoFocus type="text" value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveCash(); if (e.key === "Escape") setEditing(false); }}
                placeholder="e.g. 250000"
                style={{ width: "100%", padding: "5px 8px", font: "var(--text-data)", fontSize: 15, color: "var(--ink)", background: "var(--surface)", border: "1px solid var(--primary)", borderRadius: "var(--radius-xs)", outline: "none" }} />
              <button onClick={saveCash} style={{ flexShrink: 0, padding: "0 8px", borderRadius: "var(--radius-xs)", border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer" }}>
                <Icon name="check" size={14} />
              </button>
            </div>
          ) : (
            <div onClick={startEdit} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} title="Click to edit your current cash balance">
              <span style={{ font: "var(--text-metric)", fontSize: 22, fontVariantNumeric: "tabular-nums", color: cash != null ? "var(--ink)" : "var(--fg-3)" }}>
                {cash != null ? fmtMoney(cash) : "Add →"}
              </span>
              <Icon name="pencil" size={12} color="var(--fg-3)" />
            </div>
          )}
          {cash != null && xeroCash != null && Math.round(cash) === Math.round(xeroCash) && (
            <div style={{ font: "var(--text-caption)", fontSize: 10, color: "var(--favourable-text)", marginTop: 3 }}>From Xero balance sheet</div>
          )}
        </div>

        {/* Avg monthly result */}
        <div style={tile}>
          <div style={tileLbl}>Avg monthly {burning ? "burn" : "surplus"}</div>
          <div style={{ font: "var(--text-metric)", fontSize: 22, fontVariantNumeric: "tabular-nums", color: burning ? "var(--adverse-text)" : "var(--favourable-text)" }}>
            {burning ? "-" : "+"}{fmtMoney(monthlyBurn)}
          </div>
        </div>

        {/* Runway */}
        <div style={tile}>
          <div style={tileLbl}>Cash runway</div>
          {!burning ? (
            <div style={{ font: "var(--text-body-strong)", fontSize: 15, color: "var(--favourable-text)", paddingTop: 4 }}>
              Cash generative
            </div>
          ) : runwayMonths == null ? (
            <div onClick={startEdit} style={{ cursor: "pointer", font: "var(--text-body-strong)", fontSize: 14, color: "var(--primary)", paddingTop: 4 }}>
              Add cash to see runway →
            </div>
          ) : (
            <div>
              <div style={{ font: "var(--text-metric)", fontSize: 22, fontVariantNumeric: "tabular-nums", color: toneColor }}>
                {runwayMonths < 1 ? "<1" : Math.floor(runwayMonths)} mo
              </div>
              <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 1 }}>
                depleted ~{runoutDate}
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 10, lineHeight: 1.5 }}>
        <Icon name="info" size={11} /> {burning ? "Burn" : "Surplus"} estimated from the operating result over the last {nPeriods} {periodMode === "quarterly" ? "quarters" : "months"} — excludes capex, financing and working-capital movements. Enter your actual cash balance for an accurate runway.
      </div>
    </Card>
  );
}

function Dashboard({ sessionId, initialData, periodMode, controlledPeriod, onDataChange, onModeChange, analysisType }) {
  const { Icon, Card, Button, Delta, Chip, TrendChart, Donut, WaterfallChart } = window;
  const [data, setData]             = useStateDash(initialData);
  const [loading, setLoading]       = useStateDash(false);
  const [activeTab, setActiveTab]   = useStateDash("movements");
  const [spotlight, setSpotlight]   = useStateDash(null);
  const [commentaryCopied, setCommentaryCopied] = useStateDash(false);

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

  /* ── trend spotlight ── */
  const openSpotlight = async (trendPoint) => {
    const period = trendPoint.full;
    setSpotlight({ period, loading: true, data: null, error: null });
    try {
      const params = new URLSearchParams({ period, mode: periodMode || "monthly" });
      const res = await fetch(apiUrl(`/api/data/${sessionId}?${params}`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setSpotlight({ period, loading: false, data: d, error: null });
    } catch (e) {
      setSpotlight(prev => ({ ...prev, loading: false, error: e.message }));
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

  React.useEffect(() => {
    if (waterfall && !waterfall.reconciles) {
      console.warn("[MonthEndIQ] Waterfall does not reconcile — check account categorisation");
    }
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

      {/* ── BvA editorial headline (matches MoM style) ────────────── */}
      {isBvA && (() => {
        const profKpi = (kpis || []).find(k => k.icon === "wallet");
        if (!profKpi || profKpi.variance == null) return null;
        const bvaPeriodLabel = (() => {
          const sp = data.selected_bva_period;
          if (!sp || sp === "full_year") return "Full Year";
          try { return new Date(sp + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
          catch (_) { return sp; }
        })();
        return (
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <span className="e-label">Budget vs Actual</span>
              <span className="e-sep" />
              <span className="e-period">{bvaPeriodLabel}</span>
            </div>
            <h1 className="editorial-h1">
              Operating profit {profKpi.variance >= 0 ? "above" : "below"} budget by{" "}
              <span style={{ color: profKpi.is_fav ? "var(--favourable-text)" : "var(--adverse-text)" }}>
                {fmtSignedGBP(Math.abs(profKpi.variance))}
              </span>.
            </h1>
          </div>
        );
      })()}

      {/* Editorial headline — MoM view only */}
      {!isBvA && (() => {
        const profKpi = (kpis || []).find(k => k.icon === "wallet");
        if (!profKpi || profKpi.variance == null) return null;
        return (
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <span className="e-label">Variance report</span>
              <span className="e-sep" />
              <span className="e-period">{period?.label || selected_period}</span>
            </div>
            <h1 className="editorial-h1">
              Operating profit {profKpi.is_fav ? "up" : "down"}{" "}
              <span style={{ color: profKpi.is_fav ? "var(--favourable-text)" : "var(--adverse-text)" }}>
                {fmtSignedGBP(profKpi.variance)}
              </span>
              {" "}this period.
            </h1>
          </div>
        );
      })()}

      {/* KPI row */}
      <div className="grid-kpi">
        {(kpis || []).map((k) => {
          // Map KPI label → trend series key for sparkline
          const lc = k.label.toLowerCase();
          const trendKey = !isBvA && trend && trend.length > 2
            ? (lc.includes("revenue") || lc.includes("turnover") || lc.includes("sales") ? "revenue"
              : lc.includes("profit") || lc.includes("ebitda") || lc.includes("operating") ? "profit"
              : lc.includes("cost") || lc.includes("expense") ? "costs"
              : null)
            : null;
          return (
            <div key={k.label} className={`card kpi${k.icon === "wallet" ? " kpi-hero" : ""}`}>
              <div className="kpi-top">
                <div className="lbl">{k.label}</div>
                <span className="kpi-ic"><Icon name={k.icon} size={16} /></span>
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
              {trendKey && window.Sparkline && (
                <div style={{ marginTop: 10, marginBottom: -2 }}>
                  <Sparkline data={trend} valueKey={trendKey} height={26} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Smart highlights */}
      <SmartInsights movements={movements} kpis={kpis} isBvA={isBvA} />

      {/* Trend + AI commentary */}
      <div className="grid-2">
        {isBvA && trend && trend.length > 1 && (
          <Card
            title="Actual vs Budget trend"
            sub={`${trend.length} periods · Actual (solid) vs Budget (dashed)`}
            action={<Chip tone="info" icon="line-chart">Trend</Chip>}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6 }}>
                Revenue — Actual vs Budget
              </div>
              <TrendChart data={trend} series={[
                { key: "actual_revenue", label: "Actual", color: "var(--c-1)" },
                { key: "budget_revenue", label: "Budget", color: "var(--c-1)", dashed: true },
              ]} />
            </div>
            <div>
              <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6 }}>
                Profit — Actual vs Budget
              </div>
              <TrendChart data={trend} series={[
                { key: "actual_profit", label: "Actual", color: "var(--c-5)" },
                { key: "budget_profit", label: "Budget", color: "var(--c-5)", dashed: true },
              ]} />
            </div>
          </Card>
        )}
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
              ]} onPointClick={openSpotlight} />
            ) : (
              <div className="loading">Not enough periods for a trend chart</div>
            )}
          </Card>
        )}
        <Card
          title="AI commentary"
          className="card-ai"
          sub={isBvA ? "Budget vs Actual · figures from your ledger" : `${period?.label || selected_period} · figures from your ledger`}
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {(commentary || []).length > 0 && (
                <button
                  onClick={() => {
                    const text = (commentary || []).map(c => {
                      const div = document.createElement("div");
                      div.innerHTML = c.html;
                      return "• " + (div.innerText || div.textContent || "").trim();
                    }).join("\n");
                    navigator.clipboard.writeText(text).catch(() => {});
                    setCommentaryCopied(true);
                    setTimeout(() => setCommentaryCopied(false), 2000);
                  }}
                  title="Copy all commentary bullets"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "none", border: "1px solid var(--border-strong)",
                    borderRadius: "var(--radius-xs)", padding: "3px 8px", cursor: "pointer",
                    font: "var(--text-label)", fontSize: 11, color: "var(--fg-2)",
                  }}
                >
                  <Icon name={commentaryCopied ? "check" : "copy"} size={11} />
                  {commentaryCopied ? "Copied" : "Copy"}
                </button>
              )}
              <span className="ai-badge"><Icon name="sparkles" size={13} />AI</span>
            </div>
          }>
          <ul className="ai-list">
            {(commentary || []).map((c, i) => {
              const src = c.source;
              const tip = src ? [
                src.account,
                `${src.actual_label || "Actual"}: ${fmtGBP(src.actual)}`,
                src.comparison != null ? `${src.comparison_label || "Prior"}: ${fmtGBP(src.comparison)}` : null,
                src.variance != null ? `Variance: ${fmtSignedGBP(src.variance)}${src.pct != null ? ` (${fmtPct(src.pct)})` : ""}` : null,
                "— traced to your imported P&L",
              ].filter(Boolean).join("\n") : null;
              return (
                <li key={i}>
                  <span className="ic">
                    <Icon name={c.icon} size={16} color={c.fav ? "var(--favourable)" : "var(--adverse)"} />
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: c.html }} />
                  {src && (
                    <span
                      title={tip}
                      style={{
                        marginLeft: 6, cursor: "help", flexShrink: 0,
                        display: "inline-flex", alignItems: "center", gap: 3,
                        font: "var(--text-label)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".04em",
                        color: "var(--favourable-text)", background: "var(--favourable-soft)",
                        border: "1px solid var(--favourable-border)", borderRadius: 20, padding: "1px 6px 1px 4px",
                        verticalAlign: "middle",
                      }}
                    >
                      <Icon name="shield-check" size={10} />
                      Source
                    </span>
                  )}
                </li>
              );
            })}
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
              {revSplit.map((it, i) => (
                <div className="lg" key={`${it.name}-${i}`}>
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
              {expSplit.map((it, i) => (
                <div className="lg" key={`${it.name}-${i}`}>
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

      {/* ── Statistical anomaly detection (secondary — requires history) ── */}
      {!isBvA && periodMode !== "ytd" && (
        <AnomalyPanel
          sessionId={sessionId}
          selectedPeriod={selected_period}
          periodMode={periodMode}
        />
      )}

      {/* ── Cash & Runway (supplementary — requires cash balance input) ── */}
      <CashRunway
        trend={trend}
        periodMode={periodMode}
        sessionId={sessionId}
        isBvA={isBvA}
        xeroCash={data.xero_cash}
      />

      {/* ── Period spotlight modal ── */}
      {spotlight && (
        <SpotlightModal spotlight={spotlight} onClose={() => setSpotlight(null)} />
      )}
    </div>
  );
}
Object.assign(window, { Dashboard });
