"use strict";
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../activity-tracker.js"),"utf8");
async function scenario({platform="android",version="2.0.0-beta.19",missing=false}={}){
  const writes=[],store=new Map(),events={};
  const cloud={from:table=>table==="mawaeidi_usage_sessions"?{upsert:async payload=>{writes.push({...payload});return {error:missing&&"app_version" in payload?{code:"PGRST204",message:"Could not find app_version"}:null}}}:{select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})},auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:"demo"}}}})}};
  const window={Capacitor:{getPlatform:()=>platform},MawaeidiNative:{getAppInfo:async()=>({versionName:version})},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},crypto:{randomUUID:()=>"00000000-0000-4000-8000-000000000001"},addEventListener:(k,v)=>events[k]=v,setInterval(){}};
  vm.runInNewContext(source,{cloud,window,document:{querySelector:()=>null,addEventListener(){},hidden:false,referrer:""},navigator:{userAgent:"",onLine:true},location:{protocol:"https:"},console,Date,setTimeout,clearTimeout});
  for(let i=0;i<20;i++)await Promise.resolve();
  return writes;
}
(async()=>{
 let rows=await scenario();assert.equal(rows.length,1);assert.equal(rows[0].app_version,"2.0.0-beta.19");
 rows=await scenario({missing:true});assert.equal(rows.length,2);assert.ok(!("app_version" in rows[1]));
 rows=await scenario({platform:"web"});assert.ok(!("app_version" in rows[0]));
 rows=await scenario({version:"invalid"});assert.ok(!("app_version" in rows[0]));
 console.log("Native version reporting and legacy compatibility passed.");
})().catch(e=>{console.error(e);process.exitCode=1});
