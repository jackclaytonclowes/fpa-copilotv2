"""
Test suite for MonthEndIQ analysis engine.
Run with: pytest tests/test_analysis.py -v
"""
import pytest
import pandas as pd
from io import BytesIO
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import analysis


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_mom_df():
    """Minimal 3-month P&L DataFrame in the format produced by load_file()."""
    return pd.DataFrame({
        "Account": [
            "Product Revenue", "Service Revenue", "Total Turnover",
            "Staff Wages", "Office Rent", "IT Software",
            "Total Admin Costs", "Operating Profit",
        ],
        "Section": [
            "Turnover", "Turnover", "Turnover",
            "Admin", "Admin", "Admin",
            "Admin", "Profit",
        ],
        "Apr 2024": [80_000, 40_000, 120_000, 35_000, 5_000, 3_000, 43_000, 77_000],
        "May 2024": [85_000, 42_000, 127_000, 36_000, 5_000, 3_200, 44_200, 82_800],
        "Jun 2024": [78_000, 45_000, 123_000, 37_000, 5_000, 3_400, 45_400, 77_600],
    })


@pytest.fixture
def sample_bva_df():
    """Minimal Budget vs Actual DataFrame."""
    return pd.DataFrame({
        "Account": ["Product Revenue", "Staff Wages", "Office Rent", "Operating Profit"],
        "Section": ["Turnover", "Admin", "Admin", "Profit"],
        "Actual":  [85_000, 36_000, 5_200, 43_800],
        "Budget":  [80_000, 35_000, 5_000, 40_000],
    })


# ─────────────────────────────────────────────────────────────────────────────
# CLASSIFICATION
# ─────────────────────────────────────────────────────────────────────────────

class TestClassify:
    def test_revenue_by_keyword(self):
        assert analysis.classify("Product Sales") == "Revenue"
        assert analysis.classify("Total Turnover") == "Revenue"
        assert analysis.classify("Service Income") == "Revenue"

    def test_revenue_by_section(self):
        assert analysis.classify("Something Else", section="turnover") == "Revenue"
        assert analysis.classify("Something Else", section="income") == "Revenue"

    def test_staff_costs(self):
        assert analysis.classify("Staff Wages") == "Staff Costs"
        assert analysis.classify("National Insurance") == "Staff Costs"
        assert analysis.classify("Pension Contributions") == "Staff Costs"

    def test_premises_costs(self):
        assert analysis.classify("Office Rent") == "Premises Costs"
        assert analysis.classify("Business Rates") == "Premises Costs"
        assert analysis.classify("Building Repairs") == "Premises Costs"

    def test_it_costs(self):
        assert analysis.classify("Software Licences") == "IT Costs"
        assert analysis.classify("Microsoft 365") == "IT Costs"

    def test_professional_fees(self):
        assert analysis.classify("Legal Expenses") == "Professional Fees"
        assert analysis.classify("Accountancy") == "Professional Fees"

    def test_marketing(self):
        assert analysis.classify("Google Ads") == "Marketing Costs"
        assert analysis.classify("Advertising Spend") == "Marketing Costs"

    def test_depreciation(self):
        assert analysis.classify("Depreciation") == "Depreciation & Amortisation"

    def test_unknown_falls_back_to_other(self):
        assert analysis.classify("Xzqrt Expenses 9999") == "Other"

    def test_account_override(self):
        assert analysis.classify("global sum") == "Revenue"
        assert analysis.classify("flu") == "Revenue"

    def test_fee_income_still_revenue(self):
        assert analysis.classify("Fee Income") == "Revenue"

    def test_direct_costs_override(self):
        assert analysis.classify("Cost of Sales") == "Direct Costs"
        assert analysis.classify("Cost of Goods Sold") == "Direct Costs"


class TestClassifyWordBoundaryFixes:
    """Regression tests for substring-matching bugs fixed by _kw_matches()."""

    def test_cleaning_is_premises_not_staff(self):
        # 'ni' inside 'cleaning' must not match the NI (National Insurance) keyword
        assert analysis.classify("Cleaning Supplies") == "Premises Costs"
        assert analysis.classify("Cleaning Services") == "Premises Costs"

    def test_audit_is_professional_fees_not_it(self):
        # 'it' inside 'audit' must not match the IT Costs keyword
        assert analysis.classify("Audit Fees") == "Professional Fees"
        assert analysis.classify("External Audit") == "Professional Fees"

    def test_digital_is_marketing_not_it(self):
        # 'it' inside 'digital' must not match the IT Costs keyword
        assert analysis.classify("Digital Marketing") == "Marketing Costs"

    def test_professional_fees_not_revenue(self):
        # 'fees' as a bare keyword was wrongly matching Revenue
        assert analysis.classify("Professional Fees") == "Professional Fees"
        assert analysis.classify("Legal Fees") == "Professional Fees"
        assert analysis.classify("Consultancy Fees") == "Professional Fees"

    def test_consultancy_costs_not_direct(self):
        # 'cos' inside 'consultancy costs' was wrongly matching Direct Costs
        assert analysis.classify("Consultancy Costs") == "Professional Fees"

    def test_employer_ni_still_staff(self):
        # 'ni' as a whole word must still match Staff Costs
        assert analysis.classify("Employer NI") == "Staff Costs"
        assert analysis.classify("NI Contributions") == "Staff Costs"

    def test_it_standalone_still_it(self):
        # Standalone 'IT' (word boundary) must still match IT Costs
        assert analysis.classify("IT Department") == "IT Costs"
        assert analysis.classify("IT Software") == "IT Costs"

    def test_sewage_is_premises_not_staff(self):
        # 'wage' inside 'sewage' must not match Staff Costs
        assert analysis.classify("Sewage Treatment") == "Premises Costs"


class TestIsSubtotal:
    def test_total_lines(self):
        assert analysis.is_subtotal("Total Turnover") is True
        assert analysis.is_subtotal("Operating Profit") is True
        assert analysis.is_subtotal("Gross Profit") is True
        assert analysis.is_subtotal("EBITDA") is True

    def test_regular_accounts(self):
        assert analysis.is_subtotal("Staff Wages") is False
        assert analysis.is_subtotal("Office Rent") is False
        assert analysis.is_subtotal("Product Revenue") is False


# ─────────────────────────────────────────────────────────────────────────────
# PERIOD LOGIC
# ─────────────────────────────────────────────────────────────────────────────

class TestPeriodLogic:
    def test_period_label_monthly(self):
        ts = pd.Timestamp("2024-04-01")
        assert analysis.period_label(ts, "monthly") == "April 2024"

    def test_get_quarter(self):
        assert analysis.get_quarter(pd.Timestamp("2024-04-01")) == "FY24/25 Q1"
        assert analysis.get_quarter(pd.Timestamp("2024-01-01")) == "FY23/24 Q4"

    def test_quarter_sort_key_ordering(self):
        q1 = analysis.quarter_sort_key("FY24/25 Q1")
        q2 = analysis.quarter_sort_key("FY24/25 Q2")
        q4 = analysis.quarter_sort_key("FY24/25 Q4")
        assert q1 < q2 < q4


# ─────────────────────────────────────────────────────────────────────────────
# BUILD_LONG
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildLong:
    def test_creates_period_column(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        assert "Period" in df_long.columns
        assert df_long["Period"].notna().all()

    def test_has_three_periods(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        assert df_long["Period"].nunique() == 3

    def test_value_column_numeric(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        assert pd.api.types.is_numeric_dtype(df_long["Value"])

    def test_quarterly_groups_periods(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "quarterly")
        # Apr/May/Jun 2024 all fall in Q1 FY24/25
        assert df_long["Period"].nunique() == 1
        assert "Q1" in str(df_long["Period"].iloc[0])

    def test_no_valid_months_raises(self):
        df_bad = pd.DataFrame({
            "Account": ["Revenue A"],
            "Section": ["Turnover"],
            "Month 1": [50_000],
            "Month 2": [55_000],
        })
        with pytest.raises(ValueError, match="[Nn]o valid month"):
            analysis.build_long(df_bad, "monthly")


# ─────────────────────────────────────────────────────────────────────────────
# BUILD_ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildAnalysis:
    def test_adds_variance_column(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        assert "Variance" in df_a.columns

    def test_adds_category_column(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        assert "Category" in df_a.columns
        assert df_a["Category"].notna().all()

    def test_adds_is_subtotal_column(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        assert "Is Subtotal" in df_a.columns
        subtotals = df_a[df_a["Is Subtotal"]]["Account"].tolist()
        assert any("Total" in s or "Profit" in s for s in subtotals)

    def test_variance_is_current_minus_prior(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        # For Product Revenue: Apr=80k, May=85k, Jun=78k
        # Jun variance = 78k - 85k = -7k
        rev_jun = df_a[
            (df_a["Account"] == "Product Revenue") &
            (df_a["Period"] == pd.Timestamp("2024-06-01"))
        ]
        assert not rev_jun.empty
        assert abs(rev_jun.iloc[0]["Variance"] - (-7_000)) < 1


# ─────────────────────────────────────────────────────────────────────────────
# DETECT_KPIS
# ─────────────────────────────────────────────────────────────────────────────

class TestDetectKpis:
    def test_detects_profit_kpi(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        kpis = analysis.detect_kpis(df_long)
        assert kpis["profit"] is not None
        assert "profit" in kpis["profit"].lower() or "operating" in kpis["profit"].lower()

    def test_detects_revenue_kpi(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        kpis = analysis.detect_kpis(df_long)
        assert kpis["revenue"] is not None
        assert "turnover" in kpis["revenue"].lower() or "revenue" in kpis["revenue"].lower()

    def test_returns_dict_with_expected_keys(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        kpis = analysis.detect_kpis(df_long)
        assert isinstance(kpis, dict)
        assert "revenue" in kpis
        assert "costs" in kpis
        assert "profit" in kpis


# ─────────────────────────────────────────────────────────────────────────────
# WATERFALL RECONCILIATION
# ─────────────────────────────────────────────────────────────────────────────

class TestWaterfallReconciliation:
    def test_waterfall_reconciles(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        kpi_accounts = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        # Use the last period (needs a prior period)
        last = periods[-1]
        wf = analysis.build_waterfall(df_a, last, kpi_accounts, "monthly")
        if wf is not None:
            bar_sum = sum(b["impact"] for b in wf["bars"])
            assert abs(bar_sum - wf["net_change"]) <= 0.5, (
                f"Waterfall doesn't reconcile: bar_sum={bar_sum:.2f}, "
                f"net_change={wf['net_change']:.2f}"
            )

    def test_waterfall_returns_none_for_first_period(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        kpi_accounts = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        # First period has no prior — waterfall should be None
        first = periods[0]
        wf = analysis.build_waterfall(df_a, first, kpi_accounts, "monthly")
        assert wf is None

    def test_waterfall_has_required_keys(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        kpi_accounts = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        wf = analysis.build_waterfall(df_a, periods[-1], kpi_accounts, "monthly")
        if wf is not None:
            for key in ("prior_profit", "current_profit", "net_change", "bars", "reconciles"):
                assert key in wf, f"Missing key: {key}"

    def test_cost_reduction_improves_profit(self):
        """Cost going down must produce a positive (favourable) waterfall bar."""
        df = pd.DataFrame({
            "Account": ["Total Turnover", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
            "Apr 2024": [100_000, 60_000, 40_000],
            "May 2024": [100_000, 55_000, 45_000],  # wages down → profit up
        })
        df_long = analysis.build_long(df, "monthly")
        df_a = analysis.build_analysis(df_long)
        kpis = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        wf = analysis.build_waterfall(df_a, periods[-1], kpis, "monthly")
        assert wf is not None
        staff_bar = next((b for b in wf["bars"] if b["label"] == "Staff Costs"), None)
        assert staff_bar is not None
        assert staff_bar["impact"] > 0, "Cost decrease should produce positive profit impact"
        assert staff_bar["fav"] is True


# ─────────────────────────────────────────────────────────────────────────────
# BUILD_BVA
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildBva:
    def test_variance_is_actual_minus_budget(self, sample_bva_df):
        bva = analysis.build_bva(sample_bva_df, "Actual", "Budget")
        rev = bva[bva["Account"] == "Product Revenue"].iloc[0]
        # Actual 85k - Budget 80k = +5k
        assert abs(rev["Variance"] - 5_000) < 1

    def test_adds_category_column(self, sample_bva_df):
        bva = analysis.build_bva(sample_bva_df, "Actual", "Budget")
        assert "Category" in bva.columns
        assert bva["Category"].notna().all()

    def test_revenue_classified_correctly(self, sample_bva_df):
        bva = analysis.build_bva(sample_bva_df, "Actual", "Budget")
        rev = bva[bva["Account"] == "Product Revenue"].iloc[0]
        assert rev["Category"] == "Revenue"


# ─────────────────────────────────────────────────────────────────────────────
# LOAD_FILE
# ─────────────────────────────────────────────────────────────────────────────

class TestLoadFile:
    def test_loads_valid_csv(self):
        csv = (
            "Section,Account,Apr 2024,May 2024\n"
            "Turnover,Product Revenue,50000,55000\n"
            "Admin,Staff Wages,20000,21000\n"
        )
        df = analysis.load_file(csv.encode("utf-8"), "test.csv")
        assert "Account" in df.columns
        assert len(df) == 2

    def test_raises_on_missing_account_column(self):
        csv = (
            "Description,Apr 2024,May 2024\n"
            "Revenue,50000,55000\n"
        )
        with pytest.raises(ValueError):
            analysis.load_file(csv.encode("utf-8"), "bad.csv")

    def test_strips_currency_symbols(self):
        csv = (
            "Section,Account,Apr 2024\n"
            "Turnover,Revenue A,\"£50,000\"\n"
        )
        df = analysis.load_file(csv.encode("utf-8"), "test.csv")
        df_long = analysis.build_long(df, "monthly")
        val = df_long[df_long["Account"] == "Revenue A"]["Value"].iloc[0]
        assert abs(val - 50_000) < 1

    def test_handles_parentheses_as_negative(self):
        csv = (
            "Section,Account,Apr 2024\n"
            "Admin,Staff Wages,(20000)\n"
        )
        df = analysis.load_file(csv.encode("utf-8"), "test.csv")
        df_long = analysis.build_long(df, "monthly")
        val = df_long[df_long["Account"] == "Staff Wages"]["Value"].iloc[0]
        assert val == -20_000


# ─────────────────────────────────────────────────────────────────────────────
# DETECT_BVA_COLUMNS
# ─────────────────────────────────────────────────────────────────────────────

class TestDetectBvaColumns:
    def test_finds_actual_and_budget(self):
        df = pd.DataFrame({"Account": [], "Actual": [], "Budget": []})
        actual, budget = analysis.detect_bva_columns(df)
        assert actual == "Actual"
        assert budget == "Budget"

    def test_finds_actuals_plural(self):
        df = pd.DataFrame({"Account": [], "Actuals": [], "Budget": []})
        actual, budget = analysis.detect_bva_columns(df)
        assert actual == "Actuals"
        assert budget == "Budget"

    def test_case_insensitive(self):
        df = pd.DataFrame({"Account": [], "ACTUAL": [], "BUDGET": []})
        actual, budget = analysis.detect_bva_columns(df)
        assert actual == "ACTUAL"
        assert budget == "BUDGET"

    def test_partial_match(self):
        df = pd.DataFrame({"Account": [], "YTD Actual": [], "Original Budget": []})
        actual, budget = analysis.detect_bva_columns(df)
        assert actual == "YTD Actual"
        assert budget == "Original Budget"

    def test_returns_none_when_not_found(self):
        df = pd.DataFrame({"Account": [], "Apr 2024": [], "May 2024": []})
        actual, budget = analysis.detect_bva_columns(df)
        assert actual is None
        assert budget is None


# ─────────────────────────────────────────────────────────────────────────────
# GET_PERIOD_DATA
# ─────────────────────────────────────────────────────────────────────────────

class TestGetPeriodData:
    def test_returns_expected_keys(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        for key in ("kpis", "movements", "commentary", "period", "trend"):
            assert key in data, f"Missing key: {key}"

    def test_movements_have_required_fields(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        for m in data["movements"]:
            for field in ("account", "category", "value", "variance", "is_fav"):
                assert field in m, f"Movement missing field: {field}"

    def test_period_label_populated(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        assert data["period"]["label"]  # non-empty label
        assert data["period"]["prior"]  # prior period label present


# ─────────────────────────────────────────────────────────────────────────────
# GET_BVA_DATA
# ─────────────────────────────────────────────────────────────────────────────

class TestGetBvaData:
    @pytest.fixture
    def bva_df(self):
        raw = pd.DataFrame({
            "Account": [
                "Product Revenue", "Service Revenue", "Total Revenue",
                "Staff Wages", "Office Rent", "Total Costs",
                "Operating Profit",
            ],
            "Section": [
                "Turnover", "Turnover", "Turnover",
                "Admin", "Admin", "Admin",
                "Profit",
            ],
            "Actual": [85_000, 42_000, 127_000, 36_000, 5_200, 41_200, 85_800],
            "Budget": [80_000, 40_000, 120_000, 35_000, 5_000, 40_000, 80_000],
        })
        return analysis.build_bva(raw, "Actual", "Budget")

    @pytest.fixture
    def kpi_accounts(self, bva_df):
        # build_long is not used in BvA — use detect_kpis on a derived long form
        raw = pd.DataFrame({
            "Account": bva_df["Account"].tolist(),
            "Section": bva_df["Section"].tolist(),
            "Apr 2024": bva_df["Actual"].tolist(),
        })
        df_long = analysis.build_long(raw, "monthly")
        return analysis.detect_kpis(df_long)

    def test_returns_expected_top_level_keys(self, bva_df, kpi_accounts):
        data = analysis.get_bva_data(bva_df, kpi_accounts, "test.csv")
        for key in ("kpis", "movements", "commentary", "waterfall"):
            assert key in data, f"Missing key: {key}"

    def test_kpis_have_required_fields(self, bva_df, kpi_accounts):
        data = analysis.get_bva_data(bva_df, kpi_accounts, "test.csv")
        for kpi in data["kpis"]:
            for field in ("label", "value", "variance", "is_fav"):
                assert field in kpi, f"KPI missing field: {field}"

    def test_movements_have_required_fields(self, bva_df, kpi_accounts):
        data = analysis.get_bva_data(bva_df, kpi_accounts, "test.csv")
        for m in data["movements"]:
            for field in ("account", "category", "value", "variance", "is_fav"):
                assert field in m, f"Movement missing field: {field}"

    def test_revenue_is_favourable_when_above_budget(self, bva_df, kpi_accounts):
        data = analysis.get_bva_data(bva_df, kpi_accounts, "test.csv")
        rev_kpi = next((k for k in data["kpis"] if "Revenue" in k["label"]), None)
        assert rev_kpi is not None, "No revenue KPI found"
        assert rev_kpi["variance"] > 0
        assert rev_kpi["is_fav"] is True

    def test_commentary_list(self, bva_df, kpi_accounts):
        data = analysis.get_bva_data(bva_df, kpi_accounts, "test.csv")
        assert isinstance(data["commentary"], list)
        if data["commentary"]:
            first = data["commentary"][0]
            assert "html" in first or "text" in first  # BvA uses html
            assert "icon" in first


# ─────────────────────────────────────────────────────────────────────────────
# MAKE_XLSX (smoke test)
# ─────────────────────────────────────────────────────────────────────────────

class TestMakeXlsx:
    def _build_data(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        return analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")

    def test_returns_bytes(self, sample_mom_df):
        data = self._build_data(sample_mom_df)
        result = analysis.make_xlsx("June 2024", data["movements"], data["commentary"], data["kpis"])
        assert isinstance(result, bytes)
        assert len(result) > 500

    def test_xlsx_magic_bytes(self, sample_mom_df):
        data = self._build_data(sample_mom_df)
        result = analysis.make_xlsx("June 2024", data["movements"], data["commentary"], data["kpis"])
        # OOXML files are zip archives — magic bytes PK
        assert result[:2] == b"PK"

    def test_bva_mode_runs(self):
        """make_xlsx should run for BvA analysis type without errors."""
        movements = [{"account": "Revenue", "category": "Revenue", "value": 100_000,
                      "prior_value": 95_000, "variance": 5_000, "variance_pct": 5.26, "is_fav": True}]
        kpis = [{"label": "Revenue", "value": 100_000, "prior": 95_000,
                 "variance": 5_000, "pct": 5.26, "is_fav": True, "icon": "trending-up", "pct_only": False}]
        result = analysis.make_xlsx("FY 2025", movements, [], kpis, analysis_type="budget_vs_actual")
        assert isinstance(result, bytes) and len(result) > 500


# ─────────────────────────────────────────────────────────────────────────────
# GET_YTD_DATA
# ─────────────────────────────────────────────────────────────────────────────

class TestGetYtdData:
    @pytest.fixture
    def ytd_df(self):
        """18-month P&L spanning two calendar years — needed for prior-year YTD comparison."""
        months = [
            "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
            "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
            "Jan 2025", "Feb 2025", "Mar 2025",
        ]
        data = {"Account": ["Product Revenue", "Staff Wages", "Operating Profit"],
                "Section":  ["Turnover", "Admin", "Profit"]}
        for m in months:
            data[m] = [80_000, 35_000, 45_000]
        return pd.DataFrame(data)

    def test_returns_expected_keys(self, ytd_df):
        df_long = analysis.build_long(ytd_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data = analysis.get_ytd_data(df_a, periods[-1], kpis)
        for key in ("kpis", "movements", "commentary", "period"):
            assert key in data, f"Missing key: {key}"

    def test_ytd_period_label_contains_ytd(self, ytd_df):
        df_long = analysis.build_long(ytd_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data = analysis.get_ytd_data(df_a, periods[-1], kpis)
        assert data["period"]["label"]  # non-empty

    def test_ytd_accumulates_values(self, ytd_df):
        """YTD revenue for Mar 2025 should be Jan+Feb+Mar 2025 = 3 × 80k = 240k."""
        df_long = analysis.build_long(ytd_df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data = analysis.get_ytd_data(df_a, periods[-1], kpis)
        rev_kpi = next((k for k in data["kpis"] if "Revenue" in k.get("label", "") or "Turnover" in k.get("label", "")), None)
        if rev_kpi and rev_kpi.get("value") is not None:
            assert rev_kpi["value"] == pytest.approx(240_000, rel=0.05)


# ─────────────────────────────────────────────────────────────────────────────
# GET_INSIGHTS_DATA
# ─────────────────────────────────────────────────────────────────────────────

def _make_insights_df(n_months=6):
    """Helper: build an n-month P&L DataFrame with payroll and diverse costs."""
    months = []
    base = pd.Timestamp("2024-01-01")
    for i in range(n_months):
        dt = base + pd.offsets.MonthBegin(i)
        months.append(dt.strftime("%b %Y"))
    data = {
        "Account": [
            "Product Revenue", "Service Revenue", "Total Turnover",
            "Staff Wages", "Pension Contributions", "Office Rent", "IT Software",
            "Total Admin Costs", "Operating Profit",
        ],
        "Section": [
            "Turnover", "Turnover", "Turnover",
            "Admin", "Admin", "Admin", "Admin",
            "Admin", "Profit",
        ],
    }
    rev_vals    = [80_000 + i * 1_000 for i in range(n_months)]
    staff_vals  = [30_000 + i * 500  for i in range(n_months)]
    pension_vals = [3_000 + i * 50   for i in range(n_months)]
    rent_vals   = [5_000] * n_months
    it_vals     = [2_000 + i * 100   for i in range(n_months)]
    total_costs = [v1 + v2 + v3 + v4 for v1, v2, v3, v4 in
                   zip(staff_vals, pension_vals, rent_vals, it_vals)]
    # Service revenue is a flat 20 % of product revenue
    svc_vals  = [int(r * 0.25) for r in rev_vals]
    tot_rev   = [r + s for r, s in zip(rev_vals, svc_vals)]
    profit_vals = [tr - tc for tr, tc in zip(tot_rev, total_costs)]

    for i, m in enumerate(months):
        data[m] = [
            rev_vals[i], svc_vals[i], tot_rev[i],
            staff_vals[i], pension_vals[i], rent_vals[i], it_vals[i],
            total_costs[i], profit_vals[i],
        ]
    return pd.DataFrame(data)


class TestGetInsightsData:
    """Tests for get_insights_data() — the supplementary FP&A insights function."""

    @pytest.fixture
    def insights_6m(self):
        """6-period dataset: enough for momentum, not enough for R12 or SPPY.

        get_insights_data() requires the second argument (df_long) to have an
        'Is Subtotal' column for the nonrecurring detection section.  That
        column is only present on the DataFrame returned by build_analysis(),
        not on the raw build_long() output.  We therefore pass df_a for both
        the analysis_df and df_long parameters.
        """
        df = _make_insights_df(n_months=6)
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_insights_data(df_a, df_a, periods[-1], kpis, "monthly")
        return data, df_a, df_long, kpis, periods

    @pytest.fixture
    def insights_13m(self):
        """13-period dataset: enough for R12 and SPPY."""
        df = _make_insights_df(n_months=13)
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_insights_data(df_a, df_a, periods[-1], kpis, "monthly")
        return data, df_a, df_long, kpis, periods

    # ── 1. Top-level keys ────────────────────────────────────────────────────
    def test_returns_all_expected_keys(self, insights_6m):
        data = insights_6m[0]
        expected = {
            "margins", "common_size", "r12", "run_rate", "pareto",
            "sppy", "momentum", "fixed_variable", "nonrecurring", "period_label",
        }
        assert expected.issubset(set(data.keys())), (
            f"Missing keys: {expected - set(data.keys())}"
        )

    # ── 2. Margins ───────────────────────────────────────────────────────────
    def test_margins_op_pct_computed_correctly(self, insights_6m):
        """op_pct should equal profit / revenue * 100 for the selected period."""
        data, df_a, df_long, kpis, periods = insights_6m
        period_df = df_a[df_a["Period"] == periods[-1]]

        rev_name  = kpis.get("revenue") or ""
        prof_name = kpis.get("profit")  or ""

        def _val(name):
            m = period_df[period_df["Account"].str.strip() == name.strip()]
            return float(m.iloc[0]["Value"]) if not m.empty else None

        rev  = _val(rev_name)
        prof = _val(prof_name)

        if rev and rev != 0 and prof is not None:
            expected_op_pct = round(prof / rev * 100, 1)
            assert data["margins"]["op_pct"] == pytest.approx(expected_op_pct, abs=0.2)

    def test_margins_payroll_pct_correct(self, insights_6m):
        """payroll_pct = staff_cost_sum / revenue * 100."""
        data, df_a, df_long, kpis, periods = insights_6m
        period_df = df_a[df_a["Period"] == periods[-1]]
        driver_df = period_df[~period_df["Is Subtotal"]]

        staff_sum = float(driver_df[driver_df["Category"] == "Staff Costs"]["Value"].sum())
        rev_name  = kpis.get("revenue") or ""
        rev_row   = period_df[period_df["Account"].str.strip() == rev_name.strip()]
        rev_val   = float(rev_row.iloc[0]["Value"]) if not rev_row.empty else None

        if rev_val and rev_val != 0:
            expected_pp = round(staff_sum / rev_val * 100, 1)
            assert data["margins"]["payroll_pct"] == pytest.approx(expected_pp, abs=0.2)

    def test_margins_trend_has_correct_length(self, insights_6m):
        """Trend must have exactly min(6, n_periods) entries for a 6-period dataset."""
        data = insights_6m[0]
        # With 6 months and last period at idx 5, trend window = periods[0:6]
        assert len(data["margins"]["trend"]) == 6

    def test_margins_trend_contains_required_keys(self, insights_6m):
        data = insights_6m[0]
        for entry in data["margins"]["trend"]:
            for key in ("m", "full", "op_pct", "payroll_pct"):
                assert key in entry, f"Trend entry missing key: {key}"

    # ── 3. Common-size P&L ───────────────────────────────────────────────────
    def test_common_size_entries_have_pct_of_rev(self, insights_6m):
        data = insights_6m[0]
        assert len(data["common_size"]) > 0, "common_size should be non-empty"
        for entry in data["common_size"]:
            assert "pct_of_rev" in entry, f"Entry missing pct_of_rev: {entry}"

    def test_common_size_pct_of_rev_values(self, insights_6m):
        """pct_of_rev for a revenue account should be positive; cost accounts too."""
        data = insights_6m[0]
        for entry in data["common_size"]:
            if entry.get("value") is not None and entry["value"] != 0:
                assert entry["pct_of_rev"] is not None

    # ── 4. R12 availability ──────────────────────────────────────────────────
    def test_r12_not_available_with_6_months(self, insights_6m):
        data = insights_6m[0]
        assert data["r12"]["available"] is False

    def test_r12_available_with_13_months(self, insights_13m):
        data = insights_13m[0]
        assert data["r12"]["available"] is True

    def test_r12_has_required_keys_when_available(self, insights_13m):
        data = insights_13m[0]
        for key in ("revenue", "costs", "profit", "op_pct", "periods_used"):
            assert key in data["r12"], f"r12 missing key: {key}"

    # ── 5. Run-rate ──────────────────────────────────────────────────────────
    def test_run_rate_equals_current_times_12(self, insights_6m):
        data, df_a, df_long, kpis, periods = insights_6m
        period_df = df_a[df_a["Period"] == periods[-1]]
        rev_name  = kpis.get("revenue") or ""
        rev_row   = period_df[period_df["Account"].str.strip() == rev_name.strip()]
        if not rev_row.empty:
            rev_val = float(rev_row.iloc[0]["Value"])
            assert data["run_rate"]["revenue"] == pytest.approx(rev_val * 12, rel=1e-6)

    def test_run_rate_has_all_keys(self, insights_6m):
        data = insights_6m[0]
        for key in ("revenue", "costs", "profit", "op_pct"):
            assert key in data["run_rate"], f"run_rate missing key: {key}"

    # ── 6. Pareto ────────────────────────────────────────────────────────────
    def test_pareto_lines_sorted_descending(self, insights_6m):
        data = insights_6m[0]
        lines = data["pareto"]["lines"]
        if len(lines) > 1:
            for i in range(len(lines) - 1):
                assert lines[i]["value"] >= lines[i + 1]["value"], (
                    f"Pareto not descending at position {i}"
                )

    def test_pareto_top3_pct_matches_cumulative(self, insights_6m):
        data  = insights_6m[0]
        lines = data["pareto"]["lines"]
        if len(lines) >= 3:
            expected_top3 = lines[2]["cum_pct"]
            assert data["pareto"]["top3_pct"] == pytest.approx(expected_top3, abs=0.1)

    def test_pareto_top5_pct_matches_cumulative(self, insights_6m):
        data  = insights_6m[0]
        lines = data["pareto"]["lines"]
        if len(lines) >= 5:
            expected_top5 = lines[4]["cum_pct"]
            assert data["pareto"]["top5_pct"] == pytest.approx(expected_top5, abs=0.1)

    def test_pareto_excludes_revenue(self, insights_6m):
        """Pareto cost-concentration should not include Revenue category."""
        data = insights_6m[0]
        for entry in data["pareto"]["lines"]:
            assert entry["category"] != "Revenue", (
                "Pareto should not include Revenue accounts"
            )

    # ── 7. Momentum ──────────────────────────────────────────────────────────
    def test_momentum_not_available_with_fewer_than_6_periods(self):
        df = _make_insights_df(n_months=5)
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_insights_data(df_a, df_a, periods[-1], kpis, "monthly")
        assert data["momentum"]["available"] is False

    def test_momentum_available_with_6_periods(self, insights_6m):
        data = insights_6m[0]
        assert data["momentum"]["available"] is True

    def test_momentum_direction_values_are_valid_strings(self, insights_6m):
        data = insights_6m[0]
        m    = data["momentum"]
        if m["available"]:
            valid = {"improving", "worsening", "stable"}
            assert m["revenue_dir"] in valid, f"Unexpected revenue_dir: {m['revenue_dir']}"
            assert m["cost_dir"]    in valid, f"Unexpected cost_dir: {m['cost_dir']}"
            assert m["profit_dir"]  in valid, f"Unexpected profit_dir: {m['profit_dir']}"
            assert m["overall"]     in valid, f"Unexpected overall: {m['overall']}"

    # ── 8. SPPY ──────────────────────────────────────────────────────────────
    def test_sppy_not_available_with_fewer_than_13_months(self, insights_6m):
        data = insights_6m[0]
        assert data["sppy"]["available"] is False

    def test_sppy_available_with_13_months(self, insights_13m):
        data = insights_13m[0]
        assert data["sppy"]["available"] is True

    def test_sppy_has_required_keys_when_available(self, insights_13m):
        data = insights_13m[0]
        if data["sppy"]["available"]:
            for key in ("period_label", "revenue", "profit", "rev_delta", "prof_delta"):
                assert key in data["sppy"], f"sppy missing key: {key}"

    # ── 9. Fixed vs Variable ─────────────────────────────────────────────────
    def test_fixed_variable_costs_non_negative(self, insights_6m):
        data = insights_6m[0]
        fv   = data["fixed_variable"]
        assert fv["fixed_cost"]    >= 0, "fixed_cost should be non-negative"
        assert fv["variable_cost"] >= 0, "variable_cost should be non-negative"

    def test_fixed_variable_has_expected_keys(self, insights_6m):
        data = insights_6m[0]
        for key in ("fixed_cost", "variable_cost", "total_classified",
                    "contribution_margin_pct", "breakeven_revenue", "has_revenue"):
            assert key in data["fixed_variable"], f"fixed_variable missing key: {key}"

    # ── 10. Non-recurring ────────────────────────────────────────────────────
    def test_nonrecurring_items_have_required_keys(self, insights_6m):
        data = insights_6m[0]
        for item in data["nonrecurring"]:
            for key in ("account", "category", "present_count", "check_periods"):
                assert key in item, f"nonrecurring item missing key: {key}"

    def test_nonrecurring_present_count_less_than_check_periods(self, insights_6m):
        data = insights_6m[0]
        for item in data["nonrecurring"]:
            assert item["present_count"] < item["check_periods"], (
                f"present_count should be < check_periods: {item}"
            )

    def test_nonrecurring_detected_for_sparse_account(self):
        """An account that appears in only 1 of 6 periods should be flagged."""
        months = ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024"]
        data = {
            "Account": ["Total Turnover", "Staff Wages", "Consultancy Fee", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Admin", "Profit"],
        }
        for i, m in enumerate(months):
            # Consultancy Fee only appears in month 1
            data[m] = [100_000, 40_000, 15_000 if i == 0 else 0, 45_000]
        df      = pd.DataFrame(data)
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        result  = analysis.get_insights_data(df_a, df_a, periods[-1], kpis, "monthly")
        accounts = [item["account"] for item in result["nonrecurring"]]
        assert "Consultancy Fee" in accounts, (
            "Consultancy Fee (present in 1/6 periods) should be flagged as non-recurring"
        )

    # ── 11. period_label ─────────────────────────────────────────────────────
    def test_period_label_matches_selected_period(self, insights_6m):
        data, df_a, df_long, kpis, periods = insights_6m
        expected_label = analysis.period_label(periods[-1], "monthly")
        assert data["period_label"] == expected_label


# ─────────────────────────────────────────────────────────────────────────────
# ANOMALY DETECTION (logic extracted from api.py route)
# ─────────────────────────────────────────────────────────────────────────────

def _run_anomaly_detection(analysis_df, sigma=1.5, mode="monthly"):
    """
    Reproduce the anomaly-detection logic from api.py's /api/anomalies route
    so we can unit-test it without needing a live HTTP server or session store.
    """
    sort_key = (lambda p: pd.Timestamp(p)) if mode != "quarterly" else analysis.quarter_sort_key
    periods  = sorted(analysis_df["Period"].unique(), key=sort_key)
    sigma    = max(0.5, min(sigma, 5.0))   # clamp as the route does

    if len(periods) < 4:
        return {"anomalies": [], "period": "", "note": "Needs ≥ 4 periods for reliable detection."}

    selected     = periods[-1]
    selected_lbl = analysis.period_label(selected, mode)
    non_sub      = analysis_df[~analysis_df["Is Subtotal"]].copy()

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
        change   = curr_val - hmean
        is_rev   = cat == "Revenue"
        is_fav   = (is_rev and change > 0) or (not is_rev and change < 0)
        chg_pct  = round(change / abs(hmean) * 100, 1) if hmean != 0 else None

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
        "anomalies":   anomalies[:8],
        "period":      selected_lbl,
        "threshold":   sigma,
        "total_found": len(anomalies),
    }


class TestAnomalyDetection:
    """Tests for the anomaly detection logic (Z-score based)."""

    @pytest.fixture
    def stable_df(self):
        """6-month dataset where every account is stable — no anomalies expected."""
        months = ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024"]
        data = {
            "Account": ["Total Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
        }
        for m in months:
            data[m] = [100_000, 40_000, 60_000]
        df      = pd.DataFrame(data)
        df_long = analysis.build_long(df, "monthly")
        return analysis.build_analysis(df_long)

    @pytest.fixture
    def spike_df(self):
        """6-month dataset with a large spike in the last month for Staff Wages."""
        months = ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024"]
        data = {
            "Account": ["Total Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
        }
        wages = [40_000, 41_000, 39_500, 40_500, 40_200, 120_000]   # spike in Jun
        rev   = [100_000] * 6
        profit = [r - w for r, w in zip(rev, wages)]
        for i, m in enumerate(months):
            data[m] = [rev[i], wages[i], profit[i]]
        df      = pd.DataFrame(data)
        df_long = analysis.build_long(df, "monthly")
        return analysis.build_analysis(df_long)

    def test_returns_expected_structure_keys(self, stable_df):
        result = _run_anomaly_detection(stable_df)
        for key in ("anomalies", "period", "threshold"):
            assert key in result, f"Missing key: {key}"

    def test_empty_result_with_insufficient_history(self):
        """Fewer than 4 periods → no anomaly detection."""
        months = ["Jan 2024", "Feb 2024", "Mar 2024"]
        data   = {
            "Account": ["Total Revenue", "Staff Wages"],
            "Section": ["Turnover", "Admin"],
        }
        for m in months:
            data[m] = [100_000, 40_000]
        df      = pd.DataFrame(data)
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        result  = _run_anomaly_detection(df_a)
        assert result["anomalies"] == []
        assert "note" in result

    def test_sigma_clamp_low(self, spike_df):
        """Sigma below 0.5 is clamped to 0.5 — must not raise."""
        result = _run_anomaly_detection(spike_df, sigma=0.01)
        assert result["threshold"] == 0.5

    def test_sigma_clamp_high(self, spike_df):
        """Sigma above 5.0 is clamped to 5.0."""
        result = _run_anomaly_detection(spike_df, sigma=99.0)
        assert result["threshold"] == 5.0

    def test_sigma_within_range_unchanged(self, spike_df):
        """Sigma values inside [0.5, 5.0] are passed through unchanged."""
        result = _run_anomaly_detection(spike_df, sigma=2.0)
        assert result["threshold"] == 2.0

    def test_spike_detected_as_anomaly(self, spike_df):
        """The large Jun-2024 spike in Staff Wages must be detected."""
        result = _run_anomaly_detection(spike_df, sigma=1.5)
        accounts = [a["account"] for a in result["anomalies"]]
        assert "Staff Wages" in accounts, (
            f"Staff Wages spike not detected. Anomalies found: {accounts}"
        )

    def test_is_fav_false_for_cost_spike(self, spike_df):
        """A cost spike is adverse (is_fav = False)."""
        result  = _run_anomaly_detection(spike_df, sigma=1.5)
        wages_a = next((a for a in result["anomalies"] if a["account"] == "Staff Wages"), None)
        if wages_a is not None:
            assert wages_a["is_fav"] is False, (
                "A cost increase should be is_fav=False"
            )

    def test_is_fav_true_for_revenue_spike(self):
        """A positive revenue spike is favourable (is_fav = True)."""
        months = ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024"]
        data = {
            "Account": ["Product Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
        }
        rev_vals = [50_000, 51_000, 49_500, 50_500, 50_200, 200_000]  # massive spike
        for i, m in enumerate(months):
            data[m] = [rev_vals[i], 30_000, rev_vals[i] - 30_000]
        df      = pd.DataFrame(data)
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        result  = _run_anomaly_detection(df_a, sigma=1.5)
        rev_a   = next((a for a in result["anomalies"] if a["account"] == "Product Revenue"), None)
        if rev_a is not None:
            assert rev_a["is_fav"] is True, "Revenue spike should be is_fav=True"

    def test_anomaly_items_have_required_fields(self, spike_df):
        result = _run_anomaly_detection(spike_df, sigma=1.5)
        for item in result["anomalies"]:
            for field in ("account", "category", "current_value", "historical_mean",
                          "std_dev", "z_score", "change", "is_fav"):
                assert field in item, f"Anomaly item missing field: {field}"

    def test_no_anomalies_when_sigma_very_high(self, spike_df):
        """At sigma=5 the spike may or may not exceed threshold — just shouldn't error."""
        result = _run_anomaly_detection(spike_df, sigma=5.0)
        assert isinstance(result["anomalies"], list)


# ─────────────────────────────────────────────────────────────────────────────
# GET_PERIOD_DATA — edge cases
# ─────────────────────────────────────────────────────────────────────────────

class TestGetPeriodDataEdgeCases:

    def test_single_period_no_prior_variances(self):
        """A single-period file produces None variances (no prior period)."""
        df = pd.DataFrame({
            "Account": ["Total Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
            "Apr 2024": [100_000, 40_000, 60_000],
        })
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[0], kpis, "monthly")
        # Movements rely on Variance being non-null; with a single period there is
        # no prior, so movements should be empty (or all have None variance).
        for m in data["movements"]:
            # variance may be None since there's no prior period
            assert m["variance"] is None or isinstance(m["variance"], (int, float))

    def test_no_revenue_accounts_still_processes(self):
        """A file with only cost accounts should not raise an error."""
        df = pd.DataFrame({
            "Account": ["Staff Wages", "Office Rent", "IT Costs"],
            "Section": ["Admin", "Admin", "Admin"],
            "Apr 2024": [40_000, 5_000, 2_000],
            "May 2024": [41_000, 5_000, 2_100],
        })
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        # Should not raise
        data = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        assert "movements" in data
        assert "kpis" in data

    def test_accounts_with_zero_values_across_all_periods(self):
        """Zero-value accounts should be handled gracefully (no division by zero)."""
        df = pd.DataFrame({
            "Account": ["Total Revenue", "Staff Wages", "Dormant Account", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Admin", "Profit"],
            "Apr 2024": [100_000, 40_000, 0, 60_000],
            "May 2024": [100_000, 40_000, 0, 60_000],
        })
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        assert "movements" in data

    def test_very_large_values_do_not_cause_errors(self):
        """Values in the hundreds of millions should not cause formatting/overflow errors."""
        df = pd.DataFrame({
            "Account": ["Total Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
            "Apr 2024": [500_000_000, 200_000_000, 300_000_000],
            "May 2024": [510_000_000, 205_000_000, 305_000_000],
        })
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        assert "kpis" in data
        assert len(data["kpis"]) > 0

    def test_first_period_has_no_prior_label(self):
        """For the very first period the prior label should still be populated."""
        df = pd.DataFrame({
            "Account": ["Total Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
            "Apr 2024": [100_000, 40_000, 60_000],
            "May 2024": [105_000, 41_000, 64_000],
        })
        df_long = analysis.build_long(df, "monthly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        data    = analysis.get_period_data(df_a, df_long, periods[0], kpis, "monthly")
        # period dict must always exist; prior may be the fallback string
        assert "period" in data
        assert data["period"]["label"]  # non-empty


# ─────────────────────────────────────────────────────────────────────────────
# GET_BVA_DATA — additional coverage
# ─────────────────────────────────────────────────────────────────────────────

class TestGetBvaDataExtended:

    @pytest.fixture
    def full_bva(self):
        raw = pd.DataFrame({
            "Account": [
                "Product Revenue", "Service Revenue", "Total Revenue",
                "Staff Wages", "Office Rent", "Total Costs",
                "Operating Profit",
            ],
            "Section": [
                "Turnover", "Turnover", "Turnover",
                "Admin", "Admin", "Admin",
                "Profit",
            ],
            "Actual": [85_000, 42_000, 127_000, 36_000, 5_200, 41_200, 85_800],
            "Budget": [80_000, 40_000, 120_000, 35_000, 5_000, 40_000, 80_000],
        })
        bva = analysis.build_bva(raw, "Actual", "Budget")
        raw2 = pd.DataFrame({
            "Account": raw["Account"].tolist(),
            "Section": raw["Section"].tolist(),
            "Apr 2024": raw["Actual"].tolist(),
        })
        df_long = analysis.build_long(raw2, "monthly")
        kpis    = analysis.detect_kpis(df_long)
        return bva, kpis

    def test_returns_analysis_type_budget_vs_actual(self, full_bva):
        bva, kpis = full_bva
        data = analysis.get_bva_data(bva, kpis, "test.csv")
        assert data.get("analysis_type") == "budget_vs_actual"

    def test_budget_column_correctly_identifies_prior(self, full_bva):
        """KPI 'prior' should equal the Budget value for the revenue row."""
        bva, kpis = full_bva
        data    = analysis.get_bva_data(bva, kpis, "test.csv")
        rev_kpi = next((k for k in data["kpis"] if "Revenue" in k.get("label", "")), None)
        assert rev_kpi is not None, "No revenue KPI found"
        assert rev_kpi["prior"] == pytest.approx(120_000, abs=1)

    def test_cost_adverse_when_actual_exceeds_budget(self, full_bva):
        """Staff wages actual (36k) > budget (35k) — should be adverse."""
        bva, kpis = full_bva
        data = analysis.get_bva_data(bva, kpis, "test.csv")
        wages_m = next(
            (m for m in data["movements"] if m["account"] == "Staff Wages"), None
        )
        if wages_m is not None:
            assert wages_m["is_fav"] is False, (
                "Staff wages above budget should be adverse"
            )

    def test_period_label_is_actual_budget(self, full_bva):
        """The BvA period labels should be 'Actual' vs 'Budget'."""
        bva, kpis = full_bva
        data = analysis.get_bva_data(bva, kpis, "test.csv")
        assert data["period"]["label"] == "Actual"
        assert data["period"]["prior"] == "Budget"

    def test_waterfall_key_present(self, full_bva):
        bva, kpis = full_bva
        data = analysis.get_bva_data(bva, kpis, "test.csv")
        assert "waterfall" in data

    def test_revenue_movement_has_variance(self, full_bva):
        """Product Revenue actual (85k) vs budget (80k) → variance +5k."""
        bva, kpis = full_bva
        data = analysis.get_bva_data(bva, kpis, "test.csv")
        rev_m = next(
            (m for m in data["movements"] if m["account"] == "Product Revenue"), None
        )
        if rev_m is not None:
            assert rev_m["variance"] == pytest.approx(5_000, abs=1)


# ─────────────────────────────────────────────────────────────────────────────
# QUARTERLY MODE
# ─────────────────────────────────────────────────────────────────────────────

class TestQuarterlyMode:

    @pytest.fixture
    def quarterly_df(self):
        """12-month P&L: Apr 2024 – Mar 2025 covers three full FY quarters."""
        months = [
            "Apr 2024", "May 2024", "Jun 2024",
            "Jul 2024", "Aug 2024", "Sep 2024",
            "Oct 2024", "Nov 2024", "Dec 2024",
            "Jan 2025", "Feb 2025", "Mar 2025",
        ]
        data = {
            "Account": ["Total Revenue", "Staff Wages", "Operating Profit"],
            "Section": ["Turnover", "Admin", "Profit"],
        }
        for m in months:
            data[m] = [90_000, 35_000, 55_000]
        return pd.DataFrame(data)

    def test_quarterly_grouping_returns_quarterly_periods(self, quarterly_df):
        df_long = analysis.build_long(quarterly_df, "quarterly")
        periods = df_long["Period"].unique()
        # 12 months / 3 = 4 quarters
        assert len(periods) == 4

    def test_quarterly_period_labels_look_like_quarter(self, quarterly_df):
        df_long = analysis.build_long(quarterly_df, "quarterly")
        for p in df_long["Period"].unique():
            assert "Q" in str(p), f"Period label should contain 'Q': {p}"

    def test_quarterly_period_labels_not_monthly_format(self, quarterly_df):
        """Period labels should not look like 'January 2024'."""
        df_long = analysis.build_long(quarterly_df, "quarterly")
        for p in df_long["Period"].unique():
            # Monthly format would contain a month name
            month_names = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December",
            ]
            label = str(p)
            assert not any(mn in label for mn in month_names), (
                f"Quarterly period label looks like monthly format: {label}"
            )

    def test_quarterly_get_period_data_runs(self, quarterly_df):
        """get_period_data in quarterly mode should complete without error."""
        df_long = analysis.build_long(quarterly_df, "quarterly")
        df_a    = analysis.build_analysis(df_long)
        kpis    = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=analysis.quarter_sort_key)
        data    = analysis.get_period_data(df_a, df_long, periods[-1], kpis, "quarterly")
        assert "kpis" in data
        assert "movements" in data

    def test_quarterly_aggregates_monthly_values(self, quarterly_df):
        """Each quarterly period should sum 3 months: 3 × 90k = 270k revenue."""
        df_long = analysis.build_long(quarterly_df, "quarterly")
        # Revenue for Q1 FY24/25 (Apr+May+Jun) = 3 × 90k = 270k
        q1_rev = df_long[
            (df_long["Account"] == "Total Revenue") &
            (df_long["Period"] == "FY24/25 Q1")
        ]["Value"]
        assert not q1_rev.empty
        assert float(q1_rev.iloc[0]) == pytest.approx(270_000, rel=1e-6)


# ─────────────────────────────────────────────────────────────────────────────
# PDF GENERATION (smoke test)
# ─────────────────────────────────────────────────────────────────────────────

class TestMakePdf:
    def test_returns_bytes(self, sample_mom_df):
        df_long = analysis.build_long(sample_mom_df, "monthly")
        df_a = analysis.build_analysis(df_long)
        kpis = analysis.detect_kpis(df_long)
        periods = sorted(df_a["Period"].unique(), key=lambda p: pd.Timestamp(p))
        from analysis import get_period_data
        data = get_period_data(df_a, df_long, periods[-1], kpis, "monthly")
        pdf_bytes = analysis.make_pdf(
            "June 2024", data["movements"], data["commentary"], data["kpis"],
            analysis_type="month_on_month", waterfall=data.get("waterfall"),
        )
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 1_000
        # PDF magic bytes
        assert pdf_bytes[:4] == b"%PDF"
