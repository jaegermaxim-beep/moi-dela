"""Build honest out-of-time synthetic residual calibration for existing exported Random Forest.

Existing RF is trained only on days < 140. Reserve days 140–157 for calibration,
days 158–175 for calibration diagnostics. No labels from held-out evaluation
enter the calibration file; no production coverage claims.
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from train_model import synthesize, feature_vector, PRODUCTS

ROOT = Path(__file__).resolve().parents[1]
MODEL = json.loads((ROOT/'model.json').read_text())
CAL_START = 140
EVAL_START = 158


def predict_exported(rows):
    x = np.array([feature_vector(r) for r in rows], dtype=float)
    out = np.zeros(len(x))
    for tree in MODEL['trees']:
        features=np.asarray(tree['f']); thresholds=np.asarray(tree['t']); left=np.asarray(tree['l']); right=np.asarray(tree['r']); values=np.asarray(tree['v'])
        node=np.zeros(len(x),dtype=int)
        for _ in range(32):
            mask=features[node]>=0
            if not mask.any():break
            select=np.flatnonzero(mask)
            idx=node[select]
            node[select]=np.where(x[select,features[idx]]<=thresholds[idx],left[idx],right[idx])
        else:raise RuntimeError('Exceeded maximum tree depth')
        out+=values[node]
    return out/len(MODEL['trees'])


def quantile(values,q):return float(np.quantile(np.asarray(values),q))

def probability(residuals,delta):
    a=np.sort(np.asarray(residuals))
    # Bayesian-style smoothing prevents misleading hard 0/100% at observed tails.
    return (np.searchsorted(a,delta,side='right')+.5)/(len(a)+1)


def build():
    df=synthesize()
    calibrate=df[(df.day>=CAL_START)&(df.day<EVAL_START)].copy()
    evaluate=df[df.day>=EVAL_START].copy()
    assert MODEL['metrics']['train_day_cutoff']<=CAL_START
    calib_rows=calibrate.to_dict('records')
    eval_rows=evaluate.to_dict('records')
    cpred=predict_exported(calib_rows)
    epred=predict_exported(eval_rows)
    cr=calibrate.actual_delay.to_numpy()-cpred
    er=evaluate.actual_delay.to_numpy()-epred
    subsets={}
    for product in PRODUCTS:
        ix=calibrate['product'].to_numpy()==product
        residuals=np.sort(np.round(cr[ix],4))
        assert len(residuals)>50
        subsets[product]=[float(v) for v in residuals]
    byprod={p:np.array(vals) for p,vals in subsets.items()}
    intervals=[]; briers=[]; band_count=[0]*10;band_hits=[0]*10
    for i,row in enumerate(eval_rows):
        group=byprod[row['product']]
        l=epred[i]+quantile(group,.10)
        u=epred[i]+quantile(group,.90)
        intervals.append(l<=row['actual_delay']<=u)
        # Cut-offs are chosen using *only* known information at forecast time.
        # Evaluate a mix of plausible deadlines relative to the model estimate.
        for delta in (-30,0,30,60,90):
            threshold=epred[i]+delta
            prob=probability(group,delta)
            outcome=float(row['actual_delay']<=threshold)
            briers.append((prob-outcome)**2)
            bucket=min(9,int(prob*10))
            band_count[bucket]+=1
            band_hits[bucket]+=outcome
    results={
        'method':'Product-conditional out-of-time empirical residual CDF',
        'synthetic_only':True,
        'train_days':'0-139, training already complete for the unchanged Random Forest',
        'calibration_days':'140-157',
        'evaluation_days':'158-175',
        'calibration_payments':len(cr),
        'evaluation_payments':len(er),
        'evaluation_80pct_interval_coverage':round(float(np.mean(intervals)),4),
        'evaluation_brier_score':round(float(np.mean(briers)),4),
        'calibration_bands':[{'lower':i/10,'upper':(i+1)/10,'count':band_count[i], 'observed_hit_rate':round(band_hits[i]/band_count[i],4) if band_count[i] else None} for i in range(10)],
        'restrictions':['Probability is estimated from *synthetic* held-out residuals, grouped by product, not inferred from RF tree votes.',
           'No bank data, no demonstrated out-of-sample transfer to real-world payments.',
           'P10 and P90 reflect residual variability conditional on the broad product grouping; not a guaranteed coverage statement.',
           'Cross-product and cross-system distribution shift may materially invalidate estimates.',
           'No information about the actual calibration, targets or production status of any bank model.']
    }
    obj={'version':'1.0','model_version':MODEL['version'],'seed':MODEL['metrics']['seed'],
         'calibration':results,'residuals_by_product':subsets,
         'clock_note':'All times shown on a synthetic 07:30–19:00 local business-day clock. Real payment cut-offs differ.'}
    (ROOT/'model-calibration.json').write_text(json.dumps(obj,separators=(',',':')))
    (ROOT/'model'/'calibration_report.json').write_text(json.dumps(results,indent=2))
    print(json.dumps({k:v for k,v in results.items() if k not in ('calibration_bands','restrictions')},indent=2))

if __name__=='__main__':build()