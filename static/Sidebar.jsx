/* FP&A Copilot — left navigation sidebar */

/* Dark mode — persists in localStorage, applies data-theme on <html> */
function initTheme() {
  const saved = localStorage.getItem("monthendiq_theme") || "light";
  document.documentElement.dataset.theme = saved;
}
initTheme();

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("monthendiq_theme", next); } catch {}
}

function Sidebar({ active, onNav, hasData }) {
  const { Icon, Logo } = window;
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.dataset.theme === "dark"
  );

  const handleThemeToggle = () => {
    toggleTheme();
    setIsDark(document.documentElement.dataset.theme === "dark");
  };
  const nav = [
    { id: "dashboard", icon: "layout-dashboard", label: "Dashboard" },
    { id: "copilot",   icon: "sparkles",          label: "Q&A Copilot" },
    { id: "movements", icon: "list-tree",          label: "Movements" },
    { id: "reports",   icon: "file-bar-chart",     label: "Reports" },
  ];
  const tools = [
    { id: "data",     icon: "database", label: "Data sources" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];
  const Item = ({ it }) => (
    <div
      className={`sb-item${active === it.id ? " on" : ""}${!hasData && !["data","settings"].includes(it.id) ? " disabled" : ""}`}
      onClick={() => (hasData || ["data","settings"].includes(it.id)) && onNav(it.id)}
      style={!hasData && !["data","settings"].includes(it.id) ? { opacity: 0.4, cursor: "default" } : {}}
    >
      <span className="ic"><Icon name={it.icon} size={18} /></span>{it.label}
    </div>
  );
  return (
    <aside className="sidebar">
      <Logo />
      <div className="sb-sec">Analyse</div>
      {nav.map((it) => <Item key={it.id} it={it} />)}
      <div className="sb-sec">Workspace</div>
      {tools.map((it) => <Item key={it.id} it={it} />)}
      <div className="sb-foot">
        {/* Dark mode toggle */}
        <button
          onClick={handleThemeToggle}
          style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%",
            padding: "8px 10px", marginBottom: 10, borderRadius: "var(--radius-sm)",
            background: "transparent", border: "1px solid var(--navy-600)",
            color: "var(--fg-on-dark-2)", font: "var(--text-body)", fontSize: 13,
            cursor: "pointer",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--navy-700)"; e.currentTarget.style.color = "#fff"; }}
          onMouseOut={e  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-on-dark-2)"; }}
        >
          <Icon name={isDark ? "sun" : "moon"} size={15} />
          {isDark ? "Light mode" : "Dark mode"}
        </button>

        <div className="sb-user">
          <div className="av">FP</div>
          <div>
            <div className="nm">Finance Team</div>
            <div className="rl">MonthEndIQ</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
Object.assign(window, { Sidebar });
