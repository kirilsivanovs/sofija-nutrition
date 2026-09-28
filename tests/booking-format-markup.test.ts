/**
 * Regression test for an unclosed <input> tag swallowing the following
 * <span class="format-label"> as a bogus attribute (booking-calendar.js:440).
 */
import { readFileSync } from 'fs';
import { join } from 'path';

describe('booking format radio markup', () => {
  const source = readFileSync(
    join(__dirname, '../src/scripts/booking/booking-calendar.js'),
    'utf-8'
  );

  it('closes every format radio input before its format-label span', () => {
    const radioBlocks = source.match(
      /<input type="radio" name="consultationFormat"[^]*?<\/label>/g
    );

    expect(radioBlocks).not.toBeNull();
    expect(radioBlocks!.length).toBeGreaterThan(0);

    for (const block of radioBlocks!) {
      expect(block).toMatch(
        /<input type="radio" name="consultationFormat"[^<>]*>\s*<span class="format-label">/
      );
    }
  });
});
