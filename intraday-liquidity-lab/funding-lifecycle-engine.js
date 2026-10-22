'use strict';
/* FLOWSTATE v10 — synthetic collateral inventory, repo funding and repayment lifecycle.
   No legal opinions, central-bank rules, external accounts, market rates or orders. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.FundingLifecycleEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const START=450,END=1140,STEP=15;
 const round=x=>Math.round(x*1e7)/1e7;
 const time=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function process(state,actions=[],options={}){
  const asOf=Number(options.asOf??720);
  const defaultTenor=options.defaultTenor||'overnight';
  const defaultRepayAfter=Number(options.defaultRepayAfter??120);
  const fail=reason=>({eligible:false,reason,events:{},ledger:[],balances:{},outstanding:[],cost_musd:0,cost_usd:0,collateralTimeline:[]});
  if(!Array.isArray(state?.entities)||!state.entities.length||!state.group?.forecast?.points?.length)return fail('Missing synthetic liquidity scenario.');
  if(!Number.isInteger(asOf)||asOf<START||asOf>END||asOf%STEP)return fail('Decision time must be a quarter-hour inside the session.');
  if(!Array.isArray(actions)||actions.length>5)return fail('Up to five funding actions per synthetic collateral plan.');
  if(!['overnight','same_day'].includes(defaultTenor))return fail('Unsupported repayment tenor.');
  const entities=Object.fromEntries(state.entities.map(e=>[e.id,e]));
  const booked=[];const events=Object.fromEntries(state.entities.map(e=>[e.id,[]]));
  for(let k=0;k<actions.length;k++){
   const a=actions[k],amt=Number(a.amount_musd),when=Number(a.when),to=entities[a.target];
   if(!to||!finite(amt)||amt<=0||amt>1000||!Number.isInteger(when)||when<asOf||when>END||when%STEP)return fail(`Action ${k+1}: amount, entity, settlement time or decision cut-off invalid.`);
   if(a.type==='transfer'){
    const from=entities[a.source];if(!from||from.id===to.id||!from.transferable)return fail(`Action ${k+1}: intercompany transferability control failed.`);
    if(when<600||when>990)return fail(`Action ${k+1}: transfer settlement outside 10:00–16:30.`);
    booked.push({id:k,type:'transfer',from:from.id,to:to.id,amount:amt,when});continue;
   }
   if(!['repo','central_bank'].includes(a.type))return fail(`Action ${k+1}: unsupported funding type.`);
   const central=a.type==='central_bank';
   const haircut=Math.min(.95,Number(to.haircut)+(central?.07:0));
   const eligibleFraction=central?.70:1;
   if(central){
    if(to.id==='international-branch')return fail(`Action ${k+1}: illustrative central-bank access restriction at ${to.name}.`);
    if(when<570||when>930)return fail(`Action ${k+1}: central-bank facility window 09:30–15:30.`);
    if(when-asOf<30)return fail(`Action ${k+1}: minimum 30-minute collateral pre-positioning lead time required.`);
   }else if(when<720||when>960)return fail(`Action ${k+1}: repo settlement outside 12:00–16:00.`);
   const tenor=a.tenor|| (central?'same_day':defaultTenor);
   if(!['overnight','same_day'].includes(tenor)||central&&tenor!=='same_day')return fail(`Action ${k+1}: invalid facility tenor.`);
   const repayWhen=tenor==='same_day'?Number(a.repayWhen??(when+defaultRepayAfter)):null;
   if(tenor==='same_day'&&(!Number.isInteger(repayWhen)||repayWhen%STEP||repayWhen<=when||repayWhen>END||repayWhen-when<60))return fail(`Action ${k+1}: same-day repayment must be 1+ hours after settlement and no later than 19:00.`);
   if(central&&repayWhen>1110)return fail(`Action ${k+1}: central-bank facility repayment cut-off is 18:30.`);
   const rate=central?.061:.0525,interest=amt*rate*(tenor==='overnight'?1:Math.max((repayWhen-when)/1440,1/24))/360;
   const pledged=amt/(1-haircut);
   const creditLimit=central?Math.min(200,to.collateral*.60*(1-haircut)):Infinity;
   if(amt>creditLimit+1e-7)return fail(`Action ${k+1}: central-bank intraday credit limit exceeded.`);
   if(pledged>to.collateral*eligibleFraction+1e-7)return fail(`Action ${k+1}: insufficient eligible collateral after haircut.`);
   booked.push({id:k,type:a.type,to:to.id,amount:amt,when,tenor,repayWhen,pledged,haircut,interest,rate,eligibleFraction,creditLimit});
  }
  // Events of the same instant are processed maturity release first, then new funding pledge.
  const ops=[];for(const a of booked){
   if(a.type==='transfer'){ops.push({t:a.when,priority:1,kind:'transfer',item:a});continue;}
   ops.push({t:a.when,priority:2,kind:'fund',item:a});
   if(a.tenor==='same_day')ops.push({t:a.repayWhen,priority:0,kind:'repay',item:a});
  }
  ops.sort((a,b)=>a.t-b.t||a.priority-b.priority||a.item.id-b.item.id);
  const encumbered=Object.fromEntries(state.entities.map(e=>[e.id,0]));
  const activeCentral=Object.fromEntries(state.entities.map(e=>[e.id,0]));
  const ledger=[],outstanding=[];let totalCost=0;
  for(const op of ops){const a=op.item,e=entities[a.to];
   if(op.kind==='transfer'){
    events[a.from].push({when:op.t,amount_musd:-a.amount});events[a.to].push({when:op.t,amount_musd:a.amount});
    ledger.push({when:op.t,type:'Intercompany liquidity transfer',entity:a.to,amount:a.amount,pledged:0,encumbered:round(encumbered[a.to]),note:`${entities[a.from].name} → ${e.name}; Group cash neutral`});continue;
   }
   if(op.kind==='fund'){
    if(encumbered[e.id]+a.pledged>e.collateral+1e-7)return fail(`Overlapping collateral pledges at ${e.name}: eligible pool already encumbered.`);
    if(a.type==='central_bank'&&encumbered[e.id]+a.pledged>e.collateral*a.eligibleFraction+1e-7)return fail(`Central-bank eligible subset of the collateral pool is already encumbered at ${e.name}.`);
    if(a.type==='central_bank'&&activeCentral[e.id]+a.amount>a.creditLimit+1e-7)return fail(`Overlapping intraday central-bank drawdowns exceed the entity limit.`);
    encumbered[e.id]+=a.pledged;if(a.type==='central_bank')activeCentral[e.id]+=a.amount;
    events[e.id].push({when:op.t,amount_musd:a.amount});totalCost+=a.interest;
    ledger.push({when:op.t,type:a.type==='repo'?'Repo funding settled':'Central-bank facility drawn',entity:e.id,amount:a.amount,pledged:a.pledged,encumbered:round(encumbered[e.id]),note:`Haircut ${(a.haircut*100).toFixed(0)}%; ${a.tenor==='overnight'?'T+1 repayment':time(a.repayWhen)+' maturity'}`});
    if(a.tenor==='overnight')outstanding.push({entity:e.id,type:a.type,principal_musd:a.amount,interest_musd:a.interest,due:'T+1',lockedCollateral_musd:a.pledged});
   }else{
    encumbered[e.id]-=a.pledged;if(a.type==='central_bank')activeCentral[e.id]-=a.amount;
    events[e.id].push({when:op.t,amount_musd:-(a.amount+a.interest)});
    ledger.push({when:op.t,type:'Principal + interest repaid; collateral released',entity:e.id,amount:-(a.amount+a.interest),pledged:-a.pledged,encumbered:round(encumbered[e.id]),note:`Repayment includes $${(a.interest*1e6).toFixed(0)} illustrative financing cost`});
   }
  }
  const collateralTimeline=[];for(let t=START;t<=END;t+=STEP){const used=Object.fromEntries(state.entities.map(e=>[e.id,0]));for(const a of booked.filter(a=>a.pledged)){if(a.when<=t&&(a.tenor==='overnight'||t<a.repayWhen))used[a.to]+=a.pledged;}collateralTimeline.push({t,used,groupUsed:round(Object.values(used).reduce((s,v)=>s+v,0))});}
  const groupEvents=Object.values(events).flat();
  const balances={};let groupPath=[];
  for(const e of state.entities){const ev=events[e.id],pts=e.forecast.points.map(p=>({t:p.t,y:p.y+ev.reduce((s,x)=>s+(x.when<=p.t?x.amount_musd:0),0)}));balances[e.id]={points:pts,reserve:e.reserve,opening:e.opening,lowest:Math.min(...pts.filter(x=>x.t>=asOf).map(x=>x.y))};}
  groupPath=state.group.forecast.points.map(p=>({t:p.t,y:p.y+groupEvents.reduce((s,x)=>s+(x.when<=p.t?x.amount_musd:0),0)}));
  for(let i=0;i<groupPath.length;i++){const sum=state.entities.reduce((s,e)=>s+balances[e.id].points[i].y,0);if(Math.abs(sum-groupPath[i].y)>1e-5)return fail('Group/entity cash-flow reconciliation failed.');}
  // Group consolidated cash after transfer and after repayment, not just a permanent add-on.
  // In the deterministic base case the lending entity cannot be pushed under its
  // remaining-day local reserve by an internal transfer. Scenario stress can still
  // reveal breaches; the separate Monte Carlo layer measures that conditional risk.
  for(const a of booked.filter(x=>x.type==='transfer')){const lending=balances[a.from];if(lending.points.some(p=>p.t>=a.when&&p.y<lending.reserve-1e-7))return fail(`Intercompany transfer would breach the lender's local liquidity reserve at ${entities[a.from].name}.`)}
  const future=groupPath.filter(p=>p.t>=asOf);
  const result={eligible:true,reason:'Synthetic collateral inventory, facility windows, repayment sequence and funding costs checked.',events,groupEvents,ledger,outstanding,cost_musd:totalCost,cost_usd:totalCost*1e6,collateralTimeline,balances,groupPath,groupMin:Math.min(...future.map(p=>p.y)),nextDayPrincipal:outstanding.reduce((s,x)=>s+x.principal_musd,0),nextDayDebt:outstanding.reduce((s,x)=>s+x.principal_musd+x.interest_musd,0),actions:booked,asOf};
  return result;
 }
 return {process,time,START,END,STEP};
});