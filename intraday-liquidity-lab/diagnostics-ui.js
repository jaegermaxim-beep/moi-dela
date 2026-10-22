'use strict';
/* FLOWSTATE v6. Payment-level what-if sensitivity and BaU/stress simulator. */
(function(){
 if(typeof window==='undefined'||typeof DiagnosticsEngine==='undefined'||typeof CockpitEngine==='undefined')return;
 const api=DiagnosticsEngine,core=CockpitEngine,$=id=>document.getElementById(id);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const usd=n=>`${n<0?'−':''}$${Math.abs(n)>=1000?(Math.abs(n)/1000).toFixed(2)+'bn':Math.abs(n).toFixed(1)+'m'}`;
 const signed=n=>(n>0?'+':'')+usd(n);
 const hm=n=>{let x=Math.round(n);return `${String(Math.floor(x/60)).padStart(2,'0')}:${String(x%60).padStart(2,'0')}`};
 let state=null,params=null,book=[],selectedId=null,model=null;
 const view=()=> $('cp-view')?.value||'all';
 const relevant=()=>core.bookFor(book,view()).filter(x=>x.kind==='IN');
 function selectors(){
  let rows=relevant().sort((a,b)=>b.amount_musd-a.amount_musd),available=new Set(rows.map(p=>p.synthetic_id));
  if(!available.has(selectedId))selectedId=rows[0]?.synthetic_id||null;
  $('dx-payment').innerHTML=rows.map(p=>`<option value="${esc(p.synthetic_id)}">${esc(p.synthetic_id)} · ${esc(p.product)} · ${usd(p.amount_musd)} · ${hm(p.forecast_minute)}</option>`).join('');
  if(selectedId)$('dx-payment').value=selectedId;
 }
 function renderExplanation(){
  if(!state||!model)return;
  const p=book.find(p=>p.synthetic_id===selectedId&&p.kind==='IN');
  if(!p){$('dx-payment-details').textContent='Select a USD inflow.';$('dx-features').replaceChildren();return}
  const result=api.explainSettlement(p,model.predict,model);
  const ent=state.entityById(p.entity_id);
  $('dx-path').textContent=`Consolidated Group → ${ent?.name||'Unknown entity'} → ${p.synthetic_id}`;
  $('dx-payment-details').innerHTML=`<div class="dx-detail-title"><b>${esc(p.product)} · ${esc(p.rail)}</b><small>${esc(p.counterparty)}</small></div><div class="dx-detail-metrics"><div><span>Payment amount</span><strong>${usd(p.amount_musd)}</strong></div><div><span>RF estimated settlement</span><strong>${hm(result.eta)}</strong></div><div><span>Simulated realised</span><strong>${hm(result.actual)}</strong></div><div><span>Absolute timing error</span><strong>${result.absolute_error.toFixed(1)} min</strong></div></div><p>Booked at ${hm(p.booking_minute)}. The model predicts ${result.predicted_delay.toFixed(1)} minutes until settlement. Actual settlement is artificially generated for validation of the interface only.</p>`;
  const max=Math.max(1,...result.effects.map(x=>x.largest_absolute_change));
  $('dx-features').innerHTML=result.effects.map(x=>`<div class="dx-feature-row"><div class="dx-feature-name"><strong>${esc(x.name)}</strong><span>${x.largest_absolute_change.toFixed(1)} min</span></div><div class="dx-feature-track"><div style="width:${Math.max(2,100*x.largest_absolute_change/max).toFixed(1)}%"></div></div><small>Alternative predictions: ${x.minimum.toFixed(1)}–${x.maximum.toFixed(1)} min after booking</small></div>`).join('');
 }
 function renderDrivers(){if(!book.length)return;
  const drivers=api.gapDrivers(book,view());
  $('dx-gap-time').textContent=`at ${hm(drivers.t)} · ${signed(drivers.variance)} position gap`;
  const max=Math.max(1,...drivers.products.map(p=>Math.abs(p.impact)));
  $('dx-driver-list').innerHTML=drivers.products.slice(0,6).map(d=>`<div class="dx-driver-row"><span>${esc(d.product)}</span><div class="dx-driver-track"><i class="${d.impact<0?'negative':'positive'}" style="width:${Math.max(2,Math.abs(d.impact)/max*100).toFixed(1)}%"></i></div><strong>${signed(d.impact)}</strong></div>`).join('');
 }
 function chart(result){const W=680,H=196,L=49,R=15,T=17,B=25;const p=result.points;
  const vals=p.flatMap(d=>[d.bau,d.stress]),lo=Math.min(0,...vals)-170,hi=Math.max(0,...vals)+170;
  const x=t=>L+(t-450)/690*(W-L-R),y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
  const path=key=>p.map((d,i)=>(i?'L':'M')+x(d.t).toFixed(1)+','+y(d[key]).toFixed(1)).join(' ');
  const ticks=[480,600,720,840,960,1080].map(t=>`<text fill="#809ab2" font-size="10" x="${x(t)}" y="${H-7}" text-anchor="middle">${hm(t)}</text>`).join('');
  const grids=Array.from({length:4},(_,i)=>{let v=lo+(hi-lo)*(i/3);return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#2b4556" stroke-dasharray="4 6"/><text fill="#8aafbb" font-size="10" text-anchor="end" x="${L-7}" y="${y(v)+3}">${(v/1000).toFixed(1)}</text>`}).join('');
  $('dx-chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${grids}<path d="${path('bau')}" stroke="#47dfc4" stroke-width="2.8" fill="none"/><path d="${path('stress')}" stroke="#f2aa71" stroke-width="2.7" fill="none" stroke-dasharray="7 5"/>${ticks}</svg><div class="dx-legend"><span><i class="dx-dot bau"></i> BaU · forecast position</span><span><i class="dx-dot stress"></i> Stress · forecast position</span></div>`;
 }
 function renderStress(){if(!state)return;
  const d=+($('dx-delay').value),a=+($('dx-accel').value),h=+($('dx-haircut').value);
  const s=api.compareScenarios(book,state.opts.opening,{delay:d,accel:a,haircut:h});
  $('dx-bau-surplus').textContent=usd(s.bau.surplus);$('dx-stress-surplus').textContent=usd(s.stress.surplus);
  $('dx-lnncp-change').textContent=signed(s.group.delta_lnncp);chart(s);
  const rows=[{name:'Consolidated Group',BAU:{...s.bau},Stress:{...s.stress,reserve_gap:0},surplus_change:s.group.delta_surplus,id:'all'},...s.entities];
  $('dx-entities').innerHTML=rows.map(z=>`<tr><td><button type="button" class="dx-focus-entity" data-dx-entity="${esc(z.id)}">${esc(z.name)} ↗</button></td><td>${usd(z.BAU.surplus)}</td><td class="${z.Stress.surplus<0?'dx-warn':''}">${usd(z.Stress.surplus)}</td><td class="${z.surplus_change<0?'dx-warn':''}">${signed(z.surplus_change)}</td><td>${z.id==='all'?'Not additive':usd(z.Stress.reserve_gap)}</td></tr>`).join('');
  $('dx-entities').querySelectorAll('[data-dx-entity]').forEach(b=>b.addEventListener('click',()=>focusEntity(b.dataset.dxEntity)));
 }
 function focusEntity(id){$('cp-view').value=id;$('cp-view').dispatchEvent(new Event('change',{bubbles:true}));selectors();renderExplanation();renderDrivers();}
 function render(){if(!state)return;selectors();renderStress();renderDrivers();renderExplanation()}
 function onScenario(ev){if(!ev.detail?.book?.length)return;state=core.simulate(ev.detail.book,ev.detail);book=state.book;render()}
 function onModel(ev){if(!ev.detail?.predict)return;model=ev.detail;renderExplanation()}
 function selectPayment(id){const p=book.find(x=>x.synthetic_id===id&&x.kind==='IN');if(!p)return;
  if(view()!=='all'&&view()!==p.entity_id)focusEntity(p.entity_id);
  selectedId=id;selectors();renderExplanation();
 }
 function bind(){if(!$('risk-diagnostics'))return;
  for(const id of ['dx-delay','dx-accel','dx-haircut'])$(id).addEventListener('change',renderStress);
  $('dx-payment').addEventListener('change',()=>{selectedId=$('dx-payment').value;renderExplanation()});
  $('cp-view').addEventListener('change',()=>{selectors();renderExplanation();renderDrivers()});
 }
 window.addEventListener('flowstate:model-ready',onModel);
 window.addEventListener('flowstate:scenario',onScenario);
 window.addEventListener('flowstate:entity-selected',()=>{selectors();renderExplanation();renderDrivers()});
 window.addEventListener('flowstate:payment-selected',ev=>selectPayment(ev.detail?.id));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();