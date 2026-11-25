const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
function fixture(mode){
  const events=[],parts=[];
  const mobile={
    beginBackupSave:async args=>{events.push(["begin",args]);return mode==="cancel"?{saved:false}:{token:"fixture-token"}},
    writeBackupChunk:async ({token,offset,data})=>{
      assert.equal(token,"fixture-token");
      assert.equal(offset,parts.reduce((n,p)=>n+p.length,0));
      const bytes=Buffer.from(data,"base64");
      assert.ok(bytes.length<=256*1024);
      events.push(["write",offset]);
      if(mode==="failure")throw Error("write failed");
      parts.push(bytes);
    },
    finishBackupSave:async ({token})=>{assert.equal(token,"fixture-token");events.push(["finish"]);return {saved:mode!=="incomplete"}},
    abortBackupSave:async ({token})=>{assert.equal(token,"fixture-token");events.push(["abort"])}
  };
  const window={Capacitor:{getPlatform:()=>"android",isNativePlatform:()=>true,Plugins:{MawaeidiMobile:mobile}},setTimeout(){}};
  const document={documentElement:{classList:{add(){}},dataset:{}},body:{classList:{add(){}}},addEventListener(){},querySelector(){return null}};
  vm.runInNewContext(read("native-bridge.js"),{window,document,Blob,Uint8Array,btoa:s=>Buffer.from(s,"binary").toString("base64"),console});
  return {api:window.MawaeidiNative,events,parts};
}
(async()=>{
  const bytes=Buffer.alloc(600000);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
  const file={filename:"mawaeidi-full-backup-2026-11-25T12-00-00.mwb",blob:new Blob([bytes])};
  const good=fixture("success");
  assert.equal((await good.api.saveBackupFile(file)).saved,true);
  assert.deepEqual(Buffer.concat(good.parts),bytes);
  assert.equal(good.events.filter(e=>e[0]==="write").length,3);
  assert.equal(good.events.at(-1)[0],"finish");
  const cancelled=fixture("cancel");
  assert.equal((await cancelled.api.saveBackupFile(file)).saved,false);
  assert.equal(cancelled.events.length,1);
  for(const mode of ["failure","incomplete"]){
    const f=fixture(mode);
    await assert.rejects(()=>f.api.saveBackupFile(file));
    assert.equal(f.events.at(-1)[0],"abort");
  }
  const app=read("app-main.js"),java=read("android/app/src/main/java/com/abdelmalek/mawaeidi/MawaeidiMobilePlugin.java");
  const save=app.slice(app.indexOf("async function createAndDownloadFullBackup"),app.indexOf("function requestBackupPassword"));
  assert.match(save,/await window\.MawaeidiNative\.saveBackupFile/);
  assert.match(save,/if\(saved\?\.saved!==true\)throw new Error\("backup_cancelled"\)/);
  const restore=app.slice(app.indexOf("async function confirmBackupRestore"),app.indexOf("function hasRecoveryMarker"));
  assert.ok(restore.indexOf('await createAndDownloadFullBackup("mawaeidi-before-restore",password)')<restore.indexOf("studentResult=await studentsWorkspace.restoreBackupSnapshot"));
  assert.match(java,/backupWritten != backupExpected/);
  assert.match(java,/backupOutput\.flush\(\);\s*backupOutput\.close\(\);/);
  assert.match(java,/Intent\.ACTION_CREATE_DOCUMENT/);
  assert.match(java,/backupWritten \+= bytes\.length/);
  console.log("Native backup chunk transfer, cancellation, failure, exact size and restore guard passed.");
})().catch(e=>{console.error(e);process.exitCode=1});
