'use strict';
(function(){
 if(typeof window==='undefined'||typeof ClientStudioEngine==='undefined'||typeof CockpitEngine==='undefined')return;
 const q=ClientStudioEngine,$=id=>document.getElementById(id);let state=null,book=null,train=null,cal=null,challenge=null;
 const money=n=>Number.isFinite(n)?`${n<0?'−':''}$${Math.abs(n).toFixed(1)}m`:'—';
 const nf=n=>Number.isFinite(n)?n.toFixed(1):'—';
 const labels={executive:{title:'Executive · 7-minute story',description:'Start at Group Liquidity Surplus, identify local reserve pressure, then show the human-controlled funding recommendation.',dest:'executive'},
  treasury:{title:'Treasury Operations · decision drill-down',description:'Trace forecast payment inflows, local reserve constraints, available collateral, repo settlement and maturity.',dest:'group-cockpit'},
  validation:{title:'Model Risk · independent challenge',description:'Inspect synthetic holdout errors, settlement uncertainty, stress sensitivity and target controls for production validation.',dest:'monitoring'}};
 function updateAudience(mode){const s=labels[mode]||labels.executive;$('studio-audience-title').textContent=s.title;$('studio-audience-description').textContent=s.description;
  $('studio-open').href='#'+s.dest;document.querySelectorAll('[data-studio-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.studioMode===mode);b.setAttribute('aria-pressed',String(b.dataset.studioMode===mode))});}
 function render(){if(!state)return;const out=q.compareFacility(state,$('studio-entity').value,Number($('studio-funding').value),{tenor:$('studio-tenor').value,when:780,repayWhen:930,asOf:720});
  $('studio-before').textContent=out.eligible?money(out.before):'—';$('studio-after').textContent=out.eligible?money(out.after):'—';$('studio-reserve-before').textContent=out.eligible?money(out.baseGap):'—';$('studio-reserve-after').textContent=out.eligible?money(out.afterGap):'—';
  $('studio-cost').textContent=out.eligible?`$${nf(out.costUsd)} estimated funding cost`:'Not available';$('studio-pledge').textContent=out.eligible?money(out.collateral):'—';
  $('studio-obligation').textContent=out.eligible?(out.repayToday?'Same-day principal + interest repaid':'T+1 repayment obligation '+money(out.nextDayDebt)):'—';
  $('studio-result-note').textContent=out.eligible?`${money(out.protectedGap)} less local reserve gap in this fictional scenario; NOT a realised cash saving. The funded amount is subject to collateral and settlement cut-offs.`:out.reason;
  $('studio-result-note').dataset.status=out.eligible?'ok':'reject';
  if(train){const m=q.quality(book,train,cal);$('studio-holdout').textContent=`${nf(m.holdoutMAE)} min vs ${nf(m.holdoutBaselineMAE)} min rules`;
   $('studio-daily-mae').textContent=`${nf(m.dayRFMAE)} / ${nf(m.dayBaselineMAE)} min`;
   $('studio-optimism').textContent=m.optimisticShare===null?'—':(100*m.optimisticShare).toFixed(1)+'%';
   $('studio-calibration').textContent=m.intervalCoverage===undefined?'—':(100*m.intervalCoverage).toFixed(1)+'%';
   $('studio-feature').textContent=`${(100*m.importanceShare).toFixed(1)}% ${m.importanceName}`;
   if(challenge){const models=challenge.models;$('studio-challenger').textContent=nf(models['Gradient boosting challenger'].mae_min)+' min';$('studio-ablation').textContent=nf(models['RF without historical-delay feature'].mae_min)+' min';$('studio-shift').textContent=nf(models['Random Forest (export equivalent)'].delayed_60_min_mae_min)+' min';}
  }
 }
 async function loadEvidence(){try{const [a,b,c]=await Promise.all([fetch('model/training_report.json',{cache:'no-store'}),fetch('model/calibration_report.json',{cache:'no-store'}),fetch('model/challenger_report.json',{cache:'no-store'})]);if(!a.ok||!b.ok||!c.ok)throw Error('evidence HTTP error');train=await a.json();cal=await b.json();challenge=await c.json();render();}catch(err){$('studio-validation-note').textContent='Validation evidence unavailable: '+err.message}}
 function applyScenario(kind){const s={bau:{delay:0,accel:0,opening:2000},late:{delay:75,accel:0,opening:2000},stress:{delay:120,accel:30,opening:1700}}[kind];if(!s)return;
  for(const [id,val] of Object.entries(s))$(id).value=String(val);
  $('delay').dispatchEvent(new Event('input',{bubbles:true}));
  document.querySelectorAll('[data-studio-scenario]').forEach(b=>{b.classList.toggle('selected',b.dataset.studioScenario===kind);b.setAttribute('aria-pressed',String(b.dataset.studioScenario===kind))});}
 function setup(){if(!$('client-studio'))return;document.querySelectorAll('[data-studio-mode]').forEach(b=>b.addEventListener('click',()=>updateAudience(b.dataset.studioMode)));
  document.querySelectorAll('[data-studio-scenario]').forEach(b=>b.addEventListener('click',()=>applyScenario(b.dataset.studioScenario)));
  for(const id of ['studio-entity','studio-funding','studio-tenor'])$(id).addEventListener('change',render);
  $('studio-funding').addEventListener('input',()=>{$('studio-funding-label').textContent=money(Number($('studio-funding').value));render()});
  $('studio-reset').addEventListener('click',()=>applyScenario('bau'));
  $('studio-funding-label').textContent=money(Number($('studio-funding').value));updateAudience('executive');loadEvidence();}
 window.addEventListener('flowstate:scenario',ev=>{if(!ev.detail?.book?.length)return;book=ev.detail.book;state=CockpitEngine.simulate(book,ev.detail);render();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();