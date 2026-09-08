/* =========================================================
   Rebuild Lab · motion layer
   Vanilla JS. No dependencies.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------------------------------------------------------
     1. Split headline lines into animatable inner spans
     --------------------------------------------------------- */
  $$('[data-split] > span').forEach(function (line) {
    line.innerHTML = '<i>' + line.innerHTML + '</i>';
  });

  /* ---------------------------------------------------------
     2. Reveal on scroll (reveal + split + spark lines)
     --------------------------------------------------------- */
  var revealTargets = $$('[data-reveal], [data-split], .spark');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var d = parseInt(el.getAttribute('data-reveal-delay') || 0, 10);
      setTimeout(function () { el.classList.add('is-in'); }, reduced ? 0 : d);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  revealTargets.forEach(function (el) { io.observe(el); });

  /* ---------------------------------------------------------
     3. Header: shrink / hide-on-scroll + progress bar
     --------------------------------------------------------- */
  var nav = $('#nav');
  var bar = $('#scrollProgress');
  var lastY = 0;

  function onScroll() {
    var y = window.pageYOffset;
    nav.classList.toggle('is-stuck', y > 24);
    if (y > 420 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 200) nav.classList.remove('is-hidden');
    lastY = y;

    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    words.forEach(paintWords);
  }

  /* ---------------------------------------------------------
     4. Scroll-linked word-by-word highlight
     --------------------------------------------------------- */
  var words = $$('[data-words]').map(function (el) {
    var parts = el.textContent.trim().split(/\s+/);
    el.innerHTML = parts.map(function (w) { return '<span>' + w + '</span>'; }).join(' ');
    return el;
  });

  function paintWords(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var start = vh * 0.86, end = vh * 0.3;
    var p = clamp((start - r.top) / (start - end), 0, 1);
    var spans = el.children;
    var lit = Math.round(p * spans.length);
    for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('on', i < lit);
  }
  if (reduced) words.forEach(function (el) { $$('span', el).forEach(function (s) { s.classList.add('on'); }); });

  /* ---------------------------------------------------------
     5. Number count-up
     --------------------------------------------------------- */
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      countIO.unobserve(el);
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduced || target === 0) { el.textContent = target + suffix; return; }
      var dur = 1500, t0 = performance.now();
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(function (el) { countIO.observe(el); });

  /* ---------------------------------------------------------
     6. Progress bars
     --------------------------------------------------------- */
  var barIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, i = $$('[data-bar]').indexOf(el);
      barIO.unobserve(el);
      setTimeout(function () {
        $('b', el).style.width = el.getAttribute('data-bar') + '%';
      }, reduced ? 0 : 120 * Math.max(0, i % 5));
    });
  }, { threshold: 0.4 });
  $$('[data-bar]').forEach(function (el) { barIO.observe(el); });

  /* ---------------------------------------------------------
     7. Sparklines
     --------------------------------------------------------- */
  $$('[data-spark]').forEach(function (el) {
    var vals = el.getAttribute('data-spark').split(',').map(Number);
    var w = 100, h = 30, max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    var span = (max - min) || 1;
    var pts = vals.map(function (v, i) {
      return [(i / (vals.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 8)];
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = d + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
    el.innerHTML =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
        '<defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#EDE7DE"/><stop offset="100%" stop-color="#EDE7DE" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        '<path class="fill" d="' + area + '"/><path d="' + d + '"/>' +
      '</svg>';
    var path = el.querySelector('path:last-child');
    var len = path.getTotalLength ? path.getTotalLength() : 200;
    el.style.setProperty('--len', len);
  });

  /* ---------------------------------------------------------
     8. Generated micro-graphics (commit row, uptime bars)
     --------------------------------------------------------- */
  var commitRow = $('#commitRow');
  if (commitRow) {
    var html = '';
    for (var c = 0; c < 34; c++) {
      var hgt = 6 + Math.round(Math.abs(Math.sin(c * 1.7)) * 18);
      html += '<i class="' + (c < 22 ? 'on' : '') + '" style="height:' + hgt + 'px;animation-delay:' + (c * 0.06).toFixed(2) + 's"></i>';
    }
    commitRow.innerHTML = html;
  }
  var uptimeBars = $('#uptimeBars');
  if (uptimeBars) {
    var uh = '';
    for (var u = 0; u < 60; u++) {
      uh += '<i class="' + (u === 23 || u === 44 ? 'warn' : '') + '" style="animation-delay:' + (u * 0.012).toFixed(3) + 's"></i>';
    }
    uptimeBars.innerHTML = uh;
  }

  /* ---------------------------------------------------------
     9. Seamless marquees (duplicate content once)
     --------------------------------------------------------- */
  $$('.vscroll__track').forEach(function (track) {
    track.appendChild(track.firstElementChild.cloneNode(true));
  });

  /* ---------------------------------------------------------
     10. Quote slider (removed with case studies redesign)
     --------------------------------------------------------- */

  /* ---------------------------------------------------------
     10b. Hero facts ticker
     --------------------------------------------------------- */
  (function () {
    var facts = $$('#heroFacts .hero__fact');
    if (facts.length < 2) return;
    var i = 0;
    if (reduced) return;
    setInterval(function () {
      facts[i].classList.remove('is-active');
      i = (i + 1) % facts.length;
      facts[i].classList.add('is-active');
    }, 3200);
  })();

  /* ---------------------------------------------------------
     11. FAQ accordion with animated height
     --------------------------------------------------------- */
  $$('#faqList details').forEach(function (d) {
    var body = $('.faq__body', d);
    var sum = $('summary', d);
    sum.addEventListener('click', function (ev) {
      ev.preventDefault();
      var isOpen = d.hasAttribute('open');

      $$('#faqList details[open]').forEach(function (other) {
        if (other === d) return;
        var ob = $('.faq__body', other);
        ob.style.height = ob.scrollHeight + 'px';
        requestAnimationFrame(function () {
          ob.style.transition = 'height .45s cubic-bezier(.22,.61,.36,1)';
          ob.style.height = '0px';
        });
        setTimeout(function () { other.removeAttribute('open'); }, 420);
      });

      if (isOpen) {
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(function () {
          body.style.transition = 'height .4s cubic-bezier(.22,.61,.36,1)';
          body.style.height = '0px';
        });
        setTimeout(function () { d.removeAttribute('open'); }, 380);
      } else {
        d.setAttribute('open', '');
        body.style.height = '0px';
        requestAnimationFrame(function () {
          body.style.transition = 'height .5s cubic-bezier(.22,.61,.36,1)';
          body.style.height = body.scrollHeight + 'px';
        });
        setTimeout(function () { body.style.height = 'auto'; }, 520);
      }
    });
  });

  /* ---------------------------------------------------------
     12. Panel pointer glow + subtle 3D tilt
     --------------------------------------------------------- */
  $$('[data-tilt]').forEach(function (card) {
    if (reduced) return;
    var rx = 0, ry = 0, trx = 0, try_ = 0, raf = null;
    function loop() {
      rx = lerp(rx, trx, 0.09); ry = lerp(ry, try_, 0.09);
      card.style.transform = 'perspective(1400px) rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)';
      if (Math.abs(rx - trx) > 0.01 || Math.abs(ry - try_) > 0.01) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
      card.style.setProperty('--glow', 1);
      trx = (0.5 - py) * 3.6; try_ = (px - 0.5) * 4.4;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--glow', 0);
      trx = 0; try_ = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });

  /* ---------------------------------------------------------
     13. Mobile menu
     --------------------------------------------------------- */
  (function () {
    var burger = $('#burger'), menu = $('#mobilemenu');
    if (!burger) return;
    function close() { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); }
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
      menu.setAttribute('aria-hidden', String(open));
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
  })();

  /* ---------------------------------------------------------
     14. Newsletter (front-end only)
     --------------------------------------------------------- */
  (function () {
    var form = $('#subscribe'), msg = $('#subMsg');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input').value.trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      msg.style.color = ok ? '' : '#E9744F';
      msg.textContent = ok ? "You're on the list. We only send when there's something worth reading."
                           : 'That email looks off. Mind checking it?';
      if (ok) form.reset();
    });
  })();

  $('#year').textContent = new Date().getFullYear();

  /* =========================================================
     CANVAS 1 · flowing dot-wave field
     ========================================================= */
  function DotWave(canvas, opt) {
    opt = opt || {};
    var ctx = canvas.getContext('2d', { alpha: true });
    var lowPower = window.matchMedia('(max-width:720px)').matches
      || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    var dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2);
    var w = 0, h = 0, t = 0, raf = null, visible = false;
    var density = lowPower ? 0.58 : 1;
    var COLS = Math.max(36, Math.round((opt.cols || 96) * density));
    var ROWS = Math.max(22, Math.round((opt.rows || 52) * density));
    var amp = opt.amp || 0.42, speed = opt.speed || 0.0055, spread = opt.spread || 2.9;
    var camY = opt.camY != null ? opt.camY : 0.62;
    var focal = opt.focal || 0.92;
    var tilt = opt.tilt || 0;
    var mx = 0, my = 0, tmx = 0, tmy = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      mx = lerp(mx, tmx, 0.05); my = lerp(my, tmy, 0.05);

      var cx = w * (opt.originX != null ? opt.originX : 0.5);
      var cy = h * (opt.originY != null ? opt.originY : 0.52);
      var base = Math.min(w, h);

      for (var j = 0; j < ROWS; j++) {
        var v = j / (ROWS - 1);
        var z = 0.55 + Math.pow(v, 1.35) * 6.2;          // depth
        var scale = (focal / z) * base * 0.9;
        var depthFade = clamp(1.25 - v * 1.35, 0, 1);
        if (depthFade <= 0.01) continue;

        for (var i = 0; i < COLS; i++) {
          var u = (i / (COLS - 1) - 0.5) * spread;
          // layered sine field -> organic ripple
          var y =
            Math.sin(u * 1.35 + t * 1.15 + v * 2.1) * 0.55 +
            Math.sin(u * 0.55 - t * 0.85 + v * 4.4) * 0.34 +
            Math.cos(v * 3.1 - t * 0.6) * 0.22;
          y *= amp * (0.55 + v * 0.75);

          var wx = u + mx * 0.18 + tilt * v;
          var wy = y + camY + my * 0.12;

          var sx = cx + wx * scale;
          var sy = cy + wy * scale * 0.55;
          if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

          var lift = clamp(0.5 - y * 1.5, 0, 1);           // crests brighter
          var a = depthFade * (0.12 + lift * 0.62) * (opt.alpha || 1);
          if (a < 0.012) continue;
          var s = clamp(scale * 0.0032, 0.6, 2.3);

          ctx.fillStyle = 'rgba(245,240,232,' + a.toFixed(3) + ')';
          ctx.fillRect(sx, sy, s, s);
        }
      }
      t += speed * (reduced ? 0 : 1);
      raf = visible && !reduced ? requestAnimationFrame(frame) : null;
    }

    function start() { if (!raf) { visible = true; frame(); } }
    function stop() { visible = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    window.addEventListener('resize', function () { resize(); if (!raf) frame(); }, { passive: true });
    window.addEventListener('pointermove', function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5) * 1.6;
      tmy = (e.clientY / window.innerHeight - 0.5) * 1.1;
    }, { passive: true });

    new IntersectionObserver(function (en) {
      en[0].isIntersecting ? start() : stop();
    }, { threshold: 0 }).observe(canvas);

    resize(); frame();
    return { resize: resize };
  }

  /* =========================================================
     CANVAS 2 · orbiting particle ring
     ========================================================= */
  function DotRing(canvas) {
    var ctx = canvas.getContext('2d', { alpha: true });
    var lowPower = window.matchMedia('(max-width:720px)').matches
      || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    var dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2);
    var w, h, t = 0, raf = null, visible = false;
    var N = lowPower ? 140 : 260;
    var seeds = [];
    for (var i = 0; i < N; i++) {
      seeds.push({
        a: (i / N) * Math.PI * 2,
        r: 0.94 + Math.random() * 0.12,
        y: (Math.random() - 0.5) * 0.14,
        s: 0.5 + Math.random() * 0.9,
        w: 0.4 + Math.random() * 1.4
      });
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2;
      var rx = w * 0.44, ry = h * 0.40;
      for (var i = 0; i < N; i++) {
        var p = seeds[i];
        var a = p.a + t * 0.22 * p.w * 0.35;
        var depth = (Math.sin(a) + 1) / 2;                  // 0 back -> 1 front
        var wob = Math.sin(t * 1.6 + p.a * 3) * 0.02;
        var x = cx + Math.cos(a) * rx * (p.r + wob);
        var y = cy + (Math.sin(a) * 0.42 + p.y + Math.sin(t * 1.1 + p.a * 2) * 0.03) * ry * 2 * 0.5;
        var alpha = (0.12 + depth * 0.72) * p.s;
        var size = (0.7 + depth * 1.5) * p.s;
        ctx.fillStyle = 'rgba(245,240,232,' + alpha.toFixed(3) + ')';
        ctx.fillRect(x, y, size, size);
      }
      t += reduced ? 0 : 0.008;
      raf = visible && !reduced ? requestAnimationFrame(frame) : null;
    }

    window.addEventListener('resize', function () { resize(); if (!raf) frame(); }, { passive: true });
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { visible = true; if (!raf) frame(); }
      else { visible = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(canvas);
    resize(); frame();
  }

  /* =========================================================
     Boot canvases
     ========================================================= */
  var heroWave = $('#heroWave');
  if (heroWave) DotWave(heroWave, { originX: 0.62, originY: 0.34, camY: 0.55, amp: 0.4, cols: 104, rows: 56, speed: 0.005, alpha: 0.95 });

  var midWave = $('#midWave');
  if (midWave) DotWave(midWave, { originX: 0.5, originY: 0.06, camY: 0.5, amp: 0.52, cols: 110, rows: 46, speed: 0.0062, spread: 3.4, alpha: 0.8 });

  var ctaWave = $('#ctaWave');
  if (ctaWave) DotWave(ctaWave, { originX: 0.5, originY: 0.24, camY: 0.7, amp: 0.34, cols: 96, rows: 44, speed: 0.0042, spread: 3.6, alpha: 0.6 });

  var ring = $('#ringCanvas');
  if (ring) DotRing(ring);

  /* ---------------------------------------------------------
     Scroll wiring
     --------------------------------------------------------- */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* Smooth anchor scrolling with header offset */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - 78;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
})();
