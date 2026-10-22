'use strict';
/* v4 independent group cockpit, synthetic simulation only. */
(function(){
 const e=typeof CockpitEngine!=='undefined'?CockpitEngine:null;
 if(!e||typeof window==='undefined')return;
 const $=id=>document.getElementById(id);
 const money=v=>{const a=Math.abs(v);return `${v<0?'−':''}$${a>=1000?(a/1000).toFixed(2)+'bn':a.toFixed(0)+'m'}`};
 const signed=v=>(v>0?'+':'')+money(v);
 const time=v=>{const n=Math.max(0,Math.round(v));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`};
 let state=null,actionType='transfer',proposal=null,approval=null,audit=[],signature='',optimiserApproved=null;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const currentView=()=>($('cp-view')?.value)||'all';
 function currentProposal(){return{type:actionType,source:$('cp-source').value,target:$('cp-target').value,amount_musd:Number($('cp-amount').value),when:Number($('cp-when').value)}}
 function selectedCurve(name){if(name==='all')return state.group;return state.entityById(name)}
 function renderChart(){
  if(!state)return;
  const id=currentView(),cur=selectedCurve(id),series=[{curve:cur.forecast,name:'Forecast',color:'#3bdac5'},{curve:cur.actual,name:'Realised',color:'#92a3b7'}];
  if(approval?.eligible){if(id==='all')series.push({curve:approval.group.curve,name:'After action',color:'#f0b86d'});
    else {const by=approval.events?.[id]||[];const ent=state.entityById(id);series.push({curve:e.timeline(e.bookFor(state.book,id),'forecast_minute',state.opts.delay,state.opts.accel,ent.opening,by),name:'After action',color:'#f0b86d'});}}
  if(!approval && optimiserApproved?.eligible){const optimized=id==='all'?{points:optimiserApproved.after.group}: {points:optimiserApproved.after.byId[id]?.points||[]};if(optimized.points.length)series.push({curve:optimized,name:'Approved optimiser plan (demo)',color:'#d4a5f9'});}
  let ys=series.flatMap(s=>s.curve.points.map(p=>p.y));let mn=Math.min(0,...ys)-180,mx=Math.max(0,...ys)+180;
  const W=880,H=294,L=60,R=17,T=22,B=35,x=t=>L+(t-450)/690*(W-L-R),y=v=>T+(mx-v)/(mx-mn)*(H-T-B);
  const grid=Array.from({length:5},(_,i)=>{let yy=mn+i*(mx-mn)/4;return `<line x1="${L}" x2="${W-R}" y1="${y(yy)}" y2="${y(yy)}" stroke="#284356" stroke-dasharray="4 7"/><text x="${L-11}" y="${y(yy)+4}" fill="#8fa7b7" text-anchor="end" font-size="11">${(yy/1000).toFixed(1)}</text>`}).join('');
  const ticks=[480,600,720,840,960,1080].map(t=>`<text x="${x(t)}" y="${H-10}" text-anchor="middle" fill="#8ca2b5" font-size="11">${time(t)}</text>`).join('');
  const paths=series.map((s,i)=>`<path d="${s.curve.points.map((p,j)=>(j?'L':'M')+x(p.t).toFixed(1)+','+y(p.y).toFixed(1)).join(' ')}" fill="none" stroke="${s.color}" stroke-width="${i===0?3.1:2}" ${i===1?'stroke-dasharray="5 5"':''} stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  const zero=`<line x1="${L}" y1="${y(0)}" x2="${W-R}" y2="${y(0)}" stroke="#de9d76" stroke-dasharray="7 5"/><text x="${W-R-5}" y="${y(0)-7}" text-anchor="end" fill="#d9a786" font-size="10">ZERO SURPLUS</text>`;
  $('cp-chart').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${grid}${zero}${paths}${ticks}<text fill="#88a1b3" font-size="10" transform="translate(17,145) rotate(-90)" text-anchor="middle">LIQUIDITY POSITION · USD BN</text></svg>`;
  $('cp-chart').setAttribute('aria-label',`${cur.name||'Group'} synthetic forecast and realised liquidity positions`);
  $('cp-chart-subtitle').textContent=`${cur.name||'Consolidated Group'} · USD million · 15-minute buckets`;
  const variance=e.paymentVariance(state,id,750);
  $('cp-chart-reference').textContent=money(cur.forecast.surplus);
  $('cp-chart-gap').textContent=money(Math.max(...cur.forecast.points.map((p,i)=>Math.abs(cur.actual.points[i].y-p.y))));
  $('cp-chart-note').textContent=id==='all'?'Transfer = Group-neutral':'Local reserve applies';
 }
 function renderEntityCards(){
  $('cp-entity-grid').innerHTML=state.entities.map(z=>{
   const tr=e.transferable(state,z.id,720),critical=z.forecast.surplus<0;
   const tone=critical?'deficit':z.forecast.surplus<z.reserve?'caution':'healthy';
   return `<button type="button" data-entity="${esc(z.id)}" class="cp-entity-card ${tone} ${currentView()===z.id?'selected':''}" aria-label="View ${esc(z.name)} liquidity detail"><span class="cp-entity-heading"><strong>${esc(z.name)}</strong><span>${esc(z.region)}</span></span><span class="cp-entity-sup">Projected Liquidity Surplus</span><span class="cp-entity-val">${money(z.forecast.surplus)}</span><span class="cp-entity-readouts"><span><small>SoD position</small><b>${money(z.opening)}</b></span><span><small>Local LNNCP</small><b>${money(z.forecast.peak_need)}</b></span><span><small>Available for transfer</small><b>${money(tr.max)}</b></span></span><span class="cp-entity-footer">${z.transferable?'Illustrative local transfer rules':'Transfer out restricted'} · ${z.count} simulated payments →</span></button>`;
  }).join('');
  $('cp-entity-grid').querySelectorAll('[data-entity]').forEach(node=>node.addEventListener('click',()=>{$('cp-view').value=node.dataset.entity;renderView()}));
 }
 function renderPayments(){
  const product=$('cp-product').value,rows=e.paymentVariance(state,currentView()).rows.filter(p=>product==='all'||p.product===product).slice(0,8);
  $('cp-payments').innerHTML=rows.length?rows.map(p=>`<tr><td class="cp-mono">${p.id}</td><td>${esc((state.entityById(p.entity)||{}).short||'—')}</td><td>${esc(p.product)}</td><td>${money(p.amount)}</td><td>${time(p.forecast)}</td><td>${time(p.actual)}</td><td class="${p.late>60?'cp-late':''}">${p.late?`+${p.late.toFixed(0)} min`:'On time / early'}</td></tr>`).join(''):'<tr><td colspan="7" class="cp-empty">No synthetic inflows in this segment.</td></tr>';
 }
 function renderAgents(){
  const messages=e.evaluationMessages(state,proposal);
  $('cp-agents').innerHTML=messages.map(x=>`<article class="cp-agent-event"><div class="cp-agent-heading"><strong>${esc(x.agent)}</strong><span class="cp-agent-status">${esc(x.status)}</span></div><small>→ ${esc(x.recipient)}</small><p>${esc(x.message)}</p></article>`).join('');
 }
 function renderKpis(){
  $('cp-group-surplus').textContent=money(state.group.forecast.surplus);$('cp-group-lnncp').textContent=money(state.group.forecast.peak_need);
  $('cp-transferable').textContent=money(state.entities.reduce((sum,x)=>sum+e.transferable(state,x.id,720).max,0));
  $('cp-divergence').textContent=money(Math.abs(state.maxDivergence.delta));
  $('cp-group-surplus').classList.toggle('cp-negative',state.group.forecast.surplus<0);
 }
 function renderProposal(){
  if(!state)return;proposal=e.assess(state,currentProposal());
  $('cp-source-wrap').hidden=actionType!=='transfer';
  $('cp-approve').disabled=!proposal.eligible;
  $('cp-eligibility').className='cp-eligibility '+(proposal.eligible?'passed':'failed');
  $('cp-eligibility').textContent=(proposal.eligible?'CHECK PASSED · ':'ACTION NOT ELIGIBLE · ')+(proposal.eligible?proposal.details.note:proposal.reason);
  $('cp-before').textContent=money(state.group.forecast.surplus);
  $('cp-after').textContent=proposal.eligible?money(proposal.group.after):'—';
  $('cp-entity-impact').textContent=proposal.eligible?signed(proposal.entities.find(x=>x.id===proposal.proposal.target)?.delta||0):'—';
  $('cp-cost').textContent=proposal.eligible?proposal.details.cost?`$${(proposal.details.cost*1000).toFixed(1)}k`:'$0 (transfer)':'—';
  renderAgents();
 }
 function renderAudit(){
  $('cp-audit').innerHTML=audit.length?audit.slice().reverse().map(x=>`<div class="cp-audit-record"><div><strong>${esc(x.decision)}</strong><span>${esc(x.action)} · ${esc(x.time)}</span></div><span>${esc(x.note)}</span></div>`).join(''):'No simulated decisions recorded.';
 }
 function renderView(){if(!state)return;renderChart();renderEntityCards();renderPayments()}
 function renderAll(){if(!state)return;renderKpis();renderView();renderProposal();renderAudit()}
 function invalidate(reason){if(approval){audit.push({decision:'APPROVAL INVALIDATED',action:approval.proposal.type,time:new Date().toISOString(),note:reason});approval=null;$('cp-action-status').textContent='Previous demonstration approval invalidated by changed assumptions.';renderAudit()}}
 function onScenario(event){const detail=event.detail;if(!detail?.book?.length)return;
  const newSignature=[detail.seed,detail.delay,detail.accel,detail.opening].join(':');
  if(signature&&signature!==newSignature)invalidate('Scenario, payment seed or SoD liquidity changed.');
  signature=newSignature;optimiserApproved=null;state=e.simulate(detail.book,detail);renderAll();
 }
 function switchAction(type){if(type===actionType)return;invalidate('Funding proposal changed.');actionType=type;
  if(type==='repo'){$('cp-amount').value='100';$('cp-when').value='780'}else{$('cp-amount').value='80';$('cp-when').value='720'}
  document.querySelectorAll('.cp-type').forEach(b=>{const active=b.dataset.type===type;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false')});renderProposal();renderChart();}
 function decision(approved){if(!state)return;const evaluated=e.assess(state,currentProposal());const stamped=new Date().toISOString();
  if(approved&&!evaluated.eligible){$('cp-action-status').textContent='Action blocked: eligibility conditions not met.';return;}
  audit.push({decision:approved?'APPROVED IN SIMULATION':'REJECTED IN SIMULATION',action:evaluated.proposal?.type||actionType,time:stamped,note:approved?`${money(evaluated.proposal.amount_musd)} ${evaluated.proposal.source||'external'} → ${evaluated.proposal.target} at ${time(evaluated.proposal.when)}; zero transaction execution.`:'Proposal rejected by the simulated approver.'});
  approval=approved?evaluated:null;
  $('cp-action-status').textContent=approved?'Approved in simulation only. No real funding, transfer, instruction or external call was executed.':'Proposal rejected. Baseline liquidity position unchanged.';
  renderChart();renderAgents();renderAudit();
 }
 function auditCSV(){let rows=[['decision','action','timestamp','description'],...audit.map(a=>[a.decision,a.action,a.time,a.note])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='flowstate_v4_synthetic_group_audit.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function bind(){
  if(!$('group-cockpit'))return;
  for(const id of ['cp-view','cp-product'])$(id).addEventListener('change',renderView);
  for(const id of ['cp-source','cp-target','cp-amount','cp-when'])$(id).addEventListener('input',()=>{invalidate('Funding proposal parameters changed.');renderProposal();renderChart()});
  document.querySelectorAll('.cp-type').forEach(b=>b.addEventListener('click',()=>switchAction(b.dataset.type)));
  $('cp-approve').addEventListener('click',()=>decision(true));$('cp-reject').addEventListener('click',()=>decision(false));$('cp-audit-export').addEventListener('click',auditCSV);
 }
 window.addEventListener('flowstate:scenario',onScenario);
 window.addEventListener('flowstate:optimiser-approval',ev=>{optimiserApproved=ev.detail?.plan||null;if(optimiserApproved&&approval){audit.push({decision:'MANUAL ACTION INVALIDATED',action:approval.proposal.type,time:new Date().toISOString(),note:'Alternative optimiser scenario approved.'});approval=null;renderAudit();}renderChart();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
 if(typeof module!=='undefined')module.exports={};
})();
/* Extended chart overlay: the optimiser signals human-approved hypothetical plans using a browser event. */