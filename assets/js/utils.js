/* assets/js/utils.js
 * أدوات مساعدة عامة لـ QB-Liora
 * ملاحظة: كل الدوال متاحة عبر الكائن العالمي FM.*
 */

"use strict";

(function (global) {
  if (global.FM) return; // لا تُعرّف مرتين
  const FM = {};

  // =========================
  // أساسيّات DOM
  // =========================
  FM.qs  = (sel, root = document) => root.querySelector(sel);
  FM.qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  FM.on  = (el, evt, fn, opts) => el && el.addEventListener(evt, fn, opts);
  FM.off = (el, evt, fn, opts) => el && el.removeEventListener(evt, fn, opts);

  // تفويض أحداث بسيط
  FM.delegate = (root, evt, selector, handler) => {
    if (!root) return;
    root.addEventListener(evt, (e) => {
      const t = e.target.closest(selector);
      if (t && root.contains(t)) handler(e, t);
    });
  };

  // =========================
  // URL / بارامترات
  // =========================
  FM.getParam = (name, urlStr) => {
    try {
      const u = new URL(urlStr || location.href);
      return u.searchParams.get(name);
    } catch {
      return null;
    }
  };

  // =========================
  // أرقام ونِسَب
  // =========================
  FM.clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  FM.pct   = (num, den) => den ? Math.round((Number(num) / Number(den)) * 100) : 0;

  // مولّد أرقام عشوائية بسيط (اختياري بذرة ثابتة)
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // خلط مصفوفة (Fisher–Yates)
  FM.shuffle = (arr, seed) => {
    const a = Array.from(arr || []);
    const rnd = (typeof seed === "number") ? mulberry32(seed) : Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor((typeof seed === "number" ? rnd() : rnd) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // =========================
  // تخزين محلي
  // =========================
  FM.saveLS = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  FM.loadLS = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };

  FM.saveSS = (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  FM.loadSS = (key, fallback = null) => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };

  // =========================
  // نسخ إلى الحافظة
  // =========================
  FM.copy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      return true;
    } catch {
      // بديل قديم
      try {
        const ta = document.createElement("textarea");
        ta.value = String(text || "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  // =========================
  // تنسيقات عامة
  // =========================
  FM.formatTime = (ms) => {
    ms = Math.max(0, Number(ms) || 0);
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  FM.uuid = () => {
    if (crypto?.randomUUID) return crypto.randomUUID();
    // fallback بسيط
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // =========================
  // أدوات واجهة صغيرة
  // =========================
  FM.toast = (msg, opts = {}) => {
    try {
      const div = document.createElement("div");
      div.textContent = String(msg || "");
      div.style.position = "fixed";
      div.style.zIndex = 9999;
      div.style.left = "50%";
      div.style.transform = "translateX(-50%)";
      div.style.bottom = "24px";
      div.style.background = "rgba(30,41,59,.95)";
      div.style.color = "#e5e7eb";
      div.style.padding = "10px 14px";
      div.style.border = "1px solid #263149";
      div.style.borderRadius = "12px";
      div.style.fontFamily = "system-ui,-apple-system,Segoe UI,Roboto";
      div.style.fontSize = "14px";
      div.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
      document.body.appendChild(div);
      const ttl = Number(opts.ttl || 1800);
      setTimeout(() => div.remove(), ttl);
    } catch {}
  };

  FM.assert = (cond, msg = "Assertion failed") => {
    if (!cond) throw new Error(msg);
  };

  // كشف اتجاه الصفحة (RTL/LTR)
  FM.isRTL = () => {
    const d = document?.documentElement;
    return (d?.dir || "").toLowerCase() === "rtl";
  };

  // تعرّف عالمي
  global.FM = FM;
})(window);
