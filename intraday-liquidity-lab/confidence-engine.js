'use strict';
/* Transparent synthetic model uncertainty. Grouped *held-out residuals* — NOT RF tree voting or bank-calibrated probabilities. */
(function(root,factory){const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;if(root)root.ConfidenceEngine=x;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
 function quantile(arr,q){if(!arr?.length)throw Error('Missing independent calibration sample');const n=arr.length,h=(n-1)*clamp(q,0,1),lo=Math.floor(h),hi=Math.ceil(h);return arr[lo]+(arr[hi]-arr[lo])*(h-lo)}
 function rightBound(sorted,x){let lo=0,hi=sorted.length;while(lo<hi){let mid=(lo+hi)>>1;if(sorted[mid]<=x)lo=mid+1;else hi=mid}return lo}
 function profile(payment,predict,calibration,cutoff){
  if(!payment||payment.kind!=='IN')throw Error('A forecastable incoming payment is required');
  if(typeof predict!=='function')throw Error('The trained Random Forest estimator is required');
  if(!Number.isFinite(cutoff))throw Error('Settlement cut-off must be numeric');
  const rows=calibration?.residuals_by_product?.[payment.product];
  if(!rows||rows.length<50)throw Error('Insufficient synthetic product calibration sample');
  const booked=Number(payment.booking_minute),estimate=predict(payment),amount=Number(payment.amount_musd),
        threshold=cutoff-booked-estimate;
  const p=cutoff<booked?0:clamp((rightBound(rows,threshold)+.5)/(rows.length+1),0,1);
  // Committed 07:30–19:00 simulation horizon. Do not promise after-session settlement visibility.
  const p10=booked+estimate+quantile(rows,.10),p90=booked+estimate+quantile(rows,.90);
  return {booking:booked,point:booked+estimate,low:p10,high:p90,p_by_cutoff:p,
    expected_missing:amount*(1-p),amount,cutoff,sample_size:rows.length,product:payment.product,
    outside_session:p90>1140,probability_type:'product-conditional synthetic empirical residual estimate'};
 }
 function timingShiftState(core,state,id,newTime){
  if(!state||!Array.isArray(state.book))throw Error('Missing synthetic scenario');
  const source=state.book.find(x=>x.synthetic_id===id);
  if(!source||source.kind!=='IN')throw Error('Only selected incoming payment can be stressed');
  const original=state.group.forecast.surplus;
  const hypothetical=state.book.map(x=>x.synthetic_id===id?{...x,forecast_minute:Math.max(x.booking_minute,newTime)}:x);
  const stress=core.simulate(hypothetical,state.opts);
  const b=state.entityById(source.entity_id),s=stress.entityById(source.entity_id);
  return {group_before:original,group_after:stress.group.forecast.surplus,
    group_delta:stress.group.forecast.surplus-original,
    lnncp_increase:stress.group.forecast.peak_need-state.group.forecast.peak_need,
    entity_before:b.forecast.surplus,entity_after:s.forecast.surplus,entity_delta:s.forecast.surplus-b.forecast.surplus,
    conservative_time:Math.max(source.booking_minute,newTime),
    truncated:newTime>1140,
    timing_notional_unchanged:Math.abs(stress.book.reduce((a,p)=>a+(p.kind==='IN'?1:-1)*p.amount_musd,0)-state.book.reduce((a,p)=>a+(p.kind==='IN'?1:-1)*p.amount_musd,0))<1e-8};
 }
 function signal(probability,cutoff,point){
  // A *demonstration* trigger (70%), not an official bank governance limit.
  if(probability<.50)return{level:'high',label:'High timing uncertainty',message:'Review time-specific obligations and projected funding needs.'};
  if(probability<.70)return{level:'review',label:'Treasury review suggested',message:'Consider conservative settlement timing and liquidity sources.'};
  return {level:'normal',label:'Monitoring',message:cutoff<point?'Settlement cut-off precedes point estimate.':'Continue normal monitoring; real-world calibration is unavailable.'};
 }
 return {profile,quantile,rightBound,timingShiftState,signal};
});