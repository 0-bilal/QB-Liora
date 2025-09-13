/* assets/js/play.js - المحدث
 * عرض أسئلة الاختبار وإرسال الإجابات مع واجهة محسنة
 * يعتمد على post() من assets/js/api.js
 */

"use strict";

(function () {
  // عناصر DOM
  const elTitle         = document.getElementById("title");
  const elSubtitle      = document.getElementById("subtitle");
  const elQuestions     = document.getElementById("questions");
  const elQuestionsSection = document.getElementById("questionsSection");
  const elPlayerName    = document.getElementById("playerName");
  const elSubmit        = document.getElementById("submitBtn");
  const elLoading       = document.getElementById("loading");
  const elActionsSection = document.getElementById("actionsSection");
  const elResultCard    = document.getElementById("resultCard");
  const elResult        = document.getElementById("result");
  const elScorePercentage = document.getElementById("scorePercentage");
  const elScoreLevel    = document.getElementById("scoreLevel");
  const elEncouragement = document.getElementById("encouragementText");
  const elProgressSection = document.getElementById("progressSection");
  const elProgressCount = document.getElementById("progressCount");
  const elProgressFill  = document.getElementById("progressFill");
  const elErr           = document.getElementById("err");

  // حالة عامة
  let QUIZ = null;
  let selectedAnswers = new Map(); // qid -> choice index

  // أدوات مساعدة
  function getParam(name) {
    try {
      const u = new URL(location.href);
      return u.searchParams.get(name);
    } catch {
      return null;
    }
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

  function setLoading(loading) {
    const btnIcon = elSubmit?.querySelector('.btn-icon');
    const btnText = elSubmit?.querySelector('.btn-text');
    const btnLoadingEl = elSubmit?.querySelector('.btn-loading');
    
    if (loading) {
      elSubmit?.setAttribute("disabled", "true");
      if (elLoading) elLoading.style.display = "flex";
      if (btnIcon) btnIcon.style.display = "none";
      if (btnText) btnText.textContent = "جارٍ الحساب...";
      if (btnLoadingEl) btnLoadingEl.style.display = "inline";
    } else {
      elSubmit?.removeAttribute("disabled");
      if (elLoading) elLoading.style.display = "none";
      if (btnIcon) btnIcon.style.display = "inline";
      if (btnText) btnText.textContent = "إرسال الإجابات";
      if (btnLoadingEl) btnLoadingEl.style.display = "none";
    }
  }

  function updateProgress() {
    if (!QUIZ || !elProgressCount || !elProgressFill) return;
    
    const totalQuestions = QUIZ.questions.length;
    const answeredQuestions = selectedAnswers.size;
    const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    elProgressCount.textContent = `${answeredQuestions} / ${totalQuestions}`;
    elProgressFill.style.width = `${percentage}%`;
    
    // تفعيل زر الإرسال عند الإجابة على جميع الأسئلة
    if (elSubmit) {
      if (answeredQuestions === totalQuestions && totalQuestions > 0) {
        elSubmit.removeAttribute("disabled");
        elSubmit.classList.add("ready");
      } else {
        elSubmit.setAttribute("disabled", "true");
        elSubmit.classList.remove("ready");
      }
    }
  }

  function getScoreLevel(percentage) {
    if (percentage >= 90) return { icon: "🏆", text: "خبير متمكن", color: "gold" };
    if (percentage >= 80) return { icon: "🌟", text: "معرفة ممتازة", color: "var(--accent-primary)" };
    if (percentage >= 70) return { icon: "⭐", text: "معرفة جيدة جداً", color: "var(--accent-secondary)" };
    if (percentage >= 60) return { icon: "👍", text: "معرفة جيدة", color: "var(--primary-500)" };
    if (percentage >= 50) return { icon: "👌", text: "معرفة متوسطة", color: "var(--warning-500)" };
    if (percentage >= 30) return { icon: "🤔", text: "معرفة أساسية", color: "var(--warning-600)" };
    return { icon: "💪", text: "ابدأ التعلم", color: "var(--danger-500)" };
  }

  function getEncouragementText(percentage) {
    if (percentage >= 90) return "مذهل! أنت تعرف صديقك بشكل استثنائي. الصداقة الحقيقية واضحة!";
    if (percentage >= 80) return "رائع جداً! معرفة ممتازة بصديقك. استمروا في التواصل!";
    if (percentage >= 70) return "أحسنت! تعرف صديقك جيداً. علاقة صداقة قوية!";
    if (percentage >= 60) return "جيد جداً! هناك تفاهم واضح بينكما. استمرا في قضاء الوقت معاً!";
    if (percentage >= 50) return "لا بأس! تحتاجان لقضاء مزيد من الوقت والتحدث أكثر.";
    if (percentage >= 30) return "بداية جيدة! اسألا بعضكما المزيد من الأسئلة لتعرّفا على بعض أكثر.";
    return "لا تقلق! كل صداقة تحتاج وقت لتنمو. استمرا في التعرف على بعض!";
  }

  function renderQuestion(q, index) {
    const qid = Number(q.qid);
    const questionNumber = index + 1;
    
    const optionsHtml = (q.options || [])
      .map((opt, idx) => {
        const isSelected = selectedAnswers.get(qid) === idx;
        return `
          <label class="option-item ${isSelected ? 'selected' : ''}" data-qid="${qid}" data-choice="${idx}">
            <input type="radio" name="question_${qid}" value="${idx}" ${isSelected ? 'checked' : ''} />
            <span class="option-radio"></span>
            <span class="option-text">${opt}</span>
          </label>
        `;
      })
      .join("");

    return `
      <div class="question-card" style="animation-delay: ${index * 0.1}s">
        <div class="question-number">${questionNumber}</div>
        <div class="question-text">${q.text}</div>
        <div class="question-options" data-qid="${qid}">
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  function renderQuiz(data) {
    try {
      // عنوان
      const name = (data.ownerName || "").trim();
      if (name) {
        elTitle.textContent = `اختبار ${name}`;
        elSubtitle.textContent = `أجب عن ${data.questions.length} سؤالاً واكتشف مدى معرفتك بـ${name}`;
      } else {
        elTitle.textContent = "اختبار صديقك";
        elSubtitle.textContent = `أجب عن ${data.questions.length} سؤالاً واكتشف مدى معرفتك بصديقك`;
      }

      // الأسئلة
      if (elQuestions) {
        elQuestions.innerHTML = data.questions.map((q, index) => renderQuestion(q, index)).join("");
      }

      // إظهار الأقسام
      if (elQuestionsSection) {
        elQuestionsSection.style.display = "block";
        elQuestionsSection.style.animation = "slideUp 0.6s ease-out";
      }
      if (elActionsSection) {
        elActionsSection.style.display = "block";
        elActionsSection.style.animation = "slideUp 0.8s ease-out";
      }
      if (elProgressSection) {
        elProgressSection.style.display = "block";
      }

      // ربط أحداث الخيارات
      bindOptionEvents();
      
      // تحديث التقدم
      updateProgress();

    } catch (error) {
      console.error("خطأ في عرض الاختبار:", error);
      setError("حدث خطأ في عرض الاختبار.");
    }
  }

  function bindOptionEvents() {
    if (!elQuestions) return;
    
    const optionItems = elQuestions.querySelectorAll('.option-item');
    optionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        const qid = Number(item.dataset.qid);
        const choice = Number(item.dataset.choice);
        
        // إزالة التحديد من الخيارات الأخرى في نفس السؤال
        const questionOptions = elQuestions.querySelectorAll(`[data-qid="${qid}"]`);
        questionOptions.forEach(opt => {
          opt.classList.remove('selected');
          const radio = opt.querySelector('input[type="radio"]');
          if (radio) radio.checked = false;
        });
        
        // تحديد الخيار الحالي
        item.classList.add('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        
        // حفظ الإجابة
        selectedAnswers.set(qid, choice);
        
        // تحديث التقدم
        updateProgress();
        
        // تأثير بصري
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
          item.style.transform = 'scale(1)';
        }, 150);
      });
      
      // إضافة تأثيرات لوحة المفاتيح
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
      
      item.setAttribute('tabindex', '0');
    });
  }

  async function init() {
    // إضافة تأثير تحميل سلس
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease-in-out";
    
    try {
      setError("");

      const token = getParam("token");
      if (!token) {
        setError("رابط غير صالح: رمز الاختبار مفقود من الرابط.");
        elSubtitle.textContent = "تأكد من استخدام الرابط الصحيح المُرسل من صديقك.";
        return;
      }

      // تحديث العنوان لإظهار التحميل
      elSubtitle.textContent = "جارٍ تحميل الاختبار...";

      const data = await post("getQuiz", { token });
      if (!data || !Array.isArray(data.questions) || !data.questions.length) {
        setError("هذا الاختبار لا يحتوي على أسئلة أو غير متوفر.");
        elSubtitle.textContent = "تواصل مع صديقك للحصول على رابط جديد.";
        return;
      }

      QUIZ = data;
      renderQuiz(QUIZ);

    } catch (err) {
      console.error("خطأ في التهيئة:", err);
      setError(err?.message || "تعذّر تحميل الاختبار. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
      elSubtitle.textContent = "حدث خطأ أثناء التحميل.";
    } finally {
      // إظهار الصفحة بعد التحميل
      document.body.style.opacity = "1";
    }
  }

  async function handleSubmit() {
    try {
      setError("");
      setLoading(true);
      
      // إخفاء النتيجة السابقة
      if (elResultCard) elResultCard.style.display = "none";

      if (!QUIZ || !QUIZ.quizId) {
        throw new Error("الاختبار غير جاهز للإرسال.");
      }

      const playerName = elPlayerName?.value?.trim() || "";
      
      if (selectedAnswers.size !== QUIZ.questions.length) {
        throw new Error("يرجى الإجابة على جميع الأسئلة قبل الإرسال.");
      }

      // تحويل الإجابات إلى المصفوفة المطلوبة
      const answers = QUIZ.questions.map(q => ({
        qid: Number(q.qid),
        choice: selectedAnswers.get(Number(q.qid)) ?? 0
      }));

      const res = await post("submitQuiz", {
        quizId: QUIZ.quizId,
        playerName,
        answers,
      });

      // حساب النتائج
      const outOf = Number(res?.outOf ?? answers.length * 10);
      const score = Number(res?.score ?? 0);
      const percentage = outOf > 0 ? Math.round((score / outOf) * 100) : 0;
      
      // عرض النتيجة
      displayResults(score, outOf, percentage);

      // تعطيل إعادة الإرسال
      elSubmit?.setAttribute("disabled", "true");

    } catch (err) {
      console.error("خطأ في الإرسال:", err);
      setError(err?.message || "تعذّر إرسال الإجابات. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  function displayResults(score, outOf, percentage) {
    try {
      // تحديث النتيجة الأساسية
      if (elResult) {
        elResult.textContent = `نتيجتك: ${score} من ${outOf}`;
      }
      
      if (elScorePercentage) {
        elScorePercentage.textContent = `${percentage}%`;
      }

      // تحديث مستوى النتيجة
      const levelInfo = getScoreLevel(percentage);
      if (elScoreLevel) {
        const levelIcon = elScoreLevel.querySelector('.level-icon');
        const levelText = elScoreLevel.querySelector('.level-text');
        if (levelIcon) levelIcon.textContent = levelInfo.icon;
        if (levelText) {
          levelText.textContent = levelInfo.text;
          levelText.style.color = levelInfo.color;
        }
      }

      // تحديث نص التشجيع
      if (elEncouragement) {
        const encouragementText = getEncouragementText(percentage);
        elEncouragement.innerHTML = `<p>${encouragementText}</p>`;
      }

      // إظهار النتيجة مع تأثير
      if (elResultCard) {
        elResultCard.style.display = "block";
        elResultCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // تشغيل تأثير الاحتفال إذا كانت النتيجة عالية
      if (percentage >= 80) {
        createCelebrationEffect();
      }

    } catch (error) {
      console.error("خطأ في عرض النتائج:", error);
      setError("حدث خطأ في عرض النتائج.");
    }
  }

  function createCelebrationEffect() {
    // إنشاء تأثير احتفالي بسيط
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 8px;
          height: 8px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: 10%;
          left: ${Math.random() * 100}%;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1000;
          animation: confettiFall 3s ease-out forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
      }, i * 100);
    }
  }

  // ربط الأحداث
  if (elSubmit) {
    elSubmit.addEventListener("click", handleSubmit);
  }

  // تحسين تجربة الإدخال للاعب
  if (elPlayerName) {
    elPlayerName.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // التركيز على أول سؤال
        const firstOption = elQuestions?.querySelector('.option-item');
        if (firstOption) {
          firstOption.focus();
        }
      }
    });
  }

  // معالجة التنقل بلوحة المفاتيح
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && elSubmit && !elSubmit.disabled) {
      elSubmit.click();
    }
  });

  // معالجة الأخطاء العامة
  window.addEventListener('unhandledrejection', (event) => {
    console.error('خطأ غير مُعالج:', event.reason);
    setError('حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    event.preventDefault();
  });

  // إضافة الأنماط للتأثيرات
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confettiFall {
      0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
    
    .btn-submit.ready {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)) !important;
      box-shadow: var(--shadow-lg);
      animation: readyPulse 2s ease-in-out infinite;
    }
    
    @keyframes readyPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    
    .question-card {
      animation: slideInUp 0.5s ease-out;
      animation-fill-mode: both;
    }
    
    .option-item {
      transition: all 0.2s ease-out;
    }
    
    .option-item:hover {
      transform: translateX(-2px);
    }
    
    .option-item.selected {
      transform: translateX(-4px);
      box-shadow: var(--shadow-md);
    }
  `;
  document.head.appendChild(style);

  // بداية التشغيل
  init();
})();