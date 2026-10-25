"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const registryHtml=fs.readFileSync(path.join(root,"development/student-registry.html"),"utf8");
const registry=fs.readFileSync(path.join(root,"development/student-registry.js"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/20261025064000_development_core_integration.sql"),"utf8");

assert.match(html,/https:\/\/eixeazkkexgfndvfowxa\.supabase\.co/,"Development app must use the development Supabase project");
assert.doesNotMatch(html,/https:\/\/nvefdkkjkyalpsrgoffj\.supabase\.co/,"Development branch must not point at production Supabase");
assert.match(html,/id="studentsSectionButton"/);
assert.match(html,/id="studentsQuickSearch"/);
assert.doesNotMatch(html,/id="lessonStudentIds"/,"Student records must stay independent from lesson forms");
assert.doesNotMatch(html,/studentIds:/,"Lessons must not store student-registry links");
assert.doesNotMatch(registry,/profileIntegration|linkedLessonsForStudent|mawaeidi_data/,"Student profiles must not read schedule or finance data");
assert.match(registry,/المعلومات المسجلة/);
assert.doesNotMatch(registryHtml,/id="(?:addProgress|progressForm|progressEditor)"/,"The student registry UI must stay focused on stored profile data");
assert.doesNotMatch(registry,/PROGRESS_TABLE|loadCloudProgress|saveProgressRecord/,"The student screen must not load or edit progress records");

for(const table of ["mawaeidi_data","mawaeidi_history","mawaeidi_push_subscriptions","mawaeidi_notification_log"]){
  assert.match(migration,new RegExp(`public\\.${table}`),`Migration is missing ${table}`);
}
assert.match(migration,/enable row level security/);
assert.match(migration,/auth\.uid\(\)/);

const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(source=>source.trim());
assert.ok(inlineScripts.length,"Expected an inline application script");
for(const [index,source] of inlineScripts.entries())new vm.Script(source,{filename:`index-inline-${index}.js`});

console.log("Integrated development app checks passed.");
