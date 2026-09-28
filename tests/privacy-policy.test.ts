import fs from 'fs';
import path from 'path';

const privacyPolicyAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'pages', 'privacy-policy.astro'),
  'utf-8'
);

describe('privacy policy cookies section', () => {
  it('names no analytics or marketing cookies when none are set', () => {
    expect(privacyPolicyAstro).not.toMatch(
      /Analītikas sīkdatnes|Mārketinga sīkdatnes|Mārketinga dati|🍪|Vietnes uzlabošana/
    );
  });

  it('lists each browser storage entry the site sets', () => {
    expect(privacyPolicyAstro).toContain('StaticWebAppsAuthCookie');
    expect(privacyPolicyAstro).toContain('diary_favorites_v2');
    expect(privacyPolicyAstro).toContain('preferredLang');
  });
});
