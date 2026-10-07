(() => {
  'use strict';

  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header state. Avoid blend-mode colour shifts over photography.
  const header = q('.site-header');
  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 36);
  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();

  // Loader only needs the full animation once per tab/session.
  const loader = q('.loader');
  const finishIntro = () => {
    loader?.classList.add('is-done');
    document.body.classList.add('page-ready');
    if (loader) window.setTimeout(() => loader.setAttribute('aria-hidden', 'true'), 1100);
  };

  const startIntro = () => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('monroo-intro-seen') === '1';
      sessionStorage.setItem('monroo-intro-seen', '1');
    } catch (_) {}
    window.setTimeout(finishIntro, reduce || seen ? 40 : 620);
  };

  if (document.readyState === 'complete') startIntro();
  else window.addEventListener('load', startIntro, { once: true });
  if (!loader) document.body.classList.add('page-ready');

  // Mobile menu
  const menuBtn = q('.menu-toggle');
  const menu = q('.mobile-menu');
  const setMenu = (open) => {
    menuBtn?.classList.toggle('is-open', open);
    menu?.classList.toggle('is-open', open);
    document.body.classList.toggle('no-scroll', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
    menuBtn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn?.addEventListener('click', () => setMenu(!menuBtn.classList.contains('is-open')));
  qa('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuBtn?.classList.contains('is-open')) setMenu(false);
  });

  // Page transition for internal links only.
  qa('a[href]').forEach(a => a.addEventListener('click', e => {
    if (reduce || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('https://wa.me')) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    window.setTimeout(() => { window.location.href = href; }, 430);
  }));

  // Scroll progress
  const progress = q('.scroll-progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal observer with a safe fallback so text never remains invisible.
  const revealItems = qa('[data-reveal], .image-reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -3% 0px' });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  // Hero crossfade
  const slides = qa('.hero__slide');
  let slideIndex = 0;
  if (slides.length > 1 && !reduce) {
    window.setInterval(() => {
      slides[slideIndex].classList.remove('is-active');
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add('is-active');
    }, 5400);
  }

  // Horizontal scrolling gallery
  const horizontalSection = q('.horizontal');
  const track = q('.horizontal__track');
  const updateHorizontal = () => {
    if (!horizontalSection || !track || window.innerWidth < 981 || reduce) return;
    const rect = horizontalSection.getBoundingClientRect();
    const maxScroll = horizontalSection.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const p = Math.min(1, Math.max(0, -rect.top / maxScroll));
    const travel = Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * 0.08);
    track.style.transform = `translate3d(${-travel * p}px,0,0)`;
  };
  window.addEventListener('scroll', updateHorizontal, { passive: true });
  window.addEventListener('resize', updateHorizontal);
  updateHorizontal();

  // Gentle parallax
  const parallaxItems = qa('[data-parallax]');
  const updateParallax = () => {
    if (reduce) return;
    parallaxItems.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
      const p = r.top / window.innerHeight - 0.5;
      el.style.transform = `translate3d(0,${p * -30}px,0) scale(1.04)`;
    });
  };
  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();

  // Custom cursor. Do not show a half-circle at the top-left before first movement.
  const cursor = q('.cursor');
  const cursorDot = q('.cursor-dot');
  let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, cursorStarted = false;
  if (cursor && cursorDot && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px,${mouseY}px) translate(-50%,-50%)`;
      if (!cursorStarted) {
        cursorStarted = true;
        cursorX = mouseX;
        cursorY = mouseY;
        cursor.classList.add('is-active');
        cursorDot.classList.add('is-active');
      }
    }, { passive: true });
    const tick = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.transform = `translate(${cursorX}px,${cursorY}px) translate(-50%,-50%)`;
      window.requestAnimationFrame(tick);
    };
    tick();
    qa('a, button, .gallery-item').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  // Magnetic buttons
  if (window.matchMedia('(pointer:fine)').matches && !reduce) {
    qa('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.10}px,${y * 0.12}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // Lightbox
  const lightbox = q('.lightbox');
  const lightboxImage = q('.lightbox img');
  const lightboxCount = q('.lightbox__count');
  const galleryImages = qa('.gallery-item img');
  let galleryIndex = 0;
  const closeLightbox = () => {
    lightbox?.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  };
  const showImage = i => {
    if (!lightbox || !lightboxImage || !galleryImages.length) return;
    galleryIndex = (i + galleryImages.length) % galleryImages.length;
    lightboxImage.src = galleryImages[galleryIndex].src;
    lightboxImage.alt = galleryImages[galleryIndex].alt || '';
    if (lightboxCount) lightboxCount.textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(galleryImages.length).padStart(2, '0')}`;
    lightbox.classList.add('is-open');
    document.body.classList.add('no-scroll');
  };
  galleryImages.forEach((img, i) => img.closest('.gallery-item')?.addEventListener('click', () => showImage(i)));
  q('.lightbox__close')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  window.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showImage(galleryIndex + 1);
    if (e.key === 'ArrowLeft') showImage(galleryIndex - 1);
  });


  // Pricing tabs
  const tabs = qa('.guide-tab');
  const panels = qa('.guide-panel');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(x => {
      x.classList.remove('is-active');
      x.setAttribute('aria-selected', 'false');
    });
    panels.forEach(x => x.classList.remove('is-active'));
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    q('#' + tab.dataset.tab)?.classList.add('is-active');
  }));
})();
