(() => {
  const toc = document.getElementById('toc');
  const scrim = document.getElementById('scrim');
  const btn = document.getElementById('toc-btn');
  const x = document.getElementById('toc-x');
  const jump = document.getElementById('jump');
  const bar = document.getElementById('bar');
  const top = document.getElementById('top');

  const open = () => {
    toc.hidden = false; scrim.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    toc.hidden = true; scrim.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () => (toc.hidden ? open() : close()));
  x.addEventListener('click', close);
  scrim.addEventListener('click', close);
  toc.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !toc.hidden) { close(); btn.focus(); }
  });

  /* --- chapter select (shadcn/ui Select behaviour: keyboard, check, outside-close) --- */
  if (jump && !jump.querySelector('select')) {
    const trigger = jump.querySelector('.select-trigger');
    const value = jump.querySelector('.select-value');
    const pop = jump.querySelector('.select-pop');
    const items = [...jump.querySelectorAll('.select-item')];
    let hl = -1;
    const setHl = (i) => {
      hl = i;
      items.forEach((it, k) => it.classList.toggle('hl', k === i));
      if (i >= 0) {
        // scroll the highlighted row inside the popover only — never the page
        const el = items[i], t = el.offsetTop, b = t + el.offsetHeight;
        if (t < pop.scrollTop) pop.scrollTop = t - 8;
        else if (b > pop.scrollTop + pop.clientHeight) pop.scrollTop = b - pop.clientHeight + 8;
      }
    };
    const setOpen = (o) => {
      pop.hidden = !o;
      trigger.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o) {
        const cur = items.findIndex((it) => it.getAttribute('aria-selected') === 'true');
        setHl(cur >= 0 ? cur : 0);
      } else setHl(-1);
    };
    const pick = (it) => {
      items.forEach((o) => o.setAttribute('aria-selected', o === it ? 'true' : 'false'));
      value.textContent = it.querySelector('.t').textContent;
      value.classList.remove('ph');
      setOpen(false);
      trigger.focus();
      document.querySelector(it.dataset.value)?.scrollIntoView({ block: 'start' });
    };
    trigger.addEventListener('click', () => setOpen(pop.hidden));
    items.forEach((it) => {
      it.addEventListener('click', () => pick(it));
      it.addEventListener('mousemove', () => setHl(items.indexOf(it)));
    });
    document.addEventListener('pointerdown', (e) => {
      if (!pop.hidden && !jump.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (pop.hidden) {
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && document.activeElement === trigger) {
          e.preventDefault(); setOpen(true);
        }
        return;
      }
      if (e.key === 'Escape') { setOpen(false); trigger.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setHl((hl + 1) % items.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((hl - 1 + items.length) % items.length); }
      else if (e.key === 'Home') { e.preventDefault(); setHl(0); }
      else if (e.key === 'End') { e.preventDefault(); setHl(items.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[hl]) pick(items[hl]); }
    });
    // keep the trigger label in sync with the chapter on screen
    window.__selectSync = (id) => {
      const it = items.find((o) => o.dataset.value === '#' + id);
      if (!it) return;
      items.forEach((o) => o.setAttribute('aria-selected', o === it ? 'true' : 'false'));
      value.textContent = it.querySelector('.t').textContent;
      value.classList.remove('ph');
    };
  }

  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  let tick = false;
  const onScroll = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      top.hidden = window.scrollY < 900;
      tick = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // A hash landing happens before the lazy images above it have decoded; once the
  // column has settled, put the chapter head exactly under the bar.
  const settle = (hash) => {
    const el = hash && document.querySelector(hash);
    if (!el) return;
    let n = 0;
    const fix = () => {
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      if (++n < 3) setTimeout(fix, 220);
    };
    setTimeout(fix, 60);
  };
  if (location.hash) {
    addEventListener('load', () => settle(location.hash));
    settle(location.hash);
  }
  addEventListener('hashchange', () => settle(location.hash));

  // highlight the chapter currently on screen
  const heads = [...document.querySelectorAll('.ch-head')];
  const links = new Map([...document.querySelectorAll('.toc-part a')].map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window && heads.length) {
    let active = null;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const a = links.get(en.target.id);
        if (!a || a === active) return;
        active?.classList.remove('on');
        a.classList.add('on');
        active = a;
        window.__selectSync?.(en.target.id);
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
  }
})();
