/* assets/js/create.js - المحدث
 * إنشاء الاختبار – نسخة محسنة مع واجهة عصرية:
 *  - تفعيل/تعطيل الأسئلة الجاهزة + اختيار الإجابة الصحيحة لكل سؤال جاهز
 *  - أسئلة مخصّصة (نص + ٤ خيارات) مع اختيار الصحيح براديو 
 *  - لا توجد معاينة منفصلة – التجميع يتم مباشرة من هذه البطاقات
 *  - يدعم PIN اختياري للـ"اختبار" نفسه (ownerPIN) لحماية لوحة المالك عبر token+pin
 * يعتمد على post() من assets/js/api.js
 */

"use strict";

(function () {
  // =========================
  // بنك الأسئلة الجاهزة (يمكن تعديله)
  // =========================
  const BANK = [
    { text: "أطلب دايمًا؟", options: ["موكا بارد", "لاتيه", "شاي", "ميكس عصير"] },
    { text: "لو فيلم الليلة؟", options: ["أكشن", "كوميدي", "دراما", "وثائقي"] },
    { text: "لون التي-شيرت المفضل؟", options: ["أسود", "أبيض", "أزرق", "زيتوني"] },
    { text: "أكره حاجة في السوق؟", options: ["الزحمة", "الصف الطويل", "الأسعار", "الموسيقى"] },
    { text: "لو ضايقني واحد…؟", options: ["أتجاهله", "أضحكها", "أواجه", "بلوك"] },
    { text: "أصحى بدري؟", options: ["نادرًا", "أحيانًا", "غالبًا", "دائمًا"] },
    { text: "لو سفرة سريعة؟", options: ["شاليه", "جبل", "مدينة", "شاطئ"] },
    { text: "أكلتي المفضلة؟", options: ["برجر", "مشاوي", "باستا", "سوشي"] },
    { text: "لعبتي المفضلة؟", options: ["فيفا", "COD", "بوبجي", "فورتنايت"] },
    { text: "أفضل وقت للسواليف؟", options: ["الصبح", "العصر", "المغرب", "بعد منتصف الليل"] },
  ];

  // =========================
  // عناصر DOM
  // =========================
  const elOwnerName   = document.getElementById("ownerName");
  const elOwnerPIN    = document.getElementById("ownerPIN");

  const elDefaultList = document.getElementById("defaultList");
  const elEnabledCount= document.getElementById("enabledCount");
  const elEnableAll   = document.getElementById("enableAllBtn");
  const elDisableAll  = document.getElementById("disableAllBtn");

  const elCustomList  = document.getElementById("customList");
  const elAddCustom   = document.getElementById("addCustomBtn");

  const elCreateBtn   = document.getElementById("createBtn");
  const elLoading     = document.getElementById("loading");
  const elErr         = document.getElementById("err");

  const elShareBox    = document.getElementById("shareBox");
  const elShare       = document.getElementById("share");
  const elOwnerBox    = document.getElementById("ownerBox");
  const elOwnerLink   = document.getElementById("ownerLinkWrap");

  // قوالب
  const tplDefaultItem= document.getElementById("tplDefaultItem");
  const tplCustomItem = document.getElementById("tplCustomItem");

  // =========================
  // الحالة + التخزين
  // =========================
  const LS_KEY = "friendmeter_create_inline_v2";

  const state = {
    // الجاهزة
    defaultEnabled: BANK.map(() => true),   // مفعّل افتراضيًا
    defaultCorrect: BANK.map(() => 0),      // أول خيار افتراضيًا

    // المخصّصة
    customs: [] // [{id, text, options[4], correct:number}]
  };

  function uid() { return "c_" + Math.random().toString(36).slice(2, 10); }

  function loadFmUser() {
    try { return JSON.parse(localStorage.getItem("fm_user") || "null"); }
    catch { return null; }
  }

  function normalizeCustom(c) {
    const id = c?.id || uid();
    const text = (c?.text || "").trim();
    const options = Array.isArray(c?.options) ? c.options.slice(0,4) : ["","","",""];
    while (options.length < 4) options.push("");
    const correct = Number.isInteger(c?.correct) ? Math.max(0, Math.min(3, c.correct)) : 0;
    return { id, text, options, correct };
  }

  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        defaultEnabled: state.defaultEnabled,
        defaultCorrect: state.defaultCorrect,
        customs: state.customs,
        ownerName: elOwnerName?.value || ""
      }));
    } catch (error) {
      console.log("خطأ في حفظ الحالة:", error);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Array.isArray(s.defaultEnabled) && s.defaultEnabled.length === BANK.length) {
        state.defaultEnabled = s.defaultEnabled.slice();
      }
      if (Array.isArray(s.defaultCorrect) && s.defaultCorrect.length === BANK.length) {
        state.defaultCorrect = s.defaultCorrect.slice();
      }
      if (Array.isArray(s.customs)) {
        state.customs = s.customs.map(normalizeCustom);
      }
      if (elOwnerName && s.ownerName && !elOwnerName.value) {
        elOwnerName.value = s.ownerName;
      }
    } catch (error) {
      console.log("خطأ في تحميل الحالة:", error);
    }
  }

  // =========================
  // أدوات واجهة
  // =========================
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

  function setLoading(loading) {
    const btnIcon = elCreateBtn?.querySelector('.btn-icon');
    const btnText = elCreateBtn?.querySelector('.btn-text');
    const btnLoadingEl = elCreateBtn?.querySelector('.btn-loading');
    
    if (loading) {
      elCreateBtn?.setAttribute("disabled", "true");
      if (elLoading) elLoading.style.display = "flex";
      if (btnIcon) btnIcon.style.display = "none";
      if (btnText) btnText.textContent = "جارٍ الإنشاء...";
      if (btnLoadingEl) btnLoadingEl.style.display = "inline";
    } else {
      elCreateBtn?.removeAttribute("disabled");
      if (elLoading) elLoading.style.display = "none";
      if (btnIcon) btnIcon.style.display = "inline";
      if (btnText) btnText.textContent = "إنشاء الاختبار";
      if (btnLoadingEl) btnLoadingEl.style.display = "none";
    }
  }

  function updateEnabledBadge() {
    const count = state.defaultEnabled.filter(Boolean).length;
    if (elEnabledCount) {
      elEnabledCount.textContent = String(count);
      elEnabledCount.style.animation = "none";
      elEnabledCount.offsetHeight; // trigger reflow
      elEnabledCount.style.animation = "pulse 0.3s ease-out";
    }
  }

  // =========================
  // عرض قائمة الجاهزة (تفعيل + اختيار صحيح)
  // =========================
  function renderDefaultList() {
    if (!elDefaultList || !tplDefaultItem) return;
    elDefaultList.innerHTML = "";

    BANK.forEach((q, idx) => {
      const node = tplDefaultItem.content.firstElementChild.cloneNode(true);

      // نص السؤال
      const textEl = node.querySelector("[data-text]");
      if (textEl) {
        textEl.textContent = `${idx + 1}. ${q.text}`;
      }

      // شارات الخيارات
      const optsWrap = node.querySelector("[data-options]");
      if (optsWrap) {
        optsWrap.innerHTML = "";
        q.options.forEach(opt => {
          const chip = document.createElement("span");
          chip.className = "badge";
          chip.textContent = opt;
          optsWrap.appendChild(chip);
        });
      }

      // تفعيل/تعطيل
      const toggle = node.querySelector("[data-toggle]");
      if (toggle) {
        toggle.checked = !!state.defaultEnabled[idx];
        toggle.addEventListener("change", () => {
          state.defaultEnabled[idx] = !!toggle.checked;
          saveState();
          updateEnabledBadge();
          
          // تأثير بصري للبطاقة
          const card = node.closest('.question-card');
          if (card) {
            if (toggle.checked) {
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            } else {
              card.style.opacity = "0.6";
              card.style.transform = "translateY(2px)";
            }
          }
        });
        
        // تطبيق التأثير الأولي
        const card = node.closest('.question-card');
        if (card && !toggle.checked) {
          card.style.opacity = "0.6";
          card.style.transform = "translateY(2px)";
        }
      }

      // اختيار الإجابة الصحيحة
      const sel = node.querySelector("[data-correct]");
      if (sel) {
        sel.innerHTML = "";
        q.options.forEach((opt, i) => {
          const option = document.createElement("option");
          option.value = String(i);
          option.textContent = opt;
          sel.appendChild(option);
        });
        sel.value = String(state.defaultCorrect[idx] ?? 0);
        sel.addEventListener("change", () => {
          state.defaultCorrect[idx] = Number(sel.value);
          saveState();
        });
      }

      elDefaultList.appendChild(node);
    });

    updateEnabledBadge();
  }

  // =========================
  // إدارة الأسئلة المخصّصة
  // =========================
  function addCustom(initial) {
    state.customs.push(normalizeCustom(initial || { text: "", options: ["","","",""], correct: 0 }));
    saveState();
    renderCustomList();
    
    // التركيز على السؤال الجديد
    setTimeout(() => {
      const newQuestion = elCustomList?.lastElementChild?.querySelector('[data-qtext]');
      if (newQuestion) {
        newQuestion.focus();
        newQuestion.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

  function moveCustom(id, dir) {
    const i = state.customs.findIndex(c => c.id === id);
    if (i < 0) return;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= state.customs.length) return;
    
    // تأثير بصري للحركة
    const movingCard = document.querySelector(`[data-id="${id}"]`);
    if (movingCard) {
      movingCard.style.transform = "scale(0.95)";
      movingCard.style.transition = "transform 0.2s ease-out";
    }
    
    setTimeout(() => {
      const tmp = state.customs[i];
      state.customs[i] = state.customs[j];
      state.customs[j] = tmp;
      saveState();
      renderCustomList();
    }, 100);
  }

  function removeCustom(id) {
    const i = state.customs.findIndex(c => c.id === id);
    if (i < 0) return;
    
    // تأثير بصري للحذف
    const removingCard = document.querySelector(`[data-id="${id}"]`);
    if (removingCard) {
      removingCard.style.transform = "scale(0.8)";
      removingCard.style.opacity = "0";
      removingCard.style.transition = "all 0.3s ease-out";
    }
    
    setTimeout(() => {
      state.customs.splice(i, 1);
      saveState();
      renderCustomList();
    }, 300);
  }

  function bindCustomItemDOM(dom, c) {
    dom.dataset.customItem = "1";
    dom.dataset.id = c.id;

    // استبدال اسم مجموعة الراديو ليكون فريدًا
    dom.innerHTML = dom.innerHTML.replaceAll("correct-__ID__", `correct-${c.id}`);

    // نص السؤال
    const qInput = dom.querySelector('[data-qtext]');
    if (qInput) {
      qInput.value = c.text;
      qInput.addEventListener("input", () => {
        c.text = qInput.value;
        saveState();
      });
    }

    // الخيارات + الراديو
    const optInputs = Array.from(dom.querySelectorAll('[data-opt]'));
    const radios    = Array.from(dom.querySelectorAll('[data-correct]'));

    optInputs.forEach((inp, i) => {
      inp.value = c.options[i] ?? "";
      inp.addEventListener("input", () => {
        c.options[i] = inp.value;
        saveState();
      });
    });

    radios.forEach((r, i) => {
      r.checked = (c.correct === i);
      r.addEventListener("change", () => {
        if (r.checked) {
          c.correct = i;
          saveState();
        }
      });
    });

    // أزرار ترتيب/حذف
    const moveUpBtn = dom.querySelector('[data-move-up]');
    const moveDownBtn = dom.querySelector('[data-move-down]');
    const removeBtn = dom.querySelector('[data-remove]');
    
    if (moveUpBtn) {
      moveUpBtn.addEventListener("click", () => moveCustom(c.id, "up"));
    }
    if (moveDownBtn) {
      moveDownBtn.addEventListener("click", () => moveCustom(c.id, "down"));
    }
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        // تأكيد الحذف
        const confirmed = confirm("هل تريد حذف هذا السؤال؟");
        if (confirmed) {
          removeCustom(c.id);
        }
      });
    }
  }

  function renderCustomList() {
    if (!elCustomList || !tplCustomItem) return;
    elCustomList.innerHTML = "";
    
    if (state.customs.length === 0) {
      elCustomList.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-xl); text-align: center; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: var(--spacing-md); opacity: 0.7;">🎨</div>
          <p style="margin: 0;">لا توجد أسئلة مخصصة بعد</p>
          <small>أضف سؤالك الأول باستخدام الزر أعلاه</small>
        </div>
      `;
      return;
    }
    
    state.customs.forEach((c, index) => {
      const dom = tplCustomItem.content.firstElementChild.cloneNode(true);
      bindCustomItemDOM(dom, c);
      
      // إضافة رقم السؤال
      const badge = dom.querySelector('.question-badge span:last-child');
      if (badge) {
        badge.textContent = `سؤال مخصص ${index + 1}`;
      }
      
      // إخفاء أزرار الحركة حسب الموضع
      const moveUpBtn = dom.querySelector('[data-move-up]');
      const moveDownBtn = dom.querySelector('[data-move-down]');
      
      if (moveUpBtn && index === 0) {
        moveUpBtn.style.opacity = "0.3";
        moveUpBtn.disabled = true;
      }
      if (moveDownBtn && index === state.customs.length - 1) {
        moveDownBtn.style.opacity = "0.3";
        moveDownBtn.disabled = true;
      }
      
      elCustomList.appendChild(dom);
    });
  }

  // =========================
  // تجميع حمولة الأسئلة للإرسال
  // =========================
  function collectQuestionsForPayload() {
    const list = [];

    // 1) الجاهزة المفعّلة
    BANK.forEach((q, idx) => {
      if (!state.defaultEnabled[idx]) return;
      const correct = Math.max(0, Math.min(q.options.length - 1, Number(state.defaultCorrect[idx] || 0)));
      list.push({
        text: q.text,
        options: q.options.slice(),
        correct
      });
    });

    // 2) المخصّصة (تحقق من النص وعلى الأقل خيارين غير فارغين)
    state.customs.forEach((c) => {
      const text = (c.text || "").trim();
      const optsTrim = c.options.map(x => (x || "").trim());
      const validOptions = optsTrim.filter(t => !!t);
      if (!text || validOptions.length < 2) return; // تجاهل غير المكتمل

      // إعادة ترقيم الخيارات الصحيحة
      const nonEmptyIndices = optsTrim.map((t, i) => ({ text: t, originalIndex: i })).filter(item => !!item.text);
      const options = nonEmptyIndices.map(item => item.text);
      let correctNew = nonEmptyIndices.findIndex(item => item.originalIndex === c.correct);
      if (correctNew === -1) correctNew = 0;

      list.push({ text, options, correct: correctNew });
    });

    return list;
  }

  // =========================
  // إنشاء الاختبار
  // =========================
  function hideOutputs() {
    if (elShareBox) elShareBox.style.display = "none";
    if (elOwnerBox) elOwnerBox.style.display = "none";
    if (elShare) elShare.innerHTML = "";
    if (elOwnerLink) elOwnerLink.innerHTML = "";
  }

  async function handleCreate() {
    setError("");
    setLoading(true);
    hideOutputs();

    try {
      const ownerName = elOwnerName?.value?.trim() || "";
      const ownerPIN  = elOwnerPIN?.value?.trim() || ""; // PIN اختياري للاختبار
      const questions = collectQuestionsForPayload();

      if (!questions.length) {
        throw new Error("لم تحدد أي أسئلة صالحة. فعّل أسئلة جاهزة أو أضِف أسئلة مخصّصة مع خياراتها.");
      }

      // التحقق من الحد الأدنى والأقصى للأسئلة
      if (questions.length < 3) {
        throw new Error("يجب أن يحتوي الاختبار على 3 أسئلة على الأقل.");
      }
      
      if (questions.length > 20) {
        throw new Error("لا يمكن أن يتجاوز الاختبار 20 سؤال.");
      }

      const fmUser = loadFmUser();
      const payload = { ownerName, mode: "classic", questions };
      if (ownerPIN) payload.ownerPIN = ownerPIN;
      if (fmUser?.userId) payload.userId = fmUser.userId;

      const data = await post("createQuiz", payload);
      if (!data || !data.shareUrl || !data.ownerUrl) {
        throw new Error("استجابة غير متوقعة من الخادم.");
      }

      // عرض الروابط مع تأثير بصري
      if (elShare && elShareBox) {
        elShare.innerHTML = `<a href="${data.shareUrl}" target="_blank" rel="noopener">${data.shareUrl}</a>`;
        elShareBox.style.display = "block";
      }
      
      if (elOwnerLink && elOwnerBox) {
        elOwnerLink.innerHTML = `<a href="${data.ownerUrl}" target="_blank" rel="noopener">${data.ownerUrl}</a>`;
        elOwnerBox.style.display = "block";
        
        if (ownerPIN) {
          const hint = document.createElement("div");
          hint.className = "pin-notice";
          hint.innerHTML = `
            <div style="padding: var(--spacing-md); margin-top: var(--spacing-md); background: rgba(251, 133, 0, 0.1); border: 1px solid rgba(251, 133, 0, 0.2); border-radius: var(--border-radius-md); color: var(--warning-600);">
              <strong>🔒 تم تفعيل الحماية بـ PIN</strong><br>
              <small>لن تُفتح لوحة المالك عبر رمز المشاركة بدون هذا الرقم السري.</small>
            </div>
          `;
          elOwnerBox.appendChild(hint);
        }
      }

      // حفظ الحالة
      saveState();

      // إضافة تأثير نجح
      elCreateBtn.style.background = "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))";
      
      // سحب الصفحة للأسفل ناحية الروابط
      setTimeout(() => {
        elShareBox?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);

    } catch (err) {
      setError(err?.message || "تعذّر إنشاء الروابط. حاول لاحقًا.");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // أحداث عامة
  // =========================
  if (elEnableAll) {
    elEnableAll.addEventListener("click", () => {
      state.defaultEnabled = state.defaultEnabled.map(() => true);
      saveState();
      updateEnabledBadge();
      renderDefaultList();
      
      // تأثير بصري
      elEnableAll.style.transform = "scale(0.95)";
      setTimeout(() => {
        elEnableAll.style.transform = "scale(1)";
      }, 150);
    });
  }

  if (elDisableAll) {
    elDisableAll.addEventListener("click", () => {
      state.defaultEnabled = state.defaultEnabled.map(() => false);
      saveState();
      updateEnabledBadge();
      renderDefaultList();
      
      // تأثير بصري
      elDisableAll.style.transform = "scale(0.95)";
      setTimeout(() => {
        elDisableAll.style.transform = "scale(1)";
      }, 150);
    });
  }

  if (elAddCustom) {
    elAddCustom.addEventListener("click", () => {
      addCustom();
      
      // تأثير بصري
      elAddCustom.style.transform = "scale(0.95)";
      setTimeout(() => {
        elAddCustom.style.transform = "scale(1)";
      }, 150);
    });
  }

  if (elCreateBtn) {
    elCreateBtn.addEventListener("click", handleCreate);
  }

  if (elOwnerName) {
    elOwnerName.addEventListener("input", saveState);
  }

  // تقييد PIN للأرقام فقط
  if (elOwnerPIN) {
    elOwnerPIN.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });
    elOwnerPIN.addEventListener("change", saveState);
  }

  // معالجة Enter في حقول النموذج
  [elOwnerName, elOwnerPIN].forEach(el => {
    if (el) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (elCreateBtn && !elCreateBtn.disabled) {
            elCreateBtn.click();
          }
        }
      });
    }
  });

  // =========================
  // بداية التشغيل
  // =========================
  (function init() {
    // إضافة تأثير تحميل سلس
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease-in-out";
    
    try {
      // تهيئة الاسم من مستخدم محفوظ (إن وجد)
      const fmUser = loadFmUser();
      if (fmUser?.name && elOwnerName && !elOwnerName.value) {
        elOwnerName.value = fmUser.name;
      }

      // تحميل حالة سابقة
      loadState();

      // رسم القوائم
      renderDefaultList();
      renderCustomList();
      
    } catch (error) {
      console.error("خطأ في التهيئة:", error);
      setError("حدث خطأ أثناء تحميل الصفحة. يرجى تحديث الصفحة.");
    } finally {
      // إظهار الصفحة بعد التحميل
      document.body.style.opacity = "1";
    }
  })();

  // =========================
  // تحسينات إضافية
  // =========================
  
  // مراقبة تغييرات الحالة للتحديث التلقائي
  let saveTimeout;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 300);
  }

  // إضافة تأثيرات بصرية للأزرار
  function addButtonEffect(button) {
    if (!button) return;
    
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.98)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
  }

  // تطبيق التأثيرات على جميع الأزرار
  [elEnableAll, elDisableAll, elAddCustom, elCreateBtn].forEach(addButtonEffect);

  // معالجة الأخطاء العامة
  window.addEventListener('unhandledrejection', (event) => {
    console.error('خطأ غير مُعالج:', event.reason);
    setError('حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    event.preventDefault();
  });

  // إضافة كلاسات CSS للحركة السلسة
  const style = document.createElement('style');
  style.textContent = `
    .question-card {
      transition: all 0.3s ease-out;
    }
    
    .question-card:hover {
      transform: translateY(-2px) !important;
    }
    
    .empty-state {
      animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
      from { transform: scale(1); }
      50% { transform: scale(1.1); }
      to { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
})();