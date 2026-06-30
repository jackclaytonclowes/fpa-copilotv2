/* MonthEndIQ — Neighbourhood Portal: public read-only view for external stakeholders */

function NeighbourhoodPortal({ shareToken }) {
  const { Icon, KpiCard } = window;
  const [data, setData]   = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!shareToken) { setError("No access token provided."); return; }
    fetch(apiUrl("/api/portal/neighbourhood/" + encodeURIComponent(shareToken)))
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? "This link is invalid or has been revoked." : `Error ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message));
  }, [shareToken]);

  const fmt = (v, prefix = "£") => (v == null ? "—" : prefix + Math.round(v).toLocaleString());
  const pct = (v) => (v == null ? "—" : v.toFixed(1) + "%");
  const band = (v, low, high) => {
    if (v == null) return "var(--fg-3)";
    if (v >= high) return "var(--favourable-text, #15803d)";
    if (v >= low) return "var(--caution-text, #b45309)";
    return "var(--adverse-text, #b91c1c)";
  };

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  minHeight:"100vh", background:"var(--surface)", padding:32 }}>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <Icon name="shield-off" size={40} style={{ color:"var(--fg-3)", marginBottom:16 }} />
        <h2 style={{ font:"600 20px/1.3 var(--font-display)", color:"var(--ink)", margin:"0 0 8px" }}>
          Link unavailable
        </h2>
        <p style={{ color:"var(--fg-2)", fontSize:14, margin:0 }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ color:"var(--fg-3)", fontSize:14 }}>Loading…</div>
    </div>
  );

  const agg = data.aggregate || {};
  const pcns = data.pcns || [];

  return (
    <div style={{ minHeight:"100vh", background:"var(--surface)", padding:"32px 24px 64px" }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"var(--primary-soft,#eff6ff)",
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="map-pin" size={18} style={{ color:"var(--primary,#2563eb)" }} />
            </div>
            <span style={{ font:"600 11px/1 var(--font-display)", textTransform:"uppercase",
                           letterSpacing:".1em", color:"var(--primary,#2563eb)" }}>
              Neighbourhood Health Portal
            </span>
          </div>
          <h1 style={{ margin:"0 0 6px", font:"700 28px/1.2 var(--font-display)", color:"var(--ink)" }}>
            {data.name}
          </h1>
          <p style={{ margin:0, color:"var(--fg-2)", fontSize:13.5 }}>
            {agg.pcn_count} PCN{agg.pcn_count !== 1 ? "s" : ""} &middot;{" "}
            {agg.total_list_size ? agg.total_list_size.toLocaleString() + " total registered patients" : ""}
          </p>
        </div>

        {/* Borough aggregate KPI cards */}
        <div style={{ marginBottom:28 }}>
          <h2 style={{ margin:"0 0 14px", font:"600 13px/1 var(--font-display)",
                       textTransform:"uppercase", letterSpacing:".07em", color:"var(--fg-3)" }}>
            Borough Summary
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12 }}>
            {[
              { label:"Total revenue",       value:fmt(agg.total_revenue), icon:"trending-up" },
              { label:"Total surplus",       value:fmt(agg.total_surplus), icon:"wallet" },
              { label:"Income / patient",    value:fmt(agg.income_per_patient), icon:"users" },
              { label:"Surplus / patient",   value:fmt(agg.surplus_per_patient), icon:"heart-pulse" },
              { label:"Avg ARRS utilisation",value:pct(agg.avg_arrs_utilisation_pct), icon:"activity",
                color:band(agg.avg_arrs_utilisation_pct, 50, 80) },
              { label:"Avg QOF achievement", value:pct(agg.avg_qof_achievement_pct), icon:"award",
                color:band(agg.avg_qof_achievement_pct, 80, 95) },
            ].map(c => (
              <div key={c.label} style={{
                background:"var(--surface-2,#f8fafc)", border:"1px solid var(--border,#e2e8f0)",
                borderRadius:12, padding:"16px 18px",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                  <Icon name={c.icon} size={14} style={{ color: c.color || "var(--fg-3)" }} />
                  <span style={{ font:"500 11px/1 var(--font-display)", textTransform:"uppercase",
                                 letterSpacing:".06em", color:"var(--fg-3)" }}>
                    {c.label}
                  </span>
                </div>
                <div style={{ font:"700 22px/1.1 var(--font-display)", color: c.color || "var(--ink)" }}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-PCN benchmarking table */}
        <div>
          <h2 style={{ margin:"0 0 14px", font:"600 13px/1 var(--font-display)",
                       textTransform:"uppercase", letterSpacing:".07em", color:"var(--fg-3)" }}>
            PCN Breakdown
          </h2>
          <div style={{ border:"1px solid var(--border,#e2e8f0)", borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--surface-2,#f8fafc)", borderBottom:"1px solid var(--border,#e2e8f0)" }}>
                  {["PCN", "Period", "Patients", "WTE Partners", "Income/pt", "Surplus/pt", "ARRS %", "QOF %"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", font:"600 11px/1 var(--font-display)",
                                         textTransform:"uppercase", letterSpacing:".06em", color:"var(--fg-3)",
                                         whiteSpace:"nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pcns.map((p, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid var(--border,#e2e8f0)" }}>
                    <td style={{ padding:"12px 14px", font:"600 13px/1.2 var(--font-display)", color:"var(--ink)" }}>
                      {p.name}
                    </td>
                    <td style={{ padding:"12px 14px", color:"var(--fg-2)" }}>{p.period_label || "—"}</td>
                    <td style={{ padding:"12px 14px", color:"var(--ink)" }}>
                      {p.list_size ? p.list_size.toLocaleString() : "—"}
                    </td>
                    <td style={{ padding:"12px 14px", color:"var(--ink)" }}>
                      {p.wte_partners != null ? p.wte_partners.toFixed(1) : "—"}
                    </td>
                    <td style={{ padding:"12px 14px", color:"var(--ink)" }}>{fmt(p.income_per_patient)}</td>
                    <td style={{ padding:"12px 14px", color:"var(--ink)" }}>{fmt(p.surplus_per_patient)}</td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ color: band(p.arrs_utilisation_pct, 50, 80), fontWeight:600 }}>
                        {pct(p.arrs_utilisation_pct)}
                      </span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ color: band(p.qof_achievement_pct, 80, 95), fontWeight:600 }}>
                        {pct(p.qof_achievement_pct)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Borough totals row */}
                <tr style={{ background:"var(--surface-2,#f8fafc)", borderTop:"2px solid var(--border,#e2e8f0)" }}>
                  <td colSpan={2} style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)", color:"var(--ink)" }}>
                    Borough total / average
                  </td>
                  <td style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)", color:"var(--ink)" }}>
                    {agg.total_list_size ? agg.total_list_size.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)", color:"var(--ink)" }}>
                    {agg.total_wte_partners != null ? agg.total_wte_partners.toFixed(1) : "—"}
                  </td>
                  <td style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)", color:"var(--ink)" }}>
                    {fmt(agg.income_per_patient)}
                  </td>
                  <td style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)", color:"var(--ink)" }}>
                    {fmt(agg.surplus_per_patient)}
                  </td>
                  <td style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)" }}>
                    <span style={{ color: band(agg.avg_arrs_utilisation_pct, 50, 80) }}>
                      {pct(agg.avg_arrs_utilisation_pct)}
                    </span>
                  </td>
                  <td style={{ padding:"12px 14px", font:"700 13px/1 var(--font-display)" }}>
                    <span style={{ color: band(agg.avg_qof_achievement_pct, 80, 95) }}>
                      {pct(agg.avg_qof_achievement_pct)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmark legend */}
        <div style={{ marginTop:20, padding:"12px 16px", background:"var(--surface-2,#f8fafc)",
                      border:"1px solid var(--border,#e2e8f0)", borderRadius:10,
                      display:"flex", flexWrap:"wrap", gap:"8px 24px" }}>
          <span style={{ font:"600 11px/1.4 var(--font-display)", textTransform:"uppercase",
                         letterSpacing:".06em", color:"var(--fg-3)", alignSelf:"center" }}>
            NHS benchmarks
          </span>
          {[
            { color:"var(--favourable-text,#15803d)", label:"ARRS ≥80% · QOF ≥95%" },
            { color:"var(--caution-text,#b45309)",    label:"ARRS 50–80% · QOF 80–95%" },
            { color:"var(--adverse-text,#b91c1c)",    label:"ARRS <50% · QOF <80%" },
          ].map(b => (
            <span key={b.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"var(--fg-2)" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:b.color, flexShrink:0 }} />
              {b.label}
            </span>
          ))}
        </div>

        <p style={{ marginTop:28, fontSize:12, color:"var(--fg-3)", textAlign:"center" }}>
          Powered by MonthEndIQ &mdash; individual PCN accounts are never merged
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { NeighbourhoodPortal });
