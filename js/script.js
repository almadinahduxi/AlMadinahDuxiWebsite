/* Al Madinah Duxi: hero behaviour */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav');

  /* Smooth scroll for every element with data-scroll="#section-id" */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-scroll]');
    if (!trigger) return;
    e.preventDefault();

    var selector = trigger.getAttribute('data-scroll');
    var target = document.querySelector(selector);
    if (!target) return; // section not built yet

    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', selector);
  });

  /* Shadow on the nav once the page scrolls */
  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Highlight the nav link of the section currently in view */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[data-scroll]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('data-scroll')); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-scroll') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }
  setActive('home');

  /* Typed last word of the heading: online > anywhere > easily.
     Edit the list in data-words on .hero__type. Stays static for reduced motion. */
  var typeEl = document.querySelector('.hero__type');
  var wordEl = typeEl && typeEl.querySelector('.hero__word');
  if (wordEl && !reduceMotion) {
    var words = (typeEl.getAttribute('data-words') || 'online').split(',');
    var w = 0, n = words[0].length, deleting = true;
    var TYPE = 85, ERASE = 45, HOLD = 1800, GAP = 350;

    setTimeout(function step() {
      var word = words[w];
      if (document.hidden) { setTimeout(step, 500); return; }
      if (deleting) {
        n--;
        wordEl.textContent = word.slice(0, n);
        if (n === 0) { deleting = false; w = (w + 1) % words.length; setTimeout(step, GAP); return; }
        setTimeout(step, ERASE);
      } else {
        n++;
        wordEl.textContent = word.slice(0, n);
        if (n === word.length) { deleting = true; setTimeout(step, HOLD); return; }
        setTimeout(step, TYPE);
      }
    }, HOLD);
    /* first word is already in the HTML, so wait before erasing it */
  }

  /* Button morph: measure both buttons and hand the sizes to CSS (see "Button morph" in style.css).
     Skipped for reduced motion, and when the buttons wrap onto two rows (very narrow screens). */
  var actions = document.querySelector('.hero__actions');
  var b1 = actions && actions.querySelector('.btn--primary');
  var b2 = actions && actions.querySelector('.btn--ghost');

  function measureButtons() {
    if (!b1 || !b2 || reduceMotion) return;
    actions.classList.remove('is-morph');
    var r1 = b1.getBoundingClientRect(), r2 = b2.getBoundingClientRect();
    if (Math.abs(r1.top - r2.top) > 2) return; // wrapped: keep the plain buttons
    var gap = parseFloat(getComputedStyle(actions).columnGap) || 10;
    actions.style.setProperty('--w1', r1.width + 'px');
    actions.style.setProperty('--w2', r2.width + 'px');
    actions.style.setProperty('--h', Math.max(r1.height, r2.height) + 'px');
    actions.style.setProperty('--gap', gap + 'px');
    actions.classList.add('is-morph');
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureButtons);
  measureButtons();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureButtons, 150);
  });

  /* Dashed placeholder if a device image is missing */
  document.querySelectorAll('.device img').forEach(function (img) {
    function markMissing() { img.parentElement.classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener('error', markMissing);
  });
})();