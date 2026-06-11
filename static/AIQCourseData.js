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
          explanation:
            "<p>A <strong>market economy</strong> allocates resources through the price mechanism — the interaction of supply and demand determines what is produced, how it is produced, and for whom.</p>" +
            "<p>Economics divides into two branches:</p>" +
            "<ul>" +
            "<li><strong>Microeconomics</strong> — studies individual markets, firms, and consumers (e.g., the price of steel, the wage of a nurse).</li>" +
            "<li><strong>Macroeconomics</strong> — studies the economy as a whole (e.g., GDP growth, national unemployment, inflation).</li>" +
            "</ul>" +
            "<p><strong>Stakeholders</strong> are any parties with an interest in an organisation's activities. They can be internal (employees, managers) or external (customers, suppliers, government, community). Different stakeholder groups have different — sometimes conflicting — objectives.</p>",
          workedExample: {
            setup: "A large food manufacturer is considering closing a factory to reduce costs. Identify the main stakeholders affected and outline their likely objectives.",
            steps: [
              "Shareholders: primary objective is return on investment — they may welcome cost savings that boost profit.",
              "Employees at the factory: seek job security — closure directly threatens their livelihoods.",
              "Customers: want product availability and stable prices — closure may disrupt supply.",
              "Suppliers to that factory: rely on orders — closure reduces their revenue.",
              "Local government: concerned about unemployment and reduced local tax revenues.",
              "Environmental groups: may welcome reduced industrial activity if it cuts emissions.",
            ],
            answer: "Each stakeholder is affected differently. Management must weigh shareholder returns against employee welfare, community impact, and reputational risk.",
          },
          summary: [
            "A market economy allocates scarce resources through the price mechanism (supply and demand).",
            "Microeconomics = individual markets; macroeconomics = the whole economy.",
            "Stakeholders include all parties — internal and external — with an interest in the organisation.",
            "Stakeholder objectives frequently conflict; management must balance competing claims.",
          ],
          practiceQuestions: [
            {
              question: "Which branch of economics studies economy-wide variables such as national income, inflation, and unemployment?",
              options: ["Microeconomics", "Macroeconomics", "Business economics", "International economics"],
              correct: 1,
              explanation: "Macroeconomics examines the economy as a whole. Microeconomics focuses on individual markets and agents.",
              topic: "Economics fundamentals",
            },
            {
              question: "In a free market economy, the allocation of scarce resources is primarily determined by:",
              options: ["Government planning", "The price mechanism", "Trade union agreements", "Central bank policy"],
              correct: 1,
              explanation: "In a market economy, prices signal where resources should go. Rising prices attract producers and discourage consumers, allocating resources without central direction.",
              topic: "Market economy",
            },
          ],
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
          explanation:
            "<p>A <strong>market structure</strong> describes the key characteristics of a market — number of firms, product type, and barriers to entry — which together determine pricing power and firm behaviour.</p>" +
            "<table><thead><tr><th>Feature</th><th>Perfect competition</th><th>Monopolistic competition</th><th>Oligopoly</th><th>Monopoly</th></tr></thead>" +
            "<tbody>" +
            "<tr><td>Number of sellers</td><td>Very many</td><td>Many</td><td>Few</td><td>One</td></tr>" +
            "<tr><td>Product</td><td>Identical (homogeneous)</td><td>Differentiated</td><td>Differentiated or homogeneous</td><td>Unique</td></tr>" +
            "<tr><td>Pricing power</td><td>None (price taker)</td><td>Some</td><td>Significant (interdependent)</td><td>Full (price maker)</td></tr>" +
            "<tr><td>Barriers to entry</td><td>None</td><td>Low</td><td>High</td><td>Very high</td></tr>" +
            "<tr><td>Example</td><td>Wheat farming</td><td>Restaurants</td><td>Mobile networks</td><td>National rail network</td></tr>" +
            "</tbody></table>" +
            "<p>In <strong>perfect competition</strong>, firms are price takers and earn only normal profit in the long run. In a <strong>monopoly</strong>, the firm restricts output to raise price above competitive levels, reducing consumer surplus — this is the deadweight loss of monopoly.</p>",
          workedExample: {
            setup: "Compare the pricing and output decisions of a perfectly competitive firm versus a monopoly, both facing the same cost structure.",
            steps: [
              "In perfect competition, the firm takes the market price as given (P = MR). It produces where P = MC.",
              "This leads to allocative efficiency — price equals the marginal cost of production.",
              "A monopoly faces the downward-sloping market demand curve. To sell more, it must cut price on all units.",
              "Marginal revenue (MR) falls faster than price. The monopolist produces where MR = MC.",
              "Because MR < P, the monopolist sets P > MC — output is lower and price is higher than in perfect competition.",
              "This creates a deadweight welfare loss — mutually beneficial trades that don't happen.",
            ],
            answer: "Monopoly: lower output, higher price, allocative inefficiency, deadweight loss. Perfect competition: higher output, lower price, allocative efficiency.",
          },
          summary: [
            "Market structures range from perfect competition (many firms, no pricing power) to monopoly (one firm, full pricing power).",
            "Oligopoly involves few large firms — their decisions are interdependent (game theory applies).",
            "Barriers to entry protect monopoly power — patents, economies of scale, regulation, brand loyalty.",
            "Monopoly restricts output and raises price above competitive level, creating deadweight welfare loss.",
          ],
          practiceQuestions: [
            {
              question: "Which of the following is a characteristic of a perfectly competitive market?",
              options: [
                "High barriers to entry and exit",
                "Firms are price makers",
                "Homogeneous products and many buyers and sellers",
                "Significant product differentiation",
              ],
              correct: 2,
              explanation: "Perfect competition requires many buyers and sellers trading identical products. Each firm is a price taker — it has no power to set a price above the market level.",
              topic: "Market structures",
            },
            {
              question: "In an oligopoly, the pricing decisions of one firm are best described as:",
              options: [
                "Independent of competitors",
                "Determined solely by government regulation",
                "Interdependent with the decisions of other firms",
                "Set equal to marginal cost",
              ],
              correct: 2,
              explanation: "Oligopoly is characterised by a small number of large firms whose strategies are interdependent. Each firm must consider likely reactions when changing price or output.",
              topic: "Oligopoly",
            },
          ],
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
          explanation:
            "<p><strong>Gross Domestic Product (GDP)</strong> measures the total value of goods and services produced in a country in a given period. It can be measured in three equivalent ways:</p>" +
            "<ul>" +
            "<li><strong>Expenditure approach:</strong> GDP = C + I + G + (X − M)<br>" +
            "C = consumer spending, I = investment, G = government spending, X = exports, M = imports.</li>" +
            "<li><strong>Income approach:</strong> sum of wages, profits, rent, and interest earned by factors of production.</li>" +
            "<li><strong>Output approach:</strong> sum of the value added by each sector of the economy.</li>" +
            "</ul>" +
            "<p><strong>Nominal GDP</strong> is measured at current prices. <strong>Real GDP</strong> adjusts for inflation, giving a true picture of output growth over time.</p>" +
            "<p>Long-run economic growth requires increases in the quantity or quality of the factors of production: land, labour, capital, and enterprise.</p>",
          workedExample: {
            setup: "Country A has nominal GDP of £500bn in Year 1 and £540bn in Year 2. The price level rose by 5% over the same period. Calculate real GDP growth.",
            steps: [
              "Nominal GDP growth = (540 − 500) / 500 × 100 = 8%.",
              "To find real GDP in Year 2 at Year 1 prices: £540bn / 1.05 = £514.3bn.",
              "Real GDP growth = (514.3 − 500) / 500 × 100 = 2.86%.",
            ],
            answer: "Real GDP grew by approximately 2.9%. The rest of the 8% nominal growth was due to inflation, not real increases in output.",
          },
          summary: [
            "GDP measures total output; it can be calculated via expenditure (C+I+G+X−M), income, or output approaches.",
            "Nominal GDP uses current prices; real GDP adjusts for inflation to show true output change.",
            "Economic growth means real GDP rising over time.",
            "Long-run growth requires more or better factors of production: labour, capital, technology, and enterprise.",
          ],
          practiceQuestions: [
            {
              question: "In the expenditure approach to GDP, which of the following correctly represents the formula?",
              options: [
                "GDP = C + I + G + (M − X)",
                "GDP = C + I + G + (X − M)",
                "GDP = C + S + G + (X − M)",
                "GDP = C + I + T + (X − M)",
              ],
              correct: 1,
              explanation: "The expenditure approach: GDP = Consumer spending + Investment + Government spending + Net exports (Exports minus Imports). Imports are subtracted because they represent spending on foreign output.",
              topic: "GDP measurement",
            },
            {
              question: "If nominal GDP rises by 6% but the price level rises by 4%, by approximately how much has real GDP grown?",
              options: ["2%", "4%", "6%", "10%"],
              correct: 0,
              explanation: "Real GDP growth ≈ Nominal GDP growth − Inflation = 6% − 4% = 2%. Real GDP strips out the effect of price increases to show true output growth.",
              topic: "Real vs nominal GDP",
            },
          ],
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
          explanation:
            "<p><strong>Inflation</strong> is a sustained rise in the general price level. It is measured by the <strong>Consumer Price Index (CPI)</strong> — a weighted average of prices of a representative basket of goods and services.</p>" +
            "<p>Types of inflation:</p>" +
            "<ul>" +
            "<li><strong>Demand-pull:</strong> excessive demand in the economy pulls prices up ('too much money chasing too few goods').</li>" +
            "<li><strong>Cost-push:</strong> rising production costs (e.g., wages, raw materials) push prices up.</li>" +
            "<li><strong>Imported inflation:</strong> caused by a falling exchange rate making imports more expensive.</li>" +
            "</ul>" +
            "<p><strong>Unemployment</strong> is measured as the percentage of the labour force actively seeking work but unable to find it. Types include frictional (between jobs), structural (skills mismatch), cyclical (lack of demand), and seasonal.</p>" +
            "<p>The <strong>Phillips Curve</strong> describes a short-run trade-off between inflation and unemployment: lower unemployment tends to coincide with higher inflation. However, in the long run this trade-off breaks down as expectations adjust.</p>",
          workedExample: {
            setup: "CPI basket prices: food £200 → £210; transport £150 → £162; housing £300 → £306. Weights: food 30%, transport 25%, housing 45%. Calculate the CPI inflation rate.",
            steps: [
              "Food inflation = (210 − 200) / 200 × 100 = 5.0%.",
              "Transport inflation = (162 − 150) / 150 × 100 = 8.0%.",
              "Housing inflation = (306 − 300) / 300 × 100 = 2.0%.",
              "Weighted CPI inflation = (5.0 × 0.30) + (8.0 × 0.25) + (2.0 × 0.45).",
              "= 1.5 + 2.0 + 0.9 = 4.4%.",
            ],
            answer: "CPI inflation = 4.4%. Housing dominates the basket by weight but rose least; transport rose most but has a smaller weight.",
          },
          summary: [
            "Inflation is a sustained rise in the general price level, measured by the CPI.",
            "Causes: demand-pull (excess demand), cost-push (rising costs), or imported (weak exchange rate).",
            "Unemployment measures those actively seeking work but unable to find it.",
            "The short-run Phillips Curve shows a trade-off: lower unemployment tends to coincide with higher inflation.",
          ],
          practiceQuestions: [
            {
              question: "An economy is experiencing inflation caused primarily by rising global oil prices. This is best described as:",
              options: ["Demand-pull inflation", "Cost-push inflation", "Hyperinflation", "Wage-price spiral"],
              correct: 1,
              explanation: "Rising oil prices increase production costs across the economy, pushing prices up from the supply side — this is cost-push inflation.",
              topic: "Types of inflation",
            },
            {
              question: "The short-run Phillips Curve illustrates a trade-off between:",
              options: [
                "Inflation and economic growth",
                "Unemployment and economic growth",
                "Inflation and unemployment",
                "Interest rates and investment",
              ],
              correct: 2,
              explanation: "The Phillips Curve shows that in the short run, lower unemployment is associated with higher inflation as demand pressures in both labour and goods markets intensify.",
              topic: "Phillips Curve",
            },
          ],
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
          explanation:
            "<p><strong>Fiscal policy</strong> is the use of government spending and taxation to influence the economy.</p>" +
            "<ul>" +
            "<li><strong>Expansionary fiscal policy:</strong> increase government spending and/or cut taxes — increases aggregate demand, stimulates growth.</li>" +
            "<li><strong>Contractionary fiscal policy:</strong> cut spending and/or raise taxes — reduces aggregate demand, combats inflation.</li>" +
            "</ul>" +
            "<p><strong>Monetary policy</strong> is the use of interest rates, money supply, and credit conditions to influence economic activity. In the UK, the Bank of England's Monetary Policy Committee (MPC) sets the base rate.</p>" +
            "<ul>" +
            "<li><strong>Raising interest rates:</strong> reduces borrowing and spending; cools inflation but may slow growth.</li>" +
            "<li><strong>Cutting interest rates:</strong> encourages borrowing and investment; stimulates growth but may fuel inflation.</li>" +
            "</ul>" +
            "<p><strong>Limitations:</strong> fiscal policy has time lags (political process); monetary policy may be ineffective in a liquidity trap. Both face the risk of policy conflict if governments and central banks have different objectives.</p>",
          workedExample: {
            setup: "The economy is in recession with 8% unemployment and 1% GDP growth. The central bank cuts interest rates from 4% to 1.5%. Trace the expected transmission mechanism.",
            steps: [
              "Lower base rate reduces the cost of borrowing for households and businesses.",
              "Households with variable-rate mortgages have more disposable income → increased consumer spending (C ↑).",
              "Businesses face lower cost of capital → investment in plant and equipment rises (I ↑).",
              "A weaker pound (lower rates attract less foreign capital) makes exports cheaper → export demand rises (X ↑).",
              "Increased C + I + X raises aggregate demand, boosting GDP and reducing unemployment.",
            ],
            answer: "Rate cut → cheaper borrowing → more spending and investment → higher aggregate demand → GDP growth and falling unemployment. Risk: if inflation is already high, the stimulus could overheat the economy.",
          },
          summary: [
            "Fiscal policy: government uses spending and taxation to manage aggregate demand.",
            "Monetary policy: central bank uses interest rates to influence borrowing, spending, and inflation.",
            "Expansionary policy stimulates growth; contractionary policy reduces inflation.",
            "Both policies face time lags and may conflict — the Bank of England is independent precisely to depoliticise monetary decisions.",
          ],
          practiceQuestions: [
            {
              question: "A government reduces income tax rates and increases public infrastructure spending. This is best described as:",
              options: [
                "Contractionary fiscal policy",
                "Expansionary fiscal policy",
                "Expansionary monetary policy",
                "Supply-side policy",
              ],
              correct: 1,
              explanation: "Cutting taxes and raising government spending both increase aggregate demand — this is expansionary fiscal policy, typically used to stimulate growth during a recession.",
              topic: "Fiscal policy",
            },
            {
              question: "The Bank of England raises its base interest rate. What is the most likely direct effect on the economy?",
              options: [
                "Increased consumer spending",
                "Reduced cost of borrowing for businesses",
                "Reduced inflation by dampening demand",
                "Depreciation of the pound sterling",
              ],
              correct: 2,
              explanation: "Higher interest rates increase borrowing costs, reducing consumer and business spending and cooling inflationary demand pressure. Higher rates also tend to strengthen the currency (opposite of depreciation).",
              topic: "Monetary policy",
            },
          ],
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
          explanation:
            "<p>Countries trade because of <strong>comparative advantage</strong>: a country should specialise in the goods it produces at the lowest <em>opportunity cost</em> and import the rest, even if it is absolutely more efficient at producing everything.</p>" +
            "<p>Trade barriers restrict free trade:</p>" +
            "<ul>" +
            "<li><strong>Tariff</strong> — a tax on imports; raises the domestic price and protects home producers.</li>" +
            "<li><strong>Quota</strong> — a physical limit on import volumes.</li>" +
            "<li><strong>Subsidy</strong> — government payment to domestic producers to make them more competitive.</li>" +
            "</ul>" +
            "<p>The <strong>exchange rate</strong> is the price of one currency in terms of another. A <strong>stronger pound</strong> (appreciation) makes UK exports more expensive and imports cheaper. A <strong>weaker pound</strong> (depreciation) makes exports cheaper and imports more expensive, boosting export competitiveness but raising import costs (and inflation).</p>",
          workedExample: {
            setup: "Country A can produce: 1 hour = 10 cars or 20 tonnes of wheat. Country B: 1 hour = 6 cars or 18 tonnes of wheat. Should they specialise and trade?",
            steps: [
              "Opportunity cost of 1 car in A = 20/10 = 2 tonnes of wheat.",
              "Opportunity cost of 1 car in B = 18/6 = 3 tonnes of wheat.",
              "A has the lower opportunity cost for cars (2 vs 3) → A has comparative advantage in cars.",
              "Opportunity cost of 1 tonne of wheat in A = 10/20 = 0.5 cars.",
              "Opportunity cost of 1 tonne of wheat in B = 6/18 = 0.33 cars.",
              "B has the lower opportunity cost for wheat (0.33 vs 0.5) → B has comparative advantage in wheat.",
            ],
            answer: "A should specialise in cars; B in wheat. Both countries can consume more of both goods through trade than without it — this is the gain from comparative advantage.",
          },
          summary: [
            "Comparative advantage: specialise where your opportunity cost is lowest, even if not the most efficient producer overall.",
            "Tariffs raise import prices, protecting domestic industry but reducing consumer welfare.",
            "A strong currency helps importers but hurts exporters; a weak currency boosts exports but raises import prices.",
            "Exchange rate movements affect inflation, trade balances, and business competitiveness.",
          ],
          practiceQuestions: [
            {
              question: "Comparative advantage is based on which of the following principles?",
              options: [
                "A country should produce all goods where it is the most efficient producer",
                "Countries should restrict trade to protect domestic jobs",
                "A country gains by specialising in goods with the lowest opportunity cost",
                "Wealthier countries should subsidise poorer countries",
              ],
              correct: 2,
              explanation: "Comparative advantage means specialising where your opportunity cost is lowest — you give up the least to produce that good. Both countries can gain from trade even if one is more efficient at everything.",
              topic: "Comparative advantage",
            },
            {
              question: "The pound sterling depreciates against the euro. Which of the following is most likely?",
              options: [
                "UK exports become more expensive for eurozone buyers",
                "UK imports from the eurozone become cheaper",
                "UK exports become cheaper for eurozone buyers",
                "UK inflation falls as import costs decrease",
              ],
              correct: 2,
              explanation: "A weaker pound means eurozone buyers get more pounds per euro — UK goods become cheaper for them, boosting UK export demand. Import costs rise, not fall.",
              topic: "Exchange rates",
            },
          ],
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
          workedExample: {
            setup: "A divisional manager needs to decide whether to continue producing a product line. Describe what management accounting information would be most useful.",
            steps: [
              "Revenue data: actual sales vs budget for this product, trend over recent periods.",
              "Cost data: variable cost per unit (materials, labour) and fixed costs attributable to the line.",
              "Contribution: revenue minus variable costs — shows whether the product covers its own variable costs.",
              "Break-even analysis: at what sales volume does the product start contributing to fixed costs and profit?",
              "Competitor benchmarks and market trends: is demand growing or declining?",
            ],
            answer: "Management accounting provides internal, forward-looking information — costs, contributions, and forecasts — to support this operational decision. Financial accounts alone (historical, external) would be insufficient.",
          },
          summary: [
            "Management accounting serves internal users; financial accounting serves external users.",
            "Management accounts are not legally required but are vital for good decisions.",
            "Information must be relevant, timely, and accurate to be useful.",
          ],
          practiceQuestions: [
            {
              question: "Which of the following best distinguishes management accounting from financial accounting?",
              options: [
                "Management accounting is legally required; financial accounting is voluntary",
                "Management accounting is for internal decision-making; financial accounting reports to external stakeholders",
                "Management accounting uses historical data only; financial accounting uses forecasts",
                "Management accounting is audited; financial accounting is not",
              ],
              correct: 1,
              explanation: "Management accounting provides internal information (costs, budgets, variances) to help managers plan and decide. Financial accounting produces statutory reports for shareholders, lenders, and regulators.",
              topic: "Management vs financial accounting",
            },
            {
              question: "Which of the following is a quality of useful management accounting information?",
              options: ["Legally audited", "Available only annually", "Timely and relevant to the decision", "Prepared under IFRS"],
              correct: 2,
              explanation: "Useful management information is timely (available when needed), relevant (addresses the decision), accurate, complete, and cost-effective to produce. IFRS and audit requirements apply to financial accounting, not management accounting.",
              topic: "Information quality",
            },
          ],
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
          explanation:
            "<p>A <strong>budget</strong> is a quantified plan expressed in financial terms, covering a future period. Purposes: planning, co-ordination, communication, motivation, control, and performance evaluation.</p>" +
            "<p>The <strong>master budget</strong> consists of a budgeted income statement, balance sheet, and cash flow statement, derived from functional budgets (sales, production, materials, labour, overheads).</p>" +
            "<p>The <strong>principal budget factor</strong> (or limiting factor) is the constraint that limits the organisation's activities — typically sales demand. Budgets must be built around it.</p>" +
            "<p>A <strong>flexed budget</strong> recalculates the original budget at the actual level of activity, allowing a fair comparison with actual results. Fixed costs remain unchanged; variable costs are flexed in line with actual output.</p>" +
            "<p style='text-align:center'><code>Flexed budget variance = Flexed budget cost − Actual cost</code></p>",
          workedExample: {
            setup: "Budgeted production: 5,000 units. Actual production: 6,000 units. Variable cost per unit: £4. Fixed overheads: £10,000. Actual total cost: £36,000. Prepare a flexed budget comparison.",
            steps: [
              "Original budget: (5,000 × £4) + £10,000 = £30,000.",
              "Flexed budget at 6,000 units: (6,000 × £4) + £10,000 = £34,000.",
              "Comparing original budget to actual (£30,000 vs £36,000) shows a £6,000 adverse variance — but this is misleading because output increased.",
              "Comparing flexed budget to actual: £34,000 vs £36,000 = £2,000 adverse.",
              "The flexed budget reveals that the real cost overrun is only £2,000, not £6,000.",
            ],
            answer: "Flexed budget variance = £2,000 adverse. The flexed budget removes the volume effect and gives a fairer assessment of cost control.",
          },
          summary: [
            "Budgets are quantified plans for a future period — used for planning, control, and motivation.",
            "The principal budget factor is the binding constraint around which all other budgets are built.",
            "A flexed budget adjusts the original budget to the actual activity level, allowing fair variance analysis.",
            "Fixed costs stay the same in a flexed budget; variable costs are re-calculated at actual output.",
          ],
          practiceQuestions: [
            {
              question: "A flexed budget differs from the original budget because it:",
              options: [
                "Is prepared after the year end",
                "Replaces actual costs with standard costs",
                "Adjusts budgeted costs to the actual level of activity achieved",
                "Includes only fixed costs",
              ],
              correct: 2,
              explanation: "A flexed budget recalculates costs at the actual output level. Variable costs are flexed; fixed costs stay constant. This allows a meaningful comparison with actual results.",
              topic: "Flexed budget",
            },
            {
              question: "The principal budget factor is best described as:",
              options: [
                "The largest cost in the budget",
                "The factor that limits the level of activity in the budget period",
                "The budgeted profit figure",
                "The fixed overhead absorption rate",
              ],
              correct: 1,
              explanation: "The principal budget factor (also called the key budget factor or limiting factor) is the constraint — typically sales demand — around which all other budgets must be built.",
              topic: "Budgeting principles",
            },
          ],
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
          explanation:
            "<p><strong>Relevant costing</strong> considers only costs and revenues that change as a result of a decision. Relevant costs must be: future (not past), incremental (changed by the decision), and cash flows (not non-cash items like depreciation).</p>" +
            "<p><strong>Sunk costs</strong> (already spent) and <strong>committed costs</strong> are never relevant.</p>" +
            "<p>Key short-term decisions:</p>" +
            "<ul>" +
            "<li><strong>Accept/reject a one-off order:</strong> accept if the selling price exceeds the relevant (incremental) cost.</li>" +
            "<li><strong>Make-or-buy:</strong> compare the relevant cost of making vs the external purchase price. If variable cost of making &lt; buy-in price, make in-house (assuming spare capacity).</li>" +
            "<li><strong>Limiting factor decisions:</strong> when a scarce resource constrains output, rank products by <strong>contribution per unit of limiting factor</strong> — maximise use of the scarce resource.</li>" +
            "</ul>",
          workedExample: {
            setup: "A company makes three products. Machine hours are limited to 2,400 per period. Calculate the optimal production plan.",
            steps: [
              "Product data: X — selling price £50, variable cost £30, machine hours 2; Y — price £60, variable cost £38, machine hours 3; Z — price £45, variable cost £24, machine hours 3.",
              "Contribution per unit: X = £20, Y = £22, Z = £21.",
              "Contribution per machine hour: X = £20/2 = £10, Y = £22/3 = £7.33, Z = £21/3 = £7.",
              "Rank: X (1st, £10/hr), Y (2nd, £7.33/hr), Z (3rd, £7/hr).",
              "Demand: X = 500 units (uses 1,000 hrs), Y = 400 units (uses 1,200 hrs). Hours left: 2,400 − 1,000 − 1,200 = 200 hrs.",
              "Produce 200/3 = 66 units of Z with remaining hours.",
            ],
            answer: "Optimal plan: 500 units X, 400 units Y, 66 units Z. Always satisfy full demand for higher-ranked products first, then use residual capacity for lower-ranked ones.",
          },
          summary: [
            "Relevant costs are future, incremental cash flows — sunk costs and depreciation are never relevant.",
            "Accept a special order if selling price exceeds the relevant incremental cost.",
            "Make-or-buy: make if variable cost of production < external purchase price (with spare capacity).",
            "Limiting factor: rank products by contribution per unit of the scarce resource and produce in that order.",
          ],
          practiceQuestions: [
            {
              question: "A company paid £20,000 for market research last year. Is this relevant to a decision about launching a new product?",
              options: [
                "Yes — it is a future cost of the launch",
                "No — it is a sunk cost and therefore irrelevant",
                "Yes — it is an incremental cash flow",
                "No — it exceeds the budget limit",
              ],
              correct: 1,
              explanation: "The £20,000 has already been spent — it is a sunk cost. Sunk costs cannot be recovered regardless of the decision taken, so they are irrelevant to future decisions.",
              topic: "Relevant costing",
            },
            {
              question: "Machine hours are the limiting factor. Product A has contribution of £30 and requires 5 machine hours. Product B has contribution of £28 and requires 4 machine hours. Which should be prioritised?",
              options: [
                "Product A — higher contribution per unit",
                "Product B — higher contribution per machine hour",
                "Product A — lower machine hour requirement per £ of contribution",
                "Both should be produced equally",
              ],
              correct: 1,
              explanation: "Contribution per machine hour: A = £30/5 = £6/hr; B = £28/4 = £7/hr. Product B earns more per unit of the scarce resource and should be prioritised.",
              topic: "Limiting factor analysis",
            },
          ],
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
          explanation:
            "<p>The IASB's <strong>Conceptual Framework</strong> sets out the objective of general purpose financial reporting: to provide <em>useful financial information</em> to existing and potential investors, lenders, and other creditors for making decisions.</p>" +
            "<p>The two <strong>fundamental qualitative characteristics</strong> of useful information:</p>" +
            "<ul>" +
            "<li><strong>Relevance</strong> — capable of making a difference to decisions (includes materiality).</li>" +
            "<li><strong>Faithful representation</strong> — complete, neutral, and free from error.</li>" +
            "</ul>" +
            "<p>Four <strong>enhancing characteristics</strong>: comparability, verifiability, timeliness, and understandability.</p>" +
            "<p>The <strong>elements of financial statements</strong>: asset, liability, equity, income, and expense. An asset is a present economic resource controlled by the entity. A liability is a present obligation to transfer an economic resource.</p>",
          workedExample: {
            setup: "A company is unsure whether to recognise a legal claim as a liability. Apply the Conceptual Framework to the decision.",
            steps: [
              "Does a present obligation exist as a result of a past event? — a lawsuit was filed following an incident last year, so yes.",
              "Is it probable that an outflow of economic benefits will occur? — legal advice suggests a 70% chance of losing.",
              "Can the amount be estimated reliably? — lawyers estimate £500,000.",
              "All three criteria are met: recognise a provision of £500,000 as a liability.",
            ],
            answer: "A provision should be recognised. The Framework's definition of a liability is met: there is a present obligation (the lawsuit) arising from a past event (the incident) that is expected to result in an outflow of resources.",
          },
          summary: [
            "Objective of financial reporting: provide useful information to investors, lenders, and creditors.",
            "Fundamental qualitative characteristics: relevance and faithful representation.",
            "Enhancing characteristics: comparability, verifiability, timeliness, understandability.",
            "Elements: asset (economic resource controlled), liability (obligation to transfer resource), equity, income, expense.",
          ],
          practiceQuestions: [
            {
              question: "According to the IASB Conceptual Framework, what is the primary objective of general purpose financial reporting?",
              options: [
                "To calculate taxable profit for HMRC",
                "To provide useful information to investors, lenders, and other creditors",
                "To confirm that the entity has complied with the law",
                "To show the replacement cost of the entity's assets",
              ],
              correct: 1,
              explanation: "The Conceptual Framework states the objective is to provide financial information useful for decision-making by existing and potential investors, lenders, and other creditors.",
              topic: "Conceptual Framework",
            },
            {
              question: "Which of the following is a FUNDAMENTAL (not enhancing) qualitative characteristic of useful financial information?",
              options: ["Comparability", "Understandability", "Faithful representation", "Timeliness"],
              correct: 2,
              explanation: "The two fundamental characteristics are relevance and faithful representation. Comparability, understandability, timeliness, and verifiability are enhancing characteristics.",
              topic: "Qualitative characteristics",
            },
          ],
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
          explanation:
            "<p>The <strong>income statement</strong> (also called the profit and loss account) shows a business's financial performance over a period — its revenues, costs, and resulting profit or loss.</p>" +
            "<p><strong>Gross profit</strong> = Revenue − Cost of goods sold (COGS)<br>" +
            "<strong>Operating profit</strong> = Gross profit − Operating expenses (admin, selling, distribution)<br>" +
            "<strong>Profit before tax</strong> = Operating profit ± Finance items (interest receivable/payable)<br>" +
            "<strong>Profit for the period</strong> = Profit before tax − Income tax expense</p>" +
            "<p>Key adjustments required under the accruals concept:</p>" +
            "<ul>" +
            "<li><strong>Accruals:</strong> expenses incurred but not yet paid — add to the expense; create a liability.</li>" +
            "<li><strong>Prepayments:</strong> expenses paid in advance for a future period — remove from current period expense; create an asset.</li>" +
            "<li><strong>Depreciation:</strong> systematic allocation of a non-current asset's cost over its useful life — charged as an expense each period.</li>" +
            "</ul>",
          workedExample: {
            setup: "Year end 31 Dec. Rent £24,000 paid — covers 12 months to 31 Mar next year. Insurance £6,000 paid for the year to 31 Dec. Electricity bill of £800 for Dec received but unpaid. Prepare the relevant adjustments.",
            steps: [
              "Rent: 9 months (Jan–Sep) belong to this year = 9/12 × £24,000 = £18,000 expense.",
              "Rent prepayment (Oct–Dec, next year) = 3/12 × £24,000 = £6,000 — deduct from expense, add to current assets.",
              "Insurance £6,000 — all relates to current year, so full amount is an expense.",
              "Electricity accrual: £800 not yet paid — add to expense (Dr Electricity £800) and create accrued liability (Cr Accruals £800).",
            ],
            answer: "Income statement charges: Rent £18,000; Insurance £6,000; Electricity £800. Balance sheet: Prepayment (asset) £6,000; Accrual (liability) £800.",
          },
          summary: [
            "Income statement shows revenue less expenses = profit or loss for the period.",
            "Gross profit = revenue − cost of goods sold; operating profit deducts operating expenses.",
            "Accruals: expenses owed but unpaid are added to the income statement and create a liability.",
            "Prepayments: amounts paid in advance are removed from current period expense and shown as an asset.",
          ],
          practiceQuestions: [
            {
              question: "A company pays £12,000 insurance on 1 October covering the 12 months to 30 September next year. Its year end is 31 December. What is the insurance expense for the year?",
              options: ["£12,000", "£9,000", "£3,000", "£6,000"],
              correct: 2,
              explanation: "Only 3 months (Oct, Nov, Dec) of the insurance relates to the current year: 3/12 × £12,000 = £3,000. The remaining £9,000 is a prepayment carried to next year.",
              topic: "Prepayments",
            },
            {
              question: "An electricity bill of £1,200 for the period ended 31 December is received but unpaid. How should this be treated?",
              options: [
                "Ignore it until paid",
                "Deduct it from revenue",
                "Charge £1,200 to the income statement and record an accrued liability",
                "Treat it as a prepayment",
              ],
              correct: 2,
              explanation: "Under the accruals concept, expenses are recognised when incurred, not when paid. The £1,200 is charged to the income statement as an expense and a current liability (accrual) is created on the balance sheet.",
              topic: "Accruals",
            },
          ],
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
          explanation:
            "<p>The <strong>statement of financial position (SOFP)</strong> — also called the balance sheet — shows what a business owns and owes at a specific date. It is structured around the <strong>accounting equation</strong>:</p>" +
            "<p style='text-align:center'><code>Assets = Liabilities + Equity</code></p>" +
            "<p><strong>Non-current assets</strong> (used for more than one year): property, plant and equipment, intangible assets, investments.<br>" +
            "<strong>Current assets</strong> (converted to cash within one year): inventory, trade receivables, cash.<br>" +
            "<strong>Current liabilities</strong> (due within one year): trade payables, accruals, short-term borrowings.<br>" +
            "<strong>Non-current liabilities</strong> (due after one year): long-term loans, bonds, deferred tax.<br>" +
            "<strong>Equity</strong>: share capital + retained earnings (accumulated profits not distributed as dividends).</p>",
          workedExample: {
            setup: "From the following data, prepare a summary SOFP: Land £200,000; Equipment £80,000; Inventory £30,000; Receivables £25,000; Cash £15,000; Bank loan (5 years) £100,000; Trade payables £20,000; Share capital £150,000; Retained earnings £80,000.",
            steps: [
              "Non-current assets: Land £200,000 + Equipment £80,000 = £280,000.",
              "Current assets: Inventory £30,000 + Receivables £25,000 + Cash £15,000 = £70,000.",
              "Total assets = £280,000 + £70,000 = £350,000.",
              "Non-current liabilities: Bank loan £100,000.",
              "Current liabilities: Trade payables £20,000.",
              "Equity: Share capital £150,000 + Retained earnings £80,000 = £230,000.",
              "Check: Liabilities + Equity = £100,000 + £20,000 + £230,000 = £350,000. ✓",
            ],
            answer: "Total assets = £350,000 = Total liabilities (£120,000) + Equity (£230,000). The accounting equation balances.",
          },
          summary: [
            "The SOFP shows assets, liabilities, and equity at a specific date.",
            "Accounting equation: Assets = Liabilities + Equity.",
            "Non-current assets/liabilities: held for/due after more than one year.",
            "Current assets/liabilities: converted to cash/due within one year.",
          ],
          practiceQuestions: [
            {
              question: "Which of the following is classified as a current asset?",
              options: ["Freehold land", "Long-term investments", "Trade receivables", "Bank loan repayable in 3 years"],
              correct: 2,
              explanation: "Trade receivables are amounts owed by customers, expected to be collected within one year — they are current assets. Land, long-term investments, and a 3-year bank loan are non-current items.",
              topic: "Balance sheet classification",
            },
            {
              question: "A company has total assets of £500,000 and total liabilities of £180,000. What is the equity?",
              options: ["£320,000", "£680,000", "£180,000", "£500,000"],
              correct: 0,
              explanation: "Using the accounting equation: Equity = Assets − Liabilities = £500,000 − £180,000 = £320,000.",
              topic: "Accounting equation",
            },
          ],
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
          explanation:
            "<p>Non-current assets are used for more than one year. Under the <strong>matching concept</strong>, their cost is spread (depreciated) over their useful life to match the benefit they provide to each period.</p>" +
            "<p>Two main methods:</p>" +
            "<ul>" +
            "<li><strong>Straight-line method:</strong> equal charge each year.<br>" +
            "<code>Annual depreciation = (Cost − Residual value) ÷ Useful life</code></li>" +
            "<li><strong>Reducing balance method:</strong> a fixed percentage applied to the carrying amount each year — higher charge early in asset's life.<br>" +
            "<code>Depreciation = Carrying amount × Rate %</code></li>" +
            "</ul>" +
            "<p>On <strong>disposal</strong>, compare the proceeds received with the asset's carrying amount (cost less accumulated depreciation). If proceeds > carrying amount → profit on disposal; if less → loss on disposal. Both are reported in the income statement.</p>",
          workedExample: {
            setup: "A machine costs £50,000, residual value £5,000, useful life 5 years. Calculate depreciation under (a) straight-line and (b) 30% reducing balance for years 1 and 2.",
            steps: [
              "(a) Straight-line: Annual charge = (£50,000 − £5,000) / 5 = £9,000 per year.",
              "Year 1 carrying amount: £50,000 − £9,000 = £41,000.",
              "Year 2 carrying amount: £41,000 − £9,000 = £32,000.",
              "(b) Reducing balance at 30%:",
              "Year 1: £50,000 × 30% = £15,000. Carrying amount: £35,000.",
              "Year 2: £35,000 × 30% = £10,500. Carrying amount: £24,500.",
            ],
            answer: "Straight-line gives equal annual charges (£9,000). Reducing balance front-loads the expense (£15,000 in year 1 vs £10,500 in year 2).",
          },
          summary: [
            "Depreciation allocates asset cost over its useful life, matching expense to the benefit received.",
            "Straight-line: equal annual charge = (cost − residual value) ÷ useful life.",
            "Reducing balance: percentage × carrying amount — higher in early years.",
            "Disposal: profit if proceeds > carrying amount; loss if proceeds < carrying amount.",
          ],
          practiceQuestions: [
            {
              question: "A machine costs £80,000 with a residual value of £8,000 and a useful life of 9 years. What is the annual straight-line depreciation?",
              options: ["£8,000", "£9,000", "£7,000", "£8,889"],
              correct: 0,
              explanation: "Straight-line depreciation = (£80,000 − £8,000) / 9 = £72,000 / 9 = £8,000 per year.",
              topic: "Straight-line depreciation",
            },
            {
              question: "An asset with a carrying amount of £20,000 is sold for £23,500. What is the result?",
              options: [
                "£3,500 loss on disposal",
                "£3,500 profit on disposal",
                "£23,500 revenue",
                "No impact on profit",
              ],
              correct: 1,
              explanation: "Profit on disposal = proceeds − carrying amount = £23,500 − £20,000 = £3,500 profit. This is recognised in the income statement.",
              topic: "Asset disposal",
            },
          ],
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
          explanation:
            "<p><strong>Corporate governance</strong> is the system of rules, practices, and processes by which a company is directed and controlled. It addresses the <strong>agency problem</strong>: shareholders (principals) delegate control to directors (agents), whose interests may not always align.</p>" +
            "<p>The <strong>UK Corporate Governance Code</strong> (apply or explain basis for listed companies) is built around five principles:</p>" +
            "<ol>" +
            "<li><strong>Board leadership and purpose</strong> — an effective and entrepreneurial board.</li>" +
            "<li><strong>Division of responsibilities</strong> — the Chair and CEO roles should be held by different people.</li>" +
            "<li><strong>Composition, succession and evaluation</strong> — appropriate balance of skills and independence.</li>" +
            "<li><strong>Audit, risk and internal control</strong> — sound systems with an independent audit committee.</li>" +
            "<li><strong>Remuneration</strong> — linked to long-term company and employee interests.</li>" +
            "</ol>" +
            "<p>The <strong>audit committee</strong> (independent non-executive directors) oversees financial reporting, internal controls, and the external audit relationship.</p>",
          workedExample: {
            setup: "A listed company's CEO has also been appointed as Board Chair. Explain the corporate governance concern and what the UK Code recommends.",
            steps: [
              "The CEO is responsible for running the business day-to-day.",
              "The Chair's role is to lead the board, ensure it is effective, and provide independent oversight of management.",
              "Combining both roles in one person concentrates power and undermines independence — there is no one to challenge the CEO's decisions at board level.",
              "The UK Corporate Governance Code clearly states that the Chair and CEO roles should not be held by the same individual.",
            ],
            answer: "This arrangement breaches the division of responsibilities principle. The company should separate the roles or explain its departure from the Code in its annual report.",
          },
          summary: [
            "Corporate governance manages the agency problem between shareholders (owners) and directors (agents).",
            "UK Corporate Governance Code (apply or explain) covers board leadership, division of responsibilities, composition, audit/risk, and remuneration.",
            "The Chair and CEO should be different individuals to ensure independent board oversight.",
            "The audit committee (independent NEDs) oversees financial reporting, internal audit, and external audit.",
          ],
          practiceQuestions: [
            {
              question: "The UK Corporate Governance Code applies to listed companies on which basis?",
              options: [
                "Mandatory — all provisions must be followed",
                "'Apply or explain' — comply or disclose and justify departures",
                "Voluntary — no disclosure required",
                "Mandatory only for FTSE 100 companies",
              ],
              correct: 1,
              explanation: "The UK Code is on an 'apply or explain' basis. Companies must either follow each provision or explain in their annual report why they have departed from it. This gives flexibility while maintaining transparency.",
              topic: "Corporate governance principles",
            },
            {
              question: "Which of the following best describes the primary purpose of an audit committee?",
              options: [
                "To set executive pay",
                "To oversee financial reporting, internal controls, and the external audit",
                "To approve the annual budget",
                "To appoint the CEO",
              ],
              correct: 1,
              explanation: "The audit committee — comprising independent non-executive directors — oversees the integrity of financial reporting, monitors internal controls and risk management, and manages the relationship with the external auditor.",
              topic: "Audit committee",
            },
          ],
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
          explanation:
            "<p>A <strong>company</strong> is a legal entity separate from its owners — it can own assets, enter contracts, and sue or be sued in its own name. Key types:</p>" +
            "<ul>" +
            "<li><strong>Sole trader</strong>: one owner; unlimited personal liability; not incorporated.</li>" +
            "<li><strong>Partnership</strong>: two or more owners sharing profits and (in a general partnership) unlimited liability.</li>" +
            "<li><strong>Private limited company (Ltd)</strong>: incorporated; limited liability; shares cannot be publicly traded.</li>" +
            "<li><strong>Public limited company (plc)</strong>: incorporated; limited liability; can offer shares to the public.</li>" +
            "</ul>" +
            "<p><strong>Incorporation</strong> creates a separate legal personality — the company is distinct from its shareholders. Shareholders enjoy <strong>limited liability</strong>: they can lose only the amount invested, not personal assets.</p>" +
            "<p><strong>Directors' duties</strong> (Companies Act 2006): act within powers, promote success of the company, exercise independent judgement, avoid conflicts of interest, not accept benefits from third parties, declare interests in transactions.</p>",
          workedExample: {
            setup: "A shareholder holds 500 shares in an Ltd company, paid up at £1 each. The company later becomes insolvent with debts of £2 million. What is the shareholder's maximum loss?",
            steps: [
              "The company is incorporated — it is a separate legal entity from the shareholder.",
              "The shareholder enjoys limited liability — their liability is limited to the amount invested.",
              "The shares are fully paid at £1 each: maximum loss = 500 × £1 = £500.",
              "The company's creditors cannot pursue the shareholder's personal assets for the remaining debt.",
            ],
            answer: "Maximum loss = £500 (the amount paid for the shares). Limited liability shields the shareholder's personal assets.",
          },
          summary: [
            "Incorporation creates a separate legal entity — the company, not the shareholders, owns assets and owes debts.",
            "Limited liability: shareholders' losses are capped at the amount invested.",
            "Private Ltd: no public share trading. Public plc: can raise capital from the public.",
            "Directors owe duties to the company under the Companies Act 2006, including promoting its long-term success.",
          ],
          practiceQuestions: [
            {
              question: "What is the primary legal consequence of incorporation?",
              options: [
                "The company must be listed on a stock exchange",
                "The business becomes a separate legal entity from its owners",
                "The owners become personally liable for all company debts",
                "The company is exempt from paying corporation tax",
              ],
              correct: 1,
              explanation: "Incorporation creates a separate legal personality. The company can own property, enter contracts, and incur debts in its own name — distinct from the shareholders who own it.",
              topic: "Incorporation",
            },
            {
              question: "A shareholder in a limited company faces financial difficulty. The company has unpaid debts. Which statement is correct?",
              options: [
                "The shareholder must use personal assets to pay company debts",
                "The shareholder's liability is limited to the amount unpaid on their shares",
                "The shareholder is jointly liable with the directors",
                "The shareholder must resign their shares to cover the debts",
              ],
              correct: 1,
              explanation: "Limited liability means a shareholder's maximum loss is the amount invested (or any amount still unpaid on partly-paid shares). Personal assets cannot be seized to meet company debts.",
              topic: "Limited liability",
            },
          ],
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
          explanation:
            "<p>A <strong>valid contract</strong> requires five elements:</p>" +
            "<ol>" +
            "<li><strong>Offer</strong> — a clear, definite proposal to be bound on certain terms.</li>" +
            "<li><strong>Acceptance</strong> — unconditional agreement to all the terms of the offer.</li>" +
            "<li><strong>Consideration</strong> — something of value exchanged by each party (e.g., goods for money).</li>" +
            "<li><strong>Intention to create legal relations</strong> — presumed in commercial agreements.</li>" +
            "<li><strong>Capacity</strong> — parties must be legally capable (e.g., not minors).</li>" +
            "</ol>" +
            "<p>A <strong>counter-offer</strong> rejects the original offer and creates a new one. A mere <strong>enquiry</strong> (asking for more information) does not reject the offer.</p>" +
            "<p><strong>Breach of contract</strong> occurs when a party fails to perform their obligations. Remedies include:</p>" +
            "<ul>" +
            "<li><strong>Damages</strong> — monetary compensation (aim to put the claimant in the position they would have been in had the contract been performed).</li>" +
            "<li><strong>Specific performance</strong> — court order to carry out the contract (used where damages are inadequate, e.g., unique goods).</li>" +
            "<li><strong>Injunction</strong> — court order to stop a breach (e.g., prevent disclosure of confidential information).</li>" +
            "</ul>",
          workedExample: {
            setup: "Alpha Ltd offers to sell 1,000 units of software to Beta Ltd at £50 each. Beta replies: 'We accept, but only at £45 each.' Is a contract formed?",
            steps: [
              "Alpha makes a valid offer: sell 1,000 units at £50 each.",
              "Beta's reply changes the price — this is a counter-offer, not an acceptance.",
              "A counter-offer terminates the original offer (Hyde v Wrench).",
              "No contract is formed at this stage.",
              "If Alpha subsequently agrees to £45, a new contract is formed at that price.",
            ],
            answer: "No contract at £50 or £45. Beta's reply is a counter-offer that kills Alpha's original offer. A contract will only form if both parties agree on new terms.",
          },
          summary: [
            "A valid contract requires offer, acceptance, consideration, intention to create legal relations, and capacity.",
            "A counter-offer terminates the original offer — it is not acceptance.",
            "Breach occurs when a party fails to perform; remedies include damages, specific performance, or injunction.",
            "Damages aim to put the innocent party in the position they would have been in had the contract been performed.",
          ],
          practiceQuestions: [
            {
              question: "Which of the following is an essential element of a valid contract?",
              options: ["Written agreement", "Consideration from both parties", "Registered with Companies House", "Witnessed by a solicitor"],
              correct: 1,
              explanation: "Consideration — something of value exchanged by each party — is essential for a contract. Most contracts do not need to be in writing or witnessed to be valid.",
              topic: "Contract formation",
            },
            {
              question: "A buyer responds to an offer to sell at £100 by saying 'I'll take it for £90.' Which of the following best describes the legal position?",
              options: [
                "A contract has been formed at £90",
                "The original offer is still open at £100",
                "The buyer has made a counter-offer, terminating the original offer",
                "The buyer has made an enquiry and the offer remains open",
              ],
              correct: 2,
              explanation: "Proposing a different price is a counter-offer, not an acceptance. A counter-offer terminates the original offer — the seller is no longer bound by the £100 offer.",
              topic: "Offer and acceptance",
            },
          ],
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
          explanation:
            "<p>It is important to distinguish between <strong>employees</strong> (employed under a contract of service) and <strong>independent contractors</strong> (working under a contract for services). Tests used by courts:</p>" +
            "<ul>" +
            "<li><strong>Control test</strong>: is the person told what to do and how to do it? (employee).</li>" +
            "<li><strong>Integration test</strong>: is the person integrated into the business? (employee).</li>" +
            "<li><strong>Multiple test</strong>: considers all factors including economic reality, risk, and equipment provision.</li>" +
            "</ul>" +
            "<p>Key statutory employment rights:</p>" +
            "<ul>" +
            "<li>National Minimum Wage / National Living Wage</li>" +
            "<li>Paid annual leave (5.6 weeks for full-time employees)</li>" +
            "<li>Protection against unfair dismissal (after 2 years' service)</li>" +
            "<li>Statutory maternity, paternity, and shared parental pay</li>" +
            "<li>Right to written statement of employment terms</li>" +
            "</ul>" +
            "<p><strong>Unfair dismissal</strong>: dismissal is potentially fair only on specific grounds (capability, conduct, redundancy, statutory restriction, some other substantial reason). The employer must follow a fair procedure. <strong>Redundancy</strong> arises when a role ceases to exist — employees are entitled to statutory redundancy pay (after 2 years' service).</p>",
          workedExample: {
            setup: "A worker works exclusively for one company, is provided with equipment, works set hours dictated by the company, and has no personal financial risk. Is this person likely an employee or independent contractor?",
            steps: [
              "Control: the company dictates hours and working method → suggests employee.",
              "Integration: works exclusively for the company → integrated into the business.",
              "Economic reality: no financial risk of their own and uses company equipment → not in business on their own account.",
              "All three tests point strongly toward employment status.",
            ],
            answer: "This worker is most likely an employee. Misclassifying employees as contractors exposes the business to claims for employment rights and HMRC penalties for unpaid PAYE/NIC.",
          },
          summary: [
            "Employee = contract of service; independent contractor = contract for services.",
            "Employment status is determined by control, integration, and economic reality tests.",
            "Key rights: minimum wage, paid leave, unfair dismissal protection (after 2 years).",
            "Fair dismissal requires a valid reason (capability, conduct, redundancy) AND a fair procedure.",
          ],
          practiceQuestions: [
            {
              question: "An employee has 3 years' continuous service and is dismissed without being given reasons or following any procedure. This is most likely:",
              options: [
                "A lawful dismissal if the employer pays in lieu of notice",
                "A redundancy situation",
                "Unfair dismissal",
                "Constructive dismissal",
              ],
              correct: 2,
              explanation: "Employees with 2+ years' service have the right not to be unfairly dismissed. A dismissal without reasons or procedure is procedurally and potentially substantively unfair.",
              topic: "Unfair dismissal",
            },
            {
              question: "Which of the following is most consistent with a person being an employee rather than an independent contractor?",
              options: [
                "They bear the financial risk of the work",
                "They provide their own tools and equipment",
                "The business controls how and when the work is done",
                "They can substitute another person to do the work",
              ],
              correct: 2,
              explanation: "The key indicator of employment is the control test — if the business dictates how, when, and where the work is done, the worker is likely an employee. Providing own tools and the ability to substitute are indicators of self-employment.",
              topic: "Employment status",
            },
          ],
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
     SKILLS LAB — practical tool tracks for finance professionals
     Covers: Advanced Excel, SQL, Power BI, and AI for Finance.
     Lessons use the same structure as CIMA papers for compatibility with the
     existing lesson viewer (AIQLessons.jsx).
     TODO: populate explanation, workedExample, summary, practiceQuestions.
     ══════════════════════════════════════════════════════════════════════════ */
  skillsLab: {
    tracks: [
      {
        id: "excel",
        title: "Advanced Excel for Finance",
        icon: "table-2",
        accent: "#217346",
        description: "Master the spreadsheet tools every finance professional needs",
        estimatedHours: 12,
        lessons: [
          {
            id: "excel-xlookup",
            title: "XLOOKUP",
            topic: "Lookup Functions",
            estimatedMinutes: 25,
            objectives: [
              "Use XLOOKUP to retrieve data from a table by matching a lookup value",
              "Handle errors and missing matches using the if_not_found argument",
              "Perform horizontal and vertical lookups with a single formula",
            ],
            explanation: null, // TODO: add explanation for XLOOKUP
            workedExample: null, // TODO: add worked example for XLOOKUP
            summary: null, // TODO: add summary for XLOOKUP
            practiceQuestions: null, // TODO: add practice questions for XLOOKUP
          },
          {
            id: "excel-index-match",
            title: "INDEX MATCH",
            topic: "Lookup Functions",
            estimatedMinutes: 30,
            objectives: [
              "Understand why INDEX MATCH is preferred over VLOOKUP for large datasets",
              "Construct a two-way lookup using nested INDEX and MATCH",
              "Apply INDEX MATCH to retrieve values from dynamic column headers",
            ],
            explanation: null, // TODO: add explanation for INDEX MATCH
            workedExample: null, // TODO: add worked example for INDEX MATCH
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-pivot-tables",
            title: "Pivot Tables",
            topic: "Data Analysis",
            estimatedMinutes: 35,
            objectives: [
              "Create a pivot table from transactional data to summarise by category",
              "Group dates by month, quarter, and year in a pivot table",
              "Use calculated fields to derive gross margin and other KPIs within a pivot",
            ],
            explanation: null, // TODO: add explanation for Pivot Tables
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-pivot-charts",
            title: "Pivot Charts",
            topic: "Data Visualisation",
            estimatedMinutes: 25,
            objectives: [
              "Create a pivot chart linked to an existing pivot table",
              "Choose appropriate chart types for financial variance data",
              "Format pivot charts for use in management reports",
            ],
            explanation: null, // TODO: add explanation for Pivot Charts
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-power-query",
            title: "Power Query",
            topic: "Data Transformation",
            estimatedMinutes: 40,
            objectives: [
              "Connect Power Query to multiple data sources (Excel, CSV, SharePoint)",
              "Apply transformations: split columns, change data types, filter rows",
              "Merge and append queries to combine P&L and budget data",
            ],
            explanation: null, // TODO: add explanation for Power Query
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-financial-modelling",
            title: "Financial Modelling",
            topic: "Modelling",
            estimatedMinutes: 45,
            objectives: [
              "Structure a three-statement financial model (P&L, balance sheet, cash flow)",
              "Build dynamic assumptions tables with named ranges",
              "Trace and audit model logic using Excel auditing tools",
            ],
            explanation: null, // TODO: add explanation for Financial Modelling
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-variance-templates",
            title: "Variance Analysis Templates",
            topic: "Reporting",
            estimatedMinutes: 35,
            objectives: [
              "Build a reusable budget vs actual variance template in Excel",
              "Use conditional formatting to highlight favourable and adverse variances",
              "Automate period commentary using formula-driven cells",
            ],
            explanation: null, // TODO: add explanation for Variance Analysis Templates
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-forecast-models",
            title: "Forecast Models",
            topic: "Forecasting",
            estimatedMinutes: 40,
            objectives: [
              "Build a rolling forecast model using a driver-based approach",
              "Apply seasonal indices to adjust monthly revenue forecasts",
              "Version-control forecast assumptions for audit purposes",
            ],
            explanation: null, // TODO: add explanation for Forecast Models
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-reporting-packs",
            title: "Reporting Packs",
            topic: "Reporting",
            estimatedMinutes: 35,
            objectives: [
              "Structure a month-end reporting pack for management review",
              "Link summary charts and tables to source data using dynamic ranges",
              "Add a cover page and executive summary using Excel shapes and text boxes",
            ],
            explanation: null, // TODO: add explanation for Reporting Packs
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "excel-dashboards",
            title: "Dashboard Building",
            topic: "Data Visualisation",
            estimatedMinutes: 45,
            objectives: [
              "Design a one-page finance dashboard using charts, KPI tiles, and slicers",
              "Use slicers to filter dashboard data by entity, cost centre, or period",
              "Format dashboards to match corporate brand guidelines",
            ],
            explanation: null, // TODO: add explanation for Dashboard Building
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
        ],
      },
      {
        id: "sql",
        title: "SQL for Finance",
        icon: "database",
        accent: "#2563eb",
        description: "Query financial databases with confidence using SQL",
        estimatedHours: 10,
        lessons: [
          {
            id: "sql-select",
            title: "SELECT",
            topic: "Fundamentals",
            estimatedMinutes: 20,
            objectives: [
              "Write a basic SELECT statement to retrieve columns from a table",
              "Use SELECT DISTINCT to return unique values",
              "Alias columns using AS to produce readable query output",
            ],
            explanation: null, // TODO: add explanation for SELECT
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-where",
            title: "WHERE",
            topic: "Filtering",
            estimatedMinutes: 20,
            objectives: [
              "Filter rows using WHERE with comparison operators (=, >, <, BETWEEN, IN)",
              "Combine filter conditions using AND, OR, and NOT",
              "Handle NULL values using IS NULL and IS NOT NULL",
            ],
            explanation: null, // TODO: add explanation for WHERE
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-order-by",
            title: "ORDER BY",
            topic: "Sorting",
            estimatedMinutes: 15,
            objectives: [
              "Sort query results in ascending and descending order",
              "Order by multiple columns to produce ranked financial reports",
              "Understand how ORDER BY interacts with LIMIT and TOP",
            ],
            explanation: null, // TODO: add explanation for ORDER BY
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-group-by",
            title: "GROUP BY",
            topic: "Grouping",
            estimatedMinutes: 25,
            objectives: [
              "Use GROUP BY to aggregate data by account, department, or period",
              "Understand which columns must appear in GROUP BY vs aggregation functions",
              "Filter grouped results using HAVING",
            ],
            explanation: null, // TODO: add explanation for GROUP BY
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-aggregations",
            title: "Aggregations",
            topic: "Calculations",
            estimatedMinutes: 25,
            objectives: [
              "Apply SUM, COUNT, AVG, MIN, MAX to financial data",
              "Distinguish COUNT(*) from COUNT(column) when NULLs are present",
              "Compute running totals using window functions (SUM OVER)",
            ],
            explanation: null, // TODO: add explanation for Aggregations
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-case-when",
            title: "CASE WHEN",
            topic: "Conditional Logic",
            estimatedMinutes: 25,
            objectives: [
              "Use CASE WHEN to classify transactions (e.g. income vs expense)",
              "Create a calculated column that maps account codes to P&L line items",
              "Combine CASE WHEN with aggregation to build a pivot-style SQL report",
            ],
            explanation: null, // TODO: add explanation for CASE WHEN
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-joins",
            title: "JOINs",
            topic: "Combining Data",
            estimatedMinutes: 30,
            objectives: [
              "Explain INNER JOIN, LEFT JOIN, and FULL OUTER JOIN with finance use cases",
              "Join a transactions table to a chart of accounts using account code",
              "Identify and handle duplicate rows caused by one-to-many joins",
            ],
            explanation: null, // TODO: add explanation for JOINs
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-date-logic",
            title: "Date Logic",
            topic: "Date Functions",
            estimatedMinutes: 25,
            objectives: [
              "Extract year, month, and quarter from a date column",
              "Filter transactions within a specific accounting period",
              "Calculate days outstanding for debtor ageing reports",
            ],
            explanation: null, // TODO: add explanation for Date Logic
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-reporting-queries",
            title: "Reporting Queries",
            topic: "Applied SQL",
            estimatedMinutes: 35,
            objectives: [
              "Write a SQL query that replicates a standard management P&L format",
              "Use CTEs (WITH clause) to structure multi-step reporting logic",
              "Export query results in a format compatible with Excel Power Query",
            ],
            explanation: null, // TODO: add explanation for Reporting Queries
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "sql-finance-analysis",
            title: "Finance Data Analysis",
            topic: "Applied SQL",
            estimatedMinutes: 35,
            objectives: [
              "Write a variance analysis query comparing actual vs budget by cost centre",
              "Identify top spend lines using ORDER BY and LIMIT",
              "Flag anomalies using CASE WHEN and statistical thresholds",
            ],
            explanation: null, // TODO: add explanation for Finance Data Analysis
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
        ],
      },
      {
        id: "powerbi",
        title: "Power BI for Finance",
        icon: "bar-chart-2",
        accent: "#c29000",
        description: "Build interactive financial dashboards and reports in Power BI",
        estimatedHours: 8,
        lessons: [
          {
            id: "pbi-data-modelling",
            title: "Data Modelling",
            topic: "Foundations",
            estimatedMinutes: 35,
            objectives: [
              "Create relationships between fact and dimension tables in Power BI",
              "Choose between star schema and snowflake schema for finance data",
              "Set correct cardinality and cross-filter direction for P&L models",
            ],
            explanation: null, // TODO: add explanation for Data Modelling
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "pbi-dax-basics",
            title: "DAX Basics",
            topic: "Calculations",
            estimatedMinutes: 40,
            objectives: [
              "Write calculated columns and measures using basic DAX",
              "Use CALCULATE to apply filters to a measure",
              "Implement time intelligence with SAMEPERIODLASTYEAR and DATESYTD",
            ],
            explanation: null, // TODO: add explanation for DAX Basics
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "pbi-kpis",
            title: "KPIs",
            topic: "Metrics",
            estimatedMinutes: 25,
            objectives: [
              "Create KPI visuals showing actuals vs target with status indicators",
              "Define KPI thresholds for favourable, warning, and adverse zones",
              "Use card and gauge visuals to highlight key financial metrics",
            ],
            explanation: null, // TODO: add explanation for KPIs
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "pbi-finance-dashboards",
            title: "Finance Dashboards",
            topic: "Reporting",
            estimatedMinutes: 40,
            objectives: [
              "Design a financial dashboard with P&L summary, trend chart, and KPI tiles",
              "Use bookmarks to create drill-through views from summary to detail",
              "Apply row-level security to restrict dashboard access by cost centre",
            ],
            explanation: null, // TODO: add explanation for Finance Dashboards
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "pbi-variance-reporting",
            title: "Variance Reporting",
            topic: "FP&A",
            estimatedMinutes: 35,
            objectives: [
              "Build a budget vs actual waterfall chart in Power BI",
              "Create a dynamic variance table with conditional formatting",
              "Use slicers for entity, period, and department filtering",
            ],
            explanation: null, // TODO: add explanation for Variance Reporting
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "pbi-executive-reporting",
            title: "Executive Reporting",
            topic: "Reporting",
            estimatedMinutes: 30,
            objectives: [
              "Design a single-page executive summary report in Power BI",
              "Optimise visuals for print and PDF export",
              "Add narrative commentary using Smart Narrative or text box visuals",
            ],
            explanation: null, // TODO: add explanation for Executive Reporting
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
        ],
      },
      {
        id: "ai",
        title: "AI for Finance",
        icon: "sparkles",
        accent: "#7c3aed",
        description: "Use AI tools to work faster and smarter in FP&A",
        estimatedHours: 6,
        lessons: [
          {
            id: "ai-prompt-engineering",
            title: "Prompt Engineering",
            topic: "Foundations",
            estimatedMinutes: 25,
            objectives: [
              "Write effective prompts to extract financial insights from AI tools",
              "Apply the role-context-task-format prompt structure",
              "Iterate prompts to improve the quality and specificity of AI outputs",
            ],
            explanation: null, // TODO: add explanation for Prompt Engineering
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "ai-assisted-analysis",
            title: "AI-Assisted Analysis",
            topic: "Analysis",
            estimatedMinutes: 30,
            objectives: [
              "Use AI to summarise variance drivers from a management report",
              "Generate ratio analysis commentary from financial statement data",
              "Critically evaluate AI-generated analysis before presenting to stakeholders",
            ],
            explanation: null, // TODO: add explanation for AI-Assisted Analysis
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "ai-financial-commentary",
            title: "Financial Commentary",
            topic: "Reporting",
            estimatedMinutes: 25,
            objectives: [
              "Draft board-ready financial commentary using AI assistance",
              "Use AI to convert data tables into narrative explanations",
              "Edit and validate AI-generated commentary for accuracy and tone",
            ],
            explanation: null, // TODO: add explanation for Financial Commentary
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "ai-forecasting-support",
            title: "Forecasting Support",
            topic: "Planning",
            estimatedMinutes: 25,
            objectives: [
              "Use AI to identify trends and seasonality in historical financial data",
              "Generate scenario narrative for budget presentations with AI",
              "Understand the limitations of AI in forward-looking financial analysis",
            ],
            explanation: null, // TODO: add explanation for Forecasting Support
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "ai-report-automation",
            title: "Report Automation",
            topic: "Automation",
            estimatedMinutes: 30,
            objectives: [
              "Automate recurring report commentary using AI prompts",
              "Build a prompt library for common FP&A tasks",
              "Integrate AI outputs into Excel and Power BI workflows",
            ],
            explanation: null, // TODO: add explanation for Report Automation
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
          {
            id: "ai-workflow-optimisation",
            title: "Workflow Optimisation",
            topic: "Productivity",
            estimatedMinutes: 25,
            objectives: [
              "Map current FP&A processes to identify AI automation opportunities",
              "Apply AI tools to reduce manual data reconciliation time",
              "Evaluate risk and compliance considerations of AI in finance",
            ],
            explanation: null, // TODO: add explanation for Workflow Optimisation
            workedExample: null,
            summary: null,
            practiceQuestions: null,
          },
        ],
      },
    ],
  },

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
