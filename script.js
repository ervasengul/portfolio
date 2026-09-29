// Erva Şengül — portfolio v4 behavior
// nav state + mobile menu · scroll reveals · email obfuscation · chart hover

(function () {
  function getEmail() {
    var user = 'ervasengul4';
    var domain = 'gmail.com';
    return user + '@' + domain;
  }

  // the site used to be one long page; send old #section links to their new pages
  var legacy = { '#projects': 'projects.html', '#archive': 'projects.html#archive', '#yedik': 'designs.html#yedik',
                 '#about': 'about.html', '#experience': 'about.html', '#contact': 'contact.html' };
  if (/(^|\/)(index\.html)?$/.test(location.pathname) && legacy[location.hash]) {
    location.replace(legacy[location.hash]);
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // --- email obfuscation ---
    document.querySelectorAll('.email-link').forEach(function (link) {
      link.href = 'mailto:' + getEmail();
    });
    document.querySelectorAll('.email-text').forEach(function (el) {
      el.textContent = getEmail();
    });

    // --- footer year ---
    var year = document.querySelector('.footer-year');
    if (year) year.textContent = new Date().getFullYear();

    // --- nav: scrolled state + mobile menu ---
    var nav = document.querySelector('.site-nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 10); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      var toggle = nav.querySelector('.nav-toggle');
      if (toggle) {
        var setOpen = function (open) {
          nav.classList.toggle('nav-open', open);
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        toggle.addEventListener('click', function () {
          setOpen(!nav.classList.contains('nav-open'));
        });
        nav.querySelectorAll('.nav-links a').forEach(function (a) {
          a.addEventListener('click', function () { setOpen(false); });
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') setOpen(false);
        });
      }
    }

    // --- reveal on scroll ---
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      targets.forEach(function (el) { io.observe(el); });
    }

    // --- spline chart: crosshair + tooltip (project pages) ---
    document.querySelectorAll('.spline-chart').forEach(function (fig) {
      var wrap = fig.querySelector('.chart-wrap');
      var svg = wrap && wrap.querySelector('svg');
      var tip = wrap && wrap.querySelector('.chart-tip');
      if (!svg || !tip) return;
      var pts = JSON.parse(svg.getAttribute('data-points')); // [km, m, px, py]
      var cross = svg.querySelector('.chart-cross');
      var focus = svg.querySelector('.chart-focus');
      var vbWidth = svg.viewBox.baseVal.width;
      var current = -1;

      var value = document.createElement('strong');
      var label = document.createElement('span');
      tip.appendChild(value);
      tip.appendChild(label);

      function show(i) {
        current = Math.max(0, Math.min(pts.length - 1, i));
        var p = pts[current];
        cross.setAttribute('x1', p[2]); cross.setAttribute('x2', p[2]);
        focus.setAttribute('cx', p[2]); focus.setAttribute('cy', p[3]);
        value.textContent = p[1].toFixed(2) + ' m';
        label.textContent = 'at ' + p[0] + ' km';
        var scale = svg.getBoundingClientRect().width / vbWidth;
        var x = p[2] * scale, y = p[3] * scale;
        var left = x + 14 + tip.offsetWidth > wrap.clientWidth ? x - 14 - tip.offsetWidth : x + 14;
        tip.style.transform = 'translate(' + left + 'px,' + Math.max(0, y - tip.offsetHeight - 10) + 'px)';
        wrap.classList.add('is-active');
      }
      function hide() { wrap.classList.remove('is-active'); }
      function nearest(clientX) {
        var r = svg.getBoundingClientRect();
        var x = (clientX - r.left) / r.width * vbWidth;
        var best = 0;
        pts.forEach(function (p, i) { if (Math.abs(p[2] - x) < Math.abs(pts[best][2] - x)) best = i; });
        return best;
      }

      svg.addEventListener('pointermove', function (e) { show(nearest(e.clientX)); });
      svg.addEventListener('pointerleave', hide);
      svg.addEventListener('focus', function () { show(current < 0 ? 30 : current); });
      svg.addEventListener('blur', hide);
      svg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { show(current + 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { show(current - 1); e.preventDefault(); }
      });
    });
  });
})();
