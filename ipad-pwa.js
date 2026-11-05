/* Mawaeidi iPad PWA — tablet-specific enhancement, no desktop/Android changes. */
(()=>{
"use strict";
const tablet=/iPad/i.test(navigator.userAgent||"")||
  (navigator.platform==="MacIntel"&&Number(navigator.maxTouchPoints)>1);
if(!tablet)return;
document.documentElement.classList.add("mawaeidi-ipad");
const storageKey="mawaeidi-ipad-week-mode-v1";
const installDismissKey="mawaeidi-ipad-install-dismiss-v1";
let currentMode="agenda";
try{currentMode=localStorage.getItem(storageKey)==="grid"?"grid":"agenda"}catch{}
const DAYS=["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];
const isInstalled=()=>Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches||navigator.standalone===true);
const htmlEscape=text=>String(text??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function orderedDays(){
  try{
    const key="mawaeidi-week-day-order-v1:"+
      (typeof currentUser!=="undefined"&&currentUser?.id||"guest");
    const stored=JSON.parse(localStorage.getItem(key)||"null");
    return Array.isArray(stored)&&stored.length===7&&new Set(stored).size===7&&
      stored.every(day=>DAYS.includes(day))?stored:DAYS;
  }catch{return DAYS}
}
function toggleWeekMode(mode){
  if(!["grid","agenda"].includes(mode))return;
  currentMode=mode;
  try{localStorage.setItem(storageKey,mode)}catch{}
  applyWeekMode();
}
function applyWeekMode(){
  const week=document.getElementById("weekView");
  if(!week)return;
  week.classList.toggle("ipad-week-agenda-active",currentMode==="agenda");
  week.classList.toggle("ipad-week-grid-active",currentMode==="grid");
  for(const [id,mode] of [["ipadAgendaTab","agenda"],["ipadGridTab","grid"]]){
    const button=document.getElementById(id);
    if(!button)continue;
    const selected=currentMode===mode;
    button.classList.toggle("active",selected);
    button.setAttribute("aria-pressed",String(selected));
  }
  const agenda=document.getElementById("ipadWeekAgenda");
  if(agenda)agenda.hidden=currentMode!=="agenda";
  const table=document.querySelector("#weekView .week-table-wrap");
  if(table)table.setAttribute("aria-hidden",String(currentMode==="agenda"));
}
function setupToolbar(){
  if(document.getElementById("ipadWeekMode"))return;
  const week=document.getElementById("weekView");
  const summary=document.getElementById("weekSmartSummary");
  if(!week||!summary)return;
  const tools=document.createElement("div");
  tools.id="ipadWeekMode";
  tools.className="ipad-week-mode";
  tools.setAttribute("role","group");
  tools.setAttribute("aria-label","طريقة عرض جدول الأسبوع");
  tools.innerHTML='<span class="ipad-week-mode-label">طريقة العرض</span>'+
    '<div class="ipad-week-mode-switch"><button id="ipadAgendaTab" type="button" aria-pressed="true">قائمة الأيام</button>'+
    '<button id="ipadGridTab" type="button" aria-pressed="false">الشبكة</button></div>';
  const agenda=document.createElement("div");
  agenda.id="ipadWeekAgenda";
  agenda.className="ipad-week-agenda";
  agenda.setAttribute("aria-label","المواعيد بحسب اليوم");
  summary.insertAdjacentElement("afterend",tools);
  tools.insertAdjacentElement("afterend",agenda);
  tools.querySelector("#ipadAgendaTab").addEventListener("click",()=>toggleWeekMode("agenda"));
  tools.querySelector("#ipadGridTab").addEventListener("click",()=>toggleWeekMode("grid"));
  applyWeekMode();
}
function sessionMarkup(item){
  const lesson=item.lesson||{};
  const type=lesson.type==="learn"?"أدرس":"أُدرِّس";
  const mode=lesson.type==="learn"?"learn":"teach";
  const name=htmlEscape(lesson.name||"حصة بدون اسم");
  const source=typeof sourceLabel==="function"?sourceLabel(lesson):"";
  const time=typeof fmt==="function"?fmt(item.time):item.time;
  const status=typeof sessionStatusButtonMarkup==="function"?sessionStatusButtonMarkup(item):"";
  const inactive=typeof occurrenceIsInactive==="function"&&occurrenceIsInactive(item);
  const pieces=[lesson.subject,source,lesson.platform,((Number(lesson.duration)||60)+" دقيقة")].filter(Boolean);
  const article=document.createElement("article");
  article.className="ipad-agenda-lesson "+mode+(inactive?" is-inactive":"");
  article.innerHTML='<div class="ipad-agenda-hour"><strong>'+htmlEscape(time)+
    '</strong><small>بتوقيت مصر</small></div>'+
    '<div class="ipad-agenda-details"><h3>'+name+'</h3><p>'+pieces.map(htmlEscape).join(" · ")+'</p>'+
    '<div class="ipad-agenda-lesson-tools"><span class="ipad-agenda-kind">'+type+'</span>'+
    status+'<button type="button" class="ipad-agenda-edit">تعديل</button></div></div>';
  article.querySelector(".ipad-agenda-edit")?.addEventListener("click",()=>{
    if(typeof openEdit==="function")openEdit(lesson.id);
  });
  return article;
}
function renderAgenda(occurrences){
  const mount=document.getElementById("ipadWeekAgenda");
  if(!mount)return;
  const remembered=new Map([...mount.querySelectorAll("details[data-day]")]
    .map(node=>[node.dataset.day,node.open]));
  mount.replaceChildren();
  const today=typeof todayName==="function"?todayName():"";
  const current=typeof selectedWeekOffset!=="undefined"&&selectedWeekOffset===0;
  for(const day of orderedDays()){
    const date=typeof weekDateForDay==="function"?weekDateForDay(day):"";
    const items=(occurrences||[]).filter(o=>o.day===day)
      .sort((a,b)=>String(a.time).localeCompare(String(b.time)));
    const active=items.filter(o=>!(typeof occurrenceIsInactive==="function"&&occurrenceIsInactive(o))).length;
    const details=document.createElement("details");
    details.className="ipad-agenda-day"+(current&&today===day?" today":"");
    details.dataset.day=day;
    details.open=remembered.has(day)?remembered.get(day):items.length>0;
    const summary=document.createElement("summary");
    const dateLabel=typeof formatSessionDate==="function"?formatSessionDate(date,true):date;
    summary.innerHTML='<span class="ipad-agenda-day-label"><strong>'+htmlEscape(day)+
      '</strong><small>'+htmlEscape(dateLabel)+(current&&today===day?" · اليوم":"")+'</small></span>'+
      '<span class="ipad-agenda-count">'+(active?active+" حصة":"لا توجد حصص")+'</span>'+
      '<span class="ipad-agenda-chevron" aria-hidden="true"></span>';
    details.appendChild(summary);
    const content=document.createElement("div");
    content.className="ipad-agenda-content";
    if(!items.length){
      const message=document.createElement("p");
      message.className="ipad-agenda-empty";
      message.textContent="لا توجد حصص في هذا اليوم.";
      content.appendChild(message);
    }else items.forEach(item=>content.appendChild(sessionMarkup(item)));
    const add=document.createElement("button");
    add.type="button";
    add.className="ipad-agenda-add";
    add.textContent="＋ إضافة حصة لهذا اليوم";
    add.addEventListener("click",()=>{
      if(typeof openQuickAdd==="function")openQuickAdd(day,"18:00");
    });
    content.appendChild(add);
    details.appendChild(content);
    mount.appendChild(details);
  }
  applyWeekMode();
}
window.mawaeidiIPadRenderAgenda=renderAgenda;
window.mawaeidiIPadArrangeAgenda=()=>{
  const mount=document.getElementById("ipadWeekAgenda");
  if(!mount)return;
  const byDay=new Map([...mount.children].map(el=>[el.dataset.day,el]));
  orderedDays().forEach(day=>{if(byDay.has(day))mount.appendChild(byDay.get(day))});
};
function showInstallHint(){
  if(isInstalled())return;
  try{if(localStorage.getItem(installDismissKey))return}catch{}
  const host=document.querySelector(".app > .header");
  if(!host||document.getElementById("ipadInstallHint"))return;
  const hint=document.createElement("aside");
  hint.id="ipadInstallHint";
  hint.className="ipad-install-hint";
  hint.setAttribute("aria-label","تثبيت مواعيدي على الآيباد");
  hint.innerHTML='<div class="ipad-install-hint-text"><strong>استخدم مواعيدي كتطبيق على الآيباد</strong>'+
    '<span>من Safari: مشاركة ← إضافة إلى الشاشة الرئيسية ← فتح كتطبيق.</span></div>'+
    '<button type="button" class="ipad-install-help">الطريقة</button>'+
    '<button type="button" class="ipad-install-dismiss" aria-label="إخفاء تعليمات التثبيت">×</button>';
  host.insertAdjacentElement("afterend",hint);
  hint.querySelector(".ipad-install-help").addEventListener("click",()=>{
    if(typeof installApp==="function")installApp();
  });
  hint.querySelector(".ipad-install-dismiss").addEventListener("click",()=>{
    try{localStorage.setItem(installDismissKey,"1")}catch{}
    hint.remove();
  });
}
function ready(){
  setupToolbar();
  showInstallHint();
  window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change",()=>{
    if(isInstalled())document.getElementById("ipadInstallHint")?.remove();
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});
else ready();
})();