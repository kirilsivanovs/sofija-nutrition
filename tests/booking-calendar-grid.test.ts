/**
 * Booking Calendar Grid Tests
 *
 * Pure Monday-first grid math and keyboard navigation (no DOM).
 */
import { describe, it, expect } from '@jest/globals';
import {
  mondayFirstIndex,
  reorderWeekdaysMondayFirst,
  getLeadingBlanks,
  getMonthGridDates,
  getKeyTargetDate,
} from '../src/scripts/booking/calendar-grid';

describe('reorderWeekdaysMondayFirst', () => {
  it('maps Sunday to the last column when reordering to Monday-first', () => {
    const sundayFirst = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    expect(reorderWeekdaysMondayFirst(sundayFirst)[6]).toBe('Su');
  });

  it('maps Monday to the first column when reordering to Monday-first', () => {
    const sundayFirst = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    expect(reorderWeekdaysMondayFirst(sundayFirst)[0]).toBe('Mo');
  });
});

describe('getLeadingBlanks', () => {
  it('returns 0 leading blanks when the month starts on a Monday', () => {
    // September 2025 starts on a Monday
    expect(getLeadingBlanks(2025, 8)).toBe(0);
  });

  it('returns 6 leading blanks when the month starts on a Sunday', () => {
    // June 2025 starts on a Sunday
    expect(getLeadingBlanks(2025, 5)).toBe(6);
  });
});

describe('getMonthGridDates', () => {
  it('returns one date per day of the month after the leading blanks', () => {
    const grid = getMonthGridDates(2025, 8); // September 2025, 30 days
    const leadingBlanks = grid.filter((d) => d === null).length;
    const dates = grid.filter((d): d is Date => d !== null);
    expect(leadingBlanks).toBe(0);
    expect(dates).toHaveLength(30);
    expect(dates[0].getDate()).toBe(1);
    expect(dates[29].getDate()).toBe(30);
  });
});

describe('getKeyTargetDate', () => {
  const wednesday = new Date(2025, 8, 10); // Sept 10, 2025 is a Wednesday

  it('moves one day forward on ArrowRight', () => {
    const result = getKeyTargetDate(wednesday, 'ArrowRight');
    expect(result?.getDate()).toBe(11);
  });

  it('moves one day back on ArrowLeft', () => {
    const result = getKeyTargetDate(wednesday, 'ArrowLeft');
    expect(result?.getDate()).toBe(9);
  });

  it('moves one week forward on ArrowDown', () => {
    const result = getKeyTargetDate(wednesday, 'ArrowDown');
    expect(result?.getDate()).toBe(17);
  });

  it('moves one week back on ArrowUp', () => {
    const result = getKeyTargetDate(wednesday, 'ArrowUp');
    expect(result?.getDate()).toBe(3);
  });

  it('moves to the Monday of the current week on Home', () => {
    const result = getKeyTargetDate(wednesday, 'Home');
    expect(result?.getDate()).toBe(8);
    expect(result?.getDay()).toBe(1);
  });

  it('moves to the Sunday of the current week on End', () => {
    const result = getKeyTargetDate(wednesday, 'End');
    expect(result?.getDate()).toBe(14);
    expect(result?.getDay()).toBe(0);
  });

  it('moves to the same day one month earlier on PageUp', () => {
    const result = getKeyTargetDate(wednesday, 'PageUp');
    expect(result?.getMonth()).toBe(7);
    expect(result?.getDate()).toBe(10);
  });

  it('moves to the same day one month later on PageDown', () => {
    const result = getKeyTargetDate(wednesday, 'PageDown');
    expect(result?.getMonth()).toBe(9);
    expect(result?.getDate()).toBe(10);
  });

  it('returns null for a key that is not a navigation key', () => {
    expect(getKeyTargetDate(wednesday, 'Tab')).toBeNull();
  });
});
