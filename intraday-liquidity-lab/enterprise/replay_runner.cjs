'use strict';
/* Deterministic replay of the ACTUAL browser Group/Entity cashflow model, using saved synthetic snapshots.
   No orders, no external calls. */
const core=require('../cockpit-engine.js');
const executive=require('../executive-engine.js');
let source='';
process.stdin.setEncoding('utf8');
process.stdin.on('data',data=>source+=data);
process.stdin.on('end',()=>{
 try{
  const input=JSON.parse(source);
  const state=core.simulate(input.book,{opening:input.opening,delay:input.delay,accel:input.accel});
  const summary=executive.summarize(state);
  const data={group_lnncp_musd:summary.group.lnncp,group_surplus_musd:summary.group.surplus,
   group_sod_musd:summary.group.opening,entity_reserve_breaches:summary.belowReserve,
   entity_positions:summary.entities.map(e=>({id:e.id,surplus_musd:e.surplus,lnncp_musd:e.lnncp,reserve_floor_musd:e.reserve})),
   time_buckets:summary.group.points.map((p,i)=>({minute:p.t,forecast_musd:p.y,realised_musd:summary.group.actual[i].y}))};
  process.stdout.write(JSON.stringify(data));
 }catch(error){process.stderr.write(String(error?.stack||error));process.exitCode=1;}
});