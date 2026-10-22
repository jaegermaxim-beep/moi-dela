'use strict';
const assert=require('node:assert/strict');
const engine=require('../client-studio-engine.js'),app=require('../app.js'),group=require('../cockpit-engine.js'),flow=require('../cashflow-engine.js'),confidence=require('../confidence-engine.js');
app.setModel(require('../model.json'));
const late=[{kind:'IN',forecast_minute:1205,actual_minute:1205,baseline_minute:1205,booking_minute:930,amount_musd:130},
 {kind:'OUT',forecast_minute:740,actual_minute:740,baseline_minute:740,amount_musd:40}];
for(const name of ['forecast_minute','actual_minute']){
 const a=app.curveFor(late,name,0,0,200),b=group.timeline(late,name,0,0,200);
 assert.equal(a.closing,160);assert.equal(a.peak_need,40);assert.equal(a.unsettled_inflows,130);
 assert.equal(b.closing,a.closing);assert.equal(b.surplus,a.surplus);
 assert.equal(b.points.length,47);
}
const book=app.makeDay(20261021),state=group.simulate(book,{opening:2000,delay:75,accel:0});
const local=state.entityById('international-branch');
const overnight=engine.compareFacility(state,local.id,50,{asOf:720,when:780,tenor:'overnight'});
const sameDay=engine.compareFacility(state,local.id,50,{asOf:720,when:780,tenor:'same_day',repayWhen:930});
assert(overnight.eligible&&sameDay.eligible);assert(overnight.protectedGap>0);assert(sameDay.costUsd<overnight.costUsd);
assert(overnight.afterGap<overnight.baseGap);assert(sameDay.afterGap>overnight.afterGap);
assert(!engine.compareFacility(state,local.id,170,{when:780,asOf:720}).eligible,'collateral guard');
const quality=engine.quality(state.book,require('../model/training_report.json'),require('../model/calibration_report.json'));
assert.equal(quality.sample,155);assert(quality.dayRFMAE<quality.dayBaselineMAE);
assert(quality.importanceShare>.7);
const incoming=state.book.find(p=>p.kind==='IN');const hypothetical=confidence.timingShiftState(group,state,incoming.synthetic_id,1205);
assert.equal(hypothetical.conservative_time,1205);
assert(hypothetical.truncated,'late P90 is outside session but must not be credited at close');
console.log('PASS v11.1 unified end-of-day cutoff, unsettled receivables, case-consistent lifecycle cost and model challenge evidence');