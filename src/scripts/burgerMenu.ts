const BODY_LOCK_PROPS = ['overflow', 'position', 'width', 'top'] as const;

let globalListenersBound = false;

function lockBody(locked: boolean): void {
  const lockedValues = { overflow: 'hidden', position: 'fixed', width: '100%', top: '0' };
  for (const prop of BODY_LOCK_PROPS) {
    document.body.style[prop] = locked ? lockedValues[prop] : '';
  }
}

function placeMenuBelowHeader(btn: HTMLButtonElement, menu: HTMLElement): void {
  const header = btn.closest('header');
  if (header) menu.style.setProperty('--menu-top', `${header.offsetHeight}px`);
}

function close(btn: HTMLButtonElement, menu: HTMLElement): void {
  menu.classList.remove('open');
  btn.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');
  lockBody(false);
}

function findOpenBurger(): { btn: HTMLButtonElement; menu: HTMLElement } | null {
  const btn = document.querySelector<HTMLButtonElement>('.mobile-menu-btn[aria-expanded="true"]');
  const menuId = btn?.getAttribute('aria-controls');
  const menu = menuId ? document.getElementById(menuId) : null;
  return btn && menu ? { btn, menu } : null;
}

function handleResize(): void {
  const open = findOpenBurger();
  if (open) placeMenuBelowHeader(open.btn, open.menu);
}

// Escape closes and refocuses the burger; Tab cycles burger -> items -> burger
function handleKeydown(e: KeyboardEvent): void {
  const open = findOpenBurger();
  if (!open) return;
  const { btn, menu } = open;

  if (e.key === 'Escape') {
    close(btn, menu);
    btn.focus();
    return;
  }

  if (e.key !== 'Tab') return;

  const items = menu.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
  const cycle: HTMLElement[] = [btn, ...Array.from(items)];
  const first = cycle[0];
  const last = cycle[cycle.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function bindBurger(btn: HTMLButtonElement): void {
  if (btn.dataset.burgerBound === 'true') return;
  const menuId = btn.getAttribute('aria-controls');
  const menu = menuId ? document.getElementById(menuId) : null;
  if (!menu) return;
  btn.dataset.burgerBound = 'true';

  function toggle(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = menu!.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    lockBody(isOpen);
    if (isOpen) placeMenuBelowHeader(btn, menu!);
  }

  btn.addEventListener('click', toggle, false);
  btn.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      toggle(e);
    },
    { passive: false }
  );

  menu.querySelectorAll('a, button[data-tab]').forEach((item) => {
    item.addEventListener('click', () => close(btn, menu), false);
  });

  menu.addEventListener(
    'click',
    (e) => {
      if (e.target === menu) close(btn, menu);
    },
    false
  );
}

export function initBurgerMenu(): void {
  if (!globalListenersBound) {
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeydown);
    globalListenersBound = true;
  }
  document.querySelectorAll<HTMLButtonElement>('.mobile-menu-btn').forEach(bindBurger);
}
