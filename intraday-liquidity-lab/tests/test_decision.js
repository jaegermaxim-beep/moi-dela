'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const engine=require('../decision-engine.js');
const app=require('../app.js');
const model=JSON.parse(fs.readFileSync(path.join(__dirname,'../model.json'),'utf8'));
app.setModel(model);
const book=app.makeDay(20261021);
const bookClone=JSON.stringify(book);
const opening=500;
const stressed=app.curveFor(book,'forecast_minute',120,60,opening);
const floated=engine.effect(book,'mobilize',opening);
assert.equal(floated.opening,1000);
const afterFloat=app.curveFor(floated.book,'forecast_minute',120,60,floated.opening);
assert(Math.abs((afterFloat.surplus-stressed.surplus)-500)<1e-5);
for(const id of ['pace','stagger']){
 const effect=engine.effect(book,id,opening);
 assert(effect.changed>0,`${id} should modify some eligible payments`);
 assert.equal(effect.book.length,book.length);
 effect.book.forEach((p,i)=>{
   assert.equal(p.kind,book[i].kind);
   assert.equal(p.amount_musd,book[i].amount_musd);
   if(book[i].critical)assert.equal(p.forecast_minute,book[i].forecast_minute,'protected time-sensitive payment changed');
   if(book[i].kind==='IN')assert.equal(p.forecast_minute,book[i].forecast_minute,'incoming payment shifted by outgoing action');
 });
}
assert.equal(JSON.stringify(book),bookClone,'No mutation of baseline cashflows');
assert.equal(engine.riskStatus(-1).level,'breach');
assert.equal(engine.riskStatus(300).level,'watch');
assert.equal(engine.riskStatus(700).level,'normal');
const normal=engine.monitor(book,0),shifted=engine.monitor(book,150);
assert.equal(normal.records,155);
assert.equal(normal.segments.length,6);
assert(shifted.mae>normal.mae,'Adverse arrival timing should worsen MAE');
assert(shifted.weightedMae>normal.weightedMae,'Value weighted MAE should worsen with a 150min delay');
assert(shifted.optimisticRate>=normal.optimisticRate);
assert.equal(engine.monitoringStatus(shifted).level,'watch');
console.log('PASS: action invariants, TSO protection, buffer effects, indicative surplus threshold, synthetic model monitoring and drift alert.');
