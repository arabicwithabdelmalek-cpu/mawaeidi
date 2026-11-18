"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app-main.js"),"utf8");
const moduleJs=fs.readFileSync(path.join(root,"schedule-concurrency.js"),"utf8");
const draftDownload=app.split("\n").find(line=>line.includes('fullBackupFilename("mawaeidi-unsaved-schedule")'));
assert.ok(draftDownload,"Conflict dialog must offer a draft download");
const filenameExpression=draftDownload.match(/fullBackupFilename\("mawaeidi-unsaved-schedule"\)\.replace\(\/.*?\/,"\.json"\)/);
assert.ok(filenameExpression,"Unsaved schedule filename must explicitly replace .zip with .json");
const makeDraftName=new Function("fullBackupFilename","return "+filenameExpression[0]+";");
assert.equal(makeDraftName(()=>"mawaeidi-unsaved-schedule-2026.zip"),
  "mawaeidi-unsaved-schedule-2026.json");

const sandbox={window:{}};
vm.runInNewContext(moduleJs,sandbox);
const api=sandbox.window.MawaeidiScheduleSync;
const start=app.indexOf("async function persist(silent=false){");
const stop=app.indexOf("function getOccurrences(",start);
assert.ok(start>=0&&stop>start);
const source=app.slice(start,stop);
const build=new Function("deps",[
  "let cloud=deps.cloud;",
  "let currentUser={id:'test-user'};",
  "let cloudReady=true,sessionSequence=1,saveInFlight=false;",
  "let lessons=deps.lessons;",
  "let lastCloudLessons=deps.expected;",
  "let lastCloudUpdatedAt=deps.updatedAt??null;",
  "let pendingScheduleConflict=null;",
  "const window={MawaeidiScheduleSync:deps.api};",
  "const alert=msg=>deps.alerts.push(msg);",
  "const console={error:()=>{}};",
  "const cloneBackupValue=value=>JSON.parse(JSON.stringify(value));",
  "const setSync=(state,message)=>deps.sync.push([state,message]);",
  "const showScheduleConflict=()=>{deps.conflicts++};",
  source,
  "return {persist,getState:()=>({lessons,lastCloudLessons,lastCloudUpdatedAt,pendingScheduleConflict,saveInFlight})};"
].join("\n"));
function setup(opts){
 const deps={
   api,expected:opts.expected,lessons:opts.lessons,cloud:opts.cloud,
   alerts:[],sync:[],conflicts:0
 };
 return {deps,model:build(deps)};
}
async function main(){
 const base=[{id:"first",name:"الأولى"}];
 const edit=[...base,{id:"second",name:"الثانية"}];
 const saved=setup({expected:base,lessons:edit,cloud:{
   async rpc(){return {data:{status:"saved",updated_at:"2026-11-18T12:00:00.000001Z"},error:null}}
 }});
 assert.equal(await saved.model.persist(),true);
 assert.equal(JSON.stringify(saved.model.getState().lastCloudLessons),JSON.stringify(edit));
 assert.equal(saved.model.getState().lastCloudUpdatedAt,"2026-11-18T12:00:00.000001Z");

 const remote=[...base,{id:"remote",name:"من جهاز آخر"}];
 let requests=0;
 const conflict=setup({expected:base,lessons:edit,cloud:{
   async rpc(){requests++;return {data:{
     status:"conflict",current_lessons:remote,updated_at:"2026-11-18T12:00:00Z"},error:null}}
 }});
 assert.equal(await conflict.model.persist(),false);
 const state=conflict.model.getState();
 assert.equal(JSON.stringify(state.lastCloudLessons),JSON.stringify(base),
   "Conflict must not accept a stale baseline as the new server state");
 assert.equal(JSON.stringify(state.lessons),JSON.stringify(edit),
   "Local candidate must remain untouched by persist");
 assert.equal(JSON.stringify(state.pendingScheduleConflict.draft),JSON.stringify(edit),
   "A downloadable copy of the user's rejected write must be retained");
 assert.equal(state.pendingScheduleConflict.downloaded,false);
 assert.equal(conflict.deps.conflicts,1);
 assert.equal(await conflict.model.persist(),false);
 assert.equal(requests,1,"Unresolved conflict must lock subsequent save attempts");

 let release;
 const first=setup({expected:base,lessons:edit,cloud:{
   rpc(){return new Promise(resolve=>{release=resolve})}
 }});
 const one=first.model.persist();
 assert.equal(await first.model.persist(),false,"Overlapping browser saves must not run");
 assert.equal(first.deps.alerts.length,1);
 release({data:{status:"saved",updated_at:"2026-11-18T12:00:01Z"},error:null});
 assert.equal(await one,true);
 assert.equal(first.model.getState().saveInFlight,false);

 const missing=setup({expected:base,lessons:edit,cloud:{
   async rpc(){return {data:null,error:{code:"PGRST202",message:"function missing"}}}
 }});
 assert.equal(await missing.model.persist(),false);
 assert.equal(JSON.stringify(missing.model.getState().lastCloudLessons),JSON.stringify(base));
 assert.ok(missing.deps.sync.some(([state,label])=>state==="error"&&label.includes("غير مفعّلة")));
 assert.ok(missing.deps.alerts.length===1);
 console.log("Schedule browser persist success, conflict, reentrancy and RPC-missing tests passed");
}
main().catch(e=>{console.error(e);process.exitCode=1});
