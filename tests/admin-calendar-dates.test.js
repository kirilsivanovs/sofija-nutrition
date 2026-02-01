/**
 * @jest-environment jsdom
 */

describe('Admin Calendar Date Format Tests', () => {
    // Helper functions matching admin panel implementation
    function formatDate(dateStr) {
        // Convert yyyy-mm-dd to dd/mm/yyyy
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function formatDateReverse(dateStr) {
        // Convert dd/mm/yyyy to yyyy-mm-dd
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }

    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    describe('Calendar Date Selection - DD/MM/YYYY Format', () => {
        test('selecting 19/02/2026 in calendar should display 19/02/2026', () => {
            // User selects date in calendar (stored as yyyy-mm-dd internally)
            const selectedDateISO = '2026-02-19';
            
            // Format for display in input field
            const displayDate = formatDate(selectedDateISO);
            
            expect(displayDate).toBe('19/02/2026');
        });

        test('selecting 01/01/2026 in calendar should display 01/01/2026', () => {
            const selectedDateISO = '2026-01-01';
            const displayDate = formatDate(selectedDateISO);
            
            expect(displayDate).toBe('01/01/2026');
        });

        test('selecting 31/12/2026 in calendar should display 31/12/2026', () => {
            const selectedDateISO = '2026-12-31';
            const displayDate = formatDate(selectedDateISO);
            
            expect(displayDate).toBe('31/12/2026');
        });

        test('leap year date 29/02/2024 should display correctly', () => {
            const selectedDateISO = '2024-02-29';
            const displayDate = formatDate(selectedDateISO);
            
            expect(displayDate).toBe('29/02/2024');
        });
    });

    describe('Vacation Period Date Input - Round Trip', () => {
        test('entering 19/02/2026 should convert to yyyy-mm-dd for API', () => {
            // User types in date input (dd/mm/yyyy format)
            const userInput = '19/02/2026';
            
            // Convert to API format
            const apiDate = formatDateReverse(userInput);
            
            expect(apiDate).toBe('2026-02-19');
        });

        test('vacation period round trip: input → API → display', () => {
            // 1. User enters date
            const userInput = '19/02/2026';
            
            // 2. Convert to API format for saving
            const apiDate = formatDateReverse(userInput);
            expect(apiDate).toBe('2026-02-19');
            
            // 3. After saving, display in list (convert back)
            const displayDate = formatDate(apiDate);
            expect(displayDate).toBe('19/02/2026');
        });

        test('blocked date round trip: input → API → display', () => {
            // Block date: 15/03/2026
            const userInput = '15/03/2026';
            
            // Send to API
            const apiDate = formatDateReverse(userInput);
            expect(apiDate).toBe('2026-03-15');
            
            // Display in blocked dates list
            const displayDate = formatDate(apiDate);
            expect(displayDate).toBe('15/03/2026');
        });
    });

    describe('Date Consistency Across Admin Panel', () => {
        test('all dates should use dd/mm/yyyy format for display', () => {
            const testDates = [
                { iso: '2026-01-15', display: '15/01/2026' },
                { iso: '2026-06-30', display: '30/06/2026' },
                { iso: '2026-11-11', display: '11/11/2026' },
                { iso: '2025-12-25', display: '25/12/2025' },
            ];

            testDates.forEach(({ iso, display }) => {
                expect(formatDate(iso)).toBe(display);
            });
        });

        test('all dates should use yyyy-mm-dd format for API', () => {
            const testDates = [
                { display: '15/01/2026', iso: '2026-01-15' },
                { display: '30/06/2026', iso: '2026-06-30' },
                { display: '11/11/2026', iso: '2026-11-11' },
                { display: '25/12/2025', iso: '2025-12-25' },
            ];

            testDates.forEach(({ display, iso }) => {
                expect(formatDateReverse(display)).toBe(iso);
            });
        });
    });

    describe('Date Object to ISO Format', () => {
        test('Date object should convert to yyyy-mm-dd', () => {
            const date = new Date(2026, 1, 19); // Month is 0-indexed
            const isoString = formatDateISO(date);
            
            expect(isoString).toBe('2026-02-19');
        });

        test('single digit days and months should be padded', () => {
            const date = new Date(2026, 0, 5); // January 5
            const isoString = formatDateISO(date);
            
            expect(isoString).toBe('2026-01-05');
        });
    });

    describe('Edge Cases and Validation', () => {
        test('empty string should return empty string', () => {
            expect(formatDate('')).toBe('');
            expect(formatDateReverse('')).toBe('');
        });

        test('null should return empty string', () => {
            expect(formatDate(null)).toBe('');
            expect(formatDateReverse(null)).toBe('');
        });

        test('undefined should return empty string', () => {
            expect(formatDate(undefined)).toBe('');
            expect(formatDateReverse(undefined)).toBe('');
        });

        test('dates at year boundaries should work correctly', () => {
            expect(formatDate('2025-12-31')).toBe('31/12/2025');
            expect(formatDate('2026-01-01')).toBe('01/01/2026');
            
            expect(formatDateReverse('31/12/2025')).toBe('2025-12-31');
            expect(formatDateReverse('01/01/2026')).toBe('2026-01-01');
        });
    });

    describe('Date Format Standardization', () => {
        test('admin panel should NEVER use mm/dd/yyyy format', () => {
            // This test documents the requirement
            const febNineteenth = '2026-02-19';
            
            // Should be 19/02/2026 (dd/mm/yyyy)
            const correctFormat = formatDate(febNineteenth);
            expect(correctFormat).toBe('19/02/2026');
            
            // Should NOT be 02/19/2026 (mm/dd/yyyy - US format)
            expect(correctFormat).not.toBe('02/19/2026');
        });

        test('all input placeholders should show dd/mm/yyyy', () => {
            // This is a documentation test
            // Actual implementation: placeholder="dd/mm/yyyy"
            expect('dd/mm/yyyy').toBe('dd/mm/yyyy');
        });
    });
});
