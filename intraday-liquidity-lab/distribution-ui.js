'use strict';
/* FLOWSTATE v8. Synthetic Monte Carlo distribution, no simulated approvals or external execution. */
(function(){
 if(typeof window==='undefined'||typeof DistributionEngine==='undefined'||typeof CockpitEngine==='undefined')return;
 const api=DistributionEngine,core=CockpitEngine,$=id=>document.getElementById(id);
 let scenario=null,calibration=null,result=null,timer=null;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>`${n<0?'−':''}$${Math.abs(n).toFixed(0)}m`;
 const pct=n=>`${(n*100).toFixed(1)}%`;
 const args=()=>({runs:Number($('mc-runs').value),seed:20261022,shockProbability:Number($('mc-shock-prob').value)/100,shockDelay:Number($('mc-shock-delay').value),stressDelay:Number($('mc-delay').value),stressAccel:Number($('mc-accel').value),stressHaircut:Number($('mc-haircut').value)/100});
 function redraw(){if(!scenario||!calibration)return;
  const params=args();$('mc-runs-value').textContent=String(params.runs);$('mc-shock-prob-value').textContent=Math.round(params.shockProbability*100)+'%';$('mc-shock-delay-value').textContent=params.shockDelay+' min';$('mc-delay-value').textContent=params.stressDelay+' min';$('mc-accel-value').textContent=params.stressAccel+' min';$('mc-haircut-value').textContent=Math.round(params.stressHaircut*100)+'%';
  const began=performance.now();
  try{
   const state=core.simulate(scenario.book,scenario),res=api.run(state,calibration,params);result=res;
   const bau=res.bau,stress=res.stress;
   const kpis=[['mc-bau-surplus',money(bau.surplus.p10)],['mc-stress-surplus',money(stress.surplus.p10)],['mc-bau-group-breach',pct(bau.pGroupReserve)],['mc-stress-group-breach',pct(stress.pGroupReserve)],['mc-bau-local-breach',pct(bau.pAnyEntity)],['mc-stress-local-breach',pct(stress.pAnyEntity)],['mc-bau-lnncp',money(bau.lnncp.p90)],['mc-stress-lnncp',money(stress.lnncp.p90)]];
   for(const [id,val] of kpis)$(id).textContent=val;
   $('mc-summary').textContent=`${res.runs} synthetic joint scenarios, ${res.sourceCount} payments and ${res.entityCount} entities · common timing shock occurs in ${Math.round(params.shockProbability*100)}% of Monte Carlo draws by assumption · ${Math.round(performance.now()-began)} ms.`;
   $('mc-zero-prob').textContent=pct(stress.pZero);
   $('mc-entity-body').innerHTML=stress.entity.map((e,i)=>`<tr><td><button type="button" class="mc-drill" data-target="${esc(e.id)}">${esc(e.name)} ↗</button></td><td>${pct(bau.entity[i].pReserve)}</td><td class="${e.pReserve>bau.entity[i].pReserve?'mc-risk':''}">${pct(e.pReserve)}</td><td>${money(e.surplus.p10)}</td></tr>`).join('');
   $('mc-entity-body').querySelectorAll('[data-target]').forEach(b=>b.addEventListener('click',()=>{$('cp-view').value=b.dataset.target;$('cp-view').dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('group-cockpit').scrollIntoView({behavior:'smooth'});window.dispatchEvent(new CustomEvent('flowstate:entity-selected',{detail:{id:b.dataset.target}}));}));
   plot(res);$('mc-status').textContent='Risk distribution recomputed. No funding action has been executed.';
  }catch(e){$('mc-status').textContent='Distribution unavailable: '+e.message;console.error(e)}
 }
 function plot(res){
  const W=850,H=276,L=55,R=16,T=22,B=34;
  const all=[...res.bau.band,...res.stress.band].flatMap(p=>[p.p10,p.p50,p.p90]);
  let min=Math.min(...all,0),max=Math.max(...all,0),pad=Math.max(65,(max-min)*.08);min-=pad;max+=pad;
  const x=t=>L+(t-450)/690*(W-L-R),y=v=>T+(max-v)/(max-min)*(H-T-B);
  const poly=(band,lower,upper)=>`${band.map((p,i)=>(i?'L':'M')+x(p.t).toFixed(1)+','+y(p[lower]).toFixed(1)).join(' ')} ${band.slice().reverse().map(p=>'L'+x(p.t).toFixed(1)+','+y(p[upper]).toFixed(1)).join(' ')}Z`;
  const line=(band,key)=>band.map((p,i)=>(i?'L':'M')+x(p.t).toFixed(1)+','+y(p[key]).toFixed(1)).join(' ');
  const ticks=Array.from({length:5},(_,i)=>{const v=min+(max-min)*i/4;return`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#365165" stroke-dasharray="3 6"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" fill="#90a9b8" font-size="11">${(v/1000).toFixed(1)}</text>`}).join('');
  const tics=[480,600,720,840,960,1080].map(t=>`<text x="${x(t)}" y="${H-7}" text-anchor="middle" fill="#90a9b8" font-size="11">${String(Math.floor(t/60)).padStart(2,'0')}:00</text>`).join('');
  $('mc-chart').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="BaU and stress synthetic distribution fan charts of group cash position"><g>${ticks}</g><path d="${poly(res.bau.band,'p10','p90')}" fill="rgba(79,222,193,.17)"/><path d="${poly(res.stress.band,'p10','p90')}" fill="rgba(247,170,110,.22)"/><path d="${line(res.bau.band,'p50')}" fill="none" stroke="#49dfc3" stroke-width="2.8"/><path d="${line(res.stress.band,'p50')}" fill="none" stroke="#f5aa76" stroke-width="2.6"/><line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" stroke="#f49b8d" stroke-dasharray="5 5"/>${tics}<text transform="translate(14,144) rotate(-90)" font-size="11" fill="#9bb7c4" text-anchor="middle">GROUP CASH · USD BN</text></svg>`;
 }
 function schedule(){if(timer)clearTimeout(timer);timer=setTimeout(redraw,70)}
 function bind(){if(!$('mc-distribution'))return;for(const id of ['mc-runs','mc-shock-prob','mc-shock-delay','mc-delay','mc-accel','mc-haircut'])$(id).addEventListener('input',schedule);
  $('mc-reset').addEventListener('click',()=>{for(const [id,val] of Object.entries({'mc-runs':'500','mc-shock-prob':'25','mc-shock-delay':'60','mc-delay':'45','mc-accel':'30','mc-haircut':'15'}))$(id).value=val;redraw()});
  $('mc-review').addEventListener('click',()=>document.getElementById('optimisation-agent')?.scrollIntoView({behavior:'smooth'}));
 }
 window.addEventListener('flowstate:scenario',ev=>{if(!ev.detail?.book?.length)return;scenario=ev.detail;schedule()});
 async function init(){bind();try{const r=await fetch('model-calibration.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);calibration=await r.json();redraw()}catch(e){$('mc-status').textContent='Model calibration unavailable: '+e.message}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();