"use strict";

const SUPABASE_URL="https://eixeazkkexgfndvfowxa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_9HtNRmLYbR2IU4jcTPumjw_XJ1ziGpM";
const STUDENTS_TABLE="mawaeidi_students";
const PROGRESS_TABLE="mawaeidi_student_progress";
const MAX_IMPORT_BYTES=2*1024*1024;
const MAX_IMPORT_ROWS=2000;

const STATUS_OPTIONS=["حالي","سابق","متوقف مؤقتًا","جديد","غير محدد"];
const LEVEL_OPTIONS=["مبتدئ","متوسط","متقدم","غير محدد"];
const STUDY_TYPE_OPTIONS=["فردي","مجموعة","غير محدد"];
const PROGRESS_CATEGORIES={
  general:"عام",
  vocabulary:"المفردات",
  speaking:"المحادثة",
  listening:"الاستماع",
  reading:"القراءة",
  writing:"الكتابة",
  grammar:"القواعد",
  pronunciation:"النطق",
  assessment:"تقييم",
  homework:"واجب"
};

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
const CSV_HEADERS=STUDENT_FIELDS.map(field=>field.label);
const CSV_KEY_BY_HEADER=Object.fromEntries(STUDENT_FIELDS.map(field=>[field.label,field.key]));

const cloud=window.supabase?.createClient
  ?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY)
  :null;

let mode="gate";
let currentUser=null;
let authMode="signin";
let students=[];
let progressEntries=[];
let filteredStudents=[];
let editingStudentId=null;
let activeStudentId=null;
let editingProgressId=null;
let importPlan=null;
let toastTimer=null;
let initialRouteHandled=false;

const DEMO_STUDENTS=[
  {id:"11111111-1111-4111-8111-111111111111",username:"demo_learner_1",first_name:"طالب",last_name:"تجريبي ١",country:"أذربيجان",status:"حالي",institute:"درس خاص",study_group:"",distinguishing_mark:"يحب المحادثة",email:"learner1@example.test",whatsapp:"+994 50 000 00 01",current_level:"متوسط",study_type:"فردي",course_book:"العربية بين يديك ٢",communication_language:"الأذرية",joined_on:"2026-08-10",educational_notes:"يحتاج إلى توسيع المفردات اليومية.",student_account_url:"",created_at:"2026-08-10T08:00:00Z",updated_at:"2026-10-22T08:00:00Z"},
  {id:"22222222-2222-4222-8222-222222222222",username:"demo_learner_2",first_name:"طالبة",last_name:"تجريبية ٢",country:"تركيا",status:"جديد",institute:"مركز لغات",study_group:"المجموعة أ",distinguishing_mark:"",email:"",whatsapp:"",current_level:"مبتدئ",study_type:"مجموعة",course_book:"العربية بين يديك ١",communication_language:"التركية",joined_on:"2026-10-03",educational_notes:"بدأت دراسة الحروف والمحادثات القصيرة.",student_account_url:"",created_at:"2026-10-03T08:00:00Z",updated_at:"2026-10-20T08:00:00Z"},
  {id:"33333333-3333-4333-8333-333333333333",username:"demo_learner_3",first_name:"طالب",last_name:"تجريبي ٣",country:"المملكة المتحدة",status:"متوقف مؤقتًا",institute:"",study_group:"",distinguishing_mark:"",email:"learner3@example.test",whatsapp:"",current_level:"متقدم",study_type:"فردي",course_book:"محادثة متقدمة",communication_language:"الإنجليزية",joined_on:"2026-05-14",educational_notes:"توقف مؤقتًا بسبب ضغط العمل.",student_account_url:"https://example.test/student/demo_3",created_at:"2026-05-14T08:00:00Z",updated_at:"2026-09-28T08:00:00Z"},
  {id:"44444444-4444-4444-8444-444444444444",username:"demo_learner_4",first_name:"طالبة",last_name:"تجريبية ٤",country:"ألمانيا",status:"سابق",institute:"مركز لغات",study_group:"المجموعة ب",distinguishing_mark:"",email:"",whatsapp:"",current_level:"متوسط",study_type:"مجموعة",course_book:"النحو الوظيفي",communication_language:"الألمانية",joined_on:"2026-02-01",educational_notes:"أنهت المستوى المتفق عليه.",student_account_url:"",created_at:"2026-02-01T08:00:00Z",updated_at:"2026-07-30T08:00:00Z"}
];

const DEMO_PROGRESS=[
  {id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",student_id:DEMO_STUDENTS[0].id,recorded_on:"2026-10-21",category:"speaking",title:"محادثة عن السفر",notes:"استخدم تراكيب السؤال بصورة أفضل، ويحتاج إلى ضبط التذكير والتأنيث.",score:82,next_step:"تسجيل دقيقة واحدة عن رحلة سابقة.",created_at:"2026-10-21T18:00:00Z",updated_at:"2026-10-21T18:00:00Z"},
  {id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",student_id:DEMO_STUDENTS[0].id,recorded_on:"2026-10-14",category:"vocabulary",title:"مفردات وسائل الاتصال",notes:"أتقن معظم المفردات الجديدة.",score:88,next_step:"كتابة خمس جمل بالمفردات.",created_at:"2026-10-14T18:00:00Z",updated_at:"2026-10-14T18:00:00Z"},
  {id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",student_id:DEMO_STUDENTS[1].id,recorded_on:"2026-10-19",category:"reading",title:"قراءة كلمات قصيرة",notes:"تميّز بين الحركات القصيرة بصورة جيدة.",score:null,next_step:"مراجعة المدود الثلاثة.",created_at:"2026-10-19T18:00:00Z",updated_at:"2026-10-19T18:00:00Z"}
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
  result.created_at=clean(value.created_at,50)||new Date().toISOString();
  result.updated_at=clean(value.updated_at,50)||result.created_at;
  return result;
}
function normalizeProgress(value={}){
  const score=value.score===""||value.score===null||value.score===undefined?null:Number(value.score);
  return {
    id:clean(value.id,80)||makeId(),
    student_id:clean(value.student_id,80),
    recorded_on:/^\d{4}-\d{2}-\d{2}$/.test(text(value.recorded_on))?value.recorded_on:todayKey(),
    category:Object.hasOwn(PROGRESS_CATEGORIES,value.category)?value.category:"general",
    title:clean(value.title,160),
    notes:clean(value.notes,5000),
    score:Number.isInteger(score)&&score>=0&&score<=100?score:null,
    next_step:clean(value.next_step,1000),
    created_at:clean(value.created_at,50)||new Date().toISOString(),
    updated_at:clean(value.updated_at,50)||new Date().toISOString()
  };
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
function closeDialog(id){const dialog=byId(id);if(dialog?.open)dialog.close()}

function buildStudentForm(){
  const target=byId("studentFields");
  target.replaceChildren();
  for(const field of STUDENT_FIELDS){
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
    target.append(wrapper);
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
  const progressSelect=byId("progressCategory");
  for(const [value,label] of Object.entries(PROGRESS_CATEGORIES)){
    const option=document.createElement("option");
    option.value=value;option.textContent=label;progressSelect.append(option);
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
function levelChipClass(value){return value==="متوسط"?"intermediate":value==="متقدم"?"advanced":""}
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
function renderStudents(){
  refreshCountryFilter();
  filteredStudents=filterAndSortStudents();
  byId("resultsCount").textContent=`${filteredStudents.length} نتيجة من ${students.length}`;
  const body=byId("studentRows");
  body.replaceChildren();
  for(const student of filteredStudents){
    const row=document.createElement("tr");
    const nameCell=document.createElement("td");
    const name=document.createElement("div");name.className="student-name";name.textContent=studentName(student);
    const course=document.createElement("div");course.className="student-sub";course.textContent=student.course_book||"من دون دورة محددة";
    nameCell.append(name,course);
    row.append(nameCell);

    for(const value of [student.username,student.country]){
      const cell=document.createElement("td");cell.textContent=value||"—";row.append(cell);
    }
    const statusCell=document.createElement("td");
    const status=document.createElement("span");status.className=`chip ${statusChipClass(student.status)}`;status.textContent=student.status;statusCell.append(status);row.append(statusCell);
    const levelCell=document.createElement("td");
    const level=document.createElement("span");level.className=`chip ${levelChipClass(student.current_level)}`;level.textContent=student.current_level;levelCell.append(level);row.append(levelCell);
    const actions=document.createElement("td");
    const actionWrap=document.createElement("div");actionWrap.className="row-actions";
    actionWrap.append(makeButton("فتح الملف","view",student.id),makeButton("تعديل","edit",student.id));
    actions.append(actionWrap);row.append(actions);
    body.append(row);
  }
  const empty=!filteredStudents.length;
  byId("tableWrap").hidden=empty;
  byId("emptyState").hidden=!empty;
}
function renderAll(){renderStudents()}

function profileDetails(student){
  const rows=[
    ["اسم المستخدم",student.username],
    ["الدولة",student.country],
    ["الحالة",student.status],
    ["المستوى الحالي",student.current_level],
    ["نوع الدراسة",student.study_type],
    ["الجهة / المعهد",student.institute],
    ["المجموعة الدراسية",student.study_group],
    ["الدورة / الكتاب",student.course_book],
    ["لغة التواصل",student.communication_language],
    ["تاريخ الانضمام",student.joined_on?dateLabel(student.joined_on):""],
    ["علامة مميزة",student.distinguishing_mark],
    ["ملاحظات تعليمية",student.educational_notes]
  ];
  return rows.map(([label,value])=>`<div class="detail-item${label==="ملاحظات تعليمية"?" wide":""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value||"—")}</strong></div>`).join("");
}
function profileContacts(student){
  const rows=[];
  if(student.email)rows.push(`<div class="contact-row"><span>البريد الإلكتروني</span><strong>${escapeHtml(student.email)}</strong><a href="mailto:${encodeURIComponent(student.email)}">إرسال بريد</a></div>`);
  const digits=student.whatsapp.replace(/\D/g,"");
  if(digits)rows.push(`<div class="contact-row"><span>واتساب</span><strong>${escapeHtml(student.whatsapp)}</strong><a href="https://wa.me/${digits}" target="_blank" rel="noopener">فتح واتساب</a></div>`);
  const account=safeUrl(student.student_account_url);
  if(account)rows.push(`<div class="contact-row"><span>رابط حساب الطالب</span><strong>${escapeHtml(student.student_account_url)}</strong><a href="${escapeHtml(account)}" target="_blank" rel="noopener">فتح الحساب</a></div>`);
  return rows.length?rows.join(""):'<div class="progress-empty">لا توجد وسائل اتصال مسجّلة.</div>';
}
function profileProgress(studentId){
  const list=progressEntries.filter(item=>item.student_id===studentId).sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on)||b.created_at.localeCompare(a.created_at));
  if(!list.length)return '<div class="progress-empty">لم تُضف متابعة تعليمية لهذا الطالب بعد.</div>';
  return list.map(item=>`<article class="progress-entry">
    <div class="progress-top">
      <div><div class="progress-title">${escapeHtml(item.title)}</div><div class="progress-meta">${escapeHtml(PROGRESS_CATEGORIES[item.category]||"عام")} · ${escapeHtml(dateLabel(item.recorded_on))}</div></div>
      ${item.score===null?"":`<span class="progress-score">${item.score}/100</span>`}
    </div>
    ${item.notes?`<div class="progress-copy">${escapeHtml(item.notes)}</div>`:""}
    ${item.next_step?`<div class="progress-next"><strong>الخطوة التالية:</strong> ${escapeHtml(item.next_step)}</div>`:""}
    <div class="progress-entry-actions"><button class="btn small" type="button" data-progress-action="edit" data-id="${item.id}">تعديل</button><button class="btn small danger" type="button" data-progress-action="delete" data-id="${item.id}">حذف</button></div>
  </article>`).join("");
}
function renderProfile(){
  const student=students.find(item=>item.id===activeStudentId);
  if(!student){closeDialog("studentProfile");return}
  const entries=progressEntries.filter(item=>item.student_id===student.id);
  byId("profileTitle").textContent=studentName(student);
  byId("profileSubtitle").textContent=`@${student.username} · ${student.country||"الدولة غير محددة"} · ${student.status} · ${student.current_level}`;
  byId("profileContent").innerHTML=`
    <div class="profile-layout">
      <section class="profile-section">
        <header class="profile-section-head"><h3>بيانات الطالب</h3><span>المعلومات المسجلة</span></header>
        <div class="detail-grid">${profileDetails(student)}</div>
      </section>
      <section class="profile-section">
        <header class="profile-section-head"><h3>التواصل والحساب</h3><span>روابط سريعة</span></header>
        <div class="contact-actions">${profileContacts(student)}</div>
      </section>
      <details class="profile-section wide progress-disclosure">
        <summary><span>المتابعة التعليمية</span><span>${entries.length}</span></summary>
        <div class="progress-list">${profileProgress(student.id)}</div>
      </details>
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
  byId("studentEditorTitle").textContent=student?"تعديل بيانات الطالب":"إضافة طالب جديد";
  for(const field of STUDENT_FIELDS){
    const input=byId(`student_${field.key}`);
    input.value=student?.[field.key]??(field.options?"غير محدد":"");
  }
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
async function saveStudentRecord(event){
  event.preventDefault();
  const draft=readStudentForm();
  const validation=validateStudent(draft);
  if(validation){setMessage("studentFormMessage",validation);return}
  const button=byId("saveStudent");
  setBusy(button,true);
  setMessage("studentFormMessage","");
  try{
    if(mode==="demo"){
      const now=new Date().toISOString();
      if(editingStudentId){
        const index=students.findIndex(item=>item.id===editingStudentId);
        students[index]=normalizeStudent({...students[index],...draft,updated_at:now});
      }else{
        students.unshift(normalizeStudent({...draft,id:makeId(),created_at:now,updated_at:now}));
      }
    }else{
      if(!cloud||!currentUser)throw new Error("missing_session");
      const payload={...draft,user_id:currentUser.id,joined_on:draft.joined_on||null};
      let response;
      if(editingStudentId)response=await cloud.from(STUDENTS_TABLE).update(payload).eq("id",editingStudentId).select("*").single();
      else response=await cloud.from(STUDENTS_TABLE).insert(payload).select("*").single();
      if(response.error)throw response.error;
      const saved=normalizeStudent(response.data);
      const index=students.findIndex(item=>item.id===saved.id);
      if(index>=0)students[index]=saved;else students.unshift(saved);
    }
    closeDialog("studentEditor");
    refreshCountryFilter();
    renderAll();
    showToast(editingStudentId?"تم تحديث ملف الطالب.":"تم إنشاء ملف الطالب.");
  }catch(error){
    console.error("Student save failed.",error);
    const duplicate=error?.code==="23505";
    setMessage("studentFormMessage",duplicate?"اسم المستخدم موجود بالفعل في هذا الحساب.":"تعذّر حفظ ملف الطالب في قاعدة التطوير.");
  }finally{setBusy(button,false)}
}
async function deleteActiveStudent(){
  const student=students.find(item=>item.id===activeStudentId);
  if(!student)return;
  if(!confirm(`حذف ملف ${studentName(student)}؟ سيُحذف سجل تقدمه التجريبي أيضًا.`))return;
  const button=byId("deleteStudent");
  setBusy(button,true,"جارٍ الحذف…");
  try{
    if(mode==="cloud"){
      const {error}=await cloud.from(STUDENTS_TABLE).delete().eq("id",student.id);
      if(error)throw error;
    }
    students=students.filter(item=>item.id!==student.id);
    progressEntries=progressEntries.filter(item=>item.student_id!==student.id);
    closeDialog("studentProfile");
    activeStudentId=null;
    renderAll();
    showToast("تم حذف ملف الطالب.");
  }catch(error){
    console.error("Student delete failed.",error);
    showToast("تعذّر حذف الطالب من قاعدة التطوير.",true);
  }finally{setBusy(button,false)}
}

function openProgressEditor(entry=null){
  if(!activeStudentId)return;
  editingProgressId=entry?.id||null;
  byId("progressEditorTitle").textContent=entry?"تعديل المتابعة":"إضافة متابعة تعليمية";
  byId("progressDate").value=entry?.recorded_on||todayKey();
  byId("progressCategory").value=entry?.category||"general";
  byId("progressTitle").value=entry?.title||"";
  byId("progressScore").value=entry?.score??"";
  byId("progressNotes").value=entry?.notes||"";
  byId("progressNextStep").value=entry?.next_step||"";
  setMessage("progressFormMessage","");
  openDialog("progressEditor");
  setTimeout(()=>byId("progressTitle").focus(),0);
}
async function saveProgressRecord(event){
  event.preventDefault();
  if(!activeStudentId)return;
  const rawScore=byId("progressScore").value.trim();
  const draft=normalizeProgress({
    id:editingProgressId||makeId(),
    student_id:activeStudentId,
    recorded_on:byId("progressDate").value,
    category:byId("progressCategory").value,
    title:byId("progressTitle").value,
    score:rawScore===""?null:Number(rawScore),
    notes:byId("progressNotes").value,
    next_step:byId("progressNextStep").value
  });
  if(!draft.title){setMessage("progressFormMessage","عنوان المتابعة مطلوب.");return}
  if(rawScore!==""&&(!Number.isInteger(Number(rawScore))||Number(rawScore)<0||Number(rawScore)>100)){setMessage("progressFormMessage","التقييم يجب أن يكون عددًا صحيحًا من 0 إلى 100.");return}
  const button=byId("saveProgress");
  setBusy(button,true);
  try{
    if(mode==="demo"){
      const now=new Date().toISOString();
      const existing=progressEntries.findIndex(item=>item.id===editingProgressId);
      const value=normalizeProgress({...draft,created_at:existing>=0?progressEntries[existing].created_at:now,updated_at:now});
      if(existing>=0)progressEntries[existing]=value;else progressEntries.unshift(value);
    }else{
      const payload={
        user_id:currentUser.id,
        student_id:draft.student_id,
        recorded_on:draft.recorded_on,
        category:draft.category,
        title:draft.title,
        notes:draft.notes,
        score:draft.score,
        next_step:draft.next_step
      };
      let response;
      if(editingProgressId)response=await cloud.from(PROGRESS_TABLE).update(payload).eq("id",editingProgressId).select("*").single();
      else response=await cloud.from(PROGRESS_TABLE).insert(payload).select("*").single();
      if(response.error)throw response.error;
      const saved=normalizeProgress(response.data);
      const index=progressEntries.findIndex(item=>item.id===saved.id);
      if(index>=0)progressEntries[index]=saved;else progressEntries.unshift(saved);
    }
    closeDialog("progressEditor");
    renderAll();
    renderProfile();
    showToast(editingProgressId?"تم تحديث المتابعة.":"تمت إضافة المتابعة.");
  }catch(error){
    console.error("Progress save failed.",error);
    setMessage("progressFormMessage","تعذّر حفظ المتابعة في قاعدة التطوير.");
  }finally{setBusy(button,false)}
}
async function deleteProgress(id){
  const entry=progressEntries.find(item=>item.id===id);
  if(!entry||!confirm("حذف هذه المتابعة التعليمية؟"))return;
  try{
    if(mode==="cloud"){
      const {error}=await cloud.from(PROGRESS_TABLE).delete().eq("id",id);
      if(error)throw error;
    }
    progressEntries=progressEntries.filter(item=>item.id!==id);
    renderAll();
    renderProfile();
    showToast("تم حذف المتابعة.");
  }catch(error){
    console.error("Progress delete failed.",error);
    showToast("تعذّر حذف المتابعة.",true);
  }
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
    const [studentsResponse,progressResponse]=await Promise.all([
      cloud.from(STUDENTS_TABLE).select("*").order("created_at",{ascending:false}),
      cloud.from(PROGRESS_TABLE).select("*").order("recorded_on",{ascending:false}).order("created_at",{ascending:false})
    ]);
    if(studentsResponse.error)throw studentsResponse.error;
    if(progressResponse.error)throw progressResponse.error;
    students=(studentsResponse.data||[]).map(normalizeStudent);
    progressEntries=(progressResponse.data||[]).map(normalizeProgress);
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
  progressEntries=clone(DEMO_PROGRESS).map(normalizeProgress);
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
  mode="gate";currentUser=null;students=[];progressEntries=[];activeStudentId=null;initialRouteHandled=false;
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
function handleProgressAction(event){
  const button=event.target.closest("button[data-progress-action]");
  if(!button)return;
  const entry=progressEntries.find(item=>item.id===button.dataset.id);
  if(!entry)return;
  if(button.dataset.progressAction==="edit")openProgressEditor(entry);
  if(button.dataset.progressAction==="delete")deleteProgress(entry.id);
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
  byId("progressForm").addEventListener("submit",saveProgressRecord);
  byId("studentRows").addEventListener("click",handleRowAction);
  byId("profileContent").addEventListener("click",handleProgressAction);
  byId("addProgress").addEventListener("click",()=>openProgressEditor());
  byId("editFromProfile").addEventListener("click",()=>{const student=students.find(item=>item.id===activeStudentId);if(student)openStudentEditor(student)});
  byId("deleteStudent").addEventListener("click",deleteActiveStudent);
  byId("clearFilters").addEventListener("click",clearFilters);
  for(const id of ["search","statusFilter","levelFilter","typeFilter","countryFilter","sortStudents"])byId(id).addEventListener("input",renderStudents);
  byId("exportCsv").addEventListener("click",exportFilteredCsv);
  byId("importCsv").addEventListener("click",()=>byId("csvFile").click());
  byId("csvFile").addEventListener("change",event=>prepareCsvImport(event.target.files?.[0]));
  byId("confirmImport").addEventListener("click",confirmCsvImport);
  document.querySelectorAll("[data-close]").forEach(button=>button.addEventListener("click",()=>closeDialog(button.dataset.close)));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close())});
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
      mode="gate";currentUser=null;students=[];progressEntries=[];initialRouteHandled=false;
      byId("app").hidden=true;byId("authGate").hidden=false;
    }
    if(event==="SIGNED_IN"&&session?.user&&mode==="gate")setTimeout(()=>enterCloud(session.user),0);
  });
  const {data,error}=await cloud.auth.getSession();
  if(error){setMessage("authMessage","تعذّر قراءة جلسة حساب التطوير.",true);return}
  if(data.session?.user)await enterCloud(data.session.user);
}

init();
