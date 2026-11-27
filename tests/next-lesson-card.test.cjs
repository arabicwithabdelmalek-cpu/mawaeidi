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
