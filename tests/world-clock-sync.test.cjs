"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/20261028170000_world_clock_account_sync.sql"),"utf8");
const fix=fs.readFileSync(path.join(root,"supabase/migrations/20261028170500_world_clock_restore_privileges.sql"),"utf8");

for(const pattern of [
 /const WORLD_CLOCK_SETTINGS_TABLE="mawaeidi_world_clock_settings"/,
 /function legacyWorldClockSnapshot\(\)/,
 /function savedWorldClockBase\(\)/,
 /function savedWorldClockZones\(\)/,
 /function setWorldClockServerRow\(row,userId\)/,
 /function resetWorldClockSync\(\)/,
 /async function initializeWorldClockForUser\(user,sequence\)/,
 /async function refreshWorldClockFromCloud\(\)/,
 /async function mutateWorldClock\(action,zone=null,extra=\{\}\)/,
 /await mutateWorldClock\("remove",zone\)/,
 /await mutateWorldClock\("base",result.entry.zone\)/,
 /await mutateWorldClock\("add",result.entry.zone\)/,
 /await mutateWorldClock\("restore",null,\{p_trash_id:item.recordId\}\)/,
 /await mutateWorldClock\("merge",null,/,
 /await applyBackupSettings\(plan.settings\)/,
 /clock_sync_required_for_backup/,
 /event:"\*",schema:"public",table:WORLD_CLOCK_SETTINGS_TABLE/,
 /resetWorldClockSync\(\)/,
 /world-clock-cloud-style/,
 /world-cloud-note/,
]) assert.match(html,pattern);

assert.doesNotMatch(html,/function rememberWorldClockBase/);
assert.doesNotMatch(html,/function rememberWorldClockZones/);
assert.match(sw,/mawaeidi-shell-v48/);
assert.match(migration,/mawaeidi_world_clock_settings/);
assert.match(migration,/enable row level security/);
assert.match(migration,/world_clock_select_own/);
assert.match(migration,/world_clock_insert_own/);
assert.match(migration,/world_clock_update_own/);
assert.match(migration,/mawaeidi_world_clock_initialize/);
assert.match(migration,/mawaeidi_world_clock_change/);
assert.match(migration,/for update/);
assert.match(migration,/supabase_realtime/);
assert.match(migration,/security invoker/);
assert.match(fix,/returning \* into archived/);

// Exercise account-aware read helpers with the code shipped to browsers.
const start=html.indexOf("function legacyWorldClockSnapshot(){");
const stop=html.indexOf("function worldClockState(hour){",start);
assert.ok(start>0&&stop>start);
const code=html.slice(start,stop);
const local=new Map();
const currentUser={id:"alice"};
const getHelpers=new Function("store","owner",`
 const localStorage={getItem:key=>store.has(key)?store.get(key):null};
 const WORLD_CLOCK_BASE_KEY="base",WORLD_CLOCK_ZONES_KEY="zones";
 const WORLD_CLOCK_LEGACY_OWNER_KEY="owner";
 const WORLD_CLOCK_SETTINGS_TABLE="clock";
 const SCHEDULE_TIMEZONE="Africa/Cairo";
 const validTimeZone=zone=>["Africa/Cairo","Asia/Baku","Europe/Vilnius","Asia/Riyadh"].includes(zone);
 const textValue=x=>typeof x==="string"?x:"";
 let currentUser=owner,worldClockSettings=null,worldClockLoadSequence=0,worldClockBusy=false;
 const cloudReady=true,cloud=null,sessionSequence=0,currentSection="schedule";
 const document={getElementById:()=>({hidden:true})};
 const openWorldClock=()=>{};
 ${code}
 return {legacyWorldClockSnapshot,savedWorldClockBase,savedWorldClockZones,setWorldClockServerRow,resetWorldClockSync};
`);
const api=getHelpers(local,currentUser);
assert.equal(api.legacyWorldClockSnapshot(),null);
local.set("base","Europe/Vilnius");
local.set("zones",JSON.stringify(["Asia/Baku","Europe/Vilnius","Asia/Baku"]));
assert.deepEqual(api.legacyWorldClockSnapshot(),{base:"Europe/Vilnius",zones:["Asia/Baku"]});
assert.equal(api.savedWorldClockBase(),"Africa/Cairo","Cloud settings must not be replaced by shared legacy storage");
assert.deepEqual(api.savedWorldClockZones(),["Africa/Cairo","Asia/Baku"]);
assert.equal(api.setWorldClockServerRow({base_zone:"Europe/Vilnius",zones:["Asia/Riyadh"],version:2},"alice"),true);
assert.deepEqual(api.savedWorldClockZones(),["Europe/Vilnius","Asia/Riyadh"]);
assert.equal(api.setWorldClockServerRow({base_zone:"Africa/Cairo",zones:["Asia/Baku"],version:1},"alice"),false,"Older browser state must not replace newer");
assert.equal(api.setWorldClockServerRow({base_zone:"Africa/Cairo",zones:["Asia/Baku"],version:4},"bob"),false,"Another user's update must be ignored");
api.resetWorldClockSync();
assert.equal(api.savedWorldClockBase(),"Africa/Cairo","Logout must clear the previous user's clock");
assert.doesNotThrow(()=>new Function(html.slice(html.indexOf("<script>\nconst days=")+8,html.indexOf("</script>",html.indexOf("<script>\nconst days=")))));
console.log("World clock account sync and migration checks passed");
