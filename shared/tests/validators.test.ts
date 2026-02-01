/**
 * Tests for validation utilities
 */

import {
    isValidDate,
    isValidTime,
    isValidEmail,
    isValidPhone,
    isDateInFuture,
    isValidTimeSlot
} from '../utils/validators';

describe('validators', () => {
    describe('isValidDate', () => {
        it('should validate correct date format', () => {
            expect(isValidDate('2024-02-01')).toBe(true);
            expect(isValidDate('2024-12-31')).toBe(true);
        });

        it('should reject invalid format', () => {
            expect(isValidDate('01/02/2024')).toBe(false);
            expect(isValidDate('2024/02/01')).toBe(false);
            expect(isValidDate('01-02-2024')).toBe(false);
        });

        it('should reject invalid dates', () => {
            expect(isValidDate('2024-13-01')).toBe(false); // Invalid month
            expect(isValidDate('2024-02-31')).toBe(false); // Invalid day
            expect(isValidDate('2024-00-01')).toBe(false); // Invalid month
        });

        it('should reject empty string', () => {
            expect(isValidDate('')).toBe(false);
        });

        it('should handle leap years', () => {
            expect(isValidDate('2024-02-29')).toBe(true); // 2024 is leap year
            expect(isValidDate('2023-02-29')).toBe(false); // 2023 is not
        });
    });

    describe('isValidTime', () => {
        it('should validate correct 24-hour format', () => {
            expect(isValidTime('09:30')).toBe(true);
            expect(isValidTime('00:00')).toBe(true);
            expect(isValidTime('23:59')).toBe(true);
        });

        it('should accept single digit hours', () => {
            expect(isValidTime('9:30')).toBe(true);
            expect(isValidTime('0:00')).toBe(true);
        });

        it('should reject invalid hours', () => {
            expect(isValidTime('24:00')).toBe(false);
            expect(isValidTime('25:30')).toBe(false);
        });

        it('should reject invalid minutes', () => {
            expect(isValidTime('09:60')).toBe(false);
            expect(isValidTime('09:99')).toBe(false);
        });

        it('should reject invalid format', () => {
            expect(isValidTime('9')).toBe(false);
            expect(isValidTime('09:00 AM')).toBe(false);
            expect(isValidTime('09-00')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(isValidTime('')).toBe(false);
        });
    });

    describe('isValidEmail', () => {
        it('should validate correct email format', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
            expect(isValidEmail('user+tag@example.com')).toBe(true);
        });

        it('should reject invalid email format', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('user@domain')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPhone', () => {
        it('should validate phone numbers with country code', () => {
            expect(isValidPhone('+371 12345678')).toBe(true);
            expect(isValidPhone('+37112345678')).toBe(true);
        });

        it('should validate phone numbers without country code', () => {
            expect(isValidPhone('12345678')).toBe(true);
            expect(isValidPhone('1234567890')).toBe(true);
        });

        it('should accept various formats', () => {
            expect(isValidPhone('+371 1234-5678')).toBe(true);
            expect(isValidPhone('+371 (12) 345-678')).toBe(true);
            expect(isValidPhone('1234 5678')).toBe(true);
        });

        it('should reject too short numbers', () => {
            expect(isValidPhone('1234567')).toBe(false);
            expect(isValidPhone('123')).toBe(false);
        });

        it('should reject too long numbers', () => {
            expect(isValidPhone('1234567890123456')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(isValidPhone('')).toBe(false);
        });
    });

    describe('isDateInFuture', () => {
        it('should return true for future dates', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            expect(isDateInFuture(tomorrowStr)).toBe(true);
        });

        it('should return true for today', () => {
            const today = new Date().toISOString().split('T')[0];
            expect(isDateInFuture(today)).toBe(true);
        });

        it('should return false for past dates', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            expect(isDateInFuture(yesterdayStr)).toBe(false);
        });

        it('should return false for invalid date', () => {
            expect(isDateInFuture('invalid-date')).toBe(false);
        });
    });

    describe('isValidTimeSlot', () => {
        it('should validate time slot with minimum duration', () => {
            expect(isValidTimeSlot('09:00', '09:30', 30)).toBe(true);
            expect(isValidTimeSlot('09:00', '10:00', 30)).toBe(true);
        });

        it('should reject time slot shorter than minimum', () => {
            expect(isValidTimeSlot('09:00', '09:15', 30)).toBe(false);
            expect(isValidTimeSlot('09:00', '09:29', 30)).toBe(false);
        });

        it('should use default minimum duration of 30 minutes', () => {
            expect(isValidTimeSlot('09:00', '09:30')).toBe(true);
            expect(isValidTimeSlot('09:00', '09:29')).toBe(false);
        });

        it('should reject invalid time format', () => {
            expect(isValidTimeSlot('09:00', '25:00')).toBe(false);
            expect(isValidTimeSlot('invalid', '10:00')).toBe(false);
        });

        it('should handle slots crossing hour boundaries', () => {
            expect(isValidTimeSlot('09:45', '10:15', 30)).toBe(true);
        });

        it('should reject end time before start time', () => {
            expect(isValidTimeSlot('10:00', '09:00')).toBe(false);
        });
    });
});
