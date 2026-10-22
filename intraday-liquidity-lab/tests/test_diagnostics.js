'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=require('../app.js'),core=require('../cockpit-engine.js'),d=require('../diagnostics-engine.js');
const forest=JSON.parse(fs.readFileSync(path.join(__dirname,'../model.json'),'utf8'));app.setModel(forest);
const book=app.makeDay(20261021),before=JSON.stringify(book);
const base=core.simulate(book,{opening:2000,delay:0,accel:0});
const result=d.compareScenarios(book,2000,{delay:60,accel:15,haircut:.05});
assert.equal(result.entities.length,3);
assert(Math.abs(result.bau.lnncp-base.group.forecast.peak_need)<1e-8);
assert(Math.abs(result.bau.surplus-base.group.forecast.surplus)<1e-8);
assert(Math.abs(result.stress.opening-1900)<1e-8);
assert(result.group.delta_surplus<0);
assert(Math.abs(result.entities.reduce((s,p)=>s+p.Stress.opening,0)-result.stress.opening)<1e-7);
const sans=d.compareScenarios(book,2000,{});
assert.equal(sans.group.delta_surplus,0);
assert.equal(sans.group.delta_lnncp,0);
for(let i=0;i<result.points.length;i++){
 assert.equal(result.points[i].t,base.group.forecast.points[i].t);
 assert(Math.abs(result.points[i].bau-base.group.forecast.points[i].y)<1e-7);
}
const incoming=core.enrich(book).find(p=>p.kind==='IN');
const detail=d.explainSettlement(incoming,app.predictOne,{products:forest.products,rails:forest.rails,counterparties:forest.counterparties});
assert(Math.abs(detail.eta-incoming.forecast_minute)<1e-7,'model ETA must match stored model forecast');
assert(detail.effects.length===8);
assert(detail.effects.every(f=>f.span>=0&&Number.isFinite(f.largest_absolute_change)));
assert(detail.effects.every((f,i)=>!i||f.largest_absolute_change<=detail.effects[i-1].largest_absolute_change));
assert.throws(()=>d.explainSettlement({kind:'OUT'},app.predictOne,forest));
for(const id of ['all',...core.ENTITIES.map(e=>e.id)]){
 const rows=core.enrich(book),drivers=d.gapDrivers(rows,id);
 assert(Math.abs(drivers.total-drivers.variance)<1e-7,`drivers reconciliation ${id}`);
 assert(Math.abs(drivers.products.reduce((s,p)=>s+p.impact,0)-drivers.variance)<1e-7);
 assert(drivers.payments.every(p=>p.kind==='IN'));
}
assert.equal(JSON.stringify(book),before);
console.log('PASS v6: group/entity BaU vs stressed liquidity, LNNCP and haircut, exact synthetic cash-flow driver reconciliation, RF what-if sensitivity, immutable inputs.');