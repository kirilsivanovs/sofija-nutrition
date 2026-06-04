/**
 * Input Validation Tests
 */

import {
  escapeHtml,
  stripDangerous,
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  sanitizeDate,
  sanitizeTime,
  sanitizeNotes,
  sanitizeServiceId,
  sanitizeFormat,
  sanitizePersonalCode,
  validateBookingInput,
  validationErrorResponse,
} from '../src/utils/validation';

describe('Input Validation', () => {
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    test('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('should handle non-string input', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
      expect(escapeHtml(123 as any)).toBe('');
    });
  });

  describe('stripDangerous', () => {
    test('should remove script tags', () => {
      expect(stripDangerous('<script>evil()</script>Hello')).toBe('Hello');
    });

    test('should remove event handlers', () => {
      expect(stripDangerous('<img onerror="alert(1)">')).toBe('');
    });

    test('should remove javascript: URLs', () => {
      expect(stripDangerous('javascript:alert(1)')).toBe('javascript:alert(1)');
    });

    test('should normalize whitespace', () => {
      expect(stripDangerous('  Hello    World  ')).toBe('Hello World');
    });
  });

  describe('sanitizeName', () => {
    test('should accept valid name', () => {
      const result = sanitizeName('John Smith');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('John Smith');
    });

    test('should accept Latvian characters', () => {
      const result = sanitizeName('Jānis Bērziņš');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Jānis Bērziņš');
    });

    test('should accept Russian characters', () => {
      const result = sanitizeName('Иван Петров');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Иван Петров');
    });

    test('should reject empty name', () => {
      const result = sanitizeName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject too short name', () => {
      const result = sanitizeName('A');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('2 characters');
    });

    test('should strip XSS from name', () => {
      const result = sanitizeName('<script>alert("xss")</script>John');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('John');
      expect(result.value).not.toContain('<script>');
    });

    test('should truncate long names', () => {
      const longName = 'A'.repeat(150);
      const result = sanitizeName(longName);
      expect(result.value.length).toBeLessThanOrEqual(100);
    });
  });

  describe('sanitizeEmail', () => {
    test('should accept valid email', () => {
      const result = sanitizeEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    test('should normalize to lowercase', () => {
      const result = sanitizeEmail('Test@Example.COM');
      expect(result.value).toBe('test@example.com');
    });

    test('should reject invalid email', () => {
      const result = sanitizeEmail('not-an-email');
      expect(result.valid).toBe(false);
    });

    test('should reject empty email', () => {
      const result = sanitizeEmail('');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizePhone', () => {
    test('should accept Latvian mobile', () => {
      const result = sanitizePhone('+371 29123456');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('+37129123456');
    });

    test('should normalize Latvian phone without +', () => {
      const result = sanitizePhone('371 29123456');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('+37129123456');
    });

    test('should normalize short Latvian mobile', () => {
      const result = sanitizePhone('29123456');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('+37129123456');
    });

    test('should accept empty phone (optional field)', () => {
      const result = sanitizePhone('');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('');
    });

    test('should reject invalid phone format', () => {
      const result = sanitizePhone('123');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizePersonalCode', () => {
    test('should accept empty personal code (optional field)', () => {
      const result = sanitizePersonalCode('');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('');
    });

    test('should accept undefined personal code', () => {
      const result = sanitizePersonalCode(undefined);
      expect(result.valid).toBe(true);
      expect(result.value).toBe('');
    });

    test('should accept and normalize valid old-format code with hyphen', () => {
      const result = sanitizePersonalCode('010180-12345');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('010180-12345');
    });

    test('should normalize 11 digits without hyphen', () => {
      const result = sanitizePersonalCode('01018012345');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('010180-12345');
    });

    test('should accept new-format code starting with 32', () => {
      const result = sanitizePersonalCode('321234-56789');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('321234-56789');
    });

    test('should reject code with wrong number of digits', () => {
      const result = sanitizePersonalCode('12345');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeDate', () => {
    test('should accept valid future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];

      const result = sanitizeDate(dateStr);
      expect(result.valid).toBe(true);
    });

    test('should reject past date', () => {
      const result = sanitizeDate('2020-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('future');
    });

    test('should reject invalid format', () => {
      const result = sanitizeDate('01-15-2026');
      expect(result.valid).toBe(false);
    });

    test('should reject date too far in future', () => {
      const result = sanitizeDate('2030-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 months');
    });
  });

  describe('sanitizeTime', () => {
    test('should accept valid time', () => {
      const result = sanitizeTime('14:30');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('14:30');
    });

    test('should reject invalid time', () => {
      const result = sanitizeTime('25:00');
      expect(result.valid).toBe(false);
    });

    test('should reject invalid format', () => {
      const result = sanitizeTime('2:30 PM');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeServiceId', () => {
    test('should accept valid service', () => {
      const result = sanitizeServiceId('consultation');
      expect(result.valid).toBe(true);
    });

    test('should reject invalid service', () => {
      const result = sanitizeServiceId('hacking-service');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeFormat', () => {
    test('should accept online', () => {
      const result = sanitizeFormat('online');
      expect(result.valid).toBe(true);
    });

    test('should accept in-person', () => {
      const result = sanitizeFormat('in-person');
      expect(result.valid).toBe(true);
    });

    test('should reject invalid format', () => {
      const result = sanitizeFormat('telepathy');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBookingInput', () => {
    const validBooking = {
      name: 'Jānis Bērziņš',
      email: 'janis@example.com',
      phone: '+371 29123456',
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        // Ensure it's a weekday
        while (d.getDay() === 0 || d.getDay() === 6) {
          d.setDate(d.getDate() + 1);
        }
        return d.toISOString().split('T')[0];
      })(),
      time: '14:00',
      service: 'consultation',
      consultationFormat: 'online',
      language: 'lv',
    };

    test('should validate complete booking', () => {
      const result = validateBookingInput(validBooking);
      expect(result.valid).toBe(true);
      expect(result.data.name).toBe('Jānis Bērziņš');
    });

    test('should return errors for invalid booking', () => {
      const result = validateBookingInput({
        name: '',
        email: 'invalid',
        date: '2020-01-01',
        time: 'noon',
        service: 'unknown',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.date).toBeDefined();
      expect(result.errors.time).toBeDefined();
      expect(result.errors.serviceId).toBeDefined();
    });

    test('should sanitize XSS in all fields', () => {
      const maliciousBooking = {
        ...validBooking,
        name: '<script>alert("xss")</script>Evil',
        notes: '<img onerror="evil()">Note',
      };

      const result = validateBookingInput(maliciousBooking);

      expect(result.data.name).not.toContain('<script>');
      expect(result.data.notes).not.toContain('onerror');
    });
  });

  describe('validationErrorResponse', () => {
    test('should return 400 with errors', () => {
      const errors = { email: 'Invalid email' };
      const response = validationErrorResponse(errors);

      expect(response.status).toBe(400);
      expect(response.jsonBody.error).toBe('Validation Error');
      expect(response.jsonBody.code).toBe('VALIDATION_ERROR');
      expect(response.jsonBody.details).toEqual(errors);
    });
  });
});
