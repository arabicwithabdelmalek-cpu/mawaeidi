const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
global.window=global;
require(path.join(root,"backup-manager.js"));

async function main(){
  const api=global.MawaeidiBackup;
  assert(api,"Backup manager was not installed.");

  const zip=await api.createZip([
    {name:"manifest.json",data:JSON.stringify({format:"mawaeidi-full-backup",version:1})},
    {name:"schedule.json",data:JSON.stringify({lessons:[{id:"lesson-a"}]})},
    {name:"photos/students/student-a.webp",data:new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])}
  ]);
  const bytes=new Uint8Array(await zip.arrayBuffer());
  const entries=await api.readZip(bytes);
  assert.deepEqual([...entries.keys()],[
    "manifest.json",
    "schedule.json",
    "photos/students/student-a.webp"
  ]);
  assert.equal(api.readJson(entries,"manifest.json").format,"mawaeidi-full-backup");

  const marker=new TextEncoder().encode("mawaeidi-full-backup");
  const broken=bytes.slice();
  let found=-1;
  outer:for(let index=0;index<=broken.length-marker.length;index++){
    for(let offset=0;offset<marker.length;offset++)if(broken[index+offset]!==marker[offset])continue outer;
    found=index;
    break;
  }
  assert.notEqual(found,-1);
  broken[found]^=1;
  await assert.rejects(()=>api.readZip(broken),error=>error?.code==="crc_mismatch");
  await assert.rejects(()=>api.createZip([{name:"../secret.txt",data:"x"}]),error=>error?.code==="unsafe_path");

  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const students=fs.readFileSync(path.join(root,"students/student-registry.js"),"utf8");
  const worker=fs.readFileSync(path.join(root,"sw.js"),"utf8");
  assert.match(html,/تنزيل نسخة احتياطية كاملة/);
  assert.match(html,/دمج البيانات دون حذف الموجود/);
  assert.match(html,/backup-manager\.js\?v=1/);
  assert.match(html,/student-registry\.js\?v=7/);
  assert.doesNotMatch(html,/id="backupStudents"/);
  assert.match(students,/createBackupSnapshot/);
  assert.match(students,/inspectBackupSnapshot/);
  assert.match(students,/restoreBackupSnapshot/);
  assert.doesNotMatch(students,/exportStudentsBackup/);
  assert.match(worker,/mawaeidi-shell-v47/);
  assert.match(worker,/backup-manager\.js\?v=1/);

  console.log("Full backup and restore checks passed.");
}
main().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
