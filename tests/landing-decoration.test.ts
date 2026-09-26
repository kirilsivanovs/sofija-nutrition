import fs from 'fs';
import path from 'path';

const bookingCss = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'booking.css'),
  'utf-8'
);

const globalCss = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'styles', 'global.css'),
  'utf-8'
);

const indexAstro = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'pages', 'index.astro'),
  'utf-8'
);

describe('landing background decoration', () => {
  it('has no gradient background declarations in booking.css', () => {
    expect(bookingCss).not.toMatch(/(linear|radial)-gradient\(/);
  });

  it('has no gradient background declarations in global.css', () => {
    expect(globalCss).not.toMatch(/(linear|radial)-gradient\(/);
  });

  it('has no backdrop-filter declarations in booking.css', () => {
    expect(bookingCss).not.toMatch(/backdrop-filter/);
  });

  it('has no bg-cream utility left in index.astro', () => {
    expect(indexAstro).not.toMatch(/bg-cream/);
  });
});
