"""
FP&A Copilot — pure analysis module.
All data-processing logic extracted from app.py; no Streamlit dependency.
"""
import re
import zipfile
from io import BytesIO

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

# ─────────────────────────────────────────────
# CLASSIFICATION CONFIG
# ─────────────────────────────────────────────
CATEGORY_RULES = {
    "Revenue": [
        "sales", "income", "revenue", "turnover", "fees", "fee income",
        "service income", "consultancy income", "grant income", "contract income",
        "funding", "uplift payment", "private income", "teaching income", "training hub",
        "qof", "global sum", "lcs", "des", "apms", "vaccination", "vaccinations",
        "influenza", "flu", "mmr", "rotavirus", "hpv", "rsv", "pertussis", "shingles",
        "teledermatology", "healthchecks", "health checks", "weight management",
        "access lis", "pcn", "arrs", "participation payment", "meeting backfill",
        "capacity and access fund", "supervision", "educational supervision", "grant",
        "gnrh", "academic funding", "winter planning", "advice & guidance",
    ],
    "Direct Costs": [
        "cost of sales", "cos", "direct cost", "direct costs", "subcontractor",
        "subcontractors", "delivery costs", "project costs", "materials", "consumables",
        "drugs and vaccines", "medical supplies", "vaccines",
    ],
    "Staff Costs": [
        "wage", "wages", "salary", "salaries", "payroll", "ni", "national insurance",
        "pension", "staff costs", "staff cost", "bonus", "bonuses", "overtime",
        "holiday pay", "training wages", "agency staff", "temporary staff",
        "staff welfare", "work force", "workforce", "receptionist", "receptionists",
        "practice nurse", "nurse lead", "nursing associate", "clinical lead",
        "pharmacist", "pharmacists", "salaried gp", "care navigator",
        "administrator", "senior administrator", "operational support",
        "operational lead", "practice managers", "trainee gp nurse", "hca",
        "doctors - clinical", "nurses clinical", "operations",
    ],
    "Management Costs": [
        "management", "management fee", "management fees", "manager", "leadership",
        "director", "directors", "board costs",
    ],
    "IT Costs": [
        "it", "it costs", "it + office equipment", "software", "hardware", "licence",
        "licences", "license", "licenses", "system", "systems", "tech", "technology",
        "computer", "computers", "microsoft", "office 365", "google workspace",
        "adobe", "xero", "sage", "subscription", "subscriptions", "server", "hosting",
        "domain", "website hosting", "internet", "broadband", "wifi", "telecoms",
        "telephone system", "telephone & internet", "office equipment",
    ],
    "Premises Costs": [
        "rent", "rates", "business rates", "service charge", "service charges",
        "utilities", "electricity", "gas", "water", "cleaning", "repairs",
        "maintenance", "security", "premises", "office rent", "building",
        "facilities", "room bookings", "room booking", "premises costs",
        "non-reimburseable premises costs", "non-reimbursable premises costs",
        "repair, renewals & maintenance",
    ],
    "Professional Fees": [
        "legal", "legal fees", "accountancy", "accounting", "audit", "auditor",
        "consultancy", "consultant", "professional fees", "advisor", "adviser",
        "legal expenses & professional fees",
    ],
    "Marketing Costs": [
        "marketing", "advertising", "promotion", "promotional", "branding",
        "seo", "google ads", "facebook ads", "meta ads", "campaign",
    ],
    "Travel & Entertainment": [
        "travel", "subsistence", "hotel", "hotels", "mileage", "train", "parking",
        "taxi", "taxis", "entertainment", "client entertainment",
    ],
    "Office & Admin": [
        "postage", "courier", "printing", "stationery", "office supplies",
        "admin", "administration", "general expenses", "sundry", "misc",
        "miscellaneous", "cqc costs", "postage, freight & courier",
    ],
    "Insurance": [
        "insurance", "liability insurance", "professional indemnity", "employers liability",
    ],
    "Finance Costs": [
        "bank charges", "interest", "loan interest", "finance charges", "merchant fees",
    ],
    "Depreciation & Amortisation": [
        "depreciation", "amortisation", "amortization",
    ],
    "Tax": ["corporation tax", "taxation", "tax"],
}

ACCOUNT_CATEGORY_OVERRIDES = {
    "global sum": "Revenue", "qof": "Revenue", "enhanced services": "Revenue",
    "private income": "Revenue", "training grant": "Revenue",
    "teaching income": "Revenue", "pcn des participation payment": "Revenue",
    "access lis funding": "Revenue", "winter planning": "Revenue",
    "teledermatology": "Revenue", "mmr": "Revenue", "rotavirus": "Revenue",
    "shingles": "Revenue", "flu": "Revenue", "vaccinations": "Revenue",
    "staff cost - practice care navigator": "Staff Costs",
    "staff cost - receptionist": "Staff Costs",
    "staff cost - salaried gp": "Staff Costs",
    "staff cost - pharmacist": "Staff Costs",
    "it + office equipment": "IT Costs",
    "telephone & internet": "IT Costs",
    "legal expenses & professional fees": "Professional Fees",
    "non-reimburseable premises costs": "Premises Costs",
    "non-reimbursable premises costs": "Premises Costs",
    "cqc costs": "Office & Admin",
}

EXPENSE_CATEGORIES = [
    "Direct Costs", "Staff Costs", "Management Costs", "IT Costs",
    "Premises Costs", "Professional Fees", "Marketing Costs",
    "Travel & Entertainment", "Office & Admin", "Insurance",
    "Finance Costs", "Depreciation & Amortisation", "Tax", "Other",
]

SECTION_TO_CATEGORY = {
    "turnover": "Revenue", "revenue": "Revenue", "income": "Revenue",
    "administrative costs": "Other", "other costs": "Other",
    "staff & workforce": "Staff Costs", "staff and workforce": "Staff Costs",
}

CHART_COLORS_CSS = [
    "var(--c-1)", "var(--c-2)", "var(--c-3)", "var(--c-4)",
    "var(--c-5)", "var(--c-6)", "var(--c-7)", "var(--c-8)",
]


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def fmt_gbp(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    return f"-£{abs(v):,.0f}" if v < 0 else f"£{v:,.0f}"


def fmt_pct(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    return f"{v:.1f}%"


def clean_text(val):
    if pd.isna(val):
        return ""
    return str(val).strip()


def normalise(val):
    return clean_text(val).lower().strip()


def first_non_blank(values):
    for v in values:
        t = clean_text(v)
        if t and t.lower() != "nan":
            return t
    return ""


def is_heading_only_row(left, account):
    headings = {"turnover", "administrative costs", "other costs", "staff & workforce", "staff and workforce"}
    return normalise(left) in headings and normalise(account) == ""


def is_total_line(left, account):
    kws = [
        "total ", "gross profit", "operating profit", "operating surplus",
        "profit on ordinary activities", "profit before tax", "profit after tax",
        "net profit", "profit for the period", "surplus for the period",
        "net surplus", "ebitda", "ebit",
    ]
    return any(k in normalise(left) for k in kws) or any(k in normalise(account) for k in kws)


# ─────────────────────────────────────────────
# FILE LOADING
# ─────────────────────────────────────────────
def load_file(uploaded_bytes: bytes, filename: str) -> pd.DataFrame:
    if filename.endswith(".csv"):
        raw = pd.read_csv(BytesIO(uploaded_bytes), header=None)
    else:
        raw = pd.read_excel(BytesIO(uploaded_bytes), header=None)

    header_row = None
    for i in range(min(25, len(raw))):
        if "account" in raw.iloc[i].astype(str).str.strip().str.lower().tolist():
            header_row = i
            break
    if header_row is None:
        raise ValueError("Could not find an 'Account' header row in the file.")

    headers = raw.iloc[header_row].astype(str).str.strip().tolist()
    df = raw.iloc[header_row + 1:].copy()
    df.columns = headers

    first_col = df.columns[0]
    account_col = next((c for c in df.columns if str(c).strip().lower() == "account"), None)
    if account_col is None:
        raise ValueError("Could not find the Account column.")

    df = df.rename(columns={first_col: "Level_1", account_col: "Level_2_Account"})
    month_cols = [c for c in df.columns if c not in ["Level_1", "Level_2_Account"]]

    section = None
    rows = []
    for _, row in df.iterrows():
        left = clean_text(row.get("Level_1", ""))
        acc  = clean_text(row.get("Level_2_Account", ""))

        if is_heading_only_row(left, acc):
            section = left
            continue

        # For total/subtotal rows: prefer acc (e.g. "Total Turnover") over left (e.g. "Turnover"),
        # so that is_subtotal() can correctly identify them by their full name.
        # For normal rows: prefer acc (the specific account name) over left (the section heading).
        # Both branches are identical — always prefer the more specific acc column first.
        account_name = first_non_blank([acc, left])
        if not account_name:
            continue

        r = {"Account": account_name, "Section": section}
        for col in month_cols:
            r[col] = row[col]
        rows.append(r)

    return pd.DataFrame(rows)


def clean_numeric(series):
    return pd.to_numeric(
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("£", "", regex=False)
        .str.replace("(", "-", regex=False)
        .str.replace(")", "", regex=False)
        .str.replace(r"[^\d.\-]", "", regex=True)
        .str.strip()
        .replace("", pd.NA),
        errors="coerce",
    )


# ─────────────────────────────────────────────
# CLASSIFICATION
# ─────────────────────────────────────────────
def classify(account, section=None):
    acc = normalise(account)
    sec = normalise(section) if section else ""

    if acc in ACCOUNT_CATEGORY_OVERRIDES:
        return ACCOUNT_CATEGORY_OVERRIDES[acc]
    for k, v in ACCOUNT_CATEGORY_OVERRIDES.items():
        if k in acc:
            return v
    if sec in SECTION_TO_CATEGORY:
        sc = SECTION_TO_CATEGORY[sec]
        if sc in ("Revenue", "Staff Costs"):
            return sc
    for cat, kws in CATEGORY_RULES.items():
        if any(kw in acc for kw in kws):
            return cat
    if re.search(r"\bit\b", acc):
        return "IT Costs"
    return "Other"


def is_subtotal(account):
    kws = [
        "total ", "gross profit", "operating profit", "operating surplus",
        "profit on ordinary activities", "profit before tax", "profit after tax",
        "net profit", "profit for the period", "surplus for the period",
        "net surplus", "ebitda", "ebit",
    ]
    return any(k in normalise(account) for k in kws)


# ─────────────────────────────────────────────
# PERIOD LOGIC
# ─────────────────────────────────────────────
def get_fy(dt):
    dt = pd.Timestamp(dt)
    return dt.year if dt.month >= 4 else dt.year - 1


def get_quarter(dt):
    dt = pd.Timestamp(dt)
    q = {4:"Q1",5:"Q1",6:"Q1",7:"Q2",8:"Q2",9:"Q2",10:"Q3",11:"Q3",12:"Q3",1:"Q4",2:"Q4",3:"Q4"}[dt.month]
    fy = get_fy(dt)
    return f"FY{str(fy)[-2:]}/{str(fy+1)[-2:]} {q}"


def quarter_sort_key(label):
    parts = label.split(" ")
    fy_start = int("20" + parts[0][2:4])
    qo = {"Q1":1,"Q2":2,"Q3":3,"Q4":4}[parts[1]]
    return fy_start * 10 + qo


def period_label(period_val, mode):
    if pd.isna(period_val):
        return ""
    if mode == "monthly":
        return pd.Timestamp(period_val).strftime("%B %Y")
    return str(period_val)


# ─────────────────────────────────────────────
# CORE BUILD
# ─────────────────────────────────────────────
def build_long(df: pd.DataFrame, mode: str = "monthly") -> pd.DataFrame:
    possible = [c for c in df.columns if c not in ["Account", "Section"]]
    month_cols = []
    for col in possible:
        parsed = pd.to_datetime(str(col).replace("Sept", "Sep").strip(), errors="coerce")
        if pd.notna(parsed):
            month_cols.append(col)

    if not month_cols:
        raise ValueError("No valid month columns detected.")

    df_long = df.melt(id_vars=["Account","Section"], value_vars=month_cols, var_name="Month", value_name="Value")
    df_long["Month"] = pd.to_datetime(
        df_long["Month"].astype(str).str.replace("Sept", "Sep", regex=False).str.strip(), errors="coerce"
    )
    df_long["Value"] = clean_numeric(df_long["Value"])
    df_long = df_long.dropna(subset=["Month","Value"])
    df_long = df_long.groupby(["Account","Section","Month"], as_index=False)["Value"].sum()

    if mode == "monthly":
        df_long["Period"] = df_long["Month"]
        df_long["Period Sort"] = df_long["Month"]
    else:
        df_long["Period"] = df_long["Month"].apply(get_quarter)
        df_long["Period Sort"] = df_long["Period"].apply(quarter_sort_key)
        df_long = df_long.groupby(["Account","Section","Period","Period Sort"], as_index=False)["Value"].sum()

    return df_long


def build_analysis(df_long: pd.DataFrame) -> pd.DataFrame:
    grp = df_long.copy()
    grp = grp.sort_values(["Account","Period Sort"])
    grp["Prior Value"] = grp.groupby("Account")["Value"].shift(1)
    grp["Variance"] = grp["Value"] - grp["Prior Value"]
    grp["Variance %"] = grp.apply(
        lambda r: (r["Variance"] / r["Prior Value"] * 100)
        if pd.notna(r["Prior Value"]) and r["Prior Value"] != 0 else None, axis=1
    )
    grp["Abs Variance"] = grp["Variance"].abs()
    grp["Category"] = grp.apply(lambda r: classify(r["Account"], r["Section"]), axis=1)
    grp["Is Subtotal"] = grp["Account"].apply(is_subtotal)
    return grp


# ─────────────────────────────────────────────
# KPI DETECTION
# ─────────────────────────────────────────────
def detect_kpis(df_long: pd.DataFrame) -> dict:
    all_accounts = df_long["Account"].dropna().astype(str).str.strip().unique().tolist()
    subtotals = [a for a in all_accounts if is_subtotal(a)]

    revenue_kws = ["total turnover","total revenue","total income","gross income","total sales","total fees","total funding"]
    cost_kws    = ["total administrative costs","total admin costs","total overheads","total expenses","total costs","total expenditure"]
    profit_kws  = ["operating profit","operating surplus","net profit","gross profit","profit before tax",
                   "profit for the period","ebitda","ebit","surplus for the period","net surplus"]

    def best(candidates, kws):
        for kw in kws:
            for a in candidates:
                if a.lower().strip() == kw:
                    return a
        for kw in kws:
            for a in candidates:
                if kw in a.lower():
                    return a
        return None

    return {
        "revenue": best(subtotals, revenue_kws) or best(all_accounts, revenue_kws),
        "costs":   best(subtotals, cost_kws)    or best(all_accounts, cost_kws),
        "profit":  best(subtotals, profit_kws)  or best(all_accounts, profit_kws),
    }


# ─────────────────────────────────────────────
# WATERFALL ANALYSIS
# ─────────────────────────────────────────────
def build_waterfall(
    analysis_df: pd.DataFrame,
    selected_period,
    kpi_accounts: dict,
    mode: str,
) -> dict | None:
    """
    Compute what drove the change in Operating Profit period-on-period.

    Returns a dict with:
        prior_profit, current_profit, net_change,
        bars: [{label, impact, fav}],  (sorted Revenue-first, then by |impact|)
        largest_positive / largest_negative,
        commentary: str

    Returns None when no prior period exists (first period in file).
    """
    profit_account = kpi_accounts.get("profit")
    if not profit_account:
        return None

    period_df = analysis_df[analysis_df["Period"] == selected_period].copy()

    # ── Prior / current profit from the KPI subtotal row ─────────────────
    prof_row = period_df[period_df["Account"].str.strip() == profit_account.strip()]
    if prof_row.empty:
        return None

    r = prof_row.iloc[0]
    current_profit = float(r["Value"])      if pd.notna(r["Value"])      else 0.0
    prior_profit   = float(r["Prior Value"]) if pd.notna(r["Prior Value"]) else None
    if prior_profit is None:
        return None

    net_change = current_profit - prior_profit

    # ── Per-account profit impact ─────────────────────────────────────────
    #
    # Exact required formula:
    #
    #   Revenue / income accounts:
    #       profit_impact = current_value − prior_value
    #       (revenue ↑  →  positive impact on profit)
    #
    #   Expense / cost accounts:
    #       profit_impact = prior_value − current_value
    #       (cost ↑  →  negative impact on profit)
    #       (cost ↓  →  positive impact on profit)
    #
    # Reconciliation identity (standard P&L, costs positive):
    #   Σ(rev: cur−pri) + Σ(cost: pri−cur)
    #   = (cur_rev_total − pri_rev_total) − (cur_cost_total − pri_cost_total)
    #   = (cur_rev − cur_cost) − (pri_rev − pri_cost)
    #   = current_profit − prior_profit  ✓
    #
    # Using Value/Prior Value directly (not the pre-computed Variance column)
    # avoids any DataFrame computation artifact.
    #
    # Revenue detection: rely solely on Category == "Revenue".
    # classify() already applies SECTION_TO_CATEGORY when the account's
    # Section is a known income section, so we trust that result here.
    # Adding a second Section check inside this function was the previous bug —
    # it could treat cost accounts that happen to share a section name as
    # revenue and flip their sign.

    def _is_revenue(row) -> bool:
        return row.get("Category") == "Revenue"

    def _profit_impact(row) -> float:
        cur = float(row["Value"])       if pd.notna(row.get("Value"))       else 0.0
        pri = float(row["Prior Value"]) if pd.notna(row.get("Prior Value")) else 0.0
        if _is_revenue(row):
            return cur - pri   # Revenue ↑  →  profit ↑  (positive)
        else:
            return pri - cur   # Cost    ↑  →  profit ↓  (negative)

    driver_df = period_df[
        (~period_df["Is Subtotal"]) &
        period_df["Prior Value"].notna()   # need both values to compute impact
    ].copy()

    driver_df["ProfitImpact"] = driver_df.apply(_profit_impact, axis=1)

    # ── Aggregate by category — capture source values for diagnostics ────────
    cat_agg = (
        driver_df.groupby("Category")
        .agg(
            impact       =("ProfitImpact", "sum"),
            current_total=("Value",        lambda s: pd.to_numeric(s, errors="coerce").fillna(0).sum()),
            prior_total  =("Prior Value",  lambda s: pd.to_numeric(s, errors="coerce").fillna(0).sum()),
        )
        .reset_index()
    )

    # ── Diagnostic: print source values to server stderr ─────────────────────
    import sys
    print(f"\n[waterfall] ── {selected_period} ──────────────────────────────────", file=sys.stderr)
    print(f"[waterfall]   Prior profit : {fmt_gbp(prior_profit)}", file=sys.stderr)
    print(f"[waterfall]   Current profit: {fmt_gbp(current_profit)}", file=sys.stderr)
    print(f"[waterfall]   Net change   : {'+' if net_change >= 0 else ''}{fmt_gbp(net_change)}", file=sys.stderr)
    print(f"[waterfall]   {'Category':<30} {'Prior':>12} {'Current':>12} {'RawVariance':>13} {'ProfitImpact':>13} Type", file=sys.stderr)
    for _, row in cat_agg.iterrows():
        cat  = str(row["Category"])
        cur  = float(row["current_total"])
        pri  = float(row["prior_total"])
        pi   = float(row["impact"])
        raw  = cur - pri
        kind = "revenue (cur−pri)" if _is_revenue({"Category": cat}) else "cost (pri−cur)"
        print(
            f"[waterfall]   {cat:<30} {fmt_gbp(pri):>12} {fmt_gbp(cur):>12} "
            f"{('+' if raw>=0 else '')}{fmt_gbp(raw):>13} "
            f"{('+' if pi>=0 else '')}{fmt_gbp(pi):>13} {kind}",
            file=sys.stderr,
        )

    # ── category_detail for API response / frontend console ──────────────────
    category_detail = [
        {
            "category"      : str(row["Category"]),
            "prior"         : round(float(row["prior_total"]), 2),
            "current"       : round(float(row["current_total"]), 2),
            "raw_variance"  : round(float(row["current_total"]) - float(row["prior_total"]), 2),
            "profit_impact" : round(float(row["impact"]), 2),
            "is_revenue"    : _is_revenue({"Category": str(row["Category"])}),
        }
        for _, row in cat_agg.iterrows()
    ]

    cat_df = cat_agg[["Category", "impact"]].copy()
    cat_df = cat_df[cat_df["impact"].abs().round(2) > 0]

    # ── Materiality filter: keep categories > 5 % of |net_change| ─────────
    threshold = abs(net_change) * 0.05 if abs(net_change) > 0 else 0

    if threshold > 0:
        material   = cat_df[cat_df["impact"].abs() >= threshold].copy()
        immaterial = cat_df[cat_df["impact"].abs() <  threshold].copy()
    else:
        material   = cat_df.copy()
        immaterial = pd.DataFrame(columns=cat_df.columns)

    if not immaterial.empty:
        other_sum = float(immaterial["impact"].sum())
        if abs(other_sum) > 0.01:
            material = pd.concat(
                [material, pd.DataFrame([{"Category": "Other Movements", "impact": other_sum}])],
                ignore_index=True,
            )

    # ── Sort: Revenue first, then by |impact| desc, Other last ────────────
    def _sort_key(row):
        cat = row["Category"]
        if cat == "Revenue":            return (0, -abs(row["impact"]))
        if cat == "Other Movements":    return (99, 0)
        return                                 (1,  -abs(row["impact"]))

    material["_sk"] = material.apply(_sort_key, axis=1)
    material = material.sort_values("_sk").drop(columns=["_sk"])

    bars = [
        {"label": r["Category"], "impact": round(float(r["impact"]), 2), "fav": float(r["impact"]) > 0}
        for _, r in material.iterrows()
    ]

    # ── Reconciliation guarantee ──────────────────────────────────────────
    # The sum of all bar impacts MUST equal net_change.
    # Any residual (from mis-classification, rounding, or accounts missing
    # from the category buckets) is surfaced explicitly rather than hidden.
    # ── Reconciliation check ──────────────────────────────────────────────
    # prior_profit + sum(bar impacts) must equal current_profit exactly.
    # Any residual is surfaced as "Other Movements"; a server-side warning
    # is printed and reconciles=False is returned to the frontend.
    explained  = round(sum(b["impact"] for b in bars), 2)
    residual   = round(net_change - explained, 2)
    reconciles = abs(residual) <= 0.5

    if not reconciles:
        import sys
        print(
            f"[waterfall] RECONCILIATION MISMATCH  "
            f"net_change={net_change:+.2f}  explained={explained:+.2f}  "
            f"residual={residual:+.2f}  period={selected_period}",
            file=sys.stderr,
        )
        other_idx = next((i for i, b in enumerate(bars) if b["label"] == "Other Movements"), None)
        if other_idx is not None:
            merged = round(bars[other_idx]["impact"] + residual, 2)
            bars[other_idx] = {"label": "Other Movements", "impact": merged, "fav": merged > 0}
        else:
            bars.append({"label": "Other Movements", "impact": residual, "fav": residual > 0})

    # ── Largest drivers ───────────────────────────────────────────────────
    non_other = [b for b in bars if b["label"] != "Other Movements"]
    pos_bars  = [b for b in non_other if b["impact"] > 0]
    neg_bars  = [b for b in non_other if b["impact"] < 0]
    largest_pos = max(pos_bars, key=lambda b: b["impact"]) if pos_bars else None
    largest_neg = min(neg_bars, key=lambda b: b["impact"]) if neg_bars else None

    # ── Commentary — profit-impact wording ────────────────────────────────
    # Every sentence describes effect on profit, not raw account movement.
    # "Staff Costs reduced profit by £4,479 due to higher costs"   (correct)
    # "Staff Costs improved profit by £7,231 due to lower costs"   (correct)
    direction = "increased" if net_change > 0 else "decreased"
    parts = [
        f"{profit_account} {direction} by {fmt_gbp(abs(net_change))} "
        f"compared with the prior period."
    ]

    def _cat_sentence(bar: dict) -> str:
        cat    = bar["label"]
        impact = bar["impact"]
        fav    = impact > 0
        if cat == "Revenue":
            move = "increased" if fav else "decreased"
            effect = "contributing positively to" if fav else "reducing"
            return f"Revenue {move} by {fmt_gbp(abs(impact))}, {effect} profit."
        if cat == "Other Movements":
            effect = "improved" if fav else "reduced"
            return f"Other movements {effect} profit by {fmt_gbp(abs(impact))}."
        # Named cost category
        if fav:
            return (f"{cat} improved profit by {fmt_gbp(abs(impact))} "
                    f"due to lower costs in the period.")
        return (f"{cat} reduced profit by {fmt_gbp(abs(impact))} "
                f"due to higher costs in the period.")

    if largest_pos and largest_neg:
        rev_led = largest_pos["label"] == "Revenue"
        if rev_led and net_change < 0:
            parts.append(
                f"Revenue increased by {fmt_gbp(largest_pos['impact'])} but was insufficient "
                f"to offset {largest_neg['label']}, which reduced profit by "
                f"{fmt_gbp(abs(largest_neg['impact']))} due to higher costs."
            )
        elif rev_led:
            parts.append(
                f"Revenue growth of {fmt_gbp(largest_pos['impact'])} was the primary driver. "
                f"{largest_neg['label']} partially offset this, reducing profit by "
                f"{fmt_gbp(abs(largest_neg['impact']))} due to higher costs."
            )
        else:
            parts.append(_cat_sentence(largest_pos))
            parts.append(_cat_sentence(largest_neg))
    elif largest_neg:
        parts.append(_cat_sentence(largest_neg))
    elif largest_pos:
        parts.append(_cat_sentence(largest_pos))

    return {
        "prior_profit":     round(prior_profit, 2),
        "current_profit":   round(current_profit, 2),
        "net_change":       round(net_change, 2),
        "bars":             bars,
        "largest_positive": largest_pos,
        "largest_negative": largest_neg,
        "commentary":       " ".join(parts),
        "profit_account":   profit_account,
        "reconciles":       reconciles,
        "category_detail":  category_detail,   # full source values for inspection
    }


# ─────────────────────────────────────────────
# PERIOD DATA FOR API RESPONSE
# ─────────────────────────────────────────────
def get_period_data(analysis_df: pd.DataFrame, df_long: pd.DataFrame,
                    selected_period, kpi_accounts: dict, mode: str) -> dict:
    period_df  = analysis_df[analysis_df["Period"] == selected_period].copy()
    driver_df  = period_df[~period_df["Is Subtotal"]].copy()

    # KPI rows
    def kpi_row(name, fav_when_up, icon):
        if not name:
            return None
        match = period_df[period_df["Account"].str.strip() == name.strip()]
        if match.empty:
            return None
        r = match.iloc[0]
        variance = float(r["Variance"]) if pd.notna(r["Variance"]) else None
        prior    = float(r["Prior Value"]) if pd.notna(r["Prior Value"]) else None
        value    = float(r["Value"]) if pd.notna(r["Value"]) else None
        pct      = float(r["Variance %"]) if pd.notna(r["Variance %"]) else None
        is_fav   = (fav_when_up and variance >= 0) or (not fav_when_up and variance <= 0) if variance is not None else None
        return {"label": name, "value": value, "variance": variance, "prior": prior, "pct": pct,
                "is_fav": is_fav, "icon": icon, "pct_only": False}

    rev_kpi  = kpi_row(kpi_accounts["revenue"], True,  "trending-up")
    cost_kpi = kpi_row(kpi_accounts["costs"],   False, "receipt")
    prof_kpi = kpi_row(kpi_accounts["profit"],  True,  "wallet")

    kpis = []
    for k in [rev_kpi, cost_kpi, prof_kpi]:
        if k:
            kpis.append(k)
    # Profit % card
    if prof_kpi and prof_kpi["pct"] is not None:
        kpis.append({"label": "Profit Variance", "value": None, "variance": prof_kpi["variance"],
                     "pct": prof_kpi["pct"], "is_fav": prof_kpi["is_fav"], "icon": "bar-chart-2", "pct_only": True})

    # Trend (last 6 months in long form)
    sorted_periods = sorted(analysis_df["Period"].unique(),
        key=lambda p: pd.Timestamp(p) if mode == "monthly" else quarter_sort_key(p))
    idx = list(sorted_periods).index(selected_period) if selected_period in sorted_periods else len(sorted_periods)-1
    trend_periods = sorted_periods[max(0, idx-5):idx+1]

    trend_data = []
    for p in trend_periods:
        lbl = period_label(p, mode)
        short = pd.Timestamp(p).strftime("%b") if mode == "monthly" else str(p)[-5:]
        def val(name):
            if not name:
                return 0
            m = analysis_df[(analysis_df["Period"] == p) & (analysis_df["Account"].str.strip() == name.strip())]
            return float(m.iloc[0]["Value"]) if not m.empty and pd.notna(m.iloc[0]["Value"]) else 0
        trend_data.append({
            "m": short, "full": lbl,
            "revenue": val(kpi_accounts["revenue"]),
            "costs":   val(kpi_accounts["costs"]),
            "profit":  val(kpi_accounts["profit"]),
        })

    # Revenue & expense splits
    def expense_split_fn(categories, top_n=6):
        """Group expenses by Category for a meaningful cost-category breakdown."""
        df = driver_df[driver_df["Category"].isin(categories)].copy()
        df = df.groupby("Category", as_index=False)["Value"].sum()
        df["Chart Value"] = df["Value"].abs()
        df = df[df["Chart Value"] > 0].sort_values("Chart Value", ascending=False)
        if len(df) > top_n:
            other = df.iloc[top_n:]["Chart Value"].sum()
            top   = df.head(top_n).copy()
            if other > 0:
                df = pd.concat([top, pd.DataFrame([{"Category": "Other", "Value": other, "Chart Value": other}])], ignore_index=True)
            else:
                df = top
        total = df["Chart Value"].sum()
        return [{"name": r["Category"], "value": float(r["Chart Value"]),
                 "pct": round(r["Chart Value"] / total * 100, 1) if total else 0}
                for _, r in df.iterrows()]

    def revenue_split_fn(top_n=8):
        """Group revenue by individual Account so we can see the composition of income streams.

        Rules:
        - Only rows classified as Revenue (Category == "Revenue")
        - driver_df already excludes Is Subtotal rows (Total Turnover, Gross Profit, etc.)
        - Exclude any account whose name looks like a subtotal/total line just in case
        - Group by Account name, show positive values only
        - If only one account survives, fall back to that single row (still useful, not a bug)
        """
        # Known section-heading names that appear as account names when a total row
        # uses the section name (e.g. "Turnover" as a stand-in for "Total Turnover").
        SECTION_HEADING_NAMES = {"turnover", "income", "revenue", "receipts"}
        SUBTOTAL_PATTERNS = [
            "total", "gross profit", "subtotal", "sub-total",
            "net revenue", "net income", "total income",
        ]

        def looks_like_subtotal(name: str) -> bool:
            n = name.lower().strip()
            if n in SECTION_HEADING_NAMES:
                return True
            return any(p in n for p in SUBTOTAL_PATTERNS)

        df = driver_df[
            (driver_df["Category"] == "Revenue") &
            (~driver_df["Account"].apply(looks_like_subtotal))
        ].copy()

        # Group by Account (individual income lines)
        df = df.groupby("Account", as_index=False)["Value"].sum()
        df["Chart Value"] = df["Value"].abs()
        df = df[df["Chart Value"] > 0].sort_values("Chart Value", ascending=False)

        if df.empty:
            return []

        if len(df) > top_n:
            other = df.iloc[top_n:]["Chart Value"].sum()
            top   = df.head(top_n).copy()
            if other > 0:
                df = pd.concat([top, pd.DataFrame([{"Account": "Other", "Value": other, "Chart Value": other}])], ignore_index=True)
            else:
                df = top

        total = df["Chart Value"].sum()
        return [{"name": r["Account"], "value": float(r["Chart Value"]),
                 "pct": round(r["Chart Value"] / total * 100, 1) if total else 0}
                for _, r in df.iterrows()]

    revenue_split = revenue_split_fn()
    expense_split = expense_split_fn(EXPENSE_CATEGORIES)

    # Top movements
    top_mov = (driver_df[driver_df["Variance"].notna() & (driver_df["Variance"] != 0)]
               .sort_values("Abs Variance", ascending=False).head(15))
    movements = []
    for _, row in top_mov.iterrows():
        variance = float(row["Variance"]) if pd.notna(row["Variance"]) else None
        cat = row["Category"]
        fav_when_up = cat == "Revenue"
        is_fav = (fav_when_up and variance >= 0) or (not fav_when_up and variance <= 0) if variance is not None else None
        movements.append({
            "account":     row["Account"],
            "category":    cat,
            "value":       float(row["Value"]) if pd.notna(row["Value"]) else None,
            "prior_value": float(row["Prior Value"]) if pd.notna(row["Prior Value"]) else None,
            "variance":    variance,
            "variance_pct": float(row["Variance %"]) if pd.notna(row["Variance %"]) else None,
            "is_fav":      is_fav,
        })

    # Commentary
    commentary = []
    if prof_kpi and prof_kpi["variance"] is not None:
        word = "improved" if prof_kpi["variance"] > 0 else "declined"
        icon = "trending-up" if prof_kpi["variance"] > 0 else "trending-down"
        fav  = prof_kpi["variance"] > 0
        commentary.append({"icon": icon, "fav": fav,
            "html": f"<b>{kpi_accounts['profit'] or 'Operating profit'} {word}</b> by "
                    f"<b>{fmt_gbp(abs(prof_kpi['variance']))}</b>"
                    f"{(' (' + fmt_pct(abs(prof_kpi['pct'])) + ')') if prof_kpi['pct'] else ''} vs prior period."})
    if rev_kpi and rev_kpi["variance"]:
        d = "increased" if rev_kpi["variance"] > 0 else "decreased"
        commentary.append({"icon": "arrow-up-right" if rev_kpi["variance"]>0 else "arrow-down-right",
            "fav": rev_kpi["variance"] > 0,
            "html": f"Revenue {d} by <b>{fmt_gbp(abs(rev_kpi['variance']))}"
                    f"{(' (' + fmt_pct(abs(rev_kpi['pct'])) + ')') if rev_kpi['pct'] else ''}</b> vs prior period."})
    for _, row in (driver_df[driver_df["Variance"].notna()]
                   .sort_values("Abs Variance", ascending=False).head(3).iterrows()):
        if row["Variance"] == 0:
            continue
        d = "increased" if row["Variance"] > 0 else "decreased"
        cat = row["Category"]
        fav = (cat == "Revenue" and row["Variance"] > 0) or (cat != "Revenue" and row["Variance"] < 0)
        pct_str = f" ({fmt_pct(abs(row['Variance %']))})" if pd.notna(row["Variance %"]) else ""
        commentary.append({
            "icon": "arrow-up-right" if row["Variance"] > 0 else "arrow-down-right",
            "fav": fav,
            "html": f"<b>{row['Account']}</b> {d} by {fmt_gbp(abs(row['Variance']))}{pct_str}.",
        })

    # Period label + prior
    selected_label = period_label(selected_period, mode)
    prior_period   = None
    if idx > 0:
        prior_period = period_label(sorted_periods[idx - 1], mode)

    waterfall = build_waterfall(analysis_df, selected_period, kpi_accounts, mode)

    return {
        "kpis":          kpis,
        "trend":         trend_data,
        "revenue_split": revenue_split,
        "expense_split": expense_split,
        "movements":     movements,
        "commentary":    commentary,
        "waterfall":     waterfall,
        "period":        {"label": selected_label, "prior": prior_period or "prior period"},
        "selected_period": str(selected_period),
        "periods":       [str(p) for p in sorted_periods],
    }


# ─────────────────────────────────────────────
# EXPORTS
# ─────────────────────────────────────────────
def make_zip(period_label_str: str, movements: list, commentary: list, kpis: list) -> bytes:
    buf = BytesIO()
    safe = period_label_str.replace(" ", "_").replace("/", "-")
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Movements CSV
        rows = [",".join(["Account","Category","Value","Prior","Variance","Variance %"])]
        for m in movements:
            rows.append(",".join(str(x or "") for x in [
                m["account"], m["category"], m["value"], m["prior_value"],
                m["variance"], m["variance_pct"],
            ]))
        zf.writestr(f"variance_detail_{safe}.csv", "\n".join(rows))
        # Commentary text
        lines = [f"Management Pack — {period_label_str}", ""]
        for k in kpis:
            if not k.get("pct_only"):
                lines.append(f"{k['label']}: {fmt_gbp(k['value'])} (variance: {fmt_gbp(k['variance'])})")
        lines += ["", "Commentary:"] + [f"- {c['html']}" for c in commentary]
        zf.writestr(f"management_commentary_{safe}.txt", "\n".join(lines))
    buf.seek(0)
    return buf.getvalue()


def make_pdf(period_label_str: str, movements: list, commentary: list, kpis: list) -> bytes:
    buf = BytesIO()
    with PdfPages(buf) as pdf:
        # Cover
        fig, ax = plt.subplots(figsize=(8.27, 11.69))
        ax.axis("off")
        ax.text(0.02, 0.98, f"MonthEndIQ — {period_label_str}", fontsize=16, fontweight="bold", va="top")
        y = 0.93
        for k in kpis:
            if not k.get("pct_only"):
                ax.text(0.02, y, f"{k['label']}: {fmt_gbp(k['value'])}  (variance: {fmt_gbp(k['variance'])})",
                        fontsize=11, va="top")
                y -= 0.035
        y -= 0.02
        ax.text(0.02, y, "Management Commentary:", fontsize=12, fontweight="bold", va="top")
        y -= 0.03
        import html as html_lib
        for c in commentary:
            clean = html_lib.unescape(re.sub("<[^>]+>", "", c["html"]))
            ax.text(0.02, y, f"  • {clean}", fontsize=10, va="top", wrap=True)
            y -= 0.028
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Movements table
        fig2, ax2 = plt.subplots(figsize=(11.69, 8.27))
        ax2.axis("off")
        ax2.set_title(f"Variance Detail — {period_label_str}", fontsize=13, fontweight="bold", loc="left", pad=10)
        cols = ["Account", "Category", "Value", "Prior", "Variance", "Var %"]
        rows = [[m["account"], m["category"],
                 fmt_gbp(m["value"]), fmt_gbp(m["prior_value"]),
                 fmt_gbp(m["variance"]), fmt_pct(m["variance_pct"])]
                for m in movements[:20]]
        t = ax2.table(cellText=rows, colLabels=cols, loc="center")
        t.auto_set_font_size(False)
        t.set_fontsize(8)
        t.scale(1, 1.4)
        pdf.savefig(fig2, bbox_inches="tight")
        plt.close(fig2)

    buf.seek(0)
    return buf.getvalue()
