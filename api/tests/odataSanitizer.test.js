/**
 * OData Sanitizer Tests
 * Tests for OData injection prevention
 */

const {
    escapeODataString,
    sanitizeODataValue,
    validateStatusFilter,
    validateDateFormat,
    validateTimeFormat,
    buildPartitionKeyFilter,
    buildRowKeyFilter,
    buildStatusFilter,
    VALID_STATUSES
} = require('../src/utils/odataSanitizer');

describe('OData Sanitizer', () => {
    describe('escapeODataString', () => {
        it('should escape single quotes', () => {
            expect(escapeODataString("test'value")).toBe("test''value");
        });

        it('should handle multiple single quotes', () => {
            expect(escapeODataString("it's a 'test'")).toBe("it''s a ''test''");
        });

        it('should return empty string for null/undefined', () => {
            expect(escapeODataString(null)).toBe('');
            expect(escapeODataString(undefined)).toBe('');
        });

        it('should return empty string for non-string', () => {
            expect(escapeODataString(123)).toBe('');
            expect(escapeODataString({})).toBe('');
        });
    });

    describe('sanitizeODataValue', () => {
        it('should allow alphanumeric values', () => {
            expect(sanitizeODataValue('SN-ABC123')).toBe('SN-ABC123');
        });

        it('should allow underscores', () => {
            expect(sanitizeODataValue('test_value')).toBe('test_value');
        });

        it('should allow spaces', () => {
            expect(sanitizeODataValue('test value')).toBe('test value');
        });

        it('should reject values with single quotes (injection attempt)', () => {
            expect(sanitizeODataValue("test' or '1'='1")).toBeNull();
        });

        it('should reject values with special characters', () => {
            expect(sanitizeODataValue('test<script>')).toBeNull();
            expect(sanitizeODataValue('test;DROP TABLE')).toBeNull();
            expect(sanitizeODataValue("test' OR 1=1--")).toBeNull();
        });

        it('should trim whitespace', () => {
            expect(sanitizeODataValue('  test  ')).toBe('test');
        });

        it('should limit length', () => {
            const longValue = 'a'.repeat(200);
            expect(sanitizeODataValue(longValue, 100).length).toBe(100);
        });

        it('should return null for empty values', () => {
            expect(sanitizeODataValue('')).toBeNull();
            expect(sanitizeODataValue('   ')).toBeNull();
        });
    });

    describe('validateStatusFilter', () => {
        it('should accept valid statuses', () => {
            expect(validateStatusFilter('pending')).toBe('pending');
            expect(validateStatusFilter('confirmed')).toBe('confirmed');
            expect(validateStatusFilter('cancelled')).toBe('cancelled');
            expect(validateStatusFilter('all')).toBe('all');
        });

        it('should normalize case', () => {
            expect(validateStatusFilter('PENDING')).toBe('pending');
            expect(validateStatusFilter('Confirmed')).toBe('confirmed');
        });

        it('should return "all" for invalid status', () => {
            expect(validateStatusFilter('invalid')).toBe('all');
            expect(validateStatusFilter("' OR 1=1--")).toBe('all');
        });

        it('should return "all" for null/undefined', () => {
            expect(validateStatusFilter(null)).toBe('all');
            expect(validateStatusFilter(undefined)).toBe('all');
        });
    });

    describe('validateDateFormat', () => {
        it('should accept valid YYYY-MM-DD format', () => {
            expect(validateDateFormat('2026-01-31')).toBe('2026-01-31');
            expect(validateDateFormat('2026-12-25')).toBe('2026-12-25');
        });

        it('should reject invalid formats', () => {
            expect(validateDateFormat('31-01-2026')).toBeNull();
            expect(validateDateFormat('2026/01/31')).toBeNull();
            expect(validateDateFormat('01-31-2026')).toBeNull();
        });

        it('should reject injection attempts', () => {
            expect(validateDateFormat("2026-01-31' OR '1'='1")).toBeNull();
            expect(validateDateFormat('2026-01-31; DROP TABLE')).toBeNull();
        });

        it('should reject invalid dates', () => {
            expect(validateDateFormat('2026-13-01')).toBeNull(); // Invalid month
            expect(validateDateFormat('2026-00-01')).toBeNull(); // Zero month
        });

        it('should return null for null/undefined', () => {
            expect(validateDateFormat(null)).toBeNull();
            expect(validateDateFormat(undefined)).toBeNull();
        });
    });

    describe('validateTimeFormat', () => {
        it('should accept valid HH:MM format', () => {
            expect(validateTimeFormat('09:00')).toBe('09:00');
            expect(validateTimeFormat('14:30')).toBe('14:30');
            expect(validateTimeFormat('23:59')).toBe('23:59');
        });

        it('should reject invalid formats', () => {
            expect(validateTimeFormat('9:00')).toBeNull();
            expect(validateTimeFormat('09:0')).toBeNull();
            expect(validateTimeFormat('0900')).toBeNull();
        });

        it('should reject invalid times', () => {
            expect(validateTimeFormat('24:00')).toBeNull();
            expect(validateTimeFormat('09:60')).toBeNull();
            expect(validateTimeFormat('-1:00')).toBeNull();
        });

        it('should reject injection attempts', () => {
            expect(validateTimeFormat("09:00' OR '1'='1")).toBeNull();
        });
    });

    describe('buildPartitionKeyFilter', () => {
        it('should build valid filter for safe value', () => {
            expect(buildPartitionKeyFilter('2026-01-31'))
                .toBe("PartitionKey eq '2026-01-31'");
        });

        it('should return null for invalid value', () => {
            expect(buildPartitionKeyFilter("test' OR '1'='1")).toBeNull();
        });
    });

    describe('buildRowKeyFilter', () => {
        it('should build valid filter for safe value', () => {
            expect(buildRowKeyFilter('SN-ABC123'))
                .toBe("RowKey eq 'SN-ABC123'");
        });

        it('should return null for invalid value', () => {
            expect(buildRowKeyFilter("SN-ABC'; DROP TABLE--")).toBeNull();
        });
    });

    describe('buildStatusFilter', () => {
        it('should build valid filter for valid status', () => {
            expect(buildStatusFilter('pending')).toBe("status eq 'pending'");
            expect(buildStatusFilter('confirmed')).toBe("status eq 'confirmed'");
        });

        it('should return null for "all" status', () => {
            expect(buildStatusFilter('all')).toBeNull();
        });

        it('should return null for invalid status (treated as "all")', () => {
            expect(buildStatusFilter('invalid')).toBeNull();
            expect(buildStatusFilter("' OR 1=1--")).toBeNull();
        });
    });

    describe('VALID_STATUSES constant', () => {
        it('should contain expected statuses', () => {
            expect(VALID_STATUSES).toContain('pending');
            expect(VALID_STATUSES).toContain('confirmed');
            expect(VALID_STATUSES).toContain('cancelled');
            expect(VALID_STATUSES).toContain('all');
        });
    });

    describe('OData Injection Prevention', () => {
        const injectionPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE bookings; --",
            "' OR 1=1--",
            "') OR ('1'='1",
            "admin'--",
            "1 OR 1=1",
            "' UNION SELECT * FROM users--",
            "${IFS}cat${IFS}/etc/passwd",
            "{{7*7}}",
            "<script>alert(1)</script>"
        ];

        it.each(injectionPayloads)('should reject injection payload: %s', (payload) => {
            expect(sanitizeODataValue(payload)).toBeNull();
        });

        it.each(injectionPayloads)('status filter should reject: %s', (payload) => {
            expect(validateStatusFilter(payload)).toBe('all');
        });
    });
});
