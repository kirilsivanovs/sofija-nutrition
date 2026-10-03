import { loadAvailabilityForm } from '../src/utils/admin/availability';
import { loadHolidays } from '../src/utils/admin/holidays';

jest.mock('../src/utils/admin/notifications', () => ({
  showToast: jest.fn(),
  showConfirm: jest.fn().mockResolvedValue(true),
}));

const MARKUP = '<img src=x onerror=alert(1)>';
const QUOTES = `O'Brien & "Co"`;
const API = '/api';

const fetchMock = jest.fn();
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function respondWith(body: unknown) {
  fetchMock.mockImplementation(async () => ({ json: async () => body }));
}

async function loadAvailability(body: unknown) {
  respondWith(body);
  loadAvailabilityForm(API);
  await flush();
}

const deleteCall = () => fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE');

describe('availability lists', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="availability-form"></div>
      <div id="vacation-list"></div>
      <div id="blocked-dates-list"></div>`;
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
  });

  it('renders a vacation reason with markup as text when the API returns it raw', async () => {
    await loadAvailability({
      vacationPeriods: [{ id: 'v1', startDate: '2026-02-23', endDate: '2026-02-25', reason: MARKUP }],
    });
    const list = document.getElementById('vacation-list')!;
    expect(list.querySelector('img')).toBeNull();
    expect(list.textContent).toContain(MARKUP);
  });

  it('renders a blocked-date reason with markup as text when the API returns it raw', async () => {
    await loadAvailability({ blockedDates: [{ date: '2026-02-19', reason: `${MARKUP} ${QUOTES}` }] });
    const list = document.getElementById('blocked-dates-list')!;
    expect(list.querySelector('img')).toBeNull();
    expect(list.textContent).toContain(`${MARKUP} ${QUOTES}`);
  });

  it('sends the vacation id to the DELETE endpoint when its remove button is clicked', async () => {
    const id = `v'1"&`;
    await loadAvailability({ vacationPeriods: [{ id, startDate: '2026-02-23', endDate: '2026-02-25' }] });
    (document.querySelector('#vacation-list button') as HTMLElement).click();
    await flush();
    const [url, init] = deleteCall()!;
    expect(url).toBe(`${API}/dashboard/availability/vacation`);
    expect(JSON.parse(init.body)).toEqual({ id });
  });

  it('sends the blocked date to the DELETE endpoint when its remove button is clicked', async () => {
    await loadAvailability({ blockedDates: [{ date: '2026-02-19', reason: QUOTES }] });
    (document.querySelector('#blocked-dates-list button') as HTMLElement).click();
    await flush();
    const [url, init] = deleteCall()!;
    expect(url).toBe(`${API}/dashboard/availability/block`);
    expect(JSON.parse(init.body)).toEqual({ date: '2026-02-19' });
  });
});

describe('loadHolidays', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="holiday-year"><option value="2026" selected>2026</option></select>
      <div id="holidays-list"></div>`;
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
  });

  it('renders a holiday name with markup as text when the API returns it', async () => {
    respondWith({ holidays: [{ date: '2026-02-12', name: `${MARKUP} ${QUOTES}` }] });
    await loadHolidays(API);
    const list = document.getElementById('holidays-list')!;
    expect(list.querySelector('img')).toBeNull();
    expect(list.textContent).toContain(`${MARKUP} ${QUOTES}`);
  });
});
