import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'fresh-clinical.css'),
  'utf-8'
);

function readToken(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`));
  if (!match) {
    throw new Error(`token --${name} not found in fresh-clinical.css`);
  }
  return match[1];
}

function hexToRgb(hex: string): [number, number, number] {
  let normalized = hex.slice(1);
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(normalized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrast(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('design tokens contrast', () => {
  const ink = readToken('color-ink');
  const sageDeep = readToken('color-sage-deep');
  const primary = readToken('color-primary');
  const secondaryDark = readToken('color-secondary-dark');
  const cream = readToken('color-cream');
  const bgLight = readToken('color-bg-light');

  it('keeps ink text on light backgrounds at or above a 4.5:1 contrast ratio', () => {
    expect(contrast(ink, cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ink, bgLight)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the sage-deep accent at or above a 4.5:1 contrast ratio on light backgrounds', () => {
    expect(contrast(sageDeep, cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(sageDeep, bgLight)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the primary green at or above a 3:1 contrast ratio for use as a focus ring on light backgrounds', () => {
    expect(contrast(primary, cream)).toBeGreaterThanOrEqual(3);
    expect(contrast(primary, bgLight)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the secondary-dark gold at or above a 3:1 contrast ratio for decorative borders on light backgrounds', () => {
    expect(contrast(secondaryDark, cream)).toBeGreaterThanOrEqual(3);
    expect(contrast(secondaryDark, bgLight)).toBeGreaterThanOrEqual(3);
  });
});
