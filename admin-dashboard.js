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
  let detailReturnFocus = null;
  let pending = false;
  let current = null;
  let adminAvatarOwner = null;
  let avatarCache = new Map();
  let avatarLoadedAt = 0;
  let avatarRetryAfter = 0;
  let avatarRequest = null;

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
    if (!minutes) return Number(seconds) > 0 ? "أقل من دقيقة" : "٠ دقيقة";
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
      detailReturnFocus = b;
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

  // One focused read-only member profile, reusing the authorized statistics.
  // Clicking "معاينة حسابه" opens the existing audited support preview.
  function renderDetails(scroll = false) {
    const panel = $("userDetail");
    const person = users.find(user => user.id === selectedUserId);
    if (!person || !current) {
      panel.hidden = true;
      panel.replaceChildren();
      return;
    }
    const stats = current.userStats.get(person.id);
    if (!stats) {
      panel.hidden = true;
      panel.replaceChildren();
      return;
    }
    const visits = current.periodSessions.filter(session => session.user_id === person.id)
      .sort((a,b) => toMs(b.started_at) - toMs(a.started_at));

    panel.replaceChildren();
    panel.hidden = false;
    const page = makeEl("div", "member-profile");
    const hero = makeEl("header", "member-profile-hero");
    const heroTop = makeEl("div", "member-profile-headerline");
    heroTop.append(makeEl("span", "member-profile-kicker", "ملف المستخدم"));
    const close = makeEl("button", "member-profile-back", "العودة إلى المستخدمين");
    close.type = "button";
    close.setAttribute("aria-label","إغلاق ملف المستخدم والعودة إلى القائمة");
    close.addEventListener("click", () => {
      selectedUserId = null;
      panel.replaceChildren();
      panel.hidden = true;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const heading = $("usersTitle");
      heading.scrollIntoView({behavior:reduce ? "auto":"smooth",block:"start"});
      if (detailReturnFocus?.isConnected) detailReturnFocus.focus({preventScroll:true});
      else {
        heading.setAttribute("tabindex","-1");
        heading.focus({preventScroll:true});
      }
      detailReturnFocus = null;
    });
    heroTop.append(close);
    hero.append(heroTop);

    const heroMain = makeEl("div", "member-profile-hero-main");
    const identity = makeEl("div", "member-profile-identity");
    const avatar = makeProfileAvatar(person);
    avatar.classList.add("member-profile-avatar");
    identity.append(avatar);
    const identityText = makeEl("div", "member-profile-identity-text");
    const heading = makeEl("h3", "member-profile-name",person.name || person.email || "مستخدم مواعيدي");
    heading.id = "memberDetailHeading";
    identityText.append(heading);
    if (person.email) {
      const email = makeEl("span", "member-profile-email",person.email);
      email.dir = "ltr";
      identityText.append(email);
    }
    identityText.append(makeStatus(stats));
    identity.append(identityText);
    heroMain.append(identity);
    const actions = makeEl("div", "member-profile-actions");
    const preview = makeEl("button", "member-profile-preview", "معاينة حسابه");
    preview.type = "button";
    preview.title = "فتح واجهة مواعيدي لهذا العضو للقراءة فقط";
    preview.addEventListener("click", () => {
      if (window.mawaeidiAdminSupport?.open) {
        window.mawaeidiAdminSupport.open(person);
      } else {
        preview.textContent = "المعاينة غير متاحة حاليًا";
        preview.disabled = true;
      }
    });
    actions.append(preview);
    heroMain.append(actions);
    hero.append(heroMain);
    page.append(hero);

    const statsGrid = makeEl("div", "member-profile-metrics");
    [
      ["زيارات اليوم",number(stats.todayVisits),"الجلسات التي بدأت اليوم"],
      ["زيارات الفترة",number(stats.visits),"خلال آخر "+number(periodDays())+" يومًا"],
      ["وقت الاستخدام",stats.visits ? duration(stats.activeSeconds) : "—","نشاط تقريبي مسجّل"],
      ["آخر نشاط",stats.lastSeen ? relativeTime(stats.lastSeen) : "غير مسجل",
        stats.lastSeen ? displayDate(stats.lastSeen) : "لا توجد زيارات مسجلة"]
    ].forEach(([label,value,note]) => {
      const card = makeEl("div", "member-profile-metric");
      card.append(makeEl("small","",label),makeEl("strong","",value),
        makeEl("span","",note));
      statsGrid.append(card);
    });
    page.append(statsGrid);

    const columns = makeEl("div", "member-profile-columns");
    const primary = makeEl("div", "member-profile-main-column");
    const secondary = makeEl("aside", "member-profile-side-column");

    const timeline = makeEl("section", "member-profile-card member-profile-history");
    const timelineHead = makeEl("div","member-profile-card-heading");
    const timelineTitle = makeEl("div");
    timelineTitle.append(makeEl("h4","","الزيارات الأخيرة"),
      makeEl("p","","سجل جلسات الاستخدام خلال الفترة المحددة"));
    timelineHead.append(timelineTitle,makeEl("span","member-profile-count",
      number(visits.length)+" زيارة"));
    timeline.append(timelineHead);
    const visitList = makeEl("div","member-profile-visit-list");
    if (!visits.length) {
      visitList.append(makeEl("p","member-profile-empty",
        "لم تُسجّل زيارات لهذا الحساب خلال الفترة المختارة."));
    }
    visits.slice(0,12).forEach(session => {
      const item = makeEl("div","member-profile-visit");
      const mark = makeEl("span","member-profile-visit-mark");
      mark.setAttribute("aria-hidden","true");
      const info = makeEl("div","member-profile-visit-info");
      info.append(makeEl("strong","",displayDate(session.started_at)),
        makeEl("span","",clientLabel(session.client_type)));
      const durationValue = makeEl("span","member-profile-visit-duration",
        duration(session.active_seconds));
      item.append(mark,info,durationValue);
      visitList.append(item);
    });
    timeline.append(visitList);
    primary.append(timeline);

    const activity = makeEl("section", "member-profile-card member-profile-week");
    const activityHead = makeEl("div","member-profile-card-heading");
    const activityTitles = makeEl("div");
    activityTitles.append(makeEl("h4","","نشاط آخر ٧ أيام"),
      makeEl("p","","عدد الزيارات التي بدأت في كل يوم"));
    activityHead.append(activityTitles);
    activity.append(activityHead);
    const days = lastCalendarDays(7);
    const daily = new Map(days.map(day => [day,0]));
    for (const visit of visits) {
      const started = toMs(visit.started_at);
      if (!started) continue;
      const key = dateKey(new Date(started));
      if (daily.has(key)) daily.set(key,daily.get(key)+1);
    }
    const maxVisits = Math.max(1,...daily.values());
    const bars = makeEl("div","member-profile-bars");
    bars.setAttribute("role","img");
    bars.setAttribute("aria-label","رسم يوضح عدد زيارات المستخدم خلال آخر سبعة أيام");
    const weekday = new Intl.DateTimeFormat("ar-EG",{
      timeZone:"Africa/Cairo",weekday:"short"
    });
    days.forEach(day => {
      const value = daily.get(day) || 0;
      const label = weekday.format(new Date(day+"T12:00:00Z"));
      const column = makeEl("div","member-profile-bar-col");
      column.setAttribute("title",label+": "+number(value)+" زيارة");
      const barTrack = makeEl("div","member-profile-bar-track");
      const bar = makeEl("span","member-profile-bar"+(value ? " has-visits" : ""));
      bar.style.height = value ? Math.max(9,Math.round(100*value/maxVisits))+"%" : "5px";
      barTrack.append(bar);
      column.append(makeEl("span","member-profile-bar-number",number(value)),
        barTrack,makeEl("span","member-profile-bar-day",label));
      bars.append(column);
    });
    activity.append(bars);
    secondary.append(activity);

    const account = makeEl("section", "member-profile-card member-profile-account");
    account.append(makeEl("h4","","بيانات الحساب"));
    const details = makeEl("div","member-profile-facts");
    [
      ["تاريخ إنشاء الحساب",displayDate(person.created_at)],
      ["آخر تسجيل دخول",displayDate(person.last_sign_in_at)],
      ["آخر زيارة مسجلة",stats.lastSeen ? displayDate(stats.lastSeen) : "غير مسجلة"]
    ].forEach(([label,value]) => {
      const item = makeEl("div","member-profile-fact");
      item.append(makeEl("span","",label),makeEl("strong","",value));
      details.append(item);
    });
    account.append(details);
    secondary.append(account);

    columns.append(primary,secondary);
    page.append(columns);
    page.append(makeEl("p","member-profile-disclaimer",
      "الوقت النشط تقديري، والمعاينة لا تتيح تعديل حساب العضو أو الاطلاع على كلمة مروره."));
    panel.append(page);
    panel.setAttribute("aria-labelledby","memberDetailHeading");
    if (scroll) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      panel.scrollIntoView({behavior:reduce ? "auto":"smooth",block:"start"});
      panel.focus({preventScroll:true});
    }
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
    avatarLoadedAt = 0;
    avatarRetryAfter = 0;
    avatarRequest = null;
    users = []; sessions = []; current = null; selectedUserId = null; detailReturnFocus = null;
    $("loading").hidden = true;
    $("dashboard").hidden = true;
    $("errorBox").hidden = false;
    $("exportBtn").disabled = true;
    $("errorTitle").textContent = accessDenied ? "هذه الصفحة خاصة بمالك مواعيدي" : "تعذّر تحميل الإحصائيات";
    $("errorText").textContent = message;
  }

  function refreshAvatarLinks(ownerId, force = false) {
    if (!client || !current || adminAvatarOwner !== ownerId || avatarRequest)
      return;
    const now = Date.now();
    if (!force && (now - avatarLoadedAt < 20 * 60000 || now < avatarRetryAfter))
      return;
    const request = client.functions.invoke("mawaeidi-admin-accounts", {
      body: { action: "list" }
    });
    avatarRequest = request;
    request.then(({data: pictured, error: avatarError}) => {
      if (adminAvatarOwner !== ownerId || !current) return;
      if (avatarError || !Array.isArray(pictured?.users)) {
        avatarRetryAfter = Date.now() + 60000;
        return;
      }
      const next = new Map();
      for (const entry of pictured.users) {
        if (typeof entry.avatar_url === "string" && entry.avatar_url.startsWith("https://"))
          next.set(entry.id, entry.avatar_url);
      }
      avatarCache = next;
      avatarLoadedAt = Date.now();
      avatarRetryAfter = 0;
      for (const user of users) user.avatar_url = avatarCache.get(user.id) || null;
      // Preserve the current account detail/filters, only update visible avatars.
      renderUsers();
      renderDetails(false);
      renderFeed();
    }).catch(() => {
      if (adminAvatarOwner === ownerId)
        avatarRetryAfter = Date.now() + 60000;
    }).finally(() => {
      if (avatarRequest === request) avatarRequest = null;
    });
  }

  async function loadReport(forceAvatarRefresh = false) {
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
        avatarLoadedAt = 0;
        avatarRetryAfter = 0;
        avatarRequest = null;
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
      // Signed photo links are private and expire after 30 minutes. Reuse them
      // for 20 minutes instead of asking Edge Function on every 2-minute poll.
      // The manual refresh button always requests updated photos.
      refreshAvatarLinks(auth.user.id, forceAvatarRefresh);
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
  $("refreshBtn").addEventListener("click", () => loadReport(true));
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