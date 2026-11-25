(function installLessonModel(root){
"use strict";
const days=["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];
const TIME_RE=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const BACKUP_FORMAT="mawaeidi-backup";
const BACKUP_VERSION=3;
const MAX_BACKUP_LESSONS=2000;
const MAX_SESSION_RECORDS=5000;
const MAX_SESSION_NOTE_LENGTH=1000;
const DEFAULT_NOTIFICATION_LEAD=15;
const DEFAULT_NOTIFICATION_LEADS=[60,15];
const NOTIFICATION_LEAD_OPTIONS=[5,10,15,30,60];
const MAX_NOTIFICATION_LEADS=3;
const SESSION_RECORD_STATUSES=["default","completed","cancelled_unpaid","cancelled_counted","free","rescheduled"];
function textValue(value){return typeof value==="string"?value:""}
function validTimeZone(...args){return root.MawaeidiScheduleTime.validTimeZone(...args)}
function validDateKey(...args){return root.MawaeidiScheduleTime.validDateKey(...args)}
function makeId(){if(root.crypto&&typeof root.crypto.randomUUID==="function")return root.crypto.randomUUID();return `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}
function cloneBackupValue(value){
  return JSON.parse(JSON.stringify(value));
}
function normalizeNotificationLeads(value,fallback=DEFAULT_NOTIFICATION_LEADS){
  const values=Array.isArray(value)?value:[value];
  const normalized=[...new Set(values.map(Number).filter(item=>NOTIFICATION_LEAD_OPTIONS.includes(item)))].sort((a,b)=>b-a).slice(0,MAX_NOTIFICATION_LEADS);
  if(normalized.length)return normalized;
  const safeFallback=Array.isArray(fallback)?fallback:[fallback];
  return [...new Set(safeFallback.map(Number).filter(item=>NOTIFICATION_LEAD_OPTIONS.includes(item)))].sort((a,b)=>b-a).slice(0,MAX_NOTIFICATION_LEADS);
}
function validNotificationLead(value){
  const lead=Number(value);
  return NOTIFICATION_LEAD_OPTIONS.includes(lead)?lead:DEFAULT_NOTIFICATION_LEAD;
}
function normalizeSessionRecords(value){
  const records=[],ids=new Set(),baseKeys=new Set();
  for(const item of (Array.isArray(value)?value:[]).slice(0,MAX_SESSION_RECORDS)){
    if(!item||typeof item!=="object")continue;
    const kind=item.kind==="replacement"?"replacement":"base",date=textValue(item.date),time=textValue(item.time);
    if(!validDateKey(date)||!TIME_RE.test(time))continue;
    let status=SESSION_RECORD_STATUSES.includes(item.status)?item.status:"default";
    const note=textValue(item.note).trim().slice(0,MAX_SESSION_NOTE_LENGTH);
    if(kind==="base"&&status==="default"&&!note)continue;
    if(kind==="replacement"&&status==="rescheduled")status="default";
    const sourceDate=textValue(item.sourceDate),sourceTime=textValue(item.sourceTime);
    if(kind==="replacement"&&(!validDateKey(sourceDate)||!TIME_RE.test(sourceTime)))continue;
    const baseKey=`${date}|${time}`;
    if(kind==="base"&&baseKeys.has(baseKey))continue;
    let id=textValue(item.id);
    if(!/^[A-Za-z0-9_-]{1,120}$/.test(id))id=kind==="base"?`base-${date}-${time.replace(":","")}`:makeId();
    while(ids.has(id))id=makeId();
    ids.add(id);
    if(kind==="base")baseKeys.add(baseKey);
    const record={id,kind,date,time,status,updatedAt:textValue(item.updatedAt)||new Date().toISOString()};
    if(note)record.note=note;
    if(kind==="base"&&status==="rescheduled"&&/^[A-Za-z0-9_-]{1,120}$/.test(textValue(item.replacementId)))record.replacementId=textValue(item.replacementId);
    if(kind==="replacement"){record.sourceDate=sourceDate;record.sourceTime=sourceTime}
    records.push(record);
  }
  const replacementIds=new Set(records.filter(item=>item.kind==="replacement").map(item=>item.id));
  const linkedReplacementIds=new Set(records.filter(item=>item.kind==="base"&&item.status==="rescheduled"&&replacementIds.has(item.replacementId)).map(item=>item.replacementId));
  return records.filter(item=>item.kind==="base"?(item.status!=="rescheduled"||linkedReplacementIds.has(item.replacementId)):linkedReplacementIds.has(item.id));
}
function normalizeLesson(item){
  const duration=Number(item.duration);
  const id=textValue(item.id);
  const reminderMode=item.reminderMode==="off"||item.reminderMode==="custom"?item.reminderMode:"default";
  return {
    id:/^[A-Za-z0-9_-]{1,120}$/.test(id)?id:makeId(),
    type:item.type==="learn"?"learn":"teach",
    studentType:item.studentType==="group"?"group":"individual",
    lessonSource:item.lessonSource==="center"?"center":"private",
    name:textValue(item.name),
    groupStudents:Array.isArray(item.groupStudents)?item.groupStudents.filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim()):[],
    studentTimeZone:validTimeZone(item.studentTimeZone)?textValue(item.studentTimeZone).trim():"",
    centerName:textValue(item.centerName),
    subject:textValue(item.subject),
    duration:Number.isFinite(duration)&&duration>=15&&duration<=720?duration:60,
    platform:textValue(item.platform),
    repeat:"أسبوعيًا",
    reminderMode,
    reminderLeads:normalizeNotificationLeads(item.reminderLeads,[DEFAULT_NOTIFICATION_LEAD]),
    notes:textValue(item.notes),
    sessionRecords:normalizeSessionRecords(item.sessionRecords),
    schedules:Array.isArray(item.schedules)?item.schedules
      .filter(s=>s&&days.includes(s.day)&&TIME_RE.test(textValue(s.time)))
      .map(s=>({day:s.day,time:s.time})):[]
  };
}
function normalizeLessons(list){
  const seen=new Set();
  return (Array.isArray(list)?list:[]).filter(item=>item&&typeof item==="object").map(item=>{
    const lesson=normalizeLesson(item);
    while(seen.has(lesson.id))lesson.id=makeId();
    seen.add(lesson.id);
    return lesson;
  });
}
function parseScheduleBackupObject(obj){
  let source;
  if(Array.isArray(obj))source=obj;
  else if(obj&&obj.format===BACKUP_FORMAT&&[1,2,BACKUP_VERSION].includes(obj.version)&&Array.isArray(obj.lessons))source=obj.lessons;
  else if(obj&&obj.format==="mawaeidi-schedule"&&obj.version===1&&Array.isArray(obj.lessons))source=obj.lessons;
  else throw new Error("invalid_schedule_backup");
  if(source.length>MAX_BACKUP_LESSONS)throw new Error("too_many_lessons");
  if(source.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new Error("invalid_lesson");
  const normalized=normalizeLessons(source);
  if(normalized.some(item=>!item.schedules.length))throw new Error("invalid_schedule");
  return normalized;
}
function mergeBackupLessons(current,incoming){
  const merged=normalizeLessons(current);
  const positions=new Map(merged.map((lesson,index)=>[lesson.id,index]));
  let added=0;
  let updated=0;
  for(const lesson of incoming||[]){
    if(positions.has(lesson.id)){
      merged[positions.get(lesson.id)]=cloneBackupValue(lesson);
      updated++;
    }else{
      positions.set(lesson.id,merged.length);
      merged.push(cloneBackupValue(lesson));
      added++;
    }
  }
  return {lessons:normalizeLessons(merged),added,updated};
}
root.MawaeidiLessonModel=Object.freeze({normalizeNotificationLeads,validNotificationLead,normalizeSessionRecords,normalizeLesson,normalizeLessons,parseScheduleBackupObject,mergeBackupLessons});
})(typeof window!=="undefined"?window:globalThis);
