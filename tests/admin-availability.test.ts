import { loadAvailabilityForm } from '../src/utils/admin/availability';
import { loadHolidays } from '../src/utils/admin/holidays';
import { AvailabilityController } from '../src/components/admin/AvailabilityController';
import { showToast } from '../src/utils/admin/notifications';

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

  it('labels the vacation remove button with its period when vacations render', async () => {
    await loadAvailability({ vacationPeriods: [{ id: 'v1', startDate: '2026-02-23', endDate: '2026-02-25' }] });
    const button = document.querySelector('#vacation-list button')!;
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-label')).toContain('23/02/2026');
    expect(button.getAttribute('aria-label')).toContain('25/02/2026');
  });

  it('labels the blocked-date remove button with its date when blocked dates render', async () => {
    await loadAvailability({ blockedDates: [{ date: '2026-02-19' }] });
    const button = document.querySelector('#blocked-dates-list button')!;
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-label')).toContain('19/02/2026');
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

describe('AvailabilityController buttons', () => {
  const callsWith = (method: string) => fetchMock.mock.calls.filter(([, init]) => init?.method === method);

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="availability-form"></div>
      <button id="save-availability"></button>
      <input id="vacation-start" /><input id="vacation-end" /><input id="vacation-reason" />
      <button id="add-vacation"></button>
      <input id="block-date" /><input id="block-reason" />
      <button id="add-blocked-date"></button>
      <div id="vacation-list"></div>
      <div id="blocked-dates-list"></div>`;
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
    (showToast as jest.Mock).mockClear();
    fetchMock.mockImplementation(async () => ({ ok: true, json: async () => ({}) }));
    new AvailabilityController(API).init();
  });

  const click = async (id: string) => {
    document.getElementById(id)!.click();
    await flush();
  };

  it('sends the weekly schedule to PUT when Save is clicked', async () => {
    await click('save-availability');
    const [[url, init]] = callsWith('PUT');
    expect(url).toBe(`${API}/dashboard/availability`);
    expect(JSON.parse(init.body).schedule.monday).toBeDefined();
  });

  it('posts the vacation period as ISO dates when Add vacation is clicked', async () => {
    (document.getElementById('vacation-start') as HTMLInputElement).value = '01/03/2027';
    (document.getElementById('vacation-end') as HTMLInputElement).value = '05/03/2027';
    await click('add-vacation');
    const [[url, init]] = callsWith('POST');
    expect(url).toBe(`${API}/dashboard/availability/vacation`);
    expect(JSON.parse(init.body)).toMatchObject({ startDate: '2027-03-01', endDate: '2027-03-05' });
  });

  it('posts the blocked date as an ISO date when Add blocked date is clicked', async () => {
    (document.getElementById('block-date') as HTMLInputElement).value = '01/03/2027';
    await click('add-blocked-date');
    const [[url, init]] = callsWith('POST');
    expect(url).toBe(`${API}/dashboard/availability/block`);
    expect(JSON.parse(init.body).date).toBe('2027-03-01');
  });

  it('shows the API error instead of success when Save is rejected', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to update availability' }),
    }));
    await click('save-availability');
    expect(showToast).toHaveBeenCalledWith('Failed to update availability', 'error');
    expect(showToast).not.toHaveBeenCalledWith(expect.anything(), 'success');
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
