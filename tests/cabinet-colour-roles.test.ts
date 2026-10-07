import fs from 'fs';
import path from 'path';

const cabinet = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'pages', 'cabinet.astro'),
  'utf-8'
);

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*{([^}]*)}`).exec(css);
  return match ? match[1] : '';
}

describe('cabinet colour roles', () => {
  it('has no --diary-green when the role tokens are named directly', () => {
    expect(cabinet).not.toMatch(/--diary-green/);
  });

  it('uses --color-range only in the ring, macro bar and ring stroke line when styled', () => {
    const lines = cabinet.split('\n').filter((line) => line.includes('--color-range'));
    expect(lines).toHaveLength(3);
    expect(ruleBody(cabinet, '.ring-fill')).toMatch(/stroke:\s*var\(--color-range\)/);
    expect(ruleBody(cabinet, '.macro-fill')).toMatch(/background:\s*var\(--color-range\)/);
    expect(cabinet).toMatch(/ring\.style\.stroke = 'var\(--color-range\)'/);
  });

  it('colours the sheet status Slate and the failure state Error when saving fails', () => {
    expect(ruleBody(cabinet, '.sheet-status')).toMatch(/color:\s*var\(--color-slate\)/);
    expect(ruleBody(cabinet, '.sheet-status.is-error')).toMatch(/color:\s*var\(--color-error\)/);
  });

  it('gives the favourites button a Slate border and no raw hex when styled', () => {
    const body = ruleBody(cabinet, '.add-sheet .btn-save-fav');
    expect(body).toMatch(/border:\s*1\.5px solid var\(--color-slate\)/);
    expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(body).not.toMatch(/--diary-border/);
  });

  it('passes true to setSheetStatus in all three failure writes when saving fails', () => {
    const failureCalls = cabinet
      .split('\n')
      .filter((line) => /setSheetStatus\(.*(Ievadiet|Kļūda)/.test(line));
    expect(failureCalls).toHaveLength(3);
    failureCalls.forEach((line) => expect(line).toMatch(/,\s*true\);/));
  });

  it('scopes the empty-day icon rule to the direct child when the button holds its own icon', () => {
    expect(cabinet).toMatch(/\.day-empty > i\s*{/);
    expect(cabinet).not.toMatch(/\.day-empty i\s*{/);
    expect(ruleBody(cabinet, '.day-empty > i')).toMatch(/color:\s*var\(--color-slate\)/);
  });

  it('marks the selected sheet tab with a White fill and Graphite text and border when selected', () => {
    const body = ruleBody(cabinet, ".sheet-tab[aria-selected='true']");
    expect(body).toMatch(/background:\s*var\(--color-white\)/);
    expect(body).toMatch(/color:\s*var\(--color-graphite\)/);
    expect(body).toMatch(/border-color:\s*var\(--color-graphite\)/);
  });
});
