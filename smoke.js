/* Прибор замера смоука «ЛомУчёт» — узел И-16 «Металлолом», гипотеза
   «Учёт лома драгметаллов» (Г-12). Собран 18.08.2026, дело Д-15.

   Конструкция взята без изменений с эталона «Деталь-Аналог» (узел Э-4,
   дело Д-14, ход-012) — там она уже прошла проверку Ревизора по
   находкам Н-13, Н-16…Н-21. Меняется только предметная часть.

   METRIKA_ID — номер счётчика Яндекс.Метрики (Директ). "" = выключено.
   GA4_ID     — не используется: трафик из Яндекс.Директа.
   FORM_ID    — идентификатор Яндекс.Формы для встраивания.
   FORM_URL   — прямая ссылка на ту же форму (запаска под form_fallback).

   ЗАГЛУШКИ ГРОМКИЕ, А НЕ ТИХИЕ. Пусто METRIKA_ID — красная полоса вверху
   страницы; пусто FORM_ID — красная плашка на месте формы; пусто
   FORM_URL — полоса про неработающую запаску, и цель `form_fallback`
   НЕ отправляется. Причина: дефект 30.07.2026, когда номер счётчика
   стоял голым плейсхолдером и цели молча не работали.

   СШИВКА ИСТОЧНИКОВ. Числитель замера привязан к платному клику:
   Директ дописывает `yclid`, кампания несёт `utm_campaign=lom_uchet`;
   метки живут в sessionStorage весь визит, дописываются к адресу формы
   и попадают в ответ скрытыми полями.
   ИДЕНТИФИКАТОРЫ СКРЫТЫХ ВОПРОСОВ ФОРМЫ ОБЯЗАНЫ СОВПАДАТЬ С ИМЕНАМИ
   ИЗ MARK_KEYS БУКВА В БУКВУ.

   Цели:
     cta_click      клик по главной кнопке
     payment_click  клик по кнопке оплаты — намерение платить
     lead_submit    заявка отправлена; шлёт thanks.html
     form_fallback  клик по РАБОЧЕЙ запасной ссылке — диагностика
     pay_view       страница оплаты открыта
     pay_back       со страницы оплаты вернулись к форме

   Второго оффера у смоука НЕТ, страницы new.html в комплекте нет. */

var SMOKE = {
  METRIKA_ID: "111900530",        /* счётчик «ЛомУчёт (смоук ГИИС ДМДК)», заведён 18.08.2026 */
  GA4_ID: "",                     /* не используется: трафик из Яндекс.Директа */
  FORM_ID: "6a8c4a811f1eb5ba8ed7397e",   /* «Заявка — ЛомУчёт», копия от 18.08.2026 */
  FORM_URL: "https://forms.yandex.ru/u/6a8c4a811f1eb5ba8ed7397e/",
  MARK_KEYS: ["yclid", "utm_campaign", "utm_source", "utm_medium"],
  MARK_STORE: "smoke_marks_lom_uchet"
};

/* Красная полоса вверху страницы. Сигнал о сломанном приборе обязан быть
   виден тому, кто откроет опубликованную страницу глазами. */
function smokeAlarm(text) {
  function put() {
    if (!document.body) return;
    var d = document.createElement("div");
    d.setAttribute("role", "alert");
    d.style.cssText = "background:#b00020;color:#fff;padding:12px 16px;"
      + "font:600 15px/1.45 system-ui,-apple-system,Segoe UI,Arial,sans-serif;"
      + "text-align:center;letter-spacing:.01em";
    d.appendChild(document.createTextNode(text));
    document.body.insertBefore(d, document.body.firstChild);
  }
  if (document.body) { put(); } else { document.addEventListener("DOMContentLoaded", put); }
}

/* Служебные метки визита: из адреса, иначе из хранилища визита. */
function smokeMarks() {
  var out = {}, saved = {}, q = {}, i, k, v, parts, p;
  try { saved = JSON.parse(sessionStorage.getItem(SMOKE.MARK_STORE) || "{}") || {}; } catch (e) { saved = {}; }
  var s = (location.search || "").replace(/^\?/, "");
  if (s) {
    parts = s.split("&");
    for (i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      p = parts[i].split("=");
      if (!p[0]) continue;
      try {
        q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || "").replace(/\+/g, " "));
      } catch (e) { q[p[0]] = p[1] || ""; }
    }
  }
  for (i = 0; i < SMOKE.MARK_KEYS.length; i++) {
    k = SMOKE.MARK_KEYS[i];
    v = q[k] || saved[k] || "";
    if (v) { out[k] = v; }
  }
  try { sessionStorage.setItem(SMOKE.MARK_STORE, JSON.stringify(out)); } catch (e) {}
  return out;
}

function smokeMarkQuery() {
  var m = smokeMarks(), a = [], k;
  for (k in m) {
    if (Object.prototype.hasOwnProperty.call(m, k) && m[k]) {
      a.push(encodeURIComponent(k) + "=" + encodeURIComponent(m[k]));
    }
  }
  return a.join("&");
}

/* Метки не теряются при переходах внутри сайта (index → pay → index). */
function keepMarks() {
  var q = smokeMarkQuery();
  if (!q) return;
  var list = document.querySelectorAll("a[href]"), i, h, base, hash, pos;
  for (i = 0; i < list.length; i++) {
    h = list[i].getAttribute("href");
    if (!h || /^(https?:|mailto:|tel:|#|\/\/)/i.test(h)) continue;
    hash = ""; base = h; pos = h.indexOf("#");
    if (pos >= 0) { hash = h.slice(pos); base = h.slice(0, pos); }
    if (base.indexOf("yclid=") >= 0) continue;
    list[i].setAttribute("href", base + (base.indexOf("?") >= 0 ? "&" : "?") + q + hash);
  }
}

(function () {
  var on = false;
  if (SMOKE.METRIKA_ID) {
    on = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    try {
      ym(SMOKE.METRIKA_ID, "init", {
        clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true
      });
    } catch (e) { console.error("[smoke] Метрика не инициализировалась: " + e); }
  }
  if (SMOKE.GA4_ID) {
    on = true;
    var s = document.createElement("script");
    s.async = 1; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(SMOKE.GA4_ID);
    (document.head || document.documentElement).appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", SMOKE.GA4_ID);
  }
  if (!on) {
    console.error("[smoke] аналитика не подключена: визиты и цели НЕ собираются. "
      + "Впишите METRIKA_ID в smoke.js");
    smokeAlarm("ПРИБОР НЕ РАБОТАЕТ: счётчик Метрики не подключён, визиты и цели "
      + "не собираются. В smoke.js пусто поле METRIKA_ID.");
  }
})();

/* Единая точка отправки цели. Никогда не бросает исключение:
   сломанный счётчик не должен ломать сайт. */
function track(goal) {
  try { if (SMOKE.METRIKA_ID && window.ym) ym(SMOKE.METRIKA_ID, "reachGoal", goal); } catch (e) {}
  try { if (SMOKE.GA4_ID && window.gtag) gtag("event", goal); } catch (e) {}
  try { console.log("[smoke] цель: " + goal); } catch (e) {}
}

/* Приёмник заявок. Пока форма не заведена — громкая красная плашка,
   а не тихая пустота. */
function mountForm(nodeId) {
  var box = document.getElementById(nodeId);
  if (!box) return;
  if (!SMOKE.FORM_ID) {
    box.innerHTML = '<p class="warn">Форма приёма заявок не подключена: '
      + 'в <code>smoke.js</code> пусто поле <code>FORM_ID</code>. '
      + 'До подстановки идентификатора заявки НЕ принимаются и замер невозможен.</p>';
    console.error("[smoke] FORM_ID пуст: форма не встроена, заявки НЕ принимаются");
    smokeAlarm("ЗАЯВКИ НЕ ПРИНИМАЮТСЯ: форма не подключена, в smoke.js пусто поле FORM_ID.");
    return;
  }
  var s = document.createElement("script");
  s.src = "https://forms.yandex.ru/_static/embed.js";
  document.body.appendChild(s);
  var q = smokeMarkQuery();
  box.innerHTML = '<iframe src="https://forms.yandex.ru/u/' + SMOKE.FORM_ID + '?iframe=1'
    + (q ? '&' + q : '') + '" '
    + 'name="ya-form-' + SMOKE.FORM_ID + '" title="Заявка на подключение учёта лома драгметаллов" '
    + 'frameborder="0" style="border:0;display:block;width:100%;min-height:420px"></iframe>';
}

/* Запасная ссылка на форму. Цель шлётся ТОЛЬКО с рабочего адреса (Н-18). */
function mountFallback(linkId) {
  var a = document.getElementById(linkId);
  if (!a) return;
  if (!SMOKE.FORM_URL) {
    a.removeAttribute("href");
    a.removeAttribute("target");
    a.style.color = "#b00020";
    a.style.fontWeight = "600";
    while (a.firstChild) { a.removeChild(a.firstChild); }
    a.appendChild(document.createTextNode("запасная ссылка на форму не подключена"));
    console.error("[smoke] FORM_URL пуст: запасная ссылка не работает, цель form_fallback отключена");
    smokeAlarm("ЗАПАСКА НЕ РАБОТАЕТ: в smoke.js пусто поле FORM_URL.");
    return;
  }
  var q = smokeMarkQuery();
  var url = SMOKE.FORM_URL;
  if (q) { url += (url.indexOf("?") >= 0 ? "&" : "?") + q; }
  a.setAttribute("href", url);
  a.setAttribute("target", "_blank");
  a.setAttribute("rel", "noopener");
  a.addEventListener("click", function () { try { track("form_fallback"); } catch (e) {} });
}

