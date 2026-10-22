'use strict';
/* Single timing-bucket authority for the fictional 07:30–19:00 intraday session.
   Flows settling later are UNSETTLED, never pulled forward to 19:00. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CashflowEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const START=450,END=1140,STEP=15;
 const effectiveMinute=(p,field,delay=0,accel=0)=>Math.max(START,Number(p[field])+(p.kind==='IN'?Number(delay):-Number(accel)));
 function timeline(book,field='forecast_minute',delay=0,accel=0,opening=0,events=[]){
  const scheduled=book.map(p=>({at:effectiveMinute(p,field,delay,accel),value:(p.kind==='IN'?1:-1)*Number(p.amount_musd)}))
   .concat(events.map(e=>({at:Number(e.when),value:Number(e.amount_musd)})));
  if(scheduled.some(e=>!Number.isFinite(e.at)||!Number.isFinite(e.value)))throw Error('Invalid simulated cash flow');
  let peak=0,closing=0;const points=[];
  for(let t=START;t<=END;t+=STEP){let cum=0;for(const e of scheduled){if(e.at<=t)cum+=e.value;}
   peak=Math.max(peak,-cum);points.push({t,net:cum,y:Number(opening)+cum});closing=Number(opening)+cum;
  }
  const unsettled=scheduled.filter(e=>e.at>END);
  return {points,peak_need:peak,surplus:Number(opening)-peak,closing,
   unsettled_inflows:unsettled.filter(e=>e.value>0).reduce((s,e)=>s+e.value,0),
   unsettled_outflows:unsettled.filter(e=>e.value<0).reduce((s,e)=>s-e.value,0)};
 }
 return {START,END,STEP,effectiveMinute,timeline};
});