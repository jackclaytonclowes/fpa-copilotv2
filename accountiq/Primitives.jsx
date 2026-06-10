/* FP&A Copilot — shared primitives: Icon, Button, Card, Chip, Delta, Logo */

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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C0E1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      <div className="wm">Account<span>IQ</span></div>
    </div>
  );
}

Object.assign(window, { Icon, Button, Card, Chip, Delta, Logo });
