/*
 * Portfolio behaviour.
 *
 * Design rule: the page is fully readable without this file. Everything here is
 * an enhancement, and each feature is isolated so a failure in one cannot stop
 * the others or leave the loader covering the content.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Run a feature without letting its failure take down the rest of the page. */
function safely(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[portfolio] ${name} failed:`, err);
  }
}

/* ---------------------------------------------------------------- Loader -- */

let revealed = false;

function revealPage() {
  if (revealed) return;
  revealed = true;
  document.body.classList.add('loaded');
  safely('typewriter', startTypewriters);
}

// Reveal as soon as the above-the-fold assets are in. The timeout is a hard
// cap so a stalled request can never keep the loader on screen.
window.addEventListener('load', revealPage, { once: true });
setTimeout(revealPage, 2500);

/* ----------------------------------------------------------------- Theme -- */

// The dark/light class is applied by an inline script in index.html so the
// first paint is already correct. This only wires up the toggle.
safely('theme toggle', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  if (!themeToggle) return;

  const syncIcon = () => {
    if (!themeIcon) return;
    const dark = document.body.classList.contains('dark-theme');
    themeIcon.firstElementChild.setAttribute('href', dark ? '#i-sun' : '#i-moon');
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark-theme');
    try {
      localStorage.setItem('theme', dark ? 'dark-theme' : '');
    } catch (e) {
      /* private browsing — the toggle still works for this session */
    }
    syncIcon();
  });

  syncIcon();
});

/* ------------------------------------------------------------ Typewriter -- */

function startTypewriters() {
  const headings = document.querySelectorAll('.typewrite');
  if (prefersReducedMotion) return; // leave the text as-is

  headings.forEach((el, i) => {
    const text = el.textContent;
    // Reserve the final size so revealing characters cannot reflow the page.
    el.style.minHeight = `${el.offsetHeight}px`;
    el.textContent = '';

    let charIndex = 0;
    const start = performance.now() + i * 300;

    const step = (now) => {
      if (now < start) {
        requestAnimationFrame(step);
        return;
      }
      const target = Math.min(text.length, Math.floor((now - start) / 50));
      if (target > charIndex) {
        charIndex = target;
        el.textContent = text.slice(0, charIndex);
      }
      if (charIndex < text.length) {
        requestAnimationFrame(step);
      } else {
        el.textContent = text; // guarantee the full string is present
        el.style.minHeight = '';
      }
    };
    requestAnimationFrame(step);
  });
}

/* ------------------------------------------------- Active nav highlighting -- */

safely('nav highlighting', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a');
  if (!sections.length || !navLinks.length) return;

  // The scrollY > 0 guard matters at load time: before layout settles,
  // scrollHeight can equal innerHeight and every page looks "scrolled to the
  // bottom", which would wrongly highlight Contact on arrival.
  const atPageBottom = () =>
    window.scrollY > 0 &&
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      // At the bottom of the page the scroll handler owns the highlight, so
      // ignore intersection updates there to stop the two fighting.
      if (atPageBottom()) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
  );

  sections.forEach((section) => observer.observe(section));

  // Pin "Contact" once the page is scrolled to the end, where the last section
  // may never cross the observer's threshold. Coalesced into one frame so this
  // does not run layout on every scroll event.
  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (atPageBottom()) setActive('contact');
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
});

/* -------------------------------------------------------- Project filter -- */

safely('project filter', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card-link');
  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      projectCards.forEach((card) => {
        const show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });
});

/* --------------------------------------------------------- Service worker -- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.error('[portfolio] service worker registration failed:', err);
    });
  });
}
