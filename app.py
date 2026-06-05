# ============================================================
# FP&A Copilot — Styled Edition
# Requires: streamlit, pandas, plotly, matplotlib
# Install:  pip install streamlit pandas plotly matplotlib openpyxl
# ============================================================

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from io import BytesIO
import zipfile
import re

st.set_page_config(
    page_title="FP&A Copilot",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────────
# THEME & GLOBAL CSS
# ─────────────────────────────────────────────
PALETTE = {
    # Canvas & surfaces
    "bg":          "#F5F7FA",   # cool slate canvas
    "surface":     "#FFFFFF",
    "surface_2":   "#EFF3F7",   # subtle fills, hover rows
    "border":      "#E2E8F0",
    "border_strong":"#CBD5E1",

    # Text
    "text_primary":"#0F1B2D",   # ink
    "text_muted":  "#8794A2",   # fg-3

    # Brand — Copilot Blue (replaces warm gold)
    "accent":      "#2F62E8",
    "accent_light":"#EAF1FE",

    # Semantic — direction-aware variance
    "positive":    "#0E8A57",   # favourable
    "positive_bg": "#E3F4EC",
    "negative":    "#D02B45",   # adverse
    "negative_bg": "#FCE8EC",
    "caution":     "#C77D11",
    "caution_bg":  "#FBF0DC",

    # Navy sidebar
    "navy_900":    "#0C1726",
    "navy_800":    "#122036",
    "navy_700":    "#1B2F49",
    "navy_600":    "#26405E",
    "fg_on_dark":  "#EAF0F6",
    "fg_on_dark_2":"#9DB0C4",

    # Muted categorical chart palette
    "chart_1":     "#5C7FC0",   # dusty blue
    "chart_2":     "#4F9EA3",   # muted teal
    "chart_3":     "#8E84C2",   # soft violet
    "chart_4":     "#C7A24E",   # ochre
    "chart_5":     "#5FA083",   # sage green
    "chart_6":     "#D29478",   # clay
    "chart_7":     "#C0788C",   # dusty rose
    "chart_8":     "#8895A4",   # slate
}

def inject_css():
    st.markdown(f"""
    <style>
    /* ── Google Fonts — design system: Schibsted Grotesk · Hanken Grotesk · IBM Plex Mono ── */
    @import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    /* ── Global reset ── */
    html, body, [class*="css"] {{
        font-family: 'Hanken Grotesk', 'Segoe UI', system-ui, sans-serif;
        background-color: {PALETTE["bg"]} !important;
        color: {PALETTE["text_primary"]};
        -webkit-font-smoothing: antialiased;
    }}

    /* ── Hide default Streamlit chrome ── */
    #MainMenu, footer, header {{ visibility: hidden; }}
    .block-container {{
        padding-top: 2rem !important;
        padding-bottom: 3rem !important;
        max-width: 1400px !important;
    }}

    /* ── Sidebar — navy dark chrome ── */
    section[data-testid="stSidebar"] {{
        background-color: {PALETTE["navy_800"]} !important;
        border-right: none !important;
    }}
    section[data-testid="stSidebar"] .stMarkdown,
    section[data-testid="stSidebar"] label,
    section[data-testid="stSidebar"] p {{
        color: {PALETTE["fg_on_dark_2"]} !important;
        font-size: 0.85rem !important;
    }}
    section[data-testid="stSidebar"] h1,
    section[data-testid="stSidebar"] h2,
    section[data-testid="stSidebar"] h3 {{
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        color: {PALETTE["fg_on_dark_2"]} !important;
        opacity: 0.65;
        margin-top: 1.5rem !important;
    }}
    /* Sidebar widget labels */
    section[data-testid="stSidebar"] .stSelectbox label,
    section[data-testid="stSidebar"] .stRadio label,
    section[data-testid="stSidebar"] .stCheckbox label {{
        color: {PALETTE["fg_on_dark_2"]} !important;
    }}
    /* Sidebar selectbox */
    section[data-testid="stSidebar"] div[data-baseweb="select"] > div {{
        background: {PALETTE["navy_700"]} !important;
        border-color: {PALETTE["navy_600"]} !important;
        color: {PALETTE["fg_on_dark"]} !important;
    }}
    /* Sidebar file uploader text */
    section[data-testid="stSidebar"] .stFileUploader label {{
        color: {PALETTE["fg_on_dark_2"]} !important;
    }}
    section[data-testid="stSidebar"] .stFileUploader > div > div {{
        background: {PALETTE["navy_700"]} !important;
        border-color: {PALETTE["navy_600"]} !important;
    }}
    section[data-testid="stSidebar"] .stFileUploader > div > div * {{
        color: {PALETTE["fg_on_dark_2"]} !important;
    }}

    /* ── Page title ── */
    .fpa-page-header {{
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 2rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid {PALETTE["border"]};
    }}
    .fpa-page-header .fpa-logo {{
        width: 38px; height: 38px;
        background: {PALETTE["accent"]};
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        color: #fff;
        font-family: 'Schibsted Grotesk', sans-serif;
        font-size: 1.05rem; font-weight: 800;
        letter-spacing: -0.02em;
        box-shadow: 0 4px 12px rgba(47,98,232,0.28);
    }}
    .fpa-page-header h1 {{
        margin: 0;
        font-family: 'Schibsted Grotesk', sans-serif;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        color: {PALETTE["text_primary"]};
    }}
    .fpa-page-header span {{
        font-size: 0.8rem;
        color: {PALETTE["text_muted"]};
        font-weight: 400;
    }}

    /* ── Section heading ── */
    .fpa-section-heading {{
        font-family: 'Hanken Grotesk', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: {PALETTE["text_muted"]};
        margin: 2.25rem 0 0.9rem 0;
        padding-bottom: 0.55rem;
        border-bottom: 1px solid {PALETTE["border"]};
    }}

    /* ── KPI metric card ── */
    .kpi-card {{
        background: {PALETTE["surface"]};
        border: 1px solid {PALETTE["border"]};
        border-radius: 12px;
        padding: 1.2rem 1.4rem 1rem;
        position: relative;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(15,27,45,0.07), 0 1px 2px rgba(15,27,45,0.04);
        transition: box-shadow 0.15s;
    }}
    .kpi-card:hover {{
        box-shadow: 0 4px 12px rgba(15,27,45,0.09);
    }}
    .kpi-card::before {{
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: {PALETTE["accent"]};
        border-radius: 12px 12px 0 0;
    }}
    .kpi-label {{
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: {PALETTE["text_muted"]};
        margin-bottom: 0.4rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }}
    .kpi-value {{
        font-family: 'IBM Plex Mono', ui-monospace, 'SF Mono', monospace;
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.03em;
        color: {PALETTE["text_primary"]};
        line-height: 1.1;
    }}
    .kpi-delta {{
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 0.5rem;
        font-size: 0.76rem;
        font-weight: 600;
        border-radius: 5px;
        padding: 2px 8px;
    }}
    .kpi-delta.positive {{
        background: {PALETTE["positive_bg"]};
        color: {PALETTE["positive"]};
    }}
    .kpi-delta.negative {{
        background: {PALETTE["negative_bg"]};
        color: {PALETTE["negative"]};
    }}
    .kpi-delta.neutral {{
        background: {PALETTE["surface_2"]};
        color: {PALETTE["text_muted"]};
    }}

    /* ── Chart card ── */
    .chart-card {{
        background: {PALETTE["surface"]};
        border: 1px solid {PALETTE["border"]};
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(15,27,45,0.07);
    }}
    .chart-card-title {{
        font-family: 'Schibsted Grotesk', sans-serif;
        font-size: 0.84rem;
        font-weight: 600;
        color: {PALETTE["text_primary"]};
        margin-bottom: 0.9rem;
        letter-spacing: -0.01em;
    }}
    .chart-card-sub {{
        font-size: 0.75rem;
        color: {PALETTE["text_muted"]};
        font-weight: 400;
        margin-left: 6px;
    }}

    /* ── Insight / commentary card ── */
    .insight-card {{
        background: {PALETTE["surface"]};
        border: 1px solid {PALETTE["border"]};
        border-left: 3px solid {PALETTE["accent"]};
        border-radius: 0 10px 10px 0;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        color: {PALETTE["text_primary"]};
        line-height: 1.55;
    }}

    /* ── Upload zone ── */
    .stFileUploader > div > div {{
        background: {PALETTE["surface"]} !important;
        border: 1.5px dashed {PALETTE["border_strong"]} !important;
        border-radius: 12px !important;
    }}

    /* ── Selectbox / radio / slider ── */
    .stSelectbox label, .stRadio label, .stSlider label {{
        font-size: 0.78rem !important;
        font-weight: 600 !important;
        color: {PALETTE["text_muted"]} !important;
        text-transform: uppercase !important;
        letter-spacing: 0.07em !important;
    }}
    div[data-baseweb="select"] > div {{
        border-color: {PALETTE["border_strong"]} !important;
        border-radius: 8px !important;
        background: {PALETTE["surface"]} !important;
        font-size: 0.88rem !important;
        font-family: 'Hanken Grotesk', sans-serif !important;
    }}

    /* ── Primary button (Streamlit) ── */
    .stButton > button[kind="primary"] {{
        background: {PALETTE["accent"]} !important;
        color: #fff !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
    }}

    /* ── Download button ── */
    .stDownloadButton > button {{
        background: {PALETTE["accent"]} !important;
        color: #fff !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        padding: 0.5rem 1.2rem !important;
        letter-spacing: 0.01em;
        box-shadow: 0 1px 3px rgba(47,98,232,0.25);
        transition: opacity 0.15s, box-shadow 0.15s;
    }}
    .stDownloadButton > button:hover {{
        opacity: 0.9 !important;
        box-shadow: 0 4px 12px rgba(47,98,232,0.3) !important;
    }}

    /* ── Dataframe ── */
    .stDataFrame {{
        border: 1px solid {PALETTE["border"]} !important;
        border-radius: 10px !important;
        overflow: hidden;
    }}
    [data-testid="stDataFrameResizable"] th {{
        background: {PALETTE["surface_2"]} !important;
        font-family: 'Hanken Grotesk', sans-serif !important;
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.07em !important;
        color: {PALETTE["text_muted"]} !important;
        border-bottom: 1px solid {PALETTE["border"]} !important;
    }}

    /* ── Expander ── */
    .streamlit-expanderHeader {{
        font-size: 0.82rem !important;
        font-weight: 600 !important;
        color: {PALETTE["text_muted"]} !important;
        background: {PALETTE["surface_2"]} !important;
        border-radius: 8px !important;
    }}

    /* ── Period badge ── */
    .period-badge {{
        display: inline-block;
        background: {PALETTE["accent_light"]};
        color: {PALETTE["accent"]};
        font-size: 0.73rem;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
        letter-spacing: 0.04em;
        margin-left: 8px;
    }}

    /* ── Empty state ── */
    .empty-state {{
        text-align: center;
        padding: 5rem 2rem;
        color: {PALETTE["text_muted"]};
    }}
    .empty-state .icon {{
        width: 64px; height: 64px;
        background: {PALETTE["accent_light"]};
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.8rem;
        margin: 0 auto 1.25rem;
    }}
    .empty-state h3 {{
        font-family: 'Schibsted Grotesk', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: {PALETTE["text_primary"]};
        margin-bottom: 0.6rem;
    }}
    .empty-state p {{
        font-size: 0.88rem;
        max-width: 380px;
        margin: 0 auto;
        line-height: 1.65;
        color: {PALETTE["text_muted"]};
    }}

    /* ── Tabs ── */
    .stTabs [data-baseweb="tab-list"] {{
        background: transparent !important;
        border-bottom: 1px solid {PALETTE["border"]} !important;
        gap: 0 !important;
    }}
    .stTabs [data-baseweb="tab"] {{
        font-family: 'Hanken Grotesk', sans-serif !important;
        font-size: 0.82rem !important;
        font-weight: 600 !important;
        color: {PALETTE["text_muted"]} !important;
        border-radius: 0 !important;
        padding: 0.5rem 1rem !important;
        border-bottom: 2px solid transparent !important;
        background: transparent !important;
    }}
    .stTabs [aria-selected="true"] {{
        color: {PALETTE["accent"]} !important;
        border-bottom: 2px solid {PALETTE["accent"]} !important;
        background: transparent !important;
    }}
    .stTabs [data-baseweb="tab-highlight"] {{
        display: none !important;
    }}
    </style>
    """, unsafe_allow_html=True)


def section_heading(title):
    st.markdown(f'<div class="fpa-section-heading">{title}</div>', unsafe_allow_html=True)


def kpi_card(label, value, delta=None, delta_is_positive=None):
    """Render a styled KPI metric card."""
    delta_html = ""
    if delta is not None:
        if delta_is_positive is True:
            cls = "positive"
            arrow = "↑"
        elif delta_is_positive is False:
            cls = "negative"
            arrow = "↓"
        else:
            cls = "neutral"
            arrow = "→"
        delta_html = f'<div class="kpi-delta {cls}">{arrow} {delta}</div>'

    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-label">{label}</div>
        <div class="kpi-value">{value}</div>
        {delta_html}
    </div>
    """, unsafe_allow_html=True)


def insight_card(text):
    st.markdown(f'<div class="insight-card">{text}</div>', unsafe_allow_html=True)


def chart_card_open(title):
    st.markdown(f'<div class="chart-card"><div class="chart-card-title">{title}</div>', unsafe_allow_html=True)


def chart_card_close():
    st.markdown('</div>', unsafe_allow_html=True)


# ─────────────────────────────────────────────
# PLOTLY THEME
# ─────────────────────────────────────────────
PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Hanken Grotesk, Segoe UI, sans-serif", color=PALETTE["text_primary"], size=12),
    margin=dict(l=0, r=0, t=10, b=0),
    legend=dict(
        orientation="h",
        yanchor="bottom", y=1.02,
        xanchor="left", x=0,
        font=dict(size=11),
        bgcolor="rgba(0,0,0,0)"
    ),
    xaxis=dict(
        gridcolor=PALETTE["border"],
        linecolor=PALETTE["border"],
        tickfont=dict(size=11, color=PALETTE["text_muted"]),
        zeroline=False,
    ),
    yaxis=dict(
        gridcolor=PALETTE["border"],
        linecolor="rgba(0,0,0,0)",
        tickfont=dict(size=11, color=PALETTE["text_muted"]),
        zeroline=False,
    ),
)

# Muted categorical palette from the design system
CHART_COLORS = [
    PALETTE["chart_1"],  # dusty blue
    PALETTE["chart_2"],  # muted teal
    PALETTE["chart_3"],  # soft violet
    PALETTE["chart_4"],  # ochre
    PALETTE["chart_5"],  # sage green
    PALETTE["chart_6"],  # clay
    PALETTE["chart_7"],  # dusty rose
    PALETTE["chart_8"],  # slate
]


def plotly_line_chart(df, x_col, y_cols, labels=None, height=260):
    """Multi-series line chart with the FP&A theme."""
    fig = go.Figure()
    for i, col in enumerate(y_cols):
        if col not in df.columns:
            continue
        name = labels[i] if labels else col
        fig.add_trace(go.Scatter(
            x=df[x_col], y=df[col],
            name=name,
            mode="lines+markers",
            line=dict(color=CHART_COLORS[i % len(CHART_COLORS)], width=2.5),
            marker=dict(size=5, color=CHART_COLORS[i % len(CHART_COLORS)]),
            hovertemplate=f"<b>{name}</b><br>%{{x}}<br>£%{{y:,.0f}}<extra></extra>",
        ))
    layout = {**PLOTLY_LAYOUT, "height": height}
    fig.update_layout(**layout)
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})


def plotly_bar_chart(df, x_col, y_col, height=300, color_positive=True):
    """Horizontal bar chart with positive/negative colouring."""
    df = df.copy().sort_values(y_col)
    colors = []
    for v in df[y_col]:
        # favourable variance = costs fell (v<0) or revenue rose (v>0)
        # the bar chart shows raw variance so we colour negative=favourable, positive=adverse
        colors.append(PALETTE["positive"] if v < 0 else PALETTE["negative"])

    fig = go.Figure(go.Bar(
        x=df[y_col],
        y=df[x_col],
        orientation="h",
        marker_color=colors,
        hovertemplate="<b>%{y}</b><br>£%{x:,.0f}<extra></extra>",
    ))
    layout = {**PLOTLY_LAYOUT, "height": height}
    layout["xaxis"] = {**layout.get("xaxis", {}), "tickprefix": "£", "tickformat": ",.0f"}
    fig.update_layout(**layout)
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})


def plotly_donut_chart(split_df, label_col, height=300):
    """Donut chart to replace matplotlib pie chart."""
    fig = go.Figure(go.Pie(
        labels=split_df[label_col],
        values=split_df["Chart Value"],
        hole=0.55,
        marker=dict(colors=CHART_COLORS[:len(split_df)], line=dict(color="#fff", width=2)),
        textinfo="label+percent",
        textfont=dict(size=11),
        hovertemplate="<b>%{label}</b><br>£%{value:,.0f} (%{percent})<extra></extra>",
    ))
    layout = {**PLOTLY_LAYOUT, "height": height, "showlegend": False}
    fig.update_layout(**layout)
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})


# ─────────────────────────────────────────────
# CONFIG
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
        "gnrh", "academic funding", "winter planning", "advice & guidance"
    ],
    "Direct Costs": [
        "cost of sales", "cos", "direct cost", "direct costs", "subcontractor",
        "subcontractors", "delivery costs", "project costs", "materials", "consumables",
        "drugs and vaccines", "medical supplies", "vaccines"
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
        "doctors - clinical", "nurses clinical", "operations"
    ],
    "Management Costs": [
        "management", "management fee", "management fees", "manager", "leadership",
        "director", "directors", "board costs"
    ],
    "IT Costs": [
        "it", "it costs", "it + office equipment", "software", "hardware", "licence",
        "licences", "license", "licenses", "system", "systems", "tech", "technology",
        "computer", "computers", "microsoft", "office 365", "google workspace",
        "adobe", "xero", "sage", "subscription", "subscriptions", "server", "hosting",
        "domain", "website hosting", "internet", "broadband", "wifi", "telecoms",
        "telephone system", "telephone & internet", "office equipment"
    ],
    "Premises Costs": [
        "rent", "rates", "business rates", "service charge", "service charges",
        "utilities", "electricity", "gas", "water", "cleaning", "repairs",
        "maintenance", "security", "premises", "office rent", "building",
        "facilities", "room bookings", "room booking", "premises costs",
        "non-reimburseable premises costs", "non-reimbursable premises costs",
        "repair, renewals & maintenance"
    ],
    "Professional Fees": [
        "legal", "legal fees", "accountancy", "accounting", "audit", "auditor",
        "consultancy", "consultant", "professional fees", "advisor", "adviser",
        "legal expenses & professional fees"
    ],
    "Marketing Costs": [
        "marketing", "advertising", "promotion", "promotional", "branding", "seo",
        "google ads", "facebook ads", "meta ads", "campaign"
    ],
    "Travel & Entertainment": [
        "travel", "subsistence", "hotel", "hotels", "mileage", "train", "parking",
        "taxi", "taxis", "entertainment", "client entertainment"
    ],
    "Office & Admin": [
        "postage", "courier", "printing", "stationery", "office supplies",
        "admin", "administration", "general expenses", "sundry", "misc",
        "miscellaneous", "cqc costs", "postage, freight & courier"
    ],
    "Insurance": [
        "insurance", "liability insurance", "professional indemnity", "employers liability"
    ],
    "Finance Costs": [
        "bank charges", "interest", "loan interest", "finance charges", "merchant fees"
    ],
    "Depreciation & Amortisation": [
        "depreciation", "amortisation", "amortization"
    ],
    "Tax": [
        "corporation tax", "taxation", "tax"
    ]
}

ACCOUNT_CATEGORY_OVERRIDES = {
    "global sum": "Revenue",
    "qof": "Revenue",
    "enhanced services": "Revenue",
    "private income": "Revenue",
    "training grant": "Revenue",
    "teaching income": "Revenue",
    "pcn des participation payment": "Revenue",
    "access lis funding": "Revenue",
    "winter planning": "Revenue",
    "teledermatology": "Revenue",
    "mmr": "Revenue",
    "rotavirus": "Revenue",
    "shingles": "Revenue",
    "flu": "Revenue",
    "vaccinations": "Revenue",
    "staff cost - practice care navigator": "Staff Costs",
    "staff cost - receptionist": "Staff Costs",
    "staff cost - salaried gp": "Staff Costs",
    "staff cost - pharmacist": "Staff Costs",
    "it + office equipment": "IT Costs",
    "telephone & internet": "IT Costs",
    "legal expenses & professional fees": "Professional Fees",
    "non-reimburseable premises costs": "Premises Costs",
    "non-reimbursable premises costs": "Premises Costs",
    "cqc costs": "Office & Admin"
}

EXPENSE_CATEGORIES = [
    "Direct Costs", "Staff Costs", "Management Costs", "IT Costs",
    "Premises Costs", "Professional Fees", "Marketing Costs",
    "Travel & Entertainment", "Office & Admin", "Insurance",
    "Finance Costs", "Depreciation & Amortisation", "Tax", "Other"
]

SECTION_TO_CATEGORY = {
    "turnover": "Revenue",
    "revenue": "Revenue",
    "income": "Revenue",
    "administrative costs": "Other",
    "other costs": "Other",
    "staff & workforce": "Staff Costs",
    "staff and workforce": "Staff Costs"
}


# ─────────────────────────────────────────────
# FORMATTING HELPERS
# ─────────────────────────────────────────────
def format_currency(value):
    if pd.isna(value):
        return ""
    if value < 0:
        return f"-£{abs(value):,.0f}"
    return f"£{value:,.0f}"


def format_percentage(value):
    if pd.isna(value):
        return ""
    return f"{value:.1f}%"


def format_period_label(period_value, period_type):
    if pd.isna(period_value):
        return ""
    if period_type == "Monthly":
        return pd.Timestamp(period_value).strftime("%b %Y")
    return str(period_value)


# ─────────────────────────────────────────────
# TEXT HELPERS
# ─────────────────────────────────────────────
def clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalise_text(value):
    return clean_text(value).lower().strip()


def first_non_blank(values):
    for value in values:
        text = clean_text(value)
        if text != "" and text.lower() != "nan":
            return text
    return ""


def is_heading_only_row(left_text, account_text):
    left = normalise_text(left_text)
    account = normalise_text(account_text)
    headings = {
        "turnover", "administrative costs",
        "other costs", "staff & workforce", "staff and workforce"
    }
    return left in headings and account == ""


def is_total_or_profit_line(left_text, account_text):
    left = normalise_text(left_text)
    account = normalise_text(account_text)
    subtotal_keywords = [
        "total ", "gross profit", "operating profit", "operating surplus",
        "profit on ordinary activities before taxation", "profit before taxation",
        "profit before tax", "profit after taxation", "profit after tax",
        "net profit", "profit for the period", "surplus for the period",
        "net surplus", "ebitda", "ebit"
    ]
    return any(k in left for k in subtotal_keywords) or any(k in account for k in subtotal_keywords)


# ─────────────────────────────────────────────
# FILE LOADING
# ─────────────────────────────────────────────
def load_file_with_dynamic_header(uploaded_file):
    if uploaded_file.name.endswith(".csv"):
        raw = pd.read_csv(uploaded_file, header=None)
    else:
        raw = pd.read_excel(uploaded_file, header=None)

    header_row = None
    for i in range(min(25, len(raw))):
        row_values = raw.iloc[i].astype(str).str.strip().str.lower().tolist()
        if "account" in row_values:
            header_row = i
            break

    if header_row is None:
        raise ValueError("Could not find an 'Account' header row.")

    headers = raw.iloc[header_row].astype(str).str.strip().tolist()
    df = raw.iloc[header_row + 1:].copy()
    df.columns = headers

    first_col = df.columns[0]
    account_col = next((c for c in df.columns if str(c).strip().lower() == "account"), None)

    if account_col is None:
        raise ValueError("Could not find the Account column after reading the file.")

    df = df.rename(columns={first_col: "Level_1", account_col: "Level_2_Account"})

    section = None
    built_rows = []
    month_cols = [c for c in df.columns if c not in ["Level_1", "Level_2_Account"]]

    for _, row in df.iterrows():
        left_text    = clean_text(row.get("Level_1", ""))
        account_text = clean_text(row.get("Level_2_Account", ""))

        if is_heading_only_row(left_text, account_text):
            section = left_text
            continue

        account_name = (
            first_non_blank([left_text, account_text])
            if is_total_or_profit_line(left_text, account_text)
            else first_non_blank([account_text, left_text])
        )

        if account_name == "":
            continue

        built_row = {"Account": account_name, "Section": section}
        for col in month_cols:
            built_row[col] = row[col]
        built_rows.append(built_row)

    return pd.DataFrame(built_rows)


# ─────────────────────────────────────────────
# DATA CLEANING / CLASSIFICATION
# ─────────────────────────────────────────────
def clean_numeric_series(series):
    cleaned = (
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("£", "", regex=False)
        .str.replace("(", "-", regex=False)
        .str.replace(")", "", regex=False)
        .str.replace(r"[^\d\.\-]", "", regex=True)
        .str.strip()
        .replace("", pd.NA)
    )
    return pd.to_numeric(cleaned, errors="coerce")


def classify_account(account, section=None):
    account = normalise_text(account)
    section = normalise_text(section) if section else ""

    if account in ACCOUNT_CATEGORY_OVERRIDES:
        return ACCOUNT_CATEGORY_OVERRIDES[account]
    for k, v in ACCOUNT_CATEGORY_OVERRIDES.items():
        if k in account:
            return v

    if section in SECTION_TO_CATEGORY:
        sc = SECTION_TO_CATEGORY[section]
        if sc in ("Revenue", "Staff Costs"):
            return sc

    for category, keywords in CATEGORY_RULES.items():
        if any(kw in account for kw in keywords):
            return category

    if re.search(r"\bit\b", account):
        return "IT Costs"

    return "Other"


def is_subtotal(account):
    account = normalise_text(account)
    return any(k in account for k in [
        "total ", "gross profit", "operating profit", "operating surplus",
        "profit on ordinary activities before taxation", "profit before taxation",
        "profit before tax", "profit after taxation", "profit after tax",
        "net profit", "profit for the period", "surplus for the period",
        "net surplus", "ebitda", "ebit"
    ])


def make_insight(row):
    direction = "increased" if row["Variance"] > 0 else "decreased"
    pct = f" ({abs(row['Variance %']):.1f}%)" if pd.notna(row["Variance %"]) else ""
    return f"{row['Account']} {direction} by {format_currency(abs(row['Variance']))}{pct} versus prior period."


# ─────────────────────────────────────────────
# DYNAMIC KPI DETECTION
# ─────────────────────────────────────────────
def detect_kpi_accounts(df_long):
    all_accounts = df_long["Account"].dropna().astype(str).str.strip().unique().tolist()
    subtotal_accounts = [a for a in all_accounts if is_subtotal(a)]

    revenue_kws = [
        "total turnover", "total revenue", "total income", "gross income",
        "total sales", "total fees", "total funding", "total grants",
        "total fee income", "net revenue", "total net revenue"
    ]
    cost_kws = [
        "total administrative costs", "total admin costs", "total overheads",
        "total expenses", "total costs", "total expenditure", "total operating costs",
        "total indirect costs", "total fixed costs", "total running costs",
        "total cost of sales", "total direct costs", "total staff costs",
        "total operating expenses", "total other costs"
    ]
    profit_kws = [
        "operating profit", "operating surplus", "net profit", "gross profit",
        "profit before tax", "profit for the period", "ebitda", "ebit",
        "profit on ordinary activities", "surplus for the period",
        "net surplus", "net income", "profit after tax"
    ]

    def best_match(candidates, keywords):
        for kw in keywords:
            for a in candidates:
                if a.lower().strip() == kw:
                    return a
        for kw in keywords:
            for a in candidates:
                if kw in a.lower():
                    return a
        return None

    return {
        "revenue": best_match(subtotal_accounts, revenue_kws) or best_match(all_accounts, revenue_kws),
        "costs":   best_match(subtotal_accounts, cost_kws)    or best_match(all_accounts, cost_kws),
        "profit":  best_match(subtotal_accounts, profit_kws)  or best_match(all_accounts, profit_kws),
    }


def get_kpi_row_dynamic(analysis_df, selected_period, kpi_account_name, period_col="Period"):
    if kpi_account_name is None:
        return None
    match = analysis_df[
        (analysis_df[period_col] == selected_period) &
        (analysis_df["Account"].astype(str).str.strip() == kpi_account_name.strip())
    ]
    return match.iloc[0] if not match.empty else None


def get_kpi_trend_series_dynamic(df_long, account_name):
    if account_name is None:
        return pd.DataFrame(columns=["Month", "Value"])
    return (
        df_long[df_long["Account"].astype(str).str.strip() == account_name.strip()]
        .groupby("Month", as_index=False)["Value"].sum()
    )


# ─────────────────────────────────────────────
# FY / QUARTER LOGIC
# ─────────────────────────────────────────────
def get_financial_year(dt):
    dt = pd.Timestamp(dt)
    return dt.year if dt.month >= 4 else dt.year - 1


def get_financial_quarter(dt):
    dt = pd.Timestamp(dt)
    q = {4: "Q1", 5: "Q1", 6: "Q1", 7: "Q2", 8: "Q2", 9: "Q2",
         10: "Q3", 11: "Q3", 12: "Q3", 1: "Q4", 2: "Q4", 3: "Q4"}[dt.month]
    fy = get_financial_year(dt)
    return f"FY{str(fy)[-2:]}/{str(fy + 1)[-2:]} {q}"


def quarter_sort_key(label):
    qo = {"Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4}
    parts = label.split(" ")
    fy_start = int("20" + parts[0][2:4])
    return fy_start * 10 + qo[parts[1]]


def build_period_view(df_long, period_type):
    df = df_long.copy()
    df["Period"] = df["Month"] if period_type == "Monthly" else df["Month"].apply(get_financial_quarter)

    grouped = df.groupby(["Account", "Section", "Period"], as_index=False)["Value"].sum()
    grouped["Period Sort"] = (
        pd.to_datetime(grouped["Period"]) if period_type == "Monthly"
        else grouped["Period"].apply(quarter_sort_key)
    )
    grouped = grouped.sort_values(["Account", "Period Sort"])
    grouped["Previous Value"] = grouped.groupby("Account")["Value"].shift(1)
    grouped["Variance"] = grouped["Value"] - grouped["Previous Value"]
    grouped["Variance %"] = grouped.apply(
        lambda r: (r["Variance"] / r["Previous Value"] * 100)
        if pd.notna(r["Previous Value"]) and r["Previous Value"] != 0 else None,
        axis=1
    )
    grouped["Abs Variance"] = grouped["Variance"].abs()
    grouped["Category"] = grouped.apply(lambda r: classify_account(r["Account"], r["Section"]), axis=1)
    grouped["Is Subtotal"] = grouped["Account"].apply(is_subtotal)
    return grouped


def build_kpi_trend_view(df_long, trend_view, kpi_accounts):
    rev  = get_kpi_trend_series_dynamic(df_long, kpi_accounts["revenue"]).rename(columns={"Value": "Revenue"})
    cost = get_kpi_trend_series_dynamic(df_long, kpi_accounts["costs"]).rename(columns={"Value": "Costs"})
    prof = get_kpi_trend_series_dynamic(df_long, kpi_accounts["profit"]).rename(columns={"Value": "Profit"})

    kpi = rev.merge(cost, on="Month", how="outer").merge(prof, on="Month", how="outer")
    kpi = kpi.sort_values("Month").fillna(0)

    if trend_view == "Monthly":
        return kpi

    kpi["Quarter"] = kpi["Month"].apply(get_financial_quarter)
    kpi["Quarter Sort"] = kpi["Quarter"].apply(quarter_sort_key)
    return (
        kpi.groupby(["Quarter", "Quarter Sort"], as_index=False)[["Revenue", "Costs", "Profit"]]
        .sum().sort_values("Quarter Sort")
    )


# ─────────────────────────────────────────────
# PIE / DONUT DATA PREP
# ─────────────────────────────────────────────
def prepare_split_df(period_df, categories, split_basis="Account", use_absolute=False, top_n=6):
    df = period_df[
        period_df["Category"].isin(categories) & ~period_df["Is Subtotal"]
    ].copy()

    if df.empty:
        return pd.DataFrame(columns=[split_basis, "Chart Value", "Split %"])

    group_col = "Account" if split_basis == "Account" else "Category"
    df = df.groupby(group_col, as_index=False)["Value"].sum()
    df["Chart Value"] = df["Value"].abs() if use_absolute else df["Value"]
    df = df[df["Chart Value"] > 0].sort_values("Chart Value", ascending=False)

    if len(df) > top_n:
        top = df.head(top_n).copy()
        other_val = df.iloc[top_n:]["Chart Value"].sum()
        if other_val > 0:
            df = pd.concat([top, pd.DataFrame([{group_col: "Other", "Value": other_val, "Chart Value": other_val}])], ignore_index=True)
        else:
            df = top

    df["Split %"] = df["Chart Value"] / df["Chart Value"].sum() * 100
    return df


# ─────────────────────────────────────────────
# STYLING (dataframe)
# ─────────────────────────────────────────────
def _var_colour(val):
    if pd.isna(val): return ""
    return f"color: {PALETTE['negative']}; font-weight: 600;" if val > 0 else (f"color: {PALETTE['positive']}; font-weight: 600;" if val < 0 else "")


def _contrib_colour(val):
    if pd.isna(val): return ""
    return f"color: {PALETTE['negative']};" if val > 0 else (f"color: {PALETTE['positive']};" if val < 0 else "")


def style_financial_df(df, currency_cols=None, pct_cols=None, variance_cols=None, contribution_cols=None):
    currency_cols    = currency_cols or []
    pct_cols         = pct_cols or []
    variance_cols    = variance_cols or []
    contribution_cols = contribution_cols or []

    fmt = {}
    for c in currency_cols:
        if c in df.columns: fmt[c] = format_currency
    for c in pct_cols:
        if c in df.columns: fmt[c] = format_percentage

    s = df.style.format(fmt)
    for c in variance_cols:
        if c in df.columns: s = s.map(_var_colour, subset=[c])
    for c in contribution_cols:
        if c in df.columns: s = s.map(_contrib_colour, subset=[c])
    s = s.set_properties(**{"text-align": "left", "white-space": "nowrap"})
    return s


# ─────────────────────────────────────────────
# COMMENTARY
# ─────────────────────────────────────────────
def make_management_commentary(selected_period, driver_period_df, analysis_df, period_type, kpi_accounts):
    period_label  = format_period_label(selected_period, period_type)
    revenue_row   = get_kpi_row_dynamic(analysis_df, selected_period, kpi_accounts["revenue"])
    cost_row      = get_kpi_row_dynamic(analysis_df, selected_period, kpi_accounts["costs"])
    profit_row    = get_kpi_row_dynamic(analysis_df, selected_period, kpi_accounts["profit"])
    revenue_label = kpi_accounts["revenue"] or "Revenue"
    cost_label    = kpi_accounts["costs"]   or "Administrative Costs"
    profit_label  = kpi_accounts["profit"]  or "Operating Profit"

    commentary = []

    if profit_row is not None and pd.notna(profit_row["Variance"]):
        word = "improved" if profit_row["Variance"] > 0 else "declined"
        commentary.append(
            f"{profit_label} {word} in {period_label} by "
            f"{format_currency(abs(profit_row['Variance']))} versus prior period."
        ) if profit_row["Variance"] != 0 else commentary.append(
            f"{profit_label} was unchanged in {period_label} versus prior period."
        )

    for row_data, label in [(revenue_row, revenue_label), (cost_row, cost_label)]:
        if row_data is not None and pd.notna(row_data["Variance"]) and row_data["Variance"] != 0:
            direction = "increased" if row_data["Variance"] > 0 else "decreased"
            pct = f" ({abs(row_data['Variance %']):.1f}%)" if pd.notna(row_data["Variance %"]) else ""
            commentary.append(
                f"{label} {direction} by {format_currency(abs(row_data['Variance']))}{pct} versus prior period."
            )

    for _, row in driver_period_df.sort_values("Abs Variance", ascending=False).head(3).iterrows():
        if pd.notna(row["Variance"]) and row["Variance"] != 0:
            commentary.append(make_insight(row))

    return commentary, revenue_row, cost_row, profit_row


# ─────────────────────────────────────────────
# EXPORTS
# ─────────────────────────────────────────────
def make_management_pack_zip(selected_period_label, category_summary, driver_period_df,
                              top_movements, commentary_lines, revenue_row, costs_row,
                              profit_row, kpi_accounts):
    buffer = BytesIO()
    safe   = selected_period_label.replace(" ", "_").replace("/", "-")
    rl = kpi_accounts["revenue"] or "Revenue"
    cl = kpi_accounts["costs"]   or "Administrative Costs"
    pl = kpi_accounts["profit"]  or "Operating Profit"

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"category_summary_{safe}.csv",  category_summary.to_csv(index=False))
        zf.writestr(f"variance_detail_{safe}.csv",   driver_period_df.to_csv(index=False))
        zf.writestr(f"top_movements_{safe}.csv",     top_movements.to_csv(index=False))
        lines = [
            f"Management Pack Summary - {selected_period_label}", "",
            f"{rl}: {format_currency(revenue_row['Value']) if revenue_row is not None else 'N/A'}",
            f"{cl}: {format_currency(costs_row['Value']) if costs_row is not None else 'N/A'}",
            f"{pl}: {format_currency(profit_row['Value']) if profit_row is not None else 'N/A'}",
            f"{pl} Variance: {format_currency(profit_row['Variance']) if profit_row is not None and pd.notna(profit_row['Variance']) else 'N/A'}",
            "", "Management Commentary:",
        ] + ([f"- {l}" for l in commentary_lines] if commentary_lines else ["No commentary available."])
        zf.writestr(f"management_commentary_{safe}.txt", "\n".join(lines))

    buffer.seek(0)
    return buffer.getvalue()


def add_pdf_text_page(pdf, title, lines, fontsize=11, lines_per_page=32):
    if not lines:
        lines = [""]
    for page_num, chunk in enumerate([lines[i:i+lines_per_page] for i in range(0, len(lines), lines_per_page)]):
        fig, ax = plt.subplots(figsize=(8.27, 11.69))
        ax.axis("off")
        ax.text(0.02, 0.98, title if page_num == 0 else f"{title} (cont.)", fontsize=16, fontweight="bold", va="top")
        y = 0.93
        for line in chunk:
            ax.text(0.02, y, str(line), fontsize=fontsize, va="top", wrap=True)
            y -= 0.026
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)


def add_pdf_table_page(pdf, title, df, max_rows=18):
    if df.empty:
        add_pdf_text_page(pdf, title, ["No data available."])
        return
    for page_num, chunk in enumerate([df.iloc[i:i+max_rows].copy() for i in range(0, len(df), max_rows)]):
        fig, ax = plt.subplots(figsize=(11.69, 8.27))
        ax.axis("off")
        ax.set_title(title if page_num == 0 else f"{title} (cont.)", fontsize=14, fontweight="bold", loc="left", pad=12)
        d = chunk.copy()
        for col in d.columns:
            if "Variance %" in col or "Contribution %" in col or "Split %" in col:
                d[col] = d[col].apply(format_percentage)
            elif col in ["Value", "Previous Value", "Variance", "Abs Variance", "Chart Value"]:
                d[col] = d[col].apply(format_currency)
        t = ax.table(cellText=d.values, colLabels=d.columns, loc="center")
        t.auto_set_font_size(False)
        t.set_fontsize(8)
        t.scale(1, 1.4)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)


def make_management_pack_pdf(selected_period_label, revenue_row, costs_row, profit_row,
                              commentary_lines, category_summary, top_movements,
                              driver_period_df, kpi_accounts):
    buffer = BytesIO()
    rl = kpi_accounts["revenue"] or "Revenue"
    cl = kpi_accounts["costs"]   or "Administrative Costs"
    pl = kpi_accounts["profit"]  or "Operating Profit"

    with PdfPages(buffer) as pdf:
        lines = [
            f"Period: {selected_period_label}", "",
            f"{rl}: {format_currency(revenue_row['Value']) if revenue_row is not None else 'N/A'}",
            f"{rl} variance: {format_currency(revenue_row['Variance']) if revenue_row is not None and pd.notna(revenue_row['Variance']) else 'N/A'}",
            "",
            f"{cl}: {format_currency(costs_row['Value']) if costs_row is not None else 'N/A'}",
            f"{cl} variance: {format_currency(costs_row['Variance']) if costs_row is not None and pd.notna(costs_row['Variance']) else 'N/A'}",
            "",
            f"{pl}: {format_currency(profit_row['Value']) if profit_row is not None else 'N/A'}",
            f"{pl} variance: {format_currency(profit_row['Variance']) if profit_row is not None and pd.notna(profit_row['Variance']) else 'N/A'}",
            "", "Management Commentary:",
        ] + ([f"- {l}" for l in commentary_lines] if commentary_lines else ["No commentary available."])
        add_pdf_text_page(pdf, f"FP&A Copilot — {selected_period_label}", lines)
        add_pdf_table_page(pdf, "Category Summary",
            category_summary[["Category", "Value", "Previous Value", "Variance", "Variance %", "Abs Variance"]])
        add_pdf_table_page(pdf, "Top 10 Movements",
            top_movements[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]])
        add_pdf_table_page(pdf, "Variance Detail",
            driver_period_df[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]])

    buffer.seek(0)
    return buffer.getvalue()


# ═══════════════════════════════════════════════════════════
# MAIN APP
# ═══════════════════════════════════════════════════════════
inject_css()

# ── Page header ──
st.markdown("""
<div class="fpa-page-header">
    <div class="fpa-logo">F</div>
    <div>
        <h1>FP&amp;A Copilot</h1>
        <span>Variance analysis &nbsp;·&nbsp; Trend charts &nbsp;·&nbsp; Management pack export</span>
    </div>
</div>
""", unsafe_allow_html=True)

# ── Sidebar ──
with st.sidebar:
    st.markdown("### Upload")
    uploaded_file = st.file_uploader("P&L file (CSV or Excel)", type=["csv", "xlsx"], label_visibility="collapsed")
    st.markdown("### Settings")
    period_type = st.selectbox("View by", ["Monthly", "Quarterly"])
    st.markdown("### Debug")
    debug_mode = st.checkbox("Show debug info", value=False)

if uploaded_file is None:
    st.markdown("""
    <div class="empty-state">
        <div class="icon">📊</div>
        <h3>Upload a P&amp;L to get started</h3>
        <p>Drop a CSV or Excel file in the sidebar. The tool will auto-detect headers,
        classify accounts, and build your variance analysis — including KPI cards,
        trend charts, category breakdowns, and a management pack export.</p>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

# ── Load file ──
try:
    df = load_file_with_dynamic_header(uploaded_file)
except Exception as e:
    st.error(f"Error reading file: {e}")
    st.stop()

df = df.dropna(how="all")

if "Account" not in df.columns:
    st.error("No usable account structure found after loading the file.")
    st.stop()

df["Account"] = df["Account"].astype(str).str.strip()
df["Section"] = df["Section"].astype(str).replace("nan", "").fillna("")
df = df[df["Account"].notna() & (df["Account"] != "") & (df["Account"].str.lower() != "nan")]

possible_month_cols = [c for c in df.columns if c not in ["Account", "Section"]]
clean_month_cols = []
for col in possible_month_cols:
    parsed = pd.to_datetime(str(col).replace("Sept", "Sep").strip(), errors="coerce")
    if pd.notna(parsed):
        clean_month_cols.append(col)

if not clean_month_cols:
    st.error("No valid month columns detected. Check your file's column headers.")
    st.stop()

df_long = df.melt(id_vars=["Account", "Section"], value_vars=clean_month_cols, var_name="Month", value_name="Value")
df_long["Month"] = pd.to_datetime(df_long["Month"].astype(str).str.replace("Sept", "Sep", regex=False).str.strip(), errors="coerce")
df_long["Value"] = clean_numeric_series(df_long["Value"])
df_long = df_long.dropna(subset=["Month", "Value"])
df_long = df_long.groupby(["Account", "Section", "Month"], as_index=False)["Value"].sum()

kpi_accounts = detect_kpi_accounts(df_long)

# ── Labels ──
revenue_label = kpi_accounts["revenue"] or "Revenue"
cost_label    = kpi_accounts["costs"]   or "Costs"
profit_label  = kpi_accounts["profit"]  or "Operating Profit"

# ── Debug panels ──
if debug_mode:
    with st.expander("🔍 Detected KPI Accounts"):
        st.write(f"**Revenue:** {kpi_accounts['revenue'] or '⚠️ Not found'}")
        st.write(f"**Costs:** {kpi_accounts['costs'] or '⚠️ Not found'}")
        st.write(f"**Profit:** {kpi_accounts['profit'] or '⚠️ Not found'}")
    with st.expander("🗃️ Raw data preview"):
        st.dataframe(df_long.head(20), use_container_width=True)
    with st.expander("🏷️ Account classification"):
        dbg = df_long[["Account", "Section"]].drop_duplicates().copy()
        dbg["Category"] = dbg.apply(lambda r: classify_account(r["Account"], r["Section"]), axis=1)
        st.dataframe(dbg.sort_values(["Category", "Account"]), use_container_width=True)

analysis_df       = build_period_view(df_long, period_type)
driver_analysis_df = analysis_df[~analysis_df["Is Subtotal"]].copy()

if driver_analysis_df.empty:
    st.warning("No period-on-period variance could be calculated from this file.")
    st.stop()

# ═══════════════════════════════════════════════════════════
# SECTION 1 — KPI TREND CHARTS
# ═══════════════════════════════════════════════════════════
section_heading("KPI Trends")

trend_view = st.radio("View", ["Monthly", "Quarterly"], horizontal=True, key="trend_radio")
kpi_trend_df   = build_kpi_trend_view(df_long, trend_view, kpi_accounts)
trend_index    = "Month" if trend_view == "Monthly" else "Quarter"

col_a, col_b = st.columns([3, 2])

with col_a:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="chart-card-title">{revenue_label} · {cost_label} · {profit_label}</div>', unsafe_allow_html=True)
    plotly_line_chart(
        kpi_trend_df, trend_index,
        ["Revenue", "Costs", "Profit"],
        labels=[revenue_label, cost_label, profit_label],
        height=280
    )
    st.markdown('</div>', unsafe_allow_html=True)

with col_b:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="chart-card-title">{profit_label} trend</div>', unsafe_allow_html=True)
    plotly_line_chart(
        kpi_trend_df, trend_index, ["Profit"],
        labels=[profit_label], height=280
    )
    st.markdown('</div>', unsafe_allow_html=True)

col_c, col_d = st.columns(2)
with col_c:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="chart-card-title">{revenue_label}</div>', unsafe_allow_html=True)
    plotly_line_chart(kpi_trend_df, trend_index, ["Revenue"], labels=[revenue_label], height=220)
    st.markdown('</div>', unsafe_allow_html=True)

with col_d:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="chart-card-title">{cost_label}</div>', unsafe_allow_html=True)
    plotly_line_chart(kpi_trend_df, trend_index, ["Costs"], labels=[cost_label], height=220)
    st.markdown('</div>', unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════
# SECTION 2 — PERIOD SELECTION + SUMMARY CARDS
# ═══════════════════════════════════════════════════════════
section_heading("Period Analysis")

period_options = (
    analysis_df[["Period", "Period Sort"]].drop_duplicates()
    .sort_values("Period Sort")["Period"].tolist()
)

selected_period = st.selectbox(
    "Period",
    period_options,
    format_func=lambda x: format_period_label(x, period_type),
    label_visibility="collapsed"
)
period_label_str = format_period_label(selected_period, period_type)

period_df       = analysis_df[analysis_df["Period"] == selected_period].copy()
driver_period_df = driver_analysis_df[driver_analysis_df["Period"] == selected_period].copy()

commentary_lines, revenue_row, costs_row, profit_row = make_management_commentary(
    selected_period, driver_period_df, analysis_df, period_type, kpi_accounts
)

# ── KPI cards ──
st.markdown(
    f'<div style="font-size:0.8rem;color:{PALETTE["text_muted"]};margin-bottom:0.9rem;">'
    f'Showing <strong style="color:{PALETTE["text_primary"]};font-family:\'Schibsted Grotesk\',sans-serif">'
    f'{period_label_str}</strong>'
    f'<span class="period-badge">{period_label_str}</span>'
    f'&nbsp; vs prior period</div>',
    unsafe_allow_html=True
)

c1, c2, c3, c4 = st.columns(4)

with c1:
    if revenue_row is not None:
        is_pos = revenue_row["Variance"] > 0 if pd.notna(revenue_row["Variance"]) else None
        kpi_card(
            revenue_label,
            format_currency(revenue_row["Value"]),
            delta=format_currency(revenue_row["Variance"]) if pd.notna(revenue_row.get("Variance")) else None,
            delta_is_positive=is_pos
        )
    else:
        kpi_card(revenue_label, "N/A")

with c2:
    if costs_row is not None:
        # For costs: increase is bad (negative), decrease is good (positive)
        is_pos = costs_row["Variance"] < 0 if pd.notna(costs_row["Variance"]) else None
        kpi_card(
            cost_label,
            format_currency(costs_row["Value"]),
            delta=format_currency(costs_row["Variance"]) if pd.notna(costs_row.get("Variance")) else None,
            delta_is_positive=is_pos
        )
    else:
        kpi_card(cost_label, "N/A")

with c3:
    if profit_row is not None:
        is_pos = profit_row["Variance"] > 0 if pd.notna(profit_row["Variance"]) else None
        kpi_card(
            profit_label,
            format_currency(profit_row["Value"]),
            delta=format_currency(profit_row["Variance"]) if pd.notna(profit_row.get("Variance")) else None,
            delta_is_positive=is_pos
        )
    else:
        kpi_card(profit_label, "N/A")

with c4:
    if profit_row is not None and pd.notna(profit_row.get("Variance %")):
        is_pos = profit_row["Variance %"] > 0
        kpi_card(
            "Profit Variance",
            f"{profit_row['Variance %']:.1f}%",
            delta=f"{abs(profit_row['Variance %']):.1f}%",
            delta_is_positive=is_pos
        )
    else:
        kpi_card("Profit Variance", "N/A")

# ═══════════════════════════════════════════════════════════
# SECTION 3 — CATEGORY SUMMARY + PIE CHARTS
# ═══════════════════════════════════════════════════════════
section_heading("Category Breakdown")

category_summary = (
    driver_period_df.groupby("Category", as_index=False)
    .agg({"Value": "sum", "Previous Value": "sum", "Variance": "sum"})
)
category_summary["Variance %"] = category_summary.apply(
    lambda r: r["Variance"] / r["Previous Value"] * 100
    if pd.notna(r["Previous Value"]) and r["Previous Value"] != 0 else None,
    axis=1
)
category_summary["Abs Variance"] = category_summary["Variance"].abs()

left_col, right_col = st.columns([2, 3])

with left_col:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown(f'<div class="chart-card-title">Category summary — {period_label_str}</div>', unsafe_allow_html=True)
    st.dataframe(
        style_financial_df(
            category_summary,
            currency_cols=["Value", "Previous Value", "Variance", "Abs Variance"],
            pct_cols=["Variance %"],
            variance_cols=["Variance", "Variance %"]
        ),
        use_container_width=True,
        height=320
    )
    st.markdown('</div>', unsafe_allow_html=True)

with right_col:
    pie_top_n   = st.slider("Segments before 'Other'", 3, 12, 6)
    split_basis = st.radio("Split by", ["Account", "Category"], horizontal=True)
    label_col   = "Account" if split_basis == "Account" else "Category"

    revenue_split_df = prepare_split_df(period_df, ["Revenue"], split_basis, False, pie_top_n)
    expense_split_df = prepare_split_df(period_df, EXPENSE_CATEGORIES, split_basis, True, pie_top_n)

    p1, p2 = st.columns(2)
    with p1:
        st.markdown(f'<div class="chart-card-title" style="margin-top:0.5rem">Revenue split</div>', unsafe_allow_html=True)
        if revenue_split_df.empty:
            st.info("No revenue data.")
        else:
            plotly_donut_chart(revenue_split_df, label_col, height=260)

    with p2:
        st.markdown(f'<div class="chart-card-title" style="margin-top:0.5rem">Expense split</div>', unsafe_allow_html=True)
        if expense_split_df.empty:
            st.info("No expense data.")
        else:
            plotly_donut_chart(expense_split_df, label_col, height=260)

# ═══════════════════════════════════════════════════════════
# SECTION 4 — MOVEMENTS
# ═══════════════════════════════════════════════════════════
section_heading("Variance Movements")

top_movements = driver_period_df.sort_values("Abs Variance", ascending=False).head(10)
top_increases = driver_period_df.sort_values("Variance", ascending=False).head(10)
top_decreases = driver_period_df.sort_values("Variance", ascending=True).head(10)

significant_df = driver_period_df[
    (driver_period_df["Variance"].abs() >= 500) |
    (driver_period_df["Variance %"].abs() >= 10)
].copy()

revenue_df = driver_period_df[driver_period_df["Category"] == "Revenue"].copy()
cost_df    = driver_period_df[driver_period_df["Category"].isin(EXPENSE_CATEGORIES)].copy()

# Waterfall bar chart
st.markdown('<div class="chart-card">', unsafe_allow_html=True)
st.markdown('<div class="chart-card-title">Top 10 account movements</div>', unsafe_allow_html=True)
if not top_movements.empty:
    plotly_bar_chart(top_movements, "Account", "Variance", height=320)
st.markdown('</div>', unsafe_allow_html=True)

tab1, tab2, tab3, tab4, tab5 = st.tabs(["Top 10 Movements", "Top Increases", "Top Decreases", "Revenue Changes", "Cost Increases"])

with tab1:
    st.dataframe(
        style_financial_df(
            top_movements[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]],
            currency_cols=["Value", "Previous Value", "Variance"],
            pct_cols=["Variance %"], variance_cols=["Variance", "Variance %"]
        ),
        use_container_width=True
    )

with tab2:
    st.dataframe(
        style_financial_df(
            top_increases[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]],
            currency_cols=["Value", "Previous Value", "Variance"],
            pct_cols=["Variance %"], variance_cols=["Variance", "Variance %"]
        ),
        use_container_width=True
    )

with tab3:
    st.dataframe(
        style_financial_df(
            top_decreases[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]],
            currency_cols=["Value", "Previous Value", "Variance"],
            pct_cols=["Variance %"], variance_cols=["Variance", "Variance %"]
        ),
        use_container_width=True
    )

with tab4:
    top_rev = revenue_df.sort_values("Abs Variance", ascending=False).head(10)
    st.dataframe(
        style_financial_df(
            top_rev[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]],
            currency_cols=["Value", "Previous Value", "Variance"],
            pct_cols=["Variance %"], variance_cols=["Variance", "Variance %"]
        ),
        use_container_width=True
    )

with tab5:
    top_cost = cost_df.sort_values("Variance", ascending=False).head(10)
    st.dataframe(
        style_financial_df(
            top_cost[["Account", "Category", "Value", "Previous Value", "Variance", "Variance %"]],
            currency_cols=["Value", "Previous Value", "Variance"],
            pct_cols=["Variance %"], variance_cols=["Variance", "Variance %"]
        ),
        use_container_width=True
    )

# ═══════════════════════════════════════════════════════════
# SECTION 5 — INSIGHTS & COMMENTARY
# ═══════════════════════════════════════════════════════════
section_heading("Insights & Commentary")

ins_col, comm_col = st.columns(2)

with ins_col:
    st.markdown(f'<div class="chart-card-title">Key account movements</div>', unsafe_allow_html=True)
    if significant_df.empty:
        st.caption("No significant movements for this period.")
    else:
        for _, row in significant_df.sort_values("Abs Variance", ascending=False).head(5).iterrows():
            insight_card(make_insight(row))

    st.markdown(f'<div class="chart-card-title" style="margin-top:1.2rem">Category movements</div>', unsafe_allow_html=True)
    for _, row in category_summary.sort_values("Abs Variance", ascending=False).head(3).iterrows():
        if row["Variance"] == 0:
            insight_card(f"{row['Category']} was unchanged versus prior period.")
        else:
            direction = "increased" if row["Variance"] > 0 else "decreased"
            pct = f" ({abs(row['Variance %']):.1f}%)" if pd.notna(row["Variance %"]) else ""
            insight_card(f"{row['Category']} {direction} by {format_currency(abs(row['Variance']))}{pct} versus prior period.")

with comm_col:
    st.markdown(f'<div class="chart-card-title">Management commentary — {period_label_str}</div>', unsafe_allow_html=True)
    if commentary_lines:
        for line in commentary_lines:
            insight_card(line)
    else:
        st.caption("No commentary available.")

    # Top drivers
    st.markdown(f'<div class="chart-card-title" style="margin-top:1.2rem">Top drivers of movement</div>', unsafe_allow_html=True)
    driver_df = driver_period_df.sort_values("Abs Variance", ascending=False).head(5).copy()
    abs_total = driver_df["Variance"].abs().sum()
    driver_df["Contribution %"] = (driver_df["Variance"].abs() / abs_total * 100) if abs_total != 0 else 0
    st.dataframe(
        style_financial_df(
            driver_df[["Account", "Category", "Variance", "Contribution %"]],
            currency_cols=["Variance"], pct_cols=["Contribution %"],
            variance_cols=["Variance"], contribution_cols=["Contribution %"]
        ),
        use_container_width=True
    )

# ═══════════════════════════════════════════════════════════
# SECTION 6 — EXPORT
# ═══════════════════════════════════════════════════════════
section_heading("Export Management Pack")

exp_col1, exp_col2 = st.columns(2)

with exp_col1:
    st.markdown(f"""
    <div class="chart-card">
        <div class="chart-card-title">CSV Pack</div>
        <p style="font-size:0.83rem;color:{PALETTE['text_muted']};margin-bottom:1rem;line-height:1.6;">
            Category summary, variance detail, top movements, and management commentary
            bundled as a ZIP archive — ready for spreadsheet analysis.
        </p>
    </div>
    """, unsafe_allow_html=True)
    zip_data = make_management_pack_zip(
        period_label_str, category_summary, driver_period_df, top_movements,
        commentary_lines, revenue_row, costs_row, profit_row, kpi_accounts
    )
    st.download_button(
        "⬇ Download CSV Pack (.zip)", data=zip_data,
        file_name=f"management_pack_{period_label_str.replace(' ', '_').replace('/', '-')}.zip",
        mime="application/zip"
    )

with exp_col2:
    st.markdown(f"""
    <div class="chart-card">
        <div class="chart-card-title">PDF Pack</div>
        <p style="font-size:0.83rem;color:{PALETTE['text_muted']};margin-bottom:1rem;line-height:1.6;">
            Formatted PDF with cover summary, category tables, top movements,
            and variance detail — board-ready and shareable in one click.
        </p>
    </div>
    """, unsafe_allow_html=True)
    pdf_data = make_management_pack_pdf(
        period_label_str, revenue_row, costs_row, profit_row,
        commentary_lines, category_summary, top_movements, driver_period_df, kpi_accounts
    )
    st.download_button(
        "⬇ Download PDF Pack (.pdf)", data=pdf_data,
        file_name=f"management_pack_{period_label_str.replace(' ', '_').replace('/', '-')}.pdf",
        mime="application/pdf"
    )
   