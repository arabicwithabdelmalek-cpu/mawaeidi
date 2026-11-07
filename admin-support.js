/* Mawaeidi owner: site-like READ-ONLY member preview.
 * No impersonation, no account switch, no secret fields or write actions.
 * Every open goes through the admin-only RPC that records an audit event.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const client = window.mawaeidiAdminClient;
  const PANEL = $("supportPanel");
  const AUDIT_CONTEXT = "معاينة إدارية من لوحة إدارة الحسابات";
  const DAYS = ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];
  const num = new Intl.NumberFormat("ar-EG");
  const eventTime = new Intl.DateTimeFormat("ar-EG",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"
  });
  const previewMaxMs = 15 * 60 * 1000;
  let openGeneration = 0;
  let closeTimer = null;
  let clockTimer = null;
  let previousFocus = null;
  let clockZones = [];

  function element(tag, className = "", content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined && content !== null) el.textContent = String(content);
    return el;
  }
  function safeText(value, fallback = "—") {
    return value === undefined || value === null || value === ""
      ? fallback : String(value);
  }
  function empty(text) { return element("p","support-app-empty",text); }
  function clearView() {
    window.clearTimeout(closeTimer);
    window.clearInterval(clockTimer);
    closeTimer = null;
    clockTimer = null;
    clockZones = [];
    ["supportWeek","supportWorldClocks","supportStudents"].forEach(id => $(id).replaceChildren());
    ["supportLessonCount","supportStudentCount","supportTimeZone"].forEach(id => $(id).textContent = "");
    $("supportResult").hidden = true;
  }
  function close() {
    ++openGeneration;
    clearView();
    PANEL.hidden = true;
    $("supportLoading").hidden = false;
    $("supportError").hidden = true;
    $("supportError").textContent = "";
    $("supportSelectedUser").textContent = "";
    document.body.classList.remove("support-preview-open");
    if (previousFocus?.isConnected && typeof previousFocus.focus === "function")
      previousFocus.focus();
    previousFocus = null;
  }

  function switchTab(key) {
    const keys = ["schedule","world","students"];
    if (!keys.includes(key)) return;
    keys.forEach(name => {
      const id = name === "schedule" ? "Schedule" : name === "world" ? "World" : "Students";
      const active = name === key;
      $("supportTab" + id).classList.toggle("active",active);
      $("supportTab" + id).setAttribute("aria-pressed",String(active));
      $("supportView" + id).hidden = !active;
    });
    if (key === "world") updateClocks();
  }

  function chip(label,type="") {
    return element("span","support-app-chip" + (type ? " "+type : ""),label);
  }
  function lessonType(value) {
    return value === "teach" ? "أُدرّس" : value === "learn" ? "أدرس" : safeText(value,"درس");
  }
  function displayDay(day) {
    const d = safeText(day,"");
    if (DAYS.includes(d)) return d;
    return d === "الإثنين" ? "الاثنين" : d;
  }
  function timeSort(value) {
    const match = String(value||"").match(/^(\d{1,2}):(\d{2})/);
    return match ? Number(match[1])*60 + Number(match[2]) : 9999;
  }
  function lessonCard(entry) {
    const card = element("article","support-app-lesson");
    const time = element("div","support-app-lesson-time",safeText(entry.time,"غير محدد"));
    const detail = element("div","support-app-lesson-info");
    detail.append(element("strong","",safeText(entry.lesson.name,"حصة بدون عنوان")));
    const secondary = [entry.lesson.subject,entry.lesson.platform,
      entry.lesson.duration ? String(entry.lesson.duration)+" دقيقة" : null]
      .filter(Boolean).map(String).join(" · ");
    if (secondary) detail.append(element("small","",secondary));
    card.append(time,detail,chip(lessonType(entry.lesson.type),
      entry.lesson.type === "learn" ? "learn" : "teach"));
    return card;
  }
  function renderSchedule(data) {
    const all = Array.isArray(data.lessons) ? data.lessons : [];
    $("supportLessonCount").textContent = num.format(Number(data.lessons_count)||all.length);
    const grouped = new Map(DAYS.map(day => [day,[]]));
    const extras = [];
    all.forEach(lesson => {
      const schedules = Array.isArray(lesson.schedules) ? lesson.schedules : [];
      schedules.forEach(s => {
        const day = displayDay(s?.day);
        const record = { lesson, time:safeText(s?.time,"") };
        if (grouped.has(day)) grouped.get(day).push(record);
        else extras.push({day:day||"غير محدد",...record});
      });
    });
    $("supportWeek").replaceChildren();
    DAYS.forEach(day => {
      const events = grouped.get(day).sort((a,b)=>timeSort(a.time)-timeSort(b.time));
      const dayCard = element("section","support-app-day"+(!events.length?" quiet":""));
      const head = element("header","support-app-day-head");
      head.append(element("h4","",day));
      head.append(element("span","",num.format(events.length)+" حصة"));
      dayCard.append(head);
      const list = element("div","support-app-day-list");
      if (events.length) events.forEach(evt => list.append(lessonCard(evt)));
      else list.append(element("p","support-app-no-sessions","لا توجد حصص"));
      dayCard.append(list);
      $("supportWeek").append(dayCard);
    });
    if (extras.length) {
      const extraGroup = element("section","support-app-day");
      extraGroup.append(element("h4","support-app-extra-title","مواعيد أخرى"));
      extras.forEach(evt => extraGroup.append(lessonCard(evt)));
      $("supportWeek").append(extraGroup);
    }
  }

  function clockString(zone) {
    try {
      const date = new Date();
      return {
        time:new Intl.DateTimeFormat("ar-EG",{
          timeZone:zone,hour:"2-digit",minute:"2-digit",hour12:true
        }).format(date),
        date:new Intl.DateTimeFormat("ar-EG",{
          timeZone:zone,weekday:"long",day:"numeric",month:"long"
        }).format(date)
      };
    } catch { return {time:"—",date:"منطقة زمنية غير متاحة"}; }
  }
  function updateClocks() {
    const cards = $("supportWorldClocks").querySelectorAll("[data-zone]");
    cards.forEach(card => {
      const parts = clockString(card.dataset.zone);
      card.querySelector(".support-app-clock-time").textContent = parts.time;
      card.querySelector(".support-app-clock-date").textContent = parts.date;
    });
  }
  function renderClocks(data) {
    const base = typeof data.clock?.base_zone === "string" && data.clock.base_zone
      ? data.clock.base_zone : "Africa/Cairo";
    $("supportTimeZone").textContent = base.replaceAll("_"," ");
    const others = Array.isArray(data.clock?.zones) ? data.clock.zones : [];
    clockZones = [...new Set([base,...others.filter(z => typeof z === "string" && z.length < 90)])]
      .slice(0,30);
    $("supportWorldClocks").replaceChildren();
    clockZones.forEach((zone,i) => {
      const card = element("article","support-app-clock"+(i===0?" primary":""));
      card.dataset.zone = zone;
      const desc = element("div","support-app-clock-desc");
      desc.append(chip(i===0 ? "التوقيت الأساسي" : "مدينة مضافة",i===0?"base":""));
      desc.append(element("h4","",zone.replaceAll("_"," ")));
      const time = element("div","support-app-clock-time");
      const date = element("div","support-app-clock-date");
      card.append(desc,time,date);
      $("supportWorldClocks").append(card);
    });
    updateClocks();
  }
  function renderStudents(data) {
    const students = Array.isArray(data.students) ? data.students : [];
    $("supportStudentCount").textContent = num.format(Number(data.students_count)||0);
    $("supportStudents").replaceChildren();
    if (!students.length) {
      $("supportStudents").append(empty("لا توجد بيانات طلاب لهذا الحساب."));
      return;
    }
    students.forEach(person => {
      const card = element("article","support-app-student");
      const first = safeText(person.name,"طالب");
      const avatar = element("span","support-app-student-avatar",first.trim().charAt(0) || "ط");
      const details = element("div","support-app-student-details");
      details.append(element("strong","",first));
      const subtitle = [person.country,person.level].filter(Boolean).map(String).join(" · ");
      details.append(element("small","",subtitle||"بيانات طالب"));
      card.append(avatar,details,chip(safeText(person.status,"غير محدد"),"status"));
      $("supportStudents").append(card);
    });
    if (students.length < Number(data.students_count)) {
      $("supportStudents").append(empty(
        "يعرض هذا القسم أول "+num.format(students.length)+" سجلًا من ملخص الطلاب."));
    }
  }

  function paint(snapshot) {
    $("supportSelectedUser").textContent = [
      snapshot.user?.name,snapshot.user?.email
    ].filter(Boolean).join(" · ") || "حساب عضو الفريق";
    renderSchedule(snapshot);
    renderClocks(snapshot);
    renderStudents(snapshot);
    $("supportLoading").hidden = true;
    $("supportResult").hidden = false;
    switchTab("schedule");
    clockTimer = window.setInterval(updateClocks,60*1000);
    closeTimer = window.setTimeout(close,previewMaxMs);
  }

  async function open(user) {
    if (!user?.id || !client) return;
    const generation = ++openGeneration;
    clearView();
    if (PANEL.hidden) previousFocus = document.activeElement;
    PANEL.hidden = false;
    document.body.classList.add("support-preview-open");
    $("supportError").hidden = true;
    $("supportError").textContent = "";
    $("supportResult").hidden = true;
    $("supportLoading").hidden = false;
    $("supportSelectedUser").textContent = [
      user.name,user.email
    ].filter(Boolean).join(" · ") || "عضو الفريق";
    PANEL.focus();
    try {
      const {data,error} = await client.rpc("mawaeidi_admin_support_preview",{
        p_target:user.id,p_reason:AUDIT_CONTEXT
      });
      if (generation !== openGeneration || PANEL.hidden) return;
      if (error) throw error;
      if (!data || data.readonly !== true || data.user?.id !== user.id)
        throw new Error("invalid_preview_response");
      paint(data);
    } catch (failure) {
      if (generation !== openGeneration || PANEL.hidden) return;
      $("supportLoading").hidden = true;
      $("supportError").hidden = false;
      $("supportError").textContent = failure?.code === "42501"
        ? "المعاينة متاحة لحساب المدير فقط."
        : "تعذّر عرض واجهة هذا الحساب. أغلق المعاينة وحاول مرة أخرى.";
    }
  }

  $("supportCloseResult").addEventListener("click",close);
  for (const name of ["Schedule","World","Students"]) {
    const key = name === "Schedule" ? "schedule" : name === "World" ? "world" : "students";
    $("supportTab"+name).addEventListener("click",()=>switchTab(key));
  }

  const historyButton = $("supportHistoryButton");
  historyButton.addEventListener("click",async () => {
    const section = $("supportHistory");
    if (!section.hidden) {
      section.hidden = true;
      $("supportHistoryList").replaceChildren();
      return;
    }
    section.hidden = false;
    const list = $("supportHistoryList");
    list.replaceChildren(empty("جارٍ تحميل السجل…"));
    try {
      const {data,error} = await client.rpc("mawaeidi_admin_support_history",{p_limit:20});
      if (error) throw error;
      list.replaceChildren();
      if (!Array.isArray(data)||!data.length) list.append(empty("لا توجد معاينات سابقة."));
      else data.forEach(entry => {
        const row = element("div","support-entry");
        row.append(element("strong","",[
          entry.target_name,entry.target_email
        ].filter(Boolean).join(" · ")));
        if (entry.created_at) {
          const date = new Date(entry.created_at);
          row.append(element("small","",
            Number.isNaN(date.getTime()) ? "—" : eventTime.format(date)));
        }
        list.append(row);
      });
    } catch {
      list.replaceChildren(empty("تعذّر تحميل سجل المعاينات."));
    }
  });
  document.addEventListener("keydown",event => {
    if (PANEL.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    // Prevent keyboard focus from escaping to the interactive admin page behind.
    if (event.key === "Tab") {
      const buttons = Array.from(PANEL.querySelectorAll("button"))
        .filter(el => !el.disabled && !el.closest("[hidden]") && el.getClientRects().length);
      if (!buttons.length) { event.preventDefault(); PANEL.focus(); return; }
      const first = buttons[0], last = buttons[buttons.length-1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === PANEL)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });
  document.addEventListener("visibilitychange",() => {
    if (document.hidden && !PANEL.hidden) close();
  });
  window.addEventListener("pagehide",close);
  let lastSessionUserId = null;
  client?.auth.onAuthStateChange((event,session) => {
    if (event === "SIGNED_OUT" ||
        (lastSessionUserId && session?.user?.id && session.user.id !== lastSessionUserId)) {
      close();
      $("supportHistory").hidden = true;
      $("supportHistoryList").replaceChildren();
    }
    lastSessionUserId = session?.user?.id || null;
  });
  window.mawaeidiAdminSupport = {open,close};
})();
