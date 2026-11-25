"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../student-registry.js"),"utf8");
function extract(n){const m=source.match(new RegExp("^function "+n+"\\(","m"));assert.ok(m,n);return source.slice(m.index,source.indexOf("\n}",m.index)+2)}
const build=new Function("deps",[
'let students=deps.students,trashedStudents=[],listMode="active",upgrade=null;',
'const CSV_EXPORT_FIELDS=[{key:"first_name"},{key:"notes"}];',
'const text=x=>String(x??""),studentName=x=>x.first_name,normalizeKey=x=>{deps.normalizations++;return text(x).toLowerCase()};',
'const currentFilters=()=>deps.filters,byId=()=>deps.select,Option=deps.Option;',
extract("filterAndSortStudents"),extract("refreshCountryFilter"),
'return {filterAndSortStudents,refreshCountryFilter};'
].join("\n"));
let reads=0,rebuilds=0;
const students=[{first_name:"Ali",status:"active",country:"Egypt",get notes(){reads++;return "grammar"}},{first_name:"Sara",status:"paused",country:"Egypt",get notes(){reads++;return "grammar"}}];
const select={value:"Egypt",options:[{value:""},{value:"Egypt"}],replaceChildren(o){rebuilds++;this.options=[o]},append(o){this.options.push(o)}};
const deps={students,filters:{query:"",status:"",sort:"name"},normalizations:0,select,Option:function(label,value){this.value=value}};
const x=build(deps);assert.equal(x.filterAndSortStudents().length,2);assert.equal(reads,0);assert.equal(deps.normalizations,0);
deps.filters.query="grammar";deps.filters.status="active";assert.equal(x.filterAndSortStudents().length,1);assert.equal(reads,1);
deps.filters.query="missing";assert.equal(x.filterAndSortStudents().length,0);
x.refreshCountryFilter();assert.equal(rebuilds,0);students[1].country="France";x.refreshCountryFilter();assert.equal(rebuilds,1);assert.equal(select.value,"Egypt");
assert.ok(!source.match(/CSV_EXPORT_FIELDS=STUDENT_FIELDS\.filter\(field=>field\.key===\s*"login_password"/));
console.log("Student filters: lazy search, filter short circuit and unchanged country options passed.");
