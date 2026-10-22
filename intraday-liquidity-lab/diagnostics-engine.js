'use strict';
/* Synthetic, independent intraday scenario and payment explanation calculations. */
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;if(root)root.DiagnosticsEngine=engine;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const core=typeof CockpitEngine!=='undefined'?CockpitEngine:(typeof require==='function'?require('./cockpit-engine.js'):null);
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const at=(rows,t)=>rows.find(r=>r.t===t);
 const round=x=>Math.round(x*10)/10;
 function compareScenarios(book,opening,settings={}){
  const delay=clamp(+settings.delay||0,0,240),accel=clamp(+settings.accel||0,0,120),haircut=clamp(+settings.haircut||0,0,.5);
  const bau=core.simulate(book,{opening,delay:0,accel:0});
  const stress=core.simulate(book,{opening:opening*(1-haircut),delay,accel});
  const entityRows=core.ENTITIES.map(e=>{
    const b=bau.entityById(e.id),s=stress.entityById(e.id);
    const metric=x=>({opening:x.opening,lnncp:x.forecast.peak_need,surplus:x.forecast.surplus,reserve_gap:Math.max(0,x.reserve-x.forecast.surplus)});
    return {id:e.id,name:e.name,BAU:metric(b),Stress:metric(s),surplus_change:s.forecast.surplus-b.forecast.surplus,lnncp_change:s.forecast.peak_need-b.forecast.peak_need};
  });
  const metric=(state)=>({opening:state.opts.opening,lnncp:state.group.forecast.peak_need,surplus:state.group.forecast.surplus});
  const selected=(s)=>s.group.forecast.points;
  return {bau:metric(bau),stress:metric(stress),settings:{delay,accel,haircut},entities:entityRows,
    group:{delta_surplus:stress.group.forecast.surplus-bau.group.forecast.surplus,delta_lnncp:stress.group.forecast.peak_need-bau.group.forecast.peak_need},
    points:bau.group.forecast.points.map((p,i)=>({t:p.t,bau:p.y,stress:stress.group.forecast.points[i].y}))};
 }
 function explainSettlement(payment,predict,choices){
  if(!payment||payment.kind!=='IN')throw Error('Only incoming payments have a settlement-time forecast.');
  if(typeof predict!=='function')throw Error('A trained model prediction function is required.');
  const base=predict(payment),effects=[];
  const tests=[
   ['Product type',choices.products.map(x=>({product:x}))],
   ['Counterparty',choices.counterparties.map(x=>({counterparty:x}))],
   ['Payment rail',choices.rails.map(x=>({rail:x}))],
   ['Historical settlement lag',[Math.max(25,payment.historical_median_delay-45),Math.min(300,payment.historical_median_delay+45)].map(x=>({historical_median_delay:x}))],
   ['Booking time',[Math.max(475,payment.booking_minute-75),Math.min(940,payment.booking_minute+75)].map(x=>({booking_minute:x}))],
   ['Payment amount',[Math.max(.6,payment.amount_musd*.5),Math.min(145,payment.amount_musd*1.5)].map(x=>({amount_musd:x}))],
   ['Settlement pressure',[Math.max(0,payment.pressure-.35),Math.min(1.8,payment.pressure+.35)].map(x=>({pressure:x}))],
   ['Weekday',[0,2,4].map(x=>({weekday:x}))]
  ];
  for(const [name,patches] of tests){
   const values=patches.map(p=>({value:predict({...payment,...p}),patch:p}));
   const lo=values.reduce((a,b)=>a.value<b.value?a:b),hi=values.reduce((a,b)=>a.value>b.value?a:b);
   effects.push({name,minimum:lo.value,maximum:hi.value,span:hi.value-lo.value,largest_absolute_change:Math.max(Math.abs(lo.value-base),Math.abs(hi.value-base))});
  }
  effects.sort((a,b)=>b.largest_absolute_change-a.largest_absolute_change);
  return {predicted_delay:base,booking:payment.booking_minute,eta:base+payment.booking_minute,actual:payment.actual_minute,
    absolute_error:Math.abs(payment.actual_minute-(base+payment.booking_minute)),effects};
 }
 function gapDrivers(book,entityId='all'){
  const subset=core.bookFor(book,entityId);
  const points=core.timeline(subset,'forecast_minute',0,0,0).points;
  const actual=core.timeline(subset,'actual_minute',0,0,0).points;
  const largest=points.map((p,i)=>({t:p.t,variance:actual[i].y-p.y})).reduce((a,b)=>Math.abs(b.variance)>Math.abs(a.variance)?b:a,{t:450,variance:0});
  const rows=subset.filter(p=>p.kind==='IN').map(p=>{
   const expect=p.forecast_minute<=largest.t,real=p.actual_minute<=largest.t;
   return {...p,impact:p.amount_musd*(+real-+expect)};
  });
  const byProduct={};for(const p of rows){byProduct[p.product]=(byProduct[p.product]||0)+p.impact;}
  const sorted=Object.entries(byProduct).map(([product,impact])=>({product,impact})).sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact));
  const total=rows.reduce((s,p)=>s+p.impact,0);
  return {t:largest.t,variance:largest.variance,total,payments:rows.filter(p=>Math.abs(p.impact)>1e-9).sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact)),products:sorted};
 }
 return {compareScenarios,explainSettlement,gapDrivers};
});