import {
  renderCalendar,
  setCalendarData,
  setCurrentDate,
  showDayDetails,
} from '../src/utils/admin/calendar';

const MARKUP_NAME = '<img src=x onerror=alert(1)>';
const panel = () => document.getElementById('day-bookings-list') as HTMLElement;

describe('admin calendar day details', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="calendar-grid"></div>
      <div id="day-details" class="hidden"><h3 id="day-details-title"></h3><div id="day-bookings-list"></div></div>`;
    setCurrentDate(new Date(2026, 1, 1));
    setCalendarData({
      bookings: [],
      schedule: { tuesday: { enabled: true, start: '09:00', end: '17:00' } },
      holidays: { '2026-02-12': MARKUP_NAME },
      blockedDates: new Set(['2026-02-19']),
      vacationPeriods: [{ start: '2026-02-23', end: '2026-02-25' }],
    });
    renderCalendar();
  });

  it('shows the vacation reason row when the selected day is in a vacation period', () => {
    showDayDetails('2026-02-24');
    expect(panel().textContent).toContain('Atvaļinājums');
    expect(panel().textContent).not.toContain('Nav ierakstu');
  });

  it('shows the blocked reason row when the selected day is blocked', () => {
    showDayDetails('2026-02-19');
    expect(panel().textContent).toContain('Bloķēts');
    expect(panel().textContent).not.toContain('Nav ierakstu');
  });

  it('shows the empty state when the day has no bookings and no reason', () => {
    showDayDetails('2026-02-10');
    expect(panel().textContent).toContain('Nav ierakstu šajā dienā');
  });

  it('escapes the holiday name in the day panel when it contains markup', () => {
    showDayDetails('2026-02-12');
    expect(panel().querySelector('img')).toBeNull();
    expect(panel().textContent).toContain(MARKUP_NAME);
  });

  it('escapes the holiday name in the cell when it contains markup', () => {
    const cell = document.querySelector('button.calendar-cell[data-date="2026-02-12"]') as HTMLElement;
    expect(cell.querySelector('img')).toBeNull();
    expect(cell.querySelector('.holiday-name')?.textContent).toBe(MARKUP_NAME);
  });
});
