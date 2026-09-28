/**
 * Pure Monday-first calendar grid math and keyboard navigation.
 * No DOM access, no class state — kept testable in isolation.
 */

/** Converts a JS `Date#getDay()` index (Sunday = 0) to a Monday-first column index. */
export function mondayFirstIndex(jsGetDay: number): number {
  return (jsGetDay + 6) % 7;
}

/** Reorders a Sunday-first array (e.g. translated weekday labels) to Monday-first. */
export function reorderWeekdaysMondayFirst<T>(sundayFirst: T[]): T[] {
  return [1, 2, 3, 4, 5, 6, 0].map((i) => sundayFirst[i]);
}

/** The Monday of `date`'s week (local time, time-of-day stripped). */
export function getWeekStart(date: Date): Date {
  const offset = mondayFirstIndex(date.getDay());
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - offset);
  return monday;
}

/** The 7 dates Mon..Sun starting at `weekStart` (itself a Monday). */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * The Monday of the earliest week (today or later) that has an available date,
 * falling back to today's week when every available date is in the past.
 * `availableDateStrings` are ISO (`YYYY-MM-DD`) dates already filtered for
 * actual open slots by the caller (booked appointments, buffer time).
 */
export function getFirstAvailableWeekStart(availableDateStrings: string[], today: Date): Date {
  const todayStr = toISODate(today);
  const upcoming = availableDateStrings.filter((dateStr) => dateStr >= todayStr).sort();
  return upcoming.length > 0 ? getWeekStart(new Date(upcoming[0])) : getWeekStart(today);
}

/**
 * Localized week-range label ("1.–7. oktobris", "September 28 – October 4").
 * Delegates entirely to Intl so each locale's range pattern and month
 * casing (LV/RU lowercase, EN capitalised) come from the engine, not a
 * hand-built string.
 */
export function formatWeekRange(first: Date, last: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).formatRange(first, last);
}

/**
 * The earliest available date strictly after `afterDateStr`, or `null` when
 * every available date is on or before it. Used to jump a patient out of an
 * empty week to the next one that actually has a slot.
 */
export function getNextAvailableDateAfter(
  availableDateStrings: string[],
  afterDateStr: string
): string | null {
  const upcoming = availableDateStrings.filter((dateStr) => dateStr > afterDateStr).sort();
  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * The Monday of the latest week that has an available date, so the week-nav
 * "next" control can be disabled once there is nothing further to page to.
 */
export function getLastAvailableWeekStart(availableDateStrings: string[]): Date | null {
  if (availableDateStrings.length === 0) {
    return null;
  }
  const sorted = [...availableDateStrings].sort();
  return getWeekStart(new Date(sorted[sorted.length - 1]));
}

/** Lowercases the first character only, leaving the rest of the string untouched. */
export function lowercaseFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}
