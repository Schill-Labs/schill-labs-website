/* ==========================================================================
   SCHILL LABS — site scripts (no dependencies)
   ========================================================================== */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    const setOpen = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
      menu.inert = !open;
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        const first = menu.querySelector('a');
        if (first) first.focus();
      }
    };
    menu.inert = true;
    menu.setAttribute('aria-hidden', 'true');
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { setOpen(false); burger.focus(); }));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); burger.focus(); }
    });
    window.matchMedia('(min-width:921px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.rv');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Card cursor spotlight ---------- */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Hero particles ---------- */
  const canvas = document.getElementById('particles');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['198,188,255', '245,240,232', '169,157,245'];
    let w, h, dpr, parts = [], mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.floor((w * h) / 16000));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        a: Math.random() * 0.5 + 0.15,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    canvas.parentElement.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });

    let last = 0;
    const tick = (t) => {
      if (t - last < 1000 / 60) { requestAnimationFrame(tick); return; }
      last = t;
      ctx.clearRect(0, 0, w, h);

      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        // gentle mouse drift
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500) { p.x += dx / Math.sqrt(d2 + 0.01) * 0.6; p.y += dy / Math.sqrt(d2 + 0.01) * 0.6; }
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        const tw = 0.65 + Math.sin(p.tw) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a * tw})`;
        ctx.fill();
      }
      // constellation lines
      ctx.lineWidth = 0.5;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 10000) {
            ctx.strokeStyle = `rgba(198,188,255,${0.08 * (1 - d2 / 10000)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    };

    resize();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    requestAnimationFrame(tick);
  }

  /* ---------- Newsletter / notify forms ----------
     Posts to FORM_ENDPOINT once one is configured (e.g. Formspree).
     Until then the form says so honestly instead of faking a signup. */
  const FORM_ENDPOINT = ''; // e.g. 'https://formspree.io/f/xxxxxxx'
  const CONTACT_EMAIL = 'hello@schilllabs.com';

  document.querySelectorAll('form.subscribe').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const msg = form.parentElement.querySelector('.form-msg');
    if (input) {
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        if (msg) msg.textContent = '';
      });
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!input) return;
      const email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        if (msg) msg.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      const topic = form.dataset.topic || 'Schill Labs updates';
      if (FORM_ENDPOINT) {
        try {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, topic }),
          });
          if (!res.ok) throw new Error('bad status');
          form.reset();
          if (msg) msg.textContent = "You're on the list. Talk soon.";
        } catch {
          if (msg) msg.textContent = 'Hmm, that didn’t go through — try again in a minute.';
        }
      } else {
        if (msg) msg.textContent = `Not collecting addresses just yet — email ${CONTACT_EMAIL} and I'll add you to the launch list.`;
      }
    });
  });

  /* ---------- Featured games showcase ----------
     Crossfading slides with a progress bar per tab. Videos load only when their
     slide is shown. Reduced motion: no auto-advance and no video, posters only. */
  const playVideo = (v) => {
    if (!v || reduceMotion) return;
    if (!v.src && v.dataset.src) {
      v.src = v.dataset.src;
      v.addEventListener('playing', () => v.classList.add('ready'), { once: true });
    }
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const stopVideo = (v) => { if (v && !v.paused) v.pause(); };

  const showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    const slides = [...showcase.querySelectorAll('.slide')];
    const tabs = [...showcase.querySelectorAll('.showcase-tab')];
    const pauseBtn = showcase.querySelector('.showcase-pause');
    let idx = 0, userPaused = false;

    slides.forEach((s, i) => {
      s.hidden = false;
      if (i !== 0) { s.inert = true; s.setAttribute('aria-hidden', 'true'); }
    });

    const show = (n, focusTab) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const on = i === idx;
        s.classList.toggle('is-active', on);
        s.inert = !on;
        s.setAttribute('aria-hidden', String(!on));
        const v = s.querySelector('video');
        if (on) playVideo(v); else stopVideo(v);
      });
      tabs.forEach((t, i) => {
        const on = i === idx;
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      void tabs[idx].offsetWidth; // restart the progress-bar animation
      tabs[idx].classList.add('is-active');
      if (focusTab) tabs[idx].focus();
    };

    const setPaused = (p) => {
      showcase.classList.toggle('paused', p);
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', String(p));
        pauseBtn.setAttribute('aria-label', p ? 'Play the slideshow' : 'Pause the slideshow');
      }
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); }
      });
      const bar = t.querySelector('.tab-bar i');
      if (bar) bar.addEventListener('animationend', () => { if (t.classList.contains('is-active')) show(idx + 1); });
    });

    if (reduceMotion) {
      showcase.classList.add('static');
      if (pauseBtn) pauseBtn.hidden = true;
    } else {
      if (pauseBtn) pauseBtn.addEventListener('click', () => { userPaused = !userPaused; setPaused(userPaused); });
      showcase.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) setPaused(true); });
      showcase.addEventListener('focusout', (e) => { if (!showcase.contains(e.relatedTarget)) setPaused(userPaused); });
      document.addEventListener('visibilitychange', () => setPaused(document.hidden || userPaused));
    }
    show(0);
  }

  /* ---------- Background videos on game pages and feature rows ---------- */
  document.querySelectorAll('video[data-autoplay]').forEach((v) => playVideo(v));
  document.querySelectorAll('video[data-hover-play]').forEach((v) => {
    const host = v.closest('a, .card') || v.parentElement;
    host.addEventListener('pointerenter', () => playVideo(v));
    host.addEventListener('pointerleave', () => stopVideo(v));
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
