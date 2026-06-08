-- BA4: Fundamentals of Ethics, Corporate Governance and Business Law
-- UUID prefix: ba400000- (b, a, 4 are all valid hex characters)

-- ============================================================
-- COURSE
-- ============================================================
INSERT INTO public.courses (id, slug, title, description, cima_paper, color_hex, order_index, is_published)
VALUES (
  'ba400000-0000-0000-0000-000000000000',
  'ba4-ethics-governance-law',
  'BA4 – Fundamentals of Ethics, Corporate Governance and Business Law',
  'Understand the ethical responsibilities of management accountants, corporate governance frameworks, internal controls, and the key principles of business law.',
  'BA4',
  '#D97706',
  4,
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULE 1: Ethics and Professionalism
-- ============================================================
INSERT INTO public.modules (id, course_id, title, description, order_index)
VALUES (
  'ba400000-0001-0000-0000-000000000000',
  'ba400000-0000-0000-0000-000000000000',
  'Ethics and Professionalism',
  'CIMA fundamental principles, ethical frameworks, threats, safeguards, and professional responsibilities.',
  1
) ON CONFLICT (id) DO NOTHING;

-- Lesson 1.1: CIMA Fundamental Ethical Principles
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba400000-0001-0001-0000-000000000000',
  'ba400000-0001-0000-0000-000000000000',
  'CIMA Fundamental Ethical Principles',
  1,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "CIMA Fundamental Ethical Principles",
    "body": "CIMA members must uphold five fundamental ethical principles at all times. These are embedded in the CIMA Code of Ethics and aligned with the IESBA International Code of Ethics. Breaching these principles can result in disciplinary action and damage to the profession.",
    "emoji": "🎓"
  },
  {
    "type": "table",
    "heading": "The Five Fundamental Principles",
    "headers": ["Principle", "Meaning", "Example of breach"],
    "rows": [
      ["Integrity", "Be straightforward and honest in all professional and business relationships", "Knowingly preparing misleading financial statements"],
      ["Objectivity", "Do not allow bias, conflict of interest, or undue influence to override professional judgement", "Approving an expense claim from a close friend without scrutiny"],
      ["Professional Competence and Due Care", "Maintain knowledge and skill to provide competent professional service", "Giving tax advice outside your area of expertise"],
      ["Confidentiality", "Do not disclose information acquired in a professional relationship without proper authority", "Discussing client financial data at a social event"],
      ["Professional Behaviour", "Comply with relevant laws and avoid actions that discredit the profession", "Submitting a misleading CV to obtain a job"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Ethical Frameworks",
    "body": "When facing an ethical dilemma, accountants can use two main ethical frameworks to analyse the situation.",
    "key_terms": [
      "Consequentialism (Utilitarianism): judge an action by its outcomes; the right action produces the greatest good for the greatest number",
      "Deontological ethics (Kantian): judge an action by whether it follows universal moral rules or duties, regardless of outcome",
      "Virtue ethics: focus on the character of the person — would a person of good character do this?",
      "Rights-based ethics: every person has fundamental rights that must not be violated",
      "CIMA Code of Ethics: principle-based (not rules-based) — requires judgement, not just compliance"
    ]
  },
  {
    "type": "explanation",
    "heading": "Threats and Safeguards",
    "body": "The conceptual framework approach identifies threats to the fundamental principles and requires accountants to apply safeguards to eliminate or reduce them to an acceptable level.",
    "key_terms": [
      "Self-interest threat: financial or other interest that could inappropriately influence judgement (e.g. owning shares in an audit client)",
      "Self-review threat: reviewing your own previous work (e.g. preparing and then auditing the same financial statements)",
      "Advocacy threat: promoting a client's position to the extent that objectivity is compromised",
      "Familiarity threat: too close a relationship leading to undue sympathy (e.g. long-standing client relationship)",
      "Intimidation threat: being deterred from acting objectively by actual or perceived threats (e.g. a client threatening to replace you)"
    ]
  },
  {
    "type": "explanation",
    "heading": "Safeguards Against Threats",
    "body": "When a threat is identified, the accountant must determine whether it can be reduced to an acceptable level using available safeguards. If not, the engagement or relationship must be declined.",
    "key_terms": [
      "Profession-level safeguards: CIMA Code, CPD requirements, professional standards, disciplinary procedures",
      "Firm-level safeguards: quality control systems, rotation policies, independent review",
      "Client-level safeguards: audit committees, governance structures, transparent reporting",
      "Resignation: if threats cannot be reduced to acceptable level, the accountant may need to withdraw"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba400000-0001-0001-0000-000000000001',
  'ba400000-0001-0001-0000-000000000000',
  'mcq',
  'A management accountant is asked to prepare a report that they know contains misleading information. Which fundamental principle is MOST directly threatened?',
  '["Confidentiality", "Professional Behaviour", "Integrity", "Objectivity"]',
  '"Integrity"',
  'Integrity requires being straightforward and honest. Knowingly preparing misleading information directly breaches integrity — the core principle of honesty and truthfulness in professional and business relationships.',
  1
),
(
  'ba400000-0001-0001-0000-000000000002',
  'ba400000-0001-0001-0000-000000000000',
  'mcq',
  'An accountant has worked with the same client for 15 years and has become close friends with the finance director. This creates which threat?',
  '["Self-interest threat", "Advocacy threat", "Intimidation threat", "Familiarity threat"]',
  '"Familiarity threat"',
  'Familiarity threat arises when a close relationship leads to over-sympathy, inadequate scrutiny, or prioritising the client''s interests over professional obligations. Long-standing client relationships are a classic example.',
  2
),
(
  'ba400000-0001-0001-0000-000000000003',
  'ba400000-0001-0001-0000-000000000000',
  'true_false',
  'The CIMA Code of Ethics is rules-based, requiring specific compliance with detailed rules for every situation.',
  '["True", "False"]',
  '"False"',
  'The CIMA Code of Ethics is PRINCIPLE-based, not rules-based. It requires members to exercise professional judgement in applying the fundamental principles to their specific circumstances, rather than mechanically following a checklist of rules.',
  3
),
(
  'ba400000-0001-0001-0000-000000000004',
  'ba400000-0001-0001-0000-000000000000',
  'mcq',
  'An accountant is reviewing financial statements that they themselves prepared last year. This is an example of:',
  '["Self-interest threat", "Self-review threat", "Familiarity threat", "Advocacy threat"]',
  '"Self-review threat"',
  'Self-review threat occurs when an accountant evaluates or audits their own previous work. Objectivity is compromised because they are unlikely to identify errors or issues in work they produced themselves.',
  4
);

-- Lesson 1.2: Ethical Conflicts and Whistleblowing
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba400000-0001-0002-0000-000000000000',
  'ba400000-0001-0000-0000-000000000000',
  'Ethical Conflicts and Whistleblowing',
  2,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Ethical Conflicts and Whistleblowing",
    "body": "Finance professionals frequently face pressure to act unethically. Knowing how to resolve conflicts and when to report wrongdoing is a critical professional skill.",
    "emoji": "🔔"
  },
  {
    "type": "explanation",
    "heading": "Resolving Ethical Conflicts",
    "body": "CIMA provides a structured approach to resolving ethical conflicts. The steps should be followed in order, escalating as necessary.",
    "key_terms": [
      "Step 1: Gather relevant facts and identify the ethical issue",
      "Step 2: Identify affected parties and their interests",
      "Step 3: Consider the relevant ethical principles and professional standards",
      "Step 4: Identify available courses of action and their consequences",
      "Step 5: Consult with a colleague, superior, ethics helpline, or legal adviser",
      "Step 6: Escalate internally — to line manager, finance director, audit committee",
      "Step 7: If unresolved and serious enough, consider external reporting (whistleblowing)"
    ]
  },
  {
    "type": "explanation",
    "heading": "Whistleblowing (Protected Disclosure)",
    "body": "Whistleblowing means reporting suspected wrongdoing in the public interest. In the UK, the Public Interest Disclosure Act 1998 (PIDA) protects employees who make qualifying disclosures from unfair dismissal and detriment. Not all disclosures are protected — they must meet specific criteria.",
    "key_terms": [
      "Qualifying disclosure: genuinely held belief that wrongdoing is occurring — criminal offence, legal obligation breach, health & safety risk, miscarriage of justice, environmental damage, or deliberate concealment",
      "Good faith: disclosure must be made in the public interest, not for personal gain",
      "Internal disclosure: to employer (preferred — internal resolution is better)",
      "Prescribed person disclosure: to a regulator (e.g. FCA, HMRC, HSE)",
      "Public disclosure: to media — only allowed in specific narrow circumstances; higher threshold"
    ]
  },
  {
    "type": "explanation",
    "heading": "Pressure from Management",
    "body": "Accountants may face pressure from management to massage figures, delay recognition of losses, or sign off on inaccurate reports. Appropriate responses depend on the severity.",
    "key_terms": [
      "Document everything: keep a clear written record of instructions and conversations",
      "Refuse: declining to do something unethical is always an option",
      "Seek legal/professional advice: CIMA ethics helpline, solicitor",
      "Resign: if the organisation's culture is fundamentally unethical",
      "Report externally: as a last resort if internal routes are exhausted"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba400000-0001-0002-0000-000000000001',
  'ba400000-0001-0002-0000-000000000000',
  'mcq',
  'Under UK law, a whistleblowing disclosure is MOST likely to receive legal protection if:',
  '["It is made directly to the national press", "The employee believes in good faith it is in the public interest", "The employee has proof of the wrongdoing", "It involves a minor regulatory breach"]',
  '"The employee believes in good faith it is in the public interest"',
  'The Public Interest Disclosure Act 1998 requires a genuine, good-faith belief that the disclosure is in the public interest. Proof is not required — a reasonable belief suffices. Media disclosure has a higher threshold than internal or regulator disclosure.',
  1
),
(
  'ba400000-0001-0002-0000-000000000002',
  'ba400000-0001-0002-0000-000000000000',
  'mcq',
  'What should an accountant do FIRST when facing a potential ethical conflict at work?',
  '["Immediately contact the external auditors", "Gather the relevant facts and clearly identify the ethical issue", "Resign to avoid being implicated", "Report to the financial regulator"]',
  '"Gather the relevant facts and clearly identify the ethical issue"',
  'The first step in CIMA''s ethical conflict resolution framework is to gather facts and identify the nature of the ethical issue. Rushing to external reporting without first understanding the situation and exploring internal options would be inappropriate.',
  2
),
(
  'ba400000-0001-0002-0000-000000000003',
  'ba400000-0001-0002-0000-000000000000',
  'true_false',
  'An accountant who makes a protected disclosure can be legally dismissed by their employer for doing so.',
  '["True", "False"]',
  '"False"',
  'The Public Interest Disclosure Act 1998 specifically protects whistleblowers from unfair dismissal and workplace detriment. Dismissing an employee for making a qualifying protected disclosure is automatically unfair, and the employee has employment tribunal rights.',
  3
),
(
  'ba400000-0001-0002-0000-000000000004',
  'ba400000-0001-0002-0000-000000000000',
  'mcq',
  'An accountant''s manager instructs them to overstate revenue to meet a bonus target. The most appropriate FIRST action is to:',
  '["Comply — the manager takes responsibility", "Immediately report to the external auditor", "Refuse and document the request; discuss the concern with the manager or seek guidance", "Resign immediately"]',
  '"Refuse and document the request; discuss the concern with the manager or seek guidance"',
  'The accountant should refuse to act unethically, document the instruction in writing, and attempt to resolve the matter internally first. Immediately going external (auditor, regulator) skips the internal escalation steps. Compliance passes no moral or legal protection.',
  4
);

-- ============================================================
-- MODULE 2: Corporate Governance and Risk
-- ============================================================
INSERT INTO public.modules (id, course_id, title, description, order_index)
VALUES (
  'ba400000-0002-0000-0000-000000000000',
  'ba400000-0000-0000-0000-000000000000',
  'Corporate Governance and Risk',
  'Governance frameworks, board responsibilities, internal controls, and risk management.',
  2
) ON CONFLICT (id) DO NOTHING;

-- Lesson 2.1: Corporate Governance Frameworks
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba400000-0002-0001-0000-000000000000',
  'ba400000-0002-0000-0000-000000000000',
  'Corporate Governance Frameworks',
  1,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Corporate Governance Frameworks",
    "body": "Corporate governance refers to the system by which organisations are directed and controlled. It addresses the relationship between shareholders, directors, and other stakeholders — balancing accountability with entrepreneurial freedom.",
    "emoji": "🏛️"
  },
  {
    "type": "explanation",
    "heading": "The Agency Problem",
    "body": "The separation of ownership (shareholders) from control (directors/managers) creates an agency problem. Directors (agents) may pursue their own interests rather than maximising shareholder wealth. Corporate governance mechanisms exist to align interests and ensure accountability.",
    "key_terms": [
      "Principal: the party on whose behalf the agent acts (shareholders)",
      "Agent: the party acting on behalf of the principal (directors/managers)",
      "Agency costs: costs of monitoring agents and resolving conflicts (e.g. audit fees, incentive schemes)",
      "Agency problem: directors may prioritise personal gain over shareholder value"
    ]
  },
  {
    "type": "explanation",
    "heading": "The UK Corporate Governance Code",
    "body": "The UK Corporate Governance Code (FRC) applies to UK premium listed companies on a 'comply or explain' basis. It sets out principles of good governance across five sections.",
    "key_terms": [
      "Comply or explain: companies must comply with the Code or explain why they have not",
      "Section 1 — Board Leadership and Company Purpose: clear purpose, values, culture",
      "Section 2 — Division of Responsibilities: separate Chair and CEO roles; at least half the board should be independent NEDs",
      "Section 3 — Composition, Succession and Evaluation: regular board evaluation; diverse skills",
      "Section 4 — Audit, Risk and Internal Control: audit committee, risk management, internal controls",
      "Section 5 — Remuneration: align executive pay with long-term performance"
    ]
  },
  {
    "type": "table",
    "heading": "Executive Directors vs Non-Executive Directors (NEDs)",
    "headers": ["Feature", "Executive Directors", "Non-Executive Directors"],
    "rows": [
      ["Role", "Run the business day-to-day", "Provide independent oversight and challenge"],
      ["Employment", "Full-time employees", "Part-time; usually on fixed-term contracts"],
      ["Pay", "Salary + bonus + share options", "Fixed fee (no bonuses — preserves independence)"],
      ["Independence", "Not independent", "Should be independent from management"],
      ["Key contributions", "Operational expertise", "Scrutiny, strategy, risk, governance"],
      ["Committee roles", "Not on audit/remuneration committees", "Typically chair/sit on key committees"]
    ]
  },
  {
    "type": "explanation",
    "heading": "The Role of the Audit Committee",
    "body": "The audit committee is a key governance mechanism, typically comprising independent NEDs. It oversees financial reporting, internal controls, and the relationship with both internal and external auditors.",
    "key_terms": [
      "Composition: at least three independent NEDs (for FTSE 350: at least one with recent relevant financial experience)",
      "Responsibilities: review financial statements, monitor internal control effectiveness, manage external auditor relationship, oversee internal audit function",
      "Independent of management: must be able to challenge management without conflict of interest",
      "Stewardship code: institutional investors'' responsibility to exercise governance rights (e.g. voting)"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba400000-0002-0001-0000-000000000001',
  'ba400000-0002-0001-0000-000000000000',
  'mcq',
  'The "agency problem" in corporate governance arises from:',
  '["External auditors acting in their own interest", "The separation of ownership from control, where managers may not act in shareholders'' interests", "Government regulation of company directors", "Too many shareholders having conflicting objectives"]',
  '"The separation of ownership from control, where managers may not act in shareholders'' interests"',
  'The agency problem arises because directors (agents) control the company on behalf of shareholders (principals). Directors may pursue personal benefits (salary, empire-building, risk avoidance) rather than maximising shareholder value. Governance mechanisms aim to reduce this.',
  1
),
(
  'ba400000-0002-0001-0000-000000000002',
  'ba400000-0002-0001-0000-000000000000',
  'mcq',
  'The UK Corporate Governance Code applies on a:',
  '["Mandatory compliance basis — all companies must follow it", "Comply or explain basis — companies must comply or give reasons why not", "Voluntary basis — companies can choose whether to follow it", "Regulatory basis — enforced by the FCA with fines"]',
  '"Comply or explain basis — companies must comply or give reasons why not"',
  'The UK Corporate Governance Code is not legally binding legislation. Premium-listed companies must disclose whether they have complied with its provisions, and if not, must explain their reasons. Investors can then judge whether the explanation is satisfactory.',
  2
),
(
  'ba400000-0002-0001-0000-000000000003',
  'ba400000-0002-0001-0000-000000000000',
  'true_false',
  'Executive directors should serve on the remuneration committee to ensure appropriate pay levels are set.',
  '["True", "False"]',
  '"False"',
  'Executive directors should NOT sit on the remuneration committee — they have a conflict of interest in setting their own pay. The UK Corporate Governance Code requires the remuneration committee to consist exclusively of independent NEDs to ensure objectivity.',
  3
),
(
  'ba400000-0002-0001-0000-000000000004',
  'ba400000-0002-0001-0000-000000000000',
  'mcq',
  'Which of the following best describes the purpose of the audit committee?',
  '["To prepare the annual financial statements", "To manage day-to-day financial operations", "To oversee financial reporting, internal controls, and auditor relationships", "To set the external auditor''s fees"]',
  '"To oversee financial reporting, internal controls, and auditor relationships"',
  'The audit committee''s key roles are: overseeing the integrity of financial statements, monitoring internal control and risk management systems, managing the relationship with external auditors (appointment, fees, independence), and overseeing the internal audit function.',
  4
);

-- Lesson 2.2: Internal Controls and Risk Management
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba400000-0002-0002-0000-000000000000',
  'ba400000-0002-0000-0000-000000000000',
  'Internal Controls and Risk Management',
  2,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Internal Controls and Risk Management",
    "body": "Internal controls are processes designed to provide reasonable assurance that an organisation achieves its objectives. Risk management identifies, assesses, and responds to threats to those objectives.",
    "emoji": "🛡️"
  },
  {
    "type": "explanation",
    "heading": "Types of Internal Control",
    "body": "Internal controls fall into two broad categories: preventive (stop errors/fraud occurring) and detective (identify errors/fraud after they occur).",
    "key_terms": [
      "Preventive controls: segregation of duties, authorisation limits, password controls, physical access restrictions",
      "Detective controls: bank reconciliations, internal audit, exception reports, variance analysis",
      "Corrective controls: procedures to fix problems once detected (e.g. error correction procedures, disciplinary processes)",
      "Segregation of duties: no single individual controls all stages of a transaction (e.g. purchase ordering, receiving, and payment approval must be separate people)"
    ]
  },
  {
    "type": "table",
    "heading": "The Risk Management Process",
    "headers": ["Stage", "Description", "Example"],
    "rows": [
      ["Risk Identification", "Identify all potential threats to objectives", "SWOT analysis, risk registers, scenario planning"],
      ["Risk Assessment", "Evaluate likelihood and impact of each risk", "Risk matrix: low/medium/high probability × low/medium/high impact"],
      ["Risk Response (4Ts)", "Choose how to deal with each risk", "Terminate, Transfer, Tolerate, Treat"],
      ["Monitoring and Review", "Continuously monitor risks and control effectiveness", "KRI reporting, internal audit, board risk committee"]
    ]
  },
  {
    "type": "explanation",
    "heading": "The 4T Risk Responses",
    "body": "Once risks are assessed, management must choose a response. The four options are often remembered as the 4Ts.",
    "key_terms": [
      "Terminate (avoid): stop the activity that creates the risk entirely (only if the risk is unacceptable and the activity non-essential)",
      "Transfer: pass the financial consequences to a third party (e.g. insurance, outsourcing, hedging)",
      "Tolerate (accept): accept the risk because the cost of controlling it exceeds the benefit, or the risk level is acceptable",
      "Treat (reduce): implement controls to reduce likelihood and/or impact (e.g. staff training, improved processes, backup systems)"
    ]
  },
  {
    "type": "explanation",
    "heading": "Limitations of Internal Controls",
    "body": "Even well-designed internal control systems have inherent limitations. No system can provide absolute assurance.",
    "key_terms": [
      "Human error: mistakes can occur in applying controls",
      "Collusion: two or more individuals working together can override segregation of duties",
      "Management override: management can instruct staff to bypass controls",
      "Cost-benefit: not all controls are cost-justified; only controls where benefit > cost are implemented",
      "Obsolescence: controls designed for old processes may not work for new ones"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba400000-0002-0002-0000-000000000001',
  'ba400000-0002-0002-0000-000000000000',
  'mcq',
  'A company purchases insurance for its warehoused stock against fire damage. This is an example of which risk response?',
  '["Terminate", "Tolerate", "Transfer", "Treat"]',
  '"Transfer"',
  'Insurance transfers the financial consequences of the risk (fire damage) to the insurer. The company still faces the risk of fire, but the financial impact is transferred. This is a classic example of risk transfer.',
  1
),
(
  'ba400000-0002-0002-0000-000000000002',
  'ba400000-0002-0002-0000-000000000000',
  'mcq',
  'Requiring different employees to authorise purchases, receive goods, and approve payment is an example of:',
  '["Segregation of duties", "Authorisation control", "Physical control", "Detective control"]',
  '"Segregation of duties"',
  'Segregation of duties ensures no single person controls all stages of a transaction, making fraud much harder to commit and conceal. It is a fundamental preventive control — one of the most important in any internal control system.',
  2
),
(
  'ba400000-0002-0002-0000-000000000003',
  'ba400000-0002-0002-0000-000000000000',
  'true_false',
  'Internal controls can provide absolute assurance that an organisation will achieve its objectives.',
  '["True", "False"]',
  '"False"',
  'Internal controls can only provide REASONABLE assurance — not absolute. Limitations include human error, collusion, management override, and cost-benefit trade-offs. All control systems have inherent weaknesses.',
  3
),
(
  'ba400000-0002-0002-0000-000000000004',
  'ba400000-0002-0002-0000-000000000000',
  'mcq',
  'A bank reconciliation performed monthly to check that the cash book matches bank statements is an example of which type of control?',
  '["Preventive control", "Detective control", "Corrective control", "Directive control"]',
  '"Detective control"',
  'Bank reconciliations detect errors and discrepancies after they have occurred (transactions have already been processed). Preventive controls stop errors from occurring in the first place. Reconciliations are a key detective control.',
  4
);

-- ============================================================
-- MODULE 3: Business Law
-- ============================================================
INSERT INTO public.modules (id, course_id, title, description, order_index)
VALUES (
  'ba400000-0003-0000-0000-000000000000',
  'ba400000-0000-0000-0000-000000000000',
  'Business Law',
  'Contract law, company law, employment law, and fraud awareness.',
  3
) ON CONFLICT (id) DO NOTHING;

-- Lesson 3.1: Contract Law
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba400000-0003-0001-0000-000000000000',
  'ba400000-0003-0000-0000-000000000000',
  'Contract Law',
  1,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Contract Law",
    "body": "A contract is a legally binding agreement between two or more parties. Understanding the essential elements of a valid contract, and what happens when contracts are breached, is fundamental to business law.",
    "emoji": "📝"
  },
  {
    "type": "explanation",
    "heading": "Essential Elements of a Valid Contract",
    "body": "For a contract to be legally enforceable, all six elements must be present. If any element is missing, there is no valid contract.",
    "key_terms": [
      "Offer: a definite proposal made by the offeror to the offeree, capable of acceptance",
      "Acceptance: unconditional agreement to all terms of the offer (a counter-offer is a rejection)",
      "Consideration: something of value exchanged by each party (price paid; not necessarily money)",
      "Intention to create legal relations: both parties must intend the agreement to be legally binding (commercial agreements presumed yes; domestic agreements presumed no)",
      "Capacity: both parties must be legally capable of entering a contract (adults, sound mind, not under duress)",
      "Legality: the purpose of the contract must be lawful"
    ]
  },
  {
    "type": "explanation",
    "heading": "Offer vs Invitation to Treat",
    "body": "An offer must be distinguished from an invitation to treat (ITT). Only an offer can be accepted to form a contract.",
    "key_terms": [
      "Offer: a firm proposal that can immediately be accepted to form a contract",
      "Invitation to treat: an invitation to make an offer — not binding (e.g. goods on a shop shelf, a job advertisement, a tender invitation)",
      "Key case — Carlill v Carbolic Smoke Ball Co [1893]: an advertisement can be an offer if sufficiently specific and addressed to the world",
      "Revocation: an offer can be withdrawn at any time before acceptance (but revocation must be communicated)"
    ]
  },
  {
    "type": "table",
    "heading": "Vitiating Factors — Grounds for Avoiding a Contract",
    "headers": ["Vitiating factor", "Meaning", "Remedy"],
    "rows": [
      ["Misrepresentation", "False statement of fact that induced the other party to contract", "Rescission and/or damages"],
      ["Mistake", "Both parties contract under a fundamental shared misunderstanding", "Contract may be void"],
      ["Duress", "Contract entered under physical or economic threats", "Contract voidable by the victim"],
      ["Undue influence", "One party exploits position of trust to pressure the other", "Contract voidable"],
      ["Illegality", "Contract for an unlawful purpose", "Contract void and unenforceable"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Breach of Contract and Remedies",
    "body": "A breach occurs when a party fails to perform their contractual obligations. The innocent party has several remedies available.",
    "key_terms": [
      "Damages: financial compensation for loss suffered; aim to put the claimant in the position they would have been in had the contract been performed",
      "Specific performance: court order requiring the breaching party to perform their obligations (used for unique goods or land)",
      "Injunction: court order preventing a party from doing something (e.g. restraining a departing employee from joining a competitor)",
      "Remoteness: damages only recoverable if the loss was reasonably foreseeable at the time of contracting (Hadley v Baxendale)"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba400000-0003-0001-0000-000000000001',
  'ba400000-0003-0001-0000-000000000000',
  'mcq',
  'Party A offers to sell goods for £1,000. Party B replies "I''ll take them for £900." Which of the following is correct?',
  '["A binding contract is formed at £900", "Party B has made a counter-offer, rejecting A''s original offer", "The original offer remains open for A to accept", "Party B has made a valid acceptance with a modification"]',
  '"Party B has made a counter-offer, rejecting A''s original offer"',
  'A counter-offer is a rejection of the original offer and a new offer in its place. The original offer is destroyed — Party A no longer needs to sell at £1,000. A must either accept the £900 counter-offer or reject it.',
  1
),
(
  'ba400000-0003-0001-0000-000000000002',
  'ba400000-0003-0001-0000-000000000000',
  'mcq',
  'A product displayed on a supermarket shelf with a price label is:',
  '["An offer that customers can accept at the checkout", "An invitation to treat — not a binding offer", "A guarantee of supply at that price", "A contract formed when the customer picks up the item"]',
  '"An invitation to treat — not a binding offer"',
  'Goods on a shelf are an invitation to treat (Pharmaceutical Society of GB v Boots Cash Chemists [1953]). The customer makes the offer by presenting goods at the checkout; the retailer accepts (or rejects). The retailer cannot be forced to sell.',
  2
),
(
  'ba400000-0003-0001-0000-000000000003',
  'ba400000-0003-0001-0000-000000000000',
  'true_false',
  'Consideration in a contract must always be money.',
  '["True", "False"]',
  '"False"',
  'Consideration is "something of value" exchanged by each party — but it does not have to be money. It can be goods, services, a promise to do something, or a promise to refrain from doing something. The key requirement is that it has some value in the eyes of the law.',
  3
),
(
  'ba400000-0003-0001-0000-000000000004',
  'ba400000-0003-0001-0000-000000000000',
  'mcq',
  'Which remedy is most appropriate when a buyer breaches a contract for the sale of a unique, irreplaceable painting?',
  '["Damages — financial compensation for loss", "Specific performance — court orders the buyer to complete the purchase", "Rescission — the contract is unwound", "Injunction — prevents the seller from selling elsewhere"]',
  '"Specific performance — court orders the buyer to complete the purchase"',
  'Specific performance is available where damages would be an inadequate remedy — typically for unique goods (land, specific antiques, art). A court order compels the buyer to pay and complete the purchase. Damages cannot easily replicate the value of something unique.',
  4
);

-- Lesson 3.2: Company Law and Employment Law
INSERT INTO public.lessons (id, module_id, title, order_index, xp_reward, content)
VALUES (
  'ba400000-0003-0002-0000-000000000000',
  'ba400000-0003-0000-0000-000000000000',
  'Company Law and Employment Law',
  2,
  50,
  $CONTENT$
[
  {
    "type": "intro",
    "heading": "Company Law and Employment Law",
    "body": "UK company law (Companies Act 2006) governs how companies are formed, managed, and wound up. Employment law sets out the rights and obligations of employers and employees. Both are essential knowledge for finance professionals.",
    "emoji": "⚖️"
  },
  {
    "type": "explanation",
    "heading": "Types of Company",
    "body": "Companies in the UK can be formed in several different ways, with different implications for liability and governance.",
    "key_terms": [
      "Private Limited Company (Ltd): shares cannot be publicly traded; shareholders have limited liability; typically smaller businesses",
      "Public Limited Company (plc): can offer shares to the public via a stock exchange; minimum share capital of £50,000; subject to more regulation",
      "Limited liability: shareholders'' personal assets are protected; maximum loss = amount invested in shares",
      "Separate legal personality: a company is a legal person distinct from its shareholders (Salomon v Salomon [1897])",
      "Lifting the veil: courts will occasionally ignore separate personality where fraud or evasion is involved"
    ]
  },
  {
    "type": "explanation",
    "heading": "Directors'' Duties (Companies Act 2006, s.171–177)",
    "body": "The Companies Act 2006 codifies seven duties of directors. The most important for CIMA BA4 are:",
    "key_terms": [
      "s.171 — Act within powers: follow the company''s constitution and only use powers for their proper purpose",
      "s.172 — Promote the success of the company: act in good faith to promote long-term success for members (shareholders) as a whole",
      "s.174 — Exercise reasonable care, skill and diligence: objective AND subjective standard — whichever is higher",
      "s.175 — Avoid conflicts of interest: disclose and, where required, obtain approval for situations of potential conflict",
      "s.177 — Declare interests in proposed transactions: directors must tell the board if they have a personal interest in a proposed deal"
    ]
  },
  {
    "type": "table",
    "heading": "Key Employment Law Rights",
    "headers": ["Right", "Qualifying period", "Key points"],
    "rows": [
      ["Unfair dismissal", "2 years", "Employer must show fair reason (conduct, capability, redundancy, statutory restriction, other substantial reason) and follow a fair process"],
      ["Wrongful dismissal", "None (day 1)", "Breach of contract — no notice given; damages = net pay for notice period"],
      ["Redundancy pay", "2 years", "Statutory minimum based on age, length of service, and weekly pay (capped)"],
      ["Discrimination protection", "None (day 1)", "Equality Act 2010: protected characteristics include age, sex, race, disability, religion, pregnancy"],
      ["National Minimum Wage", "None (day 1)", "All workers entitled; rates set by government annually"],
      ["Written statement of employment", "None (day 1)", "Must be provided from day 1 of employment"]
    ]
  },
  {
    "type": "explanation",
    "heading": "Fraud Awareness",
    "body": "Finance professionals must understand fraud risk. The Fraud Act 2006 creates three main offences.",
    "key_terms": [
      "Fraud by false representation: dishonestly making a false representation (e.g. submitting a false invoice)",
      "Fraud by failing to disclose information: where there is a legal duty to disclose (e.g. concealing a material fact on an insurance application)",
      "Fraud by abuse of position: using a position of trust to make a financial gain or cause a loss (e.g. an accountant diverting company funds)",
      "Bribery Act 2010: makes it illegal to give or receive bribes; corporate offence if a company fails to prevent bribery by associated persons",
      "Money laundering: concealing the origins of criminal proceeds; accountants have reporting obligations under the Proceeds of Crime Act 2002"
    ]
  }
]
$CONTENT$
) ON CONFLICT (id) DO NOTHING;

insert into public.questions (id, lesson_id, question_type, prompt, options, correct_answer, explanation, order_index)
VALUES
(
  'ba400000-0003-0002-0000-000000000001',
  'ba400000-0003-0002-0000-000000000000',
  'mcq',
  'The principle established in Salomon v Salomon [1897] states that:',
  '["Directors are personally liable for all company debts", "A company is a legal person separate from its shareholders", "Shareholders can always be sued for company obligations", "Companies must have at least two shareholders"]',
  '"A company is a legal person separate from its shareholders"',
  'Salomon v Salomon is the foundation of company law. Even a one-person company is a separate legal entity — it can own property, enter contracts, and be sued in its own name. Shareholders benefit from limited liability as a result.',
  1
),
(
  'ba400000-0003-0002-0000-000000000002',
  'ba400000-0003-0002-0000-000000000000',
  'mcq',
  'Under the Companies Act 2006, a director must promote the success of the company for the benefit of:',
  '["The directors collectively", "The shareholders as a whole in the long term", "All stakeholders including employees, suppliers and creditors equally", "The majority shareholder"]',
  '"The shareholders as a whole in the long term"',
  's.172 CA 2006 requires directors to act in good faith to promote long-term success for the benefit of members (shareholders) as a whole. Directors must also have regard for other stakeholders, but the primary duty is to shareholders collectively, not any individual.',
  2
),
(
  'ba400000-0003-0002-0000-000000000003',
  'ba400000-0003-0002-0000-000000000000',
  'mcq',
  'An employee is dismissed without notice after 3 months of employment. They have no claim for unfair dismissal, but may have a claim for:',
  '["Redundancy pay", "Wrongful dismissal", "Discrimination under the Equality Act", "Statutory maternity pay"]',
  '"Wrongful dismissal"',
  'Unfair dismissal requires 2 years'' service. Wrongful dismissal is a common law breach of contract claim available from day 1 — it applies when an employer fails to give proper notice. Damages = net pay for the notice period the employee was entitled to.',
  3
),
(
  'ba400000-0003-0002-0000-000000000004',
  'ba400000-0003-0002-0000-000000000000',
  'mcq',
  'Under the Bribery Act 2010, which offence can a company commit even if the bribery was carried out by a third party without the company''s knowledge?',
  '["Fraud by false representation", "Failure to prevent bribery by an associated person", "Fraud by abuse of position", "Money laundering"]',
  '"Failure to prevent bribery by an associated person"',
  'The Bribery Act 2010 s.7 creates a strict liability corporate offence: a company is guilty if a person associated with it (employee, agent, subsidiary) pays a bribe on its behalf, unless the company can show it had adequate anti-bribery procedures in place.',
  4
);

-- ============================================================
-- ACHIEVEMENTS for BA4
-- ============================================================
INSERT INTO public.achievements (id, slug, title, description, icon, trigger_type, trigger_value)
VALUES
(
  'ba400000-aaaa-0001-0000-000000000000',
  'ba4-ethics-champion',
  'Ethics Champion',
  'Complete your first BA4 lesson',
  '🎓',
  'lesson_complete',
  '{"course_slug": "ba4-ethics-governance-law", "min_lessons": 1}'
),
(
  'ba400000-aaaa-0002-0000-000000000000',
  'ba4-governance-expert',
  'Governance Expert',
  'Complete the Corporate Governance and Risk module',
  '🏛️',
  'module_complete',
  '{"module_id": "ba400000-0002-0000-0000-000000000000"}'
),
(
  'ba400000-aaaa-0003-0000-000000000000',
  'ba4-qualified-professional',
  'Qualified Professional',
  'Complete all BA4 modules',
  '⚖️',
  'course_complete',
  '{"course_slug": "ba4-ethics-governance-law"}'
)
ON CONFLICT (id) DO NOTHING;
