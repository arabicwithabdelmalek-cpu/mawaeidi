"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const load=file=>fs.readFileSync(path.join(root,file),"utf8");
const moduleSource=load("schedule-concurrency.js");
const app=load("app-main.js");
const html=load("index.html");
const worker=load("sw.js");
const sql=load("docs/reviews/sql/schedule-cas-proposal.sql");
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(moduleSource,sandbox);
const api=sandbox.window.MawaeidiScheduleSync;
assert.equal(api.RPC,"mawaeidi_save_schedule_if_unchanged");

async function main(){
  // This mock models the critical part of the SQL function: atomically
  // compare the saved JSON snapshot and then replace it under a row lock.
  let stored=null,updated=0;
  let pending=Promise.resolve();
  const copy=v=>v===null?null:JSON.parse(JSON.stringify(v));
  const cloud={
    rpc(name,args){
      assert.equal(name,"mawaeidi_save_schedule_if_unchanged");
      const call=async()=>{
        const equal=JSON.stringify(stored)===JSON.stringify(args.p_expected_lessons);
        if(!equal)return {data:{status:"conflict",current_lessons:copy(stored),updated_at:"revision-"+updated},error:null};
        stored=copy(args.p_lessons);updated++;
        return {data:{status:"saved",updated_at:"revision-"+updated},error:null};
      };
      const result=pending.then(call);
      pending=result.then(()=>undefined,()=>undefined);
      return result;
    }
  };
  const first=[{id:"lesson-a",name:"الحصة الأولى"}];
  const competing=[{id:"lesson-b",name:"الحصة الثانية"}];
  const results=await Promise.all([
    api.save(cloud,null,first),
    api.save(cloud,null,competing)
  ]);
  assert.equal(results.filter(x=>x.status==="saved").length,1);
  assert.equal(results.filter(x=>x.status==="conflict").length,1);
  assert.equal(stored[0].id,"lesson-a","Losing stale client must not overwrite the winner");
  const losing=results.find(x=>x.status==="conflict");
  assert.equal(JSON.stringify(losing.currentLessons),JSON.stringify(first));
  assert.equal(JSON.stringify(competing),JSON.stringify([{id:"lesson-b",name:"الحصة الثانية"}]));
  const stale=await api.save(cloud,[],competing);
  assert.equal(stale.status,"conflict");
  assert.equal(stored[0].id,"lesson-a");

  // After explicitly refreshing, a client may merge local changes deliberately.
  const merged=[...first,...competing];
  const retry=await api.save(cloud,first,merged);
  assert.equal(retry.status,"saved");
  assert.equal(stored.length,2);
  assert.equal((await api.save(cloud,first,competing)).status,"conflict");

  await assert.rejects(()=>api.save(cloud,"invalid",first),/expected_lessons_invalid/);
  await assert.rejects(()=>api.save(cloud,first,{}),/next_lessons_invalid/);
  await assert.rejects(()=>api.save({rpc:async()=>({error:{message:"missing",code:"PGRST202"}})},first,merged),
    error=>error.code==="PGRST202");

  assert.match(sql,/REVIEW-ONLY SQL/);
  assert.match(sql,/security invoker/);
  assert.match(sql,/auth\.uid\(\)/);
  assert.match(sql,/for update/);
  assert.match(sql,/current_row\.lessons is distinct from p_expected_lessons/);
  assert.match(sql,/on conflict \(user_id\) do nothing/);
  assert.match(sql,/grant execute on function public\.mawaeidi_save_schedule_if_unchanged/);
  assert.match(sql,/older clients can still write/);
  assert.doesNotMatch(app,/cloud\.from\("mawaeidi_data"\)\.upsert\(/);
  assert.match(app,/window\.MawaeidiScheduleSync\.save\(cloud,expected,draft\)/);
  assert.match(app,/pendingScheduleConflict=\{userId:ownerId,draft,downloaded:false\}/);
  assert.match(app,/lastCloudLessons=data\?cloneBackupValue\(data\.lessons\):null/);
  assert.match(app,/resetScheduleConflict\(\)/);
  assert.match(html,/id="scheduleConflictDownload"/);
  assert.match(html,/id="scheduleConflictRefresh" disabled/);
  assert.match(html,/schedule-concurrency\.js\?v=1/);
  const core=html.match(/src="(\.\/app-main\.js\?v=\d+)"/)?.[1];
  assert.ok(core,"Versioned core script must exist");
  assert.ok(html.indexOf("schedule-concurrency.js?v=1")<html.indexOf(core),"Guard must load before the core script");
  assert.match(worker,/schedule-concurrency\.js\?v=1/);
  assert.ok(worker.includes(JSON.stringify(core)),"Service worker must cache the same core version");
  console.log("Schedule compare-and-swap conflict and draft recovery checks passed");
}
main().catch(e=>{console.error(e);process.exitCode=1});
