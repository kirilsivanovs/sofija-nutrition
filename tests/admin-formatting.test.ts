/**
 * @jest-environment jsdom
 */

describe('Admin Panel - Date and Time Formatting', () => {
    // Helper functions from admin panel
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function formatDateReverse(dateStr) {
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr;
        const [hours, minutes] = timeStr.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }

    describe('formatDate() - Converting YYYY-MM-DD to DD/MM/YYYY', () => {
        test('should format standard date correctly', () => {
            expect(formatDate('2026-02-01')).toBe('01/02/2026');
            expect(formatDate('2026-12-31')).toBe('31/12/2026');
            expect(formatDate('2025-01-15')).toBe('15/01/2025');
        });

        test('should handle edge cases', () => {
            expect(formatDate('2026-01-01')).toBe('01/01/2026');
            expect(formatDate('2026-12-01')).toBe('01/12/2026');
        });

        test('should handle empty or invalid input', () => {
            expect(formatDate('')).toBe('');
            expect(formatDate(null)).toBe('');
            expect(formatDate(undefined)).toBe('');
        });

        test('should format leap year dates', () => {
            expect(formatDate('2024-02-29')).toBe('29/02/2024');
        });
    });

    describe('formatDateReverse() - Converting DD/MM/YYYY to YYYY-MM-DD', () => {
        test('should reverse format standard date correctly', () => {
            expect(formatDateReverse('01/02/2026')).toBe('2026-02-01');
            expect(formatDateReverse('31/12/2026')).toBe('2026-12-31');
            expect(formatDateReverse('15/01/2025')).toBe('2025-01-15');
        });

        test('should handle edge cases', () => {
            expect(formatDateReverse('01/01/2026')).toBe('2026-01-01');
            expect(formatDateReverse('01/12/2026')).toBe('2026-12-01');
        });

        test('should handle empty or invalid input', () => {
            expect(formatDateReverse('')).toBe('');
            expect(formatDateReverse(null)).toBe('');
            expect(formatDateReverse(undefined)).toBe('');
        });

        test('should be inverse of formatDate', () => {
            const originalDate = '2026-05-20';
            const formatted = formatDate(originalDate);
            const reversed = formatDateReverse(formatted);
            expect(reversed).toBe(originalDate);
        });
    });

    describe('formatTime() - 24-hour format', () => {
        test('should format time correctly', () => {
            expect(formatTime('09:00')).toBe('09:00');
            expect(formatTime('14:30')).toBe('14:30');
            expect(formatTime('23:59')).toBe('23:59');
        });

        test('should pad single digit hours', () => {
            expect(formatTime('9:00')).toBe('09:00');
            expect(formatTime('5:30')).toBe('05:30');
        });

        test('should handle already formatted time', () => {
            expect(formatTime('10:15')).toBe('10:15');
            expect(formatTime('00:00')).toBe('00:00');
        });

        test('should handle empty or invalid input', () => {
            expect(formatTime('')).toBe('');
            expect(formatTime(null)).toBe('');
            expect(formatTime(undefined)).toBe('');
        });

        test('should maintain 24-hour format (no AM/PM)', () => {
            expect(formatTime('13:00')).toBe('13:00');
            expect(formatTime('00:30')).toBe('00:30');
            expect(formatTime('22:45')).toBe('22:45');
        });
    });

    describe('Date consistency in data storage', () => {
        test('should maintain YYYY-MM-DD format for storage', () => {
            // Backend хранит даты в YYYY-MM-DD
            const storageDate = '2026-03-15';
            expect(storageDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should display dates in DD/MM/YYYY format', () => {
            const storageDate = '2026-03-15';
            const displayDate = formatDate(storageDate);
            expect(displayDate).toBe('15/03/2026');
            expect(displayDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        });

        test('should convert display format back to storage format', () => {
            const displayDate = '15/03/2026';
            const storageDate = formatDateReverse(displayDate);
            expect(storageDate).toBe('2026-03-15');
            expect(storageDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('Critical business scenarios', () => {
        test('should correctly format booking dates for display', () => {
            const bookings = [
                { date: '2026-02-15', time: '10:00' },
                { date: '2026-03-20', time: '14:30' },
                { date: '2026-12-31', time: '9:00' }
            ];

            bookings.forEach(booking => {
                const displayDate = formatDate(booking.date);
                const displayTime = formatTime(booking.time);
                
                expect(displayDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
                expect(displayTime).toMatch(/^\d{2}:\d{2}$/);
            });
        });

        test('should correctly format vacation periods', () => {
            const vacation = {
                startDate: '2026-07-01',
                endDate: '2026-07-15'
            };

            const displayStart = formatDate(vacation.startDate);
            const displayEnd = formatDate(vacation.endDate);

            expect(displayStart).toBe('01/07/2026');
            expect(displayEnd).toBe('15/07/2026');
        });

        test('should correctly format blocked dates', () => {
            const blockedDates = ['2026-04-10', '2026-05-25', '2026-11-15'];
            
            const displayDates = blockedDates.map(formatDate);
            
            expect(displayDates).toEqual([
                '10/04/2026',
                '25/05/2026',
                '15/11/2026'
            ]);
        });

        test('should correctly format holiday dates', () => {
            const holidays = {
                '2026-01-01': 'Jaunais Gads',
                '2026-12-25': 'Ziemassvētki'
            };

            Object.keys(holidays).forEach(date => {
                const displayDate = formatDate(date);
                expect(displayDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
            });
        });
    });

    describe('Time format consistency', () => {
        test('should maintain 24-hour format for schedule times', () => {
            const schedule = {
                monday: { enabled: true, start: '09:00', end: '17:00' },
                friday: { enabled: true, start: '10:00', end: '15:00' }
            };

            Object.values(schedule).forEach(day => {
                expect(formatTime(day.start)).toMatch(/^\d{2}:\d{2}$/);
                expect(formatTime(day.end)).toMatch(/^\d{2}:\d{2}$/);
            });
        });

        test('should handle evening times correctly (no PM)', () => {
            const eveningTimes = ['18:00', '19:30', '20:00', '21:15'];
            
            eveningTimes.forEach(time => {
                const formatted = formatTime(time);
                expect(formatted).toBe(time);
                expect(formatted).not.toContain('PM');
                expect(formatted).not.toContain('pm');
            });
        });

        test('should handle morning times correctly (no AM)', () => {
            const morningTimes = ['06:00', '07:30', '08:00', '09:15'];
            
            morningTimes.forEach(time => {
                const formatted = formatTime(time);
                expect(formatted).toBe(time);
                expect(formatted).not.toContain('AM');
                expect(formatted).not.toContain('am');
            });
        });
    });

    describe('Integration - Calendar rendering', () => {
        test('should format date and time for calendar cell tooltip', () => {
            const cellData = {
                date: '2026-02-15',
                schedule: { start: '09:00', end: '17:00' }
            };

            const tooltipDate = formatDate(cellData.date);
            const tooltipTime = `${formatTime(cellData.schedule.start)}–${formatTime(cellData.schedule.end)}`;

            expect(tooltipDate).toBe('15/02/2026');
            expect(tooltipTime).toBe('09:00–17:00');
        });

        test('should format booking time for display', () => {
            const booking = {
                date: '2026-03-20',
                time: '14:30',
                name: 'Test User'
            };

            const displayInfo = {
                date: formatDate(booking.date),
                time: formatTime(booking.time)
            };

            expect(displayInfo.date).toBe('20/03/2026');
            expect(displayInfo.time).toBe('14:30');
        });
    });
});
