jest.mock('../src/utils/constants', () => ({ API_CONFIG: { BASE_URL: '' } }));

import { get, post, APIError, formatAPIError } from '../src/utils/apiClient';

type FakeResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

function respond(status: number, body: unknown): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: async () => body,
  };
}

describe('apiClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the wrapped data when the response is ok', async () => {
    fetchMock.mockResolvedValue(respond(200, { slots: ['09:00'] }));

    const result = await get('/api/availability');

    expect(result).toEqual({ success: true, data: { slots: ['09:00'] } });
  });

  it('passes a body that already has success through unchanged when the response is ok', async () => {
    const body = { success: true, data: { id: 'b1' } };
    fetchMock.mockResolvedValue(respond(200, body));

    const result = await get('/api/bookings');

    expect(result).toEqual(body);
  });

  it('sends JSON content type and method when posting', async () => {
    fetchMock.mockResolvedValue(respond(200, { ok: 1 }));

    await post('/api/bookings', { name: 'Test' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/bookings');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'Test' }));
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('retries with backoff when the status is retryable', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(503, {}))
      .mockResolvedValueOnce(respond(503, {}))
      .mockResolvedValueOnce(respond(200, { done: true }));

    const pending = get('/api/availability');
    await jest.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(2000);

    await expect(pending).resolves.toEqual({ success: true, data: { done: true } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns without retrying when the status is not retryable', async () => {
    fetchMock.mockResolvedValue(respond(404, { error: { message: 'Not found' } }));

    await expect(get('/api/missing')).rejects.toMatchObject({ status: 404 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws APIError with status and code when the response is an error', async () => {
    fetchMock.mockResolvedValue(
      respond(400, { error: { message: 'Bad input', code: 'VALIDATION', details: { field: 'email' } } })
    );

    const error = await get('/api/bookings').catch((e) => e);

    expect(error).toBeInstanceOf(APIError);
    expect(error).toMatchObject({
      message: 'Bad input',
      status: 400,
      code: 'VALIDATION',
      details: { field: 'email' },
    });
  });

  it('throws a PARSE_ERROR APIError when the body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    const error = await get('/api/bookings').catch((e) => e);

    expect(error).toBeInstanceOf(APIError);
    expect(error).toMatchObject({ status: 200, code: 'PARSE_ERROR' });
  });

  it('throws a NETWORK_ERROR APIError when every attempt fails', async () => {
    fetchMock.mockRejectedValue(new Error('connection lost'));

    const pending = get('/api/availability').catch((e) => e);
    await jest.advanceTimersByTimeAsync(3000);
    const error = await pending;

    expect(error).toBeInstanceOf(APIError);
    expect(error).toMatchObject({ message: 'connection lost', status: 0, code: 'NETWORK_ERROR' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('calls fetch once when retry is false', async () => {
    fetchMock.mockResolvedValue(respond(503, { error: { message: 'Unavailable' } }));

    await expect(get('/api/availability', { retry: false })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns a readable message when formatAPIError gets an APIError', () => {
    expect(formatAPIError(new APIError('Bad input', 400, 'VALIDATION'))).toBe('Bad input');
    expect(formatAPIError(new Error('plain'))).toBe('plain');
    expect(formatAPIError('nope')).toBe('An unexpected error occurred');
  });
});
