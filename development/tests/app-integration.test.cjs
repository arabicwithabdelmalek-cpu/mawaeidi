"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const registry=fs.readFileSync(path.join(root,"development/student-registry.js"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase/migrations/20261025064000_development_core_integration.sql"),"utf8");

assert.match(html,/https:\/\/eixeazkkexgfndvfowxa\.supabase\.co/,"Development app must use the development Supabase project");
assert.doesNotMatch(html,/https:\/\/nvefdkkjkyalpsrgoffj\.supabase\.co/,"Development branch must not point at production Supabase");
assert.match(html,/id="studentsSectionButton"/);
assert.match(html,/id="lessonStudentIds"/);
assert.match(html,/studentIds:\[\.\.\.new Set/,"Lesson normalization must retain explicit student links");
assert.match(html,/studentIds:readLessonStudentIds\(\)/,"Lesson saves must include selected student IDs");
assert.match(registry,/function profileIntegration\(/);
assert.doesNotMatch(registry,/سيظهر هنا جدول الطالب وحضوره واتفاقاته/,"Phase-one placeholder must be removed");

for(const table of ["mawaeidi_data","mawaeidi_history","mawaeidi_push_subscriptions","mawaeidi_notification_log"]){
  assert.match(migration,new RegExp(`public\\.${table}`),`Migration is missing ${table}`);
}
assert.match(migration,/enable row level security/);
assert.match(migration,/auth\.uid\(\)/);

const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(source=>source.trim());
assert.ok(inlineScripts.length,"Expected an inline application script");
for(const [index,source] of inlineScripts.entries())new vm.Script(source,{filename:`index-inline-${index}.js`});

console.log("Integrated development app checks passed.");
