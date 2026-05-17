/* ============================================================
   TÂNIA FERREIRA — PSICÓLOGA CLÍNICA
   main.js — Hamburger menu, language toggle, navbar scroll
   Vanilla JS, no dependencies
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTS
     ---------------------------------------------------------- */
  const SCROLL_THRESHOLD  = 50;          // px before navbar shrinks
  const LANG_STORAGE_KEY  = 'tf_lang';   // localStorage key
  const LANG_DEFAULT      = 'pt';

  /* ----------------------------------------------------------
     ELEMENT REFS
     ---------------------------------------------------------- */
  const navbar        = document.getElementById('navbar');
  const hamburgerBtn  = document.getElementById('hamburger-btn');
  const mobileNav     = document.getElementById('mobile-nav');

  // All lang buttons (desktop + mobile share the same logic)
  const langBtnsPT    = document.querySelectorAll('#lang-pt-desktop, #lang-pt-mobile');
  const langBtnsFR    = document.querySelectorAll('#lang-fr-desktop, #lang-fr-mobile');

  // All elements that carry translatable text via data attributes
  const translatableEls = document.querySelectorAll('[data-pt], [data-fr]');

  /* ----------------------------------------------------------
     1. NAVBAR SCROLL BEHAVIOUR
        Adds / removes .scrolled class on the navbar when the
        page scrolls past SCROLL_THRESHOLD pixels.
     ---------------------------------------------------------- */
  function onScroll () {
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Passive listener — no need to call preventDefault
  window.addEventListener('scroll', onScroll, { passive: true });

  // Run once on load in case the page is already scrolled
  onScroll();

  /* ----------------------------------------------------------
     2. HAMBURGER MENU TOGGLE
     ---------------------------------------------------------- */
  function openMobileNav () {
    mobileNav.classList.add('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent background scroll
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

    // Close when a mobile nav link is clicked
    mobileNav.querySelectorAll('.navbar__mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });

    // Close when clicking outside the nav area
    document.addEventListener('click', function (e) {
      if (
        mobileNav.classList.contains('is-open') &&
        !mobileNav.contains(e.target) &&
        !hamburgerBtn.contains(e.target)
      ) {
        closeMobileNav();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        closeMobileNav();
        hamburgerBtn.focus();
      }
    });
  }

  // Close mobile nav on resize to desktop breakpoint
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768 && mobileNav.classList.contains('is-open')) {
      closeMobileNav();
    }
  }, { passive: true });

  /* ----------------------------------------------------------
     3. LANGUAGE TOGGLE (PT / FR)
        - Swaps visible text for all [data-pt] / [data-fr] els
        - Toggles body class for CSS-driven display switching
        - Persists choice in localStorage
     ---------------------------------------------------------- */
  function applyLanguage (lang) {
    const isFR = lang === 'fr';

    // Toggle body class — CSS handles data-pt / data-fr visibility
    document.body.classList.toggle('lang-fr', isFR);

    // Update text content of all translatable elements
    translatableEls.forEach(function (el) {
      const text = isFR ? el.dataset.fr : el.dataset.pt;
      if (text !== undefined) {
        el.textContent = text;
      }
    });

    // Update aria-pressed on all lang buttons
    langBtnsPT.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isFR ? 'false' : 'true');
      btn.classList.toggle('is-active', !isFR);
    });
    langBtnsFR.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isFR ? 'true' : 'false');
      btn.classList.toggle('is-active', isFR);
    });

    // Update the <html lang> attribute for accessibility / SEO
    document.documentElement.lang = isFR ? 'fr' : 'pt';

    // Persist
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {
      // localStorage may be unavailable in some contexts — fail silently
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

  // Wire up PT buttons
  langBtnsPT.forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage('pt'); });
  });

  // Wire up FR buttons
  langBtnsFR.forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage('fr'); });
  });

  // Apply stored / default language on page load
  initLanguage();

  /* ----------------------------------------------------------
     4. ACTIVE NAV LINK — highlight based on scroll position
        Uses IntersectionObserver when available, otherwise
        falls back to no highlighting beyond initial state.
     ---------------------------------------------------------- */
  (function initActiveNav () {
    const sections = document.querySelectorAll('main section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const allNavLinks = document.querySelectorAll(
      '.navbar__nav-link, .navbar__mobile-nav-link'
    );

    function setActive (id) {
      allNavLinks.forEach(function (link) {
        const href = link.getAttribute('href');
        const isMatch = href === '#' + id;
        link.classList.toggle('is-active', isMatch);
        if (isMatch) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }());

  /* ----------------------------------------------------------
     5. SPLIDE CAROUSELS — Serviços & Especialidades
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
