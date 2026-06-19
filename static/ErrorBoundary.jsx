/* ViewErrorBoundary — catches React render errors per-view instead of blank screen */
class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[MonthEndIQ] View render error:", error);
    if (info?.componentStack) console.error(info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { Icon } = window;
      return (
        <div className="content">
          <div style={{ padding: "40px 32px", maxWidth: 640 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--adverse)",
              background: "var(--adverse-soft)", marginBottom: 20,
            }}>
              <Icon name="alert-triangle" size={20} color="var(--adverse)" />
              <b style={{ font: "var(--text-body-strong)", fontSize: 14, color: "var(--adverse-text)" }}>
                Something went wrong loading this view
              </b>
            </div>
            <p style={{ font: "var(--text-body)", fontSize: 13, color: "var(--fg-2)", marginBottom: 12 }}>
              Open the browser console (F12) for the full stack trace.
            </p>
            <pre style={{
              padding: "12px 16px", borderRadius: "var(--radius-sm)",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              font: "11px/1.6 var(--font-mono, monospace)", color: "var(--ink)",
              whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 16,
            }}>
              {String(this.state.error)}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--surface-2)",
                font: "var(--text-body-strong)", fontSize: 13, cursor: "pointer", color: "var(--fg-2)",
              }}
            >
              <Icon name="refresh-cw" size={14} />
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

Object.assign(window, { ViewErrorBoundary });
