'use strict';
/* FLOWSTATE 12 — optional localhost enterprise sandbox. Not connected to any bank. */
(function () {
 if (typeof window === 'undefined') return;
 let latest = null, scenario = null, run = null, proposal = null, online = false, stale = false;
 const byId = id => document.getElementById(id);
 const val = id => byId(id)?.value;
 const fmt = n => Number.isFinite(n) ? `$${Number(n).toFixed(1)}m` : '—';
 const apiActor = () => val('ent-actor');
 const say = (message, problem = false) => {
  const el = byId('ent-message'); if (el) {el.textContent = message;el.classList.toggle('ent-error',problem)}
 };
 const post = async (url, data) => {
  const r = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json','X-Demo-Actor':apiActor()},body:JSON.stringify(data)});
  const text=await r.text(); let body;
  try{body=JSON.parse(text)}catch {body={detail:text.slice(0,140)}};
  if(!r.ok) throw Error(`${r.status}: ${typeof body.detail==='string' ? body.detail : JSON.stringify(body.detail)}`);
  return body;
 };
 const get = async url => {
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Backend unavailable');return r.json();
 };
 const modelInput = () => {
  if(!latest) throw Error('Synthetic payment model has not loaded');
  const opts={opening:latest.opening,delay:latest.delay,accel:latest.accel};
  const s=window.CockpitEngine.simulate(latest.book,opts);
  const summary=window.ExecutiveEngine.summarize(s);
  const cashflow = {
   group_lnncp_musd:summary.group.lnncp,
   group_surplus_musd:summary.group.surplus,
   group_sod_musd:summary.group.opening,
   entity_reserve_breaches:summary.belowReserve,
   entity_positions:summary.entities.map(e=>({id:e.id,surplus_musd:e.surplus,lnncp_musd:e.lnncp,reserve_floor_musd:e.reserve})),
   time_buckets: summary.group.points.map((p,i)=>({minute:p.t,forecast_musd:p.y,realised_musd:summary.group.actual[i].y}))
  };
  const input={seed:latest.seed,delay:latest.delay,accel:latest.accel,opening:latest.opening,book:latest.book};
  return {payload:{name:`Synthetic USD intraday ${latest.delay ? 'stress' : 'BaU'} · seed ${latest.seed}`,seed:Math.max(0,Math.round(Number(latest.seed))),input,output:cashflow,model_version:'RF32-demo | calibration v7',engine_version:'FLOWSTATE v12 | browser cashflow'},cashflow};
 };
 const render = async () => {
  const label=byId('ent-service');if(!label)return;
  label.textContent=online?'LOCAL API CONNECTED':'BROWSER DEMO ONLY';
  label.classList.toggle('ent-online',online);
  const details=byId('ent-status-details');
  if(details) details.textContent=online
    ? `Scenario ${scenario ? `revision ${scenario.revision} · ${scenario.id.slice(0,8)}` : 'not saved'} · ${stale ? 'LOCAL CHANGES NOT SAVED' : 'in sync'} · ${proposal ? `proposal ${proposal.status}` : 'no proposal'}`
    : 'GitHub Pages is static. Launch the optional FastAPI server locally to activate durable SQLite workflow.';
  for(const id of ['ent-capture','ent-draft','ent-submit','ent-risk-approve','ent-risk-reject','ent-treasury-approve','ent-treasury-reject','ent-refresh','ent-verify','ent-evidence']){
   const el=byId(id);if(el)el.disabled=!online;
  }
  if(online){
   byId('ent-capture').disabled=!latest;
   byId('ent-draft').disabled=!scenario||!run||stale||apiActor().startsWith('risk_');
   byId('ent-submit').disabled=!proposal||proposal.status!=='DRAFT'||proposal.creator!==apiActor()||stale;
   const risk=proposal?.status==='PENDING_RISK'&&apiActor().startsWith('risk_')&&!stale;
   const fin=proposal?.status==='PENDING_TREASURY'&&apiActor().startsWith('treasury_')&&proposal.creator!==apiActor()&&!stale;
   for(const id of ['ent-risk-approve','ent-risk-reject'])byId(id).disabled=!risk;
   for(const id of ['ent-treasury-approve','ent-treasury-reject'])byId(id).disabled=!fin;
  }
  byId('ent-workflow').textContent=proposal?`#${proposal.id.slice(0,8)} · ${proposal.status} · v${proposal.version} · creator ${proposal.creator}${proposal.risk_approver?' · Risk '+proposal.risk_approver:''}${proposal.treasury_approver?' · final '+proposal.treasury_approver:''}`:'No server-side funding proposal.';
  if(online){try{const overview=await get('/api/overview');byId('ent-counts').textContent=`${overview.scenarios} snapshots · ${overview.runs} model runs · ${overview.pending} pending · ${overview.approved} approved · ${overview.ledger} ledger events`;}catch{}}
 };
 const runTask = async job => {
  try{await job();await render()}catch(e){say(String(e.message||e),true);await render()}
 };
 const capture = async () => {
  const {payload,cashflow}=modelInput();
  const next=(scenario&&stale)?await post(`/api/scenarios/${scenario.id}/fork`,{payload}):await post('/api/scenarios',payload);
  scenario=next;run=await post(`/api/scenarios/${next.id}/runs`,{engine:'Browser CockpitEngine | persisted snapshot, NOT server recomputation',seed:payload.seed,result:cashflow,notes:'Captured and hashed synthetic model results, not independently recalculated by the server'});
  stale=false;proposal=null;
  byId('ent-replay-hint').textContent=`Replay: python -m enterprise.replay --scenario ${next.id}`;
  say(`Saved scenario revision ${next.revision} · Group LNNCP ${fmt(cashflow.group_lnncp_musd)} · Liquidity Surplus ${fmt(cashflow.group_surplus_musd)}`);
 };
 const createProposal = async () => {
  proposal=await post('/api/proposals',{
   scenario_id:scenario.id,run_id:run.id,title:`${val('ent-action')} funding · ${val('ent-amount')}m USD · synthetic`,
   plan:{type:val('ent-action'),amount_musd:Number(val('ent-amount')),entity_id:val('ent-entity'),tenor:val('ent-tenor'),
         risk_note:'This proposal is NOT independently eligibility-validated on the backend.'},
   rationale:val('ent-note')||'Illustrative funding action to reduce a possible local liquidity shortfall.'
  });say('Treasury draft created. Submit for independent Risk review.');
 };
 const transition = async (endpoint,decision) => {
  if(!proposal)throw Error('Create a proposal first');
  const comment=val('ent-review-note')||'';
  proposal=await post(`/api/proposals/${proposal.id}/${endpoint}`,{
   expected_version:proposal.version,comment, ...(decision?{decision}:{})
  });say(`Workflow moved to ${proposal.status}. ${proposal.status==='APPROVED'?'Approval is ADVISORY ONLY; no funding is executed.':''}`);
 };
 const verify = async () => {
  const v=await get('/api/ledger/verify'); const a=await get('/api/ledger?limit=8');
  byId('ent-ledger-status').textContent=v.valid?`Hash chain consistent · ${v.verified_events} events · ${v.head_hash.slice(0,16)}…`:`Integrity check failed at event ${v.first_invalid_seq}`;
  const box=byId('ent-ledger-rows');box.replaceChildren();
  for(const e of a.events){const row=document.createElement('div');row.className='ent-ledger-row';const left=document.createElement('span');left.textContent=`${e.action} · ${e.actor}`;const right=document.createElement('small');right.textContent=`${e.at.slice(11,19)} · ${e.subject.slice(0,8)}`;row.append(left,right);box.append(row)}
  say(v.valid?'Local hash-chain verification passed. Tamper-evident only, not immutable storage.':'Ledger verification failed.',!v.valid);
 };
 async function init(){
  if(!byId('ent-service'))return;
  const isLocal=['localhost','127.0.0.1'].includes(location.hostname)||window.__flowstate_test_local===true;
  if(isLocal){try{const h=await get('/api/health');online=h.service==='FLOWSTATE Enterprise Sandbox'}catch{online=false}}
  await render();
  if(!online)say('Static GitHub Pages mode. Run python -m enterprise.server locally to use the SQLite workflow.');
  byId('ent-actor').addEventListener('change',render);
  byId('ent-capture').addEventListener('click',()=>runTask(capture));
  byId('ent-draft').addEventListener('click',()=>runTask(createProposal));
  byId('ent-submit').addEventListener('click',()=>runTask(()=>transition('submit')));
  byId('ent-risk-approve').addEventListener('click',()=>runTask(()=>transition('risk-review','APPROVE')));
  byId('ent-risk-reject').addEventListener('click',()=>runTask(()=>transition('risk-review','REJECT')));
  byId('ent-treasury-approve').addEventListener('click',()=>runTask(()=>transition('treasury-decision','APPROVE')));
  byId('ent-treasury-reject').addEventListener('click',()=>runTask(()=>transition('treasury-decision','REJECT')));
  byId('ent-verify').addEventListener('click',()=>runTask(verify));
  byId('ent-evidence').addEventListener('click',()=>runTask(async()=>{
    const ev=await get('/api/evidence/verify');
    byId('ent-evidence-status').textContent=ev.valid
      ?`${ev.scenario_snapshots} scenario fingerprints and ${ev.model_runs} saved model runs verified.`
      :`Saved evidence mismatch: ${JSON.stringify(ev.invalid_records).slice(0,130)}`;
    say(ev.valid?'Snapshot checks passed. Use local replay for independent model recalculation.':'Evidence integrity check failed.',!ev.valid);
  }));
  byId('ent-refresh').addEventListener('click',()=>runTask(async()=>{
   if(proposal){const rows=await get('/api/proposals');proposal=rows.proposals.find(p=>p.id===proposal.id)||null};
   await verify();
  }));
 }
 window.addEventListener('flowstate:scenario',event=>{
  if(!event.detail?.book?.length)return;
  const d=event.detail;
  const changed=latest&&(d.seed!==latest.seed||d.delay!==latest.delay||d.accel!==latest.accel||d.opening!==latest.opening||d.book.length!==latest.book.length||d.book.some((p,i)=>p.forecast_minute!==latest.book[i].forecast_minute||p.actual_minute!==latest.book[i].actual_minute));
  latest=d;if(scenario&&changed){stale=true;say('Browser scenario changed. Capture a NEW immutable revision before continuing server-side approvals.',true)}
  render();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();