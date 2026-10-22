'use strict';
/* FLOWSTATE v5: explainable, human-controlled plan comparison over synthetic payment curves. */
(function(){
 const core=typeof CockpitEngine!=='undefined'?CockpitEngine:null,engine=typeof OptimiserEngine!=='undefined'?OptimiserEngine:null;
 if(!core||!engine||typeof window==='undefined')return;
 const $=id=>document.getElementById(id);const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const m=v=>`${v<0?'−':''}$${Math.abs(v).toFixed(0)}m`,fee=v=>v<1000?`$${v.toFixed(0)}`:`$${(v/1000).toFixed(1)}k`;
 let state=null,plans=null,selectedKey=null,approved=null,audit=[],scenarioEpoch=0;
 const getKey=plan=>plan.actions.map(a=>[a.type,a.source||'-',a.target,a.amount_musd,a.when].join(':')).sort().join('|')||'none';
 function renderPlans(){
  if(!state)return;const asOf=Number($('op-asof').value),maxActions=Number($('op-maxactions').value);
  plans=engine.optimise(state,{asOf,maxActions});
  const list=plans.ranked;selectedKey=list.some(p=>getKey(p)===selectedKey)?selectedKey:getKey(list[0]);
  $('op-considered').textContent=`${plans.considered} eligible configurations assessed · heuristic beam search`;
  $('op-list').innerHTML=list.map((p,i)=>{
   const key=getKey(p),label=p.actions.length?p.actions.map(a=>`${a.type==='repo'?'Intraday repo':'Intercompany transfer'} · ${escape(a.target)}`).join(' + '):'No funding action';
   const stateClass=p.after.unmet<.05?'covered':'uncovered';
   return `<button class="op-plan ${selectedKey===key?'selected':''}" type="button" data-key="${escape(key)}" aria-pressed="${selectedKey===key?'true':'false'}"><span class="op-plan-head"><strong>${i+1}. ${label}</strong><em class="op-status ${stateClass}">${p.after.unmet<.05?'Local floors covered':'Residual shortfall'}</em></span><span class="op-plan-metrics"><span><small>Uncovered gap</small><b>${m(p.after.unmet)}</b></span><span><small>Cost assumption</small><b>${fee(p.costUsd)}</b></span><span><small>Actions</small><b>${p.actions.length}</b></span></span></button>`;
  }).join('');
  $('op-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedKey=b.dataset.key;renderPlans()}));
  renderSelection();
 }
 function selected(){return plans?.ranked.find(p=>getKey(p)===selectedKey)||null;}
 function renderSelection(){
  const plan=selected();if(!plan)return;
  window.DecisionState?.stage('optimiser',{eligible:plan.actions.length>0&&plan.reduction>.05,key:getKey(plan),actions:plan.actions,asOf:Number($('op-asof').value),searchDepth:Number($('op-maxactions').value)});
  $('op-plan-title').textContent=plan.actions.length?`${plan.actions.length}-step Treasury response`:'Maintain current liquidity position';
  $('op-rationale').textContent=engine.rationale(plan);
  $('op-gap-before').textContent=m(plan.before.unmet);
  $('op-gap-after').textContent=m(plan.after.unmet);
  $('op-cost').textContent=fee(plan.costUsd);
  $('op-group-change').textContent=m(plan.after.cashFloor-plan.before.cashFloor);
  $('op-steps').innerHTML=plan.actions.length?plan.actions.map((a,i)=>`<li><b>Step ${i+1}:</b> ${a.type==='repo'?`Intraday repo for ${escape(state.entityById(a.target).short)} with haircut-adjusted collateral`:`Internal liquidity transfer from ${escape(state.entityById(a.source).short)} to ${escape(state.entityById(a.target).short)}`} · ${m(a.amount_musd)} · ${engine.time(a.when)}</li>`).join(''):'<li>No action recommended beyond continued monitoring.</li>';
  $('op-entity-effects').innerHTML=state.entities.map(e=>{
   const before=plan.before.byId[e.id],after=plan.after.byId[e.id];return `<div class="op-entity-effect"><span>${escape(e.short)}</span><strong>${m(before.gap)} → ${m(after.gap)}</strong><small>uncovered reserve gap</small></div>`;
  }).join('');
  $('op-controls').innerHTML=[...plan.controls,...plan.limitations].map((t,i)=>`<li class="${i<plan.controls.length?'op-pass':'op-limit'}">${i<plan.controls.length?'✓':'!'} ${escape(t)}</li>`).join('');
  $('op-approve').disabled=!plan.actions.length||plan.reduction<.05;
  $('op-approve').textContent=plan.actions.length?'Approve selected plan in simulation':'No action to approve';
  $('op-review-note').textContent=plan.after.unmet>.05?'Coverage remains incomplete. Manual contingency assessment is required even if this plan is simulated as approved.':'Projected local minimum reserves are covered under this synthetic scenario only.';
 }
 function auditRender(){
  $('op-audit').innerHTML=audit.length?audit.slice().reverse().map(a=>`<div class="op-audit-item"><b>${escape(a.action)}</b><small>${escape(a.time)} · ${escape(a.detail)}</small></div>`).join(''):'No simulated optimisation decisions recorded.';
 }
 function decision(accept){
  const plan=selected(),asOf=Number($('op-asof').value);if(!plan)return;
  const fresh=engine.evaluate(state,plan.actions,asOf);if(accept&&(!fresh.eligible||!plan.actions.length||fresh.reduction<.05)){
   $('op-decision').textContent='Approval blocked: candidate fails the current eligibility or usefulness checks.';return;
  }
  const ds=window.DecisionState;if(ds){const result=ds.decide('optimiser',accept?'APPROVED':'REJECTED',getKey(plan),ds.snapshot().revision);if(!result.ok){$('op-decision').textContent=result.reason;return;}}
  const status=accept?'APPROVED IN SIMULATION':'REJECTED IN SIMULATION';const when=new Date().toISOString();
  audit.push({time:when,action:status,detail:`${plan.actions.length} proposed steps, simulated cost ${fee(plan.costUsd)}, remaining uncovered local gap ${m(plan.after.unmet)}.`});
  approved=accept?{epoch:scenarioEpoch,plan:fresh}:null;
  $('op-decision').textContent=accept?'Approved for demonstration only. No funding, collateral pledge, intercompany transfer or payment instruction was executed.':'Rejected. Baseline simulated liquidity remains unchanged.';
  window.dispatchEvent(new CustomEvent('flowstate:optimiser-approval',{detail:{plan:approved?.plan||null,epoch:scenarioEpoch}}));
  auditRender();
 }
 function onScenario(event){const d=event.detail;if(!d?.book?.length)return;
  scenarioEpoch++;if(approved){audit.push({time:new Date().toISOString(),action:'APPROVAL INVALIDATED',detail:'Payment data or scenario assumptions changed.'});approved=null;}
  window.dispatchEvent(new CustomEvent('flowstate:optimiser-approval',{detail:{plan:null,epoch:scenarioEpoch}}));
  state=core.simulate(d.book,d);renderPlans();auditRender();
  if(scenarioEpoch>1)$('op-decision').textContent='Scenario updated. Previous approvals cannot be reused.';
 }
 function exportAudit(){
  const rows=[['timestamp','decision','description'],...audit.map(a=>[a.time,a.action,a.detail])];
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replaceAll('"','""')+'"').join(',')).join('\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='flowstate_v5_optimisation_decision_log.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 function bind(){if(!$('optimisation-agent'))return;
  $('op-asof').addEventListener('change',()=>{if(approved){audit.push({time:new Date().toISOString(),action:'APPROVAL INVALIDATED',detail:'As-of time changed.'});approved=null;window.dispatchEvent(new CustomEvent('flowstate:optimiser-approval',{detail:{plan:null}}));}renderPlans();auditRender()});
  $('op-maxactions').addEventListener('change',()=>{if(approved){audit.push({time:new Date().toISOString(),action:'APPROVAL INVALIDATED',detail:'Plan search depth changed.'});approved=null;window.dispatchEvent(new CustomEvent('flowstate:optimiser-approval',{detail:{plan:null}}));}renderPlans();auditRender()});
  $('op-approve').addEventListener('click',()=>decision(true));$('op-reject').addEventListener('click',()=>decision(false));$('op-audit-download').addEventListener('click',exportAudit);
 }
 let priorDecisionRevision=-1;window.addEventListener('flowstate:decision-updated',ev=>{if(ev.detail.revision!==priorDecisionRevision){priorDecisionRevision=ev.detail.revision;if(state)renderPlans();}if(approved&&ev.detail.active?.source!=='optimiser'){approved=null;window.dispatchEvent(new CustomEvent('flowstate:optimiser-approval',{detail:{plan:null,epoch:scenarioEpoch}}));$('op-decision').textContent='Simulated approval invalidated or replaced in unified ledger.';renderPlans();}});
 window.addEventListener('flowstate:scenario',onScenario);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();