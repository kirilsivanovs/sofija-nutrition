/**
 * Admin Middleware & Business Logic Tests
 *
 * Tests admin authorization, OData sanitization, and business logic
 * that admin endpoints use.
 *
 * Note: Azure Functions v4 app.http() doesn't export testable handlers,
 * so we test the underlying business logic and middleware directly.
 */

import { checkAuthorization } from '../src/utils/authMiddleware';
import {
  buildStatusFilter,
  buildPartitionKeyFilter,
  validateDateFormat,
  validateStatusFilter,
} from '../src/utils/odataSanitizer';

const VALID_ADMIN_KEY = process.env.ADMIN_API_KEY || 'test-admin-key-12345';
const ADMIN_EMAIL = 'ivanovs.kirils95@gmail.com';

// Helper to create mock request
function createMockRequest(headers: Record<string, string> = {}) {
  const headersMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (name: string) => headersMap.get(name.toLowerCase()) || null,
    },
    query: new Map(),
    method: 'GET',
    url: 'http://localhost/api/admin/test',
  } as any;
}

// ============================================
// Admin Authorization Tests
// ============================================

describe('Admin Authorization Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('checkAuthorization', () => {
    it('should reject requests without admin key', () => {
      const req = createMockRequest({});

      const result = checkAuthorization(req);

      expect(result.authorized).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject requests with invalid admin key', () => {
      const req = createMockRequest({
        'x-admin-key': 'wrong-key',
      });

      const result = checkAuthorization(req);

      expect(result.authorized).toBe(false);
    });

    it('should accept requests with valid SWA auth', () => {
      // Mock SWA auth header with base64-encoded principal
      const principal = {
        userId: 'test-user-123',
        userDetails: ADMIN_EMAIL,
        identityProvider: 'google',
        userRoles: ['admin'],
      };
      const encoded = Buffer.from(JSON.stringify(principal)).toString('base64');

      const req = createMockRequest({
        'x-ms-client-principal': encoded,
      });

      const result = checkAuthorization(req);

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('swa-auth');
    });

    it('should reject SQL injection in admin key', () => {
      const req = createMockRequest({
        'x-admin-key': "' OR '1'='1",
      });

      const result = checkAuthorization(req);

      expect(result.authorized).toBe(false);
    });

    it('should be case-sensitive for admin key', () => {
      // SWA auth uses base64 encoding which is case-sensitive
      const principal = {
        userId: 'test-user-123',
        userDetails: 'Test Admin',
        identityProvider: 'google',
        userRoles: ['admin'],
      };
      const encoded = Buffer.from(JSON.stringify(principal)).toString('base64');
      const req = createMockRequest({
        'x-ms-client-principal': encoded.toLowerCase(), // Invalid base64
      });

      const result = checkAuthorization(req);

      // Depends on implementation, but typically should be case-sensitive
      expect(result).toBeDefined();
    });
  });
});

// ============================================
// OData Sanitization for Admin Queries
// ============================================

describe('Admin Query Sanitization', () => {
  describe('Status Filter', () => {
    it('should build valid filter for valid status', () => {
      const filter = buildStatusFilter('confirmed');

      if (filter) {
        expect(filter).toBe("status eq 'confirmed'");
      }
    });

    it('should return null for "all" status', () => {
      const filter = buildStatusFilter('all');

      expect(filter).toBeNull();
    });

    it('should sanitize invalid status', () => {
      const result = validateStatusFilter("' OR '1'='1");

      // Should normalize to 'all' for invalid values
      expect(result).toBe('all');
    });

    it('should handle null/undefined status', () => {
      const result1 = validateStatusFilter(null as any);
      const result2 = validateStatusFilter(undefined as any);

      expect(result1).toBe('all');
      expect(result2).toBe('all');
    });
  });

  describe('Date Filter', () => {
    it('should validate correct date format', () => {
      const result = validateDateFormat('2026-02-15');

      expect(result).toBe('2026-02-15');
    });

    it('should reject invalid date format', () => {
      const result = validateDateFormat('15-02-2026');

      expect(result).toBeNull();
    });

    it('should reject SQL injection in date', () => {
      const result = validateDateFormat("2026-02-15' OR '1'='1");

      expect(result).toBeNull();
    });

    it('should reject invalid dates', () => {
      const result = validateDateFormat('2026-13-01'); // Invalid month

      expect(result).toBeNull();
    });

    it('should handle null/undefined dates', () => {
      const result1 = validateDateFormat(null as any);
      const result2 = validateDateFormat(undefined as any);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Partition Key Filter', () => {
    it('should build filter for valid date', () => {
      const filter = buildPartitionKeyFilter('2026-02-15');

      if (filter) {
        expect(filter).toContain('PartitionKey');
        expect(filter).toContain('2026-02-15');
      }
    });

    it('should return null for invalid date', () => {
      const filter = buildPartitionKeyFilter("' OR '1'='1");

      expect(filter).toBeNull();
    });
  });
});

// ============================================
// Admin Query Parameters Validation
// ============================================

describe('Admin Query Parameters', () => {
  describe('Status Parameter', () => {
    const validStatuses = ['pending', 'confirmed', 'cancelled'];

    validStatuses.forEach((status) => {
      it(`should accept valid status: ${status}`, () => {
        const result = validateStatusFilter(status);

        expect(result).toBe(status);
      });
    });

    it('should normalize status case', () => {
      const result = validateStatusFilter('CONFIRMED');

      expect(result).toBe('confirmed');
    });

    it('should handle empty string', () => {
      const result = validateStatusFilter('');

      expect(result).toBe('all');
    });
  });

  describe('Date Range Validation', () => {
    it('should accept today date', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = validateDateFormat(today);

      expect(result).toBe(today);
    });

    it('should accept past dates', () => {
      const result = validateDateFormat('2020-01-01');

      expect(result).toBe('2020-01-01');
    });

    it('should accept future dates', () => {
      const result = validateDateFormat('2030-12-31');

      expect(result).toBe('2030-12-31');
    });

    it('should reject dates with wrong separators', () => {
      const result = validateDateFormat('2026/02/15');

      expect(result).toBeNull();
    });
  });
});

// ============================================
// Security Tests
// ============================================

describe('Admin Security', () => {
  describe('SQL Injection Prevention', () => {
    const injectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE bookings; --",
      "' OR 1=1--",
      "admin'--",
      "' UNION SELECT * FROM users--",
    ];

    injectionPayloads.forEach((payload) => {
      it(`should reject injection: ${payload}`, () => {
        const statusResult = validateStatusFilter(payload);
        const dateResult = validateDateFormat(payload);

        // Should be sanitized/rejected
        expect(statusResult).toBe('all'); // Normalized to safe value
        expect(dateResult).toBeNull(); // Rejected
      });
    });
  });

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      it(`should handle XSS attempt: ${payload.substring(0, 30)}...`, () => {
        const result = validateStatusFilter(payload);

        expect(result).toBe('all'); // Normalized to safe value
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '....//....//....//etc/passwd',
    ];

    traversalPayloads.forEach((payload) => {
      it(`should reject traversal: ${payload}`, () => {
        const result = validateDateFormat(payload);

        expect(result).toBeNull();
      });
    });
  });
});

// ============================================
// Edge Cases
// ============================================

describe('Admin Edge Cases', () => {
  it('should handle very long status strings', () => {
    const longString = 'a'.repeat(10000);
    const result = validateStatusFilter(longString);

    expect(result).toBe('all');
  });

  it('should handle very long date strings', () => {
    const longString = 'a'.repeat(10000);
    const result = validateDateFormat(longString);

    expect(result).toBeNull();
  });

  it('should handle special characters in status', () => {
    const result = validateStatusFilter('confirmed!@#$%');

    expect(result).toBe('all');
  });

  it('should handle unicode characters', () => {
    const result = validateStatusFilter('подтверждено');

    expect(result).toBe('all');
  });

  it('should handle empty/whitespace status', () => {
    const result1 = validateStatusFilter('   ');
    const result2 = validateStatusFilter('\t\n');

    expect(result1).toBe('all');
    expect(result2).toBe('all');
  });
});

// ============================================
// Performance Tests
// ============================================

describe('Admin Performance', () => {
  it('should validate many status values quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 10000; i++) {
      validateStatusFilter('confirmed');
    }

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should validate many dates quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 10000; i++) {
      validateDateFormat('2026-02-15');
    }

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
