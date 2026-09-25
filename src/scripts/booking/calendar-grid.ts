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

/** Number of blank leading cells before the 1st of the month in a Monday-first grid. */
export function getLeadingBlanks(year: number, month: number): number {
  return mondayFirstIndex(new Date(year, month, 1).getDay());
}

/** One `Date` per day of the month, preceded by the Monday-first leading blanks (`null`). */
export function getMonthGridDates(year: number, month: number): (Date | null)[] {
  const leadingBlanks = getLeadingBlanks(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dates: (Date | null)[] = new Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }
  return dates;
}

/**
 * Next focus target per the WAI-ARIA date-grid keyboard pattern.
 * Returns null for any key that isn't a navigation key.
 */
export function getKeyTargetDate(current: Date, key: string): Date | null {
  switch (key) {
    case 'ArrowLeft': {
      const next = new Date(current);
      next.setDate(next.getDate() - 1);
      return next;
    }
    case 'ArrowRight': {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      return next;
    }
    case 'ArrowUp': {
      const next = new Date(current);
      next.setDate(next.getDate() - 7);
      return next;
    }
    case 'ArrowDown': {
      const next = new Date(current);
      next.setDate(next.getDate() + 7);
      return next;
    }
    case 'Home': {
      const offset = mondayFirstIndex(current.getDay());
      const next = new Date(current);
      next.setDate(next.getDate() - offset);
      return next;
    }
    case 'End': {
      const offset = mondayFirstIndex(current.getDay());
      const next = new Date(current);
      next.setDate(next.getDate() + (6 - offset));
      return next;
    }
    case 'PageUp': {
      const next = new Date(current);
      next.setMonth(next.getMonth() - 1);
      return next;
    }
    case 'PageDown': {
      const next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
    default:
      return null;
  }
}
