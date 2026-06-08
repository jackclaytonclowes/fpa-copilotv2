-- BA1: Fundamentals of Business Economics
-- UUID prefix: ba100000- (b, a, 1 are all valid hex characters)

-- ============================================================
-- COURSE
-- ============================================================
INSERT INTO public.courses (id, slug, title, description, cima_paper, color_hex, order_index, is_published)
VALUES (
  'ba100000-0000-0000-0000-000000000000',
  'ba1-business-economics',
  'BA1 – Fundamentals of Business Economics',
  'Understand the economic environment in which businesses operate, including microeconomics, macroeconomics, and international economics.',
  'BA1',
  '#1D4ED8',
  3,
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULE 1: Microeconomics
-- ============================================================
INSERT INTO public.modules (id, course_id, title, description, order_index)
VALUES (
  'ba100000-0001-0000-0000-000000000000',
  'ba100000-0000-0000-0000-000000000000',
  'Microeconomics',
  'Supply, demand, equilibrium, elasticity, and market structures.',
  1
) ON CONFLICT (id) DO NOTHING;

-- Lesson 1.1: Supply, Demand and Market Equilibrium
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0001-0001-0000-000000000000',
  'ba100000-0001-0000-0000-000000000000',
  'Supply, Demand and Market Equilibrium',
  1,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Supply, Demand and Market Equilibrium",
    "body": "Markets coordinate millions of individual decisions through the price mechanism. Understanding how supply and demand interact explains how prices are determined and how markets reach equilibrium.",
    "emoji": "⚖️"
  },
  {
    "type": "explanation",
    "heading": "The Law of Demand",
    "body": "As the price of a good rises, the quantity demanded falls (ceteris paribus). This inverse relationship gives the demand curve its downward slope.",
    "key_terms": [
      "Demand: the quantity buyers are willing and able to purchase at each price",
      "Ceteris paribus: all other factors held constant",
      "Substitute goods: goods that can replace each other (e.g. tea and coffee)",
      "Complementary goods: goods used together (e.g. cars and petrol)"
    ]
  },
  {
    "type": "explanation",
    "heading": "Shifts in the Demand Curve",
    "body": "A change in price causes a movement along the demand curve. A change in any other factor shifts the entire curve. Factors shifting demand include: income levels, prices of substitutes/complements, consumer tastes, population size, and expectations of future prices.",
    "key_terms": [
      "Movement along: caused by a price change",
      "Shift of curve: caused by non-price factors (income, tastes, related goods prices)"
    ]
  },
  {
    "type": "explanation",
    "heading": "The Law of Supply",
    "body": "As the price of a good rises, the quantity supplied increases (ceteris paribus). Producers are willing to supply more at higher prices because it becomes more profitable.",
    "key_terms": [
      "Supply: the quantity sellers are willing and able to offer at each price",
      "Factors shifting supply: input costs, technology, number of producers, government subsidies/taxes"
    ]
  },
  {
    "type": "worked_example",
    "heading": "Finding Market Equilibrium",
    "steps": [
      "At equilibrium: quantity demanded = quantity supplied",
      "Example: Qd = 100 – 5P and Qs = 20 + 3P",
      "Set equal: 100 – 5P = 20 + 3P",
      "80 = 8P → P* = £10",
      "Substitute back: Q* = 100 – 5(10) = 50 units",
      "Equilibrium: price = £10, quantity = 50 units"
    ]
  },
  {
    "type": "explanation",
    "heading": "Excess Demand and Excess Supply",
    "body": "If the market price is below equilibrium, quantity demanded exceeds quantity supplied — this is excess demand (shortage) and the price will rise. If above equilibrium, supply exceeds demand — this is excess supply (surplus) and the price will fall. The market self-corrects to equilibrium.",
    "key_terms": [
      "Excess demand (shortage): Qd > Qs → price rises",
      "Excess supply (surplus): Qs > Qd → price falls",
      "Price mechanism: the system by which prices adjust to clear markets"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

-- Questions for Lesson 1.1
insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0001-0001-0000-000000000001',
  'ba100000-0001-0001-0000-000000000000',
  'mcq',
  'A price BELOW equilibrium results in:',
  '["Excess supply — firms reduce prices", "Excess demand — price rises to restore equilibrium", "Equilibrium is maintained automatically", "The demand curve shifts leftward"]',
  '"Excess demand — price rises to restore equilibrium"',
  'Below the equilibrium price, quantity demanded exceeds quantity supplied (shortage). Competition among buyers pushes the price up until equilibrium is restored.',
  1
),
(
  'ba100000-0001-0001-0000-000000000002',
  'ba100000-0001-0001-0000-000000000000',
  'true_false',
  'A rise in the price of a substitute good will INCREASE the demand for a product.',
  '["True", "False"]',
  '"True"',
  'If a substitute becomes more expensive, consumers switch to the cheaper alternative, increasing its demand and shifting the demand curve to the right.',
  2
),
(
  'ba100000-0001-0001-0000-000000000003',
  'ba100000-0001-0001-0000-000000000000',
  'mcq',
  'Given Qd = 80 – 4P and Qs = 8 + 4P, what is the equilibrium price?',
  '["£9", "£8", "£7", "£10"]',
  '"£9"',
  'Set Qd = Qs: 80 – 4P = 8 + 4P → 72 = 8P → P = £9. Check: Qd = 80 – 36 = 44; Qs = 8 + 36 = 44. ✓',
  3
),
(
  'ba100000-0001-0001-0000-000000000004',
  'ba100000-0001-0001-0000-000000000000',
  'mcq',
  'Which of the following would shift the supply curve to the RIGHT?',
  '["An increase in raw material costs", "Introduction of a new tax on the product", "A technological improvement reducing production costs", "A fall in the number of producers"]',
  '"A technological improvement reducing production costs"',
  'Lower production costs increase profitability, encouraging producers to supply more at every price — shifting the supply curve rightward (increase in supply).',
  4
) ON CONFLICT (id) DO NOTHING;

-- Lesson 1.2: Price Elasticity of Demand and Supply
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0001-0002-0000-000000000000',
  'ba100000-0001-0000-0000-000000000000',
  'Price Elasticity of Demand and Supply',
  2,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Price Elasticity of Demand and Supply",
    "body": "Elasticity measures the responsiveness of quantity demanded or supplied to a change in price. It is essential for firms pricing decisions and for governments assessing the impact of taxation.",
    "emoji": "📐"
  },
  {
    "type": "worked_example",
    "heading": "Calculating Price Elasticity of Demand (PED)",
    "steps": [
      "PED = % change in quantity demanded ÷ % change in price",
      "PED is always negative (inverse relationship) — we often use the absolute value",
      "Example: Price rises from £10 to £12 (+20%); quantity falls from 100 to 85 units (–15%)",
      "PED = –15% ÷ 20% = –0.75",
      "|PED| < 1 → inelastic demand (quantity is relatively unresponsive to price)"
    ]
  },
  {
    "type": "table",
    "heading": "Interpreting PED Values",
    "headers": ["|PED| value", "Description", "Implication for revenue"],
    "rows": [
      ["> 1", "Elastic: %ΔQd > %ΔP", "Price rise → revenue falls"],
      ["= 1", "Unit elastic: %ΔQd = %ΔP", "Price change → no revenue change"],
      ["< 1", "Inelastic: %ΔQd < %ΔP", "Price rise → revenue increases"],
      ["= 0", "Perfectly inelastic", "Quantity fixed regardless of price"],
      ["= ∞", "Perfectly elastic", "Any price rise → zero demand"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Factors Affecting PED",
    "body": "Several factors determine whether demand is elastic or inelastic.",
    "key_terms": [
      "Number of substitutes: more substitutes → more elastic",
      "Necessity vs luxury: necessities tend to be inelastic",
      "Proportion of income: higher proportion → more elastic",
      "Time period: demand becomes more elastic over time as consumers adjust",
      "Brand loyalty: strong branding reduces elasticity"
    ]
  },
  {
    "type": "worked_example",
    "heading": "Price Elasticity of Supply (PES)",
    "steps": [
      "PES = % change in quantity supplied ÷ % change in price",
      "PES is always positive (direct relationship)",
      "Example: Price rises from £20 to £25 (+25%); quantity supplied rises from 200 to 220 (+10%)",
      "PES = 10% ÷ 25% = 0.4 → inelastic supply",
      "Factors making supply inelastic: spare capacity lacking, long production period, perishable goods, fixed inputs"
    ]
  },
  {
    "type": "explanation",
    "heading": "Income Elasticity of Demand (YED)",
    "body": "YED measures how quantity demanded responds to a change in consumer income. YED = % change in Qd ÷ % change in income. Normal goods: YED > 0 (demand rises with income). Inferior goods: YED < 0 (demand falls as income rises). Luxury goods: YED > 1.",
    "key_terms": [
      "Normal good: YED > 0 (e.g. restaurant meals)",
      "Inferior good: YED < 0 (e.g. own-brand supermarket goods)",
      "Luxury good: YED > 1 (income elastic)"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0001-0002-0000-000000000001',
  'ba100000-0001-0002-0000-000000000000',
  'mcq',
  'A product has a PED of –2.5. If price is increased by 10%, total revenue will:',
  '["Increase, because demand is inelastic", "Decrease, because demand is elastic", "Stay the same, because PED = –2.5", "Increase, because PED is negative"]',
  '"Decrease, because demand is elastic"',
  '|PED| = 2.5 > 1, so demand is elastic. A 10% price rise causes a 25% fall in quantity. Revenue = P × Q falls overall. When demand is elastic, price rises reduce total revenue.',
  1
),
(
  'ba100000-0001-0002-0000-000000000002',
  'ba100000-0001-0002-0000-000000000000',
  'mcq',
  'If price rises from £50 to £60 and quantity demanded falls from 400 to 360 units, what is the PED?',
  '["-0.5", "-2.0", "-0.25", "-4.0"]',
  '"-0.5"',
  '%ΔQd = (360–400)/400 = –10%. %ΔP = (60–50)/50 = +20%. PED = –10%/20% = –0.5. |PED| < 1 → inelastic.',
  2
),
(
  'ba100000-0001-0002-0000-000000000003',
  'ba100000-0001-0002-0000-000000000000',
  'true_false',
  'A luxury good has a YED greater than 1.',
  '["True", "False"]',
  '"True"',
  'Luxury goods are income elastic (YED > 1): as income rises, demand rises proportionally more. Examples include designer clothing, fine dining, and overseas holidays.',
  3
),
(
  'ba100000-0001-0002-0000-000000000004',
  'ba100000-0001-0002-0000-000000000000',
  'mcq',
  'Which factor is most likely to make supply INELASTIC in the short run?',
  '["Abundant spare production capacity", "Short production lead times", "Perishable or time-specific output", "Easy availability of substitute inputs"]',
  '"Perishable or time-specific output"',
  'Perishable goods (e.g. fresh flowers, electricity) cannot be stored and must be sold regardless of price — making supply inelastic. Spare capacity and short lead times increase elasticity.',
  4
) ON CONFLICT (id) DO NOTHING;

-- Lesson 1.3: Market Structures
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0001-0003-0000-000000000000',
  'ba100000-0001-0000-0000-000000000000',
  'Market Structures',
  3,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Market Structures",
    "body": "A market structure describes the competitive environment in which firms operate. Structure affects pricing power, output decisions, profit levels, and efficiency. CIMA BA1 covers four main structures.",
    "emoji": "🏭"
  },
  {
    "type": "table",
    "heading": "Overview of Market Structures",
    "headers": ["Feature", "Perfect Competition", "Monopolistic Competition", "Oligopoly", "Monopoly"],
    "rows": [
      ["Number of firms", "Very many", "Many", "Few", "One"],
      ["Product", "Identical (homogeneous)", "Differentiated", "Similar or differentiated", "Unique"],
      ["Barriers to entry", "None", "Low", "High", "Very high"],
      ["Price setting", "Price taker", "Some power", "Interdependent", "Price maker"],
      ["Long-run profit", "Normal only", "Normal only", "Supernormal possible", "Supernormal possible"],
      ["Example", "Agricultural commodities", "Restaurants", "Supermarkets, airlines", "National Rail, utilities"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Perfect Competition",
    "body": "In perfect competition, firms are price takers — they sell at the market price and earn only normal profit in the long run. Free entry and exit ensures any supernormal profit is competed away. Allocatively and productively efficient.",
    "key_terms": [
      "Price taker: firm accepts the market price; no power to set it",
      "Normal profit: the minimum return needed to keep the firm in business",
      "Supernormal profit: profit above normal; attracts new entrants",
      "Homogeneous product: identical goods — no basis for brand differentiation"
    ]
  },
  {
    "type": "explanation",
    "heading": "Monopoly",
    "body": "A monopolist is the sole supplier and acts as a price maker. High barriers to entry protect supernormal profits in the long run. Monopolists can price discriminate — charging different prices to different customer groups to extract more consumer surplus.",
    "key_terms": [
      "Price maker: firm sets its own price (faces downward-sloping demand curve)",
      "Barriers to entry: legal (patents, licences), economies of scale, ownership of scarce resources",
      "Price discrimination: charging different prices for the same product to different groups",
      "Dead-weight loss: welfare lost because output is below the competitive level"
    ]
  },
  {
    "type": "explanation",
    "heading": "Oligopoly and Game Theory",
    "body": "In oligopoly, a small number of large firms dominate the market. Firms are interdependent — each firm's decisions affect and are affected by rivals. This leads to the kinked demand curve model (price rigidity) and explains collusive vs competitive behaviour. The Prisoners' Dilemma illustrates why firms may not collude even when it would benefit both.",
    "key_terms": [
      "Interdependence: each firm must consider rivals' reactions before acting",
      "Collusion: agreement between firms to fix prices or share markets (illegal cartel)",
      "Kinked demand curve: prices tend to be sticky in oligopolies",
      "Contestable market: even one potential entrant can discipline monopoly pricing"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0001-0003-0000-000000000001',
  'ba100000-0001-0003-0000-000000000000',
  'mcq',
  'In perfect competition, a firm earns only normal profit in the long run because:',
  '["The government regulates prices", "Free entry and exit eliminates supernormal profit", "Firms collude to keep prices stable", "Products are highly differentiated"]',
  '"Free entry and exit eliminates supernormal profit"',
  'Supernormal profit attracts new entrants. Increased supply drives down price until only normal profit remains. The free entry and exit condition is essential to this outcome.',
  1
),
(
  'ba100000-0001-0003-0000-000000000002',
  'ba100000-0001-0003-0000-000000000000',
  'mcq',
  'A monopolist wishing to maximise profit will produce where:',
  '["Price equals average cost", "Marginal revenue equals marginal cost", "Total revenue is maximised", "Price equals marginal cost"]',
  '"Marginal revenue equals marginal cost"',
  'All profit-maximising firms produce where MR = MC, regardless of market structure. For a monopolist, this results in a higher price and lower output than in perfect competition.',
  2
),
(
  'ba100000-0001-0003-0000-000000000003',
  'ba100000-0001-0003-0000-000000000000',
  'true_false',
  'Price discrimination allows a monopolist to capture more consumer surplus.',
  '["True", "False"]',
  '"True"',
  'Price discrimination charges different prices to different customers based on their willingness to pay. This converts consumer surplus into producer surplus (profit) for the monopolist.',
  3
),
(
  'ba100000-0001-0003-0000-000000000004',
  'ba100000-0001-0003-0000-000000000000',
  'mcq',
  'Which market structure is characterised by a small number of large interdependent firms?',
  '["Perfect competition", "Monopolistic competition", "Oligopoly", "Monopsony"]',
  '"Oligopoly"',
  'Oligopoly features a small number of dominant firms (e.g. UK supermarkets: Tesco, Sainsbury''s, Asda, Morrisons). Interdependence means each firm''s actions affect rivals, leading to strategic behaviour.',
  4
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULE 2: Macroeconomics
-- ============================================================
INSERT INTO public.modules (id, course_id, title, description, order_index)
VALUES (
  'ba100000-0002-0000-0000-000000000000',
  'ba100000-0000-0000-0000-000000000000',
  'Macroeconomics',
  'GDP, business cycles, inflation, unemployment, and fiscal and monetary policy.',
  2
) ON CONFLICT (id) DO NOTHING;

-- Lesson 2.1: GDP, Business Cycles and Economic Growth
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0002-0001-0000-000000000000',
  'ba100000-0002-0000-0000-000000000000',
  'GDP, Business Cycles and Economic Growth',
  1,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "GDP, Business Cycles and Economic Growth",
    "body": "Gross Domestic Product (GDP) is the main measure of an economy's output. Understanding how GDP is measured and how it fluctuates over the business cycle is fundamental to macroeconomic analysis.",
    "emoji": "📊"
  },
  {
    "type": "explanation",
    "heading": "Measuring GDP",
    "body": "GDP can be measured three ways, each giving the same result in theory. Nominal GDP uses current prices; real GDP adjusts for inflation to show actual volume changes.",
    "key_terms": [
      "Expenditure approach: GDP = C + I + G + (X – M) where C=consumption, I=investment, G=government, X=exports, M=imports",
      "Income approach: sum of all factor incomes (wages, profits, rent, interest)",
      "Output approach: sum of value added at each stage of production",
      "Nominal GDP: measured at current prices — includes price changes",
      "Real GDP: adjusted for inflation — measures actual volume of output"
    ]
  },
  {
    "type": "table",
    "heading": "Phases of the Business Cycle",
    "headers": ["Phase", "Characteristics", "Typical policy response"],
    "rows": [
      ["Expansion / Boom", "Rising GDP, low unemployment, rising prices, high consumer confidence", "Contractionary policy to prevent overheating"],
      ["Peak", "Maximum output, full employment, inflationary pressure", "Tighten monetary policy"],
      ["Contraction / Recession", "Falling GDP (2+ quarters), rising unemployment, falling investment", "Expansionary (stimulus) policy"],
      ["Trough", "Minimum output, highest unemployment, low confidence", "Fiscal stimulus, low interest rates"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Economic Growth and the Multiplier",
    "body": "Economic growth is a sustained increase in real GDP over time. The Keynesian multiplier shows how an initial change in spending leads to a larger change in national income. If households spend 80% of extra income (MPC = 0.8), the multiplier = 1/(1–0.8) = 5.",
    "key_terms": [
      "MPC (Marginal Propensity to Consume): fraction of extra income spent on consumption",
      "MPS (Marginal Propensity to Save): fraction of extra income saved; MPC + MPS = 1",
      "Multiplier = 1 / (1 – MPC) = 1 / MPS",
      "Injection: government spending, investment, exports — add to circular flow",
      "Withdrawal: saving, taxation, imports — remove from circular flow"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0002-0001-0000-000000000001',
  'ba100000-0002-0001-0000-000000000000',
  'mcq',
  'Which formula correctly represents the expenditure approach to GDP?',
  '["GDP = C + S + G + (X – M)", "GDP = C + I + G + (X – M)", "GDP = W + P + R + I", "GDP = C + I – G + (X + M)"]',
  '"GDP = C + I + G + (X – M)"',
  'The expenditure approach sums: C (consumption) + I (investment) + G (government spending) + net exports (X – M). Note: imports are subtracted because they represent spending on foreign output.',
  1
),
(
  'ba100000-0002-0001-0000-000000000002',
  'ba100000-0002-0001-0000-000000000000',
  'mcq',
  'If the MPC is 0.75, what is the value of the Keynesian multiplier?',
  '["3", "4", "0.25", "1.75"]',
  '"4"',
  'Multiplier = 1 / (1 – MPC) = 1 / (1 – 0.75) = 1 / 0.25 = 4. So a £1 billion increase in government spending would increase national income by £4 billion.',
  2
),
(
  'ba100000-0002-0001-0000-000000000003',
  'ba100000-0002-0001-0000-000000000000',
  'true_false',
  'A recession is technically defined as two consecutive quarters of negative real GDP growth.',
  '["True", "False"]',
  '"True"',
  'This is the standard technical definition of a recession. Note it refers to REAL GDP growth (adjusted for inflation) — so a country with rising nominal GDP but falling real GDP would still be in recession.',
  3
),
(
  'ba100000-0002-0001-0000-000000000004',
  'ba100000-0002-0001-0000-000000000000',
  'mcq',
  'Which of the following is an INJECTION into the circular flow of income?',
  '["Savings by households", "Income tax paid to government", "Imports of goods", "Investment spending by firms"]',
  '"Investment spending by firms"',
  'Injections add money into the circular flow: Investment (I), Government spending (G), and Exports (X). Withdrawals remove money: Savings (S), Taxation (T), and Imports (M). Remember: IGX = injections; STM = withdrawals.',
  4
) ON CONFLICT (id) DO NOTHING;

-- Lesson 2.2: Inflation and Unemployment
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0002-0002-0000-000000000000',
  'ba100000-0002-0000-0000-000000000000',
  'Inflation and Unemployment',
  2,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Inflation and Unemployment",
    "body": "Inflation (rising price levels) and unemployment are two of the most closely watched macroeconomic indicators. Governments and central banks aim to keep both low and stable.",
    "emoji": "💹"
  },
  {
    "type": "explanation",
    "heading": "Measuring and Causes of Inflation",
    "body": "Inflation is measured by the Consumer Prices Index (CPI) or Retail Prices Index (RPI). There are two main causes.",
    "key_terms": [
      "CPI: measures the average change in prices of a basket of goods and services",
      "RPI: older measure that includes housing costs; generally higher than CPI",
      "Demand-pull inflation: caused by excess aggregate demand (economy growing too fast, too much money chasing too few goods)",
      "Cost-push inflation: caused by rising production costs (wages, raw materials, energy) passed on as higher prices",
      "Hyperinflation: extremely rapid price rises that destroy confidence in money"
    ]
  },
  {
    "type": "explanation",
    "heading": "Effects of Inflation",
    "body": "Moderate inflation (around 2%) is considered healthy. High or volatile inflation creates economic uncertainty.",
    "key_terms": [
      "Redistributive effects: debtors gain (real value of debt falls); creditors lose",
      "Competitiveness: high domestic inflation makes exports more expensive; reduces international competitiveness",
      "Uncertainty: businesses defer investment; economic growth slows",
      "Shoe-leather costs: time/effort wasted managing cash holdings when money loses value",
      "Menu costs: cost of updating prices frequently"
    ]
  },
  {
    "type": "table",
    "heading": "Types of Unemployment",
    "headers": ["Type", "Cause", "Policy solution"],
    "rows": [
      ["Frictional", "Transition between jobs; temporary search process", "Better job information (e.g. job centres)"],
      ["Structural", "Long-term decline of an industry; skill mismatch", "Retraining, education, regional investment"],
      ["Cyclical (demand-deficient)", "Insufficient aggregate demand during recession", "Fiscal or monetary stimulus"],
      ["Seasonal", "Demand fluctuates seasonally (e.g. tourism, agriculture)", "Benefits system, flexible contracts"],
      ["Real-wage (classical)", "Wages above market-clearing level (e.g. minimum wage)", "Wage flexibility or lower minimum wage"]
    ]
  },
  {
    "type": "explanation",
    "heading": "The Phillips Curve",
    "body": "The short-run Phillips Curve shows a trade-off between inflation and unemployment: lower unemployment tends to be associated with higher inflation (tight labour market pushes wages up). In the long run, this trade-off breaks down as expectations adjust — the long-run Phillips Curve is vertical at the natural rate of unemployment (NRU).",
    "key_terms": [
      "Phillips Curve: inverse short-run relationship between inflation and unemployment",
      "Natural Rate of Unemployment (NRU): unemployment when labour market is in equilibrium (includes frictional and structural)",
      "NAIRU: non-accelerating inflation rate of unemployment — equivalent concept to NRU"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0002-0002-0000-000000000001',
  'ba100000-0002-0002-0000-000000000000',
  'mcq',
  'A sharp rise in world oil prices causing domestic inflation is an example of:',
  '["Demand-pull inflation", "Cost-push inflation", "Hyperinflation", "Structural inflation"]',
  '"Cost-push inflation"',
  'Rising input costs (oil, raw materials, wages) push up firms'' production costs. These costs are passed on as higher prices — cost-push inflation. It is a supply-side phenomenon, unlike demand-pull which originates from excess demand.',
  1
),
(
  'ba100000-0002-0002-0000-000000000002',
  'ba100000-0002-0002-0000-000000000000',
  'mcq',
  'A worker who left their job to look for a better one is experiencing which type of unemployment?',
  '["Structural unemployment", "Cyclical unemployment", "Frictional unemployment", "Seasonal unemployment"]',
  '"Frictional unemployment"',
  'Frictional unemployment is the temporary unemployment experienced when people move between jobs. It exists even in a healthy economy and is considered part of the natural rate of unemployment.',
  2
),
(
  'ba100000-0002-0002-0000-000000000003',
  'ba100000-0002-0002-0000-000000000000',
  'true_false',
  'Inflation benefits debtors at the expense of creditors.',
  '["True", "False"]',
  '"True"',
  'Inflation erodes the real value of money. Debtors repay loans with money that is worth less in real terms — a gain. Creditors receive back less in real terms than they lent — a loss. This is why lenders charge higher interest rates when inflation is expected to rise.',
  3
),
(
  'ba100000-0002-0002-0000-000000000004',
  'ba100000-0002-0002-0000-000000000000',
  'mcq',
  'The long-run Phillips Curve is vertical because:',
  '["Unemployment cannot be reduced below zero", "In the long run, inflation expectations adjust, eliminating the trade-off", "Governments always choose zero inflation", "The central bank targets unemployment rather than inflation"]',
  '"In the long run, inflation expectations adjust, eliminating the trade-off"',
  'In the short run, unexpected inflation can reduce unemployment. But workers and firms adjust their expectations. In the long run, the economy returns to the natural rate regardless of the inflation rate — making the long-run Phillips Curve vertical.',
  4
) ON CONFLICT (id) DO NOTHING;

-- Lesson 2.3: Fiscal and Monetary Policy
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0002-0003-0000-000000000000',
  'ba100000-0002-0000-0000-000000000000',
  'Fiscal and Monetary Policy',
  3,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Fiscal and Monetary Policy",
    "body": "Governments and central banks use fiscal and monetary policy to manage the macroeconomy — aiming for stable growth, low inflation, and high employment. Understanding these tools is essential for any finance professional.",
    "emoji": "🏦"
  },
  {
    "type": "explanation",
    "heading": "Fiscal Policy",
    "body": "Fiscal policy involves government decisions on taxation and public spending. It directly affects aggregate demand.",
    "key_terms": [
      "Expansionary fiscal policy: increase spending or cut taxes → stimulate demand (used in recession)",
      "Contractionary fiscal policy: cut spending or raise taxes → reduce demand (used to control inflation)",
      "Budget deficit: government spending exceeds tax revenue",
      "Budget surplus: tax revenue exceeds government spending",
      "National debt: cumulative total of all past budget deficits",
      "Automatic stabilisers: tax/benefit systems that automatically dampen economic cycles (e.g. unemployment benefits rise in recession)"
    ]
  },
  {
    "type": "explanation",
    "heading": "Monetary Policy",
    "body": "Monetary policy is controlled by the central bank (Bank of England in the UK) and involves managing money supply and interest rates. The Bank of England's primary objective is to maintain inflation at 2% CPI.",
    "key_terms": [
      "Bank Rate (base rate): the interest rate set by the Bank of England; affects all other rates",
      "Tight/contractionary monetary policy: raise interest rates → reduce borrowing/spending → lower inflation",
      "Loose/expansionary monetary policy: cut interest rates → encourage borrowing → stimulate growth",
      "Quantitative Easing (QE): central bank creates money to buy assets; increases money supply",
      "Transmission mechanism: how changes in Bank Rate feed through to consumption, investment, exchange rates"
    ]
  },
  {
    "type": "table",
    "heading": "Comparing Fiscal and Monetary Policy",
    "headers": ["Feature", "Fiscal Policy", "Monetary Policy"],
    "rows": [
      ["Controlled by", "Government (Chancellor)", "Central Bank (Bank of England)"],
      ["Main tools", "Government spending, taxation", "Interest rates, QE, reserve requirements"],
      ["Speed", "Slow (requires legislation)", "Faster (MPC meets monthly)"],
      ["Effectiveness in recession", "Powerful (direct demand boost)", "May be limited (liquidity trap)"],
      ["Political influence", "High (political budget cycles)", "Low (independent central bank)"],
      ["UK example", "2020 Furlough scheme", "2009 QE programme"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Supply-Side Policies",
    "body": "Supply-side policies aim to increase the productive capacity of the economy (shift aggregate supply outward) rather than just managing demand. They address long-run growth.",
    "key_terms": [
      "Labour market reforms: reduce union power, improve training, cut benefits to increase incentives to work",
      "Competition policy: prevent monopolies, encourage competition",
      "Privatisation: transfer state-owned industries to private sector for efficiency",
      "Deregulation: remove barriers to entry and red tape",
      "Infrastructure investment: improve transport, communications, digital networks"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0002-0003-0000-000000000001',
  'ba100000-0002-0003-0000-000000000000',
  'mcq',
  'The Bank of England raises interest rates. This is an example of:',
  '["Expansionary fiscal policy", "Contractionary monetary policy", "Expansionary monetary policy", "Contractionary fiscal policy"]',
  '"Contractionary monetary policy"',
  'Raising interest rates is contractionary monetary policy — it increases borrowing costs, reduces consumption and investment, and slows the economy to control inflation. It is monetary (not fiscal) because it is controlled by the central bank, not the government.',
  1
),
(
  'ba100000-0002-0003-0000-000000000002',
  'ba100000-0002-0003-0000-000000000000',
  'mcq',
  'Which of the following is an AUTOMATIC STABILISER?',
  '["A new infrastructure project announced in the budget", "Unemployment benefits that rise during a recession", "The Bank of England cutting interest rates", "A government decision to cut income tax"]',
  '"Unemployment benefits that rise during a recession"',
  'Automatic stabilisers work without deliberate policy decisions. When the economy slumps, unemployment rises → benefit payments automatically increase → cushions the fall in aggregate demand. No government action needed — it happens automatically.',
  2
),
(
  'ba100000-0002-0003-0000-000000000003',
  'ba100000-0002-0003-0000-000000000000',
  'true_false',
  'Quantitative Easing involves the central bank creating new money to purchase financial assets.',
  '["True", "False"]',
  '"True"',
  'QE is used when interest rates are already near zero (liquidity trap). The central bank electronically creates money and uses it to buy government bonds and other assets from financial institutions, increasing the money supply and encouraging lending.',
  3
),
(
  'ba100000-0002-0003-0000-000000000004',
  'ba100000-0002-0003-0000-000000000000',
  'mcq',
  'Supply-side policies differ from demand-side policies in that they aim to:',
  '["Increase aggregate demand directly", "Increase the productive capacity and long-run potential of the economy", "Reduce the budget deficit in the short term", "Control the money supply"]',
  '"Increase the productive capacity and long-run potential of the economy"',
  'Supply-side policies (e.g. education, deregulation, privatisation) shift the aggregate supply curve outward, increasing potential GDP. This enables non-inflationary growth, unlike demand-side policies which stimulate spending.',
  4
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULE 3: International Economics
-- ============================================================
INSERT INTO public.modules (id, course_id, title, description, order_index)
VALUES (
  'ba100000-0003-0000-0000-000000000000',
  'ba100000-0000-0000-0000-000000000000',
  'International Economics',
  'Exchange rates, trade, comparative advantage, and international organisations.',
  3
) ON CONFLICT (id) DO NOTHING;

-- Lesson 3.1: Exchange Rates and International Trade
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba100000-0003-0001-0000-000000000000',
  'ba100000-0003-0000-0000-000000000000',
  'Exchange Rates and International Trade',
  1,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Exchange Rates and International Trade",
    "body": "Exchange rates determine the relative price of one currency in terms of another. They affect international trade, inflation, and economic competitiveness. Comparative advantage explains the basis for international trade.",
    "emoji": "🌍"
  },
  {
    "type": "explanation",
    "heading": "Exchange Rate Systems",
    "body": "Countries choose different systems for managing their exchange rates, each with distinct advantages and disadvantages.",
    "key_terms": [
      "Floating exchange rate: determined entirely by supply and demand in the currency market; no government intervention (e.g. £, $, €)",
      "Fixed exchange rate: government pegs currency to another currency or commodity; requires intervention to maintain",
      "Managed float: mostly determined by market forces but with occasional central bank intervention",
      "Appreciation: home currency buys more foreign currency (e.g. £1 = $1.20 → $1.30)",
      "Depreciation: home currency buys less foreign currency (e.g. £1 = $1.30 → $1.20)"
    ]
  },
  {
    "type": "worked_example",
    "heading": "Effects of Sterling Depreciation",
    "steps": [
      "£ depreciates from £1 = $1.50 to £1 = $1.20",
      "Effect on exports: UK goods become cheaper for US buyers → export volumes rise",
      "Effect on imports: Foreign goods cost more in £ → UK inflation rises, import volumes fall",
      "Effect on current account: In theory improves (more exports, fewer imports) — but depends on PED",
      "J-curve effect: Current account initially worsens (contracts fixed) before improving as volumes adjust"
    ]
  },
  {
    "type": "explanation",
    "heading": "Comparative Advantage",
    "body": "Even if one country is absolutely better at producing everything, trade is still beneficial if each country specialises in what it produces at a lower opportunity cost (comparative advantage). This is the fundamental basis for international trade.",
    "key_terms": [
      "Absolute advantage: producing a good with fewer resources than another country",
      "Comparative advantage: producing a good at a lower opportunity cost than another country",
      "Opportunity cost: the next best alternative foregone",
      "Terms of trade: the ratio of export prices to import prices; an improvement means exports buy more imports"
    ]
  },
  {
    "type": "table",
    "heading": "Protectionist Measures and Their Effects",
    "headers": ["Measure", "Mechanism", "Effect"],
    "rows": [
      ["Tariff (import duty)", "Tax on imported goods", "Raises import prices; reduces import volumes; generates government revenue"],
      ["Import quota", "Limit on quantity of imports", "Restricts import volumes; may push up domestic prices"],
      ["Subsidy to domestic producers", "Government payment to home industry", "Lowers domestic production cost; increases home output; diverts trade"],
      ["Embargo", "Complete ban on imports from a country", "Total trade restriction; often for political reasons"]
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba100000-0003-0001-0000-000000000001',
  'ba100000-0003-0001-0000-000000000000',
  'mcq',
  'If sterling appreciates against the dollar, which of the following is most likely?',
  '["UK exports become cheaper for US buyers", "UK inflation rises due to higher import prices", "UK exports become more expensive for US buyers", "The current account deficit narrows"]',
  '"UK exports become more expensive for US buyers"',
  'Appreciation means £1 buys more dollars. A UK product priced at £100 now costs more dollars — making UK exports less competitive. This can reduce export volumes and potentially worsen the current account.',
  1
),
(
  'ba100000-0003-0001-0000-000000000002',
  'ba100000-0003-0001-0000-000000000000',
  'mcq',
  'Country A can produce either 10 cars or 20 tonnes of wheat per day. Country B can produce 8 cars or 24 tonnes of wheat per day. Who has a comparative advantage in wheat?',
  '["Country A — it produces more cars", "Country B — its opportunity cost of wheat is lower", "Country A — it produces more wheat", "Neither — comparative advantage only applies to absolute producers"]',
  '"Country B — its opportunity cost of wheat is lower"',
  'Country A: 1 tonne of wheat costs 0.5 cars. Country B: 1 tonne of wheat costs 0.33 cars. Country B gives up fewer cars per tonne of wheat → lower opportunity cost → comparative advantage in wheat. Country A has comparative advantage in cars.',
  2
),
(
  'ba100000-0003-0001-0000-000000000003',
  'ba100000-0003-0001-0000-000000000000',
  'true_false',
  'The J-curve effect suggests that a currency depreciation initially worsens the current account before it improves.',
  '["True", "False"]',
  '"True"',
  'Initially, existing trade contracts mean import volumes don''t fall immediately. Import costs rise in domestic currency → current account worsens. Over time, trade volumes adjust (imports fall, exports rise) → current account improves, tracing a J-shape.',
  3
),
(
  'ba100000-0003-0001-0000-000000000004',
  'ba100000-0003-0001-0000-000000000000',
  'mcq',
  'A tariff on imported steel is an example of:',
  '["A supply-side policy to boost productivity", "A protectionist measure to reduce import competition", "An automatic stabiliser", "A monetary policy tool"]',
  '"A protectionist measure to reduce import competition"',
  'A tariff is a tax on imports. It raises the price of imported goods, making domestic producers more competitive. Protectionist measures restrict free trade and are often criticised for reducing global economic efficiency.',
  4
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ACHIEVEMENTS for BA1
-- ============================================================
INSERT INTO public.achievements (id, slug, title, description, icon, trigger_type, trigger_value)
VALUES
(
  'ba100000-aaaa-0001-0000-000000000000',
  'ba1-economist',
  'Economist',
  'Complete your first BA1 lesson',
  '📈',
  'lesson_complete',
  '{"course_slug": "ba1-business-economics", "min_lessons": 1}'
),
(
  'ba100000-aaaa-0002-0000-000000000000',
  'ba1-market-analyst',
  'Market Analyst',
  'Complete the Microeconomics module',
  '⚖️',
  'module_complete',
  '{"module_id": "ba100000-0001-0000-0000-000000000000"}'
),
(
  'ba100000-aaaa-0003-0000-000000000000',
  'ba1-policy-advisor',
  'Policy Advisor',
  'Complete all BA1 modules',
  '🏦',
  'course_complete',
  '{"course_slug": "ba1-business-economics"}'
)
ON CONFLICT (id) DO NOTHING;
