/* FP&A Copilot — export management pack modal */
const { useState: useStateExport, useEffect: useEffectExport } = React;

function ExportModal({ onClose, sessionId, period, analysisType, firmName }) {
  const { Icon, Button } = window;
  const [tab,          setTab]          = useStateExport("download"); // "download" | "email"
  const [fmt,          setFmt]          = useStateExport("pdf");
  const [loading,      setLoading]      = useStateExport(false);
  const [recipients,   setRecipients]   = useStateExport("");
  const [subject,      setSubject]      = useStateExport(
    () => `Management Pack — ${period?.label || "Report"}`
  );
  const [emailStatus,  setEmailStatus]  = useStateExport(null); // null | "sending" | "sent" | { error }
  const [downloadError, setDownloadError] = useStateExport(null);

  // Commentary editing state
  const [showEdit,     setShowEdit]     = useStateExport(false);
  const [commentary,   setCommentary]   = useStateExport(null); // null = not yet loaded
  const [origComm,     setOrigComm]     = useStateExport(null);
  const [editLoading,  setEditLoading]  = useStateExport(false);

  const isDirty = commentary && origComm &&
    JSON.stringify(commentary) !== JSON.stringify(origComm);

  // Load commentary from session the first time the edit panel opens
  useEffectExport(() => {
    if (!showEdit || commentary !== null) return;
    setEditLoading(true);
    fetch(apiUrl(`/api/data/${sessionId}?period=&mode=monthly`))
      .then(r => r.json())
      .then(d => {
        const bullets = d.commentary || [];
        setCommentary(bullets);
        setOrigComm(bullets);
      })
      .catch(() => {
        setCommentary([]);
        setOrigComm([]);
      })
      .finally(() => setEditLoading(false));
  }, [showEdit]);

  const opts = [
    { id: "pdf",  icon: "file-text",    t: "PDF management pack",        s: "Board-ready: summary, commentary, tables" },
    { id: "xlsx", icon: "table-2",      t: "Excel workbook (.xlsx)",      s: "Variance, KPIs and commentary — 3 sheets, colour-coded" },
    { id: "zip",  icon: "file-archive", t: "CSV pack (.zip)",             s: "Category summary, variance detail, movements" },
  ];

  const periodParam = analysisType === "budget_vs_actual"
    ? (period?.label === "Actual" ? "full_year" : (period?.label || "full_year"))
    : (period?.label || "");

  // If commentary was edited, persist it before the export runs
  const _saveIfDirty = async () => {
    if (!isDirty) return;
    await fetch(apiUrl(`/api/sessions/${sessionId}/commentary`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentary }),
    });
    setOrigComm([...commentary]); // reset dirty flag
  };

  const download = async () => {
    setLoading(true);
    setDownloadError(null);
    try {
      await _saveIfDirty();
      const params = new URLSearchParams({ period: periodParam, fmt });
      if (firmName) params.set("firm", firmName);
      const res = await fetch(apiUrl(`/api/export/${sessionId}?${params}`));
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j.detail || detail; } catch (_) {}
        throw new Error(detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = fmt === "pdf" ? "pdf" : fmt === "xlsx" ? "xlsx" : "zip";
      a.download = `management_pack_${(period?.label || "export").replace(/ /g, "_")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    const rcpts = recipients.split(/[,\n;]+/).map(r => r.trim()).filter(Boolean);
    if (!rcpts.length) { setEmailStatus({ error: "Enter at least one recipient email address." }); return; }
    setEmailStatus("sending");
    try {
      await _saveIfDirty();
      const res = await fetch(apiUrl(`/api/email/${sessionId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: rcpts,
          subject: subject || `Management Pack — ${period?.label || "Report"}`,
          period: periodParam,
          mode: "monthly",
          fmt: "pdf",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || `HTTP ${res.status}`);
      setEmailStatus({ sent: true, count: rcpts.length });
    } catch (e) {
      setEmailStatus({ error: e.message });
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", boxSizing: "border-box",
    font: "var(--text-body)", fontSize: 13.5, color: "var(--ink)",
    background: "var(--surface-2)", border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)", outline: "none",
  };

  const bulletInputStyle = {
    flex: 1, padding: "6px 10px", boxSizing: "border-box",
    font: "var(--text-body)", fontSize: 13, color: "var(--ink)",
    background: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", outline: "none",
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal reveal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Export management pack</h3>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-b">
          {/* Tab toggle: Download / Email */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-strong)" }}>
            {[
              { id: "download", icon: "download",   label: "Download" },
              { id: "email",    icon: "mail",        label: "Email pack" },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: "8px 12px", border: "none",
                  background: tab === t.id ? "var(--primary)" : "var(--surface-2)",
                  color: tab === t.id ? "#fff" : "var(--fg-2)",
                  font: "var(--text-body-strong)", fontSize: 13, cursor: "pointer",
                  borderRight: t.id === "download" ? "1px solid var(--border-strong)" : "none",
                }}>
                <Icon name={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Period label */}
          <div className="section-title">
            {analysisType === "budget_vs_actual"
              ? "Actual vs Budget"
              : `${period?.label || "Selected period"} · vs prior period`}
          </div>

          {/* ── Download mode ── */}
          {tab === "download" && (
            <React.Fragment>
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

              {/* Commentary editing — PDF only */}
              {fmt === "pdf" && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <button
                    onClick={() => setShowEdit(e => !e)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", background: "none", border: "none", cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 7,
                      font: "var(--text-body-strong)", fontSize: 13, color: "var(--ink)" }}>
                      <Icon name="pencil" size={13} color="var(--fg-2)" />
                      Edit commentary
                      {isDirty && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--primary)",
                          background: "var(--primary-soft)", borderRadius: 10, padding: "1px 7px" }}>
                          edited
                        </span>
                      )}
                    </span>
                    <Icon name={showEdit ? "chevron-up" : "chevron-down"} size={14} color="var(--fg-3)" />
                  </button>

                  {showEdit && (
                    <div style={{ marginTop: 10 }}>
                      {editLoading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0",
                          font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)" }}>
                          <div className="spinner" style={{ width: 13, height: 13 }} />
                          Loading commentary…
                        </div>
                      ) : (
                        <React.Fragment>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {(commentary || []).map((bullet, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ color: "var(--primary)", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>·</span>
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={e => {
                                    const next = [...commentary];
                                    next[i] = e.target.value;
                                    setCommentary(next);
                                  }}
                                  style={bulletInputStyle}
                                />
                                <button
                                  onClick={() => setCommentary(prev => prev.filter((_, j) => j !== i))}
                                  title="Remove bullet"
                                  style={{ background: "none", border: "none", cursor: "pointer",
                                    color: "var(--fg-3)", padding: 4, display: "flex", alignItems: "center",
                                    flexShrink: 0 }}
                                >
                                  <Icon name="x" size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => setCommentary(prev => [...(prev || []), ""])}
                            style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5,
                              background: "none", border: "1px dashed var(--border-strong)",
                              borderRadius: "var(--radius-sm)", padding: "5px 10px",
                              font: "var(--text-caption)", fontSize: 12, color: "var(--fg-2)",
                              cursor: "pointer", width: "100%" }}
                          >
                            <Icon name="plus" size={12} /> Add bullet
                          </button>
                          <div style={{ marginTop: 8, font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)" }}>
                            Edits are applied to the downloaded PDF only — they don't change the analysis.
                          </div>
                        </React.Fragment>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Include commentary toggle — shown when NOT editing */}
              {!(fmt === "pdf" && showEdit) && (
                <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10,
                  font: "var(--text-body)", fontSize: 13.5, color: "var(--ink)" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--primary)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={12} color="#fff" />
                  </span>
                  Include AI-written commentary
                </label>
              )}

              {/* Download error */}
              {downloadError && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: "var(--radius-sm)",
                  background: "var(--adverse-soft)", border: "1px solid var(--adverse-border)",
                  font: "var(--text-body)", fontSize: 12.5, color: "var(--adverse-text)",
                  display: "flex", alignItems: "flex-start", gap: 8,
                }}>
                  <Icon name="alert-triangle" size={14} color="var(--adverse)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Export failed: {downloadError}</span>
                </div>
              )}
            </React.Fragment>
          )}

          {/* ── Email mode ── */}
          {tab === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {emailStatus?.sent ? (
                <div style={{
                  padding: "18px 20px", borderRadius: "var(--radius-sm)",
                  background: "var(--favourable-soft)", border: "1px solid var(--favourable-border)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
                }}>
                  <Icon name="check-circle" size={28} color="var(--favourable)" />
                  <div style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--favourable-text)" }}>
                    Pack sent to {emailStatus.count} recipient{emailStatus.count !== 1 ? "s" : ""}
                  </div>
                  <div style={{ font: "var(--text-body)", fontSize: 12.5, color: "var(--fg-2)" }}>
                    The PDF management pack has been dispatched.
                  </div>
                  <button onClick={onClose}
                    style={{ marginTop: 4, padding: "7px 20px", borderRadius: "var(--radius-sm)", border: "none",
                      background: "var(--favourable)", color: "#fff", font: "var(--text-body-strong)",
                      fontSize: 13, cursor: "pointer" }}>
                    Done
                  </button>
                </div>
              ) : (
                <React.Fragment>
                  <div>
                    <label style={{ font: "var(--text-label)", fontSize: 11, textTransform: "uppercase",
                      letterSpacing: ".05em", color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                      Recipients
                    </label>
                    <textarea
                      placeholder="name@company.com, another@company.com"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 56 }}
                    />
                    <div style={{ font: "var(--text-caption)", fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
                      Comma or newline-separated email addresses
                    </div>
                  </div>
                  <div>
                    <label style={{ font: "var(--text-label)", fontSize: 11, textTransform: "uppercase",
                      letterSpacing: ".05em", color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                      Subject
                    </label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{
                    padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    display: "flex", gap: 9, alignItems: "flex-start",
                  }}>
                    <Icon name="info" size={14} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ font: "var(--text-caption)", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
                      Sends a PDF management pack. Requires <b>SMTP_HOST</b>, <b>SMTP_USER</b>,
                      and <b>SMTP_PASSWORD</b> environment variables on your server.
                    </div>
                  </div>
                  {emailStatus?.error && (
                    <div style={{
                      padding: "10px 14px", borderRadius: "var(--radius-sm)",
                      background: "var(--adverse-soft)", border: "1px solid var(--adverse-border)",
                      font: "var(--text-body)", fontSize: 13, color: "var(--adverse-text)",
                    }}>
                      {emailStatus.error}
                    </div>
                  )}
                </React.Fragment>
              )}
            </div>
          )}
        </div>

        <div className="modal-f">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {tab === "download" ? (
            <Button variant="primary" icon={loading ? "loader" : "download"} onClick={download} disabled={loading}>
              {loading ? "Generating…" : `Download ${fmt === "pdf" ? "PDF" : fmt === "xlsx" ? "Excel" : "ZIP"}`}
            </Button>
          ) : !emailStatus?.sent ? (
            <Button variant="primary" icon={emailStatus === "sending" ? "loader" : "send"} onClick={sendEmail} disabled={emailStatus === "sending"}>
              {emailStatus === "sending" ? "Sending…" : "Send pack"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ExportModal });
