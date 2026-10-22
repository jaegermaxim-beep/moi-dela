'use strict';
/* v8: accounting invariants, reproducibility, assumed-shock monotonicity and 19:00 boundary */
const assert=require('node:assert/strict'),core=require('../cockpit-engine.js'),mc=require('../distribution-engine.js');
const S=(id,kind,amount,t,product='Repo')=>({synthetic_id:id,kind,product,amount_musd:amount,booking_minute:465,forecast_minute:t,actual_minute:t,baseline_minute:t});
const seedbook=[S('a','IN',100,600),S('b','IN',120,800,'FX'),S('c','OUT',160,590),S('d','OUT',90,790)];
const cal={residuals_by_product:{Repo:Array(100).fill(0),FX:Array(100).fill(0)}};
const source=core.simulate(seedbook,{opening:210,delay:0,accel:0});
let op={runs:200,seed:42,shockProbability:0,shockDelay:0,stressDelay:0,stressAccel:0,stressHaircut:0};
let a=mc.run(source,cal,op),b=mc.run(source,cal,op);
assert.deepEqual(a,b,'fixed seed must yield identical distributions');
assert.equal(a.bau.lnncp.p90,150);assert.equal(a.bau.surplus.p10,60);
assert.equal(a.stress.lnncp.p90,a.bau.lnncp.p90);
assert.equal(a.stress.surplus.p10,a.bau.surplus.p10);
assert.equal(a.bau.pZero,0);
// Stress assumptions delay all incoming cash and accelerate all outflows, so every tested path deteriorates or stays equal.
const stress=mc.run(source,cal,{...op,stressDelay:75,stressAccel:60,stressHaircut:.15});
assert(stress.stress.lnncp.p90>=stress.bau.lnncp.p90);
assert(stress.stress.surplus.p10<=stress.bau.surplus.p10);
assert(stress.stress.pGroupReserve>=stress.bau.pGroupReserve);
assert(stress.stress.pAnyEntity>=stress.bau.pAnyEntity);
// Late, cross-session arrivals must NEVER be credited as 19:00 cash.
const late=core.simulate([S('late','IN',200,1135),S('out','OUT',120,1110)],{opening:150});
const after=mc.run(late,cal,{...op,shockProbability:1,shockDelay:70});
assert.equal(after.bau.lnncp.p50,120,'late inflow should not offset the same-day outgoing payment');
assert.equal(after.bau.surplus.p50,30);
assert.equal(after.bau.band.at(-1).p50,30);
// Group cash is not naively created by local risk drivers.
assert.equal(a.bau.band.at(-1).p50,source.group.forecast.closing);
assert.equal(a.bau.entity.length,3);
assert.throws(()=>mc.run(source,{residuals_by_product:{}},op),/calibration/);
assert.throws(()=>mc.run(source,cal,{...op,shockProbability:2}),/Invalid/);
console.log('PASS FLOWSTATE v8 Monte Carlo distribution tests',JSON.stringify({runs:a.runs,p10Surplus:a.bau.surplus.p10,stressP10:stress.stress.surplus.p10,lateClosing:after.bau.band.at(-1).p50}));