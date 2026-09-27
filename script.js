// Erva Şengül — portfolio v3 behavior
// nav state · scroll reveals · work accordion · cursor image preview · email obfuscation

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
          clock.textContent = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul'
          }).format(new Date()) + ' IST';
        } catch (e) { clock.textContent = ''; }
      };
      tick();
      setInterval(tick, 30000);
    }

    // --- nav scrolled state ---
    var nav = document.querySelector('.site-nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 10); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
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
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      targets.forEach(function (el) { io.observe(el); });
    }

    // --- work accordion ---
    var items = document.querySelectorAll('.work-item');
    items.forEach(function (item) {
      var row = item.querySelector('.work-row');
      if (!row) return;
      row.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (other) {
          other.classList.remove('open');
          var r = other.querySelector('.work-row');
          if (r) r.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          row.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // --- floating cursor preview (fine pointers only) ---
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var preview = document.querySelector('.work-preview');
    if (preview && finePointer && !reduced) {
      var imgs = preview.querySelectorAll('img');
      var mouseX = 0, mouseY = 0, curX = 0, curY = 0, rafOn = false;

      function loop() {
        curX += (mouseX - curX) * 0.12;
        curY += (mouseY - curY) * 0.12;
        preview.style.transform =
          'translate(' + (curX + 28) + 'px, ' + (curY - preview.offsetHeight / 2) + 'px)' +
          (preview.classList.contains('on') ? ' scale(1)' : ' scale(0.9)');
        requestAnimationFrame(loop);
      }

      window.addEventListener('mousemove', function (e) {
        mouseX = Math.min(e.clientX, window.innerWidth - preview.offsetWidth - 48);
        mouseY = Math.max(preview.offsetHeight / 2 + 8,
                 Math.min(e.clientY, window.innerHeight - preview.offsetHeight / 2 - 8));
        if (!rafOn) { rafOn = true; curX = mouseX; curY = mouseY; loop(); }
      }, { passive: true });

      items.forEach(function (item) {
        var row = item.querySelector('.work-row');
        var key = item.getAttribute('data-preview');
        if (!row || !key) return;
        row.addEventListener('mouseenter', function () {
          if (item.classList.contains('open')) return;
          imgs.forEach(function (img) {
            img.classList.toggle('show', img.getAttribute('data-key') === key);
          });
          preview.classList.add('on');
        });
        row.addEventListener('mouseleave', function () {
          preview.classList.remove('on');
        });
        // hide preview once a case is opened
        row.addEventListener('click', function () {
          preview.classList.remove('on');
        });
      });
    }
  });
})();
