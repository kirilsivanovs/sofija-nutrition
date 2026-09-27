import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

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

const srcCssAndAstroFiles = listFiles(SRC_DIR, ['.css', '.astro']);
const srcAllFiles = listFiles(SRC_DIR, ['.css', '.astro', '.ts', '.tsx', '.js']);
const publicFiles = listFiles(PUBLIC_DIR, ['.js', '.html', '.css', '.json']);

describe('legacy token guard', () => {
  it('has no legacy colour token name left in src/', () => {
    const pattern =
      /--color-(primary|ink|accent|sage|secondary|cream|bg-light|text-light|muted|border)\b/;
    for (const file of srcCssAndAstroFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect({ file: path.relative(SRC_DIR, file), match: pattern.test(content) }).toEqual({
        file: path.relative(SRC_DIR, file),
        match: false,
      });
    }
  });

  it('has no --font-serif reference left in src/', () => {
    const pattern = /--font-serif\b/;
    for (const file of srcCssAndAstroFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect({ file: path.relative(SRC_DIR, file), match: pattern.test(content) }).toEqual({
        file: path.relative(SRC_DIR, file),
        match: false,
      });
    }
  });

  it('has no dead Tailwind color-utility class bound to a retired token in src/', () => {
    const pattern =
      /\b(bg|text|focus:bg|focus:text)-(primary|accent|secondary|muted|border|bg-light|text-light)\b/;
    for (const file of srcCssAndAstroFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect({ file: path.relative(SRC_DIR, file), match: pattern.test(content) }).toEqual({
        file: path.relative(SRC_DIR, file),
        match: false,
      });
    }
  });

  it('has no font-serif Tailwind utility class left in src/', () => {
    const pattern = /\bfont-serif\b/;
    for (const file of srcCssAndAstroFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect({ file: path.relative(SRC_DIR, file), match: pattern.test(content) }).toEqual({
        file: path.relative(SRC_DIR, file),
        match: false,
      });
    }
  });

  it('has no logo.svg reference left in src/ or public/', () => {
    const pattern = /logo\.svg/;
    for (const file of [...srcAllFiles, ...publicFiles]) {
      const content = fs.readFileSync(file, 'utf-8');
      const dir = file.startsWith(SRC_DIR) ? SRC_DIR : PUBLIC_DIR;
      expect({ file: path.relative(dir, file), match: pattern.test(content) }).toEqual({
        file: path.relative(dir, file),
        match: false,
      });
    }
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'assets', 'img', 'logo.svg'))).toBe(false);
  });
});
