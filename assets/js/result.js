/* assets/js/result.js - المحدث
 * عرض نتيجة الاختبار المحسنة مع واجهة عصرية
 * يعتمد على:
 *  - بيانات محفوظة مؤقتًا في sessionStorage بالمفتاح: friendmeter_last_result
 *  - أو بارامترات الرابط: ?score=..&outOf=..&owner=..&token=..
 */

"use strict";

(function () {
  // عناصر DOM
  const elScoreValue      = document.getElementById("scoreValue");
  const elProgress        = document.getElementById("progress");
  const elProgressPercentage = document.getElementById("progressPercentage");
  const elVerdict         = document.getElementById("verdict");
  const elOwnerHint       = document.getElementById("ownerHint");
  const elErr             = document.getElementById("err");
  const elBreakdownCard   = document.getElementById("breakdownCard");
  const elBreakdownList   = document.getElementById("breakdownList");
  
  // عناصر الإحصائيات
  const elCorrectCount    = document.getElementById("correctCount");
  const elTotalQuestions  = document.getElementById("totalQuestions");
  const elAccuracyRate    = document.getElementById("accuracyRate");
  const elLevelName       = document.getElementById("levelName");

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
      if (elErr.scrollIntoView) {
        elErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function toPct(score, outOf) {
    if (!outOf || outOf <= 0) return 0;
    const p = Math.round((Number(score) / Number(outOf)) * 100);
    return Math.max(0, Math.min(100, p));
  }

  function getVerdictInfo(pct) {
    if (pct >= 90) return { text: "خبير متمكن! 🏆", level: "استثنائي", color: "#ffd700" };
    if (pct >= 80) return { text: "معرفة ممتازة! 🌟", level: "ممتاز", color: "var(--accent-primary)" };
    if (pct >= 70) return { text: "صداقة قوية! ⭐", level: "جيد جداً", color: "var(--accent-secondary)" };
    if (pct >= 60) return { text: "معرفة جيدة! 👍", level: "جيد", color: "var(--primary-500)" };
    if (pct >= 50) return { text: "بداية جيدة! 👌", level: "متوسط", color: "var(--warning-500)" };
    if (pct >= 30) return { text: "يحتاج تحسين! 🤔", level: "أساسي", color: "var(--warning-600)" };
    return { text: "ابدأ التعلم! 💪", level: "مبتدئ", color: "var(--danger-500)" };
  }

  function fromSession() {
    try {
      const raw = sessionStorage.getItem("friendmeter_last_result");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function animateCounter(element, targetValue, duration, suffix) {
    if (!element || typeof targetValue !== 'number') return;
    
    duration = duration || 1000;
    suffix = suffix || "";
    
    const startValue = 0;
    const startTime = Date.now();
    
    function updateCounter() {
      try {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
        
        element.textContent = currentValue + suffix;
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      } catch (error) {
        console.error('خطأ في تحديث العداد:', error);
      }
    }
    
    requestAnimationFrame(updateCounter);
  }

  function animateProgressBar(element, targetPercentage, duration) {
    if (!element || typeof targetPercentage !== 'number') return;
    
    duration = duration || 2000;
    const startTime = Date.now();
    
    function updateProgress() {
      try {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentPercentage = targetPercentage * easeOutCubic;
        
        element.style.width = currentPercentage + "%";
        
        if (progress < 1) {
          requestAnimationFrame(updateProgress);
        }
      } catch (error) {
        console.error('خطأ في تحديث شريط التقدم:', error);
      }
    }
    
    requestAnimationFrame(updateProgress);
  }

  function createCelebrationEffect() {
    try {
      const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const particlesContainer = document.querySelector('.celebration-particles');
      
      if (!particlesContainer) return;
      
      for (let i = 0; i < 20; i++) {
        setTimeout(function() {
          try {
            const particle = document.createElement('div');
            particle.style.cssText = 
              'position: absolute;' +
              'width: 6px;' +
              'height: 6px;' +
              'background: ' + colors[Math.floor(Math.random() * colors.length)] + ';' +
              'top: 50%;' +
              'left: 50%;' +
              'border-radius: 50%;' +
              'pointer-events: none;' +
              'animation: particleExplosion 2s ease-out forwards;';
            
            const angle = (i / 20) * 2 * Math.PI;
            const distance = 80 + Math.random() * 40;
            
            particle.style.setProperty('--angle', angle + 'rad');
            particle.style.setProperty('--distance', distance + 'px');
            
            particlesContainer.appendChild(particle);
            
            setTimeout(function() {
              if (particle && particle.parentNode) {
                particle.remove();
              }
            }, 2000);
          } catch (error) {
            console.error('خطأ في إنشاء جسيم:', error);
          }
        }, i * 50);
      }
    } catch (error) {
      console.error('خطأ في تأثير الاحتفال:', error);
    }
  }

  function renderBreakdown(items, ownerName) {
    if (!Array.isArray(items) || !items.length || !elBreakdownCard || !elBreakdownList) return;
    
    try {
      elBreakdownList.innerHTML = items
        .map(function(it, index) {
          const isCorrect = Boolean(it.isMatch);
          const statusIcon = isCorrect ? "✅" : "❌";
          const title = (typeof it.qid !== "undefined")
            ? (Number(it.qid) + 1) + ". " + (it.text || "")
            : (it.text || ("السؤال " + (index + 1)));
          const expected = (typeof it.expected !== "undefined")
            ? (it.expectedLabel || it.expected || "—")
            : "—";
          const choice = (typeof it.choice !== "undefined")
            ? (it.choiceLabel || it.choice || "—")
            : "—";
          
          return (
            '<div class="breakdown-item ' + (isCorrect ? 'correct' : 'incorrect') + '" style="animation-delay: ' + (index * 0.1) + 's">' +
              '<div class="breakdown-header">' +
                '<span class="breakdown-status">' + statusIcon + '</span>' +
                '<div class="breakdown-question">' + title + '</div>' +
              '</div>' +
              '<div class="breakdown-answers">' +
                '<div class="answer-comparison">' +
                  '<div class="answer-item answer-expected">' +
                    '<strong>إجابة ' + (ownerName || "المالك") + ':</strong> ' + expected +
                  '</div>' +
                  '<div class="answer-item answer-choice ' + (isCorrect ? 'correct' : 'incorrect') + '">' +
                    '<strong>إجابتك:</strong> ' + choice +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        })
        .join("");
      
      elBreakdownCard.style.display = "block";
    } catch (error) {
      console.error('خطأ في عرض تفاصيل الإجابات:', error);
    }
  }

  function updateStatistics(data, pct) {
    try {
      const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
      const correctAnswers = breakdown.filter(function(item) { 
        return Boolean(item.isMatch); 
      }).length;
      const totalQuestions = breakdown.length || Math.ceil(Number(data.outOf || 0) / 10) || 1;
      const verdictInfo = getVerdictInfo(pct);
      
      // تحديث الأرقام مع الرسوم المتحركة
      if (elCorrectCount) {
        setTimeout(function() {
          animateCounter(elCorrectCount, correctAnswers);
        }, 300);
      }
      if (elTotalQuestions) {
        setTimeout(function() {
          animateCounter(elTotalQuestions, totalQuestions);
        }, 500);
      }
      if (elAccuracyRate) {
        setTimeout(function() {
          animateCounter(elAccuracyRate, pct, 1500, '%');
        }, 700);
      }
      if (elLevelName) {
        setTimeout(function() {
          elLevelName.textContent = verdictInfo.level;
          elLevelName.style.color = verdictInfo.color;
        }, 900);
      }
    } catch (error) {
      console.error('خطأ في تحديث الإحصائيات:', error);
    }
  }

  function render(data) {
    try {
      const score = Number(data.score || 0);
      const outOf = Number(data.outOf || 0);
      const ownerName = String(data.ownerName || "").trim();
      const pct = toPct(score, outOf);
      const verdictInfo = getVerdictInfo(pct);

      // تحديث العنوان
      if (elOwnerHint) {
        elOwnerHint.textContent = ownerName 
          ? ("نتيجتك في اختبار " + ownerName)
          : "نتيجتك في اختبار صديقك";
      }

      // تحديث النتيجة مع الرسوم المتحركة
      if (elScoreValue) {
        setTimeout(function() {
          elScoreValue.textContent = score + " / " + outOf;
        }, 200);
      }

      // تحديث شريط التقدم
      if (elProgress) {
        setTimeout(function() {
          animateProgressBar(elProgress, pct);
        }, 400);
      }
      
      if (elProgressPercentage) {
        setTimeout(function() {
          animateCounter(elProgressPercentage, pct, 2000, '%');
        }, 400);
      }

      // تحديث الحكم
      if (elVerdict) {
        setTimeout(function() {
          elVerdict.textContent = verdictInfo.text;
          elVerdict.style.color = verdictInfo.color;
        }, 1000);
      }

      // تحديث الإحصائيات
      updateStatistics(data, pct);

      // إضافة تأثير احتفالي للنتائج العالية
      if (pct >= 70) {
        setTimeout(createCelebrationEffect, 1200);
      }

      // حفظ ملخص للاستخدام اللاحق
      try {
        sessionStorage.setItem(
          "friendmeter_last_result_summary",
          JSON.stringify({ 
            score: score, 
            outOf: outOf, 
            pct: pct, 
            ownerName: ownerName, 
            verdict: verdictInfo.text 
          })
        );
      } catch (storageError) {
        console.log('تعذر حفظ الملخص في التخزين المحلي:', storageError);
      }

      // عرض تفاصيل الأسئلة إن توفرت
      renderBreakdown(data.breakdown, ownerName);

    } catch (error) {
      console.error("خطأ في عرض النتائج:", error);
      setError("حدث خطأ في عرض النتائج.");
    }
  }

  function init() {
    // إضافة تأثير تحميل سلس
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease-in-out";
    
    try {
      setError("");

      // تفضيل: القراءة من sessionStorage
      let data = fromSession();

      // بديل: من بارامترات الرابط
      if (!data) {
        const score = getParam("score");
        const outOf = getParam("outOf");
        const owner = getParam("owner") || getParam("ownerName");
        const token = getParam("token");
        
        if (score && outOf) {
          data = {
            score: Number(score),
            outOf: Number(outOf),
            ownerName: owner || "",
            token: token
          };
        }
      }

      if (!data || typeof data.score === "undefined" || typeof data.outOf === "undefined") {
        setError("لا توجد بيانات لعرض النتيجة. تأكد من إنهاء الاختبار بنجاح أولاً.");
        if (elOwnerHint) {
          elOwnerHint.textContent = "تعذر تحميل بيانات النتيجة";
        }
        return;
      }

      render(data);

    } catch (error) {
      console.error("خطأ في التهيئة:", error);
      setError("حدث خطأ أثناء تحميل صفحة النتائج. يرجى المحاولة مرة أخرى.");
    } finally {
      // إظهار الصفحة بعد التحميل
      document.body.style.opacity = "1";
    }
  }

  // إضافة تأثيرات CSS للحركات
  function addAnimationStyles() {
    try {
      const style = document.createElement('style');
      style.textContent = 
        '@keyframes particleExplosion {' +
          '0% {' +
            'transform: translate(-50%, -50%) scale(1);' +
            'opacity: 1;' +
          '}' +
          '100% {' +
            'transform: translate(' +
              'calc(-50% + cos(var(--angle)) * var(--distance)),' + 
              'calc(-50% + sin(var(--angle)) * var(--distance))' +
            ') scale(0);' +
            'opacity: 0;' +
          '}' +
        '}' +
        
        '.breakdown-item {' +
          'animation: slideInUp 0.5s ease-out;' +
          'animation-fill-mode: both;' +
        '}' +
        
        '@keyframes slideInUp {' +
          'from {' +
            'opacity: 0;' +
            'transform: translateY(30px);' +
          '}' +
          'to {' +
            'opacity: 1;' +
            'transform: translateY(0);' +
          '}' +
        '}' +
        
        '.stat-card {' +
          'animation: fadeInScale 0.6s ease-out;' +
          'animation-fill-mode: both;' +
        '}' +
        
        '@keyframes fadeInScale {' +
          'from {' +
            'opacity: 0;' +
            'transform: scale(0.8);' +
          '}' +
          'to {' +
            'opacity: 1;' +
            'transform: scale(1);' +
          '}' +
        '}' +
        
        '.action-btn {' +
          'animation: slideInUp 0.4s ease-out;' +
          'animation-fill-mode: both;' +
        '}' +
        
        '.action-btn:nth-child(2) { animation-delay: 0.1s; }' +
        '.action-btn:nth-child(3) { animation-delay: 0.2s; }' +
        
        '.stat-card:nth-child(2) { animation-delay: 0.1s; }' +
        '.stat-card:nth-child(3) { animation-delay: 0.2s; }' +
        '.stat-card:nth-child(4) { animation-delay: 0.3s; }';
      
      document.head.appendChild(style);
    } catch (error) {
      console.error('خطأ في إضافة الأنماط:', error);
    }
  }

  // معالجة الأخطاء العامة
  window.addEventListener('unhandledrejection', function(event) {
    console.error('خطأ غير مُعالج:', event.reason);
    setError('حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    if (event.preventDefault) {
      event.preventDefault();
    }
  });

  // إضافة الأنماط
  addAnimationStyles();
  
  // بداية التشغيل
  init();
})();