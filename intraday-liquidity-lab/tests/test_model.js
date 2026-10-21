'use strict';
const fs=require('fs');const assert=require('assert');const app=require('../app.js');
const model=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../model.json'),'utf8'));
app.setModel(model);
const cases=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../model/parity_cases.json'),'utf8'));
for(const c of cases){const got=app.predictOne(c.inputs);assert(Math.abs(got-c.expected_delay)<.005,`Parity failed: ${got} vs ${c.expected_delay}`)}
const pays=app.makeDay(20261021);assert(pays.length===300,'Payment universe size');
assert(pays.filter(p=>p.kind==='IN').length===155);assert(pays.filter(p=>p.kind==='OUT').length===145);
const base=app.curveFor(pays,'forecast_minute',0,0,2000);assert(base.points.length===47);assert(Number.isFinite(base.peak_need));
const high=app.curveFor(pays,'forecast_minute',90,45,2000);
assert(high.peak_need>=base.peak_need-1e-4,'Stress must not improve forecast peak funding need');
const moreBuffer=app.curveFor(pays,'forecast_minute',90,45,3500);assert(Math.abs((moreBuffer.headroom-high.headroom)-1500)<1e-5,'Buffer accounting');
assert(app.clock(555)==='09:15');
console.log(`PASS: ${cases.length} Python/JS parity examples, ${pays.length} synthetic daily payments, 47 liquidity periods and stress/buffer invariants.`);
