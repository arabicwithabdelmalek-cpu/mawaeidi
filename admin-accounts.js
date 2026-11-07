/* Private account management for the Mawaeidi owner.
   All mutations run in a server-side Edge Function after checking admin membership.
   No current passwords, password hashes, or server credentials are exposed. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const client = window.mawaeidiAdminClient;
  const list = $("accountsList");
  let users = [];
  let loading = false;
  let submitting = false;

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
  function clearPassword(form) {
    form.querySelectorAll('input[type="password"], input[data-secret="true"]')
      .forEach(input => { input.value = ""; input.type = "password"; });
    form.querySelectorAll(".password-toggle").forEach(button => button.textContent = "إظهار");
  }
  function closeForms() {
    $("createAccountForm").hidden = true;
    $("resetPasswordForm").hidden = true;
    clearPassword($("createAccountForm"));
    clearPassword($("resetPasswordForm"));
  }
  function setBusy(value) {
    submitting = value;
    ["createAccountSubmit", "resetPasswordSubmit"].forEach(id => {
      $(id).disabled = value;
    });
    $("openCreateAccount").disabled = value;
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
  function render() {
    const people = users.filter(matches);
    $("accountsCount").textContent = new Intl.NumberFormat("ar-EG").format(users.length) + " حساب";
    list.replaceChildren();
    if (!people.length) {
      list.append(create("p", "empty-state",
        users.length ? "لا توجد حسابات مطابقة للبحث." : "لا توجد حسابات."));
      return;
    }
    people.forEach(user => {
      const row = create("article", "account-row");
      const person = create("div", "account-person");
      const avatar = create("span", "account-avatar",
        [...(user.name || user.email || "م")][0]);
      const nameBlock = create("div", "account-name-block");
      const label = create("strong", "", user.name || "مستخدم مواعيدي");
      const email = create("span", "account-email", user.email || "بدون بريد");
      nameBlock.append(label, email);
      if (user.is_owner) nameBlock.append(create("small", "account-owner-tag", "حسابك"));
      person.append(avatar,nameBlock);
      const meta = create("div", "account-meta");
      meta.append(create("small", "", "آخر تسجيل دخول"),
        create("span", "", formatDate(user.last_sign_in_at)));
      const pass = create("div", "account-password-meta");
      pass.append(create("small", "", "كلمة المرور"),
        create("strong", "", "••••••••"),
        create("span", "", "مخفية لأمان الحساب"));
      const action = create("button", "btn account-edit-btn", "تغيير كلمة المرور");
      action.type = "button";
      action.addEventListener("click", () => openReset(user));
      row.append(person,meta,pass,action);
      list.append(row);
    });
  }

  async function load(showMessage = false) {
    if (loading || !client) return;
    loading = true;
    $("refreshAccounts").disabled = true;
    try {
      const data = await invoke({ action: "list" });
      users = Array.isArray(data.users) ? data.users : [];
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
    $("resetAccountId").value = user.id;
    $("resetAccountLabel").textContent = (user.name || "مستخدم") +
      " — " + (user.email || "");
    $("resetPasswordForm").hidden = false;
    $("resetAccountPassword").focus();
    $("resetPasswordForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  $("openCreateAccount").addEventListener("click", () => {
    closeForms(); clearFeedback();
    $("createAccountForm").hidden = false;
    $("newAccountEmail").focus();
  });
  $("closeCreateAccount").addEventListener("click", closeForms);
  $("closeResetPassword").addEventListener("click", closeForms);
  $("accountSearch").addEventListener("input", render);
  $("refreshAccounts").addEventListener("click", () => load(true));

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
      await invoke({ action:"create", email, name, password });
      $("createAccountForm").reset();
      closeForms();
      await load();
      feedback("تم إنشاء الحساب بنجاح. يمكنك إرسال البريد وكلمة المرور الجديدة لصاحب الحساب بطريقة آمنة.");
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
      feedback("تم تعيين كلمة المرور الجديدة للحساب بنجاح. بلّغ صاحب الحساب بالكلمة الجديدة بطريقة آمنة.");
    } catch (error) {
      feedback(friendly(error.message),true);
    } finally {
      setBusy(false);
    }
  });

  if (client) {
    client.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        users = [];
        closeForms();
        list.replaceChildren(create("p","empty-state","سجّل الدخول مرة أخرى."));
        $("accountsCount").textContent = "—";
      }
    });
  }
  load();
})();
