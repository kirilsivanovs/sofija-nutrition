import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const PUBLIC_DIR = path.join(ROOT, 'public');

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

const relative = (file: string) => path.relative(ROOT, file);

describe('inline scripts', () => {
  it('has no inline event handler attributes in src/ and public/ when scanning site source', () => {
    const handler = /\son[a-z]+=["'`]/;
    const files = [
      ...listFiles(SRC_DIR, ['.astro', '.html', '.ts', '.js']),
      ...listFiles(PUBLIC_DIR, ['.astro', '.html', '.ts', '.js']),
    ];
    const offenders = files
      .filter((file) => handler.test(fs.readFileSync(file, 'utf-8')))
      .map(relative);
    expect(offenders).toEqual([]);
  });

  it('has no is:inline or define:vars script without src in src/ when scanning Astro components', () => {
    const inlineScript = /<script\b(?![^>]*\bsrc=)[^>]*\b(is:inline|define:vars)\b[^>]*>/;
    const offenders = listFiles(SRC_DIR, ['.astro'])
      .filter((file) => inlineScript.test(fs.readFileSync(file, 'utf-8')))
      .map(relative);
    expect(offenders).toEqual([]);
  });

  it('disables inline script bundling when the Astro config is read', () => {
    const config = fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf-8');
    expect(config).toMatch(/assetsInlineLimit:\s*0/);
  });
});