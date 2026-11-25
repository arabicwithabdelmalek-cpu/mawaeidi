const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const app=read("app-main.js");
const start=app.indexOf("async function downloadScheduleConflictDraft(){"),stop=app.indexOf("async function reloadScheduleAfterConflict(){",start);
assert.ok(start>=0&&stop>start);
const model=new Function("result",`
let pendingScheduleConflict={userId:"synthetic",draft:[{id:"test"}],downloaded:false};
const currentUser={id:"synthetic"};
const elements={"scheduleConflictDownload":{disabled:false},"scheduleConflictRefresh":{disabled:true},"scheduleConflictHint":{}};
const document={getElementById:id=>elements[id]};
const cloneBackupValue=x=>JSON.parse(JSON.stringify(x));
const fullBackupFilename=()=> "mawaeidi-unsaved-schedule-2026-11-25T12-00-00.zip";
const window={MawaeidiNative:{isNative:true,platform:"android",saveScheduleDraft:async data=>{if(!data.filename.endsWith(".json"))throw Error("filename");return result;}}};
const alert=()=>{};
`+app.slice(start,stop)+`
return {downloadScheduleConflictDraft,get:()=>({pending:pendingScheduleConflict,button:elements.scheduleConflictRefresh})};`);
(async()=>{
for(const saved of [false,true]){
 const m=model({saved});
 await m.downloadScheduleConflictDraft();
 assert.equal(m.get().pending.downloaded,saved);
 assert.equal(m.get().button.disabled,!saved);
}
assert.match(read("scripts/prepare-mobile.mjs"),/"schedule-concurrency\.js"/);
assert.match(read("index.html"),/schedule-concurrency\.js\?v=1/);
assert.match(read("android/app/src/main/java/com/abdelmalek/mawaeidi/MawaeidiMobilePlugin.java"),/Intent\.ACTION_CREATE_DOCUMENT/);
console.log("Native draft cancellation and successful save checks passed.");
})().catch(e=>{console.error(e);process.exitCode=1});
