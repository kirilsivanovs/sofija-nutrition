/**
 * @jest-environment jsdom
 */

describe('Admin Calendar Logic', () => {
    // Helper function to check if date is in vacation period
    function isDateInVacation(dateStr, vacationPeriods) {
        return vacationPeriods.some(v => dateStr >= v.startDate && dateStr <= v.endDate);
    }

    // Helper to calculate day type
    function getDayType(dateStr, config) {
        const { holidays, blockedDates, vacationPeriods, schedule } = config;
        const date = new Date(dateStr + 'T12:00:00');
        const dayOfWeek = date.getDay();
        const dayNamesForSchedule = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const scheduleDayName = dayNamesForSchedule[dayOfWeek];
        
        const isHoliday = holidays[dateStr];
        const isBlocked = blockedDates.has(dateStr);
        const isVacation = isDateInVacation(dateStr, vacationPeriods);
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const daySchedule = schedule[scheduleDayName];
        const isWorkingDay = daySchedule && daySchedule.enabled;
        
        if (isHoliday || isBlocked || isVacation) return 'holiday';
        if (isWeekend || !isWorkingDay) return 'weekend';
        return 'available';
    }

    describe('Vacation Period Detection', () => {
        test('should detect date within single vacation period', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-01', endDate: '2026-03-15' }
            ];
            expect(isDateInVacation('2026-03-01', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-10', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-15', vacationPeriods)).toBe(true);
        });

        test('should detect dates outside vacation period', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-01', endDate: '2026-03-15' }
            ];
            expect(isDateInVacation('2026-02-28', vacationPeriods)).toBe(false);
            expect(isDateInVacation('2026-03-16', vacationPeriods)).toBe(false);
        });

        test('should handle multiple vacation periods', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-01', endDate: '2026-03-15' },
                { id: '2', startDate: '2026-07-20', endDate: '2026-08-05' }
            ];
            expect(isDateInVacation('2026-03-10', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-07-25', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-06-15', vacationPeriods)).toBe(false);
        });

        test('should handle empty vacation periods', () => {
            expect(isDateInVacation('2026-03-10', [])).toBe(false);
        });

        test('should handle single day vacation', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-01', endDate: '2026-03-01' }
            ];
            expect(isDateInVacation('2026-03-01', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-02', vacationPeriods)).toBe(false);
        });
    });

    describe('Day Type Classification', () => {
        const defaultSchedule = {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' }
        };

        test('should classify regular working day as available', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            // 2026-02-02 is Monday
            expect(getDayType('2026-02-02', config)).toBe('available');
        });

        test('should classify weekend as weekend', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            // 2026-01-31 is Saturday
            expect(getDayType('2026-01-31', config)).toBe('weekend');
            // 2026-02-01 is Sunday
            expect(getDayType('2026-02-01', config)).toBe('weekend');
        });

        test('should classify holiday as holiday', () => {
            const config = {
                holidays: { '2026-01-01': 'Jaunais Gads' },
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            expect(getDayType('2026-01-01', config)).toBe('holiday');
        });

        test('should classify blocked date as holiday', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(['2026-02-10']),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            expect(getDayType('2026-02-10', config)).toBe('holiday');
        });

        test('should classify vacation date as holiday', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [{ id: '1', startDate: '2026-03-01', endDate: '2026-03-15' }],
                schedule: defaultSchedule
            };
            expect(getDayType('2026-03-10', config)).toBe('holiday');
        });

        test('should prioritize vacation over weekend', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [{ id: '1', startDate: '2026-03-01', endDate: '2026-03-15' }],
                schedule: defaultSchedule
            };
            // 2026-03-07 is Saturday, but should be holiday due to vacation
            expect(getDayType('2026-03-07', config)).toBe('holiday');
        });

        test('should handle disabled working day', () => {
            const customSchedule = { ...defaultSchedule, monday: { enabled: false, start: '09:00', end: '17:00' } };
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: customSchedule
            };
            // 2026-02-02 is Monday but disabled
            expect(getDayType('2026-02-02', config)).toBe('weekend');
        });
    });

    describe('Booking Counting Logic', () => {
        test('should count bookings by status correctly', () => {
            const dayBookings = [
                { status: null, paymentConfirmed: true },
                { status: null, paymentConfirmed: false },
                { status: 'cancelled', paymentConfirmed: false },
                { status: null, paymentConfirmed: true }
            ];

            const confirmed = dayBookings.filter(b => b.paymentConfirmed && b.status !== 'cancelled').length;
            const pending = dayBookings.filter(b => !b.paymentConfirmed && b.status !== 'cancelled').length;
            const cancelled = dayBookings.filter(b => b.status === 'cancelled').length;

            expect(confirmed).toBe(2);
            expect(pending).toBe(1);
            expect(cancelled).toBe(1);
        });

        test('should handle empty bookings', () => {
            const dayBookings = [];
            const confirmed = dayBookings.filter(b => b.paymentConfirmed && b.status !== 'cancelled').length;
            const pending = dayBookings.filter(b => !b.paymentConfirmed && b.status !== 'cancelled').length;
            const cancelled = dayBookings.filter(b => b.status === 'cancelled').length;

            expect(confirmed).toBe(0);
            expect(pending).toBe(0);
            expect(cancelled).toBe(0);
        });

        test('should not count cancelled as confirmed even if payment confirmed', () => {
            const dayBookings = [
                { status: 'cancelled', paymentConfirmed: true }
            ];
            const confirmed = dayBookings.filter(b => b.paymentConfirmed && b.status !== 'cancelled').length;
            expect(confirmed).toBe(0);
        });
    });

    describe('Date Range Validation', () => {
        test('should validate vacation period dates', () => {
            const validateVacationPeriod = (startDate, endDate) => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                return start <= end;
            };

            expect(validateVacationPeriod('2026-03-01', '2026-03-15')).toBe(true);
            expect(validateVacationPeriod('2026-03-15', '2026-03-01')).toBe(false);
            expect(validateVacationPeriod('2026-03-01', '2026-03-01')).toBe(true);
        });
    });

    describe('Calendar Cell Classification with Bookings', () => {
        const defaultSchedule = {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' }
        };

        function getCellClass(dateStr, config, bookings) {
            const dayType = getDayType(dateStr, config);
            if (dayType === 'holiday') return 'holiday';
            if (dayType === 'weekend') return 'weekend';
            
            const confirmed = bookings.filter(b => b.paymentConfirmed && b.status !== 'cancelled').length;
            const pending = bookings.filter(b => !b.paymentConfirmed && b.status !== 'cancelled').length;
            
            if (confirmed > 0 || pending > 0) return 'booked';
            return 'available';
        }

        test('should classify available day with no bookings', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            expect(getCellClass('2026-02-02', config, [])).toBe('available');
        });

        test('should classify available day with bookings as booked', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            const bookings = [{ paymentConfirmed: true, status: null }];
            expect(getCellClass('2026-02-02', config, bookings)).toBe('booked');
        });

        test('should keep holiday status even with bookings', () => {
            const config = {
                holidays: { '2026-01-01': 'Jaunais Gads' },
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            const bookings = [{ paymentConfirmed: true, status: null }];
            expect(getCellClass('2026-01-01', config, bookings)).toBe('holiday');
        });

        test('should keep weekend status even with bookings', () => {
            const config = {
                holidays: {},
                blockedDates: new Set(),
                vacationPeriods: [],
                schedule: defaultSchedule
            };
            const bookings = [{ paymentConfirmed: true, status: null }];
            // 2026-01-31 is Saturday
            expect(getCellClass('2026-01-31', config, bookings)).toBe('weekend');
        });
    });

    describe('Month Navigation Bug Prevention', () => {
        test('navigating from Jan 30 to next month should show February', () => {
            const date = new Date('2026-01-30T12:00:00');
            // Simulate correct navigation: set day to 1 before changing month
            date.setDate(1);
            date.setMonth(date.getMonth() + 1);
            expect(date.getMonth()).toBe(1); // February (0-indexed)
            expect(date.getFullYear()).toBe(2026);
        });

        test('navigating from Jan 31 to next month should show February', () => {
            const date = new Date('2026-01-31T12:00:00');
            date.setDate(1);
            date.setMonth(date.getMonth() + 1);
            expect(date.getMonth()).toBe(1); // February
        });

        test('navigating from Mar 31 to previous month should show February', () => {
            const date = new Date('2026-03-31T12:00:00');
            date.setDate(1);
            date.setMonth(date.getMonth() - 1);
            expect(date.getMonth()).toBe(1); // February
        });

        test('navigating from May 31 to next month should show June', () => {
            const date = new Date('2026-05-31T12:00:00');
            date.setDate(1);
            date.setMonth(date.getMonth() + 1);
            expect(date.getMonth()).toBe(5); // June
        });

        test('without setDate(1), Jan 30 next month would incorrectly show March', () => {
            const date = new Date('2026-01-30T12:00:00');
            // This is the BUG - without setDate(1), it overflows
            date.setMonth(date.getMonth() + 1);
            // Jan 30 + 1 month = Feb 30 (doesn't exist) = March 2
            expect(date.getMonth()).toBe(2); // March (this is the bug!)
        });

        test('without setDate(1), Jan 31 next month would incorrectly show March', () => {
            const date = new Date('2026-01-31T12:00:00');
            date.setMonth(date.getMonth() + 1);
            // Jan 31 + 1 month = Feb 31 (doesn't exist) = March 3
            expect(date.getMonth()).toBe(2); // March (bug)
        });

        test('leap year: navigating from Jan 29, 2024 to Feb should work', () => {
            const date = new Date('2024-01-29T12:00:00');
            date.setDate(1);
            date.setMonth(date.getMonth() + 1);
            expect(date.getMonth()).toBe(1); // February 2024 (leap year)
        });

        test('navigating backwards from Mar 31 to Feb should work', () => {
            const date = new Date('2026-03-31T12:00:00');
            date.setDate(1);
            date.setMonth(date.getMonth() - 1);
            expect(date.getMonth()).toBe(1); // February
            expect(date.getDate()).toBe(1);
        });
    });
});
