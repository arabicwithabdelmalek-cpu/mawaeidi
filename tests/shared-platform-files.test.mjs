import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {compareShared,validateManifest} from "../scripts/check-shared-platform-files.mjs";
const root=await mkdtemp(join(tmpdir(),"mawaeidi-shared-"));
try{
 const w=join(root,"web"),a=join(root,"android");
 await mkdir(w);await mkdir(a);
 for(const dir of [w,a])await writeFile(join(dir,"same.js"),"same");
 await writeFile(join(w,"different.js"),"web");
 await writeFile(join(a,"different.js"),"android");
 await writeFile(join(w,"missing.js"),"web");
 const manifest={version:1,shared:["same.js","different.js","missing.js","absent.js"],platformSpecific:["app-main.js"]};
 const rows=await compareShared(w,a,manifest);
 assert.deepEqual(rows.map(x=>x.status),["identical","different","missing","missing"]);
 assert.equal(rows[2].androidPresent,false);
 assert.equal(rows[3].webPresent,false);
 for(const invalid of ["../secret","/absolute","a\\b","a/./b"])assert.throws(()=>validateManifest({...manifest,shared:[invalid]}));
 assert.throws(()=>validateManifest({...manifest,shared:["app-main.js"]}));
 console.log("Shared platform comparison: identical, drift, missing and manifest validation passed.");
}finally{await rm(root,{recursive:true,force:true})}
