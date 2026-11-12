/* Dott.ssa Mariolina Picardi — interazioni essenziali (nessuna libreria) */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var mq = window.matchMedia('(max-width: 1023px)');

  /* ---------- Header: ombra allo scroll ---------- */
  function onScrollHeader() { header.classList.toggle('is-scrolled', window.scrollY > 8); }

  /* ---------- Menu burger (solo mobile/tablet) ---------- */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a') && mq.matches) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  mq.addEventListener('change', function () { if (!mq.matches) setMenu(false); });

  /* ---------- Voce di menu attiva ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-list a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.closest('.faq-item').classList.toggle('is-open', !open);
    });
  });

  /* ---------- Fade-in progressivo ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
        var i = siblings.indexOf(el);
        el.style.transitionDelay = (i > 0 ? Math.min(i, 5) * 90 : 0) + 'ms';
        el.classList.add('is-visible');
        setTimeout(function () { el.style.transitionDelay = ''; }, 1500);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Come funziona: linea che si riempie allo scroll ---------- */
  var tl = document.querySelector('.timeline-wrap');
  var steps = tl ? Array.prototype.slice.call(tl.querySelectorAll('.step')) : [];
  var track = tl ? tl.querySelector('.timeline-track') : null;

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function updateTimeline() {
    if (!tl) return;
    if (reduce) {
      tl.style.setProperty('--progress', 1);
      steps.forEach(function (s) { s.classList.add('is-active'); });
      return;
    }
    var vh = window.innerHeight;
    var p;
    if (mq.matches) {
      // verticale: la linea segue un punto al 62% dello schermo
      var line = vh * 0.62;
      var tr = track.getBoundingClientRect();
      p = clamp((line - tr.top) / tr.height);
      steps.forEach(function (s) {
        var n = s.querySelector('.step-node').getBoundingClientRect();
        s.classList.toggle('is-active', n.top + n.height / 2 <= line);
      });
    } else {
      var r = tl.getBoundingClientRect();
      p = clamp((vh * 0.8 - r.top) / (vh * 0.45));
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', p >= i / (steps.length - 1) - 0.02);
      });
    }
    tl.style.setProperty('--progress', p.toFixed(4));
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScrollHeader(); updateTimeline(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScrollHeader(); updateTimeline();

  /* ---------- Modulo di contatto ---------- */
  var form = document.querySelector('.contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('.form-submit');
    var phone = '<a href="tel:+393334168356">333 416 8356</a>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (f) {
        var ok = f.type === 'checkbox' ? f.checked : f.checkValidity() && f.value.trim() !== '';
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !invalid) invalid = f;
      });
      if (invalid) {
        status.textContent = 'Controlla i campi evidenziati: nome, email valida, messaggio e consenso sono necessari.';
        invalid.focus();
        return;
      }

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        // Nessun servizio di invio collegato: non simuliamo la spedizione.
        status.innerHTML = 'L’invio online sarà attivo a breve. Nel frattempo puoi chiamarmi al ' + phone + '.';
        return;
      }

      submit.disabled = true;
      status.textContent = 'Invio in corso…';
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          status.textContent = 'Grazie! Ho ricevuto il tuo messaggio e ti risponderò al più presto.';
        })
        .catch(function () {
          status.innerHTML = 'Non è stato possibile inviare il messaggio. Riprova più tardi oppure chiamami al ' + phone + '.';
        })
        .then(function () { submit.disabled = false; });
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
    });
  }

  /* ---------- Anno nel footer ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
