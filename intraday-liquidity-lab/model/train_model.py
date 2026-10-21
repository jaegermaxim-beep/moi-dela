"""Reproducible, fully synthetic USD settlement-time benchmark.

No customer, bank, or proprietary data is used. This is an educational demo,
not a claim that any bank uses the implementation or feature set.
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ["Repo", "FX", "Client payment", "Securities", "Money market", "Derivatives"]
RAILS = ["SWIFT", "Fedwire", "CLS", "Correspondent"]
COUNTERPARTIES = ["Counterparty A", "Counterparty B", "Counterparty C", "Counterparty D", "Counterparty E", "Counterparty F"]
BASE = np.array([98, 142, 80, 178, 105, 152.], dtype=float)
COUNTERPARTY_SHIFTS = np.array([-26, 5, 36, -10, 27, -34.])
RAIL_SHIFTS = np.array([20., -28., -5., 33.])
SEED = 20261021
N = 16500
N_DAYS = 176


def one_hot(features:dict, name:str, values:list[str]) -> list[float]:
    return [float(features[name] == val) for val in values]


def feature_vector(features: dict) -> list[float]:
    return [
        float(features["booking_minute"]),
        float(np.log10(max(0.1, features["amount_musd"]))),
        float(features["weekday"]),
        float(features["pressure"]),
        float(features["historical_median_delay"]),
        *one_hot(features, "product", PRODUCTS),
        *one_hot(features, "rail", RAILS),
        *one_hot(features, "counterparty", COUNTERPARTIES),
    ]


FEATURE_NAMES = ["booking_minute", "log10_amount_musd", "weekday", "market_pressure", "historical_median_delay"] \
    + [f"product::{v}" for v in PRODUCTS] \
    + [f"rail::{v}" for v in RAILS] \
    + [f"counterparty::{v}" for v in COUNTERPARTIES]


def synthesize(n=N, seed=SEED):
    rng = np.random.default_rng(seed)
    day = rng.integers(0, N_DAYS, n)
    weekdays = day % 5
    # Created and sorted chronologically to support an honest time-based split.
    product_i = rng.choice(len(PRODUCTS), n, p=[.22, .20, .26, .11, .13, .08])
    counterparty_i = rng.integers(len(COUNTERPARTIES), size=n)
    rail_i = rng.choice(len(RAILS), n, p=[.38, .34, .10, .18])
    booking = rng.integers(475, 925, size=n)  # 07:55 to 15:25 NY-local demo clock
    amount = np.exp(rng.normal(np.log(12), 1.15, n)).clip(.1, 380.)
    pressure = (0.45 + .55 * (np.sin(day / 9.) + 1) / 2 + rng.normal(0,.20,n)).clip(0,1.8)
    # This historical feature mimics a reference statistic available BEFORE a payment.
    # It deliberately does not read the current payment label or future settlements.
    hist = (BASE[product_i] + COUNTERPARTY_SHIFTS[counterparty_i] + RAIL_SHIFTS[rail_i] + rng.normal(0,11,n)).clip(25,300)
    booking_pulse = np.where(booking>790, 25,0) + np.where(booking<550, -8,0)
    interaction = np.where((product_i==0)&(rail_i==1), -12., 0.)
    delay = (
       .54 * hist + .46 * BASE[product_i] + .7 * COUNTERPARTY_SHIFTS[counterparty_i]
       + .66 * RAIL_SHIFTS[rail_i]
       + 22 * np.log10(amount+1) + 35 * pressure + booking_pulse
       + 5 * weekdays + interaction
       + rng.normal(0, 34, n) + (rng.random(n)<.06)*rng.gamma(2.5,28.,n)
    ).clip(12,480)
    rows = []
    for k in range(n):
        rows.append({"day":int(day[k]), "weekday":int(weekdays[k]), "product":PRODUCTS[product_i[k]],
                    "rail":RAILS[rail_i[k]], "counterparty":COUNTERPARTIES[counterparty_i[k]],
                    "booking_minute":int(booking[k]), "amount_musd":round(float(amount[k]),5),
                    "pressure":round(float(pressure[k]),5), "historical_median_delay":round(float(hist[k]),4),
                    "actual_delay":round(float(delay[k]),4)})
    return pd.DataFrame(rows).sort_values(['day','booking_minute']).reset_index(drop=True)


def fit_and_export():
    df=synthesize()
    cutoff=int(N_DAYS*.8)
    tr=df.day<cutoff; te=~tr
    xtr=np.stack([feature_vector(r) for r in df[tr].to_dict('records')])
    xte=np.stack([feature_vector(r) for r in df[te].to_dict('records')])
    ytr=df.loc[tr,'actual_delay'].to_numpy(); yte=df.loc[te,'actual_delay'].to_numpy()
    model=RandomForestRegressor(n_estimators=32,max_depth=8,min_samples_leaf=12,
                                n_jobs=-1,random_state=11,max_features=.83)
    model.fit(xtr,ytr)
    pred=model.predict(xte)
    # Baseline is a train-period-only grouped median for product/rail, with global fallback.
    med=df[tr].groupby(['product','rail'])['actual_delay'].median()
    base=df[te].apply(lambda r: float(med.get((r['product'],r['rail']),np.median(ytr))),axis=1).to_numpy()
    metrics={
        "dataset":"100% synthetic, not bank or customer data", "seed":SEED,
        "records_total":int(len(df)),"train_records":int(tr.sum()),"test_records":int(te.sum()),
        "train_day_cutoff":cutoff,
        "forest_mae_min":float(mean_absolute_error(yte,pred)),
        "baseline_mae_min":float(mean_absolute_error(yte,base)),
        "forest_rmse_min":float(np.sqrt(mean_squared_error(yte,pred))),
        "baseline_rmse_min":float(np.sqrt(mean_squared_error(yte,base))),
        "r2_holdout":float(r2_score(yte,pred)),
        "mae_improvement_pct":float(100*(1-mean_absolute_error(yte,pred)/mean_absolute_error(yte,base))),
        "optimistic_error_rate":float(np.mean(pred<yte)),
        "optimistic_error_mae_min":float(np.mean(np.maximum(0,yte-pred))),
        "feature_importance":sorted([{"name":k,"importance":float(v)} for k,v in zip(FEATURE_NAMES,model.feature_importances_)], key=lambda a:-a['importance'])[:12],
        "split_policy":"Chronological 80% train / 20% test by synthetic day. The baseline medians are fit using train days only.",
        "limitations":["No real transactional timestamps or payment network observations", "No production calibration, compliance, or predictive accuracy claims", "Point estimate only: no probabilistic arrival confidence", "Client-side in-browser model is demonstrative only"]
    }
    trees=[]
    for est in model.estimators_:
        t=est.tree_
        trees.append({"l":t.children_left.tolist(),"r":t.children_right.tolist(),
                      "f":t.feature.tolist(),"t":np.round(t.threshold,6).tolist(),
                      "v":np.round(t.value[:,0,0],5).tolist()})
    exported={"version":"1.0","kind":"sklearn.RandomForestRegressor","trained_on":"synthetic USD settlements only",
              "feature_names":FEATURE_NAMES,"products":PRODUCTS,"rails":RAILS,"counterparties":COUNTERPARTIES,
              "trees":trees,
              "baseline_medians":{f"{a}::{b}":round(float(c),5) for (a,b),c in med.items()},
              "global_baseline":float(np.median(ytr)),"metrics":metrics}
    with open(ROOT/'model.json','w') as f:json.dump(exported,f,separators=(',',':'))
    with open(ROOT/'model'/'training_report.json','w') as f:json.dump(metrics,f,indent=2)
    # Small subset for parity and schema tests, explicitly synthetic.
    examples=[]
    for r in df[te].iloc[[4,50,100,200,600,900]].to_dict('records'):
        x=feature_vector(r)
        examples.append({"inputs":{k:r[k] for k in ['weekday','product','rail','counterparty','booking_minute','amount_musd','pressure','historical_median_delay']},
                         "expected_delay":round(float(model.predict(np.array(x).reshape(1,-1))[0]),5)})
    with open(ROOT/'model'/'parity_cases.json','w') as f:json.dump(examples,f,indent=2)
    print(json.dumps(metrics,indent=2))
    print('Export bytes', (ROOT/'model.json').stat().st_size)

if __name__=='__main__':fit_and_export()
