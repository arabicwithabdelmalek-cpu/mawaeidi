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
assert.match(source,/return Object\.freeze\(\{[\s\S]*activate,[\s\S]*deactivate,[\s\S]*reset,[\s\S]*openNew,[\s\S]*createBackupSnapshot,[\s\S]*inspectBackupSnapshot,[\s\S]*restoreBackupSnapshot/);
assert.doesNotMatch(source,/createClient\(SUPABASE_URL/);
assert.match(source,/async function createBackupSnapshot\(user\)/);
assert.match(source,/function inspectBackupSnapshot\(payload,entries=new Map\(\)\)/);
assert.match(source,/async function restoreBackupSnapshot\(plan,user\)/);
assert.match(source,/format:"mawaeidi-students"/);
assert.match(source,/cloud\.storage\.from\(STUDENT_PHOTO_BUCKET\)\.download/);
assert.doesNotMatch(source,/async function exportStudentsBackup/);
assert.match(main,/id="studentsView"[\s\S]*id="studentEditor"[\s\S]*id="studentProfile"/);
assert.match(main,/backup-manager\.js\?v=1/);
assert.match(main,/student-registry\.js\?v=15/);
assert.doesNotMatch(main,/id="backupStudents"/);
assert.doesNotMatch(main,/id="openStudentRegistry"/);

const script=new vm.Script(source,{filename:"student-registry.js"});
assert.ok(script);
console.log("student registry unit checks passed");

assert.match(source,/async function restoreTrashedStudent/);
assert.match(source,/async function permanentlyDeleteTrashedStudent/);
