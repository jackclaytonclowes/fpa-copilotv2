"""
FP&A Copilot — FastAPI backend
Run: uvicorn api:app --reload --port 8000

Environment variables:
  OPENAI_API_KEY   Required for Q&A Copilot
  OPENAI_MODEL     Optional model override (default: gpt-4o-mini)
"""
import os
import re
import uuid
from pathlib import Path

# Load .env from project root (silently ignored if file doesn't exist)
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analysis import (
    build_analysis, build_bva, build_bva_long_from_sheets, build_long,
    build_waterfall, detect_bva_columns, detect_kpis, get_bva_data,
    get_period_data, get_ytd_data, load_bva_from_sheets, load_file,
    make_pdf, make_xlsx, make_zip,
    period_label, quarter_sort_key, EXPENSE_CATEGORIES,
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

# In-memory session store
SESSIONS: dict = {}

STATIC = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def root():
    return FileResponse(STATIC / "index.html")


@app.get("/view/{session_id}")
def view_shared(session_id: str):
    """Serve the SPA for a shareable session link — the frontend reads the ID from the URL."""
    return FileResponse(STATIC / "index.html")


# ─────────────────────────────────────────────────────────────────────────────
# MULTI-ENTITY CONSOLIDATION
# ─────────────────────────────────────────────────────────────────────────────
class ConsolidateBody(BaseModel):
    session_ids: list[str]
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
    recipients: list[str]
    subject:    str | None = None
    period:     str | None = None
    mode:       str        = "monthly"
    fmt:        str        = "pdf"


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

    if not body.recipients:
        raise HTTPException(400, "At least one recipient is required.")

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

    pdf_bytes = make_pdf(
        period_lbl,
        d.get("movements", []),
        d.get("commentary", []),
        d.get("kpis", []),
        "month_on_month",
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

    data = get_bva_data(bva_snapshot, kpi_accounts, filename)
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


@app.post("/api/upload")
async def upload(file: UploadFile = File(...), mode: str = "month_on_month"):
    import sys
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(400, "Only CSV and Excel files are supported.")
    contents = await file.read()

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
            "df"           : df_for_kpis,
            "bva_data"     : bva_snapshot,   # full-year aggregate snapshot
            "bva_long"     : bva_long_store, # per-period long-form data (may be None)
            "bva_periods"  : bva_periods,
            "kpi_accounts" : kpi_accounts,
            "filename"     : file.filename,
            "analysis_type": "budget_vs_actual",
            "chat"         : [],
        }
        data = get_bva_data(bva_snapshot, kpi_accounts, file.filename)
        data["session_id"]            = session_id
        data["file_name"]             = file.filename
        data["available_bva_periods"] = [str(ts)[:10] for ts in bva_periods]
        data["selected_bva_period"]   = "full_year"
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

    kpi_accounts = detect_kpis(df_long_m)
    analysis_m   = build_analysis(df_long_m)
    analysis_q   = build_analysis(df_long_q)

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "df"           : df,
        "df_long_m"    : df_long_m,
        "df_long_q"    : df_long_q,
        "analysis_m"   : analysis_m,
        "analysis_q"   : analysis_q,
        "kpi_accounts" : kpi_accounts,
        "filename"     : file.filename,
        "analysis_type": "month_on_month",
        "chat"         : [],
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    if not len(periods_m):
        raise HTTPException(400, "No valid periods found in the file.")
    latest = periods_m[-1]

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = file.filename
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

        data = get_bva_data(df_to_use, s["kpi_accounts"], s["filename"])
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
    data["analysis_type"] = "month_on_month"
    data["session_id"]    = session_id
    data["file_name"]     = s["filename"]
    return data


# ─────────────────────────────────────────────────────────────────────────────
# FINANCIAL CONTEXT BUILDER
# ─────────────────────────────────────────────────────────────────────────────
def _build_financial_context(session: dict, selected_period, mode: str) -> str:
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

        data         = get_bva_data(bva_df, session["kpi_accounts"], session["filename"])
        kpi_accounts = session["kpi_accounts"]
        wf           = data.get("waterfall")

        def _f(v):
            if v is None: return "n/a"
            try:
                fv = float(v)
            except (TypeError, ValueError):
                return "n/a"
            if pd.isna(fv): return "n/a"
            return f"-£{abs(fv):,.0f}" if fv < 0 else f"£{fv:,.0f}"

        def _fs(v):
            if v is None: return "n/a"
            try:
                fv = float(v)
            except (TypeError, ValueError):
                return "n/a"
            if pd.isna(fv): return "n/a"
            prefix = "+" if fv >= 0 else ""
            return f"{prefix}£{fv:,.0f}" if fv >= 0 else f"-£{abs(fv):,.0f}"

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
    def _f(v):
        if v is None:
            return "n/a"
        try:
            fv = float(v)
        except (TypeError, ValueError):
            return "n/a"
        if pd.isna(fv):
            return "n/a"
        return f"-£{abs(fv):,.0f}" if fv < 0 else f"£{fv:,.0f}"

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
        return f"{prefix}£{fv:,.0f}" if fv >= 0 else f"-£{abs(fv):,.0f}"

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
    account:  str
    category: str


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

    return {"ok": True, "account": account, "category": category, "rows_updated": int(updated)}


# ─────────────────────────────────────────────────────────────────────────────
# CHAT HISTORY  (server-side persistence, same lifetime as the analysis session)
# ─────────────────────────────────────────────────────────────────────────────
class ChatTurn(BaseModel):
    who:  str   # "user" | "ai"
    html: str


class ChatSaveBody(BaseModel):
    turns: list[ChatTurn]


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
COMMENTARY_PROMPT = """You are MonthEndIQ, writing a board-ready management pack narrative for a Finance Director.

Write a concise but complete narrative commentary covering the financial period below.

Structure (use exactly these HTML tags):
- <h4>Executive Summary</h4> followed by a <p> with 2–3 sentences giving the overall picture
- <h4>Revenue</h4> followed by a <p> with key revenue observations (2–3 sentences)
- <h4>Costs</h4> followed by a <p> with key cost movements and pressures (2–3 sentences)
- <h4>Profitability</h4> followed by a <p> with the operating profit outcome and main drivers (2–3 sentences)
- <h4>Recommended Actions</h4> followed by a <ul> with exactly 3 <li> items — specific, prioritised, actionable

Requirements:
- Professional board-pack language suitable for a Finance Director or CFO audience
- Format all currency as £X,XXX (pound sterling, UK convention)
- Be specific: cite actual figures from the data — do not be vague or generic
- Highlight both favourable and adverse variances explicitly
- Do NOT use meta-language like "based on the data" or "according to the analysis"
- Do NOT add any preamble or sign-off — start directly with <h4>Executive Summary</h4>

FINANCIAL DATA:
{context}"""


class CommentaryBody(BaseModel):
    period: str | None = None
    mode:   str        = "monthly"


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

    context = _build_financial_context(s, selected, body.mode)

    try:
        from openai import OpenAI
        ai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        client   = OpenAI(api_key=api_key)
        resp     = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": COMMENTARY_PROMPT.format(context=context)},
                {"role": "user",   "content": "Write the management pack narrative commentary for this period."},
            ],
            temperature=0.4,
            max_tokens=900,
        )
        narrative = resp.choices[0].message.content.strip()
        return {"narrative": narrative}
    except Exception as e:
        raise HTTPException(500, f"Commentary generation failed: {str(e)}")


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
- Use professional but clear finance language. Format currency as £X,XXX (pound sterling).
- Be concise unless the user explicitly asks for detail.
- When referencing profit drivers, note that positive profit impacts can come from EITHER revenue increases OR cost decreases (MoM) / coming in under budget (BvA).

FINANCIAL DATA:
{context}"""


class AskBody(BaseModel):
    question: str
    period:   str | None = None
    mode:     str        = "monthly"
    history:  list[dict] | None = None   # [{role: "user"|"assistant", content: str}]


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
    context = _build_financial_context(s, selected, body.mode)

    # ── Build message list ───────────────────────────────────────────────────
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context)}
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
        html = (
            raw
            .replace("**", "<b>", 1)   # open bold
        )
        # Proper bold conversion: **text** → <b>text</b>
        import re as _re
        html = _re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", raw)
        html = _re.sub(r"\*(.+?)\*",     r"<i>\1</i>", html)
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
# EXPORT
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/export/{session_id}")
def export(session_id: str, period: str = "", fmt: str = "pdf"):
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found.")

    analysis_type = s.get("analysis_type", "month_on_month")

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

        data = get_bva_data(df_to_use, s["kpi_accounts"], s["filename"])
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
        lbl  = data["period"]["label"]

    safe_lbl = re.sub(r"[^\w\s-]", "", lbl).replace(" ", "_")

    if fmt == "pdf":
        content = make_pdf(lbl, data["movements"], data["commentary"], data["kpis"],
                           analysis_type=analysis_type, waterfall=data.get("waterfall"))
        return Response(content, media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{safe_lbl}.pdf"'})
    elif fmt == "xlsx":
        content = make_xlsx(lbl, data["movements"], data["commentary"], data["kpis"],
                            analysis_type=analysis_type)
        return Response(
            content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="variance_analysis_{safe_lbl}.xlsx"'},
        )
    else:
        content = make_zip(lbl, data["movements"], data["commentary"], data["kpis"])
        return Response(content, media_type="application/zip",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{safe_lbl}.zip"'})
