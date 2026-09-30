/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.join(__dirname, '..');
const imgDir = path.join(root, 'public', 'assets', 'img');
const srcDir = path.join(root, 'src');
const MAX_IMAGE_BYTES = 300 * 1024;
const MAX_OG_BYTES = 150 * 1024;

function readSourceFiles(): string[] {
  return (fs.readdirSync(srcDir, { recursive: true }) as string[])
    .map((rel) => path.join(srcDir, rel))
    .filter((file) => fs.statSync(file).isFile())
    .filter((file) => /\.(astro|ts|tsx|js|mjs|css|html)$/.test(file))
    .map((file) => fs.readFileSync(file, 'utf-8'));
}

function referencedImages(): Set<string> {
  const refs = new Set<string>();
  for (const text of readSourceFiles()) {
    for (const match of text.matchAll(/\/assets\/img\/([\w.\-]+\.(?:jpg|jpeg|png|webp|svg|avif|gif))/g)) {
      refs.add(match[1]);
    }
  }
  return refs;
}

const layout = fs.readFileSync(path.join(srcDir, 'layouts', 'Layout.astro'), 'utf-8');

function metaContent(attr: 'property' | 'name', key: string): string {
  const tag = layout.match(new RegExp(`<meta ${attr}="${key}" content=\\{?["\`]([^"\`]+)["\`]\\}?`));
  if (!tag) throw new Error(`meta ${key} not found in Layout.astro`);
  return tag[1];
}

function ogFileName(): string {
  return path.basename(metaContent('property', 'og:image'));
}

describe('public image assets', () => {
  it('finds a public file for every /assets/img path referenced from src when scanning src', () => {
    const missing = [...referencedImages()].filter((f) => !fs.existsSync(path.join(imgDir, f)));
    expect(missing).toEqual([]);
  });

  it('references every file in public/assets/img from src when listing the folder', () => {
    const refs = referencedImages();
    const unreferenced = fs.readdirSync(imgDir).filter((f) => !refs.has(f));
    expect(unreferenced).toEqual([]);
  });

  it('keeps every image under 300 KB and free of spaces in the name when listing public', () => {
    const files = (fs.readdirSync(path.join(root, 'public'), { recursive: true }) as string[]).filter((rel) =>
      fs.statSync(path.join(root, 'public', rel)).isFile()
    );
    expect(files.filter((f) => /\s/.test(path.basename(f)))).toEqual([]);
    const tooBig = fs.readdirSync(imgDir).filter((f) => fs.statSync(path.join(imgDir, f)).size > MAX_IMAGE_BYTES);
    expect(tooBig).toEqual([]);
  });
});

describe('OG image meta', () => {
  it('points og:image and twitter:image at the same existing file when reading Layout', () => {
    expect(metaContent('name', 'twitter:image')).toBe(metaContent('property', 'og:image'));
    expect(fs.existsSync(path.join(imgDir, ogFileName()))).toBe(true);
  });

  it('declares og:image:width and height equal to the file dimensions when reading the file', async () => {
    const { width, height } = await sharp(path.join(imgDir, ogFileName())).metadata();
    expect(Number(metaContent('property', 'og:image:width'))).toBe(width);
    expect(Number(metaContent('property', 'og:image:height'))).toBe(height);
  });

  it('is a JPEG of at most 150 KB when checking the OG file', async () => {
    const file = path.join(imgDir, ogFileName());
    const { format } = await sharp(file).metadata();
    expect(format).toBe('jpeg');
    expect(fs.statSync(file).size).toBeLessThanOrEqual(MAX_OG_BYTES);
  });
});
