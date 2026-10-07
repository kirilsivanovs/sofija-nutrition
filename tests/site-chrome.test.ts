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

  it('keeps the inactive language codes at 400 and the active one at 600', () => {
    expect(ruleBody(appHeaderAstro, '.app-lang-switch a')).toMatch(/font-weight:\s*400/);
    expect(ruleBody(appHeaderAstro, ".app-lang-switch a[aria-current='page']")).toMatch(
      /font-weight:\s*600/
    );
  });
});
