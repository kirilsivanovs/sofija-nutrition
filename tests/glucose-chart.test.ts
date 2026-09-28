/**
 * Pure math and formatting behind the hero glucose chart (no DOM).
 */
import { describe, it, expect } from '@jest/globals';
import {
  monotoneCubic,
  formatTime,
  formatMmol,
  formatTimeInRangeSentence,
  heroChartConfig,
} from '../src/scripts/glucose-chart';

describe('monotoneCubic', () => {
  it('holds a flat value across a flat 3-point curve', () => {
    const values = monotoneCubic([
      [0, 5],
      [10, 5],
      [20, 5],
    ]);
    expect(values).toHaveLength(21);
    expect(values.every((v) => Math.abs(v - 5) < 1e-9)).toBe(true);
  });

  it('never overshoots past the surrounding data on a rise-then-plateau curve', () => {
    const values = monotoneCubic([
      [0, 0],
      [10, 1],
      [20, 1],
    ]);
    expect(Math.max(...values)).toBeLessThanOrEqual(1 + 1e-9);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0 - 1e-9);
  });

  it('produces one value per integer minute of the domain', () => {
    const values = monotoneCubic(heroChartConfig.a);
    expect(values).toHaveLength(241); // 0..240 inclusive
  });
});

describe('formatTime', () => {
  it('renders the start of the domain as 07:00', () => {
    expect(formatTime(0)).toBe('07:00');
  });

  it('rolls minutes into the hour at the top of an hour', () => {
    expect(formatTime(90)).toBe('08:30');
  });

  it('renders the end of the hero domain as 11:00', () => {
    expect(formatTime(240)).toBe('11:00');
  });
});

describe('formatMmol', () => {
  it('uses a comma decimal separator for lv', () => {
    expect(formatMmol(7.1, 'lv')).toBe('7,1 mmol/L');
  });

  it('uses a comma decimal separator and the RU unit spelling for ru', () => {
    expect(formatMmol(10.1, 'ru')).toBe('10,1 ммоль/л');
  });

  it('uses a dot decimal separator for en', () => {
    expect(formatMmol(7.1, 'en')).toBe('7.1 mmol/L');
  });
});

describe('formatTimeInRangeSentence', () => {
  it('states curve B minutes above range with a comma separator for lv', () => {
    expect(formatTimeInRangeSentence(37, 7.8, 'lv')).toBe(
      'A: visu laiku diapazonā. B: 37 min virs 7,8 mmol/L.'
    );
  });

  it('states curve B minutes above range with a dot separator for en', () => {
    expect(formatTimeInRangeSentence(37, 7.8, 'en')).toBe(
      'A: stays in range throughout. B: 37 min above 7.8 mmol/L.'
    );
  });

  it('falls back to the lv sentence for an unknown language', () => {
    expect(formatTimeInRangeSentence(0, 7.8, 'xx')).toContain('diapazonā');
  });
});

describe('heroChartConfig', () => {
  it('matches the range from the site design direction (3.9-7.8 mmol/L)', () => {
    expect(heroChartConfig.range).toEqual([3.9, 7.8]);
  });

  it('keeps curve A within the labelled range throughout', () => {
    const values = monotoneCubic(heroChartConfig.a);
    expect(values.every((v) => v <= heroChartConfig.range[1])).toBe(true);
  });

  it('has curve B rise above the labelled range mid-morning', () => {
    const values = monotoneCubic(heroChartConfig.b);
    expect(values.some((v) => v > heroChartConfig.range[1])).toBe(true);
  });
});
