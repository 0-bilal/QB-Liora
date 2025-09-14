/* assets/js/create.js - المحدث مع أنواع الأسئلة
 * إنشاء الاختبار – نسخة محسنة مع واجهة عصرية:
 *  - تفعيل/تعطيل الأسئلة الجاهزة + اختيار الإجابة الصحيحة لكل سؤال جاهز
 *  - ثلاثة أنواع من الأسئلة: عادية، متقدمة، احترافية
 *  - أسئلة مخصّصة (نص + ٤ خيارات) مع اختيار الصحيح براديو 
 *  - لا توجد معاينة منفصلة – التجميع يتم مباشرة من هذه البطاقات
 *  - يدعم PIN اختياري للـ"اختبار" نفسه (ownerPIN) لحماية لوحة المالك عبر token+pin
 * يعتمد على post() من assets/js/api.js
 */

"use strict";

(function () {
  // =========================
  // بنوك الأسئلة الجاهزة حسب النوع
  // =========================
  const QUESTION_BANKS = {
    basic: [
      { text: "نوع العصير المفضل عند صديقك؟", options: ["برتقال طازج", "فراولة حلوة", "مانجا لذيذة", "ليمون منعش"] },
      { text: "عادة غريبة يفعلها صديقك عند الجوع؟", options: ["صمت كامل", "سرعة أكل", "تذمر متكرر", "مزاح عشوائي"] },
      { text: "أكثر كلمة يكررها صديقك؟", options: ["يلا بسرعة", "تمام كذا", "أوكي خلاص", "لا مشكلة"] },
      { text: "أكثر مكان يفضّل صديقك الجلوس فيه؟", options: ["مقهى هادئ", "بيت مريح", "سفر بعيد", "بحر مفتوح"] },
      { text: "أكثر مشروب يطلبه صديقك دائمًا؟", options: ["قهوة سوداء", "شاي دافئ", "عصير بارد", "مياه"] },
      { text: "أكلة لا يستطيع صديقك مقاومتها؟", options: ["بيتزا ساخنة", "برجر كبير", "سلطة", "معكرونة لذيذة"] },
      { text: "أكثر وقت يظهر فيه نشاط صديقك؟", options: ["صباح باكر", "ظهر حار", "مساء هادئ", "ليل متأخر"] },
      { text: "ماذا يفضّل صديقك عند مشاهدة فيلم؟", options: ["أكشن مثير", "كوميديا خفيفة", "رعب مظلم", "دراما عاطفية"] },
      { text: "عادة يفعلها صديقك عندما يمل؟", options: ["نوم طويل", "أكل خفيف", "جوال مستمر", "خروج قصير"] },
      { text: "كلمة مناسبة لوصف صديقك بين أصحابه؟", options: ["هادي الطباع", "صاحب نكتة", "جاد", "متأخر دائمًا"] }
    ],
    
    advanced: [
      { text: "عندما يواجه صديقك ازدحامًا شديدًا، ماذا يكون التصرف؟", options: ["صبر وانتظار", "تذمر واضح", "انسحاب سريع", "التفاف"] },
      { text: "عندما يحدد صديقك موعدًا مهمًا، كيف يستعد؟", options: ["تنظيم دقيق", "استعجال متوتر", "تأجيل معتاد", "نسيان كامل"] },
      { text: "عندما يدخل صديقك مكانًا جديدًا، ما أول سلوك يظهر؟", options: ["مراقبة صامتة", "تحية سريعة", "جلوس فوري", "صمت طويل"] },
      { text: "عندما ينجح صديقك في مهمة، كيف يعبر؟", options: ["ابتسامة بسيطة", "مشاركة فورية", "صمت متواضع", "احتفال صاخب"] },
      { text: "عندما يخسر صديقك في منافسة، ماذا يفعل؟", options: ["انسحاب هادئ", "تحدي جديد", "تقبل", "مزاح خفيف"] },
      { text: "عندما يمر صديقك بيوم طويل، ماذا يختار في النهاية؟", options: ["راحة تامة", "خروج قصير", "حديث مطوّل", "عزلة هادئة"] },
      { text: "عندما يتأخر صديقك عن موعد، كيف يبرر الموقف؟", options: ["اعتذار صادق", "عذر بسيط", "مزاح خفيف", "تجاهل"] },
      { text: "عندما يلاحظ صديقك خطأً صغيرًا، ماذا يفعل؟", options: ["تنبيه مباشر", "تجاهل كامل", "إصلاح سريع", "سخرية لطيفة"] },
      { text: "عندما يُطلب من صديقك المساعدة، ما الموقف المعتاد؟", options: ["قبول مباشر", "تردد واضح", "رفض صريح", "تأجيل متكرر"] },
      { text: "عندما يقضي صديقك وقت فراغ، أي نشاط يختار؟", options: ["قراءة كتاب", "ألعاب إلكترونية", "خروج قصير", "موسيقى مفضلة"] }
    ],
    
    professional: [
      { text: "عندما يغضب صديقك، ماذا يكون رد فعله؟", options: ["صمت طويل", "نقاش مباشر", "انسحاب هادئ", "انفعال سريع"] },
      { text: "عندما يحتار صديقك في قرار مهم، كيف يتصرف؟", options: ["تحليل عميق", "اعتماد على الحدس", "استشارة سريعة", "تأجيل متكرر"] },
      { text: "عندما يبحث صديقك عن الراحة، أين يجدها؟", options: ["عزلة هادئة", "حديث مطوّل", "نشاط بدني", "موسيقى مفضلة"] },
      { text: "عندما يقلق صديقك، ما السبب الأغلب؟", options: ["خوف من المستقبل", "فشل في مهمة", "خسارة علاقة", "نظرة المجتمع"] },
      { text: "عندما يواجه صديقك موقفًا محرجًا، كيف يتعامل؟", options: ["تجاهل كامل", "مزاح خفيف", "انسحاب سريع", "اعتذار مباشر"] },
      { text: "عندما يستعد صديقك للنوم، بماذا ينشغل ذهنه؟", options: ["مراجعة اليوم", "تخيل المستقبل", "وضع خطط", "شرود ذهني"] },
      { text: "عندما يسمع صديقك نقدًا، كيف يكون رد فعله؟", options: ["إنكار تام", "تقبّل جزئي", "تحليل هادئ", "حساسية زائدة"] },
      { text: "عندما يحتاج صديقك دافعًا، ما الذي يحفزه أكثر؟", options: ["نجاح شخصي", "دعم قريب", "منافسة قوية", "هدف بعيد"] },
      { text: "عندما يتعرض صديقك لضغط نفسي، ماذا يختار؟", options: ["حديث مريح", "عزلة طويلة", "نشاط جسدي", "انشغال بالعمل"] },
      { text: "عندما يُعرَف صديقك بين الناس، بما يتميز أكثر؟", options: ["طريقة الكلام", "أسلوب اللباس", "ردود الأفعال", "الاهتمامات اليومية"] }
    ]
  };

  // وصفات لكل نوع من الأسئلة
  const TYPE_DESCRIPTIONS = {
    basic: "أسئلة خفيفة ومسلية عن العادات اليومية والمزاج، مين يعرف التفاصيل الصغيرة أكثر؟",
    advanced: "اختبر أنماط التصرف وردود الأفعال في المواقف المختلفة، كيف يبان السلوك الحقيقي؟",
    professional: "أسئلة تكشف طريقة التفكير والمشاعر العميقة، لتعرف الجانب الخفي من الشخصية."
  };

  // =========================
  // عناصر DOM
  // =========================
  const elOwnerName   = document.getElementById("ownerName");
  const elOwnerPIN    = document.getElementById("ownerPIN");

  // أزرار نوع الأسئلة
  const elTypeButtons = document.querySelectorAll('.type-btn');
  const elTypeDescription = document.getElementById("typeDescription");

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
  const LS_KEY = "friendmeter_create_inline_v3";

  const state = {
    // نوع الأسئلة الحالي
    currentType: 'basic',
    
    // الجاهزة لكل نوع
    defaultEnabled: {
      basic: [],
      advanced: [],
      professional: []
    },
    defaultCorrect: {
      basic: [],
      advanced: [],
      professional: []
    },

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

  // تهيئة البيانات الافتراضية لنوع معين
  function initializeTypeDefaults(type) {
    const bank = QUESTION_BANKS[type];
    if (!bank) return;
    
    if (!state.defaultEnabled[type] || state.defaultEnabled[type].length !== bank.length) {
      state.defaultEnabled[type] = bank.map(() => true);
    }
    if (!state.defaultCorrect[type] || state.defaultCorrect[type].length !== bank.length) {
      state.defaultCorrect[type] = bank.map(() => 0);
    }
  }

  // تهيئة جميع الأنواع
  function initializeAllTypes() {
    Object.keys(QUESTION_BANKS).forEach(type => {
      initializeTypeDefaults(type);
    });
  }

  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        currentType: state.currentType,
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
      
      // استعادة النوع الحالي
      if (s.currentType && QUESTION_BANKS[s.currentType]) {
        state.currentType = s.currentType;
      }
      
      // استعادة بيانات التفعيل والإجابات الصحيحة
      if (s.defaultEnabled && typeof s.defaultEnabled === 'object') {
        Object.keys(QUESTION_BANKS).forEach(type => {
          if (s.defaultEnabled[type] && Array.isArray(s.defaultEnabled[type])) {
            state.defaultEnabled[type] = s.defaultEnabled[type].slice();
          }
          if (s.defaultCorrect[type] && Array.isArray(s.defaultCorrect[type])) {
            state.defaultCorrect[type] = s.defaultCorrect[type].slice();
          }
        });
      }
      
      // استعادة الأسئلة المخصصة
      if (Array.isArray(s.customs)) {
        state.customs = s.customs.map(normalizeCustom);
      }
      
      // استعادة اسم المالك
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
    const currentBank = QUESTION_BANKS[state.currentType];
    if (!currentBank) return;
    
    const count = state.defaultEnabled[state.currentType].filter(Boolean).length;
    if (elEnabledCount) {
      elEnabledCount.textContent = String(count);
      elEnabledCount.style.animation = "none";
      elEnabledCount.offsetHeight; // trigger reflow
      elEnabledCount.style.animation = "pulse 0.3s ease-out";
    }
  }

  // =========================
  // إدارة أنواع الأسئلة
  // =========================
  function handleTypeSelection(type) {
    if (!QUESTION_BANKS[type]) return;
    
    state.currentType = type;
    
    // تحديث أزرار النوع
    elTypeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    // تحديث الوصف
    if (elTypeDescription) {
      elTypeDescription.textContent = TYPE_DESCRIPTIONS[type];
    }
    
    // تهيئة البيانات الافتراضية للنوع الجديد
    initializeTypeDefaults(type);
    
    // إعادة رسم قائمة الأسئلة
    renderDefaultList();
    
    // حفظ الحالة
    saveState();
  }

  // =========================
  // عرض قائمة الجاهزة (تفعيل + اختيار صحيح)
  // =========================
  function renderDefaultList() {
    if (!elDefaultList || !tplDefaultItem) return;
    
    const currentBank = QUESTION_BANKS[state.currentType];
    if (!currentBank) return;
    
    elDefaultList.innerHTML = "";

    currentBank.forEach((q, idx) => {
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
        toggle.checked = !!state.defaultEnabled[state.currentType][idx];
        toggle.addEventListener("change", () => {
          state.defaultEnabled[state.currentType][idx] = !!toggle.checked;
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
        sel.value = String(state.defaultCorrect[state.currentType][idx] ?? 0);
        sel.addEventListener("change", () => {
          state.defaultCorrect[state.currentType][idx] = Number(sel.value);
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

    // 1) الجاهزة المفعّلة من جميع الأنواع
    Object.keys(QUESTION_BANKS).forEach(type => {
      const bank = QUESTION_BANKS[type];
      bank.forEach((q, idx) => {
        if (!state.defaultEnabled[type] || !state.defaultEnabled[type][idx]) return;
        const correct = Math.max(0, Math.min(q.options.length - 1, Number(state.defaultCorrect[type][idx] || 0)));
        list.push({
          text: q.text,
          options: q.options.slice(),
          correct,
          type: type // إضافة نوع السؤال للمرجع
        });
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

      list.push({ 
        text, 
        options, 
        correct: correctNew,
        type: 'custom'
      });
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
      const payload = { 
        ownerName, 
        mode: "classic", 
        questions,
        questionType: state.currentType // إضافة نوع الأسئلة الحالي
      };
      if (ownerPIN) payload.ownerPIN = ownerPIN;
      if (fmUser?.userId) payload.userId = fmUser.userId;

      // محاكاة استدعاء API (في التطبيق الحقيقي استخدم post() من api.js)
      const data = await simulateApiCall(payload);
      
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
      if (elCreateBtn) {
        elCreateBtn.style.background = "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))";
      }
      
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

  // محاكاة استدعاء API
  async function simulateApiCall(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const quizId = Math.random().toString(36).substr(2, 9);
        resolve({
          shareUrl: `https://example.com/quiz/play?id=${quizId}`,
          ownerUrl: `https://example.com/quiz/owner?id=${quizId}&token=${Math.random().toString(36).substr(2, 12)}`
        });
      }, 2000);
    });
  }

  // =========================
  // أحداث عامة
  // =========================
  
  // معالجة أزرار نوع الأسئلة
  elTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (type && QUESTION_BANKS[type]) {
        handleTypeSelection(type);
      }
    });
  });

  if (elEnableAll) {
    elEnableAll.addEventListener("click", () => {
      const currentBank = QUESTION_BANKS[state.currentType];
      if (currentBank) {
        state.defaultEnabled[state.currentType] = currentBank.map(() => true);
        saveState();
        updateEnabledBadge();
        renderDefaultList();
        
        // تأثير بصري
        elEnableAll.style.transform = "scale(0.95)";
        setTimeout(() => {
          elEnableAll.style.transform = "scale(1)";
        }, 150);
      }
    });
  }

  if (elDisableAll) {
    elDisableAll.addEventListener("click", () => {
      const currentBank = QUESTION_BANKS[state.currentType];
      if (currentBank) {
        state.defaultEnabled[state.currentType] = currentBank.map(() => false);
        saveState();
        updateEnabledBadge();
        renderDefaultList();
        
        // تأثير بصري
        elDisableAll.style.transform = "scale(0.95)";
        setTimeout(() => {
          elDisableAll.style.transform = "scale(1)";
        }, 150);
      }
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
  // وظائف النسخ
  // =========================
  function setupCopyButton(buttonId, linkSelector) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    button.addEventListener('click', async () => {
      const linkElement = document.querySelector(linkSelector);
      if (!linkElement) return;
      
      const originalContent = button.innerHTML;
      try {
        await navigator.clipboard.writeText(linkElement.href);
        button.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">تم النسخ</span>';
        button.classList.add('success');
        
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.classList.remove('success');
        }, 2000);
      } catch (error) {
        button.innerHTML = '<span class="copy-icon">❌</span><span class="copy-text">فشل النسخ</span>';
        button.classList.add('error');
        
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.classList.remove('error');
        }, 2000);
      }
    });
  }

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

      // تهيئة جميع أنواع الأسئلة
      initializeAllTypes();

      // تحميل حالة سابقة
      loadState();

      // تفعيل النوع الحالي في الواجهة
      elTypeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === state.currentType);
      });
      
      // تحديث وصف النوع
      if (elTypeDescription) {
        elTypeDescription.textContent = TYPE_DESCRIPTIONS[state.currentType];
      }

      // رسم القوائم
      renderDefaultList();
      renderCustomList();
      
      // إعداد أزرار النسخ
      setupCopyButton('copyBtn', '#share a');
      setupCopyButton('copyOwnerBtn', '#ownerLinkWrap a');
      
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
  [elEnableAll, elDisableAll, elAddCustom, elCreateBtn, ...elTypeButtons].forEach(addButtonEffect);

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
    
    .type-btn {
      transition: all 0.3s ease-out;
    }
    
    .type-btn:hover {
      transform: translateY(-2px);
    }
    
    .type-btn.active {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);

  // عرض نوع الأسئلة الحالي في وحدة التحكم للمطورين
  console.log(`✨ QB-Liora Quiz Creator تم تحميله بنجاح`);
  console.log(`📋 نوع الأسئلة الحالي: ${state.currentType}`);
  console.log(`🎯 عدد الأسئلة المتاحة: ${Object.keys(QUESTION_BANKS).map(type => `${type}: ${QUESTION_BANKS[type].length}`).join(', ')}`);
})();