'use strict';
const assert=require('node:assert/strict');
const {createStore}=require('../decision-state.js');
const f=()=>createStore({now:()=> '2026-10-22T18:00:00Z'});
function scenario(override={}){return{seed:42,delay:0,accel:0,opening:2000,book:[{id:'IN-1',kind:'IN',entity:'a',product:'Repo',amount_musd:100,forecast_minute:600,actual_minute:640,baseline_minute:610}],...override}}
{
 const s=f();const first=s.onScenario(scenario());assert.equal(first,true);
 const rev=s.snapshot().revision;assert.equal(rev,1);assert.equal(s.onScenario(scenario()),false);assert.equal(s.snapshot().revision,rev);
 s.stage('group',{eligible:true,amount:100});assert.equal(s.decide('group','APPROVED','repo proposal',rev).ok,true);
 assert.equal(s.snapshot().active.source,'group');
 s.stage('optimiser',{eligible:true,plan:'T1'});assert.equal(s.decide('optimiser','APPROVED','intercompany scenario',rev).ok,true);
 assert.equal(s.snapshot().active.source,'optimiser');
 assert.deepEqual(s.snapshot().audit.map(x=>x.type),['APPROVED','SUPERSEDED','APPROVED']);
 assert.equal(s.snapshot().audit[1].source,'group');
 s.onScenario(scenario({book:scenario().book.map(p=>({...p,forecast_minute:720}))}));
 assert.equal(s.snapshot().active,null);assert.equal(s.snapshot().revision,rev+1);
 assert.equal(s.decide('optimiser','APPROVED','stale',rev).ok,false);
 assert.equal(s.snapshot().audit.at(-1).type,'INVALIDATED');
}
{
 const s=f();s.onScenario(scenario());s.changedControl('fl-tenor','same_day');
 s.stage('funding-lifecycle',{eligible:true,tenor:'same_day'});const current=s.snapshot().revision;
 assert.equal(s.changedControl('fl-tenor','overnight'),true);
 assert.equal(s.decide('funding-lifecycle','APPROVED','expired stage',current).ok,false);
 assert.equal(s.changedControl('fl-tenor','overnight'),false);
 s.stage('funding-lifecycle',{eligible:true,tenor:'overnight'});
 assert.equal(s.decide('funding-lifecycle','REJECTED','declined',s.snapshot().revision).ok,true);
 const a=s.snapshot();assert.equal(a.audit.at(-1).type,'REJECTED');
 assert.equal(Object.isFrozen(a.audit),true);assert.equal(Object.isFrozen(a.audit[0]),true);
 assert.match(s.toCSV(),/decision|REJECTED/);
 s.stage('group',{eligible:false});assert.equal(s.decide('group','APPROVED','blocked',s.snapshot().revision).ok,false);
}
{
 const s=f();s.onScenario(scenario());s.stage('forecast-lab',{eligible:true,id:'A'});
 let n=0;const unsub=s.subscribe(()=>n++);s.decide('forecast-lab','APPROVED','demo',s.snapshot().revision);
 assert.equal(n,1);unsub();s.onScenario(scenario({opening:1999}));assert.equal(n,1);
}
console.log('DecisionState: deterministic scenario versioning, stale-block, superseding approvals and browser-session audit PASS');