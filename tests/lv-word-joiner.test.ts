import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const GENERATED_ASSET = path.join(PUBLIC_DIR, 'assets', 'shared-translations.js');
const API_ONLY_BLOCKS = ['email', 'pdf'];
const WORD_JOINER = '⁠';

const hasBreakableEPast = (text: string) => /[eE]-past/.test(text);

function listFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function collectStrings(node: unknown, skipKeys: string[], trail: string, out: [string, string][]) {
  if (typeof node === 'string') {
    out.push([trail, node]);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (skipKeys.includes(key)) continue;
      collectStrings(value, [], trail ? `${trail}.${key}` : key, out);
    }
  }
}

describe('LV e-pasts word joiner', () => {
  it('finds a plain e-past when the hyphen has no word joiner', () => {
    expect(hasBreakableEPast('apstiprinājumu e-pastā')).toBe(true);
    expect(hasBreakableEPast('E-pasts')).toBe(true);
    expect(hasBreakableEPast(`apstiprinājumu e-${WORD_JOINER}pastā`)).toBe(false);
  });

  it('has no breakable e-past in src/ and public/ when scanning site source', () => {
    const files = [
      ...listFiles(SRC_DIR, ['.astro', '.ts', '.tsx', '.js']),
      ...listFiles(PUBLIC_DIR, ['.html', '.js']).filter((file) => file !== GENERATED_ASSET),
    ];
    const offenders = files
      .filter((file) => hasBreakableEPast(fs.readFileSync(file, 'utf-8')))
      .map((file) => path.relative(path.join(__dirname, '..'), file));
    expect(offenders).toEqual([]);
  });

  it('has no breakable e-past in lv strings when scanning sharedTranslations', () => {
    const { sharedTranslations } = require('../shared/translations');
    const strings: [string, string][] = [];
    collectStrings(sharedTranslations.lv, API_ONLY_BLOCKS, '', strings);
    const offenders = strings.filter(([, text]) => hasBreakableEPast(text)).map(([key]) => key);
    expect(offenders).toEqual([]);
  });

  it('keeps the joiner in bookingConfirmNote when read from sharedTranslations', () => {
    const { sharedTranslations } = require('../shared/translations');
    expect(sharedTranslations.lv.messages.bookingConfirmNote).toContain(`e-${WORD_JOINER}pastā`);
  });
});
