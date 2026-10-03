import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const read = (...parts: string[]) => fs.readFileSync(path.join(root, ...parts), 'utf-8');

const pages = {
  terms: read('src', 'pages', 'terms.astro'),
  privacy: read('src', 'pages', 'privacy-policy.astro'),
};
const globalCss = read('src', 'styles', 'global.css');
const adminCss = read('src', 'styles', 'admin.css');

const classTokens = (source: string): string[] =>
  [...source.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(/\s+/)).filter(Boolean);

const deadTokens = /^(text-(sm|base|2xl|3xl|4xl|5xl)|md:text-(2xl|3xl|4xl|5xl)|prose(-\w+)?|font-normal|list-none)$/;

const ruleBody = (css: string, selector: string): string => {
  const start = css.indexOf(selector);
  if (start === -1) return '';
  return css.slice(css.indexOf('{', start), css.indexOf('}', start));
};

describe('legal pages', () => {
  it('has no dead text-size or prose utilities when reading class tokens of both pages', () => {
    for (const source of Object.values(pages)) {
      expect(classTokens(source).filter((token) => deadTokens.test(token))).toEqual([]);
    }
  });

  it('puts legal-prose on the article of both pages', () => {
    for (const source of Object.values(pages)) {
      expect(source).toMatch(/<article class="[^"]*\blegal-prose\b/);
    }
  });

  it('contains no check-mark glyph and no list classes when listing items', () => {
    for (const source of Object.values(pages)) {
      expect(source).not.toContain('✓');
      expect(source).not.toMatch(/<ul\s+class=/);
    }
  });

  it('sizes legal-prose li like p when reading global.css', () => {
    expect(globalCss).toMatch(/^p,\s*\.legal-prose li\s*\{/m);
  });

  it('keeps running-text links inline without padding when under legal-prose', () => {
    const body = ruleBody(globalCss, '.legal-prose :is(p, li) a {');
    expect(body).toContain('display: inline');
    expect(body).toContain('padding: 0');
    expect(globalCss).toContain(':not(.legal-prose :is(p, li) a)');
  });

  it('draws the admin gate icon without a CSS ring when reading admin.css', () => {
    const body = ruleBody(adminCss, '.unauthorized-icon');
    expect(body).not.toMatch(/border|border-radius/);
  });
});
