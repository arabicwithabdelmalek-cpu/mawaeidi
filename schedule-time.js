(function installScheduleTime(root){
"use strict";
const TIME_RE=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SCHEDULE_TIMEZONE="Africa/Cairo";
function textValue(value){return typeof value==="string"?value:""}
function validTimeZone(value){
  const zone=textValue(value).trim();if(!zone)return false;
  try{new Intl.DateTimeFormat("en",{timeZone:zone}).format(new Date());return true}catch{return false}
}
function validDateKey(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(textValue(value)))return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function fmt(t){
  const value=TIME_RE.test(String(t))?String(t):"00:00";
  const[h,m]=value.split(":").map(Number),p=h>=12?"م":"ص";
  let hh=h%12;if(!hh)hh=12;
  return `${hh}:${String(m).padStart(2,"0")} ${p}`;
}
function mins(t){const value=TIME_RE.test(String(t))?String(t):"00:00";const[h,m]=value.split(":").map(Number);return h*60+m}
function zonedParts(date,zone){
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
  return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day),hour:Number(parts.hour),minute:Number(parts.minute),second:Number(parts.second)};
}
function zoneOffsetMinutes(date,zone){
  const p=zonedParts(date,zone),rounded=Math.floor(date.getTime()/1000)*1000;
  return Math.round((Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-rounded)/60000);
}
function wallTimeToInstant(dateKey,time,zone=SCHEDULE_TIMEZONE){
  if(!validDateKey(dateKey)||!TIME_RE.test(String(time))||!validTimeZone(zone))return null;
  const [year,month,day]=dateKey.split("-").map(Number),[hour,minute]=String(time).split(":").map(Number),target=Date.UTC(year,month-1,day,hour,minute,0);
  let stamp=target;
  for(let i=0;i<5;i++){
    const next=target-zoneOffsetMinutes(new Date(stamp),zone)*60000;
    if(Math.abs(next-stamp)<1000){stamp=next;break}stamp=next;
  }
  const date=new Date(stamp);return Number.isFinite(date.getTime())?date:null;
}
function dateKeyInZone(date,zone){const p=zonedParts(date,zone);return `${p.year}-${String(p.month).padStart(2,"0")}-${String(p.day).padStart(2,"0")}`}
function timeKeyInZone(date,zone){const p=zonedParts(date,zone);return `${String(p.hour).padStart(2,"0")}:${String(p.minute).padStart(2,"0")}`}
function formattedTimeInZone(date,zone){return fmt(timeKeyInZone(date,zone))}
function dayShiftLabel(sourceDate,targetDate){return targetDate===sourceDate?"":targetDate>sourceDate?" · اليوم التالي":" · اليوم السابق"}
function currentDateKey(date=new Date()){
  try{
    const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:SCHEDULE_TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }catch{return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10)}
}
function currentTimeKey(date=new Date()){
  try{
    const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:SCHEDULE_TIMEZONE,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
    return `${parts.hour}:${parts.minute}`;
  }catch{return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`}
}
function addDaysToDateKey(value,daysToAdd){
  if(!validDateKey(value))return currentDateKey();
  const date=new Date(`${value}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+Number(daysToAdd||0));return date.toISOString().slice(0,10);
}
function dayNameForDateKey(value){
  if(!validDateKey(value))return "";
  return ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][new Date(`${value}T12:00:00Z`).getUTCDay()];
}
function occurrenceHasEnded(occurrence,nowDate=currentDateKey(),nowTime=currentTimeKey()){
  if(occurrence.date<nowDate)return true;
  if(occurrence.date>nowDate)return false;
  return mins(occurrence.time)+Number(occurrence.lesson?.duration||60)<=mins(nowTime);
}
function occurrenceHasStarted(occurrence,nowDate=currentDateKey(),nowTime=currentTimeKey()){
  if(occurrence.date<nowDate)return true;
  if(occurrence.date>nowDate)return false;
  return mins(occurrence.time)<=mins(nowTime);
}
root.MawaeidiScheduleTime=Object.freeze({validTimeZone,validDateKey,fmt,mins,zonedParts,zoneOffsetMinutes,wallTimeToInstant,dateKeyInZone,timeKeyInZone,formattedTimeInZone,dayShiftLabel,currentDateKey,currentTimeKey,addDaysToDateKey,dayNameForDateKey,occurrenceHasEnded,occurrenceHasStarted});
})(typeof window!=="undefined"?window:globalThis);
