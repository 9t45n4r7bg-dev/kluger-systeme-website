/*
  Terminbuchung: Calendly-Links hier eintragen.
  Ist ein Thema leer, wird "allgemein" verwendet.
  Ist auch "allgemein" leer, öffnen alle Buttons eine vorbereitete E-Mail.
*/
const BOOKING = {
  allgemein: "",
  "Neukundengewinnung": "",
  "Compliance-Automation": "",
  "Prozessautomatisierung": ""
};
const EMAIL = "kontakt@kluger-systeme.de";

(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Buchung ---------- */
  function urlFor(topic) {
    const base = (topic && BOOKING[topic]) || BOOKING.allgemein;
    if (base) {
      const u = new URL(base);
      if (topic && !BOOKING[topic]) u.searchParams.set("a1", topic);
      return { href: u.toString(), external: true };
    }
    const subject = "Erstgespräch" + (topic ? ": " + topic : "");
    const body = "Guten Tag Herr Kluger,\n\nich interessiere mich für ein Erstgespräch" +
      (topic ? " zum Thema " + topic : "") +
      ".\n\nUnternehmen:\nTelefon:\nPassende Zeiten:\n";
    return { href: "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body), external: false };
  }
  let external = false;
  document.querySelectorAll("[data-book]").forEach(function (link) {
    const t = urlFor(link.dataset.topic || "");
    link.href = t.href;
    if (t.external) { link.target = "_blank"; link.rel = "noopener"; external = true; }
  });
  const note = document.querySelector("[data-book-note]");
  if (note && external) {
    note.innerHTML = "30 Minuten, unverbindlich. Die Terminwahl öffnet Calendly in einem neuen Tab. Oder direkt an <a href=\"mailto:" + EMAIL + "\">" + EMAIL + "</a>";
  }

  /* ---------- Pille: Menü auf schmalen Bildschirmen ---------- */
  const menu = document.querySelector("[data-pill-menu]");
  const links = document.querySelector("[data-pill-links]");
  if (menu && links) {
    const close = function () { links.classList.remove("is-open"); menu.setAttribute("aria-expanded", "false"); };
    menu.addEventListener("click", function () {
      const open = links.classList.toggle("is-open");
      menu.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("is-open")) { close(); menu.focus(); } });
    document.addEventListener("click", function (e) { if (!e.target.closest("[data-pill]")) close(); });
  }


  function onVisible(el, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { cb(en.isIntersecting); });
    }, opts || { threshold: 0 }).observe(el);
  }

  /* ---------- Felder: der Himmel wechselt mit dem Feld ---------- */
  const NAMES = { neukunden: "Neukundengewinnung", compliance: "Compliance-Automation", prozesse: "Prozessautomatisierung" };
  const skies = document.querySelectorAll("[data-sky]");
  const label = document.querySelector("[data-window-label]");
  document.querySelectorAll("[data-field]").forEach(function (a) {
    onVisible(a, function (v) {
      if (!v) return;
      const f = a.dataset.field;
      skies.forEach(function (img) { img.classList.toggle("is-on", img.dataset.sky === f); });
      if (label) label.textContent = NAMES[f];
    }, { rootMargin: "-45% 0px -45% 0px" });
  });

  /* ---------- Ablauf ---------- */
  const steps = document.querySelector("[data-steps]");
  if (steps) {
    if (reduce) steps.classList.add("is-on");
    else onVisible(steps, function (v) { if (v) steps.classList.add("is-on"); }, { threshold: 0.4 });
  }

  /* ---------- ruhige Parallaxe der Wolkenbänder ---------- */
  const drifts = Array.prototype.slice.call(document.querySelectorAll("[data-drift]"));
  if (!reduce && drifts.length) {
    let ticking = false;
    const update = function () {
      ticking = false;
      const vh = window.innerHeight;
      drifts.forEach(function (img) {
        const r = img.parentElement.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.transform = "translate3d(0," + (p * -12).toFixed(2) + "%,0) scale(1.04)";
      });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }


  /* ---------- Glas passt sich dem Untergrund an ---------- */
  const pill = document.querySelector("[data-pill]");
  const darkZones = Array.prototype.slice.call(document.querySelectorAll("[data-tone='dark']"));
  function tone() {
    if (!pill) return;
    const r = pill.getBoundingClientRect(), y = r.top + r.height / 2;
    const onDark = darkZones.some(function (z) { const b = z.getBoundingClientRect(); return b.top <= y && b.bottom >= y; });
    pill.classList.toggle("is-light", !onDark);
  }
  window.addEventListener("scroll", tone, { passive: true });
  window.addEventListener("resize", tone);
  tone();

  /* ---------- Kurve im Ablauf: aus den Schritten berechnet ---------- */
  const curve = document.querySelector("[data-curve]");
  const curveSvg = document.querySelector("[data-curve-svg]");
  const stepList = document.querySelector("[data-steps]");
  let curveDots = [];
  function buildCurve() {
    if (!curve || !curveSvg || !stepList) return;
    const items = Array.prototype.slice.call(stepList.children);
    const vertical = items.length > 1 && Math.abs(items[0].offsetLeft - items[1].offsetLeft) < 4;
    curve.classList.toggle("is-vertical", vertical);
    const grad = document.getElementById("curve-stroke");
    if (grad) { grad.setAttribute("x2", vertical ? "0" : "1"); grad.setAttribute("y2", vertical ? "1" : "0"); }
    if (vertical) {
      curve.style.setProperty("--curve-top", stepList.offsetTop + "px");
      curve.style.setProperty("--curve-h", stepList.offsetHeight + "px");
      curve.style.setProperty("--curve-left", stepList.offsetLeft + "px");
    }
    const W = curve.clientWidth, H = curve.clientHeight;
    if (!W || !H) return;
    curveSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const lb = stepList.getBoundingClientRect();
    let pts, end, d, area;
    if (vertical) {
      const xs = [10, 30, 12, 32];
      pts = items.map(function (li, i) { return [xs[i % 4], li.offsetTop - stepList.offsetTop + 16]; });
      end = [22, H - 4];
      const all = pts.concat([end]);
      d = "M" + all[0][0] + "," + all[0][1];
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1], b = all[i], my = (a[1] + b[1]) / 2;
        d += " C" + a[0] + "," + my + " " + b[0] + "," + my + " " + b[0] + "," + b[1];
      }
      area = "";
    } else {
      const ys = [0.82, 0.6, 0.34, 0.12];
      pts = items.map(function (li, i) { const r = li.getBoundingClientRect(); return [r.left - lb.left + 6, H * ys[i]]; });
      end = [W - 4, H * 0.04];
      const all = pts.concat([end]);
      d = "M" + all[0][0] + "," + all[0][1];
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1], b = all[i], mx = (a[0] + b[0]) / 2;
        d += " C" + mx + "," + a[1] + " " + mx + "," + b[1] + " " + b[0] + "," + b[1];
      }
      area = d + " L" + end[0] + "," + H + " L" + all[0][0] + "," + H + " Z";
    }
    curveSvg.querySelector("[data-curve-line]").setAttribute("d", d);
    curveSvg.querySelector("[data-curve-track]").setAttribute("d", d);
    curveSvg.querySelector("[data-curve-area]").setAttribute("d", area);
    curveSvg.querySelectorAll(".curve__dot, .curve__halo").forEach(function (n) { n.remove(); });
    curveDots = pts.map(function (p) {
      const ns = "http://www.w3.org/2000/svg";
      const c = document.createElementNS(ns, "circle"); c.setAttribute("class", "curve__dot"); c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 6);
      const h = document.createElementNS(ns, "circle"); h.setAttribute("class", "curve__halo"); h.setAttribute("cx", p[0]); h.setAttribute("cy", p[1]); h.setAttribute("r", 9);
      curveSvg.appendChild(c); curveSvg.appendChild(h);
      return { el: c, x: vertical ? p[1] / H : p[0] / W };
    });
  }
  buildCurve();
  window.addEventListener("resize", buildCurve);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildCurve);

  /* =====================================================================
     Bewegung: aus den Wolken auftauchen, beim Scrollen den Himmel öffnen
     ===================================================================== */
  if (reduce) return;
  const root = document.documentElement;
  root.classList.add("motion");

  function splitWords(el, inner) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      const safe = w.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return '<span class="w" style="--i:' + i + '">' + (inner ? '<span class="wi">' + safe + "</span>" : safe) + "</span>";
    }).join(" ");
    return el.querySelectorAll(".w");
  }
  function reveal(el, opts) {
    onVisible(el, function (v) { if (v) el.classList.add("is-in"); }, opts || { rootMargin: "0px 0px -12% 0px" });
  }

  // Hero: Wort für Wort aus der Unschärfe
  const ha = document.querySelector(".hero__a"), hb = document.querySelector(".hero__b"), hl = document.querySelector(".hero__line");
  [ha, hb].forEach(function (el, k) {
    if (!el) return;
    splitWords(el, false);
    el.classList.add("emerge");
    el.style.setProperty("--d", k ? "260ms" : "0ms");
  });
  const go = function () {
    requestAnimationFrame(function () { [ha, hb, hl].forEach(function (el) { if (el) el.classList.add("is-in"); }); });
    setTimeout(function () { const h = document.querySelector(".hero"); if (h) h.classList.add("is-settled"); }, 2300);
  };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]).then(go); else go();

  // Überschriften auf Himmel tauchen auf, auf Papier steigen sie aus der Linie
  document.querySelectorAll(".vista h2, .finale h2").forEach(function (h) { splitWords(h, false); h.classList.add("emerge"); reveal(h); });
  document.querySelectorAll(".problem h2, .fields__head h2, .steps__head h2, .about__copy h2, .faq__head h2").forEach(function (h) { splitWords(h, true); h.classList.add("rise-words"); reveal(h); });

  // ruhiges Nachrücken von Text und Listen (Listen gestaffelt, gedeckelt)
  document.querySelectorAll(".problem__head p, .fields__head p, .steps__head p, .vista p, .finale__inner > p, .finale__actions, .about__copy > p, .facts, .portrait, .intro__side, .faq__head p").forEach(function (el) { el.classList.add("rise"); reveal(el); });
  [".chores li", ".faq__list details", ".field .ticks li"].forEach(function (sel) {
    const groups = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      const g = el.parentElement; const n = groups.get(g) || 0; groups.set(g, n + 1);
      el.classList.add("rise"); el.style.setProperty("--i", Math.min(n, 5)); reveal(el, { rootMargin: "0px 0px -6% 0px" });
    });
  });

  // Angebotssatz: Wörter leuchten beim Lesen auf
  const scrub = document.querySelector("[data-scrub]");
  const scrubWords = scrub ? splitWords(scrub, false) : [];

  // Pille: aktiver Abschnitt und Lesefortschritt
  const progress = document.querySelector("[data-progress]");
  const ind = document.querySelector("[data-pill-ind]");
  const navLinks = Array.prototype.slice.call(document.querySelectorAll(".pill__links a[href^='#']"));
  const targets = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  let active = null;
  function setActive(i) {
    if (i === active) return; active = i;
    navLinks.forEach(function (a, k) { a.classList.toggle("is-active", k === i); });
    if (!ind) return;
    if (i === null || i < 0) { ind.classList.remove("is-on"); return; }
    const a = navLinks[i];
    const wasOn = ind.classList.contains("is-on");
    const fromX = parseFloat(ind.style.getPropertyValue("--ind-x")) || a.offsetLeft;
    const fromW = parseFloat(ind.style.getPropertyValue("--ind-w")) || a.offsetWidth;
    const toX = a.offsetLeft, toW = a.offsetWidth;
    if (wasOn && fromX !== toX) {
      // erst zum Tropfen strecken, dann am Ziel zusammenziehen
      const left = Math.min(fromX, toX), right = Math.max(fromX + fromW, toX + toW);
      ind.classList.add("is-stretch");
      ind.style.setProperty("--ind-x", left + "px");
      ind.style.setProperty("--ind-w", (right - left) + "px");
      clearTimeout(ind._t);
      ind._t = setTimeout(function () {
        ind.classList.remove("is-stretch");
        ind.style.setProperty("--ind-x", toX + "px");
        ind.style.setProperty("--ind-w", toW + "px");
      }, 190);
    } else {
      ind.style.setProperty("--ind-x", toX + "px");
      ind.style.setProperty("--ind-w", toW + "px");
    }
    ind.classList.add("is-on");
  }

  // Himmel öffnet sich beim Scrollen, Fenster der Felder wächst heran
  const hero = document.querySelector(".hero");
  const heroSky = document.querySelector(".hero__sky");
  const title = document.querySelector(".hero__title");
  const frame = document.querySelector(".window__frame");
  const fieldsGrid = document.querySelector(".fields__grid");
  let ticking = false;
  function frameUpdate() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.setProperty("--progress", docH > 0 ? Math.min(1, y / docH).toFixed(4) : 0);

    if (hero) {
      const h = hero.offsetHeight, p = Math.min(1, Math.max(0, y / h));
      if (p < 1) {
        if (heroSky) heroSky.style.transform = "scale(" + (1 + p * 0.16).toFixed(4) + ") translate3d(0," + (p * 6).toFixed(2) + "%,0)";
        if (ha) ha.style.transform = "translate3d(" + (-p * 14).toFixed(2) + "vw," + (-p * 4).toFixed(2) + "vh,0)";
        if (hb) hb.style.transform = "translate3d(" + (p * 14).toFixed(2) + "vw," + (p * 3).toFixed(2) + "vh,0)";
        if (title) title.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3);
        if (hl) hl.style.opacity = Math.max(0, 1 - p * 2.4).toFixed(3);
      }
    }

    if (scrub && scrubWords.length) {
      const r = scrub.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.86 - r.top) / (vh * 0.5)));
      const n = Math.round(p * scrubWords.length);
      scrubWords.forEach(function (w, i) { w.classList.toggle("lit", i < n); });
    }

    if (frame && fieldsGrid) {
      const r = fieldsGrid.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.7)));
      frame.style.setProperty("--frame-s", (0.92 + p * 0.08).toFixed(4));
    }

    if (curve && curveDots.length && curve.offsetParent !== null) {
      const r = curve.getBoundingClientRect();
      const vert = curve.classList.contains("is-vertical");
      const p = vert
        ? Math.min(1, Math.max(0, (vh * 0.7 - r.top) / Math.max(1, r.height)))
        : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.55)));
      curve.style.setProperty("--draw", (1 - p).toFixed(4));
      curve.style.setProperty("--area", (p * p).toFixed(3));
      curveDots.forEach(function (d) { d.el.classList.toggle("is-on", p >= d.x * 0.98); });
    }

    let idx = -1;
    targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top < vh * 0.42) idx = k; });
    const fin = document.getElementById("kontakt");
    if (fin && fin.getBoundingClientRect().top < vh * 0.42) idx = -1;
    setActive(idx);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frameUpdate); } }, { passive: true });
  window.addEventListener("resize", function () { active = null; frameUpdate(); });
  frameUpdate();

  // feine Zeigerparallaxe im Himmel (nur Maus)
  if (hero && heroSky && window.matchMedia("(pointer: fine)").matches) {
    const img = heroSky.querySelector("img");
    hero.addEventListener("pointermove", function (e) {
      const r = hero.getBoundingClientRect();
      img.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5) * -28 + "px");
      img.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5) * -18 + "px");
    });
    hero.addEventListener("pointerleave", function () { img.style.setProperty("--mx", "0px"); img.style.setProperty("--my", "0px"); });
  }
})();
