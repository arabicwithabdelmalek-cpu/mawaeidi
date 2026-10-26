"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
for(const [i,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`index-inline-${i}.js`});
}
assert.match(html,/https:\/\/nvefdkkjkyalpsrgoffj\.supabase\.co/);
assert.doesNotMatch(html,/eixeazkkexgfndvfowxa|DEVELOPMENT_DEMO|financeSectionButton/);
assert.match(html,/class="kufi-quote"/);
const nodes=new Map();
function node(id){
  if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:"",value:"",style:{},classList:{toggle(){}},setAttribute(){},querySelectorAll(){return[]}});
  return nodes.get(id);
}
const tabs=["scheduleSectionButton","worldClockSectionButton","studentsSectionButton"].map(id=>Object.assign(node(id),{id}));
const nav=node("nav");
const context={
  document:{createElement:()=>({}),head:{appendChild(){}},getElementById:node,querySelector:selector=>selector===".workspace-switch"?nav:null,querySelectorAll:selector=>selector===".workspace-switch button"?tabs:[]},
  URL,URLSearchParams,console,clearInterval,
  accountEl:node,accountFill(){},accountMessage(){},accountReset(){},accountLoadAvatar(){},
  activateSession:async()=>{},logout:async()=>{},openNew(){},openWorldClock(){},
  normalizeZoneSearch:value=>String(value).toLowerCase(),esc:value=>String(value),location:{href:"https://test.local/"}
};
vm.createContext(context);
vm.runInContext('let currentSection="schedule",currentUser=null,cloudReady=false,worldClockInterval=null,studentDirectoryRecords=[],studentDirectoryLoadSequence=0,studentDirectoryState="idle";const cloud=null;',context);
const sectionSource=html.slice(html.indexOf("function studentDisplayName("),html.indexOf("function filtered(){"));
vm.runInContext(sectionSource,context);
vm.runInContext(fs.readFileSync(path.join(root,"account-page.js"),"utf8"),context);
context.setSection("students");
assert.equal(node("scheduleWorkspace").hidden,true);
assert.equal(node("worldClockView").hidden,true);
assert.equal(node("studentsView").hidden,false);
assert.equal(node("primaryActionButton").textContent,"＋ إضافة طالب");
context.setSection("account");
assert.equal(node("studentsView").hidden,true,"Account page must hide the student directory");
assert.equal(node("accountView").hidden,false);
assert.equal(node("primaryActionButton").hidden,true);
context.setSection("world");
assert.equal(node("accountView").hidden,true);
assert.equal(node("worldClockView").hidden,false);
assert.equal(node("studentsView").hidden,true);
context.setSection("schedule");
assert.equal(node("scheduleWorkspace").hidden,false);
assert.equal(node("primaryActionButton").textContent,"＋ إضافة حصة");
assert.equal(context.studentRegistryUrl("test id"),"./students/index.html?student=test+id");
assert.equal(context.studentRegistryUrl("",true),"./students/index.html?new=1");
console.log("Production navigation, account compatibility, and JavaScript checks passed.");
