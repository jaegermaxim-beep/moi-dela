# FLOWSTATE — Intraday Liquidity Intelligence Lab

An interactive, client-ready **synthetic-data v2 prototype** demonstrating how payment-arrival prediction can inform an intraday liquidity position. The shipped application is a self-contained static frontend running a **real trained Random Forest** through a compact JavaScript decision-tree evaluator.

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

The dashboard shows three **simulated** baseline views and a fourth amber line only when a demo action has been explicitly approved. The action overlay does not move money or transmit any payment instruction. The chart shows three **simulated** views of the same payment book: ML forecast, rules forecast, and synthetic realized timestamps. LNNCP is demonstrated as the peak of the cumulative net payment outflow relative to zero; liquidity surplus is this net flow plus an adjustable opening balance. In a real implementation, intraday credit capacity, operational constraints, collateral availability and multiple account/currency considerations must be incorporated.

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
