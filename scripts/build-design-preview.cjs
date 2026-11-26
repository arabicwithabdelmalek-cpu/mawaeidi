"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),out=path.join(root,"preview-dist");
fs.mkdirSync(out,{recursive:true});
const files=["index.html","app-main.js","backup-manager.js","schedule-concurrency.js","schedule-time.js","lesson-model.js","session-state.js","world-clock-model.js","day-order.js","header-refinement.css","design-system.css","ipad-pwa.css","iphone-pwa.css","students/student-registry.css","students/student-registry.js","students/student-workspace-upgrade.css","students/student-workspace-upgrade.js","icons/favicon-32.png","icons/apple-touch-icon.png","icons/huruf-background.png","icons/kufi-quote.png","icons/logo-cutout.svg","icons/home-planner.webp","icons/home-empty.svg","icons/icon-192.png","icons/icon-512.png"];
function once(s,from,to){if(s.split(from).length!==2)throw Error("Unexpected preview source: "+from.slice(0,80));return s.replace(from,to)}
for(const f of files){const dest=path.join(out,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,f),dest)}
let html=fs.readFileSync(path.join(out,"index.html"),"utf8");
html=html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/[^"]+" defer><\/script>/,"");
html=html.replace(/<script src="\.\/(?:account(?:-page)?|activity-tracker|iphone-pwa|ipad-pwa)\.js\?v=\d+" defer><\/script>/g,"");
html=html.replace(/<link rel="manifest"[^>]*>/,"");
html=once(html,"<head>",'<head><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: blob:; connect-src \'none\'; worker-src \'none\'; form-action \'none\'; object-src \'none\'; base-uri \'none\'">');
html=once(html,'<div class="app">','<div class="app"><div class="design-preview-notice" role="status">نسخة التصميم التجريبية · بيانات افتراضية فقط · لا اتصال بحسابات المستخدمين</div>');
html=once(html,"</head>",'<style>.design-preview-notice{background:#fff1d7;color:#62451c;border:1px solid #e0bd80;border-radius:10px;padding:9px 14px;font:700 13px Cairo,sans-serif;margin-bottom:12px;text-align:center}.design-preview-notice+.header #dataMenu{display:none!important}</style></head>');
fs.writeFileSync(path.join(out,"index.html"),html);
let app=fs.readFileSync(path.join(out,"app-main.js"),"utf8");
if(!/initApp\(\);\s*$/.test(app))throw Error("Missing init entry");
app=app.replace(/initApp\(\);\s*$/, String.raw`
currentUser={id:"design-preview",email:"demo@example.invalid"};
cloudReady=true;
worldClockSettings={userId:currentUser.id,base:"Africa/Cairo",zones:["Asia/Baku","Europe/Vilnius","Asia/Riyadh","Europe/London"],version:1};
const demoDay=todayName();
const demoRows=[
["demo-1","08:00",60,"teach","مجموعة العربية","المحادثة"],
["demo-2","10:00",45,"learn","درس النحو والصرف","النحو"],
["demo-3","13:30",60,"teach","طالب تجريبي ١","العربية بين يديك"],
["demo-4","17:00",45,"teach","مجموعة المبتدئين","القراءة"],
["demo-5","20:00",60,"learn","تدريب الخط العربي","الخط العربي"]
].map(([id,time,duration,type,name,subject])=>({id,name,subject,type,duration,platform:"Zoom",studentType:"individual",lessonSource:"private",schedules:[{day:demoDay,time}]}));
lessons=normalizeLessons(demoRows.concat(days.filter(day=>day!==demoDay).flatMap((day,i)=>[{id:"week-"+i,name:"حصة تجريبية",subject:"العربية",type:i%2?"learn":"teach",duration:60,schedules:[{day,time:"16:00"}]}])));
persist=async()=>{setSync("saved","تعديل تجريبي");return true};
render();hideAuth();setSync("saved","معاينة فقط");
`);
fs.writeFileSync(path.join(out,"app-main.js"),app);
let students=fs.readFileSync(path.join(out,"students/student-registry.js"),"utf8");
const start=students.indexOf("async function activate(user){"),end=students.indexOf("\nfunction openNew(){",start);
if(start<0||end<0)throw Error("Student preview hook missing");
students=students.slice(0,start)+String.raw`
async function activate(user){
  if(!user?.id)return false;
  currentUser={id:user.id};mode="cloud";summaryLoaded=true;
  students=[
    {id:"demo-student-1",first_name:"طالب",last_name:"تجريبي ١",country:"أذربيجان",status:"حالي",current_level:"مبتدئ",study_type:"فردي",course_book:"العربية بين يديك"},
    {id:"demo-student-2",first_name:"طالب",last_name:"تجريبي ٢",country:"ليتوانيا",status:"حالي",current_level:"متوسط",study_type:"مجموعة"},
    {id:"demo-student-3",first_name:"طالب",last_name:"تجريبي ٣",country:"تركيا",status:"جديد",current_level:"مبتدئ",study_type:"فردي"},
    {id:"demo-student-4",first_name:"طالب",last_name:"تجريبي ٤",country:"المملكة المتحدة",status:"متوقف مؤقتًا",current_level:"متقدم",study_type:"فردي"}
  ].map(normalizeStudent);trashedStudents=[];refreshCountryFilter();renderAll();return true;
}
`+students.slice(end);
fs.writeFileSync(path.join(out,"students/student-registry.js"),students);
if(/<script[^>]+supabase-js/.test(html)||!html.includes("connect-src 'none'")||!html.includes("worker-src 'none'"))throw Error("Isolation failed");
console.log("Isolated design preview ready: "+files.length+" assets. No real database, telemetry, login or service worker.");
