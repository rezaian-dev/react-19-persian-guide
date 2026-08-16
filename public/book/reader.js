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

  if (jump) jump.addEventListener('change', () => {
    if (!jump.value) return;
    document.querySelector(jump.value)?.scrollIntoView({ block: 'start' });
    jump.selectedIndex = 0;
  });

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
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
  }
})();
