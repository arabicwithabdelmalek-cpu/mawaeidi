"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root,"students/student-registry.js"),"utf8");

// Run the real CSV exporter in a controlled sandbox. Nothing touches Supabase.
const config = source.match(/const CSV_EXPORT_FIELDS=[^\n]+;\nconst CSV_EXPORT_HEADERS=[^\n]+;/);
const functions = source.match(/function csvEscape\(value\)\{[\s\S]*?\n\}\nfunction buildStudentsCsv\(list\)\{[\s\S]*?\n\}/);
assert.ok(config && functions, "Student CSV exporter must remain testable");
const sandbox = {
  STUDENT_FIELDS: [
    {key:"username",label:"اسم المستخدم"},
    {key:"login_password",label:"كلمة السر"},
    {key:"first_name",label:"الاسم الأول"},
    {key:"email",label:"البريد الإلكتروني"}
  ],
  text(value){return String(value??"");}
};
vm.createContext(sandbox);
vm.runInContext(config[0]+"\n"+functions[0]+"\nthis.testExport=buildStudentsCsv;",sandbox);
const secret = "MAWAEIDI_TEST_SECRET_DO_NOT_EXPORT";
const csv = sandbox.testExport([{
  username:"student-1",login_password:secret,first_name:"أحمد",email:"test@example.org"
}]);
assert.ok(csv.includes("الاسم الأول"));
assert.ok(csv.includes("student-1"));
assert.ok(csv.includes("test@example.org"));
assert.doesNotMatch(csv,/كلمة السر/);
assert.ok(!csv.includes(secret),"CSV export leaked the stored student password");

// Import must accept newly exported files WITHOUT a password column and
// preserve the current saved password of an existing matching student.
assert.match(source,/const missing=CSV_EXPORT_HEADERS\.filter\(header=>!headers\.includes\(header\)\)/);
assert.match(source,/includesLoginPassword:headers\.includes\(/);
assert.match(source,/importPlan\.includesLoginPassword\?item\.login_password:\(existing\?\.login_password\|\|""\)/);

// The history UI may be fed existing rows from before server-side redaction.
// Legacy password values must not be displayed in that UI.
assert.match(source,/filter\(\(\[key\]\)=>key!=="login_password"\)\.map/);
assert.match(source,/if\(key==="login_password"\)return "بيانات محجوبة"/);

// Existing history rows can contain the pre-fix credential values. A reviewed,
// non-deployed SQL plan removes only that field, and records future changes as a
// boolean marker without persisting the old or new password value.
const redaction=fs.readFileSync(path.join(root,"docs/reviews/sql/student-history-redaction-proposal.sql"),"utf8");
assert.match(redaction,/DRAFT FOR REVIEW ONLY/);
assert.match(redaction,/prior := to_jsonb\(old\) - array\[[^\]]*'login_password'/);
assert.match(redaction,/after_value := to_jsonb\(new\) - array\[[^\]]*'login_password'/);
assert.match(redaction,/credential_updated/);
assert.match(redaction,/set changes = changes - 'login_password'/);
assert.match(source,/if\(key==="credential_updated"\)return/);

// Full backup behavior is deliberately unchanged: it can retain student passwords.
// Its UI and README must clearly warn that the ZIP is not encrypted.
console.log("Student CSV credential protection checks passed.");
