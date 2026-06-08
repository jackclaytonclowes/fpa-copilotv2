/* FP&A Copilot — export management pack modal */
const { useState: useStateExport } = React;

function ExportModal({ onClose, sessionId, period, analysisType }) {
  const { Icon, Button } = window;
  const [fmt, setFmt] = useStateExport("pdf");
  const [loading, setLoading] = useStateExport(false);

  const opts = [
    { id: "pdf", icon: "file-text",    t: "PDF management pack",   s: "Board-ready: summary, commentary, tables" },
    { id: "zip", icon: "file-archive", t: "CSV pack (.zip)",        s: "Category summary, variance detail, movements" },
  ];

  const download = async () => {
    setLoading(true);
    try {
      const periodParam = analysisType === "budget_vs_actual"
        ? (period?.label === "Actual" ? "full_year" : (period?.label || "full_year"))
        : (period?.label || "");
      const params = new URLSearchParams({ period: periodParam, fmt });
      const res = await fetch(apiUrl(`/api/export/${sessionId}?${params}`));
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j.detail || detail; } catch (_) {}
        console.error("[MonthEndIQ Export]", detail);
        throw new Error(detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `management_pack_${(period?.label || "export").replace(/ /g, "_")}.${fmt === "pdf" ? "pdf" : "zip"}`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      console.error("[MonthEndIQ Export] Failed:", e);
      alert("Export failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal reveal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Export management pack</h3>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-b">
          <div className="section-title">
            {analysisType === "budget_vs_actual"
              ? "Actual vs Budget"
              : `${period?.label || "Selected period"} · vs prior period`}
          </div>
          {opts.map((o) => (
            <div key={o.id} className={`opt${fmt === o.id ? " on" : ""}`} onClick={() => setFmt(o.id)}>
              <div className="oic"><Icon name={o.icon} size={18} /></div>
              <div>
                <div className="ot">{o.t}</div>
                <div className="os">{o.s}</div>
              </div>
              <div className="rad" />
            </div>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 6, font: "var(--text-body)", fontSize: 13.5, color: "var(--ink)" }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={12} color="#fff" />
            </span>
            Include AI-written commentary
          </label>
        </div>
        <div className="modal-f">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={loading ? "loader" : "download"} onClick={download} disabled={loading}>
            {loading ? "Generating…" : `Download ${fmt === "pdf" ? "PDF" : "ZIP"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ExportModal });
