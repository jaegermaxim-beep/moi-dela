# FLOWSTATE — Intraday Liquidity Intelligence Lab

An interactive, client-ready **synthetic-data prototype** demonstrating how payment-arrival prediction can inform an intraday liquidity position. The shipped application is a self-contained static frontend running a **real trained Random Forest** through a compact JavaScript decision-tree evaluator.

> **Important:** No Rabobank, PwC, client, private or proprietary data is included. No production model, proprietary bank architecture, client software, or actual bank forecasting performance is reproduced. The product categories, counterparties, payment rails, validations and stress scenarios are illustrative design choices.

## Live page

For a GitHub Pages site published from a repository root, open `/intraday-liquidity-lab/` under its existing GitHub Pages URL. The main application under the repository root is not modified.

## Stack

- **Training:** Python 3, scikit-learn `RandomForestRegressor`, NumPy, Pandas.
- **Source:** 16,500 synthetic USD receipts, including product, counterparty, payment rail, prior settlement behavior, booking time, weekday, amount and market pressure.
- **Validation:** 80% early synthetic days for training, the final 20% for out-of-time validation; train-only product × rail median baseline.
- **Deployment:** Static HTML, CSS, JavaScript. All 32 exported fitted regression trees execute in-browser with no ML inference service or API key. Model file is approx. 0.31MB uncompressed and 0.15MB packed.
- **Architecture diagram:** Azure data and orchestration tools are conceptual enterprise integration options **not used to host this proof of concept**.

## Reproduce training

```bash
cd intraday-liquidity-lab
python -m pip install -r model/requirements.txt
python model/train_model.py
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The training script deterministically rebuilds `model.json`, `model-packed.json`, `model/training_report.json`, and `model/parity_cases.json`.

## Safety and interpretation

Synthetic held-out MAE is ~31.6 minutes vs ~44.2 for a train-fitted rules baseline (~28.4% less absolute error). **These are generator-dependent simulated metrics, not externally validated model results.** No real-world error reduction can be inferred.

The chart shows three **simulated** views of the same payment book: ML forecast, rules forecast, and synthetic realized timestamps. LNNCP is demonstrated as the peak of the cumulative net payment outflow relative to zero; opening buffer headroom is this net flow plus an adjustable opening balance. In a real implementation, intraday credit capacity, operational constraints, collateral availability and multiple account/currency considerations must be incorporated.

The Random Forest is a point prediction. Before banking use, validate training data quality, as-of feature availability, tail error and asymmetric timing bias, data drift, model risk governance, payment lifecycle semantics, legal-entity aggregation and scenario definitions. Never infer that a point prediction is a guaranteed inflow.

## Source documentation note

The design was informed by a general discussion of bank liquidity management technology; it intentionally does **not** embed any client screenshots or private documents in this public repository. *Repo* in software paths means *code repository*, not necessarily repurchase agreement transactions.

## Project structure

- `index.html` — executive landing page and controls.
- `styles.css` — responsive design.
- `app.js` — browser inference, simulated day, liquidity aggregation, and UI.
- `model.json` — exported uncompressed Random Forest used for testing and offline inspection.
- `model-packed.json` — compressed, base64-encoded fitted Random Forest consumed by the web frontend.
- `model/train_model.py` — deterministic synthetic generator, training, chronological validation, export.
- `model/training_report.json` — test metrics and explicit limitations.
- `model/parity_cases.json` — parity vectors for JavaScript/Python.
- `tests/test_model.js` — browser model parity, curve and sanity tests.

## License and sharing

Demonstration code is provided for evaluation. Do not present this as an officially approved bank or firm solution. Public GitHub Pages makes all uploaded assets and model code accessible to anyone with the URL.
