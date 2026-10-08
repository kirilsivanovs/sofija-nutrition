const BODY_LOCK_PROPS = ['overflow', 'position', 'width', 'top'] as const;

let globalListenersBound = false;
let lockedScrollY: number | null = null;

// A fixed body drops the scroll offset, so it is stored here and put back on unlock
function lockBody(): void {
  if (lockedScrollY !== null) return;
  lockedScrollY = window.scrollY;
  const lockedValues = {
    overflow: 'hidden',
    position: 'fixed',
    width: '100%',
    top: `${-lockedScrollY}px`,
  };
  for (const prop of BODY_LOCK_PROPS) {
    document.body.style[prop] = lockedValues[prop];
  }
}

// 'instant' because global.css sets smooth scrolling, which would animate down from the top
function unlockBody(): void {
  for (const prop of BODY_LOCK_PROPS) {
    document.body.style[prop] = '';
  }
  if (lockedScrollY === null) return;
  window.scrollTo({ top: lockedScrollY, behavior: 'instant' });
  lockedScrollY = null;
}

function placeMenuBelowHeader(btn: HTMLButtonElement, menu: HTMLElement): void {
  const header = btn.closest('header');
  if (header) menu.style.setProperty('--menu-top', `${header.offsetHeight}px`);
}

function close(btn: HTMLButtonElement, menu: HTMLElement): void {
  menu.classList.remove('open');
  btn.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');
  unlockBody();
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

// Escape closes and refocuses the burger; Tab cycles burger -> items -> burger.
// preventScroll: focusing the burger would otherwise scroll it into view and undo the restored position
function handleKeydown(e: KeyboardEvent): void {
  const open = findOpenBurger();
  if (!open) return;
  const { btn, menu } = open;

  if (e.key === 'Escape') {
    close(btn, menu);
    btn.focus({ preventScroll: true });
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
    if (isOpen) lockBody();
    else unlockBody();
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
