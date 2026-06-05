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

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analysis import (
    build_analysis, build_long, build_waterfall, detect_kpis,
    get_period_data, load_file, make_pdf, make_zip, period_label,
    quarter_sort_key,
)

app = FastAPI(title="MonthEndIQ")

# In-memory session store
SESSIONS: dict = {}

STATIC = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def root():
    return FileResponse(STATIC / "index.html")


# ─────────────────────────────────────────────────────────────────────────────
# UPLOAD
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(400, "Only CSV and Excel files are supported.")
    contents = await file.read()
    try:
        df = load_file(contents, file.filename)
    except ValueError as e:
        raise HTTPException(400, str(e))

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
        "df":           df,
        "df_long_m":    df_long_m,
        "df_long_q":    df_long_q,
        "analysis_m":   analysis_m,
        "analysis_q":   analysis_q,
        "kpi_accounts": kpi_accounts,
        "filename":     file.filename,
    }

    periods_m = sorted(analysis_m["Period"].unique(), key=lambda p: pd.Timestamp(p))
    if not len(periods_m):
        raise HTTPException(400, "No valid periods found in the file.")
    latest = periods_m[-1]

    data = get_period_data(analysis_m, df_long_m, latest, kpi_accounts, "monthly")
    data["session_id"] = session_id
    data["file_name"]  = file.filename
    return data


# ─────────────────────────────────────────────────────────────────────────────
# DATA (period change)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/data/{session_id}")
def get_data(session_id: str, period: str | None = None, mode: str = "monthly"):
    s = SESSIONS.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

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
    data["session_id"] = session_id
    data["file_name"]  = s["filename"]
    return data


# ─────────────────────────────────────────────────────────────────────────────
# FINANCIAL CONTEXT BUILDER
# ─────────────────────────────────────────────────────────────────────────────
def _build_financial_context(session: dict, selected_period, mode: str) -> str:
    """
    Build a structured financial context string for the OpenAI system prompt.
    Includes: KPIs, profit drivers/waterfall, revenue split, expense split,
    account-level movements, and rule-engine commentary.
    """
    analysis     = session["analysis_m"] if mode == "monthly" else session["analysis_q"]
    df_long      = session["df_long_m"]  if mode == "monthly" else session["df_long_q"]
    kpi_accounts = session["kpi_accounts"]

    data = get_period_data(analysis, df_long, selected_period, kpi_accounts, mode)
    wf   = data.get("waterfall")
    lbl  = data["period"]["label"]
    prior_lbl = data["period"]["prior"]

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
# Q&A COPILOT — OpenAI-powered
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are MonthEndIQ, a finance analysis assistant specialising in month-end P&L variance analysis.

Answer ONLY using the financial data provided in the context below.
Do not invent figures. Do not assume or infer missing information.
If the answer cannot be determined from the provided context, say exactly:
"I can't determine that from the data currently loaded."

Guidelines:
- Focus on: month-on-month variance, revenue movements, cost movements, operating profit movement, favourable/adverse variances, profit drivers, material account movements.
- Use professional but clear finance language. Format currency as £X,XXX (pound sterling).
- Be concise unless the user explicitly asks for detail or a full summary.
- Separate facts (from the data) from interpretation (your analysis).
- When referencing profit drivers, note that positive profit impacts can come from EITHER revenue increases OR cost decreases.
- Do not provide generic finance advice unless it is directly supported by the loaded data.

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

    # ── Resolve period ───────────────────────────────────────────────────────
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

    analysis     = s["analysis_m"]
    df_long      = s["df_long_m"]
    kpi_accounts = s["kpi_accounts"]
    periods = sorted(analysis["Period"].unique(), key=lambda p: pd.Timestamp(p))
    selected = periods[-1]
    for p in periods:
        if period_label(p, "monthly") == period or str(p) == period:
            selected = p
            break

    data = get_period_data(analysis, df_long, selected, kpi_accounts, "monthly")
    lbl  = data["period"]["label"]

    if fmt == "pdf":
        content = make_pdf(lbl, data["movements"], data["commentary"], data["kpis"])
        return Response(content, media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{lbl.replace(" ","_")}.pdf"'})
    else:
        content = make_zip(lbl, data["movements"], data["commentary"], data["kpis"])
        return Response(content, media_type="application/zip",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{lbl.replace(" ","_")}.zip"'})
