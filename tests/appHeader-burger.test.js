/**
 * @jest-environment jsdom
 */

/**
 * Unit test for AppHeader burger menu functionality
 * Tests admin panel mobile burger menu behavior
 */

describe('AppHeader Burger Menu', () => {
  let mobileMenuBtn;
  let mobileNavMenu;

  beforeEach(() => {
    // Setup DOM matching AppHeader component structure
    document.body.innerHTML = `
      <header class="app-header app-header--admin">
        <div class="app-header-inner">
          <button
            type="button"
            class="mobile-menu-btn"
            style="-webkit-tap-highlight-color:transparent;touch-action:manipulation;"
            aria-label="Atvērt izvēlni"
            aria-expanded="false"
            aria-controls="mobile-nav-menu-admin"
          >
            <span class="w-6 h-0.5 bg-primary transition-all" style="pointer-events:none;"></span>
            <span class="w-6 h-0.5 bg-primary transition-all" style="pointer-events:none;"></span>
            <span class="w-6 h-0.5 bg-primary transition-all" style="pointer-events:none;"></span>
          </button>
        </div>
      </header>
      <div id="mobile-nav-menu-admin" class="mobile-nav-menu">
        <button class="mobile-nav-item active" data-tab="bookings">Ieraksti</button>
        <button class="mobile-nav-item" data-tab="availability">Pieejamība</button>
        <button class="mobile-nav-item" data-tab="settings">Iestatījumi</button>
      </div>
    `;

    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';

    // Get elements
    mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    mobileNavMenu = document.getElementById('mobile-nav-menu-admin');

    // Initialize the burger menu script (from AppHeader.astro)
    initBurgerMenu();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
  });

  // Burger menu initialization function (matches AppHeader.astro script)
  function initBurgerMenu() {
    const btns = document.querySelectorAll('.mobile-menu-btn');

    btns.forEach(function (btn) {
      const menuId = btn.getAttribute('aria-controls');
      const menu = menuId ? document.getElementById(menuId) : null;
      if (!menu) return;

      function toggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = menu.classList.toggle('open');
        btn.classList.toggle('active', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
        document.body.style.position = isOpen ? 'fixed' : '';
        document.body.style.width = isOpen ? '100%' : '';
        document.body.style.top = isOpen ? '0' : '';
      }

      function close() {
        menu.classList.remove('open');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
      }

      // Add click handler to button
      btn.addEventListener('click', toggle, false);

      // Close on link/button click inside menu
      const links = menu.querySelectorAll('a, button[data-tab]');
      for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('click', close, false);
      }

      // Close on overlay click
      menu.addEventListener(
        'click',
        function (e) {
          if (e.target === menu) close();
        },
        false
      );
    });
  }

  // Initialize immediately (simulating DOMContentLoaded already fired)
  initBurgerMenu();

  describe('Initial State', () => {
    test('burger button should exist', () => {
      expect(mobileMenuBtn).not.toBeNull();
      expect(mobileMenuBtn.tagName).toBe('BUTTON');
    });

    test('mobile menu should exist', () => {
      expect(mobileNavMenu).not.toBeNull();
      expect(mobileNavMenu.id).toBe('mobile-nav-menu-admin');
    });

    test('burger button should have correct aria attributes', () => {
      expect(mobileMenuBtn.getAttribute('aria-label')).toBe('Atvērt izvēlni');
      expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
      expect(mobileMenuBtn.getAttribute('aria-controls')).toBe('mobile-nav-menu-admin');
    });

    test('mobile menu should be closed initially', () => {
      expect(mobileNavMenu.classList.contains('open')).toBe(false);
    });

    test('burger button should not have active class initially', () => {
      expect(mobileMenuBtn.classList.contains('active')).toBe(false);
    });

    test('body should have no overflow restriction initially', () => {
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Opening Menu', () => {
    test('clicking burger button should open menu', () => {
      mobileMenuBtn.click();

      expect(mobileNavMenu.classList.contains('open')).toBe(true);
      expect(mobileMenuBtn.classList.contains('active')).toBe(true);
    });

    test('opening menu should update aria-expanded', () => {
      mobileMenuBtn.click();

      expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('true');
    });

    test('opening menu should lock body scroll', () => {
      mobileMenuBtn.click();

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
      // Browser may add 'px' to numeric values
      expect(document.body.style.top).toMatch(/^0(px)?$/);
    });

    test('opening menu should add active class to burger', () => {
      mobileMenuBtn.click();

      expect(mobileMenuBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('Closing Menu', () => {
    beforeEach(() => {
      // Open menu first
      mobileMenuBtn.click();
    });

    test('clicking burger button again should close menu', () => {
      mobileMenuBtn.click();

      expect(mobileNavMenu.classList.contains('open')).toBe(false);
      expect(mobileMenuBtn.classList.contains('active')).toBe(false);
    });

    test('closing menu should restore body scroll', () => {
      mobileMenuBtn.click();

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
      expect(document.body.style.width).toBe('');
      expect(document.body.style.top).toBe('');
    });

    test('closing menu should update aria-expanded to false', () => {
      mobileMenuBtn.click();

      expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
    });

    test('clicking menu item should close menu', () => {
      const menuItem = mobileNavMenu.querySelector('button[data-tab]');
      menuItem.dispatchEvent(new Event('click'));

      expect(mobileNavMenu.classList.contains('open')).toBe(false);
      expect(mobileMenuBtn.classList.contains('active')).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });

    test('clicking overlay (menu background) should close menu', () => {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(clickEvent, 'target', { value: mobileNavMenu, enumerable: true });

      mobileNavMenu.dispatchEvent(clickEvent);

      expect(mobileNavMenu.classList.contains('open')).toBe(false);
      expect(mobileMenuBtn.classList.contains('active')).toBe(false);
    });
  });

  describe('Toggle Behavior', () => {
    test('should toggle menu open and closed multiple times', () => {
      // Open
      mobileMenuBtn.click();
      expect(mobileNavMenu.classList.contains('open')).toBe(true);

      // Close
      mobileMenuBtn.click();
      expect(mobileNavMenu.classList.contains('open')).toBe(false);

      // Open again
      mobileMenuBtn.click();
      expect(mobileNavMenu.classList.contains('open')).toBe(true);

      // Close again
      mobileMenuBtn.click();
      expect(mobileNavMenu.classList.contains('open')).toBe(false);
    });

    test('aria-expanded should match menu state', () => {
      mobileMenuBtn.click();
      expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('true');

      mobileMenuBtn.click();
      expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('iOS Safari Fixes', () => {
    test('burger button should have -webkit-tap-highlight-color', () => {
      const style = mobileMenuBtn.getAttribute('style');
      expect(style).toContain('-webkit-tap-highlight-color:transparent');
    });

    test('burger button should have touch-action manipulation', () => {
      const style = mobileMenuBtn.getAttribute('style');
      expect(style).toContain('touch-action:manipulation');
    });

    test('burger lines should have pointer-events:none', () => {
      const spans = mobileMenuBtn.querySelectorAll('span');
      spans.forEach((span) => {
        expect(span.getAttribute('style')).toContain('pointer-events:none');
      });
    });
  });

  describe('Menu Items', () => {
    test('mobile menu should have no icons', () => {
      const icons = mobileNavMenu.querySelectorAll('i.ph');
      expect(icons.length).toBe(0);
    });

    test('mobile menu items should only have plain text', () => {
      const items = mobileNavMenu.querySelectorAll('.mobile-nav-item');
      items.forEach((item) => {
        const icon = item.querySelector('i');
        expect(icon).toBeNull();
        expect(item.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    test('should have correct menu item labels in Latvian', () => {
      const labels = Array.from(mobileNavMenu.querySelectorAll('.mobile-nav-item')).map(
        (item) => item.textContent.trim()
      );

      expect(labels).toContain('Ieraksti');
      expect(labels).toContain('Pieejamība');
      expect(labels).toContain('Iestatījumi');
    });
  });

  describe('Event Propagation', () => {
    test('click event should call preventDefault', () => {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      mobileMenuBtn.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('click event should call stopPropagation', () => {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

      mobileMenuBtn.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
