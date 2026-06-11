/* ============================================================
   main.js — no framework, no build step
   All behaviour is isolated in an IIFE to avoid global leaks.
   ============================================================ */

(function () {
  'use strict';

  const SCROLL_THRESHOLD  = 50;          // px before navbar shrinks
  const LANG_STORAGE_KEY  = 'tf_lang';
  const LANG_DEFAULT      = 'pt';

  const navbar        = document.getElementById('navbar');
  const logoImg       = document.getElementById('navbar-logo-img');
  const hamburgerBtn  = document.getElementById('hamburger-btn');
  const mobileNav     = document.getElementById('mobile-nav');

  // both desktop and mobile buttons call the same applyLanguage handler
  const langBtnsPT    = document.querySelectorAll('#lang-pt-desktop, #lang-pt-mobile');
  const langBtnsFR    = document.querySelectorAll('#lang-fr-desktop, #lang-fr-mobile');

  const translatableEls = document.querySelectorAll('[data-pt], [data-fr]');

  /* ----------------------------------------------------------
     1. NAVBAR SCROLL
        .scrolled switches to frosted glass at SCROLL_THRESHOLD px
        so the navbar doesn't visually compete with the hero.
     ---------------------------------------------------------- */
  function onScroll () {
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // passive: scroll handlers can't call preventDefault — marks them as safe to optimise
  window.addEventListener('scroll', onScroll, { passive: true });

  // run once on load in case the page is already scrolled (e.g. browser restores position)
  onScroll();

  /* ----------------------------------------------------------
     2. HAMBURGER MENU
     ---------------------------------------------------------- */
  function openMobileNav () {
    mobileNav.classList.add('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // stops the page scrolling behind the open menu
  }

  function closeMobileNav () {
    mobileNav.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMobileNav () {
    const isOpen = mobileNav.classList.contains('is-open');
    if (isOpen) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', toggleMobileNav);

    mobileNav.querySelectorAll('.navbar__mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', function (e) {
      if (
        mobileNav.classList.contains('is-open') &&
        !mobileNav.contains(e.target) &&
        !hamburgerBtn.contains(e.target)
      ) {
        closeMobileNav();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        closeMobileNav();
        hamburgerBtn.focus();
      }
    });
  }

  // at desktop width the hamburger is hidden, so close before the layout switch to avoid a stale open state
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768 && mobileNav.classList.contains('is-open')) {
      closeMobileNav();
    }
  }, { passive: true });

  /* ----------------------------------------------------------
     3. LANGUAGE TOGGLE
        text nodes and placeholders swap in-place; the SVG logo
        switches to a separate file per language; the choice is
        stored so the next page load starts in the right language.
     ---------------------------------------------------------- */
  function applyLanguage (lang) {
    const isFR = lang === 'fr';

    // lang-fr drives CSS-only overrides, e.g. smaller font size for longer French text
    document.body.classList.toggle('lang-fr', isFR);

    translatableEls.forEach(function (el) {
      const text = isFR ? el.dataset.fr : el.dataset.pt;
      if (text !== undefined) {
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', text);
        } else if (el.children.length === 0) {
          el.textContent = text;
        } else {
          for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) {
              el.childNodes[i].nodeValue = text;
              break;
            }
          }
        }
      }
    });

    langBtnsPT.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isFR ? 'false' : 'true');
      btn.classList.toggle('is-active', !isFR);
    });
    langBtnsFR.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isFR ? 'true' : 'false');
      btn.classList.toggle('is-active', isFR);
    });

    // keeps screen readers and search engines in sync with the visible language
    document.documentElement.lang = isFR ? 'fr' : 'pt';

    if (logoImg) {
      logoImg.src = 'assets/images/Logo_Tania_' + (isFR ? 'FR' : 'PT') + '.svg';
    }

    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {
      // localStorage is blocked in some privacy contexts — silently skip
    }
  }

  function initLanguage () {
    let savedLang = LANG_DEFAULT;
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'pt' || stored === 'fr') {
        savedLang = stored;
      }
    } catch (_) { /* ignore */ }

    applyLanguage(savedLang);
  }

  langBtnsPT.forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage('pt'); });
  });

  langBtnsFR.forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage('fr'); });
  });

  initLanguage();

  /* ----------------------------------------------------------
     4. ACTIVE NAV LINK
        IntersectionObserver tracks visible sections; without it
        the initial is-active class stays on the first link only.
     ---------------------------------------------------------- */
  (function initActiveNav () {
    var sections = document.querySelectorAll('main section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var allNavLinks = document.querySelectorAll(
      '.navbar__nav-link, .navbar__mobile-nav-link'
    );

    function setActive (id) {
      allNavLinks.forEach(function (link) {
        var href    = link.getAttribute('href');
        var isMatch = href === '#' + id;
        link.classList.toggle('is-active', isMatch);
        if (isMatch) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    // multiple sections can be intersecting at once — topmost one wins
    var intersecting = new Set();

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });

        var activeId = null;
        sections.forEach(function (section) {
          if (!activeId && intersecting.has(section.id)) {
            activeId = section.id;
          }
        });

        if (activeId) {
          setActive(activeId);
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }());

  /* ----------------------------------------------------------
     5. SCROLL INDICATOR
        clicking the chevron jumps past the hero so the
        decorative indicator is also functional.
     ---------------------------------------------------------- */
  (function initScrollIndicator () {
    var indicator = document.querySelector('.hero__scroll-indicator');
    var target    = document.getElementById('quote-transition');
    if (!indicator || !target) return;

    indicator.addEventListener('click', function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }());

  /* ----------------------------------------------------------
     6. SOBRE MIM EXPAND / COLLAPSE
        button text is driven by CSS via aria-expanded so the
        language toggle keeps working without extra JS logic.
     ---------------------------------------------------------- */
  (function initSobreToggle () {
    var btn   = document.getElementById('sobre-toggle-btn');
    var extra = document.getElementById('sobre-extra');
    if (!btn || !extra) return;

    btn.addEventListener('click', function () {
      var isExpanded = btn.getAttribute('aria-expanded') === 'true';
      var newState   = !isExpanded;

      btn.setAttribute('aria-expanded', String(newState));
      extra.classList.toggle('is-visible', newState);
      extra.setAttribute('aria-hidden', String(!newState));
    });
  }());

  /* ----------------------------------------------------------
     7. SPLIDE CAROUSELS
        Serviços and Especialidades share a config; Feedback
        gets pagination dots so its shorter card count is clear.
     ---------------------------------------------------------- */
  (function initCarousels () {
    var carouselConfig = {
      type: 'loop',
      perPage: 3,
      perMove: 1,
      focus: 'center',
      gap: '2rem',
      arrows: true,
      pagination: false,
      breakpoints: {
        767:  { perPage: 1, gap: '1rem' },
        1023: { perPage: 2, gap: '1.5rem' }
      }
    };

    var servicosEl = document.getElementById('servicos-carousel');
    if (servicosEl && typeof Splide !== 'undefined') {
      new Splide(servicosEl, carouselConfig).mount();
    }

    var especialidadesEl = document.getElementById('especialidades-carousel');
    if (especialidadesEl && typeof Splide !== 'undefined') {
      new Splide(especialidadesEl, carouselConfig).mount();
    }

    var feedbackEl = document.getElementById('feedback-carousel');
    if (feedbackEl && typeof Splide !== 'undefined') {
      new Splide(feedbackEl, {
        type: 'loop',
        perPage: 3,
        perMove: 1,
        focus: 'center',
        gap: '1.5rem',
        arrows: true,
        pagination: true,
        breakpoints: {
          767:  { perPage: 1, gap: '1rem' },
          1023: { perPage: 2, gap: '1.5rem' }
        }
      }).mount();
    }
  }());

}());
