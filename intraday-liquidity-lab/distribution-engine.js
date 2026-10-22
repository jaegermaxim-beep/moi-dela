'use strict';
/* FLOWSTATE v8: Synthetic Monte Carlo ensemble of product-conditional payment-timing residuals.
   NOT a production economic-capital model; systematic settlement shocks are user-assumed,
   with no real-world joint calibration or tail validation. No external effects. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DistributionEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const TIMES=Array.from({length:47},(_,i)=>450+15*i);
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const quantile=(sorted,q)=>{if(!sorted.length)throw Error('Empty distribution');const pos=(sorted.length-1)*clamp(q,0,1),a=Math.floor(pos),b=Math.ceil(pos);return sorted[a]+(sorted[b]-sorted[a])*(pos-a)};
 function rng(seed){let x=seed>>>0;return()=>{x+=0x6d2b79f5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}}
 function validate(state,calibration,options){
  if(!state||!Array.isArray(state.book)||!Array.isArray(state.entities)||state.entities.length!==3)throw Error('A complete synthetic group scenario is required');
  if(!calibration?.residuals_by_product)throw Error('Synthetic out-of-time residual calibration is required');
  const o={runs:Math.round(Number(options?.runs??500)),seed:Math.round(Number(options?.seed??20261022)),shockProbability:Number(options?.shockProbability??0.25),shockDelay:Number(options?.shockDelay??60),stressDelay:Number(options?.stressDelay??45),stressAccel:Number(options?.stressAccel??30),stressHaircut:Number(options?.stressHaircut??0.15)};
  if(!Number.isInteger(o.runs)||o.runs<100||o.runs>2000||!Number.isInteger(o.seed)||o.shockProbability<0||o.shockProbability>1||o.shockDelay<0||o.shockDelay>180||o.stressDelay<0||o.stressDelay>180||o.stressAccel<0||o.stressAccel>120||o.stressHaircut<0||o.stressHaircut>0.4||Object.values(o).some(v=>!Number.isFinite(v)))throw Error('Invalid Monte Carlo assumptions');
  for(const p of state.book){if(p.kind==='IN'&&(!calibration.residuals_by_product[p.product]||calibration.residuals_by_product[p.product].length<50))throw Error('Missing product-specific calibration population: '+p.product)}
  return o;
 }
 function summarize(values){const sorted=values.slice().sort((a,b)=>a-b);return{mean:values.reduce((a,b)=>a+b,0)/values.length,p10:quantile(sorted,.1),p50:quantile(sorted,.5),p90:quantile(sorted,.9),min:sorted[0],max:sorted.at(-1)}}
 function run(state,calibration,options){
  const opt=validate(state,calibration,options);const random=rng(opt.seed);const entities=state.entities,entityMap=Object.fromEntries(entities.map((e,i)=>[e.id,i]));
  const rows=state.book.map(p=>({sign:p.kind==='IN'?1:-1,amount:Number(p.amount_musd),time:Number(p.forecast_minute),booking:Number(p.booking_minute??450),kind:p.kind,entity:entityMap[p.entity_id],residuals:p.kind==='IN'?calibration.residuals_by_product[p.product]:null}));
  const opening=Number(state.opts.opening),reserveSum=entities.reduce((a,e)=>a+e.reserve,0);
  // Scenarios share idiosyncratic residual draws and common-shock occurrence for an apples-to-apples comparison.
  const distributions={bau:[],stress:[]};const curves={bau:[],stress:[]};
  const scenarios=[{key:'bau',delay:state.opts.delay,accel:state.opts.accel,openingHaircut:0},{key:'stress',delay:state.opts.delay+opt.stressDelay,accel:state.opts.accel+opt.stressAccel,openingHaircut:opt.stressHaircut}];
  for(let k=0;k<opt.runs;k++){
   const commonShock=random()<opt.shockProbability?opt.shockDelay:0;
   const draws=rows.map(p=>p.kind==='IN'?p.residuals[Math.floor(random()*p.residuals.length)]:0);
   for(const sc of scenarios){
    const buckets=Array.from({length:entities.length},()=>new Float64Array(TIMES.length));
    for(let i=0;i<rows.length;i++){
     const p=rows[i];let time;
     if(p.kind==='IN')time=Math.max(p.booking,p.time+draws[i]+commonShock+sc.delay);
     else time=Math.max(450,p.time-sc.accel);
     // Payments settling AFTER 19:00 are not silently counted as same-day inflows.
     if(time>TIMES.at(-1))continue;
     const bucket=clamp(Math.ceil((time-450)/15),0,TIMES.length-1);
     buckets[p.entity][bucket]+=p.amount*p.sign;
    }
    const initial=opening*(1-sc.openingHaircut),entityBalance=entities.map(e=>initial*e.share),netEntity=new Array(entities.length).fill(0),entityLowest=entityBalance.slice();
    let netGroup=0,minGroup=initial,needGroup=0;
    const path=[];
    for(let t=0;t<TIMES.length;t++){
     for(let j=0;j<entities.length;j++){
      const d=buckets[j][t];netEntity[j]+=d;entityBalance[j]+=d;entityLowest[j]=Math.min(entityLowest[j],entityBalance[j]);netGroup+=d;
     }
     needGroup=Math.max(needGroup,-netGroup);minGroup=Math.min(minGroup,initial+netGroup);
     path.push(initial+netGroup);
    }
    const entitySurpluses=entities.map((e,j)=>entityLowest[j]);
    distributions[sc.key].push({surplus:minGroup,lnncp:needGroup,belowZero:minGroup<0,belowReserve:minGroup<reserveSum,entitySurpluses,localBreaches:entitySurpluses.map((s,j)=>s<entities[j].reserve),anyLocalBreach:entitySurpluses.some((s,j)=>s<entities[j].reserve)});
    curves[sc.key].push(path);
   }
  }
  const summarizeScenario=key=>{
   const data=distributions[key],n=data.length,prob=pred=>data.filter(pred).length/n;
   const band=TIMES.map((t,i)=>{const values=curves[key].map(path=>path[i]).sort((a,b)=>a-b);return{t,p10:quantile(values,.1),p50:quantile(values,.5),p90:quantile(values,.9)}});
   return {surplus:summarize(data.map(x=>x.surplus)),lnncp:summarize(data.map(x=>x.lnncp)),pZero:prob(x=>x.belowZero),pGroupReserve:prob(x=>x.belowReserve),pAnyEntity:prob(x=>x.anyLocalBreach),entity:entities.map((e,j)=>({id:e.id,name:e.name,pReserve:prob(x=>x.localBreaches[j]),surplus:summarize(data.map(x=>x.entitySurpluses[j]))})),band};
  };
  return {runs:opt.runs,assumptions:opt,reserveSum,entityCount:entities.length,sourceCount:rows.length,bau:summarizeScenario('bau'),stress:summarizeScenario('stress'),riskLimit:'Synthetic Group liquidity below zero; Group reserve is a separate illustrative floor based on summed local reserve assumptions.',caveat:'Monte Carlo result based only on product-conditional synthetic residuals plus a user-defined common timing shock. Not a correlated statistical model calibrated to real settlement processes; scenario frequencies are assumptions, not observed probabilities.'};
 }
 return {run,summarize,quantile,rng,TIMES};
});