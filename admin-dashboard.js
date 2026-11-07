/* Mawaeidi administrative usage dashboard.
   All account data comes exclusively from an admin-guarded database RPC. */
(() => {
  "use strict";
  const SUPABASE_URL = "https://nvefdkkjkyalpsrgoffj.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_t0pqtkV0-3Wj0htl-eGR9w_BsifiUDE";
  const $ = id => document.getElementById(id);
  const client = window.supabase?.createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  window.mawaeidiAdminClient = client;
  const cairoKeyFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit"
  });
  const cairoDateFormat = new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit"
  });
  const arabicNumber = new Intl.NumberFormat("ar-EG");
  let users = [];
  let sessions = [];
  let selectedUserId = null;
  let pending = false;
  let current = null;
  let adminAvatarOwner = null;
  let avatarCache = new Map();

  const toMs = value => {
    if (!value) return 0;
    const result = new Date(value).getTime();
    return Number.isFinite(result) ? result : 0;
  };
  const dateKey = date => {
    const parts = Object.fromEntries(cairoKeyFormat.formatToParts(date)
      .map(item => [item.type, item.value]));
    return [parts.year, parts.month, parts.day].join("-");
  };
  const todayKey = () => dateKey(new Date());
  const displayDate = value => {
    const ms = toMs(value);
    return ms ? cairoDateFormat.format(new Date(ms)) : "غير متاح";
  };
  const number = value => arabicNumber.format(Number(value) || 0);
  const duration = seconds => {
    const minutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
    if (!minutes) return "٠ دقيقة";
    const hours = Math.floor(minutes / 60), rest = minutes % 60;
    return hours
      ? number(hours) + " ساعة" + (rest ? " و" + number(rest) + " د" : "")
      : number(minutes) + " دقيقة";
  };
  const relativeTime = value => {
    const ms = toMs(value);
    if (!ms) return "لا توجد زيارة مسجلة";
    const elapsed = Math.max(0, Date.now() - ms);
    if (elapsed < 300000) return "خلال آخر ٥ دقائق";
    if (elapsed < 3600000) return "منذ " + number(Math.ceil(elapsed / 60000)) + " دقيقة";
    if (elapsed < 86400000) return "منذ " + number(Math.floor(elapsed / 3600000)) + " ساعات";
    if (elapsed < 7 * 86400000) return "منذ " + number(Math.floor(elapsed / 86400000)) + " أيام";
    return displayDate(value);
  };
  const makeEl = (tag, className = "", text = null) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== null) element.textContent = String(text);
    return element;
  };
  const field = (label, value) => {
    const el = makeEl("div");
    el.append(makeEl("small", "", label), makeEl("strong", "", value));
    return el;
  };
  const periodDays = () => Number($("period").value) || 30;
  // UTC noon maps to the same date in Cairo even during daylight-saving changes.
  const lastCalendarDays = total => {
    const [y, m, d] = todayKey().split("-").map(Number);
    const anchor = Date.UTC(y, m - 1, d, 12);
    return Array.from({ length: total }, (_, index) =>
      dateKey(new Date(anchor - (total - index - 1) * 86400000)));
  };
  const clientLabel = value => value === "android" ? "تطبيق أندرويد"
    : value === "ios" ? "تطبيق iOS" : "الموقع";

  function buildSummary() {
    const keys = lastCalendarDays(periodDays());
    const validDays = new Set(keys);
    const today = todayKey();
    const userStats = new Map(users.map(person => [person.id, {
      visits: 0, todayVisits: 0, activeSeconds: 0,
      lastSeen: null, lastSeenMs: 0, recent: false, activeToday: false
    }]));
    const daily = new Map(keys.map(key => [key, 0]));
    const periodSessions = [];
    for (const session of sessions) {
      const record = userStats.get(session.user_id);
      if (!record) continue;
      const startedMs = toMs(session.started_at);
      const seenMs = toMs(session.last_seen_at);
      if (seenMs > record.lastSeenMs) {
        record.lastSeenMs = seenMs;
        record.lastSeen = session.last_seen_at;
      }
      if (seenMs && dateKey(new Date(seenMs)) === today) record.activeToday = true;
      if (!startedMs) continue;
      const startedKey = dateKey(new Date(startedMs));
      if (!validDays.has(startedKey)) continue;
      record.visits++;
      if (startedKey === today) record.todayVisits++;
      record.activeSeconds += Math.max(0, Number(session.active_seconds) || 0);
      periodSessions.push(session);
      daily.set(startedKey, (daily.get(startedKey) || 0) + 1);
    }
    for (const record of userStats.values()) {
      record.recent = !!record.lastSeenMs && Date.now() - record.lastSeenMs < 300000;
    }
    return { keys, today, userStats, daily, periodSessions };
  }

  function paintSummary() {
    const stats = [...current.userStats.values()];
    const todayUsers = stats.filter(item => item.activeToday).length;
    const visitsToday = stats.reduce((n, item) => n + item.todayVisits, 0);
    const visitsPeriod = stats.reduce((n, item) => n + item.visits, 0);
    const activitySeconds = stats.reduce((n, item) => n + item.activeSeconds, 0);
    const noVisits = stats.filter(item => item.visits === 0).length;

    $("statUsers").textContent = number(users.length);
    $("statActiveToday").textContent = number(todayUsers);
    $("statVisitsToday").textContent = number(visitsToday);
    $("statPeriodVisits").textContent = number(visitsPeriod);
    $("statActiveTime").textContent = duration(activitySeconds);
    $("statNoActivity").textContent = number(noVisits);
    $("labelPeriodVisits").textContent = "زيارات آخر " + number(periodDays()) + " يومًا";
    $("labelNoActivity").textContent = "بلا زيارات خلال الفترة";
    $("chartTotal").textContent = number(visitsPeriod) + " زيارة خلال الفترة";
    $("todayRecap").textContent = number(todayUsers) + " من " + number(users.length) + " حسابات";
    $("activeNow").textContent = number(stats.filter(item => item.recent).length);
    $("totalActiveInPeriod").textContent = number(users.length - noVisits);
    $("overallTime").textContent = duration(activitySeconds);

    const mostActive = users
      .map(person => ({ person, stats: current.userStats.get(person.id) }))
      .sort((a, b) => b.stats.visits - a.stats.visits)[0];
    if (mostActive && mostActive.stats.visits > 0) {
      $("topUser").textContent = mostActive.person.name || mostActive.person.email || "مستخدم";
      $("topUserInfo").textContent = number(mostActive.stats.visits) + " زيارة خلال الفترة المحددة";
    } else {
      $("topUser").textContent = "لا توجد زيارات بعد";
      $("topUserInfo").textContent = "ستظهر النتائج بعد بدء تسجيل الاستخدام";
    }
    $("limitedDataNotice").hidden = sessions.length < 8000;
  }

  function drawChart() {
    const element = $("dailyChart");
    element.replaceChildren();
    const days = periodDays();
    const step = days === 7 ? 1 : days === 30 ? 3 : 7;
    const bins = [];
    for (let i = 0; i < current.keys.length; i += step) {
      const keys = current.keys.slice(i, i + step);
      bins.push({
        start: keys[0], end: keys[keys.length - 1],
        total: keys.reduce((count, key) => count + (current.daily.get(key) || 0), 0),
        currentDay: keys.includes(current.today)
      });
    }
    const max = Math.max(0, ...bins.map(bin => bin.total));
    const mode = step === 1 ? "يومي" : step === 3 ? "كل ثلاثة أيام" : "أسبوعي";
    $("chartMode").textContent = "التجميع: " + mode + " · توقيت مصر";
    $("chartTitle").textContent = "حركة الزيارات";
    if (!max) {
      $("dailyChart").hidden = true;
      $("chartEmpty").hidden = false;
      return;
    }
    $("chartEmpty").hidden = true;
    $("dailyChart").hidden = false;
    for (const bin of bins) {
      const col = makeEl("div", "plot-col" + (bin.currentDay ? " latest" : ""));
      col.tabIndex = 0;
      const range = bin.start === bin.end ? bin.start : bin.start + " — " + bin.end;
      col.title = range + ": " + number(bin.total) + " زيارة";
      col.setAttribute("aria-label", col.title);
      const count = makeEl("span", "plot-value", bin.total ? number(bin.total) : "");
      const slot = makeEl("span", "plot-slot");
      const fill = makeEl("span", "plot-bar");
      fill.style.height = bin.total ? Math.max(4, bin.total / max * 100) + "%" : "0";
      slot.append(fill);
      const label = bin.start.slice(5).replace("-", "/");
      col.append(count, slot, makeEl("span", "plot-label", label));
      element.append(col);
    }
    element.setAttribute("aria-label", number(current.periodSessions.length) +
      " زيارة موزعة على " + number(bins.length) + " فترات");
  }

  function selectedUsers() {
    const search = $("userSearch").value.trim().toLowerCase();
    const filter = $("userFilter").value;
    const order = $("userSort").value;
    const rows = users.filter(person => {
      const stats = current.userStats.get(person.id);
      if (search && !(person.name || "").toLowerCase().includes(search)
        && !(person.email || "").toLowerCase().includes(search)) return false;
      if (filter === "active" && !stats.activeToday) return false;
      if (filter === "inactive" && stats.activeToday) return false;
      if (filter === "no-period" && stats.visits > 0) return false;
      return true;
    });
    rows.sort((a, b) => {
      const x = current.userStats.get(a.id), y = current.userStats.get(b.id);
      if (order === "visits") return y.visits - x.visits || y.lastSeenMs - x.lastSeenMs;
      if (order === "name") return (a.name || a.email || "").localeCompare(b.name || b.email || "", "ar");
      return y.lastSeenMs - x.lastSeenMs;
    });
    return rows;
  }
  function statusFor(stats) {
    if (stats.recent) return ["good", "نشط خلال ٥ دقائق"];
    if (stats.activeToday) return ["good", "دخل اليوم"];
    if (!stats.lastSeen) return ["warn", "بلا زيارة مسجلة"];
    return ["", relativeTime(stats.lastSeen)];
  }
  function makeProfileAvatar(user) {
    const initials = [...(user.name || user.email || "م")][0] || "م";
    const avatar = makeEl("span", "avatar", initials);
    if (typeof user.avatar_url === "string" && user.avatar_url.startsWith("https://")) {
      const img = makeEl("img", "avatar-photo");
      img.alt = "الصورة الشخصية";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = user.avatar_url;
      avatar.append(img);
    }
    return avatar;
  }
  function appendPerson(root, user) {
    const box = makeEl("div", "person");
    box.append(makeProfileAvatar(user));
    const names = makeEl("div");
    names.append(makeEl("div", "person-name", user.name || "مستخدم"),
      makeEl("div", "person-email", user.email || ""));
    box.append(names);
    root.append(box);
  }
  function makeStatus(stats) {
    const [kind, text] = statusFor(stats);
    const status = makeEl("span", "status" + (kind ? " " + kind : ""));
    status.append(makeEl("span", "status-dot"), document.createTextNode(text));
    return status;
  }
  function detailsButton(user) {
    const b = makeEl("button", "view", "عرض التفاصيل");
    b.type = "button";
    b.setAttribute("aria-label", "عرض تفاصيل " + (user.name || user.email || "المستخدم"));
    b.addEventListener("click", () => {
      selectedUserId = user.id;
      renderDetails(true);
    });
    return b;
  }
  function renderUsers() {
    const rows = selectedUsers();
    const tbody = $("usersBody");
    const cards = $("userCards");
    tbody.replaceChildren();
    cards.replaceChildren();
    $("usersCount").textContent = number(rows.length) + " حساب";
    if (!rows.length) {
      const tr = makeEl("tr"), td = makeEl("td", "empty-state", "لا توجد حسابات تطابق البحث أو التصفية.");
      td.colSpan = 6; tr.append(td); tbody.append(tr);
      cards.append(makeEl("p", "empty-state", "لا توجد حسابات تطابق البحث أو التصفية."));
      return;
    }
    rows.forEach(user => {
      const stats = current.userStats.get(user.id);
      const tr = makeEl("tr"), personCell = makeEl("td");
      appendPerson(personCell, user);
      const lastCell = makeEl("td");
      lastCell.append(makeStatus(stats));
      const action = makeEl("td"); action.append(detailsButton(user));
      tr.append(personCell, lastCell,
        makeEl("td", "", number(stats.todayVisits)),
        makeEl("td", "", number(stats.visits)),
        makeEl("td", "", stats.visits ? duration(stats.activeSeconds) : "—"), action);
      tbody.append(tr);

      const card = makeEl("article", "user-card");
      const top = makeEl("div", "user-card-top");
      appendPerson(top, user); top.append(makeStatus(stats));
      const facts = makeEl("div", "user-card-details");
      facts.append(
        field("زيارات اليوم", number(stats.todayVisits)),
        field("زيارات الفترة", number(stats.visits)),
        field("المدة النشطة", stats.visits ? duration(stats.activeSeconds) : "—"),
        field("آخر نشاط", stats.lastSeen ? relativeTime(stats.lastSeen) : "لا توجد زيارات")
      );
      card.append(top, facts, detailsButton(user));
      cards.append(card);
    });
  }

  function renderDetails(scroll = false) {
    const panel = $("userDetail");
    const person = users.find(u => u.id === selectedUserId);
    if (!person) { panel.hidden = true; return; }
    const stats = current.userStats.get(person.id);
    const all = current.periodSessions.filter(s => s.user_id === person.id)
      .sort((a,b) => toMs(b.started_at) - toMs(a.started_at));
    panel.replaceChildren();
    panel.hidden = false;
    const top = makeEl("div", "detail-header");
    const title = makeEl("div", "detail-person-identity");
    title.append(makeProfileAvatar(person));
    const text = makeEl("div");
    text.append(makeEl("h3", "", person.name || person.email || "تفاصيل المستخدم"),
      makeEl("p", "", person.email || "بيانات الحساب"));
    title.append(text);
    const close = makeEl("button", "view", "إغلاق التفاصيل");
    close.type = "button";
    close.addEventListener("click", () => {
      panel.hidden = true; selectedUserId = null;
    });
    top.append(title,close);
    panel.append(top);
    const grid = makeEl("div", "detail-grid");
    [
      ["زيارات اليوم", number(stats.todayVisits)],
      ["زيارات الفترة", number(stats.visits)],
      ["الوقت النشط", stats.visits ? duration(stats.activeSeconds) : "—"],
      ["آخر استخدام مسجل", stats.lastSeen ? relativeTime(stats.lastSeen) : "غير مسجل"]
    ].forEach(([label, value]) => grid.append(field(label, value)));
    grid.querySelectorAll("div").forEach(el => el.className = "detail-stat");
    panel.append(grid);
    const meta = makeEl("div", "detail-meta");
    [
      ["تاريخ إنشاء الحساب", displayDate(person.created_at)],
      ["آخر تسجيل دخول للمصادقة", displayDate(person.last_sign_in_at)]
    ].forEach(([label, value]) => {
      const item = makeEl("span");
      item.append(makeEl("strong", "", label + ": "), document.createTextNode(value));
      meta.append(item);
    });
    panel.append(meta);
    panel.append(makeEl("h4", "detail-session-title", "الزيارات الأخيرة خلال الفترة"));
    const list = makeEl("div", "session-list");
    if (!all.length) list.append(makeEl("p", "empty-state", "لم تُسجَّل زيارات لهذا الحساب خلال الفترة."));
    all.slice(0,12).forEach(session => {
      const item = makeEl("div", "session-item"), left = makeEl("div");
      left.append(makeEl("strong", "", displayDate(session.started_at)),
        makeEl("small", "", clientLabel(session.client_type)));
      item.append(left, makeEl("strong", "", duration(session.active_seconds)));
      list.append(item);
    });
    panel.append(list);
    if (scroll) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderFeed() {
    const list = $("recentFeed");
    list.replaceChildren();
    const latest = [...current.periodSessions]
      .sort((a,b) => toMs(b.started_at) - toMs(a.started_at)).slice(0,7);
    if (!latest.length) {
      list.append(makeEl("p", "empty-state", "لا توجد زيارات مسجلة خلال الفترة المحددة."));
      return;
    }
    const lookup = new Map(users.map(person => [person.id, person]));
    latest.forEach(session => {
      const person = lookup.get(session.user_id);
      if (!person) return;
      const item = makeEl("div", "feed-item");
      item.append(makeProfileAvatar(person));
      const body = makeEl("div", "feed-content");
      body.append(makeEl("strong", "", person.name || person.email || "مستخدم"),
        makeEl("span", "", clientLabel(session.client_type) + " · " +
          duration(session.active_seconds) + " نشط تقريبي"));
      item.append(body, makeEl("span", "feed-time", displayDate(session.started_at)));
      list.append(item);
    });
  }

  function renderAll() {
    if (!current) return;
    paintSummary();
    drawChart();
    renderUsers();
    renderDetails(false);
    renderFeed();
  }
  function fail(message, accessDenied = false) {
    avatarCache.clear();
    adminAvatarOwner = null;
    users = []; sessions = []; current = null; selectedUserId = null;
    $("loading").hidden = true;
    $("dashboard").hidden = true;
    $("errorBox").hidden = false;
    $("exportBtn").disabled = true;
    $("errorTitle").textContent = accessDenied ? "هذه الصفحة خاصة بمالك مواعيدي" : "تعذّر تحميل الإحصائيات";
    $("errorText").textContent = message;
  }

  async function loadReport() {
    if (pending) return;
    if (!client) { fail("تعذّر الاتصال بخدمة الحساب. تحقق من اتصال الإنترنت."); return; }
    pending = true;
    $("refreshBtn").disabled = true;
    $("refreshBtn").textContent = "جارٍ التحديث…";
    if (!current) { $("loading").hidden = false; $("errorBox").hidden = true; }
    try {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || !auth?.user) {
        fail("سجّل الدخول بحسابك الإداري إلى مواعيدي أولًا، ثم افتح هذه الصفحة.");
        return;
      }
      const { data, error } = await client.rpc("mawaeidi_admin_usage", { p_days: 90 });
      if (error) {
        if (error.code === "42501" || /admin_only/i.test(error.message || "")) {
          fail("هذا الحساب لا يملك صلاحية قراءة بيانات لوحة الإدارة.", true);
        } else {
          fail("لم نتمكن من قراءة بيانات الاستخدام. حدّث الصفحة أو تحقق من الاتصال.");
          console.error("Mawaeidi admin RPC error:", error);
        }
        return;
      }
      if (adminAvatarOwner !== auth.user.id) {
        avatarCache.clear();
        adminAvatarOwner = auth.user.id;
      }
      users = (Array.isArray(data?.users) ? data.users : []).map(user => ({
        ...user, avatar_url: avatarCache.get(user.id) || null
      }));
      sessions = Array.isArray(data?.sessions) ? data.sessions : [];
      current = buildSummary();
      $("loading").hidden = true; $("errorBox").hidden = true;
      $("dashboard").hidden = false; $("exportBtn").disabled = false;
      $("updatedAt").textContent = "آخر تحديث: " + cairoDateFormat.format(new Date());
      renderAll();
      // Images are private. Fetch temporary links only after the admin report
      // has passed authorization; a picture failure never blocks statistics.
      const callerId = auth.user.id;
      client.functions.invoke("mawaeidi-admin-accounts", {
        body: { action: "list" }
      }).then(({data: pictured, error: avatarError}) => {
        if (avatarError || !Array.isArray(pictured?.users) ||
            !current || adminAvatarOwner !== callerId) return;
        const next = new Map();
        for (const item of pictured.users) {
          if (typeof item.avatar_url === "string" && item.avatar_url.startsWith("https://")) {
            next.set(item.id, item.avatar_url);
          }
        }
        avatarCache = next;
        for (const user of users) user.avatar_url = avatarCache.get(user.id) || null;
        renderUsers();
        renderDetails(false);
        renderFeed();
      }).catch(() => {});
    } catch (error) {
      console.error("Mawaeidi admin report:", error);
      fail("حدث خطأ في الاتصال. حاول تحديث البيانات مرة أخرى.");
    } finally {
      pending = false;
      $("refreshBtn").disabled = false;
      $("refreshBtn").textContent = "تحديث البيانات";
    }
  }

  function csvEscape(value) {
    let text = String(value ?? "");
    // Prevent spreadsheet formula execution if account display names are untrusted.
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function exportCsv() {
    if (!current || !users.length) return;
    const headings = ["المستخدم","البريد الإلكتروني","زيارات اليوم","زيارات الفترة",
      "الوقت النشط بالدقائق","آخر زيارة مسجلة","آخر تسجيل دخول للمصادقة"];
    const rows = users.map(user => {
      const stats = current.userStats.get(user.id);
      return [user.name || "",user.email || "",stats.todayVisits,stats.visits,
        Math.floor(stats.activeSeconds / 60),stats.lastSeen ? displayDate(stats.lastSeen) : "",
        user.last_sign_in_at ? displayDate(user.last_sign_in_at) : ""];
    });
    const csv = "\ufeff" + [headings,...rows].map(row => row.map(csvEscape).join(",")).join("\r\n");
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.href = url;
    link.download = "mawaeidi-usage-" + todayKey() + ".csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  $("refreshBtn").addEventListener("click", loadReport);
  $("exportBtn").addEventListener("click", exportCsv);
  $("period").addEventListener("change", () => {
    if (!users.length) return;
    current = buildSummary();
    renderAll();
  });
  ["userFilter", "userSort"].forEach(id => $(id).addEventListener("change", () => {
    if (current) renderUsers();
  }));
  $("userSearch").addEventListener("input", () => {
    if (current) renderUsers();
  });
  if (client) {
    client.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") fail("انتهت جلسة الحساب. سجّل الدخول مرة أخرى.");
    });
  }
  window.setInterval(() => {
    if (!document.hidden && navigator.onLine) loadReport();
  }, 120000);
  loadReport();
})();