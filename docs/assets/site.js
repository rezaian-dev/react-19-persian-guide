(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');

  if (!header) return;

  const closeMenu = () => {
    header.classList.remove('is-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'بازکردن منو');
    }
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const willOpen = !header.classList.contains('is-open');
      header.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.setAttribute('aria-label', willOpen ? 'بستن منو' : 'بازکردن منو');
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    const desktopQuery = window.matchMedia('(min-width: 861px)');
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', closeMenu);
    else desktopQuery.addListener(closeMenu);
  }

  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
})();
