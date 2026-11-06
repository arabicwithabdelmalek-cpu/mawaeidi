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

  const accountLink = document.getElementById("adminUsageLink");
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
    if (!accountLink) return;
    accountLink.hidden = true;
    if (!id) return;
    try {
      const { data, error } = await sb.from("mawaeidi_usage_admins")
        .select("user_id").eq("user_id", id).maybeSingle();
      if (!error && data && userId === id) accountLink.hidden = false;
    } catch { accountLink.hidden = true; }
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
