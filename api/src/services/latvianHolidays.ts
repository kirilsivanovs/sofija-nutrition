/**
 * Latvian Public Holidays (TypeScript)
 * Based on official Latvian calendar
 * https://www.latvia.travel/en/article/public-holidays-latvia
 */

// ============================================
// Types
// ============================================

export interface FixedHoliday {
  month: number;
  day: number;
  name: string;
  nameEn: string;
}

export interface Holiday {
  date: string;
  name: string;
  nameEn: string;
}

export interface HolidayCheck {
  isHoliday: boolean;
  name?: string;
  nameEn?: string;
}

// ============================================
// Constants
// ============================================

// Fixed holidays (same date every year)
const FIXED_HOLIDAYS: FixedHoliday[] = [
  { month: 1, day: 1, name: 'Jaungada diena', nameEn: "New Year's Day" },
  { month: 5, day: 1, name: 'Darba svētki', nameEn: 'Labour Day' },
  { month: 5, day: 4, name: 'Latvijas Republikas Neatkarības atjaunošanas diena', nameEn: 'Restoration of Independence Day' },
  { month: 6, day: 23, name: 'Līgo diena', nameEn: 'Midsummer Eve' },
  { month: 6, day: 24, name: 'Jāņu diena', nameEn: 'Midsummer Day' },
  { month: 11, day: 18, name: 'Latvijas Republikas proklamēšanas diena', nameEn: 'Proclamation Day of Latvia' },
  { month: 12, day: 24, name: 'Ziemassvētku vakars', nameEn: 'Christmas Eve' },
  { month: 12, day: 25, name: 'Ziemassvētki', nameEn: 'Christmas Day' },
  { month: 12, day: 26, name: 'Otrie Ziemassvētki', nameEn: 'Second Christmas Day' },
  { month: 12, day: 31, name: 'Vecgada diena', nameEn: "New Year's Eve" }
];

// ============================================
// Helper Functions
// ============================================

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================
// Easter Calculation
// ============================================

/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm
 */
export function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Get Easter-related holidays for a given year
 */
function getEasterHolidays(year: number): Array<{ date: Date; name: string; nameEn: string }> {
  const easterSunday = calculateEasterSunday(year);

  // Good Friday is 2 days before Easter Sunday
  const goodFriday = new Date(easterSunday);
  goodFriday.setDate(goodFriday.getDate() - 2);

  // Easter Monday is 1 day after Easter Sunday
  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return [
    { date: goodFriday, name: 'Lielā Piektdiena', nameEn: 'Good Friday' },
    { date: easterSunday, name: 'Lieldienas', nameEn: 'Easter Sunday' },
    { date: easterMonday, name: 'Otrās Lieldienas', nameEn: 'Easter Monday' }
  ];
}

// ============================================
// Public API
// ============================================

/**
 * Get all Latvian public holidays for a given year
 */
export function getLatvianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Add fixed holidays
  for (const holiday of FIXED_HOLIDAYS) {
    const date = new Date(year, holiday.month - 1, holiday.day);
    holidays.push({
      date: formatDate(date),
      name: holiday.name,
      nameEn: holiday.nameEn
    });
  }

  // Add Easter-related holidays
  const easterHolidays = getEasterHolidays(year);
  for (const holiday of easterHolidays) {
    holidays.push({
      date: formatDate(holiday.date),
      name: holiday.name,
      nameEn: holiday.nameEn
    });
  }

  // Sort by date
  holidays.sort((a, b) => a.date.localeCompare(b.date));

  return holidays;
}

/**
 * Check if a date is a Latvian public holiday
 */
export function isLatvianHoliday(dateString: string): HolidayCheck {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const holidays = getLatvianHolidays(year);

  const holiday = holidays.find(h => h.date === dateString);
  if (holiday) {
    return {
      isHoliday: true,
      name: holiday.name,
      nameEn: holiday.nameEn
    };
  }

  return { isHoliday: false };
}

/**
 * Get holidays for a date range
 */
export function getHolidaysInRange(startDate: string, endDate: string): Holiday[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  let allHolidays: Holiday[] = [];
  for (let year = startYear; year <= endYear; year++) {
    allHolidays = allHolidays.concat(getLatvianHolidays(year));
  }

  return allHolidays.filter(h => h.date >= startDate && h.date <= endDate);
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  getLatvianHolidays,
  isLatvianHoliday,
  getHolidaysInRange,
  calculateEasterSunday
};
