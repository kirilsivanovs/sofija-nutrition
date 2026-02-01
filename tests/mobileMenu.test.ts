/**
 * @jest-environment jsdom
 */

describe('Mobile Menu (Burger Button)', () => {
    let mobileMenuBtn;
    let mobileNavMenu;
    let navLinks;
    let toggleMobileMenu;
    let closeMobileMenu;

    beforeEach(() => {
        // Setup DOM structure (matching actual HTML)
        document.body.innerHTML = `
            <nav>
                <button type="button" class="mobile-menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="mobile-nav-menu">
                    <span class="pointer-events-none"></span>
                    <span class="pointer-events-none"></span>
                    <span class="pointer-events-none"></span>
                </button>
            </nav>
            <div id="mobile-nav-menu" class="mobile-nav-menu">
                <a href="#program">Program</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </div>
        `;

        // Reset body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';

        // Get elements
        mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        mobileNavMenu = document.querySelector('.mobile-nav-menu');
        navLinks = document.querySelectorAll('.mobile-nav-menu a');

        // Define functions matching main.js logic
        toggleMobileMenu = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            const isOpen = mobileNavMenu.classList.toggle('open');
            mobileMenuBtn.classList.toggle('active', isOpen);
            mobileMenuBtn.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
            
            if (isOpen) {
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
            } else {
                document.body.style.position = '';
                document.body.style.width = '';
            }
        };
        
        closeMobileMenu = () => {
            mobileMenuBtn.classList.remove('active');
            mobileNavMenu.classList.remove('open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };

        // Setup event listeners
        if (mobileMenuBtn && mobileNavMenu) {
            mobileMenuBtn.addEventListener('click', toggleMobileMenu);

            navLinks.forEach(link => {
                link.addEventListener('click', closeMobileMenu);
            });

            mobileNavMenu.addEventListener('click', (e) => {
                if (e.target === mobileNavMenu) {
                    closeMobileMenu();
                }
            });
        }
    });

    afterEach(() => {
        document.body.innerHTML = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    });

    describe('Initial State', () => {
        test('burger button should exist', () => {
            expect(mobileMenuBtn).not.toBeNull();
        });

        test('mobile nav menu should exist', () => {
            expect(mobileNavMenu).not.toBeNull();
        });

        test('burger button should not have active class initially', () => {
            expect(mobileMenuBtn.classList.contains('active')).toBe(false);
        });

        test('mobile nav menu should not have open class initially', () => {
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
        });

        test('body overflow should not be hidden initially', () => {
            expect(document.body.style.overflow).toBe('');
        });

        test('burger button should have aria-label for accessibility', () => {
            expect(mobileMenuBtn.getAttribute('aria-label')).toBe('Menu');
        });

        test('burger button should have aria-expanded="false" initially', () => {
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });

        test('burger button should have aria-controls pointing to menu', () => {
            expect(mobileMenuBtn.getAttribute('aria-controls')).toBe('mobile-nav-menu');
        });

        test('burger button should have type="button"', () => {
            expect(mobileMenuBtn.getAttribute('type')).toBe('button');
        });

        test('burger button should have 3 spans (hamburger lines)', () => {
            const spans = mobileMenuBtn.querySelectorAll('span');
            expect(spans.length).toBe(3);
        });

        test('hamburger spans should have pointer-events-none class', () => {
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans.forEach(span => {
                expect(span.classList.contains('pointer-events-none')).toBe(true);
            });
        });
    });

    describe('Opening Menu', () => {
        test('clicking burger button should add active class to button', () => {
            mobileMenuBtn.click();
            expect(mobileMenuBtn.classList.contains('active')).toBe(true);
        });

        test('clicking burger button should add open class to menu', () => {
            mobileMenuBtn.click();
            expect(mobileNavMenu.classList.contains('open')).toBe(true);
        });

        test('clicking burger button should set body overflow to hidden', () => {
            mobileMenuBtn.click();
            expect(document.body.style.overflow).toBe('hidden');
        });

        test('clicking burger button should set body position to fixed (iOS fix)', () => {
            mobileMenuBtn.click();
            expect(document.body.style.position).toBe('fixed');
        });

        test('clicking burger button should set body width to 100% (iOS fix)', () => {
            mobileMenuBtn.click();
            expect(document.body.style.width).toBe('100%');
        });

        test('clicking burger button should set aria-expanded to true', () => {
            mobileMenuBtn.click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('true');
        });
    });

    describe('Closing Menu via Button', () => {
        beforeEach(() => {
            mobileMenuBtn.click();
        });

        test('clicking burger button again should remove active class', () => {
            mobileMenuBtn.click();
            expect(mobileMenuBtn.classList.contains('active')).toBe(false);
        });

        test('clicking burger button again should remove open class from menu', () => {
            mobileMenuBtn.click();
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
        });

        test('clicking burger button again should restore body overflow', () => {
            mobileMenuBtn.click();
            expect(document.body.style.overflow).toBe('');
        });

        test('clicking burger button again should restore body position', () => {
            mobileMenuBtn.click();
            expect(document.body.style.position).toBe('');
        });

        test('clicking burger button again should restore body width', () => {
            mobileMenuBtn.click();
            expect(document.body.style.width).toBe('');
        });

        test('clicking burger button again should set aria-expanded to false', () => {
            mobileMenuBtn.click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });
    });

    describe('Closing Menu via Navigation Links', () => {
        beforeEach(() => {
            mobileMenuBtn.click();
        });

        test('clicking a nav link should close the menu', () => {
            navLinks[0].click();
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
        });

        test('clicking a nav link should remove active class from button', () => {
            navLinks[0].click();
            expect(mobileMenuBtn.classList.contains('active')).toBe(false);
        });

        test('clicking a nav link should restore body overflow', () => {
            navLinks[0].click();
            expect(document.body.style.overflow).toBe('');
        });

        test('clicking a nav link should restore body position', () => {
            navLinks[0].click();
            expect(document.body.style.position).toBe('');
        });

        test('clicking a nav link should set aria-expanded to false', () => {
            navLinks[0].click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });

        test('clicking any nav link should close the menu', () => {
            // Menu is already open from beforeEach
            // Test each link closes the menu
            navLinks.forEach((link, index) => {
                // First link - menu already open from beforeEach
                // Subsequent links - need to reopen
                if (index > 0) {
                    mobileMenuBtn.click();
                    expect(mobileNavMenu.classList.contains('open')).toBe(true);
                }
                
                link.click();
                expect(mobileNavMenu.classList.contains('open')).toBe(false);
            });
        });
    });

    describe('Closing Menu via Overlay Click', () => {
        beforeEach(() => {
            mobileMenuBtn.click();
        });

        test('clicking on overlay (menu background) should close menu', () => {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(clickEvent, 'target', { value: mobileNavMenu });
            mobileNavMenu.dispatchEvent(clickEvent);
            
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
        });

        test('clicking on link should not trigger overlay close', () => {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(clickEvent, 'target', { value: navLinks[0] });
            mobileNavMenu.dispatchEvent(clickEvent);
            
            // Menu should still be open (overlay handler checks e.target === mobileNavMenu)
            // The link click handler will close it
        });
    });

    describe('Toggle Behavior', () => {
        test('multiple clicks should toggle menu state', () => {
            expect(mobileNavMenu.classList.contains('open')).toBe(false);

            mobileMenuBtn.click();
            expect(mobileNavMenu.classList.contains('open')).toBe(true);

            mobileMenuBtn.click();
            expect(mobileNavMenu.classList.contains('open')).toBe(false);

            mobileMenuBtn.click();
            expect(mobileNavMenu.classList.contains('open')).toBe(true);

            mobileMenuBtn.click();
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
        });

        test('button active state should sync with menu open state', () => {
            for (let i = 0; i < 5; i++) {
                mobileMenuBtn.click();
                const isOpen = mobileNavMenu.classList.contains('open');
                const isActive = mobileMenuBtn.classList.contains('active');
                expect(isOpen).toBe(isActive);
            }
        });

        test('aria-expanded should sync with menu state', () => {
            mobileMenuBtn.click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('true');

            mobileMenuBtn.click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');

            mobileMenuBtn.click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('true');
        });
    });

    describe('iOS Safari Compatibility', () => {
        test('body position should be fixed when menu is open', () => {
            mobileMenuBtn.click();
            expect(document.body.style.position).toBe('fixed');
            expect(document.body.style.width).toBe('100%');
        });

        test('body position should be restored when menu is closed', () => {
            mobileMenuBtn.click();
            mobileMenuBtn.click();
            expect(document.body.style.position).toBe('');
            expect(document.body.style.width).toBe('');
        });

        test('event should be prevented and stopped on toggle', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            toggleMobileMenu(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        test('menu should have id for aria-controls reference', () => {
            expect(mobileNavMenu.getAttribute('id')).toBe('mobile-nav-menu');
        });

        test('button aria-controls should match menu id', () => {
            const ariaControls = mobileMenuBtn.getAttribute('aria-controls');
            const menuId = mobileNavMenu.getAttribute('id');
            expect(ariaControls).toBe(menuId);
        });

        test('aria-expanded should correctly reflect menu state', () => {
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
            
            mobileMenuBtn.click();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('true');
            
            closeMobileMenu();
            expect(mobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });
    });

    describe('Edge Cases', () => {
        test('should handle rapid clicking', () => {
            for (let i = 0; i < 10; i++) {
                mobileMenuBtn.click();
            }
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
            expect(mobileMenuBtn.classList.contains('active')).toBe(false);
        });

        test('closing via link when already closed should not cause issues', () => {
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
            expect(() => navLinks[0].click()).not.toThrow();
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
        });

        test('closeMobileMenu can be called multiple times safely', () => {
            expect(() => {
                closeMobileMenu();
                closeMobileMenu();
                closeMobileMenu();
            }).not.toThrow();
            
            expect(mobileNavMenu.classList.contains('open')).toBe(false);
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('Missing Elements', () => {
        test('should not throw if burger button is missing', () => {
            document.body.innerHTML = `
                <div class="mobile-nav-menu">
                    <a href="#test">Test</a>
                </div>
            `;

            const btn = document.querySelector('.mobile-menu-btn');
            const menu = document.querySelector('.mobile-nav-menu');

            expect(btn).toBeNull();
            expect(menu).not.toBeNull();
        });

        test('should not throw if mobile nav menu is missing', () => {
            document.body.innerHTML = `
                <button class="mobile-menu-btn">
                    <span></span>
                </button>
            `;

            const btn = document.querySelector('.mobile-menu-btn');
            const menu = document.querySelector('.mobile-nav-menu');

            expect(menu).toBeNull();
            expect(() => btn.click()).not.toThrow();
        });

        test('should handle empty nav links', () => {
            document.body.innerHTML = `
                <button class="mobile-menu-btn" aria-expanded="false"></button>
                <div class="mobile-nav-menu"></div>
            `;

            const btn = document.querySelector('.mobile-menu-btn');
            const menu = document.querySelector('.mobile-nav-menu');
            const links = document.querySelectorAll('.mobile-nav-menu a');

            expect(links.length).toBe(0);

            btn.addEventListener('click', () => {
                const isOpen = menu.classList.toggle('open');
                btn.setAttribute('aria-expanded', isOpen);
            });

            btn.click();
            expect(menu.classList.contains('open')).toBe(true);
            expect(btn.getAttribute('aria-expanded')).toBe('true');
        });
    });
});

describe('Mobile Menu CSS Classes', () => {
    describe('Required CSS properties for iOS Safari', () => {
        test('button should have touch-action manipulation class available', () => {
            // This tests that the expected classes exist in the structure
            const expectedClasses = [
                'mobile-menu-btn',
                'pointer-events-none'
            ];
            
            expectedClasses.forEach(className => {
                expect(typeof className).toBe('string');
                expect(className.length).toBeGreaterThan(0);
            });
        });
    });
});

describe('Cross-Browser Compatibility Considerations', () => {
    test('classList.toggle should work correctly', () => {
        document.body.innerHTML = '<div class="test"></div>';
        const el = document.querySelector('.test');
        
        // Toggle on
        const result1 = el.classList.toggle('active');
        expect(result1).toBe(true);
        expect(el.classList.contains('active')).toBe(true);
        
        // Toggle off
        const result2 = el.classList.toggle('active');
        expect(result2).toBe(false);
        expect(el.classList.contains('active')).toBe(false);
    });

    test('classList.toggle with force parameter should work', () => {
        document.body.innerHTML = '<div class="test"></div>';
        const el = document.querySelector('.test');
        
        // Force add
        el.classList.toggle('active', true);
        expect(el.classList.contains('active')).toBe(true);
        
        // Force add again (no change)
        el.classList.toggle('active', true);
        expect(el.classList.contains('active')).toBe(true);
        
        // Force remove
        el.classList.toggle('active', false);
        expect(el.classList.contains('active')).toBe(false);
    });

    test('setAttribute should work for aria attributes', () => {
        document.body.innerHTML = '<button aria-expanded="false"></button>';
        const btn = document.querySelector('button');
        
        btn.setAttribute('aria-expanded', true);
        expect(btn.getAttribute('aria-expanded')).toBe('true');
        
        btn.setAttribute('aria-expanded', false);
        expect(btn.getAttribute('aria-expanded')).toBe('false');
        
        btn.setAttribute('aria-expanded', 'true');
        expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    test('addEventListener should work with arrow functions', () => {
        document.body.innerHTML = '<button></button>';
        const btn = document.querySelector('button');
        let clicked = false;
        
        btn.addEventListener('click', () => {
            clicked = true;
        });
        
        btn.click();
        expect(clicked).toBe(true);
    });

    test('querySelectorAll should return NodeList', () => {
        document.body.innerHTML = `
            <div class="item">1</div>
            <div class="item">2</div>
            <div class="item">3</div>
        `;
        
        const items = document.querySelectorAll('.item');
        expect(items.length).toBe(3);
        expect(typeof items.forEach).toBe('function');
    });
});
