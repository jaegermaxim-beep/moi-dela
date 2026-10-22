'use strict';
/* Central scenario/revision listener and advisory approval status. */
(function(){if(typeof window==='undefined'||!window.DecisionState)return;
 const store=window.DecisionState;
 const relevant=new Set([
  'cp-source','cp-target','cp-amount','cp-when','op-asof','op-maxactions','ra-repo-tenor','ra-priority',
  'mc-runs','mc-shock-prob','mc-shock-delay','mc-delay','mc-accel','mc-haircut',
  'fl-type','fl-entity','fl-amount','fl-when','fl-tenor','fl-repay','fl-second',
  'fl-type2','fl-entity2','fl-amount2','fl-when2','fl-tenor2','fl-repay2'
 ]);
 window.addEventListener('flowstate:scenario',ev=>{if(ev.detail?.book)store.onScenario(ev.detail)});
 function draw(s){const label=document.getElementById('ds-status'),info=document.getElementById('ds-meta');if(!label||!info)return;
  label.textContent=s.active?`APPROVED IN DEMO · ${s.active.source.toUpperCase()}`:'NO ACTIVE APPROVAL';
  label.classList.toggle('ds-active',Boolean(s.active));
  info.textContent=`Scenario revision ${s.revision} · ${s.scenario?.paymentCount||0} synthetic payments · ${s.audit.length} decision events · browser-session only`;
  window.dispatchEvent(new CustomEvent('flowstate:decision-updated',{detail:{revision:s.revision,active:s.active}}));
 }
 store.subscribe(draw);
 function init(){for(const id of relevant){const el=document.getElementById(id);if(el)store.changedControl(id,el.type==='checkbox'?el.checked:el.value)}
  document.addEventListener('input',capture,true);document.addEventListener('change',capture,true);
  function capture(ev){const el=ev.target;if(!relevant.has(el.id))return;store.changedControl(el.id,el.type==='checkbox'?el.checked:el.value)}
  document.getElementById('ds-audit')?.addEventListener('click',()=>{const csv=store.toCSV();const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download='flowstate_unified_decision_audit_SYNTHETIC.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)});
  draw(store.snapshot());
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();