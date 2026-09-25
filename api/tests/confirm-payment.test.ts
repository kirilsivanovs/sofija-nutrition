/**
 * Confirm Payment Endpoint Tests
 * Covers the signed, expiring, booking-bound token and the admin-only
 * confirmation write path.
 */

import type { HttpRequest, InvocationContext } from '@azure/functions';

// Mock Azure Functions app registration
const mockApp = {
  http: jest.fn(),
};

jest.mock('@azure/functions', () => ({
  app: mockApp,
}));

// Mock Resend so no real email is sent
const mockSend = jest.fn().mockResolvedValue({ data: { id: 'mock-email-id' } });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Mock Azure Tables so the repository falls back to in-memory storage
jest.mock('@azure/data-tables', () => ({
  TableClient: {
    fromConnectionString: jest.fn(),
  },
}));

const ADMIN_EMAIL = 'admin@example.com';

function encodePrincipal(principal: Record<string, unknown> | null): string | null {
  if (!principal) return null;
  return Buffer.from(JSON.stringify(principal)).toString('base64');
}

const adminPrincipal = {
  userId: 'admin-1',
  identityProvider: 'aad',
  userDetails: ADMIN_EMAIL,
};

function createFakeRequest(options: {
  principal?: Record<string, unknown> | null;
  query?: Record<string, string>;
  params?: Record<string, string>;
  formData?: Record<string, string>;
  url?: string;
}): HttpRequest {
  const headers = new Map<string, string>();
  const encoded = encodePrincipal(options.principal ?? null);
  if (encoded) {
    headers.set('x-ms-client-principal', encoded);
  }

  const query = new URLSearchParams(options.query ?? {});
  const form = new Map<string, string>(Object.entries(options.formData ?? {}));

  return {
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    query,
    params: options.params ?? {},
    url: options.url ?? 'https://sofijaivanova.lv/api/confirm-payment',
    formData: async () => ({ get: (name: string) => form.get(name) ?? null }),
  } as unknown as HttpRequest;
}

function createFakeContext(): InvocationContext {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as InvocationContext;
}

describe('ConfirmPayment Endpoint', () => {
  let bookingRepository: typeof import('../src/services/bookingRepository');
  let confirmPaymentPageHandler: typeof import('../src/functions/booking/confirmPayment.function').confirmPaymentPageHandler;
  let adminConfirmPaymentHandler: typeof import('../src/functions/booking/confirmPayment.function').adminConfirmPaymentHandler;

  const futureExpiry = () => Math.floor(Date.now() / 1000) + 3600;
  const pastExpiry = () => Math.floor(Date.now() / 1000) - 3600;

  async function seedBooking(overrides: Record<string, unknown> = {}) {
    const bookingId = (overrides.id as string) || `SN-${Math.random().toString(36).slice(2, 10)}`;
    const booking = {
      id: bookingId,
      rowKey: bookingId,
      name: 'Test Patient',
      email: 'patient@example.test',
      date: '2026-03-01',
      time: '10:00',
      service: 'initial',
      serviceName: 'Initial consultation',
      consultationFormat: 'online',
      language: 'lv',
      status: 'pending',
      paymentConfirmed: false,
      ...overrides,
      id: bookingId,
    };
    await bookingRepository.saveBooking(booking);
    return booking;
  }

  beforeAll(() => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
  });

  beforeEach(() => {
    jest.resetModules();
    mockApp.http.mockClear();
    mockSend.mockClear();

    bookingRepository = require('../src/services/bookingRepository');
    ({
      confirmPaymentPageHandler,
      adminConfirmPaymentHandler,
    } = require('../src/functions/booking/confirmPayment.function'));
  });

  describe('verifyPaymentToken', () => {
    it('accepts a valid token', () => {
      const token = bookingRepository.generatePaymentToken(
        'SN-VALID001',
        'patient@example.test',
        futureExpiry()
      );
      expect(
        bookingRepository.verifyPaymentToken(token, 'SN-VALID001', 'patient@example.test')
      ).toBe(true);
    });

    it('rejects an expired token', () => {
      const token = bookingRepository.generatePaymentToken(
        'SN-EXPIRED1',
        'patient@example.test',
        pastExpiry()
      );
      expect(
        bookingRepository.verifyPaymentToken(token, 'SN-EXPIRED1', 'patient@example.test')
      ).toBe(false);
    });

    it('rejects a token with an altered signature', () => {
      const token = bookingRepository.generatePaymentToken(
        'SN-ALTERED1',
        'patient@example.test',
        futureExpiry()
      );
      const [exp, hmac] = token.split('.');
      const tampered = `${exp}.${hmac.slice(0, -2)}${hmac.slice(-2) === 'aa' ? 'bb' : 'aa'}`;
      expect(
        bookingRepository.verifyPaymentToken(tampered, 'SN-ALTERED1', 'patient@example.test')
      ).toBe(false);
    });

    it('rejects a token with an altered expiry', () => {
      const expiresAtSec = futureExpiry();
      const token = bookingRepository.generatePaymentToken(
        'SN-ALTEXP01',
        'patient@example.test',
        expiresAtSec
      );
      const [, hmac] = token.split('.');
      const tampered = `${expiresAtSec + 1000}.${hmac}`;
      expect(
        bookingRepository.verifyPaymentToken(tampered, 'SN-ALTEXP01', 'patient@example.test')
      ).toBe(false);
    });

    it('rejects a token issued for another booking id', () => {
      const token = bookingRepository.generatePaymentToken(
        'SN-OTHERID1',
        'patient@example.test',
        futureExpiry()
      );
      expect(
        bookingRepository.verifyPaymentToken(token, 'SN-DIFFERENT', 'patient@example.test')
      ).toBe(false);
    });

    it('rejects a token issued for another email', () => {
      const token = bookingRepository.generatePaymentToken(
        'SN-OTHEREML',
        'patient@example.test',
        futureExpiry()
      );
      expect(
        bookingRepository.verifyPaymentToken(token, 'SN-OTHEREML', 'someone-else@example.test')
      ).toBe(false);
    });

    it('throws generating a token when the secret is unset', () => {
      const original = process.env.PAYMENT_TOKEN_SECRET;
      delete process.env.PAYMENT_TOKEN_SECRET;
      jest.resetModules();
      const freshRepository = require('../src/services/bookingRepository');
      expect(() =>
        freshRepository.generatePaymentToken('SN-NOSECRET', 'patient@example.test', futureExpiry())
      ).toThrow();
      process.env.PAYMENT_TOKEN_SECRET = original;
    });

    it('throws generating a token when the secret is too short', () => {
      const original = process.env.PAYMENT_TOKEN_SECRET;
      process.env.PAYMENT_TOKEN_SECRET = 'short-secret';
      jest.resetModules();
      const freshRepository = require('../src/services/bookingRepository');
      expect(() =>
        freshRepository.generatePaymentToken('SN-SHORTSEC', 'patient@example.test', futureExpiry())
      ).toThrow();
      process.env.PAYMENT_TOKEN_SECRET = original;
    });
  });

  describe('confirmPaymentPageHandler', () => {
    it('renders the confirmation form for an admin and leaves the booking unconfirmed', async () => {
      const booking = await seedBooking({ id: 'SN-PAGEADMIN' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        futureExpiry()
      );

      const response = await confirmPaymentPageHandler(
        createFakeRequest({
          principal: adminPrincipal,
          query: { id: booking.id, token },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(200);
      expect(response.body as string).toContain('<form');
      expect(response.body as string).toContain(booking.id);

      const stillPending = await bookingRepository.getBooking(booking.id);
      expect(stillPending?.paymentConfirmed).toBe(false);
    });

    it('shows a sign-in link and no booking name when there is no principal', async () => {
      const booking = await seedBooking({ id: 'SN-PAGEANON' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        futureExpiry()
      );

      const response = await confirmPaymentPageHandler(
        createFakeRequest({
          principal: null,
          query: { id: booking.id, token },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(200);
      expect(response.body as string).toContain('/.auth/login/aad');
      expect(response.body as string).not.toContain(booking.name);
    });

    it('returns 400 for a bad token', async () => {
      const booking = await seedBooking({ id: 'SN-PAGEBAD01' });

      const response = await confirmPaymentPageHandler(
        createFakeRequest({
          principal: adminPrincipal,
          query: { id: booking.id, token: 'not-a-real-token' },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(400);
    });
  });

  describe('adminConfirmPaymentHandler', () => {
    it('returns 401 without a principal', async () => {
      const booking = await seedBooking({ id: 'SN-NOPRINC01' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        futureExpiry()
      );

      const response = await adminConfirmPaymentHandler(
        createFakeRequest({
          principal: null,
          params: { id: booking.id },
          formData: { token },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(401);
    });

    it('confirms exactly the targeted booking and sends one email', async () => {
      const bookingA = await seedBooking({ id: 'SN-CONFIRMA1' });
      const bookingB = await seedBooking({ id: 'SN-CONFIRMB1' });
      const token = bookingRepository.generatePaymentToken(
        bookingA.id,
        bookingA.email,
        futureExpiry()
      );

      const response = await adminConfirmPaymentHandler(
        createFakeRequest({
          principal: adminPrincipal,
          params: { id: bookingA.id },
          formData: { token },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(200);

      const confirmedA = await bookingRepository.getBooking(bookingA.id);
      expect(confirmedA?.paymentConfirmed).toBe(true);
      expect(confirmedA?.status).toBe('confirmed');

      const untouchedB = await bookingRepository.getBooking(bookingB.id);
      expect(untouchedB?.paymentConfirmed).toBe(false);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('gives "already" on replay and sends no second email', async () => {
      const booking = await seedBooking({ id: 'SN-REPLAY001' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        futureExpiry()
      );
      const request = () =>
        createFakeRequest({
          principal: adminPrincipal,
          params: { id: booking.id },
          formData: { token },
        });

      const first = await adminConfirmPaymentHandler(request(), createFakeContext());
      expect(first.status).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const second = await adminConfirmPaymentHandler(request(), createFakeContext());
      expect(second.status).toBe(200);
      expect(second.body as string).toContain('Jau apstiprināts');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('returns 400 for an expired token', async () => {
      const booking = await seedBooking({ id: 'SN-EXPPOST01' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        pastExpiry()
      );

      const response = await adminConfirmPaymentHandler(
        createFakeRequest({
          principal: adminPrincipal,
          params: { id: booking.id },
          formData: { token },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 for an altered token', async () => {
      const booking = await seedBooking({ id: 'SN-ALTPOST01' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        futureExpiry()
      );
      const tampered = token.slice(0, -1) + (token.slice(-1) === '0' ? '1' : '0');

      const response = await adminConfirmPaymentHandler(
        createFakeRequest({
          principal: adminPrincipal,
          params: { id: booking.id },
          formData: { token: tampered },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 for a cancelled booking', async () => {
      const booking = await seedBooking({ id: 'SN-CANCEL001', status: 'cancelled' });
      const token = bookingRepository.generatePaymentToken(
        booking.id,
        booking.email,
        futureExpiry()
      );

      const response = await adminConfirmPaymentHandler(
        createFakeRequest({
          principal: adminPrincipal,
          params: { id: booking.id },
          formData: { token },
        }),
        createFakeContext()
      );

      expect(response.status).toBe(400);
    });
  });
});
