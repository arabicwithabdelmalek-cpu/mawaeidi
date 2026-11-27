"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),app=fs.readFileSync(path.join(root,"app-main.js"),"utf8"),html=fs.readFileSync(path.join(root,"index.html"),"utf8");
function extract(n){const i=app.indexOf("function "+n+"(");assert.ok(i>=0,n);return app.slice(i,app.indexOf("\n}",i)+2)}
const state=new Function(extract("nextLessonCardState")+"\nreturn nextLessonCardState")();
assert.equal(state(null,540),null);
assert.deepEqual(state({start:600,end:660},540),{ongoing:false,remaining:60,elapsed:0,duration:60});
assert.deepEqual(state({start:600,end:660},600),{ongoing:true,remaining:60,elapsed:0,duration:60});
assert.deepEqual(state({start:600,end:660},630),{ongoing:true,remaining:30,elapsed:30,duration:60});
const nodes=new Map();let writes=0,edits=0,adds=0,weeks=0;
const card={dataset:{},classList:{toggle(){}},contains:()=>false,querySelector(sel){if(!nodes.has(sel))nodes.set(sel,{focus(){},onclick:null,textContent:"",value:0});return nodes.get(sel)},set innerHTML(value){writes++;nodes.clear();this.markup=value}};
const document={getElementById:()=>card,activeElement:null,querySelector:()=>({})};
const render=new Function("document","openEdit","openQuickAddForToday","setView","studentTimeInline","dailyLessonEndLabel","fmt","esc","dailyDurationText",extract("nextLessonCardState")+"\n"+extract("updateNextLessonClock")+"\n"+extract("renderNextLessonCard")+"\nreturn renderNextLessonCard")(document,()=>edits++,()=>adds++,()=>weeks++,()=>"",()=>"11:00",t=>t,s=>String(s),m=>String(m));
const model={total:1,next:{item:{date:"2026-11-26",time:"10:00",lesson:{id:"a",name:"Student",type:"teach",duration:60}},start:600,end:660}};
render(model,540);assert.equal(writes,1);assert.equal(card.querySelector("#nextRemainingTime").textContent,"60");
render(model,541);assert.equal(writes,1);assert.equal(card.querySelector("#nextRemainingTime").textContent,"59");
render(model,599.5);assert.equal(writes,1);assert.equal(card.querySelector("#nextRemainingTime").textContent,"30 ث");
render(model,599+59/60);assert.equal(card.querySelector("#nextRemainingTime").textContent,"1 ث");
card.querySelector(".next-edit").onclick();assert.equal(edits,1);
render(model,630);assert.equal(writes,2);assert.equal(card.querySelector(".next-class-progress").value,30);
render({total:1,next:null},660);assert.equal(writes,3);card.querySelector(".next-add").onclick();card.querySelector(".next-week").onclick();assert.equal(adds,1);assert.equal(weeks,1);
assert.match(html,/mawaeidi-next-lesson-v1/);assert.match(html,/id="nextCard"/);assert.match(html,/class="kufi-quote"/);
let fakeNow=new Date("2026-11-26T09:59:00Z"),headerCalls=0,tickCalls=0,lastState=null;
const clock=new Function("Date","document","currentSection","currentView","currentUser","cloudReady","currentDateKey","currentTimeKey","mins","datedOccurrencesForDate","filtered","dailyOverviewModel","renderHeader","renderDailyDashboard","render","updateNextLessonClock", "let dailyOverviewDate='2026-11-26',dailyOverviewMinute='09:59',dailyOverviewNext={start:600,end:660};\n"+extract("nextLessonCardState")+"\n"+extract("refreshDailyOverviewClock")+"\nreturn refreshDailyOverviewClock")(
  function(){return fakeNow},{visibilityState:"visible",getElementById:id=>id==="nextCard"?card:null},"schedule","week",{},true,
  d=>d.toISOString().slice(0,10),d=>d.toISOString().slice(11,16),t=>Number(t.slice(0,2))*60+Number(t.slice(3)),()=>[],()=>[],()=>model,()=>headerCalls++,()=>{},()=>{},(_card,s)=>{tickCalls++;lastState=s});
fakeNow=new Date("2026-11-26T09:59:30Z");clock();assert.equal(tickCalls,1);assert.equal(lastState.remaining,0.5);
fakeNow=new Date("2026-11-26T10:00:00Z");clock();assert.equal(headerCalls,1);
fakeNow=new Date("2026-11-26T11:00:00Z");clock();assert.equal(headerCalls,2);
assert.match(app,/setInterval\(refreshDailyOverviewClock,1000\)/);
assert.match(app,/window\.addEventListener\("pageshow",refreshDailyOverviewClock\)/);
console.log("Next lesson card countdown, week view timer, resume, ongoing progress, stable DOM and actions passed.");

const calendar=new Function("occurrenceIsInactive",extract("monthCalendarModel")+"\nreturn monthCalendarModel")(o=>o.cancelled);
const feb=calendar("2028-02-01","2028-02-03",d=>d.endsWith("-03")?[{lesson:{duration:45}},{lesson:{duration:30},cancelled:true}]:[]);
assert.equal(feb.cells.filter(Boolean).length,29);
assert.equal(feb.total,1);assert.equal(feb.minutes,45);assert.equal(feb.freeDays,28);
assert.equal(feb.cells.find(x=>x?.today).key,"2028-02-03");
assert.equal(feb.cells.length%7,0);assert.equal(feb.cells[0],null);
const reminderModel=new Function("addDaysToDateKey","occurrenceIsInactive","occurrenceRawStatus","wallTimeToInstant","SCHEDULE_TIMEZONE","normalizeNotificationLeads","DEFAULT_NOTIFICATION_LEAD",extract("reminderCenterModel")+"\nreturn reminderCenterModel")(
  (d,n)=>new Date(Date.parse(d+"T00:00:00Z")+n*86400000).toISOString().slice(0,10),
  o=>o.cancelled,o=>o.status||"default",(d,t)=>new Date(d+"T"+t+":00Z"),"UTC",a=>a,15);
const sample=(time,name,duration,mode="off",extra={})=>({time,lesson:{name,duration,reminderMode:mode,reminderLeads:[30]},...extra});
const rm=reminderModel(Date.parse("2026-11-27T09:50:00Z"),"2026-11-27",d=>d==="2026-11-27"?[
  sample("09:00","Long",180),sample("10:00","B",10,"custom"),sample("10:30","C",15),sample("12:05","D",30),sample("13:00","E",30,"default",{cancelled:true}),sample("14:00","F",30,"default")
]:[],[60,15]);
assert.equal(rm.alerts.length,2);assert.equal(rm.tight.length,3);assert.equal(rm.tight[0].gap,-120);assert.equal(rm.tight[1].gap,-90);assert.equal(rm.tight[2].gap,5);
assert.match(html,/aria-controls="monthView"/);assert.match(html,/month-legend/);assert.match(html,/openReminderCenter\(\)/);
console.log("Monthly calendar and reminder center: leap year, cancellation, ongoing and nested overlap, reminder modes passed.");
