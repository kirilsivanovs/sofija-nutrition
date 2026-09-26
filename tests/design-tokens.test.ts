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
  const white = readToken('color-white');
  const graphite = readToken('color-graphite');
  const slate = readToken('color-slate');
  const navy = readToken('color-navy');
  const navyHover = readToken('color-navy-hover');
  const range = readToken('color-range');
  const mist = readToken('color-mist');
  const error = readToken('color-error');
  const high = readToken('color-high');

  it('keeps Graphite text at or above 4.5:1 on White and Mist', () => {
    expect(contrast(graphite, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(graphite, mist)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps Slate secondary text at or above 4.5:1 on White and Mist', () => {
    expect(contrast(slate, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(slate, mist)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps White text at or above 4.5:1 on Navy and Navy-hover', () => {
    expect(contrast(white, navy)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(white, navyHover)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps Range at or above 4.5:1 on White and Mist', () => {
    expect(contrast(range, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(range, mist)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps Error at or above 4.5:1 on White', () => {
    expect(contrast(error, white)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps High below the 4.5:1 text floor, confirming it stays graphic-only', () => {
    expect(contrast(high, white)).toBeLessThan(4.5);
  });
});
