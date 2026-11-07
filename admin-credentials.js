/* Mawaeidi: administrator-only saved credentials.
 * The server checks administrator membership and Supabase Vault encrypts at rest.
 * This module cannot recover Supabase Auth passwords or observe self-chosen passwords.
 * No passwords are persisted to browser storage. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const client = window.mawaeidiAdminClient;
  const DEFAULT_SITE = "مواعيدي";
  let currentOwner = null;
  let saved = new Map();
  let loading = true;
  let busy = false;
  let editing = null;

  function element(tag, name = "", value = null) {
    const el = document.createElement(tag);
    if (name) el.className = name;
    if (value !== null) el.textContent = String(value);
    return el;
  }
  function feedback(message, error = false) {
    const el = $("credentialsFeedback");
    el.hidden = false;
    el.textContent = message;
    el.classList.toggle("error",error);
  }
  function clearFeedback() {
    $("credentialsFeedback").textContent = "";
    $("credentialsFeedback").hidden = true;
  }
  function repaint() { window.mawaeidiRenderAccounts?.(); }
  function closeEditor() {
    editing = null;
    $("credentialsEditForm").hidden = true;
    $("credentialUserId").value = "";
    $("credentialPassword").value = "";
    $("credentialPassword").type = "password";
    $("credentialReveal").textContent = "إظهار";
    $("credentialWebsite").value = "";
    $("credentialNote").value = "";
  }
  function wipe() {
    saved.clear();
    currentOwner = null;
    loading = true;
    closeEditor();
    clearFeedback();
    repaint();
  }

  async function invoke(action, fields = {}) {
    if (!client) throw Error("not_connected");
    const { data, error } = await client.rpc("mawaeidi_admin_credentials", {
      p_action: action,
      p_user_id: fields.user_id ?? null,
      p_password: fields.password ?? null,
      p_website: fields.website ?? null,
      p_note: fields.note ?? null
    });
    if (error) throw error;
    return data;
  }

  async function initialize() {
    try {
      const { data: auth, error } = await client.auth.getUser();
      if (error || !auth?.user) throw Error("not_authenticated");
      currentOwner = auth.user.id;
      const data = await invoke("list");
      if (Array.isArray(data)) saved = new Map(data.map(entry =>
        [entry.user_id,entry]));
      else throw Error("invalid_data");
      loading = false;
      repaint();
    } catch (error) {
      loading = false;
      saved.clear();
      feedback("تعذّر تحميل كلمات المرور المحفوظة. حاول تحديث صفحة الإدارة.", true);
      repaint();
    }
  }
  function stale(record, changedAt) {
    if (!record || !changedAt) return false;
    const change = Date.parse(changedAt);
    const update = record.updated_at ? Date.parse(record.updated_at) : 0;
    return Number.isFinite(change) && change > update + 1000;
  }
  function iconSvg(name) {
    const svgs = {
      eye:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
      eyeOff:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.7 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.1 6.2C3.4 8.2 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>',
      copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
      edit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 11-11a2.2 2.2 0 0 0-3.2-3.2l-11 11L4 20Z"/><path d="m15 6 3 3"/></svg>'
    };
    return svgs[name] || "";
  }
  function iconButton(label, name) {
    const button = element("button", "vault-icon-btn");
    button.type = "button";
    button.setAttribute("aria-label",label);
    button.title = label;
    button.innerHTML = iconSvg(name);
    return button;
  }
  function openEditor(user) {
    if (busy) return;
    clearFeedback();
    editing = user.id;
    const row = saved.get(user.id);
    $("credentialUserId").value = user.id;
    $("credentialEmail").textContent = user.email || user.name || "حساب";
    $("credentialPassword").value = row?.password || "";
    $("credentialWebsite").value = row?.website || DEFAULT_SITE;
    $("credentialNote").value = row?.note || "";
    $("credentialsEditForm").hidden = false;
    $("credentialsEditForm").scrollIntoView({behavior:"smooth",block:"nearest"});
    $("credentialPassword").focus();
  }
  function buildPasswordCell(container, user, passwordChangedAt = null) {
    container.replaceChildren(element("small", "", "كلمة المرور"));
    if (loading) {
      container.append(element("span", "vault-muted", "جارٍ التحميل…"));
      return;
    }
    const record = saved.get(user.id);
    if (!record) {
      const line = element("div", "vault-password-shortline");
      line.append(element("span","vault-compact-placeholder","غير محفوظة"));
      const add = element("button","vault-small-btn","إضافة كلمة");
      add.type = "button";
      add.addEventListener("click", () => openEditor(user));
      line.append(add);
      container.append(line);
      return;
    }
    if (stale(record,passwordChangedAt)) {
      const label = element("div","vault-stale-password","تغيّرت من صفحة الحساب؛ المحفوظة قديمة");
      const update = element("button","vault-small-btn","تحديث المحفوظة");
      update.type = "button";
      update.addEventListener("click", () => openEditor(user));
      container.append(label,update);
      return;
    }
    const line = element("div","vault-secret-line");
    const input = element("input","vault-masked-password");
    input.type = "password";
    input.value = record.password || "";
    input.readOnly = true;
    input.autocomplete = "off";
    input.setAttribute("aria-label","كلمة مرور محفوظة لـ " + (user.email || user.name || "الحساب"));
    const reveal = iconButton("إظهار كلمة المرور","eye");
    reveal.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      reveal.title = visible ? "إظهار كلمة المرور" : "إخفاء كلمة المرور";
      reveal.setAttribute("aria-label",reveal.title);
      reveal.innerHTML = iconSvg(visible ? "eye" : "eyeOff");
    });
    const copy = iconButton("نسخ كلمة المرور","copy");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(record.password);
        feedback("تم نسخ كلمة المرور؛ قد تظل في حافظة الجهاز.");
      } catch { feedback("تعذر النسخ التلقائي. استخدم إظهار ونسخ يدويًا.",true); }
    });
    const edit = iconButton("تعديل كلمة المرور المحفوظة","edit");
    edit.addEventListener("click", () => openEditor(user));
    line.append(input,reveal,copy,edit);
    container.append(line);
  }

  async function recordPasswordIfOpen(id,password) {
    if (!id || !password) return false;
    const prev = saved.get(id);
    try {
      await invoke("save",{
        user_id:id,password,
        website:prev?.website || DEFAULT_SITE,
        note:prev?.note || ""
      });
      saved.set(id,{
        user_id:id,password,website:prev?.website || DEFAULT_SITE,
        note:prev?.note || "",updated_at:new Date().toISOString()
      });
      repaint();
      return true;
    } catch { return false; }
  }
  async function saveOneTime(id,password) {
    const ok = await recordPasswordIfOpen(id,password);
    feedback(ok ? "تم حفظ كلمة المرور بشكل مشفّر مع الحساب." :
      "لم تنجح عملية حفظ الكلمة؛ حاول مرة أخرى.",!ok);
    return ok;
  }

  $("credentialsEditForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !editing) return;
    const id = editing, password = $("credentialPassword").value;
    if (!password || password.length > 256) {
      feedback("أدخل كلمة مرور صالحة للحفظ.",true); return;
    }
    busy = true; $("credentialSave").disabled = true;
    try {
      const { error } = await client.rpc("mawaeidi_admin_credentials", {
        p_action:"save",p_user_id:id,p_password:password,
        p_website:$("credentialWebsite").value.trim() || DEFAULT_SITE,
        p_note:$("credentialNote").value.trim()
      });
      if (error) throw error;
      saved.set(id,{
        user_id:id,password,website:$("credentialWebsite").value.trim() || DEFAULT_SITE,
        note:$("credentialNote").value.trim(),updated_at:new Date().toISOString()
      });
      closeEditor();
      repaint();
      feedback("اتحفظت كلمة المرور مع الحساب، من غير كلمة رئيسية إضافية. الحفظ هنا لا يغيّر كلمة دخوله الفعلية.");
    } catch {
      feedback("تعذّر حفظ كلمة المرور. تحقق من الاتصال وحاول مرة أخرى.",true);
    } finally {
      busy = false; $("credentialSave").disabled = false;
    }
  });
  $("credentialCancel").addEventListener("click", closeEditor);
  $("credentialReveal").addEventListener("click", () => {
    const input = $("credentialPassword");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    $("credentialReveal").textContent = visible ? "إظهار" : "إخفاء";
  });

  client?.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" ||
        (currentOwner && session?.user?.id && session.user.id !== currentOwner)) wipe();
  });
  window.addEventListener("pagehide",wipe);
  window.mawaeidiCredentials = {
    buildPasswordCell, recordPasswordIfOpen, saveOneTime,
    forget: id => { saved.delete(id); repaint(); },
    refresh: initialize
  };
  if (client) initialize();
  else feedback("تعذّر الاتصال بحساب الإدارة.",true);
})();
