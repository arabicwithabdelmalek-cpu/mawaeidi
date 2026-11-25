(function installSessionState(root){
"use strict";
function textValue(value){return typeof value==="string"?value:""}
function makeId(){if(root.crypto&&typeof root.crypto.randomUUID==="function")return root.crypto.randomUUID();return `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}
function normalizeLesson(...args){return root.MawaeidiLessonModel.normalizeLesson(...args)}
function validDateKey(...args){return root.MawaeidiScheduleTime.validDateKey(...args)}
function dayNameForDateKey(...args){return root.MawaeidiScheduleTime.dayNameForDateKey(...args)}
function occurrenceHasStarted(...args){return root.MawaeidiScheduleTime.occurrenceHasStarted(...args)}
function occurrenceHasEnded(...args){return root.MawaeidiScheduleTime.occurrenceHasEnded(...args)}
const MAX_SESSION_NOTE_LENGTH=1000;
function baseSessionRecord(lesson,date,time){
  return (lesson?.sessionRecords||[]).find(item=>item.kind==="base"&&item.date===date&&item.time===time)||null;
}
function replacementSessionRecord(lesson,id){
  return (lesson?.sessionRecords||[]).find(item=>item.kind==="replacement"&&item.id===id)||null;
}
function occurrenceRawStatus(occurrence){return occurrence.record?.status||"default"}
function occurrenceStatus(occurrence){
  const explicit=occurrenceRawStatus(occurrence);
  if(explicit!=="default")return explicit;
  if(occurrenceHasEnded(occurrence))return "completed";
  if(occurrenceHasStarted(occurrence))return "ongoing";
  return "upcoming";
}
function sessionStatusInfo(status){
  return ({
    upcoming:{short:"قادمة",full:"قادمة",className:"upcoming"},
    ongoing:{short:"جارية",full:"جارية الآن",className:"ongoing"},
    completed:{short:"تمت",full:"تمت",className:"completed"},
    cancelled_unpaid:{short:"أُلغيت",full:"أُلغيت",className:"cancelled"},
    cancelled_counted:{short:"إلغاء متأخر",full:"أُلغيت (إلغاء متأخر)",className:"counted-cancel"},
    free:{short:"مجانية",full:"تمت مجانًا",className:"free"},
    rescheduled:{short:"تأجلت",full:"تأجلت إلى موعد آخر",className:"rescheduled"}
  })[status]||{short:"قادمة",full:"قادمة",className:"upcoming"};
}
function occurrenceIsInactive(occurrence){return ["cancelled_unpaid","cancelled_counted","rescheduled"].includes(occurrenceStatus(occurrence))}
function datedOccurrencesForDate(date,list=[]){
  if(!validDateKey(date))return [];
  const day=dayNameForDateKey(date),occurrences=[];
  (Array.isArray(list)?list:[]).forEach(lesson=>{
    (lesson.schedules||[]).filter(schedule=>schedule.day===day).forEach(schedule=>{
      const record=baseSessionRecord(lesson,date,schedule.time);
      occurrences.push({lesson,date,day,time:schedule.time,kind:"base",record,recordId:record?.id||""});
    });
    (lesson.sessionRecords||[]).filter(record=>record.kind==="replacement"&&record.date===date).forEach(record=>{
      occurrences.push({lesson,date,day,time:record.time,kind:"replacement",record,recordId:record.id,sourceDate:record.sourceDate,sourceTime:record.sourceTime});
    });
  });
  return occurrences.sort((a,b)=>a.time.localeCompare(b.time)||a.lesson.name.localeCompare(b.lesson.name,"ar"));
}
function lessonWithSessionStatus(lesson,context,status,newDate="",newTime="",note=""){
  let records=(lesson.sessionRecords||[]).map(item=>({...item})),now=new Date().toISOString();
  const cleanNote=textValue(note).trim().slice(0,MAX_SESSION_NOTE_LENGTH);
  if(context.kind==="replacement"){
    const index=records.findIndex(item=>item.kind==="replacement"&&item.id===context.recordId);
    if(index<0)throw new Error("Replacement session not found");
    if(status==="rescheduled")records[index]={...records[index],date:newDate,time:newTime,status:"default",note:cleanNote,updatedAt:now};
    else records[index]={...records[index],status:status==="automatic"?"default":status,note:cleanNote,updatedAt:now};
    return normalizeLesson({...lesson,sessionRecords:records});
  }
  const oldBase=records.find(item=>item.kind==="base"&&item.date===context.date&&item.time===context.time)||null;
  const oldReplacement=oldBase?.replacementId?records.find(item=>item.kind==="replacement"&&item.id===oldBase.replacementId):null;
  records=records.filter(item=>!(item.kind==="base"&&item.date===context.date&&item.time===context.time)&&item.id!==oldBase?.replacementId);
  if(status==="automatic"){
    if(cleanNote)records.push({id:`base-${context.date}-${context.time.replace(":","")}`,kind:"base",date:context.date,time:context.time,status:"default",note:cleanNote,updatedAt:now});
    return normalizeLesson({...lesson,sessionRecords:records});
  }
  if(status==="rescheduled"){
    const replacementId=oldReplacement?.id||makeId();
    records.push({id:`base-${context.date}-${context.time.replace(":","")}`,kind:"base",date:context.date,time:context.time,status:"rescheduled",replacementId,note:cleanNote,updatedAt:now});
    records.push({id:replacementId,kind:"replacement",date:newDate,time:newTime,status:"default",sourceDate:context.date,sourceTime:context.time,note:textValue(oldReplacement?.note),updatedAt:now});
  }else records.push({id:`base-${context.date}-${context.time.replace(":","")}`,kind:"base",date:context.date,time:context.time,status,note:cleanNote,updatedAt:now});
  return normalizeLesson({...lesson,sessionRecords:records});
}
root.MawaeidiSessionState=Object.freeze({baseSessionRecord,replacementSessionRecord,occurrenceRawStatus,occurrenceStatus,sessionStatusInfo,occurrenceIsInactive,datedOccurrencesForDate,lessonWithSessionStatus});
})(typeof window!=="undefined"?window:globalThis);
