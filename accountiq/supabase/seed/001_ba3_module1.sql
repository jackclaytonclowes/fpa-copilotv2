-- ============================================================
-- BA3 Financial Accounting — Module 1: Accounting Principles
-- ============================================================

-- Course
insert into public.courses (id, slug, title, description, cima_paper, color_hex, order_index, is_published)
values (
  'c1000000-0000-0000-0000-000000000001',
  'ba3-financial-accounting',
  'BA3 Financial Accounting',
  'Master the fundamentals of financial accounting: from basic principles to preparing financial statements.',
  'BA3',
  '#0D9488',
  1,
  true
);

-- Module
insert into public.modules (id, course_id, title, description, order_index, is_published)
values (
  'm1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'Accounting Principles',
  'The conceptual framework underlying financial accounting.',
  1,
  true
);

-- ============================================================
-- LESSON 1: The Fundamental Principles
-- ============================================================

insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'l1000000-0000-0000-0000-000000000001',
  'm1000000-0000-0000-0000-000000000001',
  'The Fundamental Principles',
  '[
    {
      "type": "intro",
      "emoji": "📚",
      "heading": "The Fundamental Principles",
      "body": "Financial accounting is built on a set of core principles that ensure financial statements are consistent, reliable, and comparable across businesses. In this lesson we explore the four most important ones."
    },
    {
      "type": "explanation",
      "heading": "1. The Accruals Concept",
      "body": "Income and expenditure are recognised when they are earned or incurred — not when cash is received or paid. This gives a true picture of financial performance for a period.",
      "key_terms": [
        {"term": "Accrual", "definition": "An expense incurred in a period but not yet paid — it is still charged to the income statement."},
        {"term": "Prepayment", "definition": "An expense paid in advance for a future period — it is deferred and carried forward as an asset."}
      ]
    },
    {
      "type": "explanation",
      "heading": "2. The Going Concern Concept",
      "body": "Financial statements are prepared on the assumption that the business will continue to trade for the foreseeable future. If this is not the case, assets must be valued at break-up values rather than historical cost.",
      "key_terms": [
        {"term": "Going concern", "definition": "The assumption that an entity will continue in operation for at least 12 months from the balance sheet date."},
        {"term": "Break-up value", "definition": "The amount assets would realise if the business were forced to close and sell everything immediately."}
      ]
    },
    {
      "type": "explanation",
      "heading": "3. The Consistency Concept",
      "body": "The same accounting methods and policies should be applied from one period to the next. Changing methods makes it impossible to compare results over time. If a change is necessary, it must be disclosed and its effect quantified.",
      "key_terms": [
        {"term": "Accounting policy", "definition": "The specific principles, bases, conventions, rules and practices applied when preparing financial statements."}
      ]
    },
    {
      "type": "explanation",
      "heading": "4. The Prudence Concept",
      "body": "Revenues and profits are only recognised when they are reasonably certain, whilst losses are recognised as soon as they become probable. This prevents the overstatement of profit.",
      "key_terms": [
        {"term": "Prudence", "definition": "A degree of caution when making estimates under uncertainty — do not overstate assets or income, do not understate liabilities or expenses."},
        {"term": "Contingent liability", "definition": "A potential liability that depends on a future uncertain event — disclosed in the notes if probable."}
      ]
    },
    {
      "type": "table",
      "heading": "Summary: The Four Core Principles",
      "headers": ["Principle", "Key Rule", "Impact if Ignored"],
      "rows": [
        ["Accruals", "Match income and expenses to the period", "Distorted profit figures"],
        ["Going Concern", "Assume business will continue trading", "Incorrect asset valuations"],
        ["Consistency", "Use the same methods each period", "Incomparable financial statements"],
        ["Prudence", "Recognise losses early, profits only when certain", "Overstated profits and assets"]
      ]
    }
  ]',
  1,
  10,
  5,
  true
);

-- Questions for Lesson 1
insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
(
  'q1000000-0000-0000-0000-000000000001',
  'l1000000-0000-0000-0000-000000000001',
  'mcq',
  'Under the accruals concept, when is revenue recognised?',
  '["When cash is received from the customer", "When the goods or services are delivered", "When the invoice is raised regardless of delivery", "At the year end only"]',
  '"When the goods or services are delivered"',
  'The accruals concept requires that income is recognised when it is earned — i.e. when performance obligations are met — not when cash changes hands.',
  1
),
(
  'q1000000-0000-0000-0000-000000000002',
  'l1000000-0000-0000-0000-000000000001',
  'mcq',
  'A business is experiencing severe financial difficulties and may have to cease trading within six months. Which accounting concept is most directly threatened?',
  '["Prudence", "Accruals", "Going concern", "Consistency"]',
  '"Going concern"',
  'The going concern concept assumes the business will trade for at least 12 months. If the business cannot continue, assets must be revalued at break-up (liquidation) values.',
  2
),
(
  'q1000000-0000-0000-0000-000000000003',
  'l1000000-0000-0000-0000-000000000001',
  'true_false',
  'Under the prudence concept, a business should record a potential gain as soon as it is possible (not certain) that it will arise.',
  null,
  '"False"',
  'Prudence requires that gains are only recognised when they are virtually certain. Potential gains that are merely possible should not be recorded — only losses that are probable must be recognised early.',
  3
),
(
  'q1000000-0000-0000-0000-000000000004',
  'l1000000-0000-0000-0000-000000000001',
  'mcq',
  'Dragonfly Ltd changed its depreciation method from straight-line to reducing balance without disclosure. Which accounting principle has been violated?',
  '["Going concern", "Consistency", "Accruals", "Prudence"]',
  '"Consistency"',
  'The consistency principle requires that the same accounting methods are used from one period to the next. Any change must be disclosed, with the reason and the quantified effect on reported figures.',
  4
);

-- ============================================================
-- LESSON 2: The Accruals Concept in Practice
-- ============================================================

insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'l1000000-0000-0000-0000-000000000002',
  'm1000000-0000-0000-0000-000000000001',
  'The Accruals Concept in Practice',
  '[
    {
      "type": "intro",
      "emoji": "🔢",
      "heading": "Accruals in Practice",
      "body": "Understanding the accruals concept in theory is only the first step. The real skill is making the adjustments in financial statements. Let us work through the key scenarios."
    },
    {
      "type": "explanation",
      "heading": "Accrued Expenses",
      "body": "An accrued expense is an expense that has been incurred during the year but has not yet been paid or invoiced by the year end. It must still appear in the income statement for the current year.",
      "key_terms": [
        {"term": "Accrued expense", "definition": "Also called an ''accrual'': a liability for goods or services received but not yet paid for."},
        {"term": "Double entry", "definition": "Debit the expense account (increases the charge in the income statement); Credit accruals/payables (creates the liability on the balance sheet)."}
      ]
    },
    {
      "type": "worked_example",
      "heading": "Worked Example: Electricity Accrual",
      "steps": [
        "Maple Ltd''s year end is 31 December 2024. Electricity bills are received quarterly.",
        "The last bill received covered the period 1 August – 31 October 2024 and cost £1,200.",
        "No bill has been received for November and December 2024.",
        "Step 1 — Estimate the outstanding expense: £1,200 ÷ 3 months × 2 months = £800",
        "Step 2 — Journal entry at 31 December 2024: Dr Electricity expense £800 | Cr Accruals (current liability) £800",
        "Step 3 — The income statement shows the full annual electricity charge including the £800 accrual.",
        "Step 4 — When the next bill arrives in January 2025 (say £1,230), the accrual is reversed and the difference goes to the following year''s income statement."
      ]
    },
    {
      "type": "explanation",
      "heading": "Prepaid Expenses",
      "body": "A prepayment arises when a business pays for something in advance that relates to a future accounting period. The portion relating to the future period must be deducted from expenses and carried forward as a current asset.",
      "key_terms": [
        {"term": "Prepayment", "definition": "An expense paid in the current period that relates wholly or partly to a future period — shown as a current asset."},
        {"term": "Double entry for prepayment", "definition": "Debit Prepayments (current asset); Credit the relevant expense account (reduces this period''s charge)."}
      ]
    },
    {
      "type": "worked_example",
      "heading": "Worked Example: Insurance Prepayment",
      "steps": [
        "Cedar Ltd pays £3,600 for annual insurance on 1 October 2024. Its year end is 31 December 2024.",
        "The policy covers 12 months: 1 October 2024 – 30 September 2025.",
        "Step 1 — Identify how many months relate to 2024: October, November, December = 3 months.",
        "Step 2 — Expense for 2024: £3,600 × 3/12 = £900",
        "Step 3 — Prepayment carried forward: £3,600 × 9/12 = £2,700",
        "Step 4 — Journal: Dr Insurance expense £900 | Dr Prepayments £2,700 | Cr Bank £3,600",
        "Result: Income statement shows only £900; balance sheet shows £2,700 prepayment under current assets."
      ]
    }
  ]',
  2,
  15,
  6,
  true
);

-- Questions for Lesson 2
insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
(
  'q2000000-0000-0000-0000-000000000001',
  'l1000000-0000-0000-0000-000000000002',
  'mcq',
  'Birch Ltd''s year end is 31 March 2024. It pays £4,800 rent on 1 January 2024 covering 12 months. What amount appears as a prepayment at 31 March 2024?',
  '["£1,200", "£3,600", "£4,800", "£400"]',
  '"£3,600"',
  'Only 3 months of the policy fall in the year ended 31 March 2024 (January, February, March). The remaining 9 months (April–December 2024) are prepaid: £4,800 × 9/12 = £3,600.',
  1
),
(
  'q2000000-0000-0000-0000-000000000002',
  'l1000000-0000-0000-0000-000000000002',
  'mcq',
  'Which account is CREDITED when recording an accrued expense at the year end?',
  '["The bank account", "The expense account in the income statement", "Accruals (current liability) in the balance sheet", "Share capital"]',
  '"Accruals (current liability) in the balance sheet"',
  'Recording an accrual creates a liability. The double entry is: Dr Expense (income statement) | Cr Accruals/Payables (balance sheet). The bank is not touched because no cash has yet been paid.',
  2
),
(
  'q2000000-0000-0000-0000-000000000003',
  'l1000000-0000-0000-0000-000000000002',
  'mcq',
  'Maple Ltd estimates electricity used but not yet billed at £800 at its 31 December year end. How does this appear in the financial statements?',
  '["£800 expense only in next year''s income statement", "£800 added to this year''s expenses; £800 current liability in the balance sheet", "£800 deducted from this year''s expenses; £800 current asset", "No entry needed until the bill arrives"]',
  '"£800 added to this year''s expenses; £800 current liability in the balance sheet"',
  'The accrual increases the current year expense (Dr Electricity expense) and creates a current liability (Cr Accruals) because the service has been received but not yet paid.',
  3
),
(
  'q2000000-0000-0000-0000-000000000004',
  'l1000000-0000-0000-0000-000000000002',
  'true_false',
  'A prepayment is classified as a current asset on the balance sheet.',
  null,
  '"True"',
  'A prepayment represents an economic benefit (the right to receive goods/services) in the near future, so it meets the definition of an asset. It is current because it will be consumed within 12 months.',
  4
);

-- ============================================================
-- LESSON 3: Materiality and Prudence
-- ============================================================

insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'l1000000-0000-0000-0000-000000000003',
  'm1000000-0000-0000-0000-000000000001',
  'Materiality and Prudence',
  '[
    {
      "type": "intro",
      "emoji": "⚖️",
      "heading": "Materiality and Prudence",
      "body": "Two concepts that every accountant must apply every day: materiality tells us what to bother accounting for carefully, and prudence tells us how cautious to be when making judgements."
    },
    {
      "type": "explanation",
      "heading": "What is Materiality?",
      "body": "Information is material if its omission or misstatement could influence the economic decisions of users of the financial statements. There is no fixed percentage — it depends on the size and nature of the item relative to the business.",
      "key_terms": [
        {"term": "Material item", "definition": "An item significant enough that a reasonable user of financial statements would be affected by its inclusion or omission."},
        {"term": "Immaterial item", "definition": "An item so small that accounting for it precisely would not change any decision — a simpler treatment is acceptable."}
      ]
    },
    {
      "type": "worked_example",
      "heading": "Materiality in Action",
      "steps": [
        "Example 1 — A FTSE 100 company buys a £15 stapler. Writing this off immediately as an expense (rather than capitalising and depreciating it) is clearly acceptable — it is immaterial.",
        "Example 2 — A sole trader with annual turnover of £80,000 has a debtor balance of £5,000 that may be irrecoverable. This IS material (6.25% of turnover) and must be provided for under prudence.",
        "Example 3 — The same £5,000 bad debt at a company with £50 million turnover (0.01%) may be immaterial and a simplified treatment may be acceptable.",
        "Key insight: materiality is always relative to the size of the business and the nature of the item."
      ]
    },
    {
      "type": "explanation",
      "heading": "Prudence: Practical Application",
      "body": "Prudence does not mean being deliberately conservative to the point of creating hidden reserves — that is no longer acceptable under IFRS. It means making unbiased estimates and not overstating assets/income or understating liabilities/expenses.",
      "key_terms": [
        {"term": "Provision for doubtful debts", "definition": "An estimate of the amount of trade receivables that may not be collected — reduces the asset on the balance sheet and is charged to the income statement."},
        {"term": "Lower of cost or NRV", "definition": "Inventories must be valued at the lower of cost and net realisable value (prudence principle) — if NRV < cost, write down to NRV."}
      ]
    },
    {
      "type": "worked_example",
      "heading": "Worked Example: Inventory Write-Down",
      "steps": [
        "Ash Ltd holds 200 units of Product Z in inventory at a cost of £10 each.",
        "Due to a new competitor entering the market, the estimated selling price has fallen to £8 per unit.",
        "Selling costs per unit are £1.",
        "Step 1 — Calculate Net Realisable Value (NRV): £8 selling price − £1 selling costs = £7 NRV per unit.",
        "Step 2 — Compare cost vs NRV: Cost £10 > NRV £7, so write down to NRV.",
        "Step 3 — Write-down per unit: £10 − £7 = £3. Total write-down: 200 × £3 = £600.",
        "Step 4 — Journal: Dr Cost of sales (or Inventory write-down) £600 | Cr Inventory £600.",
        "Result: Inventory shown at 200 × £7 = £1,400 on the balance sheet (not £2,000)."
      ]
    },
    {
      "type": "table",
      "heading": "Materiality vs Prudence — Key Differences",
      "headers": ["Concept", "Question It Answers", "Example Application"],
      "rows": [
        ["Materiality", "Is this item significant enough to account for carefully?", "Expensing a £10 pen immediately rather than capitalising it"],
        ["Prudence", "How cautious should I be in my estimate?", "Writing inventory down to NRV when below cost"],
        ["Both together", "Is this potential loss significant and probable?", "Creating a provision for a £50,000 legal claim"]
      ]
    }
  ]',
  3,
  15,
  6,
  true
);

-- Questions for Lesson 3
insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
(
  'q3000000-0000-0000-0000-000000000001',
  'l1000000-0000-0000-0000-000000000003',
  'mcq',
  'Ash Ltd holds inventory that cost £10 per unit. The selling price is now £8 and selling costs are £0.50 per unit. At what value should the inventory be shown in the balance sheet?',
  '["£10.00 — at historical cost", "£8.00 — at current selling price", "£7.50 — at net realisable value", "£8.50 — at selling price less half of selling costs"]',
  '"£7.50 — at net realisable value"',
  'NRV = selling price − selling costs = £8.00 − £0.50 = £7.50. Since NRV (£7.50) < cost (£10.00), the prudence concept requires inventory to be written down to £7.50 per unit.',
  1
),
(
  'q3000000-0000-0000-0000-000000000002',
  'l1000000-0000-0000-0000-000000000003',
  'mcq',
  'Which of the following best describes a material item in financial accounting?',
  '["Any item over £1,000 in value", "Any item that appears on the balance sheet", "An item whose omission or misstatement could influence users'' economic decisions", "An item that relates to non-current assets only"]',
  '"An item whose omission or misstatement could influence users'' economic decisions"',
  'Materiality is defined by whether the item would change the decisions of a user of financial statements — there is no fixed monetary threshold; it depends on context and the size of the business.',
  2
),
(
  'q3000000-0000-0000-0000-000000000003',
  'l1000000-0000-0000-0000-000000000003',
  'true_false',
  'Under modern IFRS, deliberately understating profits to create hidden reserves is consistent with the prudence concept.',
  null,
  '"False"',
  'Modern prudence (per the IASB Conceptual Framework) requires neutrality — estimates should be unbiased. Deliberately understating income or overstating expenses to create hidden reserves is not permitted and distorts the faithful representation of financial position.',
  3
),
(
  'q3000000-0000-0000-0000-000000000004',
  'l1000000-0000-0000-0000-000000000003',
  'mcq',
  'Oak Ltd has annual revenue of £2 million. A legal claim for £3,000 has been brought against the company. The legal team believes it is probable the company will lose. What treatment is MOST appropriate?',
  '["Disclose in the notes only — the amount is immaterial", "Create a provision of £3,000 in the financial statements", "Ignore — legal claims are never recognised until settled", "Reduce revenue by £3,000"]',
  '"Create a provision of £3,000 in the financial statements"',
  'A probable outflow of economic benefits meets the IAS 37 criteria for a provision. Even if the amount may be considered small (0.15% of revenue), the prudence concept and IAS 37 require recognition once the outflow is probable and can be reliably estimated.',
  4
);

-- ============================================================
-- SEED ACHIEVEMENTS
-- ============================================================

insert into public.achievements (id, slug, title, description, icon, trigger_type, trigger_value)
values
(
  'a1000000-0000-0000-0000-000000000001',
  'first_step',
  'First Step',
  'Complete your first lesson',
  '🎯',
  'lessons_completed',
  '{"count": 1}'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'seven_day_scholar',
  'Seven-Day Scholar',
  'Maintain a 7-day learning streak',
  '🔥',
  'streak_days',
  '{"days": 7}'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'module_master',
  'Module Master',
  'Complete all lessons in a module',
  '🏆',
  'lessons_completed',
  '{"count": 3}'
);
