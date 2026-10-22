'use strict';
/* FLOWSTATE v9 — controlled comparison of synthetic Treasury funding plans on identical
   Monte Carlo paths. Risk figures are scenario-implied frequencies, NEVER bank-calibrated
   default, breach or regulatory probabilities. Pure module; executes no Treasury action. */
(function(root,factory){const v=factory();if(typeof module==='object'&&module.exports)module.exports=v;if(root)root.RiskPlanEngine=v;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const SLOTS=47,START=450,END=1140,STEP=15;
 const idx=t=>Math.max(0,Math.min(SLOTS-1,Math.ceil((t-START)/STEP)));
 const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6d2b79f5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}};
 const quantile=(array,q)=>{let a=array.slice().sort((x,y)=>x-y),p=(a.length-1)*q,i=Math.floor(p);return a[i]+(a[Math.ceil(p)]-a[i])*(p-i)};
 const key=actions=>actions.map(a=>[a.type,a.source||'-',a.target,a.when,a.amount_musd].join(':')).sort().join('|')||'none';
 const percent=x=>Number((100*x).toFixed(1));
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function validate(state,cal,opt,plans,asOf){
  if(!state?.book?.length||state.entities?.length!==3||!cal?.residuals_by_product)throw Error('Missing Group scenario or residual calibration');
  if(!Array.isArray(plans)||plans.length<1||plans.length>12||plans.some(p=>!Array.isArray(p.actions)))throw Error('Invalid plan shortlist');
  if(!Number.isInteger(asOf)||asOf<START||asOf>END||asOf%STEP)throw Error('Invalid decision time');
  const o={runs:Number(opt.runs),seed:Number(opt.seed),shockProbability:Number(opt.shockProbability),shockDelay:Number(opt.shockDelay),stressDelay:Number(opt.stressDelay),stressAccel:Number(opt.stressAccel),stressHaircut:Number(opt.stressHaircut)};
  if(!Number.isInteger(o.runs)||o.runs<100||o.runs>1500||!Number.isInteger(o.seed)||!Object.values(o).every(finite)||o.shockProbability<0||o.shockProbability>1||o.shockDelay<0||o.shockDelay>180||o.stressDelay<0||o.stressDelay>180||o.stressAccel<0||o.stressAccel>120||o.stressHaircut<0||o.stressHaircut>.4)throw Error('Invalid assumed stress parameters');
  const idSet=new Set(state.entities.map(e=>e.id));
  for(const p of state.book){if(!idSet.has(p.entity_id)||!finite(+p.amount_musd)||+p.amount_musd<0)throw Error('Invalid synthetic payment');if(p.kind==='IN'&&(!Array.isArray(cal.residuals_by_product[p.product])||cal.residuals_by_product[p.product].length<50))throw Error('Missing product calibration '+p.product)}
  for(const plan of plans)for(const a of plan.actions){if(!['repo','transfer'].includes(a.type)||!idSet.has(a.target)||!finite(a.amount_musd)||a.amount_musd<=0||!Number.isInteger(a.when)||a.when<asOf||a.when>END||a.when%STEP)throw Error('Plan contains invalid or retrospective action');if(a.type==='transfer'&&(!idSet.has(a.source)||a.source===a.target))throw Error('Invalid intercompany transfer');
    if(a.type==='transfer'){const source=state.entities.find(e=>e.id===a.source);if(!source.transferable||a.when<600||a.when>990)throw Error('Transferability or cut-off restriction failed')}
    if(a.type==='repo'&&(a.when<720||a.when>960))throw Error('Repo settlement cut-off restriction failed')}
  for(const plan of plans)for(const ent of state.entities){const pledged=plan.actions.filter(a=>a.type==='repo'&&a.target===ent.id).reduce((s,a)=>s+a.amount_musd,0);if(pledged>ent.collateral*(1-ent.haircut)+1e-7)throw Error('Funding exceeds haircut-adjusted collateral capacity')}
  return o;
 }
 /* Common random numbers make paired before/after comparisons meaningful. All actions
    are booked strictly after the chosen as-of time. Risk is assessed from as-of onward.
    Intraday repo funding is assumed usable through session end; repayment is not modelled. */
 function compare(state,cal,opt,plans,asOf=720){
  const o=validate(state,cal,opt,plans,asOf),random=rng(o.seed),ents=state.entities,identity=Object.fromEntries(ents.map((e,i)=>[e.id,i]));
  const scenarioPlans=plans.map(p=>({key:key(p.actions),actions:p.actions,costUsd:Number(p.costUsd||0),label:p.label||'',results:[]}));
  const rows=state.book.map(p=>({entity:identity[p.entity_id],dir:p.kind==='IN'?1:-1,when:+p.forecast_minute,booked:+(p.booking_minute??START),amount:+p.amount_musd,residual:p.kind==='IN'?cal.residuals_by_product[p.product]:null}));
  const decisionIdx=idx(asOf),opening=+state.opts.opening*(1-o.stressHaircut),reserveSum=ents.reduce((s,e)=>s+e.reserve,0);
  const funded=plans.map(p=>{const ev=Array.from({length:ents.length},()=>new Float64Array(SLOTS));for(const a of p.actions){const slot=idx(a.when),i=identity[a.target];ev[i][slot]+=a.amount_musd;if(a.type==='transfer')ev[identity[a.source]][slot]-=a.amount_musd;}return ev;});
  const scenarioDelay=Number(state.opts.delay)+o.stressDelay,scenarioAccel=Number(state.opts.accel)+o.stressAccel;
  for(let run=0;run<o.runs;run++){
   const shock=random()<o.shockProbability?o.shockDelay:0;
   const base=Array.from({length:ents.length},()=>new Float64Array(SLOTS));
   for(const p of rows){const residual=p.dir>0?p.residual[Math.floor(random()*p.residual.length)]:0;
    const t=p.dir>0?Math.max(p.booked,p.when+residual+shock+scenarioDelay):Math.max(START,p.when-scenarioAccel);
    if(t>END)continue;base[p.entity][idx(t)]+=p.dir*p.amount;
   }
   for(let pi=0;pi<scenarioPlans.length;pi++){
    const delta=funded[pi],balances=ents.map(e=>opening*e.share),minEnt=balances.slice();
    let minGroup=opening,sumUnder=0,areaUnder=0,groupNeed=0;
    const path=[];
    for(let t=0;t<SLOTS;t++){
     let group=0;
     for(let j=0;j<ents.length;j++){balances[j]+=base[j][t]+delta[j][t];group+=balances[j]}
     if(t>=decisionIdx){if(t===decisionIdx){minGroup=group;for(let j=0;j<ents.length;j++)minEnt[j]=balances[j]}else minGroup=Math.min(group,minGroup);groupNeed=Math.max(groupNeed,opening-group);
      for(let j=0;j<ents.length;j++){minEnt[j]=Math.min(minEnt[j],balances[j]);areaUnder+=Math.max(0,ents[j].reserve-balances[j])*.25;}
     }
     path.push(group);
    }
    const gaps=minEnt.map((b,j)=>Math.max(0,ents[j].reserve-b)),totalGap=gaps.reduce((a,b)=>a+b,0);
    scenarioPlans[pi].results.push({groupReserve:minGroup<reserveSum-1e-7,groupZero:minGroup<0,anyEntity:gaps.some(x=>x>1e-7),minGroup,groupNeed,totalGap,deficitHours:areaUnder,local:gaps.map(x=>x>1e-7),gaps,path});
   }
  }
  const summarise=p=>{
   const r=p.results,n=r.length,count=pred=>r.filter(pred).length/n,mean=field=>r.reduce((s,e)=>s+e[field],0)/n;
   return {key:p.key,costUsd:p.costUsd,actions:p.actions,probLocal:count(x=>x.anyEntity),probGroup:count(x=>x.groupReserve),probZero:count(x=>x.groupZero),expectedGap:mean('totalGap'),expectedDeficitHours:mean('deficitHours'),surplusP10:quantile(r.map(x=>x.minGroup),.1),surplusP50:quantile(r.map(x=>x.minGroup),.5),groupNeedP90:quantile(r.map(x=>x.groupNeed),.9),entity:ents.map((e,i)=>({id:e.id,name:e.name,probReserve:count(x=>x.local[i]),expectedGap:r.reduce((s,x)=>s+x.gaps[i],0)/n})),observations:r};
  };
  const scored=scenarioPlans.map(summarise),baseline=scored.find(x=>x.key==='none');if(!baseline)throw Error('Plan shortlist must include no-action baseline');
  for(const p of scored){p.deltaLocalPp=percent(baseline.probLocal-p.probLocal);p.deltaGroupPp=percent(baseline.probGroup-p.probGroup);p.expectedGapReduction=baseline.expectedGap-p.expectedGap;p.increasesGroupRisk=p.probGroup>baseline.probGroup+1e-8;
   p.increasesEntityRisk=p.probLocal>baseline.probLocal+1e-8;
   p.entityRiskShift=p.entity.map((ent,j)=>({id:ent.id,name:ent.name,increasePp:percent(ent.probReserve-baseline.entity[j].probReserve)})).filter(ent=>ent.increasePp>0.1);
   p.increasesIndividualEntityRisk=p.entityRiskShift.length>0;}
  // Risk-first ordering, with severity and indicative cost as subsequent tie-breakers.
  // Candidates come from existing heuristic pre-screening, NOT exhaustive optimisation.
  const ranked=scored.slice().sort((a,b)=>a.probLocal-b.probLocal||a.expectedGap-b.expectedGap||a.probGroup-b.probGroup||a.expectedDeficitHours-b.expectedDeficitHours||a.costUsd-b.costUsd);
  for(let i=0;i<ranked.length;i++)ranked[i].rank=i+1;
  const paired=ranked.map(p=>{const baseObs=baseline.observations,after=p.observations;const improvements=after.map((v,i)=>baseObs[i].totalGap-v.totalGap);const improved=improvements.filter(x=>x>1e-6).length/after.length;const worsened=improvements.filter(x=>x< -1e-6).length/after.length;return {key:p.key,improvedFraction:improved,worsenedFraction:worsened,meanPairedBenefit:improvements.reduce((s,x)=>s+x,0)/after.length};});
  return {runs:o.runs,asOf,assumptions:o,baseline,ranked,paired,shortlistCount:ranked.length,sourceCount:rows.length,note:'Conditional synthetic probabilities for the remaining trading day. Common random numbers used for paired comparison. Assumed residual dependence and payment-system shocks are not calibrated to observed bank data.',limitations:['Candidate shortlist is generated by the v5 deterministic optimiser, not a globally optimal multi-stage stochastic search.','Repo proceeds are treated as available through 19:00. Repayment, collateral double-counting, funding cost tenor and settlement failures are not fully represented.','A plan that passes deterministic control checks may breach a local reserve floor under stress; this risk is explicitly measured, not hidden.']};
 }
 return {compare,key,rng,quantile};
});