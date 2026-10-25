"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const projectRoot=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(projectRoot,"development/student-registry.html"),"utf8");
let source=fs.readFileSync(path.join(projectRoot,"development/student-registry.js"),"utf8");

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,"HTML contains duplicate IDs");

const literalIdReferences=[...source.matchAll(/byId\("([^"]+)"\)/g)].map(match=>match[1]);
const dynamicIds=new Set(["student_username"]);
const missingIds=[...new Set(literalIdReferences.filter(id=>!ids.includes(id)&&!dynamicIds.has(id)))];
assert.deepEqual(missingIds,[],`Missing HTML IDs: ${missingIds.join(", ")}`);

source=source.replace(
  /\ninit\(\);\s*$/,
  "\nthis.__studentRegistryTest={normalizeStudent,normalizeProgress,normalizeMawaeidiData,linkedLessonsForStudent,studentIntegrationSummary,parseCsv,csvEscape,validateImportedStudent,normalizeKey};"
);

const context={
  window:{supabase:null,crypto:{randomUUID:crypto.randomUUID}},
  Intl,Date,URL,Object,console,Blob,setTimeout,clearTimeout,
  confirm:()=>true,
  location:{protocol:"http:",href:"http://test.local/"},
  document:{}
};
vm.createContext(context);
vm.runInContext(source,context,{filename:"student-registry.js"});

const api=context.__studentRegistryTest;
assert.ok(api,"Test API was not exposed");

const student=api.normalizeStudent({
  username:"  test_user  ",first_name:" أحمد ",status:"قيمة غير معتمدة",
  current_level:"متوسط",study_type:"فردي"
});
assert.equal(student.username,"test_user");
assert.equal(student.first_name,"أحمد");
assert.equal(student.status,"غير محدد");

const rows=api.parseCsv('"اسم","وصف"\r\n"أحمد","قال ""مرحبًا"""');
assert.equal(rows.length,2);
assert.equal(rows[1][1],'قال "مرحبًا"');
assert.match(api.csvEscape("+994 50"),/^"'\+994/,"CSV export must protect formula-like values");

const progress=api.normalizeProgress({student_id:"student",title:" درس ",score:101});
assert.equal(progress.title,"درس");
assert.equal(progress.score,null);

const integration=api.studentIntegrationSummary("student-1",api.normalizeMawaeidiData({
  lessons:[
    {id:"lesson-1",studentIds:["student-1"],sessionRecords:[{status:"completed"}]},
    {id:"lesson-2",studentIds:["student-2"],sessionRecords:[{status:"cancelled_unpaid"}]}
  ],
  finance:{agreements:[{id:"agreement-1",lessonIds:["lesson-1"]}],payments:[{id:"payment-1",agreementId:"agreement-1",amount:25}]}
}));
assert.equal(integration.lessons.length,1,"Only explicitly linked lessons belong to a student");
assert.equal(integration.statusCounts.completed,1);
assert.equal(integration.agreements.length,1);
assert.equal(integration.payments.length,1);

console.log("Student registry checks passed.");
