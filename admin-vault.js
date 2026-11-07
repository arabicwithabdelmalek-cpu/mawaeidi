/* Mawaeidi administrator password vault: encrypted client-side using AES-GCM.
 * The master passphrase is never uploaded or stored; only encrypted blobs and KDF salt.
 * The vault is separate from Supabase Auth, which never exposes existing passwords. */
(() => {
  "use strict";
  const client = window.mawaeidiAdminClient;
  const $ = id => document.getElementById(id);
  const MARKER = "MAWAEIDI:ADMIN-VAULT:V1";
  const KDF_ITERATIONS = 600000;
  const DEFAULT_SITE = "https://arabicwithabdelmalek-cpu.github.io/mawaeidi/";
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  let ownerId = null, config = null, key = null, editingAccount = null, busy = false;
  let saved = new Map(), lastActivity = Date.now();

  function notify(message, error = false) {
    const el = $("vaultFeedback");
    el.textContent = message;
    el.hidden = false;
    el.classList.toggle("error", error);
  }
  function clearNotice() { $("vaultFeedback").hidden = true; $("vaultFeedback").textContent = ""; }
  function cryptoReady() {
    return !!(window.crypto?.subtle && window.crypto?.getRandomValues && window.isSecureContext);
  }
  function b64(buffer) {
    const arr = new Uint8Array(buffer);
    let string = "";
    for (let i = 0; i < arr.length; i++) string += String.fromCharCode(arr[i]);
    return btoa(string);
  }
  function from64(value) {
    return Uint8Array.from(atob(value), char => char.charCodeAt(0));
  }
  function randomBytes(n) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return bytes;
  }
  async function derive(secret, salt) {
    const material = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({
      name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS, salt
    }, material, { name: "AES-GCM", length: 256 }, false,
    ["encrypt", "decrypt"]);
  }
  async function encrypt(value, cryptoKey, aad = null) {
    const iv = randomBytes(12);
    const params = { name:"AES-GCM", iv };
    if (aad) params.additionalData = encoder.encode(aad);
    const payload = await crypto.subtle.encrypt(params, cryptoKey, encoder.encode(value));
    return { iv: b64(iv), ciphertext: b64(payload) };
  }
  async function decrypt(entry, cryptoKey, aad = null) {
    const params = { name:"AES-GCM", iv:from64(entry.iv) };
    if (aad) params.additionalData = encoder.encode(aad);
    const bytes = await crypto.subtle.decrypt(
      params, cryptoKey, from64(entry.ciphertext));
    return decoder.decode(bytes);
  }
  function make(tag, className = "", value = undefined) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = String(value);
    return element;
  }
  function redraw() { window.mawaeidiRenderAccounts?.(); }
  function clearEntryEditor() {
    editingAccount = null;
    $("vaultEntryForm").reset();
    $("vaultEntryPassword").type = "password";
    $("vaultEntryReveal").textContent = "إظهار";
    $("vaultEntryForm").hidden = true;
  }
  function lockVault() {
    key = null;
    saved.clear();
    clearEntryEditor();
    $("vaultUnlockMaster").value = "";
    $("vaultCreateMaster").value = "";
    $("vaultCreateMasterAgain").value = "";
    $("vaultUnlocked").hidden = true;
    $("vaultLocked").hidden = !config;
    $("vaultNotConfigured").hidden = !!config;
    $("vaultStatus").textContent = config ? "مقفلة" : "لم تُنشأ بعد";
    redraw();
  }
  function openEntry(user) {
    if (!key) { notify("افتح الخزنة أولًا.", true); $("accountVault").scrollIntoView({behavior:"smooth",block:"start"}); return; }
    editingAccount = user;
    const item = saved.get(user.id);
    $("vaultTargetId").value = user.id;
    $("vaultEntryLabel").textContent = user.email || user.name || "حساب";
    $("vaultEntryPassword").value = item?.password || "";
    $("vaultEntryWebsite").value = item?.website || DEFAULT_SITE;
    $("vaultEntryNote").value = item?.note || "";
    $("vaultEntryForm").hidden = false;
    clearNotice();
    $("vaultEntryForm").scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  const ICONS = Object.freeze({
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.7 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.1 6.2C3.4 8.2 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
  });
  function iconButton(label, iconName) {
    const button = make("button","vault-icon-btn");
    button.type = "button";
    button.innerHTML = ICONS[iconName];
    button.title = label;
    button.setAttribute("aria-label",label);
    return button;
  }

  function buildPasswordCell(container, user, passwordChangedAt = null) {
    container.replaceChildren(make("small", "", "كلمة المرور"));
    if (!key) {
      const line = make("div", "vault-password-shortline");
      line.append(make("span", "vault-compact-placeholder", "••••••••"));
      const open = make("button", "vault-small-btn", "فتح الخزنة");
      open.type = "button";
      open.addEventListener("click", () =>
        $("accountVault").scrollIntoView({behavior:"smooth",block:"start"}));
      line.append(open);
      container.append(line);
      return;
    }
    const record = saved.get(user.id);
    if (!record) {
      const line = make("div", "vault-password-shortline");
      line.append(make("span", "vault-compact-placeholder", "غير محفوظة"));
      const add = make("button", "vault-small-btn", "إضافة");
      add.type = "button";
      add.addEventListener("click", () => openEntry(user));
      line.append(add);
      container.append(line);
      return;
    }
    const changeTime = passwordChangedAt ? Date.parse(passwordChangedAt) : NaN;
    const savedTime = record.savedAt ? Date.parse(record.savedAt) : 0;
    const stale = Number.isFinite(changeTime) && changeTime > savedTime + 1000;
    if (stale) {
      const status = make("div","vault-stale-password","تغيّرت من حساب المستخدم؛ المحفوظة قديمة");
      const edit = make("button", "vault-small-btn", "تحديث المحفوظة");
      edit.type = "button";
      edit.addEventListener("click", () => openEntry(user));
      container.append(status, edit);
      return;
    }
    const line = make("div", "vault-secret-line");
    const input = make("input", "vault-masked-password");
    input.type = "password";
    input.value = record.password;
    input.readOnly = true;
    input.autocomplete = "off";
    input.setAttribute("aria-label", "كلمة مرور محفوظة لـ " + (user.name || user.email));
    const toggle = iconButton("إظهار كلمة المرور","eye");
    toggle.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      toggle.title = visible ? "إظهار كلمة المرور" : "إخفاء كلمة المرور";
      toggle.setAttribute("aria-label",toggle.title);
      toggle.innerHTML = visible ? ICONS.eye : ICONS.eyeOff;
    });
    const copy = iconButton("نسخ كلمة المرور","copy");
    copy.addEventListener("click", async () => {
      if (!key) return;
      try {
        await navigator.clipboard.writeText(record.password);
        notify("تم نسخ كلمة المرور من الخزنة. قد تبقى في حافظة الجهاز.");
      } catch { notify("تعذّر النسخ، يمكنك إظهار الكلمة ونسخها يدويًا.", true); }
    });
    const edit = iconButton("تعديل كلمة المرور المحفوظة","eyeOff");
    edit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 11-11a2.2 2.2 0 0 0-3.2-3.2l-11 11L4 20Z"/><path d="m15 6 3 3"/></svg>';
    edit.addEventListener("click", () => openEntry(user));
    line.append(input,toggle,copy,edit);
    container.append(line);
  }

  async function saveRecord(id, payload) {
    if (!key || !ownerId) throw new Error("vault_locked");
    const data = {
      password: String(payload.password || ""),
      website: String(payload.website || DEFAULT_SITE).slice(0,300),
      note: String(payload.note || "").slice(0,500)
    };
    if (!data.password) throw new Error("empty_password");
    if (data.password.length > 256) throw new Error("password_too_long");
    const encrypted = await encrypt(JSON.stringify(data), key, id);
    const savedAt = new Date().toISOString();
    const { error } = await client.from("mawaeidi_admin_vault_entries")
      .upsert({
        owner_user_id: ownerId, target_user_id: id,
        iv: encrypted.iv, ciphertext: encrypted.ciphertext,
        updated_at: savedAt
      }, { onConflict: "owner_user_id,target_user_id" });
    if (error) throw error;
    saved.set(id, { ...data, savedAt });
    redraw();
    return true;
  }
  async function recordPasswordIfOpen(id, password) {
    if (!key || !id || !password) return false;
    const prior = saved.get(id);
    await saveRecord(id, {
      password, website: prior?.website || DEFAULT_SITE, note: prior?.note || ""
    });
    return true;
  }
  async function saveOneTime(id, password) {
    if (!key) { notify("افتح الخزنة بكلمتك الرئيسية أولًا، ثم اضغط حفظ مرة أخرى.",true); return false; }
    try {
      await recordPasswordIfOpen(id,password);
      notify("اتحفظت كلمة المرور الجديدة مشفّرة في خزنتك.");
      return true;
    } catch { notify("تعذر الحفظ في الخزنة. لا تغلق بطاقة كلمة المرور قبل المحاولة مرة أخرى.",true); return false; }
  }

  async function initialize() {
    if (!client || !cryptoReady()) {
      $("vaultStatus").textContent = "غير متاحة";
      notify("الخزنة تحتاج اتصال HTTPS ومتصفح يدعم التشفير الحديث.", true);
      return;
    }
    try {
      const { data: identity, error: authError } = await client.auth.getUser();
      if (authError || !identity?.user) throw new Error("authentication");
      ownerId = identity.user.id;
      const { data, error } = await client.from("mawaeidi_admin_vault_config")
        .select("kdf_salt,check_iv,check_ciphertext")
        .eq("owner_user_id",ownerId).maybeSingle();
      if (error) throw error;
      config = data;
      lockVault();
    } catch {
      $("vaultStatus").textContent = "تعذر التحميل";
      notify("تعذر تحميل الخزنة. تأكد من حساب الإدارة ومن اتصال الإنترنت.",true);
    }
  }

  $("vaultCreateForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !ownerId || config) return;
    const secret = $("vaultCreateMaster").value;
    if (secret.length < 14 || secret.length > 256 ||
      secret !== $("vaultCreateMasterAgain").value) {
      notify("كلمة الخزنة لازم تكون ١٤ حرفًا على الأقل، وتطابق التأكيد.",true);return;
    }
    busy = true; $("vaultCreateButton").disabled = true;
    try {
      const salt = randomBytes(16);
      const candidate = await derive(secret,salt);
      const check = await encrypt(MARKER,candidate);
      const { error } = await client.from("mawaeidi_admin_vault_config").insert({
        owner_user_id:ownerId,kdf_salt:b64(salt),
        check_iv:check.iv,check_ciphertext:check.ciphertext
      });
      if (error) throw error;
      config = {kdf_salt:b64(salt),check_iv:check.iv,check_ciphertext:check.ciphertext};
      key = candidate;
      $("vaultCreateMaster").value = "";
      $("vaultCreateMasterAgain").value = "";
      $("vaultNotConfigured").hidden = true;
      $("vaultUnlocked").hidden = false;
      $("vaultStatus").textContent = "مفتوحة";
      lastActivity = Date.now();
      redraw();
      notify("تم إنشاء الخزنة. احتفظ بكلمتك الرئيسية؛ لا يمكن استرجاعها.");
    } catch { notify("تعذر إنشاء الخزنة. ربما تم إعدادها من جهاز آخر؛ حدّث الصفحة.",true); }
    finally { busy = false; $("vaultCreateButton").disabled = false; }
  });

  $("vaultUnlockForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !config || !ownerId) return;
    const secret = $("vaultUnlockMaster").value;
    if (!secret) return;
    busy = true; $("vaultUnlockButton").disabled = true;
    try {
      const candidate = await derive(secret,from64(config.kdf_salt));
      const verified = await decrypt({
        iv:config.check_iv,ciphertext:config.check_ciphertext
      },candidate);
      if (verified !== MARKER) throw new Error("bad_key");
      const { data, error } = await client.from("mawaeidi_admin_vault_entries")
        .select("target_user_id,iv,ciphertext,updated_at")
        .eq("owner_user_id",ownerId).limit(2000);
      if (error) throw error;
      const loaded = new Map();
      for (const entry of data || []) {
        const clear = await decrypt(entry,candidate,entry.target_user_id);
        const payload = JSON.parse(clear);
        if (typeof payload.password !== "string") throw new Error("invalid_entry");
        loaded.set(entry.target_user_id,{ ...payload,savedAt:entry.updated_at });
      }
      key = candidate; saved = loaded;
      $("vaultUnlockMaster").value = "";
      $("vaultLocked").hidden = true;
      $("vaultUnlocked").hidden = false;
      $("vaultStatus").textContent = "مفتوحة";
      lastActivity = Date.now();
      clearNotice();
      redraw();
    } catch {
      key = null; saved.clear();
      notify("الكلمة الرئيسية غير صحيحة أو تعذر فك التشفير. لم تُفتح الخزنة.",true);
    } finally { busy = false; $("vaultUnlockButton").disabled = false; }
  });

  $("vaultLockButton").addEventListener("click", () => { lockVault(); notify("تم قفل الخزنة ومسح الكلمات الظاهرة من الصفحة."); });
  $("vaultEntryCancel").addEventListener("click", clearEntryEditor);
  $("vaultEntryReveal").addEventListener("click", () => {
    const input = $("vaultEntryPassword");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    $("vaultEntryReveal").textContent = visible ? "إظهار" : "إخفاء";
  });
  $("vaultEntryForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !key || !editingAccount) return;
    busy = true; $("vaultEntrySave").disabled = true;
    try {
      await saveRecord(editingAccount.id,{
        password:$("vaultEntryPassword").value,
        website:$("vaultEntryWebsite").value,
        note:$("vaultEntryNote").value
      });
      clearEntryEditor();
      notify("تم حفظ كلمة المرور في الخزنة المشفرة. هذا لم يغير كلمة دخول الحساب.");
    } catch { notify("لم نتمكن من حفظ كلمة المرور في الخزنة. حاول مرة أخرى.",true); }
    finally { busy = false; $("vaultEntrySave").disabled = false; }
  });

  client?.auth.onAuthStateChange((event, session) => {
    // Never carry decrypted secrets across an account switch.
    if (event === "SIGNED_OUT" || (ownerId && session?.user?.id !== ownerId)) {
      lockVault(); ownerId = null; config = null;
      $("vaultLocked").hidden = true;
      $("vaultNotConfigured").hidden = true;
      $("vaultStatus").textContent = "غير متاحة";
    }
  });
  window.addEventListener("pagehide", lockVault);
  ["keydown","pointerdown","touchstart"].forEach(name =>
    window.addEventListener(name, () => {lastActivity = Date.now()}, {passive:true}));
  window.setInterval(() => {
    if (key && Date.now() - lastActivity > 10 * 60 * 1000) {
      lockVault();
      notify("تم قفل الخزنة تلقائيًا بعد ١٠ دقائق دون تفاعل.");
    }
  }, 60000);

  window.mawaeidiVault = { buildPasswordCell,recordPasswordIfOpen,saveOneTime,
    isUnlocked: () => !!key, lock:lockVault };
  initialize();
})();
