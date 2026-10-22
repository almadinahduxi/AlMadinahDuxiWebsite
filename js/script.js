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

/* ===== Process path =====
   One flowing line: enters from the right edge, loops after step 1 and step 4, S-bends between steps.
   ROUTE is in units of (page width, step spacing). {n:..} marks a step. Add loop:true for a loop.
   - Scroll sets a target; the drawn length eases toward it every frame.
   - Step badges draw their icons in when the path arrives and un-draw when you scroll back. */
(function () {
  'use strict';

  var stage = document.querySelector('.process__stage');
  if (!stage) return;

  var svg = stage.querySelector('.process__svg');
  var grad = svg.querySelector('#pGrad');
  var track = svg.querySelector('.p-track');
  var line = svg.querySelector('.p-line');
  var head = svg.querySelector('.p-head');
  var nodes = Array.prototype.slice.call(stage.querySelectorAll('.pnode'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var EASE_MS = 150;   /* higher = floatier */

  var ROUTE = [
    [0.99, -0.46], [0.88, -0.34], [0.80, -0.17],
    { n: 0, x: 0.72, y: 0, loop: true },
    [0.58, 0.20], [0.45, 0.36], [0.36, 0.64],
    { n: 1, x: 0.31, y: 1 },
    [0.30, 1.18], [0.36, 1.29], [0.45, 1.40], [0.50, 1.70],
    { n: 2, x: 0.52, y: 2 },
    [0.55, 2.20], [0.61, 2.35], [0.74, 2.41], [0.88, 2.43], [0.97, 2.58], [0.96, 2.76], [0.85, 2.90],
    { n: 3, x: 0.72, y: 3, loop: true },
    [0.58, 3.20], [0.45, 3.36], [0.36, 3.64],
    { n: 4, x: 0.31, y: 4 },
    [0.30, 4.18], [0.36, 4.29], [0.45, 4.40], [0.50, 4.70],
    { n: 5, x: 0.52, y: 5 },
    [0.55, 5.20], [0.61, 5.35], [0.74, 5.41], [0.90, 5.44], [1.06, 5.55]
  ];

  var total = 0, marks = [], target = 0, cur = 0, raf = 0, last = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Smooth curve through points; handle length follows segment length so nothing overshoots */
  function smooth(p) {
    function tan(i) {
      var a = p[Math.max(i - 1, 0)], b = p[Math.min(i + 1, p.length - 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [dx / l, dy / l];
    }
    var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p1 = p[i], p2 = p[i + 1], t1 = tan(i), t2 = tan(i + 1);
      var k = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3;
      d += ' C' + (p1[0] + t1[0] * k).toFixed(1) + ' ' + (p1[1] + t1[1] * k).toFixed(1) +
           ' ' + (p2[0] - t2[0] * k).toFixed(1) + ' ' + (p2[1] - t2[1] * k).toFixed(1) +
           ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function build() {
    var W = stage.clientWidth;
    var side = W >= 900;
    var sh = 330;                 /* vertical distance between steps */
    var y0 = sh * 0.6;
    var H = Math.round(y0 + 5.6 * sh + 40);

    stage.style.height = H + 'px';
    stage.classList.toggle('is-small', !side);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    grad.setAttribute('y2', H);

    /* turn the route into points; a loop is a small curl placed just under its step */
    var pts = [], pos = [], loopExitX = null;
    ROUTE.forEach(function (it) {
      var isNode = !Array.isArray(it);
      var fx = isNode ? it.x : it[0], fy = isNode ? it.y : it[1];
      var x = W * fx, y = y0 + fy * sh;
      if (loopExitX !== null && !isNode) {      /* never double back after a loop */
        x = Math.min(x, loopExitX - W * 0.06);
        loopExitX = null;
      }
      pts.push([x, y]);
      if (isNode) {
        pos[it.n] = [x, y];
        if (it.loop) {
          var r = clamp(W * 0.045, 26, 60), a = r * 0.3;
          var sx = x - W * 0.035, my = y + sh * 0.10, cx = sx - a * Math.PI;
          for (var t = -Math.PI; t <= Math.PI + 0.001; t += Math.PI / 14) {
            pts.push([cx - (a * t - r * Math.sin(t)), my + r * (1 + Math.cos(t))]);
          }
          loopExitX = cx - a * Math.PI;
        }
      }
    });

    var d = smooth(pts);
    track.setAttribute('d', d);
    line.setAttribute('d', d);
    total = line.getTotalLength();
    line.style.strokeDasharray = total;

    /* place steps, titles and notes */
    nodes.forEach(function (node, j) {
      var x = pos[j][0], y = pos[j][1];
      node.style.left = x + 'px';
      node.style.top = y + 'px';
      var badge = node.querySelector('.pbadge');
      var bs = parseFloat(getComputedStyle(badge).width) || 76;
      var right = x > W * 0.6;
      node.classList.toggle('pn-r', side && right);
      node.classList.toggle('pn-l', side && !right);
      var note = node.querySelector('.pnote');
      var txt = node.querySelector('.ptext');
      note.style.maxWidth = '';
      txt.style.marginLeft = '';
      if (side) {
        var space = (right ? W - x : x) - bs / 2 - 10 - 16;
        note.style.maxWidth = Math.max(160, Math.min(270, space)) + 'px';
      } else {
        var half = txt.offsetWidth / 2;
        txt.style.marginLeft = (clamp(x, half + 16, W - half - 16) - x) + 'px';
      }
    });

    /* path length at which each step sits */
    var S = 1200;
    marks = pos.map(function (p) {
      var best = 0, bd = Infinity;
      for (var s = 0; s <= S; s++) {
        var q = line.getPointAtLength(total * s / S);
        var dd = (q.x - p[0]) * (q.x - p[0]) + (q.y - p[1]) * (q.y - p[1]);
        if (dd < bd) { bd = dd; best = s; }
      }
      return total * best / S;
    });

    readTarget();
    cur = target;
    render();
  }

  function readTarget() {
    var rect = stage.getBoundingClientRect();
    target = reduce ? 1 : clamp((window.innerHeight * 0.62 - rect.top) / rect.height, 0, 1);
  }

  function render() {
    var len = cur * total;
    line.style.strokeDashoffset = total - len;
    var pt = line.getPointAtLength(len);
    head.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    nodes.forEach(function (node, j) {
      node.classList.toggle('is-on', len >= marks[j] - 20);
    });
  }

  /* frame-rate independent easing toward the scroll target */
  function tick(now) {
    var dt = Math.min(now - (last || now), 64);
    last = now;
    var diff = target - cur;
    if (Math.abs(diff) < 0.0002) { cur = target; raf = 0; last = 0; render(); return; }
    cur += diff * (1 - Math.exp(-dt / EASE_MS));
    render();
    raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    readTarget();
    if (reduce) { cur = target; render(); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  build();
})();

/* ===== Courses and admission: scroll reveal, card spotlight, missing images ===== */
(function () {
  'use strict';

  var sections = Array.prototype.slice.call(document.querySelectorAll('.courses, .admission'));
  if (!sections.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var io = null;

  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  }

  sections.forEach(function (section) {
    if (io) {
      section.classList.add('is-ready');
      Array.prototype.forEach.call(section.querySelectorAll('.reveal'), function (el) { io.observe(el); });
    }
    if (!reduce && mouse) {
      section.addEventListener('pointermove', function (e) {
        var card = e.target.closest('.spot');
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    }
  });

  /* Labelled placeholder if a course image file is missing */
  Array.prototype.forEach.call(document.querySelectorAll('.cimg img'), function (img) {
    function miss() { img.parentElement.classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') miss();
    img.addEventListener('error', miss);
  });
})(); 

/* ===== Admission form, booking calendar and WhatsApp link ===== */
(function () {
  'use strict';

  /* ---- Edit these ---- */
  var WHATSAPP = '923415416491';        /* number with country code, no + */
  var WEEK_START = 1;                   /* 1 = Monday, 0 = Sunday */
  var DAYS_AHEAD = 60;                  /* how far ahead a class can be booked */
  var CLOSED_WEEKDAYS = [];             /* e.g. [5] closes Fridays (0 = Sunday) */
  var SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '9:00 PM']; /* placeholders: use your real class times */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var form = document.getElementById('admission-form');
  var booking = document.getElementById('booking');
  if (!form || !booking) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var panel = booking.querySelector('.booking__panel');
  var closeBtn = booking.querySelector('.booking__close');
  var monthEl = booking.querySelector('.cal__month');
  var weekEl = booking.querySelector('.cal__week');
  var gridEl = booking.querySelector('.cal__grid');
  var prevBtn = booking.querySelector('[data-cal="prev"]');
  var nextBtn = booking.querySelector('[data-cal="next"]');
  var slotsEl = booking.querySelector('.slots__grid');
  var hintEl = booking.querySelector('[data-slot-hint]');
  var sumEl = booking.querySelector('[data-sum]');
  var saveBtn = booking.querySelector('[data-save]');
  var clearBtn = booking.querySelector('[data-clear]');
  var statusEl = document.getElementById('adm-status');

  function day0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  var today = day0(new Date());
  var lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + DAYS_AHEAD);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var picked = null, pickedTime = '', saved = null, lastFocus = null;

  function same(a, b) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function longDate(d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function shortDate(d) { return DAY3[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function isOff(d) { return d < today || d > lastDay || CLOSED_WEEKDAYS.indexOf(d.getDay()) !== -1; }
  function minutesOf(t) {
    var m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t);
    if (!m) return 0;
    return ((parseInt(m[1], 10) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + parseInt(m[2], 10);
  }
  function slotPast(t) {
    if (!picked || !same(picked, today)) return false;
    var n = new Date();
    return minutesOf(t) <= n.getHours() * 60 + n.getMinutes() + 30;
  }

  /* ---- Calendar ---- */
  function renderWeek() {
    weekEl.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      var s = document.createElement('span');
      s.textContent = DAY3[(WEEK_START + i) % 7];
      weekEl.appendChild(s);
    }
  }

  function renderCalendar(animate) {
    var y = view.getFullYear(), m = view.getMonth();
    monthEl.textContent = MONTHS[m] + ' ' + y;
    gridEl.innerHTML = '';
    var offset = (new Date(y, m, 1).getDay() - WEEK_START + 7) % 7;
    var count = new Date(y, m + 1, 0).getDate();
    var i, btn, date, off, on;
    for (i = 0; i < offset; i++) gridEl.appendChild(document.createElement('span'));
    for (i = 1; i <= count; i++) {
      date = new Date(y, m, i);
      off = isOff(date);
      on = same(date, picked);
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal__day';
      btn.textContent = i;
      btn.setAttribute('data-d', i);
      btn.disabled = off;
      if (same(date, today)) btn.classList.add('is-today');
      if (on) btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', longDate(date) + (off ? ', unavailable' : ''));
      gridEl.appendChild(btn);
    }
    prevBtn.disabled = (y * 12 + m) <= (today.getFullYear() * 12 + today.getMonth());
    nextBtn.disabled = new Date(y, m + 1, 1) > lastDay;
    if (animate && !reduce) {
      gridEl.classList.remove('is-swap');
      void gridEl.offsetWidth;
      gridEl.classList.add('is-swap');
    }
  }

  function renderSlots() {
    slotsEl.innerHTML = '';
    var anyFree = false;
    SLOTS.forEach(function (t) {
      var b = document.createElement('button');
      var off = !picked || slotPast(t);
      var on = t === pickedTime;
      b.type = 'button';
      b.className = 'slot' + (on ? ' is-selected' : '');
      b.textContent = t;
      b.setAttribute('data-t', t);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.disabled = off;
      if (!off) anyFree = true;
      slotsEl.appendChild(b);
    });
    hintEl.textContent = !picked ? 'Choose a date first to see the available times.'
      : (anyFree ? 'Times are shown in your local time.' : 'No more times today. Please choose another day.');
  }

  function renderSummary() {
    sumEl.textContent = picked ? shortDate(picked) + (pickedTime ? ' · ' + pickedTime : ' · choose a time') : 'No date selected';
    saveBtn.disabled = !(picked && pickedTime);
    clearBtn.disabled = !picked && !saved;
  }

  /* Shows the saved slot in the form and on the booking card */
  function renderSaved() {
    var text = saved ? shortDate(saved.date) + ' · ' + saved.time : 'Not chosen yet';
    Array.prototype.forEach.call(document.querySelectorAll('[data-slot-text]'), function (el) { el.textContent = text; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-slot-row]'), function (el) { el.classList.toggle('is-set', !!saved); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-slot-go]'), function (el) { el.textContent = saved ? 'Change' : 'Choose'; });
  }

  gridEl.addEventListener('click', function (e) {
    var b = e.target.closest('.cal__day');
    if (!b || b.disabled) return;
    picked = new Date(view.getFullYear(), view.getMonth(), parseInt(b.getAttribute('data-d'), 10));
    if (pickedTime && slotPast(pickedTime)) pickedTime = '';
    renderCalendar(false);
    renderSlots();
    renderSummary();
    var sel = gridEl.querySelector('.is-selected');
    if (sel) sel.focus({ preventScroll: true });
  });

  slotsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    pickedTime = b.getAttribute('data-t');
    renderSlots();
    renderSummary();
    var sel = slotsEl.querySelector('.is-selected');
    if (sel) sel.focus({ preventScroll: true });
  });

  prevBtn.addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderCalendar(true);
  });
  nextBtn.addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderCalendar(true);
  });

  saveBtn.addEventListener('click', function () {
    if (!picked || !pickedTime) return;
    saved = { date: picked, time: pickedTime };
    renderSaved();
    closeBooking();
  });

  clearBtn.addEventListener('click', function () {
    picked = null; pickedTime = ''; saved = null;
    renderSaved();
    renderCalendar(false);
    renderSlots();
    renderSummary();
  });

  /* ---- Open and close (bottom sheet on phones, popup on large screens: see CSS) ---- */
  function openBooking(trigger) {
    lastFocus = trigger || document.activeElement;
    if (saved) {
      picked = saved.date;
      pickedTime = saved.time;
      view = new Date(picked.getFullYear(), picked.getMonth(), 1);
    }
    renderCalendar(false);
    renderSlots();
    renderSummary();
    booking.removeAttribute('inert');
    booking.setAttribute('aria-hidden', 'false');
    root.classList.add('is-locked');
    requestAnimationFrame(function () {
      booking.classList.add('is-open');
      setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 60);
    });
  }

  function closeBooking() {
    if (!booking.classList.contains('is-open')) return;
    booking.classList.remove('is-open');
    booking.setAttribute('aria-hidden', 'true');
    booking.setAttribute('inert', '');
    root.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-booking-open]');
    if (opener) { e.preventDefault(); openBooking(opener); return; }
    if (e.target.closest('#booking [data-close]')) closeBooking();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && booking.classList.contains('is-open')) closeBooking();
  });

  /* Keep keyboard focus inside the open container */
  booking.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var items = Array.prototype.filter.call(
      panel.querySelectorAll('button, [href], input, select, textarea'),
      function (el) { return !el.disabled && el.offsetParent !== null; }
    );
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- Admission form and WhatsApp link ---- */
  function setErr(input, msg) {
    var wrap = input.closest('.field');
    wrap.classList.toggle('has-error', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) wrap.querySelector('.field__err').textContent = msg;
  }

  function validate() {
    var el = form.elements, bad = null;
    var name = el.fullname.value.trim();
    var age = parseInt(el.age.value, 10);

    if (name.length < 2) { setErr(el.fullname, 'Please enter your name.'); bad = bad || el.fullname; } else setErr(el.fullname, '');
    if (!(age >= 3 && age <= 99)) { setErr(el.age, 'Please enter an age between 3 and 99.'); bad = bad || el.age; } else setErr(el.age, '');
    if (!el.course.value) { setErr(el.course, 'Please choose a course.'); bad = bad || el.course; } else setErr(el.course, '');

    if (bad) { bad.focus(); return false; }
    return true;
  }

  function buildUrl() {
    var el = form.elements;
    var lines = [
      'Assalamu alaikum, I would like to apply for admission at Al Madinah Duxi.',
      '',
      'Name: ' + el.fullname.value.trim(),
      'Who is learning: ' + el.learner.value,
      'Learner age: ' + parseInt(el.age.value, 10),
      'Course: ' + el.course.value
    ];
    var country = el.country.value.trim();
    var note = el.message.value.trim();
    if (country) lines.push('Country: ' + country);
    if (saved) lines.push('Preferred class time: ' + longDate(saved.date) + ' at ' + saved.time + ' (learner\'s local time)');
    if (note) lines.push('Note: ' + note);
    lines.push('', 'JazakAllah khair.');
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('input', function (e) {
    var wrap = e.target.closest('.field');
    if (wrap && wrap.classList.contains('has-error')) setErr(e.target, '');
  });
  form.addEventListener('change', function (e) {
    var wrap = e.target.closest('.field');
    if (wrap && wrap.classList.contains('has-error')) setErr(e.target, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var url = buildUrl();
    statusEl.textContent = 'Opening WhatsApp… ';
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Tap here if it does not open.';
    statusEl.appendChild(a);

    var w = window.open(url, '_blank');
    if (w) { w.opener = null; } else { window.location.href = url; }
  });

  renderWeek();
  renderSaved();
})();