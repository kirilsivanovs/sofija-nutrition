/**
 * Authentication Middleware Tests
 * 🔴 CRITICAL: Защита admin API от несанкционированного доступа
 */

import {
  checkAuthorization,
  unauthorizedResponse,
  isAdminEmail,
  getAllowedAdminEmails,
} from '../src/utils/authMiddleware';

describe('Auth Middleware', () => {
  const originalEnv = process.env;
  const ADMIN_EMAIL = 'admin@example.com';
  const NON_ADMIN_EMAIL = 'user@example.com';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.E2E_TEST_TOKEN;
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('SWA Built-in Auth (x-ms-client-principal)', () => {
    test('should authorize valid SWA principal with admin email', () => {
      const principal = {
        userId: 'user-123',
        identityProvider: 'aad',
        userDetails: ADMIN_EMAIL,
        userRoles: ['authenticated', 'admin'],
      };
      const encodedPrincipal = Buffer.from(JSON.stringify(principal)).toString('base64');

      const mockRequest = {
        headers: {
          get: (name) => (name === 'x-ms-client-principal' ? encodedPrincipal : null),
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('swa-auth');
      expect(result.user.id).toBe('user-123');
      expect(result.user.provider).toBe('aad');
    });

    test('should reject SWA principal with non-admin email', () => {
      const principal = {
        userId: 'user-456',
        identityProvider: 'aad',
        userDetails: NON_ADMIN_EMAIL,
        userRoles: ['authenticated'],
      };
      const encodedPrincipal = Buffer.from(JSON.stringify(principal)).toString('base64');

      const mockRequest = {
        headers: {
          get: (name) => (name === 'x-ms-client-principal' ? encodedPrincipal : null),
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
      expect(result.error).toContain('Access denied');
      expect(result.error).not.toContain(NON_ADMIN_EMAIL);
    });

    test('should reject malformed SWA principal', () => {
      const mockRequest = {
        headers: {
          get: (name) => (name === 'x-ms-client-principal' ? 'not-valid-base64!' : null),
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });

    test('should reject SWA principal without userId', () => {
      const principal = {
        identityProvider: 'aad',
        userDetails: 'admin@example.com',
        // userId отсутствует
      };
      const encodedPrincipal = Buffer.from(JSON.stringify(principal)).toString('base64');

      const mockRequest = {
        headers: {
          get: (name) => (name === 'x-ms-client-principal' ? encodedPrincipal : null),
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });
  });

  describe('Removed bypasses (regression)', () => {
    test('rejects a localhost Origin without a principal when FUNCTIONS_WORKER_RUNTIME is node', () => {
      process.env.FUNCTIONS_WORKER_RUNTIME = 'node';

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'origin') return 'http://localhost:4321';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });

    test('rejects a localhost Origin without a principal when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.FUNCTIONS_WORKER_RUNTIME;

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'origin') return 'http://localhost:4321';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });

    test('rejects an X-E2E-Token header when E2E_TEST_TOKEN is set', () => {
      process.env.E2E_TEST_TOKEN = 'valid-test-token-12345';

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'x-e2e-token') return 'valid-test-token-12345';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });
  });

  describe('No Authentication', () => {
    test('should reject request without any auth headers', () => {
      delete process.env.E2E_TEST_TOKEN;
      delete process.env.NODE_ENV;
      delete process.env.FUNCTIONS_WORKER_RUNTIME;

      const mockRequest = {
        headers: {
          get: () => null,
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('unauthorizedResponse', () => {
    test('should return 401 status', () => {
      const response = unauthorizedResponse('Test error');

      expect(response.status).toBe(401);
      expect(response.jsonBody.success).toBe(false);
      expect(response.jsonBody.error.code).toBe('UNAUTHORIZED');
      expect(response.jsonBody.error.message).toBe('Test error');
      expect(response.jsonBody.meta.hint).toBe('Sign in through SWA auth');
    });
  });

  describe('Admin Email Authorization', () => {
    test('should allow admin email (case-insensitive)', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,ivanovs.kirils95@gmail.com';

      expect(isAdminEmail('admin@example.com')).toBe(true);
      expect(isAdminEmail('ADMIN@EXAMPLE.COM')).toBe(true);
      expect(isAdminEmail('Admin@Example.Com')).toBe(true);
      expect(isAdminEmail('ivanovs.kirils95@gmail.com')).toBe(true);
    });

    test('should reject non-admin email', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      expect(isAdminEmail('user@example.com')).toBe(false);
      expect(isAdminEmail('kirilsivanovs@pingserverdevad.onmicrosoft.com')).toBe(false);
    });

    test('should reject undefined or empty email', () => {
      expect(isAdminEmail(undefined)).toBe(false);
      expect(isAdminEmail('')).toBe(false);
    });

    test('should parse multiple admin emails from env', () => {
      process.env.ADMIN_EMAILS = 'admin1@test.com, admin2@test.com , admin3@test.com';

      const emails = getAllowedAdminEmails();

      expect(emails).toContain('admin1@test.com');
      expect(emails).toContain('admin2@test.com');
      expect(emails).toContain('admin3@test.com');
      expect(emails.length).toBe(3);
    });

    test('returns no admins when ADMIN_EMAILS is unset', () => {
      delete process.env.ADMIN_EMAILS;

      const emails = getAllowedAdminEmails();

      expect(emails).toEqual([]);
    });

    test('rejects an admin principal when ADMIN_EMAILS is unset', () => {
      delete process.env.ADMIN_EMAILS;

      const principal = {
        userId: 'user-123',
        identityProvider: 'aad',
        userDetails: ADMIN_EMAIL,
      };
      const encodedPrincipal = Buffer.from(JSON.stringify(principal)).toString('base64');

      const mockRequest = {
        headers: {
          get: (name) => (name === 'x-ms-client-principal' ? encodedPrincipal : null),
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });
  });
});
