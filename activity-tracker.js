/* Mawaeidi | privacy-conscious authenticated usage metrics.
   One visit = a browser-tab session; 30m inactivity starts a new visit.
   Heartbeats occur only while the tab is visible and recently active. */
(function () {
  "use strict";
  const sb = typeof cloud !== "undefined" ? cloud : null;
  if (!sb || !window.crypto?.randomUUID || !window.sessionStorage) return;

  const STORAGE_KEY = "mawaeidi:usage-visit:v1";
  const GAP_MS = 30 * 60 * 1000;
  const IDLE_MS = 3 * 60 * 1000;
  const PING_MS = 60 * 1000;
  let userId = null;
  let visitKey = null;
  let lastInteraction = Date.now();
  let lastRequestAt = 0;
  let busy = false;
  let warned = false;

  // No admin-only element is present in the HTML of ordinary accounts.
  // Create it only after Supabase confirms the signed-in user's admin role.
  let accountLink = null;
  function removeAdminLink() {
    accountLink?.remove();
    document.querySelector(".header-actions")?.classList.remove("has-admin-shortcut");
    accountLink = null;
  }
  function insertAdminLink() {
    const actions = document.querySelector(".header .header-actions");
    const sync = actions?.querySelector("#syncStatus");
    if (!actions || !sync || accountLink) return;
    const link = document.createElement("a");
    link.href = "./admin.html";
    link.className = "admin-shortcut";
    link.id = "adminUsageLink";
    link.title = "لوحة إدارة حسابات مواعيدي ومتابعة الفريق";
    link.setAttribute("aria-label", "فتح لوحة إدارة مواعيدي");
    // This is a fixed decorative icon, not injected account content.
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg><span>الإدارة</span>';
    sync.before(link);
    actions.classList.add("has-admin-shortcut");
    accountLink = link;
  }
  function storedVisit() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); }
    catch { return null; }
  }
  function selectVisit(id) {
    const previous = storedVisit();
    if (previous?.userId === id && typeof previous.visitKey === "string"
      && Date.now() - Number(previous.lastSeen || 0) < GAP_MS) {
      visitKey = previous.visitKey;
    } else {
      visitKey = crypto.randomUUID();
    }
  }
  function recordVisit() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId, visitKey, lastSeen: Date.now()
      }));
    } catch { /* Browser storage might be blocked. */ }
  }
  function renewAfterLongGap() {
    if (!userId) return;
    const previous = storedVisit();
    if (!previous || previous.userId !== userId
      || Date.now() - Number(previous.lastSeen || 0) >= GAP_MS) {
      visitKey = crypto.randomUUID();
    }
  }
  const clientType = /capacitor/i.test(navigator.userAgent) && /android/i.test(navigator.userAgent)
    ? "android" : /capacitor/i.test(navigator.userAgent) && /iphone|ipad|ios/i.test(navigator.userAgent)
    ? "ios" : "web";

  async function ping(force = false) {
    if (!userId || busy || document.hidden || !navigator.onLine) return;
    if (!force && Date.now() - lastInteraction > IDLE_MS) return;
    if (!force && Date.now() - lastRequestAt < PING_MS - 2000) return;
    renewAfterLongGap();
    if (!visitKey) selectVisit(userId);
    busy = true;
    lastRequestAt = Date.now();
    const owner = userId;
    const key = visitKey;
    try {
      const { error } = await sb.from("mawaeidi_usage_sessions").upsert({
        user_id: owner, session_key: key, client_type: clientType
      }, { onConflict: "user_id,session_key" });
      if (error) throw error;
      if (owner === userId && key === visitKey) recordVisit();
      warned = false;
    } catch (error) {
      if (!warned) {
        console.warn("تعذر تسجيل إحصائية استخدام مواعيدي.", error);
        warned = true;
      }
    } finally { busy = false; }
  }

  async function refreshAdminLink(id) {
    removeAdminLink();
    if (!id) return;
    try {
      const { data, error } = await sb.from("mawaeidi_usage_admins")
        .select("user_id").eq("user_id", id).maybeSingle();
      if (!error && data?.user_id === id && userId === id) insertAdminLink();
    } catch { removeAdminLink(); }
  }

  function onSession(user) {
    const id = user?.id || null;
    if (id === userId) return;
    userId = id;
    visitKey = null;
    lastRequestAt = 0;
    lastInteraction = Date.now();
    selectVisit(id);
    refreshAdminLink(id);
    if (id) ping(true);
  }

  // Supabase emits INITIAL_SESSION even after a refresh. Avoid running
  // database writes synchronously inside the auth-state callback.
  sb.auth.onAuthStateChange((_event, session) =>
    setTimeout(() => onSession(session?.user || null), 0));
  sb.auth.getSession().then(({ data }) => onSession(data?.session?.user || null))
    .catch(() => {});
  const markActive = () => { lastInteraction = Date.now(); };
  ["pointerdown", "keydown", "touchstart"].forEach(event =>
    window.addEventListener(event, markActive, { passive: true }));
  window.addEventListener("focus", () => { markActive(); ping(true); });
  window.addEventListener("online", () => ping(true));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { markActive(); ping(true); }
  });
  window.setInterval(() => ping(), PING_MS);
})();
