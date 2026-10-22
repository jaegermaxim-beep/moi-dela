## Version 11.2 — Unified Scenario & Decision State (October 2026)

This is an additive **quality/stabilisation** release. All data and decisions remain synthetic. The 
`decision-state.js` module is now a shared, single-browser-session coordinator for the Forecast Laboratory,
Group Cockpit, deterministic Treasury Optimiser, Risk-Aware Funding and Funding Lifecycle approvals.

- One scenario revision keyed by the full current synthetic cash-flow book and its assumptions. Re-rendering
  an unchanged scenario does not reset approval. Changing timing, payments, SoD liquidity, funding inputs,
  Monte Carlo parameters, decision cut-offs or repo tenor invalidates previously reviewed plans.
- Proposal staging is required before the central ledger accepts an approval. Stale scenario revisions and
  ineligible actions cannot be approved by the coordinator.
- Only one **active simulated approval** is retained across modules. A subsequent approved plan supersedes
  the previous one, and the previous component removes its approved simulation overlay.
- A consolidated decision audit CSV records approvals, rejections, supersessions and invalidations; the
  shared status strip displays active source and scenario revision. Historic component-specific logs remain
  available as local views for compatibility; the central ledger is authoritative **within this browser session**.
- Regression coverage includes versioning, duplicate scenario events, eligibility rejection, stale decisions,
  cross-module supersession and browser interactions on desktop/mobile.

**Non-production controls disclosure:** This ledger is an in-memory browser simulation and can be modified
by a developer or cleared by refreshing the page. It is not tamper-resistant or persistent, has no true user
authentication, role-based access control, cryptographic signatures, multi-user concurrency or execution
interfaces. It is *not* equivalent to a bank's regulated immutable audit system.

**Product follow-up:** Further consistency work is still needed around module-specific decision log
presentation, synthetic controls that are not causally tied to the ML model, backend persistence,
security reviews and validation of any real funding constraints.

# FLOWSTATE v11 — Executive Treasury Dashboard & Guided Client Demo

FLOWSTATE v11 adds a compact executive landing dashboard before the technical laboratory. The dashboard consumes the **same synthetic cash-flow scenario** and the existing `CockpitEngine` results rather than maintaining a separate balance-sheet calculation.

New standalone source modules:

- `executive-engine.js`: pure, testable calculation of Group and entity metrics, reserve-floor exception flags and synthetic Actual-vs-Forecast divergence.
- `executive-ui.js` and `executive.css`: executive KPIs, Group time-series chart, legal-entity drill-down, review signals, and a five-step guided client walkthrough.
- `tests/test_executive.js` and `tests/browser_qa_v11.py`: model consistency and desktop/mobile interaction checks.

**Five-step presentation sequence:** (1) Group and legal-entity intraday liquidity, (2) payment-level settlement forecasting, (3) BaU vs stressed Monte Carlo, (4) risk-aware funding plan comparison, (5) simulated human approval and collateral lifecycle. The guided mode scrolls to live modules but **never automatically approves a funding action**. A manual Reset to BaU convenience button restores the demonstration's input sliders.

**Model-risk boundary:** All amounts, transactions, legal entities, forecast accuracy results, Monte Carlo probabilities, reserve floors and collateral assumptions are fictional. The Monte Carlo stress probability shown is computed by the existing synthetic distribution module under user-selected shock assumptions, not a validated bank probability. Source systems (Azure, Databricks) are reference architecture elements and are not used to serve this browser demo. No transaction execution or external connected systems.

----

# FLOWSTATE — Intraday Liquidity Intelligence Lab

An interactive, client-demonstration **synthetic-data v7 prototype** demonstrating how payment-arrival prediction can inform an intraday liquidity position. The shipped application is a self-contained static frontend running a **real trained Random Forest** through a compact JavaScript decision-tree evaluator.

> **Important:** No Rabobank, PwC, client, private or proprietary data is included. No production model, proprietary bank architecture, client software, or actual bank forecasting performance is reproduced. The product categories, counterparties, payment rails, validations and stress scenarios are illustrative design choices.

## Live page

For a GitHub Pages site published from a repository root, open `/intraday-liquidity-lab/` under its existing GitHub Pages URL. The main application under the repository root is not modified.

## Stack

- **Training:** Python 3, scikit-learn `RandomForestRegressor`, NumPy, Pandas.
- **Source:** 16,500 synthetic USD receipts, including product, counterparty, payment rail, prior settlement behavior, booking time, weekday, amount and market pressure.
- **Validation:** 80% early synthetic days for training, the final 20% for out-of-time validation; train-only product × rail median baseline.
- **Deployment:** Static HTML, CSS, JavaScript. All 32 exported fitted regression trees execute in-browser with no ML inference service or API key. Model file is approx. 1.7MB uncompressed.
- **Architecture diagram:** Azure data and orchestration tools are conceptual enterprise integration options **not used to host this proof of concept**.

## Reproduce training

```bash
cd intraday-liquidity-lab
python -m pip install -r model/requirements.txt
python model/train_model.py
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The training script deterministically rebuilds `model.json`, `model/training_report.json`, and `model/parity_cases.json`.

## Safety and interpretation

Synthetic held-out MAE is ~31.6 minutes vs ~44.2 for a train-fitted rules baseline (~28.5% less absolute error). **These are generator-dependent simulated metrics, not externally validated model results.** No real-world error reduction can be inferred.

The forecast laboratory shows three **simulated** baseline views and a fourth amber line only when a demo action has been explicitly approved. The action overlay does not move money or transmit any payment instruction. The chart shows three **simulated** views of the same payment book: ML forecast, rules forecast, and synthetic realized timestamps. LNNCP is demonstrated as the peak of the cumulative net payment outflow relative to zero; liquidity surplus is this net flow plus an adjustable opening balance. In a real implementation, intraday credit capacity, operational constraints, collateral availability and multiple account/currency considerations must be incorporated.

The Random Forest is a point prediction. Before banking use, validate training data quality, as-of feature availability, tail error and asymmetric timing bias, data drift, model risk governance, payment lifecycle semantics, legal-entity aggregation and scenario definitions. Never infer that a point prediction is a guaranteed inflow.

## v2 risk command centre and governed decision support

A dedicated decision-support layer connects forecast risk signals to three hypothetical response types:

- Mobilise +$500m eligible intraday liquidity (assumes collateral, limit availability and authorization)
- Pace non-time-specific payments by 30 minutes, protecting simulated time-specific obligations
- Stagger large non-critical outgoing flows by up to 45 minutes

The UI calculates the hypothetical impact on minimum buffer surplus, displays assumptions, and requires an explicit **Approve in simulation** button. Approvals and rejections append to a browser-session audit log and can be exported as CSV. There is **no bank integration, financial transaction execution, autonomous agent or server-side persistence**. Changes to the scenario invalidate the previously approved simulation to prevent comparing stale approvals with new conditions.

The model-monitoring panel uses the current synthetic day and compares the unchanged forecast with shifted synthetic realized inflow timestamps. It shows daily MAE, a rules comparator, amount-weighted MAE, 90th percentile absolute error, fraction of overly optimistic predictions, and segment-level errors. A larger adverse settlement shift triggers **illustrative** monitoring alerts. These synthetic thresholds are not calibrated to any bank's risk appetite.

**Segmentation disclaimer:** Repo, FX, securities, money-market, derivatives and client-payment categories were invented for the synthetic generator and do not imply any actual bank model covers these instruments.

## Source documentation note

The design was informed by a general discussion of bank liquidity management technology; it intentionally does **not** embed any client screenshots or private documents in this public repository. *Repo* in software paths means *code repository*, not necessarily repurchase agreement transactions.

## Project structure

- `index.html` — executive landing page and controls.
- `styles.css` — responsive design.
- `app.js` — browser inference, simulated day, liquidity aggregation, live dashboard, controlled action UI and model monitoring.
- `decision-engine.js` — pure, locally testable action scenario calculations, risk signals and synthetic model monitoring.
- `model.json` — exported synthetic fitted Random Forest.
- `model/train_model.py` — deterministic synthetic generator, training, chronological validation, export.
- `model/training_report.json` — test metrics and explicit limitations.
- `model/parity_cases.json` — parity vectors for JavaScript/Python.
- `tests/test_model.js` — browser model parity, curve and sanity tests.
- `tests/test_decision.js` — non-mutation, TSO protection, action impact and monitoring/drift invariants.
- `tests/browser_qa.py` — interactive Chromium tests for desktop and mobile.

## License and sharing

Demonstration code is provided for evaluation. Do not present this as an officially approved bank or firm solution. Public GitHub Pages makes all uploaded assets and model code accessible to anyone with the URL.

## Testing

```bash
node tests/test_model.js
node tests/test_decision.js
python tests/browser_qa.py
```

The browser QA performs scenario changes, payment inspection, explicit demo action approval, audit-log verification, drift review and horizontal overflow checks in desktop and mobile viewports.

## v3 Rabobank-aligned vocabulary and illustrative governance

The user-facing metric has been renamed **Liquidity Surplus**. For this simulation only, `Liquidity Surplus = assumed SoD liquidity position − projected LNNCP`. This is a derived illustrative indicator, **not** a claim that any bank uses this exact report line item or the same calculation. The cited strategy actually uses the expression *headroom* in several places, while the PoC intentionally presents **Liquidity Surplus**.

The UI additionally distinguishes the **Start-of-Day (SoD) liquidity position**, **Largest Negative Net Cumulative Position (LNNCP)**, **business-as-usual (BaU) LNNCP reference**, **stressed LNNCP reference**, and the **80% stressed reference review marker**. All configured amounts are fabricated client-demo assumptions; the 80% governance concept is based on documented strategy wording, and should not be interpreted as implemented production automation.

**Monitoring perspective:** the demo calculates projected intraday positions from incoming and outgoing synthetic USD payments. It does not reconcile to actual payment systems, operational collateral availability, settlement cut-offs, regulatory reporting, or firm-specific RAS parameters. **TSOs / TSPs** are protected as a stylised simulation flag, not identified from real contractual payment classifications.


## v4 Group Treasury Cockpit — customer demonstration

The first section of the landing page is a new original-design, interactive **Group Treasury Cockpit** inspired by general industry needs for real-time forecasting, drill-down, controlled funding decisions and multi-entity transparency. It is **not** an actual EY, SAP Fioneer, PwC or Rabobank deployment, and reuses no proprietary visuals or data.

- **Consolidated and local USD positions.** Every simulated payment has a stable synthetic ID and is assigned to one of three fictional entities. The 15-minute consolidated cash path equals the sum of the entity cash paths at each timestamp. Group projected LNNCP is calculated on the aggregated net payment flow, while each entity has its own SoD liquidity position, independent local LNNCP and minimum Liquidity Surplus. Group projected Liquidity Surplus is not the sum of entity-specific minimum surpluses, because the minima can occur at different times.
- **Actual versus Forecast exceptions.** The chart contrasts the Random Forest timing estimate with fully synthetic realised arrivals. A sortable value-weighted set of illustrative late inflows supports entity and product filters. There are no real payment sources or real-time data feeds.
- **Internal transfer scenario.** A proposed transfer reduces the source entity's future cash positions and increases the destination's at the same assumed settlement time. No money is created: the consolidated Group cash path and Group projected Liquidity Surplus do not change. A conservative capacity check preserves the source's illustrative minimum reserve across all remaining 15-minute periods. Local transfer restrictions and time windows must also pass. Real intragroup transferability requires legal, regulatory, funding and settlement checks not modelled here.
- **Intraday repo scenario.** Additional external USD cash is counted only from the forecast repo settlement time. Funding is limited to the receiving entity's illustrative unencumbered collateral value after a synthetic haircut. A stylised short-horizon funding cost is displayed. No security, encumbrance record, actual repo, haircut schedule or funding rate is accessed.
- **Governed hypothetical approval.** Controls assess both scenarios before enabling `Approve scenario only`. The resulting overlay and decision record are simulated. Changes to scenario or proposal inputs invalidate earlier approvals. No external interfaces, autonomous agent execution, orders, actual funding or payment messages exist.
- **Rule-driven communication panel.** `Forecast Monitor`, `Liquidity Optimiser`, `Control Agent` and `Approval Gate` are explanatory UI roles rather than autonomous agents. Only settlement-time prediction is powered by the trained Random Forest.

### Assumptions and accounting distinctions

All activities are single currency (USD). The Group entity cash curve is the consolidated sum of the same synthetic cash flows; it is **not** evidence that trapped liquidity is fungible or can be moved. `Cash Available for Transfer` is a conservative illustrative sum of entity transfer capacities after chosen local cash reserve floors and transferability flags at noon. It is not the same metric as Group Liquidity Surplus. `Local Liquidity Surplus` is a simplified opening amount minus local LNNCP and can differ across legal entities. The model does not simulate time zones, overlapping intraday credit, collateral substitutions, repo unwind, FX swaps, CLS settlement, legal restrictions or actual Treasury operating procedures.

### Regression tests

```bash
node tests/test_model.js
node tests/test_decision.js
node tests/test_cockpit.js
python tests/browser_qa_v4.py
```

`test_cockpit.js` checks Group vs entity reconciliation, group-neutral transfers, local reserve and cut-off constraints, non-duplicative repo financing after settlement, haircut-adjusted collateral capacity, payment drill-downs and source-data immutability. `browser_qa_v4.py` uses embedded HTML and injected model data because the test environment restricts localhost networking. It checks interactive flows, simulated approvals, scenario invalidation, Javascript errors and horizontal overflow at desktop and mobile viewports.

### v4 new files

- `cockpit-engine.js` — deterministic, separately testable multi-entity liquidity, funding and eligibility calculations.
- `cockpit-ui.js` — Group Cockpit interaction, filtered payment exceptions, action previews, agent-message demonstration, and audit CSV.
- `cockpit.css` — responsive Group Cockpit layout, readouts, charts, entity cards and controls.
- `tests/test_cockpit.js` — core mathematical invariants.
- `tests/browser_qa_v4.py` — desktop and mobile interactive quality assurance.

## Version 5 — Explainable ALM Optimisation Agent (October 2026)

The **Explainable ALM Optimisation Agent** is a deterministic **heuristic decision-support component** running entirely in the browser. It is not a generative LLM, autonomous funding agent, repo dealer, payment instruction, or bank-approved risk model. The Random Forest remains responsible for predicting synthetic incoming USD settlement times. Funding suggestions are calculated separately using explicit liquidity and legal-entity constraints.

### How the v5 recommendations work

1. Select an as-of decision time and maximum of one, two, or three coordinated actions.
2. For each entity, derive a projected forward minimum cash balance and calculate any shortfall **relative to that entity's illustrative minimum reserve**, using 15-minute forecast buckets from the selected decision time until 19:00.
3. Generate internal transfer and collateralised repo candidates only for entities with an uncovered local reserve gap. Transfer origin must be approved in synthetic reference data and retain its minimum projected local reserve for the entire remaining day. Repo must fall in the 12:00–16:00 illustrative settlement window and stay under haircut-adjusted collateral capacity **aggregated across plan steps**.
4. Recompute **all** affected entity cash curves and consolidated Group cash. An internal transfer moves liquidity without increasing Group cash; synthetic external repo funding increases Group cash only at its assumed settlement time.
5. Use a bounded **beam-search heuristic** (up to three actions) to rank admissible plans primarily by remaining local peak-reserve gaps, then projected deficit-hours, indicative funding cost, and operational action count. This heuristic is *not* a mathematical guarantee of global optimality.
6. Explain each selected plan with proposed settlement times, amounts, before/after uncovered local reserve gaps, cost assumptions, and failed or passed control tests. A human can approve or reject **a simulation**. No transaction, broker request, collateral pledge, or intercompany instruction occurs.

### Cost conventions and risk boundaries

- Internal transfer indicative cost: USD 1,000 fixed plus 0.001% of transferred notional.
- Synthetic intraday repo indicative cost: 5.25% annualised for one 360-day period plus USD 4,000 processing fee.
- Decision-time and settlement-window assumptions are illustrative. The browser uses a stylised time base; no live FX, reference rates, market depth, bank holidays, correspondent cut-offs, sanctions screening, governance approvals or legal advice is obtained.
- Uncovered reserve gaps measure *local* position against synthetic minimum reserves; this is **not equivalent to regulatory liquidity shortfall, Group LNNCP, stress loss or the official Rabobank liquidity buffer calculation**.
- The plan search does not have a complete production optimisation model, such as full multi-currency and central-bank collateral eligibility, transfer pricing, repo settlement risk, asset encumbrance, contingent funding actions, TSO lifecycle processing, counterparty limits, or payment queuing.
- Where the available plan set cannot eliminate the reserve gap, the UI states the residual explicitly rather than asserting full coverage.
- An approval remains strictly **human-in-the-loop, simulation only**; changing scenario inputs invalidates any earlier approval in this component.

### Model and UI testing

```bash
node tests/test_model.js
node tests/test_decision.js
node tests/test_cockpit.js
node tests/test_optimiser.js
python tests/browser_qa_v5.py
```

The synthetic regression tests cover group/entity cash conservation, transfer neutrality, no retroactive funding, transferability restrictions, projected reserve floors, aggregate collateral haircuts, settlement timing, fallback recommendations and controls against mutating synthetic payment source data. Desktop and mobile browser tests also verify plan selection, approval, rejection, invalidation, chart overlay, and absence of page overflow or JavaScript errors.


## v6 — Payment Explainability and BaU / Stressed Diagnostics

This iteration introduces a self-contained `diagnostics-engine.js` with pure calculations and a responsive `diagnostics-ui.js` panel. It keeps the v5 Optimisation Agent and its approval/eligibility controls intact.

- **Synthetic BaU and Stress comparison:** The BaU scenario uses zero cash-flow shifts and the configured SoD liquidity position. The stress scenario uses an explicitly selected inflow timing delay, outflow acceleration and haircut to available SoD liquidity sources. Compare Group and entity LNNCP, Liquidity Surplus and entity-level reserve gaps. It is **not** the methodology or calibrated IST scenario of any bank.
- **Synthetic cash-flow decomposition:** The largest actual-versus-forecast cumulative position discrepancy is decomposed by product. The exact signed difference for the full book equals the sum of product contributions at the chosen time bucket. This is a *cash-flow attribution*, not a causal explanation of risk or a model's feature importance.
- **Transaction-level RF sensitivity:** Clicking a payment ID in the cockpit or selecting an inflow from the v6 panel runs the **trained 54-tree Random Forest**. One-variable-at-a-time counterfactual inputs reveal changes in the estimated booking-to-settlement lag. This is *not* SHAP, causal inference, model confidence, or independent validation. Some alternative feature combinations may be economically invalid.
- **Group → Entity → Payment:** Clicking entity cards filters the transaction inspector; selecting one payment opens a linked explanation and product drivers. Entity restrictions are preserved.
- **No autonomous operations:** v6 does not initiate bank transfers, repo deals, payments, changes to model parameters or external API calls.

### v6 regression checks

```bash
node tests/test_diagnostics.js
python tests/browser_qa_v6.py
```

`test_diagnostics.js` checks BaU and stressed calculations against the existing Group position, Group/Entity liquidity conservation, exact gap-driver reconciliation, Random Forest prediction identity and source-data immutability. The browser test covers desktop and mobile, payment selection, entity drill-down, scenario changes, optimiser preservation, overflow and Javascript exceptions.

The model and every hypothetical instrument, transaction and counterparty are **fully synthetic**. These materials must not be described as confirmed Rabobank data, bank-calibrated stress assumptions or observed portfolio-level model feature importances.

## Version 7 — Settlement confidence & conservative cut-off scenario (October 2026)

The v7 **Settlement Confidence** panel answers an illustrative operational question: *What fraction of comparable synthetic incoming USD payments would be expected to arrive before a specified payment cut-off?* It supplements (but does not replace) the existing Random Forest settlement-time point forecast.

### Calibration method and validation separation

- The **existing 32-tree RandomForestRegressor remains unchanged**; it was fitted to synthetic days 0–139. It does not directly output calibrated settlement probabilities.
- A reproducible script, `model/build_calibration.py`, applies the exported trained forest to later synthetic days 140–157, then saves sorted realised-minus-predicted timing residuals by product (`model-calibration.json`). These calibration observations were not used to train the forest.
- A still-later holdout, days 158–175, evaluates the interval and probabilities with *no reuse* of those evaluation outcomes in calibration. The nominal P10–P90 range contains the synthetic realised times for **78.1%** of those 1,670 evaluation payments. A set of predefined synthetic relative cut-off tests yields a Brier score of **0.1335**. These figures are synthetic-generator-dependent.
- **Probability at cut-off** is calculated from the empirical CDF of residuals associated with the payment product, conditional on the model point forecast, booking time and chosen cut-off. Simple rank smoothing avoids claiming certainty at the observed tails. The residual sample size is visible to the user. The instrument categories (including repo) are invented, not actual bank model coverage.
- The expected amount *not received by a cut-off* is `payment_amount × (1 − P(on time))`. This is a probability-weighted single-payment exposure indicator, **not** a liquidity buffer, group-wide expected shortfall, standalone risk capital measure or guaranteed cash position.

### Governed decision support

The P90 what-if substitutes a **single payment's** forecast timestamp with its conservative upper settlement-time prediction. After explicitly selecting "Apply P90 timing to Treasury scenario", the model recalculates the synthetic 15-minute Group/Entity liquidity curves, Group LNNCP, Liquidity Surplus, and ranked Treasury Optimisation Agent responses. Old approvals are invalidated when the payment timing changes. The "Restore original payment forecast" button reverses the what-if. No payment instructions or repo transactions are executed.

**Restrictions:** P90 scenarios beyond the 19:00 demo horizon are blocked because the current model does not correctly represent overnight carryover. A 70% indicative review threshold is an original demo setting, **not** a Rabobank or PwC policy. Residual distributions pooled only by product ignore other heterogeneity, correlated inflows, market regime shifts, tail concentration, missingness and legal-entity settlement constraints. These are neither official bank estimates nor calibrated probabilities on real payments.

### New files

- `model/build_calibration.py` — replays original deterministic synthetic feature generator and existing exported forest, builds separate calibration and evaluation cohorts.
- `model-calibration.json` — portable product-conditional synthetic residual arrays, plus holdout metrics and limitations.
- `model/calibration_report.json` — validation summary.
- `confidence-engine.js` — pure functions for calibration quantiles, on-time probability, expected unreceived cash and payment-level Group/Entity LNNCP sensitivity.
- `confidence-ui.js` and `confidence.css` — cut-off selection, payment selection, P10–P90 range and the explicit P90 risk scenario flow.
- `tests/test_confidence.js` and `tests/browser_qa_v7.py` — mathematical/regression and desktop/mobile interactive verification.

To reproduce the synthetic calibration:

```bash
python model/build_calibration.py
node tests/test_confidence.js
python tests/browser_qa_v7.py
```

## Version 8 — Group liquidity-at-risk distribution (October 2026)

The `Liquidity-at-Risk` panel provides a **synthetic Monte Carlo scenario analysis** of expected incoming USD payment timing. It extends the single-transaction v7 cut-off probability to a distribution of Group and legal-entity liquidity positions. It must **not** be presented as a statistically validated credit, operational or market risk model.

### Calculation methodology

- Starting data are the existing, fully invented USD payment book generated from the exported 32-tree `RandomForestRegressor` and assigned to three illustrative legal entities. The existing forecast point estimates are not retrained or overwritten.
- Each Monte Carlo scenario draws **one historic residual per incoming payment** from the saved, separately calibrated product-specific synthetic residual distribution (`model-calibration.json`). These are marginal draws. Their real-world correlation structure is unknown.
- An optional **common payment-system delay** affects all inflows in a scenario. Its probability and delay in minutes are user-defined, synthetic assumptions; they are not learned from transaction data. The same residual and shock draws are used to compare BaU and Stress, ensuring like-for-like scenario comparisons.
- Stress additionally delays incoming cash, accelerates outgoing cash and reduces *Start-of-Day Liquidity Position* by an assumed haircut. Baseline `delay`, `accel` and `opening` controls in the existing Forecast Laboratory are inherited. All stress parameters are illustrative.
- Cash flows are allocated into 15-minute buckets (07:30–19:00). **Inflow forecast after 19:00 is excluded from the same-day liquidity position**, avoiding a misleading end-of-session clamp. Overnight state, cross-day funding, and carryover balances are not modelled.
- For each scenario and legal entity, the model calculates the running cumulative cash position, minimum cash position, Group LNNCP (largest negative *net cumulative* position) and Liquidity Surplus = SoD Liquidity Position − LNNCP. Local shortfalls use the existing artificial reserve floors; the assumed Group floor is the sum of those local floors and **not an official legal or regulatory limit**.
- The simulated 10th, 50th and 90th percentiles and scenario frequencies are descriptive of *the specified generator and assumptions*, not external probability statements. `P10 Group Liquidity Surplus` and `P90 Group LNNCP` refer to quantiles over simulated **peak daily outcomes**, which are different from the pointwise fan chart P10–P90 at every time bucket.
- `P(any entity reserve breach)` is not interchangeable with `P(Group liquidity shortfall)` because subsidiary liquidity is not automatically fungible. Simulated intercompany transfer permissions and repo funding remain part of the existing separate, manual-gate Optimisation Agent. Its plans are **not automatically executed** or assumed when calculating the distribution.

### Controls, reproducibility, and limits

- The model's random stream uses a deterministic fixed seed, enabling repeated identical results for the same input settings. The simulation runs entirely in-browser; no payment file, real-time liquidity feed, market-data API or financial infrastructure is contacted.
- Both BaU and Stress use the same residual draws. The current joint scenario construction is **not empirically calibrated**: per-product residual samples are drawn independently and a single user-defined shared shock is the only dependence mechanism.
- The probabilities omit correlated counterparty defaults, simultaneous funding constraints, cash-flow forecasting biases, time-zone mismatches, currency conversion, FX swap settlement risk, collateral liquidity and intraday credit-limit variability.
- This is a **decision-support illustration**, not bank-specific risk appetite, Basel regulatory reporting, an official Liquidity Stress Test or production-grade forecast. The stress confidence bands have no demonstrated coverage on real bank data.

### Regression checks

```bash
node tests/test_distribution.js
python tests/browser_qa_v8.py
```

`test_distribution.js` verifies seed reproducibility, correct settled-bucket accounting, monotonic deterioration under stronger stress, reserve-breach probabilities, strict same-day treatment of after-19:00 inflows, calibration validation, and the resulting Group cash conservation checks. The browser QA runs 1440px desktop and 390px mobile tests, scenario slider sensitivity and reset, entity drill-down, preserved optimiser, and P90 payment what-if event compatibility. Prior v1–v7 calculation and browser tests remain available.

## FLOWSTATE v9 — Risk-Aware ALM Optimisation Agent (22 October 2026)

**Client purpose:** Demonstrate the end-to-end (synthetic) workflow **Forecast → Quantify Risk → Compare Funding Options → Reduce Risk → Human Approval** without connecting to bank payment, collateral or treasury execution infrastructure.

### Implementation and mathematical scope

- `risk-plan-engine.js` evaluates a finite list of funding candidate plans on **identical Monte Carlo payment-timing draws**. It uses the same synthetic historical forecast residuals, random seed, payment-system-shock assumptions, additional stress delay, outgoing-payment acceleration and haircut as the existing Liquidity-at-Risk panel (v8). Results are scenario-implied frequencies rather than calibrated probabilities of real bank events.
- Shortlist generation uses `OptimiserEngine.optimise` for both BaU and an additional deterministic stress state, retaining at most 11 candidate plans plus an explicit **no-action baseline**. The search is heuristic and not guaranteed optimal. Each candidate is rechecked using the existing deterministic legal-entity, repo/collateral, settlement window and local reserve controls.
- For each paired scenario and each plan, cash is simulated in 15-minute intraday buckets from 07:30 to 19:00. Incoming payments past 19:00 are **not** booked as intraday receipts. Internal transfers debit their source and credit their destination simultaneously, leaving consolidated Group cash unchanged. Intraday repo provides a settlement-time cash inflow to its receiving entity. **Repo repayment at maturity is not implemented**, and the opening balance has not been decomposed sufficiently to exclude every possible collateral double-counting. These are material limitations for real-world decision-making.
- Risk metrics are computed **from the decision time onward**. The principal KPI is `P(any legal entity falls below its assumed local reserve floor)`. Secondary metrics are `P(Group falls below illustrative sum of entity reserve floors)`, `P(Group cash below zero)`, mean sum of **entity-level peak shortfalls**, mean shortfall-hours and Group Liquidity Surplus P10. Local reserve breach is not a default or regulatory LCR breach.
- Candidate recommendations can be ranked by legal-entity breach frequency, Group reserve breach frequency or severity of local peak gaps. Independent entity-level breach frequencies are displayed; a plan shifting probability of breach to another legal entity is flagged as **Entity Risk Transfer** and blocked from simulated approval, even if an aggregate metric improves. A plan that passes deterministic source constraints may nonetheless fail probabilistic stress testing.
- Explicit user-driven approval or rejection is logged in browser memory only. Changing payment data, stress assumptions, planning time or ranking priority invalidates a previous approval. A CSV audit export contains synthetic decisions; **no payment, market instruction or funding transfer is ever executed**.

### Scripts and QA

```bash
node tests/test_risk_plan.js
python tests/browser_qa_v9.py
```

All model inputs, counterparty groups, product labels, financial prices, settlement times, probabilities and action amounts are fabricated, unless explicitly identified as generic risk-management concepts. The tool does **not** recreate a proprietary bank system, does not verify the real Random Forest model at any bank, and has not been validated for investment, regulatory or intraday liquidity management decisions.


## FLOWSTATE v10 — Collateral & Funding Lifecycle (22 October 2026)

**New, client-demo-only components:** `funding-lifecycle-engine.js`, `funding-lifecycle-ui.js`, and `funding-lifecycle.css`. These add a dedicated, editable funding scenario panel to the existing Group Treasury Cockpit and a settlement-time-aware cash and collateral ledger. `risk-plan-engine.js` also consumes this lifecycle engine for Monte Carlo plan comparison; its new **Repo repayment horizon** control toggles the effect of same-day principal-and-interest repayments versus next-business-day obligations. Earlier controls and dashboards remain available.

**Synthetic operating rules, not assertions about any actual bank**

- Market repo: illustrative 12:00–16:00 settlement window. Example repo financing rate 5.25% annualised, simple ACT/360 proxy. Repo is backed by an assumed pool of unencumbered eligible collateral with an entity-specific haircut.
- Central-bank intraday facility: illustrative 09:30–15:30 settlement window, 30-minute pre-positioning lead time and 18:30 repayment cut-off. An invented subset of each entity's collateral pool is central-bank-eligible (70%) and subject to an additional 7 percentage-point haircut, synthetic credit limit and 6.10% annualised illustrative rate. An international entity is deliberately restricted to show a failed control check.
- An action can settle only at 15-minute intervals and cannot occur before the selected decision time. For same-day financing the principal plus interest leaves the account on the indicated repayment date and releases the pledged collateral at that minute. For overnight repo repayment and collateral release are explicitly recorded as **T+1 obligations** outside the current-day cash curve.
- The collateral ledger reserves the **market value** of assets needed after haircut (cash ÷ (1−haircut)). Simultaneous pledges cannot exceed the asset pool. A second draw can reuse collateral only once an earlier draw is fully repaid. Cross-venue encumbrance is constrained against the shared pool and central-bank-eligible subset.
- Internal cash transfers remain zero-sum for Group liquidity and must preserve the source entity's remaining-day projected local reserve under the base case.
- The timing-dependent Monte Carlo comparison uses the lifecycle engine's positive settlement entries and **negative same-day repayments**, not the old simplified permanent repo inflow. The `risk-plan` shortlist is still generated heuristically; it is not a stochastic optimisation solution or a validated management action policy.

**Known limitations:** No security-level collateral identifiers, settlement fails, margin calls, margining frequency, counterparties' actual repo terms, interest accrual calendars, market repo availability, central-bank eligibility decisions, asset price movements, collateral substitution risk, next-day cash simulations, legal ring-fencing analysis, netting treatment or liquidity transfer restrictions based on real agreements. The central-bank facility and all quantitative haircut, rate, pool and time-window parameters are fabricated. Do **not** infer these rules from Rabobank documents. Approvals and CSV audit logs remain browser-session simulations and do not cause external transactions. Overnight repayment obligations are disclosed but not simulated as cash outflows on a full next-day timeline.

**Verification:**

```bash
node tests/test_funding_lifecycle.js
python tests/browser_qa_v10.py
```

The test set checks no cross-venue double pledge, release/re-pledge sequencing, next-day debt, same-day principal-and-interest cash flows, Group cash neutrality of internal transfers, funding cut-offs, central-bank lead time and permissions, Monte Carlo tenor sensitivity, and responsive desktop/mobile browser interactions. The original trained Random Forest remains unchanged (32 trees) and is fitted only to invented transactions.

## FLOWSTATE 11.1 — Client Studio & stabilisation (22 Oct 2026)

This is a synthetic-only, browser-hosted research prototype. **Nothing here is bank-calibrated, client-audited, executable funding, or verified cost saving.**

### Changes
- New shared `cashflow-engine.js` ensures any flow after the 19:00 demo session is **not** moved artificially to 19:00. It is listed as `unsettled_inflows` or `unsettled_outflows`; cross-day carryover is not modelled. Both `app.curveFor` and `CockpitEngine.timeline` now use the same function. `ConfidenceEngine` simulates an outside-session delayed cash flow without clipping it at the closing cut-off (but P90 application outside the session is still disabled in the UI).
- New Client Studio with three audience journeys (Executive, Treasury Operations, Model & Risk Analytics) and three reproducible demo scenarios (BaU, delayed USD receipts, combined stress). This is navigation and focus, not an access-permission scheme.
- Before/After section runs **FundingLifecycleEngine** in one legal entity for an eligible hypothetical $10–150m repo, disclosing settlement timing, same-day repayment or overnight T+1 debt, illustrative financing cost, available collateral and simulated local reserve gap. **Local reserve-gap reduction is not monetised as avoided cost.** It is not possible to determine bank cost savings, capital impact, liquidity buffer release or ROI from the synthetic dataset.
- Model risk view distinguishes the actual synthetic holdout from a regenerated scenario day, shows asymmetric forecast errors and impurity-based feature concentration, and now includes a **Gradient Boosting challenger**, a no-historical-delay feature ablation and +60 min synthetic regime shift. Both original model and challenger results are generator-dependent, not independent production validation. See `model/challenger_report.json` generated by `model/challenger_validation.py`.
- Enterprise target architecture spells out potential bank data ingestion, point-in-time feature store, Azure/Databricks option, registry, payment and collateral feeds, risk calculations, role-based controls, human approval, and audit. **These layers are proposed and not implemented in this browser app.**

### Validation and remaining blockers
- `node tests/test_client_studio.js` checks the end-of-session no-credit invariant, Group/core equality, repo tenor and eligibility, probability shock outside session, and unchanged synthetic model evidence.
- `python tests/browser_qa_v11_1.py` executes all real browser scripts against inline static files with correctly mapped synthetic data in Chromium desktop and 390px mobile. This test avoids network access. The published GitHub Pages deployment is not covered by this local test.
- Pre-existing code contains separate approval state and in-memory audit logs across modules. **A unified immutable decision ledger, central scenario store, real-time data services, authentication and production controls have NOT been implemented.** No user should treat the demo approval as bank authorization.
- All rates, collateral pools, haircut parameters, eligible entities and cut-off windows are invented and may be financially or legally inapplicable to a real institution.
- Training's `historical_median_delay` dominates impurity-based feature importance. The synthetic generator deliberately produces this predictor independently of the specific target, but source/availability and possible point-in-time leakage are unknown for real bank data.

### Local validation
```bash
for f in tests/test_*.js; do node "$f"; done
(cd model && python challenger_validation.py)
python tests/browser_qa_v11_1.py
```