'use strict';
/* FLOWSTATE decision support. Synthetic, illustrative, no execution or external systems. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.DecisionEngine=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  const ACTIONS=[
    {id:'mobilize',title:'Mobilise eligible liquidity',tag:'COLLATERAL / FUNDING',detail:'Model a +$500m increase in available intraday liquidity after hypothetical approved collateral mobilisation.',assumptions:'Eligible unencumbered assets and credit-line capacity are assumed. Funding cost, haircut and settlement lead time are not modelled.'},
    {id:'pace',title:'Pace non-critical outflows',tag:'PAYMENT STEERING',detail:'Delay eligible non-time-sensitive outgoing payments by 30 minutes while protecting time-specific obligations.',assumptions:'Requires authorisation, cut-off and client-impact review. The demo assumes that eligible payments can be deferred without penalties.'},
    {id:'stagger',title:'Stagger large outgoing flows',tag:'OUTFLOW CONTROL',detail:'Defer eligible large, non-critical outgoing payments by 45 minutes, without exceeding demo operating cut-offs.',assumptions:'Requires payment-level controllability, documented prioritisation and protection of system deadlines.'}
  ];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const amended=(book,id)=>{
    if(id!=='pace'&&id!=='stagger')return book;
    return book.map(p=>{
      if(p.kind!=='OUT'||p.critical||p.actual_minute>=1080) return p;
      const qualified=id==='pace'?true:p.amount_musd>=25;
      if(!qualified)return p;
      const shift=id==='pace'?30:45;
      const move=(value)=>Math.min(1110,value+shift);
      return {...p,forecast_minute:move(p.forecast_minute),baseline_minute:move(p.baseline_minute),actual_minute:move(p.actual_minute)};
    });
  };
  function effect(book,actionId,opening){
    if(actionId==='mobilize')return {book,opening:opening+500,changed:0};
    const revised=amended(book,actionId);
    const changed=revised.reduce((n,p,i)=>n+Number(p.forecast_minute!==book[i].forecast_minute),0);
    return {book:revised,opening,changed};
  }
  function riskStatus(surplus, lnncp=0, bauReference=1200, stressedReference=2300){
    if(surplus<0)return {level:'breach',title:'Projected intraday liquidity shortfall',explanation:'The simulated liquidity surplus is negative. The assumed SoD position does not cover projected LNNCP.'};
    if(lnncp>=.8*stressedReference)return {level:'watch',title:'Approaching stressed LNNCP reference',explanation:'Illustrative 80% stressed LNNCP review marker reached. Treasury and Group ALM involvement would depend on approved local governance.'};
    if(lnncp>=bauReference)return {level:'watch',title:'Above BaU LNNCP reference',explanation:'Simulated liquidity usage exceeds the illustrative BaU reference level. Review the projected intraday position and liquidity sources.'};
    if(surplus<500)return {level:'watch',title:'Reduced liquidity surplus',explanation:'Liquidity surplus is below the illustrative $500m monitoring threshold.'};
    return {level:'normal',title:'Within illustrative BaU reference',explanation:'Simulated projected LNNCP is below the illustrative BaU reference and liquidity surplus is positive.'};
  }
  function referenceAssessment(lnncp,bauReference,stressedReference){
    const use=Math.max(0,Number(lnncp));const bau=Math.max(1,Number(bauReference));const stressed=Math.max(1,Number(stressedReference));
    return {ratio:use/stressed,reviewMarker:.8*stressed,level:use>=stressed?'STRESSED REFERENCE EXCEEDED':use>=.8*stressed?'80% STRESSED REFERENCE REACHED':use>=bau?'ABOVE BAU REFERENCE':'WITHIN BAU REFERENCE'};
  }
  function monitor(book,drift=0){
    const eligible=book.filter(p=>p.kind==='IN');
    if(!eligible.length)return {records:0,mae:0,baselineMae:0,weightedMae:0,optimisticRate:0,p90:0,segments:[]};
    let ae=0,bse=0,wae=0,weight=0,optimistic=0;
    const abs=[],segments={};
    for(const p of eligible){
      const actual=p.actual_minute+drift;
      const err=p.forecast_minute-actual;
      const x=Math.abs(err),bx=Math.abs(p.baseline_minute-actual);
      ae+=x;bse+=bx;wae+=x*p.amount_musd;weight+=p.amount_musd;
      if(err<0)optimistic++;
      abs.push(x);
      const seg=segments[p.product]||(segments[p.product]={product:p.product,n:0,ae:0,optimistic:0});
      seg.n++;seg.ae+=x;if(err<0)seg.optimistic++;
    }
    abs.sort((a,b)=>a-b);
    return {records:eligible.length,mae:ae/eligible.length,baselineMae:bse/eligible.length,weightedMae:wae/Math.max(1,weight),optimisticRate:optimistic/eligible.length,p90:abs[Math.ceil(.9*abs.length)-1],segments:Object.values(segments).map(s=>({product:s.product,count:s.n,mae:s.ae/s.n,optimisticRate:s.optimistic/s.n})).sort((a,b)=>b.mae-a.mae)};
  }
  function monitoringStatus(m){
    const flagged=m.mae>65||m.weightedMae>70||m.optimisticRate>.72;
    return flagged?{level:'watch',title:'Model review triggered',text:'Illustrative thresholds exceeded. Investigate late arrivals, drift and segment bias before relying on forecasts.'}:{level:'normal',title:'No synthetic monitoring threshold breach',text:'Demo thresholds are not independently calibrated and do not establish that model risk is acceptable.'};
  }
  return {ACTIONS,effect,riskStatus,referenceAssessment,monitor,monitoringStatus,amended};
});