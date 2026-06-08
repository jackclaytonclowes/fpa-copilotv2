import urllib.request, json, sys

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbnZxaml2YmJ5emV1cmJvbXB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg1MjM1NSwiZXhwIjoyMDk2NDI4MzU1fQ.-TSORpRQBwvoh91eD0jfNDi0pDXuh-tG5wa--pBy1D4"
BASE = "https://kcnvqjivbbyzeurbompv.supabase.co/rest/v1"

def post(table, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(f"{BASE}/{table}", data=body, headers={
        "apikey": TOKEN, "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json", "Prefer": "resolution=ignore-duplicates",
    }, method="POST")
    try:
        with urllib.request.urlopen(req) as r: return r.status
    except urllib.error.HTTPError as e: return f"ERR {e.code}: {e.read().decode()[:200]}"

# ═══════════════════════════════════════════════════════════════════
# BA2 LESSONS
# ═══════════════════════════════════════════════════════════════════

ba2_lessons = [
  {
    "id": "ba200000-0001-0001-0000-000000000000",
    "module_id": "ba200000-0001-0000-0000-000000000000",
    "title": "Understanding Cost Classification",
    "order_index": 1, "xp_reward": 10, "estimated_minutes": 5, "is_published": True,
    "content": [
      {"type":"intro","emoji":"📦","heading":"Understanding Cost Classification","body":"Before we can control or reduce costs, we need to understand how to classify them. Management accountants use different classification bases depending on whether the purpose is product costing, decision making, or performance control."},
      {"type":"explanation","heading":"Direct vs Indirect Costs","body":"Direct costs can be traced specifically to a unit of output. Indirect costs (overheads) cannot be traced to any single unit.","key_terms":[{"term":"Direct cost","definition":"A cost traceable exclusively to a specific unit of output. Examples: direct materials, direct labour."},{"term":"Indirect cost (overhead)","definition":"Cannot be traced to a single unit. Must be allocated. Examples: factory rent, supervisor wages."},{"term":"Prime cost","definition":"Total of all direct costs: Direct materials + Direct labour + Direct expenses."}]},
      {"type":"explanation","heading":"Product Costs vs Period Costs","body":"Product costs are attached to units and remain in inventory until sold. Period costs are written off immediately.","key_terms":[{"term":"Product cost","definition":"Forms part of inventory value. Under absorption costing, includes fixed production overheads."},{"term":"Period cost","definition":"Charged to the income statement in the period incurred. Includes selling, distribution, and admin costs."}]},
      {"type":"table","heading":"Cost Classification Summary","headers":["Basis","Categories","Example"],"rows":[["Traceability","Direct / Indirect","Direct: timber in a chair. Indirect: factory insurance."],["Function","Production / Non-production","Production: assembly wages. Non-production: sales salary."],["Behaviour","Fixed / Variable / Semi-variable","Fixed: rent. Variable: raw materials."],["Timing","Product / Period","Product: manufacturing labour. Period: advertising."]]}
    ]
  },
  {
    "id": "ba200000-0001-0002-0000-000000000000",
    "module_id": "ba200000-0001-0000-0000-000000000000",
    "title": "Cost Behaviour and the High-Low Method",
    "order_index": 2, "xp_reward": 10, "estimated_minutes": 6, "is_published": True,
    "content": [
      {"type":"intro","emoji":"📈","heading":"How Costs Behave","body":"Understanding how costs change as output changes is fundamental to budgeting, pricing, and decision making."},
      {"type":"explanation","heading":"Fixed, Variable, and Semi-Variable Costs","body":"Cost behaviour describes how total cost changes as activity changes.","key_terms":[{"term":"Fixed cost","definition":"Stays constant regardless of activity. Cost per unit falls as output rises. Example: factory rent."},{"term":"Variable cost","definition":"Changes in direct proportion to activity. Cost per unit constant. Example: direct materials."},{"term":"Semi-variable cost","definition":"Has both a fixed and a variable element. Example: electricity bill with standing charge plus usage rate."},{"term":"Relevant range","definition":"The activity range over which cost behaviour assumptions hold."}]},
      {"type":"worked_example","heading":"The High-Low Method","steps":["Separates fixed and variable elements using the highest and lowest activity levels.","High: 8,000 units, total cost £46,000. Low: 4,000 units, total cost £30,000.","Variable cost per unit = (£46,000 - £30,000) / (8,000 - 4,000) = £4 per unit","Fixed cost = £46,000 - (£4 x 8,000) = £14,000","Cost equation: Total cost = £14,000 + £4 per unit"]},
      {"type":"table","heading":"Cost Behaviour Summary","headers":["Type","Total cost as output rises","Cost per unit","Example"],"rows":[["Fixed","Stays constant","Falls","Factory rent"],["Variable","Rises proportionally","Constant","Raw materials"],["Semi-variable","Rises (not proportionally)","Falls","Electricity bill"]]}
    ]
  },
  {
    "id": "ba200000-0001-0003-0000-000000000000",
    "module_id": "ba200000-0001-0000-0000-000000000000",
    "title": "Marginal vs Absorption Costing",
    "order_index": 3, "xp_reward": 15, "estimated_minutes": 7, "is_published": True,
    "content": [
      {"type":"intro","emoji":"⚖️","heading":"Two Costing Approaches","body":"Marginal and absorption costing give different profit figures when inventory levels change, which is a common exam topic."},
      {"type":"explanation","heading":"Marginal Costing","body":"Only variable production costs are included in product cost. Fixed production overheads are period costs.","key_terms":[{"term":"Marginal cost","definition":"The additional cost of producing one extra unit — equals variable production cost per unit."},{"term":"Contribution","definition":"Selling price minus variable cost. First covers fixed costs, then generates profit."},{"term":"Marginal costing profit","definition":"Contribution minus total fixed costs for the period."}]},
      {"type":"explanation","heading":"Absorption Costing","body":"Both variable and fixed production overheads are included in product cost. Required by IAS 2 for external reporting.","key_terms":[{"term":"Overhead Absorption Rate (OAR)","definition":"Budgeted fixed overheads divided by budgeted activity level."},{"term":"Over/under absorption","definition":"Arises when actual activity differs from budgeted."}]},
      {"type":"worked_example","heading":"Reconciling Marginal and Absorption Profits","steps":["When inventory INCREASES: absorption profit is HIGHER (fixed overheads carried in closing inventory).","When inventory DECREASES: absorption profit is LOWER.","Formula: Absorption profit = Marginal profit + (Closing - Opening inventory) x Fixed overhead per unit","Example: Fixed overhead per unit = £3. Inventory up 200 units. Absorption profit = Marginal profit + £600."]}
    ]
  },
  {
    "id": "ba200000-0002-0001-0000-000000000000",
    "module_id": "ba200000-0002-0000-0000-000000000000",
    "title": "Contribution, Breakeven and Margin of Safety",
    "order_index": 1, "xp_reward": 15, "estimated_minutes": 7, "is_published": True,
    "content": [
      {"type":"intro","emoji":"⚖️","heading":"CVP Analysis","body":"Cost-Volume-Profit analysis examines the relationship between costs, volume and profit. The breakeven point is where total revenue equals total costs."},
      {"type":"explanation","heading":"Contribution and the C/S Ratio","body":"Contribution is the foundation of CVP analysis. Once fixed costs are covered, each additional unit becomes profit.","key_terms":[{"term":"Contribution per unit","definition":"Selling price per unit minus variable cost per unit."},{"term":"C/S ratio","definition":"Contribution per unit divided by selling price. Shows the proportion of each £ of revenue that is contribution."},{"term":"Total contribution","definition":"Contribution per unit x Number of units sold."}]},
      {"type":"worked_example","heading":"Breakeven and Margin of Safety","steps":["Given: Selling price £50, Variable cost £30, Fixed costs £80,000.","Contribution per unit = £50 - £30 = £20","C/S ratio = £20 / £50 = 40%","Breakeven (units) = £80,000 / £20 = 4,000 units","Breakeven (revenue) = £80,000 / 0.40 = £200,000","If budgeted sales = 5,500 units: Margin of safety = 1,500 units = 27.3%","Target profit £40,000: (£80,000 + £40,000) / £20 = 6,000 units"]},
      {"type":"table","heading":"CVP Formula Sheet","headers":["Measure","Formula"],"rows":[["Contribution per unit","Selling price - Variable cost per unit"],["C/S ratio","Contribution per unit / Selling price"],["Breakeven (units)","Fixed costs / Contribution per unit"],["Breakeven (revenue)","Fixed costs / C/S ratio"],["Margin of safety (%)","Margin of safety / Budgeted sales x 100"],["Target profit (units)","(Fixed costs + Target profit) / Contribution per unit"]]}
    ]
  },
  {
    "id": "ba200000-0002-0002-0000-000000000000",
    "module_id": "ba200000-0002-0000-0000-000000000000",
    "title": "Limiting Factor Analysis",
    "order_index": 2, "xp_reward": 15, "estimated_minutes": 7, "is_published": True,
    "content": [
      {"type":"intro","emoji":"🔑","heading":"Scarce Resource Decisions","body":"When a resource is in short supply, the business must decide how to allocate it to maximise profit. Rank products by contribution per unit of the limiting factor."},
      {"type":"explanation","heading":"Identifying and Ranking","body":"A limiting factor constrains output. Rank by contribution per unit of the scarce resource, not contribution per unit alone.","key_terms":[{"term":"Limiting factor","definition":"A resource in short supply preventing maximum output. The binding constraint on production."},{"term":"Contribution per unit of limiting factor","definition":"Contribution per unit divided by units of limiting factor required. The ranking criterion."},{"term":"Optimal production plan","definition":"Product mix maximising total contribution given the binding constraint."}]},
      {"type":"worked_example","heading":"Allocating Machine Hours","steps":["Machine hours limited to 3,000. Products X and Y.","Product X: Contribution £18, requires 3 hours. Contribution per hour = £6.","Product Y: Contribution £20, requires 5 hours. Contribution per hour = £4.","Ranking: X first (£6/hr), Y second (£4/hr).","Make 500 X (1,500 hrs), then 300 Y (remaining 1,500 hrs).","Total contribution = (500 x £18) + (300 x £20) = £15,000."]},
      {"type":"explanation","heading":"Shadow Prices","body":"The shadow price is the increase in contribution from one extra unit of the limiting factor.","key_terms":[{"term":"Shadow price","definition":"The maximum extra amount worth paying above normal cost for one additional unit of the scarce resource."}]}
    ]
  },
  {
    "id": "ba200000-0003-0001-0000-000000000000",
    "module_id": "ba200000-0003-0000-0000-000000000000",
    "title": "Budgeting: Purposes and Types",
    "order_index": 1, "xp_reward": 10, "estimated_minutes": 5, "is_published": True,
    "content": [
      {"type":"intro","emoji":"📋","heading":"Why Budget?","body":"A budget is a quantified plan expressed in financial terms, usually covering one year. It is used for planning, control, coordination, and motivation."},
      {"type":"explanation","heading":"The Four Purposes of Budgeting","body":"Budgets serve multiple purposes simultaneously.","key_terms":[{"term":"Planning","definition":"Forces managers to think ahead and set targets. Ensures resources are available."},{"term":"Control","definition":"Actual results compared against budget to identify variances. Corrective action can then be taken."},{"term":"Coordination","definition":"Ensures all departments work towards the same goals."},{"term":"Motivation","definition":"Gives managers targets to aim for. Participation increases commitment."}]},
      {"type":"explanation","heading":"Types of Budget","body":"Different approaches suit different organisations and circumstances.","key_terms":[{"term":"Incremental budget","definition":"Adjusts from prior year. Quick but can perpetuate inefficiencies."},{"term":"Zero-based budget (ZBB)","definition":"Every activity justified from scratch. Eliminates waste but time-consuming."},{"term":"Rolling budget","definition":"New period added as old one ends. Always covers a fixed forward horizon."},{"term":"Participative budget","definition":"Set by budget holders. Increases motivation but risks budget slack."}]},
      {"type":"table","heading":"Budget Types Compared","headers":["Type","Key Feature","Advantage","Disadvantage"],"rows":[["Incremental","Adjusts prior year","Quick and simple","Perpetuates inefficiencies"],["Zero-based","Justify all spending","Eliminates waste","Time-consuming"],["Rolling","Add new period","Always up to date","Requires frequent revision"],["Participative","Set by budget holder","Increases motivation","Risk of budget slack"]]}
    ]
  },
  {
    "id": "ba200000-0003-0002-0000-000000000000",
    "module_id": "ba200000-0003-0000-0000-000000000000",
    "title": "Flexible Budgets and Variance Analysis",
    "order_index": 2, "xp_reward": 15, "estimated_minutes": 7, "is_published": True,
    "content": [
      {"type":"intro","emoji":"🔍","heading":"Making Budgets Meaningful","body":"A flexible budget adjusts expected costs to the actual level of activity, enabling fair comparisons and meaningful variance analysis."},
      {"type":"explanation","heading":"Fixed vs Flexible Budgets","body":"The key distinction is how each type responds to changes in activity.","key_terms":[{"term":"Fixed budget","definition":"Prepared for one planned activity level. Not changed when actual activity differs."},{"term":"Flexible budget","definition":"Adjusted to reflect actual level of activity. Used for control and performance measurement."},{"term":"Expenditure variance","definition":"Flexible budget cost vs actual cost. Isolates cost efficiency, removing the volume effect."}]},
      {"type":"worked_example","heading":"Preparing a Flexible Budget","steps":["Fixed budget: 10,000 units, variable £4/unit, fixed £20,000. Actual: 12,000 units, actual cost £72,000.","Flexible budget at 12,000 units: Variable = 12,000 x £4 = £48,000. Fixed = £20,000 (unchanged). Total = £68,000.","Expenditure variance: £72,000 - £68,000 = £4,000 Adverse.","Note: Comparing to fixed budget (£60,000) gives misleading £12,000 A - £8,000 is just the volume effect."]},
      {"type":"table","heading":"Variance Conventions","headers":["Variance","Favourable","Adverse"],"rows":[["Sales price","Actual > budgeted price","Actual < budgeted price"],["Sales volume","Actual > budgeted volume","Actual < budgeted volume"],["Cost","Actual < budgeted cost","Actual > budgeted cost"]]}
    ]
  },
  {
    "id": "ba200000-0003-0003-0000-000000000000",
    "module_id": "ba200000-0003-0000-0000-000000000000",
    "title": "Standard Costing and Key Variances",
    "order_index": 3, "xp_reward": 15, "estimated_minutes": 8, "is_published": True,
    "content": [
      {"type":"intro","emoji":"📐","heading":"Standard Costing","body":"Standard costing sets pre-determined costs for materials, labour, and overheads. Comparing actuals to standards reveals variances for management control."},
      {"type":"explanation","heading":"Types of Standard","body":"The standard chosen affects motivation and usefulness of variances.","key_terms":[{"term":"Ideal standard","definition":"Assumes perfect efficiency. Rarely achievable; can demotivate staff."},{"term":"Attainable standard","definition":"Efficient but not perfect. Allows for normal waste and idle time. Most commonly used."},{"term":"Current standard","definition":"Based on current conditions including known inefficiencies. Easy to achieve but provides little incentive to improve."}]},
      {"type":"worked_example","heading":"Material Price and Usage Variances","steps":["Standard: 5 kg at £8/kg per unit. Actual: 1,000 units using 5,200 kg costing £40,560.","Material Price Variance: Actual price = £40,560 / 5,200 = £7.80/kg. MPV = (£8.00 - £7.80) x 5,200 = £1,040 Favourable.","Material Usage Variance: Std qty = 1,000 x 5 = 5,000 kg. MUV = (5,000 - 5,200) x £8 = £1,600 Adverse.","Total Material Variance = £1,040 F + £1,600 A = £560 Adverse. Check: (1,000 x £40) - £40,560 = £560 A. Confirmed."]},
      {"type":"table","heading":"Key Variance Formulas","headers":["Variance","Formula","F or A?"],"rows":[["Material price","(Std price - Actual price) x Actual qty","F if Std > Actual price"],["Material usage","(Std qty - Actual qty) x Std price","F if Std > Actual qty"],["Labour rate","(Std rate - Actual rate) x Actual hours","F if Std > Actual rate"],["Labour efficiency","(Std hours - Actual hours) x Std rate","F if Std < Actual hours"],["Sales volume (MC)","(Actual - Budgeted units) x Std contribution","F if Actual > Budget"]]}
    ]
  },
  {
    "id": "ba200000-0004-0001-0000-000000000000",
    "module_id": "ba200000-0004-0000-0000-000000000000",
    "title": "Payback Period and Accounting Rate of Return",
    "order_index": 1, "xp_reward": 10, "estimated_minutes": 6, "is_published": True,
    "content": [
      {"type":"intro","emoji":"💰","heading":"Investment Appraisal","body":"Investment appraisal techniques help evaluate whether an investment is worthwhile. We start with two non-discounted techniques: Payback and ARR."},
      {"type":"explanation","heading":"Payback Period","body":"Measures how long it takes for the initial investment to be recovered from net cash inflows.","key_terms":[{"term":"Payback period","definition":"Time for cumulative net cash inflows to equal the initial investment. Shorter payback preferred."},{"term":"Advantages","definition":"Simple to calculate, easy to understand, focuses on liquidity."},{"term":"Limitations","definition":"Ignores time value of money. Ignores cash flows after payback. Does not measure overall profitability."}]},
      {"type":"worked_example","heading":"Calculating Payback Period","steps":["Machine costs £200,000. Inflows: Year 1 £60k, Year 2 £80k, Year 3 £90k.","Cumulative: Year 1 £60k, Year 2 £140k, Year 3 £230k.","Still need £60k at start of Year 3. Year 3 inflow = £90k.","Payback = 2 years + (60,000 / 90,000) x 12 = 2 years 8 months."]},
      {"type":"explanation","heading":"Accounting Rate of Return (ARR)","body":"Expresses average annual accounting profit as a percentage of the investment.","key_terms":[{"term":"ARR formula","definition":"ARR = (Average annual accounting profit / Average investment) x 100%. Average investment = (Initial cost + Scrap value) / 2."},{"term":"Limitations","definition":"Uses accounting profit, not cash flows. Ignores time value of money."}]}
    ]
  },
  {
    "id": "ba200000-0004-0002-0000-000000000000",
    "module_id": "ba200000-0004-0000-0000-000000000000",
    "title": "Net Present Value and Internal Rate of Return",
    "order_index": 2, "xp_reward": 15, "estimated_minutes": 8, "is_published": True,
    "content": [
      {"type":"intro","emoji":"📊","heading":"Discounted Cash Flow Methods","body":"DCF methods recognise that cash received in the future is worth less than cash received today. NPV and IRR are theoretically superior to payback and ARR."},
      {"type":"explanation","heading":"Net Present Value (NPV)","body":"NPV discounts all project cash flows back to present value using the cost of capital. A positive NPV means the project adds value.","key_terms":[{"term":"Discount factor","definition":"Present value of £1 at a future date: 1 / (1 + r)^n, where r = discount rate and n = years."},{"term":"NPV decision rule","definition":"Accept if NPV > 0. Choose highest positive NPV for mutually exclusive projects."}]},
      {"type":"worked_example","heading":"NPV Calculation","steps":["Project cost: £100,000. Discount rate: 10%. Inflows: Year 1 £40k, Year 2 £50k, Year 3 £40k.","Discount factors at 10%: Year 1 0.909, Year 2 0.826, Year 3 0.751.","Present values: £36,360 + £41,300 + £30,040 = £107,700.","NPV = £107,700 - £100,000 = +£7,700. Accept (positive NPV)."]},
      {"type":"explanation","heading":"Internal Rate of Return (IRR)","body":"The discount rate at which NPV = 0. Accept if IRR > cost of capital.","key_terms":[{"term":"IRR interpolation","definition":"IRR = L + [NPV(L) / (NPV(L) - NPV(H))] x (H - L)"},{"term":"IRR decision rule","definition":"Accept if IRR > cost of capital (required rate of return)."}]},
      {"type":"table","heading":"Investment Appraisal Comparison","headers":["Method","Cash flows?","Time value?","Decision rule","Main limitation"],"rows":[["Payback","Yes","No","Shorter is better","Ignores post-payback flows"],["ARR","No (profit)","No","ARR > target rate","Uses accounting profit"],["NPV","Yes","Yes","NPV > 0, accept","Requires accurate cost of capital"],["IRR","Yes","Yes","IRR > cost of capital","Assumes reinvestment at IRR"]]}
    ]
  },
]

for lesson in ba2_lessons:
    r = post("lessons", lesson)
    print(f"BA2 lesson '{lesson['title'][:45]}': {r}")

# ═══════════════════════════════════════════════════════════════════
# BA2 QUESTIONS
# ═══════════════════════════════════════════════════════════════════

ba2_questions = [
  # 1.1
  ("ba200000-0001-0001-0000-000000000001","ba200000-0001-0001-0000-000000000000","mcq","Which of the following is a DIRECT cost for a furniture manufacturer?","Wood used to make chairs",1,'["Factory rent","Wood used to make chairs","Factory supervisor salary","Machine depreciation"]',"Wood can be directly traced to each chair — a direct material. The others are indirect costs."),
  ("ba200000-0001-0001-0000-000000000002","ba200000-0001-0001-0000-000000000000","mcq","Prime cost equals:","The total of all direct costs",2,'["All production costs including overheads","The total of all direct costs","Variable production costs only","Direct materials plus direct labour only"]',"Prime cost = Direct materials + Direct labour + Direct expenses. Excludes indirect costs."),
  ("ba200000-0001-0001-0000-000000000003","ba200000-0001-0001-0000-000000000000","true_false","Advertising expenditure is an example of a product cost.","False",3,None,"Advertising is a period cost — expensed in the period incurred. Product costs relate to production and are held in inventory until sold."),
  ("ba200000-0001-0001-0000-000000000004","ba200000-0001-0001-0000-000000000000","mcq","A factory manager salary is best classified as:","An indirect production overhead",4,'["A direct cost","A variable cost","An indirect production overhead","A period cost"]',"Cannot be traced to individual units — indirect cost. Relates to production — production overhead, and therefore a product cost under absorption costing."),
  # 1.2
  ("ba200000-0001-0002-0000-000000000001","ba200000-0001-0002-0000-000000000000","mcq","The high-low method is used to:","Separate fixed and variable elements of a semi-variable cost",1,'["Calculate the break-even point","Separate fixed and variable elements of a semi-variable cost","Apportion overheads between departments","Value closing inventory"]',"The high-low method uses the highest and lowest activity points to calculate variable cost per unit, then finds the fixed element by substitution."),
  ("ba200000-0001-0002-0000-000000000002","ba200000-0001-0002-0000-000000000000","mcq","At 5,000 units total cost is £32,000; at 9,000 units total cost is £48,000. What is the variable cost per unit?","£4.00",2,'["£4.00","£3.00","£5.33","£2.00"]',"Variable cost per unit = (£48,000 - £32,000) / (9,000 - 5,000) = £16,000 / 4,000 = £4.00 per unit."),
  ("ba200000-0001-0002-0000-000000000003","ba200000-0001-0002-0000-000000000000","true_false","Fixed costs per unit remain constant as output increases.","False",3,None,"Total fixed costs remain constant, but fixed cost per UNIT falls as output increases (spread over more units). Variable cost per unit is the one that stays constant."),
  ("ba200000-0001-0002-0000-000000000004","ba200000-0001-0002-0000-000000000000","mcq","A telephone bill with a monthly line rental plus a charge per call is an example of:","A semi-variable cost",4,'["A fixed cost","A variable cost","A stepped cost","A semi-variable cost"]',"A semi-variable cost has both a fixed element (line rental) and a variable element (per-call charge)."),
  # 1.3
  ("ba200000-0001-0003-0000-000000000001","ba200000-0001-0003-0000-000000000000","mcq","Under marginal costing, fixed production overheads are:","Written off as a period cost in full",1,'["Included in closing inventory valuation","Absorbed into units using an OAR","Written off as a period cost in full","Apportioned to cost centres only"]',"Under marginal costing, fixed production overheads are period costs — charged in full to the income statement and never included in inventory values."),
  ("ba200000-0001-0003-0000-000000000002","ba200000-0001-0003-0000-000000000000","mcq","If production exceeds sales in a period, which costing method reports a HIGHER profit?","Absorption costing",2,'["Marginal costing","Absorption costing","Both methods give the same profit","It depends on the overhead absorption rate"]',"When production exceeds sales, closing inventory increases. Absorption costing carries fixed overheads forward in closing inventory, reducing the charge to the income statement — giving higher profit."),
  ("ba200000-0001-0003-0000-000000000003","ba200000-0001-0003-0000-000000000000","true_false","Contribution equals selling price minus variable costs.","True",3,None,"Contribution = Selling price - Variable costs. It represents how much each unit sold contributes towards covering fixed costs and generating profit."),
  ("ba200000-0001-0003-0000-000000000004","ba200000-0001-0003-0000-000000000000","mcq","The Overhead Absorption Rate (OAR) is calculated as:","Budgeted overheads divided by budgeted activity",4,'["Actual overheads divided by actual activity","Budgeted overheads divided by budgeted activity","Actual overheads divided by budgeted activity","Budgeted overheads divided by actual activity"]',"OAR = Budgeted fixed overheads / Budgeted activity level. Set in advance using budgeted figures, causing over- or under-absorption when actuals differ."),
  # 2.1
  ("ba200000-0002-0001-0000-000000000001","ba200000-0002-0001-0000-000000000000","mcq","Selling price is £40, variable cost is £24. Fixed costs are £64,000. What is the breakeven point in units?","4,000 units",1,'["1,600 units","4,000 units","2,667 units","8,000 units"]',"Contribution per unit = £40 - £24 = £16. Breakeven = £64,000 / £16 = 4,000 units."),
  ("ba200000-0002-0001-0000-000000000002","ba200000-0002-0001-0000-000000000000","mcq","Budgeted sales are 6,000 units and the breakeven point is 4,500 units. What is the margin of safety as a percentage?","25%",2,'["25%","33%","75%","15%"]',"Margin of safety = 6,000 - 4,500 = 1,500 units. As a percentage: 1,500 / 6,000 x 100 = 25%."),
  ("ba200000-0002-0001-0000-000000000003","ba200000-0002-0001-0000-000000000000","true_false","The C/S ratio equals contribution per unit divided by selling price per unit.","True",3,None,"C/S ratio = Contribution per unit / Selling price per unit. It shows what proportion of each pound of revenue is contribution."),
  ("ba200000-0002-0001-0000-000000000004","ba200000-0002-0001-0000-000000000000","mcq","Fixed costs are £50,000. Contribution per unit is £10. What level of sales is needed to achieve a target profit of £20,000?","7,000 units",4,'["2,000 units","5,000 units","7,000 units","3,000 units"]',"Required sales = (£50,000 + £20,000) / £10 = 7,000 units."),
  # 2.2
  ("ba200000-0002-0002-0000-000000000001","ba200000-0002-0002-0000-000000000000","mcq","When allocating a scarce resource between products, the correct ranking criterion is:","Highest contribution per unit of limiting factor",1,'["Highest selling price per unit","Highest contribution per unit","Highest contribution per unit of limiting factor","Highest gross profit margin"]',"Ranking by contribution per unit alone ignores how much of the scarce resource each product uses. Rank by contribution per unit of the limiting factor."),
  ("ba200000-0002-0002-0000-000000000002","ba200000-0002-0002-0000-000000000000","mcq","Product A: contribution £12, uses 4 labour hours. Product B: contribution £15, uses 6 labour hours. Which should be prioritised?","Product A, because it has the higher contribution per labour hour",2,'["Product A, because it has the higher contribution per labour hour","Product B, because it has the higher contribution per unit","Both products are equally ranked","Product B, because it uses more labour hours"]',"Product A: £12 / 4 = £3 per hour. Product B: £15 / 6 = £2.50 per hour. Product A ranked first."),
  ("ba200000-0002-0002-0000-000000000003","ba200000-0002-0002-0000-000000000000","true_false","The shadow price of a limiting factor is the maximum extra amount a business should pay to obtain one additional unit of that resource.","True",3,None,"The shadow price equals additional contribution from one more unit of the scarce resource — the maximum premium above normal cost worth paying."),
  ("ba200000-0002-0002-0000-000000000004","ba200000-0002-0002-0000-000000000000","mcq","A limiting factor analysis is needed when:","One resource cannot meet total demand for all products",4,'["A company has unlimited resources","One resource cannot meet total demand for all products","Fixed costs exceed contribution","Sales demand exceeds budgeted output"]',"Limiting factor analysis applies when supply of a resource is insufficient to meet combined demand for all products."),
  # 3.1
  ("ba200000-0003-0001-0000-000000000001","ba200000-0003-0001-0000-000000000000","mcq","Which type of budget requires every item of expenditure to be justified from zero each period?","Zero-based budget",1,'["Incremental budget","Rolling budget","Zero-based budget","Participative budget"]',"Zero-based budgeting requires managers to justify all activities from scratch, as if starting from zero each period."),
  ("ba200000-0003-0001-0000-000000000002","ba200000-0003-0001-0000-000000000000","mcq","A budget continuously updated by adding a new future period as each period ends is called:","A rolling budget",2,'["An incremental budget","A zero-based budget","A rolling budget","A master budget"]',"Rolling budgets always cover a fixed forward time period. As each month passes, a new month is added at the end."),
  ("ba200000-0003-0001-0000-000000000003","ba200000-0003-0001-0000-000000000000","true_false","A participative budgeting process always results in more accurate budgets because managers know their own costs best.","False",3,None,"While participative budgeting can improve accuracy, it creates a risk of budget slack — managers deliberately understate revenue or overstate costs to make targets easier to achieve."),
  ("ba200000-0003-0001-0000-000000000004","ba200000-0003-0001-0000-000000000000","mcq","The PRIMARY purpose of comparing actual results against the budget is to:","Identify and investigate variances for control purposes",4,'["Motivate employees","Identify and investigate variances for control purposes","Coordinate departmental activities","Communicate management plans"]',"The primary use of budget vs actual comparison is control — highlighting where performance deviates from plan so corrective action can be taken."),
  # 3.2
  ("ba200000-0003-0002-0000-000000000001","ba200000-0003-0002-0000-000000000000","mcq","A flexible budget differs from a fixed budget because it:","Is adjusted for the actual level of activity achieved",1,'["Includes only fixed costs","Is adjusted for the actual level of activity achieved","Is prepared monthly rather than annually","Is set by frontline managers"]',"A flexible budget recalculates what costs should have been at the actual output level, removing the volume effect from variances."),
  ("ba200000-0003-0002-0000-000000000002","ba200000-0003-0002-0000-000000000000","mcq","Budgeted output 8,000 units (variable cost £5/unit, fixed costs £30,000). Actual output 10,000 units, actual cost £84,000. What is the expenditure variance?","£4,000 Adverse",2,'["£4,000 Adverse","£4,000 Favourable","£14,000 Adverse","£14,000 Favourable"]',"Flexible budget at 10,000: Variable = £50,000. Fixed = £30,000. Total = £80,000. Variance = £84,000 - £80,000 = £4,000 Adverse."),
  ("ba200000-0003-0002-0000-000000000003","ba200000-0003-0002-0000-000000000000","true_false","A cost variance is favourable when actual cost exceeds budgeted cost.","False",3,None,"A cost variance is ADVERSE when actual cost exceeds budget. FAVOURABLE when actual cost is less than budget."),
  ("ba200000-0003-0002-0000-000000000004","ba200000-0003-0002-0000-000000000000","mcq","Which variance arises purely because the volume of sales was different from budget?","Sales volume variance",4,'["Sales price variance","Expenditure variance","Sales volume variance","Labour efficiency variance"]',"The sales volume variance measures the profit impact of selling a different volume from budget = (Actual - Budgeted units) x Standard contribution."),
  # 3.3
  ("ba200000-0003-0003-0000-000000000001","ba200000-0003-0003-0000-000000000000","mcq","Standard material 4 kg at £6/kg. Actual: 1,000 units using 4,200 kg costing £24,360. What is the material price variance?","£840 Favourable",1,'["£840 Adverse","£840 Favourable","£1,200 Adverse","£360 Favourable"]',"Actual price = £24,360 / 4,200 = £5.80/kg. MPV = (£6.00 - £5.80) x 4,200 = £840 Favourable."),
  ("ba200000-0003-0003-0000-000000000002","ba200000-0003-0003-0000-000000000000","mcq","Using the same data (standard 4 kg at £6; actual 4,200 kg for 1,000 units), what is the material usage variance?","£1,200 Adverse",2,'["£1,200 Adverse","£1,200 Favourable","£840 Adverse","£360 Adverse"]',"Standard qty for 1,000 units = 4,000 kg. MUV = (4,000 - 4,200) x £6 = £1,200 Adverse."),
  ("ba200000-0003-0003-0000-000000000003","ba200000-0003-0003-0000-000000000000","true_false","The labour efficiency variance compares actual hours worked to standard hours allowed for actual production.","True",3,None,"Labour efficiency variance = (Standard hours for actual output - Actual hours worked) x Standard rate per hour."),
  ("ba200000-0003-0003-0000-000000000004","ba200000-0003-0003-0000-000000000000","mcq","An ideal standard is rarely used in practice because:","It assumes perfect efficiency and is unlikely to be achieved, which can demotivate staff",4,'["It is too difficult to calculate","It assumes perfect efficiency and is unlikely to be achieved, which can demotivate staff","It only applies to manufacturing businesses","It ignores fixed overhead costs"]',"Ideal standards assume no waste, breakdowns, or idle time. Variances are always adverse — demotivating and uninformative. Attainable standards are generally preferred."),
  # 4.1
  ("ba200000-0004-0001-0000-000000000001","ba200000-0004-0001-0000-000000000000","mcq","Which statement about the payback method is CORRECT?","It ignores cash flows arising after the payback point",1,'["It accounts for the time value of money","It considers all cash flows over the project life","It ignores cash flows arising after the payback point","It measures overall project profitability"]',"The payback method stops counting once the initial investment is recovered. Cash flows after payback are completely ignored. It also ignores the time value of money."),
  ("ba200000-0004-0001-0000-000000000002","ba200000-0004-0001-0000-000000000000","mcq","Project costs £150,000. Inflows: Year 1 £50k, Year 2 £60k, Year 3 £70k. What is the payback period?","2 years 6 months",2,'["2 years exactly","2 years 6 months","2 years 8 months","3 years exactly"]',"Cumulative: Y1 £50k, Y2 £110k. Still need £40k. Year 3 inflow £70k. Payback within Y3 = 40,000/70,000 x 12 = approx 6 months. Total: 2 years 6 months."),
  ("ba200000-0004-0001-0000-000000000003","ba200000-0004-0001-0000-000000000000","true_false","The Accounting Rate of Return (ARR) uses cash flows rather than accounting profit.","False",3,None,"ARR uses accounting profit (after depreciation), not cash flows. This is a key limitation — it uses a subjective measure influenced by accounting policies."),
  ("ba200000-0004-0001-0000-000000000004","ba200000-0004-0001-0000-000000000000","mcq","ARR is calculated as:","Average annual profit divided by average investment",4,'["Initial investment divided by average annual profit","Average annual profit divided by average investment","Total profit divided by total investment","Annual cash flow divided by initial investment"]',"ARR = (Average annual accounting profit / Average investment) x 100%. Average investment = (Initial cost + Residual value) / 2."),
  # 4.2
  ("ba200000-0004-0002-0000-000000000001","ba200000-0004-0002-0000-000000000000","mcq","A project has an NPV of +£15,000 at a 12% discount rate. This means:","The project adds £15,000 of value in present value terms and should be accepted",1,'["The project earns exactly 12% return","The project adds £15,000 of value in present value terms and should be accepted","The project should be rejected as IRR is below 12%","The payback period is less than one year"]',"Positive NPV means the project earns more than the cost of capital, generating £15,000 of surplus value in present value terms. NPV rule: accept if NPV > 0."),
  ("ba200000-0004-0002-0000-000000000002","ba200000-0004-0002-0000-000000000000","mcq","The Internal Rate of Return (IRR) is best described as:","The discount rate at which NPV equals zero",2,'["The discount rate at which NPV equals zero","The rate of return based on accounting profit","The rate at which the payback period equals one year","The cost of capital used to discount cash flows"]',"The IRR is the specific discount rate that makes NPV = 0. Accept if IRR > required rate of return."),
  ("ba200000-0004-0002-0000-000000000003","ba200000-0004-0002-0000-000000000000","true_false","NPV is generally considered the superior investment appraisal technique because it accounts for the time value of money and measures absolute value creation.","True",3,None,"NPV is theoretically preferred: uses cash flows, adjusts for time value of money, measures absolute value added, consistent with shareholder wealth maximisation."),
  ("ba200000-0004-0002-0000-000000000004","ba200000-0004-0002-0000-000000000000","mcq","A project has NPV of +£8,000 at 10% and -£4,000 at 15%. Using interpolation, the IRR is approximately:","13.3%",4,'["11.7%","13.3%","12.5%","14.2%"]',"IRR = 10 + [8,000 / (8,000 - (-4,000))] x (15 - 10) = 10 + [8,000/12,000] x 5 = 10 + 3.33 = 13.3%."),
]

for qid, lid, qtype, prompt, answer, oi, opts, expl in ba2_questions:
    data = {"id": qid, "lesson_id": lid, "question_type": qtype, "prompt": prompt,
            "correct_answer": answer, "order_index": oi, "explanation": expl}
    if opts:
        data["options"] = json.loads(opts)
    r = post("questions", data)
    print(f"  Q {oi} ({lid[-8:]}): {r}")

print("\nBA2 questions done")
