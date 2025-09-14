/* assets/js/api.js
 * FriendMeter – واجهة الاتصال مع Google Apps Script Web App
 *
 * ملاحظات مهمة:
 * - نرسل الطلبات عبر POST بصيغة application/x-www-form-urlencoded (بدون هيدرز مخصّصة)
 *   لتجنّب طلب preflight ومشاكل CORS.
 * - استبدل رابط API أدناه برابط الويب آب بعد النشر من GAS.
 * - دالة post(action, payload) تُعيد Promise يحلّ بالـ data القادمة من الخادم.
 */

"use strict";

// ↙️ ضع هنا رابط الويب آب من GAS بعد النشر (Deploy → Web app → Anyone with the link)
const API_URL =
  // يسمح بتمرير الرابط من نافذة قبل التحميل (اختياري)
  (window.FRIENDMETER_API_URL || null) ||
  // أو من <meta name="friendmeter-api" content="..."> داخل <head> (اختياري)
  (document.querySelector('meta[name="friendmeter-api"]')?.content || null) ||
  // أو ثابت افتراضي تحتاج لتعديله يدوياً
  "https://script.google.com/macros/s/AKfycbyt4mEdGo7t1eEqCqIc_cKWj3Ax12FCX1IHp9mtCS-WLyLkPTdj-QyT6NxjkXJ20RbC4g/exec";

/**
 * إرسال طلب إلى GAS
 * @param {string} action - اسم العملية في السيرفر (createQuiz | getQuiz | submitQuiz)
 * @param {object} payload - حمولة البيانات (كائن يُحوَّل إلى JSON)
 * @param {object} [opts] - خيارات إضافية { timeoutMs?: number }
 * @returns {Promise<any>} - data القادمة من السيرفر عند النجاح
 */
async function post(action, payload = {}, opts = {}) {
  if (!API_URL || API_URL.includes("REPLACE_WITH_DEPLOYMENT_ID")) {
    throw new Error("الرجاء ضبط API_URL برابط الويب آب الخاص بمشروع GAS.");
  }

  const body = new URLSearchParams();
  body.set("action", String(action || "").trim());
  body.set("payload", JSON.stringify(payload || {}));

  // مهلة افتراضية 15 ثانية
  const controller = new AbortController();
  const timeoutMs = Number(opts.timeoutMs || 15000);
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body,            // لا نحدد Content-Type لتفادي preflight
      signal: controller.signal,
      // لا نضع headers مخصّصة هنا
      // mode: "cors" // القيمة الافتراضية عادةً تكفي
    });

    // محاولة قراءة JSON آمنة
    const json = await res.json().catch(() => null);

    if (!json) {
      throw new Error("فشل تحليل استجابة الخادم (JSON).");
    }
    if (!json.ok) {
      throw new Error(json.error || "حدث خطأ من الخادم.");
    }
    return json.data;
  } catch (err) {
    // رسائل مفهومة للمستخدم
    if (err.name === "AbortError") {
      throw new Error("انتهت المهلة، حاول مرة أخرى.");
    }
    // بعض أخطاء الشبكة لا تحتوي message واضحة
    const msg = (err && err.message) ? err.message : "تعذّر الاتصال بالخادم.";
    throw new Error(msg);
  } finally {
    clearTimeout(t);
  }
}

/* دوال مختصرة اختيارية (إن أحببت استخدامها بدلاً من post)
   ملاحظة: الملفات الأخرى تستخدم post() مباشرة، لذلك هذه اختيارية. */
async function apiCreateQuiz(ownerName, questions, mode = "classic") {
  return post("createQuiz", { ownerName, mode, questions });
}

async function apiGetQuiz(token) {
  return post("getQuiz", { token });
}

async function apiSubmitQuiz(quizId, playerName, answers) {
  return post("submitQuiz", { quizId, playerName, answers });
}



const APP_VERSION = "v2.1";
const DATA_VERSIN = "سبتمبر 2025";

window.APP_VERSION = APP_VERSION;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".version-badge, #appVersion").forEach(el => {
    el.textContent = APP_VERSION;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".dev-date, #appVersion").forEach(el => {
    el.textContent = DATA_VERSIN; 
  });
});
