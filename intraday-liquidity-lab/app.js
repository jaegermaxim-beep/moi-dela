'use strict';
// All modeled transactions and outcomes are fabricated. No bank data is used.
let forest=null, seed=20261021, payments=[];
let selectedActionId=null, approvedActionId=null, auditLog=[];
const $=id=>document.getElementById(id);
const PRODUCT_BASE={Repo:98,FX:142,'Client payment':80,Securities:178,'Money market':105,Derivatives:152};
const COUNTER_SHIFT={'Counterparty A':-26,'Counterparty B':5,'Counterparty C':36,'Counterparty D':-10,'Counterparty E':27,'Counterparty F':-34};
const RAIL_SHIFT={SWIFT:20,Fedwire:-28,CLS:-5,Correspondent:33};
const fmtMoney=x=>`$${(x/1000).toFixed(2)}bn`;
const clock=m=>{m=Math.max(0,Math.round(m));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`};
const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
const getVal=id=>Number($(id).value);
function xVector(s){return [Number(s.booking_minute),Math.log10(Math.max(.1,Number(s.amount_musd))),Number(s.weekday),Number(s.pressure),Number(s.historical_median_delay),...forest.products.map(z=>Number(s.product===z)),...forest.rails.map(z=>Number(s.rail===z)),...forest.counterparties.map(z=>Number(s.counterparty===z))]}
function predictOne(features){if(!forest)throw Error('Model not yet loaded');const x=xVector(features);let sum=0;for(const tree of forest.trees){let i=0;while(tree.f[i]!==-2){i=x[tree.f[i]]<=tree.t[i]?tree.l[i]:tree.r[i]}sum+=tree.v[i]}return sum/forest.trees.length}
function predictRule(s){return forest.baseline_medians[`${s.product}::${s.rail}`]??forest.global_baseline}
function randomState(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let y=x;y=Math.imul(y^(y>>>15),y|1);y^=y+Math.imul(y^(y>>>7),y|61);return ((y^(y>>>14))>>>0)/4294967296}}
function gauss(rand){return Math.sqrt(-2*Math.log(Math.max(1e-8,rand())))*Math.cos(2*Math.PI*rand())}
function pick(rand,choices){return choices[Math.floor(rand()*choices.length)]}
function makeDay(n){const rand=randomState(n);const inPays=[],outPays=[];const specs=forest.products,rails=forest.rails,parties=forest.counterparties;
 for(let i=0;i<155;i++){
  const product=pick(rand,specs),rail=pick(rand,rails),counterparty=pick(rand,parties);
  const booking_minute=Math.round(490+rand()*365);
  const amount_musd=clamp(Math.exp(Math.log(14)+gauss(rand)*.93),.6,145);
  const weekday=Math.floor(rand()*5), pressure=clamp(.45+rand()*.9,0,1.8);
  const historical_median_delay=clamp(PRODUCT_BASE[product]+COUNTER_SHIFT[counterparty]+RAIL_SHIFT[rail]+gauss(rand)*11,25,300);
  const features={product,rail,counterparty,booking_minute,amount_musd,weekday,pressure,historical_median_delay};
  const pred=booking_minute+predictOne(features), baseline=booking_minute+predictRule(features);
  const bookingPulse=booking_minute>790?25:booking_minute<550?-8:0;
  const interaction=(product==='Repo'&&rail==='Fedwire')?-12:0;
  const rare=rand()<.06?25+rand()*110:0;
  const latent=clamp(.54*historical_median_delay+.46*PRODUCT_BASE[product]+.7*COUNTER_SHIFT[counterparty]+.66*RAIL_SHIFT[rail]+22*Math.log10(amount_musd+1)+35*pressure+bookingPulse+5*weekday+interaction+gauss(rand)*34+rare,12,480);
  inPays.push({...features,kind:'IN',forecast_minute:pred,baseline_minute:baseline,actual_minute:booking_minute+latent})
 }
 for(let i=0;i<145;i++){
  const amount_musd=clamp(Math.exp(Math.log(16)+gauss(rand)*.84),.8,155);
  const when=clamp(525+rand()*460+gauss(rand)*42,465,1095);
  outPays.push({kind:'OUT',amount_musd,forecast_minute:when,baseline_minute:when,actual_minute:when,product:pick(rand,specs),critical:rand()<.18});
 }
 return [...inPays,...outPays]
}
function curveFor(book,type,delay,accel,opening){const points=[];let peak_need=0,lowest=1e12;for(let t=450;t<=1140;t+=15){let sum=0;for(const p of book){const shift=p.kind==='IN'?delay:-accel;const arrival=clamp(p[type]+shift,450,1140);if(arrival<=t){sum+=p.kind==='IN'?p.amount_musd:-p.amount_musd}}peak_need=Math.max(peak_need,-sum);lowest=Math.min(lowest,opening+sum);points.push({t,y:opening+sum})}return{points,peak_need,surplus:lowest}}
function drawSvg(charts){const container=$('chart-container');const w=830,h=307,L=58,R=18,T=17,B=41;const series=[charts.ml,charts.baseline,charts.realized,...(charts.action?[charts.action]:[])];const all=series.flatMap(s=>s.points.map(p=>p.y));const hi=Math.max(500,...all),lo=Math.min(-400,...all);const pad=Math.max(300,(hi-lo)*.1),max=hi+pad,min=lo-pad;const x=t=>L+(t-450)/690*(w-L-R);const y=z=>T+(max-z)/(max-min)*(h-T-B);const grid=Array.from({length:5},(_,i)=>{const val=min+(max-min)*i/4;return `<g><line x1="${L}" x2="${w-R}" y1="${y(val).toFixed(2)}" y2="${y(val).toFixed(2)}" stroke="#2b3f51" stroke-dasharray="3 6"/><text x="${L-12}" y="${(y(val)+4).toFixed(2)}" text-anchor="end" fill="#8298b0" font-size="11">${(val/1000).toFixed(1)}</text></g>`}).join('');const ticks=[480,600,720,840,960,1080].map(t=>`<text x="${x(t)}" y="${h-12}" text-anchor="middle" fill="#8194ac" font-size="11">${clock(t)}</text>`).join('');const paths=series.map((s,i)=>`<path d="${s.points.map((p,j)=>(j?'L':'M')+x(p.t).toFixed(1)+','+y(p.y).toFixed(1)).join(' ')}" fill="none" stroke="${['#3bdac5','#908aff','#738aa4','#f3bb74'][i]}" stroke-width="${i===0?3.2:1.7}" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="${i===2?.65:1}" ${i===2?'stroke-dasharray="5 6"':''}/>`).join('');const zero=min<0&&max>0?`<line x1="${L}" x2="${w-R}" y1="${y(0)}" y2="${y(0)}" stroke="#dc8f72" stroke-dasharray="7 6"/><text x="${w-R-8}" y="${y(0)-7}" text-anchor="end" fill="#dc8f72" font-size="10">ZERO BUFFER</text>`:'';const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${grid}${zero}${paths}${ticks}<text transform="translate(15,145) rotate(-90)" text-anchor="middle" font-size="10" fill="#69839d">AVAILABLE LIQUIDITY · USD BN</text></svg>`;container.innerHTML=svg}
function updateScenario(){if(!forest||!payments.length)return;const delay=getVal('delay'),accel=getVal('accel'),opening=getVal('opening');$('delay-value').textContent=`${delay} min`;$('accel-value').textContent=`${accel} min`;$('opening-value').textContent=fmtMoney(opening);const ml=curveFor(payments,'forecast_minute',delay,accel,opening),baseline=curveFor(payments,'baseline_minute',delay,accel,opening),realized=curveFor(payments,'actual_minute',delay,accel,opening);const approved=approvedActionId?scenarioForAction(approvedActionId):null;drawSvg({ml,baseline,realized,action:approved?.curve});$('kpi-funding').textContent=fmtMoney(ml.peak_need);$('kpi-surplus').textContent=fmtMoney(ml.surplus);$('kpi-surplus').style.color=ml.surplus<0?'#f0a57c':'#f0f5fc';$('payment-count').textContent=`${payments.length} payments`;$('inflows').textContent=fmtMoney(payments.filter(p=>p.kind==='IN').reduce((s,p)=>s+p.amount_musd,0));$('outflows').textContent=fmtMoney(payments.filter(p=>p.kind==='OUT').reduce((s,p)=>s+p.amount_musd,0));if(ml.surplus<0){$('insight-title').textContent='Potential intraday liquidity shortfall';$('insight-text').textContent=`Under these synthetic assumptions, the forecast available buffer dips ${fmtMoney(Math.abs(ml.surplus))} below zero. A real treasury workflow would investigate and consider approved funding or payment-steering actions.`}else if(delay||accel){$('insight-title').textContent='Timing stress changes liquidity needs';$('insight-text').textContent=`With a +${delay} min inflow delay and ${accel} min accelerated outflows, the simulated peak funding need is ${fmtMoney(ml.peak_need)}. This is scenario sensitivity, not a validated risk capital estimate.`}else{$('insight-title').textContent='Timing-aware forecasting in action';$('insight-text').textContent=`The Projected LNNCP is ${fmtMoney(ml.peak_need)} for this synthetic trading day. Rules-based timing implies ${fmtMoney(baseline.peak_need)} under identical amounts and scheduled outflows.`}renderReferences(ml);renderDecisions(ml);renderMonitoring();if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('flowstate:scenario',{detail:{book:payments,seed,delay,accel,opening}}))}

const actionEngine=(typeof DecisionEngine!=='undefined'?DecisionEngine:(typeof require==='function'?require('./decision-engine.js'):null));
function scenarioForAction(id){
 const transform=actionEngine.effect(payments,id,getVal('opening'));
 return {...transform,curve:curveFor(transform.book,'forecast_minute',getVal('delay'),getVal('accel'),transform.opening)};
}
function renderReferences(base){
 const bau=getVal('bau-reference'),stressed=getVal('stressed-reference');
 const ref=actionEngine.referenceAssessment(base.peak_need,bau,stressed);
 $('bau-reference-value').textContent=fmtMoney(bau);
 $('stressed-reference-value').textContent=fmtMoney(stressed);
 $('usage-ratio').textContent=`${(ref.ratio*100).toFixed(1)}%`;
 $('review-marker').textContent=fmtMoney(ref.reviewMarker);
 $('reference-status').textContent=ref.level;
}
function renderDecisions(base){
 const signal=actionEngine.riskStatus(base.surplus,base.peak_need,getVal('bau-reference'),getVal('stressed-reference'));
 $('risk-title').textContent=signal.title;$('risk-explanation').textContent=signal.explanation;
 $('risk-label').textContent=signal.level==='normal'?'WITHIN FLOOR':signal.level==='watch'?'EARLY WARNING':'BUFFER BREACH';
 $('risk-label').className='risk-label '+signal.level;
 $('before-surplus').textContent=fmtMoney(base.surplus);
 const candidates=actionEngine.ACTIONS.map(a=>{
   const impact=scenarioForAction(a.id);
   return {...a,impact,benefit:impact.curve.surplus-base.surplus};
 });
 $('action-cards').innerHTML=candidates.map(a=>`<button type="button" class="action-choice ${selectedActionId===a.id?'selected':''}" data-id="${a.id}" aria-pressed="${selectedActionId===a.id}"><span class="tag">${a.tag}</span><strong>${a.title}</strong><span class="summary">${a.detail}</span><span class="expected">Indicative liquidity-surplus impact: ${a.benefit>=0?'+':''}${fmtMoney(a.benefit)}</span></button>`).join('');
 for(const button of $('action-cards').querySelectorAll('button'))button.addEventListener('click',()=>{selectedActionId=button.dataset.id;renderDecisions(base)});
 const selected=candidates.find(x=>x.id===selectedActionId);
 $('approve-action').disabled=!selected;$('reject-action').disabled=!selected;
 $('impact-title').textContent=selected?.title||'Select a candidate action';
 $('impact-detail').textContent=selected?.detail||'Compare modelled liquidity surplus before and after a hypothetical approved action.';
 $('after-surplus').textContent=selected?fmtMoney(selected.impact.curve.surplus):'—';
 $('impact-benefit').textContent=selected?`${selected.benefit>=0?'+':''}${fmtMoney(selected.benefit)}`:'—';
 $('modified-count').textContent=selected?String(selected.impact.changed):'—';
 $('action-assumptions').textContent=selected?selected.assumptions:'Select an action to inspect operational and governance assumptions.';
 const state=approvedActionId?`Approved in demonstration: ${actionEngine.ACTIONS.find(x=>x.id===approvedActionId).title}. Amber path shows hypothetical impact. No external action executed.`:'No action approved. Baseline forecast shown without interventions.';
 $('approval-status').textContent=state;
 renderAudit();
}
function renderMonitoring(){
 const drift=getVal('drift'),metric=actionEngine.monitor(payments,drift),signal=actionEngine.monitoringStatus(metric);
 $('drift-value').textContent=`+${drift} min`;
 $('monitor-mae').textContent=`${metric.mae.toFixed(1)} min`;
 $('monitor-baseline').textContent=`${metric.baselineMae.toFixed(1)} min`;
 $('monitor-weighted').textContent=`${metric.weightedMae.toFixed(1)} min`;
 $('monitor-p90').textContent=`${metric.p90.toFixed(1)} min`;
 $('monitor-optimism').textContent=`${(metric.optimisticRate*100).toFixed(1)}%`;
 $('monitor-count').textContent=`${metric.records} synthetic inflows`;
 $('monitor-flag').className='monitor-flag '+(signal.level==='watch'?'watch':'');
 $('monitor-flag').textContent=`${signal.title}. ${signal.text}`;
 const max=Math.max(1,...metric.segments.map(x=>x.mae));
 $('segments').innerHTML=metric.segments.map(x=>`<div class="segment-row"><span>${x.product}</span><div class="segment-track"><div class="segment-fill" style="width:${(100*x.mae/max).toFixed(1)}%"></div></div><span class="segment-value">${x.mae.toFixed(1)} min</span></div>`).join('');
}
function logDecision(decision,id){
 auditLog.push({when:new Date().toISOString(),decision,action:id,scenario:{inflow_delay:getVal('delay'),outflow_accel:getVal('accel'),opening:getVal('opening')},surplus:curveFor(payments,'forecast_minute',getVal('delay'),getVal('accel'),getVal('opening')).surplus});
 renderAudit();
}
function renderAudit(){
 $('audit-events').innerHTML=auditLog.length?auditLog.slice().reverse().map(e=>`<div class="audit-item"><strong>${e.decision.toUpperCase()} — ${e.action.replaceAll('_',' ')}</strong><span>${new Date(e.when).toLocaleTimeString('en-GB',{hour12:false})} · Inflow +${e.scenario.inflow_delay} min · Outflow −${e.scenario.outflow_accel} min · Buffer ${fmtMoney(e.scenario.opening)}</span></div>`).join(''):'No approval or rejection decisions recorded.';
}
function downloadAudit(){
 const rows=[['timestamp_iso','decision','action','inflow_delay_minutes','outflow_acceleration_minutes','opening_buffer_usd_m','surplus_before_usd_m'],...auditLog.map(e=>[e.when,e.decision,e.action,e.scenario.inflow_delay,e.scenario.outflow_accel,e.scenario.opening,e.surplus])];
 const csv=rows.map(a=>a.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='flowstate_synthetic_decision_audit.csv';a.click();URL.revokeObjectURL(url);
}
function approveAction(){if(!selectedActionId)return;approvedActionId=selectedActionId;logDecision('approved_simulation',approvedActionId);updateScenario()}
function rejectAction(){if(!selectedActionId)return;logDecision('rejected',selectedActionId);if(approvedActionId===selectedActionId)approvedActionId=null;selectedActionId=null;updateScenario()}
function invalidateApproval(){if(approvedActionId){logDecision('invalidated_by_scenario_change',approvedActionId);approvedActionId=null}}

function inspectorFeatures(){const time=$('booking').value||'09:15';const [hh,mm]=time.split(':').map(Number);const amount=clamp(getVal('amount'),.1,500);return{product:$('product').value,counterparty:$('counterparty').value,rail:$('rail').value,weekday:getVal('weekday'),booking_minute:hh*60+mm,amount_musd:amount,pressure:getVal('pressure'),historical_median_delay:getVal('hist')}}
function updateInspector(){if(!forest)return;const f=inspectorFeatures();const val=predictOne(f),base=predictRule(f);$('eta').textContent=clock(f.booking_minute+val);$('pred-minutes').textContent=`${val.toFixed(1)} min after booking`;$('base-minutes').textContent=`${base.toFixed(1)} min after booking`;$('difference').textContent=`${val>=base?'+':''}${(val-base).toFixed(1)} min vs rules`}
function updateRanges(){for(const id of ['pressure','hist'])$(id+'-value').textContent=id==='hist'?`${getVal(id)} min`:getVal(id).toFixed(1)}
function exportCSV(){if(!payments.length)return;const head=['direction','product','counterparty','payment_rail','amount_usd_m','booking_time','ml_estimated_settlement','rules_estimated_settlement','synthetic_realized_settlement'];const rows=payments.map(p=>[p.kind,p.product,p.counterparty||'',p.rail||'',p.amount_musd.toFixed(4),p.booking_minute?clock(p.booking_minute):'',clock(p.forecast_minute),clock(p.baseline_minute),clock(p.actual_minute)]);const data=[head,...rows].map(x=>x.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`synthetic_intraday_demo_seed_${seed}.csv`;a.click();URL.revokeObjectURL(url)}
function bind(){['delay','accel','opening','bau-reference','stressed-reference'].forEach(id=>$(id).addEventListener('input',()=>{invalidateApproval();updateScenario()}));$('drift').addEventListener('input',renderMonitoring);$('approve-action').addEventListener('click',approveAction);$('reject-action').addEventListener('click',rejectAction);$('export-audit').addEventListener('click',downloadAudit);['product','counterparty','rail','weekday','amount','booking','pressure','hist'].forEach(id=>$(id).addEventListener('input',()=>{updateRanges();updateInspector()}));$('predict').addEventListener('click',updateInspector);$('refresh').addEventListener('click',()=>{invalidateApproval();seed+=17;payments=makeDay(seed);updateScenario()});$('reset').addEventListener('click',()=>{invalidateApproval();selectedActionId=null;$('delay').value=0;$('accel').value=0;$('opening').value=2000;$('drift').value=0;seed=20261021;payments=makeDay(seed);updateScenario()});$('download').addEventListener('click',exportCSV);for(const nav of document.querySelectorAll('.side-link'))nav.addEventListener('click',()=>{document.querySelectorAll('.side-link').forEach(a=>a.classList.remove('active'));nav.classList.add('active')})}
async function unpackModel(obj){if(obj.encoding!=='gzip-base64')return obj;if(typeof DecompressionStream==='undefined')throw Error('Browser requires gzip DecompressionStream');const binary=atob(obj.data);const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));const decoded=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(decoded).text())}
async function init(){bind();updateRanges();try{const r=await fetch('model-packed.json',{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);forest=await unpackModel(await r.json());if(!Array.isArray(forest.trees)||!forest.trees.length)throw Error('Invalid forest');$('engine-pill').classList.add('loaded');$('engine-text').textContent='Trained model ready';const m=forest.metrics;$('kpi-mae').textContent=`${m.forest_mae_min.toFixed(1)} min`;$('kpi-improve').textContent=`−${m.mae_improvement_pct.toFixed(1)}%`;$('test-count').textContent=`${m.test_records.toLocaleString('en-US')} synthetic test payments`;payments=makeDay(seed);updateScenario();updateInspector()}catch(e){$('engine-text').textContent='Model unavailable';$('chart-container').innerHTML=`<div class="placeholder">Model failed to load. Serve this directory with a local HTTP server or use the hosted GitHub Pages URL. (${String(e.message).replaceAll('<','&lt;')})</div>`;console.error(e)}}
if(typeof window!=='undefined')document.addEventListener('DOMContentLoaded',init);
if(typeof module!=='undefined')module.exports={xVector,predictOne,predictRule,curveFor,makeDay,setModel:m=>forest=m,clock,actionEngine};