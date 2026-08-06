/* ==========================================================================
   SCHILL LABS — site scripts (no dependencies)
   ========================================================================== */
(() => {
  'use strict';

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
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
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

  /* ---------- Tilt ---------- */
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.tilt').forEach((el) => {
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${y * -6}deg) translateY(-3px)`;
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ---------- Hero particles ---------- */
  const canvas = document.getElementById('particles');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['94,225,255', '124,140,255', '255,158,74'];
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
      if (document.hidden) { requestAnimationFrame(tick); return; }
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
            ctx.strokeStyle = `rgba(124,140,255,${0.08 * (1 - d2 / 10000)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  /* ---------- Newsletter / notify forms ----------
     Zero-backend by default: falls back to a prefilled email draft.
     To upgrade: create a free form endpoint (e.g. Formspree) and paste it below. */
  const FORM_ENDPOINT = ''; // e.g. 'https://formspree.io/f/xxxxxxx'
  const CONTACT_EMAIL = 'hello@schilllabs.com';

  document.querySelectorAll('form.subscribe').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = form.parentElement.querySelector('.form-msg');
      const email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (msg) msg.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
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
        const subject = encodeURIComponent(`Subscribe: ${topic}`);
        const body = encodeURIComponent(`Please add ${email} to the ${topic} list.\n\n(Sent from schilllabs.com)`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        if (msg) msg.textContent = 'Opening your email app to confirm…';
      }
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
