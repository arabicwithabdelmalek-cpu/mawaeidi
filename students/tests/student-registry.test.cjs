"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");

const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"students/student-registry.js"),"utf8");
const main=fs.readFileSync(path.join(root,"index.html"),"utf8");

assert.match(source,/window\.MawaeidiStudents=Object\.freeze\(\{create\}\)/);
assert.match(source,/root\.querySelector\(\`#\$\{id\}\`\)/);
assert.match(source,/return Object\.freeze\(\{[\s\S]*activate,[\s\S]*deactivate,[\s\S]*reset,[\s\S]*openNew/);
assert.doesNotMatch(source,/createClient\(SUPABASE_URL/);
assert.match(main,/id="studentsView"[\s\S]*id="studentEditor"[\s\S]*id="studentProfile"/);
assert.match(main,/student-registry\.js\?v=2/);
assert.doesNotMatch(main,/id="openStudentRegistry"/);

const script=new vm.Script(source,{filename:"student-registry.js"});
assert.ok(script);
console.log("student registry unit checks passed");
