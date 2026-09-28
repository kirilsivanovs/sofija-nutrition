/**
 * Booking Calendar Grid Tests
 *
 * Pure Monday-first grid math and keyboard navigation (no DOM).
 */
import { describe, it, expect } from '@jest/globals';
import {
  mondayFirstIndex,
  reorderWeekdaysMondayFirst,
  getWeekStart,
  getWeekDates,
  getFirstAvailableWeekStart,
  formatWeekRange,
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

describe('week grid', () => {
  it('returns the Monday of the current week for getWeekStart', () => {
    const wednesday = new Date(2025, 8, 10); // Sept 10, 2025 is a Wednesday
    const result = getWeekStart(wednesday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(8);
  });

  it('returns 7 consecutive dates from getWeekDates', () => {
    const monday = new Date(2025, 8, 8);
    const dates = getWeekDates(monday);
    expect(dates).toHaveLength(7);
    expect(dates[0].getDate()).toBe(8);
    expect(dates[6].getDate()).toBe(14);
    expect(dates[6].getDay()).toBe(0);
  });
});

describe('getFirstAvailableWeekStart', () => {
  it('falls back to the current week when every available date is in the past', () => {
    const today = new Date(2026, 8, 27); // 2026-09-27
    const result = getFirstAvailableWeekStart(['2026-01-19', '2026-01-20'], today);
    expect(result.getTime()).toEqual(getWeekStart(today).getTime());
  });

  it('picks the week of the earliest available date on or after today', () => {
    const today = new Date(2026, 8, 27); // 2026-09-27
    const result = getFirstAvailableWeekStart(['2026-01-19', '2026-10-05', '2026-10-01'], today);
    expect(result.getTime()).toEqual(getWeekStart(new Date(2026, 9, 1)).getTime());
  });
});

describe('formatWeekRange', () => {
  const monthNameCount = (label: string, months: string[]) =>
    months.filter((month) => label.toLowerCase().includes(month.toLowerCase())).length;

  it('names the month once when the week stays in one month', () => {
    const first = new Date(2026, 9, 5); // 2026-10-05
    const last = new Date(2026, 9, 11); // 2026-10-11

    const lv = formatWeekRange(first, last, 'lv');
    expect(monthNameCount(lv, ['oktobris', 'oktobra'])).toBe(1);

    const ru = formatWeekRange(first, last, 'ru');
    expect(monthNameCount(ru, ['октябр'])).toBe(1);

    const en = formatWeekRange(first, last, 'en');
    expect(monthNameCount(en, ['October'])).toBe(1);
    expect(en).not.toMatch(/\d\.\s*[A-Z]/);
  });

  it('names both months when the week crosses a month', () => {
    const first = new Date(2026, 8, 28); // 2026-09-28
    const last = new Date(2026, 9, 4); // 2026-10-04

    const lv = formatWeekRange(first, last, 'lv');
    expect(monthNameCount(lv, ['septembris', 'septembra'])).toBe(1);
    expect(monthNameCount(lv, ['oktobris', 'oktobra'])).toBe(1);

    const ru = formatWeekRange(first, last, 'ru');
    expect(monthNameCount(ru, ['сентябр'])).toBe(1);
    expect(monthNameCount(ru, ['октябр'])).toBe(1);

    const en = formatWeekRange(first, last, 'en');
    expect(monthNameCount(en, ['September'])).toBe(1);
    expect(monthNameCount(en, ['October'])).toBe(1);
  });

  it('keeps LV and RU month names lowercase', () => {
    const first = new Date(2026, 9, 5);
    const last = new Date(2026, 9, 11);

    const lv = formatWeekRange(first, last, 'lv');
    expect(lv).not.toMatch(/[A-ZĀČĒĢĪĶĻŅŠŪŽ]/);

    const ru = formatWeekRange(first, last, 'ru');
    expect(ru).not.toMatch(/[А-ЯЁ]/);
  });
});
