import fs from 'fs';
import path from 'path';

const indexAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'landing', 'Landing.astro'),
  'utf-8'
);

const layoutAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'layouts', 'Layout.astro'),
  'utf-8'
);

describe('landing question body', () => {
  it('has no trust-bar, services, outcomes or old FAQ details sections left in index.astro', () => {
    expect(indexAstro).not.toMatch(/trust-bar/);
    expect(indexAstro).not.toMatch(/services-grid/);
    expect(indexAstro).not.toMatch(/outcome-card/);
    expect(indexAstro).not.toMatch(/faq-item/);
  });

  it('renders the price value only once, in question 3', () => {
    expect((indexAstro.match(/\{dict\.q3_row1_v\}/g) || []).length).toBe(1);
  });

  it('renders the register-number credential only once, in the hero', () => {
    expect((indexAstro.match(/\{dict\.cred_register_d\}/g) || []).length).toBe(1);
    expect(indexAstro.indexOf('{dict.cred_register_d}')).toBeLessThan(indexAstro.indexOf('id="f-q1"'));
  });

  it('shows credentials, not the glucose chart, in the hero', () => {
    const hero = indexAstro.slice(indexAstro.indexOf('id="hero"'), indexAstro.indexOf('id="f-q1"'));
    expect(hero).toMatch(/class="hero-cred"/);
    expect(hero).not.toMatch(/hero-svg/);
  });

  it('keeps one figure per question: the glucose chart in question 4, the plate in question 5', () => {
    const q4 = indexAstro.slice(indexAstro.indexOf('id="about"'), indexAstro.indexOf('id="f-q5"'));
    const q5 = indexAstro.slice(indexAstro.indexOf('id="f-q5"'), indexAstro.indexOf('id="f-q6"'));
    expect(q4).toMatch(/id="hero-svg"/);
    expect(q5).toMatch(/class="plate"/);
    expect(q5).not.toMatch(/hero-svg/);
  });

  it('shows no price row without a number in question 3', () => {
    expect(indexAstro).not.toMatch(/question__pending|q3_pending/);
  });

  it('preserves the services, about and faq anchor ids for the header nav', () => {
    expect(indexAstro).toMatch(/id="services"/);
    expect(indexAstro).toMatch(/id="about"/);
    expect(indexAstro).toMatch(/id="faq"/);
  });
});

describe('landing cookie notice', () => {
  it('renders no cookie consent dialog when only strictly necessary storage is used', () => {
    expect(indexAstro).not.toMatch(/cookie-consent-dialog/);
    expect(indexAstro).not.toMatch(/CookieConsent/);
    expect(indexAstro).not.toMatch(/cookie-consent\.css/);
  });

  it('renders no footer cookie-settings button when there is no consent choice to reopen', () => {
    expect(indexAstro).not.toMatch(/footer-cookie-settings/);
    expect(indexAstro).not.toMatch(/footer_cookie_settings/);
  });

  it('loads no analytics or marketing script when no consent is collected', () => {
    expect(indexAstro).not.toMatch(/gtag|googletagmanager|analytics\.js/);
    expect(layoutAstro).not.toMatch(/gtag|googletagmanager|analytics\.js/);
  });
});

describe('landing Q4 chart without JS', () => {
  const q4Svg = indexAstro.slice(indexAstro.indexOf('id="hero-svg"'), indexAstro.indexOf('glucose-fig__readout'));

  it('draws curve paths inside the Q4 svg markup', () => {
    expect(q4Svg).toMatch(/<path\s+d=\{geo\.pathA\}/);
    expect(q4Svg).toMatch(/d=\{geo\.pathB\}/);
  });

  it('hardcodes no decimal readout value in the Q4 chart', () => {
    const readout = indexAstro.slice(indexAstro.indexOf('glucose-fig__readout'), indexAstro.indexOf('</dl>', indexAstro.indexOf('glucose-fig__readout')));
    expect(readout).not.toMatch(/\d[.,]\d/);
  });

  it('fills the time-in-range sentence in the static Q4 markup', () => {
    expect(indexAstro).toMatch(/<span id="hero-tir"\s*>\{formatTimeInRangeSentence\(/);
  });
});
