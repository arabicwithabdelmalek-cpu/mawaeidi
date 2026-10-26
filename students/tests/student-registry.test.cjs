"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const projectRoot=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(projectRoot,"students/index.html"),"utf8");
let source=fs.readFileSync(path.join(projectRoot,"students/student-registry.js"),"utf8");

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,"HTML contains duplicate IDs");

const literalIdReferences=[...source.matchAll(/byId\("([^"]+)"\)/g)].map(match=>match[1]);
const dynamicIds=new Set(["student_username","student_first_name","student_last_name"]);
const missingIds=[...new Set(literalIdReferences.filter(id=>!ids.includes(id)&&!dynamicIds.has(id)))];
assert.deepEqual(missingIds,[],`Missing HTML IDs: ${missingIds.join(", ")}`);

source=source.replace(
  /\ninit\(\);\s*$/,
  "\nthis.__studentRegistryTest={normalizeStudent,parseCsv,csvEscape,validateImportedStudent,validateStudentPhotoFile,normalizeKey,STUDENT_FIELD_GROUPS,STUDENT_FIELDS,CSV_HEADERS,STUDENT_PHOTO_BUCKET};"
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
assert.equal(api.normalizeStudent({photo_path:" owner/student/photo.webp "}).photo_path,"owner/student/photo.webp");
assert.equal(api.normalizeStudent({photo_url:"javascript:alert(1)"}).photo_url,"");

assert.equal(api.validateStudentPhotoFile({type:"image/jpeg",size:1024}),"");
assert.match(api.validateStudentPhotoFile({type:"image/gif",size:1024}),/JPG/);
assert.match(api.validateStudentPhotoFile({type:"image/png",size:11*1024*1024}),/10 ميجابايت/);
assert.equal(api.STUDENT_PHOTO_BUCKET,"mawaeidi-student-photos");

const rows=api.parseCsv('"اسم","وصف"\r\n"أحمد","قال ""مرحبًا"""');
assert.equal(rows.length,2);
assert.equal(rows[1][1],'قال "مرحبًا"');
assert.match(api.csvEscape("+994 50"),/^"'\+994/,"CSV export must protect formula-like values");

const groupedKeys=api.STUDENT_FIELD_GROUPS.flatMap(group=>group.keys);
assert.equal(new Set(groupedKeys).size,17,"Each student field must appear once in the grouped form");
assert.equal(api.STUDENT_FIELDS.length,17,"The Google Sheets student fields must remain unchanged");
assert.equal(api.CSV_HEADERS.length,17,"Photos must not add a CSV column");
assert.ok(!api.CSV_HEADERS.includes("صورة الطالب"),"Private photo paths must not be exported to CSV");
assert.deepEqual(new Set(groupedKeys),new Set([
  "username","first_name","last_name","country","status","institute","study_group","distinguishing_mark",
  "email","whatsapp","current_level","study_type","course_book","communication_language","joined_on",
  "educational_notes","student_account_url"
]));

console.log("Student registry checks passed.");

