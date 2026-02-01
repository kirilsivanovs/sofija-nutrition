/**
 * Tests for getAvailability API function
 * Testing vacation period filtering, date range generation, and slot availability
 */

import { isLatvianHoliday } from '../src/services/latvianHolidays');

describe('Availability API Logic', () => {
    // Helper function to check if date is in vacation period
    function isDateInVacation(dateStr, vacationPeriods) {
        return vacationPeriods.some(v => dateStr >= v.startDate && dateStr <= v.endDate);
    }

    // Helper to generate slots from schedule
    function generateSlotsFromSchedule(schedule, dayName) {
        const dayConfig = schedule[dayName];
        if (!dayConfig || !dayConfig.enabled) {
            return [];
        }
        
        const slots = [];
        const [startHour] = dayConfig.start.split(':').map(Number);
        const [endHour] = dayConfig.end.split(':').map(Number);
        
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${String(hour).padStart(2, '0')}:00`);
        }
        
        return slots;
    }

    describe('Vacation Period Filtering', () => {
        test('should block dates within vacation period', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-10', endDate: '2026-03-20', reason: 'Spring break' }
            ];

            expect(isDateInVacation('2026-03-10', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-15', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-20', vacationPeriods)).toBe(true);
        });

        test('should not block dates outside vacation period', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-10', endDate: '2026-03-20', reason: 'Spring break' }
            ];

            expect(isDateInVacation('2026-03-09', vacationPeriods)).toBe(false);
            expect(isDateInVacation('2026-03-21', vacationPeriods)).toBe(false);
            expect(isDateInVacation('2026-04-01', vacationPeriods)).toBe(false);
        });

        test('should handle multiple vacation periods', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-10', endDate: '2026-03-20', reason: 'Spring break' },
                { id: '2', startDate: '2026-07-01', endDate: '2026-07-15', reason: 'Summer vacation' },
                { id: '3', startDate: '2026-12-20', endDate: '2026-12-31', reason: 'Winter holidays' }
            ];

            expect(isDateInVacation('2026-03-15', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-07-10', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-12-25', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-06-15', vacationPeriods)).toBe(false);
        });

        test('should handle overlapping vacation periods', () => {
            const vacationPeriods = [
                { id: '1', startDate: '2026-03-10', endDate: '2026-03-20' },
                { id: '2', startDate: '2026-03-18', endDate: '2026-03-25' }
            ];

            expect(isDateInVacation('2026-03-10', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-19', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-25', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2026-03-26', vacationPeriods)).toBe(false);
        });

        test('should handle empty vacation periods array', () => {
            expect(isDateInVacation('2026-03-15', [])).toBe(false);
        });
    });

    describe('Date Range Generation', () => {
        test('should generate 90 days of dates', () => {
            const today = new Date(Date.UTC(2026, 0, 30)); // Use UTC to avoid timezone issues
            const dates = [];
            
            for (let i = 0; i <= 90; i++) {
                const checkDate = new Date(today);
                checkDate.setUTCDate(today.getUTCDate() + i);
                dates.push(checkDate.toISOString().split('T')[0]);
            }

            expect(dates.length).toBe(91); // 0 to 90 inclusive
            expect(dates[0]).toBe('2026-01-30');
            expect(dates[90]).toBe('2026-04-30'); // 90 days from Jan 30 in UTC
        });

        test('should include March when starting from January 30', () => {
            const today = new Date('2026-01-30');
            const dates = [];
            
            for (let i = 0; i <= 90; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + i);
                dates.push(checkDate.toISOString().split('T')[0]);
            }

            const marchDates = dates.filter(d => d.startsWith('2026-03'));
            expect(marchDates.length).toBeGreaterThan(0);
            expect(marchDates[0]).toBe('2026-03-01');
            expect(marchDates[marchDates.length - 1]).toBe('2026-03-31');
        });
    });

    describe('Slot Generation from Schedule', () => {
        const defaultSchedule = {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '18:00' },
            wednesday: { enabled: true, start: '10:00', end: '16:00' },
            thursday: { enabled: false, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '14:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' }
        };

        test('should generate correct slots for enabled day', () => {
            const slots = generateSlotsFromSchedule(defaultSchedule, 'monday');
            expect(slots).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']);
        });

        test('should generate different slots based on schedule', () => {
            const tuesday = generateSlotsFromSchedule(defaultSchedule, 'tuesday');
            const wednesday = generateSlotsFromSchedule(defaultSchedule, 'wednesday');
            
            expect(tuesday.length).toBe(9); // 09:00-17:00
            expect(wednesday.length).toBe(6); // 10:00-15:00
        });

        test('should return empty array for disabled day', () => {
            const slots = generateSlotsFromSchedule(defaultSchedule, 'thursday');
            expect(slots).toEqual([]);
        });

        test('should return empty array for weekend when disabled', () => {
            expect(generateSlotsFromSchedule(defaultSchedule, 'saturday')).toEqual([]);
            expect(generateSlotsFromSchedule(defaultSchedule, 'sunday')).toEqual([]);
        });
    });

    describe('Booked Slot Filtering', () => {
        test('should filter out booked slots from available slots', () => {
            const availableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00'];
            const bookedSlots = ['10:00', '15:00'];
            
            const filteredSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));
            
            expect(filteredSlots).toEqual(['09:00', '11:00', '14:00']);
        });

        test('should handle no booked slots', () => {
            const availableSlots = ['09:00', '10:00', '11:00'];
            const bookedSlots = [];
            
            const filteredSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));
            
            expect(filteredSlots).toEqual(availableSlots);
        });

        test('should handle all slots booked', () => {
            const availableSlots = ['09:00', '10:00', '11:00'];
            const bookedSlots = ['09:00', '10:00', '11:00'];
            
            const filteredSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));
            
            expect(filteredSlots).toEqual([]);
        });
    });

    describe('Past Time Filtering for Today', () => {
        test('should filter out past slots for today with 30min buffer', () => {
            const currentHour = 14;
            const currentMinute = 15;
            const availableSlots = ['09:00', '10:00', '13:00', '14:00', '15:00', '16:00'];
            
            const currentTotalMinutes = currentHour * 60 + currentMinute + 30; // 14:45
            const futureSlots = availableSlots.filter(time => {
                const [slotHour, slotMinute] = time.split(':').map(Number);
                return (slotHour * 60 + slotMinute) > currentTotalMinutes;
            });
            
            expect(futureSlots).toEqual(['15:00', '16:00']);
        });

        test('should keep all slots if current time is before first slot', () => {
            const currentHour = 8;
            const currentMinute = 0;
            const availableSlots = ['09:00', '10:00', '11:00'];
            
            const currentTotalMinutes = currentHour * 60 + currentMinute + 30;
            const futureSlots = availableSlots.filter(time => {
                const [slotHour, slotMinute] = time.split(':').map(Number);
                return (slotHour * 60 + slotMinute) > currentTotalMinutes;
            });
            
            expect(futureSlots).toEqual(['09:00', '10:00', '11:00']);
        });

        test('should filter all slots if current time is after last slot', () => {
            const currentHour = 18;
            const currentMinute = 0;
            const availableSlots = ['09:00', '10:00', '11:00'];
            
            const currentTotalMinutes = currentHour * 60 + currentMinute + 30;
            const futureSlots = availableSlots.filter(time => {
                const [slotHour, slotMinute] = time.split(':').map(Number);
                return (slotHour * 60 + slotMinute) > currentTotalMinutes;
            });
            
            expect(futureSlots).toEqual([]);
        });
    });

    describe('Holiday Detection', () => {
        test('should detect Latvian public holidays', () => {
            const newYear = isLatvianHoliday('2026-01-01');
            expect(newYear.isHoliday).toBe(true);
            expect(newYear.name).toBeDefined();
        });

        test('should not mark regular days as holidays', () => {
            const regularDay = isLatvianHoliday('2026-03-15');
            expect(regularDay.isHoliday).toBe(false);
        });
    });

    describe('Complete Date Filtering Logic', () => {
        const defaultSchedule = {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '14:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' }
        };

        function shouldIncludeDate(dateStr, config) {
            import { schedule, blockedDates, vacationPeriods } = config;
            const date = new Date(dateStr + 'T12:00:00');
            const dayOfWeek = date.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            
            // Check schedule
            if (!schedule[dayName] || !schedule[dayName].enabled) {
                return false;
            }
            
            // Check holiday
            const holidayCheck = isLatvianHoliday(dateStr);
            if (holidayCheck.isHoliday) {
                return false;
            }
            
            // Check blocked dates
            if (blockedDates.has(dateStr)) {
                return false;
            }
            
            // Check vacation
            if (isDateInVacation(dateStr, vacationPeriods)) {
                return false;
            }
            
            return true;
        }

        test('should include regular working day', () => {
            const config = {
                schedule: defaultSchedule,
                blockedDates: new Set(),
                vacationPeriods: []
            };
            
            // Monday, Feb 2, 2026
            expect(shouldIncludeDate('2026-02-02', config)).toBe(true);
        });

        test('should exclude weekend', () => {
            const config = {
                schedule: defaultSchedule,
                blockedDates: new Set(),
                vacationPeriods: []
            };
            
            // Saturday, Jan 31, 2026
            expect(shouldIncludeDate('2026-01-31', config)).toBe(false);
        });

        test('should exclude blocked date', () => {
            const config = {
                schedule: defaultSchedule,
                blockedDates: new Set(['2026-02-10']),
                vacationPeriods: []
            };
            
            expect(shouldIncludeDate('2026-02-10', config)).toBe(false);
        });

        test('should exclude vacation dates but include surrounding dates', () => {
            const config = {
                schedule: defaultSchedule,
                blockedDates: new Set(),
                vacationPeriods: [
                    { id: '1', startDate: '2026-03-10', endDate: '2026-03-20' }
                ]
            };
            
            // Before vacation
            expect(shouldIncludeDate('2026-03-09', config)).toBe(true);
            
            // During vacation
            expect(shouldIncludeDate('2026-03-10', config)).toBe(false);
            expect(shouldIncludeDate('2026-03-15', config)).toBe(false);
            expect(shouldIncludeDate('2026-03-20', config)).toBe(false);
            
            // After vacation (but check if it's not weekend)
            // March 23, 2026 is Monday
            expect(shouldIncludeDate('2026-03-23', config)).toBe(true);
        });

        test('should exclude holiday', () => {
            const config = {
                schedule: defaultSchedule,
                blockedDates: new Set(),
                vacationPeriods: []
            };
            
            // New Year
            expect(shouldIncludeDate('2026-01-01', config)).toBe(false);
        });
    });
});

