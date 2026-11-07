/* Mawaeidi owner support: audited, read-only account previews.
   The administrator always remains logged in as themselves.
   Server authorization happens on each RPC. No impersonation token is issued. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const client = window.mawaeidiAdminClient;
  const durationMs = 15 * 60 * 1000;
  const fmtNumber = new Intl.NumberFormat("ar-EG");
  const fmtDate = new Intl.DateTimeFormat("ar-EG",{
    timeZone:"Africa/Cairo",dateStyle:"medium",timeStyle:"short"
  });
  let target = null;
  let pending = false;
  let timeout = null;

  function node(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined && content !== null) el.textContent = String(content);
    return el;
  }
  function text(value, fallback = "—") {
    return (value === null || value === undefined || value === "")
      ? fallback : String(value);
  }
  function clearError() {
    $("supportError").hidden = true;
    $("supportError").textContent = "";
  }
  function error(message) {
    $("supportError").hidden = false;
    $("supportError").textContent = message;
  }
  function clearSnapshot() {
    window.clearTimeout(timeout); timeout = null;
    ["supportResultTitle","supportLessonCount","supportStudentCount",
      "supportTimeZone","supportClockZones"].forEach(id => $(id).textContent = "");
    $("supportLessons").replaceChildren();
    $("supportStudents").replaceChildren();
    $("supportResult").hidden = true;
  }
  function close() {
    clearSnapshot();
    target = null;
    pending = false;
    $("supportPreviewButton").disabled = false;
    $("supportPreviewButton").textContent = "عرض الحساب — قراءة فقط";
    $("supportReason").value = "";
    $("supportRequestForm").hidden = false;
    $("supportPanel").hidden = true;
    clearError();
  }
  function open(user) {
    if (!user || !user.id || pending) return;
    close();
    target = {id:user.id,email:user.email||"",name:user.name||""};
    $("supportSelectedUser").textContent = target.name
      ? target.name + " — " + target.email : target.email;
    $("supportPanel").hidden = false;
    $("supportPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
    $("supportReason").focus();
  }
  function item(label,description) {
    const el = node("div","support-entry");
    const heading = node("strong","",label);
    el.append(heading);
    if (description) el.append(node("p","",description));
    return el;
  }
  function paint(snapshot) {
    const profile = snapshot?.user || {};
    $("supportResultTitle").textContent =
      text(profile.name, "عضو الفريق") + " — " + text(profile.email);
    $("supportLessonCount").textContent = fmtNumber.format(Number(snapshot.lessons_count)||0);
    $("supportStudentCount").textContent = fmtNumber.format(Number(snapshot.students_count)||0);
    $("supportTimeZone").textContent = text(snapshot.clock?.base_zone,"غير محدد");
    const lessons = Array.isArray(snapshot.lessons) ? snapshot.lessons : [];
    $("supportLessons").replaceChildren();
    if (!lessons.length) {
      $("supportLessons").append(node("p","support-empty","لا توجد مواعيد مسجلة."));
    }
    lessons.forEach(l => {
      const schedule = Array.isArray(l.schedules) ? l.schedules : [];
      const when = schedule.map(sc => [sc?.day,sc?.time].filter(Boolean).join(" · "))
        .filter(Boolean).join("، ");
      const details = [l.subject,l.type,l.duration ? text(l.duration)+" دقيقة" : "",
        when,l.platform].filter(Boolean).map(String).join(" · ");
      $("supportLessons").append(item(text(l.name,"حصة بدون اسم"),details));
    });
    const students = Array.isArray(snapshot.students) ? snapshot.students : [];
    $("supportStudents").replaceChildren();
    if (!students.length) $("supportStudents").append(
      node("p","support-empty","لا يوجد طلاب مسجلون."));
    students.forEach(s => {
      const details = [s.status,s.level,s.country].filter(Boolean).map(String).join(" · ");
      $("supportStudents").append(item(text(s.name,"طالب"),details));
    });
    const zones = Array.isArray(snapshot.clock?.zones) ? snapshot.clock.zones : [];
    $("supportClockZones").textContent = zones.length
      ? "المناطق المضافة للساعة العالمية: " + zones.map(z => text(z)).join("، ")
      : "لا توجد مناطق إضافية مسجلة في الساعة العالمية.";
    $("supportRequestForm").hidden = true;
    $("supportResult").hidden = false;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      close();
    },durationMs);
    $("supportPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  $("supportRequestForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (pending || !target || !client) return;
    const reason = $("supportReason").value.trim();
    if (reason.length < 8 || reason.length > 240) {
      error("اكتب سببًا واضحًا لا يقل عن ٨ أحرف."); return;
    }
    clearError();
    pending = true;
    $("supportPreviewButton").disabled = true;
    $("supportPreviewButton").textContent = "جارٍ تحميل المعاينة…";
    try {
      const {data,error:rpcError} = await client.rpc("mawaeidi_admin_support_preview",{
        p_target:target.id,p_reason:reason
      });
      if (rpcError) throw rpcError;
      if (!data || data.readonly !== true) throw Error("invalid_preview");
      paint(data);
    } catch (failure) {
      error(failure?.code === "42501"
        ? "هذه المعاينة مخصصة لحساب المدير فقط."
        : "تعذّر عرض الحساب. تحقق من اتصالك وحاول مرة أخرى.");
    } finally {
      pending = false;
      $("supportPreviewButton").disabled = false;
      $("supportPreviewButton").textContent = "عرض الحساب — قراءة فقط";
    }
  });
  $("supportCancelRequest").addEventListener("click", close);
  $("supportCloseResult").addEventListener("click", close);

  async function showHistory() {
    const panel = $("supportHistory");
    if (!panel.hidden) {
      panel.hidden = true;
      $("supportHistoryList").replaceChildren();
      return;
    }
    panel.hidden = false;
    const list = $("supportHistoryList");
    list.replaceChildren(node("p","support-empty","جارٍ تحميل السجل…"));
    try {
      const { data, error:rpcError } = await client.rpc(
        "mawaeidi_admin_support_history",{p_limit:20});
      if (rpcError) throw rpcError;
      list.replaceChildren();
      const records = Array.isArray(data) ? data : [];
      if (!records.length) list.append(
        node("p","support-empty","لا توجد معاينات سابقة."));
      records.forEach(entry => {
        const row = item(
          text(entry.target_name,"مستخدم") + " — " + text(entry.target_email),
          text(entry.reason) + " · " +
            (entry.created_at ? fmtDate.format(new Date(entry.created_at)) : "—")
        );
        list.append(row);
      });
    } catch {
      list.replaceChildren(node("p","support-empty",
        "تعذر قراءة سجل المعاينات. جرّب مرة أخرى."));
    }
  }
  $("supportHistoryButton").addEventListener("click", showHistory);

  document.addEventListener("visibilitychange",() => {
    if (document.hidden && !$("supportResult").hidden) close();
  });
  client?.auth.onAuthStateChange(event => {
    if (event === "SIGNED_OUT") {
      close();
      $("supportHistory").hidden = true;
      $("supportHistoryList").replaceChildren();
    }
  });
  window.addEventListener("pagehide",close);
  window.mawaeidiAdminSupport = {open,close};
})();
