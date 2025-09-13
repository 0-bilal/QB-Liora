/* assets/js/index.js
 * تسجيل موحّد: اسم + PIN (4 أرقام)
 * مناداة واحدة إلى loginOrRegister:
 *  - موجود مسبقًا  → isNew=false → يحوّل إلى لوحة الاختبارات
 *  - غير موجود    → isNew=true  → ينشئ الحساب ويحّول إلى إنشاء اختبار
 *
 * ملاحظة: منطق تفرّد PIN يُدار من جهة السيرفر (FriendAPI.gs).
 * يعتمد على post() من assets/js/api.js
 */

"use strict";

(function () {
  const elName = document.getElementById("authName");
  const elPin  = document.getElementById("authPin");
  const btnGo  = document.getElementById("btnGo");
  const elErr  = document.getElementById("authErr");
  const elMsg  = document.getElementById("authMsg");

  // ===== Helpers =====
  function setErr(msg) {
    if (!elErr) return;
    if (!msg) { elErr.style.display = "none"; elErr.textContent = ""; }
    else { elErr.style.display = "block"; elErr.textContent = msg; }
  }
  function setMsg(msg) { if (elMsg) elMsg.textContent = msg || ""; }

  function getInputs() {
    const name = (elName?.value || "").trim();
    const pin4 = (elPin?.value || "").trim();
    if (!name) throw new Error("يرجى إدخال الاسم.");
    if (!/^\d{4}$/.test(pin4)) throw new Error("الرقم التعريفي يجب أن يكون 4 أرقام.");
    return { name, pin4 };
  }

  function saveUser(u) {
    try { localStorage.setItem("fm_user", JSON.stringify(u)); } catch {}
  }

  // قيود الإدخال للـ PIN (أرقام فقط وبحدّ 4)
  elPin?.addEventListener("input", () => {
    elPin.value = (elPin.value || "").replace(/\D+/g, "").slice(0, 4);
  });

  // Enter = استمرار
  [elName, elPin].forEach((el) =>
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnGo?.click();
      }
    })
  );

  // تعبئة الاسم إن كان محفوظًا
  (function prefill() {
    try {
      const cached = JSON.parse(localStorage.getItem("fm_user") || "null");
      if (cached?.name && elName && !elName.value) elName.value = cached.name;
    } catch {}
  })();

  // ===== Action =====
  async function handleGo() {
    setErr("");
    setMsg("جارٍ المتابعة…");
    try {
      const { name, pin4 } = getInputs();

      // مناداة موحّدة
      const res = await post("loginOrRegister", { name, pin4 });
      // حفظ جلسة المستخدم محليًا
      saveUser({ userId: res.userId, name: res.name });

      // توجيه بحسب isNew
      if (res.isNew) {
        location.href = "create.html";
      } else {
        location.href = `owner.html?user=${encodeURIComponent(res.userId)}`;
      }
    } catch (err) {
      // أمثلة رسائل محتملة من السيرفر:
      // - "هذا PIN مستخدم بالفعل" عند محاولة إنشاء جديد بـ PIN مكرر
      // - أخطاء تحقق أخرى
      setErr(err?.message || "تعذّر المتابعة.");
    } finally {
      setMsg("");
    }
  }

  btnGo?.addEventListener("click", handleGo);
})();
