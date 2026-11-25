"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../app-main.js"),"utf8");
function extract(n){const m=app.match(new RegExp("^function "+n+"\\(","m"));assert.ok(m,n);return app.slice(m.index,app.indexOf("\n}",m.index)+2)}
const anchors=[],calls=[],days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const build=new Function("deps",[
'const days=deps.days,filtered=()=>[],selectedWeekAnchor=()=>{deps.anchors.push("anchor");return "anchor"};',
'const weekDateForDay=(day,anchor)=>{deps.calls.push([day,anchor]);return day+"-"+anchor};',
'const datedOccurrencesForDate=(date,list)=>[{date,list}];',
extract("currentWeekOccurrences"),
'return currentWeekOccurrences;'
].join("\n"));
const currentWeekOccurrences=build({anchors,calls,days});const list=[{id:"fixture"}];
assert.equal(currentWeekOccurrences(list).length,7);assert.equal(anchors.length,1);assert.equal(calls.length,7);assert.ok(calls.every(c=>c[1]==="anchor"));
const next=currentWeekOccurrences(list,"other");assert.equal(anchors.length,1);assert.equal(next[0].date,"Mon-other");assert.equal(next[0].list,list);
const render=extract("renderWeek");
assert.match(render,/dateByDay=new Map\(days\.map\(day=>\[day,weekDateForDay\(day,anchor\)\]\)\)/);
assert.match(render,/slot\.dataset\.weekDate=dateByDay\.get\(day\)/);
assert.equal((render.match(/studentTimeInline\(o\)/g)||[]).length,1);
assert.equal((render.match(/fmt\(time\)/g)||[]).length,1);
console.log("Weekly rendering reuses one anchor, per-day dates, per-row time labels and per-card student time.");
