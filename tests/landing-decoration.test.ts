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
  path.join(__dirname, '..', 'src', 'components', 'landing', 'Landing.astro'),
  'utf-8'
);

const layoutAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'layouts', 'Layout.astro'),
  'utf-8'
);

const chartCss = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'chart.css'),
  'utf-8'
);

const questionBodyCss =fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'question-body.css'),
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
    const globalHoverSelectors = [
      '.outcome-card:hover',
      '.whom-item:hover',
      '.cert-badge:hover',
      '.site-footer__social a:hover',
      '.btn-solid:hover',
      '.btn-outline:hover',
      '.btn-light:hover',
    ];

    for (const selector of globalHoverSelectors) {
      const body = ruleBody(globalCss, selector);
      expect(body).not.toBe('');
      expect(body).not.toMatch(/translateY|box-shadow/);
    }
  });

  it('left-aligns the empty-week line and widens the continue button on phone', () => {
    const wideCardBlock = containerBlock(bookingCss, 'min-width: 560px');
    const rules: Array<[string, string, RegExp[]]> = [
      ['.week-empty', bookingCss, [/align-items:\s*flex-start/, /text-align:\s*left/]],
      ['.week-empty-email-link', bookingCss, [/text-decoration:\s*underline/, /font-size:\s*15px/, /margin-top:\s*-8px\s*;/]],
      ['.week-empty-email-link:focus-visible', bookingCss, [/outline-offset:\s*-3px/]],
      ['.booking-summary-note', bookingCss, [/text-wrap:\s*pretty/]],
      ['.week-day-strip:empty', bookingCss, [/display:\s*none/]],
      ['.booking-continue-btn', bookingCss, [/flex-basis:\s*100%/, /margin-left:\s*0\s*;/]],
      ['.booking-continue-btn', wideCardBlock, [/flex-basis:\s*auto/, /margin-left:\s*auto/]],
    ];

    for (const [selector, source, expected] of rules) {
      const body = ruleBody(source, selector);
      expect(body).not.toBe('');
      for (const pattern of expected) expect(body).toMatch(pattern);
    }
    expect(ruleBody(bookingCss, '.week-empty-email-link')).not.toMatch(/margin:/);
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

describe('landing load/scroll motion', () => {
  it('deletes the animations.js and animations.css assets', () => {
    expect(
      fs.existsSync(path.join(__dirname, '..', 'public', 'assets', 'animations.js'))
    ).toBe(false);
    expect(
      fs.existsSync(path.join(__dirname, '..', 'public', 'assets', 'animations.css'))
    ).toBe(false);
  });

  it('no longer wires animations.css or animations.js into Layout.astro', () => {
    expect(layoutAstro).not.toMatch(/animations\.(css|js)/);
  });

  it('has no Latvian-only no-JS banner left in Layout.astro', () => {
    expect(layoutAstro).not.toMatch(/<noscript>/);
    expect(layoutAstro).not.toContain('Uztura speciāliste');
  });

  it('has no hero or booking-card entrance keyframes left in booking.css', () => {
    expect(bookingCss).not.toMatch(
      /@keyframes (heroFadeUp|heroFadeIn|heroImageReveal|heroCredentialPop|bookingFadeUp)/
    );
  });

  it('has no fadeInUp load animation left in global.css', () => {
    expect(globalCss).not.toMatch(/@keyframes fadeInUp/);
    expect(globalCss).not.toMatch(/\.animate-fade-in-up/);
  });

  it('removes the hero-doctor-cutout preload and never references aboutme in Layout.astro', () => {
    expect(layoutAstro).not.toMatch(/hero-doctor-cutout/);
    expect(layoutAstro).not.toMatch(/aboutme/);
  });
});

describe('landing colour roles', () => {
  it('renders the Q1 boundary lines in Slate at the question body size when inside a question', () => {
    expect(questionBodyCss).toMatch(/\.question \.question__scope\s*\{[^}]*color:\s*var\(--color-slate\)/);
    expect(questionBodyCss).not.toMatch(/\.question__scope[^{]*\{[^}]*font-size/);
  });

  it('has no var(--color-primary) or var(--color-secondary) left in booking.css', () => {
    expect(bookingCss).not.toMatch(/var\(--color-primary\)/);
    expect(bookingCss).not.toMatch(/var\(--color-secondary\)/);
  });

  it('has no bg-primary/text-white utility left on the footer in index.astro', () => {
    const footerIndex = indexAstro.indexOf('<footer');
    const footerMarkup = indexAstro.slice(footerIndex, indexAstro.indexOf('</footer>') + '</footer>'.length);
    expect(footerMarkup).not.toMatch(/bg-primary/);
    expect(footerMarkup).not.toMatch(/text-white/);
  });

  it('includes a Pacienta kabinets link in the footer', () => {
    const footerIndex = indexAstro.indexOf('<footer');
    const footerMarkup = indexAstro.slice(footerIndex, indexAstro.indexOf('</footer>') + '</footer>'.length);
    expect(footerMarkup).toMatch(/nav_cabinet/);
  });
});

describe('landing decorative markers', () => {
  it('removes the hero eyebrow and floating credential pill', () => {
    expect(indexAstro).not.toMatch(/hero__eyebrow|hero__credential/);
    expect(bookingCss).not.toMatch(/hero__eyebrow|hero__credential/);
  });

  it('removes the eyebrow tag above every section heading', () => {
    expect(indexAstro).not.toMatch(/services_tag|outcomes_tag|about_tag|faq_tag/);
  });

  it('removes the arrow marker from the for-whom items', () => {
    expect(indexAstro).not.toMatch(/whom-icon/);
    expect(globalCss).not.toMatch(/\.whom-icon\s*{/);
  });

  it('collapses the booking trust chips into one text line with no divider or icon', () => {
    expect(indexAstro).not.toMatch(/booking-trust-item|booking-trust-divider/);
    expect(bookingCss).not.toMatch(/booking-trust-item|booking-trust-divider/);
  });

  it('removes the mobile-menu and footer gold lines', () => {
    expect(globalCss).not.toMatch(/Subtle decorative gold line/);
    expect(indexAstro).not.toMatch(/bg-secondary\/60/);
  });
});

describe('old hero section', () => {
  it('removes the old hero section entirely from booking.css', () => {
    expect(bookingCss).not.toMatch(/\.hero__[\w-]+|\.hero\b(?!-)/);
  });

  it('has no box-shadow or transform on the base .btn-cta and .btn-solid rules', () => {
    for (const selector of ['.btn-cta', '.btn-solid']) {
      const body = ruleBody(globalCss, selector);
      expect(body).not.toBe('');
      expect(body).not.toMatch(/box-shadow|transform/);
    }
  });
});


function containerBlock(css: string, query: string): string {
  return atRuleBlock(css, `@container (${query}) {`);
}

function mediaBlock(css: string, query: string): string {
  return atRuleBlock(css, `@media (${query}) {`);
}

function atRuleBlock(css: string, header: string): string {
  const start = css.indexOf(header);
  if (start === -1) return '';
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return '';
}

describe('landing hero headline', () => {
  const tabletBlock = mediaBlock(chartCss, 'max-width: 1023px');
  const phoneBlock = mediaBlock(chartCss, 'max-width: 760px');

  it('collapses the hero grid to one column below 1024px', () => {
    expect(ruleBody(tabletBlock, '.landing-hero__inner')).toMatch(/grid-template-columns:\s*1fr\s*;/);
    expect(ruleBody(chartCss, '.landing-hero__inner')).toMatch(/grid-template-columns:\s*7fr 5fr/);
  });

  it('sizes the hero title with a clamp that tops out at 46px and balances the wrap', () => {
    const title = ruleBody(chartCss, '.landing-hero__title');
    expect(title).toMatch(/clamp\(34px,\s*calc\(24px \+ 2\.2vw\),\s*46px\)/);
    expect(title).toMatch(/text-wrap:\s*balance/);
  });

  it('drops the fixed 34px title override from the phone block', () => {
    expect(phoneBlock).not.toMatch(/\.landing-hero__title/);
  });

  it('lays the credentials out in two columns on tablet only', () => {
    const tabletDl = ruleBody(tabletBlock, '.hero-cred dl');
    expect(tabletDl).toMatch(/grid-template-columns:\s*1fr 1fr/);
    expect(tabletDl).toMatch(/grid-auto-flow:\s*column/);
    expect(ruleBody(phoneBlock, '.hero-cred dl')).toMatch(/display:\s*block/);
    expect(chartCss.indexOf('max-width: 1023px')).toBeLessThan(chartCss.indexOf('max-width: 760px'));
  });
});

describe('question body rules', () => {
  const mobileCss = questionBodyCss.slice(questionBodyCss.indexOf('@media (max-width: 760px)'));

  it('rules the Q1 definition rows like the steps and price table', () => {
    const rows = ruleBody(questionBodyCss, '.question__rows');
    expect(rows).not.toBe('');
    expect(rows).toMatch(/grid-template-columns:\s*minmax\(180px,\s*1fr\)\s*2fr/);
    expect(rows).toMatch(/gap:\s*0;/);
    expect(rows).toMatch(/border-top:\s*1px solid var\(--color-line\)/);
    const cells = ruleBody(questionBodyCss, '.question__rows dd');
    expect(cells).toMatch(/padding:\s*16px 0/);
    expect(cells).toMatch(/border-bottom:\s*1px solid var\(--color-line\)/);
    expect(questionBodyCss).toMatch(/\.question__rows dd \{[^}]*color:\s*var\(--color-graphite\)/);
    expect(mobileCss).toMatch(/\.question__rows\s*{\s*grid-template-columns:\s*1fr/);
    const mobileDt = ruleBody(mobileCss, '.question__rows dt');
    expect(mobileDt).toMatch(/border-bottom:\s*0/);
    expect(mobileDt).toMatch(/padding-bottom:\s*2px/);
    expect(ruleBody(mobileCss, '.question__rows dd')).toMatch(/padding-top:\s*0/);
  });

  it('top-aligns the price and keeps it on one line', () => {
    const cells = ruleBody(questionBodyCss, '.question__price td');
    expect(cells).toMatch(/vertical-align:\s*top/);
    expect(questionBodyCss).toMatch(/\.question__price td \{[^}]*white-space:\s*nowrap/);
    expect(questionBodyCss).toMatch(/\.question__price td \{[^}]*padding-left:\s*24px/);
    expect(ruleBody(questionBodyCss, '.question__price th small')).toMatch(/font-size:\s*15px/);
  });

  it('balances the question headings and spaces paragraphs 16px', () => {
    const h2 = ruleBody(questionBodyCss, '.question h2');
    expect(h2).toMatch(/text-wrap:\s*balance/);
    expect(h2).toMatch(/letter-spacing:\s*-\.01em/);
    expect(ruleBody(questionBodyCss, ':where(.question) p')).toMatch(/margin:\s*0 0 16px/);
  });

  it('keeps the question paragraph rules at element specificity so the booking p rules win', () => {
    expect(questionBodyCss).not.toMatch(/(^|[\s,}])\.question p\b/m);
    expect(questionBodyCss).toMatch(/:where\(\.question\) p,\s*\.question dd/);
  });
});