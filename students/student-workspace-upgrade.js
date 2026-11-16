(function studentsUpgrade(){
"use strict";
const FOLLOWUPS_TABLE="mawaeidi_student_followups";
const QUICK=["","حالي","جديد","متوقف مؤقتًا","سابق"];
const DISPLAY={"":"الكل","حالي":"الحاليون","جديد":"الجدد","متوقف مؤقتًا":"المتوقفون","سابق":"السابقون"};
const STATUS=["حالي","جديد","متوقف مؤقتًا","سابق","غير محدد"];
function create({root,cloud,getStudents,getUser,getActiveStudentId,getTrashMode,refresh,openProfile}){
  const $=id=>root.querySelector("#"+id);
  let accountId="",viewMode="list",selectionMode=false,selected=new Set(),quickStatus="",group="",institute="",profileRequest=0,followupReady=null;
  const prefsKey=()=>"mawaeidi_students_workspace_v2_"+(getUser()?.id||"guest");
  const clean=v=>String(v??"").trim();
  const show=(msg,error=false)=>{
    const toast=$("toast");if(!toast)return;
    toast.textContent=msg;toast.className="toast visible"+(error?" error":"");
    clearTimeout(show.timer);show.timer=setTimeout(()=>{toast.className="toast";},4000);
  };
  const owned=()=>Boolean(cloud&&getUser()?.id);
  const allStudents=()=>getStudents().filter(x=>x&&!x.deleted_at);
  const requestRender=()=> $("search")?.dispatchEvent(new Event("input",{bubbles:true}));
  const store=(value)=>{try{localStorage.setItem(prefsKey(),JSON.stringify(value))}catch{}};
  const read=()=>{try{return JSON.parse(localStorage.getItem(prefsKey())||"null")}catch{return null}};
  const preferences=()=>({
    viewMode,quickStatus,group,institute,
    search:$("search")?.value||"",
    status:$("statusFilter")?.value||"",
    level:$("levelFilter")?.value||"",
    type:$("typeFilter")?.value||"",
    country:$("countryFilter")?.value||"",
    sort:$("sortStudents")?.value||"newest"
  });
  function ensureAccount(){
    const next=getUser()?.id||"";
    if(accountId===next)return;
    accountId=next;selected.clear();selectionMode=false;quickStatus="";group="";institute="";viewMode="list";followupReady=null;
    const saved=read();
    if(saved){
      viewMode=saved.viewMode==="cards"?"cards":"list";
      quickStatus=QUICK.includes(saved.quickStatus)?saved.quickStatus:"";
      group=clean(saved.group);institute=clean(saved.institute);
      // Search and legacy filters are restored only when requested by the user.
    }
  }
  function makeControls(){
    const filters=root.querySelector(".filters");
    if(!filters||$("studentWorkspaceBar"))return;
    const bar=document.createElement("section");
    bar.className="student-workspace-bar";bar.id="studentWorkspaceBar";bar.setAttribute("aria-label","أدوات عرض وإدارة الطلاب");
    const quick=document.createElement("div");quick.className="student-quick-filters";quick.setAttribute("role","group");quick.setAttribute("aria-label","تصفية حسب الحالة");
    for(const status of QUICK){
      const button=document.createElement("button");button.type="button";button.dataset.sw="quick";button.dataset.status=status;
      button.textContent=DISPLAY[status];quick.append(button);
    }
    const actions=document.createElement("div");actions.className="student-view-actions";
    actions.innerHTML='<button type="button" data-sw="view" data-view="list" aria-pressed="true">☰ قائمة</button><button type="button" data-sw="view" data-view="cards" aria-pressed="false">▦ بطاقات</button><button type="button" data-sw="selection">تحديد عدة طلاب</button><button type="button" data-sw="save-filter">حفظ التصفية</button><button type="button" data-sw="restore-filter">استعادة المحفوظ</button>';
    bar.append(quick,actions);filters.after(bar);
    const extra=$("studentWorkspaceExtra")||document.createElement("div");
    extra.className="student-workspace-extra";extra.id="studentWorkspaceExtra";
    extra.innerHTML='<label>المجموعة<select id="swGroup" aria-label="فلتر المجموعة"><option value="">كل المجموعات</option></select></label><label>الجهة التعليمية<select id="swInstitute" aria-label="فلتر الجهة"><option value="">كل الجهات</option></select></label>';
    const more=root.querySelector(".filters-extra");if(more)more.append(extra);
    const bulk=document.createElement("div");bulk.id="swBulk";bulk.className="student-bulk-bar";bulk.hidden=true;
    bulk.innerHTML='<span id="swBulkCount">0 محدد</span><button type="button" data-sw="select-all">تحديد الظاهر</button><select id="swStatus" aria-label="الحالة الجديدة"><option value="">تغيير الحالة إلى…</option></select><button type="button" data-sw="apply-status">تطبيق الحالة</button><input id="swNewGroup" maxlength="160" placeholder="اسم المجموعة الجديدة" aria-label="المجموعة الجديدة"><button type="button" data-sw="apply-group">نقل للمجموعة</button><button type="button" data-sw="export-selected">تصدير المحددين</button><button type="button" data-sw="clear-selected">إلغاء التحديد</button>';
    for(const value of STATUS)bulk.querySelector("#swStatus").append(new Option(value,value));
    bar.after(bulk);
  }
  function applyControls(){
    if(!$("studentWorkspaceBar"))return;
    root.querySelectorAll('[data-sw="quick"]').forEach(b=>{const active=b.dataset.status===quickStatus;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
    root.querySelectorAll('[data-sw="view"]').forEach(b=>{const active=b.dataset.view===viewMode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
    const select=$("studentRows");if(select)select.dataset.view=viewMode;
    const bulk=$("swBulk");if(bulk)bulk.hidden=!selectionMode||getTrashMode();
    const selection=root.querySelector('[data-sw="selection"]');if(selection){selection.classList.toggle("active",selectionMode);selection.setAttribute("aria-pressed",String(selectionMode))}
    if($("swBulkCount"))$("swBulkCount").textContent=selected.size+" محدد";
    if($("swGroup")&&$("swGroup").value!==group)$("swGroup").value=group;
    if($("swInstitute")&&$("swInstitute").value!==institute)$("swInstitute").value=institute;
  }
  function refreshSelect(id,key,value){
    const select=$(id);if(!select)return;
    const values=[...new Set(allStudents().map(x=>clean(x[key])).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
    if(values.join("\0")===select.dataset.values)return;
    select.dataset.values=values.join("\0");
    select.replaceChildren(new Option(key==="study_group"?"كل المجموعات":"كل الجهات",""));
    for(const option of values)select.append(new Option(option,option));
    select.value=values.includes(value)?value:"";
    if(value&&!values.includes(value)){if(key==="study_group")group="";else institute=""}
  }
  function filterStudent(student){
    ensureAccount();
    if(getTrashMode())return true;
    return (!quickStatus||student.status===quickStatus)&&(!group||student.study_group===group)&&(!institute||student.institute===institute);
  }
  function afterRowsRendered(visible){
    ensureAccount();makeControls();
    refreshSelect("swGroup","study_group",group);refreshSelect("swInstitute","institute",institute);
    const visibleIds=new Set(visible.map(s=>s.id));
    for(const id of [...selected])if(!allStudents().some(s=>s.id===id))selected.delete(id);
    if(!getTrashMode()&&selectionMode){
      const rows=$("studentRows")?.children||[];
      for(let i=0;i<rows.length;i++){
        const row=rows[i],student=visible[i];if(!student)continue;
        row.classList.add("sw-selectable");
        const label=document.createElement("label");label.className="sw-select-box";
        const check=document.createElement("input");check.type="checkbox";check.dataset.swCheck=student.id;check.checked=selected.has(student.id);
        check.setAttribute("aria-label","تحديد "+clean(student.first_name+" "+student.last_name));
        label.append(check);row.prepend(label);
      }
    }
    applyControls();
    const selectAll=root.querySelector('[data-sw="select-all"]');if(selectAll)selectAll.disabled=!visibleIds.size;
  }
  function reset(){
    selected.clear();selectionMode=false;profileRequest++;accountId="";quickStatus="";group="";institute="";viewMode="list";followupReady=null;
    if($("swBulk"))$("swBulk").hidden=true;
  }
  function clearFilters(){quickStatus="";group="";institute="";selected.clear();applyControls()}
  function prepareEditor(isEditing){
    const target=$("studentFields");if(!target)return;
    let advanced=$("swAdvancedDetails");
    if(!advanced){
      const groups=[...target.querySelectorAll(":scope > .form-section")];
      if(!groups.length)return;
      advanced=document.createElement("details");advanced.id="swAdvancedDetails";advanced.className="sw-advanced";
      const summary=document.createElement("summary");summary.textContent="تفاصيل إضافية · الحساب والدراسة والتواصل والملاحظات";
      const body=document.createElement("div");body.className="sw-advanced-body";
      const first=groups[0],grid=first.querySelector(".form-grid");
      const loginSection=document.createElement("section");loginSection.className="form-section";
      loginSection.innerHTML='<header class="form-section-head"><h3>حساب الطالب</h3><p>بيانات اختيارية — تعامل مع كلمات السر بحذر</p></header>';
      const loginGrid=document.createElement("div");loginGrid.className="form-grid";
      for(const key of ["username","login_password"]){const field=grid?.querySelector('[name="'+key+'"]')?.closest(".field");if(field)loginGrid.append(field)}
      loginSection.append(loginGrid);body.append(loginSection);
      for(const section of groups.slice(1))body.append(section);
      advanced.append(summary,body);target.append(advanced);
      first.querySelector(".form-section-head p").textContent="الاسم والحالة والدولة فقط؛ بقية البيانات اختيارية";
    }
    advanced.open=Boolean(isEditing);
    const first=$("student_first_name");if(first)setTimeout(()=>first.focus(),0);
  }
  function showReminderStatus(message){
    const status=$("swFollowupStatus");if(status)status.textContent=message;
  }
  function renderProfile(student){
    const container=$("profileContent");if(!container||!student)return;
    const section=document.createElement("section");section.className="profile-section sw-followup-section";
    section.innerHTML='<header class="profile-section-head"><h3>المتابعة والتذكيرات</h3><span>سجل مستقل عن الجدول الأسبوعي</span></header><div class="sw-followup-shell"><form id="swFollowupForm"><label>نوع المتابعة<select id="swFollowupKind"><option value="note">ملاحظة</option><option value="contact">تواصل مع الطالب</option><option value="reminder">تذكير متابعة</option></select></label><label>تفاصيل المتابعة<textarea id="swFollowupBody" maxlength="2000" rows="2" required placeholder="ماذا حدث أو ماذا تريد أن تتذكر؟"></textarea></label><label>موعد التذكير (اختياري)<input id="swFollowupDue" type="date"></label><button type="submit" class="btn primary" id="swFollowupSave">حفظ المتابعة</button></form><div id="swFollowupStatus" role="status">جارٍ تحميل سجل المتابعة…</div><div id="swFollowupItems" class="sw-followup-items"></div></div>';
    container.append(section);
    const contact=document.createElement("section");contact.className="profile-section sw-message-section";
    contact.innerHTML='<header class="profile-section-head"><h3>رسائل جاهزة</h3><span>راجع الرسالة قبل إرسالها</span></header><div class="sw-message-row"><select id="swMessageTemplate" aria-label="قالب الرسالة"><option value="welcome">ترحيب</option><option value="followup">متابعة الدراسة</option><option value="resume">استئناف الدروس</option></select><button type="button" class="btn" data-sw="copy-message">نسخ الرسالة</button><button type="button" class="btn primary" data-sw="open-whatsapp">فتح واتساب</button></div><p class="sw-message-hint">لا تُرسل أي رسالة تلقائيًا؛ يمكنك تعديلها قبل الإرسال.</p>';
    container.append(contact);
    loadFollowups(student.id);
  }
  const template=(student,kind)=>{
    const name=clean([student.first_name,student.last_name].filter(Boolean).join(" "));
    const greetings={
      welcome:"السلام عليكم "+name+"، أهلًا وسهلًا بك! يسعدني أن نبدأ رحلتنا في تعلم العربية.",
      followup:"السلام عليكم "+name+"، أطمئن عليك وعلى سير دراستك. كيف تسير الأمور معك؟",
      resume:"السلام عليكم "+name+"، أتمنى أن تكون بخير. هل يناسبك استئناف دروس العربية خلال الفترة القادمة؟"
    };
    return greetings[kind]||greetings.followup;
  };
  function getCurrentStudent(){return allStudents().find(s=>s.id===getActiveStudentId())||null}
  function contactMessage(open){
    const student=getCurrentStudent();if(!student)return;
    const msg=template(student,$("swMessageTemplate")?.value||"followup");
    if(!open){
      navigator.clipboard?.writeText(msg).then(()=>show("تم نسخ الرسالة.")).catch(()=>show("تعذّر النسخ. جرّب تحديد النص يدويًا.",true));
      return;
    }
    const number=clean(student.whatsapp).replace(/\D/g,"");
    if(!number){show("أضف رقم واتساب لهذا الطالب أولًا.",true);return}
    window.open("https://wa.me/"+number+"?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
  }
  async function loadFollowups(studentId){
    if(!owned())return;
    const token=++profileRequest,uid=getUser().id;
    const {data,error}=await cloud.from(FOLLOWUPS_TABLE).select("id,student_id,kind,body,due_on,done_at,created_at").eq("user_id",uid).eq("student_id",studentId).order("created_at",{ascending:false}).limit(120);
    if(token!==profileRequest||getActiveStudentId()!==studentId||getUser()?.id!==uid)return;
    if(error){
      followupReady=false;
      showReminderStatus("سجل المتابعة يحتاج تفعيل جدول البيانات الجديد في Supabase قبل استخدامه.");
      const form=$("swFollowupForm");if(form)form.querySelector("button").disabled=true;
      return;
    }
    followupReady=true;showReminderStatus((data||[]).length?"":"لا توجد متابعات مسجّلة بعد.");
    const list=$("swFollowupItems");if(!list)return;list.replaceChildren();
    for(const item of data||[]){
      const article=document.createElement("article");article.className="sw-followup-item";
      const head=document.createElement("div");head.className="sw-followup-head";
      const title=document.createElement("strong");title.textContent=({note:"ملاحظة",contact:"تواصل",reminder:"تذكير"}[item.kind]||"متابعة")+(item.done_at?" · مكتمل":"");
      const when=document.createElement("time");when.textContent=new Date(item.created_at).toLocaleDateString("ar-EG");
      head.append(title,when);
      const body=document.createElement("p");body.textContent=item.body;
      article.append(head,body);
      if(item.due_on){
        const due=document.createElement("span");due.className="sw-due";due.textContent="موعد المتابعة: "+item.due_on;
        if(!item.done_at&&item.due_on<=new Date().toISOString().slice(0,10))due.classList.add("overdue");
        article.append(due);
      }
      const controls=document.createElement("div");controls.className="sw-followup-actions";
      if(!item.done_at){const done=document.createElement("button");done.type="button";done.dataset.sw="complete-followup";done.dataset.followupId=item.id;done.textContent="تمّت المتابعة";controls.append(done)}
      const remove=document.createElement("button");remove.type="button";remove.dataset.sw="remove-followup";remove.dataset.followupId=item.id;remove.textContent="حذف";controls.append(remove);
      article.append(controls);list.append(article);
    }
  }
  async function addFollowup(event){
    event.preventDefault();const student=getCurrentStudent();if(!student||!owned())return;
    const body=clean($("swFollowupBody")?.value);if(!body){show("اكتب تفاصيل المتابعة.",true);return}
    const kind=$("swFollowupKind")?.value||"note",due=$("swFollowupDue")?.value||null;
    const button=$("swFollowupSave");button.disabled=true;
    try{
      const {error}=await cloud.from(FOLLOWUPS_TABLE).insert({user_id:getUser().id,student_id:student.id,kind,body:body.slice(0,2000),due_on:due});
      if(error)throw error;
      $("swFollowupBody").value="";$("swFollowupDue").value="";
      await loadFollowups(student.id);show("تم حفظ المتابعة.");
    }catch(e){show("تعذّر حفظ المتابعة. تأكد من تفعيل جدول البيانات.",true)}
    finally{button.disabled=false}
  }
  async function mutateFollowup(id,remove){
    const student=getCurrentStudent();if(!student||!owned())return;
    if(remove&&!confirm("حذف هذه المتابعة؟"))return;
    const query=remove
      ?cloud.from(FOLLOWUPS_TABLE).delete()
      :cloud.from(FOLLOWUPS_TABLE).update({done_at:new Date().toISOString()});
    const {error}=await query.eq("id",id).eq("student_id",student.id).eq("user_id",getUser().id);
    if(error){show("تعذّر تعديل المتابعة.",true);return}
    await loadFollowups(student.id);
  }
  async function bulkChange(field,value){
    const uid=getUser()?.id,ids=[...selected].filter(id=>allStudents().some(s=>s.id===id));
    if(!uid||!ids.length){show("حدّد طالبًا واحدًا على الأقل.",true);return}
    if(!value){show("اختر قيمة أولًا.",true);return}
    if(!confirm("تطبيق "+(field==="status"?"الحالة":"المجموعة")+" على "+ids.length+" طالب؟"))return;
    const {data,error}=await cloud.from("mawaeidi_students").update({[field]:value}).eq("user_id",uid).is("deleted_at",null).in("id",ids).select("id");
    if(error){show("تعذّر تطبيق التغييرات.",true);return}
    if((data||[]).length!==ids.length){show("لم يتم تحديث كل الملفات. حدّث البيانات وراجع النتائج.",true);await refresh();return}
    selected.clear();selectionMode=false;await refresh();show("تم تحديث "+ids.length+" ملف طالب.");
  }
  function exportSelected(){
    const rows=allStudents().filter(s=>selected.has(s.id));
    if(!rows.length){show("حدّد الطلاب أولًا.",true);return}
    const keys=[["الاسم الأول","first_name"],["اسم العائلة","last_name"],["الحالة","status"],["الدولة","country"],["المستوى","current_level"],["المجموعة","study_group"],["الجهة","institute"],["الدورة","course_book"],["البريد","email"],["واتساب","whatsapp"]];
    const q=s=>'"'+String(s??"").replace(/"/g,'""')+'"';
    const csv="\ufeff"+[keys.map(x=>x[0]).map(q).join(","),...rows.map(s=>keys.map(x=>q(s[x[1]])).join(","))].join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="mawaeidi-selected-students.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    show("تم تصدير بيانات "+rows.length+" طالب بدون كلمات مرور.");
  }
  function restorePreferences(){
    const saved=read();if(!saved){show("لم تحفظ تصفية بعد.",true);return}
    quickStatus=QUICK.includes(saved.quickStatus)?saved.quickStatus:"";
    group=clean(saved.group);institute=clean(saved.institute);
    viewMode=saved.viewMode==="cards"?"cards":"list";
    for(const [id,key] of [["search","search"],["statusFilter","status"],["levelFilter","level"],["typeFilter","type"],["countryFilter","country"],["sortStudents","sort"]])if($(id)&&typeof saved[key]==="string")$(id).value=saved[key];
    applyControls();requestRender();show("تمت استعادة التصفية المحفوظة.");
  }
  async function handleClick(event){
    const b=event.target.closest("[data-sw]");if(!b||!root.contains(b))return;
    const action=b.dataset.sw;
    if(action==="quick"){quickStatus=b.dataset.status;requestRender()}
    else if(action==="view"){viewMode=b.dataset.view;store({...preferences(),viewMode});applyControls()}
    else if(action==="selection"){selectionMode=!selectionMode;if(!selectionMode)selected.clear();requestRender()}
    else if(action==="select-all"){
      const visible=[...$("studentRows").querySelectorAll(".student-open[data-id]")].map(x=>x.dataset.id);
      for(const id of visible)selected.add(id);requestRender();
    }
    else if(action==="clear-selected"){selected.clear();selectionMode=false;requestRender()}
    else if(action==="save-filter"){store(preferences());show("تم حفظ التصفية على هذا الجهاز.");}
    else if(action==="restore-filter")restorePreferences();
    else if(action==="apply-status")await bulkChange("status",$("swStatus")?.value||"");
    else if(action==="apply-group")await bulkChange("study_group",clean($("swNewGroup")?.value).slice(0,160));
    else if(action==="export-selected")exportSelected();
    else if(action==="copy-message")contactMessage(false);
    else if(action==="open-whatsapp")contactMessage(true);
    else if(action==="complete-followup")await mutateFollowup(b.dataset.followupId,false);
    else if(action==="remove-followup")await mutateFollowup(b.dataset.followupId,true);
  }
  function handleChange(e){
    if(e.target.matches('[data-sw-check]')){if(e.target.checked)selected.add(e.target.dataset.swCheck);else selected.delete(e.target.dataset.swCheck);applyControls()}
    if(e.target.id==="swGroup"){group=e.target.value;requestRender()}
    if(e.target.id==="swInstitute"){institute=e.target.value;requestRender()}
  }
  root.addEventListener("click",e=>{void handleClick(e)});
  root.addEventListener("change",handleChange);
  root.addEventListener("submit",e=>{if(e.target.id==="swFollowupForm")void addFollowup(e)});
  makeControls();
  return Object.freeze({filterStudent,afterRowsRendered,reset,clearFilters,prepareEditor,renderProfile});
}
window.MawaeidiStudentWorkspace=Object.freeze({create});
})();
