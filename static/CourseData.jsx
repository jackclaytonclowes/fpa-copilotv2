/* AccountIQ — CIMA course content: BA1, BA2, BA3, BA4 */
/* Pure data file — no React components. Exposes window.COURSE_CONTENT,   */
/* window.loadProgress, window.saveProgress, window.computeLiveStats.      */

// ── Progress persistence ─────────────────────────────────────────────────────
var PROGRESS_KEY = "accountiq_progress";

function loadProgress() {
  try {
    var raw = localStorage.getItem(PROGRESS_KEY);
    var p   = raw ? JSON.parse(raw) : {};
    return {
      completedLessons: Array.isArray(p.completedLessons) ? p.completedLessons : [],
      quizScores:       (p.quizScores && typeof p.quizScores === "object") ? p.quizScores : {},
    };
  } catch (e) {
    return { completedLessons: [], quizScores: {} };
  }
}

function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
}

function computeLiveStats(courseId, progress, courseContent) {
  var lessons = (courseContent && courseContent.lessons) ? courseContent.lessons : [];
  var total   = lessons.length;
  var done    = lessons.filter(function(l) {
    return progress.completedLessons.indexOf(l.id) !== -1;
  }).length;
  var xp = lessons.reduce(function(sum, l) {
    var s = progress.quizScores[l.id];
    return sum + (s ? s.score * 50 : 0);
  }, 0);
  return {
    completedCount: done,
    totalLessons:   total,
    progressPct:    total ? Math.round(done / total * 100) : 0,
    xpEarned:       xp,
  };
}

// ── Course content ───────────────────────────────────────────────────────────
var COURSE_CONTENT = {

  // ══════════════════════════════════════════════════════════════════════════
  // BA1 — Fundamentals of Business Economics
  // ══════════════════════════════════════════════════════════════════════════
  ba1: {
    lessons: [
      {
        id: "ba1-l1",
        title: "The Economic Environment",
        summary: "Understand the macroeconomic environment in which businesses operate, including GDP, the business cycle, inflation and government economic objectives.",
        estimatedMinutes: 25,
        objectives: [
          "Define GDP and explain how it is measured using three approaches",
          "Describe the four phases of the business cycle and their business implications",
          "Distinguish between demand-pull and cost-push inflation",
          "Identify the four main macroeconomic objectives pursued by governments",
        ],
        content: [
          {
            type: "paragraph",
            text: "Economics studies how individuals, businesses and governments allocate scarce resources. For business professionals, understanding the macroeconomic environment is essential for forecasting, planning and strategic decision-making.",
          },
          {
            type: "heading",
            text: "Gross Domestic Product (GDP)",
          },
          {
            type: "paragraph",
            text: "GDP measures the total monetary value of all goods and services produced within a country's borders during a specific period. It is the most widely used indicator of an economy's size and health.",
          },
          {
            type: "list",
            heading: "Three approaches to measuring GDP:",
            items: [
              "Expenditure: GDP = C + I + G + (X − M), where C = consumption, I = investment, G = government spending, X = exports, M = imports",
              "Income: sum of all wages, profits, rent and interest earned in production",
              "Output: sum of value added at each stage of production across all industries",
            ],
          },
          {
            type: "heading",
            text: "The Business Cycle",
          },
          {
            type: "paragraph",
            text: "Economies experience recurring cycles of expansion and contraction. Recognising the current phase enables businesses to anticipate demand shifts and adjust their strategies accordingly.",
          },
          {
            type: "list",
            heading: "Four phases of the business cycle:",
            items: [
              "Expansion: rising GDP, falling unemployment, increasing investment and consumer confidence",
              "Peak: highest point of activity; inflationary pressure may be building",
              "Contraction/Recession: GDP falls for two or more consecutive quarters; unemployment rises",
              "Trough: lowest point; GDP stabilises before recovery begins",
            ],
          },
          {
            type: "callout",
            tone: "info",
            text: "A technical recession is defined as two consecutive quarters of negative GDP growth. During the 2008–09 financial crisis, UK GDP contracted by 6.1% — the deepest recession since World War II.",
          },
          {
            type: "heading",
            text: "Inflation",
          },
          {
            type: "paragraph",
            text: "Inflation is a sustained rise in the general price level, measured in the UK by the Consumer Prices Index (CPI). Understanding the cause of inflation is critical because different causes require different policy responses.",
          },
          {
            type: "list",
            heading: "Two main causes of inflation:",
            items: [
              "Demand-pull: excess demand pulls prices up — too much money chasing too few goods (e.g. post-pandemic consumer boom)",
              "Cost-push: rising production costs (wages, energy, raw materials) are passed on to consumers as higher prices",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: Always distinguish between demand-pull and cost-push inflation when answering questions on inflation. The examiner expects you to identify the cause before recommending a policy response.",
          },
        ],
        quiz: [
          {
            id: "ba1-l1-q1",
            question: "Which of the following correctly defines GDP?",
            options: [
              "The total value of all goods and services produced within a country's borders during a period",
              "The total value of exports minus the total value of imports in a given year",
              "The total income earned by a country's citizens regardless of where they work",
              "The total government expenditure on public services in a financial year",
            ],
            correct: 0,
            explanation: "GDP (Gross Domestic Product) measures the total monetary value of all goods and services produced within a country's borders. Option C describes GNP (Gross National Product), which includes income earned by citizens overseas.",
          },
          {
            id: "ba1-l1-q2",
            question: "A country is said to be in a technical recession when:",
            options: [
              "GDP growth falls below the long-run average for one quarter",
              "Unemployment rises above 5% of the active labour force",
              "GDP declines for two or more consecutive quarters",
              "The government runs a budget deficit for two consecutive years",
            ],
            correct: 2,
            explanation: "A technical recession is specifically defined as two consecutive quarters of negative GDP growth. This is the standard international definition used by economists and policymakers.",
          },
          {
            id: "ba1-l1-q3",
            question: "In the expenditure approach to GDP, which formula is correct?",
            options: [
              "GDP = C + I + G + (M − X)",
              "GDP = C + I + G + (X − M)",
              "GDP = C + G + T + (X − M)",
              "GDP = C + I + T + (X + M)",
            ],
            correct: 1,
            explanation: "The correct formula is GDP = C + I + G + (X − M). Exports (X) are added because they represent income earned domestically; imports (M) are subtracted because they represent spending on foreign goods. The net figure (X − M) is net exports.",
          },
          {
            id: "ba1-l1-q4",
            question: "Cost-push inflation is primarily caused by:",
            options: [
              "Consumers spending beyond the productive capacity of the economy",
              "Excessive growth in the money supply driven by government borrowing",
              "Rising production costs being passed on to consumers as higher prices",
              "A fall in interest rates that encourages excessive household borrowing",
            ],
            correct: 2,
            explanation: "Cost-push inflation arises when the costs of production rise — for example, increases in wages, energy prices or raw material costs — and businesses pass these higher costs on to consumers through price increases. This contrasts with demand-pull inflation, which is caused by excess aggregate demand.",
          },
        ],
      },

      {
        id: "ba1-l2",
        title: "Supply, Demand and Price Mechanisms",
        summary: "Explore how prices are determined by the interaction of supply and demand, interpret price elasticity, and apply these concepts to business pricing decisions.",
        estimatedMinutes: 30,
        objectives: [
          "Draw and interpret supply and demand diagrams, distinguishing shifts from movements along the curve",
          "Calculate and interpret Price Elasticity of Demand (PED)",
          "Explain the factors that influence PED and its implications for revenue",
          "Define market equilibrium and explain the self-correcting mechanism",
        ],
        content: [
          {
            type: "paragraph",
            text: "The price mechanism is how free markets allocate scarce resources. Prices transmit information between buyers and sellers, rationing goods to those who value them most and signalling to producers where to allocate resources.",
          },
          {
            type: "heading",
            text: "The Law of Demand",
          },
          {
            type: "paragraph",
            text: "The law of demand states that, ceteris paribus, as price rises, quantity demanded falls. This inverse relationship arises because higher prices reduce purchasing power (the income effect) and encourage consumers to switch to substitutes (the substitution effect).",
          },
          {
            type: "list",
            heading: "Non-price factors that shift the demand curve:",
            items: [
              "Income: rising incomes increase demand for normal goods; inferior goods see demand fall",
              "Price of related goods: substitutes (higher price of one → higher demand for the other); complements (goods used together)",
              "Tastes and preferences: advertising, fashion and social trends shift demand",
              "Expectations: consumers buy more now if they expect prices to rise in future",
            ],
          },
          {
            type: "heading",
            text: "Price Elasticity of Demand (PED)",
          },
          {
            type: "paragraph",
            text: "PED measures the responsiveness of quantity demanded to a change in price. It is a vital tool for pricing decisions: if demand is inelastic, a price rise increases total revenue; if demand is elastic, a price rise reduces total revenue.",
          },
          {
            type: "callout",
            tone: "info",
            text: "PED = (% change in quantity demanded) ÷ (% change in price). A PED between 0 and −1 is inelastic (demand is relatively unresponsive). A PED less than −1 is elastic (highly responsive). PED values are typically negative, reflecting the inverse price–demand relationship.",
          },
          {
            type: "list",
            heading: "Factors that make demand more elastic:",
            items: [
              "Many close substitutes are available (e.g. branded vs. own-label supermarket goods)",
              "The good is a luxury rather than a necessity",
              "The good accounts for a large proportion of consumer income",
              "There is a longer time period in which consumers can adjust their behaviour",
            ],
          },
          {
            type: "heading",
            text: "Market Equilibrium",
          },
          {
            type: "paragraph",
            text: "Equilibrium is the price at which quantity demanded equals quantity supplied — the market clears. If price rises above equilibrium a surplus develops and pushes price back down; if it falls below, a shortage develops and pulls price back up.",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: Distinguish carefully between a movement along a curve (caused by a change in the good's own price) and a shift of the curve (caused by a change in any non-price determinant). Getting this wrong is one of the most common mistakes in BA1.",
          },
        ],
        quiz: [
          {
            id: "ba1-l2-q1",
            question: "Tea is a substitute for coffee. If the price of coffee rises significantly, what happens in the tea market?",
            options: [
              "Demand for tea falls; the demand curve shifts leftward",
              "Demand for tea rises; the demand curve shifts rightward",
              "There is a movement along the demand curve for tea as its price falls",
              "The supply curve for tea shifts to the right",
            ],
            correct: 1,
            explanation: "When the price of a substitute (coffee) rises, consumers switch to the alternative (tea), increasing demand for tea. This is shown as a rightward shift of the tea demand curve — not a movement along it, since tea's own price has not changed.",
          },
          {
            id: "ba1-l2-q2",
            question: "A product's price falls by 10% and quantity demanded rises by 25%. What is the PED and how should it be interpreted?",
            options: [
              "PED = −0.4; demand is inelastic",
              "PED = +2.5; demand is elastic",
              "PED = −2.5; demand is elastic",
              "PED = −2.5; demand is inelastic",
            ],
            correct: 2,
            explanation: "PED = 25% ÷ (−10%) = −2.5. Because the absolute value (2.5) exceeds 1, demand is price elastic. This means a price cut increases total revenue, as the proportionate rise in quantity demanded outweighs the proportionate fall in price.",
          },
          {
            id: "ba1-l2-q3",
            question: "At market equilibrium:",
            options: [
              "Consumers want to buy more than producers are willing to sell",
              "Producers want to sell more than consumers want to buy",
              "Quantity demanded equals quantity supplied and the market clears",
              "Government intervention is required to maintain the prevailing price",
            ],
            correct: 2,
            explanation: "At equilibrium, quantity demanded equals quantity supplied — there are no unsatisfied buyers or unsold units. The market is self-correcting: any deviation creates either a shortage (upward price pressure) or a surplus (downward price pressure) that restores equilibrium.",
          },
          {
            id: "ba1-l2-q4",
            question: "Which good would most likely have price inelastic demand?",
            options: [
              "Luxury sports cars",
              "Package holidays abroad",
              "Insulin for diabetic patients",
              "Designer fashion clothing",
            ],
            correct: 2,
            explanation: "Insulin is a medical necessity with no viable substitutes for diabetic patients — demand is highly inelastic regardless of price. Luxury goods such as sports cars and designer clothing tend to have more elastic demand because they are non-essential and have alternatives.",
          },
        ],
      },

      {
        id: "ba1-l3",
        title: "Market Structures",
        summary: "Analyse the four main market structures — perfect competition, monopoly, oligopoly and monopolistic competition — and their implications for pricing, output and business strategy.",
        estimatedMinutes: 35,
        objectives: [
          "Describe the key characteristics of perfect competition and explain the long-run equilibrium outcome",
          "Explain how monopoly power is created and sustained, and assess its welfare effects",
          "Describe oligopoly interdependence and explain price rigidity using the kinked demand curve",
          "Define monopolistic competition and explain how firms compete through product differentiation",
        ],
        content: [
          {
            type: "paragraph",
            text: "Market structure describes the competitive environment in which firms operate. It determines the degree of pricing power, the height of barriers to entry, and the strategic decisions firms make about price and output.",
          },
          {
            type: "heading",
            text: "Perfect Competition",
          },
          {
            type: "paragraph",
            text: "Perfect competition is a theoretical benchmark. All firms are price takers — none has the power to set price above marginal cost. Supernormal profits attract new entrants until only normal profit remains in the long run.",
          },
          {
            type: "list",
            heading: "Conditions required for perfect competition:",
            items: [
              "Many buyers and sellers — no single party can influence price",
              "Homogeneous (identical) products — no brand differentiation possible",
              "Perfect information — all market participants know all prices and opportunities",
              "Free entry and exit — no barriers prevent firms from entering or leaving",
            ],
          },
          {
            type: "heading",
            text: "Monopoly",
          },
          {
            type: "paragraph",
            text: "A monopoly exists when a single firm dominates the entire market. The monopolist is a price maker and can earn supernormal profit in the long run, protected by high barriers to entry such as patents, economies of scale or legal licences.",
          },
          {
            type: "callout",
            tone: "warn",
            text: "In the UK, the Competition and Markets Authority (CMA) may investigate firms with a market share above 25%. Monopoly itself is not illegal, but abusing a dominant position — for example through predatory pricing designed to eliminate rivals — is prohibited.",
          },
          {
            type: "heading",
            text: "Oligopoly",
          },
          {
            type: "paragraph",
            text: "An oligopoly is a market dominated by a small number of large firms. The key feature is interdependence: each firm must consider rivals' likely reactions before making pricing or output decisions. This strategic behaviour is often modelled using game theory.",
          },
          {
            type: "list",
            heading: "Features of oligopolistic markets:",
            items: [
              "High barriers to entry — often due to economies of scale or high capital costs",
              "Price rigidity — firms are reluctant to change prices due to the kinked demand curve",
              "Non-price competition — heavy investment in advertising, branding and product development",
              "Examples: UK supermarkets, global airlines, smartphone manufacturers",
            ],
          },
          {
            type: "callout",
            tone: "info",
            text: "The kinked demand curve: if a firm raises its price, rivals do not follow (demand becomes elastic above the current price and the firm loses market share). If it cuts its price, rivals match the cut (demand becomes inelastic below the current price). This creates a kink at the prevailing price and explains price stability in oligopoly.",
          },
        ],
        quiz: [
          {
            id: "ba1-l3-q1",
            question: "Which of the following is NOT a characteristic of perfect competition?",
            options: [
              "Many buyers and sellers with no single participant able to influence price",
              "Firms are price takers and sell at the market-determined price",
              "Significant barriers to entry protect firms' long-run supernormal profits",
              "Homogeneous products with perfect information across the market",
            ],
            correct: 2,
            explanation: "Perfect competition requires free entry and exit — barriers to entry are absent. Significant barriers are a characteristic of monopoly and oligopoly, which is why those structures can sustain supernormal profit in the long run while perfectly competitive markets cannot.",
          },
          {
            id: "ba1-l3-q2",
            question: "In the long run under perfect competition, firms will earn:",
            options: [
              "Supernormal profits, as efficient firms are rewarded for low costs",
              "Normal profit only, as new entrants compete away supernormal profits",
              "Sub-normal profits, because intense price competition erodes margins",
              "Zero accounting profit, as all revenue is consumed by costs",
            ],
            correct: 1,
            explanation: "Supernormal profits in perfect competition attract new entrants (because there are no barriers). The resulting increase in supply drives down price until only normal profit remains. Normal profit is the minimum return necessary to keep firms in the industry in the long run.",
          },
          {
            id: "ba1-l3-q3",
            question: "Price rigidity in an oligopoly is best explained by:",
            options: [
              "Government price controls imposed across the entire industry",
              "Formal secret agreements (cartels) between all firms to maintain prices",
              "The kinked demand curve — rivals match price cuts but not price rises",
              "The high price elasticity of demand facing each individual firm",
            ],
            correct: 2,
            explanation: "The kinked demand curve explains price stability without requiring illegal collusion. A firm that raises its price loses many customers (rivals don't follow, making demand elastic above the kink). A firm that cuts its price gains few extra customers (rivals match the cut, making demand inelastic below the kink).",
          },
          {
            id: "ba1-l3-q4",
            question: "A monopolist can sustain supernormal profit in the long run because:",
            options: [
              "It produces at the lowest possible average cost owing to economies of scale alone",
              "High barriers to entry prevent new competitors from entering and eroding profits",
              "Government subsidies support the monopolist's privileged market position",
              "Consumers are unable to substitute away from the monopolist's product at any price",
            ],
            correct: 1,
            explanation: "The defining characteristic that allows a monopolist to sustain long-run supernormal profit is the presence of high barriers to entry — such as patents, high capital requirements, network effects or legal protection — which prevent new firms from entering and competing away the excess returns.",
          },
        ],
      },

      {
        id: "ba1-l4",
        title: "Government Economic Policy",
        summary: "Examine the fiscal, monetary and supply-side policies governments use to manage the macroeconomy, and assess their effects on businesses.",
        estimatedMinutes: 30,
        objectives: [
          "Distinguish between fiscal policy, monetary policy and supply-side policy",
          "Explain the transmission mechanism of interest rate changes through the economy",
          "Analyse the business implications of changes in taxation and government spending",
          "Evaluate the limitations and conflicts between macroeconomic policy objectives",
        ],
        content: [
          {
            type: "paragraph",
            text: "Governments and central banks use policy tools to manage the macroeconomy, aiming to achieve stable growth, low inflation, full employment and a sustainable balance of payments. Each policy type works through different channels and has different effects on businesses.",
          },
          {
            type: "heading",
            text: "Fiscal Policy",
          },
          {
            type: "paragraph",
            text: "Fiscal policy involves government spending and taxation decisions designed to influence aggregate demand. Expansionary fiscal policy (increased spending or tax cuts) stimulates demand during a downturn. Contractionary fiscal policy (spending cuts or tax rises) cools an overheating economy.",
          },
          {
            type: "list",
            heading: "Business implications of fiscal policy changes:",
            items: [
              "Corporation tax cuts increase after-tax profits, encouraging investment and dividend distributions",
              "VAT increases raise consumer prices, potentially dampening demand for non-essential goods",
              "Government infrastructure spending creates direct demand for construction and engineering sectors",
              "Changes to employer National Insurance contributions directly affect the cost of hiring staff",
            ],
          },
          {
            type: "heading",
            text: "Monetary Policy",
          },
          {
            type: "paragraph",
            text: "Monetary policy is operated by the central bank — the Bank of England in the UK — primarily through setting the base interest rate. The rate decision flows through the economy via its effect on borrowing costs, asset prices and the exchange rate.",
          },
          {
            type: "callout",
            tone: "info",
            text: "Interest rate transmission: higher rates → mortgage and loan costs rise → consumers have less disposable income → consumer spending falls → business revenues decline. Higher rates also strengthen sterling, making UK exports more expensive abroad and imports cheaper domestically.",
          },
          {
            type: "heading",
            text: "Supply-Side Policies",
          },
          {
            type: "paragraph",
            text: "Supply-side policies aim to expand the productive capacity of the economy by improving efficiency in factor and product markets. Unlike demand-side interventions, they work on long-run aggregate supply and take considerable time to produce results.",
          },
          {
            type: "list",
            heading: "Examples of supply-side policies and their aims:",
            items: [
              "Education and training investment: improves workforce productivity and labour quality",
              "Deregulation: reduces compliance costs and promotes competition across industries",
              "Privatisation: transfers state enterprises to private ownership to improve efficiency",
              "Labour market reform: reduces barriers to hiring and firing, improving flexibility",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: Supply-side policies work slowly and are unsuitable for managing short-term economic fluctuations. When asked to recommend a policy, consider the time horizon: demand-side policies for short-run stabilisation; supply-side policies for long-run growth.",
          },
        ],
        quiz: [
          {
            id: "ba1-l4-q1",
            question: "A government increases infrastructure spending and simultaneously cuts income tax. This is best described as:",
            options: [
              "Contractionary fiscal policy aimed at reducing aggregate demand",
              "Expansionary fiscal policy aimed at stimulating aggregate demand",
              "Restrictive monetary policy operated by the central bank",
              "A supply-side policy intervention targeting productive capacity",
            ],
            correct: 1,
            explanation: "Increasing government spending and cutting taxes both boost aggregate demand — this is expansionary fiscal policy. It is typically used during a recession to offset falling private sector spending. Contractionary fiscal policy would involve spending cuts and/or tax increases.",
          },
          {
            id: "ba1-l4-q2",
            question: "If the Bank of England raises the base interest rate, which outcome is most likely?",
            options: [
              "Consumers increase borrowing and spending as returns on savings fall",
              "The sterling exchange rate weakens, boosting UK export competitiveness",
              "Business investment rises because borrowing becomes cheaper",
              "Consumer spending falls as mortgage and loan repayments increase",
            ],
            correct: 3,
            explanation: "Higher interest rates increase borrowing costs (mortgages, personal loans, business credit), leaving households and firms with less disposable income and reducing investment. Additionally, higher UK rates typically attract foreign capital, strengthening sterling and making UK exports less competitive.",
          },
          {
            id: "ba1-l4-q3",
            question: "Which of the following is an example of a supply-side policy?",
            options: [
              "The government cuts income tax rates to stimulate household spending",
              "The central bank reduces interest rates to encourage business borrowing",
              "The government invests in apprenticeship programmes to improve workforce skills",
              "The government raises unemployment benefits to support households in recession",
            ],
            correct: 2,
            explanation: "Investing in workforce skills (apprenticeships, vocational training) improves labour productivity and shifts the long-run aggregate supply curve rightward — this is a supply-side policy. Options A and B are demand-side policies. Raising unemployment benefits may reduce incentives to seek work, which is contrary to supply-side aims.",
          },
          {
            id: "ba1-l4-q4",
            question: "An increase in Corporation Tax rates would most directly affect businesses by:",
            options: [
              "Increasing consumer demand through the multiplier effect on household incomes",
              "Reducing after-tax profits available for reinvestment, dividends or retained earnings",
              "Lowering the cost of external borrowing from commercial banks",
              "Strengthening the exchange rate and increasing the purchasing power of imports",
            ],
            correct: 1,
            explanation: "Corporation tax is levied directly on company profits. A rate increase reduces the after-tax profit available for reinvestment, shareholder dividends or building reserves. It may also discourage foreign direct investment as companies seek lower-tax jurisdictions.",
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BA2 — Fundamentals of Management Accounting
  // ══════════════════════════════════════════════════════════════════════════
  ba2: {
    lessons: [
      {
        id: "ba2-l1",
        title: "Cost Classification and Behaviour",
        summary: "Learn how costs are classified by behaviour (fixed, variable, semi-variable), by function (direct/indirect), and understand how cost behaviour is used in management decisions.",
        estimatedMinutes: 25,
        objectives: [
          "Classify costs as fixed, variable or semi-variable and sketch their behaviour graphs",
          "Distinguish between direct and indirect costs with business examples",
          "Explain the difference between product costs and period costs",
          "Apply the high-low method to separate fixed and variable elements of a semi-variable cost",
        ],
        content: [
          {
            type: "paragraph",
            text: "Management accounting provides information to managers for planning, control and decision-making. Unlike financial accounting, it is forward-looking and not bound by external reporting standards. Understanding cost behaviour is the foundation of effective management accounting.",
          },
          {
            type: "heading",
            text: "Cost Behaviour",
          },
          {
            type: "paragraph",
            text: "Cost behaviour describes how a cost responds as the volume of activity (output) changes. Misclassifying costs leads to inaccurate budgets, incorrect pricing and poor investment decisions.",
          },
          {
            type: "list",
            heading: "The three main cost behaviours:",
            items: [
              "Fixed costs: remain constant in total regardless of output level (e.g. factory rent, management salaries, insurance). Fixed cost per unit falls as output rises.",
              "Variable costs: change in direct proportion to output (e.g. raw materials, direct labour paid per unit, sales commission). Variable cost per unit remains constant.",
              "Semi-variable (mixed) costs: contain both a fixed element and a variable element (e.g. a utility bill with a standing charge plus a per-unit consumption charge).",
            ],
          },
          {
            type: "heading",
            text: "Direct and Indirect Costs",
          },
          {
            type: "paragraph",
            text: "Direct costs can be specifically and exclusively traced to a particular cost object (product, service or department). Indirect costs (overheads) cannot be directly traced and must be allocated or apportioned using an appropriate basis.",
          },
          {
            type: "list",
            heading: "Examples:",
            items: [
              "Direct materials: timber used in a specific furniture item",
              "Direct labour: wages of assembly workers paid per item produced",
              "Production overhead (indirect): factory supervisor salary shared across all products",
              "Non-production overhead: selling costs, administration expenses (period costs, not product costs)",
            ],
          },
          {
            type: "heading",
            text: "High-Low Method",
          },
          {
            type: "callout",
            tone: "info",
            text: "High-Low method: Variable cost per unit = (Cost at high activity − Cost at low activity) ÷ (High units − Low units). Fixed cost = Total cost at either level − (Variable cost per unit × units at that level). This separates fixed and variable elements of a semi-variable cost from two data points.",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: The high-low method uses only two data points and may give inaccurate results if either point is unrepresentative. Regression analysis is more accurate but the high-low method is commonly tested in BA2.",
          },
        ],
        quiz: [
          {
            id: "ba2-l1-q1",
            question: "Which statement correctly describes a fixed cost?",
            options: [
              "It remains constant per unit as output increases",
              "It changes in direct proportion to the level of output",
              "It remains constant in total but falls on a per-unit basis as output rises",
              "It has both a fixed element and a variable element",
            ],
            correct: 2,
            explanation: "A fixed cost remains constant in total within a relevant range of output — for example, factory rent of £10,000 per month does not change whether 1,000 or 5,000 units are produced. However, the fixed cost per unit falls as output increases (£10 per unit vs £2 per unit in this example).",
          },
          {
            id: "ba2-l1-q2",
            question: "Direct labour costs are best classified as:",
            options: [
              "An indirect cost, because labour is shared across many products",
              "A fixed cost, because employees receive a fixed monthly salary",
              "A direct cost, because they can be specifically traced to a cost object",
              "A period cost, because they are expensed in the period they are incurred",
            ],
            correct: 2,
            explanation: "Direct labour costs can be specifically and exclusively attributed to particular products or services — for example, wages paid to assembly workers based on the time spent on each unit. This makes them a direct cost. Whether they are fixed or variable depends on the employment contract.",
          },
          {
            id: "ba2-l1-q3",
            question: "A semi-variable cost has a fixed element of £2,000 per month and a variable element of £3 per unit. At an output of 800 units, the total cost is:",
            options: [
              "£2,400",
              "£4,400",
              "£3,800",
              "£2,000",
            ],
            correct: 1,
            explanation: "Total semi-variable cost = Fixed element + (Variable element × units) = £2,000 + (£3 × 800) = £2,000 + £2,400 = £4,400. The fixed element does not change with output; the variable element increases proportionately.",
          },
          {
            id: "ba2-l1-q4",
            question: "Using the high-low method, if costs were £18,000 at 4,000 units and £12,000 at 2,000 units, the variable cost per unit is:",
            options: [
              "£4.50 per unit",
              "£3.00 per unit",
              "£6.00 per unit",
              "£2.50 per unit",
            ],
            correct: 1,
            explanation: "Variable cost per unit = (£18,000 − £12,000) ÷ (4,000 − 2,000) = £6,000 ÷ 2,000 = £3.00 per unit. The fixed cost can then be found as: £18,000 − (£3 × 4,000) = £18,000 − £12,000 = £6,000.",
          },
        ],
      },

      {
        id: "ba2-l2",
        title: "Absorption Costing and Overhead Recovery",
        summary: "Understand how production overheads are absorbed into product costs using predetermined overhead absorption rates, and how over- or under-absorption arises.",
        estimatedMinutes: 30,
        objectives: [
          "Calculate a predetermined overhead absorption rate (OAR)",
          "Apply the OAR to calculate the full (absorption) cost of a product",
          "Explain and calculate over-absorption and under-absorption of overheads",
          "Compare the profit figures reported under absorption and marginal costing",
        ],
        content: [
          {
            type: "paragraph",
            text: "Absorption costing charges all production costs — both variable and fixed overheads — to each unit produced. It is the method required for external financial reporting under IFRS/UK GAAP, though marginal costing is often more useful for internal decision-making.",
          },
          {
            type: "heading",
            text: "The Overhead Absorption Rate (OAR)",
          },
          {
            type: "paragraph",
            text: "Because actual overhead costs and output volumes are only known at the end of the period, a predetermined rate is calculated at the start of the year using budgeted figures. This rate is then used to charge overhead to each unit throughout the year.",
          },
          {
            type: "callout",
            tone: "info",
            text: "OAR = Budgeted overhead ÷ Budgeted activity level. Common activity bases: direct labour hours (DLH), machine hours, or units of output. The choice of base should reflect the principal cost driver of the overhead being absorbed.",
          },
          {
            type: "heading",
            text: "Over- and Under-Absorption",
          },
          {
            type: "paragraph",
            text: "Because the OAR is based on budgeted figures, actual overhead absorbed (OAR × actual activity) will rarely equal actual overhead incurred. The difference is adjusted in the income statement at period end.",
          },
          {
            type: "list",
            heading: "Interpreting the absorption difference:",
            items: [
              "Over-absorbed overhead: absorbed overhead > actual overhead. Add back to profit (favourable — cost was overstated during the period).",
              "Under-absorbed overhead: absorbed overhead < actual overhead. Deduct from profit (adverse — cost was understated during the period).",
            ],
          },
          {
            type: "heading",
            text: "Absorption vs. Marginal Costing — Profit Reconciliation",
          },
          {
            type: "paragraph",
            text: "When inventory levels change, absorption costing and marginal costing produce different profit figures. Under absorption costing, fixed overheads are carried forward in closing inventory; under marginal costing, all fixed overheads are written off in the period incurred.",
          },
          {
            type: "callout",
            tone: "tip",
            text: "Reconciliation rule: if closing inventory > opening inventory (inventory rose), absorption profit > marginal profit (fixed overheads deferred in stock). If closing inventory < opening inventory (inventory fell), absorption profit < marginal profit (previously deferred overheads released). The difference = change in inventory × fixed OAR per unit.",
          },
        ],
        quiz: [
          {
            id: "ba2-l2-q1",
            question: "A factory budgets £240,000 of production overhead and 60,000 direct labour hours for the year. The overhead absorption rate (OAR) per direct labour hour is:",
            options: [
              "£2.50 per DLH",
              "£4.00 per DLH",
              "£3.00 per DLH",
              "£6.00 per DLH",
            ],
            correct: 1,
            explanation: "OAR = Budgeted overhead ÷ Budgeted activity = £240,000 ÷ 60,000 DLH = £4.00 per direct labour hour. This rate is then applied to each product based on the number of direct labour hours it requires.",
          },
          {
            id: "ba2-l2-q2",
            question: "Actual overheads were £185,000 and overheads absorbed were £200,000. The result is:",
            options: [
              "Under-absorption of £15,000 — deducted from profit",
              "Over-absorption of £15,000 — added to profit",
              "Under-absorption of £15,000 — added to profit",
              "Over-absorption of £15,000 — deducted from profit",
            ],
            correct: 1,
            explanation: "Absorbed overheads (£200,000) exceed actual overheads (£185,000), so overheads were over-absorbed by £15,000. During the year, too much overhead was charged to products. The adjustment adds £15,000 back to profit — it is favourable.",
          },
          {
            id: "ba2-l2-q3",
            question: "Under absorption costing, fixed production overheads are:",
            options: [
              "Written off entirely in the period they are incurred, regardless of inventory levels",
              "Treated as period costs and excluded from the cost of inventory",
              "Included in the cost of inventory and released to profit as goods are sold",
              "Capitalised as non-current assets and depreciated over the asset's useful life",
            ],
            correct: 2,
            explanation: "Under absorption costing, fixed production overheads form part of the unit cost of inventory. They are carried forward on the balance sheet as part of closing inventory and only recognised in the income statement (matched against revenue) when the goods are sold. This differs from marginal costing, where fixed overheads are expensed in full each period.",
          },
          {
            id: "ba2-l2-q4",
            question: "A company uses absorption costing. Production exceeded sales in the period (inventory levels rose). Compared to marginal costing, absorption costing will report:",
            options: [
              "The same profit, as the choice of costing method does not affect total profit",
              "Lower profit, because more overhead has been deferred in inventory",
              "Higher profit, because some fixed overhead is deferred in closing inventory",
              "Higher profit only if the fixed OAR per unit exceeds the variable cost per unit",
            ],
            correct: 2,
            explanation: "When inventory rises (production > sales), absorption costing carries some fixed overhead forward in closing inventory rather than expensing it immediately. This reduces the cost of sales for the period, resulting in a higher profit than marginal costing would report. The difference equals the increase in inventory × the fixed OAR per unit.",
          },
        ],
      },

      {
        id: "ba2-l3",
        title: "Marginal Costing and CVP Analysis",
        summary: "Apply contribution analysis and cost-volume-profit (CVP) techniques to calculate break-even points, margins of safety and target profit levels.",
        estimatedMinutes: 30,
        objectives: [
          "Define contribution and calculate it per unit and in total",
          "Calculate the break-even point in units and revenue",
          "Calculate the margin of safety as an absolute figure and a percentage",
          "Determine the output required to achieve a specified target profit",
        ],
        content: [
          {
            type: "paragraph",
            text: "Marginal costing separates costs into variable and fixed categories. Only variable costs are charged to products; fixed costs are treated as period costs. This separation enables powerful contribution analysis for short-run decisions.",
          },
          {
            type: "heading",
            text: "Contribution",
          },
          {
            type: "paragraph",
            text: "Contribution is the amount remaining after variable costs are deducted from sales revenue. It contributes first to covering fixed costs and then to generating profit. Understanding contribution is central to pricing, mix decisions and break-even analysis.",
          },
          {
            type: "callout",
            tone: "info",
            text: "Contribution per unit = Selling price per unit − Variable cost per unit. Total contribution = Contribution per unit × units sold. Profit = Total contribution − Total fixed costs.",
          },
          {
            type: "heading",
            text: "Break-Even Analysis",
          },
          {
            type: "paragraph",
            text: "The break-even point (BEP) is the level of output at which total revenue equals total costs — neither profit nor loss is made. It is a key planning tool that tells managers the minimum volume they must sell to avoid a loss.",
          },
          {
            type: "list",
            heading: "Key CVP formulae:",
            items: [
              "Break-even point (units) = Total fixed costs ÷ Contribution per unit",
              "Break-even point (revenue) = Total fixed costs ÷ Contribution-to-sales (C/S) ratio",
              "C/S ratio = Contribution per unit ÷ Selling price per unit (expressed as a decimal or %)",
              "Margin of safety (units) = Budgeted sales − Break-even sales",
              "Margin of safety (%) = (Budgeted sales − BEP) ÷ Budgeted sales × 100",
              "Target profit (units) = (Fixed costs + Target profit) ÷ Contribution per unit",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: The C/S ratio is the marginal costing equivalent of the gross margin but uses contribution rather than gross profit. A higher C/S ratio means the business retains more from each pound of revenue to cover fixed costs and generate profit.",
          },
        ],
        quiz: [
          {
            id: "ba2-l3-q1",
            question: "A product sells for £50 and has variable costs of £30 per unit. Fixed costs total £80,000. The contribution per unit is:",
            options: [
              "£30",
              "£50",
              "£20",
              "£80",
            ],
            correct: 2,
            explanation: "Contribution per unit = Selling price − Variable cost = £50 − £30 = £20. This £20 per unit first covers fixed costs and then generates profit. Total contribution from selling 4,000 units, for example, would be 4,000 × £20 = £80,000.",
          },
          {
            id: "ba2-l3-q2",
            question: "Using the same data (SP £50, VC £30, FC £80,000), the break-even point in units is:",
            options: [
              "4,000 units",
              "2,667 units",
              "1,600 units",
              "2,000 units",
            ],
            correct: 0,
            explanation: "Break-even point = Fixed costs ÷ Contribution per unit = £80,000 ÷ £20 = 4,000 units. At this output level, total contribution (4,000 × £20 = £80,000) exactly equals total fixed costs, and profit is zero.",
          },
          {
            id: "ba2-l3-q3",
            question: "Budgeted sales are 5,000 units and the break-even point is 4,000 units. The margin of safety as a percentage is:",
            options: [
              "20%",
              "25%",
              "80%",
              "10%",
            ],
            correct: 0,
            explanation: "Margin of safety = (Budgeted sales − BEP) ÷ Budgeted sales × 100 = (5,000 − 4,000) ÷ 5,000 × 100 = 1,000 ÷ 5,000 × 100 = 20%. This means sales can fall by 20% before the business makes a loss.",
          },
          {
            id: "ba2-l3-q4",
            question: "A company has fixed costs of £60,000 and a contribution per unit of £15. How many units must be sold to achieve a target profit of £30,000?",
            options: [
              "4,000 units",
              "6,000 units",
              "2,000 units",
              "3,000 units",
            ],
            correct: 1,
            explanation: "Target profit units = (Fixed costs + Target profit) ÷ Contribution per unit = (£60,000 + £30,000) ÷ £15 = £90,000 ÷ £15 = 6,000 units. The extra contribution from the 2,000 units above break-even (4,000 units) generates the £30,000 target profit.",
          },
        ],
      },

      {
        id: "ba2-l4",
        title: "Budgeting and Standard Costing",
        summary: "Understand the purpose of budgets, how flexed budgets remove volume effects, and how standard costing variances are calculated and interpreted.",
        estimatedMinutes: 35,
        objectives: [
          "Explain the purposes of budgeting and the stages in the budget-setting process",
          "Prepare a flexed budget and explain why it is used for performance comparison",
          "Calculate material price and usage variances and labour rate and efficiency variances",
          "Classify variances as adverse or favourable and suggest possible causes",
        ],
        content: [
          {
            type: "paragraph",
            text: "Budgeting and standard costing are two of the most important control tools in management accounting. Together they enable managers to set targets, measure actual performance against those targets, and identify variances requiring investigation.",
          },
          {
            type: "heading",
            text: "The Purpose of Budgets",
          },
          {
            type: "list",
            heading: "Budgets serve multiple management purposes (remembered by CORPSE):",
            items: [
              "Control — compare actual results against plan and investigate differences",
              "Organisation — coordinate activities across departments and functions",
              "Responsibility — assign accountability to individual managers",
              "Planning — force managers to think ahead about resource requirements",
              "Synchronisation — ensure all parts of the business work towards common goals",
              "Evaluation — provide a basis for assessing managerial performance",
            ],
          },
          {
            type: "heading",
            text: "Flexed Budgets",
          },
          {
            type: "paragraph",
            text: "A fixed budget is prepared at the start of the period for a single assumed output level. If actual output differs, comparing actual costs against a fixed budget is meaningless — variable costs will naturally differ. A flexed budget recalculates the budget for the actual output achieved, enabling like-for-like comparison.",
          },
          {
            type: "callout",
            tone: "info",
            text: "Flexed budget variable costs = Standard variable cost per unit × Actual units produced. Fixed costs remain unchanged in the flexed budget (within the relevant range).",
          },
          {
            type: "heading",
            text: "Standard Costing Variances",
          },
          {
            type: "paragraph",
            text: "A variance is the difference between a standard (budgeted) cost or revenue and the actual result. Adverse variances increase costs or reduce revenue relative to budget; favourable variances reduce costs or increase revenue.",
          },
          {
            type: "list",
            heading: "Key variance formulae:",
            items: [
              "Material price variance = (Standard price − Actual price) × Actual quantity purchased",
              "Material usage variance = (Standard quantity for actual output − Actual quantity used) × Standard price",
              "Labour rate variance = (Standard rate − Actual rate) × Actual hours worked",
              "Labour efficiency variance = (Standard hours for actual output − Actual hours worked) × Standard rate",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: Always state whether a variance is adverse (A) or favourable (F). An adverse material price variance means you paid more per unit of material than standard. An adverse usage variance means you used more material than standard. The causes can be linked — buying cheaper materials (F price) may cause higher wastage (A usage).",
          },
        ],
        quiz: [
          {
            id: "ba2-l4-q1",
            question: "A company budgeted to produce 1,000 units but actually produced 1,200 units. Variable costs were budgeted at £8 per unit and fixed costs at £5,000. The flexed budget total cost is:",
            options: [
              "£13,000",
              "£14,600",
              "£9,600",
              "£12,000",
            ],
            correct: 1,
            explanation: "Flexed budget cost = (Variable cost per unit × actual output) + Fixed costs = (£8 × 1,200) + £5,000 = £9,600 + £5,000 = £14,600. The variable element is flexed to the actual output level; fixed costs remain at the budgeted amount.",
          },
          {
            id: "ba2-l4-q2",
            question: "Which of the following correctly describes a favourable material usage variance?",
            options: [
              "The actual quantity of material used exceeded the standard quantity for the actual output",
              "The actual price paid per unit of material was less than the standard price",
              "Less material was used than the standard quantity specified for the actual output",
              "The actual output was greater than the budgeted output for the period",
            ],
            correct: 2,
            explanation: "A favourable material usage variance means less material was consumed than the standard quantity allowed for the actual output achieved — costs are lower than expected. This is calculated as (Standard quantity for actual output − Actual quantity used) × Standard price, and is favourable when actual usage is less than standard.",
          },
          {
            id: "ba2-l4-q3",
            question: "Standard material cost is £5 per kg and standard usage is 3 kg per unit. Actual production was 500 units using 1,600 kg of material. The material usage variance is:",
            options: [
              "£500 adverse",
              "£500 favourable",
              "£2,500 adverse",
              "£2,000 favourable",
            ],
            correct: 0,
            explanation: "Material usage variance = (Standard quantity for actual output − Actual quantity) × Standard price = ((500 × 3) − 1,600) × £5 = (1,500 − 1,600) × £5 = −100 × £5 = −£500. Because actual usage exceeds standard, the variance is £500 adverse.",
          },
          {
            id: "ba2-l4-q4",
            question: "A favourable material price variance combined with an adverse material usage variance most likely suggests:",
            options: [
              "The purchasing department overpaid for materials while production was efficient",
              "Cheaper materials were purchased but they were of lower quality, causing greater wastage",
              "Production was efficient but the purchasing department agreed a higher price than standard",
              "Both the price and the quantity of material used were less than standard",
            ],
            correct: 1,
            explanation: "A favourable price variance combined with an adverse usage variance is a common interrelationship: purchasing bought materials at below the standard price (favourable), but the cheaper materials were of inferior quality, leading to more waste or reworking than standard (adverse usage). This highlights why variances should not be viewed in isolation.",
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BA3 — Fundamentals of Financial Accounting
  // ══════════════════════════════════════════════════════════════════════════
  ba3: {
    lessons: [
      {
        id: "ba3-l1",
        title: "The Accounting Equation and Double Entry",
        summary: "Master the accounting equation (Assets = Liabilities + Equity), the rules of double entry bookkeeping, and the recording of basic business transactions in T-accounts.",
        estimatedMinutes: 30,
        objectives: [
          "State and apply the accounting equation to verify that transactions are correctly recorded",
          "Explain the debit and credit rules for assets, liabilities, equity, income and expenses",
          "Record common business transactions using T-account notation",
          "Distinguish between capital and revenue expenditure",
        ],
        content: [
          {
            type: "paragraph",
            text: "Financial accounting provides an objective record of a business's transactions for use by external stakeholders — investors, lenders, tax authorities and regulators. Double entry bookkeeping is the method used to record every transaction, ensuring the accounting equation always holds.",
          },
          {
            type: "heading",
            text: "The Accounting Equation",
          },
          {
            type: "paragraph",
            text: "Every transaction in a business can be expressed in terms of the accounting equation. This equation must always balance because every transaction has a dual effect — it affects at least two accounts simultaneously.",
          },
          {
            type: "callout",
            tone: "info",
            text: "The accounting equation: Assets = Liabilities + Equity (Owners' Capital). Equity = Capital introduced + Retained profits − Drawings. Every debit entry must have an equal and opposite credit entry.",
          },
          {
            type: "heading",
            text: "Debit and Credit Rules",
          },
          {
            type: "list",
            heading: "The DEAD CLIC mnemonic for debits and credits:",
            items: [
              "DEBIT increases: Drawings, Expenses, Assets, Dividends",
              "CREDIT increases: Capital, Liabilities, Income, Credit sales (revenue)",
              "Conversely: DEBIT decreases liabilities, equity and income; CREDIT decreases assets and expenses",
            ],
          },
          {
            type: "heading",
            text: "Recording Transactions",
          },
          {
            type: "paragraph",
            text: "Each transaction is recorded in at least two accounts. For example, when a business pays cash to buy equipment: Debit Equipment (asset increases) and Credit Bank/Cash (asset decreases). The equation remains balanced: one asset rises, another falls by the same amount.",
          },
          {
            type: "list",
            heading: "Common transaction examples:",
            items: [
              "Owner invests cash: Dr Bank, Cr Capital",
              "Purchase inventory on credit: Dr Purchases/Inventory, Cr Accounts Payable",
              "Pay supplier: Dr Accounts Payable, Cr Bank",
              "Sell goods for cash: Dr Bank, Cr Sales Revenue",
              "Pay wages: Dr Wages Expense, Cr Bank",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: Capital expenditure creates or enhances a non-current asset (e.g. buying machinery). Revenue expenditure maintains the current capability of the business (e.g. repairs). Misclassifying capital as revenue expenditure understates assets and overstates expenses in the current period.",
          },
        ],
        quiz: [
          {
            id: "ba3-l1-q1",
            question: "A business purchases a delivery van for £15,000, paying by bank transfer. How is this transaction recorded?",
            options: [
              "Debit Bank £15,000; Credit Motor Vehicles £15,000",
              "Debit Motor Vehicles £15,000; Credit Bank £15,000",
              "Debit Motor Vehicles £15,000; Credit Capital £15,000",
              "Debit Expenses £15,000; Credit Bank £15,000",
            ],
            correct: 1,
            explanation: "Purchasing a vehicle increases the motor vehicles asset account (debit) and decreases the bank account (credit). Both are asset accounts, so one rises and the other falls by the same amount — the accounting equation remains balanced.",
          },
          {
            id: "ba3-l1-q2",
            question: "The accounting equation at the start of a period shows: Assets £80,000; Liabilities £30,000. During the period, the owner introduces additional capital of £10,000 in cash. What is the new total assets figure?",
            options: [
              "£80,000",
              "£90,000",
              "£70,000",
              "£100,000",
            ],
            correct: 1,
            explanation: "Equity = Assets − Liabilities = £80,000 − £30,000 = £50,000. When the owner introduces £10,000 cash, assets increase by £10,000 (Dr Bank) and equity increases by £10,000 (Cr Capital). New assets = £80,000 + £10,000 = £90,000. The equation still balances: £90,000 = £30,000 + £60,000.",
          },
          {
            id: "ba3-l1-q3",
            question: "A business sells goods on credit for £5,000. The cost of those goods was £3,000. Which entries are required?",
            options: [
              "Debit Cash £5,000; Credit Sales £5,000; Debit Cost of Sales £3,000; Credit Inventory £3,000",
              "Debit Receivables £5,000; Credit Sales £5,000; Debit Cost of Sales £3,000; Credit Inventory £3,000",
              "Debit Receivables £5,000; Credit Sales £5,000 only (cost is recorded later on payment)",
              "Debit Sales £5,000; Credit Receivables £5,000; Credit Inventory £3,000; Debit Profit £3,000",
            ],
            correct: 1,
            explanation: "A credit sale creates a receivable (Dr Receivables) and recognises revenue (Cr Sales). Simultaneously, the cost of the goods sold must be recognised: Dr Cost of Sales (expense increases) and Cr Inventory (asset decreases). Both aspects of the transaction must be recorded under the accruals concept.",
          },
          {
            id: "ba3-l1-q4",
            question: "Replacing a broken machine part to restore it to working condition is best classified as:",
            options: [
              "Capital expenditure — it extends the useful life of the asset",
              "Capital expenditure — it improves the asset's future economic benefits",
              "Revenue expenditure — it maintains the asset at its existing level of performance",
              "Revenue expenditure — all expenditure on machines should be expensed immediately",
            ],
            correct: 2,
            explanation: "Replacing a broken part simply restores the machine to its original working condition — it does not improve or extend its capabilities. This is revenue expenditure and should be charged to the income statement in the period it is incurred. Capital expenditure would apply if the replacement enhanced the asset's performance or extended its life beyond the original expectation.",
          },
        ],
      },

      {
        id: "ba3-l2",
        title: "From Transactions to Trial Balance",
        summary: "Trace business transactions from initial recording through to extraction of a trial balance, and understand which types of errors the trial balance can and cannot detect.",
        estimatedMinutes: 25,
        objectives: [
          "Explain the purpose of the trial balance and how it is extracted",
          "Identify the six types of error that are not revealed by a trial balance",
          "Distinguish between a suspense account and a correcting journal entry",
          "Prepare correcting journal entries for common bookkeeping errors",
        ],
        content: [
          {
            type: "paragraph",
            text: "The trial balance is an interim stage in the preparation of financial statements. It lists the closing balances of all ledger accounts in debit and credit columns. If double entry has been applied correctly, the two columns should agree.",
          },
          {
            type: "heading",
            text: "Purpose of the Trial Balance",
          },
          {
            type: "paragraph",
            text: "The trial balance checks the arithmetic accuracy of the double entry records — it verifies that total debits equal total credits. However, a balanced trial balance does not guarantee that the records are entirely correct; several types of error leave it in balance.",
          },
          {
            type: "heading",
            text: "Errors Not Revealed by the Trial Balance",
          },
          {
            type: "list",
            heading: "Six error types that leave the trial balance balanced (remembered by COTPRC):",
            items: [
              "Error of Commission: transaction correctly recorded but in the wrong person's account (e.g. debit Jones instead of Johnson)",
              "Error of Omission: a transaction is completely omitted from the books",
              "Error of Transposition: digits are reversed within an account (e.g. £639 entered as £693)",
              "Error of Principle: item recorded in the wrong type of account (e.g. capital expenditure posted to an expense account)",
              "Reversal of Entries: correct accounts used but debit and credit are the wrong way round",
              "Compensating Errors: two separate errors that cancel each other out",
            ],
          },
          {
            type: "heading",
            text: "Suspense Accounts",
          },
          {
            type: "paragraph",
            text: "When the trial balance does not agree, a suspense account is opened for the difference to allow the business to continue preparing draft accounts while the error is located and corrected. Once found, journal entries are made to clear the suspense account.",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: Always state the narrative for a journal entry (e.g. 'To correct misposting of rent to rates account'). When correcting errors, first reverse the original incorrect entry and then post the correct entry — or go directly to the net correcting journal.",
          },
        ],
        quiz: [
          {
            id: "ba3-l2-q1",
            question: "The trial balance of Darbshire Ltd shows total debits of £142,800 and total credits of £139,500. The most appropriate immediate action is:",
            options: [
              "Assume the difference is immaterial and proceed directly to the financial statements",
              "Open a suspense account for the £3,300 difference and investigate the cause",
              "Adjust the capital account to make the totals agree",
              "Reduce the highest debit balance by £3,300 to correct the trial balance",
            ],
            correct: 1,
            explanation: "When the trial balance does not agree, a suspense account is opened for the difference (Dr Suspense £3,300 in this case to make debits equal credits) while the error is investigated. The accounts must not simply be forced to agree by arbitrary adjustments.",
          },
          {
            id: "ba3-l2-q2",
            question: "A sales invoice for £2,400 was correctly debited to the customer's account but credited to the purchases account instead of the sales account. This is an error of:",
            options: [
              "Omission",
              "Transposition",
              "Principle",
              "Commission",
            ],
            correct: 2,
            explanation: "An error of principle occurs when an amount is posted to an account of the wrong type — in this case, crediting purchases (an expense/cost account) instead of sales (a revenue account). The trial balance will still balance because a credit was still made; the error lies in using fundamentally the wrong type of account.",
          },
          {
            id: "ba3-l2-q3",
            question: "Which of the following errors WOULD cause the trial balance totals to disagree?",
            options: [
              "A purchase of £540 was posted as £450 to both the payable and the purchases account",
              "A payment of £200 to a supplier was debited to the bank account and credited to the supplier",
              "Rent expense of £1,200 was debited to the rates expense account instead",
              "A credit sale of £800 was omitted entirely from the books",
            ],
            correct: 1,
            explanation: "Debiting the bank account (rather than crediting it) for a payment and crediting the supplier produces two credits and zero debits for the transaction, causing total debits to be £400 less than total credits. All other options leave the trial balance balanced: A is a transposition affecting both sides equally, C is an error of commission affecting debit accounts only, and D is an error of omission.",
          },
          {
            id: "ba3-l2-q4",
            question: "Stationery purchased for £350 cash was debited to the motor vehicles account. The correcting journal entry is:",
            options: [
              "Dr Stationery £350; Cr Motor Vehicles £350",
              "Dr Motor Vehicles £350; Cr Stationery £350",
              "Dr Bank £350; Cr Motor Vehicles £350",
              "Dr Stationery £700; Cr Motor Vehicles £700",
            ],
            correct: 0,
            explanation: "The error was debiting Motor Vehicles instead of Stationery. To correct it, reverse the incorrect debit to Motor Vehicles (Cr Motor Vehicles £350) and post the correct debit to Stationery (Dr Stationery £350). The Bank/Cash credit was correctly posted, so it does not need adjusting.",
          },
        ],
      },

      {
        id: "ba3-l3",
        title: "Preparing the Income Statement",
        summary: "Construct a basic income statement from a trial balance, applying adjustments for accruals, prepayments and closing inventory to determine the correct profit for the period.",
        estimatedMinutes: 30,
        objectives: [
          "Prepare a trading account to calculate gross profit",
          "Apply the accruals concept to adjust expense and income accounts",
          "Distinguish between an accrual and a prepayment and record the journal entries",
          "Calculate profit for the period after all adjustments",
        ],
        content: [
          {
            type: "paragraph",
            text: "The income statement (also called the profit and loss account) reports a business's financial performance over a period. It matches revenue earned against expenses incurred in generating that revenue, following the accruals (matching) concept.",
          },
          {
            type: "heading",
            text: "Structure of the Income Statement",
          },
          {
            type: "list",
            heading: "Basic income statement structure:",
            items: [
              "Revenue (Sales): total invoiced sales for the period",
              "Less: Cost of sales = Opening inventory + Purchases − Closing inventory",
              "= Gross profit",
              "Less: Operating expenses (rent, wages, depreciation, marketing, administration)",
              "= Operating profit (profit before interest and tax)",
              "Less: Interest expense",
              "= Profit before tax",
              "Less: Income tax expense",
              "= Profit for the period",
            ],
          },
          {
            type: "heading",
            text: "Accruals and Prepayments",
          },
          {
            type: "paragraph",
            text: "The accruals concept requires that revenue and expenses are recognised in the period to which they relate, not when cash is received or paid. This gives rise to two types of adjustment at period end.",
          },
          {
            type: "list",
            heading: "Year-end adjustments:",
            items: [
              "Accrual (expense accrued): an expense incurred in the period but not yet paid. Dr Expense account, Cr Accruals (current liability). Increases the expense and creates a liability.",
              "Prepayment (expense prepaid): cash paid in advance for a benefit not yet received. Dr Prepayments (current asset), Cr Expense account. Reduces the expense and creates an asset.",
              "Accrued income: income earned but not yet invoiced or received. Dr Accrued income (asset), Cr Income account.",
              "Deferred income: cash received in advance for services not yet provided. Dr Income account, Cr Deferred income (liability).",
            ],
          },
          {
            type: "callout",
            tone: "info",
            text: "Expense in income statement = Cash paid + Accrual at end − Prepayment at end + Prepayment at start − Accrual at start (if carrying forward from prior year). Alternatively: Expense recognised = Expense that relates to this period.",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: A common exam question provides the cash paid for a cost plus details of the opening and closing accruals/prepayments. Work through each systematically: start with the cash paid, add any expense not yet paid (accrual), and deduct any payment that relates to a future period (prepayment).",
          },
        ],
        quiz: [
          {
            id: "ba3-l3-q1",
            question: "Opening inventory was £8,000, purchases during the year were £45,000 and closing inventory was £11,000. Cost of sales is:",
            options: [
              "£53,000",
              "£42,000",
              "£48,000",
              "£34,000",
            ],
            correct: 1,
            explanation: "Cost of sales = Opening inventory + Purchases − Closing inventory = £8,000 + £45,000 − £11,000 = £42,000. Closing inventory is deducted because goods still in stock at the period end have not yet been sold — their cost should not be matched against this period's revenue.",
          },
          {
            id: "ba3-l3-q2",
            question: "A business pays its annual insurance premium of £2,400 on 1 October. Its accounting year ends on 31 December. What is the insurance expense for the year and the balance sheet adjustment?",
            options: [
              "Expense £2,400; no adjustment needed",
              "Expense £600; prepayment of £1,800 shown as a current asset",
              "Expense £1,800; accrual of £600 shown as a current liability",
              "Expense £600; accrual of £1,800 shown as a current liability",
            ],
            correct: 1,
            explanation: "Only 3 months of the 12-month premium relates to the current accounting year (October to December): £2,400 × 3/12 = £600 expense. The remaining 9 months (£1,800) is a prepayment — a current asset — representing insurance coverage already paid for but relating to the next accounting year.",
          },
          {
            id: "ba3-l3-q3",
            question: "At the year end, the electricity account shows cash paid of £4,800 but there is an accrual of £600 for November and December bills not yet received. The correct expense in the income statement is:",
            options: [
              "£4,200",
              "£4,800",
              "£5,400",
              "£600",
            ],
            correct: 2,
            explanation: "Income statement expense = Cash paid + Accrual = £4,800 + £600 = £5,400. The accrual recognises the electricity consumed in November and December that has not yet been billed — it is incurred in the current period and must be matched against current period revenue under the accruals concept.",
          },
          {
            id: "ba3-l3-q4",
            question: "The accounting concept that requires expenses to be matched to the revenue they help generate, regardless of when cash is paid, is the:",
            options: [
              "Prudence concept",
              "Going concern concept",
              "Accruals (matching) concept",
              "Consistency concept",
            ],
            correct: 2,
            explanation: "The accruals (or matching) concept requires that revenues are recognised when earned and expenses are recognised when incurred — not when cash is exchanged. This produces a more meaningful measure of performance in the income statement than a simple cash receipts and payments account.",
          },
        ],
      },

      {
        id: "ba3-l4",
        title: "The Statement of Financial Position and Depreciation",
        summary: "Prepare a basic statement of financial position, calculate depreciation using straight-line and reducing balance methods, and record the depreciation journal entry.",
        estimatedMinutes: 30,
        objectives: [
          "Identify current and non-current assets, and current and non-current liabilities",
          "Calculate depreciation using the straight-line and reducing balance methods",
          "Record the depreciation journal entry and calculate carrying amount",
          "Explain the accounting treatment when a non-current asset is disposed of",
        ],
        content: [
          {
            type: "paragraph",
            text: "The statement of financial position (balance sheet) provides a snapshot of a business's assets, liabilities and equity at a specific point in time. It reflects the accounting equation: Assets = Liabilities + Equity.",
          },
          {
            type: "heading",
            text: "Structure of the Statement of Financial Position",
          },
          {
            type: "list",
            heading: "Key categories:",
            items: [
              "Non-current assets: assets held for more than one year (property, plant, equipment, intangibles, investments)",
              "Current assets: assets expected to be converted to cash within one year (inventory, receivables, prepayments, cash)",
              "Current liabilities: obligations due within one year (payables, accruals, short-term loans, bank overdraft)",
              "Non-current liabilities: obligations due after more than one year (long-term bank loans, debentures, lease liabilities)",
              "Equity: capital introduced by the owner + retained profits (opening + profit for year − drawings)",
            ],
          },
          {
            type: "heading",
            text: "Depreciation",
          },
          {
            type: "paragraph",
            text: "Depreciation is the systematic allocation of the cost (or revalued amount) of a non-current asset over its useful economic life. It matches the cost of using the asset against the revenue it helps generate, in accordance with the accruals concept.",
          },
          {
            type: "list",
            heading: "Two main depreciation methods:",
            items: [
              "Straight-line method: Annual charge = (Cost − Residual value) ÷ Useful life in years. Produces an equal charge each year; useful when the asset provides even benefit over its life.",
              "Reducing balance method: Annual charge = Net book value (carrying amount) at start of year × Depreciation rate %. Produces higher charges in early years; reflects assets that generate more benefit when new.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            text: "Depreciation journal entry each year: Dr Depreciation expense (income statement) Cr Accumulated depreciation (contra asset on balance sheet). Carrying amount = Cost − Accumulated depreciation.",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: When an asset is disposed of, remove both the original cost (Cr Asset account) and the accumulated depreciation (Dr Accumulated depreciation). Any difference between carrying amount and proceeds is a profit or loss on disposal, recognised in the income statement.",
          },
        ],
        quiz: [
          {
            id: "ba3-l4-q1",
            question: "A machine costs £50,000, has a residual value of £5,000 and a useful life of 9 years. Annual depreciation using the straight-line method is:",
            options: [
              "£5,556",
              "£5,000",
              "£6,111",
              "£4,500",
            ],
            correct: 1,
            explanation: "Straight-line depreciation = (Cost − Residual value) ÷ Useful life = (£50,000 − £5,000) ÷ 9 = £45,000 ÷ 9 = £5,000 per year. The residual value represents the estimated proceeds at the end of the asset's life — this portion is not depreciated.",
          },
          {
            id: "ba3-l4-q2",
            question: "An asset has a cost of £20,000 and a depreciation rate of 25% reducing balance. After two years, the carrying amount is:",
            options: [
              "£10,000",
              "£11,250",
              "£12,500",
              "£15,000",
            ],
            correct: 1,
            explanation: "Year 1: Depreciation = £20,000 × 25% = £5,000; Carrying amount = £15,000. Year 2: Depreciation = £15,000 × 25% = £3,750; Carrying amount = £15,000 − £3,750 = £11,250. The reducing balance method applies the rate to the diminishing carrying amount each year.",
          },
          {
            id: "ba3-l4-q3",
            question: "On the statement of financial position, the 'net book value' (carrying amount) of a non-current asset equals:",
            options: [
              "The original cost of the asset at the date of purchase",
              "The current market value of the asset at the reporting date",
              "Cost less accumulated depreciation to date",
              "Cost less depreciation charged in the current year only",
            ],
            correct: 2,
            explanation: "Carrying amount (net book value) = Original cost − Accumulated depreciation to date. Accumulated depreciation is the total of all depreciation charges recognised since the asset was acquired. It is held in a contra asset account on the balance sheet and netted off against the asset's cost.",
          },
          {
            id: "ba3-l4-q4",
            question: "An asset with a cost of £30,000 and accumulated depreciation of £22,000 is sold for £9,500. The profit or loss on disposal is:",
            options: [
              "£1,500 profit on disposal",
              "£20,500 loss on disposal",
              "£9,500 profit on disposal",
              "£500 loss on disposal",
            ],
            correct: 0,
            explanation: "Carrying amount at disposal = Cost − Accumulated depreciation = £30,000 − £22,000 = £8,000. Proceeds = £9,500. Profit on disposal = Proceeds − Carrying amount = £9,500 − £8,000 = £1,500 profit. The asset was sold for more than its book value.",
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BA4 — Fundamentals of Ethics, Corporate Governance and Business Law
  // ══════════════════════════════════════════════════════════════════════════
  ba4: {
    lessons: [
      {
        id: "ba4-l1",
        title: "The CIMA Code of Ethics",
        summary: "Understand the five fundamental principles of the CIMA Code of Ethics, identify the five categories of threat to compliance, and apply safeguards to reduce threats to an acceptable level.",
        estimatedMinutes: 25,
        objectives: [
          "State and explain the five fundamental ethical principles in the CIMA Code",
          "Identify and give examples of the five categories of threat to compliance",
          "Distinguish between firm-level and personal safeguards",
          "Apply an ethical decision-making framework to a practical scenario",
        ],
        content: [
          {
            type: "paragraph",
            text: "Ethics in accounting is about behaving professionally and honestly, not merely complying with technical rules. The CIMA Code of Ethics is based on the IESBA (International Ethics Standards Board for Accountants) International Code and applies to all CIMA members and students globally.",
          },
          {
            type: "heading",
            text: "Five Fundamental Principles",
          },
          {
            type: "list",
            heading: "Every CIMA member must comply with these five principles:",
            items: [
              "Integrity: be straightforward and honest in all professional and business relationships. Do not associate with misleading information.",
              "Objectivity: do not allow bias, conflicts of interest or undue influence of others to override professional judgements.",
              "Professional competence and due care: maintain professional knowledge and skill at the level required; act diligently in accordance with applicable standards.",
              "Confidentiality: do not disclose information acquired through professional relationships without proper authority unless there is a legal or professional duty to do so.",
              "Professional behaviour: comply with relevant laws and regulations; avoid actions that discredit the profession.",
            ],
          },
          {
            type: "heading",
            text: "Threats to Compliance",
          },
          {
            type: "paragraph",
            text: "A threat exists whenever circumstances create a risk that a member will not comply with the fundamental principles. Members must evaluate threats and apply safeguards to reduce them to an acceptable level.",
          },
          {
            type: "list",
            heading: "Five categories of threat (FACTS + Intimidation):",
            items: [
              "Self-interest threat: a financial or other interest will inappropriately influence a member's judgement (e.g. holding shares in an audit client)",
              "Self-review threat: a member reviews their own prior work and is unlikely to identify errors or limitations (e.g. auditing financial statements you prepared)",
              "Advocacy threat: a member promotes a client's or employer's position so strongly that objectivity is compromised (e.g. negotiating aggressively on behalf of a client)",
              "Familiarity threat: a close relationship with a client or colleague leads to undue sympathy (e.g. long-standing friendship with a manager)",
              "Intimidation threat: a member is deterred from acting objectively by actual or perceived pressure (e.g. threats of litigation or dismissal)",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: When faced with an ethics scenario, use a three-step approach: (1) Identify the fundamental principle(s) at risk, (2) Identify the type(s) of threat, (3) Propose appropriate safeguards. Always consider whether the situation should be escalated to a senior colleague, compliance function or professional body.",
          },
        ],
        quiz: [
          {
            id: "ba4-l1-q1",
            question: "A management accountant is asked by her director to omit a significant liability from the company's financial statements. Refusing to comply best demonstrates which fundamental principle?",
            options: [
              "Professional competence and due care",
              "Confidentiality",
              "Integrity",
              "Professional behaviour",
            ],
            correct: 2,
            explanation: "Integrity requires being straightforward and honest and not being associated with misleading financial statements. Refusing to omit a material liability is an act of integrity — the accountant refuses to produce information that is false or designed to mislead, even under pressure from a senior colleague.",
          },
          {
            id: "ba4-l1-q2",
            question: "An auditor has been assigned to audit the financial statements of a company whose accounts she prepared last year. This creates which type of threat?",
            options: [
              "Self-interest threat",
              "Self-review threat",
              "Advocacy threat",
              "Familiarity threat",
            ],
            correct: 1,
            explanation: "A self-review threat arises when an individual is required to review their own previous work. An auditor reviewing financial statements she prepared herself is unlikely to identify and report her own errors with the necessary professional scepticism. The appropriate safeguard is to assign a different person to perform the audit.",
          },
          {
            id: "ba4-l1-q3",
            question: "Which of the following scenarios best illustrates an intimidation threat?",
            options: [
              "An accountant holds shares in a company she is advising on a merger",
              "A partner has worked with the same major client for fifteen consecutive years",
              "A senior manager threatens to dismiss an accountant if she raises a financial reporting concern",
              "A finance director prepares the financial statements and then reviews them for accuracy",
            ],
            correct: 2,
            explanation: "An intimidation threat occurs when a member is deterred from acting objectively through actual or implied threats — in this case, threatened dismissal for raising a legitimate concern. This directly pressures the accountant to compromise her objectivity and professional behaviour.",
          },
          {
            id: "ba4-l1-q4",
            question: "The principle of confidentiality means a CIMA member should:",
            options: [
              "Never disclose any client information under any circumstances",
              "Disclose client information whenever asked by any third party",
              "Not disclose confidential information without proper authority, unless required by law",
              "Only keep information confidential while they are employed by that organisation",
            ],
            correct: 2,
            explanation: "Confidentiality does not mean absolute secrecy in all circumstances. A CIMA member must not disclose confidential information to third parties without proper authority — but there are exceptions: when disclosure is required by law (e.g. anti-money laundering regulations), permitted by the client, or necessary to comply with a professional or ethical obligation.",
          },
        ],
      },

      {
        id: "ba4-l2",
        title: "Corporate Governance",
        summary: "Examine the agency problem, the role and composition of the board of directors, and the key principles of the UK Corporate Governance Code.",
        estimatedMinutes: 30,
        objectives: [
          "Explain the agency problem and the mechanisms used to align interests of shareholders and managers",
          "Describe the composition and roles of the board of directors and its subcommittees",
          "Outline the key principles of the UK Corporate Governance Code",
          "Explain the role of the audit committee and external auditors",
        ],
        content: [
          {
            type: "paragraph",
            text: "Corporate governance refers to the system by which companies are directed and controlled. It addresses the relationship between a company's management, its board, its shareholders and other stakeholders, establishing rights and responsibilities.",
          },
          {
            type: "heading",
            text: "The Agency Problem",
          },
          {
            type: "paragraph",
            text: "In large companies, ownership (shareholders) and control (managers) are separated. This creates an agency relationship where managers (agents) are expected to act in the best interests of shareholders (principals). However, managers may pursue their own interests — higher salaries, reduced risk, personal perks — at shareholders' expense. This conflict is the agency problem.",
          },
          {
            type: "list",
            heading: "Mechanisms to reduce the agency problem:",
            items: [
              "Performance-related pay: aligning managerial remuneration with shareholder returns (e.g. share option schemes)",
              "Independent non-executive directors: monitoring management on behalf of shareholders",
              "External audit: independent verification of financial statements",
              "Shareholder voting rights: ability to remove directors who do not act in shareholders' interests",
            ],
          },
          {
            type: "heading",
            text: "Board Composition and the UK Corporate Governance Code",
          },
          {
            type: "paragraph",
            text: "The UK Corporate Governance Code (the 'Code') applies to premium-listed companies on the London Stock Exchange on a 'comply or explain' basis. Companies must either comply with its provisions or explain why they have not done so.",
          },
          {
            type: "list",
            heading: "Key Code provisions on board composition:",
            items: [
              "The Chair and CEO roles should be separated — the same person should not hold both positions",
              "At least half of the board (excluding the Chair) should be independent non-executive directors (NEDs) in large companies",
              "The board should appoint a senior independent director (SID) as an alternative contact for shareholders",
              "NEDs should be appointed for a specified term and their independence reviewed after nine years of service",
            ],
          },
          {
            type: "callout",
            tone: "info",
            text: "Three key board committees: Audit Committee (at least three independent NEDs; oversees financial reporting, internal controls and external audit); Remuneration Committee (NEDs only; sets executive pay policy); Nominations Committee (leads board appointments and succession planning).",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: The audit committee's independence from management is its most critical characteristic. It provides a direct line of communication between the external auditors and the board, without interference from executive directors whose work is being audited.",
          },
        ],
        quiz: [
          {
            id: "ba4-l2-q1",
            question: "The agency problem in corporate governance arises because:",
            options: [
              "External auditors charge high fees, reducing the profits available to shareholders",
              "Shareholders have access to more information about the company than managers do",
              "Managers may pursue their own interests at the expense of shareholders",
              "Non-executive directors lack the industry expertise to challenge executive decisions",
            ],
            correct: 2,
            explanation: "The agency problem arises from the separation of ownership (shareholders) and control (managers/directors). Managers act as agents for shareholders but may prioritise personal benefits — such as higher pay, job security or reduced effort — over shareholder value maximisation. Corporate governance mechanisms aim to align these interests.",
          },
          {
            id: "ba4-l2-q2",
            question: "Under the UK Corporate Governance Code, which statement about the separation of the Chair and CEO roles is correct?",
            options: [
              "The Chair and CEO should ideally be the same person to provide unified leadership",
              "The Chair and CEO roles should normally be held by different individuals",
              "The separation is only required for companies with a turnover exceeding £1 billion",
              "The separation is recommended but cannot be enforced as a legal requirement",
            ],
            correct: 1,
            explanation: "The UK Corporate Governance Code states that no individual should hold the roles of Chair and CEO simultaneously. The Chair leads the board and is responsible for its effectiveness; the CEO leads the executive management team. Combining both roles concentrates too much power in one person and undermines board independence.",
          },
          {
            id: "ba4-l2-q3",
            question: "The primary role of the audit committee is to:",
            options: [
              "Prepare the company's annual financial statements on behalf of the board",
              "Set the remuneration packages for executive directors",
              "Oversee the integrity of financial reporting, internal controls and the external audit process",
              "Recruit and appoint new non-executive directors to the board",
            ],
            correct: 2,
            explanation: "The audit committee's primary responsibilities are to monitor the integrity of the company's financial statements, oversee the effectiveness of internal controls and risk management, and manage the relationship with the external auditors (including recommending their appointment). It acts as a safeguard against financial misreporting.",
          },
          {
            id: "ba4-l2-q4",
            question: "A company's CEO also serves as the board Chair and has done so for 12 years. This raises concerns about:",
            options: [
              "Professional competence — the individual may lack the skills for both roles simultaneously",
              "Concentration of power and lack of board independence — contrary to governance best practice",
              "Conflict of interest between the company's goals and shareholders' long-term interests",
              "Breach of company law — holding both roles is illegal under the Companies Act 2006",
            ],
            correct: 1,
            explanation: "Combining Chair and CEO roles concentrates excessive power in one individual and removes the critical independent oversight function of the Chair. The UK Corporate Governance Code specifically recommends separation of the roles. Long tenure (12 years) also raises concerns about independence, as the individual may become too aligned with management rather than challenging it.",
          },
        ],
      },

      {
        id: "ba4-l3",
        title: "The Law of Contract",
        summary: "Identify the essential elements of a legally binding contract, distinguish valid from void and voidable contracts, and understand the consequences of breach and available remedies.",
        estimatedMinutes: 25,
        objectives: [
          "List and explain the four essential elements for a valid contract",
          "Distinguish between offer and invitation to treat",
          "Identify circumstances that make a contract void or voidable",
          "Explain the remedies available for breach of contract",
        ],
        content: [
          {
            type: "paragraph",
            text: "Contract law governs legally enforceable agreements. In business, contracts are formed constantly — with customers, suppliers, employees and service providers. Understanding when a contract is binding, and what happens when it is broken, is essential for managing legal risk.",
          },
          {
            type: "heading",
            text: "Essential Elements of a Valid Contract",
          },
          {
            type: "list",
            heading: "All four elements must be present for a contract to be legally binding:",
            items: [
              "Offer: a clear and definite proposal to enter into a contract on specific terms, capable of immediate acceptance",
              "Acceptance: unequivocal agreement to all the terms of the offer — a counter-offer destroys the original offer",
              "Consideration: something of value exchanged by each party (does not need to be adequate, but must be sufficient — it cannot be past consideration)",
              "Intention to create legal relations: both parties must intend the agreement to be legally binding (presumed in commercial agreements; not presumed in domestic/social arrangements)",
            ],
          },
          {
            type: "heading",
            text: "Offer vs. Invitation to Treat",
          },
          {
            type: "paragraph",
            text: "An invitation to treat is not an offer — it is an invitation for the other party to make an offer. Confusing the two is a common mistake. In a shop, the goods on display are an invitation to treat; the customer makes the offer at the till; the retailer accepts or declines.",
          },
          {
            type: "callout",
            tone: "info",
            text: "Key distinction: A shop displaying goods (even with a price tag) is an invitation to treat, not an offer — Fisher v Bell [1961]. An advertisement in a newspaper is usually an invitation to treat (Partridge v Crittenden [1968]). An offer to the whole world can exist — Carlill v Carbolic Smoke Ball Co [1893].",
          },
          {
            type: "heading",
            text: "Breach of Contract and Remedies",
          },
          {
            type: "paragraph",
            text: "A breach occurs when a party fails to fulfil their contractual obligations. The innocent party has a range of remedies available, the most important being damages — a monetary payment designed to put the claimant in the position they would have been in had the contract been performed.",
          },
          {
            type: "list",
            heading: "Remedies for breach of contract:",
            items: [
              "Damages: the primary remedy; compensatory — not punitive. Duty to mitigate loss.",
              "Specific performance: a court order compelling the breaching party to perform their obligations (only granted for unique goods or land)",
              "Injunction: a court order preventing a party from doing something (e.g. working for a competitor in breach of a restrictive covenant)",
              "Rescission: setting aside the contract and restoring parties to their original position (available for misrepresentation)",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: A counter-offer terminates the original offer — Hyde v Wrench [1840]. A mere request for information (e.g. 'Is there any chance of a discount?') is not a counter-offer and does not destroy the original offer. This distinction is frequently tested.",
          },
        ],
        quiz: [
          {
            id: "ba4-l3-q1",
            question: "Which of the following is the correct legal analysis of goods displayed in a shop window with price tags attached?",
            options: [
              "An offer by the retailer which any customer can accept by picking up the goods",
              "An invitation to treat — the customer makes the offer at the point of sale",
              "A binding unilateral contract automatically formed when the customer enters the shop",
              "An advertisement which creates a legal obligation on the retailer to sell at that price",
            ],
            correct: 1,
            explanation: "In Fisher v Bell [1961] and Pharmaceutical Society v Boots [1953], courts confirmed that goods displayed in a shop (including in a window) constitute an invitation to treat. The customer makes an offer to purchase at the till, which the retailer may accept or decline. The retailer is not legally bound to sell at the displayed price.",
          },
          {
            id: "ba4-l3-q2",
            question: "Anna offers to sell her car to Ben for £8,000. Ben replies, 'I'll give you £7,500.' Anna refuses. What is the legal position?",
            options: [
              "Anna's original offer of £8,000 still stands and Ben can now accept it",
              "Ben's counter-offer destroyed Anna's original offer; neither is now binding",
              "Anna is legally bound to sell at £7,500 as she refused without justification",
              "Both offers remain open and Ben may choose either at any time",
            ],
            correct: 1,
            explanation: "Ben's statement of £7,500 is a counter-offer, not an acceptance. Under Hyde v Wrench [1840], a counter-offer destroys the original offer — Anna's £8,000 offer is no longer available for Ben to accept. There is no binding contract, and neither party is obliged to proceed.",
          },
          {
            id: "ba4-l3-q3",
            question: "Consideration in contract law must be:",
            options: [
              "Adequate — of equal financial value to the other party's consideration",
              "Past — provided before the contract is formed",
              "Sufficient — of some value in the eyes of the law, even if not commercially equal",
              "Written — documented to be legally enforceable in all contract types",
            ],
            correct: 2,
            explanation: "Consideration must be sufficient (have some value in law) but need not be adequate (commercially equal in value). Courts do not enquire into the adequacy of consideration — it is for the parties to decide the value of the bargain. Past consideration (something done before the agreement) is not valid consideration.",
          },
          {
            id: "ba4-l3-q4",
            question: "The primary remedy for breach of contract in English law is:",
            options: [
              "Specific performance — compelling the breaching party to fulfil their obligations",
              "Rescission — returning all parties to their pre-contractual position",
              "Damages — a monetary sum designed to compensate the innocent party for their loss",
              "An injunction — prohibiting the breaching party from further unlawful conduct",
            ],
            correct: 2,
            explanation: "Damages are the primary remedy for breach of contract. They are compensatory in nature — intended to put the claimant in the position they would have been in had the contract been properly performed. Specific performance is an equitable remedy available only in limited circumstances (unique goods or land); rescission is primarily a remedy for misrepresentation.",
          },
        ],
      },

      {
        id: "ba4-l4",
        title: "Employment Law and Company Formation",
        summary: "Understand the contract of employment, the law on dismissal, the types of business entity available in the UK, and the basic legal framework of a company.",
        estimatedMinutes: 30,
        objectives: [
          "Distinguish between an employee and an independent contractor and explain the legal significance",
          "Explain the difference between wrongful dismissal, unfair dismissal and redundancy",
          "Identify the main types of business entity and compare sole trader, partnership and limited company",
          "Describe the role of the memorandum and articles of association",
        ],
        content: [
          {
            type: "paragraph",
            text: "Employment law and company law together form a large part of the BA4 syllabus. Understanding the legal status of workers and the structure of different business entities is essential for managing legal risk in a finance role.",
          },
          {
            type: "heading",
            text: "Employee vs. Independent Contractor",
          },
          {
            type: "paragraph",
            text: "The distinction between an employee and an independent contractor is legally significant — employees have greater statutory rights (redundancy pay, unfair dismissal protection, sick pay) and their employer has greater obligations (PAYE, National Insurance, health and safety duties).",
          },
          {
            type: "list",
            heading: "Tests used by courts to determine employment status:",
            items: [
              "Control test: does the employer control what, how, when and where the work is done?",
              "Integration test: is the worker integrated into the organisation's structure?",
              "Economic reality test: is the worker in business on their own account, bearing financial risk?",
              "Mutuality of obligation: is there an obligation to offer and accept work?",
            ],
          },
          {
            type: "heading",
            text: "Dismissal",
          },
          {
            type: "list",
            heading: "Three types of dismissal:",
            items: [
              "Wrongful dismissal: breach of the employment contract, typically by failure to give contractual or statutory notice. Remedy: damages for the notice period.",
              "Unfair dismissal: dismissal without a fair reason or without following a fair procedure. Remedy: reinstatement, re-engagement or compensation. Requires (generally) 2 years' continuous employment.",
              "Redundancy: the employee's job ceases to exist (not a personal failing). Employee entitled to statutory redundancy pay after 2 years' continuous service. Selection must be fair and non-discriminatory.",
            ],
          },
          {
            type: "heading",
            text: "Business Entities",
          },
          {
            type: "list",
            heading: "Main UK business structures compared:",
            items: [
              "Sole trader: simplest form; owner has unlimited personal liability; business is not a separate legal entity",
              "Partnership: two or more people carrying on business together; partners generally have unlimited joint and several liability (except in a Limited Liability Partnership — LLP)",
              "Private limited company (Ltd): separate legal personality; shareholders' liability limited to the amount unpaid on their shares; cannot offer shares to the public",
              "Public limited company (plc): separate legal entity; can offer shares on the public markets; minimum share capital of £50,000",
            ],
          },
          {
            type: "callout",
            tone: "info",
            text: "A company's constitution comprises its memorandum of association (states the intent to form a company) and its articles of association (the internal rules governing how the company is managed — director powers, shareholder rights, share transfer rules, etc.).",
          },
          {
            type: "callout",
            tone: "tip",
            text: "CIMA exam tip: The concept of separate legal personality (Salomon v Salomon & Co [1897]) is the cornerstone of company law. A company is a legal person distinct from its members — it can own property, enter contracts, sue and be sued in its own name. Members are only liable for the company's debts to the extent of any unpaid capital.",
          },
        ],
        quiz: [
          {
            id: "ba4-l4-q1",
            question: "Which of the following is the most significant legal consequence of a company having separate legal personality?",
            options: [
              "The company's directors are personally liable for all debts incurred during their tenure",
              "Shareholders can only lose the amount they have invested in shares if the company fails",
              "The company cannot enter into contracts in its own name — directors must sign personally",
              "The company must be registered at Companies House before it can trade",
            ],
            correct: 1,
            explanation: "The doctrine of separate legal personality (established in Salomon v Salomon [1897]) means the company is a distinct legal entity from its members. Shareholders' liability is limited to the amount they have paid (or agreed to pay) for their shares — they cannot be required to contribute further to meet the company's debts.",
          },
          {
            id: "ba4-l4-q2",
            question: "An employee of 3 years is dismissed immediately without notice and without any valid reason being given. Which type of dismissal has occurred?",
            options: [
              "Wrongful dismissal only, as there was a breach of the notice requirements",
              "Unfair dismissal only, as no fair reason was given",
              "Both wrongful dismissal (breach of notice requirements) and unfair dismissal (no fair reason)",
              "Redundancy, as the dismissal was not related to the employee's personal performance",
            ],
            correct: 2,
            explanation: "Two claims arise simultaneously. Wrongful dismissal: the employer breached the contract by failing to give proper notice (statutory minimum or contractual, whichever is greater). Unfair dismissal: there was no fair reason for dismissal and/or no fair procedure was followed. An employee with 3 years' service has the qualifying period for unfair dismissal (generally 2 years).",
          },
          {
            id: "ba4-l4-q3",
            question: "Which of the following best distinguishes a private limited company (Ltd) from a public limited company (plc)?",
            options: [
              "Only a plc can have limited liability for its shareholders",
              "A private company cannot have more than 50 shareholders",
              "A plc can offer its shares to the general public; a private company cannot",
              "A private company must have at least two directors; a plc requires only one",
            ],
            correct: 2,
            explanation: "The key distinction is that a plc may offer its shares to the public (e.g. via a stock exchange listing), while a private limited company is prohibited from making public offers of its shares. This is why only plcs are listed on the London Stock Exchange. Both types benefit from limited liability.",
          },
          {
            id: "ba4-l4-q4",
            question: "A company's articles of association primarily govern:",
            options: [
              "The company's tax obligations and accounting reporting requirements",
              "The internal rules of the company, including director powers and shareholder rights",
              "The terms of employment for the company's directors and senior managers",
              "The company's relationships with external creditors and suppliers",
            ],
            correct: 1,
            explanation: "The articles of association are the company's internal rulebook, covering matters such as the powers and duties of directors, the rights attached to different classes of shares, procedures for general meetings, and rules on the transfer of shares. They form a binding contract between the company and its members, and between the members themselves.",
          },
        ],
      },
    ],
  },
};

Object.assign(window, { COURSE_CONTENT, loadProgress, saveProgress, computeLiveStats });
