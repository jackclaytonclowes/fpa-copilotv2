"""
Test suite for the NHS GP sector layer.
Run with: pytest tests/test_nhs_gp.py -v

Covers kpis/nhs_gp.py, classifications/nhs_gp.json, the api.py NHS helpers
(_adapt_commentary_for_nhs, _nhs_ytd_movements), and the /api/demo-gp and
/api/session/{id}/settings endpoints.

These tests are intentionally separate from test_analysis.py so the NHS layer
can be removed or toggled independently without touching the core test suite.
"""
import sys
import os
import pytest
import pandas as pd
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from kpis.nhs_gp import (
    classify_workforce_role,
    is_locum_account,
    is_seasonal_nhs,
    compute_nhs_kpis,
    compute_workforce_breakdown,
    compute_utilisation,
    nhs_kpi_cards,
)
import analysis


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def gp_df():
    """Minimal 3-month NHS GP P&L DataFrame."""
    months = ["Jan 2025", "Feb 2025", "Mar 2025"]
    return pd.DataFrame({
        "Account": [
            "GMS Global Sum",
            "QOF - Quality and Outcomes",
            "Enhanced Services - Extended Hours",
            "Total Turnover",
            "Clinical Staff Salaries",
            "ARRS Salary - Clinical Pharmacist",
            "ARRS Salary - Social Prescriber",
            "Locum Costs",
            "Admin Staff Wages",
            "Practice Manager Salary",
            "Employer NI",
            "NHS Pension Contributions",
            "Total Staff Costs",
            "GP Partners' Drawings",
            "Total Management Costs",
            "Building Rent",
            "Total Premises Costs",
            "Net Surplus",
        ],
        "Section": [
            "Turnover", "Turnover", "Turnover", "Turnover",
            "Staff Costs", "Staff Costs", "Staff Costs", "Staff Costs",
            "Staff Costs", "Staff Costs", "Staff Costs", "Staff Costs", "Staff Costs",
            "Management Costs", "Management Costs",
            "Premises Costs", "Premises Costs",
            "Profit",
        ],
        "Jan 2025": [79000, 15200, 3100, 97300, 29500, 4500, 2200, 2000, 10400, 4800, 6900, 5800, 66100, 25000, 25000, 5500, 5500, 700],
        "Feb 2025": [78600, 15200, 3100, 96900, 29500, 4500, 2200, 4500, 10400, 4800, 7200, 5800, 68900, 25000, 25000, 5500, 5500, -1500],
        "Mar 2025": [79200, 15200, 3100, 97500, 29500, 4500, 2200, 3000, 10400, 4800, 7000, 5800, 67200, 25000, 25000, 5500, 5500, -200],
    })


@pytest.fixture
def gp_analysis(gp_df):
    """Build analysis DataFrames from the GP fixture."""
    sector_synonyms = analysis.load_sector_synonyms("nhs_gp")
    df_long = analysis.build_long(gp_df, "monthly")
    analysis_df = analysis.build_analysis(df_long, sector_synonyms)
    return df_long, analysis_df


@pytest.fixture
def sample_movements():
    """Representative movements list for an NHS GP period."""
    return [
        {"account": "Clinical Staff Salaries",         "category": "Staff Costs",     "value": 29500},
        {"account": "ARRS Salary - Clinical Pharmacist","category": "Staff Costs",     "value": 4500},
        {"account": "ARRS Salary - Social Prescriber",  "category": "Staff Costs",     "value": 2200},
        {"account": "Locum Costs",                      "category": "Staff Costs",     "value": 2000},
        {"account": "Admin Staff Wages",                "category": "Staff Costs",     "value": 10400},
        {"account": "Practice Manager Salary",          "category": "Management Costs","value": 4800},
        {"account": "GP Partners' Drawings",            "category": "Management Costs","value": 25000},
        {"account": "Employer NI",                      "category": "Staff Costs",     "value": 6900},
        {"account": "NHS Pension Contributions",        "category": "Staff Costs",     "value": 5800},
        {"account": "GMS Global Sum",                   "category": "Revenue",         "value": 79000},
        {"account": "QOF - Quality and Outcomes",       "category": "Revenue",         "value": 15200},
    ]


# ─────────────────────────────────────────────────────────────────────────────
# classify_workforce_role
# ─────────────────────────────────────────────────────────────────────────────

class TestClassifyWorkforceRole:
    def test_clinical_staff_salaries(self):
        assert classify_workforce_role("Clinical Staff Salaries") == "clinical"

    def test_arrs_pharmacist(self):
        assert classify_workforce_role("ARRS Salary - Clinical Pharmacist") == "clinical"

    def test_arrs_social_prescriber(self):
        assert classify_workforce_role("ARRS Salary - Social Prescriber") == "clinical"

    def test_salaried_gp(self):
        assert classify_workforce_role("Salaried GP Cost") == "clinical"

    def test_nurse_practitioner(self):
        assert classify_workforce_role("Nurse Practitioner Salary") == "clinical"

    def test_locum_is_locum(self):
        assert classify_workforce_role("Locum Costs") == "locum"

    def test_sessional_is_locum(self):
        assert classify_workforce_role("Sessional GP Fees") == "locum"

    def test_agency_is_locum(self):
        assert classify_workforce_role("Agency Staff") == "locum"

    def test_practice_manager(self):
        assert classify_workforce_role("Practice Manager Salary") == "management"

    def test_admin_wages(self):
        assert classify_workforce_role("Admin Staff Wages") == "admin"

    def test_receptionist(self):
        assert classify_workforce_role("Receptionist Salary") == "admin"

    def test_partner_drawings_clinical(self):
        assert classify_workforce_role("GP Partners' Drawings") == "clinical"

    def test_employer_ni_other(self):
        # Employer NI doesn't match any role keyword → other
        assert classify_workforce_role("Employer NI") == "other"

    def test_nhs_pension_other(self):
        assert classify_workforce_role("NHS Pension Contributions") == "other"

    def test_unknown_other(self):
        assert classify_workforce_role("Sundry Costs") == "other"


# ─────────────────────────────────────────────────────────────────────────────
# is_locum_account
# ─────────────────────────────────────────────────────────────────────────────

class TestIsLocumAccount:
    def test_locum_costs_true(self):
        assert is_locum_account("Locum Costs") is True

    def test_sessional_true(self):
        assert is_locum_account("Sessional GP Fees") is True

    def test_clinical_staff_false(self):
        assert is_locum_account("Clinical Staff Salaries") is False

    def test_gms_false(self):
        assert is_locum_account("GMS Global Sum") is False

    def test_case_insensitive(self):
        assert is_locum_account("LOCUM COVER") is True


# ─────────────────────────────────────────────────────────────────────────────
# is_seasonal_nhs
# ─────────────────────────────────────────────────────────────────────────────

class TestIsSeasonalNhs:
    def test_qof_june_is_seasonal(self):
        assert is_seasonal_nhs("QOF - Quality and Outcomes", 6) is True

    def test_qof_july_not_seasonal(self):
        assert is_seasonal_nhs("QOF - Quality and Outcomes", 7) is False

    def test_enhanced_services_january_seasonal(self):
        assert is_seasonal_nhs("Enhanced Services - Childhood Immunisation", 1) is True

    def test_enhanced_services_april_seasonal(self):
        assert is_seasonal_nhs("Enhanced Services - Extended Hours", 4) is True

    def test_enhanced_services_june_not_seasonal(self):
        assert is_seasonal_nhs("Enhanced Services - Extended Hours", 6) is False

    def test_pcn_quarterly_months(self):
        for month in (1, 4, 7, 10):
            assert is_seasonal_nhs("PCN Development Fund", month) is True

    def test_pcn_non_quarterly_not_seasonal(self):
        for month in (2, 3, 5, 6, 8, 9, 11, 12):
            assert is_seasonal_nhs("PCN Development Fund", month) is False

    def test_gms_never_seasonal(self):
        for month in range(1, 13):
            assert is_seasonal_nhs("GMS Global Sum", month) is False


# ─────────────────────────────────────────────────────────────────────────────
# compute_nhs_kpis
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeNhsKpis:
    def _period_data(self, revenue=120000, costs=110000, profit=10000):
        return {"kpis": [
            {"value": revenue, "icon": "trending-up"},
            {"value": costs,   "icon": "receipt"},
            {"value": profit,  "icon": "wallet"},
        ]}

    def test_per_patient_ratios(self):
        data = self._period_data(120000, 110000, 10000)
        result = compute_nhs_kpis(data, list_size=10000)
        assert result["income_per_patient"]  == pytest.approx(12.0, abs=0.01)
        assert result["cost_per_patient"]    == pytest.approx(11.0, abs=0.01)
        assert result["profit_per_patient"]  == pytest.approx(1.0,  abs=0.01)

    def test_per_partner_with_wte(self):
        data = self._period_data(120000, 110000, 10000)
        result = compute_nhs_kpis(data, list_size=10000, wte_partners=3.0)
        assert result["income_per_partner"]  == pytest.approx(40000.0, abs=1.0)
        assert result["profit_per_partner"]  == pytest.approx(3333.33, abs=1.0)

    def test_no_partner_keys_when_wte_zero(self):
        data = self._period_data()
        result = compute_nhs_kpis(data, list_size=9200, wte_partners=0)
        assert "income_per_partner" not in result
        assert "profit_per_partner" not in result

    def test_zero_list_size_returns_early(self):
        result = compute_nhs_kpis({}, list_size=0)
        assert result == {"list_size": 0}

    def test_negative_list_size_returns_early(self):
        result = compute_nhs_kpis({}, list_size=-1)
        assert result == {"list_size": -1}

    def test_list_size_present_in_output(self):
        data = self._period_data()
        result = compute_nhs_kpis(data, list_size=9200)
        assert result["list_size"] == 9200


# ─────────────────────────────────────────────────────────────────────────────
# compute_workforce_breakdown
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeWorkforceBreakdown:
    def test_all_roles_present_in_output(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        assert set(result.keys()) == {"clinical", "locum", "management", "admin", "other"}

    def test_clinical_total(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        # clinical staff + ARRS pharmacist + ARRS social prescriber + partner drawings
        assert result["clinical"]["total"] == pytest.approx(29500 + 4500 + 2200 + 25000, abs=1)

    def test_locum_total(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        assert result["locum"]["total"] == pytest.approx(2000, abs=1)

    def test_admin_total(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        assert result["admin"]["total"] == pytest.approx(10400, abs=1)

    def test_management_total(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        # Practice Manager only (partner drawings goes to clinical via "drawings" keyword)
        assert result["management"]["total"] == pytest.approx(4800, abs=1)

    def test_revenue_rows_excluded(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        # GMS and QOF are Revenue category — should not appear in any bucket
        total_all = sum(v["total"] for v in result.values())
        assert total_all < 200_000  # no revenue rows inflating totals

    def test_empty_movements(self):
        result = compute_workforce_breakdown([])
        assert all(v["total"] == 0 for v in result.values())

    def test_accounts_list_populated(self, sample_movements):
        result = compute_workforce_breakdown(sample_movements)
        assert "Clinical Staff Salaries" in result["clinical"]["accounts"]
        assert "Locum Costs" in result["locum"]["accounts"]


# ─────────────────────────────────────────────────────────────────────────────
# compute_utilisation
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeUtilisation:
    def _arrs_movements(self, spend=80400):
        """Movements with a given ARRS spend total."""
        return [
            {"account": "ARRS Salary - Clinical Pharmacist", "category": "Staff Costs", "value": spend * 0.67},
            {"account": "ARRS Salary - Social Prescriber",   "category": "Staff Costs", "value": spend * 0.33},
        ]

    def _qof_movements(self, income=189800):
        return [{"account": "QOF - Quality and Outcomes", "category": "Revenue", "value": income}]

    def test_arrs_utilisation_pct(self):
        mvts = self._arrs_movements(80400)
        result = compute_utilisation(mvts, arrs_allocation=125000, qof_entitlement=None)
        assert "arrs" in result
        assert result["arrs"]["utilisation_pct"] == pytest.approx(80400 / 125000 * 100, abs=0.2)

    def test_arrs_remaining(self):
        mvts = self._arrs_movements(80400)
        result = compute_utilisation(mvts, arrs_allocation=125000, qof_entitlement=None)
        assert result["arrs"]["remaining"] == pytest.approx(125000 - 80400, abs=1)

    def test_qof_achievement_pct(self):
        mvts = self._qof_movements(189800)
        result = compute_utilisation(mvts, arrs_allocation=None, qof_entitlement=188000)
        assert "qof" in result
        assert result["qof"]["achievement_pct"] == pytest.approx(189800 / 188000 * 100, abs=0.1)

    def test_qof_gap_zero_when_over(self):
        mvts = self._qof_movements(189800)
        result = compute_utilisation(mvts, arrs_allocation=None, qof_entitlement=188000)
        # gap is entitlement - income, can be negative when over-achieved
        assert result["qof"]["gap"] == pytest.approx(188000 - 189800, abs=1)

    def test_no_arrs_key_when_allocation_missing(self):
        result = compute_utilisation([], arrs_allocation=None, qof_entitlement=188000)
        assert "arrs" not in result

    def test_no_qof_key_when_entitlement_missing(self):
        result = compute_utilisation([], arrs_allocation=125000, qof_entitlement=None)
        assert "qof" not in result

    def test_no_arrs_key_when_allocation_zero(self):
        result = compute_utilisation([], arrs_allocation=0, qof_entitlement=None)
        assert "arrs" not in result

    def test_both_absent_returns_empty(self):
        result = compute_utilisation([], arrs_allocation=None, qof_entitlement=None)
        assert result == {}

    def test_non_revenue_qof_rows_excluded(self):
        # A QOF account in Staff Costs should NOT count as QOF income
        mvts = [{"account": "QOF Admin Costs", "category": "Staff Costs", "value": 5000}]
        result = compute_utilisation(mvts, arrs_allocation=None, qof_entitlement=188000)
        assert result["qof"]["income"] == pytest.approx(0, abs=1)


# ─────────────────────────────────────────────────────────────────────────────
# nhs_kpi_cards
# ─────────────────────────────────────────────────────────────────────────────

class TestNhsKpiCards:
    def _full_nhs(self):
        return {
            "list_size":          9200,
            "income_per_patient": 146.6,
            "cost_per_patient":   140.0,
            "profit_per_patient": 6.6,
            "income_per_partner": 450000,
            "arrs": {"utilisation_pct": 64.3, "spend": 80400, "allocation": 125000, "remaining": 44600},
            "qof":  {"achievement_pct": 101.0, "income": 189800, "entitlement": 188000, "gap": -1800},
        }

    def test_returns_list(self):
        cards = nhs_kpi_cards(self._full_nhs())
        assert isinstance(cards, list)

    def test_list_size_card_present(self):
        cards = nhs_kpi_cards(self._full_nhs())
        labels = [c["label"] for c in cards]
        assert "List size" in labels

    def test_list_size_fmt_is_number(self):
        cards = nhs_kpi_cards(self._full_nhs())
        ls = next(c for c in cards if c["label"] == "List size")
        assert ls["fmt"] == "number"
        assert ls["value"] == 9200

    def test_per_patient_cards_present(self):
        cards = nhs_kpi_cards(self._full_nhs())
        labels = [c["label"] for c in cards]
        assert "Income / patient" in labels
        assert "Cost / patient" in labels
        assert "Surplus / patient" in labels

    def test_arrs_card_pct_fmt(self):
        cards = nhs_kpi_cards(self._full_nhs())
        arrs = next((c for c in cards if c["label"] == "ARRS utilisation"), None)
        assert arrs is not None
        assert arrs["fmt"] == "pct"
        assert arrs["pct_only"] is True
        assert arrs["value"] == pytest.approx(64.3, abs=0.1)

    def test_qof_card_present(self):
        cards = nhs_kpi_cards(self._full_nhs())
        qof = next((c for c in cards if c["label"] == "QOF achievement"), None)
        assert qof is not None
        assert qof["fmt"] == "pct"

    def test_no_list_size_returns_empty(self):
        cards = nhs_kpi_cards({"list_size": 0})
        assert cards == []

    def test_all_cards_have_is_nhs_true(self):
        cards = nhs_kpi_cards(self._full_nhs())
        assert all(c.get("is_nhs") is True for c in cards)

    def test_without_arrs_no_arrs_card(self):
        kpis = self._full_nhs()
        del kpis["arrs"]
        labels = [c["label"] for c in nhs_kpi_cards(kpis)]
        assert "ARRS utilisation" not in labels

    def test_without_qof_no_qof_card(self):
        kpis = self._full_nhs()
        del kpis["qof"]
        labels = [c["label"] for c in nhs_kpi_cards(kpis)]
        assert "QOF achievement" not in labels


# ─────────────────────────────────────────────────────────────────────────────
# NHS synonyms via load_sector_synonyms
# ─────────────────────────────────────────────────────────────────────────────

class TestNhsSynonyms:
    @pytest.fixture(autouse=True)
    def synonyms(self):
        self.syns = analysis.load_sector_synonyms("nhs_gp")

    def test_returns_dict(self):
        assert isinstance(self.syns, dict)

    def test_gms_maps_to_revenue(self):
        assert self.syns.get("gms contract") == "Revenue"

    def test_qof_maps_to_revenue(self):
        assert self.syns.get("qof") == "Revenue"

    def test_locum_maps_to_staff_costs(self):
        assert self.syns.get("locum") == "Staff Costs"

    def test_arrs_salary_maps_to_staff_costs(self):
        assert self.syns.get("arrs salary") == "Staff Costs"

    def test_emis_maps_to_it_costs(self):
        assert self.syns.get("emis") == "IT Costs"

    def test_practice_manager_maps_to_management(self):
        assert self.syns.get("practice manager") == "Management Costs"

    def test_synonyms_applied_in_classify(self):
        # "GMS Global Sum" contains "global sum" synonym → Revenue
        cat = analysis.classify("GMS Global Sum", section="Turnover",
                                extra_overrides=self.syns)
        assert cat == "Revenue"

    def test_unknown_sector_returns_empty(self):
        assert analysis.load_sector_synonyms("nonexistent_sector") == {}


# ─────────────────────────────────────────────────────────────────────────────
# build_analysis with NHS synonyms (integration)
# ─────────────────────────────────────────────────────────────────────────────

class TestNhsBuildAnalysis:
    def test_gms_classified_as_revenue(self, gp_df):
        syns = analysis.load_sector_synonyms("nhs_gp")
        df_long = analysis.build_long(gp_df, "monthly")
        df_a = analysis.build_analysis(df_long, syns)
        gms_rows = df_a[df_a["Account"] == "GMS Global Sum"]
        assert len(gms_rows) > 0
        assert (gms_rows["Category"] == "Revenue").all()

    def test_locum_classified_as_staff_costs(self, gp_df):
        syns = analysis.load_sector_synonyms("nhs_gp")
        df_long = analysis.build_long(gp_df, "monthly")
        df_a = analysis.build_analysis(df_long, syns)
        locum_rows = df_a[df_a["Account"] == "Locum Costs"]
        assert len(locum_rows) > 0
        assert (locum_rows["Category"] == "Staff Costs").all()

    def test_net_surplus_is_subtotal(self, gp_df):
        syns = analysis.load_sector_synonyms("nhs_gp")
        df_long = analysis.build_long(gp_df, "monthly")
        df_a = analysis.build_analysis(df_long, syns)
        surplus = df_a[df_a["Account"] == "Net Surplus"]
        assert len(surplus) > 0
        assert surplus["Is Subtotal"].all()

    def test_three_periods_present(self, gp_analysis):
        df_long, df_a = gp_analysis
        periods = df_a["Period"].unique()
        assert len(periods) == 3


# ─────────────────────────────────────────────────────────────────────────────
# _adapt_commentary_for_nhs (api helper)
# ─────────────────────────────────────────────────────────────────────────────

class TestAdaptCommentaryForNhs:
    @pytest.fixture(autouse=True)
    def import_helper(self):
        # Import the private helper directly from api module
        import importlib, types
        # Avoid spinning up the full FastAPI app — just parse the substitution table
        # by importing the module (it is safe to import at module level)
        import api as api_mod
        self.adapt = api_mod._adapt_commentary_for_nhs

    def test_operating_profit_to_net_surplus(self):
        inp = [{"html": "<b>Operating profit improved</b> by £5,000.", "fav": True}]
        out = self.adapt(inp)
        assert "Net Surplus" in out[0]["html"]
        assert "Operating profit" not in out[0]["html"]

    def test_revenue_to_income(self):
        inp = [{"html": "Revenue increased by <b>£12,000</b> vs prior.", "fav": True}]
        out = self.adapt(inp)
        assert "Income increased" in out[0]["html"]

    def test_profit_in_sentence_to_surplus(self):
        inp = [{"html": "<b>Staff Costs</b> decreased, improving profit.", "fav": True}]
        out = self.adapt(inp)
        assert "surplus" in out[0]["html"].lower()

    def test_original_dict_unchanged(self):
        # Should return a new list of new dicts — not mutate in place
        inp = [{"html": "Revenue increased.", "fav": True, "extra": "x"}]
        out = self.adapt(inp)
        assert inp[0]["html"] == "Revenue increased."  # original untouched
        assert out[0]["html"] == "Income increased."

    def test_non_html_fields_preserved(self):
        inp = [{"html": "Revenue up.", "fav": True, "icon": "arrow-up", "source": {"x": 1}}]
        out = self.adapt(inp)
        assert out[0]["fav"] is True
        assert out[0]["icon"] == "arrow-up"
        assert out[0]["source"] == {"x": 1}

    def test_empty_list(self):
        assert self.adapt([]) == []

    def test_multiple_substitutions_in_one_html(self):
        inp = [{"html": "Revenue fell by £3k. Operating profit declined 5%.", "fav": False}]
        out = self.adapt(inp)
        html = out[0]["html"]
        assert "Revenue" not in html
        assert "Operating profit" not in html


# ─────────────────────────────────────────────────────────────────────────────
# _nhs_ytd_movements (api helper)
# ─────────────────────────────────────────────────────────────────────────────

class TestNhsYtdMovements:
    @pytest.fixture(autouse=True)
    def import_helper(self, gp_df):
        import api as api_mod
        self.helper = api_mod._nhs_ytd_movements

        syns = analysis.load_sector_synonyms("nhs_gp")
        df_long = analysis.build_long(gp_df, "monthly")
        df_a = analysis.build_analysis(df_long, syns)
        self.session = {
            "analysis_m": df_a,
            "analysis_q": analysis.build_analysis(analysis.build_long(gp_df, "quarterly"), syns),
        }
        self.periods = sorted(df_a["Period"].unique(), key=pd.Timestamp)

    def test_returns_list_of_dicts(self):
        result = self.helper(self.session, self.periods[-1])
        assert isinstance(result, list)
        assert all(isinstance(r, dict) for r in result)

    def test_each_dict_has_required_keys(self):
        result = self.helper(self.session, self.periods[-1])
        for r in result:
            assert "account" in r
            assert "category" in r
            assert "value" in r

    def test_full_year_more_rows_than_single_period(self):
        single = self.helper(self.session, self.periods[0])
        full   = self.helper(self.session, self.periods[-1])
        assert len(full) > len(single)

    def test_subtotals_excluded(self):
        result = self.helper(self.session, self.periods[-1])
        accounts = [r["account"] for r in result]
        assert "Net Surplus" not in accounts
        assert "Total Turnover" not in accounts
        assert "Total Staff Costs" not in accounts

    def test_arrs_accounts_present_in_ytd(self):
        result = self.helper(self.session, self.periods[-1])
        accounts = [r["account"] for r in result]
        assert "ARRS Salary - Clinical Pharmacist" in accounts
        assert "ARRS Salary - Social Prescriber" in accounts

    def test_ytd_values_cumulative(self):
        # Full year ARRS pharmacist total should be 3× the Jan value (3 equal months)
        result = self.helper(self.session, self.periods[-1])
        arrs_total = sum(r["value"] for r in result
                         if r["account"] == "ARRS Salary - Clinical Pharmacist")
        assert arrs_total == pytest.approx(4500 * 3, abs=1)

    def test_empty_session_returns_empty(self):
        result = self.helper({}, "2025-01-01")
        assert result == []


# ─────────────────────────────────────────────────────────────────────────────
# /api/demo-gp endpoint (FastAPI TestClient)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    from fastapi.testclient import TestClient
    import api as api_mod
    return TestClient(api_mod.app)


class TestDemoGpEndpoint:
    def test_status_200(self, client):
        r = client.get("/api/demo-gp")
        assert r.status_code == 200

    def test_returns_json(self, client):
        r = client.get("/api/demo-gp")
        data = r.json()
        assert isinstance(data, dict)

    def test_sector_is_nhs_gp(self, client):
        data = client.get("/api/demo-gp").json()
        assert data["sector"] == "nhs_gp"

    def test_list_size_9200(self, client):
        data = client.get("/api/demo-gp").json()
        assert data["list_size"] == 9200

    def test_session_id_returned(self, client):
        data = client.get("/api/demo-gp").json()
        assert "session_id" in data
        assert len(data["session_id"]) == 36  # UUID format

    def test_nhs_kpi_cards_present(self, client):
        data = client.get("/api/demo-gp").json()
        assert "nhs_kpi_cards" in data
        assert len(data["nhs_kpi_cards"]) >= 4  # list size, income/cost/surplus per patient

    def test_income_per_patient_reasonable(self, client):
        data = client.get("/api/demo-gp").json()
        nhs = data.get("nhs_kpis", {})
        ipp = nhs.get("income_per_patient")
        assert ipp is not None
        assert 5 <= ipp <= 30  # realistic NHS GP monthly income per patient

    def test_arrs_utilisation_card_present(self, client):
        data = client.get("/api/demo-gp").json()
        cards = data.get("nhs_kpi_cards", [])
        labels = [c["label"] for c in cards]
        assert "ARRS utilisation" in labels

    def test_arrs_utilisation_is_annual(self, client):
        # YTD annual ARRS spend: 4500*12 + 2200*12 = 80400; allocation 125000 → 64.3%
        data = client.get("/api/demo-gp").json()
        cards = data.get("nhs_kpi_cards", [])
        arrs = next(c for c in cards if c["label"] == "ARRS utilisation")
        assert arrs["value"] == pytest.approx(64.3, abs=2.0)

    def test_qof_achievement_card_present(self, client):
        data = client.get("/api/demo-gp").json()
        cards = data.get("nhs_kpi_cards", [])
        labels = [c["label"] for c in cards]
        assert "QOF achievement" in labels

    def test_workforce_breakdown_present(self, client):
        data = client.get("/api/demo-gp").json()
        assert "workforce_breakdown" in data
        wb = data["workforce_breakdown"]
        assert "clinical" in wb
        assert "locum" in wb

    def test_locum_flag_on_movements(self, client):
        data = client.get("/api/demo-gp").json()
        movements = data.get("movements", [])
        locum_mvts = [m for m in movements if m.get("is_locum")]
        assert len(locum_mvts) >= 1  # at least one locum line

    def test_commentary_uses_nhs_language(self, client):
        data = client.get("/api/demo-gp").json()
        commentary_html = " ".join(c.get("html", "") for c in data.get("commentary", []))
        # Should not contain generic "Operating profit" — should be "Net Surplus"
        assert "Operating profit" not in commentary_html
        # Should not have standalone "Revenue" where "Income" is preferred
        # (exact check varies, but "Operating profit" definitely should be gone)

    def test_twelve_periods(self, client):
        data = client.get("/api/demo-gp").json()
        periods = data.get("periods", [])
        assert len(periods) == 12


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /api/session/{session_id}/settings endpoint
# ─────────────────────────────────────────────────────────────────────────────

class TestSessionSettingsEndpoint:
    @pytest.fixture(autouse=True)
    def setup(self, client):
        # Create a demo-gp session to update
        r = client.get("/api/demo-gp")
        self.session_id = r.json()["session_id"]

    def test_patch_list_size(self, client):
        r = client.patch(f"/api/session/{self.session_id}/settings",
                         json={"list_size": 10500})
        assert r.status_code == 200
        assert r.json()["list_size"] == 10500

    def test_patch_wte_partners(self, client):
        r = client.patch(f"/api/session/{self.session_id}/settings",
                         json={"wte_partners": 4.0})
        assert r.status_code == 200
        assert r.json()["wte_partners"] == pytest.approx(4.0)

    def test_patch_arrs_allocation(self, client):
        r = client.patch(f"/api/session/{self.session_id}/settings",
                         json={"arrs_allocation": 150000})
        assert r.status_code == 200
        assert r.json()["arrs_allocation"] == pytest.approx(150000)

    def test_patch_qof_entitlement(self, client):
        r = client.patch(f"/api/session/{self.session_id}/settings",
                         json={"qof_entitlement": 200000})
        assert r.status_code == 200
        assert r.json()["qof_entitlement"] == pytest.approx(200000)

    def test_patch_partial_only_updates_specified_fields(self, client):
        # Set a known list_size first
        client.patch(f"/api/session/{self.session_id}/settings", json={"list_size": 9999})
        # Update only wte_partners
        r = client.patch(f"/api/session/{self.session_id}/settings",
                         json={"wte_partners": 2.5})
        assert r.json()["list_size"] == 9999   # unchanged
        assert r.json()["wte_partners"] == pytest.approx(2.5)

    def test_patch_returns_ok_true(self, client):
        r = client.patch(f"/api/session/{self.session_id}/settings", json={})
        assert r.json()["ok"] is True

    def test_patch_unknown_session_404(self, client):
        r = client.patch("/api/session/00000000-0000-0000-0000-000000000000/settings",
                         json={"list_size": 9200})
        assert r.status_code == 404

    def test_data_endpoint_reflects_new_list_size(self, client):
        # Update list_size, then fetch /api/data and verify nhs_kpis uses new size
        client.patch(f"/api/session/{self.session_id}/settings", json={"list_size": 5000})
        data = client.get(f"/api/data/{self.session_id}").json()
        nhs = data.get("nhs_kpis", {})
        assert nhs.get("list_size") == 5000
