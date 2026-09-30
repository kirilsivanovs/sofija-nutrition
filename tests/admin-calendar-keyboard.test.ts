import {
  renderCalendar,
  attachCalendarGridHandlers,
  setCalendarData,
  setCurrentDate,
} from '../src/utils/admin/calendar';

const SYNTHETIC_NAME = 'Testa Vards';
const grid = () => document.getElementById('calendar-grid') as HTMLElement;
const dayButton = (date: string) =>
  document.querySelector(`button.calendar-cell[data-date="${date}"]`) as HTMLButtonElement;
const pressKey = (target: Element, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('admin calendar keyboard', () => {
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
      bookings: [
        { date: '2026-02-10', status: 'confirmed', name: SYNTHETIC_NAME, email: 'a@example.test', time: '10:00', service: 'x' },
        { date: '2026-02-10', status: 'pending', name: SYNTHETIC_NAME, email: 'a@example.test', time: '11:00', service: 'x' },
      ],
      schedule: { tuesday: { enabled: true, start: '09:00', end: '17:00' } },
      holidays: { '2026-02-12': 'Diena "ar" pēdiņām' },
      blockedDates: new Set(),
      vacationPeriods: [],
    });
    renderCalendar();
    attachCalendarGridHandlers(grid());
  });

  it('renders every day as a button with data-date and exactly one tabindex 0 when the grid is built', () => {
    const buttons = document.querySelectorAll('button.calendar-cell[data-date]');
    expect(buttons).toHaveLength(28);
    expect(document.querySelectorAll('button.calendar-cell[tabindex="0"]')).toHaveLength(1);
  });

  it('leaves the aria-label with date and counts only when bookings exist', () => {
    const label = dayButton('2026-02-10').getAttribute('aria-label') as string;
    expect(label).toContain('apstiprināti: 1');
    expect(label).toContain('gaida: 1');
    expect(label).not.toContain('atcelti');
    document.querySelectorAll('button.calendar-cell').forEach(b => {
      expect(b.getAttribute('aria-label')).not.toContain(SYNTHETIC_NAME);
    });
  });

  it('escapes the holiday name in the aria-label when it contains quotes', () => {
    const cell = dayButton('2026-02-12');
    expect(cell).not.toBeNull();
    expect(cell.getAttribute('aria-label')).toContain('Diena "ar" pēdiņām');
    expect(document.querySelectorAll('button.calendar-cell[data-date]')).toHaveLength(28);
  });

  it('moves focus one day right when ArrowRight is pressed', () => {
    const start = dayButton('2026-02-10');
    start.focus();
    pressKey(start, 'ArrowRight');
    expect(document.activeElement).toBe(dayButton('2026-02-11'));
    expect(dayButton('2026-02-11').getAttribute('tabindex')).toBe('0');
    expect(document.querySelectorAll('button.calendar-cell[tabindex="0"]')).toHaveLength(1);
  });

  it('moves focus one week down when ArrowDown is pressed', () => {
    const start = dayButton('2026-02-10');
    start.focus();
    pressKey(start, 'ArrowDown');
    expect(document.activeElement).toBe(dayButton('2026-02-17'));
  });

  it('keeps focus on the last day when ArrowRight is pressed there', () => {
    const last = dayButton('2026-02-28');
    last.focus();
    pressKey(last, 'ArrowRight');
    expect(document.activeElement).toBe(last);
  });

  it('opens the day details when a day button is activated', () => {
    dayButton('2026-02-10').click();
    expect(document.getElementById('day-details-title')?.textContent).toContain('10');
    expect(document.getElementById('day-bookings-list')?.innerHTML).not.toBe('');
  });

  it('marks only the activated day with aria-pressed true when another day was selected before', () => {
    dayButton('2026-02-10').click();
    dayButton('2026-02-11').click();
    expect(dayButton('2026-02-10').getAttribute('aria-pressed')).toBe('false');
    expect(dayButton('2026-02-11').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('.calendar-cell.selected')).toHaveLength(1);
  });
});
