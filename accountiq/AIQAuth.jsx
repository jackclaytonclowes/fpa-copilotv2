/* AccountIQ — Login / Sign-up screen */
const { useState: useAuthState } = React;

function AIQAuth({ onAuth }) {
  const { Icon } = window;
  const [mode, setMode]       = useAuthState("login"); // "login" | "signup"
  const [email, setEmail]     = useAuthState("");
  const [password, setPass]   = useAuthState("");
  const [error, setError]     = useAuthState(null);
  const [loading, setLoading] = useAuthState(false);
  const [sent, setSent]       = useAuthState(false); // after signup confirmation

  const sb = window.supabaseClient;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await sb.auth.signUp({ email, password });
        if (err) throw err;
        setSent(true);
      } else {
        const { data, error: err } = await sb.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth(data.session);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <h2 style={styles.title}>Check your email</h2>
          <p style={styles.sub}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <button style={styles.link} onClick={() => { setSent(false); setMode("login"); }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "var(--primary)", display: "flex", alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon name="graduation-cap" size={20} color="#fff" />
          </div>
          <span style={{ font: "var(--text-heading)", fontSize: 18, color: "var(--ink)" }}>
            AccountIQ
          </span>
        </div>

        <h2 style={styles.title}>
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </h2>
        <p style={styles.sub}>
          {mode === "login"
            ? "Your study progress is saved across devices."
            : "Free forever. No credit card required."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPass(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.error}>
              <Icon name="alert-circle" size={14} />
              {error}
            </div>
          )}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--fg-2)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            style={styles.link}
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "36px 32px",
  },
  title: {
    font: "var(--text-heading)",
    fontSize: 20,
    color: "var(--ink)",
    margin: "0 0 6px",
  },
  sub: {
    fontSize: 13,
    color: "var(--fg-2)",
    margin: "0 0 24px",
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    height: 40,
    padding: "0 12px",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)",
    background: "var(--bg)",
    color: "var(--ink)",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  btn: {
    height: 42,
    borderRadius: "var(--radius-sm)",
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 4,
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "var(--danger, #dc2626)",
    background: "var(--danger-soft, #fef2f2)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
  },
  link: {
    background: "none",
    border: "none",
    color: "var(--primary)",
    cursor: "pointer",
    fontSize: "inherit",
    fontFamily: "inherit",
    padding: 0,
    fontWeight: 500,
  },
};

Object.assign(window, { AIQAuth });
