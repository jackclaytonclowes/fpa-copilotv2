"""NHS GP practice per-patient, per-partner, and workforce KPI calculations.

Called from api.py only when session['sector'] == 'nhs_gp'.
"""

from __future__ import annotations
import json
from pathlib import Path

_NHS_JSON: dict | None = None

def _nhs_config() -> dict:
    global _NHS_JSON
    if _NHS_JSON is None:
        p = Path(__file__).parent.parent / "classifications" / "nhs_gp.json"
        _NHS_JSON = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    return _NHS_JSON


# ── Locum / role-type keyword helpers ─────────────────────────────────────────

def _matches_any(acc_lower: str, keywords: list[str]) -> bool:
    return any(kw in acc_lower for kw in keywords)


def classify_workforce_role(account: str) -> str:
    """Return 'locum', 'clinical', 'management', 'admin', or 'other' for a staff account."""
    acc = account.lower()
    role_types = _nhs_config().get("workforce_role_types", {})
    for role in ("locum", "clinical", "management", "admin"):
        if _matches_any(acc, role_types.get(role, [])):
            return role
    return "other"


def is_locum_account(account: str) -> bool:
    acc = account.lower()
    return _matches_any(acc, _nhs_config().get("workforce_role_types", {}).get("locum", []))


# ── Seasonal suppression ───────────────────────────────────────────────────────

def is_seasonal_nhs(account: str, period_month: int) -> bool:
    """Return True if this account's movement in this calendar month is a known
    NHS seasonal pattern (QOF in June, Enhanced Services quarterly, etc.)."""
    acc = account.lower()
    for pattern, months in _nhs_config().get("seasonal_patterns", {}).items():
        if pattern in acc and period_month in months:
            return True
    return False


# ── Per-patient / per-partner KPIs ────────────────────────────────────────────

def compute_nhs_kpis(
    period_data: dict,
    list_size: int,
    wte_partners: float | None = None,
) -> dict:
    """Return per-patient and per-partner KPIs for an NHS GP practice.

    Args:
        period_data:  The dict returned by get_period_data() for the selected period.
        list_size:    Weighted registered patient list size.
        wte_partners: Whole-time-equivalent GP partners (optional).
    """
    if not list_size or list_size <= 0:
        return {"list_size": list_size}

    kpis = period_data.get("kpis") or []
    rev    = next((k["value"] for k in kpis if k.get("icon") == "trending-up"), None)
    costs  = next((k["value"] for k in kpis if k.get("icon") == "receipt"),     None)
    profit = next((k["value"] for k in kpis if k.get("icon") == "wallet"),      None)

    def _per(val):
        return round(val / list_size, 2) if val is not None else None

    out: dict = {
        "list_size":           list_size,
        "income_per_patient":  _per(rev),
        "cost_per_patient":    _per(costs),
        "profit_per_patient":  _per(profit),
    }

    if wte_partners and wte_partners > 0:
        out["income_per_partner"] = round(rev    / wte_partners, 2) if rev    is not None else None
        out["profit_per_partner"] = round(profit / wte_partners, 2) if profit is not None else None

    return out


def compute_workforce_breakdown(movements: list[dict]) -> dict:
    """Break down staff cost movements into clinical / locum / management / admin.

    Args:
        movements: The movements list from get_period_data(), already filtered to
                   the selected period. Each item has 'account', 'category', 'value'.

    Returns:
        Dict with keys: clinical, locum, management, admin, other — each a dict with
        'total' (£) and 'accounts' (list of account names).
    """
    buckets: dict[str, dict] = {
        role: {"total": 0.0, "accounts": []}
        for role in ("clinical", "locum", "management", "admin", "other")
    }

    # We use all movements including those not in the top-15 movements list,
    # so we accept the movements list as-is and work with what's available.
    for m in movements:
        if m.get("category") not in ("Staff Costs", "Management Costs"):
            continue
        acc = m.get("account", "")
        val = m.get("value") or 0.0
        role = classify_workforce_role(acc)
        buckets[role]["total"] += float(val)
        buckets[role]["accounts"].append(acc)

    return buckets


def compute_utilisation(
    movements: list[dict],
    arrs_allocation: float | None,
    qof_entitlement: float | None,
) -> dict:
    """Compute ARRS spend utilisation and QOF income vs entitlement.

    Returns a dict with 'arrs' and 'qof' sub-dicts, each containing
    'spend'/'income', 'allocation'/'entitlement', and 'utilisation_pct'.
    """
    out: dict = {}

    # ARRS: sum of ARRS staff cost accounts
    arrs_keywords = ["arrs salary", "arrs staff", "arrs reimbursement", "additional roles"]
    arrs_spend = sum(
        abs(m.get("value") or 0.0)
        for m in movements
        if any(kw in (m.get("account") or "").lower() for kw in arrs_keywords)
    )
    if arrs_allocation and arrs_allocation > 0:
        out["arrs"] = {
            "spend":          round(arrs_spend, 2),
            "allocation":     arrs_allocation,
            "utilisation_pct": round(arrs_spend / arrs_allocation * 100, 1),
            "remaining":      round(arrs_allocation - arrs_spend, 2),
        }

    # QOF: sum of QOF income accounts
    qof_keywords = ["qof", "quality and outcomes", "quality outcomes"]
    qof_income = sum(
        abs(m.get("value") or 0.0)
        for m in movements
        if any(kw in (m.get("account") or "").lower() for kw in qof_keywords)
           and m.get("category") == "Revenue"
    )
    if qof_entitlement and qof_entitlement > 0:
        out["qof"] = {
            "income":          round(qof_income, 2),
            "entitlement":     qof_entitlement,
            "achievement_pct": round(qof_income / qof_entitlement * 100, 1),
            "gap":             round(qof_entitlement - qof_income, 2),
        }

    return out


# ── ARRS role caps (NHSE 2024/25, incl. employer NI + pension) ────────────────
# Each entry: (key, display_name, account_keywords, annual_cap_gbp)
_ARRS_ROLES: list[tuple[str, str, list[str], int]] = [
    ("clinical_pharmacist",   "Clinical Pharmacist",            ["clinical pharmacist"],                            67900),
    ("pharmacy_technician",   "Pharmacy Technician",            ["pharmacy technician"],                            43642),
    ("social_prescriber",     "Social Prescribing Link Worker", ["social prescrib", "link worker"],                 37191),
    ("health_coach",          "Health & Wellbeing Coach",       ["health and wellbeing coach", "hwb coach",
                                                                  "health coach", "wellbeing coach"],                37191),
    ("care_coordinator",      "Care Coordinator",               ["care coordinator", "care co-ordinator"],          37191),
    ("first_contact_physio",  "First Contact Physiotherapist",  ["physiotherap", "first contact physio",
                                                                  "fcp physio"],                                     70097),
    ("physician_associate",   "Physician Associate",            ["physician associate", " pa "],                    56257),
    ("mental_health",         "Mental Health Practitioner",     ["mental health practitioner", "mhp "],             70097),
    ("paramedic",             "Paramedic",                      ["paramedic", "community paramedic"],               70097),
    ("advanced_practitioner", "Advanced Practitioner",          ["advanced practitioner", "advanced nurse",
                                                                  " anp ", "advanced clinical practitioner"],        80693),
    ("gp_assistant",          "GP Assistant",                   ["gp assistant", " gpa "],                          37191),
]

_ARRS_GENERIC_KWS = ["arrs salary", "arrs staff", "arrs reimbursement", "additional roles reimbursement"]


def compute_arrs_headcount(
    ytd_movements: list[dict],
    arrs_allocation: float | None,
    months_elapsed: int = 12,
) -> dict:
    """Break down YTD ARRS spend by role and estimate headcount (WTE).

    WTE is computed as: (ytd_spend / months_elapsed * 12) / annual_cap
    meaning a full-year run-rate divided by the NHSE maximum reimbursable salary.

    Returns:
        {roles: [...], total_ytd_spend, total_annual_rate, arrs_allocation, months_elapsed}
    """
    me = max(months_elapsed, 1)
    roles_out: list[dict] = []
    claimed_accounts: set[str] = set()

    for key, display, keywords, annual_cap in _ARRS_ROLES:
        matched = [
            m for m in ytd_movements
            if any(kw in (m.get("account") or "").lower() for kw in keywords)
        ]
        ytd_spend = sum(abs(m.get("value") or 0.0) for m in matched)
        for m in matched:
            claimed_accounts.add(m.get("account", ""))

        if ytd_spend <= 0:
            continue

        monthly_avg  = ytd_spend / me
        annual_rate  = monthly_avg * 12
        wte          = round(annual_rate / annual_cap, 2)
        pct_of_cap   = round(annual_rate / annual_cap * 100, 1)

        roles_out.append({
            "key":         key,
            "role":        display,
            "ytd_spend":   round(ytd_spend),
            "monthly_avg": round(monthly_avg),
            "annual_rate": round(annual_rate),
            "annual_cap":  annual_cap,
            "wte_est":     wte,
            "pct_of_cap":  pct_of_cap,
        })

    # Catch any ARRS spend not matched by the known-role table
    other = [
        m for m in ytd_movements
        if (
            any(kw in (m.get("account") or "").lower() for kw in _ARRS_GENERIC_KWS)
            and m.get("account", "") not in claimed_accounts
        )
    ]
    if other:
        ytd_spend  = sum(abs(m.get("value") or 0.0) for m in other)
        monthly_avg = ytd_spend / me
        roles_out.append({
            "key":         "other_arrs",
            "role":        "Other ARRS roles",
            "ytd_spend":   round(ytd_spend),
            "monthly_avg": round(monthly_avg),
            "annual_rate": round(monthly_avg * 12),
            "annual_cap":  None,
            "wte_est":     None,
            "pct_of_cap":  None,
        })

    total_ytd   = sum(r["ytd_spend"]   for r in roles_out)
    total_ann   = sum(r["annual_rate"]  for r in roles_out)

    return {
        "roles":             roles_out,
        "total_ytd_spend":   round(total_ytd),
        "total_annual_rate": round(total_ann),
        "arrs_allocation":   arrs_allocation or 0,
        "months_elapsed":    me,
    }


def nhs_kpi_cards(nhs_kpis: dict) -> list[dict]:
    """Convert nhs_kpis dict into KpiCard-compatible dicts for the frontend."""
    ls = nhs_kpis.get("list_size") or 0

    def _card(label, value, icon, hint=None, fmt="currency"):
        return {
            "label":    label,
            "value":    value,
            "icon":     icon,
            "is_nhs":   True,
            "hint":     hint or "",
            "pct_only": False,
            "fmt":      fmt,
        }

    cards = []
    if ls:
        cards.append(_card("List size", ls, "users", "Weighted registered patients", fmt="number"))

    ipp = nhs_kpis.get("income_per_patient")
    if ipp is not None:
        cards.append(_card("Income / patient", ipp, "heart-pulse", "Annual income per weighted patient"))

    cpp = nhs_kpis.get("cost_per_patient")
    if cpp is not None:
        cards.append(_card("Cost / patient", cpp, "activity", "Annual cost per weighted patient"))

    ppp = nhs_kpis.get("profit_per_patient")
    if ppp is not None:
        cards.append(_card("Surplus / patient", ppp, "trending-up", "Annual surplus per weighted patient"))

    if nhs_kpis.get("income_per_partner") is not None:
        cards.append(_card("Income / partner", nhs_kpis["income_per_partner"], "briefcase", "Annual income per WTE partner"))

    # ARRS utilisation card
    arrs = nhs_kpis.get("arrs")
    if arrs:
        cards.append({
            "label":    "ARRS utilisation",
            "value":    arrs["utilisation_pct"],
            "icon":     "percent",
            "is_nhs":   True,
            "hint":     f"£{arrs['spend']:,.0f} spent of £{arrs['allocation']:,.0f} allocation",
            "pct_only": True,
            "fmt":      "pct",
        })

    # QOF achievement card
    qof = nhs_kpis.get("qof")
    if qof:
        cards.append({
            "label":    "QOF achievement",
            "value":    qof["achievement_pct"],
            "icon":     "check-circle",
            "is_nhs":   True,
            "hint":     f"£{qof['income']:,.0f} of £{qof['entitlement']:,.0f} entitlement",
            "pct_only": True,
            "fmt":      "pct",
        })

    return cards
