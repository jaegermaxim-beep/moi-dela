'use strict';
/* Executive view receives the same scenario as Group Cockpit, with no execution permissions. */
(function(){
 if(typeof window==='undefined'||!window.ExecutiveEngine||!window.CockpitEngine)return;
 const ex=window.ExecutiveEngine,core=window.CockpitEngine;
 const $=id=>document.getElementById(id);
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let summary=null,started=false,step=0,stepTarget=null;
 const steps=[
  {title:'One Group, three legal entities',anchor:'executive',copy:'Start with the consolidated Group Liquidity Surplus and LNNCP. Notice that local reserve limits may be breached even when Group liquidity is positive.',evidence:'Key question: where is the liquidity, and can it be transferred?'},
  {title:'Forecast incoming USD settlement',anchor:'risk-diagnostics',copy:'Open payment-level Explainability. The Random Forest estimates expected settlement timing; its input features and training data are synthetic.',evidence:'Separate expected settlement time from payment amount and from a guaranteed receipt.'},
  {title:'Stress the intraday position',anchor:'mc-distribution',copy:'Compare BaU and stressed distributions of Group Liquidity Surplus and LNNCP. Use explicit assumptions for payment delays and SoD liquidity haircuts.',evidence:'Synthetic shock probabilities are chosen, not independently bank-calibrated.'},
  {title:'Compare risk-aware funding plans',anchor:'risk-aware-plans',copy:'Rank simulated internal transfers and repo funding by residual local shortfalls, entity risk, execution constraints and indicative cost.',evidence:'A Group-positive decision can still be rejected if it transfers risk to another legal entity.'},
  {title:'Human approval and lifecycle',anchor:'funding-lifecycle',copy:'Show the collateral ledger, repo repayments and T+1 obligations. Approval is a browser-only scenario log; it never executes an instruction.',evidence:'Demonstrate control gates, collateral release and decision audit.'}
 ];
 function plot(s){
  const values=ex.viewSeries(s),mn=Math.min(s.group.reserve,...values.flatMap(x=>[x.forecast,x.realised]))-130,mx=Math.max(s.group.reserve,...values.flatMap(x=>[x.forecast,x.realised]))+130;
  const W=880,H=285,L=52,R=14,T=18,B=35;
  const x=t=>L+(t-450)/690*(W-L-R),y=v=>T+(mx-v)/(mx-mn)*(H-T-B);
  const fmt=(a)=>`${(a/1000).toFixed(1)}`;
  const ticks=Array.from({length:5},(_,i)=>mn+(mx-mn)*i/4).map(n=>`<line x1="${L}" x2="${W-R}" y1="${y(n).toFixed(1)}" y2="${y(n).toFixed(1)}" stroke="#2a4255" stroke-dasharray="3 6"/><text x="${L-10}" y="${(y(n)+4).toFixed(1)}" fill="#91a6b8" font-size="10" text-anchor="end">${fmt(n)}</text>`).join('');
  const timeticks=[480,600,720,840,960,1080].map(t=>`<text x="${x(t)}" y="${H-7}" fill="#96aaba" font-size="11" text-anchor="middle">${String(Math.floor(t/60)).padStart(2,'0')}:00</text>`).join('');
  const curve=(k,color,dash)=>`<path d="${values.map((v,i)=>(i?'L':'M')+x(v.time).toFixed(1)+','+y(v[k]).toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="2.8" ${dash?'stroke-dasharray="6 6"':''} stroke-linecap="round" stroke-linejoin="round"/>`;
  const reserveY=y(s.group.reserve);
  const minIndex=values.reduce((a,v,i)=>v.forecast<values[a].forecast?i:a,0),lowest=values[minIndex];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ticks}<line x1="${L}" x2="${W-R}" y1="${reserveY}" y2="${reserveY}" stroke="#f0b774" stroke-width="1.8" stroke-dasharray="6 5"/>${curve('forecast','#43dfc0',false)}${curve('realised','#92a6b9',true)}<circle cx="${x(lowest.time)}" cy="${y(lowest.forecast)}" r="5" fill="#43dfc0" stroke="#0d2435" stroke-width="2"/>${timeticks}<text transform="translate(12,132) rotate(-90)" text-anchor="middle" fill="#829aaf" font-size="9">USD BN</text></svg>`;
 }
 function render(){if(!summary)return;
  $('ex-surplus').textContent=ex.money(summary.group.surplus);$('ex-surplus').classList.toggle('ex-negative',summary.group.surplus<0);
  $('ex-lnncp').textContent=ex.money(summary.group.lnncp);
  $('ex-entities-count').textContent=`${summary.belowReserve} / ${summary.entities.length}`;
  $('ex-sod').textContent=ex.money(summary.group.opening);$('ex-gap').textContent=ex.money(summary.group.peakGap);
  $('ex-level').textContent=summary.status==='SHORTFALL'?'Projected shortfall':summary.status==='WATCH'?'Local risk review':'Within BaU assumptions';
  $('ex-chart').innerHTML=plot(summary);
  $('ex-entity-list').innerHTML=summary.entities.map(e=>{
   const v=Math.max(0,Math.min(100,(e.surplus / Math.max(1,e.opening))*100));
   return `<button type="button" class="ex-entity-row ${e.belowReserve?'watch':''}" data-ex-entity="${esc(e.id)}"><span class="ex-entity-name">${esc(e.name)}<small>${esc(e.transferable?'Transfer subject to capacity':'Restricted outward transfer')}</small></span><span class="ex-bar"><span style="width:${v.toFixed(0)}%"></span></span><span class="ex-entity-value">${ex.money(e.surplus)}<small>${e.belowReserve?'Below local reserve':'Local surplus'}</small></span><span>↗</span></button>`;
  }).join('');
  $('ex-entity-list').querySelectorAll('[data-ex-entity]').forEach(n=>n.addEventListener('click',()=>{
    const sel=$('cp-view');sel.value=n.dataset.exEntity;sel.dispatchEvent(new Event('change',{bubbles:true}));$('group-cockpit').scrollIntoView({behavior:'smooth',block:'start'});
  }));
  $('ex-alerts').innerHTML=summary.alerts.map((a,i)=>`<article class="ex-alert ${a.kind}"><span class="ex-alert-ic">${a.kind==='healthy'?'✓':a.kind==='severe'?'!':'◷'}</span><div><b>${esc(a.title)}</b><p>${esc(a.detail)}</p></div></article>`).join('');
  refreshRisk();
 }
 function refreshRisk(){
  if(!summary)return;
  const source=$('mc-stress-group-breach')?.textContent.trim()||'';
  const val=Number.parseFloat(source.replace('%',''));
  const isValid=source.endsWith('%')&&Number.isFinite(val);
  $('ex-risk').textContent=isValid?`${val.toFixed(1)}%`:'—';
  $('ex-risk-label').textContent=isValid?'Under selected synthetic Monte Carlo stress':'Monte Carlo model pending';
 }
 function onScenario(ev){if(!ev.detail?.book?.length)return;summary=ex.summarize(core.simulate(ev.detail.book,ev.detail));render();}
 function goToStep(index){if(!started)return;step=Math.min(steps.length-1,Math.max(0,index));const s=steps[step];
  if(stepTarget)stepTarget.classList.remove('ex-highlight');stepTarget=$(s.anchor);if(stepTarget)stepTarget.classList.add('ex-highlight');
  $('ex-step-counter').textContent=`${String(step+1).padStart(2,'0')} / 05`;
  $('ex-progress').innerHTML=steps.map((_,i)=>`<i class="${i<=step?'done':''}"></i>`).join('');
  $('ex-guide-title').textContent=s.title;$('ex-guide-copy').textContent=s.copy;$('ex-guide-evidence').textContent=s.evidence;
  $('ex-prev').disabled=step===0;$('ex-next').textContent=step===steps.length-1?'Finish demo ✓':'Next step →';
  stepTarget?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function start(){started=true;$('ex-walkthrough').hidden=false;goToStep(0)}
 function stop(){started=false;$('ex-walkthrough').hidden=true;if(stepTarget)stepTarget.classList.remove('ex-highlight');stepTarget=null;}
 function baseline(){const ids={delay:0,accel:0,opening:2000};for(const [key,val] of Object.entries(ids)){const input=$(key);input.value=String(val);} $('delay').dispatchEvent(new Event('input',{bubbles:true}));}
 function bind(){
  for(const id of ['ex-launch','ex-guide','ex-story-launch'])$(id).addEventListener('click',start);
  $('ex-exit').addEventListener('click',stop);$('ex-prev').addEventListener('click',()=>goToStep(step-1));$('ex-next').addEventListener('click',()=>step===4?stop():goToStep(step+1));$('ex-reset').addEventListener('click',baseline);
  window.addEventListener('flowstate:scenario',onScenario);
  const risk=$('mc-stress-group-breach');if(risk){new MutationObserver(refreshRisk).observe(risk,{childList:true,subtree:true,characterData:true});}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&started)stop()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
 if(typeof module!=='undefined')module.exports={};
})();