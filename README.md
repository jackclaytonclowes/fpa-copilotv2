# MonthEndIQ

FP&A variance analysis tool — upload a P&L, get instant variance dashboard, AI commentary, and a management pack export.

## Architecture

```
Browser (React/JSX via Babel CDN)
        │
        ▼
  Vercel (static)          Render (FastAPI)
  ─────────────────        ─────────────────────
  static/index.html   ──►  api.py  +  analysis.py
  static/*.jsx             /api/upload
  static/*.css             /api/data/{session}
                           /api/ask/{session}
                           /api/export/{session}
                           /api/demo  /api/demo-bva  /api/demo-xero
```

---

## Local development (monolith)

Both frontend and backend run from a single FastAPI process — no Vercel or Render needed.

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Copy .env.example and fill in your OpenAI key
cp .env.example .env
# Edit .env — set OPENAI_API_KEY (NEXT_PUBLIC_API_URL and ALLOWED_ORIGINS are not needed locally)

# 4. Start the server
uvicorn api:app --reload --port 8000

# 5. Open http://localhost:8000
```

FastAPI serves the static files from `static/` at `/static/` and renders `index.html` at `/`. All fetch calls use relative paths (no API base URL needed locally).

---

## Split deployment: Vercel (frontend) + Render (backend)

### Step 1 — Deploy the backend to Render

1. Create a new **Web Service** on [render.com](https://render.com).
2. Connect this repository.
3. Set the following:
   - **Runtime:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn api:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables** in Render:

   | Key | Value |
   |-----|-------|
   | `OPENAI_API_KEY` | `sk-...` |
   | `OPENAI_MODEL` | `gpt-4o-mini` *(optional)* |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(add after Vercel deploy)* |

5. Deploy. Note the service URL, e.g. `https://monthendiq-api.onrender.com`.

### Step 2 — Deploy the frontend to Vercel

1. Import this repository into [vercel.com](https://vercel.com).
2. Vercel auto-detects `vercel.json` — no framework settings to change.
3. Add **Environment Variables** in Vercel (Project → Settings → Environment Variables):

   | Key | Value | Environments |
   |-----|-------|--------------|
   | `NEXT_PUBLIC_API_URL` | `https://monthendiq-api.onrender.com` | Production, Preview |

4. Deploy. Vercel runs `node scripts/inject-config.js` at build time, which writes `static/api-base.js` containing `window.__MONTHENDIQ_API_BASE__` set to your Render URL. Every `fetch` in the app uses this base.

### Step 3 — Wire CORS

Go back to Render → your service → Environment Variables and set:

```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Redeploy the Render service. The backend will now accept requests from your Vercel domain.

---

## Environment variables reference

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `OPENAI_API_KEY` | Render | Yes | Enables the Q&A Copilot |
| `OPENAI_MODEL` | Render | No | Model override (default: `gpt-4o-mini`) |
| `ALLOWED_ORIGINS` | Render | Split deploy only | Comma-separated Vercel URLs |
| `NEXT_PUBLIC_API_URL` | Vercel | Split deploy only | Your Render service URL |

See `.env.example` for a template.

---

## Project structure

```
api.py              FastAPI app — entry point (Render)
analysis.py         P&L analysis engine
requirements.txt    Python dependencies
scripts/
  inject-config.js  Build script — writes static/api-base.js from NEXT_PUBLIC_API_URL
package.json        Minimal — exposes the build script to Vercel
vercel.json         Vercel config — build command, output directory, SPA rewrite
.env.example        Environment variable template
static/
  index.html        Entry point HTML
  api-base.js       Generated at build time — do not commit (in .gitignore)
  Primitives.jsx    Shared UI components + apiUrl() helper
  App.jsx           App shell and routing
  Dashboard.jsx     Variance dashboard
  Movements.jsx     Account movements table
  QnaCopilot.jsx    AI Q&A interface
  Reports.jsx       Reports view
  DataSources.jsx   Data sources / replace dataset view
  ExportModal.jsx   PDF/ZIP export modal
  Charts.jsx        Chart components
  Sidebar.jsx       Navigation sidebar
  *.css             Styles
tests/
  test_analysis.py  Backend unit tests (pytest)
```

---

## Running tests

```bash
python -m pytest tests/test_analysis.py -v
```
