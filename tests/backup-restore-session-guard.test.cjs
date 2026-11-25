"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../app-main.js"),"utf8");
const start=app.indexOf("async function confirmBackupRestore(){"),end=app.indexOf("\n}",start)+2;
assert.ok(start>=0&&end>start);
const build=new Function("deps",[
'let currentUser={id:"a"},sessionSequence=1,cloudReady=true,backupInFlight=false,lessons=["a"],pendingBackupRestorePlan=deps.plan;',
'const document={getElementById:()=>null,querySelector:()=>null};',
'const scheduleWriteAllowed=()=>true,setSync=(...a)=>deps.status.push(a),requestBackupPassword=async()=>"fixture",createAndDownloadFullBackup=async()=>{},confirm=()=>true;',
'const studentsWorkspace={restoreBackupSnapshot:deps.students};',
'const mergeBackupLessons=()=>({lessons:["merged"],added:1,updated:0}),persist=deps.persist,applyBackupSettings=async()=>{deps.settings++},mergeTrashBackupRows=async()=>0;',
'const render=()=>{},closeToolDialog=()=>{},alert=m=>deps.alerts.push(m),console={error(){}};',
app.slice(start,end),
'return {run:confirmBackupRestore,changeAccount:()=>{currentUser={id:"b"};sessionSequence++;lessons=["b"]},lessons:()=>lessons};'
].join("\n"));
function setup(plan){const deps={plan:{owner:"a",sequence:1,...plan},status:[],alerts:[],settings:0,students:async()=>({}),persist:async()=>true};return {deps,make:()=>build(deps)}}
(async()=>{
let {deps,make}=setup({studentPlan:{},settings:{}});deps.students=async()=>{throw Error("uncertain student write")};let x=make();await x.run();assert.match(deps.alerts.at(-1),/ربما حُفظ جزء/);assert.equal(deps.settings,0);
({deps,make}=setup({scheduleLessons:[],settings:{}}));let resolve;deps.persist=()=>new Promise(r=>resolve=r);x=make();let pending=x.run();for(let i=0;i<8;i++)await Promise.resolve();assert.equal(typeof resolve,"function");x.changeAccount();resolve(false);await pending;assert.deepEqual(x.lessons(),["b"]);assert.equal(deps.settings,0);assert.equal(deps.alerts.length,0);
console.log("Restore failure messaging and account isolation passed.");
})().catch(e=>{console.error(e);process.exitCode=1});
