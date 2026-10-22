'use strict';
/* FLOWSTATE v9 — in-browser scenario-informed recommendations; no external actions. */
(function(){
 if(typeof window==='undefined'||!window.RiskPlanEngine||!window.OptimiserEngine||!window.CockpitEngine)return;
 const core=window.CockpitEngine,opt=window.OptimiserEngine,engine=window.RiskPlanEngine;
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=x=>`${x<0?'−':''}$${Math.abs(x).toFixed(0)}m`,percent=x=>`${(100*x).toFixed(1)}%`,fee=x=>x<1000?`$${x.toFixed(0)}`:`$${(x/1000).toFixed(1)}k`;
 let scenario=null,cal=null,assessment=null,selection=null,approval=null,audit=[],epoch=0,timer=null;
 const params=()=>({runs:Number($('mc-runs').value),seed:20261022,shockProbability:Number($('mc-shock-prob').value)/100,shockDelay:Number($('mc-shock-delay').value),stressDelay:Number($('mc-delay').value),stressAccel:Number($('mc-accel').value),stressHaircut:Number($('mc-haircut').value)/100,repoTenor:$('ra-repo-tenor').value});
 const asOf=()=>Number($('op-asof').value),maxActions=()=>Number($('op-maxactions').value);
 function effectiveRank(items){const p=$('ra-priority').value;return items.slice().sort((a,b)=>{
  if(p==='group')return a.probGroup-b.probGroup||a.probLocal-b.probLocal||a.expectedGap-b.expectedGap||a.costUsd-b.costUsd;
  if(p==='severity')return a.expectedGap-b.expectedGap||a.probLocal-b.probLocal||a.probGroup-b.probGroup||a.costUsd-b.costUsd;
  return Number(a.increasesIndividualEntityRisk)-Number(b.increasesIndividualEntityRisk)||a.probLocal-b.probLocal||a.expectedGap-b.expectedGap||a.probGroup-b.probGroup||a.costUsd-b.costUsd;
 });}
 function label(p){if(!p.actions.length)return 'No funding action · reference';return p.actions.map(a=>`${a.type==='repo'?'Intraday repo':'Intercompany transfer'} to ${a.target==='group-treasury'?'Group Treasury':a.target==='investment-bank'?'Investment Services':'International Branch'} · $${a.amount_musd.toFixed(0)}m`).join(' + ')}
 function tag(p,baseline){if(!p.actions.length)return 'Reference';if(p.increasesIndividualEntityRisk)return 'Entity-risk transfer';if(p.probLocal<baseline.probLocal-.00001)return 'Lower breach risk';if(p.expectedGap<baseline.expectedGap-.00001)return 'Lower gap severity';return 'No measured improvement'}
 function invalidate(reason){if(approval){audit.push({when:new Date().toISOString(),status:'INVALIDATED',details:reason});approval=null;$('ra-decision').textContent='Earlier demonstration approval invalidated. Please review updated outcomes.'}auditDisplay();}
 function riskRender(){if(!assessment)return;const b=assessment.baseline,ranking=effectiveRank(assessment.ranked);
  const selected=ranking.find(p=>p.key===selection)||ranking[0];selection=selected.key;
  window.DecisionState?.stage('risk-aware',{key:selected.key,assumptions:params(),asOf:assessment.asOf,eligible:selected.actions.length>0&&!selected.increasesIndividualEntityRisk&&!selected.increasesEntityRisk&&!selected.increasesGroupRisk&&selected.expectedGapReduction>.001});
  $('ra-plan-list').innerHTML=ranking.map((p,i)=>`<button type="button" data-plan="${esc(p.key)}" aria-pressed="${p.key===selection}" class="ra-plan ${p.key===selection?'selected':''}"><span class="ra-plan-top"><strong>${i+1}. ${esc(label(p))}</strong><em>${esc(tag(p,b))}</em></span><small>${p.actions.length} action(s) · cost ${fee(p.costUsd)} · P(local reserve breach) ${percent(p.probLocal)}</small><div class="ra-plan-metrics"><span>Expected local gaps<b>${money(p.expectedGap)}</b></span><span>P(Group reserve breach)<b>${percent(p.probGroup)}</b></span><span>Stress surplus P10<b>${money(p.surplusP10)}</b></span></div></button>`).join('');
  $('ra-plan-list').querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{selection=button.dataset.plan;riskRender()}));
  $('ra-before-p').textContent=percent(b.probLocal);$('ra-after-p').textContent=percent(selected.probLocal);
  $('ra-delta-p').textContent=`${selected.deltaLocalPp>=0?'−':'+'}${Math.abs(selected.deltaLocalPp).toFixed(1)} percentage points relative to baseline`;
  $('ra-before-gap').textContent=money(b.expectedGap);$('ra-after-gap').textContent=money(selected.expectedGap);
  $('ra-gap-change').textContent=`${selected.expectedGapReduction>=0?'−':'+'}${money(Math.abs(selected.expectedGapReduction))} expected shortfall`;
  $('ra-plan-title').textContent=label(selected);$('ra-group-p').textContent=`${percent(b.probGroup)} → ${percent(selected.probGroup)}`;
  $('ra-surplus').textContent=money(selected.surplusP10);$('ra-hours').textContent=`${selected.expectedDeficitHours.toFixed(1)}m·h`;
  $('ra-cost').textContent=fee(selected.costUsd);
  $('ra-before-bar').style.width=`${Math.round(b.probLocal*100)}%`;$('ra-after-bar').style.width=`${Math.round(selected.probLocal*100)}%`;
  $('ra-before-bar-p').textContent=percent(b.probLocal);$('ra-after-bar-p').textContent=percent(selected.probLocal);
  $('ra-entities').innerHTML=selected.entity.map((e,i)=>`<tr><td>${esc(e.name)}</td><td>${percent(b.entity[i].probReserve)}</td><td>${percent(e.probReserve)}</td><td>${money(e.expectedGap)}</td></tr>`).join('');
  const pair=assessment.paired.find(x=>x.key===selected.key);
  $('ra-rationale').textContent=`Compared across the same ${assessment.runs} simulated stress draws from ${String(Math.floor(assessment.asOf/60)).padStart(2,'0')}:${String(assessment.asOf%60).padStart(2,'0')}. Estimated local shortfall magnitude improves in ${percent(pair.improvedFraction)} of draws and worsens in ${percent(pair.worsenedFraction)}. Risk impacts are relative to no action, not guarantees.`;
  const serious=selected.probLocal>=.95?'Local breaches remain very likely in the assumed stress. ':'';
  const shifted=selected.increasesIndividualEntityRisk?'RISK TRANSFER: individual reserve-breach likelihood increases for '+selected.entityRiskShift.map(e=>e.name+' (+'+e.increasePp.toFixed(1)+'pp)').join(', ')+'. Simulation approval is blocked. ':'';
  $('ra-control-note').textContent=shifted+serious+`Planning checks: no retroactive funding, transferability restrictions, local reserve protection under the deterministic screen, settled repo capacity after collateral haircut. Random payment delays can still breach reserves after a plan. Intraday repo repayment is not modelled.`;
  $('ra-control-note').classList.toggle('ra-warning',selected.probLocal>=.95||selected.increasesEntityRisk||selected.increasesIndividualEntityRisk);
  $('ra-approve').disabled=selected.actions.length===0||selected.increasesEntityRisk||selected.increasesGroupRisk||selected.increasesIndividualEntityRisk||selected.expectedGapReduction<=.001;
  $('ra-approve').title=$('ra-approve').disabled?'Approval requires at least one eligible action and a demonstrated risk-severity improvement, without an increase in any individual legal-entity breach likelihood.':'Human approval required; no actual transfer will occur.';
 }
 function assess(){if(!scenario?.book?.length||!cal)return;
  try{
   const p=params(),state=core.simulate(scenario.book,scenario),decision=asOf(),depth=maxActions();
   const baseCandidates=opt.optimise(state,{asOf:decision,maxActions:depth}).ranked;
   const stressedState=core.simulate(scenario.book,{...state.opts,opening:state.opts.opening*(1-p.stressHaircut),delay:state.opts.delay+p.stressDelay,accel:state.opts.accel+p.stressAccel});
   const stressCandidates=opt.optimise(stressedState,{asOf:decision,maxActions:depth}).ranked;
   const accepted=[],seen=new Set();
   for(const c of [...baseCandidates,...stressCandidates]){
    const k=engine.key(c.actions);if(seen.has(k))continue;
    const valid=opt.evaluate(state,c.actions,decision);
    if(!valid.eligible)continue;
    seen.add(k);accepted.push({...valid,label:label(c)});if(accepted.length>=11)break;
   }
   if(!seen.has('none'))accepted.push(opt.evaluate(state,[],decision));
   assessment=engine.compare(state,cal,p,accepted,decision);
   $('ra-asof').innerHTML=`<option value="${decision}">${String(Math.floor(decision/60)).padStart(2,'0')}:${String(decision%60).padStart(2,'0')} · linked to Treasury Agent</option>`;
   $('ra-shortlist').textContent=`${assessment.shortlistCount} control-screened candidates · ${assessment.runs} paired stress draws`;
   $('ra-run-meta').textContent=`${assessment.sourceCount} synthetic payments · common payment-system shock ${Math.round(p.shockProbability*100)}% (assumed) · no real-bank calibration`;
   selection=assessment.ranked.some(x=>x.key===selection)?selection:null;riskRender();$('ra-status').textContent='Risk-aware comparison recomputed. No funding action has been executed.';
  }catch(e){assessment=null;$('ra-status').textContent='Risk-aware comparison unavailable: '+e.message;console.error(e)}
 }
 function schedule(reason){invalidate(reason);if(timer)clearTimeout(timer);timer=setTimeout(assess,90)}
 function auditDisplay(){$('ra-audit').innerHTML=audit.length?audit.slice(-5).reverse().map(x=>`<p><b>${esc(x.status)}</b> · ${esc(x.when)} · ${esc(x.details)}</p>`).join(''):'No risk-aware approvals recorded.'}
 function decision(approve){const p=assessment?.ranked.find(x=>x.key===selection);if(!p)return;
  if(approve&&$('ra-approve').disabled){$('ra-decision').textContent='Approval blocked by the current demo risk and eligibility criteria.';return}
  const ds=window.DecisionState;if(ds){const result=ds.decide('risk-aware',approve?'APPROVED':'REJECTED',String(p.key),ds.snapshot().revision);if(!result.ok){$('ra-decision').textContent=result.reason;return;}}
  const status=approve?'APPROVED IN SIMULATION':'REJECTED IN SIMULATION';
  approval=approve?{epoch,key:p.key,assumptions:params(),asOf:assessment.asOf}:null;
  audit.push({when:new Date().toISOString(),status,details:`${p.actions.length} actions; model-implied local risk ${percent(p.probLocal)}; expected residual local gaps ${money(p.expectedGap)}; illustrative cost ${fee(p.costUsd)}. No actual transaction.`});
  $('ra-decision').textContent=approve?'Human demo approval recorded. No repo booking, transfer, collateral pledge or payment has been sent.':'Proposal rejected in simulation. Current funding baseline is unchanged.';
  auditDisplay();
 }
 function exportLog(){const r=[['timestamp','decision','description'],...audit.map(x=>[x.when,x.status,x.details])];const csv=r.map(x=>x.map(z=>'"'+String(z).replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='flowstate_v9_risk_aware_funding_audit.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
 function bind(){if(!$('risk-aware-plans'))return;
  $('ra-priority').addEventListener('change',()=>{invalidate('Risk ranking priority changed.');riskRender()});
  for(const id of ['mc-runs','mc-shock-prob','mc-shock-delay','mc-delay','mc-accel','mc-haircut'])$(id).addEventListener('input',()=>schedule('Monte Carlo stress assumptions changed.'));
  for(const id of ['op-asof','op-maxactions','ra-repo-tenor'])$(id).addEventListener('change',()=>schedule('Funding tenor or plan horizon changed.'));
  $('ra-approve').addEventListener('click',()=>decision(true));$('ra-reject').addEventListener('click',()=>decision(false));$('ra-export').addEventListener('click',exportLog);
  let priorDecisionRevision=-1;window.addEventListener('flowstate:decision-updated',ev=>{if(ev.detail.revision!==priorDecisionRevision){priorDecisionRevision=ev.detail.revision;if(scenario&&cal)schedule('Scenario revision changed in unified decision state.');}if(approval&&ev.detail.active?.source!=='risk-aware'){approval=null;$('ra-decision').textContent='Approval invalidated or replaced in unified ledger.';auditDisplay();}});
 window.addEventListener('flowstate:scenario',ev=>{if(!ev.detail?.book?.length)return;scenario=ev.detail;epoch++;schedule('Payment book or liquidity assumptions changed.')});
 }
 async function init(){bind();try{const r=await fetch('model-calibration.json',{cache:'no-store'});if(!r.ok)throw Error('Calibration HTTP '+r.status);cal=await r.json();assess();}catch(e){$('ra-status').textContent='Synthetic calibration unavailable: '+e.message;}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();