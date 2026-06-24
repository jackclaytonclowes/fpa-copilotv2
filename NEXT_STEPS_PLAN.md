# MonthEndIQ — Strategy Review & Next Steps Plan

*Generated: 24 June 2026*

---

## 1. Current State Summary

MonthEndIQ is a FastAPI + React FP&A web app targeted at accounting practices. It:

- Accepts P&L Excel/CSV uploads (month-on-month or budget-vs-actual mode)
- Runs variance analysis and generates AI-written board commentary
- Presents a dashboard with KPI tiles, variance tables, and movement drill-downs
- Has a Q&A Copilot (chat interface over the financial data)
- Generates PDF management packs via ReportLab
- Has a Practice Portfolio view for multi-client triage
- Supports a client-facing SharedView digest (shareable link with dark mode, PDF download, trend chart, period selector)
- Has scenario analysis (what-if modelling)
- Stores sessions in SQLite; in-memory cache; no auth system

**Tech stack:** FastAPI, SQLite, React 18 (no build step — Babel standalone), pure SVG charts, no external chart library.

---

## 2. Competitor Landscape Summary

| Competitor | Key Strengths | Weakness |
|---|---|---|
| **Fathom** | Commentary Writer with symbolic attribution; Portfolio Insights Dashboard; polished PDFs | Expensive; slow for large datasets; no mobile app |
| **Spotlight Reporting** | Best-in-class PDF deliverables; modular; multi-entity consolidation | Expensive (£329+/month); steep learning curve |
| **Syft Analytics** | Syft Assist AI (audio narration, email summaries, card-level insights); cheap entry price | Less customisable; South Africa origin = brand recognition gap in UK/US |
| **Futrli** | Cash flow focus; traffic light predictions for clients; accountant-first | "Clunky" UX reviews; limited reporting |
| **Jirav** | Driver-based planning; mid-market CFO advisory focus | $10k/year minimum; acknowledged weak UX |
| **Mosaic/Runway** | Design-forward; SaaS-native metrics | Wrong ICP (startups, not accounting practices) |

### Key Market Gaps MonthEndIQ Can Own

1. **Month-end status triage** — no competitor surfaces "has this client's data been uploaded for this month?" alongside financial health
2. **Sub-60 second onboarding with demo data** — no competitor does pre-loaded demo data well
3. **Structured AI tone presets** (Board Pack / Management Review / Client Digest) — Fathom generates free-form; no one does structured tone-switching
4. **UK accounting practice focus** — most tools are US-first; MonthEndIQ uses UK terminology (favourable/adverse, management pack, board commentary)

---

## 3. Problems Found in Codebase Audit

### Critical
- No auth system — any session ID is publicly accessible via `/view/{id}` or `/api/data/{id}`
- Sessions are in-memory + SQLite; server restart = data loss for in-memory state
- ReportLab font configuration may warn but not break on some server configurations

### High Priority UX
- ~~Logo not clickable — no way to navigate home~~ ✅ Fixed
- ~~Toast has no dismiss button — errors stick for 3.2 seconds~~ ✅ Fixed
- ~~Sidebar shows hardcoded "Finance Team" — not personalised~~ ✅ Fixed
- ~~TopBar share link omits firm name — client sees no firm branding in shared URL~~ ✅ Fixed
- ~~Movements search has no clear (×) button~~ ✅ Fixed
- Settings view minimal — only firm name + theme toggle; no data export, no session management
- Empty state on Copilot/Movements when no data is loaded could be friendlier
- No onboarding guidance after first upload
- Missing waterfall/bridge chart for variance explanation (industry standard)

### Medium Priority
- Portfolio cards lack triage status (no RAG / traffic-light indicators)
- AI commentary has no "period context" input (Fathom's key differentiator)
- Scenario analysis lacks rename and delete support
- Mobile: SVG charts have fixed widths — don't reflow on mobile
- SharedView: trend chart dots too small to tap on mobile
- Command palette (⌘K) not accessible on mobile at all
- `document.execCommand("copy")` deprecated fallback — silently fails in some browsers

### Low Priority / Polish
- Sidebar section headers ("Analyse", "Workspace") could be cleaner
- Reports view has placeholder sections
- Copilot suggested questions could be more relevant to the data
- Error boundaries exist but error messages are generic

---

## 4. Implemented in This Session

### Features Built Before Audit
- Firm name encoded in Portfolio share URL → displayed in SharedView footer
- Period selector dropdown in SharedView (persistent client portal with period switching)
- Download PDF button in SharedView header
- 6-month financial trend chart (pure SVG) in SharedView
- Dark mode for SharedView (OS detection, localStorage persistence, sun/moon toggle)
- "Send to client" email button in Portfolio cards (mailto: with pre-filled subject/body)

### Quick Wins Implemented (24 June 2026)
- **Logo clickable** — Sidebar logo now navigates to dashboard on click
- **Toast dismiss button** — × button allows immediate dismissal (was auto-dismiss only)
- **Sidebar firm name** — reads `meiq_firm_name` from localStorage; shows initials derived from firm name; syncs in real-time when Settings saves (custom event + storage event)
- **TopBar share includes firm name** — `shareSession()` now appends `?firm=<encoded>` to shared URLs
- **Movements search clear button** — × button appears when search has text
- **execCommand fallback improved** — textarea positioned off-screen before clipboard copy attempt
- **Settings dispatches update event** — `meiq:firm-updated` custom event notifies Sidebar instantly on same-tab save

---

## 5. Prioritised Improvement Roadmap

### Tier 1 — Quick Wins (< 1 day each, high polish impact)

| # | Improvement | File(s) | Notes |
|---|---|---|---|
| 1 | AI commentary — period notes input | Dashboard.jsx, QnaCopilot.jsx | Two-field modal before generation: "Business context" (saved) + "This period's notes" (per-generate). Dramatically improves output quality per Fathom analysis. |
| 2 | Portfolio traffic-light status | Portfolio.jsx | RAG badge per card based on top KPI variance. Red = >20% adverse; Amber = 10–20%; Green = within range. |
| 3 | Better empty states | Dashboard, Copilot, Movements | Replace blank views with contextual prompts and feature illustrations when no data loaded. |
| 4 | Scenario rename support | Scenarios.jsx | Double-click or edit icon on scenario name. |
| 5 | Settings — add data section | Settings.jsx | Show uploaded filename, session ID, "Clear session" button. |
| 6 | Movements category chip | Movements.jsx | Show category as a coloured chip (Revenue/Expenses/Payroll etc.) instead of plain text. |
| 7 | Mobile SharedView touch targets | SharedView.jsx | Increase dot radius and legend tap targets on mobile. |

### Tier 2 — Medium Effort (1–3 days each, significant differentiation)

| # | Improvement | Notes |
|---|---|---|
| 8 | Waterfall/bridge chart | Missing from industry standard. Pure SVG. Show top-N variance drivers as coloured bars. Add to Dashboard and Reports. |
| 9 | Portfolio month-end status | Show "Data: current / overdue" badge per client based on data freshness. The gap no competitor fills. |
| 10 | AI tone presets | Board Pack / Management Review / Client Digest tone selector before generation. Adjust word count, register, and structure accordingly. |
| 11 | CSV upload column mapping | When headers aren't recognised, show a mapping UI (column name → expected field). Auto-suggest based on fuzzy match. |
| 12 | Onboarding checklist | After first upload: floating checklist with "Explore commentary" / "Share with client" / "Add budget data" / "Add another client". |
| 13 | SharedView — forward-looking signal | Traffic light ("Based on trend: revenue next month is projected ↑/→/↓"). Derived from trend data already available. |

### Tier 3 — Strategic (multi-week, high business value)

| # | Improvement | Notes |
|---|---|---|
| 14 | Auth system | Without auth, any session ID is fully public. At minimum: firm-level magic-link login to protect sessions. |
| 15 | Waterfall chart in PDF export | Include waterfall chart in the ReportLab PDF export. Requires SVG-to-PDF conversion or ReportLab Drawing. |
| 16 | Benchmark layer | Aggregate anonymised data from uploads; surface "Your gross margin is X% — typical range for this industry is Y–Z%". |
| 17 | Xero auto-refresh | Current Xero OAuth is one-time pull. Add scheduled sync + "Data last refreshed X hours ago" indicator. |
| 18 | Audio narration | Text-to-speech of key insights on SharedView digest. Syft's differentiator — novel for UK accounting tools. |
| 19 | Pricing tiers | Starter ($49/month, 3 clients) / Practice ($149/month, 20 clients) / Growth ($349/month, 50 clients). AI commentary generates: bundled (100/month) with low-cost overage. |
| 20 | Column reclassification | Allow accounts to be re-categorised by the accountant; persist in session. |

---

## 6. UX/Design Recommendations

### KPI Card Anatomy (Industry Standard — All Competitors Do This)
Each KPI card should show: (1) current value in large bold type, (2) delta vs prior period (coloured +/−%), (3) sparkline trend line (6 months), (4) status colour based on configurable threshold. MonthEndIQ's current KPI tiles are missing the sparkline (except Revenue). Add sparklines to all KPI cards.

### Variance Table
- Colour-code the variance column (green = favourable, red = adverse)
- Add a "% of revenue" column option
- Show a mini bar in the impact column to make magnitude visual

### AI Commentary Structure
Lock output into three fixed paragraphs with headers:
1. **Trading Performance** — what happened (revenue, gross profit, net profit vs prior)
2. **Key Variances** — top 3 drivers, what caused them
3. **Outlook** — forward-looking sentence + recommended actions

Max 350 words. Currently the AI commentary is unstructured free-form which makes it harder to scan.

### Typography Improvements
- Use tabular numbers (`font-variant-numeric: tabular-nums`) on all financial figures in tables
- Hero KPI values should be 28–32px bold; currently some are smaller
- Column alignment: currency amounts right-aligned; percentages right-aligned; account names left-aligned

### Colour
- Current palette is good (navy sidebar, primary blue, green/red for variance)
- Opportunity: switch primary accent to teal (#0D9488) which tests better for "growth/advisory" positioning vs standard blue
- Ensure status colours (favourable/adverse) are colourblind-safe — current green+red is not ideal; add icon differentiation (↑ vs ↓)

---

## 7. Content Improvements

### In-App Copy
- "Month on Month Variance" → should be "Variance Analysis" in nav (covers MoM, QoQ, YTD)
- "Q&A Copilot" → "AI Analyst" (sounds more professional to CFOs and board)
- "Practice Portfolio" → "Client Portfolio" (clearer)
- "Data sources" → "Data & Connections" (more descriptive)
- The topbar subtitle "Upload a P&L to begin" could be more inviting: "Upload your first P&L to get started →"

### PDF Management Pack
- Cover page should include client logo placeholder (image upload in Settings)
- Footer should include date prepared + "Prepared by [Firm Name]" on every page (not just cover)
- Table of contents page for multi-section packs
- Section headers should use the firm's accent colour, not the fixed navy

### Error Messages
- Generic "Could not open client" → "Session expired — please re-upload the client P&L"
- Upload errors should show which row/column is problematic with a suggested fix
- API timeout should say "Analysis is taking longer than expected — please wait" instead of blank state

---

## 8. Technical Debt

| Item | Priority | Notes |
|---|---|---|
| No auth | Critical | Any `/view/{id}` URL exposes full client financial data |
| In-memory sessions | High | Server restart loses all data; add persistent session storage |
| Babel standalone | Medium | No build step is great for iteration but limits optimisation; consider Vite for production |
| PDF generation (ReportLab) | Medium | Currently synchronous; blocks the API thread for large reports; move to background task |
| Z-score anomaly detection | Low | Already guarded against zero stddev; monitor for false positives |
| `document.execCommand` | Low | Deprecated but still functional; clipboard API with fallback already in place |
| No error boundaries on all views | Medium | Only Movements has `ViewErrorBoundary`; add to all views |

---

## 9. Recommended Focus for Next Session

If one session, focus on:

1. **Waterfall chart** (pure SVG, added to Dashboard variance section) — biggest visual impact, maps to industry standard
2. **AI commentary period context input** — two-field modal before generation; dramatically improves output quality
3. **Portfolio traffic light status** — RAG badge on portfolio cards for quick triage
4. **Onboarding checklist** — floating checklist after first upload with key next actions

If two sessions:
- Session 1: Waterfall chart + AI commentary context
- Session 2: Portfolio polish + onboarding + mobile SharedView improvements

---

## 10. Next Session Prompt

> "Continue MonthEndIQ improvement on branch `claude/monthendiq-strategy-review-ofv0vx`. The plan is in `NEXT_STEPS_PLAN.md`. Quick wins from the last session are done (logo clickable, toast dismiss, sidebar firm name, share URL firm name, Movements search clear). 
>
> Implement in this order:
> 1. Waterfall/bridge chart (pure SVG) in Dashboard.jsx — show top variance drivers as coloured horizontal/vertical bars. Use the existing movement data. Add to a new card in the Dashboard below the KPI tiles.
> 2. AI commentary context input — before the 'Generate Commentary' action fires, show a two-field inline form: 'Business context' (saved to localStorage per session) and 'Period notes' (ephemeral per-generate). Pass both fields to the API commentary endpoint as extra context.
> 3. Portfolio traffic-light status — add a RAG badge (red/amber/green) to each portfolio card based on the worst-performing metric.
> 4. Post-upload onboarding checklist — floating card that appears after first upload with 4 actions: View commentary / Share with client / Export PDF / Add another client.
>
> Do not ask questions. Make reasonable product decisions independently."
