'use strict';
/* FLOWSTATE v11: executive presentation summary on fictional scenario, separate from bank production logic. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ExecutiveEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 const pct=v=>Math.round(v*1000)/10;
 function summarize(state){
  if(!state||!state.group?.forecast?.points?.length||!state.entities?.length)throw Error('A simulated Group liquidity state is required');
  const entities=state.entities.map(e=>({id:e.id,name:e.name,region:e.region,reserve:e.reserve,transferable:e.transferable,surplus:e.forecast.surplus,opening:e.opening,lnncp:e.forecast.peak_need,belowReserve:e.forecast.surplus<e.reserve,belowZero:e.forecast.surplus<0}));
  const n=entities.filter(x=>x.belowReserve).length;
  const peakGap=Math.max(...state.group.forecast.points.map((p,i)=>Math.abs(state.group.actual.points[i].y-p.y)));
  const reserve=entities.reduce((s,e)=>s+e.reserve,0);
  const alerts=[];
  if(state.group.forecast.surplus<0)alerts.push({kind:'severe',title:'Potential Group cash shortfall',detail:'The projected intraday Group cash position drops below zero in the current fictional scenario.'});
  else if(state.group.forecast.surplus<reserve)alerts.push({kind:'watch',title:'Group reserve floor under pressure',detail:'Lowest Group position falls below the sum of illustrative local reserve floors. This is not a regulatory limit.'});
  else alerts.push({kind:'healthy',title:'Group Liquidity Surplus remains positive',detail:'No Group reserve floor breach in this one deterministic forecast. Entity liquidity must be reviewed separately.'});
  if(n)alerts.push({kind:n>1?'severe':'watch',title:`${n} of ${entities.length} entities below reserve`,detail:'Local shortfalls may coexist with Group liquidity. Transfers require local capacity and legal-entity permissions.'});
  else alerts.push({kind:'healthy',title:'Local reserve floors maintained',detail:'All illustrated entities retain sufficient liquidity in the deterministic forecast.'});
  if(peakGap>120)alerts.push({kind:'watch',title:'Investigate expected vs realised timing',detail:`The synthetic intraday forecast gap reaches ${money(peakGap)}. Inspect transaction-level settlement differences.`});
  else alerts.push({kind:'healthy',title:'Monitor payment settlement deviations',detail:`Largest synthetic realised / projected position gap is ${money(peakGap)}.`});
  return {group:{surplus:state.group.forecast.surplus,lnncp:state.group.forecast.peak_need,opening:state.opts.opening,reserve,peakGap,points:state.group.forecast.points,actual:state.group.actual.points},entities,belowReserve:n,alerts,status:state.group.forecast.surplus<0?'SHORTFALL':n>0||state.group.forecast.surplus<reserve?'WATCH':'WITHIN ASSUMPTIONS'};
 }
 function money(v){if(!Number.isFinite(v))return '—';const abs=Math.abs(v);return `${v<0?'−':''}$${abs>=1000?(abs/1000).toFixed(2)+'bn':abs.toFixed(0)+'m'}`}
 function viewSeries(summary){return summary.group.points.map((p,i)=>({time:p.t,forecast:p.y,realised:summary.group.actual[i].y}));}
 function riskInterpretation(summary,pGroupReserve){if(!Number.isFinite(pGroupReserve))return summary.status==='WITHIN ASSUMPTIONS'?'Deterministic BaU only':'Local reserves need review';return `Stress reserve breach ${pct(pGroupReserve)}% (synthetic)`;}
 return {summarize,money,pct,viewSeries,riskInterpretation};
});