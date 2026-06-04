/**
 * Booking Validation Tests
 *
 * Tests frontend form validation logic (business-critical: prevents invalid bookings)
 */
import { describe, it, expect } from '@jest/globals';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  validateService,
  validateDate,
  validateTime,
  validateFormat,
  validateBookingForm,
  isBookingFormValid,
} from '../src/utils/booking/validation';

describe('Booking Validation', () => {
  describe('validateName', () => {
    it('should reject empty name', () => {
      expect(validateName('')).not.toBeNull();
      expect(validateName('  ')).not.toBeNull();
    });

    it('should reject name shorter than 2 chars', () => {
      expect(validateName('A')).not.toBeNull();
    });

    it('should accept valid names', () => {
      expect(validateName('Anna')).toBeNull();
      expect(validateName('Jānis Bērziņš')).toBeNull();
      expect(validateName("Anna-Marija O'Brien")).toBeNull();
    });

    it('should reject names with numbers or special chars', () => {
      expect(validateName('Anna123')).not.toBeNull();
      expect(validateName('Test@User')).not.toBeNull();
    });

    it('should reject names exceeding max length', () => {
      const longName = 'A'.repeat(101);
      expect(validateName(longName)).not.toBeNull();
    });

    it('should accept Latvian characters', () => {
      expect(validateName('Āčēģīķļņšūž')).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('should reject empty email', () => {
      expect(validateEmail('')).not.toBeNull();
    });

    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBeNull();
      expect(validateEmail('test.user@domain.lv')).toBeNull();
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail')).not.toBeNull();
      expect(validateEmail('missing@domain')).not.toBeNull();
      expect(validateEmail('@nodomain.com')).not.toBeNull();
    });

    it('should reject overly long emails', () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      expect(validateEmail(longEmail)).not.toBeNull();
    });
  });

  describe('validatePhone', () => {
    it('should accept empty phone (optional field)', () => {
      expect(validatePhone('')).toBeNull();
      expect(validatePhone(undefined)).toBeNull();
    });

    it('should accept valid phone numbers', () => {
      expect(validatePhone('+371 20123456')).toBeNull();
      expect(validatePhone('20123456')).toBeNull();
      expect(validatePhone('+7 999 12345')).toBeNull();
    });

    it('should reject too short phone', () => {
      expect(validatePhone('123')).not.toBeNull();
    });

    it('should reject too long phone', () => {
      expect(validatePhone('1234567890123456')).not.toBeNull();
    });

    it('should reject phone with letters', () => {
      expect(validatePhone('abc12345678')).not.toBeNull();
    });
  });

  describe('validateMessage', () => {
    it('should accept empty message (optional)', () => {
      expect(validateMessage('')).toBeNull();
      expect(validateMessage(undefined)).toBeNull();
    });

    it('should accept normal messages', () => {
      expect(validateMessage('Vēlos konsultāciju')).toBeNull();
    });

    it('should reject overly long messages', () => {
      const longMsg = 'x'.repeat(501);
      expect(validateMessage(longMsg)).not.toBeNull();
    });
  });

  describe('validateService', () => {
    it('should reject empty service', () => {
      expect(validateService('')).not.toBeNull();
      expect(validateService(undefined)).not.toBeNull();
    });

    it('should accept any non-empty service id', () => {
      expect(validateService('initial')).toBeNull();
      expect(validateService('followup')).toBeNull();
    });
  });

  describe('validateDate', () => {
    it('should reject empty date', () => {
      expect(validateDate('')).not.toBeNull();
      expect(validateDate(undefined)).not.toBeNull();
    });

    it('should reject invalid format', () => {
      expect(validateDate('15-05-2026')).not.toBeNull();
      expect(validateDate('not-a-date')).not.toBeNull();
    });

    it('should reject past dates', () => {
      expect(validateDate('2020-01-01')).not.toBeNull();
    });

    it('should reject dates too far in future (>90 days)', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 100);
      const dateStr = farFuture.toISOString().split('T')[0];
      expect(validateDate(dateStr)).not.toBeNull();
    });

    it('should accept valid future date within range', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const dateStr = tomorrow.toISOString().split('T')[0];
      expect(validateDate(dateStr)).toBeNull();
    });
  });

  describe('validateTime', () => {
    it('should reject empty time', () => {
      expect(validateTime('')).not.toBeNull();
      expect(validateTime(undefined)).not.toBeNull();
    });

    it('should accept valid HH:MM format', () => {
      expect(validateTime('09:00')).toBeNull();
      expect(validateTime('14:30')).toBeNull();
      expect(validateTime('23:59')).toBeNull();
    });

    it('should reject invalid time format', () => {
      expect(validateTime('9:00')).not.toBeNull();
      expect(validateTime('25:00')).not.toBeNull();
      expect(validateTime('12:60')).not.toBeNull();
      expect(validateTime('noon')).not.toBeNull();
    });
  });

  describe('validateFormat', () => {
    it('should reject empty format', () => {
      expect(validateFormat('')).not.toBeNull();
      expect(validateFormat(undefined)).not.toBeNull();
    });

    it('should accept online and in-person', () => {
      expect(validateFormat('online')).toBeNull();
      expect(validateFormat('in-person')).toBeNull();
    });

    it('should reject invalid format values', () => {
      expect(validateFormat('phone')).not.toBeNull();
      expect(validateFormat('hybrid')).not.toBeNull();
    });
  });

  describe('validateBookingForm', () => {
    const validForm = {
      service: 'initial',
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
      })(),
      time: '10:00',
      consultationFormat: 'online',
      name: 'Jānis Bērziņš',
      email: 'janis@example.com',
    };

    it('should return no errors for valid form', () => {
      const errors = validateBookingForm(validForm);
      expect(errors).toEqual([]);
    });

    it('should return true for isBookingFormValid with valid data', () => {
      expect(isBookingFormValid(validForm)).toBe(true);
    });

    it('should return multiple errors for empty form', () => {
      const errors = validateBookingForm({});
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should collect errors from all invalid fields', () => {
      const errors = validateBookingForm({
        service: '',
        date: 'bad',
        time: 'bad',
        consultationFormat: 'bad',
        name: '',
        email: 'bad',
      });
      expect(errors.length).toBeGreaterThanOrEqual(6);
    });
  });
});
