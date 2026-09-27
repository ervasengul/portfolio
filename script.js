// Shared behavior: email obfuscation, nav state, scroll reveals.

(function () {
  // Email kept out of static markup to avoid harvesting by spam bots.
  function getEmail() {
    var user = 'ervasengul004';
    var domain = 'gmail.com';
    return user + '@' + domain;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.email-link').forEach(function (link) {
      link.href = 'mailto:' + getEmail();
    });
    document.querySelectorAll('.email-text').forEach(function (el) {
      el.textContent = getEmail();
    });

    var year = document.querySelector('.footer-year');
    if (year) year.textContent = new Date().getFullYear();

    // Sticky nav: hairline + shadow once the page scrolls.
    var nav = document.querySelector('.site-nav');
    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('scrolled', window.scrollY > 8);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Reveal-on-scroll, skipped for reduced-motion users.
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
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      targets.forEach(function (el) { io.observe(el); });
    }
  });
})();
