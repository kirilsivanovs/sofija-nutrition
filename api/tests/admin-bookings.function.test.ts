/**
 * Admin bookings function tests: the cancellation path must not log the client email.
 */
jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

jest.mock('../src/utils/authMiddleware', () => ({
  checkAuthorization: jest.fn().mockReturnValue({ authorized: true, method: 'swa', user: { name: 'admin' } }),
  unauthorizedResponse: jest.fn(),
}));

jest.mock('@azure/data-tables', () => ({
  TableClient: {
    fromConnectionString: jest.fn().mockReturnValue({
      listEntities: async function* () {
        yield {
          partitionKey: 'bookings',
          rowKey: 'SN-TEST001',
          email: 'client@example.test',
          status: 'pending',
          language: 'lv',
          service: 'initial',
        };
      },
      updateEntity: jest.fn().mockResolvedValue({}),
    }),
  },
}));

jest.mock('../src/services/emailService', () => ({
  ...jest.requireActual('../src/services/emailService'),
  sendCancellationNotification: jest.fn().mockResolvedValue({ success: true }),
}));

import { app, HttpRequest, InvocationContext } from '@azure/functions';
import '../src/functions/admin/bookings.function';

type Handler = (request: HttpRequest, context: InvocationContext) => Promise<{ status?: number }>;

function findHandler(name: string): Handler {
  const call = (app.http as jest.Mock).mock.calls.find(([registeredName]) => registeredName === name);
  return call[1].handler;
}

describe('adminUpdateBooking', () => {
  it('omits the client email from the log when an admin cancels a booking', async () => {
    const context = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const request = {
      headers: { get: () => null },
      params: { id: 'SN-TEST001' },
      json: async () => ({ status: 'cancelled' }),
    } as unknown as HttpRequest;

    const response = await findHandler('adminUpdateBooking')(request, context as unknown as InvocationContext);

    const logged = [context.log, context.warn, context.error].flatMap((fn) =>
      fn.mock.calls.map((call) => JSON.stringify(call))
    );
    expect(response.status).toBe(200);
    expect(logged.some((line) => line.includes('client@example.test'))).toBe(false);
    expect(logged.some((line) => line.includes('SN-TEST001'))).toBe(true);
  });
});
