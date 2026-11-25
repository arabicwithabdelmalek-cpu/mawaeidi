"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
require("../schedule-time.js");require("../world-clock-model.js");
const time=global.MawaeidiScheduleTime,world=global.MawaeidiWorldClockModel;
const app=fs.readFileSync(path.join(__dirname,"../app-main.js"),"utf8");
function extract(n){const i=app.indexOf("\nfunction "+n+"(")+1;assert.ok(i>0,n);return app.slice(i,app.indexOf("\n}",i)+2)}
const build=new Function("time","world",[
 'let currentUser={id:"fixture"},cloudReady=true,currentSection="world",worldClockInterval=null;',
 'let base="Africa/Cairo",zones=[base,"Asia/Baku","Asia/Kolkata"],reference=new Date("2026-01-15T12:00:00Z");',
 'let conversions=0,writes=0,ticks=0,starts=0,stops=0,callback=null;',
 'const worldTimelineRenderKeys=new WeakMap(),view={hidden:false},cards={};',
 'const makeBox=()=>({set innerHTML(v){this.html=v;writes++}});let box=makeBox();',
 'const document={visibilityState:"visible",getElementById:id=>({worldClockView:view,worldClockCards:cards,worldTimeline:box})[id]};',
 'const savedWorldClockBase=()=>base,savedWorldClockZones=()=>zones,worldTimelineReferenceInstant=()=>reference;',
 'const {dateKeyInZone,zonedParts,zoneOffsetMinutes}=time;',
 'const {timeZoneShortLabel,timeZoneEntry,worldHour12Label,worldClockState,worldOffsetText}=world;',
 'const wallTimeToInstant=(...args)=>{conversions++;return time.wallTimeToInstant(...args)};',
 'const esc=x=>String(x);',
 'const renderWorldClockCards=()=>{ticks++};',
 'const setInterval=(fn,ms)=>{assertInterval(ms);callback=fn;return ++starts};function assertInterval(ms){if(ms!==30000)throw Error("interval")}',
 'const clearInterval=()=>{stops++;callback=null};',
 extract("renderWorldTimeline"),extract("syncWorldClockTimer"),
 'return {renderWorldTimeline,syncWorldClockTimer,counts:()=>({conversions,writes,ticks,starts,stops}),html:()=>box.html,reference:v=>{reference=new Date(v)},zones:v=>{zones=v},remount:()=>{box=makeBox()},hide:v=>{document.visibilityState=v?"hidden":"visible"},section:v=>{currentSection=v},runTick:()=>callback?.(),logout:()=>{currentUser=null;cloudReady=false}};'
].join("\n"));
const x=build(time,world);
x.renderWorldTimeline();assert.equal(x.counts().conversions,24);assert.equal(x.counts().writes,1);
assert.match(x.html(),/selected/);assert.match(x.html(),/Asia\/Kolkata|الهند/);
x.renderWorldTimeline();assert.equal(x.counts().conversions,24);assert.equal(x.counts().writes,1);
x.reference("2026-01-15T12:05:00Z");x.renderWorldTimeline();assert.equal(x.counts().writes,1);
x.reference("2026-01-15T13:00:00Z");x.renderWorldTimeline();assert.equal(x.counts().conversions,48);assert.equal(x.counts().writes,2);
x.reference("2026-07-15T13:00:00Z");x.renderWorldTimeline();assert.equal(x.counts().writes,3);
x.zones(["Africa/Cairo","Asia/Baku"]);x.renderWorldTimeline();assert.equal(x.counts().writes,4);
x.remount();x.renderWorldTimeline();assert.equal(x.counts().writes,5);
x.syncWorldClockTimer();assert.equal(x.counts().starts,1);
x.syncWorldClockTimer();assert.equal(x.counts().starts,1);
x.runTick();assert.equal(x.counts().ticks,1);
x.hide(true);x.syncWorldClockTimer(true);assert.equal(x.counts().stops,1);assert.equal(x.counts().ticks,1);
x.runTick();assert.equal(x.counts().ticks,1);
x.hide(false);x.syncWorldClockTimer(true);assert.equal(x.counts().starts,2);assert.equal(x.counts().ticks,2);
x.section("schedule");x.syncWorldClockTimer();assert.equal(x.counts().stops,2);
x.section("world");x.syncWorldClockTimer();x.logout();x.syncWorldClockTimer(true);assert.equal(x.counts().stops,3);assert.equal(x.counts().ticks,2);
assert.match(app,/visibilitychange",\(\)=>\{syncWorldClockTimer\(true\);requestAutoRefresh\(\)\}/);
console.log("World clock rendering: 24 base conversions, unchanged DOM reuse, date/zone/remount invalidation and background timer suspension passed.");
