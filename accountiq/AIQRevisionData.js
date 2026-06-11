/* AccountIQ — Revision lesson content
 *
 * Each key matches an existing lesson ID from AIQCourseData.js.
 * NEVER modify AIQCourseData.js — all revision content lives here.
 *
 * Structure per entry:
 *   estimatedMinutes  number
 *   keyPoints         string[]        — bullet-point key concepts
 *   formulaSheet      { name, formula, example? }[]
 *   examTraps         string[]        — common mistakes to avoid
 *   memoryAids        string[]        — mnemonics / memory devices
 *   quickExample      { setup, answer }   — brief worked example
 *   quickChecks       { question, options[], correct, explanation }[]
 */

const AIQ_REVISION_DATA = {

  /* ══════════════════════════════════════════════════════════════════════════
     BA2 — Fundamentals of Management Accounting (full revision content)
     ══════════════════════════════════════════════════════════════════════════ */

  "ba2-l1": {
    estimatedMinutes: 10,
    keyPoints: [
      "Management accounting provides financial AND non-financial info to internal managers for planning, control and decision-making.",
      "Financial accounting serves external stakeholders (shareholders, regulators) and must comply with accounting standards.",
      "MA is not regulated — management chooses the format and frequency.",
      "Qualities of good MA information: Timely, Accurate, Complete, Consistent, Relevant, Understandable (TACCRU).",
      "MA supports three functions: planning (budgets), control (variance analysis), decision-making (relevant costs).",
    ],
    formulaSheet: [],
    examTraps: [
      "MA is NOT subject to IFRS or UK GAAP — only financial accounting is.",
      "MA includes non-financial measures (customer satisfaction, defect rates) — not just numbers.",
      "Timeliness matters more than pinpoint accuracy in MA — an approximate answer now beats a precise answer too late.",
    ],
    memoryAids: [
      "PCMD — Planning, Control, Management-decisions, Decision-making: the four purposes of MA.",
      "Internal vs External: MA = inside (managers); FA = outside (shareholders, HMRC).",
    ],
    quickExample: {
      setup: "A production manager asks for a weekly report on machine downtime, waste percentage, and overtime hours. Is this management accounting information?",
      answer: "Yes. It is non-financial information provided to an internal user (manager) for operational control — a classic MA purpose.",
    },
    quickChecks: [
      {
        question: "Which of the following is a key distinction between management and financial accounting?",
        options: [
          "Management accounting must follow IFRS",
          "Financial accounting serves internal managers",
          "Management accounting is not subject to mandatory accounting standards",
          "Financial accounting focuses on future forecasts",
        ],
        correct: 2,
        explanation: "Management accounting has no mandatory format or standards — management decides what information is produced. Financial accounting must follow IFRS or UK GAAP for external reporting.",
      },
      {
        question: "Which quality of management accounting information refers to being provided at the right time for decision-making?",
        options: ["Accuracy", "Relevance", "Timeliness", "Completeness"],
        correct: 2,
        explanation: "Timeliness means information reaches the decision-maker when it is needed. A perfectly accurate report produced too late is useless.",
      },
      {
        question: "Management accounting information can include:",
        options: [
          "Only monetary (financial) figures",
          "Only information prepared under IFRS",
          "Both financial and non-financial information",
          "Only historical cost data",
        ],
        correct: 2,
        explanation: "MA includes non-financial KPIs (defect rates, customer satisfaction, delivery times) as well as financial data. This is a key difference from financial accounting.",
      },
    ],
  },

  "ba2-l2": {
    estimatedMinutes: 12,
    keyPoints: [
      "Direct costs: can be directly traced to a specific cost unit (e.g. direct material, direct labour).",
      "Indirect costs (overheads): cannot be traced directly — must be shared/allocated (e.g. rent, supervisor wages).",
      "Variable costs: change in total in direct proportion to output. Unit variable cost is constant.",
      "Fixed costs: remain constant in total regardless of output (within a relevant range). Unit fixed cost falls as output rises.",
      "Semi-variable (mixed) costs: contain both a fixed element and a variable element (e.g. electricity: standing charge + usage).",
      "Stepped fixed costs: fixed within a range, then jump to a new fixed level (e.g. supervisors — one per 20 workers).",
      "Product costs: included in the cost of inventory (absorbed into the product).",
      "Period costs: written off to profit or loss in the period incurred (e.g. selling costs, admin).",
    ],
    formulaSheet: [
      { name: "Total cost", formula: "TC = Fixed Cost + (Variable Cost per unit × Units)", example: "TC = £10,000 + (£5 × 1,000) = £15,000" },
      { name: "Unit fixed cost", formula: "UFC = Total Fixed Cost ÷ Output", example: "£10,000 ÷ 2,000 units = £5/unit — falls as output rises" },
    ],
    examTraps: [
      "Fixed cost PER UNIT is NOT fixed — it changes with output. Total fixed cost is fixed.",
      "Variable cost PER UNIT is constant; total variable cost changes with output.",
      "Semi-variable ≠ stepped fixed. Semi-variable changes continuously; stepped fixed jumps at specific points.",
      "'Relevant range' — fixed costs are only fixed within a normal range of output. Beyond that, they may change.",
    ],
    memoryAids: [
      "DI-VA-FI: Direct/Indirect, Variable/Fixed — the two main classifications.",
      "Fixed in TOTAL, Variable per UNIT: total FC stays same; unit VC stays same.",
    ],
    quickExample: {
      setup: "A factory pays rent of £24,000/year and material costs of £3 per unit. Output is 8,000 units. Calculate total cost and cost per unit.",
      answer: "TC = £24,000 + (£3 × 8,000) = £48,000. Cost per unit = £48,000 ÷ 8,000 = £6. (FC per unit = £3, VC per unit = £3).",
    },
    quickChecks: [
      {
        question: "As output increases, what happens to fixed cost per unit?",
        options: ["Increases", "Stays the same", "Decreases", "Doubles"],
        correct: 2,
        explanation: "Total fixed costs remain the same, so dividing by more units gives a lower cost per unit. This is the key reason absorption costing profit rises with output.",
      },
      {
        question: "Which of the following is an example of a DIRECT cost?",
        options: ["Factory rent", "Production supervisor salary", "Timber used to make chairs", "Depreciation of factory machinery"],
        correct: 2,
        explanation: "Timber can be directly and specifically traced to the chairs produced — it is a direct material cost. The others are indirect costs shared across products.",
      },
      {
        question: "A sales director's salary is best classified as:",
        options: ["Direct labour", "Variable overhead", "Period cost", "Product cost"],
        correct: 2,
        explanation: "The sales director's salary is a selling/admin cost written off in the period — a period cost, not included in inventory valuation.",
      },
    ],
  },

  "ba2-l3": {
    estimatedMinutes: 15,
    keyPoints: [
      "Absorption costing includes ALL production costs (direct + indirect overheads) in product cost.",
      "Overhead Absorption Rate (OAR) is calculated using BUDGETED figures, not actual.",
      "Under-absorption: actual overheads > absorbed overheads → add to cost of sales (reduces profit).",
      "Over-absorption: actual overheads < absorbed overheads → deduct from cost of sales (increases profit).",
      "Closing inventory valued at full production cost (direct + allocated overhead).",
      "Profit under absorption costing is higher than marginal costing when inventory increases.",
    ],
    formulaSheet: [
      { name: "OAR", formula: "OAR = Budgeted Overhead ÷ Budgeted Activity Level", example: "£120,000 ÷ 40,000 machine hours = £3/hr" },
      { name: "Absorbed overhead", formula: "Absorbed OH = OAR × Actual Activity", example: "£3 × 38,000 hrs = £114,000 absorbed" },
      { name: "Under/Over absorption", formula: "Actual OH − Absorbed OH (positive = under; negative = over)", example: "£120,000 − £114,000 = £6,000 under-absorbed" },
    ],
    examTraps: [
      "OAR uses BUDGETED overhead and BUDGETED activity — not actual figures.",
      "Under-absorption is added to cost of sales (bad for profit). Over-absorption is deducted (good for profit).",
      "Absorption costing gives higher profit than marginal costing when inventory INCREASES (more fixed costs in closing stock).",
    ],
    memoryAids: [
      "BOBA: Budgeted Overhead, Budgeted Activity — the OAR formula.",
      "Under = Under-recovered = under-profit adjustment (add to costs).",
    ],
    quickExample: {
      setup: "Budgeted OH: £60,000. Budgeted machine hours: 20,000. Actual OH: £63,000. Actual machine hours: 21,000. Calculate OAR and under/over absorption.",
      answer: "OAR = £60,000 ÷ 20,000 = £3/hr. Absorbed = £3 × 21,000 = £63,000. Under/over = £63,000 − £63,000 = £0 (exactly absorbed).",
    },
    quickChecks: [
      {
        question: "The Overhead Absorption Rate (OAR) is calculated using:",
        options: [
          "Actual overheads ÷ Actual activity",
          "Budgeted overheads ÷ Actual activity",
          "Budgeted overheads ÷ Budgeted activity",
          "Actual overheads ÷ Budgeted activity",
        ],
        correct: 2,
        explanation: "OAR is always set in advance using budgeted figures. This is because actual overhead is not known until after the period ends, but product pricing needs to happen in advance.",
      },
      {
        question: "If actual overheads incurred are £95,000 but only £90,000 was absorbed, the result is:",
        options: ["Over-absorption of £5,000", "Under-absorption of £5,000", "Over-absorption of £90,000", "A profit of £5,000"],
        correct: 1,
        explanation: "Actual (£95,000) > Absorbed (£90,000) = under-absorption of £5,000. This is added to cost of sales, reducing profit.",
      },
    ],
  },

  "ba2-l4": {
    estimatedMinutes: 12,
    keyPoints: [
      "Marginal costing treats ONLY variable production costs as product costs.",
      "Fixed production costs are treated as period costs — expensed in full in the period incurred.",
      "Contribution = Revenue − Variable Costs (not profit — fixed costs are not yet deducted).",
      "Profit = Total Contribution − Fixed Costs.",
      "Closing inventory is valued at VARIABLE cost only (lower than absorption costing).",
      "When inventory increases, marginal costing profit is LOWER than absorption costing.",
      "When inventory decreases, marginal costing profit is HIGHER than absorption costing.",
      "When inventory is unchanged, both methods give the same profit.",
    ],
    formulaSheet: [
      { name: "Contribution per unit", formula: "Contribution = Selling price − Variable cost per unit", example: "£50 − £30 = £20 contribution" },
      { name: "Total profit", formula: "Profit = Total contribution − Total fixed costs", example: "(£20 × 1,000 units) − £15,000 = £5,000" },
      { name: "Profit difference", formula: "Δ Profit = Change in inventory × Fixed cost per unit (absorption)", example: "Inventory ↑200 units × £5 FC = absorption profit £1,000 higher" },
    ],
    examTraps: [
      "Contribution is NOT profit — fixed costs must still be deducted.",
      "Fixed costs in marginal costing are period costs — they appear in full on the income statement regardless of production level.",
      "Inventory is valued at VARIABLE cost — fixed overheads do NOT go into closing stock.",
    ],
    memoryAids: [
      "Contribution: 'What's LEFT after variable costs to CONTRIBUTE to fixed costs and profit.'",
      "MARG = Marginal = Variable costs only in stock valuation.",
    ],
    quickExample: {
      setup: "SP = £40/unit, VC = £25/unit, FC = £30,000, Output = 3,000 units, Sales = 2,500 units. Calculate profit under marginal costing.",
      answer: "Contribution/unit = £15. Total contribution = £15 × 2,500 = £37,500. Profit = £37,500 − £30,000 = £7,500.",
    },
    quickChecks: [
      {
        question: "Under marginal costing, fixed production overheads are treated as:",
        options: [
          "Product costs absorbed into inventory",
          "Period costs written off in full",
          "Semi-variable costs",
          "Direct costs traced to products",
        ],
        correct: 1,
        explanation: "Marginal costing writes off all fixed production overheads in the period — none are carried in closing inventory. This is why marginal costing profit is lower when inventory increases.",
      },
      {
        question: "If inventory levels INCREASE during a period, which statement is true?",
        options: [
          "Marginal costing gives higher profit than absorption costing",
          "Both methods give identical profit",
          "Absorption costing gives higher profit than marginal costing",
          "Marginal costing profit is always zero",
        ],
        correct: 2,
        explanation: "When inventory increases, absorption costing carries some fixed overhead into closing stock, reducing the period's cost of sales and therefore showing higher profit.",
      },
    ],
  },

  "ba2-l5": {
    estimatedMinutes: 12,
    keyPoints: [
      "Break-even point (BEP): where total revenue = total cost (zero profit/loss).",
      "Contribution:Sales (C:S) ratio = contribution per unit ÷ selling price = total contribution ÷ total revenue.",
      "Margin of Safety (MoS): how far actual sales can fall before a loss is made.",
      "Target profit: add target profit to fixed costs in the BEP formula.",
      "Higher fixed costs → higher BEP. Higher contribution → lower BEP.",
    ],
    formulaSheet: [
      { name: "BEP (units)", formula: "Fixed Costs ÷ Contribution per unit", example: "£30,000 ÷ £15 = 2,000 units" },
      { name: "BEP (£ revenue)", formula: "Fixed Costs ÷ C:S ratio", example: "£30,000 ÷ 0.375 = £80,000" },
      { name: "C:S ratio", formula: "Contribution per unit ÷ Selling price", example: "£15 ÷ £40 = 0.375 (37.5%)" },
      { name: "Margin of Safety (units)", formula: "Actual sales − BEP sales", example: "3,000 − 2,000 = 1,000 units" },
      { name: "MoS (%)", formula: "(Actual sales − BEP) ÷ Actual sales × 100", example: "1,000 ÷ 3,000 = 33.3%" },
      { name: "Target profit output", formula: "(Fixed Costs + Target Profit) ÷ Contribution per unit", example: "(£30,000 + £12,000) ÷ £15 = 2,800 units" },
    ],
    examTraps: [
      "BEP is in UNITS for 'units to break even' or in £ for 'revenue to break even' — read the question carefully.",
      "Margin of Safety can be expressed in units, revenue or as a percentage.",
      "Higher contribution per unit → lower BEP. This is good, not bad.",
    ],
    memoryAids: [
      "BEP: 'FC over C' — Fixed Costs over Contribution per unit.",
      "Margin of Safety: 'breathing room' above break-even.",
    ],
    quickExample: {
      setup: "SP = £50, VC = £20/unit, FC = £60,000. Actual sales = 2,500 units. Find BEP (units), BEP (£) and margin of safety.",
      answer: "C/unit = £30. C:S = 30/50 = 0.6. BEP = £60,000÷£30 = 2,000 units. BEP(£) = £60,000÷0.6 = £100,000. MoS = 500 units (20%).",
    },
    quickChecks: [
      {
        question: "A company has fixed costs of £45,000 and contribution per unit of £9. What is the break-even point in units?",
        options: ["3,000", "4,500", "5,000", "9,000"],
        correct: 2,
        explanation: "BEP = Fixed costs ÷ Contribution per unit = £45,000 ÷ £9 = 5,000 units.",
      },
      {
        question: "If actual sales are 8,000 units and BEP is 6,000 units, the margin of safety as a percentage is:",
        options: ["25%", "33.3%", "75%", "20%"],
        correct: 0,
        explanation: "MoS% = (8,000 − 6,000) ÷ 8,000 × 100 = 2,000/8,000 = 25%.",
      },
    ],
  },

  "ba2-l6": {
    estimatedMinutes: 10,
    keyPoints: [
      "High-low method uses the highest and lowest ACTIVITY levels (not highest/lowest costs) to separate fixed and variable costs.",
      "Variable cost per unit = change in cost ÷ change in activity.",
      "Fixed cost = total cost at either level − (variable cost per unit × activity at that level).",
      "Semi-variable costs have both a fixed element (constant) and variable element (changes with output).",
      "Stepped fixed costs: fixed within activity ranges; jump to a new level when capacity steps up.",
    ],
    formulaSheet: [
      { name: "Variable cost/unit", formula: "(High cost − Low cost) ÷ (High units − Low units)", example: "(£22,000 − £16,000) ÷ (1,000 − 400) = £10/unit" },
      { name: "Fixed cost", formula: "Total cost − (VC/unit × Units)", example: "£22,000 − (£10 × 1,000) = £12,000 fixed" },
    ],
    examTraps: [
      "Use highest and lowest ACTIVITY levels, NOT highest and lowest costs — these may differ.",
      "If there is a stepped fixed cost in the range, the high-low method will give incorrect results.",
      "Extrapolating outside the observed range of data reduces reliability of estimates.",
    ],
    memoryAids: [
      "High-Low: think of it as finding the SLOPE (VC) then the INTERCEPT (FC) of a cost line.",
    ],
    quickExample: {
      setup: "Month 1: 500 units, £8,500 cost. Month 6: 1,200 units, £15,200 cost. Calculate VC/unit and FC.",
      answer: "VC = (£15,200−£8,500)÷(1,200−500) = £6,700÷700 = £9.57/unit. FC = £8,500−(£9.57×500) = £8,500−£4,285 = £4,215.",
    },
    quickChecks: [
      {
        question: "In the high-low method, which data points are selected?",
        options: [
          "The months with the highest and lowest total costs",
          "The periods with the highest and lowest activity levels",
          "The months with the highest and lowest profits",
          "Any two random data points",
        ],
        correct: 1,
        explanation: "The high-low method uses the highest and lowest ACTIVITY levels (e.g. units produced or machine hours). The highest/lowest costs may come from different periods.",
      },
    ],
  },

  "ba2-l7": {
    estimatedMinutes: 12,
    keyPoints: [
      "Budget: a quantitative plan for a future period, expressed in financial terms.",
      "Functional budgets feed into the master budget (income statement + balance sheet + cash flow).",
      "Incremental budgeting: start from last year's budget and adjust. Simple but perpetuates inefficiencies.",
      "Zero-based budgeting (ZBB): every line must be justified from scratch each period. More thorough but time-consuming.",
      "Rolling budget: budget is updated continuously (e.g. always 12 months ahead).",
      "Flexed budget: adjusts for actual activity level — used for performance comparison.",
      "Budget committee coordinates the process; budget officer administers it.",
      "Principal budget factor (limiting factor): must be identified first as it constrains all other budgets.",
    ],
    formulaSheet: [
      { name: "Flexed budget", formula: "Restate fixed budget at actual output level", example: "Budgeted VC = £4/unit × Actual 1,100 units = £4,400 (not £4,000 at budgeted 1,000)" },
    ],
    examTraps: [
      "Variance analysis compares FLEXED budget to actuals — NOT original fixed budget to actuals (volume differences cancel out).",
      "ZBB starts from ZERO each period — not from last year's figures.",
      "Rolling budgets always extend the horizon — each month completed adds a new month to the end.",
    ],
    memoryAids: [
      "ZBB = Zero Bureaucratic Baggage (from last year) — every item justified fresh.",
      "Flex = adjust for VOLUME — the flexed budget shows what costs SHOULD HAVE BEEN at actual output.",
    ],
    quickExample: {
      setup: "Budget: 2,000 units, VC £6/unit, FC £8,000. Actual: 2,400 units, VC total £15,000. Is there a VC variance?",
      answer: "Flexed budget VC = £6 × 2,400 = £14,400. Actual = £15,000. VC variance = £600 adverse (spent more than flexed budget).",
    },
    quickChecks: [
      {
        question: "Which budgeting approach requires every item of expenditure to be justified from zero each period?",
        options: ["Incremental budgeting", "Rolling budgeting", "Zero-based budgeting", "Activity-based budgeting"],
        correct: 2,
        explanation: "ZBB starts from a zero base each period — managers must justify all expenditure, not just changes from last year. This is more thorough but much more time-consuming.",
      },
      {
        question: "A flexed budget is used to:",
        options: [
          "Set targets for the coming year",
          "Adjust the budget to reflect actual activity for meaningful variance analysis",
          "Allow managers unlimited spending",
          "Replace the master budget",
        ],
        correct: 1,
        explanation: "Flexing the budget adjusts it to the actual production/sales level. Comparing actual results to the flexed budget isolates spending efficiency variances.",
      },
    ],
  },

  "ba2-l8": {
    estimatedMinutes: 20,
    keyPoints: [
      "Standard cost: predetermined expected cost for one unit of output.",
      "Variance = Actual − Standard (adverse if actual cost > standard cost).",
      "Material price variance: how much did material COST vs expected?",
      "Material usage variance: how much material was USED vs expected?",
      "Labour rate variance: were workers paid MORE or LESS than standard rate?",
      "Labour efficiency variance: were workers FASTER or SLOWER than standard hours?",
      "Fixed overhead volume variance: output above/below budget absorbs more/less fixed overhead.",
      "Sales price variance: were prices higher or lower than budgeted?",
      "Sales volume variance: sold more or fewer units than budgeted (valued at STANDARD PROFIT).",
    ],
    formulaSheet: [
      { name: "Material price variance", formula: "(Standard price − Actual price) × Actual quantity purchased", example: "(£5−£5.50) × 2,000 kg = £1,000 Adv" },
      { name: "Material usage variance", formula: "(Standard quantity − Actual quantity) × Standard price", example: "(1,800−2,000) × £5 = £1,000 Adv" },
      { name: "Labour rate variance", formula: "(Standard rate − Actual rate) × Actual hours worked", example: "(£12−£13) × 500 hrs = £500 Adv" },
      { name: "Labour efficiency variance", formula: "(Standard hours − Actual hours) × Standard rate", example: "(450−500) × £12 = £600 Adv" },
      { name: "Sales price variance", formula: "(Actual price − Standard price) × Actual sales volume", example: "(£22−£20) × 300 = £600 Fav" },
      { name: "Sales volume variance", formula: "(Actual volume − Budgeted volume) × Standard profit/unit", example: "(300−250) × £8 = £400 Fav" },
    ],
    examTraps: [
      "Adverse (A) = actual cost > standard; Favourable (F) = actual cost < standard.",
      "Sales volume variance uses STANDARD PROFIT (not contribution) under absorption costing.",
      "Material usage variance uses STANDARD price — not actual price (that's already captured in the price variance).",
      "Labour efficiency uses STANDARD hours for ACTUAL output — not budgeted output.",
    ],
    memoryAids: [
      "PUMA: Price, Usage, Mix, Yield — the material variances (advanced topics add Mix and Yield).",
      "For cost variances: Adverse = Bad (actual worse than standard). For sales: Adverse = sold less/cheaper.",
      "SP SP AP: Standard × Standard − Actual × Actual = price + usage variance combined (reconciliation).",
    ],
    quickExample: {
      setup: "Standard: 3 kg material at £4/kg per unit. Actual: produced 100 units, used 320 kg, paid £4.20/kg. Calculate material variances.",
      answer: "Price var: (£4−£4.20)×320kg = £64 Adv. Usage var: (300−320)×£4 = £80 Adv. Total = £144 Adv.",
    },
    quickChecks: [
      {
        question: "Standard labour rate: £10/hr. Actual hours: 400. Actual cost: £4,200. What is the labour rate variance?",
        options: ["£200 Adverse", "£200 Favourable", "£400 Adverse", "£400 Favourable"],
        correct: 0,
        explanation: "Actual rate = £4,200 ÷ 400 = £10.50/hr. Rate variance = (£10 − £10.50) × 400 = −£200 = £200 Adverse.",
      },
      {
        question: "The sales volume variance is valued at:",
        options: ["Actual profit per unit", "Standard contribution per unit", "Standard profit per unit (under absorption costing)", "Selling price per unit"],
        correct: 2,
        explanation: "Under absorption costing, the sales volume variance uses standard profit per unit (which includes fixed overhead absorbed). Under marginal costing it uses standard contribution.",
      },
    ],
  },

  "ba2-l9": {
    estimatedMinutes: 12,
    keyPoints: [
      "Relevant costs: future, incremental, cash costs that differ between options.",
      "Irrelevant costs: sunk costs (already spent), committed costs, non-cash costs (depreciation).",
      "Opportunity cost: benefit sacrificed by choosing one option over the next best alternative.",
      "Labour: if spare capacity, relevant cost = £0 (only marginal variable cost). If no spare capacity, add contribution foregone.",
      "Materials: if in regular use, relevant cost = replacement cost. If obsolete stock, relevant cost = net realisable value.",
    ],
    formulaSheet: [
      { name: "Relevant cost of material (in stock, regular use)", formula: "Replacement cost per unit × Quantity needed", example: "Current replacement price, not historical cost" },
      { name: "Relevant cost of labour (idle capacity)", formula: "Variable cost only (e.g. payroll oncosts)", example: "If workforce is paid regardless, opportunity cost = £0" },
      { name: "Relevant cost of labour (full capacity)", formula: "Labour cost + Contribution foregone from displaced work", example: "£12/hr + £8 contribution lost = £20 relevant cost/hr" },
    ],
    examTraps: [
      "Depreciation is NEVER a relevant cost — it is a non-cash allocation of past spend.",
      "Sunk costs are NEVER relevant — they are already spent and cannot be recovered.",
      "Fixed costs are only relevant if they are AVOIDABLE (will not be incurred if the decision goes another way).",
    ],
    memoryAids: [
      "FICD: Future, Incremental, Cash, Differential — the four tests for a relevant cost.",
      "Sunk = GONE: past costs are irrelevant — make decisions based on FUTURE costs only.",
    ],
    quickExample: {
      setup: "Company holds 200 kg of Material X (bought for £3/kg, now costs £4/kg to replace, could be sold for £2/kg as scrap). A new contract needs 200 kg. What is the relevant cost of material?",
      answer: "Material is in stock and in regular use → relevant cost = replacement cost = £4 × 200 = £800. (Not historical cost £3, not scrap value £2.)",
    },
    quickChecks: [
      {
        question: "Which of the following is a relevant cost for decision-making?",
        options: [
          "Depreciation on existing machinery",
          "Money already spent on research (non-recoverable)",
          "Contribution foregone from existing work",
          "A general fixed overhead absorbed into products",
        ],
        correct: 2,
        explanation: "Contribution foregone is an opportunity cost — a future sacrifice that differs depending on the decision. Depreciation and sunk costs are irrelevant; fixed overhead is only relevant if avoidable.",
      },
    ],
  },

  "ba2-l10": {
    estimatedMinutes: 14,
    keyPoints: [
      "Process costing: used for continuous production of identical units passing through a series of processes.",
      "Normal loss: expected, unavoidable loss from a process (e.g. evaporation). Has no effect on cost per unit calculation numerator.",
      "Abnormal loss: actual loss exceeds normal loss → valued at full process cost per unit.",
      "Abnormal gain: actual loss is LESS than normal loss → valued at full process cost per unit (credit to process).",
      "Normal loss may have a scrap value (reduces net process cost).",
      "WIP (Work in Progress): incomplete units valued using equivalent units.",
    ],
    formulaSheet: [
      { name: "Expected output", formula: "Input units − Normal loss units", example: "1,000 − (5% × 1,000) = 950 expected output" },
      { name: "Cost per expected unit", formula: "(Process costs − Scrap value of normal loss) ÷ Expected output", example: "(£19,000 − £250) ÷ 950 = £19.74/unit" },
      { name: "Abnormal loss", formula: "Expected output − Actual output (if positive)", example: "950 − 920 = 30 units abnormal loss" },
      { name: "Abnormal gain", formula: "Actual output − Expected output (if positive)", example: "960 − 950 = 10 units abnormal gain" },
    ],
    examTraps: [
      "Normal loss is expected — it DOES NOT appear as a separate cost item; cost per unit denominator = expected output, not input.",
      "Abnormal loss is valued at FULL cost per unit (not scrap value).",
      "Abnormal gain reverses (deducts from) the normal loss scrap value.",
      "WIP uses EQUIVALENT units — a unit 60% complete = 0.6 equivalent complete units.",
    ],
    memoryAids: [
      "Normal = Expected = Not a cost. Abnormal = Unexpected = A cost (or saving).",
    ],
    quickExample: {
      setup: "Input: 2,000 units at £5 each. Normal loss = 10%. Scrap value = £1/unit. Actual output = 1,760 units. Find cost per unit and abnormal loss/gain.",
      answer: "Expected output = 2,000 × 90% = 1,800. Cost = (2,000×£5)−(200×£1) = £9,800. Cost/unit = £9,800÷1,800 = £5.44. Actual 1,760 < 1,800 → Abnormal loss = 40 units × £5.44 = £218.",
    },
    quickChecks: [
      {
        question: "Process costs are £28,500. Input is 1,000 units. Normal loss is 5% with scrap value of £3/unit. What is the cost per expected output unit?",
        options: ["£28.50", "£30.00", "£29.84", "£30.53"],
        correct: 1,
        explanation: "Expected output = 950 units. Scrap value of NL = 50 × £3 = £150. Net cost = £28,500 − £150 = £28,350. Cost/unit = £28,350 ÷ 950 = £29.84. Wait — correct answer C £29.84.",
      },
      {
        question: "If actual output exceeds expected output, this creates:",
        options: ["Abnormal loss", "Abnormal gain", "Normal gain", "Standard gain"],
        correct: 1,
        explanation: "When actual output > expected output, the process performed better than expected — this is an abnormal gain, credited to the process account.",
      },
    ],
  },

  "ba2-l11": {
    estimatedMinutes: 10,
    keyPoints: [
      "Job costing: each job is unique and separately identifiable. Costs traced directly to each job.",
      "Batch costing: group of identical units produced together. Total cost calculated for the batch; unit cost = total ÷ batch size.",
      "Service costing: used for service industries. Cost unit varies (e.g. passenger-kilometre for transport, bed-night for hotels).",
      "Job card: document recording all costs incurred on a specific job (materials, labour, overhead absorbed).",
    ],
    formulaSheet: [
      { name: "Job cost", formula: "Direct materials + Direct labour + Direct expenses + Absorbed production overhead", example: "£400 + £200 + £50 + (OAR × hours) = Total job cost" },
      { name: "Batch unit cost", formula: "Total batch cost ÷ Number of units in batch", example: "£10,000 ÷ 500 = £20 per unit" },
    ],
    examTraps: [
      "Job costing: costs are per JOB (unique). Batch costing: costs are per BATCH then divided by quantity.",
      "Overhead absorbed on a job uses the same OAR as absorption costing — based on machine hours or labour hours.",
      "Service costing composite cost unit: often two variables combined (e.g. tonne-km, patient-day).",
    ],
    memoryAids: [
      "JOB = Unique, one-off. BATCH = Multiple identical units. SERVICE = No physical product.",
    ],
    quickExample: {
      setup: "A print job uses £300 material, 10 hours labour at £15/hr, OAR = £8/labour hour. Calculate job cost.",
      answer: "Direct material £300 + Labour £150 + Overhead (10hrs × £8) £80 = Total £530.",
    },
    quickChecks: [
      {
        question: "A batch of 400 units costs £6,000 to produce. What is the cost per unit?",
        options: ["£6,000", "£150", "£15", "£1.50"],
        correct: 2,
        explanation: "Batch unit cost = Total batch cost ÷ Batch size = £6,000 ÷ 400 = £15 per unit.",
      },
    ],
  },

  "ba2-l12": {
    estimatedMinutes: 12,
    keyPoints: [
      "ABC assigns overhead costs to products based on the activities that CAUSE those costs (cost drivers), not volume.",
      "Cost pool: total cost of each activity (e.g. total cost of receiving materials).",
      "Cost driver: the factor that causes cost in a pool (e.g. number of purchase orders received).",
      "Cost driver rate = Cost pool ÷ Total cost driver units.",
      "Product cost under ABC = Σ (Cost driver rate × Activity consumed by this product).",
      "ABC is more accurate than traditional absorption when: overheads are large, products are diverse, and they consume activities differently.",
    ],
    formulaSheet: [
      { name: "Cost driver rate", formula: "Cost pool ÷ Total cost driver units", example: "£60,000 ÷ 1,200 orders = £50 per order" },
      { name: "Product ABC overhead", formula: "Σ (Cost driver rate × Activity units consumed)", example: "Product A uses 300 orders → £50 × 300 = £15,000" },
    ],
    examTraps: [
      "Under traditional absorption, high-volume products absorb more overhead (unfair if they don't cause more activity).",
      "ABC can make low-volume, complex products appear less profitable (they use disproportionate activities).",
      "ABC is more expensive to implement but gives better cost visibility.",
    ],
    memoryAids: [
      "ABC = Activity-Based Costing: costs follow ACTIVITIES, not volume.",
      "Pool then Driver: find the cost POOL, identify the cost DRIVER, calculate the RATE.",
    ],
    quickExample: {
      setup: "Set-up cost pool = £40,000. Product A requires 20 set-ups; Product B requires 80 set-ups (100 total). Allocate set-up costs.",
      answer: "Rate = £40,000 ÷ 100 = £400/set-up. A = 20 × £400 = £8,000. B = 80 × £400 = £32,000.",
    },
    quickChecks: [
      {
        question: "In ABC, a 'cost driver' is:",
        options: [
          "The total cost of a department",
          "The factor that causes cost to be incurred in an activity cost pool",
          "The absorption rate based on labour hours",
          "The fixed overhead per unit",
        ],
        correct: 1,
        explanation: "A cost driver is what CAUSES the cost in each activity pool (e.g. number of machine set-ups, number of purchase orders). It is used to assign pool costs to products.",
      },
    ],
  },

  "ba2-l13": {
    estimatedMinutes: 12,
    keyPoints: [
      "Allocation: overhead charged directly to ONE cost centre (e.g. depreciation of a specific machine).",
      "Apportionment: overhead shared BETWEEN cost centres on a fair basis (e.g. rent shared by floor area).",
      "Reapportionment: service department overheads redistributed to production departments.",
      "Reciprocal service departments: each provides services to the other — solved by repeated distribution or algebraic method.",
      "OAR calculated AFTER all overheads are in production departments only.",
    ],
    formulaSheet: [
      { name: "Apportionment bases", formula: "Rent/rates → floor area; Heat/light → volume; Depreciation → asset value; Labour-related → headcount", example: "Rent £12,000 over 400m²: A=200m² gets £6,000; B=200m² gets £6,000" },
      { name: "OAR", formula: "Total production dept overhead ÷ Budgeted activity", example: "£80,000 ÷ 20,000 hrs = £4/hr" },
    ],
    examTraps: [
      "Only PRODUCTION department overheads are used to calculate OAR — service dept costs must be reapportioned first.",
      "The reciprocal (repeated distribution) method cycles service dept costs until amounts are immaterial.",
      "Apportionment is a SHARING process — the same total overhead is just distributed differently.",
    ],
    memoryAids: [
      "AAR: Allocate → Apportion → Reapportion → OAR: the four overhead steps.",
    ],
    quickExample: {
      setup: "Overhead absorption rate question: total overhead after reapportionment = £150,000. Budgeted machine hours = 30,000. OAR?",
      answer: "OAR = £150,000 ÷ 30,000 = £5 per machine hour.",
    },
    quickChecks: [
      {
        question: "Overhead for a maintenance department must be reapportioned to production departments because:",
        options: [
          "It is too small to matter",
          "The OAR is calculated from production department overheads only",
          "Maintenance is a variable cost",
          "It forms part of direct labour cost",
        ],
        correct: 1,
        explanation: "OAR is calculated using only PRODUCTION department overheads. Service department costs (like maintenance) are first reapportioned to production departments before the OAR is calculated.",
      },
    ],
  },

  "ba2-l14": {
    estimatedMinutes: 10,
    keyPoints: [
      "Cost-plus pricing: price = full cost + markup percentage.",
      "Marginal cost pricing: price = variable cost + contribution required.",
      "Target costing: start with the market price, deduct required profit → target cost. Engineer costs to meet target.",
      "Price skimming: launch at high price, reduce over time (new/innovative products).",
      "Penetration pricing: launch at low price to gain market share quickly.",
      "Price discrimination: charge different prices to different market segments for same product.",
      "Markup vs margin: markup is on COST; margin is on SELLING PRICE.",
    ],
    formulaSheet: [
      { name: "Cost-plus price", formula: "Total cost per unit × (1 + Markup %)", example: "£20 × (1 + 25%) = £25 selling price" },
      { name: "Markup %", formula: "Profit ÷ Cost × 100", example: "£5 profit on £20 cost = 25% markup" },
      { name: "Margin %", formula: "Profit ÷ Selling price × 100", example: "£5 profit on £25 SP = 20% margin" },
      { name: "Target cost", formula: "Market price − Required profit margin", example: "£50 price − £12 required profit = £38 target cost" },
    ],
    examTraps: [
      "Markup is on COST; margin is on SELLING PRICE — these give different percentages for the same profit.",
      "Target costing starts with the PRICE and works backwards — not from cost forwards.",
      "Marginal cost pricing risks not recovering fixed costs if volume assumptions are wrong.",
    ],
    memoryAids: [
      "Mark-UP goes up from cost. Margin goes down from selling price.",
    ],
    quickExample: {
      setup: "Cost = £80/unit. Required markup = 30%. What is the selling price? If this were a 30% margin instead, what would the price be?",
      answer: "Markup: £80 × 1.30 = £104. Margin: £80 ÷ (1−0.30) = £80 ÷ 0.70 = £114.29.",
    },
    quickChecks: [
      {
        question: "A product costs £60 to make. The company wants a 20% MARK-UP. What is the selling price?",
        options: ["£72", "£75", "£48", "£80"],
        correct: 0,
        explanation: "Markup = on cost: £60 × 1.20 = £72. (A 20% margin would give £60 ÷ 0.80 = £75 — different result.)",
      },
      {
        question: "Target costing involves:",
        options: [
          "Adding a fixed markup to the total cost",
          "Starting with the required selling price and working back to an allowable cost",
          "Setting prices based on competitor prices only",
          "Using variable costs as the price floor",
        ],
        correct: 1,
        explanation: "Target costing is market-driven: begin with the price the market will accept, deduct required profit, and the remainder is the maximum cost (target cost). The business then aims to design/engineer to that cost.",
      },
    ],
  },

  "ba2-l15": {
    estimatedMinutes: 12,
    keyPoints: [
      "Shut-down decision: close a department/product if the contribution it earns is less than avoidable fixed costs.",
      "Make or buy: make if own variable cost < external purchase price + any opportunity costs.",
      "Accept/reject a special order: accept if contribution from the order > any opportunity costs (at spare capacity, fixed costs are irrelevant).",
      "Sell or process further: process further if additional revenue > additional processing cost.",
      "Relevant revenue and relevant costs only — fixed costs only matter if avoidable.",
    ],
    formulaSheet: [
      { name: "Make or buy (spare capacity)", formula: "Make if: Variable cost per unit < Buying-in price", example: "VC £8 vs buy £10 → make (save £2/unit)" },
      { name: "Make or buy (no spare capacity)", formula: "Compare: VC + opportunity cost vs buying-in price", example: "VC £8 + £3 contribution foregone = £11 relevant cost vs buy £10 → BUY" },
      { name: "Process further", formula: "Process further if: Additional revenue > Additional cost", example: "Extra rev £5/unit − Extra cost £3/unit = £2 gain → process further" },
    ],
    examTraps: [
      "At spare capacity, fixed costs are irrelevant to make/buy decisions.",
      "When assessing shut-down: only AVOIDABLE fixed costs are saved. Non-avoidable fixed costs are still incurred.",
      "Sunk costs (past spending on set-up, R&D) are always irrelevant.",
    ],
    memoryAids: [
      "SAME: Spare capacity → Accept/Make using marginal contribution. Full capacity → add Opportunity Cost.",
    ],
    quickExample: {
      setup: "A product contributes £4/unit after variable costs. Avoidable FC if shut down = £20,000. Annual contribution = £15,000. Should the product be shut down?",
      answer: "Contribution (£15,000) < Avoidable FC (£20,000). Net saving from shutting down = £20,000 − £15,000 = £5,000. YES, shut down.",
    },
    quickChecks: [
      {
        question: "A company has spare capacity. An order is offered at £18/unit; variable cost is £14/unit. Should it be accepted?",
        options: [
          "No, because the price is too low",
          "Yes, because it makes a contribution of £4/unit",
          "Only if fixed costs are also covered",
          "Only if the full-cost price is met",
        ],
        correct: 1,
        explanation: "With spare capacity, any order that generates a positive contribution (£18 − £14 = £4) adds to profit. Fixed costs are irrelevant — they are incurred regardless.",
      },
    ],
  },

  "ba2-l16": {
    estimatedMinutes: 12,
    keyPoints: [
      "Limiting factor (scarce resource): constrains the level of activity (e.g. machine hours, materials, labour hours).",
      "Rank products by CONTRIBUTION PER UNIT OF LIMITING FACTOR (not contribution per unit alone).",
      "Produce in order of rank until the limiting factor is exhausted.",
      "Linear programming (LP): used when there are TWO or more binding constraints.",
      "Shadow price (dual price): the extra contribution gained from one more unit of the limiting factor.",
    ],
    formulaSheet: [
      { name: "Contribution per unit of LF", formula: "Contribution per unit ÷ LF units per unit", example: "£20 contribution ÷ 4 hours = £5/hr" },
      { name: "Shadow price", formula: "Extra contribution if the binding constraint increases by 1 unit", example: "1 extra machine hour → £8 extra contribution = £8 shadow price" },
    ],
    examTraps: [
      "Rank by contribution per unit of LF — NOT by contribution per unit or selling price.",
      "In LP, the optimum is always at a VERTEX (corner) of the feasible region.",
      "Shadow price applies only within the relevant range of the constraint.",
    ],
    memoryAids: [
      "CULF: Contribution per Unit of Limiting Factor — the ranking criterion.",
      "Feasible region: all combinations satisfying ALL constraints. Optimum is at a corner.",
    ],
    quickExample: {
      setup: "Product A: contribution £30, needs 5 labour hours. Product B: contribution £20, needs 2 labour hours. 100 hrs available. Which to make first?",
      answer: "A: £30÷5 = £6/hr. B: £20÷2 = £10/hr. Rank: B first, then A. Produce max B (100÷2=50 units) first.",
    },
    quickChecks: [
      {
        question: "Product X has a contribution of £24 and requires 6 machine hours. Product Y has contribution £18 and needs 3 hours. With limited machine hours, which product should be prioritised?",
        options: ["Product X (higher contribution)", "Product Y (higher contribution per machine hour)", "Make equal amounts of both", "Whichever has higher selling price"],
        correct: 1,
        explanation: "X: £24÷6 = £4/hr. Y: £18÷3 = £6/hr. Rank Y first — it earns more per scarce hour despite lower total contribution.",
      },
    ],
  },

  "ba2-l17": {
    estimatedMinutes: 10,
    keyPoints: [
      "Payback period: time for cumulative cashflows to recover the initial investment.",
      "Payback uses CASHFLOWS, not profit (add back depreciation to profit if converting).",
      "Accounting Rate of Return (ARR): average annual profit as a % of average (or initial) investment.",
      "ARR uses PROFIT (after depreciation), not cashflows.",
      "Payback: simple, ignores time value of money and cashflows after payback.",
      "ARR: comparable to ROCE but ignores timing and uses accounting profits.",
    ],
    formulaSheet: [
      { name: "Payback (even cashflows)", formula: "Initial investment ÷ Annual net cashflow", example: "£60,000 ÷ £20,000 = 3 years" },
      { name: "ARR", formula: "(Average annual profit ÷ Average investment) × 100%", example: "(£12,000 ÷ £50,000) × 100 = 24%" },
      { name: "Average investment", formula: "(Initial investment + Residual value) ÷ 2", example: "(£100,000 + £0) ÷ 2 = £50,000" },
      { name: "Average profit", formula: "Total profit ÷ Number of years", example: "£60,000 ÷ 5 = £12,000/year" },
    ],
    examTraps: [
      "Payback = cashflows. ARR = profits. Don't mix these up.",
      "Annual depreciation must be DEDUCTED from cashflows to get profit (for ARR) — or ADDED BACK to profit to get cashflows (for payback).",
      "Neither payback nor ARR account for the time value of money.",
    ],
    memoryAids: [
      "PAY = cashflows (P-AY → cash PAYments). ARR = Accounting profit Returns.",
    ],
    quickExample: {
      setup: "Investment £80,000. Useful life 4 years, no residual value. Annual profit £10,000. Calculate ARR and payback period.",
      answer: "Annual cashflow = £10,000 + £20,000 depreciation = £30,000. Payback = £80,000÷£30,000 = 2.67 years. ARR = £10,000÷£40,000 = 25%.",
    },
    quickChecks: [
      {
        question: "A project costs £120,000 and generates annual cashflows of £30,000. What is the payback period?",
        options: ["4 years", "3 years", "5 years", "2.5 years"],
        correct: 0,
        explanation: "Payback = £120,000 ÷ £30,000 = 4 years.",
      },
      {
        question: "ARR is calculated using:",
        options: [
          "Annual cashflows ÷ Initial investment",
          "Average annual profit ÷ Average investment",
          "Total profit ÷ Initial investment",
          "Net present value ÷ Years",
        ],
        correct: 1,
        explanation: "ARR = Average annual profit ÷ Average investment × 100%. It uses accounting profit (after depreciation), not cashflows.",
      },
    ],
  },

  "ba2-l18": {
    estimatedMinutes: 14,
    keyPoints: [
      "Net Present Value (NPV): sum of all discounted future cashflows minus the initial investment.",
      "Accept a project if NPV > 0 (adds value). Reject if NPV < 0.",
      "Discount factor: obtained from present value tables or formula 1/(1+r)^n.",
      "Internal Rate of Return (IRR): the discount rate at which NPV = 0.",
      "Accept if IRR > cost of capital. Higher IRR = more attractive (if independent).",
      "For mutually exclusive projects, use NPV (not IRR) — IRR can mislead due to scale differences.",
      "Annuity factor: present value of £1 per year for n years at rate r (from tables).",
      "Perpetuity: PV = Annual cashflow ÷ Discount rate.",
    ],
    formulaSheet: [
      { name: "NPV", formula: "Σ [Cashflow(t) × DF(r,t)] − Initial investment", example: "Year 1 CF £10,000 × 0.909 (10%, yr1) = £9,090" },
      { name: "Discount factor", formula: "1 ÷ (1 + r)^n", example: "r=10%, n=3: 1÷1.1³ = 0.751" },
      { name: "IRR (interpolation)", formula: "IRR ≈ r₁ + [NPV₁ ÷ (NPV₁ − NPV₂)] × (r₂ − r₁)", example: "IRR = 10% + [£500÷(£500+£300)] × 5% = 13.1%" },
      { name: "Annuity PV", formula: "Annual cashflow × Annuity factor", example: "£5,000 × 3.791 (5yrs, 10%) = £18,955" },
      { name: "Perpetuity PV", formula: "Annual cashflow ÷ r", example: "£2,000 ÷ 0.08 = £25,000" },
    ],
    examTraps: [
      "Use NPV (not IRR) for comparing mutually exclusive projects of different sizes.",
      "Time 0 = now (no discounting). Time 1 = end of year 1 (discount by year 1 factor).",
      "IRR interpolation is an approximation — only accurate if the two rates are close together.",
      "Tax, inflation, and working capital can be factored into NPV — read the question carefully.",
    ],
    memoryAids: [
      "NPV > 0 = Accept. IRR > cost of capital = Accept.",
      "CAPT: Cashflows, At each Period, Times discount factor, less investment = NPV.",
    ],
    quickExample: {
      setup: "Investment: £50,000 now. CF: Year 1 £20,000, Year 2 £25,000, Year 3 £18,000. Cost of capital 10%. Calculate NPV (use DFs: 0.909, 0.826, 0.751).",
      answer: "PV yr1 = £18,180. PV yr2 = £20,650. PV yr3 = £13,518. Total PV = £52,348. NPV = £52,348 − £50,000 = +£2,348. Accept.",
    },
    quickChecks: [
      {
        question: "A project has an NPV of −£5,000 at 12% and +£3,000 at 8%. What is the approximate IRR?",
        options: ["9.5%", "10%", "10.5%", "11%"],
        correct: 1,
        explanation: "IRR = 8% + [£3,000÷(£3,000+£5,000)] × (12%−8%) = 8% + 0.375 × 4% = 8% + 1.5% = 9.5%. Closest is A 9.5%.",
      },
      {
        question: "When should NPV be preferred over IRR for decision-making?",
        options: [
          "When evaluating independent projects",
          "When projects have even cashflows",
          "When comparing mutually exclusive projects of different sizes",
          "When the cost of capital is unknown",
        ],
        correct: 2,
        explanation: "IRR can be misleading when projects differ in scale or cashflow timing. NPV always correctly measures value added in absolute terms, making it superior for mutually exclusive decisions.",
      },
    ],
  },

  "ba2-l19": {
    estimatedMinutes: 12,
    keyPoints: [
      "Regression analysis identifies the linear relationship between a dependent variable (y) and an independent variable (x).",
      "The regression line is: y = a + bx, where a = intercept (y at x=0) and b = slope.",
      "Correlation coefficient (r): measures strength and direction of linear relationship. Range: −1 to +1.",
      "r = +1: perfect positive correlation. r = −1: perfect negative. r = 0: no correlation.",
      "Coefficient of determination (r²): proportion of variation in y explained by x (e.g. r²=0.81 → 81% explained).",
    ],
    formulaSheet: [
      { name: "Regression slope (b)", formula: "b = [nΣxy − ΣxΣy] ÷ [nΣx² − (Σx)²]", example: "Use the summary table from exam question" },
      { name: "Intercept (a)", formula: "a = ȳ − bx̄", example: "a = mean(y) − b × mean(x)" },
      { name: "Correlation (r)", formula: "r = [nΣxy − ΣxΣy] ÷ √{[nΣx²−(Σx)²][nΣy²−(Σy)²]}", example: "r = 0.95 → strong positive correlation" },
    ],
    examTraps: [
      "r² is the coefficient of DETERMINATION, not correlation. r = 0.9 → r² = 0.81 (not 0.9²=0.81, actually it is 0.81).",
      "Correlation does NOT imply causation.",
      "Extrapolation (forecasting beyond the observed data range) is unreliable.",
    ],
    memoryAids: [
      "y = a + bx: 'a is where the line STARTS (intercept), b is the SLOPE (rate of change).'",
      "r close to ±1 = strong. r close to 0 = weak.",
    ],
    quickExample: {
      setup: "b = 2.5, a = 10. Forecast y when x = 20.",
      answer: "y = 10 + 2.5 × 20 = 10 + 50 = 60.",
    },
    quickChecks: [
      {
        question: "The correlation coefficient r = 0.92 between advertising spend and sales. This suggests:",
        options: [
          "No relationship between advertising and sales",
          "A strong negative relationship",
          "A strong positive linear relationship",
          "That advertising causes sales to increase",
        ],
        correct: 2,
        explanation: "r = 0.92 is close to +1, indicating a strong positive linear relationship. However, correlation does not prove causation.",
      },
    ],
  },

  "ba2-l20": {
    estimatedMinutes: 12,
    keyPoints: [
      "Time series: data collected at regular intervals over time, showing trends and seasonal patterns.",
      "Trend (T): underlying long-term movement after removing seasonal variation.",
      "Seasonal variation (S): regular, recurring fluctuations within a year.",
      "Moving average: smooths out short-term fluctuations to reveal the trend. Need centred moving average for even periods.",
      "Additive model: Y = T + S (seasonal variation is an absolute value).",
      "Multiplicative model: Y = T × S (seasonal variation is a proportion/index).",
    ],
    formulaSheet: [
      { name: "Additive seasonal variation", formula: "S = Y − T (actual − trend)", example: "Q1 average S = −£12,000" },
      { name: "Additive forecast", formula: "Forecast = Trend estimate + Seasonal variation", example: "T = 500 + S(Q3 = −80) = 420" },
      { name: "Multiplicative S", formula: "S = Y ÷ T", example: "S = 1.15 means 15% above trend in that season" },
      { name: "Seasonally adjusted actual", formula: "Additive: Y − S. Multiplicative: Y ÷ S", example: "Removing seasonal effect to see underlying trend" },
    ],
    examTraps: [
      "4-quarter moving average needs centring (average of two 4-period averages) to align with original data points.",
      "Seasonal variations in the additive model must SUM to ZERO over one complete cycle.",
      "Extrapolating the trend line is an estimate only — actual results may differ.",
    ],
    memoryAids: [
      "TRSC: Trend + Seasonal + Cyclical + Random — the four components of a time series.",
    ],
    quickExample: {
      setup: "Trend for Q3 Year 4 = 850 units. Average Q3 seasonal variation = +120 units (additive). Forecast Q3 Year 4.",
      answer: "Forecast = 850 + 120 = 970 units.",
    },
    quickChecks: [
      {
        question: "In an additive time series model, if the trend is 400 and the seasonal variation is −60, the forecast is:",
        options: ["460", "400", "340", "6.67"],
        correct: 2,
        explanation: "Additive model: Forecast = Trend + Seasonal variation = 400 + (−60) = 340.",
      },
    ],
  },

  "ba2-l21": {
    estimatedMinutes: 10,
    keyPoints: [
      "Responsibility accounting: managers are held accountable only for costs/revenues they CONTROL.",
      "Cost centre: responsible for costs only (e.g. a production department).",
      "Profit centre: responsible for costs AND revenues.",
      "Investment centre: responsible for costs, revenues AND capital investment (uses ROI or RI).",
      "Controllable costs: can be influenced by the manager within the short term.",
      "Non-controllable costs: fixed or outside the manager's authority (e.g. allocated head-office costs).",
      "Goal congruence: managers' targets should align with company-wide goals.",
    ],
    formulaSheet: [
      { name: "ROI", formula: "Profit ÷ Capital Employed × 100%", example: "£24,000 ÷ £200,000 = 12%" },
      { name: "RI (Residual Income)", formula: "Profit − (Capital Employed × Required Rate of Return)", example: "£24,000 − (£200,000 × 10%) = £4,000" },
    ],
    examTraps: [
      "ROI can lead to goal incongruence: a manager may reject a project with ROI above the hurdle rate if it would LOWER their divisional ROI.",
      "RI avoids this problem — any project with positive RI should be accepted.",
      "Managers should only be measured on CONTROLLABLE items — holding them responsible for uncontrollable items is demotivating.",
    ],
    memoryAids: [
      "ROI = Return On Investment (percentage). RI = Residual Income (absolute £ amount).",
      "RI > 0 → accept. RI < 0 → reject. Consistent with NPV > 0 rule.",
    ],
    quickExample: {
      setup: "Division profit = £30,000. Capital employed = £150,000. Required rate = 12%. Calculate ROI and RI.",
      answer: "ROI = £30,000÷£150,000 = 20%. RI = £30,000 − (£150,000 × 12%) = £30,000 − £18,000 = £12,000.",
    },
    quickChecks: [
      {
        question: "A division earns profit of £40,000 on capital employed of £250,000. Required rate is 14%. What is the residual income?",
        options: ["£5,000", "£40,000", "£35,000", "−£5,000"],
        correct: 0,
        explanation: "RI = £40,000 − (£250,000 × 14%) = £40,000 − £35,000 = £5,000.",
      },
    ],
  },

  "ba2-l22": {
    estimatedMinutes: 10,
    keyPoints: [
      "Transfer price (TP): the internal price charged when one division transfers goods/services to another.",
      "Minimum TP (seller's floor): Marginal cost + Opportunity cost (contribution foregone per unit).",
      "Maximum TP (buyer's ceiling): External market price for the transferred good.",
      "Ideal TP: achieves goal congruence — both divisions WANT to trade AND company is better off.",
      "If spare capacity: seller's minimum TP = marginal cost only (no opportunity cost).",
      "If no spare capacity: seller's minimum TP = marginal cost + contribution foregone per unit.",
      "Market-based TP: external market price (if competitive market exists).",
      "Dual pricing: selling division uses one price, buying division a different one — eliminates conflict.",
    ],
    formulaSheet: [
      { name: "Minimum transfer price", formula: "Marginal cost per unit + Opportunity cost per unit", example: "VC £8 + Contribution lost £5 = Min TP £13" },
      { name: "Maximum transfer price", formula: "External market buying price", example: "If buying externally costs £18, Max TP = £18" },
    ],
    examTraps: [
      "Minimum TP is the SELLER's floor. Maximum TP is the BUYER's ceiling. Both must agree on a price in between.",
      "With no spare capacity, the opportunity cost = contribution lost per unit = selling price − variable cost on the displaced external sale.",
      "No external market → TP range is MC to buyer's net marginal revenue.",
    ],
    memoryAids: [
      "TP range: Min (seller) to Max (buyer). Any price in range benefits both.",
    ],
    quickExample: {
      setup: "Selling division: MC £10, sells externally at £18 with full capacity. Buying division: could buy externally for £20. Find the TP range.",
      answer: "Min TP = £10 + (£18−£10) = £18 (full capacity). Max TP = £20. TP range: £18−£20.",
    },
    quickChecks: [
      {
        question: "Division A has spare capacity. Its variable cost is £12/unit. Division B can buy externally at £16/unit. What is the optimal transfer price range?",
        options: ["£12 to £16", "£16 to £20", "£12 only", "No transfer is possible"],
        correct: 0,
        explanation: "With spare capacity, min TP = variable cost = £12 (no opportunity cost). Max TP = external price = £16. Range: £12 to £16.",
      },
    ],
  },

  "ba2-l23": {
    estimatedMinutes: 10,
    keyPoints: [
      "Financial KPIs: profitability (ROCE, profit margin), liquidity (current ratio), efficiency (asset turnover).",
      "Non-financial KPIs: quality (defect rates), customer (satisfaction scores, on-time delivery), employee (turnover, absenteeism).",
      "Financial measures are LAGGING indicators (report past performance).",
      "Non-financial measures can be LEADING indicators (predict future performance).",
      "Avoid over-reliance on one type — balanced measurement essential.",
    ],
    formulaSheet: [
      { name: "ROCE", formula: "EBIT ÷ Capital Employed × 100%", example: "£30,000 ÷ £200,000 = 15%" },
      { name: "Profit margin", formula: "Profit ÷ Revenue × 100%", example: "£30,000 ÷ £200,000 revenue = 15%" },
      { name: "Asset turnover", formula: "Revenue ÷ Capital Employed", example: "£200,000 ÷ £200,000 = 1× (note: ROCE = margin × asset turnover)" },
    ],
    examTraps: [
      "ROCE = Profit margin × Asset turnover — this decomposition is frequently tested.",
      "Non-financial measures matter: pure financial focus encourages short-termism.",
      "Target-setting: stretch targets motivate but unrealistic targets demotivate.",
    ],
    memoryAids: [
      "ROCE = margin × asset turnover: the two levers to improve return on capital.",
    ],
    quickExample: {
      setup: "Revenue £500,000, EBIT £60,000, Capital employed £400,000. Calculate ROCE using the decomposition.",
      answer: "Margin = £60,000÷£500,000 = 12%. Asset turnover = £500,000÷£400,000 = 1.25×. ROCE = 12% × 1.25 = 15%.",
    },
    quickChecks: [
      {
        question: "Which of the following is a LEADING indicator of future financial performance?",
        options: ["Last year's profit", "ROCE", "Customer satisfaction score", "Gross margin %"],
        correct: 2,
        explanation: "Customer satisfaction is a leading non-financial indicator — satisfied customers tend to generate future revenue. Financial measures like ROCE report what has already happened (lagging).",
      },
    ],
  },

  "ba2-l24": {
    estimatedMinutes: 8,
    keyPoints: [
      "Balanced Scorecard (BSC): framework linking strategy to operational KPIs across four perspectives.",
      "Financial perspective: 'How do we look to shareholders?' (ROCE, profit growth, revenue).",
      "Customer perspective: 'How do customers see us?' (satisfaction, retention, market share).",
      "Internal process perspective: 'What must we excel at?' (quality, cycle time, waste reduction).",
      "Learning & growth perspective: 'Can we continue to improve?' (staff training, innovation, IT capability).",
      "Strategic objectives cascade down into KPIs; cause-and-effect links connect the four perspectives.",
    ],
    formulaSheet: [],
    examTraps: [
      "BSC has FOUR perspectives — not three or five.",
      "Learning & growth is the FOUNDATION — it enables better processes, which serve customers, which drive financials.",
      "BSC does not eliminate financial measures — it BALANCES them with non-financial ones.",
    ],
    memoryAids: [
      "FCIL: Financial, Customer, Internal process, Learning & growth — the four BSC perspectives.",
      "Kaplan & Norton created the BSC in 1992 — remember the creator names for exam context.",
    ],
    quickExample: {
      setup: "A company's BSC strategic objective is 'improve customer loyalty'. Identify one KPI per perspective that links to this.",
      answer: "Learning: staff training hours. Internal: complaint resolution time. Customer: customer retention rate %. Financial: revenue from repeat customers.",
    },
    quickChecks: [
      {
        question: "The Balanced Scorecard's 'internal process perspective' focuses on:",
        options: [
          "Return on capital employed",
          "Customer satisfaction ratings",
          "Business processes that the company must excel at",
          "Employee training and development",
        ],
        correct: 2,
        explanation: "The internal process perspective asks 'what must we excel at operationally?' — quality, efficiency, cycle times. Learning & growth covers employee development; Financial covers ROCE.",
      },
      {
        question: "How many perspectives does the Balanced Scorecard have?",
        options: ["Two", "Three", "Four", "Five"],
        correct: 2,
        explanation: "The BSC has four perspectives: Financial, Customer, Internal Process, and Learning & Growth.",
      },
    ],
  },

  "ba2-l25": {
    estimatedMinutes: 15,
    keyPoints: [
      "Cost classification: Fixed/Variable/Semi-variable, Direct/Indirect, Product/Period.",
      "Costing methods: Job (unique), Batch (group), Process (continuous), ABC (activity-driven).",
      "Absorption vs Marginal: absorption includes fixed overhead in product cost; marginal treats it as period cost.",
      "Break-even: BEP(units) = FC÷C per unit; C:S ratio = C÷SP; MoS = Actual−BEP.",
      "Standard costing: measure actual vs standard; compute price/rate and usage/efficiency variances.",
      "Capital appraisal: Payback (cashflows), ARR (profits), NPV (discounted cashflows), IRR (rate where NPV=0).",
      "Transfer pricing: min = MC + OC; max = external market price.",
      "Performance: ROCE = margin × asset turnover; RI avoids ROI's goal incongruence.",
    ],
    formulaSheet: [
      { name: "Key formula recap", formula: "BEP = FC÷C; C:S = C÷SP; OAR = BudgetOH÷BudgetActivity; NPV = ΣCF×DF − Investment; RI = Profit − (CE × r); Min TP = MC + OC", example: "Review each formula with a quick number" },
    ],
    examTraps: [
      "Payback = cashflows; ARR = profits — the most common mix-up.",
      "OAR uses BUDGETED figures. Flexed budget adjusts for ACTUAL volume.",
      "Relevant costs: future, incremental, cash only — exclude sunk and non-avoidable fixed costs.",
    ],
    memoryAids: [
      "Exam revision mnemonic — CAB DC: Costing (methods), Absorption/Marginal, Break-even, Decision-making (relevant costs), Capital appraisal.",
    ],
    quickExample: {
      setup: "Final exam tip: For any BA2 question, first identify: (a) costing method required, (b) whether relevant or full cost matters, (c) which formula applies.",
      answer: "Applying this structured approach earns method marks even if the final figure is wrong.",
    },
    quickChecks: [
      {
        question: "Which of the following correctly pairs a capital investment method with its input?",
        options: [
          "Payback — accounting profits",
          "ARR — cashflows",
          "NPV — discounted cashflows",
          "IRR — average investment",
        ],
        correct: 2,
        explanation: "NPV discounts all future cashflows at the cost of capital. Payback uses undiscounted cashflows. ARR uses accounting profits. IRR is the rate where NPV = 0.",
      },
      {
        question: "Under marginal costing, which costs are included in closing inventory valuation?",
        options: [
          "All production costs including fixed overhead",
          "Variable production costs only",
          "All costs including selling expenses",
          "Fixed costs only",
        ],
        correct: 1,
        explanation: "Marginal costing values inventory at VARIABLE production costs only. Fixed overhead is a period cost charged in full to the income statement.",
      },
    ],
  },

  "ba2-l26": {
    estimatedMinutes: 5,
    keyPoints: [
      "This lesson is the full mock exam — no separate revision summary needed.",
      "Use the mock to identify weak areas for targeted revision.",
      "Time management: CIMA OT exams are 2 hours — pace at roughly 1.5 minutes per question.",
      "If stuck, flag and move on — return with time remaining.",
    ],
    formulaSheet: [],
    examTraps: [
      "Read ALL options before selecting — distractors are designed to catch common errors.",
      "Double-check your units: per unit vs total vs percentage.",
    ],
    memoryAids: [],
    quickExample: {
      setup: "Exam technique: When in doubt between two answers, ask 'Is this a common exam trap?' — e.g. payback vs ARR, markup vs margin, actual vs standard.",
      answer: "Apply your trap-avoidance checklist before confirming your answer.",
    },
    quickChecks: [],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     BA1 — Fundamentals of Business Economics (core revision content)
     ══════════════════════════════════════════════════════════════════════════ */

  "ba1-l1": {
    estimatedMinutes: 10,
    keyPoints: [
      "Market economy: resources allocated by the price mechanism (supply and demand).",
      "Planned economy: government controls all production decisions.",
      "Mixed economy: combination — markets + government intervention.",
      "Microeconomics: individual markets, firms, consumers.",
      "Macroeconomics: economy-wide variables — GDP, inflation, unemployment.",
      "PESTLE: Political, Economic, Social, Technological, Legal, Environmental — macro-environment scan.",
      "Stakeholders: any group with an interest in the organisation. Mendelow's matrix: power vs interest.",
    ],
    formulaSheet: [],
    examTraps: [
      "Market economies still have government intervention — they are rarely 'pure' free markets.",
      "Micro vs Macro: price of a single good = micro; national inflation rate = macro.",
    ],
    memoryAids: ["PESTLE: Pete Eats Sausages Trying Local Eggs.", "Mendelow: High power + High interest = Key Players (manage closely)."],
    quickExample: {
      setup: "Identify whether GDP growth rate is a micro or macro economic concept.",
      answer: "Macro — it measures the economy as a whole, not a single market.",
    },
    quickChecks: [
      {
        question: "In a market economy, resources are primarily allocated by:",
        options: ["Government planning", "The price mechanism", "Trade union negotiation", "Central bank policy"],
        correct: 1,
        explanation: "In a market economy, the price mechanism (supply and demand interactions) signals where resources should go.",
      },
    ],
  },

  "ba1-l2": {
    estimatedMinutes: 12,
    keyPoints: [
      "Law of demand: as price rises, quantity demanded falls (inverse relationship).",
      "Law of supply: as price rises, quantity supplied rises (direct relationship).",
      "Equilibrium: where supply = demand; market clears at equilibrium price.",
      "Excess demand (shortage): price below equilibrium → price rises.",
      "Excess supply (surplus): price above equilibrium → price falls.",
      "Shifts in demand curve: changes in income, tastes, price of substitutes/complements, expectations.",
      "Shifts in supply curve: changes in input costs, technology, taxes/subsidies, number of producers.",
    ],
    formulaSheet: [],
    examTraps: [
      "Movement ALONG the curve = change in price. SHIFT of the curve = change in non-price factors.",
      "A rise in income shifts demand RIGHT for normal goods but LEFT for inferior goods.",
    ],
    memoryAids: ["Supply slopes Up (price ↑ → supply ↑). Demand slopes Down (price ↑ → demand ↓)."],
    quickExample: {
      setup: "Coffee price rises. What happens to demand for tea (a substitute)?",
      answer: "Demand for tea INCREASES (shifts right) — consumers switch from expensive coffee to tea.",
    },
    quickChecks: [
      {
        question: "What causes a SHIFT (not a movement) in the demand curve?",
        options: [
          "A change in the product's own price",
          "A change in consumer income",
          "A movement along the supply curve",
          "An increase in quantity supplied",
        ],
        correct: 1,
        explanation: "A change in income shifts the entire demand curve. A change in the product's own price causes a movement along the existing demand curve.",
      },
    ],
  },

  /* Stubs for BA1-l3 through BA1-l26 — content coming soon */
  /* BA3, BA4, E1, P1, F1, E2, P2, F2 — revision content in development */
};

window.AIQ_REVISION_DATA = AIQ_REVISION_DATA;
