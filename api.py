"""
FP&A Copilot — FastAPI backend
Run: uvicorn api:app --reload --port 8000

Environment variables:
  OPENAI_API_KEY   Required for Q&A Copilot
  OPENAI_MODEL     Optional model override (default: gpt-4o-mini)
"""
import os
import re
import sqlite3
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Load .env from project root (silently ignored if file doesn't exist)
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from analysis import (
    build_analysis, build_bva, build_bva_long_from_sheets, build_long,
    build_waterfall, detect_bva_columns, detect_kpis, get_bva_data,
    get_insights_data, get_period_data, get_ytd_data, load_bva_from_sheets,
    load_file, load_sector_synonyms, make_pdf, make_xlsx, make_zip,
    period_label, quarter_sort_key, EXPENSE_CATEGORIES,
)
from kpis.nhs_gp import (
    compute_nhs_kpis, compute_workforce_breakdown, compute_utilisation,
    is_locum_account, is_seasonal_nhs, nhs_kpi_cards,
)

app = FastAPI(title="MonthEndIQ")

# CORS — allow the Vercel frontend (and localhost for dev) to call the API.
# Set ALLOWED_ORIGINS on Render to your Vercel URL, e.g.:
#   https://monthendiq.vercel.app,https://monthendiq-*.vercel.app
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
_allowed_origins: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# PERSISTENT STORE — SQLite for sessions + portfolio clients
# On Render set PORTFOLIO_DB=/data/portfolio.db (persistent disk) so data
# survives redeploys and free-tier sleeps.
# ─────────────────────────────────────────────────────────────────────────────
_DB_PATH = Path(os.environ.get("PORTFOLIO_DB", str(Path(__file__).parent / "portfolio.db")))


def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _db() as conn:
        # Uploaded file sessions — enables share links to survive server restarts
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id            TEXT PRIMARY KEY,
                file_bytes    BLOB NOT NULL,
                file_name     TEXT NOT NULL,
                analysis_type TEXT NOT NULL DEFAULT 'month_on_month',
                xero_cash     REAL,
                created_at    TEXT NOT NULL
            )
        """)
        # Portfolio clients for accounting firm practice mode
        conn.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_clients (
                id           TEXT PRIMARY KEY,
                firm_token   TEXT NOT NULL,
                name         TEXT NOT NULL,
                sector       TEXT NOT NULL DEFAULT 'Other',
                file_bytes   BLOB NOT NULL,
                file_name    TEXT NOT NULL,
                cash_balance REAL,
                list_size    INTEGER NOT NULL DEFAULT 0,
                created_at   TEXT NOT NULL,
                updated_at   TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_firm ON portfolio_clients(firm_token)")
        # Migrations: add columns that didn't exist in earlier schema versions
        for migration in [
            "ALTER TABLE portfolio_clients ADD COLUMN list_size INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE portfolio_clients ADD COLUMN wte_partners REAL",
            "ALTER TABLE portfolio_clients ADD COLUMN arrs_allocation REAL",
            "ALTER TABLE portfolio_clients ADD COLUMN qof_entitlement REAL",
            "ALTER TABLE portfolio_clients ADD COLUMN partner_drawings REAL",
            "ALTER TABLE sessions ADD COLUMN sector TEXT NOT NULL DEFAULT 'general'",
            "ALTER TABLE sessions ADD COLUMN list_size INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE sessions ADD COLUMN wte_partners REAL",
            "ALTER TABLE sessions ADD COLUMN arrs_allocation REAL",
            "ALTER TABLE sessions ADD COLUMN qof_entitlement REAL",
            "ALTER TABLE sessions ADD COLUMN partner_drawings REAL",
        ]:
            try:
                conn.execute(migration)
            except Exception:
                pass  # Column already exists — safe to ignore

        # Neighbourhoods — groups of existing portfolio clients (PCNs) for
        # borough-level rollup reporting. Client books are never merged; this
        # table only stores which client IDs belong to which neighbourhood,
        # plus an optional public share token for the external portal view.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS neighbourhoods (
                id          TEXT PRIMARY KEY,
                firm_token  TEXT NOT NULL,
                name        TEXT NOT NULL,
                client_ids  TEXT NOT NULL,
                share_token TEXT,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_neigh_firm ON neighbourhoods(firm_token)")
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_neigh_share ON neighbourhoods(share_token)")
        conn.commit()


_init_db()


def _prune_old_sessions():
    """Delete sessions and portfolio clients older than SESSION_TTL_DAYS (default 30).

    Called at startup so stale BLOBs don't accumulate on disk indefinitely.
    Configurable via SESSION_TTL_DAYS env var; set to 0 to disable pruning.
    """
    ttl = int(os.environ.get("SESSION_TTL_DAYS", "30"))
    if ttl <= 0:
        return
    cutoff = (datetime.now(timezone.utc) - timedelta(days=ttl)).isoformat()
    try:
        with _db() as conn:
            deleted = conn.execute(
                "DELETE FROM sessions WHERE created_at < ?", (cutoff,)
            ).rowcount
            conn.commit()
        if deleted:
            print(f"[DB] Pruned {deleted} session(s) older than {ttl} days", file=sys.stderr)
    except Exception as exc:
        print(f"[DB] Session prune failed: {exc}", file=sys.stderr)


_prune_old_sessions()


class SessionStore(dict):
    """
    Drop-in replacement for `dict` that auto-rehydrates from SQLite on a cache
    miss. Every endpoint that calls SESSIONS.get(sid) gets transparent session
    recovery without any per-endpoint changes.
    """
    _miss: set = set()   # IDs confirmed absent from DB — avoids repeated lookups

    def get(self, key, default=None):
        v = super().get(key)
        if v is not None:
            return v
        if key in self._miss:
            return default
        # Try to rehydrate from the persistent sessions table
        try:
            with _db() as conn:
                row = conn.execute(
                    "SELECT file_bytes, file_name, analysis_type, xero_cash, "
                    "sector, list_size, wte_partners, arrs_allocation, "
                    "qof_entitlement, partner_drawings "
                    "FROM sessions WHERE id = ?", (key,)
                ).fetchone()
            if row:
                ok = _rehydrate_from_file(
                    key, bytes(row["file_bytes"]), row["file_name"],
                    row["analysis_type"], row["xero_cash"],
                    sector=row["sector"] or "general",
                    list_size=row["list_size"] or 0,
                    wte_partners=row["wte_partners"],
                    arrs_allocation=row["arrs_allocation"],
                    qof_entitlement=row["qof_entitlement"],
                    partner_drawings=row["partner_drawings"],
                )
                if ok:
                    self._miss.discard(key)
                    return super().get(key, default)
        except Exception as exc:
            print(f"[SessionStore] rehydrate {key}: {exc}", file=sys.stderr)
        self._miss.add(key)
        return default


# Session store — dict with automatic SQLite-backed rehydration on miss
SESSIONS = SessionStore()

# Xero OAuth 2.0 token store (in-memory, keyed by state param)
XERO_TOKENS: dict = {}  # state_key → {access_token, refresh_token, tenant_id, ...}

XERO_CLIENT_ID     = os.environ.get("XERO_CLIENT_ID", "")
XERO_CLIENT_SECRET = os.environ.get("XERO_CLIENT_SECRET", "")
XERO_REDIRECT_URI  = os.environ.get("XERO_REDIRECT_URI", "http://localhost:8000/api/xero/callback")
XERO_SCOPES        = "openid profile email accounting.reports.profitandloss.read accounting.reports.balancesheet.read"

STATIC = Path(__file__).parent / "static"

# Write a no-op api-base.js if missing (dev mode).
# In production, scripts/inject-config.js overwrites this with the real API URL.
_api_base_js = STATIC / "api-base.js"
if not _api_base_js.exists():
    try:
        _api_base_js.write_text("window.__MONTHENDIQ_API_BASE__ = '';\n")
    except OSError:
        pass

app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def root():
    return FileResponse(STATIC / "index.html")


@app.get("/privacy")
def privacy_page():
    return FileResponse(STATIC / "privacy.html")


@app.get("/view/{session_id}")
def view_shared(session_id: str):
    """Serve the SPA for a shareable session link — the frontend reads the ID from the URL."""
    return FileResponse(STATIC / "index.html")


@app.get("/portal/neighbourhood/{share_token}")
def view_neighbourhood_portal(share_token: str):
    """Serve the SPA for a public neighbourhood portal link — the frontend reads the token from the URL."""
    return FileResponse(STATIC / "index.html")


# ─────────────────────────────────────────────────────────────────────────────
# MULTI-ENTITY CONSOLIDATION
# ─────────────────────────────────────────────────────────────────────────────
class ConsolidateBody(BaseModel):
    session_ids: list[str] = Field(min_length=2, max_length=20)
    period:      str | None = None
    mode:        str        = "monthly"


@app.post("/api/consolidate")
def consolidate_sessions(body: ConsolidateBody):
    """
    Merge two or more MoM sessions into a single group P&L.
    Accounts are matched by name; unmatched accounts appear only for their entity.
    Returns the same data envelope as /api/data so all existing views work.
    """
    if len(body.session_ids) < 2:
        raise HTTPException(400, "Provide at least two session IDs.")

    sessions = [SESSIONS.get(sid) for sid in body.session_ids]
    missing  = [sid for sid, s in zip(body.session_ids, sessions) if not s]
    if missing:
        raise HTTPException(404, f"Sessions not found: {', '.join(missing[:3])}")

    if any(s.get("analysis_type") == "budget_vs_actual" for s in sessions):
        raise HTTPException(400, "Consolidation of Budget vs Actual sessions is not yet supported.")

    entity_data = []
    for s in sessions:
        analysis = s["analysis_m"] if body.mode in ("monthly", "ytd") else s["analysis_q"]
        df_long  = s["df_long_m"]  if body.mode in ("monthly", "ytd") else s["df_long_q"]
        sort_key = (lambda p: pd.Timestamp(p)) if body.mode != "quarterly" else quarter_sort_key
        periods  = sorted(analysis["Period"].unique(), key=sort_key)
        if not periods:
            continue
        selected = periods[-1]
        if body.period:
            for p in periods:
                if str(p)[:10] == str(body.period)[:10] or period_label(p, body.mode) == body.period:
                    selected = p
                    break
        d = get_period_data(analysis, df_long, selected, s["kpi_accounts"], body.mode)
        d["_entity_name"] = s["filename"]
        entity_data.append(d)

    if not entity_data:
        raise HTTPException(400, "No data found for any of the provided sessions.")

    # ── Merge movements: sum values for matching accounts ──────────────────
    from collections import defaultdict
    acc_map: dict[str, dict] = defaultdict(lambda: {
        "value": 0.0, "prior_value": 0.0, "category": "", "entities": []
    })
    for d in entity_data:
        for m in d.get("movements", []):
            k = m["account"].strip()
            acc_map[k]["value"]       += m.get("value")       or 0
            acc_map[k]["prior_value"] += m.get("prior_value") or 0
            acc_map[k]["category"]    = m.get("category", "")
            acc_map[k]["entities"].append(d["_entity_name"])

    movements = []
    for account, v in acc_map.items():
        variance = v["value"] - v["prior_value"]
        cat      = v["category"]
        is_fav   = (cat == "Revenue" and variance >= 0) or (cat != "Revenue" and variance <= 0)
        vp       = v["prior_value"]
        movements.append({
            "account":      account,
            "category":     cat,
            "value":        round(v["value"], 2),
            "prior_value":  round(vp, 2),
            "variance":     round(variance, 2),
            "variance_pct": round(variance / vp * 100, 1) if vp != 0 else None,
            "is_fav":       is_fav,
            "history":      [],
        })
    movements.sort(key=lambda m: abs(m["variance"] or 0), reverse=True)

    # ── Merge KPIs: sum value and prior across matching labels ─────────────
    kpi_acc: dict[str, dict] = {}
    for d in entity_data:
        for k in d.get("kpis", []):
            lbl = k["label"]
            if lbl not in kpi_acc:
                kpi_acc[lbl] = {**k, "value": 0.0, "prior": 0.0}
            if k.get("value") is not None:
                kpi_acc[lbl]["value"] = (kpi_acc[lbl]["value"] or 0) + k["value"]
            if k.get("prior") is not None:
                kpi_acc[lbl]["prior"] = (kpi_acc[lbl]["prior"] or 0) + k["prior"]

    kpis = []
    for k in kpi_acc.values():
        if k.get("pct_only"):
            continue  # recompute from merged profit kpi below
        v, p = k.get("value") or 0, k.get("prior") or 0
        var  = v - p
        pct  = var / abs(p) * 100 if p != 0 else None
        fav_when_up = k.get("icon") in ("trending-up", "wallet")
        kpis.append({**k,
            "value":    round(v, 2),
            "prior":    round(p, 2),
            "variance": round(var, 2),
            "pct":      round(pct, 1) if pct is not None else None,
            "is_fav":   (fav_when_up and var >= 0) or (not fav_when_up and var <= 0),
        })
    prof_kpi = next((k for k in kpis if k.get("icon") == "wallet"), None)
    if prof_kpi and prof_kpi.get("pct") is not None:
        kpis.append({
            "label": "Profit Variance", "value": None,
            "variance": prof_kpi["variance"], "pct": prof_kpi["pct"],
            "is_fav": prof_kpi["is_fav"], "icon": "bar-chart-2", "pct_only": True,
        })

    # ── Commentary: aggregate from first entity for now ───────────────────
    commentary = entity_data[0].get("commentary", []) if entity_data else []

    period_obj = entity_data[0].get("period", {"label": "Consolidated", "prior": "Prior"})

    return {
        "analysis_type":   "month_on_month",
        "kpis":            kpis,
        "movements":       movements[:20],
        "commentary":      commentary,
        "waterfall":       None,
        "trend":           [],
        "revenue_split":   [],
        "expense_split":   [],
        "period":          period_obj,
        "selected_period": str(entity_data[0].get("selected_period", "")),
        "periods":         entity_data[0].get("periods", []),
        "entity_count":    len(entity_data),
        "entity_names":    [d["_entity_name"] for d in entity_data],
    }


# ─────────────────────────────────────────────────────────────────────────────
# EMAIL MANAGEMENT PACK
# ─────────────────────────────────────────────────────────────────────────────
import smtplib, io as _io
from email.mime.multipart import MIMEMultipart as _MIMEMultipart
from email.mime.base import MIMEBase as _MIMEBase
from email.mime.text import MIMEText as _MIMEText
from email import encoders as _encoders


class EmailBody(BaseModel):
    recipients: list[str]          = Field(max_length=10)
    subject:    str | None         = Field(None, max_length=200)
    period:     str | None         = None
    mode:       str                = "monthly"
    fmt:        str                = "pdf"
    firm:       str | None         = Field(None, max_length=200)


@app.post("/api/email/{session_id}")
def email_pack(session_id: str, body: EmailBody):
    """
    Generate a PDF management pack and send it to the specified recipients
    via SMTP.  Requires SMTP_HOST, SMTP_USER, SMTP_PASSWORD env vars.
    """
    smtp_host  = os.environ.get("SMTP_HOST")
    smtp_port  = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user  = os.environ.get("SMTP_USER")
    smtp_pass  = os.environ.get("SMTP_PASSWORD")
    email_from = os.environ.get("EMAIL_FROM") or smtp_user

    if not (smtp_host and smtp_user and smtp_pass):
        raise HTTPException(
            501,
            "Email not configured. Please set SMTP_HOST, SMTP_USER, and "
            "SMTP_PASSWORD environment variables on your server.",
        )

    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")

    if s.get("analysis_type") == "budget_vs_actual":
        raise HTTPException(400, "Email export is not yet supported for Budget vs Actual sessions.")

    if not body.recipients:
        raise HTTPException(400, "At least one recipient is required.")
    if len(body.recipients) > 10:
        raise HTTPException(400, "Maximum 10 recipients per email.")

    # Build period data for the PDF
    analysis  = s["analysis_m"]
    df_long   = s["df_long_m"]
    kpi_accts = s["kpi_accounts"]
    sort_key  = lambda p: pd.Timestamp(p)
    periods   = sorted(analysis["Period"].unique(), key=sort_key)
    if not periods:
        raise HTTPException(400, "No period data available.")

    selected = periods[-1]
    if body.period:
        for p in periods:
            if str(p)[:10] == str(body.period)[:10] or period_label(p, "monthly") == body.period:
                selected = p
                break

    d = get_period_data(analysis, df_long, selected, kpi_accts, "monthly")
    period_lbl = d.get("period", {}).get("label", "Report")

    try:
        _email_insights = get_insights_data(analysis, df_long, selected, kpi_accts, "monthly")
    except Exception:
        _email_insights = None

    pdf_bytes = make_pdf(
        period_lbl,
        d.get("movements", []),
        d.get("commentary", []),
        d.get("kpis", []),
        "month_on_month",
        firm_name=body.firm or "",
        insights=_email_insights,
    )

    subject = body.subject or f"Management Pack — {period_lbl}"
    msg = _MIMEMultipart()
    msg["From"]    = email_from
    msg["To"]      = ", ".join(body.recipients)
    msg["Subject"] = subject

    body_text = (
        f"Please find attached the management pack for {period_lbl}.\n\n"
        f"Generated by MonthEndIQ."
    )
    msg.attach(_MIMEText(body_text, "plain"))

    part = _MIMEBase("application", "octet-stream")
    part.set_payload(pdf_bytes)
    _encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition", "attachment",
        filename=f"management_pack_{period_lbl.replace(' ', '_')}.pdf",
    )
    msg.attach(part)

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as srv:
            srv.ehlo()
            srv.starttls()
            srv.login(smtp_user, smtp_pass)
            srv.send_message(msg)
    except smtplib.SMTPException as exc:
        raise HTTPException(502, f"SMTP error: {exc}") from exc

    return {"sent": True, "recipients": body.recipients, "period": period_lbl}


# ─────────────────────────────────────────────────────────────────────────────
# ROLLING FORECAST
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/forecast/{session_id}")
def get_forecast(session_id: str, lookback: int = 3, mode: str = "monthly"):
    """
    Compute a rolling average forecast for Revenue, Costs and Profit.
    Uses the last `lookback` actuals periods to project forward until year-end
    (monthly mode) or the next 2 quarters (quarterly mode).
    """
    lookback = max(1, min(lookback, 24))
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    if s.get("analysis_type") == "budget_vs_actual":
        raise HTTPException(400, "Forecast not available for Budget vs Actual sessions.")

    analysis    = s["analysis_m"] if mode != "quarterly" else s["analysis_q"]
    kpi_accts   = s["kpi_accounts"]
    sort_key    = (lambda p: pd.Timestamp(p)) if mode != "quarterly" else quarter_sort_key
    periods     = sorted(analysis["Period"].unique(), key=sort_key)

    if not periods:
        return {"actuals": [], "forecast": [], "combined": [], "lookback_used": 0}

    def kpi_val(p, name):
        if not name:
            return 0.0
        m = analysis[(analysis["Period"] == p) & (analysis["Account"].str.strip() == name.strip())]
        return float(m.iloc[0]["Value"]) if not m.empty and pd.notna(m.iloc[0]["Value"]) else 0.0

    actuals = []
    for p in periods:
        lbl   = period_label(p, mode)
        short = pd.Timestamp(p).strftime("%b") if mode == "monthly" else str(p)[-5:]
        actuals.append({
            "m": short, "full": lbl, "is_forecast": False,
            "revenue": kpi_val(p, kpi_accts["revenue"]),
            "costs":   kpi_val(p, kpi_accts["costs"]),
            "profit":  kpi_val(p, kpi_accts["profit"]),
        })

    lb   = max(1, min(lookback, len(actuals)))
    tail = actuals[-lb:]
    avg  = {k: round(sum(t[k] for t in tail) / lb, 2) for k in ("revenue", "costs", "profit")}

    # Future periods: remainder of the current calendar year (monthly), next 2 qtrs (quarterly)
    last_p = periods[-1]
    if mode == "monthly":
        last_ts      = pd.Timestamp(last_p)
        year_end     = pd.Timestamp(last_ts.year, 12, 1)
        future_dates = pd.date_range(last_ts + pd.DateOffset(months=1), year_end, freq="MS")
    else:
        future_dates = []

    forecast = []
    for fp in list(future_dates)[:6]:
        forecast.append({
            "m": fp.strftime("%b") + "*",
            "full": fp.strftime("%B %Y") + " (forecast)",
            "is_forecast": True,
            **avg,
        })

    return {
        "actuals":      actuals,
        "forecast":     forecast,
        "combined":     actuals + forecast,
        "lookback_used": lb,
    }


# ─────────────────────────────────────────────────────────────────────────────
# DEMO
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/demo")
def demo():
    """Return a fully-analysed 12-month demo dataset for Meridian Software Ltd."""

    months = [
        "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
        "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    ]

    # (Account, Section, [Jul..Jun values])
    rows = [
        # ── Revenue ──────────────────────────────────────────────────────────
        ("Software Licences",       "Turnover",          [55000,52000,58000,63000,68000,72000,67000,64000,71000,62000,60000,68000]),
        ("Consulting Services",     "Turnover",          [42000,34000,48000,53000,58000,44000,46000,51000,61000,47000,54000,58000]),
        ("Total Turnover",          "Turnover",          [97000,86000,106000,116000,126000,116000,113000,115000,132000,109000,114000,126000]),
        # ── Cost of Sales ─────────────────────────────────────────────────────
        ("Direct Delivery Costs",   "Cost of Sales",     [19500,17200,21200,23200,25200,23200,22600,23000,26400,21800,22800,25200]),
        ("Total Cost of Sales",     "Cost of Sales",     [19500,17200,21200,23200,25200,23200,22600,23000,26400,21800,22800,25200]),
        # ── Gross Profit ──────────────────────────────────────────────────────
        ("Gross Profit",            "Profit",            [77500,68800,84800,92800,100800,92800,90400,92000,105600,87200,91200,100800]),
        # ── Staff Costs ───────────────────────────────────────────────────────
        ("Staff Wages",             "Staff Costs",       [34000,34500,35000,36000,37500,36000,36000,36500,37000,37500,38000,38500]),
        ("Employer NI",             "Staff Costs",       [3800,3850,3900,4000,4200,4000,4000,4050,4100,4150,4200,4250]),
        ("Pension Contributions",   "Staff Costs",       [1700,1725,1750,1800,1875,1800,1800,1825,1850,1875,1900,1925]),
        ("Total Staff Costs",       "Staff Costs",       [39500,40075,40650,41800,43575,41800,41800,42375,42950,43525,44100,44675]),
        # ── Premises ─────────────────────────────────────────────────────────
        ("Office Rent",             "Premises",          [8500]*12),
        ("Business Rates",          "Premises",          [1200]*12),
        ("Total Premises Costs",    "Premises",          [9700]*12),
        # ── IT ───────────────────────────────────────────────────────────────
        ("IT Software",             "IT",                [3200,3200,3400,3400,3600,4800,3400,3400,3600,3600,3600,3800]),
        ("IT Hardware",             "IT",                [0,0,2500,0,0,0,0,3200,0,0,0,0]),
        ("Total IT Costs",          "IT",                [3200,3200,5900,3400,3600,4800,3400,6600,3600,3600,3600,3800]),
        # ── Marketing ────────────────────────────────────────────────────────
        ("Online Marketing",        "Marketing",         [4500,3800,5500,6000,7500,6000,5000,5500,6500,5500,6000,7000]),
        ("Paid Advertising",        "Marketing",         [2000,1500,2500,3000,4000,3500,2500,3000,3500,2500,3000,3500]),
        ("Total Marketing",         "Marketing",         [6500,5300,8000,9000,11500,9500,7500,8500,10000,8000,9000,10500]),
        # ── Professional Fees ────────────────────────────────────────────────
        ("Legal Expenses",          "Professional Fees", [1500,500,750,1200,1500,2000,1000,800,1800,1500,600,900]),
        ("Accountancy",             "Professional Fees", [1200]*12),
        ("Total Professional Fees", "Professional Fees", [2700,1700,1950,2400,2700,3200,2200,2000,3000,2700,1800,2100]),
        # ── Office & Admin ───────────────────────────────────────────────────
        ("Office Supplies",         "Office & Admin",    [650,580,700,720,850,900,680,710,780,690,720,760]),
        ("Postage & Couriers",      "Office & Admin",    [180,150,200,210,240,260,190,200,220,195,205,215]),
        ("Total Office & Admin",    "Office & Admin",    [830,730,900,930,1090,1160,870,910,1000,885,925,975]),
        # ── Finance Costs ────────────────────────────────────────────────────
        ("Bank Charges",            "Finance",           [200]*12),
        ("Loan Interest",           "Finance",           [850]*12),
        ("Total Finance Costs",     "Finance",           [1050]*12),
        # ── Depreciation ─────────────────────────────────────────────────────
        ("Depreciation",            "Depreciation",      [2200]*12),
        ("Total Depreciation",      "Depreciation",      [2200]*12),
        # ── Operating Profit ─────────────────────────────────────────────────
        ("Operating Profit",        "Profit",            [11820,4845,14450,22320,25385,19390,21680,18665,32100,15540,18825,25800]),
    ]

    data_dict: dict = {"Account": [], "Section": []}
    for m in months:
        data_dict[m] = []

    for account, section, values in rows:
        data_dict["Account"].append(account)
        data_dict["Section"].append(section)
        for i, m in enumerate(months):
            data_dict[m].append(float(values[i]))

    df = pd.DataFrame(data_dict)

    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m)
    analysis_q   = build_analysis(df_long_q)

    session_id = str(uuid.uuid4())
    filename   = "Meridian Software Ltd — Demo"
    SESSIONS[session_id] = {
        "df":            df,
        "df_long_m":     df_long_m,
        "df_long_q":     df_long_q,
        "analysis_m":    analysis_m,
        "analysis_q":    analysis_q,
        "kpi_accounts":  kpi_accounts,
        "filename":      filename,
        "analysis_type": "month_on_month",
        "chat":          [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    latest    = periods_m[-1]

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = filename
    return data


@app.get("/api/demo-burn")
def demo_burn():
    """Loss-making seed-stage SaaS — demonstrates the Cash & Runway burn path.

    Prefills xero_cash (as if pulled from a Xero balance sheet) so the runway
    panel computes a depletion date out of the box.
    """
    months = [
        "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
        "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    ]

    rows = [
        # ── Revenue (ramping MRR) ────────────────────────────────────────────
        ("Subscription Revenue",      "Turnover",          [18000,20000,22000,25000,27000,30000,33000,36000,40000,44000,48000,52000]),
        ("Setup & Onboarding",        "Turnover",          [3000,2500,3500,3000,4000,3500,4500,4000,5000,4500,5500,6000]),
        ("Total Turnover",            "Turnover",          [21000,22500,25500,28000,31000,33500,37500,40000,45000,48500,53500,58000]),
        # ── Cost of Sales ────────────────────────────────────────────────────
        ("Cloud Hosting",             "Cost of Sales",     [6000,6300,6800,7200,7600,8000,8500,9000,9600,10200,10800,11400]),
        ("Customer Support",          "Cost of Sales",     [4000,4200,4400,4600,4800,5000,5200,5400,5600,5800,6000,6200]),
        ("Total Cost of Sales",       "Cost of Sales",     [10000,10500,11200,11800,12400,13000,13700,14400,15200,16000,16800,17600]),
        # ── Gross Profit ─────────────────────────────────────────────────────
        ("Gross Profit",              "Profit",            [11000,12000,14300,16200,18600,20500,23800,25600,29800,32500,36700,40400]),
        # ── Staff Costs (over-hired engineering) ─────────────────────────────
        ("Engineering Salaries",      "Staff Costs",       [38000,38000,40000,42000,42000,44000,46000,46000,48000,50000,50000,52000]),
        ("Sales & Marketing Salaries","Staff Costs",       [16000,16000,18000,18000,20000,20000,22000,22000,24000,24000,26000,26000]),
        ("Employer NI & Pension",     "Staff Costs",       [7000,7000,7500,7800,8000,8300,8800,8800,9300,9600,9900,10200]),
        ("Total Staff Costs",         "Staff Costs",       [61000,61000,65500,67800,70000,72300,76800,76800,81300,83600,85900,88200]),
        # ── Marketing (paid acquisition) ─────────────────────────────────────
        ("Paid Advertising",          "Marketing",         [12000,11000,13000,14000,16000,15000,14000,13000,15000,14000,13000,12000]),
        ("Content & Events",          "Marketing",         [3000,2500,3500,3000,4000,3500,3000,2500,3500,3000,2500,3000]),
        ("Total Marketing",           "Marketing",         [15000,13500,16500,17000,20000,18500,17000,15500,18500,17000,15500,15000]),
        # ── Premises & Admin ─────────────────────────────────────────────────
        ("Office Rent",               "Premises & Admin",  [4500]*12),
        ("Software & Tools",          "Premises & Admin",  [2200,2300,2400,2500,2600,2700,2800,2900,3000,3100,3200,3300]),
        ("Total Premises & Admin",    "Premises & Admin",  [6700,6800,6900,7000,7100,7200,7300,7400,7500,7600,7700,7800]),
        # ── Operating Loss ───────────────────────────────────────────────────
        ("Operating Profit",          "Profit",            [-71700,-69300,-74600,-75600,-78500,-77500,-77300,-74100,-77500,-75700,-72400,-70600]),
    ]

    data_dict: dict = {"Account": [], "Section": []}
    for m in months:
        data_dict[m] = []
    for account, section, values in rows:
        data_dict["Account"].append(account)
        data_dict["Section"].append(section)
        for i, m in enumerate(months):
            data_dict[m].append(float(values[i]))

    df = pd.DataFrame(data_dict)
    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m)
    analysis_q   = build_analysis(df_long_q)

    session_id = str(uuid.uuid4())
    filename   = "Nimbus Labs Ltd — Demo (cash burn)"
    XERO_CASH  = 350000.0  # as if read from the Xero balance sheet
    SESSIONS[session_id] = {
        "df":            df,
        "df_long_m":     df_long_m,
        "df_long_q":     df_long_q,
        "analysis_m":    analysis_m,
        "analysis_q":    analysis_q,
        "kpi_accounts":  kpi_accounts,
        "filename":      filename,
        "analysis_type": "month_on_month",
        "xero_cash":     XERO_CASH,
        "chat":          [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    latest    = periods_m[-1]

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = filename
    data["xero_cash"]     = XERO_CASH
    return data


@app.get("/api/demo-gp")
def demo_gp():
    """NHS GP practice demo — Riverside Medical Practice (9,200 patients, 3 partners)."""

    months = [
        "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
        "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    ]

    # ── Revenue components ────────────────────────────────────────────────────
    gms      = [78200,77800,77600,78400,78800,78500,79000,78600,79200,79600,79900,80000]
    qof      = [15200,15200,15200,15200,15200,15200,15200,15200,15200,15200,15200,22600]
    es_ci    = [8200,0,0,8200,0,0,8200,0,0,8200,0,0]       # quarterly: Jul/Oct/Jan/Apr
    es_ext   = [3100]*12
    es_smr   = [3500,0,0,3500,0,0,3500,0,0,3500,0,0]       # quarterly
    pcn_dev  = [5500,0,0,5500,0,0,5500,0,0,5500,0,0]       # quarterly
    icb_prem = [7300]*12
    minor_p  = [1700,1500,1800,1600,1400,1600,1800,1700,1900,1600,1700,1800]
    total_rev = [sum(x) for x in zip(gms,qof,es_ci,es_ext,es_smr,pcn_dev,icb_prem,minor_p)]

    # ── Staff cost components ─────────────────────────────────────────────────
    clinical = [28500,28500,28500,29000,29000,29000,29500,29500,29500,29800,29800,30000]
    arrs_ph  = [4500]*12   # ARRS Salary - Clinical Pharmacist
    arrs_sp  = [2200]*12   # ARRS Salary - Social Prescriber
    admin_w  = [10200,10200,10200,10200,10200,10200,10400,10400,10400,10500,10500,10700]
    prac_mgr = [4800]*12
    locum    = [2000,8500,6500,2000,1500,2500,2000,4500,3000,2000,1500,2500]
    emp_ni   = [6800,7400,7200,6800,6700,6800,6900,7200,7000,6900,6800,6900]
    pension  = [5600,5600,5600,5700,5700,5700,5800,5800,5800,5900,5900,5900]
    total_staff = [sum(x) for x in zip(clinical,arrs_ph,arrs_sp,admin_w,prac_mgr,locum,emp_ni,pension)]

    # ── Partner drawings ──────────────────────────────────────────────────────
    drawings = [25000]*12

    # ── Premises ──────────────────────────────────────────────────────────────
    rent     = [5500]*12
    utils    = [1200,1200,1100,1100,1100,1200,1200,1100,1100,1100,1100,1200]
    cleaning = [800]*12
    total_premises = [sum(x) for x in zip(rent,utils,cleaning)]

    # ── IT ─────────────────────────────────────────────────────────────────────
    emis     = [1850]*12
    it_supp  = [650,650,650,650,650,650,1200,650,650,650,650,650]
    total_it = [sum(x) for x in zip(emis,it_supp)]

    # ── Other costs ────────────────────────────────────────────────────────────
    medical  = [2800]*12
    accy     = [1500]*12
    bank_c   = [180]*12
    depr     = [900]*12

    # ── Net surplus ────────────────────────────────────────────────────────────
    total_costs = [sum(x) for x in zip(
        total_staff, drawings, total_premises, total_it, medical, accy, bank_c, depr
    )]
    surplus  = [r - c for r, c in zip(total_rev, total_costs)]

    rows = [
        # Revenue
        ("GMS Global Sum",                              "Turnover",                 gms),
        ("QOF - Quality and Outcomes",                  "Turnover",                 qof),
        ("Enhanced Services - Childhood Immunisation",  "Turnover",                 es_ci),
        ("Enhanced Services - Extended Hours",          "Turnover",                 es_ext),
        ("Enhanced Services - Structured Medication Reviews", "Turnover",           es_smr),
        ("PCN Development Fund",                        "Turnover",                 pcn_dev),
        ("ICB Premises Reimbursement",                  "Turnover",                 icb_prem),
        ("Minor Procedures Income",                     "Turnover",                 minor_p),
        ("Total Turnover",                              "Turnover",                 total_rev),
        # Staff Costs
        ("Clinical Staff Salaries",                     "Staff Costs",              clinical),
        ("ARRS Salary - Clinical Pharmacist",           "Staff Costs",              arrs_ph),
        ("ARRS Salary - Social Prescriber",             "Staff Costs",              arrs_sp),
        ("Admin Staff Wages",                           "Staff Costs",              admin_w),
        ("Practice Manager Salary",                     "Staff Costs",              prac_mgr),
        ("Locum Costs",                                 "Staff Costs",              locum),
        ("Employer NI",                                 "Staff Costs",              emp_ni),
        ("NHS Pension Contributions",                   "Staff Costs",              pension),
        ("Total Staff Costs",                           "Staff Costs",              total_staff),
        # GP Partner Drawings
        ("GP Partners' Drawings",                       "Management Costs",         drawings),
        ("Total Management Costs",                      "Management Costs",         drawings),
        # Premises
        ("Building Rent",                               "Premises Costs",           rent),
        ("Utilities",                                   "Premises Costs",           utils),
        ("Cleaning & Maintenance",                      "Premises Costs",           cleaning),
        ("Total Premises Costs",                        "Premises Costs",           total_premises),
        # IT
        ("EMIS Health System",                          "IT Costs",                 emis),
        ("IT Support & Hardware",                       "IT Costs",                 it_supp),
        ("Total IT Costs",                              "IT Costs",                 total_it),
        # Medical Supplies
        ("Medical Consumables",                         "Direct Costs",             medical),
        ("Total Medical Supplies",                      "Direct Costs",             medical),
        # Professional Fees
        ("Accountancy",                                 "Professional Fees",        accy),
        ("Total Professional Fees",                     "Professional Fees",        accy),
        # Finance
        ("Bank Charges",                                "Finance Costs",            bank_c),
        ("Total Finance Costs",                         "Finance Costs",            bank_c),
        # Depreciation
        ("Depreciation",                                "Depreciation & Amortisation", depr),
        ("Total Depreciation",                          "Depreciation & Amortisation", depr),
        # Surplus
        ("Net Surplus",                                 "Profit",                   surplus),
    ]

    data_dict: dict = {"Account": [], "Section": []}
    for m in months:
        data_dict[m] = []
    for account, section, values in rows:
        data_dict["Account"].append(account)
        data_dict["Section"].append(section)
        for i, m in enumerate(months):
            data_dict[m].append(float(values[i]))

    df = pd.DataFrame(data_dict)
    sector_synonyms = load_sector_synonyms("nhs_gp")
    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m, sector_synonyms)
    analysis_q   = build_analysis(df_long_q, sector_synonyms)

    NHS_PARAMS = {
        "sector":          "nhs_gp",
        "list_size":       9200,
        "wte_partners":    3.0,
        "arrs_allocation": 125000.0,
        "qof_entitlement": 188000.0,
        "partner_drawings": 300000.0,
    }

    session_id = str(uuid.uuid4())
    filename   = "Riverside Medical Practice — NHS GP Demo"
    SESSIONS[session_id] = {
        "df":            df,
        "df_long_m":     df_long_m,
        "df_long_q":     df_long_q,
        "analysis_m":    analysis_m,
        "analysis_q":    analysis_q,
        "kpi_accounts":  kpi_accounts,
        "filename":      filename,
        "analysis_type": "month_on_month",
        "chat":          [],
        **NHS_PARAMS,
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    latest    = periods_m[-1]

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    movements = data.get("movements", [])
    for m in movements:
        m["is_locum"] = is_locum_account(m.get("account", ""))
    data["workforce_breakdown"] = compute_workforce_breakdown(movements)
    # Use full-year YTD movements so ARRS/QOF reflect total annual spend vs allocation
    ytd_mvts = _nhs_ytd_movements(SESSIONS[session_id], latest, "monthly")
    util = compute_utilisation(ytd_mvts, NHS_PARAMS["arrs_allocation"], NHS_PARAMS["qof_entitlement"])
    data["nhs_utilisation"] = util
    data["commentary"] = _adapt_commentary_for_nhs(data.get("commentary", []))
    nhs = compute_nhs_kpis(data, NHS_PARAMS["list_size"], NHS_PARAMS["wte_partners"])
    nhs.update(util)
    data["nhs_kpis"]      = nhs
    data["nhs_kpi_cards"] = nhs_kpi_cards(nhs)
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = filename
    data["sector"]        = "nhs_gp"
    data["list_size"]     = NHS_PARAMS["list_size"]
    return data


# ─────────────────────────────────────────────────────────────────────────────
# PRACTICE PORTFOLIO — multi-client month-end triage (firm mode)
# ─────────────────────────────────────────────────────────────────────────────

def _rehydrate_mom(session_id: str, file_bytes: bytes, file_name: str,
                   xero_cash=None, sector: str = "general", list_size: int = 0,
                   wte_partners=None, arrs_allocation=None,
                   qof_entitlement=None, partner_drawings=None) -> bool:
    """Run the MoM analysis pipeline from raw bytes and store in SESSIONS."""
    try:
        df = load_file(file_bytes, file_name)
        df["Account"] = df["Account"].astype(str).str.strip()
        df["Section"] = df["Section"].astype(str).replace("nan", "").fillna("")
        df = df[df["Account"].notna() & (df["Account"] != "") & (df["Account"].str.lower() != "nan")]
        df_long_m    = build_long(df, "monthly")
        df_long_q    = build_long(df, "quarterly")
        kpi_accounts = detect_kpis(df_long_m)
        sector_synonyms = load_sector_synonyms(sector) if sector != "general" else None
        analysis_m   = build_analysis(df_long_m, sector_synonyms)
        analysis_q   = build_analysis(df_long_q, sector_synonyms)
        SESSIONS[session_id] = {
            "df": df, "df_long_m": df_long_m, "df_long_q": df_long_q,
            "analysis_m": analysis_m, "analysis_q": analysis_q,
            "kpi_accounts": kpi_accounts, "filename": file_name,
            "analysis_type": "month_on_month", "xero_cash": xero_cash,
            "sector": sector, "list_size": list_size,
            "wte_partners": wte_partners, "arrs_allocation": arrs_allocation,
            "qof_entitlement": qof_entitlement, "partner_drawings": partner_drawings,
            "chat": [],
        }
        return True
    except Exception as exc:
        print(f"[Rehydrate MoM] {session_id}: {exc}", file=sys.stderr)
        return False


def _rehydrate_client(client_id: str, file_bytes: bytes, file_name: str,
                      name: str, cash_balance, sector: str = "other",
                      list_size: int = 0, wte_partners=None,
                      arrs_allocation=None, qof_entitlement=None,
                      partner_drawings=None) -> bool:
    """Rehydrate a portfolio client session (MoM only)."""
    return _rehydrate_mom(client_id, file_bytes, file_name, cash_balance,
                          sector=sector or "other", list_size=list_size,
                          wte_partners=wte_partners, arrs_allocation=arrs_allocation,
                          qof_entitlement=qof_entitlement, partner_drawings=partner_drawings)


def _rehydrate_from_file(session_id: str, contents: bytes, filename: str,
                          analysis_type: str, xero_cash,
                          sector: str = "general", list_size: int = 0,
                          wte_partners=None, arrs_allocation=None,
                          qof_entitlement=None, partner_drawings=None) -> bool:
    """
    Rehydrate any persisted session from stored file bytes.
    Handles both month_on_month and budget_vs_actual modes.
    Called automatically by SessionStore.get() on a cache miss.
    """
    if analysis_type != "budget_vs_actual":
        return _rehydrate_mom(session_id, contents, filename, xero_cash,
                              sector=sector, list_size=list_size,
                              wte_partners=wte_partners, arrs_allocation=arrs_allocation,
                              qof_entitlement=qof_entitlement, partner_drawings=partner_drawings)

    # BvA path
    try:
        bva_snapshot   = None
        bva_long_store = None
        ext = filename.split(".")[-1].lower()

        if ext in ("xlsx", "xls"):
            try:
                df_actual, df_budget = load_bva_from_sheets(contents, filename)
                bva_long = build_bva_long_from_sheets(df_actual, df_budget)
                agg = (
                    bva_long
                    .groupby(["Account", "Section", "Category", "Is Subtotal"], as_index=False)
                    [["Actual", "Budget"]].sum()
                )
                agg["Variance"]     = agg["Actual"] - agg["Budget"]
                agg["Variance %"]   = agg.apply(
                    lambda r: (r["Variance"] / r["Budget"] * 100) if r["Budget"] != 0 else None, axis=1
                )
                agg["Abs Variance"] = agg["Variance"].abs()
                bva_snapshot   = agg
                df_for_kpis    = df_actual
                bva_long_store = bva_long
            except Exception:
                pass

        if bva_snapshot is None:
            df = load_file(contents, filename)
            df["Account"] = df["Account"].astype(str).str.strip()
            df["Section"] = df["Section"].astype(str).replace("nan", "").fillna("")
            df = df[df["Account"].notna() & (df["Account"] != "") & (df["Account"].str.lower() != "nan")]
            actual_col, budget_col = detect_bva_columns(df)
            if not actual_col or not budget_col:
                return False
            bva_snapshot = build_bva(df, actual_col, budget_col)
            df_for_kpis  = df

        bva_periods  = sorted(bva_long_store["Period"].unique()) if bva_long_store is not None else []
        kpi_accounts = detect_kpis(df_for_kpis)
        SESSIONS[session_id] = {
            "df":              df_for_kpis,
            "bva_data":        bva_snapshot,
            "bva_long":        bva_long_store,
            "bva_periods":     bva_periods,
            "kpi_accounts":    kpi_accounts,
            "filename":        filename,
            "analysis_type":   "budget_vs_actual",
            "sector":          sector,
            "list_size":       list_size,
            "wte_partners":    wte_partners,
            "arrs_allocation": arrs_allocation,
            "qof_entitlement": qof_entitlement,
            "partner_drawings": partner_drawings,
            "chat":            [],
        }
        return True
    except Exception as exc:
        print(f"[Rehydrate BvA] {session_id}: {exc}", file=sys.stderr)
        return False


def _score_session(sid: str, name: str, sector: str, cash,
                   created_at: str, updated_at: str,
                   list_size: int = 0) -> dict | None:
    """Score a loaded session and return a portfolio triage dict."""
    s = SESSIONS.get(sid)
    if not s:
        return None

    analysis_m   = s["analysis_m"]
    df_long_m    = s["df_long_m"]
    kpi_accounts = s["kpi_accounts"]
    cash = cash or s.get("xero_cash") or 0

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    if not periods_m:
        return None
    latest = periods_m[-1]
    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")

    kpis = data.get("kpis", [])
    prof = next((k for k in kpis if k.get("icon") == "wallet"), None)
    revk = next((k for k in kpis if k.get("icon") == "trending-up"), None)
    op_profit  = prof["value"]    if prof else None
    profit_var = prof["variance"] if prof else None
    profit_pct = prof["pct"]      if prof else None
    revenue_v  = revk["value"]    if revk else None
    margin     = (op_profit / revenue_v * 100) if (op_profit is not None and revenue_v) else None

    profits  = [t.get("profit") for t in data.get("trend", []) if isinstance(t.get("profit"), (int, float))]
    avg      = sum(profits) / len(profits) if profits else 0.0
    burning  = avg < 0
    runway   = (cash / abs(avg)) if (burning and cash and avg != 0) else None

    movements   = data.get("movements", [])
    adverse     = [m for m in movements if not m.get("is_fav") and m.get("variance")]
    largest_adv = max(adverse, key=lambda m: abs(m["variance"]), default=None) if adverse else None
    big_swings  = sum(1 for m in movements if m.get("variance_pct") is not None and abs(m["variance_pct"]) >= 50)

    score, reasons = 0, []
    if runway is not None and runway < 6:
        score += 50; reasons.append(f"{runway:.0f}-month cash runway")
    elif runway is not None and runway < 12:
        score += 25; reasons.append(f"{runway:.0f}-month cash runway")
    if op_profit is not None and op_profit < 0:
        score += 30; reasons.append("Operating loss this period")
    if profit_pct is not None and profit_pct < -10:
        score += 25; reasons.append(f"Profit {abs(profit_pct):.0f}% below prior period")
    rev_thresh = 0.05 * abs(revenue_v) if revenue_v else float("inf")
    if largest_adv is not None and abs(largest_adv["variance"]) > rev_thresh:
        score += 15; reasons.append(f"{largest_adv['account']} £{abs(largest_adv['variance']):,.0f} adverse")
    if big_swings >= 2:
        score += 10; reasons.append(f"{big_swings} large movements")

    tier = "action" if score >= 50 else "watch" if score >= 20 else "healthy"

    return {
        "session_id": sid, "name": name, "sector": sector,
        "list_size": list_size or 0,
        "revenue": revenue_v, "op_profit": op_profit, "margin": margin,
        "profit_var": profit_var, "profit_var_pct": profit_pct,
        "cash": cash or None, "runway_months": runway, "burning": burning,
        "anomalies": big_swings, "tier": tier, "score": score,
        "reasons": reasons[:2] if reasons else ["On track"],
        "created_at": created_at, "updated_at": updated_at,
    }


_PORTFOLIO_MONTHS = [
    "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
    "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
]


def _ramp(start, step, shock_last=0):
    vals = [float(round(start + step * i)) for i in range(12)]
    if shock_last:
        vals[-1] += float(shock_last)
    return vals


def _flat(v, n=12):
    return [float(v)] * n


def _build_nhs_pcn_client(
    name, list_size, wte_partners, arrs_allocation, qof_entitlement,
    gms, qof, es, arrs_ph, arrs_sp, clinical, locum, admin_w, prac_mgr,
    drawings, rent, cash, sector="nhs_gp"
):
    """Build an NHS GP PCN P&L session for use in the demo portfolio.

    Uses the same account/section structure as /api/demo-gp so that
    compute_utilisation, compute_workforce_breakdown, and compute_nhs_kpis
    all receive correctly-categorised movements.
    """
    months = _PORTFOLIO_MONTHS
    ni_pct    = 0.138   # employer NI rate approximation
    pension_pct = 0.203 # NHS pension rate approximation

    emp_ni   = [round((clinical[i] + admin_w[i] + prac_mgr[i]) * ni_pct) for i in range(12)]
    pension  = [round((clinical[i] + admin_w[i]) * pension_pct) for i in range(12)]
    total_staff = [clinical[i] + arrs_ph[i] + arrs_sp[i] + admin_w[i] + prac_mgr[i]
                   + locum[i] + emp_ni[i] + pension[i] for i in range(12)]
    total_rev = [gms[i] + qof[i] + es[i] for i in range(12)]
    utils     = _flat(900)
    it_costs  = _flat(1400)
    misc      = _flat(600)
    total_costs = [total_staff[i] + drawings[i] + rent[i] + utils[i]
                   + it_costs[i] + misc[i] for i in range(12)]
    surplus   = [total_rev[i] - total_costs[i] for i in range(12)]

    rows = [
        ("GMS Global Sum",                        "Turnover",    gms),
        ("QOF - Quality and Outcomes",            "Turnover",    qof),
        ("Enhanced Services Income",              "Turnover",    es),
        ("Total Turnover",                        "Turnover",    total_rev),
        ("Clinical Staff Salaries",               "Staff Costs", clinical),
        ("ARRS Salary - Clinical Pharmacist",     "Staff Costs", arrs_ph),
        ("ARRS Salary - Social Prescriber",       "Staff Costs", arrs_sp),
        ("Admin Staff Wages",                     "Staff Costs", admin_w),
        ("Practice Manager Salary",               "Staff Costs", prac_mgr),
        ("Locum Costs",                           "Staff Costs", locum),
        ("Employer NI",                           "Staff Costs", emp_ni),
        ("NHS Pension Contributions",             "Staff Costs", pension),
        ("Total Staff Costs",                     "Staff Costs", total_staff),
        ("GP Partners' Drawings",                 "Management Costs", drawings),
        ("Total Management Costs",                "Management Costs", drawings),
        ("Building Rent",                         "Premises Costs", rent),
        ("Utilities",                             "Premises Costs", utils),
        ("Total Premises Costs",                  "Premises Costs",
         [rent[i] + utils[i] for i in range(12)]),
        ("IT & Systems",                          "IT Costs",    it_costs),
        ("Miscellaneous",                         "Other",       misc),
        ("Net Surplus",                           "Profit",      surplus),
    ]

    data_dict: dict = {"Account": [], "Section": []}
    for m in months:
        data_dict[m] = []
    for acc, sec, vals in rows:
        data_dict["Account"].append(acc)
        data_dict["Section"].append(sec)
        for i, m in enumerate(months):
            data_dict[m].append(float(vals[i]))

    df = pd.DataFrame(data_dict)
    sector_synonyms = load_sector_synonyms("nhs_gp")
    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m, sector_synonyms)
    analysis_q   = build_analysis(df_long_q, sector_synonyms)

    sid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    SESSIONS[sid] = {
        "df": df, "df_long_m": df_long_m, "df_long_q": df_long_q,
        "analysis_m": analysis_m, "analysis_q": analysis_q,
        "kpi_accounts": kpi_accounts, "filename": f"{name} — Demo",
        "analysis_type": "month_on_month", "xero_cash": cash, "chat": [],
        "sector": sector, "list_size": list_size, "wte_partners": wte_partners,
        "arrs_allocation": arrs_allocation, "qof_entitlement": qof_entitlement,
        "partner_drawings": sum(drawings),
    }

    return _score_session(sid, name, sector, cash, now, now, list_size=list_size)


def _build_portfolio_client(name, sector, revenue, cogs, staff, overheads, cash):
    """Build & store a client P&L session, then return a triage summary."""
    total_costs = [cogs[i] + staff[i] + overheads[i] for i in range(12)]
    op          = [revenue[i] - total_costs[i] for i in range(12)]
    rows = [
        ("Total Turnover",        "Turnover",       revenue),
        ("Cost of Sales",         "Cost of Sales",  cogs),
        ("Staff Costs",           "Staff Costs",    staff),
        ("Overheads",             "Overheads",      overheads),
        ("Total Operating Costs", "Costs",          total_costs),
        ("Operating Profit",      "Profit",         op),
    ]
    data_dict = {"Account": [], "Section": []}
    for m in _PORTFOLIO_MONTHS:
        data_dict[m] = []
    for acc, sec, vals in rows:
        data_dict["Account"].append(acc)
        data_dict["Section"].append(sec)
        for i, m in enumerate(_PORTFOLIO_MONTHS):
            data_dict[m].append(float(vals[i]))

    df           = pd.DataFrame(data_dict)
    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m)
    analysis_q   = build_analysis(df_long_q)

    sid = str(uuid.uuid4())
    SESSIONS[sid] = {
        "df": df, "df_long_m": df_long_m, "df_long_q": df_long_q,
        "analysis_m": analysis_m, "analysis_q": analysis_q,
        "kpi_accounts": kpi_accounts, "filename": f"{name} — Demo",
        "analysis_type": "month_on_month", "xero_cash": cash, "chat": [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    latest    = periods_m[-1]
    data      = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")

    kpis = data.get("kpis", [])
    prof = next((k for k in kpis if k.get("icon") == "wallet"), None)
    revk = next((k for k in kpis if k.get("icon") == "trending-up"), None)
    op_profit  = prof["value"]    if prof else None
    profit_var = prof["variance"] if prof else None
    profit_pct = prof["pct"]      if prof else None
    revenue_v  = revk["value"]    if revk else None
    margin     = (op_profit / revenue_v * 100) if (op_profit is not None and revenue_v) else None

    profits = [t.get("profit") for t in data.get("trend", []) if isinstance(t.get("profit"), (int, float))]
    avg     = sum(profits) / len(profits) if profits else 0.0
    burning = avg < 0
    runway  = (cash / abs(avg)) if (burning and cash and avg != 0) else None

    movements = data.get("movements", [])
    adverse   = [m for m in movements if not m.get("is_fav") and m.get("variance")]
    largest_adv = max(adverse, key=lambda m: abs(m["variance"]), default=None) if adverse else None
    big_swings  = sum(1 for m in movements if m.get("variance_pct") is not None and abs(m["variance_pct"]) >= 50)

    # ── Attention scoring ─────────────────────────────────────────────────────
    score, reasons = 0, []
    if runway is not None and runway < 6:
        score += 50; reasons.append(f"{runway:.0f}-month cash runway")
    elif runway is not None and runway < 12:
        score += 25; reasons.append(f"{runway:.0f}-month cash runway")
    if op_profit is not None and op_profit < 0:
        score += 30; reasons.append("Operating loss this period")
    if profit_pct is not None and profit_pct < -10:
        score += 25; reasons.append(f"Profit {abs(profit_pct):.0f}% below prior period")
    rev_thresh = 0.05 * abs(revenue_v) if revenue_v else float("inf")
    if largest_adv is not None and abs(largest_adv["variance"]) > rev_thresh:
        score += 15; reasons.append(f"{largest_adv['account']} £{abs(largest_adv['variance']):,.0f} adverse")
    if big_swings >= 2:
        score += 10; reasons.append(f"{big_swings} large movements")

    tier = "action" if score >= 50 else "watch" if score >= 20 else "healthy"

    return {
        "session_id": sid, "name": name, "sector": sector,
        "revenue": revenue_v, "op_profit": op_profit, "margin": margin,
        "profit_var": profit_var, "profit_var_pct": profit_pct,
        "cash": cash, "runway_months": runway, "burning": burning,
        "anomalies": big_swings, "tier": tier, "score": score,
        "reasons": reasons[:2] if reasons else ["On track"],
    }


@app.get("/api/portfolio/demo")
def portfolio_demo():
    """Build a demo NHS GP portfolio and return a month-end triage list."""
    clients = []

    # ── NHS GP standalone practice demo clients (for side-by-side comparison) ──
    # Shankly Surgery — healthy performer: low locum, growing GMS, solid surplus
    gp1 = _build_nhs_pcn_client(
        name="Shankly Surgery",
        list_size=7200, wte_partners=4.2,
        arrs_allocation=0.0, qof_entitlement=0.0,
        gms      = _ramp(85000, 300),
        qof      = [14500]*8 + [14500]*3 + [21000],
        es       = [8200,0,0,8200,0,0,8200,0,0,8200,0,0],
        arrs_ph  = _flat(0),
        arrs_sp  = _flat(0),
        clinical = _ramp(28000, 150),
        locum    = [1200,1400,1000,1200,1000,1400,1200,1800,1500,1200,1000,1400],
        admin_w  = _ramp(10500, 80),
        prac_mgr = _flat(5000),
        drawings = _flat(16500),
        rent     = _flat(5800),
        cash     = 265000,
    )
    # Dalglish Health Centre — stable, moderate locum, consistent margins
    gp2 = _build_nhs_pcn_client(
        name="Dalglish Health Centre",
        list_size=5800, wte_partners=3.5,
        arrs_allocation=0.0, qof_entitlement=0.0,
        gms      = _ramp(70000, 150),
        qof      = [11200]*8 + [11200]*3 + [16500],
        es       = [6500,0,0,6500,0,0,6500,0,0,6500,0,0],
        arrs_ph  = _flat(0),
        arrs_sp  = _flat(0),
        clinical = _ramp(23000, 80),
        locum    = [3200,3800,3500,3200,2900,3500,3200,5200,4200,3200,2900,3500],
        admin_w  = _ramp(9000, 50),
        prac_mgr = _flat(4500),
        drawings = _flat(13500),
        rent     = _flat(5200),
        cash     = 195000,
    )
    # Rush Medical Practice — escalating locum erodes margin, watch-tier
    gp3 = _build_nhs_pcn_client(
        name="Rush Medical Practice",
        list_size=4900, wte_partners=2.8,
        arrs_allocation=0.0, qof_entitlement=0.0,
        gms      = _ramp(58000, 50),
        qof      = [9200]*8 + [9200]*3 + [13800],
        es       = [5400,0,0,5400,0,0,5400,0,0,5400,0,0],
        arrs_ph  = _flat(0),
        arrs_sp  = _flat(0),
        clinical = _ramp(19000, 80),
        locum    = [2000,2500,3000,3500,4000,4500,5000,5500,4500,4000,4000,4500],
        admin_w  = _ramp(8200, 40),
        prac_mgr = _flat(3800),
        drawings = _flat(12500),
        rent     = _flat(4600),
        cash     = 145000,
    )
    # Paisley Road Practice — high volatile locum, declining GMS, action-tier
    gp4 = _build_nhs_pcn_client(
        name="Paisley Road Practice",
        list_size=3600, wte_partners=2.1,
        arrs_allocation=0.0, qof_entitlement=0.0,
        gms      = _ramp(44000, -100),
        qof      = [7200]*8 + [7200]*3 + [10800],
        es       = [4200,0,0,4200,0,0,4200,0,0,4200,0,0],
        arrs_ph  = _flat(0),
        arrs_sp  = _flat(0),
        clinical = _ramp(14000, 50),
        locum    = [4000,5500,4200,4000,4800,6200,4000,7000,5500,4000,4800,5200],
        admin_w  = _ramp(7000, 30),
        prac_mgr = _flat(3200),
        drawings = _flat(10000),
        rent     = _flat(4200),
        cash     = 85000,
    )
    clients.extend([gp1, gp2, gp3, gp4])

    # ── NHS GP PCN demo clients (Merseyside Neighbourhood) ──────────────────
    # Anfield PCN — large, healthy ARRS utilisation, good surplus/patient
    pcn1 = _build_nhs_pcn_client(
        name="Anfield PCN", sector="nhs_pcn",
        list_size=10200, wte_partners=5.5,
        arrs_allocation=138500.0, qof_entitlement=208000.0,
        gms      = _ramp(88000, 300),
        qof      = [17300]*8 + [17300]*3 + [25800],  # bump in Jun (year-end reconciliation)
        es       = [9200,0,0,9200,0,0,9200,0,0,9200,0,0],
        arrs_ph  = _flat(5800),
        arrs_sp  = _flat(3100),
        clinical = _ramp(32000, 200),
        locum    = [1800,2200,1500,1800,1600,2000,1800,3500,2800,1800,1500,2200],  # ~8% staff — healthy
        admin_w  = _ramp(11500, 100),
        prac_mgr = _flat(5200),
        drawings = _flat(27500),
        rent     = _flat(6200),
        cash     = 285000,
    )

    # Kensington PCN — medium, elevated locum dependency (watch-tier)
    pcn2 = _build_nhs_pcn_client(
        name="Kensington PCN", sector="nhs_pcn",
        list_size=7800, wte_partners=4.2,
        arrs_allocation=106000.0, qof_entitlement=159000.0,
        gms      = _ramp(72000, 150),
        qof      = [13200]*8 + [13200]*3 + [19800],
        es       = [7000,0,0,7000,0,0,7000,0,0,7000,0,0],
        arrs_ph  = _flat(4400),
        arrs_sp  = _flat(2400),
        clinical = _ramp(26000, 100),
        locum    = [8500,12000,9500,8500,7800,9200,8500,14000,11000,8500,7800,9500],  # ~22% — concern
        admin_w  = _ramp(9200, 50),
        prac_mgr = _flat(4600),
        drawings = _flat(21000),
        rent     = _flat(5400),
        cash     = 195000,
    )

    # Kirkby PCN — smaller, low ARRS utilisation (leaving money on table)
    pcn3 = _build_nhs_pcn_client(
        name="Kirkby PCN", sector="nhs_pcn",
        list_size=6100, wte_partners=3.2,
        arrs_allocation=82800.0, qof_entitlement=124500.0,
        gms      = _ramp(56000, 100),
        qof      = [10200]*8 + [10200]*3 + [15300],
        es       = [5500,0,0,5500,0,0,5500,0,0,5500,0,0],
        arrs_ph  = _flat(1800),  # only one ARRS role filled — 48% utilisation
        arrs_sp  = _flat(1400),
        clinical = _ramp(22000, 80),
        locum    = [2200,2200,1800,2200,1800,2200,2200,2200,1800,2200,1800,2200],
        admin_w  = _ramp(8000, 50),
        prac_mgr = _flat(3800),
        drawings = _flat(16000),
        rent     = _flat(4800),
        cash     = 158000,
    )

    pcn_clients = [pcn1, pcn2, pcn3]
    clients.extend(pcn_clients)
    clients.sort(key=lambda c: c["score"], reverse=True)

    # Build a demo neighbourhood rollup (no DB, computed in-memory)
    pcn_ids = [p["session_id"] for p in pcn_clients]
    pcn_summaries = [_nhs_client_summary(sid, name) for sid, name in
                     zip(pcn_ids, ["Anfield PCN", "Kensington PCN", "Kirkby PCN"])]
    pcn_summaries = [p for p in pcn_summaries if p]

    demo_neighbourhood = {
        "id":          "demo-neighbourhood-1",
        "name":        "Merseyside Neighbourhood",
        "client_ids":  pcn_ids,
        "has_share":   False,
        "share_token": None,
        "pcns":        pcn_summaries,
        "aggregate":   _aggregate_neighbourhood(pcn_summaries),
    }

    summary = {
        "total":         len(clients),
        "action":        sum(1 for c in clients if c["tier"] == "action"),
        "watch":         sum(1 for c in clients if c["tier"] == "watch"),
        "healthy":       sum(1 for c in clients if c["tier"] == "healthy"),
        "total_revenue": sum(c["revenue"] or 0 for c in clients),
        "burning":       sum(1 for c in clients if c["burning"]),
    }
    return {"clients": clients, "summary": summary, "neighbourhoods": [demo_neighbourhood]}


@app.get("/api/portfolio/clients")
def portfolio_list_clients(firm_token: str):
    """Return triage list for all real clients stored under a firm token."""
    if not firm_token:
        raise HTTPException(400, "firm_token is required.")
    with _db() as conn:
        rows = conn.execute(
            "SELECT id, name, sector, list_size, file_bytes, file_name, cash_balance, "
            "wte_partners, arrs_allocation, qof_entitlement, partner_drawings, "
            "created_at, updated_at "
            "FROM portfolio_clients WHERE firm_token = ? ORDER BY updated_at DESC",
            (firm_token,),
        ).fetchall()

    clients = []
    for row in rows:
        cid = row["id"]
        if cid not in SESSIONS:
            _rehydrate_client(cid, bytes(row["file_bytes"]), row["file_name"],
                              row["name"], row["cash_balance"], sector=row["sector"],
                              list_size=row["list_size"] or 0,
                              wte_partners=row["wte_partners"],
                              arrs_allocation=row["arrs_allocation"],
                              qof_entitlement=row["qof_entitlement"],
                              partner_drawings=row["partner_drawings"])
        summary = _score_session(cid, row["name"], row["sector"],
                                 row["cash_balance"], row["created_at"], row["updated_at"],
                                 list_size=row["list_size"] or 0)
        if summary:
            clients.append(summary)

    clients.sort(key=lambda c: c["score"], reverse=True)
    totals = {
        "total":         len(clients),
        "action":        sum(1 for c in clients if c["tier"] == "action"),
        "watch":         sum(1 for c in clients if c["tier"] == "watch"),
        "healthy":       sum(1 for c in clients if c["tier"] == "healthy"),
        "total_revenue": sum(c["revenue"] or 0 for c in clients),
        "burning":       sum(1 for c in clients if c["burning"]),
    }
    return {"clients": clients, "summary": totals}


@app.get("/api/portfolio/compare")
def portfolio_compare(session_ids: str):
    """Return 12-month trend data for multiple sessions for side-by-side comparison."""
    ids = [s.strip() for s in session_ids.split(",") if s.strip()]
    if not ids or len(ids) > 10:
        raise HTTPException(400, "Provide 1–10 session_ids.")

    months    = _PORTFOLIO_MONTHS
    practices = []

    for sid in ids:
        sess = SESSIONS.get(sid)
        if not sess:
            continue
        df: pd.DataFrame = sess.get("df")
        name = (sess.get("filename") or sid).replace(" — Demo", "")
        if df is None:
            continue

        month_cols = [m for m in months if m in df.columns]

        def _series(pattern, _df=df, _cols=month_cols):
            mask = _df["Account"].str.lower().str.contains(pattern, na=False, regex=True)
            rows = _df[mask]
            if rows.empty:
                return [0.0] * len(_cols)
            return [float(v) for v in rows.iloc[0][_cols].tolist()]

        revenue = _series("total turnover")
        surplus = _series("net surplus|operating profit")
        costs   = [r - s for r, s in zip(revenue, surplus)]

        latest_rev    = revenue[-1] if revenue else None
        latest_profit = surplus[-1] if surplus else None
        margin = (
            round(latest_profit / latest_rev * 100, 1)
            if latest_rev and latest_rev != 0 and latest_profit is not None
            else None
        )

        practices.append({
            "session_id": sid,
            "name":       name,
            "months":     month_cols,
            "revenue":    revenue,
            "costs":      costs,
            "surplus":    surplus,
            "kpis": {
                "revenue":   latest_rev,
                "total_cost": costs[-1] if costs else None,
                "op_profit": latest_profit,
                "margin":    margin,
            },
        })

    return {"practices": practices}


@app.post("/api/portfolio/clients")
async def portfolio_add_client(
    file:             UploadFile = File(...),
    firm_token:       str        = Form(...),
    name:             str        = Form(...),
    sector:           str        = Form("Other"),
    cash_balance:     float      = Form(0.0),
    list_size:        int        = Form(0),
    wte_partners:     float | None = Form(None),
    arrs_allocation:  float | None = Form(None),
    qof_entitlement:  float | None = Form(None),
    partner_drawings: float | None = Form(None),
):
    """Upload a real client P&L and add them to the firm's practice portfolio."""
    if not firm_token or not name:
        raise HTTPException(400, "firm_token and name are required.")
    ext = (file.filename or "").split(".")[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(400, "Only CSV and Excel files are supported.")

    contents  = await file.read(_MAX_UPLOAD_BYTES + 1)
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large. Maximum supported file size is 20 MB.")
    client_id = str(uuid.uuid4())
    now       = datetime.now(timezone.utc).isoformat()
    cash      = cash_balance if cash_balance else None
    ls        = max(0, int(list_size or 0))

    ok = _rehydrate_client(client_id, contents, file.filename or "upload", name, cash,
                           sector=sector, list_size=ls, wte_partners=wte_partners,
                           arrs_allocation=arrs_allocation, qof_entitlement=qof_entitlement,
                           partner_drawings=partner_drawings)
    if not ok:
        raise HTTPException(
            400,
            "Could not parse this file. Make sure it has Account, Section, and at least "
            "two monthly columns (e.g. 'Jan 2025', 'Feb 2025').",
        )

    with _db() as conn:
        conn.execute(
            "INSERT INTO portfolio_clients "
            "(id, firm_token, name, sector, file_bytes, file_name, cash_balance, list_size, "
            "wte_partners, arrs_allocation, qof_entitlement, partner_drawings, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (client_id, firm_token, name, sector, contents, file.filename, cash, ls,
             wte_partners, arrs_allocation, qof_entitlement, partner_drawings, now, now),
        )
        conn.commit()

    result = _score_session(client_id, name, sector, cash, now, now, list_size=ls)
    if not result:
        raise HTTPException(500, "Analysis succeeded but no periods were found in the file.")
    return result


@app.put("/api/portfolio/clients/{client_id}")
async def portfolio_update_client(
    client_id:        str,
    firm_token:       str        = Form(...),
    name:             str | None = Form(None),
    sector:           str | None = Form(None),
    cash_balance:     float      = Form(0.0),
    list_size:        int | None = Form(None),
    wte_partners:     float | None = Form(None),
    arrs_allocation:  float | None = Form(None),
    qof_entitlement:  float | None = Form(None),
    partner_drawings: float | None = Form(None),
    file:             UploadFile | None = File(None),
):
    """Re-upload or rename a client (re-runs analysis if a new file is provided)."""
    with _db() as conn:
        row = conn.execute(
            "SELECT firm_token, file_bytes, file_name, sector, list_size, "
            "wte_partners, arrs_allocation, qof_entitlement, partner_drawings "
            "FROM portfolio_clients WHERE id = ?",
            (client_id,),
        ).fetchone()
        if not row:
            raise HTTPException(404, "Client not found.")
        if row["firm_token"] != firm_token:
            raise HTTPException(403, "Not authorised.")

        now      = datetime.now(timezone.utc).isoformat()
        cash     = cash_balance if cash_balance else None
        contents = bytes(row["file_bytes"])
        fname    = row["file_name"]
        ls       = max(0, int(list_size)) if list_size is not None else (row["list_size"] or 0)
        sec      = sector or row["sector"]
        wte      = wte_partners     if wte_partners     is not None else row["wte_partners"]
        arrs     = arrs_allocation  if arrs_allocation  is not None else row["arrs_allocation"]
        qof      = qof_entitlement  if qof_entitlement  is not None else row["qof_entitlement"]
        drawings = partner_drawings if partner_drawings is not None else row["partner_drawings"]

        if file:
            ext = (file.filename or "").split(".")[-1].lower()
            if ext not in ("csv", "xlsx", "xls"):
                raise HTTPException(400, "Only CSV and Excel files are supported.")
            contents = await file.read(_MAX_UPLOAD_BYTES + 1)
            if len(contents) > _MAX_UPLOAD_BYTES:
                raise HTTPException(413, "File too large. Maximum supported file size is 20 MB.")
            fname    = file.filename or fname
            SESSIONS.pop(client_id, None)

        ok = _rehydrate_client(client_id, contents, fname, name or "Client", cash,
                               sector=sec, list_size=ls, wte_partners=wte,
                               arrs_allocation=arrs, qof_entitlement=qof,
                               partner_drawings=drawings)
        if not ok:
            raise HTTPException(400, "Could not parse the uploaded file.")

        updates = {
            "cash_balance": cash, "list_size": ls, "updated_at": now,
            "wte_partners": wte, "arrs_allocation": arrs,
            "qof_entitlement": qof, "partner_drawings": drawings,
        }
        if name:
            updates["name"] = name
        if sector:
            updates["sector"] = sector
        if file:
            updates["file_bytes"] = contents
            updates["file_name"]  = fname

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(
            f"UPDATE portfolio_clients SET {set_clause} WHERE id = ?",
            (*updates.values(), client_id),
        )
        conn.commit()

        row2 = conn.execute(
            "SELECT name, sector, list_size, cash_balance, created_at, updated_at FROM portfolio_clients WHERE id = ?",
            (client_id,),
        ).fetchone()

    return _score_session(client_id, row2["name"], row2["sector"],
                          row2["cash_balance"], row2["created_at"], row2["updated_at"],
                          list_size=row2["list_size"] or 0)


@app.delete("/api/portfolio/clients/{client_id}")
def portfolio_delete_client(client_id: str, firm_token: str):
    """Remove a client from the firm's portfolio."""
    with _db() as conn:
        row = conn.execute(
            "SELECT firm_token FROM portfolio_clients WHERE id = ?", (client_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Client not found.")
        if row["firm_token"] != firm_token:
            raise HTTPException(403, "Not authorised.")
        conn.execute("DELETE FROM portfolio_clients WHERE id = ?", (client_id,))
        conn.commit()
    SESSIONS.pop(client_id, None)
    return {"ok": True}


@app.post("/api/portfolio/briefing")
async def portfolio_briefing(firm_token: str, currency: str = "£"):
    """
    Generate a 2-sentence AI brief for every client in the firm's portfolio.
    Calls are made concurrently (one per client) to minimise total latency.
    Returns {session_id: "brief text"}.
    """
    import asyncio

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "OpenAI API key not configured on the server.")

    with _db() as conn:
        rows = conn.execute(
            "SELECT id, name, sector, list_size, file_bytes, file_name, cash_balance "
            "FROM portfolio_clients WHERE firm_token = ? ORDER BY updated_at DESC",
            (firm_token,),
        ).fetchall()

    if not rows:
        return {"briefs": {}}

    # Rehydrate any sessions that fell out of memory
    for row in rows:
        if row["id"] not in SESSIONS:
            _rehydrate_client(row["id"], bytes(row["file_bytes"]), row["file_name"],
                              row["name"], row["cash_balance"], sector=row["sector"],
                              list_size=row["list_size"] or 0)

    ai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    _sym = currency.strip()
    _cdesc = _currency_desc(currency)
    _BRIEF_SYSTEM = (
        f"You are an accounting practice manager reviewing a client's latest month-end figures. "
        "Write exactly 2 sentences. "
        f"Sentence 1: the headline financial result this month (revenue, profit, margin — be specific with {_sym} figures). "
        "Sentence 2: the single most important thing to raise with this client right now (a concern or a strong positive). "
        f"Format all currency values as {_sym}X,XXX ({_cdesc}). "
        "Be concise and direct. No bullet points. No markdown."
    )

    def _call_openai(name, sector, summary):
        from openai import OpenAI
        figures = [
            f"Revenue: {_sym}{summary['revenue']:,.0f}" if summary.get("revenue") else None,
            f"Op profit: {_sym}{summary['op_profit']:,.0f}" if summary.get("op_profit") is not None else None,
            f"Margin: {summary['margin']:.1f}%" if summary.get("margin") is not None else None,
            (f"vs prior: {summary['profit_var_pct']:+.1f}%" if summary.get("profit_var_pct") is not None else None),
            (f"Cash runway: {summary['runway_months']:.0f} months" if summary.get("runway_months") else None),
        ]
        user_msg = (
            f"Client: {name} ({sector})\n"
            + "\n".join(f for f in figures if f)
            + f"\nKey signals: {', '.join(summary.get('reasons', []))}"
        )
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": _BRIEF_SYSTEM},
                {"role": "user",   "content": user_msg},
            ],
            temperature=0.35,
            max_tokens=130,
        )
        return resp.choices[0].message.content.strip()

    async def brief_one(row):
        cid = row["id"]
        summary = _score_session(cid, row["name"], row["sector"],
                                 row["cash_balance"], None, None,
                                 list_size=row["list_size"] or 0)
        if not summary:
            return cid, None
        try:
            text = await asyncio.to_thread(_call_openai, row["name"], row["sector"], summary)
            return cid, text
        except Exception as exc:
            print(f"[Briefing] {cid}: {exc}", file=sys.stderr)
            return cid, None

    results = await asyncio.gather(*[brief_one(r) for r in rows])
    briefs = {cid: text for cid, text in results if text}
    return {"briefs": briefs}


# ─────────────────────────────────────────────────────────────────────────────
# NEIGHBOURHOODS — borough-level rollup across PCNs (firm mode, NHS GP)
#
# IMPORTANT: individual PCN Xero books are NEVER merged. A neighbourhood is
# just a named grouping of existing portfolio_clients rows; the rollup sums
# and averages each PCN's already-computed KPI figures side by side. Unlike
# /api/consolidate, no account-level data is combined across entities.
# ─────────────────────────────────────────────────────────────────────────────

def _nhs_client_summary(client_id: str, name: str) -> dict | None:
    """Compute one PCN's latest-period NHS summary for a neighbourhood rollup."""
    s = SESSIONS.get(client_id)
    if not s or s.get("analysis_type") != "month_on_month":
        return None
    analysis_m   = s.get("analysis_m")
    df_long_m    = s.get("df_long_m")
    kpi_accounts = s.get("kpi_accounts")
    if analysis_m is None or df_long_m is None:
        return None

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    if not periods_m:
        return None
    latest = periods_m[-1]
    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")

    kpis   = data.get("kpis", [])
    rev_k  = next((k for k in kpis if k.get("icon") == "trending-up"), None)
    cost_k = next((k for k in kpis if k.get("icon") == "receipt"), None)
    prof_k = next((k for k in kpis if k.get("icon") == "wallet"), None)

    revenue    = rev_k["value"]  if rev_k  else None
    total_cost = cost_k["value"] if cost_k else None
    surplus    = prof_k["value"] if prof_k else None

    list_size = s.get("list_size") or 0
    wte       = s.get("wte_partners")

    ytd_mvts = _nhs_ytd_movements(s, latest, "monthly")
    util = compute_utilisation(ytd_mvts, s.get("arrs_allocation"), s.get("qof_entitlement"))

    return {
        "client_id":            client_id,
        "name":                 name,
        "period_label":         period_label(latest, "monthly"),
        "list_size":            list_size,
        "wte_partners":         wte,
        "revenue":              revenue,
        "total_cost":           total_cost,
        "surplus":              surplus,
        "income_per_patient":   (revenue / list_size) if (revenue is not None and list_size) else None,
        "surplus_per_patient":  (surplus / list_size) if (surplus is not None and list_size) else None,
        "surplus_per_partner":  (surplus / wte) if (surplus is not None and wte) else None,
        "arrs_utilisation_pct": util["arrs"]["utilisation_pct"],
        "qof_achievement_pct":  util["qof"]["achievement_pct"],
    }


def _neighbourhood_rollup(client_ids: list[str], firm_token: str) -> dict:
    """Aggregate KPI summaries across the neighbourhood's PCNs without merging books."""
    if not client_ids:
        return {"pcns": [], "aggregate": _empty_neighbourhood_aggregate()}

    placeholders = ",".join("?" for _ in client_ids)
    with _db() as conn:
        rows = conn.execute(
            f"SELECT id, name, sector, list_size, file_bytes, file_name, cash_balance, "
            f"wte_partners, arrs_allocation, qof_entitlement, partner_drawings "
            f"FROM portfolio_clients WHERE id IN ({placeholders}) AND firm_token = ?",
            (*client_ids, firm_token),
        ).fetchall()

    pcns = []
    for row in rows:
        cid = row["id"]
        if cid not in SESSIONS:
            _rehydrate_client(cid, bytes(row["file_bytes"]), row["file_name"],
                              row["name"], row["cash_balance"], sector=row["sector"],
                              list_size=row["list_size"] or 0,
                              wte_partners=row["wte_partners"],
                              arrs_allocation=row["arrs_allocation"],
                              qof_entitlement=row["qof_entitlement"],
                              partner_drawings=row["partner_drawings"])
        summary = _nhs_client_summary(cid, row["name"])
        if summary:
            pcns.append(summary)

    return {"pcns": pcns, "aggregate": _aggregate_neighbourhood(pcns)}


def _empty_neighbourhood_aggregate() -> dict:
    return {
        "pcn_count": 0, "total_list_size": 0, "total_revenue": None,
        "total_cost": None, "total_surplus": None, "total_wte_partners": None,
        "income_per_patient": None, "surplus_per_patient": None,
        "avg_arrs_utilisation_pct": None, "avg_qof_achievement_pct": None,
    }


def _aggregate_neighbourhood(pcns: list[dict]) -> dict:
    if not pcns:
        return _empty_neighbourhood_aggregate()
    list_sizes = [p["list_size"] for p in pcns if p["list_size"]]
    revenues   = [p["revenue"] for p in pcns if p["revenue"] is not None]
    costs      = [p["total_cost"] for p in pcns if p["total_cost"] is not None]
    surpluses  = [p["surplus"] for p in pcns if p["surplus"] is not None]
    wtes       = [p["wte_partners"] for p in pcns if p["wte_partners"]]
    arrs_pcts  = [p["arrs_utilisation_pct"] for p in pcns if p["arrs_utilisation_pct"] is not None]
    qof_pcts   = [p["qof_achievement_pct"] for p in pcns if p["qof_achievement_pct"] is not None]

    total_list_size = sum(list_sizes)
    total_revenue   = sum(revenues) if revenues else None
    total_surplus   = sum(surpluses) if surpluses else None

    return {
        "pcn_count":                len(pcns),
        "total_list_size":          total_list_size,
        "total_revenue":            total_revenue,
        "total_cost":               sum(costs) if costs else None,
        "total_surplus":            total_surplus,
        "total_wte_partners":       sum(wtes) if wtes else None,
        "income_per_patient":       (total_revenue / total_list_size) if (total_revenue is not None and total_list_size) else None,
        "surplus_per_patient":      (total_surplus / total_list_size) if (total_surplus is not None and total_list_size) else None,
        "avg_arrs_utilisation_pct": (sum(arrs_pcts) / len(arrs_pcts)) if arrs_pcts else None,
        "avg_qof_achievement_pct":  (sum(qof_pcts) / len(qof_pcts)) if qof_pcts else None,
    }


class NeighbourhoodBody(BaseModel):
    firm_token: str
    name:       str = Field(min_length=1, max_length=200)
    client_ids: list[str] = Field(min_length=1, max_length=50)


@app.get("/api/portfolio/neighbourhoods")
def list_neighbourhoods(firm_token: str):
    if not firm_token:
        raise HTTPException(400, "firm_token is required.")
    with _db() as conn:
        rows = conn.execute(
            "SELECT id, name, client_ids, share_token, created_at, updated_at "
            "FROM neighbourhoods WHERE firm_token = ? ORDER BY updated_at DESC",
            (firm_token,),
        ).fetchall()

    out = []
    for row in rows:
        client_ids = json.loads(row["client_ids"])
        rollup = _neighbourhood_rollup(client_ids, firm_token)
        out.append({
            "id":          row["id"],
            "name":        row["name"],
            "client_ids":  client_ids,
            "has_share":   bool(row["share_token"]),
            "share_token": row["share_token"],
            "created_at":  row["created_at"],
            "updated_at":  row["updated_at"],
            "pcns":        rollup["pcns"],
            "aggregate":   rollup["aggregate"],
        })
    return {"neighbourhoods": out}


@app.post("/api/portfolio/neighbourhoods")
def create_neighbourhood(body: NeighbourhoodBody):
    if not body.firm_token:
        raise HTTPException(400, "firm_token is required.")
    placeholders = ",".join("?" for _ in body.client_ids)
    with _db() as conn:
        rows = conn.execute(
            f"SELECT id FROM portfolio_clients WHERE id IN ({placeholders}) AND firm_token = ?",
            (*body.client_ids, body.firm_token),
        ).fetchall()
        valid_ids = {r["id"] for r in rows}
        if not valid_ids:
            raise HTTPException(400, "None of the selected clients belong to this firm.")

        now = datetime.now(timezone.utc).isoformat()
        neighbourhood_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO neighbourhoods (id, firm_token, name, client_ids, share_token, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, NULL, ?, ?)",
            (neighbourhood_id, body.firm_token, body.name.strip(),
             json.dumps(sorted(valid_ids)), now, now),
        )
        conn.commit()

    rollup = _neighbourhood_rollup(sorted(valid_ids), body.firm_token)
    return {
        "id": neighbourhood_id, "name": body.name.strip(),
        "client_ids": sorted(valid_ids), "has_share": False, "share_token": None,
        "pcns": rollup["pcns"], "aggregate": rollup["aggregate"],
    }


@app.delete("/api/portfolio/neighbourhoods/{neighbourhood_id}")
def delete_neighbourhood(neighbourhood_id: str, firm_token: str):
    with _db() as conn:
        row = conn.execute(
            "SELECT firm_token FROM neighbourhoods WHERE id = ?", (neighbourhood_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Neighbourhood not found.")
        if row["firm_token"] != firm_token:
            raise HTTPException(403, "Not authorised.")
        conn.execute("DELETE FROM neighbourhoods WHERE id = ?", (neighbourhood_id,))
        conn.commit()
    return {"ok": True}


@app.post("/api/portfolio/neighbourhoods/{neighbourhood_id}/share")
def create_neighbourhood_share(neighbourhood_id: str, firm_token: str):
    """Generate (or rotate) the public portal access token for this neighbourhood.

    This token is a dedicated, revocable secret distinct from the existing
    unauthenticated /view/{session_id} share-link pattern, since the portal
    is intended for external organisations (e.g. partner NHS trusts).
    """
    with _db() as conn:
        row = conn.execute(
            "SELECT firm_token FROM neighbourhoods WHERE id = ?", (neighbourhood_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Neighbourhood not found.")
        if row["firm_token"] != firm_token:
            raise HTTPException(403, "Not authorised.")
        token = secrets.token_urlsafe(32)
        now   = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "UPDATE neighbourhoods SET share_token = ?, updated_at = ? WHERE id = ?",
            (token, now, neighbourhood_id),
        )
        conn.commit()
    return {"share_token": token}


@app.delete("/api/portfolio/neighbourhoods/{neighbourhood_id}/share")
def revoke_neighbourhood_share(neighbourhood_id: str, firm_token: str):
    with _db() as conn:
        row = conn.execute(
            "SELECT firm_token FROM neighbourhoods WHERE id = ?", (neighbourhood_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Neighbourhood not found.")
        if row["firm_token"] != firm_token:
            raise HTTPException(403, "Not authorised.")
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "UPDATE neighbourhoods SET share_token = NULL, updated_at = ? WHERE id = ?",
            (now, neighbourhood_id),
        )
        conn.commit()
    return {"ok": True}


@app.get("/api/portal/neighbourhood/{share_token}")
def get_neighbourhood_portal(share_token: str):
    """PUBLIC — no firm_token required. Looked up solely by the dedicated share
    token. Returns aggregate + per-PCN summary figures only: no raw P&L line
    items, no firm_token, and no internal session/client IDs that could be
    used to query other endpoints for a PCN's full underlying data.
    """
    with _db() as conn:
        row = conn.execute(
            "SELECT id, name, client_ids, updated_at FROM neighbourhoods WHERE share_token = ?",
            (share_token,),
        ).fetchone()
    if not row:
        raise HTTPException(404, "This link is invalid or has been revoked.")

    client_ids = json.loads(row["client_ids"])
    with _db() as conn:
        placeholders = ",".join("?" for _ in client_ids) if client_ids else "''"
        firm_row = conn.execute(
            f"SELECT firm_token FROM portfolio_clients WHERE id IN ({placeholders}) LIMIT 1",
            tuple(client_ids),
        ).fetchone() if client_ids else None
    firm_token = firm_row["firm_token"] if firm_row else ""

    rollup = _neighbourhood_rollup(client_ids, firm_token)
    public_pcns = [
        {k: v for k, v in p.items() if k != "client_id"} for p in rollup["pcns"]
    ]
    return {
        "name":       row["name"],
        "updated_at": row["updated_at"],
        "pcns":       public_pcns,
        "aggregate":  rollup["aggregate"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# DEMO — Budget vs Actual
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/demo-bva")
def demo_bva():
    """Return a fully-analysed full-year Budget vs Actual demo dataset for Meridian Software Ltd."""

    rows = [
        # (Account,                    Section,             Actual,    Budget)
        ("Software Licences",          "Turnover",          760_000,   740_000),
        ("Consulting Services",        "Turnover",          596_000,   640_000),
        ("Total Turnover",             "Turnover",        1_356_000, 1_380_000),
        ("Direct Delivery Costs",      "Cost of Sales",     271_300,   262_000),
        ("Total Cost of Sales",        "Cost of Sales",     271_300,   262_000),
        ("Gross Profit",               "Profit",          1_084_700, 1_118_000),
        ("Staff Wages",                "Staff Costs",       436_500,   420_000),
        ("Employer NI",                "Staff Costs",        48_500,    46_900),
        ("Pension Contributions",      "Staff Costs",        21_825,    21_000),
        ("Total Staff Costs",          "Staff Costs",       506_825,   487_900),
        ("Office Rent",                "Premises",          102_000,   102_000),
        ("Business Rates",             "Premises",           14_400,    14_400),
        ("Total Premises Costs",       "Premises",          116_400,   116_400),
        ("IT Software",                "IT",                 43_000,    40_000),
        ("IT Hardware",                "IT",                  5_700,     8_000),
        ("Total IT Costs",             "IT",                 48_700,    48_000),
        ("Online Marketing",           "Marketing",          68_800,    76_000),
        ("Paid Advertising",           "Marketing",          34_500,    40_000),
        ("Total Marketing",            "Marketing",         103_300,   116_000),
        ("Legal Expenses",             "Professional Fees",  14_050,    18_000),
        ("Accountancy",                "Professional Fees",  14_400,    14_400),
        ("Total Professional Fees",    "Professional Fees",  28_450,    32_400),
        ("Office Supplies",            "Office & Admin",      8_740,     9_200),
        ("Postage & Couriers",         "Office & Admin",      2_465,     2_500),
        ("Total Office & Admin",       "Office & Admin",     11_205,    11_700),
        ("Bank Charges",               "Finance",             2_400,     2_400),
        ("Loan Interest",              "Finance",            10_200,    10_200),
        ("Total Finance Costs",        "Finance",            12_600,    12_600),
        ("Depreciation",               "Depreciation",       26_400,    26_400),
        ("Total Depreciation",         "Depreciation",       26_400,    26_400),
        ("Operating Profit",           "Profit",            230_820,   266_600),
    ]

    df = pd.DataFrame(rows, columns=["Account", "Section", "Actual", "Budget"])

    bva_snapshot = build_bva(df, "Actual", "Budget")
    kpi_accounts = detect_kpis(df)

    session_id = str(uuid.uuid4())
    filename   = "Meridian Software Ltd — Demo (BvA)"
    SESSIONS[session_id] = {
        "df":            df,
        "bva_data":      bva_snapshot,
        "bva_long":      None,
        "bva_periods":   [],
        "kpi_accounts":  kpi_accounts,
        "filename":      filename,
        "analysis_type": "budget_vs_actual",
        "chat":          [],
    }

    data = get_bva_data(bva_snapshot, kpi_accounts, filename, bva_long=None)
    data["session_id"]            = session_id
    data["file_name"]             = filename
    data["available_bva_periods"] = []
    data["selected_bva_period"]   = "full_year"
    return data


# ─────────────────────────────────────────────────────────────────────────────
# DEMO — Xero-format (Apex Digital Ltd)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/demo-xero")
def demo_xero():
    """Return a fully-analysed 12-month demo dataset for Apex Digital Ltd (Xero-format account codes)."""

    months = [
        "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
        "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    ]

    # (Account, Section, [Jul..Jun values])
    rows = [
        # ── Revenue ──────────────────────────────────────────────────────────
        ("200 Digital Services Revenue", "Turnover",      [48000,42000,55000,61000,68000,58000,52000,56000,64000,53000,58000,65000]),
        ("205 Project Revenue",          "Turnover",      [18000,12000,22000,25000,30000,15000,20000,24000,35000,18000,22000,28000]),
        ("210 Retainer Income",          "Turnover",      [24000,24000,26000,26000,28000,28000,28000,30000,30000,30000,32000,32000]),
        ("Total Turnover",               "Turnover",      [90000,78000,103000,112000,126000,101000,100000,110000,129000,101000,112000,125000]),
        # ── Cost of Sales ─────────────────────────────────────────────────────
        ("300 Subcontractors",           "Cost of Sales", [22500,19500,25750,28000,31500,25250,25000,27500,32250,25250,28000,31250]),
        ("Total Cost of Sales",          "Cost of Sales", [22500,19500,25750,28000,31500,25250,25000,27500,32250,25250,28000,31250]),
        # ── Gross Profit ──────────────────────────────────────────────────────
        ("Gross Profit",                 "Profit",        [67500,58500,77250,84000,94500,75750,75000,82500,96750,75750,84000,93750]),
        # ── Staff Costs ───────────────────────────────────────────────────────
        ("400 Salaries & Wages",         "Staff Costs",   [36000,36000,37500,37500,40500,37500,37500,39000,39000,40500,40500,42000]),
        ("401 Employer NI",              "Staff Costs",   [4100,4100,4300,4300,4700,4300,4300,4500,4500,4700,4700,4900]),
        ("402 Pension Contributions",    "Staff Costs",   [1800,1800,1875,1875,2025,1875,1875,1950,1950,2025,2025,2100]),
        ("Total Staff Costs",            "Staff Costs",   [41900,41900,43675,43675,47225,43675,43675,45450,45450,47225,47225,49000]),
        # ── Premises ─────────────────────────────────────────────────────────
        ("420 Office Rent",              "Premises",      [8000]*12),
        ("421 Business Rates",           "Premises",      [1500]*12),
        ("Total Premises Costs",         "Premises",      [9500]*12),
        # ── IT ───────────────────────────────────────────────────────────────
        ("430 Software & Subscriptions", "IT",            [2200,2200,2400,2400,2600,3200,2400,2400,2600,2600,2600,2800]),
        ("Total IT Costs",               "IT",            [2200,2200,2400,2400,2600,3200,2400,2400,2600,2600,2600,2800]),
        # ── Marketing ────────────────────────────────────────────────────────
        ("440 Marketing & Business Development", "Marketing", [2500,1800,3000,3500,4500,2500,2000,3000,4000,2500,3000,4000]),
        ("Total Marketing",              "Marketing",     [2500,1800,3000,3500,4500,2500,2000,3000,4000,2500,3000,4000]),
        # ── Professional Fees ────────────────────────────────────────────────
        ("450 Legal & Professional",     "Professional Fees", [1000,500,800,1200,1500,1800,1000,800,1500,1000,600,900]),
        ("Total Professional Fees",      "Professional Fees", [1000,500,800,1200,1500,1800,1000,800,1500,1000,600,900]),
        # ── Finance Costs ────────────────────────────────────────────────────
        ("460 Bank & Finance Charges",   "Finance",       [300]*12),
        ("Total Finance Costs",          "Finance",       [300]*12),
        # ── Depreciation ─────────────────────────────────────────────────────
        ("470 Depreciation",             "Depreciation",  [1000]*12),
        ("Total Depreciation",           "Depreciation",  [1000]*12),
        # ── Operating Profit ─────────────────────────────────────────────────
        ("Operating Profit",             "Profit",        [9100,1300,16575,22425,27875,13775,15125,20050,32400,11625,19775,26250]),
    ]

    data_dict: dict = {"Account": [], "Section": []}
    for m in months:
        data_dict[m] = []

    for account, section, values in rows:
        data_dict["Account"].append(account)
        data_dict["Section"].append(section)
        for i, m in enumerate(months):
            data_dict[m].append(float(values[i]))

    df = pd.DataFrame(data_dict)

    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m)
    analysis_q   = build_analysis(df_long_q)

    session_id = str(uuid.uuid4())
    filename   = "Apex Digital Ltd — Demo (Xero)"
    SESSIONS[session_id] = {
        "df":            df,
        "df_long_m":     df_long_m,
        "df_long_q":     df_long_q,
        "analysis_m":    analysis_m,
        "analysis_q":    analysis_q,
        "kpi_accounts":  kpi_accounts,
        "filename":      filename,
        "analysis_type": "month_on_month",
        "chat":          [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    latest    = periods_m[-1]

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = filename
    return data


# ─────────────────────────────────────────────────────────────────────────────
# XERO OAUTH 2.0 INTEGRATION
# ─────────────────────────────────────────────────────────────────────────────
import html as _html
import secrets
import urllib.parse
import json

@app.get("/api/xero/status")
def xero_status():
    """Check if Xero credentials are configured."""
    return {"configured": bool(XERO_CLIENT_ID and XERO_CLIENT_SECRET)}


@app.get("/api/xero/auth")
def xero_auth():
    """Start Xero OAuth 2.0 flow — returns URL to redirect the user to."""
    if not XERO_CLIENT_ID or not XERO_CLIENT_SECRET:
        raise HTTPException(400, "Xero integration not configured. Set XERO_CLIENT_ID and XERO_CLIENT_SECRET.")
    state = secrets.token_urlsafe(32)
    XERO_TOKENS[state] = {"status": "pending"}
    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id":     XERO_CLIENT_ID,
        "redirect_uri":  XERO_REDIRECT_URI,
        "scope":         XERO_SCOPES,
        "state":         state,
    })
    return {"auth_url": f"https://login.xero.com/identity/connect/authorize?{params}", "state": state}


@app.get("/api/xero/callback")
async def xero_callback(code: str = "", state: str = "", error: str = ""):
    """Handle Xero OAuth callback — exchange code for tokens."""
    import httpx

    if error:
        safe_err = _html.escape(error)
        html_body = f"<html><body><h2>Xero authorisation failed</h2><p>{safe_err}</p><script>window.close()</script></body></html>"
        return Response(content=html_body, media_type="text/html")

    if state not in XERO_TOKENS:
        raise HTTPException(400, "Invalid OAuth state.")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://identity.xero.com/connect/token", data={
            "grant_type":    "authorization_code",
            "code":          code,
            "redirect_uri":  XERO_REDIRECT_URI,
            "client_id":     XERO_CLIENT_ID,
            "client_secret": XERO_CLIENT_SECRET,
        })
        if token_resp.status_code != 200:
            html_body = f"<html><body><h2>Token exchange failed</h2><p>{_html.escape(token_resp.text)}</p><script>window.close()</script></body></html>"
            return Response(content=html_body, media_type="text/html")

        tokens = token_resp.json()

        # Fetch connected tenants
        conn_resp = await client.get("https://api.xero.com/connections", headers={
            "Authorization": f"Bearer {tokens['access_token']}",
            "Content-Type":  "application/json",
        })
        tenants = conn_resp.json() if conn_resp.status_code == 200 else []

    XERO_TOKENS[state] = {
        "status":        "connected",
        "access_token":  tokens["access_token"],
        "refresh_token": tokens.get("refresh_token"),
        "expires_at":    datetime.utcnow().timestamp() + tokens.get("expires_in", 1800),
        "tenants":       tenants,
    }

    html = """<html><body style="font-family:system-ui;text-align:center;padding:60px">
    <h2 style="color:#0a7">Connected to Xero</h2>
    <p>You can close this window and return to MonthEndIQ.</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({type:'xero_connected',state:'""" + state + """'},'*');
      }
      setTimeout(()=>window.close(), 1500);
    </script>
    </body></html>"""
    return Response(content=html, media_type="text/html")


@app.get("/api/xero/tenants")
def xero_tenants(state: str):
    """Return connected Xero tenants for a given auth state."""
    tok = XERO_TOKENS.get(state)
    if not tok or tok.get("status") != "connected":
        raise HTTPException(400, "Not connected. Complete the OAuth flow first.")
    return {"tenants": [{"id": t["tenantId"], "name": t["tenantName"]} for t in tok.get("tenants", [])]}


def _parse_xero_balance_cash(report_json: dict) -> float | None:
    """Extract total cash/bank from a Xero BalanceSheet report. Best-effort."""
    try:
        reports = report_json.get("Reports", [])
        if not reports:
            return None
        rows = reports[0].get("Rows", [])

        def _num(cell_value):
            try:
                return float(str(cell_value).replace(",", "").replace("£", ""))
            except (TypeError, ValueError):
                return None

        for section in rows:
            title = (section.get("Title") or "").strip().lower()
            if section.get("RowType") == "Section" and ("bank" in title or "cash" in title):
                # Prefer the section's SummaryRow total (last cell)
                for r in section.get("Rows", []):
                    if r.get("RowType") == "SummaryRow":
                        cells = r.get("Cells", [])
                        if cells:
                            v = _num(cells[-1].get("Value"))
                            if v is not None:
                                return v
                # Fallback: sum the individual rows
                total, found = 0.0, False
                for r in section.get("Rows", []):
                    cells = r.get("Cells", [])
                    if len(cells) >= 2:
                        v = _num(cells[-1].get("Value"))
                        if v is not None:
                            total += v; found = True
                if found:
                    return total
        return None
    except Exception:
        return None


async def _fetch_xero_cash(client, access_token: str, tenant_id: str, as_at: str) -> float | None:
    """Fetch the BalanceSheet and return total cash. Never raises — returns None on any failure."""
    try:
        resp = await client.get(
            "https://api.xero.com/api.xro/2.0/Reports/BalanceSheet",
            params={"date": as_at},
            headers={
                "Authorization":  f"Bearer {access_token}",
                "Xero-Tenant-Id": tenant_id,
                "Accept":         "application/json",
            },
        )
        if resp.status_code != 200:
            return None
        return _parse_xero_balance_cash(resp.json())
    except Exception:
        return None


@app.get("/api/xero/import")
async def xero_import(state: str, tenant_id: str, from_date: str = "", to_date: str = ""):
    """Pull Profit & Loss from Xero and create an analysis session."""
    import httpx

    tok = XERO_TOKENS.get(state)
    if not tok or tok.get("status") != "connected":
        raise HTTPException(400, "Not connected to Xero.")

    access_token = tok["access_token"]

    # Default date range: 12 months ending this month
    if not to_date:
        today = datetime.utcnow()
        to_date = today.strftime("%Y-%m-%d")
    if not from_date:
        d = datetime.strptime(to_date, "%Y-%m-%d")
        from_date = (d.replace(year=d.year - 1) + timedelta(days=1)).strftime("%Y-%m-%d")

    # Fetch monthly P&L with separate periods (Xero max periods = 11)
    d_from = datetime.strptime(from_date, "%Y-%m-%d")
    d_to   = datetime.strptime(to_date, "%Y-%m-%d")
    n_months = (d_to.year - d_from.year) * 12 + (d_to.month - d_from.month)
    params = {
        "fromDate":   from_date,
        "toDate":     to_date,
        "periods":    min(max(n_months, 1), 11),
        "timeframe":  "MONTH",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss",
            params=params,
            headers={
                "Authorization":  f"Bearer {access_token}",
                "Xero-Tenant-Id": tenant_id,
                "Accept":         "application/json",
            },
        )
        if resp.status_code == 401:
            raise HTTPException(401, "Xero token expired. Please reconnect.")
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"Xero API error: {resp.text[:300]}")

        report = resp.json()

        # Also pull the balance sheet cash position (best-effort, non-fatal)
        xero_cash = await _fetch_xero_cash(client, access_token, tenant_id, to_date)

    # Parse Xero report into a wide DataFrame
    df = _parse_xero_pnl(report)
    if df is None or df.empty:
        raise HTTPException(400, "Could not parse the Xero P&L report. It may have no data for the selected period.")

    # Build analysis session
    df_long_m    = build_long(df, "monthly")
    df_long_q    = build_long(df, "quarterly")
    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m)
    analysis_q   = build_analysis(df_long_q)

    session_id = str(uuid.uuid4())
    tenant_name = next((t["tenantName"] for t in tok.get("tenants", []) if t["tenantId"] == tenant_id), "Xero")
    filename = f"{tenant_name} — Xero Import"

    SESSIONS[session_id] = {
        "df":            df,
        "df_long_m":     df_long_m,
        "df_long_q":     df_long_q,
        "analysis_m":    analysis_m,
        "analysis_q":    analysis_q,
        "kpi_accounts":  kpi_accounts,
        "filename":      filename,
        "analysis_type": "month_on_month",
        "xero_cash":     xero_cash,
        "chat":          [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    latest = periods_m[-1]
    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = filename
    data["xero_cash"]     = xero_cash
    return data


def _parse_xero_pnl(report_json: dict) -> pd.DataFrame | None:
    """Convert Xero's ProfitAndLoss report JSON into a wide DataFrame
    with columns: Account, Section, <month1>, <month2>, ...
    """
    reports = report_json.get("Reports", [])
    if not reports:
        return None
    report = reports[0]
    rows_out = report.get("Rows", [])
    if not rows_out:
        return None

    # Extract period column headers from the first Header row
    header_row = next((r for r in rows_out if r.get("RowType") == "Header"), None)
    if not header_row:
        return None
    cells = header_row.get("Cells", [])
    month_headers = []
    for c in cells[1:]:
        val = c.get("Value", "")
        if val:
            try:
                dt = pd.to_datetime(val)
                month_headers.append(dt.strftime("%b %Y"))
            except Exception:
                month_headers.append(val)
    if not month_headers:
        return None

    records: list[dict] = []
    current_section = ""

    def _walk_rows(rows, section=""):
        nonlocal current_section
        for row in rows:
            row_type = row.get("RowType", "")
            if row_type == "Section":
                section_title = row.get("Title", "") or section
                if section_title:
                    current_section = section_title
                inner_rows = row.get("Rows", [])
                _walk_rows(inner_rows, current_section)
            elif row_type == "Row":
                cells = row.get("Cells", [])
                if not cells:
                    continue
                account = cells[0].get("Value", "")
                if not account:
                    continue
                rec = {"Account": account, "Section": current_section}
                for j, hdr in enumerate(month_headers):
                    val = 0.0
                    if j + 1 < len(cells):
                        raw = cells[j + 1].get("Value", "0")
                        try:
                            val = float(str(raw).replace(",", ""))
                        except (ValueError, TypeError):
                            val = 0.0
                    rec[hdr] = val
                records.append(rec)
            elif row_type == "SummaryRow":
                cells = row.get("Cells", [])
                if not cells:
                    continue
                account = cells[0].get("Value", "")
                if not account:
                    continue
                rec = {"Account": account, "Section": current_section}
                for j, hdr in enumerate(month_headers):
                    val = 0.0
                    if j + 1 < len(cells):
                        raw = cells[j + 1].get("Value", "0")
                        try:
                            val = float(str(raw).replace(",", ""))
                        except (ValueError, TypeError):
                            val = 0.0
                    rec[hdr] = val
                records.append(rec)

    _walk_rows(rows_out)
    if not records:
        return None
    return pd.DataFrame(records)


# ─────────────────────────────────────────────────────────────────────────────
# UPLOAD
# ─────────────────────────────────────────────────────────────────────────────
def _friendly_upload_error(raw: str, mode: str) -> str:
    """Convert terse ValueError messages into actionable user-facing guidance."""
    msg = raw.lower()
    if "account" in msg and ("header" in msg or "column" in msg or "find" in msg):
        return (
            "Could not find an 'Account' column in your file.\n\n"
            "MonthEndIQ looks for a column named exactly 'Account' containing your P&L line names. "
            "Your file may use a different label (e.g. 'Description', 'GL Account', 'Nominal').\n\n"
            "Quick fix: rename that column to 'Account' and re-upload.\n\n"
            "Expected format (Month-on-Month):\n"
            "  Section | Account | Apr 2024 | May 2024 | Jun 2024 …\n\n"
            "Expected format (Budget vs Actual — single table):\n"
            "  Section | Account | Actual | Budget\n\n"
            "Expected format (Budget vs Actual — Excel workbook):\n"
            "  Two sheets named 'Actuals' and 'Budget', each with Section | Account | month columns."
        )
    if "month" in msg or "period" in msg or "date" in msg:
        return (
            "No monthly period columns detected.\n\n"
            "MonthEndIQ expects column headers in a recognisable date format "
            "such as 'Apr 2024', 'April 2024', '2024-04', or 'Apr-24'.\n\n"
            "Check that your file has at least two month columns after the Account column, "
            "and that the column headers are dates rather than text like 'Month 1', 'Period 1'."
        )
    return raw


_MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


# ─────────────────────────────────────────────────────────────────────────────
# NHS GP HELPERS
# ─────────────────────────────────────────────────────────────────────────────
_NHS_COMMENTARY_SUBS = [
    # More specific patterns first to avoid partial overlaps
    ("Operating profit", "Net Surplus"),
    ("Operating Profit", "Net Surplus"),
    ("operating profit", "net surplus"),
    ("Net profit",       "Net Surplus"),
    ("Net Profit",       "Net Surplus"),
    ("net profit",       "net surplus"),
    ("Revenue increased", "Income increased"),
    ("Revenue decreased", "Income decreased"),
    ("Revenue declined",  "Income declined"),
    ("Revenue grew",      "Income grew"),
    ("Revenue fell",      "Income fell"),
    ("revenue increased", "income increased"),
    ("revenue decreased", "income decreased"),
    (" revenue ",   " income "),
    (" Revenue ",   " Income "),
    (">Revenue<",   ">Income<"),
    (">Revenue ",   ">Income "),
    ("reduces profit",   "reduces surplus"),
    ("improves profit",  "improves surplus"),
    ("improved profit",  "improved surplus"),
    ("reducing profit",  "reducing surplus"),
    (" profit.",  " surplus."),
    (" profit,",  " surplus,"),
    (" profit<",  " surplus<"),
    (" profit ",  " surplus "),
    (" Profit.",  " Surplus."),
    (" Profit<",  " Surplus<"),
    (" Profit ",  " Surplus "),
]


def _adapt_commentary_for_nhs(commentary: list[dict]) -> list[dict]:
    """Rewrite auto-commentary using NHS GP terminology (Income, Surplus) in-place clone."""
    result = []
    for c in commentary:
        html = c.get("html", "")
        for old, new in _NHS_COMMENTARY_SUBS:
            html = html.replace(old, new)
        result.append({**c, "html": html})
    return result


def _nhs_ytd_movements(session: dict, selected_period, mode: str = "monthly") -> list[dict]:
    """Return all non-subtotal movements from period-start through selected_period.

    Used for ARRS/QOF utilisation so the numbers reflect cumulative annual spend
    rather than a single period's top-15 movements.
    """
    analysis = session.get("analysis_m") if mode in ("monthly", "ytd") else session.get("analysis_q")
    if analysis is None:
        return []
    try:
        sel_ts = pd.Timestamp(selected_period)
        ytd_mask = (
            (~analysis["Is Subtotal"]) &
            (analysis["Period"].apply(pd.Timestamp) <= sel_ts)
        )
        subset = analysis[ytd_mask]
        return [
            {"account": row["Account"], "category": row["Category"],
             "value": float(row["Value"])}
            for _, row in subset.iterrows()
        ]
    except Exception:
        return []


@app.post("/api/upload")
async def upload(
    file:              UploadFile = File(...),
    mode:              str        = "month_on_month",
    sector:            str        = Form("general"),
    list_size:         int        = Form(0),
    wte_partners:      float      = Form(0.0),
    arrs_allocation:   float      = Form(0.0),
    qof_entitlement:   float      = Form(0.0),
    partner_drawings:  float      = Form(0.0),
):
    if not file.filename:
        raise HTTPException(400, "No filename provided.")
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(400, "Only CSV and Excel files are supported.")
    contents = await file.read(_MAX_UPLOAD_BYTES + 1)
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large. Maximum supported file size is 20 MB.")

    # ── Budget vs Actual path ─────────────────────────────────────────────
    if mode == "budget_vs_actual":
        bva_snapshot = None
        df_for_kpis  = None

        # Try multi-sheet detection first (Excel workbooks with Actuals + Budget sheets)
        if ext in ("xlsx", "xls"):
            try:
                df_actual, df_budget = load_bva_from_sheets(contents, file.filename)
                bva_long = build_bva_long_from_sheets(df_actual, df_budget)

                # Aggregate all periods into a single snapshot for the dashboard
                agg = (
                    bva_long
                    .groupby(["Account", "Section", "Category", "Is Subtotal"], as_index=False)
                    [["Actual", "Budget"]].sum()
                )
                agg["Variance"]     = agg["Actual"] - agg["Budget"]
                agg["Variance %"]   = agg.apply(
                    lambda r: (r["Variance"] / r["Budget"] * 100) if r["Budget"] != 0 else None,
                    axis=1,
                )
                agg["Abs Variance"] = agg["Variance"].abs()

                bva_snapshot = agg
                df_for_kpis  = df_actual
                bva_long_store = bva_long   # keep for per-period filtering
                print(
                    f"[Upload] Multi-sheet BvA: {bva_long['Period'].nunique()} periods, "
                    f"{df_actual['Account'].nunique()} accounts",
                    file=sys.stderr,
                )
            except Exception as e:
                print(f"[Upload] Multi-sheet BvA failed, trying single-column: {e}", file=sys.stderr)
                bva_long_store = None

        # Fall back to single-column Actual/Budget format
        if bva_snapshot is None:
            bva_long_store = None
            try:
                df = load_file(contents, file.filename)
            except ValueError as e:
                raise HTTPException(400, _friendly_upload_error(str(e), mode))
            df["Account"] = df["Account"].astype(str).str.strip()
            df["Section"] = df["Section"].astype(str).replace("nan", "").fillna("")
            df = df[df["Account"].notna() & (df["Account"] != "") & (df["Account"].str.lower() != "nan")]
            actual_col, budget_col = detect_bva_columns(df)
            if not actual_col or not budget_col:
                raise HTTPException(
                    400,
                    "Budget vs Actual — no Actual/Budget columns found.\n\n"
                    "MonthEndIQ expects one of these formats:\n"
                    "• Excel workbook with separate sheets named 'Actuals' and 'Budget'\n"
                    "• A single table with columns named 'Actual' (or 'Actuals') and 'Budget'\n\n"
                    "Your file has these columns: "
                    + ", ".join(f"'{c}'" for c in df.columns[:10])
                )
            bva_snapshot = build_bva(df, actual_col, budget_col)
            df_for_kpis  = df
            print(f"[Upload] Single-column BvA: actual='{actual_col}', budget='{budget_col}'", file=sys.stderr)

        # Derive the sorted list of available periods (empty for single-column)
        bva_periods = (
            sorted(bva_long_store["Period"].unique())
            if bva_long_store is not None else []
        )

        kpi_accounts = detect_kpis(df_for_kpis)
        session_id = str(uuid.uuid4())
        SESSIONS[session_id] = {
            "df"               : df_for_kpis,
            "bva_data"         : bva_snapshot,
            "bva_long"         : bva_long_store,
            "bva_periods"      : bva_periods,
            "kpi_accounts"     : kpi_accounts,
            "filename"         : file.filename,
            "analysis_type"    : "budget_vs_actual",
            "sector"           : sector,
            "list_size"        : list_size,
            "wte_partners"     : wte_partners or None,
            "arrs_allocation"  : arrs_allocation or None,
            "qof_entitlement"  : qof_entitlement or None,
            "partner_drawings" : partner_drawings or None,
            "chat"             : [],
        }
        data = get_bva_data(bva_snapshot, kpi_accounts, file.filename, bva_long=bva_long_store)
        data["session_id"]            = session_id
        data["file_name"]             = file.filename
        data["available_bva_periods"] = [str(ts)[:10] for ts in bva_periods]
        data["selected_bva_period"]   = "full_year"
        data["sector"]                = sector
        data["list_size"]             = list_size
        # Persist so share links survive server restarts
        try:
            with _db() as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO sessions "
                    "(id, file_bytes, file_name, analysis_type, xero_cash, created_at, "
                    " sector, list_size, wte_partners, arrs_allocation, qof_entitlement, partner_drawings) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                    (session_id, contents, file.filename, "budget_vs_actual", None,
                     datetime.now(timezone.utc).isoformat(),
                     sector, list_size, wte_partners or None, arrs_allocation or None,
                     qof_entitlement or None, partner_drawings or None),
                )
                conn.commit()
        except Exception as exc:
            print(f"[Upload] persist BvA session: {exc}", file=sys.stderr)
        return data

    # ── Month-on-Month path (default) ─────────────────────────────────────
    try:
        df = load_file(contents, file.filename)
    except ValueError as e:
        raise HTTPException(400, _friendly_upload_error(str(e), mode))

    df["Account"] = df["Account"].astype(str).str.strip()
    df["Section"] = df["Section"].astype(str).replace("nan", "").fillna("")
    df = df[df["Account"].notna() & (df["Account"] != "") & (df["Account"].str.lower() != "nan")]

    try:
        df_long_m = build_long(df, "monthly")
        df_long_q = build_long(df, "quarterly")
    except ValueError as e:
        raise HTTPException(400, str(e))

    kpi_accounts    = detect_kpis(df_long_m)
    sector_synonyms = load_sector_synonyms(sector) if sector != "general" else None
    analysis_m      = build_analysis(df_long_m, sector_synonyms)
    analysis_q      = build_analysis(df_long_q, sector_synonyms)

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "df"               : df,
        "df_long_m"        : df_long_m,
        "df_long_q"        : df_long_q,
        "analysis_m"       : analysis_m,
        "analysis_q"       : analysis_q,
        "kpi_accounts"     : kpi_accounts,
        "filename"         : file.filename,
        "analysis_type"    : "month_on_month",
        "sector"           : sector,
        "list_size"        : list_size,
        "wte_partners"     : wte_partners or None,
        "arrs_allocation"  : arrs_allocation or None,
        "qof_entitlement"  : qof_entitlement or None,
        "partner_drawings" : partner_drawings or None,
        "chat"             : [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    if not len(periods_m):
        raise HTTPException(400, "No valid periods found in the file.")
    latest = periods_m[-1]

    # Persist so share links survive server restarts
    try:
        with _db() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO sessions "
                "(id, file_bytes, file_name, analysis_type, xero_cash, created_at, "
                " sector, list_size, wte_partners, arrs_allocation, qof_entitlement, partner_drawings) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (session_id, contents, file.filename, "month_on_month", None,
                 datetime.now(timezone.utc).isoformat(),
                 sector, list_size, wte_partners or None, arrs_allocation or None,
                 qof_entitlement or None, partner_drawings or None),
            )
            conn.commit()
    except Exception as exc:
        print(f"[Upload] persist MoM session: {exc}", file=sys.stderr)

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    _overlay_edited_commentary(SESSIONS[session_id], data, latest)
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = file.filename
    data["sector"]        = sector
    data["list_size"]     = list_size
    if sector == "nhs_gp":
        movements = data.get("movements", [])
        for m in movements:
            m["is_locum"] = is_locum_account(m.get("account", ""))
        data["workforce_breakdown"] = compute_workforce_breakdown(movements)
        # YTD movements give accurate annual ARRS/QOF totals vs annual allocations
        ytd_mvts = _nhs_ytd_movements(SESSIONS[session_id], latest, "monthly")
        util = compute_utilisation(ytd_mvts, arrs_allocation or None, qof_entitlement or None)
        data["nhs_utilisation"] = util
        data["commentary"] = _adapt_commentary_for_nhs(data.get("commentary", []))
        if list_size:
            nhs = compute_nhs_kpis(data, list_size, wte_partners or None)
            nhs.update(util)
            data["nhs_kpis"]      = nhs
            data["nhs_kpi_cards"] = nhs_kpi_cards(nhs)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# DATA (period change)
# ─────────────────────────────────────────────────────────────────────────────
_QUARTER_MONTHS: dict[str, set[int]] = {
    "q1": {1, 2, 3},
    "q2": {4, 5, 6},
    "q3": {7, 8, 9},
    "q4": {10, 11, 12},
}
_QUARTER_LABELS: dict[str, str] = {
    "q1": "Q1 (Jan–Mar)",
    "q2": "Q2 (Apr–Jun)",
    "q3": "Q3 (Jul–Sep)",
    "q4": "Q4 (Oct–Dec)",
}


def _agg_bva_df(df_periods: pd.DataFrame) -> pd.DataFrame:
    """Sum Actual/Budget across multiple BvA periods and recompute derived columns."""
    agg = (
        df_periods
        .groupby(["Account", "Section", "Category", "Is Subtotal"], as_index=False)
        [["Actual", "Budget"]].sum()
    )
    agg["Variance"]     = agg["Actual"] - agg["Budget"]
    agg["Variance %"]   = agg.apply(
        lambda r: (r["Variance"] / r["Budget"] * 100) if r["Budget"] != 0 else None,
        axis=1,
    )
    agg["Abs Variance"] = agg["Variance"].abs()
    return agg


def _resolve_bva_period_label(period: str) -> str:
    """Return a human-readable label for a BvA period string."""
    if not period or period in ("full_year", "budget_vs_actual"):
        return "Full Year"
    if period in _QUARTER_LABELS:
        return _QUARTER_LABELS[period]
    try:
        return pd.Timestamp(period).strftime("%B %Y")
    except Exception:
        return str(period)


@app.get("/api/data/{session_id}")
def get_data(session_id: str, period: str | None = None, mode: str = "monthly"):
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    # ── Budget vs Actual sessions ────────────────────────────────────────
    if s.get("analysis_type") == "budget_vs_actual":
        bva_long    = s.get("bva_long")
        bva_periods = s.get("bva_periods", [])
        df_to_use   = s["bva_data"]          # default: full-year aggregate
        sel_period  = "full_year"

        if period and period != "full_year" and bva_long is not None:
            if period in _QUARTER_MONTHS:
                # Quarter: aggregate all months in this calendar quarter
                months = _QUARTER_MONTHS[period]
                matching = [ts for ts in bva_periods if pd.Timestamp(ts).month in months]
                if matching:
                    df_to_use  = _agg_bva_df(
                        bva_long[bva_long["Period"].isin(matching)].drop(columns=["Period"])
                    )
                    sel_period = period
            else:
                # Single month
                target_ts = next(
                    (ts for ts in bva_periods if str(ts)[:10] == period[:10]),
                    None,
                )
                if target_ts is not None:
                    df_filt = bva_long[bva_long["Period"] == target_ts].drop(columns=["Period"]).copy()
                    df_filt["Abs Variance"] = df_filt["Variance"].abs()
                    df_to_use  = df_filt
                    sel_period = period

        data = get_bva_data(df_to_use, s["kpi_accounts"], s["filename"], bva_long=bva_long)
        data["session_id"]            = session_id
        data["file_name"]             = s["filename"]
        data["available_bva_periods"] = [str(ts)[:10] for ts in bva_periods]
        data["selected_bva_period"]   = sel_period
        return data

    # ── Month-on-Month ────────────────────────────────────────────────────
    # ── YTD ──────────────────────────────────────────────────────────────────
    if mode == "ytd":
        analysis_m   = s["analysis_m"]
        kpi_accounts = s["kpi_accounts"]
        periods_m    = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
        if not periods_m:
            raise HTTPException(400, "No periods found.")
        selected_ytd = None
        if period:
            for p in periods_m:
                if str(p)[:10] == str(period)[:10] or period_label(p, "monthly") == period:
                    selected_ytd = p
                    break
        if selected_ytd is None:
            selected_ytd = periods_m[-1]
        data = get_ytd_data(analysis_m, selected_ytd, kpi_accounts)
        data["analysis_type"]   = "month_on_month"
        data["session_id"]      = session_id
        data["file_name"]       = s["filename"]
        data["periods"]         = [str(p) for p in periods_m]
        data["selected_period"] = str(selected_ytd)
        return data

    analysis = s["analysis_m"] if mode == "monthly" else s["analysis_q"]
    df_long  = s["df_long_m"]  if mode == "monthly" else s["df_long_q"]
    kpi_accounts = s["kpi_accounts"]

    sort_key = (lambda p: pd.Timestamp(p)) if mode == "monthly" else quarter_sort_key
    periods  = sorted(analysis["Period"].unique(), key=sort_key)
    if not periods:
        raise HTTPException(400, "No periods found.")

    selected = None
    if period:
        for p in periods:
            if str(p) == period or period_label(p, mode) == period:
                selected = p
                break
    if selected is None:
        selected = periods[-1]

    data = get_period_data(analysis, df_long, selected, kpi_accounts, mode)
    _overlay_edited_commentary(s, data, selected)
    data["analysis_type"]   = "month_on_month"
    data["session_id"]      = session_id
    data["file_name"]       = s["filename"]
    data["periods"]         = [str(p) for p in periods]
    data["period_labels"]   = [period_label(p, mode) for p in periods]
    data["selected_period"] = str(selected)
    data["sector"]          = s.get("sector", "general")
    data["list_size"]       = s.get("list_size", 0)

    if s.get("sector") == "nhs_gp":
        movements = data.get("movements", [])

        # Flag locum accounts in movements
        for m in movements:
            m["is_locum"] = is_locum_account(m.get("account", ""))

        # Workforce breakdown — per selected period (correct: shows current staffing mix)
        data["workforce_breakdown"] = compute_workforce_breakdown(movements)

        # ARRS + QOF utilisation — YTD so numbers compare annual spend vs annual allocation
        ytd_mvts = _nhs_ytd_movements(s, selected, mode)
        util = compute_utilisation(ytd_mvts, s.get("arrs_allocation"), s.get("qof_entitlement"))
        data["nhs_utilisation"] = util

        # NHS-adapted commentary
        data["commentary"] = _adapt_commentary_for_nhs(data.get("commentary", []))

        # Per-patient KPIs
        if s.get("list_size"):
            nhs = compute_nhs_kpis(data, s["list_size"], s.get("wte_partners"))
            nhs.update(util)           # merge utilisation into kpis dict for cards
            data["nhs_kpis"]      = nhs
            data["nhs_kpi_cards"] = nhs_kpi_cards(nhs)

    return data


# ─────────────────────────────────────────────────────────────────────────────
# SESSION SETTINGS (post-upload NHS / sector params update)
# ─────────────────────────────────────────────────────────────────────────────
class SessionSettingsBody(BaseModel):
    list_size:        int   | None = None
    wte_partners:     float | None = None
    arrs_allocation:  float | None = None
    qof_entitlement:  float | None = None
    partner_drawings: float | None = None


@app.patch("/api/session/{session_id}/settings")
def update_session_settings(session_id: str, body: SessionSettingsBody):
    """Update NHS / sector parameters for an existing session without re-uploading."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    if body.list_size is not None:
        s["list_size"] = body.list_size
    if body.wte_partners is not None:
        s["wte_partners"] = body.wte_partners or None
    if body.arrs_allocation is not None:
        s["arrs_allocation"] = body.arrs_allocation or None
    if body.qof_entitlement is not None:
        s["qof_entitlement"] = body.qof_entitlement or None
    if body.partner_drawings is not None:
        s["partner_drawings"] = body.partner_drawings or None

    # Persist updated values to SQLite
    try:
        with _db() as conn:
            conn.execute(
                "UPDATE sessions SET list_size=?, wte_partners=?, arrs_allocation=?, "
                "qof_entitlement=?, partner_drawings=? WHERE id=?",
                (s.get("list_size", 0), s.get("wte_partners"),
                 s.get("arrs_allocation"), s.get("qof_entitlement"),
                 s.get("partner_drawings"), session_id),
            )
            conn.commit()
    except Exception as exc:
        print(f"[Settings] persist {session_id}: {exc}", file=sys.stderr)

    return {
        "ok": True,
        "list_size":        s.get("list_size", 0),
        "wte_partners":     s.get("wte_partners"),
        "arrs_allocation":  s.get("arrs_allocation"),
        "qof_entitlement":  s.get("qof_entitlement"),
        "partner_drawings": s.get("partner_drawings"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# FINANCIAL CONTEXT BUILDER
# ─────────────────────────────────────────────────────────────────────────────
def _build_financial_context(session: dict, selected_period, mode: str, currency_sym: str = "£") -> str:
    """
    Build a structured financial context string for the OpenAI system prompt.
    Includes analysis type header, KPIs, profit drivers/waterfall, revenue split,
    expense split, account-level movements, and rule-engine commentary.
    """
    analysis_type = session.get("analysis_type", "month_on_month")

    # ── Budget vs Actual context ──────────────────────────────────────────
    if analysis_type == "budget_vs_actual":
        # Use period-filtered data when a specific period is requested
        bva_df = session["bva_data"]
        bva_long = session.get("bva_long")
        bva_periods = session.get("bva_periods", [])
        if selected_period and selected_period not in ("budget_vs_actual", "full_year") and bva_long is not None:
            target_ts = next(
                (ts for ts in bva_periods if str(ts)[:10] == str(selected_period)[:10]),
                None,
            )
            if target_ts is not None:
                df_filt = bva_long[bva_long["Period"] == target_ts].drop(columns=["Period"]).copy()
                df_filt["Abs Variance"] = df_filt["Variance"].abs()
                bva_df = df_filt

        data         = get_bva_data(bva_df, session["kpi_accounts"], session["filename"], bva_long=bva_long)
        kpi_accounts = session["kpi_accounts"]
        wf           = data.get("waterfall")

        _sym = currency_sym.strip()

        def _f(v):
            if v is None: return "n/a"
            try:
                fv = float(v)
            except (TypeError, ValueError):
                return "n/a"
            if pd.isna(fv): return "n/a"
            return f"-{_sym}{abs(fv):,.0f}" if fv < 0 else f"{_sym}{fv:,.0f}"

        def _fs(v):
            if v is None: return "n/a"
            try:
                fv = float(v)
            except (TypeError, ValueError):
                return "n/a"
            if pd.isna(fv): return "n/a"
            prefix = "+" if fv >= 0 else ""
            return f"{prefix}{_sym}{fv:,.0f}" if fv >= 0 else f"-{_sym}{abs(fv):,.0f}"

        bva_period_label = _resolve_bva_period_label(selected_period)

        lines = [
            "ANALYSIS CONTEXT:",
            "  Analysis Type : Budget vs Actual",
            f"  Period        : {bva_period_label}",
            "  Comparison    : Actual performance vs Budget",
            "  Variance      : Actual − Budget (positive = above budget, negative = below budget)",
            "  Favourable    : Revenue above budget OR costs below budget",
            "  Adverse       : Revenue below budget OR costs above budget",
            "",
            f"FILE: {session['filename']}",
            "",
            "KEY PERFORMANCE INDICATORS (Actual vs Budget):",
        ]
        for k in data.get("kpis", []):
            if k.get("pct_only"):
                pct = k.get("pct")
                lines.append(
                    f"  Profit vs Budget %: {pct:+.1f}%" if pct is not None else "  Profit vs Budget %: n/a"
                )
            else:
                var_str = ""
                if k.get("variance") is not None:
                    fav = "FAVOURABLE" if k.get("is_fav") else "ADVERSE"
                    pct_part = f" ({k['pct']:+.1f}%)" if k.get("pct") is not None else ""
                    var_str = f", variance: {_fs(k['variance'])}{pct_part} [{fav}]"
                bud_str = f", budget: {_f(k.get('prior'))}" if k.get("prior") is not None else ""
                lines.append(f"  {k['label']}: actual {_f(k.get('value'))}{bud_str}{var_str}")

        if wf:
            lines += [
                "",
                "PROFIT DRIVERS — Actual vs Budget:",
                f"  Budget Operating Profit : {_f(wf['prior_profit'])}",
                f"  Actual Operating Profit : {_f(wf['current_profit'])}",
                f"  Net Variance            : {_fs(wf['net_change'])}",
                "  Category profit impacts (positive = above budget, negative = below budget):",
            ]
            for b in wf["bars"]:
                direction = "FAVOURABLE" if b["fav"] else "ADVERSE"
                lines.append(f"    {b['label']}: {_fs(b['impact'])} [{direction}]")

        for m in data.get("movements", [])[:20]:
            fav_str  = "FAVOURABLE" if m.get("is_fav") else "ADVERSE"
            pct_part = f" ({m['variance_pct']:+.1f}%)" if m.get("variance_pct") is not None else ""
            lines.append(
                f"  {m['account']} [{m['category']}]: "
                f"actual {_f(m.get('value'))}, budget {_f(m.get('prior_value'))}, "
                f"variance {_fs(m.get('variance'))}{pct_part} [{fav_str}]"
            )

        return "\n".join(lines)

    # ── Month-on-Month context ────────────────────────────────────────────
    analysis     = session["analysis_m"] if mode == "monthly" else session["analysis_q"]
    df_long      = session["df_long_m"]  if mode == "monthly" else session["df_long_q"]
    kpi_accounts = session["kpi_accounts"]

    data = get_period_data(analysis, df_long, selected_period, kpi_accounts, mode)
    wf   = data.get("waterfall")
    lbl  = data["period"]["label"]
    prior_lbl = data["period"]["prior"]
    mom_mode_label = "Month-on-Month" if mode == "monthly" else "Quarter-on-Quarter"

    # ── formatters ──────────────────────────────────────────────────────────
    _sym = currency_sym.strip()

    def _f(v):
        if v is None:
            return "n/a"
        try:
            fv = float(v)
        except (TypeError, ValueError):
            return "n/a"
        if pd.isna(fv):
            return "n/a"
        return f"-{_sym}{abs(fv):,.0f}" if fv < 0 else f"{_sym}{fv:,.0f}"

    def _fs(v):
        if v is None:
            return "n/a"
        try:
            fv = float(v)
        except (TypeError, ValueError):
            return "n/a"
        if pd.isna(fv):
            return "n/a"
        prefix = "+" if fv >= 0 else ""
        return f"{prefix}{_sym}{fv:,.0f}" if fv >= 0 else f"-{_sym}{abs(fv):,.0f}"

    # ── assemble context ─────────────────────────────────────────────────────
    lines = [
        "ANALYSIS CONTEXT:",
        f"  Analysis Type   : {mom_mode_label} P&L Variance",
        f"  Current Period  : {lbl}",
        f"  Prior Period    : {prior_lbl}",
        "  Variance        : Current − Prior (positive = increase, negative = decrease)",
        "  Favourable      : Revenue increase OR cost decrease",
        "  Adverse         : Revenue decrease OR cost increase",
        "",
        f"FILE: {session['filename']}",
        f"SELECTED PERIOD: {lbl}",
        f"PRIOR PERIOD: {prior_lbl}",
        "",
        "KEY PERFORMANCE INDICATORS:",
    ]

    for k in data.get("kpis", []):
        if k.get("pct_only"):
            pct = k.get("pct")
            lines.append(
                f"  Profit Variance %: {pct:+.1f}% vs prior period"
                if pct is not None else "  Profit Variance %: n/a"
            )
        else:
            var_str = ""
            if k.get("variance") is not None:
                fav = "FAVOURABLE" if k.get("is_fav") else "ADVERSE"
                pct_part = f" ({k['pct']:+.1f}%)" if k.get("pct") is not None else ""
                var_str = f", variance: {_fs(k['variance'])}{pct_part} [{fav}]"
            pri_str = f", prior: {_f(k.get('prior'))}" if k.get("prior") is not None else ""
            lines.append(f"  {k['label']}: {_f(k.get('value'))}{pri_str}{var_str}")

    # Waterfall / profit drivers
    if wf:
        lines += [
            "",
            f"PROFIT DRIVERS — {lbl} vs {prior_lbl}:",
            f"  Prior Operating Profit : {_f(wf['prior_profit'])}",
            f"  Current Operating Profit: {_f(wf['current_profit'])}",
            f"  Net Change             : {_fs(wf['net_change'])}",
            "  Category profit impacts (positive = improved profit, negative = reduced profit):",
        ]
        for b in wf["bars"]:
            direction = "POSITIVE — favourable" if b["fav"] else "NEGATIVE — adverse"
            lines.append(f"    {b['label']}: {_fs(b['impact'])} [{direction}]")
        if wf.get("largest_positive"):
            lp = wf["largest_positive"]
            lines.append(f"  Largest positive driver: {lp['label']} ({_fs(lp['impact'])})")
        if wf.get("largest_negative"):
            ln = wf["largest_negative"]
            lines.append(f"  Largest adverse driver : {ln['label']} ({_fs(ln['impact'])})")

    # Revenue composition
    rev_split = data.get("revenue_split", [])
    if rev_split:
        lines += [f"", f"REVENUE COMPOSITION ({lbl}):"]
        for r in rev_split:
            lines.append(f"  {r['name']}: {_f(r['value'])} ({r['pct']}%)")

    # Expense composition
    exp_split = data.get("expense_split", [])
    if exp_split:
        lines += ["", f"EXPENSE COMPOSITION ({lbl}):"]
        for r in exp_split:
            lines.append(f"  {r['name']}: {_f(r['value'])} ({r['pct']}%)")

    # Account-level movements
    movements = data.get("movements", [])
    if movements:
        lines += ["", "TOP ACCOUNT-LEVEL MOVEMENTS (sorted by absolute variance):"]
        for m in movements[:25]:
            fav_str = "FAVOURABLE" if m.get("is_fav") else "ADVERSE"
            pct_part = f" ({m['variance_pct']:+.1f}%)" if m.get("variance_pct") is not None else ""
            lines.append(
                f"  {m['account']} [{m['category']}]: "
                f"current {_f(m.get('value'))}, prior {_f(m.get('prior_value'))}, "
                f"variance {_fs(m.get('variance'))}{pct_part} [{fav_str}]"
            )

    # Rule-engine commentary (additional context)
    commentary = data.get("commentary", [])
    if commentary:
        lines += ["", "AUTO-GENERATED COMMENTARY:"]
        for c in commentary:
            clean = re.sub(r"<[^>]+>", "", c.get("html", "")).strip()
            if clean:
                lines.append(f"  - {clean}")

    # ── NHS GP sector context ─────────────────────────────────────────────────
    if session.get("sector") == "nhs_gp":
        lines += ["", "NHS GP PRACTICE CONTEXT:"]
        ls = session.get("list_size", 0)
        if ls:
            lines.append(f"  List Size (weighted patients): {ls:,}")

        nhs_kpis = data.get("nhs_kpis") or {}
        if nhs_kpis:
            ipp = nhs_kpis.get("income_per_patient")
            cpp = nhs_kpis.get("cost_per_patient")
            ppp = nhs_kpis.get("profit_per_patient")
            if ipp is not None:
                lines.append(f"  Income per Patient    : {_sym}{ipp:,.2f}")
            if cpp is not None:
                lines.append(f"  Cost per Patient      : {_sym}{cpp:,.2f}")
            if ppp is not None:
                lines.append(f"  Surplus per Patient   : {_sym}{ppp:,.2f}")
            ipp_p = nhs_kpis.get("income_per_partner")
            ppp_p = nhs_kpis.get("profit_per_partner")
            if ipp_p is not None:
                lines.append(f"  Income per WTE Partner: {_sym}{ipp_p:,.0f}")
            if ppp_p is not None:
                lines.append(f"  Surplus per WTE Partner: {_sym}{ppp_p:,.0f}")

        arrs = nhs_kpis.get("arrs") or session.get("nhs_utilisation", {}).get("arrs")
        if arrs:
            lines.append(
                f"  ARRS Utilisation: {arrs['utilisation_pct']:.1f}% "
                f"({_sym}{arrs['spend']:,.0f} of {_sym}{arrs['allocation']:,.0f} allocation, "
                f"{_sym}{arrs['remaining']:,.0f} remaining)"
            )

        qof = nhs_kpis.get("qof") or session.get("nhs_utilisation", {}).get("qof")
        if qof:
            lines.append(
                f"  QOF Achievement: {qof['achievement_pct']:.1f}% "
                f"({_sym}{qof['income']:,.0f} of {_sym}{qof['entitlement']:,.0f} entitlement, "
                f"{_sym}{qof['gap']:,.0f} gap)"
            )

        wf_breakdown = data.get("workforce_breakdown") or {}
        if any(wf_breakdown.get(r, {}).get("total", 0) > 0 for r in ("clinical", "locum", "management", "admin")):
            total_wf = sum(wf_breakdown.get(r, {}).get("total", 0)
                           for r in ("clinical", "locum", "management", "admin", "other"))
            lines += ["", "  WORKFORCE COST BREAKDOWN (this period):"]
            for role in ("clinical", "locum", "management", "admin", "other"):
                role_total = wf_breakdown.get(role, {}).get("total", 0)
                if role_total > 0:
                    pct = role_total / total_wf * 100 if total_wf else 0
                    lines.append(f"    {role.capitalize()}: {_sym}{role_total:,.0f} ({pct:.1f}%)")
            if total_wf:
                lines.append(f"    Total staff costs: {_sym}{total_wf:,.0f}")

        wte = session.get("wte_partners")
        if wte:
            lines.append(f"  WTE Partners: {wte}")

        lines += [
            "",
            "  NOTE: You are assisting with NHS GP practice management accounts.",
            "  Use NHS-specific terminology: GMS/PMS contract, QOF, ARRS, enhanced services,",
            "  ICB, PCN. Reference NICE guidance and NHS England benchmarks where relevant.",
            "  Surplus targets for NHS GP are typically £5-15/patient. ARRS utilisation",
            "  above 80% is considered good. QOF achievement above 95% is excellent.",
        ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# CHAT HISTORY  (server-side persistence, same lifetime as the analysis session)
# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────────────────────────────────────
ALL_CATEGORIES = ["Revenue"] + EXPENSE_CATEGORIES


@app.get("/api/categories")
def get_categories():
    """Return the list of valid account categories for the reclassification UI."""
    return {"categories": ALL_CATEGORIES}


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY REMAPPING
# ─────────────────────────────────────────────────────────────────────────────
class ReclassifyBody(BaseModel):
    account:  str = Field(max_length=500)
    category: str = Field(max_length=100)


@app.post("/api/reclassify/{session_id}")
def reclassify(session_id: str, body: ReclassifyBody):
    """
    Update an account's category classification for this session.
    Updates all stored DataFrames in-place so subsequent /api/data calls
    reflect the corrected categorisation immediately — no re-upload required.
    """
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    account  = body.account.strip()
    category = body.category.strip()

    if category not in ALL_CATEGORIES:
        raise HTTPException(400, f"Invalid category '{category}'. Valid options: {', '.join(ALL_CATEGORIES)}")

    # Persist the user override so it survives period changes
    s.setdefault("category_overrides", {})[account] = category

    # Apply in-place to every stored DataFrame that carries a Category column
    df_keys = ["analysis_m", "analysis_q", "bva_data", "bva_long"]
    updated = 0
    for key in df_keys:
        df = s.get(key)
        if df is not None and isinstance(df, pd.DataFrame):
            if "Account" in df.columns and "Category" in df.columns:
                mask = df["Account"].str.strip() == account
                if mask.any():
                    df.loc[mask, "Category"] = category
                    updated += mask.sum()

    # Invalidate the insights cache — reclassification changes category-level aggregates
    s.pop("insights_cache", None)
    s.pop("strategy_cache", None)

    return {"ok": True, "account": account, "category": category, "rows_updated": int(updated)}


# ─────────────────────────────────────────────────────────────────────────────
# CHAT HISTORY  (server-side persistence, same lifetime as the analysis session)
# ─────────────────────────────────────────────────────────────────────────────
class ChatTurn(BaseModel):
    who:  str = Field(pattern=r"^(user|ai)$")
    html: str = Field(max_length=20_000)


class ChatSaveBody(BaseModel):
    turns: list[ChatTurn] = Field(max_length=200)


@app.get("/api/chat/{session_id}")
def chat_load(session_id: str):
    """Return saved chat turns for a session. Returns [] if no history yet."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    return {"turns": s.get("chat", []), "count": len(s.get("chat", []))}


@app.post("/api/chat/{session_id}")
def chat_save(session_id: str, body: ChatSaveBody):
    """Persist the full chat turn list for a session (client sends complete array)."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    s["chat"] = [t.model_dump() for t in body.turns]
    return {"ok": True, "saved": len(s["chat"])}


# ─────────────────────────────────────────────────────────────────────────────
# AI NARRATIVE COMMENTARY
# ─────────────────────────────────────────────────────────────────────────────
_COMMENTARY_TONE_SUFFIXES = {
    "board": (
        "TONE: Board Pack — formal, executive-level language suitable for a Finance Director or CFO. "
        "Precise, authoritative, minimal jargon. Assume a financially literate audience. "
        "Recommended Actions should be board-level strategic decisions."
    ),
    "management": (
        "TONE: Management Review — detailed analytical commentary for the senior management team. "
        "More depth than a board pack; include operational context, trend direction, and root-cause commentary. "
        "Recommended Actions should be departmental and operational."
    ),
    "client": (
        "TONE: Client Digest — plain English, friendly, jargon-free. Written for a business owner, "
        "not an accountant. Avoid technical terms; explain what numbers mean in plain language. "
        "Recommended Actions should be practical steps the business owner can take."
    ),
}

COMMENTARY_PROMPT = """You are MonthEndIQ, writing a management pack narrative.

Write a concise but complete narrative commentary covering the financial period below.

Structure (use exactly these HTML tags):
- <h4>Executive Summary</h4> followed by a <p> with 2–3 sentences giving the overall picture
- <h4>Revenue</h4> followed by a <p> with key revenue observations (2–3 sentences)
- <h4>Costs</h4> followed by a <p> with key cost movements and pressures (2–3 sentences)
- <h4>Profitability</h4> followed by a <p> with the operating profit outcome and main drivers (2–3 sentences)
- <h4>Recommended Actions</h4> followed by a <ul> with exactly 3 <li> items — specific, prioritised, actionable

Requirements:
- Format all currency as {currency_sym}X,XXX ({currency_desc})
- Be specific: cite actual figures from the data — do not be vague or generic
- Highlight both favourable and adverse variances explicitly
- Do NOT use meta-language like "based on the data" or "according to the analysis"
- Do NOT add any preamble or sign-off — start directly with <h4>Executive Summary</h4>
- {tone_instruction}

CRITICAL — FIGURE INTEGRITY (your figures are checked against the ledger after you write):
- Every {currency_sym} figure you state MUST appear verbatim in the FINANCIAL DATA below. Copy figures exactly.
- NEVER calculate, sum, estimate, annualise, or derive a new total that is not already given.
- If a number you want to cite is not in the data, describe the movement in words instead of inventing a figure.
- Do not round figures to a different precision than shown (if data says {currency_sym}44,012, do not write "{currency_sym}44k" unless that rounding is unambiguous).

FINANCIAL DATA:
{context}"""


_CURRENCY_DESCRIPTIONS: dict[str, str] = {
    "£":    "GBP (pound sterling, UK convention)",
    "$":    "USD (US dollar)",
    "€":    "EUR (euro)",
    "A$":   "AUD (Australian dollar)",
    "C$":   "CAD (Canadian dollar)",
    "CHF":  "CHF (Swiss franc)",
}

def _currency_desc(sym: str) -> str:
    return _CURRENCY_DESCRIPTIONS.get(sym.strip(), sym.strip())

def _make_money_re(sym: str) -> re.Pattern:
    """Build a regex that matches currency amounts for the given symbol."""
    return re.compile(
        r"-?" + re.escape(sym.strip()) + r"\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m|bn)?",
        re.IGNORECASE,
    )


def _parse_money(num_str: str, suffix: str | None) -> float:
    """Parse a regex-captured money figure into an absolute float value."""
    val = float(num_str.replace(",", ""))
    if suffix:
        s = suffix.lower()
        val *= {"k": 1_000, "m": 1_000_000, "bn": 1_000_000_000}.get(s, 1)
    return abs(val)


def _money_tolerance(value: float, suffix: str | None) -> float:
    """Allowed match tolerance — looser when the figure is expressed in k/m shorthand."""
    s = (suffix or "").lower()
    if s in ("m", "bn"):
        return max(50_000.0, value * 0.01)
    if s == "k":
        return max(500.0, value * 0.01)
    return max(1.0, value * 0.005)


def _ground_truth_figures(context: str, sym: str = "£") -> list[float]:
    """All currency figures present in the data we handed to the model — the allowed set."""
    out = []
    for m in _make_money_re(sym).finditer(context):
        try:
            out.append(_parse_money(m.group(1), m.group(2)))
        except (TypeError, ValueError):
            continue
    return out


def _verify_narrative_figures(narrative: str, context: str, sym: str = "£") -> dict:
    """
    Lock-the-maths check: every currency figure the model wrote must trace back to a
    figure we gave it. Returns coverage stats plus any unverifiable figures.
    """
    money_re = _make_money_re(sym)
    truth = _ground_truth_figures(context, sym)
    total, verified, unverified = 0, 0, []
    for m in money_re.finditer(narrative):
        try:
            value = _parse_money(m.group(1), m.group(2))
        except (TypeError, ValueError):
            continue
        total += 1
        tol = _money_tolerance(value, m.group(2))
        if any(abs(value - g) <= tol for g in truth):
            verified += 1
        else:
            raw = m.group(0).strip()
            if raw not in unverified:
                unverified.append(raw)
    return {
        "total":       total,
        "verified":    verified,
        "unverified":  unverified,
        "all_verified": total > 0 and not unverified,
        "coverage_pct": round(100 * verified / total, 1) if total else None,
    }


class CommentaryBody(BaseModel):
    period:        str | None = None
    mode:          str        = "monthly"
    context_notes: str | None = Field(None, max_length=2000)
    tone:          str        = "board"  # board | management | client
    currency_sym:  str        = Field("£", max_length=10)


@app.post("/api/commentary/{session_id}")
async def generate_commentary(session_id: str, body: CommentaryBody):
    """Generate a board-ready AI narrative commentary for the current period."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "OpenAI API key not configured.")

    # Resolve period (mirrors logic in /api/ask)
    if s.get("analysis_type") == "budget_vs_actual":
        selected = body.period if body.period else "full_year"
    else:
        analysis = s["analysis_m"] if body.mode == "monthly" else s["analysis_q"]
        sort_key = (lambda p: pd.Timestamp(p)) if body.mode == "monthly" else quarter_sort_key
        periods  = sorted(analysis["Period"].unique(), key=sort_key)
        selected = periods[-1]
        if body.period:
            for p in periods:
                if period_label(p, body.mode) == body.period or str(p) == body.period:
                    selected = p
                    break

    context = _build_financial_context(s, selected, body.mode, body.currency_sym)

    # Resolve tone instruction (default to board if unrecognised)
    tone_key = (body.tone or "board").lower()
    tone_instruction = _COMMENTARY_TONE_SUFFIXES.get(tone_key, _COMMENTARY_TONE_SUFFIXES["board"])

    # Append accountant-provided context notes to the user turn if supplied
    user_msg = "Write the management pack narrative commentary for this period."
    if body.context_notes and body.context_notes.strip():
        user_msg += (
            f"\n\nACCOUNTANT'S NOTES FOR THIS PERIOD:\n{body.context_notes.strip()}\n"
            "Please incorporate the above context where relevant in the commentary."
        )

    try:
        from openai import OpenAI
        ai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        client   = OpenAI(api_key=api_key)
        resp     = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": COMMENTARY_PROMPT.format(context=context, tone_instruction=tone_instruction, currency_sym=body.currency_sym, currency_desc=_currency_desc(body.currency_sym))},
                {"role": "user",   "content": user_msg},
            ],
            temperature=0.4,
            max_tokens=900,
        )
        narrative = resp.choices[0].message.content.strip()
        verification = _verify_narrative_figures(narrative, context, body.currency_sym)
        return {"narrative": narrative, "verification": verification}
    except Exception as e:
        raise HTTPException(500, f"Commentary generation failed: {str(e)}")


class CommentaryUpdateBody(BaseModel):
    commentary: list[str] = Field(max_length=100)
    period: str = ""
    clear: bool = False


@app.patch("/api/sessions/{session_id}/commentary")
async def update_session_commentary(session_id: str, body: CommentaryUpdateBody):
    """Persist hand-edited commentary bullets back into the live session (per period)
    so the next export picks them up without re-analysis."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    if "edited_commentary" not in s:
        s["edited_commentary"] = {}
    key = body.period or "__global__"
    if body.clear or not body.commentary:
        s["edited_commentary"].pop(key, None)
    else:
        s["edited_commentary"][key] = [line.strip() for line in body.commentary if line.strip()]
    return {"ok": True}


def _overlay_edited_commentary(s: dict, data: dict, selected_period) -> dict:
    """Replace data['commentary'] with user-edited version if one exists for this period."""
    edited = s.get("edited_commentary", {})
    texts = edited.get(str(selected_period), edited.get("__global__"))
    if texts is not None:
        data["commentary"] = [
            {"html": t, "icon": "edit-3", "fav": True, "edited": True}
            for t in texts
        ]
    return data


# ─────────────────────────────────────────────────────────────────────────────
# STRATEGY REVIEW — OpenAI-powered
# ─────────────────────────────────────────────────────────────────────────────
STRATEGY_PROMPT = """You are a senior FP&A director conducting a strategic review of a management pack.
Using ONLY the financial data provided, write a concise strategic analysis.

Respond with valid JSON only, using this exact structure:
{{
  "executive_summary": "2-3 sentences summarising financial position and the single most important theme",
  "whats_working": ["specific positive with figure", "specific positive with figure"],
  "areas_of_concern": ["specific risk or negative trend with figure", "specific issue with figure"],
  "recommended_actions": ["concrete action tied to the data", "concrete action", "concrete action"]
}}

Rules:
- Reference actual figures, percentages, and account names from the data provided
- No generic advice — every point must be anchored to a specific number in the data
- Maximum 3 bullets per list section
- Currency symbol: {currency_sym}

FINANCIAL DATA:
{context}
"""

STRATEGY_PROMPT_NHS_GP = """You are a senior FP&A adviser specialising in NHS GP practice finance.
Using ONLY the financial data provided, write a concise strategic analysis for a GP practice.

Respond with valid JSON only, using this exact structure:
{{
  "executive_summary": "2-3 sentences summarising the practice's financial position, referencing surplus per patient and/or per partner",
  "whats_working": ["specific positive with figure", "specific positive with figure"],
  "areas_of_concern": ["specific risk or negative trend with figure", "specific issue with figure"],
  "recommended_actions": ["concrete action tied to the data", "concrete action", "concrete action"]
}}

NHS GP benchmarks to apply where data is available:
- Surplus per patient: target {currency_sym}5–15 per month. Below {currency_sym}5 is a concern.
- ARRS utilisation: ≥80% is good; <50% means the practice is leaving PCN funding on the table.
- QOF achievement: ≥95% is excellent; <80% warrants investigation.
- Locum costs: if locum spend exceeds 15% of total staff costs, flag as a dependency risk.
- Payroll % of revenue: >65% in NHS GP is high; >75% is critical.

Rules:
- Reference actual figures, percentages, and account names from the data provided
- Use NHS terminology: GMS/PMS contract, QOF, ARRS, PCN, ICB, enhanced services, partner drawings
- No generic advice — every point must be anchored to a specific number in the data
- Maximum 3 bullets per list section
- Currency symbol: {currency_sym}

FINANCIAL DATA:
{context}
"""


# ─────────────────────────────────────────────────────────────────────────────
# Q&A COPILOT — OpenAI-powered
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are MonthEndIQ, an FP&A copilot specialising in P&L variance analysis.

The ANALYSIS CONTEXT block at the top of the financial data below tells you exactly what type of analysis is loaded. Use it to frame all your answers appropriately.

You support two types of questions:

1. UPLOADED P&L QUESTIONS — questions about the specific financial data loaded by the user. Answer using ONLY the financial data provided below. Do not invent figures.

2. GENERAL FINANCE / FP&A KNOWLEDGE QUESTIONS — concept or definition questions (e.g. "What is variance?", "What is EBITDA?", "What is a favourable variance?"). Answer from finance knowledge — do NOT refuse or say the data is unavailable for these.

Rules for concept questions:
- ALWAYS explain finance concepts in the context of the currently loaded analysis FIRST, then give the broader definition.
- If Analysis Type is "Month-on-Month P&L Variance": explain variance as the movement between the current and prior period.
- If Analysis Type is "Budget vs Actual": explain variance as the difference between actual performance and budget. Favourable = revenue above budget or costs below budget. Adverse = revenue below budget or costs above budget.
- Example: if asked "What is variance?" during a Budget vs Actual session, explain it as Actual minus Budget.

Other rules:
- Only say "I can't determine that from the data currently loaded" when the user asks for a specific figure genuinely not in the data.
- Use professional but clear finance language. Format currency as {currency_sym}X,XXX ({currency_desc}).
- Be concise unless the user explicitly asks for detail.
- When referencing profit drivers, note that positive profit impacts can come from EITHER revenue increases OR cost decreases (MoM) / coming in under budget (BvA).

FINANCIAL DATA:
{context}"""


class AskBody(BaseModel):
    question:     str            = Field(max_length=4000)
    period:       str | None     = None
    mode:         str            = "monthly"
    history:      list[dict] | None = None   # [{role: "user"|"assistant", content: str}]
    currency_sym: str            = Field("£", max_length=10)


@app.post("/api/ask/{session_id}")
async def ask(session_id: str, body: AskBody):
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    # ── API key check ────────────────────────────────────────────────────────
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return {
            "answer": (
                "<b>⚠️ OpenAI API key not configured.</b><br><br>"
                "To enable AI answers, set the <code>OPENAI_API_KEY</code> environment variable "
                "and restart the server.<br><br>"
                "<b>Windows:</b><br>"
                "<code>set OPENAI_API_KEY=sk-...</code><br><br>"
                "<b>Mac / Linux:</b><br>"
                "<code>export OPENAI_API_KEY=sk-...</code><br><br>"
                "Get an API key at <b>platform.openai.com</b>."
            )
        }

    # ── Resolve period (MoM only) ────────────────────────────────────────────
    selected = None
    if s.get("analysis_type") == "budget_vs_actual":
        # Pass the requested period (or "full_year") so context shows the right label
        selected = body.period if body.period else "full_year"
    else:
        analysis = s["analysis_m"] if body.mode == "monthly" else s["analysis_q"]
        sort_key = (lambda p: pd.Timestamp(p)) if body.mode == "monthly" else quarter_sort_key
        periods  = sorted(analysis["Period"].unique(), key=sort_key)
        selected = periods[-1]
        if body.period:
            for p in periods:
                if period_label(p, body.mode) == body.period or str(p) == body.period:
                    selected = p
                    break

    # ── Build financial context ───────────────────────────────────────────────
    context = _build_financial_context(s, selected, body.mode, body.currency_sym)

    # ── Build message list ───────────────────────────────────────────────────
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context, currency_sym=body.currency_sym, currency_desc=_currency_desc(body.currency_sym))}
    ]

    # Append previous conversation turns (last 6 exchanges = 12 messages)
    if body.history:
        for msg in body.history[-12:]:
            role    = msg.get("role", "")
            content = str(msg.get("content", "")).strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content[:1200]})

    messages.append({"role": "user", "content": body.question})

    # ── Call OpenAI ──────────────────────────────────────────────────────────
    try:
        from openai import OpenAI
        model  = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        client = OpenAI(api_key=api_key)

        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.15,
            max_tokens=700,
        )
        raw = resp.choices[0].message.content.strip()

        # Convert Markdown-style formatting to safe HTML for the chat bubble
        html = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", raw)
        html = re.sub(r"\*(.+?)\*",     r"<i>\1</i>", html)
        html = html.replace("\n\n", "<br><br>").replace("\n", "<br>")

        return {"answer": html}

    except Exception as exc:
        err = str(exc)
        if "401" in err or "api_key" in err.lower() or "authentication" in err.lower() or "Incorrect API key" in err:
            return {"answer": (
                "<b>⚠️ OpenAI authentication failed.</b><br>"
                "Check that your API key is valid and has not expired.<br>"
                f"<small style='color:var(--fg-3)'>{err[:160]}</small>"
            )}
        if "insufficient_quota" in err or "exceeded your current quota" in err:
            return {"answer": (
                "<b>⚠️ OpenAI account has no credits.</b><br><br>"
                "Your API key is valid and connecting correctly, but your OpenAI account "
                "has run out of credits or has no billing method set up.<br><br>"
                "To fix this:<br>"
                "1. Go to <b>platform.openai.com/settings/billing</b><br>"
                "2. Add a payment method<br>"
                "3. Purchase credits (gpt-4o-mini costs ~$0.002 per question)<br><br>"
                "Once billing is active, restart the server — no code changes needed."
            )}
        if "rate" in err.lower() or "429" in err:
            return {"answer": "<b>⚠️ OpenAI rate limit reached.</b><br>Please wait a moment and try again."}
        if "model" in err.lower() or "404" in err:
            model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
            return {"answer": (
                f"<b>⚠️ Model not available:</b> <code>{model_name}</code><br>"
                "Set the <code>OPENAI_MODEL</code> environment variable to a valid model (e.g. <code>gpt-4o-mini</code>)."
            )}
        return {"answer": f"<b>⚠️ AI service error:</b><br><small>{err[:300]}</small>"}


# ─────────────────────────────────────────────────────────────────────────────
# Q&A COPILOT — STREAMING (SSE)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/ask-stream/{session_id}")
def ask_stream(session_id: str, body: AskBody):
    """
    Streaming version of /api/ask.
    Returns a Server-Sent Events stream of JSON deltas: {"delta": "token"}.
    Terminated with the literal string "data: [DONE]\n\n".
    """
    import json as _json

    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()

    def _no_key():
        msg = (
            "<b>⚠️ OpenAI API key not configured.</b><br>"
            "Set the <code>OPENAI_API_KEY</code> environment variable and restart."
        )
        yield f"data: {_json.dumps({'delta': msg})}\n\n"
        yield "data: [DONE]\n\n"

    if not api_key:
        return StreamingResponse(_no_key(), media_type="text/event-stream")

    # ── Resolve period ────────────────────────────────────────────────────────
    selected = None
    if s.get("analysis_type") == "budget_vs_actual":
        selected = body.period if body.period else "full_year"
    else:
        analysis = s["analysis_m"] if body.mode == "monthly" else s["analysis_q"]
        sort_key = (lambda p: pd.Timestamp(p)) if body.mode == "monthly" else quarter_sort_key
        periods  = sorted(analysis["Period"].unique(), key=sort_key)
        selected = periods[-1]
        if body.period:
            for p in periods:
                if period_label(p, body.mode) == body.period or str(p) == body.period:
                    selected = p
                    break

    context  = _build_financial_context(s, selected, body.mode, body.currency_sym)
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT.format(context=context, currency_sym=body.currency_sym, currency_desc=_currency_desc(body.currency_sym))}]
    if body.history:
        for msg in body.history[-12:]:
            role    = msg.get("role", "")
            content = str(msg.get("content", "")).strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content[:1200]})
    messages.append({"role": "user", "content": body.question})

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    def generate():
        try:
            from openai import OpenAI
            cl     = OpenAI(api_key=api_key)
            stream = cl.chat.completions.create(
                model=model, messages=messages,
                temperature=0.15, max_tokens=700, stream=True,
            )
            for chunk in stream:
                delta = (chunk.choices[0].delta.content or "") if chunk.choices else ""
                if delta:
                    yield f"data: {_json.dumps({'delta': delta})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            err_html = f"<b>⚠️ AI error:</b> {str(exc)[:200]}"
            yield f"data: {_json.dumps({'delta': err_html})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─────────────────────────────────────────────────────────────────────────────
# STATISTICAL ANOMALY DETECTION
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/anomalies/{session_id}")
def get_anomalies(
    session_id: str,
    period:     str   = "",
    mode:       str   = "monthly",
    sigma:      float = 1.5,
):
    """
    Detect statistically unusual account movements using Z-score analysis.
    Returns accounts where the current period value deviates from its own
    historical distribution by more than `sigma` standard deviations.
    """
    sigma = max(0.5, min(sigma, 5.0))
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    if s.get("analysis_type") == "budget_vs_actual":
        return {"anomalies": [], "period": "", "note": "Not applicable for Budget vs Actual."}

    analysis = s["analysis_m"] if mode != "quarterly" else s["analysis_q"]
    sort_key = (lambda p: pd.Timestamp(p)) if mode != "quarterly" else quarter_sort_key
    periods  = sorted(analysis["Period"].unique(), key=sort_key)

    if len(periods) < 4:
        return {"anomalies": [], "period": "", "note": "Needs ≥ 4 periods for reliable detection."}

    selected = periods[-1]
    if period:
        for p in periods:
            if str(p)[:10] == str(period)[:10] or period_label(p, mode) == period:
                selected = p
                break

    selected_lbl = period_label(selected, mode)
    non_sub = analysis[~analysis["Is Subtotal"]].copy()

    anomalies = []
    for acc_name in non_sub["Account"].unique():
        acc_strip = acc_name.strip()

        curr_rows = non_sub[
            (non_sub["Account"].str.strip() == acc_strip) &
            (non_sub["Period"] == selected)
        ]
        if curr_rows.empty:
            continue
        curr_raw = curr_rows.iloc[0]["Value"]
        if pd.isna(curr_raw):
            continue
        curr_val = float(curr_raw)

        hist_vals = non_sub[
            (non_sub["Account"].str.strip() == acc_strip) &
            (non_sub["Period"] != selected)
        ]["Value"].dropna().astype(float)

        if len(hist_vals) < 3:
            continue

        hmean = float(hist_vals.mean())
        hstd  = float(hist_vals.std())

        if hstd < 1 or abs(hmean) < 1:
            continue

        z = abs(curr_val - hmean) / hstd
        if z < sigma:
            continue

        cat_mode = non_sub[non_sub["Account"].str.strip() == acc_strip]["Category"].mode()
        cat      = str(cat_mode.iloc[0]) if not cat_mode.empty else "Other"

        # NHS seasonal suppression — known payment patterns are not anomalies
        if s.get("sector") == "nhs_gp":
            try:
                sel_month = pd.Timestamp(selected).month
            except Exception:
                sel_month = 0
            if sel_month and is_seasonal_nhs(acc_strip, sel_month):
                continue

        change  = curr_val - hmean
        is_rev  = cat == "Revenue"
        is_fav  = (is_rev and change > 0) or (not is_rev and change < 0)
        chg_pct = round(change / abs(hmean) * 100, 1) if hmean != 0 else None

        anomalies.append({
            "account":         acc_strip,
            "category":        cat,
            "current_value":   round(curr_val, 2),
            "historical_mean": round(hmean, 2),
            "std_dev":         round(hstd, 2),
            "z_score":         round(z, 2),
            "change":          round(change, 2),
            "change_pct":      chg_pct,
            "is_fav":          is_fav,
        })

    anomalies.sort(key=lambda a: a["z_score"], reverse=True)
    return {
        "anomalies":    anomalies[:8],
        "period":       selected_lbl,
        "threshold":    sigma,
        "total_found":  len(anomalies),
    }



@app.get("/api/insights/{session_id}")
def get_insights(session_id: str, period: str | None = None, mode: str = "monthly"):
    """Return supplementary FP&A insights (margins, pareto, momentum, etc.)."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    if s.get("analysis_type") == "budget_vs_actual":
        raise HTTPException(400, "Insights are not available for Budget vs Actual sessions.")

    analysis = s["analysis_m"] if mode != "quarterly" else s["analysis_q"]
    df_long  = s["df_long_m"]  if mode != "quarterly" else s["df_long_q"]
    kpi_accounts = s["kpi_accounts"]

    sort_key = (lambda p: pd.Timestamp(p)) if mode != "quarterly" else quarter_sort_key
    periods  = sorted(analysis["Period"].unique(), key=sort_key)
    if not periods:
        raise HTTPException(400, "No periods found.")

    selected = None
    if period:
        for p in periods:
            if str(p) == period or str(p)[:10] == period[:10]:
                selected = p
                break
    if selected is None:
        selected = periods[-1]

    # ── In-memory cache: avoid recomputing all 9 insight sections on repeat loads ──
    cache_key = f"{selected}|{mode}"
    if "insights_cache" not in s:
        s["insights_cache"] = {}
    cached = s["insights_cache"].get(cache_key)
    if cached is not None:
        return cached

    result = get_insights_data(analysis, df_long, selected, kpi_accounts, mode)
    s["insights_cache"][cache_key] = result
    return result


@app.get("/api/strategy/{session_id}")
def get_strategy(session_id: str, period: str = "", mode: str = "monthly",
                 currency: str = "£", refresh: bool = False):
    """AI strategy review: executive summary + what's working / concerns / actions."""
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")
    if s.get("analysis_type") == "budget_vs_actual":
        raise HTTPException(400, "Strategy review is available for month-on-month sessions only.")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "OpenAI API key not configured.")

    analysis     = s["analysis_m"] if mode != "quarterly" else s.get("analysis_q", s["analysis_m"])
    df_long      = s["df_long_m"]  if mode != "quarterly" else s.get("df_long_q",  s["df_long_m"])
    kpi_accounts = s["kpi_accounts"]

    sort_key = (lambda p: pd.Timestamp(p)) if mode != "quarterly" else quarter_sort_key
    periods  = sorted(analysis["Period"].unique(), key=sort_key)
    if not periods:
        raise HTTPException(400, "No periods found.")

    selected = periods[-1]
    if period:
        for p in periods:
            if period_label(p, mode) == period or str(p) == period or str(p)[:10] == period[:10]:
                selected = p
                break

    # In-memory cache (skipped when refresh=True)
    cache_key = f"strategy|{selected}|{mode}"
    if "strategy_cache" not in s:
        s["strategy_cache"] = {}
    if not refresh and cache_key in s["strategy_cache"]:
        return s["strategy_cache"][cache_key]

    # Build context: financial movements + key insight metrics
    ctx = _build_financial_context(s, selected, mode, currency)
    try:
        insights = get_insights_data(analysis, df_long, selected, kpi_accounts, mode)
        extras = []
        m  = insights.get("margins", {})
        mo = insights.get("momentum", {})
        pa = insights.get("pareto", {})
        sp = insights.get("sppy", {})
        if m.get("op_pct") is not None:
            extras.append(f"Operating margin: {m['op_pct']:.1f}%")
        if m.get("payroll_pct") is not None:
            extras.append(f"Payroll % of revenue: {m['payroll_pct']:.1f}%")
        if mo.get("available"):
            extras.append(f"Momentum — Revenue: {mo.get('revenue_dir')}, Costs: {mo.get('cost_dir')}, Profit: {mo.get('profit_dir')}")
        if pa.get("top5"):
            top5_str = ", ".join(
                f"{r['account']} ({r['pct_of_cost']:.1f}% of costs)" for r in pa["top5"]
            )
            extras.append(f"Top 5 cost lines: {top5_str}")
        if sp.get("available") and sp.get("prof_delta") is not None:
            extras.append(
                f"YoY profit vs same month prior year: {currency}{sp['prof_delta']:,.0f} "
                f"({sp.get('prof_pct', 0):+.1f}%)"
            )
        if extras:
            ctx += "\n\n=== KEY METRICS ===\n" + "\n".join(extras)
    except Exception:
        pass

    try:
        import json as _json
        from openai import OpenAI
        ai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        client   = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": (STRATEGY_PROMPT_NHS_GP if s.get("sector") == "nhs_gp" else STRATEGY_PROMPT).format(context=ctx, currency_sym=currency)},
                {"role": "user",   "content": "Generate the strategic review."},
            ],
            temperature=0.3,
            max_tokens=700,
            response_format={"type": "json_object"},
        )
        raw    = resp.choices[0].message.content.strip()
        result = _json.loads(raw)
        for key in ("executive_summary", "whats_working", "areas_of_concern", "recommended_actions"):
            if key not in result:
                result[key] = [] if key != "executive_summary" else ""
        s["strategy_cache"][cache_key] = result
        return result
    except Exception as exc:
        raise HTTPException(500, f"Strategy review failed: {str(exc)}")


@app.get("/api/export/{session_id}")
def export(session_id: str, period: str = "", fmt: str = "pdf", firm: str = "", currency: str = "£"):
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")

    analysis_type   = s.get("analysis_type", "month_on_month")
    insights_data   = None
    nhs_export_data = None

    if analysis_type == "budget_vs_actual":
        bva_long    = s.get("bva_long")
        bva_periods = s.get("bva_periods", [])
        df_to_use   = s["bva_data"]
        sel_label   = "Full Year"

        if period and period != "full_year" and bva_long is not None:
            if period in _QUARTER_MONTHS:
                months = _QUARTER_MONTHS[period]
                matching = [ts for ts in bva_periods if pd.Timestamp(ts).month in months]
                if matching:
                    df_to_use = _agg_bva_df(
                        bva_long[bva_long["Period"].isin(matching)].drop(columns=["Period"])
                    )
                    sel_label = _resolve_bva_period_label(period)
            else:
                target_ts = next(
                    (ts for ts in bva_periods if str(ts)[:10] == period[:10]),
                    None,
                )
                if target_ts is not None:
                    df_filt = bva_long[bva_long["Period"] == target_ts].drop(columns=["Period"]).copy()
                    df_filt["Abs Variance"] = df_filt["Variance"].abs()
                    df_to_use = df_filt
                    sel_label = _resolve_bva_period_label(period)

        data = get_bva_data(df_to_use, s["kpi_accounts"], s["filename"], bva_long=bva_long)
        lbl  = f"Budget vs Actual - {sel_label}"
    else:
        analysis     = s["analysis_m"] if "analysis_m" in s else s["analysis_q"]
        df_long      = s["df_long_m"]  if "df_long_m"  in s else s["df_long_q"]
        kpi_accounts = s["kpi_accounts"]
        periods = sorted(analysis["Period"].unique(), key=lambda p: pd.Timestamp(p))
        selected = periods[-1]
        for p in periods:
            if period_label(p, "monthly") == period or str(p) == period:
                selected = p
                break
        data = get_period_data(analysis, df_long, selected, kpi_accounts, "monthly")
        _overlay_edited_commentary(s, data, selected)
        lbl  = data["period"]["label"]
        try:
            insights_data = get_insights_data(analysis, df_long, selected, kpi_accounts, "monthly")
        except Exception:
            insights_data = None

        # NHS export enrichment
        if s.get("sector") == "nhs_gp":
            movements_for_nhs = data.get("movements", [])
            for m in movements_for_nhs:
                m["is_locum"] = is_locum_account(m.get("account", ""))
            nhs_export_data = {
                "workforce_breakdown": compute_workforce_breakdown(movements_for_nhs),
                "partner_drawings":    s.get("partner_drawings"),
                "wte_partners":        s.get("wte_partners"),
                "list_size":           s.get("list_size"),
            }
            util = compute_utilisation(
                movements_for_nhs,
                s.get("arrs_allocation"),
                s.get("qof_entitlement"),
            )
            nhs_export_data.update(util)
        else:
            nhs_export_data = None

    safe_lbl = re.sub(r"[^\w\s-]", "", lbl).replace(" ", "_")

    if fmt == "pdf":
        content = make_pdf(lbl, data["movements"], data["commentary"], data["kpis"],
                           analysis_type=analysis_type, waterfall=data.get("waterfall"),
                           firm_name=firm, currency_sym=currency,
                           insights=insights_data if analysis_type != "budget_vs_actual" else None)
        return Response(content, media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{safe_lbl}.pdf"'})
    elif fmt == "xlsx":
        content = make_xlsx(lbl, data["movements"], data["commentary"], data["kpis"],
                            analysis_type=analysis_type,
                            insights=insights_data if analysis_type != "budget_vs_actual" else None,
                            nhs_data=nhs_export_data)
        return Response(
            content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="variance_analysis_{safe_lbl}.xlsx"'},
        )
    else:
        content = make_zip(lbl, data["movements"], data["commentary"], data["kpis"], currency_sym=currency)
        return Response(content, media_type="application/zip",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{safe_lbl}.zip"'})
