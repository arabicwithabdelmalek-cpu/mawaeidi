/* Admin reporting for Mawaeidi. The database authorizes every report request. */
(() => {
  "use strict";
  const SUPABASE_URL = "https://nvefdkkjkyalpsrgoffj.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_t0pqtkV0-3Wj0htl-eGR9w_BsifiUDE";
  const $ = id => document.getElementById(id);
  const errorBox = $("errorBox");
  const dashboard = $("dashboard");
  const loading = $("loading");
  const sb = window.supabase?.createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const cairoParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit"
  });
  const displayDate = new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short"
  });
  let users = [], sessions = [], chosenId = null, pending = false;
  const nowMs = () => Date.now();
  const dateKey = date => {
    const pieces = Object.fromEntries(cairoParts.formatToParts(date).map(p => [p.type, p.value]));
    return [pieces.year, pieces.month, pieces.day].join("-");
  };
  const toMs = value => {
    const n = new Date(value).getTime();
    return Number.isFinite(n) ? n : 0;
  };
  const todayKey = () => dateKey(new Date());
  const daysCount = () => Number($("period").value) || 30;
  const number = n => new Intl.NumberFormat("ar-EG").format(n || 0);
  const age = timestamp => {
    const ms = toMs(timestamp);
    if (!ms) return "لا توجد زيارة مسجلة";
    const diff = Math.max(0, nowMs() - ms);
    if (diff < 5 * 60 * 1000) return "نشط الآن";
    if (diff < 60 * 60 * 1000) return "منذ " + number(Math.ceil(diff / 60000)) + " دقيقة";
    if (diff < 24 * 60 * 60 * 1000) return "منذ " + number(Math.floor(diff / 3600000)) + " ساعات";
    return displayDate.format(new Date(ms));
  };
  const duration = seconds => {
    if (!seconds) return "أقل من دقيقة";
    const mins = Math.floor(seconds / 60);
    if (!mins) return "أقل من دقيقة";
    const hrs = Math.floor(mins / 60), remaining = mins % 60;
    return hrs ? number(hrs) + " س" + (remaining ? " " + number(remaining) + " د" : "")
      : number(mins) + " دقيقة";
  };
  const sessionMillis = s => toMs(s.started_at);
  const inRange = (s, days) => sessionMillis(s) >= nowMs() - days * 86400000;
  const matchingSessions = (id, days) => sessions.filter(s =>
    s.user_id === id && inRange(s, days));
  const latestSession = id => sessions
    .filter(s => s.user_id === id).sort((a, b) =>
      toMs(b.last_seen_at) - toMs(a.last_seen_at))[0] || null;
  const secondsSum = items => items.reduce((sum, s) =>
    sum + (Number.isFinite(Number(s.active_seconds)) ? Math.max(0, Number(s.active_seconds)) : 0), 0);

  function personStats(person) {
    const all = sessions.filter(s => s.user_id === person.id);
    const today = todayKey();
    const todays = all.filter(s => dateKey(new Date(sessionMillis(s))) === today);
    const usedToday = all.some(s => dateKey(new Date(toMs(s.last_seen_at))) === today);
    const period = all.filter(s => inRange(s, daysCount()));
    const mostRecent = latestSession(person.id);
    return {
      todayVisits: todays.length,
      usedToday, visits: period.length,
      activeSeconds: secondsSum(period),
      lastSeen: mostRecent?.last_seen_at || null,
      isOnline: mostRecent && nowMs() - toMs(mostRecent.last_seen_at) < 300000
    };
  }

  function makeEl(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = String(content);
    return el;
  }
  function refreshSummary() {
    $("statUsers").textContent = number(users.length);
    const stats = users.map(personStats);
    $("statActiveToday").textContent = number(stats.filter(s => s.usedToday).length);
    $("statVisitsToday").textContent = number(stats.reduce((n, s) => n + s.todayVisits, 0));
    $("statInactiveToday").textContent = number(stats.filter(s => !s.usedToday).length);
  }
  function drawChart() {
    const days = daysCount();
    const el = $("dailyChart");
    el.replaceChildren();
    const daily = new Map();
    sessions.filter(s => inRange(s, days)).forEach(s => {
      const key = dateKey(new Date(sessionMillis(s)));
      daily.set(key, (daily.get(key) || 0) + 1);
    });
    const keys = Array.from({ length: days }, (_, i) =>
      dateKey(new Date(nowMs() - (days - 1 - i) * 86400000)));
    const bins = days === 90
      ? Array.from({ length: 13 }, (_, i) => {
          const batch = keys.slice(i * 7, (i + 1) * 7);
          return { label: batch.length ? batch[0].slice(5).replace("-", "/") : "",
            total: batch.reduce((n, k) => n + (daily.get(k) || 0), 0), isToday: i === 12 };
        })
      : keys.map((key, i) => ({
          label: key.slice(5).replace("-", "/"),
          total: daily.get(key) || 0,
          isToday: i === keys.length - 1
        }));
    const high = Math.max(1, ...bins.map(b => b.total));
    bins.forEach(bin => {
      const box = makeEl("div", "bar-item" + (bin.isToday ? " today" : ""));
      box.title = bin.label + ": " + number(bin.total) + " زيارة";
      box.append(makeEl("span", "bar-num", bin.total ? number(bin.total) : " "));
      const track = makeEl("div", "bar-track");
      const fill = makeEl("div", "bar-fill");
      fill.style.height = Math.max(3, (bin.total / high) * 100) + "%";
      track.append(fill);
      box.append(track, makeEl("span", "bar-day", bin.label));
      el.append(box);
    });
    $("chartTitle").textContent = days === 90 ? "حركة الزيارات الأسبوعية" : "حركة الزيارات اليومية";
    el.setAttribute("aria-label", "عدد الزيارات في الفترة: " +
      number(bins.reduce((n, x) => n + x.total, 0)));
  }
  function renderUsers() {
    const term = $("userSearch").value.trim().toLowerCase();
    const tbody = $("usersBody");
    tbody.replaceChildren();
    const sorted = users.filter(u => [u.name, u.email].some(v =>
      String(v || "").toLowerCase().includes(term)))
      .sort((a, b) => toMs(personStats(b).lastSeen) - toMs(personStats(a).lastSeen));
    if (!sorted.length) {
      const tr = makeEl("tr");
      const td = makeEl("td", "", "لا توجد حسابات مطابقة.");
      td.colSpan = 6; tr.append(td); tbody.append(tr); return;
    }
    sorted.forEach(user => {
      const stat = personStats(user);
      const tr = makeEl("tr");
      const tdPerson = makeEl("td");
      const person = makeEl("div", "person");
      const initial = [...(user.name || user.email || "م")][0] || "م";
      person.append(makeEl("span", "avatar", initial));
      const names = makeEl("div");
      names.append(makeEl("div", "person-name", user.name || "مستخدم"),
        makeEl("div", "person-mail", user.email || ""));
      person.append(names);
      tdPerson.append(person);
      const tdLast = makeEl("td");
      tdLast.append(makeEl("span", "status" +
        (stat.isOnline ? " now" : !stat.lastSeen ? " never" : ""), age(stat.lastSeen)));
      const tdToday = makeEl("td", "", number(stat.todayVisits));
      const tdPeriod = makeEl("td", "", number(stat.visits));
      const tdTime = makeEl("td", "", duration(stat.activeSeconds));
      const tdLink = makeEl("td");
      const button = makeEl("button", "view", "عرض التفاصيل");
      button.type = "button";
      button.setAttribute("aria-label", "تفاصيل " + (user.name || user.email || "المستخدم"));
      button.addEventListener("click", () => showDetails(user.id));
      tdLink.append(button);
      tr.append(tdPerson, tdLast, tdToday, tdPeriod, tdTime, tdLink);
      tbody.append(tr);
    });
  }

  function showDetails(id) {
    chosenId = id;
    const user = users.find(item => item.id === id);
    const container = $("userDetail");
    if (!user) { container.hidden = true; return; }
    const stat = personStats(user);
    const all = matchingSessions(id, daysCount())
      .sort((a, b) => sessionMillis(b) - sessionMillis(a));
    container.hidden = false;
    container.replaceChildren();
    const top = makeEl("div", "detail-top");
    top.append(makeEl("h3", "", "تفاصيل استخدام " + (user.name || user.email || "الحساب")));
    const close = makeEl("button", "view", "إغلاق");
    close.type = "button";
    close.addEventListener("click", () => { container.hidden = true; chosenId = null; });
    top.append(close);
    container.append(top);
    const grid = makeEl("div", "detail-grid");
    [
      ["زيارات اليوم", number(stat.todayVisits)],
      ["زيارات الفترة", number(stat.visits)],
      ["المدة النشطة", duration(stat.activeSeconds)],
      ["آخر استخدام", age(stat.lastSeen)]
    ].forEach(([title, val]) => {
      const entry = makeEl("div", "detail-stat");
      entry.append(makeEl("span", "", title), makeEl("b", "", val));
      grid.append(entry);
    });
    container.append(grid);
    container.append(makeEl("h3", "", "آخر الجلسات"));
    const list = makeEl("div", "session-list");
    if (!all.length) list.append(makeEl("p", "muted", "لم تُسجَّل زيارات خلال الفترة المحددة."));
    all.slice(0, 30).forEach(s => {
      const row = makeEl("div", "session-item");
      row.append(makeEl("span", "", displayDate.format(new Date(sessionMillis(s)))),
        makeEl("strong", "", duration(s.active_seconds)));
      list.append(row);
    });
    container.append(list);
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function renderAll() {
    refreshSummary(); drawChart(); renderUsers();
    if (chosenId) showDetails(chosenId);
  }
  function fail(message, accessDenied = false) {
    loading.hidden = true;
    dashboard.hidden = true;
    errorBox.hidden = false;
    $("errorTitle").textContent = accessDenied ? "هذه اللوحة مخصصة للمدير فقط" : "تعذّر تحميل التقارير";
    $("errorText").textContent = message;
  }

  async function loadReport() {
    if (pending) return;
    if (!sb) { fail("تعذّر تحميل خدمة الحساب. تحقق من اتصال الإنترنت."); return; }
    pending = true;
    $("refreshBtn").disabled = true;
    if (!users.length) { loading.hidden = false; errorBox.hidden = true; }
    try {
      const { data: auth, error: authError } = await sb.auth.getUser();
      if (authError || !auth?.user) {
        fail("سجّل الدخول إلى حسابك في مواعيدي أولًا، ثم افتح لوحة الإدارة.");
        return;
      }
      const { data, error } = await sb.rpc("mawaeidi_admin_usage", { p_days: 90 });
      if (error) {
        if (error.code === "42501" || /admin_only/i.test(error.message || "")) {
          fail("ليس لهذا الحساب صلاحية مشاهدة بيانات المستخدمين.", true);
        } else {
          fail("تعذّر قراءة إحصائيات الاستخدام. تأكد من اتصال الشبكة وإعداد قاعدة البيانات.");
          console.error("Usage dashboard query failed:", error);
        }
        return;
      }
      users = Array.isArray(data?.users) ? data.users : [];
      sessions = Array.isArray(data?.sessions) ? data.sessions : [];
      loading.hidden = true; errorBox.hidden = true; dashboard.hidden = false;
      $("updatedAt").textContent = "آخر تحديث: " + displayDate.format(new Date());
      renderAll();
    } catch (error) {
      fail("حدث خطأ في الاتصال. جرّب تحديث البيانات مرة أخرى.");
      console.error("Usage dashboard error:", error);
    } finally {
      pending = false;
      $("refreshBtn").disabled = false;
    }
  }
  $("refreshBtn").addEventListener("click", loadReport);
  $("period").addEventListener("change", renderAll);
  $("userSearch").addEventListener("input", renderUsers);
  loadReport();
})();