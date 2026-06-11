/* FP&A Copilot — left navigation sidebar */
function Sidebar({ active, onNav, hasData }) {
  const { Icon, Logo } = window;
  const nav = [
    { id: "dashboard", icon: "layout-dashboard", label: "Dashboard" },
    { id: "copilot",   icon: "sparkles",          label: "Q&A Copilot" },
    { id: "movements", icon: "list-tree",          label: "Movements" },
    { id: "reports",   icon: "file-bar-chart",     label: "Reports" },
  ];
  const learn = [
    { id: "courses",   icon: "graduation-cap", label: "Courses" },
    { id: "skillslab", icon: "flask-conical",  label: "Skills Lab" },
    { id: "tutor",     icon: "message-circle", label: "Study Tutor" },
    { id: "profile",   icon: "user",           label: "My Progress" },
  ];
  const tools = [
    { id: "data",     icon: "database", label: "Data sources" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];
  // IDs that are always accessible regardless of whether data is loaded
  const alwaysOn = ["data", "settings", "courses", "skillslab", "tutor", "profile"];
  const Item = ({ it }) => (
    <div
      className={`sb-item${active === it.id ? " on" : ""}${!hasData && !alwaysOn.includes(it.id) ? " disabled" : ""}`}
      onClick={() => (hasData || alwaysOn.includes(it.id)) && onNav(it.id)}
      style={!hasData && !alwaysOn.includes(it.id) ? { opacity: 0.4, cursor: "default" } : {}}
    >
      <span className="ic"><Icon name={it.icon} size={18} /></span>{it.label}
    </div>
  );
  return (
    <aside className="sidebar">
      <Logo />
      <div className="sb-sec">Analyse</div>
      {nav.map((it) => <Item key={it.id} it={it} />)}
      <div className="sb-sec">Learn</div>
      {learn.map((it) => <Item key={it.id} it={it} />)}
      <div className="sb-sec">Workspace</div>
      {tools.map((it) => <Item key={it.id} it={it} />)}
      <div className="sb-foot">
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
