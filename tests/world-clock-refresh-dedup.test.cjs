"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../app-main.js"),"utf8");
function extract(n){const m=app.match(new RegExp("^(?:async )?function "+n+"\\(","m"));assert.ok(m,n);return app.slice(m.index,app.indexOf("\n}",m.index)+2)}
const build=new Function("deps",[
 'let currentUser={id:"alice"},cloudReady=true,worldClockBusy=false,worldClockLoadSequence=1,worldClockRefreshRequest=null;',
 'let currentSection="world",backupInFlight=false,lastAutoRefreshAt=0,pendingScheduleConflict=false;',
 'const AUTO_REFRESH_THROTTLE_MS=15000,WORLD_CLOCK_SETTINGS_TABLE="clock";',
 'const document={visibilityState:"visible"},navigator={onLine:true},Date={now:()=>deps.now};',
 'const console={warn:()=>{deps.warnings++}};',
 'const cloud={from(table){return {select(){return {eq(key,id){return {maybeSingle(){return deps.read(id)}}}}}}}};',
 'const setWorldClockServerRow=(row,user)=>{deps.applied.push({row,user});return true};',
 'const refreshFromCloud=()=>{deps.routeCalls++;if(pendingScheduleConflict)return Promise.resolve(false);return currentSection==="world"?refreshWorldClockFromCloud():Promise.resolve(true)};',
 extract("refreshWorldClockFromCloud"),extract("requestAutoRefresh"),
 'return {refreshWorldClockFromCloud,requestAutoRefresh,section:v=>{currentSection=v},conflict:v=>{pendingScheduleConflict=v},online:v=>{navigator.onLine=v},switchUser:v=>{currentUser={id:v};worldClockLoadSequence++},invalidate:()=>{worldClockRefreshRequest=null},busy:v=>{worldClockBusy=v}};'
].join("\n"));
const requests=[],deps={now:20000,warnings:0,applied:[],routeCalls:0,read(id){return new Promise((resolve,reject)=>requests.push({id,resolve,reject}))}};
const x=build(deps),flush=()=>Promise.resolve();
(async()=>{
 const p=x.refreshWorldClockFromCloud(),q=x.refreshWorldClockFromCloud();
 await flush();assert.equal(requests.length,1);
 requests[0].resolve({data:{version:1},error:null});
 assert.equal(await p,true);assert.equal(await q,true);assert.equal(deps.applied.length,1);
 const old=x.refreshWorldClockFromCloud();await flush();
 x.switchUser("bob");const newer=x.refreshWorldClockFromCloud();await flush();
 assert.equal(requests[1].id,"alice");assert.equal(requests[2].id,"bob");
 requests[1].resolve({data:{version:2}});assert.equal(await old,false);
 requests[2].resolve({data:{version:1}});assert.equal(await newer,true);
 assert.equal(deps.applied.at(-1).user,"bob");
 const stale=x.refreshWorldClockFromCloud();await flush();x.invalidate();x.busy(true);
 requests[3].resolve({data:{version:2}});assert.equal(await stale,false);
 assert.equal(await x.refreshWorldClockFromCloud(),false);
 x.busy(false);const failed=x.refreshWorldClockFromCloud();await flush();requests[4].reject(Error("offline"));assert.equal(await failed,false);assert.equal(deps.warnings,1);
 x.online(false);x.requestAutoRefresh();await flush();assert.equal(deps.routeCalls,0);
 x.online(true);x.conflict(true);x.requestAutoRefresh();x.requestAutoRefresh();await flush();assert.equal(deps.routeCalls,0);assert.equal(requests.length,6);
 requests[5].resolve({data:{version:3}});await flush();await flush();await flush();
 deps.now+=16000;x.section("schedule");x.requestAutoRefresh();await flush();assert.equal(deps.routeCalls,1);assert.equal(requests.length,7);
 requests[6].resolve({data:{version:4}});await flush();
 assert.match(app,/worldClockRefreshRequest=null;\s*worldClockBusy=true;/);
 console.log("World clock refresh deduplication, account isolation, mutation invalidation, network failure and foreground routing passed.");
})().catch(e=>{console.error(e);process.exitCode=1});
