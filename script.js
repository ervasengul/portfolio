// Erva Şengül — portfolio v4 behavior
// nav state + mobile menu · scroll reveals · email obfuscation · footer clock

(function () {
  function getEmail() {
    var user = 'ervasengul4';
    var domain = 'gmail.com';
    return user + '@' + domain;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // --- email obfuscation ---
    document.querySelectorAll('.email-link').forEach(function (link) {
      link.href = 'mailto:' + getEmail();
    });
    document.querySelectorAll('.email-text').forEach(function (el) {
      el.textContent = getEmail();
    });

    // --- footer year + Istanbul local time ---
    var year = document.querySelector('.footer-year');
    if (year) year.textContent = new Date().getFullYear();

    var clock = document.querySelector('.footer-clock');
    if (clock) {
      var tick = function () {
        try {
          clock.textContent = 'Istanbul · ' + new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul'
          }).format(new Date());
        } catch (e) { clock.textContent = ''; }
      };
      tick();
      setInterval(tick, 30000);
    }

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
  });
})();
