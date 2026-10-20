<!-- Historical reference prompt (2026-10-20). Current AGENTS.md, accepted ADRs, product charter, MVP scope and TechChoices.md take precedence. Unapproved market, stack and compliance claims below are UNVERIFIED. -->

## GLOBAL INSTRUCTIONS — READ BEFORE STARTING

You are producing a founder-grade market research report. Before writing any section:

1. Search the web for current data. Do not rely solely on training knowledge for market sizes, competitor features, or pricing — these change. Cite every factual claim with a source and date.

2. If you cannot find reliable data for a number, say so explicitly and provide a reasoned estimate with assumptions stated — do not invent figures.

3. Each section must reference the others. The SWOT must cite findings from the competitor analysis. The recommendations must resolve tensions between the gap analysis and the SWOT. Treat this as one coherent document, not seven independent answers.

4. Do not produce a flattering output. A useful report surfaces uncomfortable truths: strong incumbents, weak differentiation, crowded markets. If the market evidence suggests the product faces serious headwinds, say so clearly.

5. Output format: use the structure specified in each section. Present findings visually where instructed (comparison cards, positioning map, SWOT grid, pricing chart). Keep prose tight — one strong sentence beats three vague ones.

---
## PART 0 — PRODUCT CONTEXT

Fill in each field before sending. The quality of the research depends on the specificity here.

Product name: [Name]

Core problem: [One sentence: what painful, specific situation does this solve? Name the user role experiencing it.]

Solution: [One sentence: what does the product do, mechanically?]

Primary user: [Role + context. e.g. "HR managers at 50–300 person tech companies who currently track leave in spreadsheets"]

Buyer vs. user: [Who pays vs. who uses it daily? Are they the same person?]

Target geography: [e.g. Europe-first / US / global from day one]

Business model: [SaaS per seat / flat monthly / freemium / usage-based]

Stage: [Idea / pre-build / MVP in progress / live with N customers]

Key constraint: [One honest constraint that shapes the analysis — e.g. "bootstrapped, no sales team", "solo technical founder", "must be profitable in 18 months"]

---
## SECTION 1 — COMPETITOR ANALYSIS

Framework: map the competitive landscape across three tiers.

Tier 1 — Direct competitors
Same product category, same buyer, solving the same core problem. These are your day-one alternatives in the prospect's mind.

Tier 2 — Indirect competitors
Different product, same job-to-be-done. Include: spreadsheets and manual processes (always a real competitor), adjacent software the buyer already uses that partially solves this, and internal-build options at larger companies.

Tier 3 — Potential disruptors
Players in adjacent markets with distribution, data, or platform leverage who could expand into this space in 2–3 years (e.g. payroll providers adding leave features, Slack/Teams building HR tools).

For each named competitor, cover all of the following — skip nothing:
  • Positioning: one sentence — who is it for and what is its core claim?
  • Target segment: company size, industry, geography
  • Pricing model and any public price points; note if pricing requires a sales call
  • Feature set: only features relevant to this product's scope, pulled from their website + user reviews
  • Reported weaknesses: use 1–3 star reviews from G2, Capterra, or Trustpilot — not marketing copy
  • GTM motion: product-led growth / sales-led / channel partners / integration-led
  • Traction signals: funding raised, stated customer count, employee headcount, notable customers
  • Switching cost: how hard is it for a customer to leave once adopted?

Output: group by tier. At the end of the section, flag the 2–3 most dangerous competitors and explain why in one sentence each. If a competitor appears weaker on paper but has strong distribution (e.g. bundled into an existing platform), flag that explicitly.

---
## SECTION 2 — FEATURE BENCHMARK

Framework: Jobs-to-be-Done (JTBD) lens. Group features by the user job they serve, not by product area. A "job" is a specific outcome a user hires the software to achieve (e.g. "know at a glance who is off this week", "approve a leave request from my phone in under 30 seconds").

Classify every relevant feature into one of three tiers:

  Table stakes — absence disqualifies you from consideration. Every serious competitor has this.
  Differentiators — present in some tools but not all; source of competitive advantage if done well.
  Innovations — rare or absent in the market today; potential to create a new category expectation.

For each feature include:
  • Which competitors offer it (name them)
  • Quality signal from reviews where available (e.g. "BambooHR has this but approval chains are reported as inflexible — see G2 reviews")
  • Effort to build: low / medium / high (helps prioritise)
  • Strategic importance to this specific product: high / medium / low — with a one-line reason

At the end: identify the 2–3 differentiators with the highest strategic importance AND lowest competitive density. These are the features to lead with.

Do not list features that have no bearing on the product described in Part 0.

---
## SECTION 3 — MARKET SIZING

Produce both a top-down and a bottom-up estimate. Show your working for both. Where numbers conflict across sources, state the range and explain which estimate you consider most credible and why.

Top-down (TAM → SAM → SOM):
  TAM: Total addressable market — the full global revenue opportunity if 100% of potential buyers used this category of software. Cite the source and year.
  SAM: Serviceable addressable market — apply the product's geographic and segment constraints from Part 0. Show the filter logic (e.g. "EU SMBs with 10–500 employees = X% of TAM").
  SOM: Serviceable obtainable market — realistically capturable in years 1–3. This is the hardest number. Derive it from: assumed GTM motion, typical sales cycle length, realistic team size, and comparable early-stage benchmarks from similar products. Do not use a percentage of SAM without justification.

Bottom-up cross-check:
  Estimate: [target segment size] × [average deal value] × [realistic year-1 penetration %] = year-1 ARR potential. State each assumption. If the bottom-up and top-down SOM diverge significantly, flag it and explain the tension.

Trends to cover:
  • CAGR and what is driving it (be specific — not just "digital transformation")
  • Which segments are growing fastest (company size, geography, vertical)
  • Technology shifts affecting demand: AI features, mobile-first, API economy, remote work
  • Any signs of market saturation or consolidation that would make entry harder

Anti-hallucination rule: if you cannot find a reliable source for a market size figure, say "estimated" and provide your bottom-up derivation instead of citing an unverifiable number.

---
## SECTION 4 — GAP AND OPPORTUNITY ANALYSIS

This section answers: where is there a real, durable opening in this market?

Step 1 — Mine user complaints
Search G2, Capterra, Reddit (r/humanresources, r/sysadmin, relevant subs), and product review threads for the top 3–5 competitors identified in Section 1. Extract recurring complaints. Group them by theme. A complaint that appears across multiple competitors is a market-level gap, not a product-execution problem.

Step 2 — Positioning map
Plot the top 6–8 competitors on a 2×2 map. Choose axes that are most strategically relevant to the product in Part 0 — do not default to "price vs. features." Examples: complexity vs. target company size / setup effort vs. approval-chain depth / mobile experience vs. org hierarchy support. Identify whitespace quadrants explicitly.

Step 3 — Underserved segment scan
Which buyer types (by role, company size, geography, or vertical) are consistently ignored, overcharged, or underserved by existing tools? Reference specific evidence from Section 1 reviews and pricing data.

Step 4 — Barrier to incumbent response
For each gap identified, rate how quickly and easily incumbents could close it:
  Low barrier: they could ship this in a quarter — not a sustainable moat
  Medium barrier: structural or architectural reason they haven't done it (e.g. legacy data model, sales-led GTM making PLG hard)
  High barrier: would require replatforming, repositioning, or cannibalising existing revenue

Output: a ranked shortlist of the top 3–4 gaps, ordered by: (opportunity size × barrier to incumbent response). For each: one sentence of evidence, one sentence on why incumbents haven't closed it, and a moat rating (low / medium / high).

---
## SECTION 5 — SWOT AND STRATEGY MATRIX

Rules that must be followed:
  • Every point must be specific and traceable to evidence in Sections 1–4. No generic statements. Test each point: could this be said about any SaaS product? If yes, rewrite it.
  • Strengths and weaknesses are internal (within the product team's control at current stage)
  • Opportunities and threats are external (market, macro, competitors, regulation)
  • Order each quadrant by strategic importance — most important first
  • Aim for 5–7 points per quadrant. Fewer, sharper points beat long lists

After the four-quadrant grid, produce a strategy matrix with four moves:

  SO move (Strengths × Opportunities): how to deploy your strongest strength to capture your best opportunity. One paragraph, actionable.
  ST move (Strengths × Threats): how to use a strength to neutralise or outmanoeuvre the most dangerous threat. One paragraph.
  WO move (Weaknesses × Opportunities): which weakness, if addressed, unlocks the most valuable opportunity — and how. One paragraph.
  WT move (Weaknesses × Threats): the scenario to avoid — what happens if your biggest weakness collides with your worst threat. What is the early warning signal, and what is the contingency? One paragraph.

The strategy matrix is the most important output in this section. Do not treat it as a footnote.

---
## SECTION 6 — PRICING BENCHMARK

Part A — Benchmark (what the market charges):
  • List every pricing model in use: per seat/month, flat monthly, usage-based, freemium+paid, annual contract only, custom/quote-only
  • Map price points by tier: startup tools / focused tools / SMB HRIS / mid-market HRIS / enterprise HCM
  • For each competitor: note exactly what is included at each paid tier, and where the meaningful feature paywalls are (e.g. "approvals are free; multi-level approval chains require Pro at $X")
  • Flag which competitors require a sales call to get pricing — this is a GTM signal, not just a pricing note

Part B — Value-based pricing analysis (what you should charge):
  Do not copy competitor pricing. Derive pricing from value delivered.

  1. Quantify the value created: what does this product save or earn for the buyer? (time saved per HR manager per month, compliance risk avoided, errors eliminated — be specific and cite comparable benchmarks if available)
  2. Willingness to pay: what anchors the buyer's mental price? Their current solution cost (spreadsheets = $0 but high admin time; incumbent tool = $X/seat)
  3. Pricing model fit: match the model to the GTM motion — per-seat naturally fits PLG (virality as team grows); flat fee fits sales-led (easier to quote); usage-based fits API/developer buyers
  4. Tier architecture: propose a concrete 3-tier structure with:
     — Entry tier: what's included, what's the hook, what's the ceiling that forces upgrade
     — Growth tier: the primary revenue tier — what unlocks here, target buyer profile
     — Enterprise tier: what justifies 10× the Growth price (compliance, SSO, SLA, dedicated support, custom contracts)

  Flag: the risk of under-pricing (trains buyers to expect low prices, signals low quality, makes unit economics impossible) and over-pricing (no social proof to justify enterprise perception at launch).

---
## SECTION 7 — STRATEGIC RECOMMENDATIONS

Synthesise the full report into five concrete outputs. Each must be derived from the evidence above — no new claims introduced here.

1. Positioning statement
   Format: "[Product] is the only [category] that [specific differentiator] for [target customer] who [specific context or pain point]."
   Then test it: run it against the top 3 direct competitors from Section 1. Does the claim hold against each? If a competitor can make the same claim, the positioning is not differentiated — revise it.

2. Beachhead market
   Identify the single, narrowest customer segment to target first. Apply the following criteria:
     — High pain intensity (they feel the problem acutely today)
     — Low incumbent strength (the best current solution is weak or expensive for them)
     — Referenceable (winning here produces credible case studies for the next segment)
     — Accessible (you can reach them without a large sales team)
   Name the segment specifically (e.g. "HR managers at 20–80 person remote-first tech startups in the EU, currently using spreadsheets") and state why it scores well on all four criteria.

3. MVP feature scope
   Using the feature benchmark from Section 2: list the table-stakes features that must be at launch, the 1–2 differentiators that should be at launch (your wedge), and features to explicitly defer to v2. For each deferred feature, state what validated traction signal would justify building it.

4. Top 3 strategic risks
   Not generic risks — risks specific to this product in this market at this stage. For each:
     — State the risk in one sentence
     — Assign a likelihood (low/medium/high) and impact (low/medium/high)
     — Provide a concrete mitigation or early-warning indicator to watch

5. Critical assumptions to validate
   List the 3–5 assumptions this entire analysis rests on that have not yet been tested with real buyers. For each: name the assumption, propose the fastest/cheapest test to validate or invalidate it (customer interview guide question, landing page experiment, pilot offer, etc.), and state what a "fail" result would mean for the strategy.
