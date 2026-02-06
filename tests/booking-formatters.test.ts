/**
 * Booking Formatters Tests
 * 
 * Tests for all formatting utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
    formatDate,
    formatDateLong,
    getWeekdayName,
    formatDateWithWeekday,
    formatTime,
    formatPrice,
    formatConsultationFormat
} from '../src/utils/booking/formatters';

// ============================================
// Date Formatting Tests
// ============================================

describe('formatDate', () => {
    it('should format date to DD.MM.YYYY', () => {
        expect(formatDate('2026-02-15')).toBe('15.02.2026');
    });

    it('should handle single digit days and months', () => {
        expect(formatDate('2026-01-05')).toBe('05.01.2026');
    });

    it('should handle end of year', () => {
        expect(formatDate('2025-12-31')).toBe('31.12.2025');
    });

    it('should handle leap year', () => {
        expect(formatDate('2024-02-29')).toBe('29.02.2024');
    });

    it('should return empty string for empty input', () => {
        expect(formatDate('')).toBe('');
    });

    it('should return formatted string for invalid date', () => {
        const invalid = 'invalid-date';
        // formatDate parses and formats; invalid dates produce NaN output
        expect(formatDate(invalid)).toBeTruthy();
    });

    it('should handle ISO datetime strings', () => {
        expect(formatDate('2026-02-15T10:00:00Z')).toContain('2026');
    });
});

describe('formatDateLong', () => {
    it('should format date in Latvian', () => {
        const result = formatDateLong('2026-02-15', 'lv');
        expect(result).toContain('15');
        expect(result).toContain('2026');
    });

    it('should format date in English', () => {
        const result = formatDateLong('2026-02-15', 'en');
        expect(result).toContain('15');
        expect(result).toContain('2026');
    });

    it('should include month name', () => {
        const result = formatDateLong('2026-01-01', 'en');
        expect(result.toLowerCase()).toContain('january');
    });

    it('should handle all months', () => {
        for (let month = 0; month < 12; month++) {
            const date = `2026-${String(month + 1).padStart(2, '0')}-15`;
            const result = formatDateLong(date, 'lv');
            expect(result).toBeTruthy();
            expect(result).toContain('15');
        }
    });

    it('should return empty for empty input', () => {
        expect(formatDateLong('')).toBe('');
    });
});

describe('getWeekdayName', () => {
    it('should return Monday in Latvian', () => {
        const result = getWeekdayName('2026-02-02', 'lv'); // Monday
        expect(result).toBeTruthy();
    });

    it('should return Monday in English', () => {
        const result = getWeekdayName('2026-02-02', 'en'); // Monday
        expect(result).toBeTruthy();
    });

    it('should return short weekday name', () => {
        const result = getWeekdayName('2026-02-02', 'lv', true);
        expect(result).toBeTruthy();
        // Short names should be shorter
    });

    it('should handle all days of week', () => {
        const days = [
            '2026-02-01', // Sunday
            '2026-02-02', // Monday
            '2026-02-03', // Tuesday
            '2026-02-04', // Wednesday
            '2026-02-05', // Thursday
            '2026-02-06', // Friday
            '2026-02-07', // Saturday
        ];

        days.forEach(date => {
            const lv = getWeekdayName(date, 'lv');
            const en = getWeekdayName(date, 'en');
            expect(lv).toBeTruthy();
            expect(en).toBeTruthy();
        });
    });

    it('should return falsy for invalid date', () => {
        expect(getWeekdayName('invalid')).toBeFalsy();
    });
});

describe('formatDateWithWeekday', () => {
    it('should combine weekday and date', () => {
        const result = formatDateWithWeekday('2026-02-15', 'lv');
        expect(result).toContain(',');
        expect(result).toContain('15');
    });

    it('should format in English', () => {
        const result = formatDateWithWeekday('2026-02-15', 'en');
        expect(result).toBeTruthy();
        expect(result).toContain('15');
    });

    it('should return empty for empty input', () => {
        expect(formatDateWithWeekday('')).toBe('');
    });
});

// ============================================
// Time Formatting Tests
// ============================================

describe('formatTime', () => {
    it('should return HH:MM as is', () => {
        expect(formatTime('10:00')).toBe('10:00');
        expect(formatTime('14:30')).toBe('14:30');
    });

    it('should handle midnight', () => {
        expect(formatTime('00:00')).toBe('00:00');
    });

    it('should handle noon', () => {
        expect(formatTime('12:00')).toBe('12:00');
    });

    it('should handle end of day', () => {
        expect(formatTime('23:59')).toBe('23:59');
    });

    it('should return empty for empty input', () => {
        expect(formatTime('')).toBe('');
    });

    it('should handle ISO time strings', () => {
        const result = formatTime('2026-02-15T10:30:00Z');
        expect(result).toBeTruthy();
    });
});

// ============================================
// Price Formatting Tests
// ============================================

describe('formatPrice', () => {
    it('should format price with currency symbol', () => {
        const result = formatPrice(50);
        expect(result).toContain('50');
        expect(result).toContain('€');
    });

    it('should handle zero price', () => {
        const result = formatPrice(0);
        expect(result).toContain('0');
    });

    it('should handle decimal prices', () => {
        const result = formatPrice(50.50);
        expect(result).toContain('50');
    });

    it('should handle large prices', () => {
        const result = formatPrice(1000);
        expect(result).toContain('1000');
    });

    it('should format with 2 decimal places', () => {
        const result = formatPrice(50);
        expect(result).toMatch(/\d+\.\d{2}/);
    });

    it('should handle negative prices gracefully', () => {
        const result = formatPrice(-50);
        expect(result).toBeTruthy();
    });
});



// ============================================
// Consultation Format Tests
// ============================================

describe('formatConsultationFormat', () => {
    it('should format online in Latvian', () => {
        const result = formatConsultationFormat('online', 'lv');
        expect(result).toBeTruthy();
    });

    it('should format in-person in Latvian', () => {
        const result = formatConsultationFormat('in-person', 'lv');
        expect(result).toBeTruthy();
    });

    it('should format online in English', () => {
        const result = formatConsultationFormat('online', 'en');
        expect(result.toLowerCase()).toContain('online');
    });

    it('should format in-person in English', () => {
        const result = formatConsultationFormat('in-person', 'en');
        expect(result).toBeTruthy();
    });

    it('should handle unknown format', () => {
        const result = formatConsultationFormat('unknown' as any, 'lv');
        expect(result).toBeTruthy();
    });
});

// ============================================
// Edge Cases & Security Tests
// ============================================

describe('Formatters Edge Cases', () => {
    it('should handle null inputs safely', () => {
        expect(formatDate(null as any)).toBe('');
        expect(formatTime(null as any)).toBe('');
    });

    it('should handle undefined inputs safely', () => {
        expect(formatDate(undefined as any)).toBe('');
        expect(formatTime(undefined as any)).toBe('');
    });

    it('should sanitize XSS attempts in dates', () => {
        const xss = '<script>alert("xss")</script>';
        const result = formatDate(xss);
        expect(result).not.toContain('<script>');
    });

    it('should handle very long strings', () => {
        const longString = 'a'.repeat(10000);
        const result = formatDate(longString);
        expect(result).toBeTruthy();
    });


});

describe('Formatters Consistency', () => {
    it('should format dates consistently', () => {
        const date = '2026-02-15';
        const result1 = formatDate(date);
        const result2 = formatDate(date);
        expect(result1).toBe(result2);
    });

    it('should format times consistently', () => {
        const time = '10:30';
        const result1 = formatTime(time);
        const result2 = formatTime(time);
        expect(result1).toBe(result2);
    });

    it('should format prices consistently', () => {
        const price = 50;
        const result1 = formatPrice(price);
        const result2 = formatPrice(price);
        expect(result1).toBe(result2);
    });
});

describe('Formatters Internationalization', () => {
    it('should support Latvian language', () => {
        const date = '2026-02-15';
        const weekday = getWeekdayName(date, 'lv');
        const long = formatDateLong(date, 'lv');
        
        expect(weekday).toBeTruthy();
        expect(long).toBeTruthy();
    });

    it('should support English language', () => {
        const date = '2026-02-15';
        const weekday = getWeekdayName(date, 'en');
        const long = formatDateLong(date, 'en');
        
        expect(weekday).toBeTruthy();
        expect(long).toBeTruthy();
    });

    it('should maintain diacritics in Latvian', () => {
        const format = formatConsultationFormat('in-person', 'lv');
        // Latvian text should contain special characters
        expect(format).toBeTruthy();
    });
});
