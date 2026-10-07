import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', 'src');

function readStripped(...segments: string[]): string {
  return fs
    .readFileSync(path.join(root, ...segments), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

const globalCss = readStripped('styles', 'global.css');
const bookingCss = readStripped('styles', 'booking.css');
const appHeaderAstro = readStripped('components', 'common', 'AppHeader.astro');
const scrollToTopAstro = readStripped('components', 'common', 'ScrollToTop.astro');
const cabinetAstro = readStripped('pages', 'cabinet.astro');

const allFiles = [globalCss, bookingCss, appHeaderAstro, scrollToTopAstro, cabinetAstro];

// All rules for a selector are joined, so a media-query override cannot hide the base rule.
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|[}\\s,])${escaped}\\s*(?:,[^{]*)?{([^}]*)}`, 'g');
  return [...css.matchAll(pattern)].map((match) => match[1]).join('\n');
}

describe('site chrome', () => {
  it('has no weight 500 in the public, booking, cabinet and header styles', () => {
    for (const css of allFiles) {
      expect(css).not.toMatch(/font-weight:\s*500/);
      expect(css).not.toMatch(/font-weight:\s*medium|\bfont-medium\b/);
    }
  });

  it('has no transition outside the reduced-motion override in the public, booking and header styles', () => {
    for (const css of allFiles) {
      expect(css).not.toMatch(/transition(?!-duration:\s*0\.01ms)/);
    }
  });

  it('shows the mobile menu items without a stagger', () => {
    expect(globalCss).not.toMatch(/\.mobile-nav-item:nth-child/);
    expect(globalCss).not.toMatch(/\.mobile-nav-menu\.open \.mobile-nav-item/);
    const itemBody = ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item');
    expect(itemBody).not.toBe('');
    expect(itemBody).not.toMatch(/opacity/);
    expect(itemBody).not.toMatch(/translateX\(-20px\)/);
  });

  it('keeps the header positioned, not static, on phones', () => {
    const phoneBlock = appHeaderAstro.match(/@media \(max-width: 760px\)\s*{\s*\.app-header\s*{([^}]*)}/);
    expect(phoneBlock).not.toBeNull();
    expect(phoneBlock![1]).toMatch(/position:\s*relative/);
    expect(phoneBlock![1]).not.toMatch(/position:\s*static/);
  });

  it('has no 12px or 8px radius and no sideways hover shift in the mobile menu', () => {
    const itemRules = [
      ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item'),
      ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item:hover'),
      ruleBody(appHeaderAstro, '.mobile-nav-menu :global(a)'),
      ruleBody(appHeaderAstro, '.mobile-nav-menu :global(.mobile-nav-item)'),
      ruleBody(appHeaderAstro, '.app-logout'),
    ].join('\n');
    expect(itemRules).not.toMatch(/border-radius:\s*(12|8)px/);
    expect(globalCss).not.toMatch(/translateX\(4px\)/);
    expect(appHeaderAstro).not.toMatch(/translateX\(4px\)/);
    expect(ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item')).not.toMatch(/letter-spacing/);
    expect(ruleBody(appHeaderAstro, '.mobile-nav-menu :global(.mobile-nav-item)')).not.toMatch(
      /letter-spacing/
    );
  });

  it('draws the active menu row as a full-height Range edge on an unfilled row', () => {
    const item = ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item');
    const hover = ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item:hover');
    const active = ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item.active');
    const marker = ruleBody(globalCss, '.mobile-nav-menu .mobile-nav-item.active::before');
    expect(item).not.toMatch(/max-width/);
    expect(hover).not.toMatch(/rgba|border-color/);
    expect(active).not.toMatch(/rgba|border-color|navy/);
    expect(active).toMatch(/background:\s*transparent/);
    expect(marker).toMatch(/top:\s*0/);
    expect(marker).toMatch(/bottom:\s*0/);
    expect(marker).not.toMatch(/transform|height|navy/);
    expect(marker).toMatch(/var\(--color-range\)/);
  });

  it('draws the burger lines without navy', () => {
    const burgerRules = [
      ruleBody(appHeaderAstro, '.mobile-menu-btn span'),
      ruleBody(appHeaderAstro, '.mobile-menu-btn:hover span'),
      ruleBody(appHeaderAstro, '.mobile-menu-btn.active span:nth-child(1)'),
      ruleBody(appHeaderAstro, '.mobile-menu-btn.active span:nth-child(3)'),
      ruleBody(globalCss, '.mobile-menu-btn.active span:nth-child(1)'),
      ruleBody(globalCss, '.mobile-menu-btn.active span:nth-child(3)'),
    ].join('\n');
    expect(burgerRules).toMatch(/background:/);
    expect(burgerRules).not.toMatch(/navy/);
  });

  it('uses one static burger label', () => {
    expect(appHeaderAstro).toContain('aria-label="Izvēlne"');
    expect(appHeaderAstro).not.toContain('Atvērt izvēlni');
  });

  it('keeps the inactive language codes at 400 and the active one at 600', () => {
    expect(ruleBody(appHeaderAstro, '.app-lang-switch a')).toMatch(/font-weight:\s*400/);
    expect(ruleBody(appHeaderAstro, ".app-lang-switch a[aria-current='page']")).toMatch(
      /font-weight:\s*600/
    );
  });
});
