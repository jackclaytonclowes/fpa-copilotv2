"""NHS GP practice per-patient and per-partner KPI calculations.

Called from api.py only when session['sector'] == 'nhs_gp'.
All functions accept the raw period_data dict returned by get_period_data()
and return a dict that is merged into the API response under the key 'nhs_kpis'.
"""

from __future__ import annotations


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

    Returns:
        Dict with keys: list_size, income_per_patient, cost_per_patient,
        profit_per_patient, and optionally income_per_partner / profit_per_partner.
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


def nhs_kpi_cards(nhs_kpis: dict) -> list[dict]:
    """Convert nhs_kpis dict into KpiCard-compatible dicts for the frontend."""
    ls = nhs_kpis.get("list_size") or 0

    def _card(label, value, icon, hint=None):
        return {
            "label":    label,
            "value":    value,
            "icon":     icon,
            "is_nhs":   True,
            "hint":     hint or "",
            "pct_only": False,
        }

    cards = []
    if ls:
        cards.append(_card("List size", ls, "users", "Weighted registered patients"))

    ipp = nhs_kpis.get("income_per_patient")
    if ipp is not None:
        cards.append(_card("Income / patient", ipp, "heart-pulse", "Annual income per weighted patient"))

    cpp = nhs_kpis.get("cost_per_patient")
    if cpp is not None:
        cards.append(_card("Cost / patient", cpp, "activity", "Annual cost per weighted patient"))

    ppp = nhs_kpis.get("profit_per_patient")
    if ppp is not None:
        cards.append(_card("Surplus / patient", ppp, "trending-up", "Annual surplus per weighted patient"))

    if "income_per_partner" in nhs_kpis and nhs_kpis["income_per_partner"] is not None:
        cards.append(_card("Income / partner", nhs_kpis["income_per_partner"], "briefcase", "Annual income per WTE partner"))

    return cards
