"use strict";

const SUPABASE_URL="https://eixeazkkexgfndvfowxa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_9HtNRmLYbR2IU4jcTPumjw_XJ1ziGpM";
const STUDENTS_TABLE="mawaeidi_students";
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
  {title:"البيانات الأساسية",hint:"الاسم والحالة والمكان",keys:["first_name","last_name","username","country","status"]},
  {title:"بيانات الدراسة",hint:"المستوى والكتاب والجهة",keys:["current_level","study_type","course_book","institute","study_group","joined_on"]},
  {title:"التواصل والحساب",hint:"وسائل الوصول إلى الطالب",keys:["whatsapp","email","communication_language","student_account_url"]},
  {title:"ملاحظاتك",hint:"معلومات تساعدك على تذكّر الطالب",keys:["distinguishing_mark","educational_notes"]}
];
const CSV_HEADERS=STUDENT_FIELDS.map(field=>field.label);
const CSV_KEY_BY_HEADER=Object.fromEntries(STUDENT_FIELDS.map(field=>[field.label,field.key]));

const cloud=window.supabase?.createClient
  ?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY)
  :null;

let mode="gate";
let currentUser=null;
let authMode="signin";
let students=[];
let filteredStudents=[];
let editingStudentId=null;
let activeStudentId=null;
let importPlan=null;
let toastTimer=null;
let initialRouteHandled=false;
let pendingStudentPhoto=null;
let removeStudentPhotoRequested=false;
let originalStudentPhotoPath="";
let originalStudentPhotoUrl="";
let photoSelectionSequence=0;

const DEMO_STUDENTS=[
  {id:"11111111-1111-4111-8111-111111111111",username:"demo_learner_1",first_name:"طالب",last_name:"تجريبي ١",country:"أذربيجان",status:"حالي",institute:"درس خاص",study_group:"",distinguishing_mark:"يحب المحادثة",email:"learner1@example.test",whatsapp:"+994 50 000 00 01",current_level:"متوسط",study_type:"فردي",course_book:"العربية بين يديك ٢",communication_language:"الأذرية",joined_on:"2026-08-10",educational_notes:"يحتاج إلى توسيع المفردات اليومية.",student_account_url:"",created_at:"2026-08-10T08:00:00Z",updated_at:"2026-10-22T08:00:00Z"},
  {id:"22222222-2222-4222-8222-222222222222",username:"demo_learner_2",first_name:"طالبة",last_name:"تجريبية ٢",country:"تركيا",status:"جديد",institute:"مركز لغات",study_group:"المجموعة أ",distinguishing_mark:"",email:"",whatsapp:"",current_level:"مبتدئ",study_type:"مجموعة",course_book:"العربية بين يديك ١",communication_language:"التركية",joined_on:"2026-10-03",educational_notes:"بدأت دراسة الحروف والمحادثات القصيرة.",student_account_url:"",created_at:"2026-10-03T08:00:00Z",updated_at:"2026-10-20T08:00:00Z"},
  {id:"33333333-3333-4333-8333-333333333333",username:"demo_learner_3",first_name:"طالب",last_name:"تجريبي ٣",country:"المملكة المتحدة",status:"متوقف مؤقتًا",institute:"",study_group:"",distinguishing_mark:"",email:"learner3@example.test",whatsapp:"",current_level:"متقدم",study_type:"فردي",course_book:"محادثة متقدمة",communication_language:"الإنجليزية",joined_on:"2026-05-14",educational_notes:"توقف مؤقتًا بسبب ضغط العمل.",student_account_url:"https://example.test/student/demo_3",created_at:"2026-05-14T08:00:00Z",updated_at:"2026-09-28T08:00:00Z"},
  {id:"44444444-4444-4444-8444-444444444444",username:"demo_learner_4",first_name:"طالبة",last_name:"تجريبية ٤",country:"ألمانيا",status:"سابق",institute:"مركز لغات",study_group:"المجموعة ب",distinguishing_mark:"",email:"",whatsapp:"",current_level:"متوسط",study_type:"مجموعة",course_book:"النحو الوظيفي",communication_language:"الألمانية",joined_on:"2026-02-01",educational_notes:"أنهت المستوى المتفق عليه.",student_account_url:"",created_at:"2026-02-01T08:00:00Z",updated_at:"2026-07-30T08:00:00Z"}
];

function byId(id){return document.getElementById(id)}
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
  const countries=[...new Set(students.map(student=>student.country).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
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
function filterAndSortStudents(){
  const filters=currentFilters();
  const list=students.filter(student=>{
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
function renderStudents(){
  refreshCountryFilter();
  filteredStudents=filterAndSortStudents();
  byId("resultsCount").textContent=filteredStudents.length===students.length?`${students.length} طلاب`:`${filteredStudents.length} من ${students.length} طلاب`;
  const body=byId("studentRows");
  body.replaceChildren();
  for(const student of filteredStudents){
    const row=document.createElement("article");
    row.className="student-row";
    row.setAttribute("role","listitem");

    const open=document.createElement("button");
    open.type="button";open.className="student-open";open.dataset.action="view";open.dataset.id=student.id;
    open.setAttribute("aria-label",`عرض بيانات ${studentName(student)}`);
    const avatar=document.createElement("span");avatar.className="student-avatar";avatar.setAttribute("aria-hidden","true");setAvatarContent(avatar,student);
    const identity=document.createElement("span");identity.className="student-identity";
    const name=document.createElement("strong");name.className="student-name";name.textContent=studentName(student);
    const username=document.createElement("span");username.className="student-sub";username.textContent=student.username?`@${student.username}`:"من دون اسم مستخدم";
    identity.append(name,username);
    const study=document.createElement("span");study.className="student-study";
    const course=document.createElement("strong");course.textContent=student.course_book||"لا توجد دورة مسجلة";
    const details=document.createElement("span");details.textContent=[student.country,student.current_level].filter(Boolean).join(" · ")||"لا توجد تفاصيل إضافية";
    study.append(course,details);
    const status=document.createElement("span");status.className=`chip ${statusChipClass(student.status)}`;status.textContent=student.status||"غير محدد";
    open.append(avatar,identity,study,status);

    const actionWrap=document.createElement("div");actionWrap.className="row-actions";
    const edit=makeButton("تعديل","edit",student.id);edit.classList.add("edit-student");
    actionWrap.append(edit);
    row.append(open,actionWrap);
    body.append(row);
  }
  const empty=!filteredStudents.length;
  byId("tableWrap").hidden=empty;
  byId("emptyState").hidden=!empty;
}
function renderAll(){renderStudents()}

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
    const removal=await bucket.remove([previousPath]);
    if(removal.error)throw removal.error;
    const response=await cloud.from(STUDENTS_TABLE).update({photo_path:null}).eq("id",saved.id).select("*").single();
    if(response.error)throw response.error;
    saved=normalizeStudent({...response.data,photo_path:"",photo_url:""});
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
  const button=byId("saveStudent");
  setBusy(button,true);
  setMessage("studentFormMessage","");
  try{
    let saved,cleanupWarning=false;
    if(mode==="demo"){
      const now=new Date().toISOString();
      saved=normalizeStudent(previousStudent
        ?{...previousStudent,...draft,updated_at:now}
        :{...draft,id:makeId(),created_at:now,updated_at:now});
      if(pendingStudentPhoto)saved=normalizeStudent({...saved,photo_path:`demo/${saved.id}/profile.webp`,photo_url:pendingStudentPhoto.previewUrl});
      else if(removeStudentPhotoRequested)saved=normalizeStudent({...saved,photo_path:"",photo_url:""});
    }else{
      if(!cloud||!currentUser)throw new Error("missing_session");
      const payload={...draft,user_id:currentUser.id,joined_on:draft.joined_on||null};
      let response;
      if(editingStudentId)response=await cloud.from(STUDENTS_TABLE).update(payload).eq("id",editingStudentId).select("*").single();
      else response=await cloud.from(STUDENTS_TABLE).insert(payload).select("*").single();
      if(response.error)throw response.error;
      saved=normalizeStudent({...response.data,photo_url:previousStudent?.photo_url||""});
      try{
        const photoResult=await applyCloudStudentPhoto(saved,previousStudent);
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
    setMessage("studentFormMessage",duplicate?"اسم المستخدم موجود بالفعل في هذا الحساب.":"تعذّر حفظ ملف الطالب في قاعدة التطوير.");
  }finally{setBusy(button,false)}
}
async function deleteActiveStudent(){
  const student=students.find(item=>item.id===activeStudentId);
  if(!student)return;
  if(!confirm(`حذف ملف ${studentName(student)}؟`))return;
  const button=byId("deleteStudent");
  setBusy(button,true,"جارٍ الحذف…");
  try{
    if(mode==="cloud"){
      if(student.photo_path){
        if(!photoPathBelongsToCurrentUser(student.photo_path))throw new Error("invalid_photo_path");
        const removal=await cloud.storage.from(STUDENT_PHOTO_BUCKET).remove([student.photo_path]);
        if(removal.error)throw removal.error;
      }
      const {error}=await cloud.from(STUDENTS_TABLE).delete().eq("id",student.id);
      if(error)throw error;
    }
    students=students.filter(item=>item.id!==student.id);
    closeDialog("studentProfile");
    activeStudentId=null;
    renderAll();
    showToast("تم حذف ملف الطالب.");
  }catch(error){
    console.error("Student delete failed.",error);
    showToast("تعذّر حذف الطالب من قاعدة التطوير.",true);
  }finally{setBusy(button,false)}
}

function setLoading(loading){
  byId("loadingState").hidden=!loading;
  byId("tableWrap").hidden=loading||!filteredStudents.length;
  byId("emptyState").hidden=loading||Boolean(filteredStudents.length);
  for(const id of ["refreshData","addStudent","importCsv","exportCsv"])byId(id).disabled=loading;
}
async function loadCloudData(showSuccess=false){
  if(!cloud||!currentUser)return;
  setLoading(true);
  try{
    const studentsResponse=await cloud.from(STUDENTS_TABLE).select("*").order("created_at",{ascending:false});
    if(studentsResponse.error)throw studentsResponse.error;
    students=await hydrateStudentPhotos(studentsResponse.data||[]);
    refreshCountryFilter();
    renderAll();
    applyInitialRoute();
    if(showSuccess)showToast("تم تحديث بيانات الطلاب.");
  }catch(error){
    console.error("Cloud load failed.",error);
    showToast("تعذّر تحميل بيانات قاعدة التطوير.",true);
  }finally{setLoading(false)}
}
function enterApp(selectedMode){
  mode=selectedMode;
  byId("authGate").hidden=true;
  byId("app").hidden=false;
  const demo=mode==="demo";
  const backLink=document.querySelector(".header-link");
  if(backLink)backLink.href=demo?"../index.html?demo=1":"../index.html";
  byId("modeBadge").textContent=demo?"عرض محلي وهمي":"متصل بقاعدة التطوير";
  byId("modeBadge").classList.toggle("demo",demo);
  byId("exitMode").textContent=demo?"إغلاق العرض":"تسجيل الخروج";
  byId("environmentNotice").hidden=demo;
  byId("environmentNotice").classList.toggle("demo",demo);
  byId("environmentNotice").innerHTML=demo
    ?"<strong>عرض محلي آمن:</strong> البيانات وهمية وتختفي عند إغلاق الصفحة، ولا يُرسل أي تغيير إلى Supabase."
    :"<strong>بيئة آمنة للتطوير:</strong> لا تستخدم بيانات طلاب حقيقية هنا. جميع عمليات السحابة تتجه إلى مشروع <b>Mawaeidi Development</b> فقط.";
}
function applyInitialRoute(){
  if(initialRouteHandled)return;
  const params=new URLSearchParams(location.search);
  const studentId=clean(params.get("student"),80);
  const wantsNew=params.get("new")==="1";
  if(wantsNew){initialRouteHandled=true;openStudentEditor();return}
  if(studentId){
    const student=students.find(item=>item.id===studentId);
    if(student){initialRouteHandled=true;openProfile(student.id)}
  }
}
function startDemo(){
  currentUser=null;
  students=clone(DEMO_STUDENTS).map(normalizeStudent);
  enterApp("demo");
  refreshCountryFilter();
  renderAll();
  applyInitialRoute();
}
async function enterCloud(user){
  if(mode==="cloud"&&currentUser?.id===user?.id)return;
  currentUser=user;
  enterApp("cloud");
  await loadCloudData();
}
async function exitCurrentMode(){
  const wasCloud=mode==="cloud";
  closeAllDialogs();
  if(wasCloud&&cloud)await cloud.auth.signOut();
  mode="gate";currentUser=null;students=[];activeStudentId=null;initialRouteHandled=false;
  byId("app").hidden=true;
  byId("authGate").hidden=false;
  setAuthMode("signin");
  setMessage("authMessage",wasCloud?"تم تسجيل الخروج.":"",false);
}
function closeAllDialogs(){document.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close())}

function setAuthMode(nextMode){
  authMode=nextMode==="signup"?"signup":"signin";
  const signup=authMode==="signup";
  byId("authTitle").textContent=signup?"إنشاء حساب اختبار":"الدخول إلى سجل الطلاب التجريبي";
  byId("authIntro").textContent=signup?"هذا الحساب خاص بمشروع التطوير، وقد يطلب Supabase تأكيد البريد الإلكتروني.":"تتصل هذه الصفحة بمشروع Supabase التجريبي فقط، ولا تستخدم قاعدة الإنتاج.";
  byId("authSubmit").textContent=signup?"إنشاء الحساب":"تسجيل الدخول";
  byId("authModeToggle").textContent=signup?"لديّ حساب — تسجيل الدخول":"إنشاء حساب اختبار جديد";
  byId("authPassword").autocomplete=signup?"new-password":"current-password";
  byId("passwordReset").hidden=signup;
  setMessage("authMessage","");
}
function authRedirectUrl(){return ["http:","https:"].includes(location.protocol)?location.href.split(/[?#]/)[0]:undefined}
async function submitAuth(event){
  event.preventDefault();
  if(!cloud){setMessage("authMessage","تعذّر تحميل اتصال Supabase. يمكنك فتح العرض التجريبي الآن.",true);return}
  const email=byId("authEmail").value.trim();
  const password=byId("authPassword").value;
  if(!email||!email.includes("@")){setMessage("authMessage","اكتب بريدًا إلكترونيًا صحيحًا.");return}
  if(password.length<6){setMessage("authMessage","كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.");return}
  const button=byId("authSubmit");
  setBusy(button,true,authMode==="signup"?"جارٍ إنشاء الحساب…":"جارٍ تسجيل الدخول…");
  try{
    if(authMode==="signup"){
      const redirectTo=authRedirectUrl();
      const {data,error}=await cloud.auth.signUp({email,password,options:redirectTo?{emailRedirectTo:redirectTo}:undefined});
      if(error)throw error;
      if(data.session?.user)await enterCloud(data.session.user);
      else setMessage("authMessage","تم إنشاء الحساب. افتح رسالة تأكيد البريد، ثم عد لتسجيل الدخول.",false);
    }else{
      const {data,error}=await cloud.auth.signInWithPassword({email,password});
      if(error)throw error;
      await enterCloud(data.user);
    }
  }catch(error){
    console.error("Auth failed.",error);
    setMessage("authMessage",authMode==="signup"?"تعذّر إنشاء الحساب. ربما البريد مستخدم بالفعل.":"البريد أو كلمة المرور غير صحيحين.");
  }finally{setBusy(button,false)}
}
async function resetPassword(){
  if(!cloud){setMessage("authMessage","تعذّر تحميل اتصال Supabase.",true);return}
  const email=byId("authEmail").value.trim();
  if(!email||!email.includes("@")){setMessage("authMessage","اكتب بريدك أولًا لإرسال رابط الاستعادة.");return}
  const button=byId("passwordReset");
  button.disabled=true;
  try{
    const redirectTo=authRedirectUrl();
    const {error}=await cloud.auth.resetPasswordForEmail(email,redirectTo?{redirectTo}:undefined);
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
function exportFilteredCsv(){
  const list=filteredStudents.length?filteredStudents:[];
  if(!list.length){showToast("لا توجد نتائج لتصديرها.",true);return}
  const rows=[CSV_HEADERS.map(csvEscape).join(",")];
  for(const student of list)rows.push(STUDENT_FIELDS.map(field=>csvEscape(student[field.key]||"")).join(","));
  const blob=new Blob(["\uFEFF",rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=`mawaeidi-students-${todayKey()}.csv`;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast(`تم تصدير ${list.length} ملف طالب.`);
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
  const button=byId("confirmImport");
  setBusy(button,true,"جارٍ الاستيراد…");
  try{
    const existingByName=new Map(students.map(item=>[normalizeKey(item.username),item]));
    const now=new Date().toISOString();
    const payload=importPlan.items.map(item=>{
      const existing=existingByName.get(normalizeKey(item.username));
      return normalizeStudent({...item,id:existing?.id||makeId(),created_at:existing?.created_at||now,updated_at:now});
    });
    if(mode==="demo"){
      const byName=new Map(students.map(item=>[normalizeKey(item.username),item]));
      for(const item of payload)byName.set(normalizeKey(item.username),item);
      students=[...byName.values()];
    }else{
      const cloudPayload=payload.map(item=>{
        const data={user_id:currentUser.id,id:item.id};
        for(const field of STUDENT_FIELDS)data[field.key]=field.key==="joined_on"?(item[field.key]||null):item[field.key];
        return data;
      });
      const {data,error}=await cloud.from(STUDENTS_TABLE).upsert(cloudPayload,{onConflict:"id"}).select("*");
      if(error)throw error;
      students=(data||[]).map(normalizeStudent);
      await loadCloudData();
    }
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
  const student=students.find(item=>item.id===button.dataset.id);
  if(!student)return;
  if(button.dataset.action==="view")openProfile(student.id);
  if(button.dataset.action==="edit")openStudentEditor(student);
}
function bindEvents(){
  byId("authForm").addEventListener("submit",submitAuth);
  byId("authModeToggle").addEventListener("click",()=>setAuthMode(authMode==="signin"?"signup":"signin"));
  byId("passwordReset").addEventListener("click",resetPassword);
  byId("startDemo").addEventListener("click",startDemo);
  byId("exitMode").addEventListener("click",exitCurrentMode);
  byId("refreshData").addEventListener("click",()=>mode==="cloud"?loadCloudData(true):(renderAll(),showToast("تم تحديث العرض المحلي.")));
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
  document.querySelectorAll("[data-close]").forEach(button=>button.addEventListener("click",()=>closeDialog(button.dataset.close)));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll("dialog[open]").forEach(dialog=>closeDialog(dialog.id))});
}

async function init(){
  buildStudentForm();
  populateStaticOptions();
  bindEvents();
  setAuthMode("signin");
  if(new URLSearchParams(location.search).get("demo")==="1"){startDemo();return}
  if(!cloud){
    setMessage("authMessage","تعذّر تحميل اتصال Supabase. يمكنك استخدام العرض التجريبي المحلي.",true);
    return;
  }
  cloud.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_OUT"&&mode==="cloud"){
      mode="gate";currentUser=null;students=[];initialRouteHandled=false;
      byId("app").hidden=true;byId("authGate").hidden=false;
    }
    if(event==="SIGNED_IN"&&session?.user&&mode==="gate")setTimeout(()=>enterCloud(session.user),0);
  });
  const {data,error}=await cloud.auth.getSession();
  if(error){setMessage("authMessage","تعذّر قراءة جلسة حساب التطوير.",true);return}
  if(data.session?.user)await enterCloud(data.session.user);
}

init();
