// script.js — improved dropdown (keputusanmu sebelumnya) + robust responsive carousel
document.addEventListener('DOMContentLoaded', function () {
  /* ---------------- mobile menu toggle ---------------- */
  const mobileBtn = document.getElementById('btnMobile');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  }

  /* ---------------- dropdown behavior (unchanged) ---------------- */
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  function closeAllDropdowns() {
    dropdowns.forEach(d => {
      d.classList.remove('open');
      d.setAttribute('aria-expanded', 'false');
    });
  }
  document.addEventListener('click', function (ev) {
    let clickedInsideAny = false;
    dropdowns.forEach(d => { if (d.contains(ev.target)) clickedInsideAny = true; });
    if (!clickedInsideAny) closeAllDropdowns();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeAllDropdowns(); });
  dropdowns.forEach(dd => {
    const btn = dd.querySelector('.nav-link-btn');
    const panel = dd.querySelector('.dropdown-panel');
    let closeTimer = null;
    const openDropdown = () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } dd.classList.add('open'); dd.setAttribute('aria-expanded', 'true'); };
    const closeDropdown = () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } dd.classList.remove('open'); dd.setAttribute('aria-expanded', 'false'); };
    dd.addEventListener('mouseenter', openDropdown);
    dd.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => closeDropdown(), 140); });
    if (panel) {
      panel.addEventListener('mouseenter', () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } openDropdown(); });
      panel.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => closeDropdown(), 140); });
    }
    if (btn) {
      btn.addEventListener('touchstart', function (e) {
        const isOpen = dd.classList.contains('open');
        if (!isOpen) { openDropdown(); e.preventDefault(); e.stopPropagation(); }
      }, { passive: false });
      btn.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          dd.classList.toggle('open');
          dd.setAttribute('aria-expanded', dd.classList.contains('open') ? 'true' : 'false');
          ev.preventDefault();
        }
      });
    }
  });

  /* ---------------- improved news carousel ---------------- */
  (function initNewsCarousel() {
    const wrapper = document.querySelector('.news-wrapper');
    const track = document.querySelector('.news-track');
    const dotsContainer = document.querySelector('.news-dots');
    if (!wrapper || !track || !dotsContainer) return;

    const slides = Array.from(track.children);
    const slideCount = slides.length;
    if (slideCount === 0) return;

    // responsive slidesPerView logic
    function getSlidesPerView() {
      const w = window.innerWidth;
      if (w >= 1024) return 3;
      if (w >= 768) return 2;
      return 1;
    }

    let slidesPerView = getSlidesPerView();
    let index = 0; // page index: 0..(pages-1)
    let timer = null;
    const intervalMs = 5000;
    const transitionMs = 900;

    // compute numeric gap (px) from CSS
    function getGapPx() {
      const cs = getComputedStyle(track);
      const gap = cs.gap || cs.columnGap || '0px';
      return parseFloat(gap) || 0;
    }

    // build dots according to pages (pages = slideCount - slidesPerView + 1)
    function pagesCount(spv) {
      return Math.max(1, slideCount - spv + 1);
    }

    function rebuildDots() {
      dotsContainer.innerHTML = '';
      const pages = pagesCount(slidesPerView);
      for (let i = 0; i < pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dot';
        b.dataset.index = i;
        b.setAttribute('aria-label', 'Slide group ' + (i+1));
        b.addEventListener('click', () => {
          goTo(i);
          restartAuto();
        });
        dotsContainer.appendChild(b);
      }
      updateDots();
    }

    function updateDots() {
      const dots = Array.from(dotsContainer.children);
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    // measure slide width (including gap)
    function measure() {
      const first = slides[0];
      if (!first) return { slideW: 0, gap: 0 };
      const slideRect = first.getBoundingClientRect();
      const slideW = slideRect.width;
      const gap = getGapPx();
      return { slideW, gap };
    }

    // perform transform to show page index
    function applyTransform() {
      const { slideW, gap } = measure();
      const shift = index * (slideW + gap);
      track.style.transition = `transform ${transitionMs}ms cubic-bezier(.22,.9,.26,1)`;
      track.style.transform = `translateX(-${shift}px)`;
    }

    function goTo(i) {
      const maxIndex = pagesCount(slidesPerView) - 1;
      index = Math.max(0, Math.min(i, maxIndex));
      applyTransform();
      updateDots();
    }

    function next() {
      const pages = pagesCount(slidesPerView);
      index = (index + 1) % pages;
      applyTransform();
      updateDots();
    }

    function startAuto() {
      stopAuto();
      timer = setInterval(() => { next(); }, intervalMs);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function restartAuto() { stopAuto(); startAuto(); }

    // pause on hover
    wrapper.addEventListener('mouseenter', () => stopAuto());
    wrapper.addEventListener('mouseleave', () => startAuto());

    // handle resize: recalc slidesPerView and ensure correct index/page
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const oldSpv = slidesPerView;
        slidesPerView = getSlidesPerView();
        const oldPages = pagesCount(oldSpv);
        const newPages = pagesCount(slidesPerView);
        // if index would be out of range, clamp it
        if (index > newPages - 1) index = newPages - 1;
        // rebuild dots and reapply transform
        rebuildDots();
        applyTransform();
      }, 120);
    });

    // initial setup
    slidesPerView = getSlidesPerView();
    rebuildDots();
    // ensure track has no inline transform at start
    track.style.transform = 'translateX(0)';
    // small delay to allow layout, then start auto
    setTimeout(() => {
      applyTransform();
      startAuto();
    }, 60);

    // back-to-top behaviour
const btnTop = document.getElementById('btnTop');
if (btnTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 360) btnTop.classList.add('show');
    else btnTop.classList.remove('show');
  });
  btnTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// set copyright year
document.getElementById && (document.getElementById('year').textContent = new Date().getFullYear());

  })();

}); // DOMContentLoaded end
