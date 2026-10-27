"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"../..");
const main=fs.readFileSync(path.join(root,"index.html"),"utf8");
const source=fs.readFileSync(path.join(root,"students/student-registry.js"),"utf8");
const css=fs.readFileSync(path.join(root,"students/student-registry.css"),"utf8");

const requiredIds=["studentsView","studentsHeading","search","statusFilter","studentRows","addStudent","studentEditor","studentForm","studentProfile","importPreview","backupStudents"];
for(const id of requiredIds)assert.match(main,new RegExp(`id="${id}"`),`missing #${id}`);
assert.equal((main.match(/id="studentsView"/g)||[]).length,1);
assert.equal((main.match(/id="studentEditor"/g)||[]).length,1);
assert.match(source,/if\(!currentUser\|\|mode!=="cloud"\|\|root\.hidden\)return false/);
assert.match(source,/createStoredZip\(zipFiles\)/);
assert.match(source,/photoFiles\.get\(student\.id\)/);
assert.match(source,/mawaeidi-students-backup-\$\{todayKey\(\)\}\.zip/);
assert.match(source,/accountSequence\+\+/);
assert.match(source,/operationAccountSequence!==accountSequence/);
assert.match(source,/if\(initialRouteHandled\|\|root\.hidden\)return/);
assert.match(css,/#studentsView\[hidden\]/);
assert.match(css,/#studentsView \.registry-panel/);
assert.doesNotMatch(css,/(^|\n)body\{/);
assert.doesNotMatch(css,/(^|\n)\.filters\{/);
console.log("student workspace checks passed");
