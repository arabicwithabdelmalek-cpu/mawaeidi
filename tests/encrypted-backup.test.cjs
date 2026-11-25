"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
global.window=global;
if(!global.crypto)Object.defineProperty(global,"crypto",{value:require("node:crypto").webcrypto});
require("../backup-manager.js");
const api=window.MawaeidiBackup;
async function main(){
  const password="fixture-long-passphrase-عبارة";
  const secret="fixture-secret-not-for-export";
  const zip=await api.createZip([
    {name:"manifest.json",data:JSON.stringify({format:"mawaeidi-full-backup",version:1})},
    {name:"students.json",data:JSON.stringify({password:secret})},
    {name:"photos/students/a.webp",data:new Uint8Array([1,2,3,255])}
  ]);
  const plain=Buffer.from(await zip.arrayBuffer());
  const a=await api.encryptBackup(zip,password),b=await api.encryptBackup(zip,password);
  const bytes=new Uint8Array(await a.arrayBuffer());
  const second=new Uint8Array(await b.arrayBuffer());
  assert.ok(api.isEncryptedBackup(bytes.slice(0,8)));
  assert.equal(api.isEncryptedBackup(plain),false);
  assert.equal(bytes.length,plain.length+53);
  assert.notDeepEqual(bytes.slice(9,25),second.slice(9,25),"Fresh salt");
  assert.notDeepEqual(bytes.slice(25,37),second.slice(25,37),"Fresh IV");
  assert.equal(Buffer.from(bytes).includes(Buffer.from(secret)),false);
  assert.equal(Buffer.from(bytes).includes(Buffer.from("students.json")),false);
  const decoded=await api.decryptBackup(a,password);
  assert.deepEqual(Buffer.from(await decoded.arrayBuffer()),plain);
  const entries=await api.readZip(decoded);
  assert.equal(api.readJson(entries,"students.json").password,secret);
  assert.deepEqual([...entries.get("photos/students/a.webp")],[1,2,3,255]);
  await assert.rejects(()=>api.decryptBackup(a,"wrong-password"),{code:"backup_authentication_failed"});
  const tampered=bytes.slice();tampered[tampered.length-1]^=1;
  await assert.rejects(()=>api.decryptBackup(tampered,password),{code:"backup_authentication_failed"});
  const header=bytes.slice();header[10]^=1;
  await assert.rejects(()=>api.decryptBackup(header,password),{code:"backup_authentication_failed"});
  const version=bytes.slice();version[8]=255;
  await assert.rejects(()=>api.decryptBackup(version,password),{code:"unsupported_backup_version"});
  await assert.rejects(()=>api.decryptBackup(bytes.slice(0,45),password),{code:"invalid_encrypted_backup"});
  await assert.rejects(()=>api.encryptBackup(zip,"too-short"),{code:"weak_backup_password"});
  assert.equal(api.readJson(await api.readZip(zip),"students.json").password,secret);
  const app=fs.readFileSync(path.join(__dirname,"../app-main.js"),"utf8");
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const sw=fs.readFileSync(path.join(__dirname,"../sw.js"),"utf8");
  assert.match(html,/onclick="exportBackup\(true\)"/);
  assert.match(html,/accept="\.mwb,/);
  assert.match(html,/id="backupPassphrase" type="password"/);
  assert.match(app,/await window\.MawaeidiBackup\.decryptBackup\(file,password\)/);
  assert.match(app,/createAndDownloadFullBackup\("mawaeidi-before-restore",password\)/);
  assert.match(app,/if\(password===null\).*تم إلغاء الاستعادة/);
  assert.match(app,/pendingBackupRestorePlan!==plan/);
  assert.match(app,/password===null\?result\.blob:await window\.MawaeidiBackup\.encryptBackup/);
  assert.match(app,/تم إلغاء الاستعادة/);
  assert.match(html,/backup-manager\.js\?v=2/);
  assert.match(sw,/backup-manager\.js\?v=2/);
  assert.doesNotThrow(()=>new Function(app));
  console.log("Encrypted backup round trip, randomization, wrong password, tampering and legacy compatibility passed.");
}
main().catch(e=>{console.error(e);process.exitCode=1});
