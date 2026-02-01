/**
 * Tests for date formatting utilities
 */

import {
    formatDate,
    formatDateReverse,
    formatTime,
    formatDateISO,
    formatDateWithDay
} from '../utils/dateFormatters';

describe('dateFormatters', () => {
    describe('formatDate', () => {
        it('should convert yyyy-mm-dd to dd/mm/yyyy', () => {
            expect(formatDate('2024-02-01')).toBe('01/02/2024');
            expect(formatDate('2024-12-31')).toBe('31/12/2024');
        });

        it('should handle single digit days and months', () => {
            expect(formatDate('2024-01-09')).toBe('09/01/2024');
        });

        it('should return empty string for empty input', () => {
            expect(formatDate('')).toBe('');
        });
    });

    describe('formatDateReverse', () => {
        it('should convert dd/mm/yyyy to yyyy-mm-dd', () => {
            expect(formatDateReverse('01/02/2024')).toBe('2024-02-01');
            expect(formatDateReverse('31/12/2024')).toBe('2024-12-31');
        });

        it('should return empty string for empty input', () => {
            expect(formatDateReverse('')).toBe('');
        });
    });

    describe('formatTime', () => {
        it('should pad single digit hours and minutes', () => {
            expect(formatTime('9:5')).toBe('09:05');
            expect(formatTime('9:30')).toBe('09:30');
        });

        it('should remove AM/PM markers', () => {
            expect(formatTime('09:00 AM')).toBe('09:00');
            expect(formatTime('09:00 PM')).toBe('09:00');
            expect(formatTime('09:00 am')).toBe('09:00');
            expect(formatTime('09:00 pm')).toBe('09:00');
        });

        it('should handle already formatted time', () => {
            expect(formatTime('09:30')).toBe('09:30');
            expect(formatTime('14:45')).toBe('14:45');
        });

        it('should add :00 if minutes missing', () => {
            expect(formatTime('9:')).toBe('09:00');
        });

        it('should return empty string for empty input', () => {
            expect(formatTime('')).toBe('');
        });
    });

    describe('formatDateISO', () => {
        it('should convert Date object to yyyy-mm-dd', () => {
            const date = new Date(2024, 1, 1); // February 1, 2024
            expect(formatDateISO(date)).toBe('2024-02-01');
        });

        it('should pad single digit months and days', () => {
            const date = new Date(2024, 0, 9); // January 9, 2024
            expect(formatDateISO(date)).toBe('2024-01-09');
        });

        it('should handle year boundaries', () => {
            const date = new Date(2024, 11, 31); // December 31, 2024
            expect(formatDateISO(date)).toBe('2024-12-31');
        });
    });

    describe('formatDateWithDay', () => {
        it('should format date with Latvian day name', () => {
            const result = formatDateWithDay('2024-02-01', 'lv-LV');
            expect(result).toContain('01/02/2024');
            expect(result).toMatch(/^(Pirmdiena|Otrdiena|Trešdiena|Ceturtdiena|Piektdiena|Sestdiena|Svētdiena), /);
        });

        it('should format date with English day name', () => {
            const result = formatDateWithDay('2024-02-01', 'en-US');
            expect(result).toContain('01/02/2024');
            expect(result).toMatch(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), /);
        });

        it('should default to Latvian locale', () => {
            const result = formatDateWithDay('2024-02-01');
            expect(result).toMatch(/^(Pirmdiena|Otrdiena|Trešdiena|Ceturtdiena|Piektdiena|Sestdiena|Svētdiena), /);
        });

        it('should return empty string for empty input', () => {
            expect(formatDateWithDay('')).toBe('');
        });
    });
});
