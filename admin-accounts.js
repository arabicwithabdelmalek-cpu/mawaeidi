/* Private account management for the Mawaeidi owner.
   All mutations run in a server-side Edge Function after checking admin membership.
   No current passwords, password hashes, or server credentials are exposed. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const client = window.mawaeidiAdminClient;
  const list = $("accountsList");
  let users = [];
  let passwordChanges = new Map();
  let loading = false;
  let submitting = false;
  let oneTimeTargetId = null;

  const create = (tag, className = "", value = null) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== null) el.textContent = String(value);
    return el;
  };
  const formatDate = value => value ? new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo"
  }).format(new Date(value)) : "لم يسجل دخولًا بعد";
  function feedback(message, error = false) {
    const el = $("accountsFeedback");
    el.textContent = message;
    el.hidden = false;
    el.classList.toggle("error", error);
  }
  function clearFeedback() {
    $("accountsFeedback").hidden = true;
    $("accountsFeedback").textContent = "";
  }
  function clearOneTimeCredentials() {
    oneTimeTargetId = null;
    // Do not persist readable passwords in storage, logs, URLs, or account records.
    $("oneTimePassword").value = "";
    $("oneTimeEmail").value = "";
    $("oneTimeCopyStatus").textContent = "";
    $("oneTimeCredentials").hidden = true;
  }
  function showOneTimeCredentials(email, password, userId = null) {
    clearOneTimeCredentials();
    oneTimeTargetId = userId;
    $("oneTimeEmail").value = email;
    $("oneTimePassword").value = password;
    $("oneTimeCredentials").hidden = false;
    $("oneTimeCredentials").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function clearPassword(form) {
    form.querySelectorAll('input[type="password"], input[data-secret="true"]')
      .forEach(input => { input.value = ""; input.type = "password"; });
    form.querySelectorAll(".password-toggle").forEach(button => button.textContent = "إظهار");
  }
  function closeForms() {
    $("createAccountForm").hidden = true;
    $("resetPasswordForm").hidden = true;
    $("deleteAccountForm").hidden = true;
    $("deleteAccountId").value = "";
    $("deleteAccountEmail").value = "";
    $("deleteAccountAcknowledged").checked = false;
    $("deleteAccountSubmit").disabled = true;
    clearPassword($("createAccountForm"));
    clearPassword($("resetPasswordForm"));
  }
  function setBusy(value) {
    submitting = value;
    ["createAccountSubmit", "resetPasswordSubmit", "deleteAccountSubmit"].forEach(id => {
      $(id).disabled = value;
    });
    $("openCreateAccount").disabled = value;
    if (!value) validateDeleteConfirmation();
  }
  const friendly = code => ({
    invalid_session: "انتهت جلسة الدخول. سجّل الدخول من جديد.",
    sign_in_required: "سجّل الدخول أولًا.",
    admin_only: "هذه العملية متاحة لحساب المدير فقط.",
    invalid_email: "تأكد من صحة البريد الإلكتروني.",
    weak_password: "كلمة المرور يجب أن تكون ١٠ أحرف على الأقل، بدون مسافات.",
    email_exists: "البريد الإلكتروني مُسجل بالفعل. استخدم تغيير كلمة المرور بدلًا من إنشاء حساب جديد.",
    name_too_long: "الاسم طويل جدًا.",
    invalid_user: "الحساب المحدد غير صالح.",
    user_not_found: "الحساب غير موجود.",
    create_failed: "تعذر إنشاء الحساب. تحقق من البريد وسياسة كلمة المرور.",
    password_change_failed: "تعذر تعديل كلمة المرور. جرّب كلمة مرور مختلفة.",
    permission_check_failed: "تعذر التحقق من الصلاحيات الآن.",
    service_unavailable: "خدمة إدارة الحسابات غير متاحة حاليًا.",
    users_unavailable: "تعذر استرجاع قائمة الحسابات.",
    confirmation_required: "يلزم تأكيد الحذف نهائيًا.",
    confirmation_mismatch: "البريد الإلكتروني المدخل لا يطابق الحساب المحدد.",
    cannot_delete_self: "لا يمكنك حذف حسابك الإداري من لوحة الإدارة.",
    cannot_delete_admin: "لا يمكن حذف الحسابات ذات صلاحية الإدارة من هذه الصفحة.",
    storage_check_failed: "تعذر التحقق من الصور والملفات الخاصة بالحساب. لم يُحذف الحساب.",
    storage_cleanup_failed: "تعذر حذف بعض الصور والملفات المرتبطة بالحساب. لم يُحذف الحساب، وقد تكون بعض الملفات حُذفت.",
    storage_too_large: "يحتوي هذا الحساب على ملفات أكثر مما يسمح به الحذف المباشر؛ يرجى تنظيف ملفاته أولًا.",
    delete_failed: "تعذر إتمام حذف الحساب. قد تبقى ملفات تعيق الحذف، وربما تكون بعض صور حسابه حُذفت بالفعل. راجع الحساب قبل إعادة المحاولة.",
  })[code] || "تعذر إتمام العملية. تحقق من اتصال الإنترنت وجرّب مجددًا.";

  async function invoke(payload) {
    if (!client) throw new Error("service_unavailable");
    const { data, error } = await client.functions.invoke(
      "mawaeidi-admin-accounts", { body: payload }
    );
    if (error) {
      // For a non-2xx Edge Function response, recover the short safe error code.
      let detail = null;
      try { detail = await error.context?.json?.(); } catch { /* ignore */ }
      throw new Error(detail?.error || data?.error || "service_unavailable");
    }
    if (!data || data.error) throw new Error(data?.error || "service_unavailable");
    return data;
  }

  function matches(user) {
    const query = $("accountSearch").value.trim().toLocaleLowerCase();
    return !query || [user.email, user.name].some(item =>
      (item || "").toLocaleLowerCase().includes(query));
  }
  function shortDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("ar-EG", {
      timeZone:"Africa/Cairo", day:"numeric", month:"short", hour:"numeric", minute:"2-digit"
    }).format(new Date(value));
  }
  function iconButton(title) {
    const button = create("button", "account-inline-icon");
    button.type = "button";
    button.title = title;
    button.setAttribute("aria-label", title);
    // Static SVG artwork, never derived from an email or any account input.
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
    return button;
  }
  function render() {
    const people = users.filter(matches);
    $("accountsCount").textContent = new Intl.NumberFormat("ar-EG").format(users.length) + " حساب";
    list.replaceChildren();
    if (!people.length) {
      list.append(create("p", "empty-state",
        users.length ? "لا توجد حسابات مطابقة للبحث." : "لا توجد حسابات."));
      return;
    }
    for (const user of people) {
      const row = create("article", "account-row account-row-compact");

      const identity = create("div", "account-identity-col");
      identity.append(create("small", "account-field-label", "البريد الإلكتروني"));
      const emailLine = create("div", "account-compact-email-line");
      const email = create("span", "account-compact-email", user.email || "بدون بريد");
      email.dir = "ltr";
      email.title = user.email || "";
      const copyEmail = iconButton("نسخ البريد الإلكتروني");
      copyEmail.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(user.email || "");
          feedback("تم نسخ البريد الإلكتروني.");
        } catch { feedback("تعذر نسخ البريد. حدده وانسخه يدويًا.",true); }
      });
      emailLine.append(email,copyEmail);
      identity.append(emailLine);
      const subline = create("div", "account-compact-secondary");
      if (user.name) subline.append(create("span", "", user.name));
      if (user.is_owner) subline.append(create("span", "account-owner-tag", "حسابك"));
      const change = passwordChanges.get(user.id);
      if (change) {
        const changed = create("span", "account-change-tag",
          "تغيّرت من صفحة الحساب: " + shortDate(change));
        changed.title = "تم تسجيل وقت التغيير فقط، ولا يمكن كشف الكلمة الجديدة لصاحب الموقع.";
        subline.append(changed);
      }
      const preview = create("button", "account-support-link", "معاينة كمسؤول");
      preview.type = "button";
      preview.setAttribute("aria-label", "معاينة حساب " + (user.email || "المستخدم") + " للقراءة فقط");
      preview.addEventListener("click", () => {
        if (window.mawaeidiAdminSupport) window.mawaeidiAdminSupport.open(user);
        else feedback("تعذّر تحميل أداة معاينة الحساب. حدّث الصفحة.", true);
      });
      subline.append(preview);
      identity.append(subline);

      const pass = create("div", "account-password-meta");
      if (window.mawaeidiCredentials?.buildPasswordCell) {
        window.mawaeidiCredentials.buildPasswordCell(pass,user,change || null);
      } else {
        pass.append(create("small", "", "كلمة المرور"),create("span", "", "جارٍ تحميل البيانات…"));
      }

      const actions = create("div", "account-row-actions");
      const action = create("button", "btn account-edit-btn", "تغيير الكلمة");
      action.type = "button";
      action.addEventListener("click", () => openReset(user));
      actions.append(action);
      if (!user.is_owner && !user.is_admin) {
        const remove = create("button", "btn account-remove-btn", "حذف");
        remove.type = "button";
        remove.addEventListener("click", () => openDelete(user));
        actions.append(remove);
      }
      row.append(identity,pass,actions);
      list.append(row);
    }
  }

  window.mawaeidiRenderAccounts = render;
  async function load(showMessage = false) {
    if (loading || !client) return;
    loading = true;
    $("refreshAccounts").disabled = true;
    try {
      const data = await invoke({ action: "list" });
      users = Array.isArray(data.users) ? data.users : [];
      passwordChanges = new Map();
      // Timestamp-only audit, not a copy of another person's password.
      try {
        const { data: changes, error: changeError } = await client
          .from("mawaeidi_password_change_events").select("user_id,changed_at");
        if (!changeError) passwordChanges = new Map((changes || []).map(item => [
          item.user_id,item.changed_at
        ]));
      } catch { /* Account list is still useful when the audit is unavailable. */ }
      render();
      if (showMessage) feedback("تم تحديث قائمة الحسابات.");
      else clearFeedback();
    } catch (error) {
      // Never display raw exceptions or any credentials in the page.
      list.replaceChildren(create("p","empty-state",
        "تعذّر تحميل الحسابات. استخدم زر تحديث الحسابات للمحاولة مجددًا."));
      feedback(friendly(error.message),true);
    } finally {
      loading = false;
      $("refreshAccounts").disabled = false;
    }
  }

  function openReset(user) {
    if (submitting) return;
    closeForms();
    clearFeedback();
    clearOneTimeCredentials();
    $("resetAccountId").value = user.id;
    $("resetAccountLabel").textContent = (user.name || "مستخدم") +
      " — " + (user.email || "");
    $("resetPasswordForm").hidden = false;
    $("resetAccountPassword").focus();
    $("resetPasswordForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function validateDeleteConfirmation() {
    const id = $("deleteAccountId").value;
    const user = users.find(item => item.id === id && !item.is_owner && !item.is_admin);
    const matches = !!user && $("deleteAccountEmail").value.trim().toLowerCase() ===
      (user.email || "").trim().toLowerCase();
    $("deleteAccountSubmit").disabled =
      submitting || !matches || !$("deleteAccountAcknowledged").checked;
    return matches && $("deleteAccountAcknowledged").checked;
  }

  function openDelete(user) {
    if (submitting || user.is_owner || user.is_admin) return;
    closeForms();
    clearFeedback();
    clearOneTimeCredentials();
    $("deleteAccountId").value = user.id;
    $("deleteAccountLabel").textContent =
      (user.name || "مستخدم") + " — " + (user.email || "");
    $("deleteAccountForm").hidden = false;
    validateDeleteConfirmation();
    $("deleteAccountEmail").focus();
    $("deleteAccountForm").scrollIntoView({ behavior:"smooth", block:"nearest" });
  }

  $("openCreateAccount").addEventListener("click", () => {
    closeForms(); clearFeedback(); clearOneTimeCredentials();
    $("createAccountForm").hidden = false;
    $("newAccountEmail").focus();
  });
  $("closeCreateAccount").addEventListener("click", closeForms);
  $("closeResetPassword").addEventListener("click", closeForms);
  $("closeDeleteAccount").addEventListener("click", closeForms);
  $("deleteAccountEmail").addEventListener("input", validateDeleteConfirmation);
  $("deleteAccountAcknowledged").addEventListener("change", validateDeleteConfirmation);
  $("accountSearch").addEventListener("input", render);
  $("refreshAccounts").addEventListener("click", () => load(true));
  $("dismissOneTimeCredentials").addEventListener("click", clearOneTimeCredentials);
  $("saveOneTimeWithAccount").addEventListener("click", async () => {
    const password = $("oneTimePassword").value;
    if (!oneTimeTargetId || !password) {
      $("oneTimeCopyStatus").textContent = "لا توجد بيانات حالية للحفظ.";
      return;
    }
    const ok = await window.mawaeidiCredentials?.saveOneTime(oneTimeTargetId,password);
    $("oneTimeCopyStatus").textContent = ok
      ? "تم حفظ الكلمة مشفّرة مع الحساب."
      : "تعذّر الحفظ؛ حاول مرة أخرى.";
  });
  $("copyOneTimePassword").addEventListener("click", async () => {
    if ($("oneTimeCredentials").hidden || !$("oneTimePassword").value) return;
    try {
      await navigator.clipboard.writeText($("oneTimePassword").value);
      $("oneTimeCopyStatus").textContent =
        "تم نسخ كلمة المرور. انتبه إلى أن الحافظة قد تظل محتفظة بها حتى تنسخ شيئًا آخر.";
    } catch {
      $("oneTimeCopyStatus").textContent =
        "تعذر النسخ تلقائيًا؛ حدد كلمة المرور وانسخها يدويًا.";
      $("oneTimePassword").focus();
      $("oneTimePassword").select();
    }
  });

  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const input = $(button.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      input.dataset.secret = "true";
      button.textContent = input.type === "password" ? "إظهار" : "إخفاء";
    });
  });

  $("createAccountForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting) return;
    const email = $("newAccountEmail").value.trim().toLowerCase();
    const name = $("newAccountName").value.trim();
    const password = $("newAccountPassword").value;
    if (password.length < 10 || password.length > 128 || /\s/.test(password)) {
      feedback("استخدم كلمة مرور من ١٠ أحرف على الأقل، بدون مسافات.",true);return;
    }
    if (!window.confirm("هل تريد إنشاء حساب جديد للبريد " + email + "؟")) return;
    clearFeedback();
    setBusy(true);
    try {
      const created = await invoke({ action:"create", email, name, password });
      $("createAccountForm").reset();
      closeForms();
      await load();
      showOneTimeCredentials(email, password, created.user?.id || null);
      let savedWithAccount = false;
      try {
        savedWithAccount = !!(await window.mawaeidiCredentials?.recordPasswordIfOpen(created.user?.id,password));
      } catch { /* The account exists even if saved-credential synchronization fails. */ }
      feedback(savedWithAccount
        ? "تم إنشاء الحساب وحفظ كلمته بشكل مشفّر مع الحساب."
        : "تم إنشاء الحساب. انسخ الكلمة أو اضغط حفظ مع الحساب قبل إغلاق البطاقة.");
    } catch (error) {
      feedback(friendly(error.message),true);
    } finally {
      setBusy(false);
    }
  });

  $("resetPasswordForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting) return;
    const id = $("resetAccountId").value;
    const user = users.find(person => person.id === id);
    const password = $("resetAccountPassword").value;
    if (!user) { feedback("اختر حسابًا صحيحًا.",true);return; }
    if (password.length < 10 || password.length > 128 || /\s/.test(password)) {
      feedback("استخدم كلمة مرور من ١٠ أحرف على الأقل، بدون مسافات.",true);return;
    }
    if (!window.confirm("تأكيد تغيير كلمة مرور الحساب:\n" + user.email +
      "\nلن يتمكن صاحبه من استخدام كلمة المرور القديمة بعد التغيير.")) return;
    clearFeedback();
    setBusy(true);
    try {
      await invoke({ action:"set_password", user_id:id, password });
      closeForms();
      showOneTimeCredentials(user.email || "", password, id);
      let savedWithAccount = false;
      try {
        savedWithAccount = !!(await window.mawaeidiCredentials?.recordPasswordIfOpen(id,password));
      } catch { /* A saved-credential failure must not falsely report a failed Auth reset. */ }
      feedback(savedWithAccount
        ? "تم تغيير كلمة المرور وتحديث الكلمة المحفوظة مع الحساب."
        : "تم تغيير كلمة المرور. انسخها أو احفظها مع الحساب قبل إغلاق البطاقة.");
    } catch (error) {
      feedback(friendly(error.message),true);
    } finally {
      setBusy(false);
    }
  });

  $("deleteAccountForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || !validateDeleteConfirmation()) return;
    const id = $("deleteAccountId").value;
    const user = users.find(person => person.id === id);
    if (!user || user.is_owner || user.is_admin) {
      feedback("لا يُسمح بحذف حساب الإدارة.", true);
      return;
    }
    const email = user.email || "";
    if (!window.confirm(
      "تحذير أخير: هل تريد حذف الحساب نهائيًا؟\n" + email +
      "\nسيتم حذف الحساب والمواعيد والطلاب وبياناته المرتبطة، ولن يمكن التراجع عن العملية."
    )) return;
    clearFeedback();
    setBusy(true);
    try {
      await invoke({
        action: "delete",
        user_id: id,
        confirm_email: $("deleteAccountEmail").value.trim().toLowerCase(),
        confirm_phrase: "حذف نهائي"
      });
      clearOneTimeCredentials();
      window.mawaeidiCredentials?.forget(id);
      users = users.filter(person => person.id !== id);
      closeForms();
      render();
      await load();
      feedback("تم حذف حساب " + email + " نهائيًا وإزالة بياناته المرتبطة من الموقع.");
    } catch (error) {
      feedback(friendly(error.message), true);
    } finally {
      setBusy(false);
    }
  });

  if (client) {
    client.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        clearOneTimeCredentials();
        users = [];
        closeForms();
        list.replaceChildren(create("p","empty-state","سجّل الدخول مرة أخرى."));
        $("accountsCount").textContent = "—";
      }
    });
  }
  window.addEventListener("pagehide", clearOneTimeCredentials);
  load();
})();
