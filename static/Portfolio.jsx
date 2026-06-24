/* MonthEndIQ — Practice Portfolio (firm mode): multi-client month-end triage */

function Portfolio({ onOpenClient }) {
  const { Icon } = window;
  const [status, setStatus] = React.useState("loading"); // loading | done | error
  const [data, setData]     = React.useState(null);

  const load = React.useCallback(() => {
    setStatus("loading");
    fetch(apiUrl("/api/portfolio/demo"))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setData(d); setStatus("done"); })
      .catch(() => setStatus("error"));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const fmtGBP = (v) => {
    if (v == null || isNaN(v)) return "—";
    const a = Math.abs(v), s = v < 0 ? "-£" : "£";
    return a >= 1e6 ? `${s}${(a / 1e6).toFixed(2)}m` : a >= 1e3 ? `${s}${(a / 1e3).toFixed(0)}k` : `${s}${Math.round(a)}`;
  };
  const fmtPct = (v) => (v == null || isNaN(v)) ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  const TIER = {
    action:  { label: "Action needed", color: "var(--adverse-text)",    bg: "var(--adverse-soft)",    border: "var(--adverse-border)",    icon: "alert-octagon" },
    watch:   { label: "Watch",         color: "var(--caution-text, #b45309)", bg: "var(--caution-soft, #fef3c7)", border: "var(--caution-border, #fcd34d)", icon: "eye" },
    healthy: { label: "Healthy",       color: "var(--favourable-text)", bg: "var(--favourable-soft)", border: "var(--favourable-border)", icon: "check-circle" },
  };

  return (
    <div className="content">
      <div className="content-inner reveal">
        {/* Header */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ font: "600 22px/1.2 var(--font-display)", color: "var(--ink)", margin: 0 }}>Practice Portfolio</h2>
            <p style={{ font: "var(--text-body)", fontSize: 13.5, color: "var(--fg-3)", margin: "4px 0 0" }}>
              Month-end triage across your clients — sorted by who needs attention first
            </p>
          </div>
          <button onClick={load} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
            borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--fg-2)", font: "var(--text-body)", fontSize: 13, cursor: "pointer",
          }}>
            <Icon name="refresh-cw" size={14} /> Refresh
          </button>
        </div>

        {status === "loading" && (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <div style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-3)" }}>Analysing your client portfolio…</div>
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: "16px 18px", background: "var(--adverse-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--adverse-border)", color: "var(--adverse-text)", font: "var(--text-body)", fontSize: 13 }}>
            Could not load the portfolio. <button onClick={load} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {status === "done" && data && (
          <React.Fragment>
            {/* Summary stat strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
              {[
                { label: "Clients",                value: data.summary.total,          tone: "var(--ink)" },
                { label: "Need action",            value: data.summary.action,         tone: "var(--adverse-text)" },
                { label: "Watch",                  value: data.summary.watch,          tone: "var(--caution-text, #b45309)" },
                { label: "Healthy",                value: data.summary.healthy,        tone: "var(--favourable-text)" },
                { label: "Revenue managed",        value: fmtGBP(data.summary.total_revenue), tone: "var(--ink)" },
                { label: "Burning cash",           value: data.summary.burning,        tone: data.summary.burning ? "var(--adverse-text)" : "var(--fg-2)" },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ font: "var(--text-label)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ font: "var(--text-metric)", fontSize: 24, fontVariantNumeric: "tabular-nums", color: s.tone }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Triage list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.clients.map((c) => {
                const t = TIER[c.tier] || TIER.healthy;
                return (
                  <div key={c.session_id} className="card" style={{
                    padding: "16px 18px", display: "flex", alignItems: "center", gap: 16,
                    borderLeft: `3px solid ${t.color}`,
                  }}>
                    {/* Tier badge */}
                    <div style={{ flexShrink: 0, width: 116 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        font: "var(--text-label)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em",
                        color: t.color, background: t.bg, border: `1px solid ${t.border}`,
                        borderRadius: 20, padding: "3px 9px",
                      }}>
                        <Icon name={t.icon} size={11} /> {t.label}
                      </span>
                    </div>

                    {/* Name + sector + reasons */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "var(--text-body-strong)", fontSize: 14.5, color: "var(--fg-1)" }}>{c.name}</div>
                      <div style={{ font: "var(--text-caption)", fontSize: 11.5, color: "var(--fg-3)", marginBottom: 6 }}>{c.sector}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(c.reasons || []).map((r, i) => (
                          <span key={i} style={{
                            font: "var(--text-caption)", fontSize: 11, color: c.tier === "healthy" ? "var(--favourable-text)" : t.color,
                            background: c.tier === "healthy" ? "var(--favourable-soft)" : t.bg,
                            border: `1px solid ${t.border}`, borderRadius: 6, padding: "2px 8px",
                          }}>{r}</span>
                        ))}
                      </div>
                    </div>

                    {/* Figures */}
                    <div style={{ display: "flex", gap: 22, flexShrink: 0 }}>
                      {[
                        { k: "Revenue", v: fmtGBP(c.revenue), color: "var(--ink)" },
                        { k: "Op profit", v: fmtGBP(c.op_profit), color: c.op_profit != null && c.op_profit < 0 ? "var(--adverse-text)" : "var(--ink)" },
                        { k: "Margin", v: c.margin != null ? `${c.margin.toFixed(1)}%` : "—", color: "var(--fg-2)" },
                        { k: "Runway", v: c.runway_months != null ? `${Math.floor(c.runway_months)} mo` : (c.burning ? "—" : "n/a"), color: c.runway_months != null && c.runway_months < 6 ? "var(--adverse-text)" : "var(--fg-2)" },
                      ].map((f) => (
                        <div key={f.k} style={{ textAlign: "right", minWidth: 64 }}>
                          <div style={{ font: "var(--text-label)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--fg-3)", marginBottom: 2 }}>{f.k}</div>
                          <div style={{ font: "var(--text-data)", fontSize: 14, fontVariantNumeric: "tabular-nums", color: f.color }}>{f.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Open */}
                    <button onClick={() => onOpenClient && onOpenClient(c.session_id, c.name)} style={{
                      flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "none",
                      background: "var(--primary)", color: "#fff", font: "var(--text-body-strong)", fontSize: 13, cursor: "pointer",
                    }}>
                      Open <Icon name="arrow-right" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 16, lineHeight: 1.5 }}>
              <Icon name="info" size={11} /> Demo practice. In production, each client maps to an uploaded P&amp;L or a connected Xero organisation; attention scoring runs on every month-end refresh.
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Portfolio });
