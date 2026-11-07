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

  function buildPasswordCell(container, user) {
    container.replaceChildren(make("small", "", "كلمة المرور"));
    if (!key) {
      container.append(make("span", "vault-muted", "الخزنة مقفلة"));
      const open = make("button", "vault-small-btn", "فتح الخزنة");
      open.type = "button";
      open.addEventListener("click", () => $("accountVault").scrollIntoView({behavior:"smooth",block:"start"}));
      container.append(open);
      return;
    }
    const record = saved.get(user.id);
    if (!record) {
      container.append(make("span", "vault-muted", "غير محفوظة"));
      const add = make("button", "vault-small-btn", "إدخال كلمة المرور");
      add.type = "button";
      add.addEventListener("click", () => openEntry(user));
      container.append(add);
      return;
    }
    const line = make("div", "vault-secret-line");
    const input = make("input", "vault-masked-password");
    input.type = "password";
    input.value = record.password;
    input.readOnly = true;
    input.autocomplete = "off";
    input.setAttribute("aria-label", "كلمة مرور محفوظة لـ " + (user.name || user.email));
    const toggle = make("button", "vault-icon-btn", "إظهار");
    toggle.type = "button";
    toggle.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      toggle.textContent = visible ? "إظهار" : "إخفاء";
    });
    const copy = make("button", "vault-icon-btn", "نسخ");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      if (!key) return;
      try {
        await navigator.clipboard.writeText(record.password);
        notify("تم نسخ كلمة مرور الحساب. انتبه إلى أن الحافظة قد تحتفظ بالكلمة.");
      } catch { notify("تعذر النسخ، يمكنك إظهار الكلمة ونسخها يدويًا.", true); }
    });
    line.append(input,toggle,copy);
    container.append(line);
    const info = make("small","vault-record-meta",record.website || "مواعيدي");
    container.append(info);
    if (record.note) container.append(make("span","vault-note",record.note));
    const edit = make("button", "vault-small-btn", "تعديل المحفوظة");
    edit.type = "button";
    edit.addEventListener("click", () => openEntry(user));
    container.append(edit);
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
    const { error } = await client.from("mawaeidi_admin_vault_entries")
      .upsert({
        owner_user_id: ownerId, target_user_id: id,
        iv: encrypted.iv, ciphertext: encrypted.ciphertext,
        updated_at: new Date().toISOString()
      }, { onConflict: "owner_user_id,target_user_id" });
    if (error) throw error;
    saved.set(id, data);
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
        .select("target_user_id,iv,ciphertext")
        .eq("owner_user_id",ownerId).limit(2000);
      if (error) throw error;
      const loaded = new Map();
      for (const entry of data || []) {
        const clear = await decrypt(entry,candidate,entry.target_user_id);
        const payload = JSON.parse(clear);
        if (typeof payload.password !== "string") throw new Error("invalid_entry");
        loaded.set(entry.target_user_id,payload);
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
