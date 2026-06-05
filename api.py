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
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analysis import (
    build_analysis, build_bva, build_bva_long_from_sheets, build_long,
    build_waterfall, detect_bva_columns, detect_kpis, get_bva_data,
    get_period_data, load_bva_from_sheets, load_file, make_pdf, make_zip,
    period_label, quarter_sort_key,
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
                raise HTTPException(400, str(e))
            df["Account"] = df["Account"].astype(str).str.strip()
            df["Section"] = df["Section"].astype(str).replace("nan", "").fillna("")
            df = df[df["Account"].notna() & (df["Account"] != "") & (df["Account"].str.lower() != "nan")]
            actual_col, budget_col = detect_bva_columns(df)
            if not actual_col or not budget_col:
                raise HTTPException(
                    400,
                    "Budget vs Actual mode requires either an Excel workbook with Actuals and Budget "
                    "sheets, or a single table with Actual and Budget columns. Please check your upload."
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

        # Per-period filtering when a specific period is requested
        if period and period != "full_year" and bva_long is not None:
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

        # Resolve a human-readable period label for BvA context
        bva_period_label = "Full Year"
        if selected_period and selected_period != "budget_vs_actual" and selected_period != "full_year":
            try:
                bva_period_label = pd.Timestamp(selected_period).strftime("%B %Y")
            except Exception:
                bva_period_label = str(selected_period)

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
            target_ts = next(
                (ts for ts in bva_periods if str(ts)[:10] == period[:10]),
                None,
            )
            if target_ts is not None:
                df_filt = bva_long[bva_long["Period"] == target_ts].drop(columns=["Period"]).copy()
                df_filt["Abs Variance"] = df_filt["Variance"].abs()
                df_to_use = df_filt
                try:
                    sel_label = pd.Timestamp(period).strftime("%B %Y")
                except Exception:
                    sel_label = period

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
    else:
        content = make_zip(lbl, data["movements"], data["commentary"], data["kpis"])
        return Response(content, media_type="application/zip",
                        headers={"Content-Disposition": f'attachment; filename="management_pack_{safe_lbl}.zip"'})
