'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const app=require('../app'),core=require('../cockpit-engine'),o=require('../optimiser-engine');
app.setModel(JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../model.json'),'utf8')));
const book=app.makeDay(20261021),snapshot=JSON.stringify(book);
for(const delay of [0,60,120]){
 const state=core.simulate(book,{opening:2000,delay,accel:0});
 const r=o.optimise(state,{asOf:720,maxActions:3});
 assert(r.ranked.length>=2);assert(r.considered>=r.ranked.length);
 const first=r.ranked[0];assert(first.eligible);assert(first.after.unmet<=r.baseline.after.unmet+1e-6);
 assert(first.score<=r.ranked[r.ranked.length-1].score+1e-6 || r.ranked[r.ranked.length-1].actions.length===0);
 assert(r.ranked.some(x=>x.actions.length===0));
 for(const p of r.ranked){
  assert(p.eligible);assert(o.validate(state,p.actions,720).valid);
  const transfers=p.actions.filter(a=>a.type==='transfer');
  for(const transfer of transfers){const s=p.after.byId[transfer.source].points.filter(x=>x.t>=transfer.when);assert(s.every(x=>x.y>=state.entityById(transfer.source).reserve-1e-6));}
  const groupBase=state.group.forecast.points;for(let i=0;i<groupBase.length;i++){const repoflow=p.actions.filter(a=>a.type==='repo'&&a.when<=groupBase[i].t).reduce((s,a)=>s+a.amount_musd,0);assert(Math.abs(p.after.group[i].y-groupBase[i].y-repoflow)<1e-6);}
  for(let i=0;i<groupBase.length;i++){const sum=state.entities.reduce((s,en)=>s+p.after.byId[en.id].points[i].y,0);assert(Math.abs(sum-p.after.group[i].y)<1e-6,'Group/entity conservation with transfers and repos');}
 }
 console.log('PASS optimise delay',delay,'candidates',r.considered,'baseline gap',r.baseline.after.unmet.toFixed(1),'best gap',first.after.unmet.toFixed(1),'cost',first.costUsd.toFixed(0));
}
const state=core.simulate(book,{opening:2000,delay:60});
assert(!o.validate(state,[{type:'repo',target:'international-branch',amount_musd:130,when:720}],720).valid);
assert(!o.validate(state,[{type:'repo',target:'international-branch',amount_musd:70,when:720},{type:'repo',target:'international-branch',amount_musd:70,when:780}],720).valid,'aggregate haircuts');
assert(!o.validate(state,[{type:'transfer',source:'international-branch',target:'group-treasury',amount_musd:20,when:720}],720).valid,'transfer restrictions');
assert(!o.validate(state,[{type:'transfer',source:'group-treasury',target:'international-branch',amount_musd:20,when:660}],720).valid,'no retroactive transfer');
assert(!o.validate(state,[{type:'transfer',source:'group-treasury',target:'investment-bank',amount_musd:900,when:720}],720).valid,'local reserve floor');
assert(!o.validate(state,[{type:'repo',target:'international-branch',amount_musd:30,when:660}],660).valid,'repo cutoff');
assert(!o.validate(state,[{type:'repo',target:'international-branch',amount_musd:15,when:780},{type:'repo',target:'international-branch',amount_musd:20,when:780},{type:'repo',target:'international-branch',amount_musd:30,when:780},{type:'repo',target:'international-branch',amount_musd:30,when:780}],720).valid,'max actions');
const check=o.optimise(state,{asOf:900,maxActions:3});assert(check.ranked.length>=1);assert(check.ranked.every(p=>p.actions.every(a=>a.when>=900)));
assert.equal(JSON.stringify(book),snapshot,'immutable synthetic input');
console.log('PASS restrictions, settlement timing, no pre-decision actions, aggregate collateral, source reserves, immutability');