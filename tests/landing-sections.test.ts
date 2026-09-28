import fs from 'fs';
import path from 'path';

const indexAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'pages', 'index.astro'),
  'utf-8'
);

describe('landing question body', () => {
  it('has no trust-bar, services, outcomes or old FAQ details sections left in index.astro', () => {
    expect(indexAstro).not.toMatch(/trust-bar/);
    expect(indexAstro).not.toMatch(/services-grid/);
    expect(indexAstro).not.toMatch(/outcome-card/);
    expect(indexAstro).not.toMatch(/faq-item/);
  });

  it('states the price only once, in question 3', () => {
    expect((indexAstro.match(/65\s*€/g) || []).length).toBe(1);
  });

  it('states the register number only once, in question 4', () => {
    expect((indexAstro.match(/75650061277/g) || []).length).toBe(1);
  });

  it('preserves the services, about and faq anchor ids for the header nav', () => {
    expect(indexAstro).toMatch(/id="services"/);
    expect(indexAstro).toMatch(/id="about"/);
    expect(indexAstro).toMatch(/id="faq"/);
  });
});
