-- ============================================================
-- BA2 Fundamentals of Management Accounting
-- ============================================================

insert into public.courses (id, slug, title, description, cima_paper, color_hex, order_index, is_published)
values (
  'ba200000-0000-0000-0000-000000000000',
  'ba2-management-accounting',
  'BA2 Management Accounting',
  'Master cost classification, CVP analysis, budgeting, variance analysis, and investment appraisal for the CIMA Certificate.',
  'BA2',
  '#7C3AED',
  2,
  true
);

-- ============================================================
-- MODULE 1: Cost Classification and Behaviour
-- ============================================================

insert into public.modules (id, course_id, title, description, order_index, is_published)
values (
  'ba200000-0001-0000-0000-000000000000',
  'ba200000-0000-0000-0000-000000000000',
  'Cost Classification and Behaviour',
  'Understand how costs are classified and how they behave as activity levels change.',
  1, true
);

-- LESSON 1.1: Cost Classification
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0001-0001-0000-000000000000',
  'ba200000-0001-0000-0000-000000000000',
  'Understanding Cost Classification',
  $$[
    {"type":"intro","emoji":"📦","heading":"Understanding Cost Classification","body":"Before we can control or reduce costs, we need to understand how to classify them. Management accountants use different classification bases depending on whether the purpose is product costing, decision making, or performance control."},
    {"type":"explanation","heading":"Direct vs Indirect Costs","body":"Direct costs can be traced specifically to a unit of output. Indirect costs (overheads) cannot be traced to any single unit and must be shared across all output using an allocation basis.","key_terms":[{"term":"Direct cost","definition":"A cost traceable exclusively to a specific unit of output. Examples: direct materials, direct labour, royalties per unit."},{"term":"Indirect cost (overhead)","definition":"A cost that cannot be traced to a single unit of output. Must be allocated or apportioned. Examples: factory rent, supervisor wages, machine depreciation."},{"term":"Prime cost","definition":"The total of all direct costs: Direct materials + Direct labour + Direct expenses."}]},
    {"type":"explanation","heading":"Product Costs vs Period Costs","body":"Product costs are attached to units and remain in inventory until the goods are sold — they are matched against revenue on the income statement when the sale occurs. Period costs are written off to the income statement in the period they arise, regardless of production volume.","key_terms":[{"term":"Product cost","definition":"A cost forming part of the inventory value. Under absorption costing, includes both variable and fixed production overheads."},{"term":"Period cost","definition":"Charged directly to the income statement in the period incurred. Includes all selling, distribution, and administration costs."}]},
    {"type":"table","heading":"Cost Classification Summary","headers":["Basis","Categories","Example"],"rows":[["Traceability","Direct / Indirect","Direct: timber in a chair. Indirect: factory insurance."],["Function","Production / Non-production","Production: assembly wages. Non-production: sales team salary."],["Behaviour","Fixed / Variable / Semi-variable","Fixed: rent. Variable: raw materials. Semi-variable: electricity."],["Timing","Product / Period","Product: manufacturing labour. Period: advertising."]]}
  ]$$,
  1, 10, 5, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0001-0001-0000-000000000001','ba200000-0001-0001-0000-000000000000','mcq',
  'Which of the following is a DIRECT cost for a furniture manufacturer?',
  '["Factory rent","Wood used to make chairs","Factory supervisor salary","Machine depreciation"]',
  '"Wood used to make chairs"',
  'Wood can be directly and exclusively traced to each chair produced, making it a direct material. Rent, supervisor salaries, and depreciation cannot be traced to a single unit — they are indirect costs (overheads).',1),
('ba200000-0001-0001-0000-000000000002','ba200000-0001-0001-0000-000000000000','mcq',
  'Prime cost equals:',
  '["All production costs including overheads","The total of all direct costs","Variable production costs only","Direct materials plus direct labour only"]',
  '"The total of all direct costs"',
  'Prime cost = Direct materials + Direct labour + Direct expenses. It covers all directly traceable costs and excludes indirect costs (overheads).',2),
('ba200000-0001-0001-0000-000000000003','ba200000-0001-0001-0000-000000000000','true_false',
  'Advertising expenditure is an example of a product cost.',
  null,'"False"',
  'Advertising is a period cost — expensed in the income statement in the period it is incurred. Product costs relate only to production and are held in inventory until the product is sold.',3),
('ba200000-0001-0001-0000-000000000004','ba200000-0001-0001-0000-000000000000','mcq',
  'A factory manager salary is best classified as:',
  '["A direct cost","A variable cost","An indirect production overhead","A period cost"]',
  '"An indirect production overhead"',
  'A factory manager salary cannot be traced to individual units of output so it is an indirect (overhead) cost. Because it relates to the production function, it is a production overhead and therefore a product cost under absorption costing.',4);

-- LESSON 1.2: Cost Behaviour and High-Low Method
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0001-0002-0000-000000000000',
  'ba200000-0001-0000-0000-000000000000',
  'Cost Behaviour and the High-Low Method',
  $$[
    {"type":"intro","emoji":"📈","heading":"How Costs Behave","body":"Understanding how costs change as output changes is fundamental to budgeting, pricing, and decision making. The three key behaviour patterns are fixed, variable, and semi-variable."},
    {"type":"explanation","heading":"Fixed, Variable, and Semi-Variable Costs","body":"Cost behaviour describes how total cost changes as the level of activity changes. Most costs fall into one of three patterns.","key_terms":[{"term":"Fixed cost","definition":"Total cost remains constant regardless of activity level within the relevant range. Cost per unit falls as output rises. Example: factory rent £10,000/month whether 1,000 or 5,000 units are produced."},{"term":"Variable cost","definition":"Total cost changes in direct proportion to activity. Cost per unit remains constant. Example: direct materials at £5 per unit."},{"term":"Semi-variable (mixed) cost","definition":"Contains both a fixed element and a variable element. Example: electricity bill with a standing charge plus a per-unit usage rate."},{"term":"Relevant range","definition":"The range of activity over which cost behaviour assumptions hold. Outside this range, costs may step up or change behaviour."}]},
    {"type":"worked_example","heading":"The High-Low Method","steps":["The high-low method separates the fixed and variable elements of a semi-variable cost using two data points: the highest and lowest activity levels.","Step 1 — Identify the high and low output levels and their total costs. Example: High: 8,000 units, total cost £46,000. Low: 4,000 units, total cost £30,000.","Step 2 — Calculate variable cost per unit: (High cost − Low cost) ÷ (High units − Low units) = (£46,000 − £30,000) ÷ (8,000 − 4,000) = £16,000 ÷ 4,000 = £4 per unit","Step 3 — Calculate fixed cost by substituting into either data point: Total cost = Fixed cost + (Variable cost per unit × Units). Using the high point: £46,000 = Fixed cost + (£4 × 8,000) → Fixed cost = £46,000 − £32,000 = £14,000","Step 4 — The cost equation is: Total cost = £14,000 + £4 per unit. This can now be used to predict costs at any activity level within the relevant range."]},
    {"type":"table","heading":"Cost Behaviour Summary","headers":["Type","Total cost as output rises","Cost per unit as output rises","Example"],"rows":[["Fixed","Stays constant","Falls","Factory rent"],["Variable","Rises proportionally","Stays constant","Raw materials"],["Semi-variable","Rises (but not proportionally)","Falls","Electricity bill"]]}
  ]$$,
  2, 10, 6, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0001-0002-0000-000000000001','ba200000-0001-0002-0000-000000000000','mcq',
  'The high-low method is used to:',
  '["Calculate the break-even point","Separate fixed and variable elements of a semi-variable cost","Apportion overheads between departments","Value closing inventory"]',
  '"Separate fixed and variable elements of a semi-variable cost"',
  'The high-low method takes the highest and lowest activity data points and uses the difference in cost divided by the difference in units to calculate the variable cost per unit. The fixed element is then found by substitution.',1),
('ba200000-0001-0002-0000-000000000002','ba200000-0001-0002-0000-000000000000','mcq',
  'At 5,000 units total cost is £32,000; at 9,000 units total cost is £48,000. What is the variable cost per unit?',
  '["£4.00","£3.00","£5.33","£2.00"]',
  '"£4.00"',
  'Variable cost per unit = (£48,000 − £32,000) ÷ (9,000 − 5,000) = £16,000 ÷ 4,000 = £4.00 per unit. The fixed cost = £48,000 − (£4 × 9,000) = £12,000.',2),
('ba200000-0001-0002-0000-000000000003','ba200000-0001-0002-0000-000000000000','true_false',
  'Fixed costs per unit remain constant as output increases.',
  null,'"False"',
  'Total fixed costs remain constant, but fixed cost per unit falls as output increases (the fixed cost is spread over more units). Variable cost per unit is the one that stays constant.',3),
('ba200000-0001-0002-0000-000000000004','ba200000-0001-0002-0000-000000000000','mcq',
  'A telephone bill with a monthly line rental plus a charge per call is an example of:',
  '["A fixed cost","A variable cost","A stepped cost","A semi-variable cost"]',
  '"A semi-variable cost"',
  'A semi-variable (mixed) cost has both a fixed element (line rental — incurred regardless of calls made) and a variable element (per-call charge that increases with usage).',4);

-- LESSON 1.3: Marginal vs Absorption Costing
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0001-0003-0000-000000000000',
  'ba200000-0001-0000-0000-000000000000',
  'Marginal vs Absorption Costing',
  $$[
    {"type":"intro","emoji":"⚖️","heading":"Two Costing Approaches","body":"Marginal costing and absorption costing are two different methods of valuing inventory and calculating profit. They give different profit figures when inventory levels change, which is a common exam topic."},
    {"type":"explanation","heading":"Marginal Costing","body":"Under marginal costing, only variable production costs are included in the product cost. Fixed production overheads are treated as a period cost and written off in full in the period they are incurred. This highlights the contribution each unit makes.","key_terms":[{"term":"Marginal cost","definition":"The additional cost of producing one extra unit — in practice, this equals variable production cost per unit."},{"term":"Contribution","definition":"Selling price minus variable cost (= marginal cost). Contribution goes first towards covering fixed costs, then generates profit. Formula: Contribution = Revenue − Variable costs."},{"term":"Marginal costing profit","definition":"Contribution minus total fixed costs for the period. Fixed overheads are never included in inventory valuation."}]},
    {"type":"explanation","heading":"Absorption Costing","body":"Under absorption costing, both variable and fixed production overheads are included in the product cost. Fixed overheads are absorbed into units using an overhead absorption rate (OAR). This method is required by IAS 2 for external financial reporting.","key_terms":[{"term":"Overhead Absorption Rate (OAR)","definition":"The rate used to charge fixed overheads to units: OAR = Budgeted fixed overheads ÷ Budgeted activity level (e.g., per unit, per labour hour)."},{"term":"Over/under absorption","definition":"If actual activity differs from budgeted, overheads will be over-absorbed (too much charged, credit to P&L) or under-absorbed (too little charged, debit to P&L)."}]},
    {"type":"worked_example","heading":"Reconciling Marginal and Absorption Profits","steps":["When inventory levels change between periods, marginal and absorption costing give different profit figures.","Key rule: Absorption profit is HIGHER than marginal profit when inventory INCREASES (fixed overheads are carried forward in closing inventory). Absorption profit is LOWER when inventory DECREASES.","Reconciliation formula: Absorption profit = Marginal profit + (Closing inventory − Opening inventory) × Fixed overhead per unit","Example: Fixed overhead per unit = £3. Inventory increased by 200 units. Absorption profit = Marginal profit + (200 × £3) = Marginal profit + £600.","When inventory levels are unchanged, both methods give identical profit figures."]}
  ]$$,
  3, 15, 7, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0001-0003-0000-000000000001','ba200000-0001-0003-0000-000000000000','mcq',
  'Under marginal costing, fixed production overheads are:',
  '["Included in closing inventory valuation","Absorbed into units using an OAR","Written off as a period cost in full","Apportioned to cost centres only"]',
  '"Written off as a period cost in full"',
  'Under marginal costing, fixed production overheads are treated as period costs — they are charged in full to the income statement in the period they arise and are never included in inventory values.',1),
('ba200000-0001-0003-0000-000000000002','ba200000-0001-0003-0000-000000000000','mcq',
  'If production exceeds sales in a period, which costing method reports a HIGHER profit?',
  '["Marginal costing","Absorption costing","Both methods give the same profit","It depends on the overhead absorption rate"]',
  '"Absorption costing"',
  'When production exceeds sales, closing inventory increases. Under absorption costing, fixed overheads are carried forward in closing inventory, reducing the charge to the income statement. Marginal costing charges all fixed overheads immediately, giving lower profit.',2),
('ba200000-0001-0003-0000-000000000003','ba200000-0001-0003-0000-000000000000','true_false',
  'Contribution equals selling price minus variable costs.',
  null,'"True"',
  'Contribution = Selling price − Variable costs. It represents the amount each unit contributes towards covering fixed costs and generating profit. It is the key metric in marginal costing.',3),
('ba200000-0001-0003-0000-000000000004','ba200000-0001-0003-0000-000000000000','mcq',
  'The Overhead Absorption Rate (OAR) is calculated as:',
  '["Actual overheads divided by actual activity","Budgeted overheads divided by budgeted activity","Actual overheads divided by budgeted activity","Budgeted overheads divided by actual activity"]',
  '"Budgeted overheads divided by budgeted activity"',
  'OAR = Budgeted fixed overheads ÷ Budgeted activity level. It is set in advance using budgeted (not actual) figures. This means over- or under-absorption arises when actuals differ from budget.',4);

-- ============================================================
-- MODULE 2: Breakeven and CVP Analysis
-- ============================================================

insert into public.modules (id, course_id, title, description, order_index, is_published)
values (
  'ba200000-0002-0000-0000-000000000000',
  'ba200000-0000-0000-0000-000000000000',
  'Breakeven and CVP Analysis',
  'Use contribution, breakeven analysis, and limiting factor techniques to support business decisions.',
  2, true
);

-- LESSON 2.1: Contribution and Breakeven
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0002-0001-0000-000000000000',
  'ba200000-0002-0000-0000-000000000000',
  'Contribution, Breakeven and Margin of Safety',
  $$[
    {"type":"intro","emoji":"⚖️","heading":"CVP Analysis","body":"Cost-Volume-Profit (CVP) analysis examines the relationship between costs, volume and profit. The breakeven point is where total revenue equals total costs — neither profit nor loss is made. These techniques underpin many business decisions."},
    {"type":"explanation","heading":"Contribution and the C/S Ratio","body":"Contribution is the foundation of CVP analysis. Once fixed costs are covered by total contribution, each additional unit of contribution becomes profit.","key_terms":[{"term":"Contribution per unit","definition":"Selling price per unit minus variable cost per unit. Shows how much each unit sold contributes towards fixed costs and profit."},{"term":"Contribution to Sales ratio (C/S ratio)","definition":"Contribution per unit ÷ Selling price per unit × 100%. Shows the proportion of each £ of revenue that is contribution. Also called the Profit-Volume (P/V) ratio."},{"term":"Total contribution","definition":"Contribution per unit × Number of units sold. When total contribution exceeds fixed costs, the business is in profit."}]},
    {"type":"worked_example","heading":"Breakeven and Margin of Safety Calculation","steps":["Given: Selling price £50 per unit. Variable cost £30 per unit. Fixed costs £80,000 per period.","Step 1 — Contribution per unit: £50 − £30 = £20 per unit","Step 2 — C/S ratio: £20 ÷ £50 = 0.40 (40%)","Step 3 — Breakeven point in UNITS: Fixed costs ÷ Contribution per unit = £80,000 ÷ £20 = 4,000 units","Step 4 — Breakeven point in REVENUE: Fixed costs ÷ C/S ratio = £80,000 ÷ 0.40 = £200,000","Step 5 — If budgeted sales are 5,500 units: Margin of safety (units) = 5,500 − 4,000 = 1,500 units. Margin of safety % = 1,500 ÷ 5,500 × 100 = 27.3%","Step 6 — Target profit of £40,000: Required units = (Fixed costs + Target profit) ÷ Contribution per unit = (£80,000 + £40,000) ÷ £20 = 6,000 units"]},
    {"type":"table","heading":"CVP Formula Sheet","headers":["Measure","Formula"],"rows":[["Contribution per unit","Selling price − Variable cost per unit"],["C/S ratio","Contribution per unit ÷ Selling price"],["Breakeven (units)","Fixed costs ÷ Contribution per unit"],["Breakeven (revenue)","Fixed costs ÷ C/S ratio"],["Margin of safety (units)","Budgeted sales − Breakeven sales"],["Margin of safety (%)","Margin of safety ÷ Budgeted sales × 100"],["Target profit (units)","(Fixed costs + Target profit) ÷ Contribution per unit"]]}
  ]$$,
  1, 15, 7, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0002-0001-0000-000000000001','ba200000-0002-0001-0000-000000000000','mcq',
  'Selling price is £40, variable cost is £24. Fixed costs are £64,000. What is the breakeven point in units?',
  '["1,600 units","4,000 units","2,667 units","8,000 units"]',
  '"4,000 units"',
  'Contribution per unit = £40 − £24 = £16. Breakeven point = Fixed costs ÷ Contribution per unit = £64,000 ÷ £16 = 4,000 units.',1),
('ba200000-0002-0001-0000-000000000002','ba200000-0002-0001-0000-000000000000','mcq',
  'Budgeted sales are 6,000 units and the breakeven point is 4,500 units. What is the margin of safety as a percentage?',
  '["25%","33%","75%","15%"]',
  '"25%"',
  'Margin of safety = 6,000 − 4,500 = 1,500 units. As a percentage: 1,500 ÷ 6,000 × 100 = 25%. This means sales can fall by 25% before the business makes a loss.',2),
('ba200000-0002-0001-0000-000000000003','ba200000-0002-0001-0000-000000000000','true_false',
  'The C/S ratio equals contribution per unit divided by selling price per unit.',
  null,'"True"',
  'C/S (contribution to sales) ratio = Contribution per unit ÷ Selling price per unit. It shows what proportion of each pound of revenue is contribution. It is also used to calculate breakeven revenue: Fixed costs ÷ C/S ratio.',3),
('ba200000-0002-0001-0000-000000000004','ba200000-0002-0001-0000-000000000000','mcq',
  'Fixed costs are £50,000. Contribution per unit is £10. What level of sales is needed to achieve a target profit of £20,000?',
  '["2,000 units","5,000 units","7,000 units","3,000 units"]',
  '"7,000 units"',
  'Required sales = (Fixed costs + Target profit) ÷ Contribution per unit = (£50,000 + £20,000) ÷ £10 = £70,000 ÷ £10 = 7,000 units.',4);

-- LESSON 2.2: Limiting Factor Analysis
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0002-0002-0000-000000000000',
  'ba200000-0002-0000-0000-000000000000',
  'Limiting Factor Analysis',
  $$[
    {"type":"intro","emoji":"🔑","heading":"Scarce Resource Decisions","body":"When a business faces a resource that is in short supply (a limiting factor), it must decide how to allocate that resource to maximise profit. The key principle: rank products by contribution per unit of the limiting factor, not contribution per unit alone."},
    {"type":"explanation","heading":"Identifying and Ranking with a Limiting Factor","body":"A limiting factor (also called a key factor or principal budget factor) is a resource that constrains output. Common examples are machine hours, direct labour hours, raw material availability, and sales demand.","key_terms":[{"term":"Limiting factor","definition":"A resource that is in short supply and prevents a business from achieving its maximum output or sales. It is the binding constraint on production."},{"term":"Contribution per unit of limiting factor","definition":"Contribution per unit ÷ Units of limiting factor required per unit of product. This is the ranking criterion when allocating a scarce resource."},{"term":"Optimal production plan","definition":"The product mix that maximises total contribution given the binding constraint. Produced by ranking products and allocating the scarce resource in rank order until it is exhausted."}]},
    {"type":"worked_example","heading":"Worked Example: Allocating Machine Hours","steps":["A company makes two products, X and Y. Machine hours are limited to 3,000 per period.","Product X: Contribution £18, requires 3 machine hours. Contribution per machine hour = £18 ÷ 3 = £6.","Product Y: Contribution £20, requires 5 machine hours. Contribution per machine hour = £20 ÷ 5 = £4.","Ranking: Product X (£6/hr) ranked 1st, Product Y (£4/hr) ranked 2nd.","Optimal plan: Maximum demand for X = 500 units, using 500 × 3 = 1,500 hours. Remaining hours = 3,000 − 1,500 = 1,500 hours. Y produced = 1,500 ÷ 5 = 300 units.","Total contribution = (500 × £18) + (300 × £20) = £9,000 + £6,000 = £15,000.","Note: If ranked by contribution per unit alone, Y (£20) would appear preferable — but this ignores the scarce resource and gives the wrong answer."]},
    {"type":"explanation","heading":"Shadow Prices","body":"A shadow price (also called an opportunity cost or dual price) is the increase in contribution that would result from obtaining one additional unit of the limiting factor. It represents the maximum premium a business should pay above the normal price to obtain extra units of the scarce resource.","key_terms":[{"term":"Shadow price","definition":"The additional contribution earned from obtaining one extra unit of the limiting factor. Also the maximum extra amount worth paying per unit of the scarce resource above its normal cost."}]}
  ]$$,
  2, 15, 7, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0002-0002-0000-000000000001','ba200000-0002-0002-0000-000000000000','mcq',
  'When allocating a scarce resource between products, the correct ranking criterion is:',
  '["Highest selling price per unit","Highest contribution per unit","Highest contribution per unit of limiting factor","Highest gross profit margin"]',
  '"Highest contribution per unit of limiting factor"',
  'When a resource is scarce, the aim is to maximise contribution per unit of that resource (e.g., per machine hour or per kg of material). Ranking by contribution per unit alone ignores how much of the scarce resource each product uses.',1),
('ba200000-0002-0002-0000-000000000002','ba200000-0002-0002-0000-000000000000','mcq',
  'Product A has contribution of £12 and uses 4 labour hours. Product B has contribution of £15 and uses 6 labour hours. Which product should be prioritised?',
  '["Product A, because it has the higher contribution per labour hour","Product B, because it has the higher contribution per unit","Both products are equally ranked","Product B, because it uses more labour hours"]',
  '"Product A, because it has the higher contribution per labour hour"',
  'Product A: £12 ÷ 4 hours = £3 per labour hour. Product B: £15 ÷ 6 hours = £2.50 per labour hour. Product A generates more contribution per unit of the scarce resource, so it should be prioritised.',2),
('ba200000-0002-0002-0000-000000000003','ba200000-0002-0002-0000-000000000000','true_false',
  'The shadow price of a limiting factor is the maximum extra amount a business should pay to obtain one additional unit of that resource.',
  null,'"True"',
  'The shadow price equals the additional contribution earned from one more unit of the scarce resource. It is therefore the maximum premium above normal cost that is worth paying — paying more than this would reduce overall contribution.',3),
('ba200000-0002-0002-0000-000000000004','ba200000-0002-0002-0000-000000000000','mcq',
  'A limiting factor analysis is needed when:',
  '["A company has unlimited resources","One resource cannot meet total demand for all products","Fixed costs exceed contribution","Sales demand exceeds budgeted output"]',
  '"One resource cannot meet total demand for all products"',
  'Limiting factor analysis applies when the supply of a resource (materials, labour hours, machine capacity) is insufficient to meet the combined demand for all products. The business must decide the optimal production mix to maximise contribution.',4);

-- ============================================================
-- MODULE 3: Budgeting and Variance Analysis
-- ============================================================

insert into public.modules (id, course_id, title, description, order_index, is_published)
values (
  'ba200000-0003-0000-0000-000000000000',
  'ba200000-0000-0000-0000-000000000000',
  'Budgeting and Variance Analysis',
  'Prepare flexible budgets, calculate variances, and understand standard costing.',
  3, true
);

-- LESSON 3.1: Budgeting Purposes and Types
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0003-0001-0000-000000000000',
  'ba200000-0003-0000-0000-000000000000',
  'Budgeting: Purposes and Types',
  $$[
    {"type":"intro","emoji":"📋","heading":"Why Budget?","body":"A budget is a quantified plan expressed in financial terms, usually covering one year. It is a fundamental management accounting tool used for planning, control, communication, and motivation."},
    {"type":"explanation","heading":"The Four Purposes of Budgeting","body":"Budgets serve multiple purposes simultaneously. Understanding these purposes helps explain why different organisations approach budgeting differently.","key_terms":[{"term":"Planning","definition":"Forces managers to think ahead and set targets for the future. Ensures resources are available to meet objectives."},{"term":"Control","definition":"Actual results are compared against the budget to identify variances. Corrective action can then be taken."},{"term":"Coordination","definition":"Ensures all departments work towards the same organisational goals. The sales budget drives production, purchasing, and staffing budgets."},{"term":"Motivation","definition":"Gives managers targets to aim for. Participation in budget setting can increase commitment and motivation."}]},
    {"type":"explanation","heading":"Types of Budget","body":"Different approaches to budget preparation suit different organisations and circumstances.","key_terms":[{"term":"Incremental budget","definition":"Starts from the previous year budget and adjusts for expected changes. Quick to prepare but can perpetuate inefficiencies."},{"term":"Zero-based budget (ZBB)","definition":"Every activity must be justified from scratch each period, regardless of past spending. Eliminates waste but is time-consuming."},{"term":"Rolling (continuous) budget","definition":"Continuously updated by adding a new period as the most recent period ends. Always covers a fixed forward horizon (e.g., 12 months). More relevant than a fixed annual budget."},{"term":"Participative (bottom-up) budget","definition":"Managers who will be held accountable for the budget also set it. Increases motivation and accuracy but risks budget slack."}]},
    {"type":"table","heading":"Budget Types Compared","headers":["Type","Key Feature","Main Advantage","Main Disadvantage"],"rows":[["Incremental","Adjusts prior year budget","Quick and simple","Perpetuates inefficiencies"],["Zero-based","Justify all spending from scratch","Eliminates waste","Time-consuming and expensive"],["Rolling","Add new period as old one ends","Always up to date","Requires frequent revision"],["Participative","Set by the budget holder","Increases motivation","Risk of budget slack"]]}
  ]$$,
  1, 10, 5, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0003-0001-0000-000000000001','ba200000-0003-0001-0000-000000000000','mcq',
  'Which type of budget requires every item of expenditure to be justified from zero each period?',
  '["Incremental budget","Rolling budget","Zero-based budget","Participative budget"]',
  '"Zero-based budget"',
  'Zero-based budgeting (ZBB) requires managers to justify all activities from scratch, as if starting from zero. Unlike incremental budgeting, no spending is automatically approved based on past activity.',1),
('ba200000-0003-0001-0000-000000000002','ba200000-0003-0001-0000-000000000000','mcq',
  'A budget that is continuously updated by adding a new future period as each period ends is called:',
  '["An incremental budget","A zero-based budget","A rolling budget","A master budget"]',
  '"A rolling budget"',
  'Rolling (or continuous) budgets always cover a fixed forward time period. As each month passes, a new month is added at the end, keeping the budget horizon constant and ensuring plans remain current.',2),
('ba200000-0003-0001-0000-000000000003','ba200000-0003-0001-0000-000000000000','true_false',
  'A participative budgeting process always results in more accurate budgets because managers know their own costs best.',
  null,'"False"',
  'While participative budgeting can improve accuracy and motivation, it also creates a risk of budget slack — where managers deliberately understate revenue targets or overstate costs to make targets easier to achieve.',3),
('ba200000-0003-0001-0000-000000000004','ba200000-0003-0001-0000-000000000000','mcq',
  'The PRIMARY purpose of comparing actual results against the budget is to:',
  '["Motivate employees","Identify and investigate variances for control purposes","Coordinate departmental activities","Communicate management plans"]',
  '"Identify and investigate variances for control purposes"',
  'While budgets serve all four purposes (planning, control, coordination, motivation), the primary use of the budget vs actual comparison is control — highlighting where performance deviates from plan so corrective action can be taken.',4);

-- LESSON 3.2: Flexible Budgets and Variance Analysis
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0003-0002-0000-000000000000',
  'ba200000-0003-0000-0000-000000000000',
  'Flexible Budgets and Variance Analysis',
  $$[
    {"type":"intro","emoji":"🔍","heading":"Making Budgets Meaningful","body":"A fixed budget is prepared for one level of activity. If actual activity differs, comparing actual costs to a fixed budget is misleading. A flexible budget adjusts expected costs to the actual level of activity, enabling fair comparisons."},
    {"type":"explanation","heading":"Fixed vs Flexible Budgets","body":"The key distinction is how each type responds to changes in activity level.","key_terms":[{"term":"Fixed budget","definition":"Prepared for one planned level of activity and not changed when actual activity differs. Used for planning and target-setting."},{"term":"Flexible budget","definition":"Adjusted to reflect the actual level of activity achieved. Uses the standard cost model to show what costs should have been at actual volume. Used for control and performance measurement."},{"term":"Expenditure variance","definition":"The difference between the flexible budget cost and actual cost for a given activity level. Isolates the effect of cost efficiency, removing the volume effect."}]},
    {"type":"worked_example","heading":"Preparing a Flexible Budget","steps":["Fixed budget: 10,000 units. Variable costs £4/unit. Fixed costs £20,000. Actual output: 12,000 units. Actual total cost: £72,000.","Step 1 — Prepare the flexible budget at 12,000 units: Variable costs = 12,000 × £4 = £48,000. Fixed costs = £20,000 (unchanged). Flexible budget total = £68,000.","Step 2 — Calculate the total variance: Flexible budget £68,000 vs Actual £72,000. Variance = £72,000 − £68,000 = £4,000 Adverse.","Step 3 — This £4,000 A variance is the expenditure (efficiency) variance. It shows the business spent £4,000 more than expected for the actual level of output — a meaningful measure of cost control.","If we had compared actual £72,000 to the fixed budget £60,000 (= 10,000 × £4 + £20,000), the variance would be £12,000 A — but £8,000 of this is simply because more units were produced, not inefficiency."]},
    {"type":"table","heading":"Variance Conventions","headers":["Variance","Favourable (F)","Adverse (A)"],"rows":[["Sales price","Actual price > budgeted price","Actual price < budgeted price"],["Sales volume","Actual volume > budgeted volume","Actual volume < budgeted volume"],["Cost","Actual cost < budgeted cost","Actual cost > budgeted cost"],["Profit","Actual profit > budgeted profit","Actual profit < budgeted profit"]]}
  ]$$,
  2, 15, 7, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0003-0002-0000-000000000001','ba200000-0003-0002-0000-000000000000','mcq',
  'A flexible budget differs from a fixed budget because it:',
  '["Includes only fixed costs","Is adjusted for the actual level of activity achieved","Is prepared monthly rather than annually","Is set by frontline managers"]',
  '"Is adjusted for the actual level of activity achieved"',
  'A flexible budget recalculates what costs should have been at the actual output level. This removes the volume effect from variances, allowing meaningful assessment of cost efficiency.',1),
('ba200000-0003-0002-0000-000000000002','ba200000-0003-0002-0000-000000000000','mcq',
  'Budgeted output is 8,000 units (variable cost £5/unit, fixed costs £30,000). Actual output is 10,000 units at actual cost £84,000. What is the expenditure variance?',
  '["£4,000 Adverse","£4,000 Favourable","£14,000 Adverse","£14,000 Favourable"]',
  '"£4,000 Adverse"',
  'Flexible budget at 10,000 units: Variable = 10,000 × £5 = £50,000. Fixed = £30,000. Total = £80,000. Variance = £84,000 − £80,000 = £4,000 Adverse (actual cost exceeded flexible budget cost).',2),
('ba200000-0003-0002-0000-000000000003','ba200000-0003-0002-0000-000000000000','true_false',
  'A cost variance is favourable when actual cost exceeds budgeted cost.',
  null,'"False"',
  'A cost variance is ADVERSE when actual cost exceeds budget (the business spent more than planned). It is FAVOURABLE when actual cost is less than budgeted — spending less than planned is good for profit.',3),
('ba200000-0003-0002-0000-000000000004','ba200000-0003-0002-0000-000000000000','mcq',
  'Which variance arises purely because the volume of sales was different from budget?',
  '["Sales price variance","Expenditure variance","Sales volume variance","Labour efficiency variance"]',
  '"Sales volume variance"',
  'The sales volume variance measures the profit impact of selling a different volume from budget. It is calculated as (Actual units − Budgeted units) × Standard contribution (marginal costing) or standard profit (absorption costing).',4);

-- LESSON 3.3: Standard Costing and Material/Labour Variances
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0003-0003-0000-000000000000',
  'ba200000-0003-0000-0000-000000000000',
  'Standard Costing and Key Variances',
  $$[
    {"type":"intro","emoji":"📐","heading":"Standard Costing","body":"Standard costing sets pre-determined costs for materials, labour, and overheads. Comparing actual costs to standards reveals variances that help management investigate and control costs."},
    {"type":"explanation","heading":"Setting Standards and Types","body":"Standards represent what costs should be under defined operating conditions. The type of standard chosen affects motivation and the usefulness of variances.","key_terms":[{"term":"Standard cost","definition":"A pre-determined cost for a unit of output based on expected prices and efficient usage levels."},{"term":"Ideal standard","definition":"Assumes perfect efficiency — no waste, no idle time. Rarely achievable; can demotivate staff."},{"term":"Attainable standard","definition":"Assumes efficient but not perfect operations. Some allowance for normal waste and idle time. Most commonly used in practice."},{"term":"Current standard","definition":"Based on current conditions including known inefficiencies. Easy to achieve; provides little incentive to improve."}]},
    {"type":"worked_example","heading":"Material Price and Usage Variances","steps":["Standard: 5 kg at £8/kg per unit. Actual: produced 1,000 units using 5,200 kg costing £40,560.","Material Price Variance: (Standard price − Actual price) × Actual quantity purchased. Actual price = £40,560 ÷ 5,200 = £7.80/kg. MPV = (£8.00 − £7.80) × 5,200 = £1,040 Favourable (paid less per kg than standard).","Material Usage Variance: (Standard quantity − Actual quantity) × Standard price. Standard qty for 1,000 units = 1,000 × 5 = 5,000 kg. MUV = (5,000 − 5,200) × £8 = −200 × £8 = £1,600 Adverse (used more kg than standard).","Total Material Variance = MPV + MUV = £1,040 F + £1,600 A = £560 Adverse.","Check: Total material variance = (Standard cost − Actual cost) = (1,000 × 5 × £8) − £40,560 = £40,000 − £40,560 = £560 Adverse. Confirmed."]},
    {"type":"table","heading":"Key Variance Formulas","headers":["Variance","Formula","F or A?"],"rows":[["Material price","(Std price − Actual price) × Actual qty","F if Std > Actual price"],["Material usage","(Std qty − Actual qty) × Std price","F if Std > Actual qty"],["Labour rate","(Std rate − Actual rate) × Actual hours","F if Std > Actual rate"],["Labour efficiency","(Std hours − Actual hours) × Std rate","F if Std < Actual hours"],["Sales price","(Actual price − Std price) × Actual units","F if Actual > Std price"],["Sales volume (MC)","(Actual units − Budgeted units) × Std contribution","F if Actual > Budget"]]}
  ]$$,
  3, 15, 8, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0003-0003-0000-000000000001','ba200000-0003-0003-0000-000000000000','mcq',
  'Standard material is 4 kg at £6/kg per unit. Actual: 1,000 units produced using 4,200 kg costing £24,360. What is the material price variance?',
  '["£840 Adverse","£840 Favourable","£1,200 Adverse","£360 Favourable"]',
  '"£840 Favourable"',
  'Actual price = £24,360 ÷ 4,200 = £5.80/kg. MPV = (Standard price − Actual price) × Actual qty = (£6.00 − £5.80) × 4,200 = £0.20 × 4,200 = £840 Favourable (paid less per kg than standard).',1),
('ba200000-0003-0003-0000-000000000002','ba200000-0003-0003-0000-000000000000','mcq',
  'Using the same data above (standard 4 kg at £6; actual 4,200 kg for 1,000 units), what is the material usage variance?',
  '["£1,200 Adverse","£1,200 Favourable","£840 Adverse","£360 Adverse"]',
  '"£1,200 Adverse"',
  'Standard quantity for 1,000 units = 1,000 × 4 = 4,000 kg. MUV = (Standard qty − Actual qty) × Standard price = (4,000 − 4,200) × £6 = −200 × £6 = £1,200 Adverse (used more material than standard).',2),
('ba200000-0003-0003-0000-000000000003','ba200000-0003-0003-0000-000000000000','true_false',
  'The labour efficiency variance compares actual hours worked to standard hours allowed for actual production.',
  null,'"True"',
  'Labour efficiency variance = (Standard hours for actual output − Actual hours worked) × Standard rate per hour. It is favourable when fewer hours than standard were needed (more efficient working).',3),
('ba200000-0003-0003-0000-000000000004','ba200000-0003-0003-0000-000000000000','mcq',
  'An ideal standard is rarely used in practice because:',
  '["It is too difficult to calculate","It assumes perfect efficiency and is unlikely to be achieved, which can demotivate staff","It only applies to manufacturing businesses","It ignores fixed overhead costs"]',
  '"It assumes perfect efficiency and is unlikely to be achieved, which can demotivate staff"',
  'Ideal standards assume no waste, no machine breakdowns, and no idle time — perfection. In practice, achieving this is nearly impossible, so variances are always adverse. This can demotivate managers and make variances uninformative. Attainable standards are generally preferred.',4);

-- ============================================================
-- MODULE 4: Investment Appraisal
-- ============================================================

insert into public.modules (id, course_id, title, description, order_index, is_published)
values (
  'ba200000-0004-0000-0000-000000000000',
  'ba200000-0000-0000-0000-000000000000',
  'Investment Appraisal',
  'Evaluate long-term investment decisions using payback, ARR, NPV, and IRR.',
  4, true
);

-- LESSON 4.1: Payback and ARR
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0004-0001-0000-000000000000',
  'ba200000-0004-0000-0000-000000000000',
  'Payback Period and Accounting Rate of Return',
  $$[
    {"type":"intro","emoji":"💰","heading":"Investment Appraisal","body":"Businesses regularly face decisions about major capital investments. Investment appraisal techniques help evaluate whether an investment is worthwhile and compare alternative projects. We start with two non-discounted techniques: Payback and ARR."},
    {"type":"explanation","heading":"Payback Period","body":"The payback period measures how long it takes for the initial investment to be recovered from net cash inflows. It is simple to calculate and widely used as an initial screening tool.","key_terms":[{"term":"Payback period","definition":"The time required for cumulative net cash inflows to equal the initial investment cost. Shorter payback is preferred."},{"term":"Advantage of payback","definition":"Simple to calculate, easy to understand, and focuses on liquidity — important for businesses with cash flow concerns."},{"term":"Limitations of payback","definition":"Ignores the time value of money. Ignores cash flows after the payback point. Does not measure overall profitability."}]},
    {"type":"worked_example","heading":"Calculating Payback Period","steps":["A machine costs £200,000. Expected net cash inflows: Year 1: £60,000; Year 2: £80,000; Year 3: £90,000; Year 4: £70,000.","Step 1 — Calculate cumulative cash flows: Year 1: £60,000. Year 2: £140,000. Year 3: £230,000.","Step 2 — Payback occurs during Year 3. At start of Year 3, £60,000 still needed (£200,000 − £140,000). Year 3 inflow = £90,000.","Step 3 — Precise payback = 2 years + (£60,000 ÷ £90,000) × 12 months = 2 years and 8 months."]},
    {"type":"explanation","heading":"Accounting Rate of Return (ARR)","body":"ARR expresses the average annual accounting profit as a percentage of the investment. Unlike payback, it uses profit (not cash flow) and considers the whole project life.","key_terms":[{"term":"ARR formula","definition":"ARR = (Average annual accounting profit ÷ Average investment) × 100%. Average investment = (Initial cost + Scrap value) ÷ 2."},{"term":"Limitations of ARR","definition":"Uses accounting profit, not cash flows. Ignores the time value of money. ARR is not consistent with NPV maximisation."}]}
  ]$$,
  1, 10, 6, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0004-0001-0000-000000000001','ba200000-0004-0001-0000-000000000000','mcq',
  'Which statement about the payback method is CORRECT?',
  '["It accounts for the time value of money","It considers all cash flows over the project life","It ignores cash flows arising after the payback point","It measures overall project profitability"]',
  '"It ignores cash flows arising after the payback point"',
  'The payback method stops counting once the initial investment is recovered. Cash flows after payback are completely ignored, meaning a project with large late cash flows may be incorrectly rejected. It also ignores the time value of money.',1),
('ba200000-0004-0001-0000-000000000002','ba200000-0004-0001-0000-000000000000','mcq',
  'A project costs £150,000. Cash inflows: Year 1: £50,000; Year 2: £60,000; Year 3: £70,000. What is the payback period?',
  '["2 years exactly","2 years 6 months","2 years 8 months","3 years exactly"]',
  '"2 years 6 months"',
  'Cumulative: Year 1 = £50,000; Year 2 = £110,000; still need £40,000. Year 3 inflow = £70,000. Payback within Year 3 = £40,000 ÷ £70,000 × 12 = 6.86 months, approximately 6 months. Total: 2 years 6 months (to nearest half year or using exact method gives 2 years and ~6.9 months).',2),
('ba200000-0004-0001-0000-000000000003','ba200000-0004-0001-0000-000000000000','true_false',
  'The Accounting Rate of Return (ARR) uses cash flows rather than accounting profit.',
  null,'"False"',
  'ARR uses accounting profit (after depreciation), not cash flows. This is a key limitation: it uses a subjective measure influenced by accounting policies, and ignores the time value of money. NPV, by contrast, uses cash flows.',3),
('ba200000-0004-0001-0000-000000000004','ba200000-0004-0001-0000-000000000000','mcq',
  'ARR is calculated as:',
  '["Initial investment divided by average annual profit","Average annual profit divided by average investment","Total profit divided by total investment","Annual cash flow divided by initial investment"]',
  '"Average annual profit divided by average investment"',
  'ARR = (Average annual accounting profit ÷ Average investment) × 100%. Average investment = (Initial cost + Residual value) ÷ 2. A project is accepted if its ARR exceeds the target rate.',4);

-- LESSON 4.2: NPV and IRR
insert into public.lessons (id, module_id, title, content, order_index, xp_reward, estimated_minutes, is_published)
values (
  'ba200000-0004-0002-0000-000000000000',
  'ba200000-0004-0000-0000-000000000000',
  'Net Present Value and Internal Rate of Return',
  $$[
    {"type":"intro","emoji":"📊","heading":"Discounted Cash Flow Methods","body":"Discounted cash flow (DCF) methods recognise that cash received in the future is worth less than cash received today — the time value of money. NPV and IRR are the two main DCF techniques and are theoretically superior to payback and ARR."},
    {"type":"explanation","heading":"Net Present Value (NPV)","body":"NPV discounts all project cash flows back to present value using the cost of capital. A positive NPV means the project earns more than the cost of capital and adds value to the business.","key_terms":[{"term":"Discount factor","definition":"The present value of £1 received at a future date: 1 ÷ (1 + r)^n, where r = discount rate and n = number of years. Found in present value tables."},{"term":"NPV decision rule","definition":"Accept the project if NPV > 0 (adds value). Reject if NPV < 0. When choosing between mutually exclusive projects, select the one with the highest positive NPV."},{"term":"Net Present Value","definition":"Sum of all discounted cash flows minus the initial investment. Positive NPV = project is worthwhile at the given discount rate."}]},
    {"type":"worked_example","heading":"NPV Calculation","steps":["Project cost: £100,000 today. Discount rate: 10%. Cash inflows: Year 1: £40,000; Year 2: £50,000; Year 3: £40,000.","Discount factors at 10%: Year 1: 0.909; Year 2: 0.826; Year 3: 0.751.","Present values: Year 1: £40,000 × 0.909 = £36,360. Year 2: £50,000 × 0.826 = £41,300. Year 3: £40,000 × 0.751 = £30,040.","Total PV of inflows = £36,360 + £41,300 + £30,040 = £107,700.","NPV = £107,700 − £100,000 = +£7,700.","Decision: NPV is positive, so accept the project. It earns more than the 10% cost of capital and adds £7,700 of value in present value terms."]},
    {"type":"explanation","heading":"Internal Rate of Return (IRR)","body":"The IRR is the discount rate at which NPV = 0. If the IRR exceeds the cost of capital, the project is worthwhile. IRR is found by linear interpolation between two NPV calculations.","key_terms":[{"term":"IRR formula (interpolation)","definition":"IRR = L + [NPV(L) ÷ (NPV(L) − NPV(H))] × (H − L), where L = lower rate, H = higher rate, NPV(L) = NPV at lower rate, NPV(H) = NPV at higher rate."},{"term":"IRR decision rule","definition":"Accept the project if IRR > cost of capital. For mutually exclusive projects, choose the one with the higher IRR (but NPV is theoretically preferred for ranking)."}]},
    {"type":"table","heading":"Investment Appraisal Method Comparison","headers":["Method","Uses cash flows?","Time value of money?","Decision rule","Main limitation"],"rows":[["Payback","Yes","No","Shorter is better","Ignores post-payback flows"],["ARR","No (profit)","No","ARR > target rate","Uses subjective accounting profit"],["NPV","Yes","Yes","NPV > 0, accept","Requires accurate cost of capital"],["IRR","Yes","Yes","IRR > cost of capital","Assumes reinvestment at IRR"]]}
  ]$$,
  2, 15, 8, true
);

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
values
('ba200000-0004-0002-0000-000000000001','ba200000-0004-0002-0000-000000000000','mcq',
  'A project has an NPV of +£15,000 at a 12% discount rate. This means:',
  '["The project earns exactly 12% return","The project adds £15,000 of value in present value terms and should be accepted","The project should be rejected as IRR is below 12%","The payback period is less than one year"]',
  '"The project adds £15,000 of value in present value terms and should be accepted"',
  'A positive NPV means the project earns more than the cost of capital (12%), generating surplus value of £15,000 in present value terms. The NPV rule is: accept if NPV > 0, reject if NPV < 0.',1),
('ba200000-0004-0002-0000-000000000002','ba200000-0004-0002-0000-000000000000','mcq',
  'The Internal Rate of Return (IRR) is best described as:',
  '["The discount rate at which NPV equals zero","The rate of return based on accounting profit","The rate at which the payback period equals one year","The cost of capital used to discount cash flows"]',
  '"The discount rate at which NPV equals zero"',
  'The IRR is the specific discount rate that makes NPV = 0. It is found by interpolation between two NPVs. A project is accepted if the IRR exceeds the required rate of return (cost of capital).',2),
('ba200000-0004-0002-0000-000000000003','ba200000-0004-0002-0000-000000000000','true_false',
  'NPV is generally considered the superior investment appraisal technique because it accounts for the time value of money and measures absolute value creation.',
  null,'"True"',
  'NPV is theoretically preferred because it: (1) uses cash flows not accounting profit, (2) adjusts for the time value of money, (3) measures absolute value added, and (4) is consistent with shareholder wealth maximisation. IRR can give misleading rankings for mutually exclusive projects.',3),
('ba200000-0004-0002-0000-000000000004','ba200000-0004-0002-0000-000000000000','mcq',
  'A project has NPV of +£8,000 at 10% and −£4,000 at 15%. Using interpolation, the IRR is approximately:',
  '["11.7%","13.3%","12.5%","14.2%"]',
  '"13.3%"',
  'IRR = L + [NPV(L) ÷ (NPV(L) − NPV(H))] × (H − L) = 10 + [8,000 ÷ (8,000 − (−4,000))] × (15 − 10) = 10 + [8,000 ÷ 12,000] × 5 = 10 + 0.667 × 5 = 10 + 3.33 = 13.3%.',4);
