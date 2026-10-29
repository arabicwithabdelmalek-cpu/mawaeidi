(()=>{
"use strict";

function create(options={}){
const root=options.root;
const cloud=options.cloud;
if(!root)throw new Error("Student workspace root is required.");

const SUPABASE_URL="https://nvefdkkjkyalpsrgoffj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_t0pqtkV0-3Wj0htl-eGR9w_BsifiUDE";
const STUDENTS_TABLE="mawaeidi_students";
const STUDENT_HISTORY_TABLE="mawaeidi_student_history";
const STUDENT_PHOTO_CLEANUP_TABLE="mawaeidi_student_photo_cleanup";
const TRASH_RETENTION_MS=30*24*60*60*1000;
const STUDENT_PHOTO_BUCKET="mawaeidi-student-photos";
const STUDENT_PHOTO_SIGNED_SECONDS=60*60;
const MAX_STUDENT_PHOTO_SOURCE_BYTES=10*1024*1024;
const MAX_STUDENT_PHOTO_STORED_BYTES=5*1024*1024;
const STUDENT_PHOTO_SIZE=512;
const STUDENT_PHOTO_TYPES=new Set(["image/jpeg","image/png","image/webp"]);
const MAX_IMPORT_BYTES=2*1024*1024;
const MAX_IMPORT_ROWS=2000;

const STATUS_OPTIONS=["حالي","سابق","متوقف مؤقتًا","جديد","غير محدد"];
const LEVEL_OPTIONS=["مبتدئ","متوسط","متقدم","غير محدد"];
const STUDY_TYPE_OPTIONS=["فردي","مجموعة","غير محدد"];

const STUDENT_FIELDS=[
  {key:"username",label:"اسم المستخدم على الموقع",required:true,max:120},
  {key:"login_password",label:"كلمة السر",type:"password",max:240},
  {key:"first_name",label:"الاسم الأول",required:true,max:120},
  {key:"last_name",label:"اسم العائلة",max:120},
  {key:"country",label:"الدولة",max:120},
  {key:"status",label:"حالة الطالب",options:STATUS_OPTIONS},
  {key:"institute",label:"الجهة / المعهد",max:160},
  {key:"study_group",label:"المجموعة الدراسية",max:160},
  {key:"distinguishing_mark",label:"علامة مميزة",max:160},
  {key:"email",label:"البريد الإلكتروني",type:"email",max:254},
  {key:"whatsapp",label:"واتساب",type:"tel",max:80},
  {key:"current_level",label:"المستوى الحالي",options:LEVEL_OPTIONS},
  {key:"study_type",label:"نوع الدراسة",options:STUDY_TYPE_OPTIONS},
  {key:"course_book",label:"الدورة / الكتاب",max:240,span:2},
  {key:"communication_language",label:"لغة التواصل",max:120},
  {key:"joined_on",label:"تاريخ الانضمام",type:"date"},
  {key:"educational_notes",label:"ملاحظات تعليمية",textarea:true,max:20000,span:3},
  {key:"student_account_url",label:"رابط حساب الطالب",type:"url",max:2048,span:2}
];
const STUDENT_FIELD_GROUPS=[
  {title:"البيانات الأساسية",hint:"الاسم والحالة والمكان",keys:["first_name","last_name","username","login_password","country","status"]},
  {title:"بيانات الدراسة",hint:"المستوى والكتاب والجهة",keys:["current_level","study_type","course_book","institute","study_group","joined_on"]},
  {title:"التواصل والحساب",hint:"وسائل الوصول إلى الطالب",keys:["whatsapp","email","communication_language","student_account_url"]},
  {title:"ملاحظاتك",hint:"معلومات تساعدك على تذكّر الطالب",keys:["distinguishing_mark","educational_notes"]}
];
const CSV_HEADERS=STUDENT_FIELDS.map(field=>field.label);
const CSV_KEY_BY_HEADER=Object.fromEntries(STUDENT_FIELDS.map(field=>[field.label,field.key]));

let mode="gate";
let accountSequence=0;
let currentUser=null;
let students=[];
let summaryLoaded=false;
let trashedStudents=[];
let listMode="active";
let filteredStudents=[];
let editingStudentId=null;
let activeStudentId=null;
let importPlan=null;
let toastTimer=null;
let initialRouteHandled=false;
let cloudLoadSequence=0;
let pendingStudentPhoto=null;
let removeStudentPhotoRequested=false;
let originalStudentPhotoPath="";
let originalStudentPhotoUrl="";
let photoSelectionSequence=0;


function byId(id){return root.querySelector(`#${id}`)}
function text(value){return value===null||value===undefined?"":String(value)}
function clean(value,max=20000){return text(value).trim().slice(0,max)}
function clone(value){return JSON.parse(JSON.stringify(value))}
function makeId(){
  if(window.crypto&&typeof window.crypto.randomUUID==="function")return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,char=>{
    const random=Math.random()*16|0;
    return (char==="x"?random:(random&3|8)).toString(16);
  });
}
function todayKey(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const map=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}
function dateLabel(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text(value)))return "—";
  const date=new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(date);
}
function safeUrl(value){
  try{
    const url=new URL(text(value));
    return ["http:","https:"].includes(url.protocol)?url.href:"";
  }catch{return ""}
}
function safePhotoUrl(value){
  const candidate=text(value).trim();
  if(/^data:image\/(?:jpeg|png|webp);base64,/i.test(candidate))return candidate;
  try{
    const url=new URL(candidate);
    return ["http:","https:","blob:"].includes(url.protocol)?url.href:"";
  }catch{return ""}
}
function escapeHtml(value){
  return text(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function normalizeKey(value){return clean(value,240).toLocaleLowerCase("ar").replace(/\s+/g," ")}
function studentName(student){return [student.first_name,student.last_name].filter(Boolean).join(" ")||"دون اسم"}
function normalizeStudent(value={}){
  const result={};
  for(const field of STUDENT_FIELDS){
    const max=field.max||240;
    let fieldValue=clean(value[field.key],max);
    if(field.key==="joined_on"&&!/^\d{4}-\d{2}-\d{2}$/.test(fieldValue))fieldValue="";
    result[field.key]=fieldValue;
  }
  if(!STATUS_OPTIONS.includes(result.status))result.status="غير محدد";
  if(!LEVEL_OPTIONS.includes(result.current_level))result.current_level="غير محدد";
  if(!STUDY_TYPE_OPTIONS.includes(result.study_type))result.study_type="غير محدد";
  result.id=clean(value.id,80)||makeId();
  result.deleted_at=clean(value.deleted_at,50);
  result.photo_path=clean(value.photo_path,1024);
  result.photo_url=safePhotoUrl(value.photo_url);
  result.created_at=clean(value.created_at,50)||new Date().toISOString();
  result.updated_at=clean(value.updated_at,50)||result.created_at;
  return result;
}
function setBusy(button,busy,busyText="جارٍ الحفظ…"){
  if(!button)return;
  if(busy){button.dataset.label=button.textContent;button.textContent=busyText;button.disabled=true}
  else{button.textContent=button.dataset.label||button.textContent;button.disabled=false}
}
function showToast(message,isError=false){
  const box=byId("toast");
  box.textContent=message;
  box.classList.toggle("error",isError);
  box.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>box.classList.remove("show"),3600);
}
function setMessage(id,message,isError=true){
  const box=byId(id);
  box.textContent=message;
  box.classList.toggle("success",!isError&&Boolean(message));
}
function openDialog(id){
  const dialog=byId(id);
  if(dialog.open)dialog.close();
  dialog.showModal();
}
function closeDialog(id){
  const dialog=byId(id);
  if(dialog?.open)dialog.close();
  if(id==="studentEditor"){
    photoSelectionSequence++;
    pendingStudentPhoto=null;
    removeStudentPhotoRequested=false;
    originalStudentPhotoPath="";
    originalStudentPhotoUrl="";
  }
}

function buildStudentForm(){
  const target=byId("studentFields");
  target.replaceChildren();
  const fieldsByKey=new Map(STUDENT_FIELDS.map(field=>[field.key,field]));
  for(const group of STUDENT_FIELD_GROUPS){
    const section=document.createElement("section");
    section.className="form-section";
    const heading=document.createElement("header");
    heading.className="form-section-head";
    const title=document.createElement("h3");title.textContent=group.title;
    const hint=document.createElement("p");hint.textContent=group.hint;
    heading.append(title,hint);
    const grid=document.createElement("div");
    grid.className="form-grid";
    for(const key of group.keys){
      const field=fieldsByKey.get(key);
      if(!field)continue;
      const wrapper=document.createElement("div");
      wrapper.className=`field${field.span?` span-${field.span}`:""}`;
      const label=document.createElement("label");
      label.htmlFor=`student_${field.key}`;
      label.textContent=field.label+(field.required?" *":"");
      let input;
      if(field.textarea){
        input=document.createElement("textarea");
      }else if(field.options){
        input=document.createElement("select");
        for(const optionValue of field.options){
          const option=document.createElement("option");
          option.value=optionValue;
          option.textContent=optionValue;
          input.append(option);
        }
      }else{
        input=document.createElement("input");
        input.type=field.type||"text";
        if(field.max)input.maxLength=field.max;
      }
      input.id=`student_${field.key}`;
      input.name=field.key;
      input.className="control";
      input.required=Boolean(field.required);
      if(field.type==="password")input.autocomplete="new-password";
      if(field.key==="whatsapp")input.inputMode="tel";
      wrapper.append(label,input);
      grid.append(wrapper);
    }
    section.append(heading,grid);
    target.append(section);
  }
}
function populateStaticOptions(){
  const maps=[
    ["statusFilter",STATUS_OPTIONS],
    ["levelFilter",LEVEL_OPTIONS],
    ["typeFilter",STUDY_TYPE_OPTIONS]
  ];
  for(const [id,options] of maps){
    const select=byId(id);
    for(const value of options){
      const option=document.createElement("option");
      option.value=value;option.textContent=value;select.append(option);
    }
  }
}
function refreshCountryFilter(){
  const select=byId("countryFilter");
  const previous=select.value;
  const countries=[...new Set((listMode==="trash"?trashedStudents:students).map(student=>student.country).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
  select.replaceChildren(new Option("كل الدول",""));
  for(const country of countries)select.append(new Option(country,country));
  select.value=countries.includes(previous)?previous:"";
}
function statusChipClass(value){
  return value==="حالي"?"current":value==="جديد"?"new":value==="متوقف مؤقتًا"?"paused":value==="سابق"?"previous":"";
}
function currentFilters(){
  return {
    query:normalizeKey(byId("search").value),
    status:byId("statusFilter").value,
    level:byId("levelFilter").value,
    type:byId("typeFilter").value,
    country:byId("countryFilter").value,
    sort:byId("sortStudents").value
  };
}
function filterAndSortStudents(source=students){
  const filters=currentFilters();
  const list=source.filter(student=>{
    const searchable=normalizeKey(STUDENT_FIELDS.map(field=>student[field.key]).join(" "));
    return (!filters.query||searchable.includes(filters.query))
      &&(!filters.status||student.status===filters.status)
      &&(!filters.level||student.current_level===filters.level)
      &&(!filters.type||student.study_type===filters.type)
      &&(!filters.country||student.country===filters.country);
  });
  list.sort((a,b)=>{
    if(filters.sort==="name")return studentName(a).localeCompare(studentName(b),"ar");
    if(filters.sort==="joined")return text(b.joined_on).localeCompare(text(a.joined_on))||studentName(a).localeCompare(studentName(b),"ar");
    if(filters.sort==="status")return a.status.localeCompare(b.status,"ar")||studentName(a).localeCompare(studentName(b),"ar");
    return text(b.created_at).localeCompare(text(a.created_at));
  });
  return list;
}
function makeButton(label,action,id,danger=false){
  const button=document.createElement("button");
  button.type="button";
  button.className=`btn small${danger?" danger":""}`;
  button.textContent=label;
  button.dataset.action=action;
  button.dataset.id=id;
  return button;
}
function studentInitials(student){
  return [student.first_name,student.last_name].filter(Boolean).map(value=>text(value).trim().charAt(0)).join("").slice(0,2)||"ط";
}
function setAvatarContent(element,student,url=student?.photo_url){
  element.replaceChildren();
  const photoUrl=safePhotoUrl(url);
  const fallback=()=>{
    const initials=document.createElement("span");
    initials.textContent=studentInitials(student||{});
    element.replaceChildren(initials);
  };
  if(!photoUrl){fallback();return}
  const image=document.createElement("img");
  image.src=photoUrl;
  image.alt="";
  image.addEventListener("error",fallback,{once:true});
  element.append(image);
}
function validateStudentPhotoFile(file){
  if(!file)return "اختر صورة أولًا.";
  if(!STUDENT_PHOTO_TYPES.has(text(file.type).toLowerCase()))return "الصورة يجب أن تكون JPG أو PNG أو WebP.";
  if(!Number.isFinite(Number(file.size))||Number(file.size)<=0)return "ملف الصورة غير صالح.";
  if(Number(file.size)>MAX_STUDENT_PHOTO_SOURCE_BYTES)return "حجم الصورة أكبر من 10 ميجابايت.";
  return "";
}
async function decodeStudentPhoto(file){
  if(typeof window.createImageBitmap==="function"){
    try{
      const bitmap=await window.createImageBitmap(file,{imageOrientation:"from-image"});
      return {image:bitmap,width:bitmap.width,height:bitmap.height,release:()=>bitmap.close?.()};
    }catch{
      const bitmap=await window.createImageBitmap(file);
      return {image:bitmap,width:bitmap.width,height:bitmap.height,release:()=>bitmap.close?.()};
    }
  }
  const objectUrl=URL.createObjectURL(file);
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve({image,width:image.naturalWidth,height:image.naturalHeight,release:()=>URL.revokeObjectURL(objectUrl)});
    image.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error("decode_failed"))};
    image.src=objectUrl;
  });
}
function blobDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(text(reader.result));
    reader.onerror=()=>reject(reader.error||new Error("preview_failed"));
    reader.readAsDataURL(blob);
  });
}
async function prepareStudentPhoto(file){
  const validation=validateStudentPhotoFile(file);
  if(validation)throw new Error(validation);
  const decoded=await decodeStudentPhoto(file);
  try{
    if(!decoded.width||!decoded.height)throw new Error("تعذّر قراءة أبعاد الصورة.");
    const canvas=document.createElement("canvas");
    canvas.width=STUDENT_PHOTO_SIZE;
    canvas.height=STUDENT_PHOTO_SIZE;
    const context=canvas.getContext("2d",{alpha:false});
    if(!context)throw new Error("تعذّرت معالجة الصورة في هذا المتصفح.");
    const side=Math.min(decoded.width,decoded.height);
    const sourceX=(decoded.width-side)/2;
    const sourceY=(decoded.height-side)/2;
    context.fillStyle="#eef3f5";
    context.fillRect(0,0,STUDENT_PHOTO_SIZE,STUDENT_PHOTO_SIZE);
    context.drawImage(decoded.image,sourceX,sourceY,side,side,0,0,STUDENT_PHOTO_SIZE,STUDENT_PHOTO_SIZE);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.84));
    if(!blob)throw new Error("تعذّر تجهيز الصورة. جرّب صورة أخرى.");
    if(blob.size>MAX_STUDENT_PHOTO_STORED_BYTES)throw new Error("تعذّر ضغط الصورة إلى الحجم المناسب.");
    const type=STUDENT_PHOTO_TYPES.has(blob.type)?blob.type:"image/webp";
    const extension=type==="image/png"?"png":type==="image/jpeg"?"jpg":"webp";
    return {blob,previewUrl:await blobDataUrl(blob),type,extension,sourceName:clean(file.name,180)};
  }finally{decoded.release()}
}
function updateStudentPhotoEditor(){
  const firstName=byId("student_first_name")?.value||"";
  const lastName=byId("student_last_name")?.value||"";
  const fallbackStudent={first_name:firstName,last_name:lastName};
  const previewUrl=pendingStudentPhoto?.previewUrl||(!removeStudentPhotoRequested?originalStudentPhotoUrl:"");
  const safePreview=safePhotoUrl(previewUrl);
  const image=byId("studentPhotoImage"),initials=byId("studentPhotoInitials");
  image.hidden=!safePreview;
  initials.hidden=Boolean(safePreview);
  initials.textContent=studentInitials(fallbackStudent);
  image.src=safePreview||"";
  image.onerror=()=>{image.hidden=true;initials.hidden=false};
  const hasPhoto=Boolean(pendingStudentPhoto||(!removeStudentPhotoRequested&&(originalStudentPhotoPath||originalStudentPhotoUrl)));
  byId("studentPhotoPicker").textContent=hasPhoto?"تغيير الصورة":"اختيار صورة";
  byId("removeStudentPhoto").hidden=!hasPhoto;
  const meta=byId("studentPhotoMeta");
  meta.classList.remove("error");
  meta.textContent=pendingStudentPhoto
    ?"الصورة جاهزة وستُحفظ مع بيانات الطالب."
    :hasPhoto?"الصورة الحالية محفوظة بصورة خاصة.":"JPG أو PNG أو WebP · بحد أقصى 10 ميجابايت قبل المعالجة";
}
async function handleStudentPhotoSelection(file){
  const input=byId("studentPhotoInput");
  const validation=validateStudentPhotoFile(file);
  if(validation){
    const meta=byId("studentPhotoMeta");meta.textContent=validation;meta.classList.add("error");
    input.value="";
    return;
  }
  const sequence=++photoSelectionSequence;
  const picker=byId("studentPhotoPicker");
  picker.classList.add("is-busy");picker.textContent="جارٍ تجهيز الصورة…";
  try{
    const prepared=await prepareStudentPhoto(file);
    if(sequence!==photoSelectionSequence)return;
    pendingStudentPhoto=prepared;
    removeStudentPhotoRequested=false;
    updateStudentPhotoEditor();
  }catch(error){
    console.error("Student photo preparation failed.",error);
    const meta=byId("studentPhotoMeta");meta.textContent=error?.message||"تعذّر تجهيز الصورة.";meta.classList.add("error");
  }finally{
    if(sequence===photoSelectionSequence)picker.classList.remove("is-busy");
    input.value="";
  }
}
function removeStudentPhotoFromEditor(){
  photoSelectionSequence++;
  pendingStudentPhoto=null;
  removeStudentPhotoRequested=Boolean(originalStudentPhotoPath||originalStudentPhotoUrl);
  updateStudentPhotoEditor();
  byId("studentPhotoMeta").textContent=removeStudentPhotoRequested?"ستُحذف الصورة عند حفظ التعديلات.":"لم تُضف صورة لهذا الطالب.";
}

function summarizeStudents(list){
  const active=Array.isArray(list)?list.filter(student=>student&&!student.deleted_at):[];
  const statusCounts=new Map(),levelCounts=new Map(),countryCounts=new Map();
  for(const student of active){
    const status=text(student.status).trim()||"غير محدد";
    const level=text(student.current_level).trim()||"غير محدد";
    const country=text(student.country).trim()||"غير محدد";
    statusCounts.set(status,(statusCounts.get(status)||0)+1);
    levelCounts.set(level,(levelCounts.get(level)||0)+1);
    countryCounts.set(country,(countryCounts.get(country)||0)+1);
  }
  const countryNames=[...countryCounts.keys()].filter(country=>country!=="غير محدد");
  const sortGroups=entries=>entries.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,"ar"));
  const levels=LEVEL_OPTIONS.map(label=>({label,count:levelCounts.get(label)||0}));
  const countries=sortGroups([...countryCounts].map(([label,count])=>({label,count})));
  return {
    total:active.length,
    current:statusCounts.get("حالي")||0,
    paused:statusCounts.get("متوقف مؤقتًا")||0,
    countryCount:countryNames.length,
    levels,
    countries
  };
}
function renderSummaryBreakdown(target,entries,total,emptyLabel){
  target.replaceChildren();
  if(!total){
    const empty=document.createElement("p");
    empty.className="student-insight-empty";
    empty.textContent=emptyLabel;
    target.append(empty);
    return;
  }
  for(const entry of entries){
    if(!entry.count)continue;
    const row=document.createElement("div");
    row.className="student-insight-row";
    const heading=document.createElement("div");heading.className="student-insight-row-heading";
    const label=document.createElement("span");label.textContent=entry.label;
    const count=document.createElement("strong");count.textContent=String(entry.count);
    heading.append(label,count);
    const track=document.createElement("div");track.className="student-insight-track";
    track.setAttribute("role","img");
    const percentage=Math.round(entry.count/total*100);
    track.setAttribute("aria-label",`${entry.label}: ${entry.count} من ${total} طالب (${percentage}٪)`);
    const bar=document.createElement("span");bar.className="student-insight-bar";
    bar.style.width=`${entry.count/total*100}%`;
    track.append(bar);
    row.append(heading,track);
    target.append(row);
  }
}
function renderStudentSummary(){
  const section=byId("studentSummary");
  section.hidden=!summaryLoaded||mode!=="cloud"||!currentUser;
  if(section.hidden)return;
  const summary=summarizeStudents(students);
  byId("studentStatTotal").textContent=String(summary.total);
  byId("studentStatCurrent").textContent=String(summary.current);
  byId("studentStatPaused").textContent=String(summary.paused);
  byId("studentStatCountries").textContent=String(summary.countryCount);
  renderSummaryBreakdown(byId("studentLevelsBreakdown"),summary.levels,summary.total,"لا توجد بيانات للمستويات بعد.");
  renderSummaryBreakdown(byId("studentCountriesBreakdown"),summary.countries,summary.total,"لا توجد بيانات للدول بعد.");
}

function renderStudents(){
  refreshCountryFilter();
  filteredStudents=filterAndSortStudents(students);
  byId("resultsCount").textContent=filteredStudents.length===students.length?`${students.length} طالبًا`:`${filteredStudents.length} من ${students.length} طالبًا`;
  const body=byId("studentRows");
  body.replaceChildren();
  for(const student of filteredStudents){
    const row=document.createElement("article");
    row.className="student-row";
    row.setAttribute("role","listitem");

    const open=document.createElement(listMode==="trash"?"div":"button");
    open.className="student-open";
    if(listMode!=="trash"){
      open.type="button";open.dataset.action="view";open.dataset.id=student.id;
      open.setAttribute("aria-label",`عرض بيانات ${studentName(student)}`);
    }
    const avatar=document.createElement("span");avatar.className="student-avatar";avatar.setAttribute("aria-hidden","true");setAvatarContent(avatar,student);
    const identity=document.createElement("span");identity.className="student-identity";
    const name=document.createElement("strong");name.className="student-name";name.textContent=studentName(student);
    const username=document.createElement("span");username.className="student-sub";username.textContent=student.username?`@${student.username}`:"من دون اسم مستخدم";
    identity.append(name,username);
    const study=document.createElement("span");study.className="student-study";
    const course=document.createElement("strong");course.textContent=student.course_book||"لا توجد دورة مسجلة";
    const details=document.createElement("span");
    details.textContent=listMode==="trash"
      ?`محذوف منذ ${new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short",year:"numeric"}).format(new Date(student.deleted_at))} · ${Math.max(0,Math.ceil((Date.parse(student.deleted_at)+TRASH_RETENTION_MS-Date.now())/86400000))} يوم متبقٍ`
      :[student.country,student.current_level].filter(Boolean).join(" · ")||"لا توجد تفاصيل إضافية";
    study.append(course,details);
    const status=document.createElement("span");status.className=`chip ${statusChipClass(student.status)}`;status.textContent=student.status||"غير محدد";
    open.append(avatar,identity,study,status);

    const actionWrap=document.createElement("div");actionWrap.className="row-actions";
    if(listMode==="trash"){
      actionWrap.append(makeButton("استعادة","restore",student.id),makeButton("حذف نهائي","purge",student.id,true));
    }else{
      const edit=makeButton("تعديل","edit",student.id);edit.classList.add("edit-student");
      actionWrap.append(edit);
    }
    row.append(open,actionWrap);
    body.append(row);
  }
  const empty=!filteredStudents.length;
  byId("tableWrap").hidden=empty;
  byId("emptyState").hidden=!empty;
}
function renderAll(){renderStudents();renderStudentSummary()}

function profileDetails(rows){
  return rows.map(([label,value,wide=false])=>`<div class="detail-item${wide?" wide":""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value||"—")}</strong></div>`).join("");
}
function profileContacts(student){
  const rows=[];
  if(student.email)rows.push(`<div class="contact-row"><span>البريد الإلكتروني</span><strong>${escapeHtml(student.email)}</strong><a href="mailto:${encodeURIComponent(student.email)}">إرسال بريد</a></div>`);
  const digits=student.whatsapp.replace(/\D/g,"");
  if(digits)rows.push(`<div class="contact-row"><span>واتساب</span><strong>${escapeHtml(student.whatsapp)}</strong><a href="https://wa.me/${digits}" target="_blank" rel="noopener">فتح واتساب</a></div>`);
  const account=safeUrl(student.student_account_url);
  if(account)rows.push(`<div class="contact-row"><span>رابط حساب الطالب</span><strong>${escapeHtml(student.student_account_url)}</strong><a href="${escapeHtml(account)}" target="_blank" rel="noopener">فتح الحساب</a></div>`);
  return rows.length?rows.join(""):'<div class="empty-mini">لا توجد وسائل اتصال مسجّلة.</div>';
}
function renderProfile(){
  const student=students.find(item=>item.id===activeStudentId);
  if(!student){closeDialog("studentProfile");return}
  setAvatarContent(byId("profileAvatar"),student);
  byId("profileTitle").textContent=studentName(student);
  byId("profileSubtitle").textContent=`@${student.username} · ${student.country||"الدولة غير محددة"}`;
  const basic=[
    ["اسم المستخدم",student.username],
    ["كلمة السر",student.login_password],
    ["الدولة",student.country],
    ["الحالة",student.status],
    ["تاريخ الانضمام",student.joined_on?dateLabel(student.joined_on):""]
  ];
  const study=[
    ["المستوى الحالي",student.current_level],
    ["نوع الدراسة",student.study_type],
    ["الدورة / الكتاب",student.course_book,true],
    ["الجهة / المعهد",student.institute],
    ["المجموعة الدراسية",student.study_group],
    ["لغة التواصل",student.communication_language]
  ];
  const notes=[
    ["علامة مميزة",student.distinguishing_mark],
    ["ملاحظات تعليمية",student.educational_notes,true]
  ];
  byId("profileContent").innerHTML=`
    <div class="profile-layout">
      <section class="profile-section">
        <header class="profile-section-head"><h3>بيانات أساسية</h3><span>المعلومات المسجلة</span></header>
        <div class="detail-grid">${profileDetails(basic)}</div>
      </section>
      <section class="profile-section">
        <header class="profile-section-head"><h3>بيانات الدراسة</h3><span>التفاصيل التعليمية</span></header>
        <div class="detail-grid">${profileDetails(study)}</div>
      </section>
      <section class="profile-section">
        <header class="profile-section-head"><h3>التواصل والحساب</h3><span>روابط سريعة</span></header>
        <div class="contact-actions">${profileContacts(student)}</div>
      </section>
      <section class="profile-section">
        <header class="profile-section-head"><h3>ملاحظاتك</h3><span>للتذكّر السريع</span></header>
        <div class="detail-grid">${profileDetails(notes)}</div>
      </section>
    </div>`;
}
function openProfile(id){
  const student=students.find(item=>item.id===id);
  if(!student)return;
  activeStudentId=id;
  renderProfile();
  openDialog("studentProfile");
}

function openStudentEditor(student=null){
  editingStudentId=student?.id||null;
  photoSelectionSequence++;
  pendingStudentPhoto=null;
  removeStudentPhotoRequested=false;
  originalStudentPhotoPath=clean(student?.photo_path,1024);
  originalStudentPhotoUrl=safePhotoUrl(student?.photo_url);
  byId("studentPhotoInput").value="";
  byId("studentEditorTitle").textContent=student?"تعديل بيانات الطالب":"إضافة طالب جديد";
  for(const field of STUDENT_FIELDS){
    const input=byId(`student_${field.key}`);
    input.value=student?.[field.key]??(field.options?"غير محدد":"");
  }
  updateStudentPhotoEditor();
  setMessage("studentFormMessage","");
  closeDialog("studentProfile");
  openDialog("studentEditor");
  setTimeout(()=>byId("student_username").focus(),0);
}
function readStudentForm(){
  const result={};
  for(const field of STUDENT_FIELDS)result[field.key]=clean(byId(`student_${field.key}`).value,field.max||20000);
  result.status=STATUS_OPTIONS.includes(result.status)?result.status:"غير محدد";
  result.current_level=LEVEL_OPTIONS.includes(result.current_level)?result.current_level:"غير محدد";
  result.study_type=STUDY_TYPE_OPTIONS.includes(result.study_type)?result.study_type:"غير محدد";
  return result;
}
function validateStudent(student){
  if(!student.username)return "اسم المستخدم مطلوب.";
  if(!student.first_name)return "الاسم الأول مطلوب.";
  if(students.some(item=>item.id!==editingStudentId&&normalizeKey(item.username)===normalizeKey(student.username)))return "اسم المستخدم موجود بالفعل.";
  if(trashedStudents.some(item=>item.id!==editingStudentId&&normalizeKey(item.username)===normalizeKey(student.username)))return "اسم المستخدم موجود في سلة المحذوفات. استعد الطالب أولًا أو احذفه نهائيًا.";
  if(student.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email))return "اكتب بريدًا إلكترونيًا صحيحًا أو اتركه فارغًا.";
  if(student.student_account_url&&!safeUrl(student.student_account_url))return "رابط حساب الطالب يجب أن يبدأ بـ http أو https.";
  if(student.joined_on&&!/^\d{4}-\d{2}-\d{2}$/.test(student.joined_on))return "تاريخ الانضمام غير صحيح.";
  return "";
}
function photoPathBelongsToCurrentUser(path){
  return Boolean(currentUser?.id)&&clean(path,1024).startsWith(`${currentUser.id}/`);
}
function createStudentPhotoPath(studentId,extension="webp"){
  const token=makeId();
  return `${currentUser.id}/${studentId}/${Date.now()}-${token}.${extension}`;
}
async function signStudentPhoto(path){
  if(!cloud||!path)return "";
  const {data,error}=await cloud.storage.from(STUDENT_PHOTO_BUCKET).createSignedUrl(path,STUDENT_PHOTO_SIGNED_SECONDS);
  if(error){console.warn("Student photo signing failed.",error);return ""}
  return safePhotoUrl(data?.signedUrl);
}
async function hydrateStudentPhotos(records){
  const normalized=(records||[]).map(normalizeStudent);
  if(!cloud||!currentUser||mode!=="cloud")return normalized;
  const paths=[...new Set(normalized.map(student=>student.photo_path).filter(Boolean))];
  if(!paths.length)return normalized;
  const {data,error}=await cloud.storage.from(STUDENT_PHOTO_BUCKET).createSignedUrls(paths,STUDENT_PHOTO_SIGNED_SECONDS);
  if(error){console.warn("Student photos could not be signed.",error);return normalized}
  const urls=new Map((data||[]).map(item=>[item.path,safePhotoUrl(item.signedUrl)]));
  return normalized.map(student=>normalizeStudent({...student,photo_url:urls.get(student.photo_path)||""}));
}
async function applyCloudStudentPhoto(savedStudent,previousStudent){
  let saved=normalizeStudent({...savedStudent,photo_url:previousStudent?.photo_url||""});
  const previousPath=originalStudentPhotoPath||clean(previousStudent?.photo_path,1024);
  let cleanupWarning=false;
  if(pendingStudentPhoto){
    const nextPath=createStudentPhotoPath(saved.id,pendingStudentPhoto.extension);
    const bucket=cloud.storage.from(STUDENT_PHOTO_BUCKET);
    const upload=await bucket.upload(nextPath,pendingStudentPhoto.blob,{
      contentType:pendingStudentPhoto.blob.type||pendingStudentPhoto.type,
      cacheControl:"3600",
      upsert:false
    });
    if(upload.error)throw upload.error;
    const response=await cloud.from(STUDENTS_TABLE).update({photo_path:nextPath}).eq("id",saved.id).select("*").single();
    if(response.error){
      await bucket.remove([nextPath]);
      throw response.error;
    }
    saved=normalizeStudent({...response.data,photo_url:await signStudentPhoto(nextPath)});
    if(previousPath&&previousPath!==nextPath&&photoPathBelongsToCurrentUser(previousPath)){
      const cleanup=await bucket.remove([previousPath]);
      if(cleanup.error){cleanupWarning=true;console.warn("Old student photo cleanup failed.",cleanup.error)}
    }
  }else if(removeStudentPhotoRequested&&previousPath){
    if(!photoPathBelongsToCurrentUser(previousPath))throw new Error("invalid_photo_path");
    const bucket=cloud.storage.from(STUDENT_PHOTO_BUCKET);
    const response=await cloud.from(STUDENTS_TABLE).update({photo_path:null}).eq("id",saved.id).select("*").single();
    if(response.error)throw response.error;
    saved=normalizeStudent({...response.data,photo_path:"",photo_url:""});
    const removal=await bucket.remove([previousPath]);
    if(removal.error){
      cleanupWarning=true;
      console.warn("Detached student photo queued for cleanup.",removal.error);
    }
  }
  return {saved,cleanupWarning};
}
async function saveStudentRecord(event){
  event.preventDefault();
  const draft=readStudentForm();
  const validation=validateStudent(draft);
  if(validation){setMessage("studentFormMessage",validation);return}
  const wasEditing=Boolean(editingStudentId);
  const previousStudent=students.find(item=>item.id===editingStudentId)||null;
  const operationAccountSequence=accountSequence;
  const operationUserId=currentUser?.id;
  const button=byId("saveStudent");
  setBusy(button,true);
  setMessage("studentFormMessage","");
  try{
    let saved,cleanupWarning=false;
      if(!cloud||!currentUser)throw new Error("missing_session");
      const payload={...draft,user_id:currentUser.id,joined_on:draft.joined_on||null};
      let response;
      if(editingStudentId)response=await cloud.from(STUDENTS_TABLE).update(payload).eq("id",editingStudentId).select("*").single();
      else response=await cloud.from(STUDENTS_TABLE).insert(payload).select("*").single();
      if(response.error)throw response.error;
      if(operationAccountSequence!==accountSequence||currentUser?.id!==operationUserId)return;
      saved=normalizeStudent({...response.data,photo_url:previousStudent?.photo_url||""});
      try{
        const photoResult=await applyCloudStudentPhoto(saved,previousStudent);
        if(operationAccountSequence!==accountSequence||currentUser?.id!==operationUserId)return;
        saved=photoResult.saved;
        cleanupWarning=photoResult.cleanupWarning;
      }catch(photoError){
        console.error("Student photo save failed.",photoError);
        const index=students.findIndex(item=>item.id===saved.id);
        if(index>=0)students[index]=saved;else students.unshift(saved);
        editingStudentId=saved.id;
        refreshCountryFilter();
        renderAll();
        setMessage("studentFormMessage","تم حفظ بيانات الطالب، لكن تعذّر حفظ الصورة. جرّب اختيارها مرة أخرى.");
        return;
      }
    {
      const index=students.findIndex(item=>item.id===saved.id);
      if(index>=0)students[index]=saved;else students.unshift(saved);
    }
    closeDialog("studentEditor");
    refreshCountryFilter();
    renderAll();
    showToast(cleanupWarning?"تم حفظ الملف والصورة، لكن تعذّر تنظيف نسخة الصورة القديمة.":wasEditing?"تم تحديث ملف الطالب.":"تم إنشاء ملف الطالب.",cleanupWarning);
  }catch(error){
    console.error("Student save failed.",error);
    const duplicate=error?.code==="23505";
    setMessage("studentFormMessage",duplicate?"اسم المستخدم موجود بالفعل في هذا الحساب.":"تعذّر حفظ ملف الطالب في حسابك.");
  }finally{setBusy(button,false)}
}
async function deleteActiveStudent(){
  const student=students.find(item=>item.id===activeStudentId);
  if(!student||!currentUser||mode!=="cloud")return;
  if(!confirm(`نقل ملف ${studentName(student)} إلى سلة المحذوفات؟ يمكنك استعادته مع صورته خلال 30 يومًا.`))return;
  const operationAccountSequence=accountSequence,operationUserId=currentUser.id;
  const button=byId("deleteStudent");
  setBusy(button,true,"جارٍ النقل…");
  try{
    const {data,error}=await cloud.from(STUDENTS_TABLE).update({deleted_at:new Date().toISOString()}).eq("id",student.id).is("deleted_at",null).select("*").single();
    if(error)throw error;
    if(operationAccountSequence!==accountSequence||currentUser?.id!==operationUserId)return;
    students=students.filter(item=>item.id!==student.id);
    trashedStudents.unshift(normalizeStudent({...data,photo_url:student.photo_url}));
    closeDialog("studentProfile");
    activeStudentId=null;
    renderAll();
    showToast("تم نقل الطالب إلى السلة مع الاحتفاظ بصورته.");
  }catch(error){
    console.error("Student move to trash failed.",error);
    showToast("تعذّر نقل الطالب إلى سلة المحذوفات.",true);
  }finally{setBusy(button,false)}
}
function isTrashExpired(student){
  const deleted=Date.parse(student?.deleted_at||"");
  return Number.isFinite(deleted)&&deleted+TRASH_RETENTION_MS<=Date.now();
}
function selectListMode(nextMode){
  listMode=nextMode==="trash"?"trash":"active";
  clearFilters();
  renderStudents();
}
async function restoreTrashedStudent(id,button=null){
  const student=trashedStudents.find(item=>item.id===id);
  if(!student||!currentUser)return;
  if(isTrashExpired(student)){showToast("انتهت مدة الاستعادة (30 يومًا).",true);return}
  const sequence=accountSequence,userId=currentUser.id;
  setBusy(button,true,"جارٍ الاستعادة…");
  try{
    const {data,error}=await cloud.from(STUDENTS_TABLE).update({deleted_at:null}).eq("id",id).not("deleted_at","is",null).select("*").single();
    if(error)throw error;
    if(sequence!==accountSequence||currentUser?.id!==userId)return;
    trashedStudents=trashedStudents.filter(item=>item.id!==id);
    students.unshift(normalizeStudent({...data,photo_url:student.photo_url}));
    renderAll();
    showToast(`تمت استعادة ${studentName(student)} مع صورته.`);
  }catch(error){
    console.error("Student restore failed.",error);
    showToast("تعذّرت الاستعادة. قد تكون مدة الاحتفاظ انتهت.",true);
  }finally{setBusy(button,false)}
}
async function cleanupDeletedStudentPhotos(){
  if(!cloud||!currentUser||mode!=="cloud")return 0;
  const userId=currentUser.id;
  const {data,error}=await cloud.from(STUDENT_PHOTO_CLEANUP_TABLE).select("id,photo_path").limit(100);
  if(error){console.warn("Student photo cleanup queue unavailable.",error);return 1}
  let failed=0;
  for(const entry of data||[]){
    if(currentUser?.id!==userId)break;
    if(!photoPathBelongsToCurrentUser(entry.photo_path)){failed++;continue}
    try{
      const removal=await cloud.storage.from(STUDENT_PHOTO_BUCKET).remove([entry.photo_path]);
      if(removal.error)throw removal.error;
      const deleted=await cloud.from(STUDENT_PHOTO_CLEANUP_TABLE).delete().eq("id",entry.id);
      if(deleted.error)throw deleted.error;
    }catch(error){failed++;console.warn("Student photo cleanup retry pending.",error)}
  }
  return failed;
}
async function permanentlyDeleteTrashedStudent(id,button=null,automatic=false){
  const student=trashedStudents.find(item=>item.id===id);
  if(!student||!currentUser)return false;
  if(!automatic&&!confirm(`حذف ${studentName(student)} نهائيًا؟ ستُحذف جميع بياناته ولن يمكن استعادتها.`))return false;
  const sequence=accountSequence,userId=currentUser.id;
  setBusy(button,true,"جارٍ الحذف النهائي…");
  try{
    const {data,error}=await cloud.from(STUDENTS_TABLE).delete().eq("id",id).not("deleted_at","is",null).select("id");
    if(error)throw error;
    if(!data?.length)throw new Error("Student not deleted.");
    if(sequence!==accountSequence||currentUser?.id!==userId)return false;
    trashedStudents=trashedStudents.filter(item=>item.id!==id);
    renderAll();
    if(!automatic){
      const pending=await cleanupDeletedStudentPhotos();
      showToast(pending?"حُذف الملف نهائيًا، وستُعاد محاولة تنظيف الصورة لاحقًا.":"حُذف الملف نهائيًا مع بياناته وصورته.",Boolean(pending));
    }
    return true;
  }catch(error){
    console.error("Student permanent deletion failed.",error);
    if(!automatic)showToast("تعذّر الحذف النهائي، وما زال الملف في السلة.",true);
    return false;
  }finally{setBusy(button,false)}
}
async function purgeExpiredTrash(){
  if(!trashedStudents.length||!currentUser)return;
  const expired=trashedStudents.filter(isTrashExpired);
  for(const student of expired){
    if(!currentUser)break;
    await permanentlyDeleteTrashedStudent(student.id,null,true);
  }
}
const HISTORY_ACTION_LABELS={created:"إضافة الطالب",updated:"تعديل البيانات",trashed:"نقل إلى السلة",restored:"استعادة الطالب",purged:"حذف نهائي"};
const HISTORY_FIELD_LABELS={...Object.fromEntries(STUDENT_FIELDS.map(field=>[field.key,field.label])),photo_path:"صورة الطالب",deleted_at:"سلة المحذوفات"};
function humanHistoryValue(value,key){
  if(key==="photo_path")return value?"توجد صورة":"لا توجد صورة";
  if(key==="deleted_at")return value?"في السلة":"نشط";
  if(value===null||value===undefined||value==="")return "—";
  return String(value).slice(0,600);
}
async function openStudentHistory(studentId=null){
  if(!currentUser||mode!=="cloud")return;
  const sequence=accountSequence,userId=currentUser.id;
  const all=[...students,...trashedStudents];
  const selected=studentId?all.find(item=>item.id===studentId):null;
  byId("studentHistoryTitle").textContent=selected?`سجل تعديلات ${studentName(selected)}`:"سجل تعديلات الطلاب";
  byId("studentHistoryContent").innerHTML='<div class="empty-mini">جارٍ تحميل سجل التعديلات…</div>';
  openDialog("studentHistory");
  try{
    let query=cloud.from(STUDENT_HISTORY_TABLE).select("student_id,student_name,action,changes,changed_at").order("changed_at",{ascending:false}).limit(studentId?100:150);
    if(studentId)query=query.eq("student_id",studentId);
    const {data,error}=await query;
    if(error)throw error;
    if(sequence!==accountSequence||currentUser?.id!==userId||!byId("studentHistory").open)return;
    const items=data||[];
    byId("studentHistoryContent").innerHTML=items.length?items.map(entry=>{
      const action=HISTORY_ACTION_LABELS[entry.action]||"تغيير";
      const date=new Date(entry.changed_at);
      const when=Number.isFinite(date.getTime())?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(date):"";
      const details=Object.entries(entry.changes&&typeof entry.changes==="object"?entry.changes:{}).map(([key,values])=>{
        const label=HISTORY_FIELD_LABELS[key]||key;
        if(key==="photo_path")return '<li>تم تغيير صورة الطالب</li>';
        const before=humanHistoryValue(values?.before,key),after=humanHistoryValue(values?.after,key);
        return `<li><strong>${escapeHtml(label)}:</strong> قبل: ${escapeHtml(before)}، بعد: ${escapeHtml(after)}</li>`;
      }).join("");
      return `<article class="student-history-item"><div class="student-history-head"><strong>${escapeHtml(action)}</strong><time>${escapeHtml(when)}</time></div><p>${escapeHtml(entry.student_name||"طالب")}</p>${details?`<ul>${details}</ul>`:""}</article>`;
    }).join(""):'<div class="empty-mini">لا توجد تعديلات مسجلة حتى الآن.</div>';
  }catch(error){
    console.error("Student history load failed.",error);
    if(sequence===accountSequence&&currentUser?.id===userId)byId("studentHistoryContent").innerHTML='<div class="import-errors">تعذّر تحميل سجل التعديلات.</div>';
  }
}

function setLoading(loading){
  byId("loadingState").hidden=!loading;
  byId("tableWrap").hidden=loading||!filteredStudents.length;
  byId("emptyState").hidden=loading||Boolean(filteredStudents.length);
  for(const id of ["refreshData","addStudent","importCsv","exportCsv"])byId(id).disabled=loading;
}
async function loadCloudData(showSuccess=false){
  if(!cloud||!currentUser)return false;
  const userId=currentUser.id,sequence=++cloudLoadSequence;
  setLoading(true);
  try{
    const studentsResponse=await cloud.from(STUDENTS_TABLE).select("*").order("created_at",{ascending:false});
    if(studentsResponse.error)throw studentsResponse.error;
    if(currentUser?.id!==userId||sequence!==cloudLoadSequence)return false;
    const records=await hydrateStudentPhotos(studentsResponse.data||[]);
    if(currentUser?.id!==userId||sequence!==cloudLoadSequence)return false;
    students=records.filter(student=>!student.deleted_at);
    trashedStudents=records.filter(student=>Boolean(student.deleted_at));
    summaryLoaded=true;
    refreshCountryFilter();
    renderAll();
    applyInitialRoute();
    await purgeExpiredTrash();
    if(currentUser?.id===userId&&sequence===cloudLoadSequence)await cleanupDeletedStudentPhotos();
    if(showSuccess)showToast("تم تحديث بيانات الطلاب.");
    return true;
  }catch(error){
    if(currentUser?.id!==userId||sequence!==cloudLoadSequence)return false;
    console.error("Cloud load failed.",error);
    showToast("تعذّر تحميل بيانات الطلاب.",true);
    return false;
  }finally{if(sequence===cloudLoadSequence)setLoading(false)}
}
function enterApp(){
  mode="cloud";
  byId("authGate").hidden=true;
  byId("app").hidden=false;
  byId("modeBadge").textContent="محفوظ في حسابك";
}
function applyInitialRoute(){
  if(initialRouteHandled||root.hidden)return;
  const params=new URLSearchParams(location.search);
  const studentId=clean(params.get("student"),80);
  const wantsNew=params.get("new")==="1";
  if(wantsNew){initialRouteHandled=true;openStudentEditor();return}
  if(studentId){
    const student=students.find(item=>item.id===studentId);
    if(student){initialRouteHandled=true;openProfile(student.id)}
  }
}
async function enterCloud(user){
  if(mode==="cloud"&&currentUser?.id===user?.id)return;
  if(currentUser?.id!==user?.id){closeAllDialogs();students=[];initialRouteHandled=false;}
  currentUser=user;
  enterApp("cloud");
  await loadCloudData();
}
async function exitCurrentMode(){
  const wasCloud=mode==="cloud";
  closeAllDialogs();
  if(wasCloud&&cloud)await cloud.auth.signOut();
  cloudLoadSequence++;
  mode="gate";currentUser=null;students=[];activeStudentId=null;initialRouteHandled=false;
  byId("app").hidden=true;
  byId("authGate").hidden=false;
  setAuthMode("signin");
  setMessage("authMessage",wasCloud?"تم تسجيل الخروج.":"",false);
}
function closeAllDialogs(){root.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close())}

function setAuthMode(){setMessage("authMessage","")}

function authRedirectUrl(){return ["http:","https:"].includes(location.protocol)?location.href.split(/[?#]/)[0]:undefined}
async function submitAuth(event){
  event.preventDefault();
  if(!cloud){setMessage("authMessage","تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.",true);return}
  const email=byId("authEmail").value.trim();
  const password=byId("authPassword").value;
  if(!email||!email.includes("@")){setMessage("authMessage","اكتب بريدًا إلكترونيًا صحيحًا.");return}
  if(password.length<6){setMessage("authMessage","كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.");return}
  const button=byId("authSubmit");
  setBusy(button,true,"جارٍ تسجيل الدخول…");
  try{
    const {data,error}=await cloud.auth.signInWithPassword({email,password});
    if(error)throw error;
    await enterCloud(data.user);
  }catch(error){
    console.error("Auth failed.",error);
    setMessage("authMessage","البريد أو كلمة المرور غير صحيحين.");
  }finally{setBusy(button,false)}
}
async function resetPassword(){
  if(!cloud){setMessage("authMessage","تعذّر تحميل اتصال Supabase.",true);return}
  const email=byId("authEmail").value.trim();
  if(!email||!email.includes("@")){setMessage("authMessage","اكتب بريدك أولًا لإرسال رابط الاستعادة.");return}
  const button=byId("passwordReset");
  button.disabled=true;
  try{
    const redirectTo=new URL("../index.html",location.href).href;
    const {error}=await cloud.auth.resetPasswordForEmail(email,{redirectTo});
    if(error)throw error;
    setMessage("authMessage","إن كان البريد مسجلًا فستصل إليه رسالة الاستعادة.",false);
  }catch(error){
    console.error("Password reset failed.",error);
    setMessage("authMessage","تعذّر إرسال رابط الاستعادة الآن.");
  }finally{button.disabled=false}
}

function csvEscape(value){
  let output=text(value);
  if(/^[=+\-@]/.test(output))output="'"+output;
  return `"${output.replace(/"/g,'""')}"`;
}
function buildStudentsCsv(list){
  const rows=[CSV_HEADERS.map(csvEscape).join(",")];
  for(const student of list)rows.push(STUDENT_FIELDS.map(field=>csvEscape(student[field.key]||"")).join(","));
  return "\uFEFF"+rows.join("\r\n");
}
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportFilteredCsv(){
  const list=filteredStudents.length?filteredStudents:[];
  if(!list.length){showToast("لا توجد نتائج لتصديرها.",true);return}
  const blob=new Blob([buildStudentsCsv(list)],{type:"text/csv;charset=utf-8"});
  downloadBlob(blob,`mawaeidi-students-${todayKey()}.csv`);
  showToast(`تم تصدير ${list.length} ملف طالب.`);
}

function backupSafeFilePart(value){
  return clean(value,80).normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu,"-").replace(/^-+|-+$/g,"").slice(0,60)||"student";
}
function backupPhotoExtension(path,mimeType){
  const extension=text(path).split(".").pop().toLowerCase();
  if(["jpg","jpeg","png","webp"].includes(extension))return extension==="jpeg"?"jpg":extension;
  if(mimeType==="image/png")return "png";
  if(mimeType==="image/webp")return "webp";
  return "jpg";
}
function backupStudentRecord(student,photoFile=""){
  const record={
    id:student.id,
    created_at:student.created_at||"",
    updated_at:student.updated_at||"",
    deleted_at:student.deleted_at||"",
    photo_file:photoFile
  };
  for(const field of STUDENT_FIELDS)record[field.key]=student[field.key]||"";
  return record;
}
function inspectBackupPhoto(bytes){
  if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_STUDENT_PHOTO_STORED_BYTES)throw new Error("invalid_backup_photo");
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return {mimeType:"image/jpeg",extension:"jpg"};
  if(bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a)return {mimeType:"image/png",extension:"png"};
  if(bytes.length>=12&&bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46&&bytes[8]===0x57&&bytes[9]===0x45&&bytes[10]===0x42&&bytes[11]===0x50)return {mimeType:"image/webp",extension:"webp"};
  throw new Error("invalid_backup_photo");
}
async function ensureBackupAccount(user,refresh=true){
  if(!cloud||!user?.id)throw new Error("backup_account_required");
  if(currentUser?.id!==user.id||mode!=="cloud"){
    const activated=await activate(user);
    if(!activated)throw new Error("student_data_unavailable");
  }else if(refresh){
    const refreshed=await loadCloudData();
    if(!refreshed)throw new Error("student_data_unavailable");
  }
  if(currentUser?.id!==user.id||mode!=="cloud")throw new Error("backup_account_changed");
  return {accountSequence,userId:user.id};
}
async function createBackupSnapshot(user){
  const operation=await ensureBackupAccount(user,true);
  const snapshot=[...students,...trashedStudents].map(student=>clone(student));
  const files=[];
  const photoFiles=new Map();
  const warnings=[];
  for(const student of snapshot){
    if(!student.photo_path)continue;
    if(operation.accountSequence!==accountSequence||currentUser?.id!==operation.userId)throw new Error("backup_account_changed");
    if(!photoPathBelongsToCurrentUser(student.photo_path)){
      warnings.push({id:student.id,username:student.username||"",reason:"invalid_path"});
      continue;
    }
    try{
      const {data,error}=await cloud.storage.from(STUDENT_PHOTO_BUCKET).download(student.photo_path);
      if(error||!data)throw error||new Error("missing_photo");
      if(operation.accountSequence!==accountSequence||currentUser?.id!==operation.userId)throw new Error("backup_account_changed");
      const extension=backupPhotoExtension(student.photo_path,data.type);
      const filename=`photos/students/${backupSafeFilePart(student.id)}-${backupSafeFilePart(student.username||studentName(student))}.${extension}`;
      photoFiles.set(student.id,filename);
      files.push({name:filename,data});
    }catch(error){
      if(error?.message==="backup_account_changed")throw error;
      console.warn("Student photo backup failed.",error);
      warnings.push({id:student.id,username:student.username||"",reason:"download_failed"});
    }
  }
  const records=snapshot.map(student=>backupStudentRecord(student,photoFiles.get(student.id)||""));
  return {
    manifest:{
      format:"mawaeidi-students",
      version:2,
      student_count:records.length,
      photo_count:photoFiles.size,
      missing_photo_count:warnings.length,
      photo_warnings:warnings,
      students:records
    },
    csv:buildStudentsCsv(snapshot),
    files,
    warnings
  };
}
function inspectBackupSnapshot(payload,entries=new Map()){
  const accepted=payload&&(
    (payload.format==="mawaeidi-students"&&payload.version===2)||
    (payload.format==="mawaeidi-students-backup"&&payload.version===1)
  );
  if(!accepted||!Array.isArray(payload.students))throw new Error("invalid_students_backup");
  if(payload.students.length>MAX_IMPORT_ROWS)throw new Error("too_many_students");
  if(!(entries instanceof Map))throw new Error("invalid_backup_entries");
  const seenUsernames=new Set();
  const items=[];
  let missingPhotoCount=0;
  for(const raw of payload.students){
    if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("invalid_student");
    const student=normalizeStudent(raw);
    const validation=validateImportedStudent(student,0);
    if(validation.length)throw new Error("invalid_student");
    const usernameKey=normalizeKey(student.username);
    if(seenUsernames.has(usernameKey))throw new Error("duplicate_student_username");
    seenUsernames.add(usernameKey);
    let photoFile=clean(raw.photo_file,1024);
    let photoData=null;
    let photoType=null;
    if(photoFile){
      if(!window.MawaeidiBackup)throw new Error("backup_tools_unavailable");
      window.MawaeidiBackup.safeEntryName(photoFile);
      if(!photoFile.startsWith("photos/"))throw new Error("invalid_backup_photo_path");
      if(!entries.has(photoFile)){
        missingPhotoCount++;
        photoFile="";
      }else{
        photoData=entries.get(photoFile);
        photoType=inspectBackupPhoto(photoData);
      }
    }
    items.push({student,photoFile,photoData,photoType});
  }
  return {
    format:payload.format,
    version:payload.version,
    items,
    studentCount:items.length,
    photoCount:items.filter(item=>item.photoData).length,
    missingPhotoCount
  };
}
async function restoreBackupSnapshot(plan,user){
  if(!plan||!Array.isArray(plan.items)||plan.items.length>MAX_IMPORT_ROWS)throw new Error("invalid_students_restore_plan");
  const operation=await ensureBackupAccount(user,true);
  const existingByName=new Map([...students,...trashedStudents].map(student=>[normalizeKey(student.username),student]));
  const now=new Date().toISOString();
  const prepared=plan.items.map(item=>{
    const student=normalizeStudent(item.student);
    if(validateImportedStudent(student,0).length)throw new Error("invalid_student");
    const existing=existingByName.get(normalizeKey(student.username))||null;
    const id=existing?.id||makeId();
    const payload={user_id:operation.userId,id};
    for(const field of STUDENT_FIELDS)payload[field.key]=field.key==="joined_on"?(student[field.key]||null):student[field.key];
    payload.created_at=existing?.created_at||(Number.isFinite(Date.parse(student.created_at))?student.created_at:now);
    payload.updated_at=now;
    payload.photo_path=existing?.photo_path||null;
    payload.deleted_at=existing?.deleted_at||student.deleted_at||null;
    return {...item,student,existing,id,payload};
  });

  const writable=prepared.filter(item=>!item.existing?.deleted_at);
  if(writable.length){
    const response=await cloud.from(STUDENTS_TABLE).upsert(writable.map(item=>item.payload),{onConflict:"id"}).select("*");
    if(response.error)throw response.error;
  }
  if(operation.accountSequence!==accountSequence||currentUser?.id!==operation.userId)throw new Error("backup_account_changed");

  let restoredPhotos=0;
  const photoFailures=[];
  for(const item of prepared){
    if(item.existing?.deleted_at||!item.photoData||!item.photoType)continue;
    if(operation.accountSequence!==accountSequence||currentUser?.id!==operation.userId)throw new Error("backup_account_changed");
    const path=createStudentPhotoPath(item.id,item.photoType.extension);
    const bucket=cloud.storage.from(STUDENT_PHOTO_BUCKET);
    try{
      const blob=new Blob([item.photoData],{type:item.photoType.mimeType});
      const upload=await bucket.upload(path,blob,{contentType:item.photoType.mimeType,cacheControl:"3600",upsert:false});
      if(upload.error)throw upload.error;
      if(operation.accountSequence!==accountSequence||currentUser?.id!==operation.userId)throw new Error("backup_account_changed");
      const update=await cloud.from(STUDENTS_TABLE).update({photo_path:path,updated_at:now}).eq("id",item.id).select("id").single();
      if(update.error){
        await bucket.remove([path]);
        throw update.error;
      }
      restoredPhotos++;
    }catch(error){
      if(error?.message==="backup_account_changed")throw error;
      console.warn("Student photo restore failed.",error);
      photoFailures.push({username:item.student.username,reason:"upload_failed"});
    }
  }
  const refreshed=await loadCloudData();
  if(operation.accountSequence!==accountSequence||currentUser?.id!==operation.userId)throw new Error("backup_account_changed");
  return {
    inserted:prepared.filter(item=>!item.existing).length,
    updated:prepared.filter(item=>item.existing&&!item.existing.deleted_at).length,
    skippedTrashed:prepared.filter(item=>item.existing?.deleted_at).length,
    restoredPhotos,
    photoFailures,
    refreshed
  };
}
function parseCsv(source){
  const rows=[];let row=[],cell="",quoted=false;
  const input=text(source).replace(/^\uFEFF/,"");
  for(let index=0;index<input.length;index++){
    const char=input[index],next=input[index+1];
    if(quoted){
      if(char==='"'&&next==='"'){cell+='"';index++}
      else if(char==='"')quoted=false;
      else cell+=char;
    }else if(char==='"')quoted=true;
    else if(char===","){row.push(cell);cell=""}
    else if(char==="\n"){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell=""}
    else cell+=char;
  }
  if(cell||row.length){row.push(cell.replace(/\r$/,""));rows.push(row)}
  if(quoted)throw new Error("unclosed_quote");
  return rows;
}
function validateImportedStudent(student,rowNumber){
  const errors=[];
  if(!student.username)errors.push(`الصف ${rowNumber}: اسم المستخدم مفقود.`);
  if(!student.first_name)errors.push(`الصف ${rowNumber}: الاسم الأول مفقود.`);
  if(student.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email))errors.push(`الصف ${rowNumber}: البريد الإلكتروني غير صحيح.`);
  if(student.student_account_url&&!safeUrl(student.student_account_url))errors.push(`الصف ${rowNumber}: رابط الحساب غير صحيح.`);
  if(student.joined_on&&!/^\d{4}-\d{2}-\d{2}$/.test(student.joined_on))errors.push(`الصف ${rowNumber}: تاريخ الانضمام غير صحيح.`);
  return errors;
}
async function prepareCsvImport(file){
  if(!file)return;
  if(file.size>MAX_IMPORT_BYTES){showToast("ملف CSV أكبر من 2 ميجابايت.",true);return}
  try{
    const rows=parseCsv(await file.text());
    if(rows.length<2)throw new Error("empty");
    const headers=rows[0].map(value=>clean(value.replace(/^'/,""),200));
    const missing=CSV_HEADERS.filter(header=>!headers.includes(header));
    if(missing.length){
      importPlan=null;
      byId("importContent").innerHTML=`<div class="import-errors"><strong>الأعمدة المطلوبة غير مكتملة:</strong><br>${missing.map(escapeHtml).join("<br>")}</div>`;
      byId("confirmImport").disabled=true;
      openDialog("importPreview");
      return;
    }
    const indexByKey=Object.fromEntries(STUDENT_FIELDS.map(field=>[field.key,headers.indexOf(field.label)]));
    const items=[],errors=[],seen=new Set();
    for(let index=1;index<rows.length;index++){
      const row=rows[index];
      if(row.every(value=>!clean(value)))continue;
      if(items.length>=MAX_IMPORT_ROWS){errors.push(`الحد الأقصى ${MAX_IMPORT_ROWS} طالب في الملف الواحد.`);break}
      const raw={};
      for(const field of STUDENT_FIELDS){
        let value=text(row[indexByKey[field.key]]).trim();
        if(/^'[=+\-@]/.test(value))value=value.slice(1);
        raw[field.key]=value;
      }
      const item=normalizeStudent(raw);
      const rowNumber=index+1;
      errors.push(...validateImportedStudent(item,rowNumber));
      const usernameKey=normalizeKey(item.username);
      if(usernameKey&&seen.has(usernameKey))errors.push(`الصف ${rowNumber}: اسم المستخدم مكرر داخل الملف.`);
      seen.add(usernameKey);
      items.push(item);
    }
    const trashedNames=new Set(trashedStudents.map(item=>normalizeKey(item.username)));
    for(const item of items)if(trashedNames.has(normalizeKey(item.username)))errors.push(`اسم المستخدم ${item.username} موجود في السلة؛ استعده أولًا قبل الاستيراد.`);
    const existingNames=new Set(students.map(item=>normalizeKey(item.username)));
    const updates=items.filter(item=>existingNames.has(normalizeKey(item.username))).length;
    importPlan={items,errors,updates,creates:items.length-updates};
    byId("importContent").innerHTML=`
      <div class="import-summary">
        <article><span>إجمالي الصفوف</span><strong>${items.length}</strong></article>
        <article><span>ملفات جديدة</span><strong>${importPlan.creates}</strong></article>
        <article><span>ملفات ستُحدّث</span><strong>${updates}</strong></article>
      </div>
      ${errors.length?`<div class="import-errors"><strong>يجب إصلاح الأخطاء قبل الاستيراد:</strong><br>${errors.map(escapeHtml).join("<br>")}</div>`:'<div class="import-note">الملف سليم. يطابق الاستيراد الطلاب باسم المستخدم؛ فيحدّث الملف الموجود أو ينشئ ملفًا جديدًا، ولا يحذف أي طالب غير موجود في CSV.</div>'}`;
    byId("confirmImport").disabled=Boolean(errors.length)||!items.length;
    openDialog("importPreview");
  }catch(error){
    console.error("CSV parsing failed.",error);
    showToast("تعذّر قراءة CSV. تأكد من حفظه بترميز UTF-8.",true);
  }finally{byId("csvFile").value=""}
}
async function confirmCsvImport(){
  if(!importPlan||importPlan.errors.length||!importPlan.items.length)return;
  const operationAccountSequence=accountSequence;
  const operationUserId=currentUser?.id;
  const button=byId("confirmImport");
  setBusy(button,true,"جارٍ الاستيراد…");
  try{
    const existingByName=new Map(students.map(item=>[normalizeKey(item.username),item]));
    const now=new Date().toISOString();
    const payload=importPlan.items.map(item=>{
      const existing=existingByName.get(normalizeKey(item.username));
      return normalizeStudent({...item,id:existing?.id||makeId(),created_at:existing?.created_at||now,updated_at:now});
    });
      const cloudPayload=payload.map(item=>{
        const data={user_id:currentUser.id,id:item.id};
        for(const field of STUDENT_FIELDS)data[field.key]=field.key==="joined_on"?(item[field.key]||null):item[field.key];
        return data;
      });
      const {data,error}=await cloud.from(STUDENTS_TABLE).upsert(cloudPayload,{onConflict:"id"}).select("*");
      if(error)throw error;
      if(operationAccountSequence!==accountSequence||currentUser?.id!==operationUserId)return;
      students=(data||[]).map(normalizeStudent);
      await loadCloudData();
      if(operationAccountSequence!==accountSequence||currentUser?.id!==operationUserId)return;
    closeDialog("importPreview");
    importPlan=null;
    refreshCountryFilter();
    renderAll();
    showToast(`تم استيراد ${payload.length} ملف طالب بنجاح.`);
  }catch(error){
    console.error("CSV import failed.",error);
    showToast("تعذّر استيراد البيانات. راجع أسماء المستخدمين والحقول.",true);
  }finally{setBusy(button,false)}
}

function clearFilters(){
  for(const id of ["search","statusFilter","levelFilter","typeFilter","countryFilter"])byId(id).value="";
  byId("sortStudents").value="newest";
  renderStudents();
}
function handleRowAction(event){
  const button=event.target.closest("button[data-action]");
  if(!button)return;
  if(button.dataset.action==="restore"){restoreTrashedStudent(button.dataset.id,button);return}
  if(button.dataset.action==="purge"){permanentlyDeleteTrashedStudent(button.dataset.id,button);return}
  const student=students.find(item=>item.id===button.dataset.id);
  if(!student)return;
  if(button.dataset.action==="view")openProfile(student.id);
  if(button.dataset.action==="edit")openStudentEditor(student);
}
function bindEvents(){
  byId("refreshData").addEventListener("click",()=>loadCloudData(true));
  byId("addStudent").addEventListener("click",()=>openStudentEditor());
  byId("studentForm").addEventListener("submit",saveStudentRecord);
  byId("studentPhotoInput").addEventListener("change",event=>handleStudentPhotoSelection(event.target.files?.[0]));
  byId("removeStudentPhoto").addEventListener("click",removeStudentPhotoFromEditor);
  for(const id of ["student_first_name","student_last_name"])byId(id).addEventListener("input",updateStudentPhotoEditor);
  byId("studentRows").addEventListener("click",handleRowAction);
  byId("editFromProfile").addEventListener("click",()=>{const student=students.find(item=>item.id===activeStudentId);if(student)openStudentEditor(student)});
  byId("deleteStudent").addEventListener("click",deleteActiveStudent);
  byId("clearFilters").addEventListener("click",clearFilters);
  for(const id of ["search","statusFilter","levelFilter","typeFilter","countryFilter","sortStudents"])byId(id).addEventListener("input",renderStudents);
  byId("exportCsv").addEventListener("click",exportFilteredCsv);
  byId("importCsv").addEventListener("click",()=>byId("csvFile").click());
  byId("csvFile").addEventListener("change",event=>prepareCsvImport(event.target.files?.[0]));
  byId("confirmImport").addEventListener("click",confirmCsvImport);
  root.querySelectorAll("[data-close]").forEach(button=>button.addEventListener("click",()=>closeDialog(button.dataset.close)));
  root.addEventListener("keydown",event=>{
    if(event.key==="Escape")root.querySelectorAll("dialog[open]").forEach(dialog=>closeDialog(dialog.id));
  });
}

function deactivate(){
  cloudLoadSequence++;
  closeAllDialogs();
  root.querySelectorAll("details[open]").forEach(details=>details.removeAttribute("open"));
}

function reset(){
  accountSequence++;
  cloudLoadSequence++;
  photoSelectionSequence++;
  closeAllDialogs();
  mode="gate";
  currentUser=null;
  students=[];
  summaryLoaded=false;
  trashedStudents=[];
  listMode="active";
  filteredStudents=[];
  editingStudentId=null;
  activeStudentId=null;
  importPlan=null;
  initialRouteHandled=false;
  pendingStudentPhoto=null;
  removeStudentPhotoRequested=false;
  originalStudentPhotoPath="";
  originalStudentPhotoUrl="";
  for(const id of ["search","statusFilter","levelFilter","typeFilter","countryFilter"])byId(id).value="";
  byId("sortStudents").value="newest";
  byId("csvFile").value="";
  byId("studentRows").replaceChildren();
  byId("toast").className="toast";
  byId("toast").textContent="";
  root.querySelectorAll("details[open]").forEach(details=>details.removeAttribute("open"));
  refreshCountryFilter();
  renderAll();
  setLoading(false);
}

async function activate(user){
  if(!cloud||!user?.id)return false;
  if(currentUser?.id!==user.id){
    reset();
    currentUser={id:user.id};
    initialRouteHandled=false;
  }
  mode="cloud";
  return loadCloudData();
}

function openNew(){
  if(!currentUser||mode!=="cloud"||root.hidden)return false;
  openStudentEditor();
  return true;
}

function initialize(){
  buildStudentForm();
  populateStaticOptions();
  bindEvents();
  renderAll();
}

initialize();
return Object.freeze({
  activate,
  deactivate,
  reset,
  refresh:()=>loadCloudData(),
  openNew,
  createBackupSnapshot,
  inspectBackupSnapshot,
  restoreBackupSnapshot
});
}

window.MawaeidiStudents=Object.freeze({create});
})();
