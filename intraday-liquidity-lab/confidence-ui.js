'use strict';
/* FLOWSTATE v7: probability of on-time synthetic USD inflows and P90 scenario to Treasury Optimiser. */
(function(){
 if(typeof window==='undefined'||typeof ConfidenceEngine==='undefined'||typeof CockpitEngine==='undefined')return;
 const core=CockpitEngine,engine=ConfidenceEngine,$=id=>document.getElementById(id);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hm=n=>{n=Math.max(0,Math.round(n));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`};
 const m=v=>`${v<0?'−':''}$${Math.abs(v).toFixed(1)}m`;
 const view=()=> $('cp-view')?.value||'all';
 let model=null,calibration=null,state=null,book=[],selectedId=null,cache=null,scenarioActive=false,lastSeed=null;
 const payments=()=>core.bookFor(book,view()).filter(p=>p.kind==='IN');
 function rebuildList(){if(!$('confidence-payment'))return;
  const rows=payments().sort((a,b)=>b.amount_musd-a.amount_musd),set=new Set(rows.map(p=>p.synthetic_id));
  if(!set.has(selectedId))selectedId=rows[0]?.synthetic_id||null;
  $('confidence-payment').innerHTML=rows.map(p=>`<option value="${esc(p.synthetic_id)}">${esc(p.synthetic_id)} · ${esc(p.product)} · ${m(p.amount_musd)}</option>`).join('');
  if(selectedId)$('confidence-payment').value=selectedId;
 }
 function cutoffMinute(){const value=$('confidence-cutoff').value||'14:00',[h,min]=value.split(':').map(Number);return h*60+min}
 function render(){if(!state||!model||!calibration||!$('settlement-confidence'))return;
  rebuildList();const p=book.find(x=>x.synthetic_id===selectedId),cutoff=cutoffMinute();if(!p)return;
  const c=engine.profile(p,model,calibration,cutoff);
  const st=engine.timingShiftState(core,state,p.synthetic_id,c.high);
  cache={c,st,p};const risk=engine.signal(c.p_by_cutoff,c.cutoff,c.point);
  $('confidence-probability').textContent=`${(100*c.p_by_cutoff).toFixed(1)}%`;
  $('confidence-probability').dataset.level=risk.level;
  $('confidence-window').textContent=`${hm(c.low)} – ${hm(c.high)}`;
  $('confidence-missing').textContent=m(c.expected_missing);
  $('confidence-eta').textContent=hm(c.point);
  $('confidence-risk-bar').style.width=`${(100*c.p_by_cutoff).toFixed(1)}%`;
  $('confidence-signal').innerHTML=`<strong>${esc(risk.label)}</strong><span>${esc(risk.message)}</span>`;
  $('confidence-sample').textContent=`${c.sample_size} synthetic calibration payments · ${esc(c.product)}`;
  $('confidence-payment-context').textContent=`${esc(p.synthetic_id)} · ${esc(p.counterparty)} · ${esc(p.rail)} · ${m(p.amount_musd)} · booked ${hm(p.booking_minute)}`;
  $('confidence-scenario-impact').innerHTML=`<div><span>Group Liquidity Surplus change</span><strong>${st.group_delta>=0?'+':''}${m(st.group_delta)}</strong></div><div><span>Entity Liquidity Surplus change</span><strong>${st.entity_delta>=0?'+':''}${m(st.entity_delta)}</strong></div><div><span>Projected Group LNNCP change</span><strong>${st.lnncp_increase>=0?'+':''}${m(st.lnncp_increase)}</strong></div>`;
  $('confidence-scenario-note').textContent=st.truncated?'P90 exceeds 19:00. What-if preview is clipped at the demo session end; a real tool must model overnight carryover.':'What-if estimates a one-payment P90 delay without changing payment amount; no order is executed.';
  $('confidence-apply').disabled=c.outside_session; // prevents misleading horizon truncation in the global scenario.
  $('confidence-apply').textContent=scenarioActive?'Update P90 Treasury scenario':'Apply P90 timing to Treasury scenario';
  $('confidence-reset').disabled=!scenarioActive;
  const report=calibration.calibration;
  $('confidence-calibration').textContent=`${report.calibration_payments.toLocaleString('en-US')} calibration inflows (held-out); ${report.evaluation_payments.toLocaleString('en-US')} later evaluation inflows. Nominal 80% interval coverage: ${(100*report.evaluation_80pct_interval_coverage).toFixed(1)}% observed. Brier score: ${report.evaluation_brier_score.toFixed(3)} (illustrative synthetic evaluation).`;
 }
 function renderError(text){if($('confidence-calibration'))$('confidence-calibration').textContent=text}
 function selection(id){if(id&&book.some(p=>p.synthetic_id===id&&p.kind==='IN')){const p=book.find(x=>x.synthetic_id===id);if(view()!=='all'&&view()!==p.entity_id){$('cp-view').value=p.entity_id;$('cp-view').dispatchEvent(new Event('change',{bubbles:true}));}selectedId=id;render();}}
 function bind(){if(!$('settlement-confidence'))return;
  $('confidence-payment').addEventListener('change',()=>{selectedId=$('confidence-payment').value;render()});
  $('confidence-cutoff').addEventListener('change',render);
  $('cp-view').addEventListener('change',()=>{selectedId=null;render()});
  $('confidence-apply').addEventListener('click',()=>{if(!cache||cache.c.outside_session)return;
    window.dispatchEvent(new CustomEvent('flowstate:timing-override',{detail:{id:selectedId,minutes:cache.st.conservative_time,mode:'p90'}}));scenarioActive=true;render()});
  $('confidence-reset').addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('flowstate:timing-override',{detail:{mode:'reset'}}));scenarioActive=false;render()});
  $('confidence-open-agent').addEventListener('click',()=>document.getElementById('optimisation-agent')?.scrollIntoView({behavior:'smooth'}));
 }
 window.addEventListener('flowstate:model-ready',e=>{model=e.detail.predict;render()});
 window.addEventListener('flowstate:scenario',e=>{if(!e.detail?.book?.length)return;state=core.simulate(e.detail.book,e.detail);book=state.book;
  if(lastSeed!==null&&lastSeed!==e.detail.seed){selectedId=null;scenarioActive=false;}
  lastSeed=e.detail.seed;render()});
 window.addEventListener('flowstate:entity-selected',()=>{selectedId=null;render()});
 window.addEventListener('flowstate:payment-selected',e=>selection(e.detail?.id));
 const init=async()=>{bind();try{const response=await fetch('model-calibration.json',{cache:'no-store'});if(!response.ok)throw Error('Calibration file HTTP '+response.status);calibration=await response.json();render()}catch(e){renderError('Synthetic calibration unavailable: '+e.message)}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();