"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../app-main.js"),"utf8");
function extract(n){const m=app.match(new RegExp("^(?:async )?function "+n+"\\(","m"));assert.ok(m,n);return app.slice(m.index,app.indexOf("\n}",m.index)+2)}
const build=new Function("deps",[
'let currentUser={id:"alice"},cloudReady=true,sessionSequence=1,currentSection="schedule",refreshInFlight=false,saveInFlight=false,backupInFlight=false,pendingScheduleConflict=null,pendingRemoteRow=null,drawer=false,lastCloudUpdatedAt="2026-11-26T00:00:00Z";',
'const textValue=x=>typeof x==="string"?x:"",navigator={onLine:true};',
'const cloud={from(){return {select(){return {eq(k,id){return {maybeSingle(){return deps.read(id)}}}}}}}};',
'const setSync=(...a)=>deps.status.push(a),alert=x=>deps.alerts.push(x),console={error(){}};',
'const isDrawerVisible=()=>drawer,showScheduleConflict=()=>{},refreshWorldClockFromCloud=()=>{},studentsWorkspace={refresh(){}};',
'const applyRemoteRow=(r)=>{deps.applied.push(r);lastCloudUpdatedAt=r.updated_at;return true};',
extract("remoteRowIsNewer"),extract("handleRemoteRow"),extract("refreshFromCloud"),
'return {refreshFromCloud,handleRemoteRow,drawer:v=>{drawer=v},switchUser:()=>{currentUser={id:"bob"};sessionSequence++},saving:v=>{saveInFlight=v},queued:()=>pendingRemoteRow};'
].join("\n"));
function setup(){const pending=[],deps={status:[],alerts:[],applied:[],read(id){return new Promise((resolve,reject)=>pending.push({id,resolve,reject}))}};return {x:build(deps),deps,pending}}
const row=(minute,id="alice")=>({user_id:id,lessons:[],updated_at:"2026-11-26T00:"+minute+":00Z"});
(async()=>{
let {x,deps,pending}=setup();let p=x.refreshFromCloud();x.drawer(true);x.handleRemoteRow(row("03"));pending[0].resolve({data:row("02")});assert.equal(await p,true);assert.equal(deps.applied.length,0);assert.equal(x.queued().updated_at,row("03").updated_at);
({x,deps,pending}=setup());p=x.refreshFromCloud();x.drawer(true);pending[0].resolve({data:row("02")});assert.equal(await p,true);assert.equal(x.queued().updated_at,row("02").updated_at);assert.equal(deps.applied.length,0);
({x,deps,pending}=setup());p=x.refreshFromCloud();x.switchUser();const count=deps.status.length;pending[0].resolve({data:row("02")});assert.equal(await p,false);assert.equal(deps.status.length,count);assert.equal(deps.applied.length,0);
({x,deps,pending}=setup());p=x.refreshFromCloud();x.saving(true);pending[0].resolve({data:row("02")});assert.equal(await p,false);assert.equal(deps.applied.length,0);
({x,deps,pending}=setup());p=x.refreshFromCloud();pending[0].resolve({data:row("02")});assert.equal(await p,true);assert.equal(deps.applied.length,1);
console.log("Schedule refresh guards: editing, pending rows, account switch and concurrent saves passed.");
})().catch(e=>{console.error(e);process.exitCode=1});
