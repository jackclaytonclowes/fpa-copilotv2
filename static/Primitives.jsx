/* FP&A Copilot — shared primitives: Icon, Button, Card, Chip, Delta, Logo */

// Prepend the API base URL set by scripts/inject-config.js at Vercel build time.
// Empty string in local dev so all fetch calls hit the FastAPI server via relative paths.
window.apiUrl = (path) => (window.__MONTHENDIQ_API_BASE__ || '') + path;

function Icon({ name, size = 18, stroke = 1.75, color, style, className }) {
  const lib = (window.lucide && window.lucide.icons) || {};
  const key = String(name).split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  const node = lib[key];
  let inner = "";
  if (node) {
    const children = Array.isArray(node) ? node : (node.iconNode || []);
    inner = children.map(([tag, attrs]) =>
      "<" + tag + " " + Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ") + "></" + tag + ">"
    ).join("");
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${color || "currentColor"}" stroke-width="${stroke}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return <span className={className} style={{ display: "inline-flex", lineHeight: 0, ...style }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Button({ variant = "primary", size, icon, iconRight, children, onClick, style, disabled }) {
  return (
    <button className={`btn ${variant}${size ? " " + size : ""}`} onClick={onClick} style={style} disabled={disabled}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
}

function Card({ title, sub, action, children, style, className }) {
  return (
    <div className={`card${className ? " " + className : ""}`} style={style}>
      {(title || action) && (
        <div className="card-h">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="card-b">{children}</div>
    </div>
  );
}

function Chip({ tone = "info", icon, children }) {
  return (
    <span className={`chip ${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

function Delta({ fav, children, up }) {
  const cls = fav === null || fav === undefined ? "neu" : fav ? "fav" : "adv";
  const arrow = up ? "↑" : up === false ? "↓" : "→";
  return <span className={`delta ${cls}`}>{arrow} {children}</span>;
}

function Logo() {
  return (
    <div className="sb-brand">
      <div className="mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
          <path d="M20 7l-2-2-2 2" /><circle cx="20" cy="5" r="1" fill="#fff" stroke="none"/>
        </svg>
      </div>
      <div className="wm">MonthEnd<span>IQ</span></div>
    </div>
  );
}

function catChip(cat) {
  if (!cat) return null;
  const lc = cat.toLowerCase();
  if (lc.includes("revenue") || lc.includes("turnover") || lc.includes("sales") || lc.includes("income"))
    return { bg: "var(--favourable-soft)", color: "var(--favourable-text)" };
  if (lc.includes("staff") || lc.includes("payroll") || lc.includes("wage") || lc.includes("salary") || lc.includes("hr"))
    return { bg: "rgba(99,102,241,.12)", color: "#4f46e5" };
  if (lc.includes("direct") || lc.includes("cogs") || lc.includes("material") || lc.includes("production"))
    return { bg: "rgba(245,158,11,.12)", color: "#b45309" };
  if (lc.includes("market") || lc.includes("advertis"))
    return { bg: "rgba(168,85,247,.12)", color: "#7c3aed" };
  if (lc.includes("admin") || lc.includes("overhead") || lc.includes("general"))
    return { bg: "var(--surface-2)", color: "var(--fg-2)" };
  if (lc.includes("finance") || lc.includes("interest") || lc.includes("bank"))
    return { bg: "rgba(20,184,166,.12)", color: "#0f766e" };
  const hue = ((cat.charCodeAt(0) || 0) * 47) % 360;
  return { bg: `hsla(${hue},55%,92%,1)`, color: `hsl(${hue},50%,30%)` };
}

// Reads currency symbol from localStorage; falls back to £.
// Components call fmtCurrency() so changing the symbol in Settings refreshes on next render.
function fmtCurrency(v, { signed = false, compact = false } = {}) {
  if (v == null || isNaN(v)) return "—";
  let sym = "£";
  try { sym = localStorage.getItem("meiq_currency_sym") || "£"; } catch {}
  const abs = Math.abs(v);
  const pfx = (signed ? (v > 0 ? "+" : v < 0 ? "-" : "") : (v < 0 ? "-" : "")) + sym;
  if (compact) {
    if (abs >= 1e6) return `${pfx}${(abs / 1e6).toFixed(1)}m`;
    if (abs >= 1e3) return `${pfx}${Math.round(abs / 1e3)}k`;
    return `${pfx}${Math.round(abs)}`;
  }
  return `${pfx}${Math.round(abs).toLocaleString()}`;
}

// ── RAG threshold system ──────────────────────────────────────────────────────

const _RAG_DEFAULTS = {
  revenue_var_pct: { green: 5,  amber: 0,  hib: true,  enabled: false },
  profit_var_pct:  { green: 5,  amber: 0,  hib: true,  enabled: false },
  op_margin:       { green: 15, amber: 10, hib: true,  enabled: false },
  payroll_pct:     { green: 55, amber: 65, hib: false, enabled: false },
};

function loadRagThresholds() {
  try {
    const raw = localStorage.getItem("meiq_rag_thresholds");
    return raw ? { ..._RAG_DEFAULTS, ...JSON.parse(raw) } : { ..._RAG_DEFAULTS };
  } catch { return { ..._RAG_DEFAULTS }; }
}

function ragStatus(value, threshold) {
  if (!threshold?.enabled || value == null || isNaN(value)) return null;
  if (threshold.hib) {
    return value >= threshold.green ? "green" : value >= threshold.amber ? "amber" : "red";
  }
  return value <= threshold.green ? "green" : value <= threshold.amber ? "amber" : "red";
}

function RagBadge({ status }) {
  if (!status) return null;
  const MAP = {
    green: { bg: "var(--favourable-soft)", color: "var(--favourable)", label: "On track"  },
    amber: { bg: "var(--caution-soft)",    color: "var(--caution)",    label: "Monitor"   },
    red:   { bg: "var(--adverse-soft)",    color: "var(--adverse)",    label: "Off track" },
  };
  const { bg, color, label } = MAP[status] || {};
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: "var(--radius-pill)",
      background: bg, color,
      font: "var(--text-label)", fontSize: 10.5, flexShrink: 0,
    }}>
      <span style={{ fontSize: 7, lineHeight: 1 }}>●</span>{label}
    </span>
  );
}

Object.assign(window, { Icon, Button, Card, Chip, Delta, Logo, catChip, fmtCurrency,
  loadRagThresholds, ragStatus, RagBadge });
