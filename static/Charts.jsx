/* FP&A Copilot — SVG charts: TrendChart + Donut */
const { useState: useStateChart, useEffect: useEffectChart } = React;

function TrendChart({ data, series, forecastFrom }) {
  const W = 640, H = 230, padL = 8, padR = 12, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const all = data.flatMap((d) => series.map((s) => d[s.key] || 0));
  const max = Math.max(...all, 1) * 1.08;
  const min = Math.min(...all, 0) * 0.9;
  const x = (i) => padL + (innerW * i) / Math.max(data.length - 1, 1);
  const y = (v) => padT + innerH - (innerH * (v - min)) / (max - min || 1);

  const hasForecast = forecastFrom != null && forecastFrom < data.length;

  const [grow, setGrow] = useStateChart(0);
  useEffectChart(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setGrow(1); return; }
    let raf, t0;
    const tick = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / 520);
      setGrow(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [JSON.stringify(data)]);

  const gridY = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {Array.from({ length: gridY + 1 }).map((_, i) => {
        const gy = padT + (innerH * i) / gridY;
        return <line key={i} x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="var(--border)" strokeWidth="1" />;
      })}
      {/* Forecast boundary */}
      {hasForecast && (
        <g>
          <line
            x1={x(forecastFrom)} x2={x(forecastFrom)} y1={padT} y2={padT + innerH}
            stroke="var(--fg-3)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
          />
          <text x={x(forecastFrom) + 5} y={padT + 10}
            style={{ font: "500 10px var(--font-sans)", fill: "var(--fg-3)" }}>Forecast →</text>
        </g>
      )}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle"
          style={{ font: "500 11px var(--font-mono)", fill: "var(--fg-3)", opacity: hasForecast && i >= forecastFrom ? 0.6 : 1 }}>{d.m}</text>
      ))}
      {series.map((s) => {
        const pts = data.map((d, i) => [x(i), y(d[s.key] || 0)]);
        const shown = Math.max(1, Math.round((data.length - 1) * grow));
        // Actual segment (solid)
        const actualPts  = pts.slice(0, hasForecast ? forecastFrom + 1 : pts.length);
        const forecastPts = hasForecast ? pts.slice(forecastFrom) : [];
        const mkPath = (arr) => arr.slice(0, shown + 1).map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
        return (
          <g key={s.key}>
            <path d={mkPath(actualPts)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {forecastPts.length > 1 && (
              <path d={mkPath(forecastPts)} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            )}
            {grow > 0.98 && pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={hasForecast && i >= forecastFrom ? 3 : 4}
                fill={hasForecast && i >= forecastFrom ? "none" : s.color}
                stroke={s.color}
                strokeWidth={hasForecast && i >= forecastFrom ? 2 : 2}
                opacity={hasForecast && i >= forecastFrom ? 0.7 : 1} />
            ))}
          </g>
        );
      })}
      <g style={{ font: "500 11px var(--font-sans)", fill: "var(--fg-3)" }}>
        {series.map((s, si) => (
          <g key={s.key} transform={`translate(${padL + si * 110}, ${padT - 2})`}>
            <line x1="0" x2="16" y1="0" y2="0" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
            <text x="20" y="4" style={{ fill: "var(--fg-2)" }}>{s.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function Donut({ data, total, label }) {
  const R = 70, r = 42, cx = 90, cy = 90;
  let angle = -Math.PI / 2;
  const sum = data.reduce((a, b) => a + (b.value || 0), 0);
  const slices = data.map((d) => {
    const theta = sum > 0 ? (d.value / sum) * 2 * Math.PI : 0;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    angle += theta;
    const x2 = cx + R * Math.cos(angle), y2 = cy + R * Math.sin(angle);
    const xi = cx + r * Math.cos(angle - theta / 2), yi = cy + r * Math.sin(angle - theta / 2);
    const large = theta > Math.PI ? 1 : 0;
    return { ...d, x1, y1, x2, y2, xi, yi, large, theta };
  });
  return (
    <svg viewBox="0 0 180 180" width="180" height="180" style={{ flex: "none" }}>
      {slices.map((s, i) => s.theta > 0.01 && (
        <path key={i}
          d={`M${cx},${cy} L${s.x1.toFixed(1)},${s.y1.toFixed(1)} A${R},${R} 0 ${s.large} 1 ${s.x2.toFixed(1)},${s.y2.toFixed(1)} Z`}
          fill={s.c} opacity="0.88" />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="var(--surface)" />
      <text x={cx} y={cy - 6} textAnchor="middle"
        style={{ font: "600 15px var(--font-mono)", fill: "var(--ink)" }}>{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle"
        style={{ font: "400 11px var(--font-sans)", fill: "var(--fg-3)" }}>{label}</text>
    </svg>
  );
}

/* ── WaterfallChart ─────────────────────────────────────────────────────
   Shows how Operating Profit moved from prior to current period.

   Props:
     prior        number   – prior period profit
     current      number   – current period profit
     bars         [{label, impact, fav}]  – category impacts (pre-sorted)
     priorLabel   string   – short x-axis label for the prior bar   (e.g. "Jul")
     currentLabel string   – short x-axis label for the current bar (e.g. "Aug")
──────────────────────────────────────────────────────────────────────── */
function WaterfallChart({ prior, current, bars, priorLabel, currentLabel }) {
  const W = 720, H = 280;
  const padL = 76, padR = 18, padT = 32, padB = 52;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  // ── Build the full segment list ───────────────────────────────────────
  // segment: { label, base, impact, type:"total"|"fav"|"adv" }
  const segs = [];
  segs.push({ label: priorLabel || "Prior", base: 0, impact: prior,   type: "total" });
  let running = prior;
  for (const b of (bars || [])) {
    segs.push({ label: b.label, base: running, impact: b.impact, type: b.fav ? "fav" : "adv" });
    running += b.impact;
  }
  segs.push({ label: currentLabel || "Current", base: 0, impact: current, type: "total" });

  const n = segs.length;
  const slotW = cW / n;
  const barW  = Math.min(slotW * 0.58, 54);

  // ── Y domain ─────────────────────────────────────────────────────────
  const allVals = segs.flatMap(s =>
    s.type === "total" ? [0, s.impact] : [s.base, s.base + s.impact, 0]
  );
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span   = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.1, 500);
  const yPad   = span * 0.14;
  const yMin   = rawMin - yPad;
  const yMax   = rawMax + yPad;

  const toY = v => padT + (1 - (v - yMin) / (yMax - yMin)) * cH;

  // ── Axis ticks ───────────────────────────────────────────────────────
  const TICKS = 5;
  const ticks = Array.from({ length: TICKS }, (_, i) =>
    yMin + (i / (TICKS - 1)) * (yMax - yMin)
  );

  // ── Formatters ───────────────────────────────────────────────────────
  const fmtAxis = v => {
    const a = Math.abs(v), sign = v < 0 ? "-" : "";
    if (a >= 1e6)  return `${sign}£${(a / 1e6).toFixed(1)}m`;
    if (a >= 1000) return `${sign}£${(a / 1000).toFixed(0)}k`;
    return `${sign}£${Math.round(a)}`;
  };
  const fmtImpact = v => {
    const a = Math.abs(v), sign = v > 0 ? "+" : v < 0 ? "-" : "";
    if (a >= 1e6)  return `${sign}£${(a / 1e6).toFixed(1)}m`;
    if (a >= 1000) return `${sign}£${(a / 1000).toFixed(0)}k`;
    return `${sign}£${Math.round(a)}`;
  };

  // ── Label word-wrap (max 2 lines, 11 chars/line) ─────────────────────
  const wrapLabel = text => {
    const MAX = 11;
    if (text.length <= MAX) return [text];
    const words = text.split(" ");
    let line1 = "", i = 0;
    while (i < words.length && (line1 + (line1 ? " " : "") + words[i]).length <= MAX) {
      line1 += (line1 ? " " : "") + words[i++];
    }
    const line2 = words.slice(i).join(" ").slice(0, MAX);
    return line2 ? [line1, line2] : [line1];
  };

  // ── Colour tokens ────────────────────────────────────────────────────
  const FILL = { total: "var(--navy-600)", fav: "var(--favourable)", adv: "var(--adverse)" };
  const FILL_SOFT = { total: "rgba(0,0,0,0)", fav: "var(--favourable-soft)", adv: "var(--adverse-soft)" };

  const zeroY = toY(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>

      {/* Zero line */}
      {zeroY >= padT && zeroY <= padT + cH && (
        <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY}
          stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4 3" />
      )}

      {/* Y-axis line + ticks */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + cH} stroke="var(--border)" strokeWidth={1} />
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={padL - 4} y1={toY(v)} x2={padL} y2={toY(v)} stroke="var(--border)" strokeWidth={1} />
          <text x={padL - 8} y={toY(v) + 4} textAnchor="end"
            style={{ font: "10px var(--font-mono)", fill: "var(--fg-3)" }}>
            {fmtAxis(v)}
          </text>
          <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)}
            stroke="var(--border)" strokeWidth={0.5} />
        </g>
      ))}

      {/* Bars */}
      {segs.map((seg, i) => {
        const cx   = padL + i * slotW + slotW / 2;
        const barX = cx - barW / 2;

        // Bar top/bottom in SVG pixels
        let barTop, barBot;
        if (seg.type === "total") {
          barTop = toY(Math.max(0, seg.impact));
          barBot = toY(Math.min(0, seg.impact));
        } else {
          const hi = seg.base + seg.impact;
          barTop = toY(Math.max(seg.base, hi));
          barBot = toY(Math.min(seg.base, hi));
        }
        const barHpx = Math.max(2, barBot - barTop);

        // Connector: dashed horizontal line at the "landing level" to the next bar
        const nextSeg  = segs[i + 1];
        const connY    = seg.type === "total" ? toY(seg.impact) : toY(seg.base + seg.impact);
        const nextBarX = nextSeg ? padL + (i + 1) * slotW + slotW / 2 - barW / 2 : null;

        // Value label — place above bar if positive, below if negative
        const isNeg    = seg.impact < 0 && seg.type !== "total";
        const labelY   = isNeg ? barBot + 13 : barTop - 5;
        const labelTxt = seg.type === "total" ? fmtAxis(seg.impact) : fmtImpact(seg.impact);

        // X-axis label (wrapped)
        const lines = wrapLabel(seg.label);

        return (
          <g key={i}>
            {/* Connector to next bar */}
            {nextSeg && seg.type !== "total" && (
              <line
                x1={barX + barW} y1={connY} x2={nextBarX} y2={connY}
                stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 2"
              />
            )}

            {/* Bar */}
            <rect
              x={barX} y={barTop} width={barW} height={barHpx}
              fill={FILL[seg.type]} rx={2} opacity={0.86}
            />

            {/* Value label */}
            <text x={cx} y={labelY} textAnchor="middle"
              style={{ font: `600 9.5px var(--font-mono)`, fill: "var(--ink)" }}>
              {labelTxt}
            </text>

            {/* X-axis label */}
            {lines.map((ln, li) => (
              <text key={li} x={cx} y={H - padB + 14 + li * 12} textAnchor="middle"
                style={{ font: "10px var(--font-sans)", fill: "var(--fg-3)" }}>
                {ln}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { TrendChart, Donut, WaterfallChart });
