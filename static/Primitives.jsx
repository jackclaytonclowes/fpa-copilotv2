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

Object.assign(window, { Icon, Button, Card, Chip, Delta, Logo });
