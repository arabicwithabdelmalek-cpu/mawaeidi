"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const source=fs.readFileSync(path.join(root,"students/student-registry.js"),"utf8");
const css=fs.readFileSync(path.join(root,"students/student-registry.css"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");

const summaryIds=[
 "studentSummary","studentStatTotal","studentStatCurrent","studentStatPaused",
 "studentStatCountries","studentInsights","studentLevelsBreakdown","studentCountriesBreakdown"
];
for(const id of summaryIds){
 const matches=html.match(new RegExp('id="'+id+'"','g'))||[];
 assert.equal(matches.length,1,"Expected exactly one #"+id);
}
assert.match(html,/<section class="student-summary" id="studentSummary"[^>]*hidden>/);
assert.match(html,/جميع طلابك المسجّلين، بصرف النظر عن البحث والفلاتر/);
assert.match(html,/student-registry\.css\?v=4/);
assert.match(html,/student-registry\.js\?v=7/);
assert.match(sw,/mawaeidi-shell-v46/);
assert.match(sw,/student-registry\.css\?v=4/);
assert.match(sw,/student-registry\.js\?v=7/);
assert.match(css,/#studentsView \.student-summary\[hidden\]\{display:none!important\}/);
assert.match(css,/@media\(max-width:520px\)/);
assert.match(css,/student-summary-metrics\{grid-template-columns:repeat\(2/);
assert.match(source,/function renderStudentSummary\(\)/);
assert.match(source,/function renderAll\(\)\{renderStudents\(\);renderStudentSummary\(\)\}/);
assert.match(source,/summaryLoaded=true;/);
assert.match(source,/summaryLoaded=false;/);

const begin=source.indexOf("function summarizeStudents(list){");
const end=source.indexOf("\nfunction renderSummaryBreakdown(",begin);
assert.ok(begin>=0&&end>begin,"Missing pure summary function");
const snippet=source.slice(begin,end);
const LEVEL_OPTIONS=["مبتدئ","متوسط","متقدم","غير محدد"];
const summarizeStudents=new Function("LEVEL_OPTIONS","text",snippet+";return summarizeStudents;")(
 LEVEL_OPTIONS,value=>value===null||value===undefined?"":String(value)
);

const empty=summarizeStudents([]);
assert.deepEqual({total:empty.total,current:empty.current,paused:empty.paused,countryCount:empty.countryCount},
 {total:0,current:0,paused:0,countryCount:0});
assert.deepEqual(empty.levels,LEVEL_OPTIONS.map(label=>({label,count:0})));
assert.deepEqual(empty.countries,[]);

const records=[
 {status:"حالي",current_level:"مبتدئ",country:"مصر"},
 {status:"متوقف مؤقتًا",current_level:"متوسط",country:"أذربيجان"},
 {status:"حالي",current_level:"متقدم",country:"مصر"},
 {status:"جديد",current_level:"غير محدد",country:""},
 {status:"سابق",current_level:"مبتدئ",country:"ليتوانيا",deleted_at:"2026-10-28T10:00:00Z"},
 null
];
const summary=summarizeStudents(records);
assert.equal(summary.total,4,"Trash must not count as a student");
assert.equal(summary.current,2,"Only current status counts as current");
assert.equal(summary.paused,1);
assert.equal(summary.countryCount,2,"Missing country must not count as a country");
assert.deepEqual(summary.levels.map(item=>item.count),[1,1,1,1]);
assert.equal(summary.countries.find(item=>item.label==="مصر").count,2);
assert.equal(summary.countries.find(item=>item.label==="أذربيجان").count,1);
assert.equal(summary.countries.find(item=>item.label==="غير محدد").count,1);
assert.equal(summary.countries[0].label,"مصر");
records[0].status="سابق";
assert.equal(summarizeStudents(records).current,1,"Summary changes with record status edits");

console.log("Student summary metrics and UI checks passed");
