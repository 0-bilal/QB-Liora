/* assets/js/owner.js
 * لوحة المالك المحدثة - استعراض نتائج الاختبارات
 * يدعم 3 طرق للوصول:
 *  1) عبر رمز المالك:            owner.html?owner=OWNER_TOKEN
 *  2) عبر (رمز المشاركة + PIN):   owner.html?token=SHARE_TOKEN&pin=1234
 *  3) عبر مستخدم مسجَّل:          owner.html?user=USER_ID  ← يعرض قائمة كل اختباراته
 *
 * يتكامل مع دوال GAS:
 *  - getOwnerSummary({ ownerToken })  أو  ({ token, pin })
 *  - getSessionDetails({ ownerToken, sessionId }) أو ({ token, pin, sessionId })
 *  - getUserQuizzes({ userId })        ← لعرض قائمة اختبارات المستخدم
 */

"use strict";

(function () {
  // =========================
  // عناصر DOM الموجودة أصلًا
  // =========================
  const elAccessCard    = document.getElementById("accessCard");
  const elAccessForm    = document.getElementById("accessForm");
  const elOwnerTokenIn  = document.getElementById("ownerToken");
  const elShareTokenIn  = document.getElementById("shareToken");
  const elOwnerPINIn    = document.getElementById("ownerPIN");
  const elAccessBtn     = document.getElementById("accessBtn");
  const elAccessLoad    = document.getElementById("accessLoading");
  const elAccessErr     = document.getElementById("accessErr");

  const elSummaryCard   = document.getElementById("summaryCard");
  const elQuizMeta      = document.getElementById("quizMeta");
  const elOwnerNameBadg = document.getElementById("ownerNameBadg");
  const elModeBadg      = document.getElementById("modeBadg");
  const elCreatedAtBadg = document.getElementById("createdAtBadg");
  const elCountBadg     = document.getElementById("countBadg");

  const elSessionsCard  = document.getElementById("sessionsCard");
  const elSessionsBody  = document.getElementById("sessionsBody");

  const elDetailsCard   = document.getElementById("detailsCard");
  const elDetailsList   = document.getElementById("detailsList");
  const elCloseDetails  = document.getElementById("closeDetails");

  const elErr           = document.getElementById("err");

  // =========================
  // عناصر يتم إنشاؤها ديناميكيًا (قائمة اختبارات المستخدم)
  // =========================
  const mainContainer = document.querySelector("main .container") || document.body;
  let elQuizzesCard = document.getElementById("quizzesCard");
  let elQuizzesBody;

  function ensureQuizzesCard() {
    if (elQuizzesCard) return elQuizzesCard;
    elQuizzesCard = document.createElement("section");
    elQuizzesCard.className = "sessions-card";
    elQuizzesCard.id = "quizzesCard";
    elQuizzesCard.style.display = "none";
    elQuizzesCard.innerHTML = `
      <div class="sessions-header">
        <div class="section-title">
          <h2><span class="title-icon">📚</span>اختباراتي</h2>
          <p>جميع الاختبارات التي أنشأتها ونتائجها</p>
        </div>
      </div>
      <div class="sessions-table">
        <div class="table-header">
          <div class="th"><span class="th-icon">📅</span><span>التاريخ</span></div>
          <div class="th"><span class="th-icon">📝</span><span>الاسم</span></div>
          <div class="th"><span class="th-icon">🏆</span><span>المحاولات</span></div>
          <div class="th"><span class="th-icon">🔗</span><span>المشاركة</span></div>
          <div class="th"><span class="th-icon">👁️</span><span>اللوحة</span></div>
        </div>
        <div id="quizzesBody" class="table-body"></div>
      </div>
    `;
    // ضعه قبل بطاقة الملخص
    mainContainer.insertBefore(elQuizzesCard, elSummaryCard);
    elQuizzesBody = elQuizzesCard.querySelector("#quizzesBody");
    return elQuizzesCard;
  }

  // =========================
  // حالة عامة
  // =========================
  let ACCESS = {
    ownerToken: null, // إذا استعملنا رابط المالك
    token: null,      // shareToken إذا اخترنا التحقق عبر (token+pin)
    pin: null,
    userId: null      // عند عرض قائمة اختبارات المستخدم
  };

  // =========================
  // أدوات مساعدة
  // =========================
  function getParam(name, urlStr) {
    try {
      const u = new URL(urlStr || location.href);
      return u.searchParams.get(name);
    } catch { return null; }
  }

  function setError(msg) {
    if (!elErr) return;
    if (!msg) { 
      elErr.style.display = "none"; 
      elErr.textContent = ""; 
    } else { 
      elErr.style.display = "block"; 
      elErr.textContent = msg;
      elErr.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function setAccessError(msg) {
    if (!elAccessErr) return;
    if (!msg) { 
      elAccessErr.style.display = "none"; 
      elAccessErr.textContent = ""; 
    } else { 
      elAccessErr.style.display = "block"; 
      elAccessErr.textContent = msg; 
    }
  }

  function setAccessLoading(loading) {
    const btnIcon = elAccessBtn?.querySelector('.btn-icon');
    const btnText = elAccessBtn?.querySelector('.btn-text');
    const btnLoading = elAccessBtn?.querySelector('.btn-loading');
    
    if (loading) {
      elAccessBtn?.setAttribute("disabled", "true");
      if (elAccessLoad) elAccessLoad.style.display = "flex";
      if (btnIcon) btnIcon.style.display = "none";
      if (btnText) btnText.textContent = "جارٍ التحقق...";
      if (btnLoading) btnLoading.style.display = "inline";
    } else {
      elAccessBtn?.removeAttribute("disabled");
      if (elAccessLoad) elAccessLoad.style.display = "none";
      if (btnIcon) btnIcon.style.display = "inline";
      if (btnText) btnText.textContent = "عرض النتائج";
      if (btnLoading) btnLoading.style.display = "none";
    }
  }

  function fmtDate(x) {
    if (!x) return "—";
    try {
      const d = new Date(x);
      return d.toLocaleString("en-US", {
        year: "numeric", 
        month: "short", 
        day: "2-digit",
        hour: "2-digit", 
        minute: "2-digit"
      });
    } catch { 
      return String(x); 
    }
  }

  function fmtDateShort(x) {
    if (!x) return "—";
    try {
      const d = new Date(x);
      return d.toLocaleString("en-US", {
        year: "2-digit",
        month: "short", 
        day: "2-digit"
      });
    } catch { 
      return String(x); 
    }
  }

  function showAccessCard(prefill = {}) {
    if (elAccessCard) elAccessCard.style.display = "block";
    if (elSummaryCard) elSummaryCard.style.display = "none";
    if (elSessionsCard) elSessionsCard.style.display = "none";
    if (elDetailsCard) elDetailsCard.style.display = "none";
    if (elQuizzesCard) elQuizzesCard.style.display = "none";

    if (prefill.owner && elOwnerTokenIn) elOwnerTokenIn.value = prefill.owner;
    if (prefill.token && elShareTokenIn) elShareTokenIn.value = prefill.token;
    if (prefill.pin && elOwnerPINIn) elOwnerPINIn.value = prefill.pin;
  }

  function hideAccessCard() {
    if (elAccessCard) elAccessCard.style.display = "none";
  }

  function clearDetails() {
    if (elDetailsList) elDetailsList.innerHTML = "";
    if (elDetailsCard) elDetailsCard.style.display = "none";
  }

  // =========================
  // عرض ملخص اختبار واحد + الجلسات
  // =========================
  function renderSummary(data) {
    const q = data.quiz || {};
    const list = Array.isArray(data.sessions) ? data.sessions : [];

    if (elSummaryCard) elSummaryCard.style.display = "block";
    if (elSessionsCard) elSessionsCard.style.display = "block";

    // تحديث معلومات الاختبار
    if (elQuizMeta) {
      elQuizMeta.textContent = 
        `اختبار ${q.ownerName || "غير محدد"} — أُنشئ ${fmtDate(q.createdAt)} — النمط: ${q.mode || "classic"}`;
    }
    
    if (elOwnerNameBadg) elOwnerNameBadg.textContent = q.ownerName || "—";
    if (elModeBadg) elModeBadg.textContent = q.mode || "—";
    if (elCreatedAtBadg) elCreatedAtBadg.textContent = fmtDateShort(q.createdAt);
    if (elCountBadg) elCountBadg.textContent = String(list.length);

    if (!elSessionsBody) return;

    // عرض الجلسات
    if (!list.length) {
      elSessionsBody.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">🎮</span>
          <p>لا توجد محاولات بعد</p>
          <small>شارك رابط الاختبار مع أصدقائك للحصول على النتائج!</small>
        </div>
      `;
      return;
    }

    elSessionsBody.innerHTML = list.map(item => `
      <div class="table-row">
        <div class="row-name" title="${item.playerName || ''}">${item.playerName || "مجهول"}</div>
        <div class="row-score">${Number(item.score || 0)}</div>
        <div class="row-date desktop-only">${fmtDateShort(item.startedAt)}</div>
        <div class="row-date desktop-only">${fmtDateShort(item.finishedAt)}</div>
        <div>
          <button class="btn-details" data-session="${item.sessionId}">
            <span>👁️</span>
            عرض
          </button>
        </div>
      </div>
    `).join("");

    // تفويض النقر للتفاصيل
    elSessionsBody.onclick = async (e) => {
      const btn = e.target.closest(".btn-details");
      if (!btn) return;
      const sessionId = btn.getAttribute("data-session");
      if (!sessionId) return;
      await loadSessionDetails(sessionId);
    };
  }

  function renderDetails(items, ownerName) {
    if (!elDetailsList || !elDetailsCard) return;
    
    if (!Array.isArray(items) || !items.length) {
      elDetailsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">📋</span>
          <p>لا تتوفر تفاصيل لهذه الجلسة</p>
        </div>`;
      elDetailsCard.style.display = "block";
      elDetailsCard.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    elDetailsList.innerHTML = items.map(it => {
      const isCorrect = it.isMatch;
      const statusIcon = isCorrect ? "✅" : "❌";
      const title = `${Number(it.qid) + 1}. ${it.text || "سؤال غير محدد"}`;
      const expected = (it.expectedLabel ?? it.expected ?? "—");
      const choice = (it.choiceLabel ?? it.choice ?? "—");
      
      return `
        <div class="detail-item ${isCorrect ? 'correct' : 'incorrect'}">
          <div class="detail-question">
            <span class="detail-status">${statusIcon}</span>
            <span>${title}</span>
          </div>
          <div class="detail-answers">
            <div class="answer-row">
              <span class="answer-label">إجابة ${ownerName || "المالك"}:</span>
              <span class="answer-value correct">${expected}</span>
            </div>
            <div class="answer-row">
              <span class="answer-label">إجابة اللاعب:</span>
              <span class="answer-value ${isCorrect ? 'correct' : 'incorrect'}">${choice}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    elDetailsCard.style.display = "block";
    elDetailsCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // =========================
  // عرض قائمة اختبارات المستخدم
  // =========================
  function renderUserQuizzes(list) {
    ensureQuizzesCard();
    
    if (!Array.isArray(list) || !list.length) {
      elQuizzesBody.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">📚</span>
          <p>لا توجد اختبارات حتى الآن</p>
          <small>يمكنك <a href="create.html" style="color: var(--accent-primary); text-decoration: none;">إنشاء اختبار جديد</a> للبدء</small>
        </div>`;
      elQuizzesCard.style.display = "block";
      if (elSummaryCard) elSummaryCard.style.display = "none";
      if (elSessionsCard) elSessionsCard.style.display = "none";
      if (elDetailsCard) elDetailsCard.style.display = "none";
      return;
    }

    elQuizzesBody.innerHTML = list.map(it => {
      const created = fmtDateShort(it.createdAt);
      const shareUrl = it.shareUrl || "#";
      const attemptsCount = Number(it.attempts || 0);
      
      return `
        <div class="table-row">
          <div class="row-date">${created}</div>
          <div class="row-name">${it.ownerName || "—"}</div>
          <div class="row-score">${attemptsCount}</div>
          <div>
            <a href="${shareUrl}" target="_blank" rel="noopener" class="btn-details">
              <span>🔗</span>
              نسخ
            </a>
          </div>
          <div>
            <button class="btn-details btn-open-quiz" data-owner="${it.ownerToken}">
              <span>👁️</span>
              فتح
            </button>
          </div>
        </div>
      `;
    }).join("");

    elQuizzesCard.style.display = "block";
    
    // استماع لزر "فتح"
    elQuizzesBody.onclick = async (e) => {
      const btn = e.target.closest(".btn-open-quiz");
      if (!btn) return;
      const ownerTok = btn.getAttribute("data-owner");
      if (!ownerTok) return;
      
      // ثبّت طريقة الوصول على ownerToken وافتح الملخص
      ACCESS.ownerToken = ownerTok;
      ACCESS.token = null;
      ACCESS.pin = null;
      await loadOwnerSummary();
      if (elSummaryCard) {
        elSummaryCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
  }

  // =========================
  // استدعاءات الخادم
  // =========================
  async function loadOwnerSummary() {
    setError("");
    clearDetails();
    
    try {
      let data;
      if (ACCESS.ownerToken) {
        data = await post("getOwnerSummary", { ownerToken: ACCESS.ownerToken });
      } else if (ACCESS.token && ACCESS.pin) {
        data = await post("getOwnerSummary", { token: ACCESS.token, pin: ACCESS.pin });
      } else {
        // لا بيانات وصول → أعرض بطاقة الدخول
        showAccessCard({});
        return;
      }
      
      renderSummary(data);
      
      // خزّن ownerToken لتسهيل الرجوع داخل نفس الجلسة
      try {
        if (ACCESS.ownerToken) {
          sessionStorage.setItem("friendmeter_owner_token", ACCESS.ownerToken);
        }
      } catch {}
    } catch (err) {
      setError(err?.message || "تعذّر تحميل الملخص.");
      showAccessCard({
        owner: ACCESS.ownerToken || "",
        token: ACCESS.token || "",
        pin: ACCESS.pin || ""
      });
    }
  }

  async function loadSessionDetails(sessionId) {
    setError("");
    
    try {
      let data;
      if (ACCESS.ownerToken) {
        data = await post("getSessionDetails", { ownerToken: ACCESS.ownerToken, sessionId });
      } else if (ACCESS.token && ACCESS.pin) {
        data = await post("getSessionDetails", { token: ACCESS.token, pin: ACCESS.pin, sessionId });
      } else {
        throw new Error("بيانات الوصول غير متوفرة.");
      }
      
      const ownerName = (elOwnerNameBadg?.textContent || "").trim() || "المالك";
      renderDetails(data.breakdown, ownerName);
    } catch (err) {
      setError(err?.message || "تعذّر تحميل تفاصيل الجلسة.");
    }
  }

  async function loadUserQuizzes(userId) {
    setError("");
    
    try {
      const list = await post("getUserQuizzes", { userId });
      renderUserQuizzes(list);
    } catch (err) {
      setError(err?.message || "تعذّر تحميل اختباراتك.");
    }
  }

  // =========================
  // معالجة النموذج (الوصول اليدوي)
  // =========================
  if (elAccessForm) {
    elAccessForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setAccessError("");
      setError("");
      clearDetails();
      setAccessLoading(true);

      try {
        const owner = elOwnerTokenIn?.value?.trim() || "";
        const token = elShareTokenIn?.value?.trim() || "";
        const pin = elOwnerPINIn?.value?.trim() || "";

        if (!owner && !token) {
          throw new Error("أدخل رمز المالك أو رمز المشاركة مع الـ PIN.");
        }
        if (!owner && token && !pin) {
          throw new Error("هذا الاختبار محمي بـ PIN، الرجاء إدخاله.");
        }

        ACCESS = {
          ownerToken: owner || null,
          token: owner ? null : token,
          pin: owner ? null : pin,
          userId: null
        };

        hideAccessCard();
        await loadOwnerSummary();
        
        // التمرير إلى الملخص بعد التحميل الناجح
        if (elSummaryCard) {
          setTimeout(() => {
            elSummaryCard.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
        }
      } catch (err) {
        setAccessError(err?.message || "تعذّر التحقق من الوصول.");
      } finally {
        setAccessLoading(false);
      }
    });
  }

  // =========================
  // معالجة الأحداث
  // =========================
  
  // زر إغلاق التفاصيل
  if (elCloseDetails) {
    elCloseDetails.addEventListener("click", () => {
      clearDetails();
    });
  }

  // تقييد إدخال PIN للأرقام فقط
  if (elOwnerPINIn) {
    elOwnerPINIn.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });
  }

  // معالجة Enter في حقول النموذج
  [elOwnerTokenIn, elShareTokenIn, elOwnerPINIn].forEach(el => {
    if (el) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (elAccessBtn && !elAccessBtn.disabled) {
            elAccessBtn.click();
          }
        }
      });
    }
  });

  // =========================
  // بداية التشغيل
  // =========================
  (async function init() {
    const ownerFromUrl = getParam("owner");
    const tokenFromUrl = getParam("token");
    const pinFromUrl = getParam("pin");
    const userFromUrl = getParam("user");

    // إضافة مؤثرات تحميل سلسة
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s ease-in-out";
    
    try {
      // 1) ?user=USER_ID → اعرض قائمة الاختبارات
      if (userFromUrl) {
        ACCESS = { ownerToken: null, token: null, pin: null, userId: userFromUrl };
        hideAccessCard();
        await loadUserQuizzes(userFromUrl);
        return;
      }

      // 2) ?owner=OWNER_TOKEN → افتح مباشرة
      if (ownerFromUrl) {
        ACCESS = { ownerToken: ownerFromUrl.trim(), token: null, pin: null, userId: null };
        hideAccessCard();
        await loadOwnerSummary();
        return;
      }

      // 3) ?token=...&pin=... → افتح مباشرة
      if (tokenFromUrl && pinFromUrl) {
        ACCESS = { ownerToken: null, token: tokenFromUrl.trim(), pin: pinFromUrl.trim(), userId: null };
        hideAccessCard();
        await loadOwnerSummary();
        return;
      }

      // 4) ownerToken محفوظ مؤقتًا في الجلسة
      try {
        const cached = sessionStorage.getItem("friendmeter_owner_token");
        if (cached) {
          ACCESS = { ownerToken: cached, token: null, pin: null, userId: null };
          hideAccessCard();
          await loadOwnerSummary();
          return;
        }
      } catch {}

      // 5) لا شيء → أعرض بطاقة الوصول
      showAccessCard({});
    } catch (error) {
      console.error("خطأ في التهيئة:", error);
      setError("حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.");
      showAccessCard({});
    } finally {
      // إظهار الصفحة بعد التحميل
      document.body.style.opacity = "1";
    }
  })();

  // =========================
  // تحسينات إضافية لتجربة المستخدم
  // =========================
  
  // إضافة تأثيرات التحميل للأزرار
  function addButtonLoadingEffect(button, originalText) {
    if (!button) return;
    
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 8px;">
        <span class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></span>
        ${originalText}
      </span>
    `;
    
    return () => {
      button.disabled = false;
      button.innerHTML = originalContent;
    };
  }
  
  // تحسين رسائل الخطأ
  function showErrorWithAnimation(element, message) {
    if (!element) return;
    
    element.textContent = message;
    element.style.display = "block";
    element.style.animation = "none";
    element.offsetHeight; // trigger reflow
    element.style.animation = "shake 0.5s ease-in-out";
    
    // إزالة التأثير بعد انتهاء الرسوم المتحركة
    setTimeout(() => {
      element.style.animation = "";
    }, 500);
  }
  
  // معالجة الأخطاء المحسنة
  window.addEventListener('unhandledrejection', (event) => {
    console.error('خطأ غير مُعالج:', event.reason);
    setError("حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
    event.preventDefault();
  });
  
  // تحديث آخر نشاط للمستخدم
  let lastActivity = Date.now();
  
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
      lastActivity = Date.now();
    });
  });
  
  // فحص الاتصال والتحديث التلقائي (اختياري)
  function checkConnectionAndUpdate() {
    if (ACCESS.ownerToken || (ACCESS.token && ACCESS.pin)) {
      const timeSinceLastActivity = Date.now() - lastActivity;
      // إعادة تحميل البيانات كل 5 دقائق إذا كان المستخدم نشطًا
      if (timeSinceLastActivity < 300000) { // 5 minutes
        loadOwnerSummary().catch(() => {
          // فشل صامت في التحديث التلقائي
        });
      }
    }
  }
  
  // تحديث تلقائي كل 5 دقائق (اختياري)
  setInterval(checkConnectionAndUpdate, 300000);
})();