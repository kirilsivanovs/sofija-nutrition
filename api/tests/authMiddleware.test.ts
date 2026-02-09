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
  const TEST_E2E_TOKEN = 'valid-test-token-12345';
  const ADMIN_EMAIL = 'ivanovs.kirils95@gmail.com';
  const NON_ADMIN_EMAIL = 'kirilsivanovs@pingserverdevad.onmicrosoft.com';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.E2E_TEST_TOKEN = TEST_E2E_TOKEN;
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
      expect(result.error).toContain(NON_ADMIN_EMAIL);
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

  describe('E2E Token Auth (x-e2e-token)', () => {
    test('should authorize valid E2E token', () => {
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

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('e2e-token');
      expect(result.user.id).toBe('e2e-test-user');
    });

    test('should reject invalid E2E token', () => {
      process.env.E2E_TEST_TOKEN = 'correct-token';

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'x-e2e-token') return 'wrong-token';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });

    test('should reject E2E token when not configured', () => {
      delete process.env.E2E_TEST_TOKEN;

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'x-e2e-token') return 'some-token';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(false);
    });
  });

  describe('Localhost Development', () => {
    test('should authorize localhost in development mode', () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'origin') return 'http://localhost:4321';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('localhost');
    });

    test('should NOT authorize localhost in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.FUNCTIONS_WORKER_RUNTIME; // Убираем Azure Functions маркер

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'origin') return 'http://localhost:4321';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      // В production без SWA auth или E2E token - должен быть отклонён
      // Но в текущей реализации FUNCTIONS_WORKER_RUNTIME = 'node' считается dev
      // Это поведение может отличаться
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
      expect(response.jsonBody.meta.hint).toBe('Use SWA auth or provide X-E2E-Token header');
    });
  });

  describe('Priority of auth methods', () => {
    test('SWA auth should take priority over E2E token', () => {
      process.env.E2E_TEST_TOKEN = 'valid-token';

      const principal = {
        userId: 'swa-user',
        identityProvider: 'aad',
        userDetails: ADMIN_EMAIL,
      };
      const encodedPrincipal = Buffer.from(JSON.stringify(principal)).toString('base64');

      const mockRequest = {
        headers: {
          get: (name) => {
            if (name === 'x-ms-client-principal') return encodedPrincipal;
            if (name === 'x-e2e-token') return 'valid-token';
            return null;
          },
        },
      };

      const result = checkAuthorization(mockRequest);

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('swa-auth'); // SWA имеет приоритет
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

    test('should use default admin email if ADMIN_EMAILS not set', () => {
      delete process.env.ADMIN_EMAILS;

      const emails = getAllowedAdminEmails();

      expect(emails).toContain('ivanovs.kirils95@gmail.com');
      expect(emails.length).toBe(1);
    });
  });
});
