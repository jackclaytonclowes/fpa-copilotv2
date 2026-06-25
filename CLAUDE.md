# MonthEndIQ — Developer Guide for Claude Code

## Project Overview

MonthEndIQ is a financial variance analysis tool for accountants. Users upload a P&L spreadsheet (CSV or Excel), and the app produces movement analysis, KPI cards, commentary, waterfall charts, and an AI Q&A copilot powered by OpenAI.

## Architecture

### Backend

- **`api.py`** — FastAPI application, single file. All routes, session management, and export logic live here.
- **`analysis.py`** — Pure analysis engine (no FastAPI). All financial computation: parsing, classification, period data, BvA, YTD, PDF/XLSX generation.
- **SQLite** (`portfolio.db` by default, configurable via `PORTFOLIO_DB` env var) stores session snapshots for the Portfolio multi-client view. In-memory `SESSIONS` dict is the hot cache; it auto-rehydrates from SQLite on cache miss.
- **`SESSION_TTL_DAYS`** env var (default 30) controls when old sessions are pruned.

### Frontend

- **React 18 via Babel standalone** — no build step. JSX files are served as static assets and compiled in-browser.
- Entry point: `static/index.html`. Load order matters: Primitives → Charts → Views → App.
- Components use `Object.assign(window, { ComponentName })` to make themselves available across `<script>` tags (no ES module imports).
- **`apiUrl(path)`** in every JSX file provides environment-aware API base URL (`window.__MONTHENDIQ_API_BASE__ || ''`).

### Key files

| File | Purpose |
|---|---|
| `api.py` | All API routes and session management |
| `analysis.py` | Financial analysis engine |
| `static/App.jsx` | Root component, routing, session bootstrap |
| `static/Dashboard.jsx` | Main dashboard: KPI cards, movements, waterfall |
| `static/QnaCopilot.jsx` | AI Q&A chat panel |
| `static/UploadScreen.jsx` | File upload and session creation |
| `static/Portfolio.jsx` | Multi-client portfolio view |
| `static/Scenarios.jsx` | What-if scenario modelling |
| `static/Reports.jsx` | PDF/XLSX export triggers |
| `static/Movements.jsx` | Detailed movement table |
| `static/Sidebar.jsx` | Navigation sidebar |
| `static/Charts.jsx` | Reusable chart components (waterfall, sparklines) |
| `static/Primitives.jsx` | Shared UI components (KpiCard, Badge, etc.) |
| `static/Settings.jsx` | User preferences (theme, firm name, tone) |
| `static/DataSources.jsx` | Xero OAuth integration UI |
| `static/SharedView.jsx` | Public share-link view |
| `static/ExportModal.jsx` | Email export modal |
| `static/CommandPalette.jsx` | Cmd-K command palette |
| `static/ErrorBoundary.jsx` | Top-level React error boundary |
| `tests/test_analysis.py` | Pytest test suite for analysis.py |

## Development Workflow

### Running locally

```bash
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

The frontend is served at `http://localhost:8000/` — open that in a browser.

### Cache busting

Every time you change a JSX or CSS file, bump the `?v=` query string in `static/index.html` on **all 18 script/link tags simultaneously**. The pattern is `YYYYMMDD` + a letter suffix (`a`, `b`, `c`, …). The current value is in the `<link>` and `<script>` tags at the top of `index.html`.

Example sed command (update the letter each time):
```bash
sed -i 's/v=20260625n/v=20260625o/g' static/index.html
```

### Running tests

```bash
pytest tests/test_analysis.py -v
```

One pre-existing failure (`TestMakePdf`) requires `reportlab`, which is not installed in the CI environment — this is expected. All other tests should pass.

## Analysis Modes

| Mode | Key function | Session key |
|---|---|---|
| Month-on-month | `get_period_data()` | `analysis_m` (monthly), `analysis_q` (quarterly) |
| Budget vs Actual | `get_bva_data()` | `bva_data` |
| YTD | `get_ytd_data()` | accessed via `analysis_m` |

The `analysis_type` key in a session dict is either `"month_on_month"` or `"budget_vs_actual"`. Always check this before accessing mode-specific session keys.

## CSS / Design Tokens

Use CSS custom properties defined in `static/colors_and_type.css`. Key tokens:

| Token | Meaning |
|---|---|
| `--favourable` / `--favourable-soft` | Green / light green for positive variance |
| `--adverse` / `--adverse-soft` | Red / light red for negative variance |
| `--primary` / `--primary-soft` | Brand accent colour |
| `--surface` / `--surface-2` | Card and page backgrounds |
| `--border` | Dividers and input borders |
| `--ink` | Primary text |
| `--fg-2` / `--fg-3` | Secondary / tertiary text |

## Environment Variables

See `.env.example` for a full list. Required for production:

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY` | Powers the AI Q&A copilot |
| `ANTHROPIC_API_KEY` | Powers the AI strategy analysis |
| `SECRET_KEY` | Signs share tokens (any random string) |
| `ALLOWED_ORIGINS` | CORS whitelist (comma-separated URLs) |
| `PORTFOLIO_DB` | SQLite path (default `portfolio.db`) |

## Key Constraints

- **No paid APIs** should be introduced unless already present in `requirements.txt` / `.env.example`.
- **No hardcoded secrets** anywhere in source code.
- **File size limit**: 20 MB per upload (`_MAX_UPLOAD_BYTES` constant in `api.py`).
- **Question length limit**: 4000 chars (`Field(max_length=4000)` in `AskBody`).
- **Email recipients**: max 10 per send.
- **Sigma clamp** in anomalies endpoint: `max(0.5, min(sigma, 5.0))`.

## Deployment

- **Backend**: Render (FastAPI via uvicorn)
- **Frontend**: Vercel (static files, rewrite rules in `vercel.json`)
- `static/api-base.js` is generated at Vercel build time to set `window.__MONTHENDIQ_API_BASE__` to the Render backend URL. Locally it defaults to `''` (relative paths).
