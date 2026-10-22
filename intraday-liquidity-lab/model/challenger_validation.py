"""Synthetic-only model challenge. No external bank model validation claim."""
import json
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from train_model import synthesize,feature_vector,N_DAYS

root=Path(__file__).resolve().parents[1]
df=synthesize();tr=df.day<int(N_DAYS*.8);te=~tr
xtr=np.asarray([feature_vector(row) for row in df[tr].to_dict('records')]); xte=np.asarray([feature_vector(row) for row in df[te].to_dict('records')])
ytr=df.loc[tr,'actual_delay'].to_numpy();yte=df.loc[te,'actual_delay'].to_numpy()
weights=df.loc[te,'amount_musd'].to_numpy()
rf=RandomForestRegressor(n_estimators=32,max_depth=8,min_samples_leaf=12,n_jobs=-1,random_state=11,max_features=.83).fit(xtr,ytr)
gbm=HistGradientBoostingRegressor(max_depth=5,max_iter=180,learning_rate=.065,min_samples_leaf=30,random_state=19).fit(xtr,ytr)
abl=RandomForestRegressor(n_estimators=32,max_depth=8,min_samples_leaf=12,n_jobs=-1,random_state=11,max_features=.83).fit(np.delete(xtr,4,axis=1),ytr)
models={'Random Forest (export equivalent)':rf.predict(xte),'Gradient boosting challenger':gbm.predict(xte),'RF without historical-delay feature':abl.predict(np.delete(xte,4,axis=1))}
median=df[tr].groupby(['product','rail'])['actual_delay'].median();models['Rules median baseline']=df[te].apply(lambda r:float(median.get((r['product'],r['rail']),np.median(ytr))),axis=1).to_numpy()
metrics={}
for name,pred in models.items():
  err=yte-pred
  metrics[name]={'mae_min':float(np.mean(np.abs(err))),'notional_weighted_mae_min':float(np.average(np.abs(err),weights=weights)),
  'optimistic_rate':float(np.mean(err>0)),'optimistic_tail_mean_minutes':float(np.mean(np.maximum(0,err))),
  'delayed_60_min_mae_min':float(np.mean(np.abs(err+60)))}
report={'data':'Synthetic time-split, no bank evidence','training_days':'0–139','evaluation_days':'140–175',
'holdout_count':int(te.sum()),'models':metrics,
'interpretation':'The challenger and ablation challenge the synthetic generator, not a bank production system. The delayed regime shift is hypothetical and has no refitted model.',
'validation_gaps':['Point-in-time provenance of historical median delays unverified','No real distribution shift, network dependency or counterparty clustering calibrated','No independent bank dataset or model governance sign-off','No measured realised savings, regulatory capital or buffer release']}
(root/'model'/'challenger_report.json').write_text(json.dumps(report,indent=2))
for k,v in metrics.items():print(k,round(v['mae_min'],2),round(v['notional_weighted_mae_min'],2),round(v['delayed_60_min_mae_min'],2))