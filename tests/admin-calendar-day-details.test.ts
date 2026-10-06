import {
  renderCalendar,
  setCalendarData,
  setCurrentDate,
  showDayDetails,
} from '../src/utils/admin/calendar';

const MARKUP_NAME = '<img src=x onerror=alert(1)>';
const actionWindow = window as Window & {
  confirmBooking?: (id: string) => void;
  cancelBooking?: (id: string) => void;
};
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

  afterEach(() => {
    delete actionWindow.confirmBooking;
    delete actionWindow.cancelBooking;
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

  const bookingOn = (overrides: Record<string, unknown> = {}) => ({
    id: 'SN-TEST1',
    date: '2026-02-10',
    time: '10:00',
    name: 'Test Person',
    email: 'test@example.test',
    phone: '+37100000000',
    notes: 'note',
    service: 'consultation',
    status: 'pending',
    price: 40,
    ...overrides,
  });

  const showBookings = (bookings: Record<string, unknown>[]) => {
    setCalendarData({
      bookings,
      schedule: { tuesday: { enabled: true, start: '09:00', end: '17:00' } },
      holidays: {},
      blockedDates: new Set(),
      vacationPeriods: [],
    });
    showDayDetails('2026-02-10');
  };

  it('renders booking name, email, phone and notes as text when they contain markup', () => {
    const payloads = {
      name: MARKUP_NAME,
      email: 'a<b>@example.test',
      phone: '<svg onload=alert(2)>',
      notes: '<script>alert(3)</script>',
    };
    showBookings([bookingOn(payloads)]);
    expect(panel().querySelector('img, svg, script, b')).toBeNull();
    Object.values(payloads).forEach(p => expect(panel().textContent).toContain(p));
  });

  it('shows the booking notes in the day panel when the API returns notes', () => {
    showBookings([bookingOn({ notes: 'Synthetic comment' })]);
    expect(panel().querySelector('.booking-details')?.textContent).toContain('Synthetic comment');
  });

  it('omits the notes row when the booking has no notes', () => {
    showBookings([bookingOn({ notes: '' })]);
    expect(panel().querySelector('.ph-note')).toBeNull();
  });

  it('shows a booking name with an apostrophe, ampersand and quote unchanged when the API returns it raw', () => {
    const rawName = 'O\'Brien & "Co"';
    showBookings([bookingOn({ name: rawName })]);
    expect(panel().querySelector('.booking-name')?.textContent).toBe(rawName);
  });

  it('calls confirmBooking with the booking id when the confirm button is clicked', () => {
    const confirmBooking = jest.fn();
    actionWindow.confirmBooking = confirmBooking;
    showBookings([bookingOn()]);
    (panel().querySelector('[data-booking-action="confirm"]') as HTMLElement).click();
    expect(confirmBooking).toHaveBeenCalledWith('SN-TEST1');
  });

  it('calls cancelBooking with the booking id when the cancel button is clicked', () => {
    const cancelBooking = jest.fn();
    actionWindow.cancelBooking = cancelBooking;
    showBookings([bookingOn()]);
    (panel().querySelector('[data-booking-action="cancel"]') as HTMLElement).click();
    expect(cancelBooking).toHaveBeenCalledWith('SN-TEST1');
  });

  it('renders no inline onclick handlers when bookings are shown', () => {
    showBookings([bookingOn(), bookingOn({ id: 'SN-TEST2', status: 'confirmed' })]);
    expect(panel().querySelector('[onclick]')).toBeNull();
  });

  it('escapes the holiday name in the cell when it contains markup', () => {
    const cell = document.querySelector('button.calendar-cell[data-date="2026-02-12"]') as HTMLElement;
    expect(cell.querySelector('img')).toBeNull();
    expect(cell.querySelector('.holiday-name')?.textContent).toBe(MARKUP_NAME);
  });
});
