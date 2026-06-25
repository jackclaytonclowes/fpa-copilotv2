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
