'use strict';
/* FLOWSTATE 11.2 — single browser-session scenario & simulated-decision coordinator.
 * Advisory only. This is NOT an immutable or regulated audit system; no trade execution. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.DecisionState=api.createStore();})(typeof window!=='undefined'?window:null,function(){
 const SOURCES=['group','optimiser','risk-aware','funding-lifecycle','forecast-lab'];
 function canonical(value){
  if(value===undefined)return 'null';
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 }
 function scenarioSignature(s){
  if(!s||!Array.isArray(s.book))throw Error('Scenario requires a payment book');
  return canonical({seed:s.seed,delay:s.delay,accel:s.accel,opening:s.opening,
   book:s.book.map(p=>[p.id,p.kind,p.product,p.entity,p.amount_musd,p.forecast_minute,p.actual_minute,p.baseline_minute])});
 }
 function createStore(options={}){
  let rev=0, scenario=null, scenarioHash=null, controlHashes=new Map(),active=null,seq=0;
  const stages=new Map(),audit=[],listeners=new Set();
  const now=options.now||(()=>new Date().toISOString());
  const notify=()=>{const snap=snapshot();for(const listener of listeners)listener(snap)};
  const entry=(type,source,detail)=>{
   const x=Object.freeze({id:++seq,at:now(),revision:rev,type,source,detail:String(detail||'')});audit.push(x);return x;
  };
  const invalidate=(reason)=>{
   rev++;stages.clear();
   if(active){entry('INVALIDATED',active.source,reason);active=null;}
   notify();return rev;
  };
  const onScenario=(data)=>{
   const hash=scenarioSignature(data);
   if(hash===scenarioHash)return false;
   scenarioHash=hash;scenario={seed:data.seed,delay:data.delay,accel:data.accel,opening:data.opening,paymentCount:data.book.length};
   invalidate('Payment book or liquidity scenario changed');return true;
  };
  const changedControl=(id,value)=>{
   if(!id)return false;
   const sig=canonical(value);
   if(controlHashes.has(id)&&controlHashes.get(id)===sig)return false;
   // First observed value is a baseline: a deliberate field change is only logged after it has been registered.
   if(!controlHashes.has(id)){controlHashes.set(id,sig);return false;}
   invalidate('Control '+id+' changed');controlHashes.set(id,sig);return true;
  };
  const stage=(source,proposal)=>{
   if(!SOURCES.includes(source))throw Error('Unknown decision source');
   if(!scenario){return null}
   const x=Object.freeze({revision:rev,signature:canonical(proposal),eligible:proposal?.eligible===true});
   stages.set(source,x);return x.revision;
  };
  const decide=(source,status,description,expectedRevision)=>{
   if(!SOURCES.includes(source))return{ok:false,reason:'Unknown decision source'};
   if(status!=='APPROVED'&&status!=='REJECTED')return{ok:false,reason:'Invalid decision'};
   const staged=stages.get(source);
   if(!scenario||!staged||staged.revision!==rev||expectedRevision!==rev){return{ok:false,reason:'Proposal is stale; re-evaluate against current scenario'}};
   if(status==='APPROVED'){
    if(!staged.eligible)return{ok:false,reason:'Eligibility control failed in unified decision state'};
    if(active){entry('SUPERSEDED',active.source,'Replaced by a reviewed '+source+' simulation');}
    const row=entry('APPROVED',source,description);
    active=Object.freeze({id:row.id,source,revision:rev,description:String(description||'')});
   }else{
    if(active?.source===source){entry('WITHDRAWN',source,'Rejected previously approved simulation');active=null;}
    entry('REJECTED',source,description);
   }
   notify();return{ok:true,active,revision:rev};
  };
  const snapshot=()=>Object.freeze({revision:rev,scenario:scenario?Object.freeze({...scenario}):null,
   active:active?Object.freeze({...active}):null,audit:Object.freeze(audit.map(a=>Object.freeze({...a}))),
   proposals:Object.freeze(Array.from(stages,([source,s])=>Object.freeze({source,revision:s.revision})))});
  const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn)};
  const toCSV=()=>[
   ['event_id','timestamp_utc','revision','event','component','description'],
   ...audit.map(x=>[x.id,x.at,x.revision,x.type,x.source,x.detail])
  ].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');
  return Object.freeze({onScenario,changedControl,stage,decide,snapshot,subscribe,toCSV,scenarioSignature});
 }
 return{createStore,scenarioSignature};
});