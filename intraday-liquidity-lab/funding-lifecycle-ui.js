'use strict';
/* v10 client demonstration: no external funding instructions, automatic orders or pledges. */
(function(){
 if(typeof window==='undefined'||!window.FundingLifecycleEngine||!window.CockpitEngine)return;
 const core=window.CockpitEngine, engine=window.FundingLifecycleEngine;
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cash=v=>`${v<0?'−':''}$${Math.abs(v).toFixed(1)}m`,clock=engine.time;
 let state=null,forecastSignature='',evaluation=null,approval=null,audit=[],revision=0;
 const fields=['fl-type','fl-entity','fl-amount','fl-when','fl-tenor','fl-repay','fl-second','fl-type2','fl-entity2','fl-amount2','fl-when2','fl-tenor2','fl-repay2'];
 const action=(suffix='')=>({type:$('fl-type'+suffix).value,target:$('fl-entity'+suffix).value,amount_musd:Number($('fl-amount'+suffix).value),when:Number($('fl-when'+suffix).value),tenor:$('fl-tenor'+suffix).value,repayWhen:Number($('fl-repay'+suffix).value)});
 function actions(){return [action(),...($('fl-second').checked?[action('2')]:[])];}
 function options(){return {asOf:Number($('op-asof')?.value||720)};}
 function renderPaths(){if(!state||!evaluation?.eligible){$('fl-chart').innerHTML='';return}
  const a=state.group.forecast.points,b=evaluation.groupPath,n=a.length;
  const values=[...a.map(x=>x.y),...b.map(x=>x.y)],min=Math.min(...values)-30,max=Math.max(...values)+30,dx=740/(n-1),y=v=>180-(v-min)/(max-min)*148;
  const path=arr=>arr.map((p,i)=>(i?'L':'M')+(34+i*dx).toFixed(1)+' '+y(p.y).toFixed(1)).join(' ');
  const floor=state.entities.reduce((s,e)=>s+e.reserve,0);
  $('fl-chart').innerHTML=`<svg viewBox="0 0 820 210" role="img" aria-label="Funding cash balances: baseline versus after the full repo and central bank funding lifecycle"><line x1="32" x2="782" y1="${y(floor).toFixed(1)}" y2="${y(floor).toFixed(1)}" stroke="#d9a359" stroke-dasharray="5 5" stroke-width="1.5"/><path d="${path(a)}" fill="none" stroke="#9fb0c4" stroke-width="2.5"/><path d="${path(b)}" fill="none" stroke="#51dec2" stroke-width="3"/><text x="35" y="204" fill="#889db0" font-size="13">07:30</text><text x="700" y="204" fill="#889db0" font-size="13">19:00</text></svg>`;
 }
 function renderLedger(){const e=evaluation;
  $('fl-status').textContent=e?.eligible?'CONTROLS PASSED · SIMULATION':`ACTION BLOCKED · ${e?.reason||'Waiting for funding scenario'}`;
  $('fl-status').className='fl-status '+(e?.eligible?'pass':'blocked');
  $('fl-approve').disabled=!e?.eligible||!e.actions.length;
  if(!e?.eligible){for(const id of ['fl-min','fl-cost','fl-debt','fl-enc'])$(id).textContent='—';$('fl-ledger').innerHTML='';$('fl-nextday').textContent='No eligible funding schedule to show.';renderPaths();return}
  $('fl-min').textContent=cash(e.groupMin);$('fl-cost').textContent=`$${e.cost_usd.toFixed(0)}`;
  $('fl-debt').textContent=cash(e.nextDayDebt);
  $('fl-enc').textContent=cash(Math.max(...e.collateralTimeline.map(p=>p.groupUsed)));
  $('fl-ledger').innerHTML=e.ledger.map(x=>`<tr><td>${clock(x.when)}</td><td>${esc(x.type)}</td><td>${esc(state.entityById(x.entity)?.short||'—')}</td><td>${cash(x.amount)}</td><td>${cash(x.encumbered)}</td><td>${esc(x.note)}</td></tr>`).join('');
  $('fl-nextday').textContent=e.outstanding.length?`${e.outstanding.length} T+1 funding obligation(s): repay ${cash(e.nextDayDebt)} next business day. Collateral remains encumbered at 19:00 and is NOT re-used within this session.`:'No overnight funding obligation outstanding at 19:00; same-day maturity and collateral release are reflected in the curve.';
  renderPaths();
 }
 function invalidate(reason){revision++;if(approval){audit.push({at:new Date().toISOString(),status:'INVALIDATED',note:reason});approval=null;$('fl-decision').textContent='Earlier demo approval invalidated by changed funding or payment assumptions.';renderAudit();}}
 function calculate(){if(!state){$('fl-status').textContent='Awaiting synthetic payment book';return}
  evaluation=engine.process(state,actions(),options());window.DecisionState?.stage('funding-lifecycle',{eligible:evaluation?.eligible,actions:actions(),options:options()});renderLedger();}
 function renderAudit(){$('fl-audit').innerHTML=audit.length?audit.slice(-5).reverse().map(a=>`<p><strong>${esc(a.status)}</strong> · ${esc(a.at)} · ${esc(a.note)}</p>`).join(''):'No simulated lifecycle decisions.';}
 function decision(ok){if(!evaluation?.eligible&&ok)return;const ds=window.DecisionState;if(ds){const result=ds.decide('funding-lifecycle',ok?'APPROVED':'REJECTED',JSON.stringify(actions()),ds.snapshot().revision);if(!result.ok){$('fl-decision').textContent=result.reason;return;}}const stamp=new Date().toISOString();approval=ok?{revision}:null;
  const note=ok?`${evaluation.actions.length} funding action(s), ${cash(evaluation.nextDayDebt)} due T+1, ${cash(evaluation.cost_musd)} synthetic financing cost; no external execution.`:'Funding lifecycle proposal rejected; no operation executed.';
  audit.push({at:stamp,status:ok?'APPROVED IN SIMULATION':'REJECTED IN SIMULATION',note});$('fl-decision').textContent=note;renderAudit();}
 function optionTimes(id,min,max,initial){const select=$(id);select.innerHTML=Array.from({length:Math.floor((max-min)/15)+1},(_,i)=>min+i*15).map(t=>`<option value="${t}">${clock(t)}</option>`).join('');select.value=String(initial);}
 function syncTenor(s=''){$('fl-repay'+s).disabled=$('fl-tenor'+s).value!=='same_day';if($('fl-type'+s).value==='central_bank'){$('fl-tenor'+s).value='same_day';$('fl-tenor'+s).disabled=true;$('fl-repay'+s).disabled=false;}else $('fl-tenor'+s).disabled=false;}
 function bind(){for(const id of fields){const el=$(id);el.addEventListener('input',()=>{if(id==='fl-second')$('fl-additional').hidden=!el.checked;
   if(id.startsWith('fl-type')||id.startsWith('fl-tenor'))syncTenor(id.endsWith('2')?'2':'');
   invalidate('Funding lifecycle input changed.');calculate();});}
  $('fl-approve').addEventListener('click',()=>decision(true));$('fl-reject').addEventListener('click',()=>decision(false));
  $('fl-export').addEventListener('click',()=>{const csv=[['timestamp','status','notes'],...audit.map(x=>[x.at,x.status,x.note])].map(row=>row.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));let a=document.createElement('a');a.href=url;a.download='flowstate_v10_funding_lifecycle_audit.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)});
  let priorDecisionRevision=-1;window.addEventListener('flowstate:decision-updated',ev=>{if(ev.detail.revision!==priorDecisionRevision){priorDecisionRevision=ev.detail.revision;if(state)calculate();}if(approval&&ev.detail.active?.source!=='funding-lifecycle'){approval=null;$('fl-decision').textContent='Approval invalidated or replaced in unified ledger.';renderAudit();}});
  window.addEventListener('flowstate:scenario',event=>{const d=event.detail;if(!d?.book?.length)return;const sig=[d.seed,d.delay,d.accel,d.opening,JSON.stringify(d.book.map(p=>[p.id,p.forecast_minute]))].join(':');if(state&&sig!==forecastSignature)invalidate('Cash-flow forecast or SoD Liquidity Position changed.');forecastSignature=sig;state=core.simulate(d.book,d);calculate()});
  $('op-asof').addEventListener('change',()=>{invalidate('Treasury decision time changed.');calculate()});
 }
 function init(){if(!$('funding-lifecycle'))return;for(const suffix of ['','2']){optionTimes('fl-when'+suffix,570,960,suffix?900:780);optionTimes('fl-repay'+suffix,780,1140,suffix?1050:900);}syncTenor();syncTenor('2');bind();renderAudit();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();