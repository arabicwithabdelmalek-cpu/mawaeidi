import {readFile,stat} from "node:fs/promises";
import {resolve,relative,isAbsolute,sep} from "node:path";
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";

export function validateManifest(manifest){
  if(manifest?.version!==1||!Array.isArray(manifest.shared)||!manifest.shared.length||!Array.isArray(manifest.platformSpecific))throw Error("Invalid shared platform manifest");
  const all=[...manifest.shared,...manifest.platformSpecific];
  if(new Set(all).size!==all.length)throw Error("Duplicate or overlapping platform path");
  for(const name of all)if(typeof name!=="string"||!name||isAbsolute(name)||name.includes("\\")||!name.split("/").every(x=>x&&x!=="."&&x!==".."&&/^[A-Za-z0-9_.-]+$/.test(x)))throw Error("Invalid platform path");
}
async function fingerprint(root,name){
  const target=resolve(root,name),rel=relative(resolve(root),target);
  if(rel.startsWith(".."+sep)||isAbsolute(rel))throw Error("Path outside root");
  try{
    if(!(await stat(target)).isFile())return null;
    return createHash("sha256").update(await readFile(target)).digest("hex");
  }catch(e){if(e.code==="ENOENT"||e.code==="ENOTDIR")return null;throw e}
}
export async function compareShared(webRoot,androidRoot,manifest){
  validateManifest(manifest);
  const rows=[];
  for(const path of manifest.shared){
    const [web,android]=await Promise.all([fingerprint(webRoot,path),fingerprint(androidRoot,path)]);
    const status=!web||!android?"missing":web===android?"identical":"different";
    rows.push({path,status,webPresent:Boolean(web),androidPresent:Boolean(android)});
  }
  return rows;
}
async function main(){
  const [webRoot,androidRoot,...flags]=process.argv.slice(2);
  if(!webRoot||!androidRoot||flags.some(x=>x!=="--strict"))throw Error("Usage: node scripts/check-shared-platform-files.mjs WEB_ROOT ANDROID_ROOT [--strict]");
  const manifest=JSON.parse(await readFile(resolve(webRoot,"config/shared-platform-files.json"),"utf8"));
  const rows=await compareShared(webRoot,androidRoot,manifest);
  for(const row of rows){
    if(row.status==="identical")console.log("OK "+row.path);
    else console.log("::warning::Shared platform file "+row.path+" is "+row.status+" (web="+row.webPresent+", android="+row.androidPresent+")");
  }
  const drift=rows.filter(x=>x.status!=="identical").length;
  console.log((rows.length-drift)+"/"+rows.length+" shared files identical; "+drift+" require review.");
  if(drift&&flags.includes("--strict"))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1});
