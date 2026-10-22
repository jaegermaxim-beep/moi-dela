'use strict';
/* Independent, synthetic group treasury cockpit math. No external execution. */
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;if(root)root.CockpitEngine=engine;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const ENTITIES=[
  {id:'group-treasury',name:'Group Treasury',short:'Group Treasury',share:0.46,reserve:170,collateral:420,haircut:0.12,transferable:true,region:'Central Treasury'},
  {id:'investment-bank',name:'Investment Services',short:'Investment Services',share:0.34,reserve:155,collateral:265,haircut:0.16,transferable:true,region:'Independent entity'},
  {id:'international-branch',name:'International Branch',short:'International Branch',share:0.20,reserve:120,collateral:150,haircut:0.20,transferable:false,region:'Restricted branch'}
 ];
 const TYPES=['transfer','repo'];
 const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
 const entityById=(id)=>ENTITIES.find(e=>e.id===id);
 function enrich(book){return book.map((p,i)=>({...p,entity_id:ENTITIES[((i*7+Math.floor(i/4))%ENTITIES.length+ENTITIES.length)%ENTITIES.length].id,synthetic_id:`SIM-${String(i+1).padStart(4,'0')}`}));}
 const cashflow=typeof CashflowEngine!=='undefined'?CashflowEngine:(typeof require==='function'?require('./cashflow-engine.js'):null);
 function timeline(book,type='forecast_minute',delay=0,accel=0,opening=0,events=[]){return cashflow.timeline(book,type,delay,accel,opening,events)}
 function bookFor(book,id){return id==='all'?book:book.filter(p=>p.entity_id===id)}
 function openingFor(entity,opening){return opening*entity.share}
 function simulate(book,opts={}){
  const enriched=book[0]?.entity_id?book:enrich(book);
  const o={opening:Math.max(0,Number(opts.opening??2000)),delay:Math.max(0,Number(opts.delay??0)),accel:Math.max(0,Number(opts.accel??0))};
  const group={id:'all',name:'Consolidated Group',forecast:timeline(enriched,'forecast_minute',o.delay,o.accel,o.opening),actual:timeline(enriched,'actual_minute',o.delay,o.accel,o.opening),baseline:timeline(enriched,'baseline_minute',o.delay,o.accel,o.opening)};
  const entities=ENTITIES.map(e=>{
   const b=bookFor(enriched,e.id),liquidity=openingFor(e,o.opening);
   return {...e,opening:liquidity,count:b.length,forecast:timeline(b,'forecast_minute',o.delay,o.accel,liquidity),actual:timeline(b,'actual_minute',o.delay,o.accel,liquidity),baseline:timeline(b,'baseline_minute',o.delay,o.accel,liquidity)};
  });
  const at=(series,t)=>series.points.find(p=>p.t===t)||series.points.at(-1);
  const diffs=group.forecast.points.map((p,i)=>({t:p.t,delta:group.actual.points[i].y-p.y}));
  const maxDivergence=diffs.reduce((best,d)=>Math.abs(d.delta)>Math.abs(best.delta)?d:best,{t:450,delta:0});
  return {book:enriched,opts:o,group,entities,maxDivergence,entityById:(id)=>entities.find(e=>e.id===id),positionAt:at};
 }
 function transferable(state,sourceId,when){
  const source=state.entityById(sourceId),w=Number(when);
  if(!source)return {eligible:false,max:0,reason:'Source entity not found.'};
  if(!source.transferable)return {eligible:false,max:0,reason:'Local transferability restriction: no cross-entity transfer permitted in this scenario.'};
  if(w<600||w>990)return {eligible:false,max:0,reason:'Transfer request falls outside the assumed 10:00–16:30 settlement window.'};
  const after=source.forecast.points.filter(p=>p.t>=w);
  // Safeguard required reserve across the full remaining day, not merely at request time.
  const available=Math.max(0,Math.min(...after.map(p=>p.y))-source.reserve);
  return {eligible:available>0,max:available,reason:available>0?'Sufficient projected surplus after local reserve throughout the remaining day.':'Insufficient projected transferable liquidity after the local minimum reserve.'};
 }
 function assess(state,proposal){
  if(!proposal||!TYPES.includes(proposal.type))return {eligible:false,reason:'Select a valid action.'};
  const amount=Math.max(0,Number(proposal.amount_musd)||0),when=Number(proposal.when);
  const from=state.entityById(proposal.source),to=state.entityById(proposal.target);
  if(!amount||!Number.isFinite(amount)||amount>1000)return {eligible:false,reason:'Enter a positive amount up to $1,000m.'};
  if(!Number.isInteger(when)||when<450||when>1140||when%15!==0)return {eligible:false,reason:'Choose a valid 15-minute settlement time.'};
  if(proposal.type==='transfer'){
   if(!from||!to||from.id===to.id)return {eligible:false,reason:'Select two different legal entities.'};
   const available=transferable(state,from.id,when);
   if(!available.eligible||amount>available.max+1e-7)return {eligible:false,reason:amount>available.max?`Requested amount exceeds the conservative transferable capacity of $${Math.floor(available.max)}m.`:available.reason,max:available.max};
   const events={ [from.id]:[{when,amount_musd:-amount}], [to.id]:[{when,amount_musd:amount}] };
   return buildOutcome(state,proposal,events,{cost:0,amount,max:available.max,note:'Internal transfer is zero-sum at Group level. Full-day local reserves are preserved under the baseline projection.'});
  }
  if(!to)return {eligible:false,reason:'Select a receiving entity.'};
  if(when<720||when>960)return {eligible:false,reason:'Illustrative repo settlement window: 12:00–16:00.'};
  const collateralCap=to.collateral*(1-to.haircut);
  if(amount>collateralCap+1e-7)return {eligible:false,reason:`Lending amount exceeds haircut-adjusted unencumbered collateral capacity of $${collateralCap.toFixed(0)}m.`,max:collateralCap};
  const financingCost=amount*0.00015;
  const events={[to.id]:[{when,amount_musd:amount}]};
  return buildOutcome(state,proposal,events,{cost:financingCost,amount,max:collateralCap,note:'External repo funding adds cash after the assumed settlement time, subject to collateral eligibility and a stylised one-day funding cost.'});
 }
 function buildOutcome(state,proposal,events,details){
  const result=state.entities.map(e=>{
   const b=bookFor(state.book,e.id);return {id:e.id,forecast:timeline(b,'forecast_minute',state.opts.delay,state.opts.accel,e.opening,events[e.id]||[])};
  });
  const mergedEvents=Object.values(events).flat();
  const group=timeline(state.book,'forecast_minute',state.opts.delay,state.opts.accel,state.opts.opening,mergedEvents);
  const perEntity=result.map(e=>{const before=state.entityById(e.id);return{id:e.id,name:before.name,before:before.forecast.surplus,after:e.forecast.surplus,delta:e.forecast.surplus-before.forecast.surplus}});
  const outcome={eligible:true,proposal:{...proposal},details,entities:perEntity,group:{before:state.group.forecast.surplus,after:group.surplus,change:group.surplus-state.group.forecast.surplus,curve:group},events};
  return outcome;
 }
 function paymentVariance(state,entity='all',t=750){
  const rows=bookFor(state.book,entity).filter(p=>p.kind==='IN').map(p=>({id:p.synthetic_id,entity:p.entity_id,product:p.product,rail:p.rail,amount:p.amount_musd,forecast:p.forecast_minute,actual:p.actual_minute,late:Math.max(0,p.actual_minute-p.forecast_minute),score:p.amount_musd*Math.max(0,p.actual_minute-p.forecast_minute)})).sort((a,b)=>b.score-a.score);
  const points=state.entities.find(e=>e.id===entity)?.forecast.points||state.group.forecast.points;
  const actualPoints=state.entities.find(e=>e.id===entity)?.actual.points||state.group.actual.points;
  const idx=points.findIndex(p=>p.t===t);
  return {rows,at:t,delta:idx<0?0:actualPoints[idx].y-points[idx].y,worst:rows[0]||null};
 }
 function evaluationMessages(state,outcome){
  const messages=[
   {agent:'Forecast Monitor',recipient:'Liquidity Optimiser',message:`Peak projected Group LNNCP $${state.group.forecast.peak_need.toFixed(0)}m; synthetic realised gap peaks at $${Math.abs(state.maxDivergence.delta).toFixed(0)}m.`,status:'Completed'},
   {agent:'Liquidity Optimiser',recipient:'Treasury Cash Management',message:outcome?.eligible?`Scenario impact assessed: Group surplus ${outcome.group.change>=0?'+':''}$${outcome.group.change.toFixed(0)}m.`:'Evaluate legal-entity funding options and payment priorities.',status:outcome?.eligible?'Evaluated':'Review'},
   {agent:'Control Agent',recipient:'Approval Gate',message:outcome?.eligible?outcome.details.note:(outcome?.reason||'Awaiting a funding proposal.'),status:outcome?.eligible?'Checked':'Pending'},
   {agent:'Approval Gate',recipient:'Human Treasury User',message:'Execution blocked. A demo approval records intent only and creates no real payment.',status:'Manual approval'}
  ];return messages;
 }
 return {ENTITIES,TYPES,enrich,timeline,bookFor,openingFor,simulate,transferable,assess,paymentVariance,evaluationMessages};
});