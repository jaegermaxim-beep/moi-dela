'use strict';
/* Pure math for synthetic client demonstrations. Does not imply actual cost saving or bank funding approval. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ClientStudioEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const RATES={repo:.0525,central_bank:.061};
 function compareFacility(state,entityId,amount,options={}){
  const life=typeof FundingLifecycleEngine!=='undefined'?FundingLifecycleEngine:(typeof require==='function'?require('./funding-lifecycle-engine.js'):null);
  const e=state?.entityById(entityId),n=Number(amount),when=Number(options.when??780);
  if(!e||!Number.isFinite(n)||n<=0)return {eligible:false,reason:'Choose a valid entity and facility amount.'};
  const tenor=options.tenor??'overnight';
  const action={type:'repo',target:entityId,amount_musd:n,when,tenor};
  if(tenor==='same_day')action.repayWhen=Number(options.repayWhen??930);
  const trial=life.process(state,[action],{asOf:Number(options.asOf??720)});
  if(!trial.eligible)return {...trial,eligible:false};
  const asOf=Number(options.asOf??720);
  const before=Math.min(...e.forecast.points.filter(x=>x.t>=asOf).map(x=>x.y)),after=trial.balances[entityId].lowest,baseGap=Math.max(0,e.reserve-before),afterGap=Math.max(0,e.reserve-after),
        collateralAtSettlement=trial.ledger.find(l=>l.type==='Repo funding settled')?.pledged??0;
  return {eligible:true,entity:e.name,reserve:e.reserve,before,after,baseGap,afterGap,protectedGap:Math.max(0,baseGap-afterGap),costUsd:trial.cost_usd,
          collateral:collateralAtSettlement,repayToday:tenor==='same_day',nextDayDebt:trial.nextDayDebt,rate:RATES.repo,
          beforeGroup:state.group.forecast.surplus,afterGroup:Math.min(...trial.groupPath.map(x=>x.y)),
          disclaimer:'Synthetic facility capacity; cost excludes liquidity opportunity costs, bid/offer, margin and balance-sheet charges. Gap reduction is NOT realised cash savings.'};
 }
 function quality(book,trainReport,calReport){
  const r=trainReport||{},c=calReport||{},arr=(book||[]).filter(p=>p.kind==='IN');
  const mean=(fn)=>arr.length?arr.reduce((v,p)=>v+fn(p),0)/arr.length:null;
  const rf=mean(p=>Math.abs(p.forecast_minute-p.actual_minute)),baseline=mean(p=>Math.abs(p.baseline_minute-p.actual_minute));
  const optimistic=arr.length?arr.filter(p=>p.actual_minute>p.forecast_minute).length/arr.length:null;
  const largestImportance=r.feature_importance?.[0];
  return {sample:arr.length,dayRFMAE:rf,dayBaselineMAE:baseline,optimisticShare:optimistic,holdoutMAE:r.forest_mae_min,
    holdoutBaselineMAE:r.baseline_mae_min,holdoutRecords:r.test_records,importanceName:largestImportance?.name,
    importanceShare:largestImportance?.importance,intervalCoverage:c.evaluation_80pct_interval_coverage,
    calibrationSize:c.calibration_payments,evaluationSize:c.evaluation_payments};
 }
 return {compareFacility,quality};
});