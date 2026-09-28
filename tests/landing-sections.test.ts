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

  it('renders the register-number credential only once, in question 4', () => {
    expect((indexAstro.match(/\{dict\.q4_cred\}/g) || []).length).toBe(1);
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
