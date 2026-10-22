'use strict';
/* FLOWSTATE v5. Pure, deterministic, synthetic Treasury plan search; never executes transactions. */
(function(root,factory){const v=factory();if(typeof module==='object'&&module.exports)module.exports=v;if(root)root.OptimiserEngine=v;})(typeof globalThis!=='undefined'?globalThis:null,function(){
  const MIN=450,MAX=1140;
  const round5=x=>Math.max(0,Math.round(x/5)*5);
  const up15=x=>Math.ceil(x/15)*15;
  const validTime=x=>Number.isInteger(x)&&x>=MIN&&x<=MAX&&x%15===0;
  const uniqueActionId=a=>[a.type,a.source||'-',a.target,a.when,a.amount_musd].join(':');
  const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
  const time=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
  const costFor=a=>a.type==='repo'?a.amount_musd*(.0525/360)+.004:a.amount_musd*.00001+.001;
  function project(state,actions=[],asOf=720){
    if(!state||!Array.isArray(state.entities)||!Array.isArray(actions)||!validTime(asOf))throw Error('Invalid synthetic scenario');
    let events=Object.fromEntries(state.entities.map(ent=>[ent.id,[]]));
    for(const a of actions){
      if(a.type==='transfer'){events[a.source]?.push({when:a.when,amount_musd:-a.amount_musd});events[a.target]?.push({when:a.when,amount_musd:a.amount_musd});}
      else if(a.type==='repo')events[a.target]?.push({when:a.when,amount_musd:a.amount_musd});
    }
    const byId={};let unmet=0, area=0, worst=0;
    for(const ent of state.entities){
      const pts=ent.forecast.points.map(p=>({t:p.t,y:p.y+events[ent.id].reduce((sum,a)=>sum+(a.when<=p.t?a.amount_musd:0),0)}));
      const future=pts.filter(p=>p.t>=asOf);
      const min=Math.min(...future.map(p=>p.y));
      const gap=Math.max(0,ent.reserve-min);
      const deficitHours=future.reduce((sum,p)=>sum+Math.max(0,ent.reserve-p.y)*.25,0);
      byId[ent.id]={id:ent.id,name:ent.name,reserve:ent.reserve,minimum:min,gap,deficitHours,points:pts};
      unmet+=gap;area+=deficitHours;worst=Math.max(worst,gap);
    }
    const group=state.group.forecast.points.map(p=>({t:p.t,y:p.y+actions.reduce((sum,a)=>sum+(a.type==='repo'&&a.when<=p.t?a.amount_musd:0),0)}));
    let cashFloor=Math.min(...group.map(p=>p.y));
    const spend=actions.reduce((s,a)=>s+costFor(a),0);
    return {byId,group,unmet,deficitHours:area,worst,cashFloor,spend,actions:actions.map(x=>({...x})),asOf};
  }
  function validate(state,actions=[],asOf=720){
    if(!Array.isArray(actions)||actions.length>3)return {valid:false,reason:'Up to three simulated actions are supported.'};
    if(!validTime(asOf))return {valid:false,reason:'Invalid as-of time.'};
    const usedRepo={};let transferCount=0;
    for(const a of actions){
      const amt=Number(a.amount_musd),when=Number(a.when),to=state.entities.find(x=>x.id===a.target),from=state.entities.find(x=>x.id===a.source);
      if(!Number.isFinite(amt)||amt<=0||amt>1000||!validTime(when)||when<asOf)return {valid:false,reason:'Amount or settlement time is invalid, or precedes decision time.'};
      if(!to)return {valid:false,reason:'Receiving entity does not exist.'};
      if(a.type==='transfer'){
        transferCount++;
        if(!from||!from.transferable||from.id===to.id)return {valid:false,reason:'Transfer source blocked by legal-entity restrictions.'};
        if(when<600||when>990)return {valid:false,reason:'Transfers must settle between 10:00 and 16:30.'};
      }else if(a.type==='repo'){
        if(when<720||when>960)return {valid:false,reason:'Repo can settle only between 12:00 and 16:00.'};
        usedRepo[a.target]=(usedRepo[a.target]||0)+amt;
        if(usedRepo[a.target]>to.collateral*(1-to.haircut)+1e-7)return {valid:false,reason:'Aggregate repo exceeds haircut-adjusted unencumbered collateral.'};
      }else return {valid:false,reason:'Only internal transfer and collateralised repo are supported.'};
    }
    // The source's local reserve is protected over the entire remaining day following each transfer.
    // Compare source with action-free baseline: do not disallow a separate stressed shortfall prior to transfer.
    for(const a of actions.filter(x=>x.type==='transfer')){
      const from=state.entities.find(x=>x.id===a.source);
      const withActions=project(state,actions,asOf).byId[from.id].points.filter(p=>p.t>=a.when);
      if(withActions.some(p=>p.y<from.reserve-1e-6))return {valid:false,reason:`Local reserve floor breached at ${from.name} after planned transfer.`};
    }
    return {valid:true,reason:'Transferability, projected source reserves, settlement windows and aggregate repo collateral checked.',transferCount};
  }
  function evaluate(state,actions=[],asOf=720){
    const control=validate(state,actions,asOf);if(!control.valid)return {eligible:false,reason:control.reason,actions};
    const before=project(state,[],asOf),after=project(state,actions,asOf);
    const reduction=before.unmet-after.unmet;
    const allClear=after.unmet<.05;
    // Lexicographic optimisation: first uncovered liquidity below local floor, then area, cost, number of actions.
    const score=after.unmet*1000+after.deficitHours*.15+after.spend*10+actions.length*.45;
    return {eligible:true,actions:actions.map(x=>({...x})),before,after,reduction,allClear,score,costUsd:after.spend*1e6,
     controls:['No cross-entity cash creation from internal transfers','Source local reserve floor protected','Aggregated repo collateral capacity after haircut','Settlement window and as-of cut-off enforced','No change to Time-Specific Obligations'],
     limitations:['Simulated intraday cash curves and funding prices','No real collateral eligibility, legal opinion or transferability assessment','No settlement execution, payment transmission or commitment']};
  }
  function candidateActions(state,plan,asOf){
    const current=evaluate(state,plan,asOf);if(!current.eligible)return [];
    const after=current.after,candidates=[];
    const transferTimes=[Math.max(600,up15(asOf)),Math.max(600,up15(asOf)+60)].filter((v,i,a)=>v<=990&&a.indexOf(v)===i);
    const repoTimes=[Math.max(720,up15(asOf)),Math.max(720,up15(asOf)+60)].filter((v,i,a)=>v<=960&&a.indexOf(v)===i);
    for(const target of state.entities){
      const need=after.byId[target.id].gap;
      if(need<1)continue;
      for(const when of transferTimes){
        for(const source of state.entities){
          if(source.id===target.id||!source.transferable)continue;
          const forward=after.byId[source.id].points.filter(p=>p.t>=when);
          const available=forward.length?Math.max(0,Math.min(...forward.map(p=>p.y))-source.reserve):0;
          if(available<5)continue;
          const amount=Math.min(round5(available),round5(need+10));
          if(amount>=5)candidates.push({type:'transfer',source:source.id,target:target.id,amount_musd:amount,when});
        }
      }
      for(const when of repoTimes){
        const already=plan.filter(a=>a.type==='repo'&&a.target===target.id).reduce((s,a)=>s+a.amount_musd,0);
        const cap=target.collateral*(1-target.haircut)-already;
        if(cap<5)continue;
        const amount=Math.min(round5(cap),round5(need+10));
        if(amount>=5)candidates.push({type:'repo',target:target.id,amount_musd:amount,when});
      }
    }
    return candidates;
  }
  function optimise(state,opts={}){
    const asOf=Number(opts.asOf??720),maxActions=clamp(Number(opts.maxActions??3),1,3);
    if(!validTime(asOf))throw Error('Choose a valid 15-minute as-of time.');
    const baseline=evaluate(state,[],asOf);
    const all=[baseline],seen=new Set(['']);let beam=[baseline];
    for(let depth=1;depth<=maxActions;depth++){
      let next=[];
      for(const p of beam){
        for(const a of candidateActions(state,p.actions,asOf)){
          const actions=[...p.actions,a];const key=actions.map(uniqueActionId).sort().join('|');
          if(seen.has(key))continue;seen.add(key);
          const evaluation=evaluate(state,actions,asOf);
          if(evaluation.eligible){next.push(evaluation);all.push(evaluation);}
        }
      }
      next.sort((a,b)=>a.score-b.score||a.costUsd-b.costUsd);beam=next.slice(0,14);
      if(!beam.length)break;
    }
    all.sort((a,b)=>a.score-b.score||a.costUsd-b.costUsd);
    const distinct=[];const signatures=new Set();
    for(const p of all){
      const signature=p.actions.length?p.actions.map(a=>`${a.type}:${a.target}`).sort().join('|'):'none';
      if(signatures.has(signature))continue;
      signatures.add(signature);distinct.push(p);
      if(distinct.length>=5)break;
    }
    if(!distinct.some(p=>!p.actions.length))distinct.push(baseline);
    return {asOf,baseline,ranked:distinct,considered:all.length,search:'Heuristic beam search up to 3 actions; not guaranteed globally optimal',synthetic:true};
  }
  function rationale(plan){
    if(!plan.actions.length)return plan.after.unmet<.05?'No action: local reserves are covered in the forward window.':'No action: uncovered local reserve gaps remain, requiring review.';
    const acts=plan.actions.map(a=>`${a.type==='repo'?'Collateralised intraday repo':'Internal liquidity transfer'} ${a.amount_musd.toFixed(0)}m USD to ${a.target} at ${time(a.when)}`).join('; ');
    const extra=plan.after.unmet>.05?`Residual uncovered gap: $${plan.after.unmet.toFixed(0)}m; further actions or earlier funding may be required.`:'Projected local reserve floors covered after the proposed actions.';
    return `${acts}. Reduces sum of local peak reserve deficits by $${plan.reduction.toFixed(0)}m in the ${time(plan.after.asOf)} onward planning window. ${extra}`;
  }
  return {project,validate,evaluate,optimise,rationale,round5,costFor,time};
});