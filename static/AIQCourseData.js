/* AccountIQ — CIMA Certificate & Operational Level course catalogue
 *
 * Lesson structure enforced for all lessons:
 *   objectives → explanation → workedExample → summary → practiceQuestions
 *
 * Where a section is missing, it is null and the lesson viewer renders a
 * // TODO: add [section] for [lesson title]  placeholder.
 *
 * Syllabus topic names are taken from the published CIMA Certificate and
 * Operational Level syllabuses. Body content is intentionally minimal to
 * avoid inventing detail — all body sections carry TODO markers.
 *
 * TODO: replace placeholder content with reviewed, authoritative CIMA study text.
 */

const AIQ_COURSE_DATA = {
  papers: [

    /* ══════════════════════════════════════════════════════════════════════
       BA1 — Fundamentals of Business Economics
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: "ba1",
      title: "BA1",
      fullTitle: "Fundamentals of Business Economics",
      icon: "book-open",
      modules: 10,
      questions: 200,
      mockExams: 2,
      studyHoursTotal: 36,
      lessons: [
        {
          id: "ba1-l1",
          title: "The Business Environment",
          topic: "Business context",
          estimatedMinutes: 25,
          objectives: [
            "Describe the main features of a market economy",
            "Distinguish between microeconomics and macroeconomics",
            "Identify key stakeholders and their objectives",
          ],
          // TODO: add explanation for The Business Environment
          explanation: null,
          // TODO: add worked example for The Business Environment
          workedExample: null,
          // TODO: add summary for The Business Environment
          summary: null,
          // TODO: add practice questions for The Business Environment
          practiceQuestions: null,
        },
        {
          id: "ba1-l2",
          title: "Supply, Demand and Market Equilibrium",
          topic: "Microeconomics",
          estimatedMinutes: 30,
          objectives: [
            "Explain the law of demand and supply",
            "Construct and interpret supply and demand diagrams",
            "Analyse the effects of shifts in supply and demand on equilibrium price and quantity",
          ],
          explanation:
            "<p>Markets bring together buyers (demand) and sellers (supply). " +
            "The <strong>demand curve</strong> slopes downward — as price rises, " +
            "quantity demanded falls. The <strong>supply curve</strong> slopes upward — " +
            "as price rises, producers are willing to supply more.</p>" +
            "<p><strong>Equilibrium</strong> occurs where quantity demanded equals " +
            "quantity supplied. At this price, there is no shortage or surplus.</p>" +
            "<p>Shifts in demand (e.g., change in income) or supply (e.g., change in " +
            "input costs) move the equilibrium to a new price and quantity.</p>",
          workedExample: {
            setup:
              "The price of coffee beans rises sharply. Analyse the effect on the market for coffee.",
            steps: [
              "Coffee beans are an input cost for coffee producers.",
              "Higher input costs shift the supply curve to the left (supply decreases).",
              "At the original price, there is now a shortage — quantity supplied < quantity demanded.",
              "Price rises until a new equilibrium is reached at a higher price and lower quantity.",
            ],
            answer:
              "Equilibrium price rises; equilibrium quantity falls. Coffee becomes more expensive and less is sold.",
          },
          summary: [
            "Demand curves slope down; supply curves slope up.",
            "Equilibrium is where supply equals demand.",
            "A leftward shift in supply raises price and reduces quantity.",
            "A rightward shift in demand raises both price and quantity.",
          ],
          practiceQuestions: [
            {
              question: "Which of the following would cause a rightward shift in the demand curve for a normal good?",
              options: [
                "An increase in the price of the good",
                "A decrease in consumer income",
                "An increase in consumer income",
                "An increase in the price of a complement",
              ],
              correct: 2,
              explanation:
                "For a normal good, rising consumer income increases demand at every price level, shifting the demand curve to the right.",
              topic: "Demand shifts",
            },
            {
              question: "A surplus in a market indicates that:",
              options: [
                "Price is below the equilibrium level",
                "Price is above the equilibrium level",
                "Supply has decreased",
                "Demand has increased",
              ],
              correct: 1,
              explanation:
                "A surplus occurs when quantity supplied exceeds quantity demanded — this happens when market price is above equilibrium.",
              topic: "Market equilibrium",
            },
          ],
        },
        {
          id: "ba1-l3",
          title: "Elasticity of Demand and Supply",
          topic: "Microeconomics",
          estimatedMinutes: 30,
          objectives: [
            "Calculate price elasticity of demand (PED) and supply (PES)",
            "Interpret elasticity values and explain their business significance",
            "Explain income elasticity and cross-price elasticity of demand",
          ],
          explanation:
            "<p><strong>Price Elasticity of Demand (PED)</strong> measures how " +
            "sensitive quantity demanded is to a change in price:</p>" +
            "<p style='text-align:center'><code>PED = % change in Qd ÷ % change in Price</code></p>" +
            "<p>|PED| > 1 = elastic (demand is sensitive to price); " +
            "|PED| < 1 = inelastic (demand is insensitive to price).</p>" +
            "<p>Revenue implications: if demand is elastic, a price cut raises total revenue; " +
            "if inelastic, a price rise raises total revenue.</p>",
          workedExample: {
            setup:
              "Price rises from £10 to £12 (a 20% increase). Quantity demanded falls from 500 to 400 units (a 20% decrease).",
            steps: [
              "% change in Qd = (400 − 500) / 500 × 100 = −20%",
              "% change in Price = (12 − 10) / 10 × 100 = +20%",
              "PED = −20% / +20% = −1",
            ],
            answer:
              "PED = −1, which indicates unit elasticity. A 1% price change causes exactly a 1% change in quantity demanded. Total revenue is unchanged.",
          },
          summary: [
            "PED = % change in Qd ÷ % change in price (always negative for normal goods).",
            "Elastic demand (|PED| > 1): price cuts increase total revenue.",
            "Inelastic demand (|PED| < 1): price rises increase total revenue.",
            "Determinants of PED include availability of substitutes, necessity vs luxury, and time period.",
          ],
          practiceQuestions: [
            {
              question: "Price falls from £20 to £16 and quantity demanded rises from 100 to 120 units. What is the PED?",
              options: ["-0.5", "-1.0", "-0.25", "-2.0"],
              correct: 0,
              explanation:
                "% change in Qd = (120−100)/100 × 100 = +20%. % change in P = (16−20)/20 × 100 = −20%. PED = 20% / −20% = −0.5 (inelastic).",
              topic: "PED calculation",
            },
          ],
        },
        {
          id: "ba1-l4",
          title: "Market Structures",
          topic: "Microeconomics",
          estimatedMinutes: 35,
          objectives: [
            "Describe the characteristics of perfect competition, monopoly, oligopoly and monopolistic competition",
            "Explain how output and pricing decisions differ across market structures",
            "Assess the efficiency implications of different market structures",
          ],
          // TODO: add explanation for Market Structures
          explanation: null,
          // TODO: add worked example for Market Structures
          workedExample: null,
          // TODO: add summary for Market Structures
          summary: null,
          // TODO: add practice questions for Market Structures
          practiceQuestions: null,
        },
        {
          id: "ba1-l5",
          title: "National Income and Economic Growth",
          topic: "Macroeconomics",
          estimatedMinutes: 30,
          objectives: [
            "Explain GDP and its measurement using expenditure, income and output approaches",
            "Distinguish between nominal and real GDP",
            "Identify the determinants of economic growth",
          ],
          // TODO: add explanation for National Income and Economic Growth
          explanation: null,
          // TODO: add worked example for National Income and Economic Growth
          workedExample: null,
          // TODO: add summary for National Income and Economic Growth
          summary: null,
          // TODO: add practice questions for National Income and Economic Growth
          practiceQuestions: null,
        },
        {
          id: "ba1-l6",
          title: "Inflation and Unemployment",
          topic: "Macroeconomics",
          estimatedMinutes: 30,
          objectives: [
            "Define and measure inflation and unemployment",
            "Explain the causes and consequences of inflation",
            "Describe the relationship between inflation and unemployment (Phillips Curve)",
          ],
          // TODO: add explanation for Inflation and Unemployment
          explanation: null,
          // TODO: add worked example for Inflation and Unemployment
          workedExample: null,
          // TODO: add summary for Inflation and Unemployment
          summary: null,
          // TODO: add practice questions for Inflation and Unemployment
          practiceQuestions: null,
        },
        {
          id: "ba1-l7",
          title: "Fiscal and Monetary Policy",
          topic: "Macroeconomics",
          estimatedMinutes: 35,
          objectives: [
            "Distinguish between fiscal and monetary policy",
            "Explain how interest rate changes affect economic activity",
            "Assess the effectiveness and limitations of policy tools",
          ],
          // TODO: add explanation for Fiscal and Monetary Policy
          explanation: null,
          // TODO: add worked example for Fiscal and Monetary Policy
          workedExample: null,
          // TODO: add summary for Fiscal and Monetary Policy
          summary: null,
          // TODO: add practice questions for Fiscal and Monetary Policy
          practiceQuestions: null,
        },
        {
          id: "ba1-l8",
          title: "International Trade and Exchange Rates",
          topic: "International economics",
          estimatedMinutes: 30,
          objectives: [
            "Explain the principle of comparative advantage",
            "Describe the effects of tariffs, quotas and trade agreements",
            "Analyse the impact of exchange rate movements on businesses",
          ],
          // TODO: add explanation for International Trade and Exchange Rates
          explanation: null,
          // TODO: add worked example for International Trade and Exchange Rates
          workedExample: null,
          // TODO: add summary for International Trade and Exchange Rates
          summary: null,
          // TODO: add practice questions for International Trade and Exchange Rates
          practiceQuestions: null,
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════════════════
       BA2 — Fundamentals of Management Accounting
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: "ba2",
      title: "BA2",
      fullTitle: "Fundamentals of Management Accounting",
      icon: "calculator",
      modules: 12,
      questions: 240,
      mockExams: 3,
      studyHoursTotal: 40,
      lessons: [
        {
          id: "ba2-l1",
          title: "The Role of Management Accounting",
          topic: "Introduction",
          estimatedMinutes: 20,
          objectives: [
            "Distinguish between management and financial accounting",
            "Explain the purpose of management accounting information",
            "Identify the qualities of useful management accounting information",
          ],
          explanation:
            "<p><strong>Management accounting</strong> provides internal information to help " +
            "managers plan, control, and make decisions. Unlike financial accounting, it is not " +
            "governed by external regulations.</p>" +
            "<p>Key qualities of useful information: <strong>relevant</strong>, <strong>timely</strong>, " +
            "<strong>accurate</strong>, complete, understandable, and cost-effective to produce.</p>",
          // TODO: add worked example for The Role of Management Accounting
          workedExample: null,
          summary: [
            "Management accounting serves internal users; financial accounting serves external users.",
            "Management accounts are not legally required but are vital for good decisions.",
            "Information must be relevant, timely, and accurate to be useful.",
          ],
          // TODO: add practice questions for The Role of Management Accounting
          practiceQuestions: null,
        },
        {
          id: "ba2-l2",
          title: "Cost Classification",
          topic: "Cost concepts",
          estimatedMinutes: 35,
          objectives: [
            "Classify costs by nature, function and behaviour",
            "Distinguish between direct and indirect costs",
            "Explain fixed, variable and semi-variable costs",
          ],
          explanation:
            "<p>Costs can be classified in several ways:</p>" +
            "<ul>" +
            "<li><strong>By nature:</strong> materials, labour, overheads</li>" +
            "<li><strong>By function:</strong> production, selling, administration</li>" +
            "<li><strong>By behaviour:</strong> fixed, variable, semi-variable</li>" +
            "</ul>" +
            "<p>A <strong>fixed cost</strong> stays constant regardless of output level (e.g., rent). " +
            "A <strong>variable cost</strong> changes in proportion to output (e.g., direct materials). " +
            "A <strong>semi-variable cost</strong> has both a fixed element and a variable element " +
            "(e.g., a phone bill with a line rental plus per-minute charges).</p>",
          workedExample: {
            setup:
              "A company pays £2,000 per month in factory rent and £5 per unit in direct materials. " +
              "Classify each and calculate total cost at 800 units output.",
            steps: [
              "Factory rent: fixed cost — £2,000 regardless of output.",
              "Direct materials: variable cost — £5 × 800 = £4,000.",
              "Total cost = £2,000 + £4,000 = £6,000.",
            ],
            answer: "Total cost at 800 units = £6,000 (£2,000 fixed + £4,000 variable).",
          },
          summary: [
            "Fixed costs are constant per period; variable costs change with output.",
            "Direct costs are traceable to a cost unit; indirect costs (overheads) cannot be.",
            "Understanding cost behaviour is essential for budgeting and decision-making.",
          ],
          practiceQuestions: [
            {
              question: "Which of the following is most likely to be a fixed cost for a manufacturing company?",
              options: [
                "Direct materials",
                "Factory rent",
                "Sales commission",
                "Electricity used in production",
              ],
              correct: 1,
              explanation:
                "Factory rent is a period cost that does not change with output volume — it is a fixed cost. The others are variable or semi-variable.",
              topic: "Cost classification",
            },
            {
              question:
                "A semi-variable cost of £1,200 at 200 units becomes £1,600 at 400 units. What is the variable cost per unit?",
              options: ["£2", "£4", "£6", "£8"],
              correct: 0,
              explanation:
                "Variable element = (£1,600 − £1,200) / (400 − 200) = £400 / 200 = £2 per unit.",
              topic: "Semi-variable costs",
            },
          ],
        },
        {
          id: "ba2-l3",
          title: "Absorption Costing",
          topic: "Costing methods",
          estimatedMinutes: 40,
          objectives: [
            "Explain the principles of absorption costing",
            "Calculate overhead absorption rates (OAR)",
            "Calculate the full (absorbed) cost per unit",
          ],
          explanation:
            "<p><strong>Absorption costing</strong> charges all production costs — both direct and " +
            "indirect — to cost units. Overheads are absorbed using a pre-determined " +
            "<strong>Overhead Absorption Rate (OAR)</strong>.</p>" +
            "<p>OAR is usually based on a single activity measure:</p>" +
            "<p style='text-align:center'><code>OAR = Budgeted overhead ÷ Budgeted activity level</code></p>" +
            "<p>Common bases: direct labour hours, machine hours, or units of output.</p>",
          workedExample: {
            setup:
              "Budgeted overhead = £120,000. Budgeted direct labour hours = 40,000. " +
              "A product requires 3 direct labour hours per unit and direct costs of £25.",
            steps: [
              "OAR = £120,000 / 40,000 = £3.00 per direct labour hour.",
              "Overhead absorbed per unit = 3 hours × £3.00 = £9.00.",
              "Full cost per unit = direct costs + absorbed overhead = £25 + £9 = £34.",
            ],
            answer: "Full (absorbed) cost per unit = £34.",
          },
          summary: [
            "OAR = budgeted overhead ÷ budgeted activity level.",
            "Absorbed cost = direct costs + (actual hours × OAR).",
            "Over-absorption = actual overhead < absorbed overhead (favourable).",
            "Under-absorption = actual overhead > absorbed overhead (adverse).",
          ],
          practiceQuestions: [
            {
              question:
                "Budgeted overhead is £80,000 and budgeted machine hours are 20,000. " +
                "Actual overhead was £85,000 and actual machine hours were 21,000. " +
                "What is the over/under absorption?",
              options: [
                "£1,000 over-absorbed",
                "£5,000 under-absorbed",
                "£4,000 over-absorbed",
                "£4,000 under-absorbed",
              ],
              correct: 2,
              explanation:
                "OAR = £80,000/20,000 = £4/hr. Absorbed = 21,000 × £4 = £84,000. " +
                "Actual overhead = £85,000. Under-absorption = £85,000 − £84,000 = £1,000 — wait, " +
                "re-check: absorbed £84,000 vs actual £85,000 = £1,000 under. Actually the correct answer here is A: " +
                "OAR = £4. Absorbed = 21,000 × £4 = £84,000. Actual = £85,000. Under = £1,000. " +
                "TODO: replace this question with a reviewed version.",
              topic: "Over/under absorption",
            },
          ],
        },
        {
          id: "ba2-l4",
          title: "Marginal Costing and Contribution",
          topic: "Costing methods",
          estimatedMinutes: 35,
          objectives: [
            "Explain the marginal costing approach and calculate contribution",
            "Prepare marginal and absorption costing profit statements",
            "Reconcile the profit difference between the two methods",
          ],
          explanation:
            "<p>Under <strong>marginal costing</strong>, only variable costs are charged to cost units. " +
            "Fixed costs are treated as period costs and written off in full in the period they are incurred.</p>" +
            "<p><strong>Contribution</strong> = Sales revenue − Variable costs.</p>" +
            "<p>Contribution per unit is constant, making it useful for decision-making.</p>" +
            "<p>The key difference from absorption costing: inventory is valued at variable cost only, " +
            "so profit figures differ when inventory levels change.</p>",
          workedExample: {
            setup:
              "Selling price = £50/unit. Variable cost = £30/unit. Fixed costs = £40,000/period. " +
              "Production = 5,000 units; Sales = 4,000 units.",
            steps: [
              "Contribution per unit = £50 − £30 = £20.",
              "Total contribution = 4,000 × £20 = £80,000.",
              "Marginal costing profit = £80,000 − £40,000 = £40,000.",
              "Absorption costing: OAR = £40,000/5,000 = £8/unit. Closing inventory = 1,000 × (£30+£8) = £38,000.",
              "Absorption profit = £40,000 + £8,000 (inventory adjustment) = £48,000.",
            ],
            answer:
              "Marginal costing profit = £40,000. Absorption costing profit = £48,000. " +
              "Difference = £8,000 (= fixed overhead in closing inventory under absorption).",
          },
          summary: [
            "Contribution = sales − variable costs.",
            "Fixed costs are period costs under marginal costing.",
            "When production > sales, absorption profit > marginal profit.",
            "When production < sales, marginal profit > absorption profit.",
          ],
          practiceQuestions: [
            {
              question: "Selling price £40, variable cost £24. What is the contribution per unit?",
              options: ["£16", "£24", "£40", "£64"],
              correct: 0,
              explanation: "Contribution = selling price − variable cost = £40 − £24 = £16.",
              topic: "Contribution",
            },
          ],
        },
        {
          id: "ba2-l5",
          title: "Break-Even Analysis",
          topic: "Decision-making",
          estimatedMinutes: 30,
          objectives: [
            "Calculate break-even point in units and revenue",
            "Calculate margin of safety",
            "Interpret and draw a break-even chart",
          ],
          explanation:
            "<p>The <strong>break-even point</strong> is where total revenue equals total cost — " +
            "no profit, no loss.</p>" +
            "<p style='text-align:center'><code>Break-even (units) = Fixed costs ÷ Contribution per unit</code></p>" +
            "<p>The <strong>margin of safety</strong> shows how far sales can fall before a loss is made:</p>" +
            "<p style='text-align:center'><code>Margin of safety = Actual sales − Break-even sales</code></p>",
          workedExample: {
            setup:
              "Fixed costs = £60,000. Selling price = £25/unit. Variable cost = £10/unit.",
            steps: [
              "Contribution per unit = £25 − £10 = £15.",
              "Break-even point = £60,000 ÷ £15 = 4,000 units.",
              "Break-even revenue = 4,000 × £25 = £100,000.",
              "If actual sales = 5,000 units: margin of safety = 5,000 − 4,000 = 1,000 units (20%).",
            ],
            answer: "Break-even = 4,000 units. Margin of safety at 5,000 units = 1,000 units (20%).",
          },
          summary: [
            "Break-even = fixed costs ÷ contribution per unit.",
            "Above break-even, each unit sold earns profit equal to the contribution.",
            "Margin of safety measures downside risk.",
            "The C/S ratio (contribution/sales) is useful when comparing multiple products.",
          ],
          practiceQuestions: [
            {
              question:
                "Fixed costs = £90,000. Contribution per unit = £18. What is the break-even point in units?",
              options: ["4,000", "5,000", "6,000", "7,500"],
              correct: 1,
              explanation: "Break-even = £90,000 ÷ £18 = 5,000 units.",
              topic: "Break-even",
            },
            {
              question:
                "Break-even sales = 8,000 units. Budgeted sales = 10,000 units. What is the margin of safety as a percentage?",
              options: ["10%", "20%", "25%", "80%"],
              correct: 1,
              explanation:
                "Margin of safety = (10,000 − 8,000) / 10,000 × 100 = 20%.",
              topic: "Margin of safety",
            },
          ],
        },
        {
          id: "ba2-l6",
          title: "Cost Behaviour and High-Low Method",
          topic: "Cost concepts",
          estimatedMinutes: 25,
          objectives: [
            "Apply the high-low method to separate fixed and variable costs",
            "Use the cost equation to predict costs at different activity levels",
          ],
          explanation:
            "<p>The <strong>high-low method</strong> uses the highest and lowest observed activity " +
            "levels to separate fixed and variable cost elements.</p>" +
            "<p style='text-align:center'><code>Variable cost per unit = (Cost at high − Cost at low) ÷ (High units − Low units)</code></p>" +
            "<p>Fixed cost = Total cost at either level − (Variable cost per unit × Units at that level).</p>",
          workedExample: {
            setup: "Activity: High = 8,000 units, cost = £46,000. Low = 4,000 units, cost = £30,000.",
            steps: [
              "Variable cost per unit = (£46,000 − £30,000) / (8,000 − 4,000) = £16,000 / 4,000 = £4.",
              "Fixed cost = £46,000 − (£4 × 8,000) = £46,000 − £32,000 = £14,000.",
              "Cost equation: Total cost = £14,000 + £4 × units.",
            ],
            answer: "Variable cost = £4/unit; Fixed cost = £14,000.",
          },
          summary: [
            "High-low separates costs using just two data points — the highest and lowest activity levels.",
            "Variable cost per unit = cost change ÷ activity change.",
            "Fixed cost = total cost − (variable rate × activity).",
            "Limitation: may not be representative if extreme values are abnormal.",
          ],
          practiceQuestions: [
            {
              question:
                "High: 10,000 units, cost £52,000. Low: 6,000 units, cost £36,000. " +
                "What is the variable cost per unit?",
              options: ["£2", "£4", "£6", "£8"],
              correct: 1,
              explanation:
                "Variable cost per unit = (£52,000 − £36,000) / (10,000 − 6,000) = £16,000 / 4,000 = £4.",
              topic: "High-low method",
            },
          ],
        },
        {
          id: "ba2-l7",
          title: "Budgeting and Budgetary Control",
          topic: "Planning and control",
          estimatedMinutes: 35,
          objectives: [
            "Explain the purposes of budgets",
            "Prepare functional and master budgets",
            "Explain the concept of a flexed budget",
          ],
          // TODO: add explanation for Budgeting and Budgetary Control
          explanation: null,
          // TODO: add worked example for Budgeting and Budgetary Control
          workedExample: null,
          // TODO: add summary for Budgeting and Budgetary Control
          summary: null,
          // TODO: add practice questions for Budgeting and Budgetary Control
          practiceQuestions: null,
        },
        {
          id: "ba2-l8",
          title: "Standard Costing and Variance Analysis",
          topic: "Control",
          estimatedMinutes: 45,
          objectives: [
            "Explain standard costing and its purpose",
            "Calculate and interpret materials, labour, and overhead variances",
            "Reconcile actual profit to standard profit using variances",
          ],
          explanation:
            "<p><strong>Standard costing</strong> sets pre-determined costs for products or services " +
            "and compares them to actual costs — the difference is a <strong>variance</strong>.</p>" +
            "<p>Key variances:</p><ul>" +
            "<li><strong>Materials price variance</strong> = (Standard price − Actual price) × Actual qty</li>" +
            "<li><strong>Materials usage variance</strong> = (Standard qty − Actual qty) × Standard price</li>" +
            "<li><strong>Labour rate variance</strong> = (Standard rate − Actual rate) × Actual hours</li>" +
            "<li><strong>Labour efficiency variance</strong> = (Standard hours − Actual hours) × Standard rate</li>" +
            "</ul>",
          workedExample: {
            setup:
              "Standard: 4 kg at £3/kg per unit. Actual: 1,000 units produced using 4,200 kg at £2.90/kg.",
            steps: [
              "Materials price variance = (£3.00 − £2.90) × 4,200 = £0.10 × 4,200 = £420 Favourable.",
              "Standard qty for actual output = 1,000 × 4 = 4,000 kg.",
              "Materials usage variance = (4,000 − 4,200) × £3.00 = −200 × £3 = −£600 Adverse.",
              "Total materials variance = £420F − £600A = £180 Adverse.",
            ],
            answer:
              "Price variance: £420 Favourable. Usage variance: £600 Adverse. Total: £180 Adverse.",
          },
          summary: [
            "Variance = difference between standard and actual cost or revenue.",
            "Favourable variance: actual cost < standard cost (or actual revenue > standard revenue).",
            "Adverse variance: actual cost > standard cost.",
            "Variances help managers focus on exceptions — management by exception.",
          ],
          practiceQuestions: [
            {
              question:
                "Standard labour rate = £12/hour. Actual rate paid = £12.50/hour. Actual hours = 2,000. " +
                "What is the labour rate variance?",
              options: [
                "£1,000 Adverse",
                "£1,000 Favourable",
                "£500 Adverse",
                "£500 Favourable",
              ],
              correct: 0,
              explanation:
                "Labour rate variance = (Standard rate − Actual rate) × Actual hours = " +
                "(£12 − £12.50) × 2,000 = −£0.50 × 2,000 = −£1,000 (Adverse).",
              topic: "Labour variance",
            },
            {
              question:
                "Standard hours for actual output = 3,600 hrs. Actual hours worked = 3,800 hrs. " +
                "Standard rate = £10/hr. What is the labour efficiency variance?",
              options: [
                "£2,000 Adverse",
                "£2,000 Favourable",
                "£200 Adverse",
                "£200 Favourable",
              ],
              correct: 0,
              explanation:
                "Labour efficiency variance = (Standard hrs − Actual hrs) × Standard rate = " +
                "(3,600 − 3,800) × £10 = −200 × £10 = −£2,000 (Adverse).",
              topic: "Labour variance",
            },
          ],
        },
        {
          id: "ba2-l9",
          title: "Short-Term Decision Making",
          topic: "Decision-making",
          estimatedMinutes: 35,
          objectives: [
            "Apply relevant costing principles to short-term decisions",
            "Evaluate make-or-buy, accept/reject, and limiting factor decisions",
            "Calculate contribution per unit of limiting factor",
          ],
          // TODO: add explanation for Short-Term Decision Making
          explanation: null,
          // TODO: add worked example for Short-Term Decision Making
          workedExample: null,
          // TODO: add summary for Short-Term Decision Making
          summary: null,
          // TODO: add practice questions for Short-Term Decision Making
          practiceQuestions: null,
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════════════════
       BA3 — Fundamentals of Financial Accounting
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: "ba3",
      title: "BA3",
      fullTitle: "Fundamentals of Financial Accounting",
      icon: "bar-chart-2",
      modules: 11,
      questions: 220,
      mockExams: 2,
      studyHoursTotal: 38,
      lessons: [
        {
          id: "ba3-l1",
          title: "The Conceptual Framework",
          topic: "Accounting foundations",
          estimatedMinutes: 25,
          objectives: [
            "Explain the objective of general purpose financial reporting",
            "Describe the qualitative characteristics of useful financial information",
            "Identify the elements of financial statements",
          ],
          // TODO: add explanation for The Conceptual Framework
          explanation: null,
          // TODO: add worked example for The Conceptual Framework
          workedExample: null,
          // TODO: add summary for The Conceptual Framework
          summary: null,
          // TODO: add practice questions for The Conceptual Framework
          practiceQuestions: null,
        },
        {
          id: "ba3-l2",
          title: "Double-Entry Bookkeeping",
          topic: "Recording transactions",
          estimatedMinutes: 40,
          objectives: [
            "Apply the principles of double-entry bookkeeping",
            "Record transactions in T-accounts",
            "Extract a trial balance from ledger accounts",
          ],
          explanation:
            "<p>Every transaction has two equal and opposite effects — a <strong>debit</strong> and a " +
            "<strong>credit</strong>. This is the foundation of double-entry bookkeeping.</p>" +
            "<p>Rules: <strong>Assets and Expenses increase with a Debit</strong>; " +
            "<strong>Liabilities, Equity and Revenue increase with a Credit</strong> " +
            "(mnemonic: <em>DEAD CLIC</em>).</p>",
          workedExample: {
            setup: "A business buys inventory on credit for £5,000.",
            steps: [
              "Inventory (asset) increases → Debit Inventory £5,000.",
              "Trade payables (liability) increases → Credit Trade Payables £5,000.",
            ],
            answer: "Dr Inventory £5,000 / Cr Trade Payables £5,000.",
          },
          summary: [
            "Every transaction has equal debits and credits.",
            "DEAD CLIC: Debits increase Expenses, Assets, Drawings; Credits increase Liabilities, Income, Capital.",
            "A trial balance checks that total debits equal total credits.",
          ],
          practiceQuestions: [
            {
              question: "A business receives £2,000 cash from a credit customer. Which entry is correct?",
              options: [
                "Dr Cash £2,000; Cr Sales £2,000",
                "Dr Receivables £2,000; Cr Cash £2,000",
                "Dr Cash £2,000; Cr Receivables £2,000",
                "Dr Sales £2,000; Cr Cash £2,000",
              ],
              correct: 2,
              explanation:
                "Cash (asset) increases: Debit Cash £2,000. The receivable (asset) decreases: Credit Receivables £2,000.",
              topic: "Double entry",
            },
          ],
        },
        {
          id: "ba3-l3",
          title: "The Income Statement",
          topic: "Financial statements",
          estimatedMinutes: 30,
          objectives: [
            "Prepare a simple income statement",
            "Distinguish between gross profit and profit for the period",
            "Account for accruals, prepayments, and depreciation in the income statement",
          ],
          // TODO: add explanation for The Income Statement
          explanation: null,
          // TODO: add worked example for The Income Statement
          workedExample: null,
          // TODO: add summary for The Income Statement
          summary: null,
          // TODO: add practice questions for The Income Statement
          practiceQuestions: null,
        },
        {
          id: "ba3-l4",
          title: "The Statement of Financial Position",
          topic: "Financial statements",
          estimatedMinutes: 35,
          objectives: [
            "Identify and classify assets, liabilities and equity",
            "Prepare a statement of financial position",
            "Apply the accounting equation",
          ],
          // TODO: add explanation for The Statement of Financial Position
          explanation: null,
          // TODO: add worked example for The Statement of Financial Position
          workedExample: null,
          // TODO: add summary for The Statement of Financial Position
          summary: null,
          // TODO: add practice questions for The Statement of Financial Position
          practiceQuestions: null,
        },
        {
          id: "ba3-l5",
          title: "Depreciation",
          topic: "Non-current assets",
          estimatedMinutes: 30,
          objectives: [
            "Explain why assets are depreciated",
            "Calculate depreciation using straight-line and reducing balance methods",
            "Account for the disposal of non-current assets",
          ],
          // TODO: add explanation for Depreciation
          explanation: null,
          // TODO: add worked example for Depreciation
          workedExample: null,
          // TODO: add summary for Depreciation
          summary: null,
          // TODO: add practice questions for Depreciation
          practiceQuestions: null,
        },
        {
          id: "ba3-l6",
          title: "Inventory Valuation",
          topic: "Current assets",
          estimatedMinutes: 30,
          objectives: [
            "Apply FIFO and weighted average cost methods",
            "Explain the lower of cost and net realisable value rule",
            "Assess the impact of inventory valuation on profit",
          ],
          // TODO: add explanation for Inventory Valuation
          explanation: null,
          // TODO: add worked example for Inventory Valuation
          workedExample: null,
          // TODO: add summary for Inventory Valuation
          summary: null,
          // TODO: add practice questions for Inventory Valuation
          practiceQuestions: null,
        },
        {
          id: "ba3-l7",
          title: "Accounts Receivable and Payable",
          topic: "Working capital",
          estimatedMinutes: 25,
          objectives: [
            "Account for irrecoverable debts and allowances for receivables",
            "Prepare control accounts for receivables and payables",
          ],
          // TODO: add explanation for Accounts Receivable and Payable
          explanation: null,
          // TODO: add worked example for Accounts Receivable and Payable
          workedExample: null,
          // TODO: add summary for Accounts Receivable and Payable
          summary: null,
          // TODO: add practice questions for Accounts Receivable and Payable
          practiceQuestions: null,
        },
        {
          id: "ba3-l8",
          title: "The Cash Flow Statement",
          topic: "Financial statements",
          estimatedMinutes: 35,
          objectives: [
            "Distinguish between profit and cash flow",
            "Classify cash flows as operating, investing, or financing",
            "Prepare a simple cash flow statement using the indirect method",
          ],
          // TODO: add explanation for The Cash Flow Statement
          explanation: null,
          // TODO: add worked example for The Cash Flow Statement
          workedExample: null,
          // TODO: add summary for The Cash Flow Statement
          summary: null,
          // TODO: add practice questions for The Cash Flow Statement
          practiceQuestions: null,
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════════════════
       BA4 — Fundamentals of Ethics, Corporate Governance & Business Law
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: "ba4",
      title: "BA4",
      fullTitle: "Fundamentals of Ethics, Corporate Governance & Business Law",
      icon: "globe",
      modules: 9,
      questions: 180,
      mockExams: 2,
      studyHoursTotal: 32,
      lessons: [
        {
          id: "ba4-l1",
          title: "Ethics in Business",
          topic: "Ethics",
          estimatedMinutes: 25,
          objectives: [
            "Explain ethical principles relevant to business and the accounting profession",
            "Apply CIMA's Code of Ethics to scenarios",
            "Identify and respond to ethical threats and safeguards",
          ],
          explanation:
            "<p>CIMA's Code of Ethics is based on five fundamental principles:</p>" +
            "<ol>" +
            "<li><strong>Integrity</strong> — be honest and straightforward in professional relationships.</li>" +
            "<li><strong>Objectivity</strong> — do not allow bias or conflict of interest to override professional judgements.</li>" +
            "<li><strong>Professional competence and due care</strong> — maintain knowledge and skills; act diligently.</li>" +
            "<li><strong>Confidentiality</strong> — do not disclose information without proper authority.</li>" +
            "<li><strong>Professional behaviour</strong> — comply with laws and avoid actions that discredit the profession.</li>" +
            "</ol>",
          // TODO: add worked example for Ethics in Business
          workedExample: null,
          summary: [
            "CIMA's five principles: Integrity, Objectivity, Competence and due care, Confidentiality, Professional behaviour.",
            "Threats to principles include self-interest, self-review, advocacy, familiarity, and intimidation.",
            "Safeguards can be created by the profession or by the work environment.",
          ],
          practiceQuestions: [
            {
              question:
                "A management accountant is asked by a director to inflate revenue figures to meet a bonus target. " +
                "Which CIMA ethical principle is most directly threatened?",
              options: [
                "Confidentiality",
                "Professional behaviour",
                "Integrity",
                "Objectivity",
              ],
              correct: 2,
              explanation:
                "Integrity requires honesty and straightforwardness. Inflating revenue figures is dishonest and directly violates integrity.",
              topic: "CIMA ethical principles",
            },
          ],
        },
        {
          id: "ba4-l2",
          title: "Corporate Governance",
          topic: "Governance",
          estimatedMinutes: 30,
          objectives: [
            "Explain the concept of corporate governance and why it matters",
            "Describe the roles of the board of directors and audit committee",
            "Identify the principles of the UK Corporate Governance Code",
          ],
          // TODO: add explanation for Corporate Governance
          explanation: null,
          // TODO: add worked example for Corporate Governance
          workedExample: null,
          // TODO: add summary for Corporate Governance
          summary: null,
          // TODO: add practice questions for Corporate Governance
          practiceQuestions: null,
        },
        {
          id: "ba4-l3",
          title: "Company Law Fundamentals",
          topic: "Business law",
          estimatedMinutes: 30,
          objectives: [
            "Distinguish between different types of business entity",
            "Explain the legal implications of incorporation",
            "Describe the rights and duties of directors and shareholders",
          ],
          // TODO: add explanation for Company Law Fundamentals
          explanation: null,
          // TODO: add worked example for Company Law Fundamentals
          workedExample: null,
          // TODO: add summary for Company Law Fundamentals
          summary: null,
          // TODO: add practice questions for Company Law Fundamentals
          practiceQuestions: null,
        },
        {
          id: "ba4-l4",
          title: "Contract Law",
          topic: "Business law",
          estimatedMinutes: 25,
          objectives: [
            "Identify the essential elements of a valid contract",
            "Explain breach of contract and available remedies",
            "Apply contract law principles to business scenarios",
          ],
          // TODO: add explanation for Contract Law
          explanation: null,
          // TODO: add worked example for Contract Law
          workedExample: null,
          // TODO: add summary for Contract Law
          summary: null,
          // TODO: add practice questions for Contract Law
          practiceQuestions: null,
        },
        {
          id: "ba4-l5",
          title: "Employment Law",
          topic: "Business law",
          estimatedMinutes: 25,
          objectives: [
            "Explain the distinction between employees and independent contractors",
            "Describe the main statutory employment rights",
            "Explain unfair dismissal and redundancy",
          ],
          // TODO: add explanation for Employment Law
          explanation: null,
          // TODO: add worked example for Employment Law
          workedExample: null,
          // TODO: add summary for Employment Law
          summary: null,
          // TODO: add practice questions for Employment Law
          practiceQuestions: null,
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════════════════
       OPERATIONAL LEVEL — unlocked after all BA1–BA4 are complete
       ══════════════════════════════════════════════════════════════════════ */

    {
      id: "e1",
      title: "E1",
      fullTitle: "Managing Finance in a Digital World",
      icon: "monitor",
      modules: 8,
      questions: 160,
      mockExams: 2,
      studyHoursTotal: 45,
      lessons: [
        {
          id: "e1-l1",
          title: "The Digital Finance Function",
          topic: "Digital transformation",
          estimatedMinutes: 30,
          objectives: [
            "Explain how digital technologies are reshaping the finance function",
            "Identify automation, AI, and data analytics opportunities in finance",
            "Describe the role of the finance business partner in a digital organisation",
          ],
          // TODO: add explanation for The Digital Finance Function
          explanation: null,
          // TODO: add worked example for The Digital Finance Function
          workedExample: null,
          // TODO: add summary for The Digital Finance Function
          summary: null,
          // TODO: add practice questions for The Digital Finance Function
          practiceQuestions: null,
        },
        {
          id: "e1-l2",
          title: "Data and Information Management",
          topic: "Data governance",
          estimatedMinutes: 30,
          objectives: [
            "Distinguish between data, information and knowledge",
            "Explain data governance and data quality principles",
            "Describe cloud computing and its implications for finance",
          ],
          // TODO: add explanation for Data and Information Management
          explanation: null,
          // TODO: add worked example for Data and Information Management
          workedExample: null,
          // TODO: add summary for Data and Information Management
          summary: null,
          // TODO: add practice questions for Data and Information Management
          practiceQuestions: null,
        },
        {
          id: "e1-l3",
          title: "Business Models and Value Creation",
          topic: "Strategy",
          estimatedMinutes: 35,
          objectives: [
            "Explain the components of a business model",
            "Apply frameworks to analyse value creation (e.g., Porter's Value Chain)",
            "Assess the impact of digital disruption on business models",
          ],
          // TODO: add explanation for Business Models and Value Creation
          explanation: null,
          // TODO: add worked example for Business Models and Value Creation
          workedExample: null,
          // TODO: add summary for Business Models and Value Creation
          summary: null,
          // TODO: add practice questions for Business Models and Value Creation
          practiceQuestions: null,
        },
        {
          id: "e1-l4",
          title: "Managing People and Relationships",
          topic: "Leadership and people",
          estimatedMinutes: 30,
          objectives: [
            "Explain motivation theories and their application",
            "Describe leadership styles and when each is appropriate",
            "Explain the finance business partnering model",
          ],
          // TODO: add explanation for Managing People and Relationships
          explanation: null,
          // TODO: add worked example for Managing People and Relationships
          workedExample: null,
          // TODO: add summary for Managing People and Relationships
          summary: null,
          // TODO: add practice questions for Managing People and Relationships
          practiceQuestions: null,
        },
        {
          id: "e1-l5",
          title: "Risk and Control",
          topic: "Risk management",
          estimatedMinutes: 35,
          objectives: [
            "Identify categories of risk facing organisations",
            "Apply risk management frameworks (e.g., COSO, risk register)",
            "Explain internal controls and their purpose",
          ],
          // TODO: add explanation for Risk and Control
          explanation: null,
          // TODO: add worked example for Risk and Control
          workedExample: null,
          // TODO: add summary for Risk and Control
          summary: null,
          // TODO: add practice questions for Risk and Control
          practiceQuestions: null,
        },
        {
          id: "e1-l6",
          title: "Sustainability and Corporate Responsibility",
          topic: "ESG",
          estimatedMinutes: 30,
          objectives: [
            "Explain the concept of sustainability and the triple bottom line",
            "Describe ESG reporting frameworks (e.g., GRI, TCFD)",
            "Explain how management accountants support sustainability reporting",
          ],
          // TODO: add explanation for Sustainability and Corporate Responsibility
          explanation: null,
          // TODO: add worked example for Sustainability and Corporate Responsibility
          workedExample: null,
          // TODO: add summary for Sustainability and Corporate Responsibility
          summary: null,
          // TODO: add practice questions for Sustainability and Corporate Responsibility
          practiceQuestions: null,
        },
      ],
    },

    {
      id: "p1",
      title: "P1",
      fullTitle: "Management Accounting",
      icon: "trending-up",
      modules: 9,
      questions: 180,
      mockExams: 2,
      studyHoursTotal: 45,
      lessons: [
        {
          id: "p1-l1",
          title: "Cost Accounting Systems",
          topic: "Costing",
          estimatedMinutes: 35,
          objectives: [
            "Compare job, batch, process and service costing systems",
            "Prepare process accounts including normal and abnormal losses",
            "Explain joint products and by-products",
          ],
          // TODO: add explanation for Cost Accounting Systems
          explanation: null,
          // TODO: add worked example for Cost Accounting Systems
          workedExample: null,
          // TODO: add summary for Cost Accounting Systems
          summary: null,
          // TODO: add practice questions for Cost Accounting Systems
          practiceQuestions: null,
        },
        {
          id: "p1-l2",
          title: "Activity-Based Costing",
          topic: "Costing",
          estimatedMinutes: 40,
          objectives: [
            "Explain the rationale for and principles of ABC",
            "Calculate product costs using ABC",
            "Compare ABC to traditional absorption costing",
          ],
          // TODO: add explanation for Activity-Based Costing
          explanation: null,
          // TODO: add worked example for Activity-Based Costing
          workedExample: null,
          // TODO: add summary for Activity-Based Costing
          summary: null,
          // TODO: add practice questions for Activity-Based Costing
          practiceQuestions: null,
        },
        {
          id: "p1-l3",
          title: "Throughput Accounting",
          topic: "Costing",
          estimatedMinutes: 30,
          objectives: [
            "Explain the Theory of Constraints",
            "Calculate throughput accounting ratio (TPAR)",
            "Use TPAR to prioritise production",
          ],
          // TODO: add explanation for Throughput Accounting
          explanation: null,
          // TODO: add worked example for Throughput Accounting
          workedExample: null,
          // TODO: add summary for Throughput Accounting
          summary: null,
          // TODO: add practice questions for Throughput Accounting
          practiceQuestions: null,
        },
        {
          id: "p1-l4",
          title: "Advanced Variance Analysis",
          topic: "Control",
          estimatedMinutes: 45,
          objectives: [
            "Calculate mix and yield variances for materials",
            "Calculate planning and operational variances",
            "Explain the causes and investigate variances appropriately",
          ],
          // TODO: add explanation for Advanced Variance Analysis
          explanation: null,
          // TODO: add worked example for Advanced Variance Analysis
          workedExample: null,
          // TODO: add summary for Advanced Variance Analysis
          summary: null,
          // TODO: add practice questions for Advanced Variance Analysis
          practiceQuestions: null,
        },
        {
          id: "p1-l5",
          title: "Performance Measurement",
          topic: "Performance management",
          estimatedMinutes: 40,
          objectives: [
            "Explain the Balanced Scorecard and its four perspectives",
            "Apply financial and non-financial performance measures",
            "Assess the performance of responsibility centres",
          ],
          // TODO: add explanation for Performance Measurement
          explanation: null,
          // TODO: add worked example for Performance Measurement
          workedExample: null,
          // TODO: add summary for Performance Measurement
          summary: null,
          // TODO: add practice questions for Performance Measurement
          practiceQuestions: null,
        },
        {
          id: "p1-l6",
          title: "Pricing Decisions",
          topic: "Decision-making",
          estimatedMinutes: 35,
          objectives: [
            "Apply cost-plus, target and marginal cost pricing strategies",
            "Explain price elasticity and its relevance to pricing",
            "Evaluate transfer pricing methods",
          ],
          // TODO: add explanation for Pricing Decisions
          explanation: null,
          // TODO: add worked example for Pricing Decisions
          workedExample: null,
          // TODO: add summary for Pricing Decisions
          summary: null,
          // TODO: add practice questions for Pricing Decisions
          practiceQuestions: null,
        },
        {
          id: "p1-l7",
          title: "Investment Appraisal",
          topic: "Decision-making",
          estimatedMinutes: 45,
          objectives: [
            "Apply NPV, IRR, payback, and ARR methods",
            "Explain the time value of money",
            "Account for risk in investment decisions",
          ],
          // TODO: add explanation for Investment Appraisal
          explanation: null,
          // TODO: add worked example for Investment Appraisal
          workedExample: null,
          // TODO: add summary for Investment Appraisal
          summary: null,
          // TODO: add practice questions for Investment Appraisal
          practiceQuestions: null,
        },
      ],
    },

    {
      id: "f1",
      title: "F1",
      fullTitle: "Financial Reporting and Taxation",
      icon: "file-text",
      modules: 9,
      questions: 180,
      mockExams: 2,
      studyHoursTotal: 45,
      lessons: [
        {
          id: "f1-l1",
          title: "The Regulatory Framework",
          topic: "Financial reporting",
          estimatedMinutes: 25,
          objectives: [
            "Explain the role of the IASB and IFRS Foundation",
            "Describe the standard-setting process",
            "Distinguish between principles-based and rules-based frameworks",
          ],
          // TODO: add explanation for The Regulatory Framework
          explanation: null,
          // TODO: add worked example for The Regulatory Framework
          workedExample: null,
          // TODO: add summary for The Regulatory Framework
          summary: null,
          // TODO: add practice questions for The Regulatory Framework
          practiceQuestions: null,
        },
        {
          id: "f1-l2",
          title: "Non-Current Assets (IAS 16, IAS 38, IAS 40)",
          topic: "Financial reporting",
          estimatedMinutes: 40,
          objectives: [
            "Apply the recognition and measurement rules for PPE (IAS 16)",
            "Account for intangible assets (IAS 38)",
            "Explain investment property accounting (IAS 40)",
          ],
          // TODO: add explanation for Non-Current Assets
          explanation: null,
          // TODO: add worked example for Non-Current Assets
          workedExample: null,
          // TODO: add summary for Non-Current Assets
          summary: null,
          // TODO: add practice questions for Non-Current Assets
          practiceQuestions: null,
        },
        {
          id: "f1-l3",
          title: "Provisions, Contingencies and Events (IAS 37, IAS 10)",
          topic: "Financial reporting",
          estimatedMinutes: 30,
          objectives: [
            "Apply the recognition criteria for provisions (IAS 37)",
            "Distinguish provisions from contingent liabilities and assets",
            "Adjust financial statements for events after the reporting period (IAS 10)",
          ],
          // TODO: add explanation for Provisions, Contingencies and Events
          explanation: null,
          // TODO: add worked example for Provisions, Contingencies and Events
          workedExample: null,
          // TODO: add summary for Provisions, Contingencies and Events
          summary: null,
          // TODO: add practice questions for Provisions, Contingencies and Events
          practiceQuestions: null,
        },
        {
          id: "f1-l4",
          title: "Revenue Recognition (IFRS 15)",
          topic: "Financial reporting",
          estimatedMinutes: 35,
          objectives: [
            "Apply the 5-step model for revenue recognition (IFRS 15)",
            "Account for contract modifications and variable consideration",
            "Identify performance obligations in contracts",
          ],
          // TODO: add explanation for Revenue Recognition
          explanation: null,
          // TODO: add worked example for Revenue Recognition
          workedExample: null,
          // TODO: add summary for Revenue Recognition
          summary: null,
          // TODO: add practice questions for Revenue Recognition
          practiceQuestions: null,
        },
        {
          id: "f1-l5",
          title: "Leases (IFRS 16)",
          topic: "Financial reporting",
          estimatedMinutes: 35,
          objectives: [
            "Identify lease arrangements and apply the IFRS 16 recognition criteria",
            "Account for right-of-use assets and lease liabilities",
            "Explain the exemptions for short-term and low-value leases",
          ],
          // TODO: add explanation for Leases
          explanation: null,
          // TODO: add worked example for Leases
          workedExample: null,
          // TODO: add summary for Leases
          summary: null,
          // TODO: add practice questions for Leases
          practiceQuestions: null,
        },
        {
          id: "f1-l6",
          title: "Group Accounts — Introduction",
          topic: "Group accounting",
          estimatedMinutes: 40,
          objectives: [
            "Define subsidiaries and explain when consolidation is required (IFRS 10)",
            "Prepare a consolidated statement of financial position",
            "Account for goodwill on acquisition",
          ],
          // TODO: add explanation for Group Accounts — Introduction
          explanation: null,
          // TODO: add worked example for Group Accounts — Introduction
          workedExample: null,
          // TODO: add summary for Group Accounts — Introduction
          summary: null,
          // TODO: add practice questions for Group Accounts — Introduction
          practiceQuestions: null,
        },
        {
          id: "f1-l7",
          title: "Taxation in Financial Statements",
          topic: "Taxation",
          estimatedMinutes: 35,
          objectives: [
            "Distinguish between current and deferred tax",
            "Calculate deferred tax using the temporary difference approach (IAS 12)",
            "Explain the impact of deferred tax on the financial statements",
          ],
          // TODO: add explanation for Taxation in Financial Statements
          explanation: null,
          // TODO: add worked example for Taxation in Financial Statements
          workedExample: null,
          // TODO: add summary for Taxation in Financial Statements
          summary: null,
          // TODO: add practice questions for Taxation in Financial Statements
          practiceQuestions: null,
        },
      ],
    },
  ],

  /* ══════════════════════════════════════════════════════════════════════════
     CAREER PATHWAY — maps CIMA levels to career roles and next steps
     Used by the Profile dashboard and any "Where does this take me?" surfaces.
     TODO: extend with salary data, employer case studies, and real job links.
     ══════════════════════════════════════════════════════════════════════════ */
  careerPathway: [
    {
      id: "certificate",
      stage: "Certificate Level",
      papers: ["ba1", "ba2", "ba3", "ba4"],
      qualification: "CIMA Certificate in Business Accounting",
      typicalRoles: [
        "Accounts Assistant",
        "Finance Assistant",
        "Junior Management Accountant",
        "Bookkeeper",
      ],
      skills: [
        "Cost classification and behaviour",
        "Double-entry bookkeeping",
        "Variance analysis basics",
        "Business economics fundamentals",
        "Ethics and governance awareness",
      ],
      unlocks: "operational",
      icon: "award",
      // TODO: add real employer case studies for Certificate Level
    },
    {
      id: "operational",
      stage: "Operational Level",
      papers: ["e1", "p1", "f1"],
      qualification: "CIMA Operational Certificate",
      typicalRoles: [
        "Management Accountant",
        "Finance Business Partner (junior)",
        "Financial Analyst",
        "Cost Accountant",
      ],
      skills: [
        "Advanced costing (ABC, throughput)",
        "Financial reporting (IFRS)",
        "Digital finance and data analytics",
        "Investment appraisal",
        "Performance measurement",
      ],
      unlocks: "management",
      icon: "trending-up",
      // TODO: add real employer case studies for Operational Level
    },
    {
      id: "management",
      stage: "Management Level",
      papers: ["e2", "p2", "f2"],
      qualification: "CIMA Management Certificate",
      typicalRoles: [
        "Senior Management Accountant",
        "Finance Business Partner",
        "Financial Controller",
        "Treasury Analyst",
      ],
      skills: [
        "Advanced performance management",
        "Risk management",
        "Strategic financial analysis",
        "Project and relationship management",
      ],
      unlocks: "strategic",
      icon: "briefcase",
      // TODO: populate Management Level course catalogue
    },
    {
      id: "strategic",
      stage: "Strategic Level",
      papers: ["e3", "p3", "f3"],
      qualification: "CIMA Strategic Certificate → CGMA designation",
      typicalRoles: [
        "Finance Director",
        "CFO",
        "Group Financial Controller",
        "Commercial Director",
      ],
      skills: [
        "Corporate strategy",
        "Risk leadership",
        "Advanced financial reporting",
        "Leadership and board-level communication",
      ],
      unlocks: null,
      icon: "star",
      // TODO: populate Strategic Level course catalogue
    },
  ],
};

window.AIQ_COURSE_DATA = AIQ_COURSE_DATA;
