"use strict";
const assert=require("node:assert/strict");
global.window=global;
require("../backup-manager.js");
const api=global.MawaeidiBackup;
class OversizedBlob extends Blob{
  constructor(bytes){super([]);this.reportedSize=bytes;this.reads=0}
  get size(){return this.reportedSize}
  async arrayBuffer(){this.reads++;throw Error("oversized blob must not be read")}
}
(async()=>{
  const huge=new OversizedBlob(api.limits.maxArchiveBytes+1);
  await assert.rejects(()=>api.readZip(huge),e=>e.code==="archive_too_large");assert.equal(huge.reads,0);
  const hugeEntry=new OversizedBlob(api.limits.maxEntryBytes+1);
  await assert.rejects(()=>api.createZip([{name:"photo.webp",data:hugeEntry}]),e=>e.code==="entry_too_large");assert.equal(hugeEntry.reads,0);
  const files=[{name:"manifest.json",data:"{}"},{name:"صور/طالب.webp",data:new Uint8Array([1,2,3])}];
  const blob=await api.createZip(files);
  const expected=22+files.reduce((sum,f)=>sum+76+2*Buffer.byteLength(f.name)+(typeof f.data==="string"?Buffer.byteLength(f.data):f.data.byteLength),0);
  assert.equal(blob.size,expected);
  const decoded=await api.readZip(blob);assert.deepEqual([...decoded.keys()],files.map(f=>f.name));
  assert.deepEqual([...decoded.get("صور/طالب.webp")],[1,2,3]);
  console.log("ZIP size checks reject oversized blobs before reading and preserve archive format.");
})().catch(e=>{console.error(e);process.exitCode=1});
