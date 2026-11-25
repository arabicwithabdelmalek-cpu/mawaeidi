const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const hash="a".repeat(64);
const old=new Map(), secure=new Map();
let installs=[], requests=0, failRead=false, failWrite=false;
const storage={getItem:k=>old.get(k)??null,setItem:(k,v)=>old.set(k,v),removeItem:k=>old.delete(k)};
const releases=[
  {tag_name:"v2.0.0-beta.11",draft:true,assets:[]},
  {tag_name:"v2.0.0-beta.10",draft:false,body:"New release",assets:[{name:"Mawaeidi-2.0.0-beta.10.apk",digest:"sha256:"+hash,browser_download_url:"https://github.com/arabicwithabdelmalek-cpu/mawaeidi/releases/download/v2.0.0-beta.10/Mawaeidi-2.0.0-beta.10.apk"}]},
  {tag_name:"v2.1.0",assets:[{name:"Mawaeidi-2.1.0.apk",digest:"sha256:"+hash,browser_download_url:"https://evil.example/Mawaeidi-2.1.0.apk"}]},
  {tag_name:"v3.0.0",assets:[{name:"Mawaeidi-3.0.0.apk",browser_download_url:"https://github.com/arabicwithabdelmalek-cpu/mawaeidi/releases/download/v3.0.0/Mawaeidi-3.0.0.apk"}]}
];
const window={Capacitor:{getPlatform:()=>"android",isNativePlatform:()=>true,Plugins:{
  MawaeidiAlarm:{getAppInfo:async()=>({versionName:"2.0.0-beta.9"})},
  MawaeidiMobile:{
    getAuthItem:async({key})=>{if(failRead)throw Error("read failed");return {value:secure.get(key)}},
    setAuthItem:async({key,value})=>{if(failWrite)throw Error("write failed");secure.set(key,value)},
    removeAuthItem:async({key})=>secure.delete(key),
    installUpdate:async payload=>{installs.push(payload);return {installerOpened:true}}
  }
}},setTimeout:()=>{}};
const document={documentElement:{classList:{add(){}},dataset:{}},body:{classList:{add(){}}},addEventListener(){},querySelector(){return null}};
vm.runInNewContext(read("native-bridge.js"),{window,document,localStorage:storage,URL,console,fetch:async()=>{requests++;return {ok:true,json:async()=>releases}}});
(async()=>{
  const api=window.MawaeidiNative,key="sb-project-auth-token";
  old.set(key,"previous-session");
  assert.equal(await api.authStorage.getItem(key),"previous-session");
  assert.equal(old.has(key),false);
  assert.equal(secure.get(key),"previous-session");
  await api.authStorage.setItem(key,"rotated-session");
  assert.equal(await api.authStorage.getItem(key),"rotated-session");
  await api.authStorage.removeItem(key);
  assert.equal(await api.authStorage.getItem(key),null);
  old.set(key,"legacy");
  failWrite=true;
  await assert.rejects(api.authStorage.getItem(key));
  assert.equal(old.get(key),"legacy","Failed migration must not discard the session");
  failWrite=false;failRead=true;
  await assert.rejects(api.authStorage.getItem(key));
  assert.equal(old.get(key),"legacy");
  failRead=false;
  const update=await api.checkForUpdates({force:true,render:false});
  assert.equal(update.latestVersion,"2.0.0-beta.10");
  assert.equal(update.sha256,hash);
  await api.openUpdate(update);
  assert.equal(installs.length,1);
  assert.equal(installs[0].sha256,hash);
  await assert.rejects(api.openUpdate({...update,downloadUrl:"https://evil.example/file.apk"}));
  await assert.rejects(api.openUpdate({...update,sha256:""}));
  const cached=await api.checkForUpdates({render:false});
  assert.equal(cached.latestVersion,update.latestVersion);
  assert.equal(requests,1);
  const app=read("app-main.js");
  assert.match(app,/persistSession:true,autoRefreshToken:true/);
  assert.match(app,/restoreNativeSession/);
  const java=read("android/app/src/main/java/com/abdelmalek/mawaeidi/MawaeidiMobilePlugin.java");
  for(const value of ["AndroidKeyStore","AES/GCM/NoPadding","SHA-256","verifyPackage","canRequestPackageInstalls","wrong_signature","not_newer","MAX_APK_BYTES"])assert.ok(java.includes(value),value);
  assert.match(read("android/app/src/main/AndroidManifest.xml"),/REQUEST_INSTALL_PACKAGES/);
  assert.match(read("android/app/src/main/java/com/abdelmalek/mawaeidi/MainActivity.java"),/registerPlugin\(MawaeidiMobilePlugin.class\)/);
  console.log("Native session migration and update selection checks passed.");
})().catch(error=>{console.error(error);process.exitCode=1;});
