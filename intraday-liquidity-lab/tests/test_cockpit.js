'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const app=require('../app.js');const e=require('../cockpit-engine.js');
app.setModel(JSON.parse(fs.readFileSync(path.join(__dirname,'../model.json'),'utf8')));
const original=app.makeDay(20261021);const snapshot=JSON.stringify(original);
const s=e.simulate(original,{opening:2000,delay:0,accel:0});
assert.equal(s.book.length,300);assert.equal(s.entities.length,3);
assert.equal(new Set(s.book.map(p=>p.synthetic_id)).size,300);
const total=s.entities.reduce((n,z)=>n+z.opening,0);assert(Math.abs(total-2000)<1e-9);
// Group cash path must match the independently built v3 path.
const v3=app.curveFor(original,'forecast_minute',0,0,2000);
assert(Math.abs(v3.peak_need-s.group.forecast.peak_need)<1e-6);
assert(Math.abs(v3.surplus-s.group.forecast.surplus)<1e-6);
for(let i=0;i<s.group.forecast.points.length;i++){
 let sum=s.entities.reduce((a,entity)=>a+entity.forecast.points[i].y,0);
 assert(Math.abs(sum-s.group.forecast.points[i].y)<1e-6,'entity positions must sum to Group cash position at each timestamp');
}
let tr=e.assess(s,{type:'transfer',source:'group-treasury',target:'international-branch',amount_musd:80,when:720});
assert(tr.eligible);assert.equal(tr.group.change,0,'an intercompany transfer must not create cash at Group level');
const from=tr.entities.find(x=>x.id==='group-treasury');const to=tr.entities.find(x=>x.id==='international-branch');
assert(from.delta<=0&&to.delta>=0);
// The source must remain above its reserve after the transfer across the entire subsequent time horizon.
const src=s.entityById('group-treasury');
const minFuture=src.forecast.points.filter(p=>p.t>=720).reduce((m,p)=>Math.min(m,p.y-80),Infinity);
assert(minFuture>=src.reserve-1e-6);
assert(!e.assess(s,{type:'transfer',source:'international-branch',target:'group-treasury',amount_musd:20,when:720}).eligible,'restricted source blocked');
assert(!e.assess(s,{type:'transfer',source:'group-treasury',target:'group-treasury',amount_musd:20,when:720}).eligible,'self-transfer blocked');
assert(!e.assess(s,{type:'transfer',source:'group-treasury',target:'international-branch',amount_musd:950,when:720}).eligible,'transfer capacity enforced');
assert(!e.assess(s,{type:'transfer',source:'group-treasury',target:'international-branch',amount_musd:50,when:600-15}).eligible,'cutoff enforced');
let repo=e.assess(s,{type:'repo',target:'international-branch',amount_musd:100,when:780});
assert(repo.eligible);assert(repo.details.cost>0);
assert.equal(repo.events['international-branch'][0].amount_musd,100);
const forecast=s.group.forecast.points;
repo.group.curve.points.forEach((p,i)=>{if(p.t<780)assert(Math.abs(p.y-forecast[i].y)<1e-7,'repo cannot add cash before settlement');else assert(Math.abs(p.y-forecast[i].y-100)<1e-6,'repo must add exactly $100m after settlement');});
assert(!e.assess(s,{type:'repo',target:'international-branch',amount_musd:200,when:780}).eligible,'repo collateral haircut capacity enforced');
assert(!e.assess(s,{type:'repo',target:'international-branch',amount_musd:50,when:705}).eligible,'repo settlement window enforced');
const baseVariance=e.paymentVariance(s,'all');assert.equal(baseVariance.rows.length,155);
const single=e.paymentVariance(s,'group-treasury');assert(single.rows.every(p=>p.entity==='group-treasury'));
const msgs=e.evaluationMessages(s,repo);assert(msgs.length>=3);
assert.equal(JSON.stringify(original),snapshot,'no mutation of source synthetic transactions');
console.log('PASS v4: Group versus entity reconciliation, transfer neutrality and restrictions, repo haircut/settlement timing, payment exceptions, agent readouts, immutable synthetic input.');