# FLOWSTATE — Intraday Liquidity Intelligence Lab

An interactive, client-ready **synthetic-data v4 prototype** demonstrating how payment-arrival prediction can inform an intraday liquidity position. The shipped application is a self-contained static frontend running a **real trained Random Forest** through a compact JavaScript decision-tree evaluator.

> **Important:** No Rabobank, PwC, client, private or proprietary data is included. No production model, proprietary bank architecture, client software, or actual bank forecasting performance is reproduced. The product categories, counterparties, payment rails, validations and stress scenarios are illustrative design choices.

## Live page

For a GitHub Pages site published from a repository root, open `/intraday-liquidity-lab/` under its existing GitHub Pages URL. The main application under the repository root is not modified.

## Stack

- **Training:** Python 3, scikit-learn `RandomForestRegressor`, NumPy, Pandas.
- **Source:** 16,500 synthetic USD receipts, including product, counterparty, payment rail, prior settlement behavior, booking time, weekday, amount and market pressure.
- **Validation:** 80% early synthetic days for training, the final 20% for out-of-time validation; train-only product × rail median baseline.
- **Deployment:** Static HTML, CSS, JavaScript. All 54 exported fitted regression trees execute in-browser with no ML inference service or API key. Model file is approx. 1.7MB uncompressed.
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