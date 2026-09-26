import fs from 'fs';
import path from 'path';

const bookingCss = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'booking.css'),
  'utf-8'
);

const globalCss = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'global.css'),
  'utf-8'
);

const indexAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'pages', 'index.astro'),
  'utf-8'
);

describe('landing background decoration', () => {
  it('has no gradient background declarations in booking.css', () => {
    expect(bookingCss).not.toMatch(/(linear|radial)-gradient\(/);
  });

  it('has no gradient background declarations in global.css', () => {
    expect(globalCss).not.toMatch(/(linear|radial)-gradient\(/);
  });

  it('has no backdrop-filter declarations in booking.css', () => {
    expect(bookingCss).not.toMatch(/backdrop-filter/);
  });

  it('has no bg-cream utility left in index.astro', () => {
    expect(indexAstro).not.toMatch(/bg-cream/);
  });
});

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*{([^}]*)}`).exec(css);
  return match ? match[1] : '';
}

describe('landing card chrome', () => {
  it('removes hover-lift transform and shadow from card and button hover states', () => {
    const bookingHoverSelectors = ['.service-card:hover', '.trust-metric:hover'];
    const globalHoverSelectors = [
      '.outcome-card:hover',
      '.whom-item:hover',
      '.cert-badge:hover',
      '.footer-social-link:hover',
      '.btn-cta:hover',
      '.btn-solid:hover',
      '.btn-outline:hover',
      '.btn-light:hover',
    ];

    for (const selector of bookingHoverSelectors) {
      expect(ruleBody(bookingCss, selector)).not.toMatch(/translateY|box-shadow/);
    }

    for (const selector of globalHoverSelectors) {
      expect(ruleBody(globalCss, selector)).not.toMatch(/translateY|box-shadow/);
    }
  });

  it('uses only the 8px/12px radius scale for cards and buttons', () => {
    const disallowed = /border-radius:[^;]*(1[4-9]px|2[0-9]px)/;
    // .booking-trust-compact is row 4's job (replaced by a plain text line); not touched here.
    const bookingCssWithoutTrustCompact = bookingCss.replace(
      ruleBody(bookingCss, '.booking-trust-compact'),
      ''
    );
    expect(bookingCssWithoutTrustCompact).not.toMatch(disallowed);
    expect(globalCss).not.toMatch(disallowed);
  });

  it('drops the tinted icon-square background from outcome, trust and certification icons', () => {
    expect(globalCss).not.toMatch(/\.outcome-icon\s*{/);
    expect(globalCss).not.toMatch(/\.cert-badge-icon\s*{/);
    expect(bookingCss).not.toMatch(/\.trust-metric-icon\s*{/);
    expect(bookingCss).not.toMatch(/\.service-icon\s*{/);
  });

  it('has no rounded-2xl utility left in index.astro', () => {
    expect(indexAstro).not.toMatch(/rounded-2xl/);
  });
});
