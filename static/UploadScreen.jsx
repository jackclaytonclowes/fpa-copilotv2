/* FP&A Copilot — upload screen with real API integration */
const { useState: useStateUpload, useRef: useRefUpload } = React;

function UploadScreen({ onLoad }) {
  const { Icon, Button } = window;
  const [dragging, setDragging] = useStateUpload(false);
  const [loading, setLoading] = useStateUpload(false);
  const [error, setError] = useStateUpload(null);
  const inputRef = useRefUpload(null);

  const upload = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Please upload a CSV or Excel file (.csv, .xlsx).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed." }));
        throw new Error(err.detail || "Upload failed.");
      }
      const data = await res.json();
      onLoad(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  };

  return (
    <div className="upload-wrap reveal">
      <div className="upload-card">
        <div className="hero-mark"><Icon name="bar-chart-3" size={30} color="#fff" /></div>
        <h1>Upload a P&amp;L to begin</h1>
        <p className="sub">
          Drop a monthly profit &amp; loss export (CSV or Excel) and MonthEndIQ will
          analyse variance, surface key movements, write commentary, and build a management pack.
        </p>

        <div
          className={`dropzone${dragging ? " drag" : ""}`}
          onClick={() => !loading && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {loading ? (
            <React.Fragment>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <div className="dz-t">Analysing your P&amp;L…</div>
              <div className="dz-s">Classifying accounts and building variance analysis</div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="dz-ic"><Icon name="upload-cloud" size={34} /></div>
              <div className="dz-t">Drag &amp; drop your P&amp;L file</div>
              <div className="dz-s">CSV or XLSX · exported straight from Xero, Sage or your ledger</div>
            </React.Fragment>
          )}
        </div>

        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
          onChange={(e) => upload(e.target.files[0])} />

        {error && <div className="upload-err">{error}</div>}
      </div>
    </div>
  );
}
Object.assign(window, { UploadScreen });
