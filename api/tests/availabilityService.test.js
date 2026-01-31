/**
 * Tests for AvailabilityService
 */

const {
    generateSlotsFromSchedule,
    isDateInVacation,
    DEFAULT_SCHEDULE,
    DEFAULT_SERVICES,
    dayNames
} = require('../src/services/availabilityService');

describe('AvailabilityService', () => {
    describe('dayNames', () => {
        it('should map day indices correctly', () => {
            expect(dayNames[0]).toBe('sunday');
            expect(dayNames[1]).toBe('monday');
            expect(dayNames[2]).toBe('tuesday');
            expect(dayNames[3]).toBe('wednesday');
            expect(dayNames[4]).toBe('thursday');
            expect(dayNames[5]).toBe('friday');
            expect(dayNames[6]).toBe('saturday');
        });
    });
    
    describe('DEFAULT_SCHEDULE', () => {
        it('should have weekdays enabled', () => {
            expect(DEFAULT_SCHEDULE.monday.enabled).toBe(true);
            expect(DEFAULT_SCHEDULE.tuesday.enabled).toBe(true);
            expect(DEFAULT_SCHEDULE.wednesday.enabled).toBe(true);
            expect(DEFAULT_SCHEDULE.thursday.enabled).toBe(true);
            expect(DEFAULT_SCHEDULE.friday.enabled).toBe(true);
        });
        
        it('should have weekends disabled', () => {
            expect(DEFAULT_SCHEDULE.saturday.enabled).toBe(false);
            expect(DEFAULT_SCHEDULE.sunday.enabled).toBe(false);
        });
        
        it('should have 9-18 working hours for weekdays', () => {
            expect(DEFAULT_SCHEDULE.monday.start).toBe('09:00');
            expect(DEFAULT_SCHEDULE.monday.end).toBe('18:00');
        });
    });
    
    describe('DEFAULT_SERVICES', () => {
        it('should have all required services', () => {
            const ids = DEFAULT_SERVICES.map(s => s.id);
            expect(ids).toContain('cgm-diagnostic');
            expect(ids).toContain('consultation');
            expect(ids).toContain('free-consultation');
        });
        
        it('should have translations for all languages', () => {
            DEFAULT_SERVICES.forEach(service => {
                expect(service.name).toHaveProperty('lv');
                expect(service.name).toHaveProperty('ru');
                expect(service.name).toHaveProperty('en');
            });
        });
        
        it('should have duration for all services', () => {
            DEFAULT_SERVICES.forEach(service => {
                expect(typeof service.duration).toBe('number');
                expect(service.duration).toBeGreaterThan(0);
            });
        });
    });
    
    describe('generateSlotsFromSchedule', () => {
        it('should generate hourly slots from 9 to 18', () => {
            const slots = generateSlotsFromSchedule(DEFAULT_SCHEDULE, 'monday');
            
            expect(slots).toContain('09:00');
            expect(slots).toContain('10:00');
            expect(slots).toContain('17:00');
            expect(slots).not.toContain('18:00'); // End time is exclusive
            expect(slots.length).toBe(9); // 09:00 - 17:00 = 9 slots
        });
        
        it('should return empty array for disabled day', () => {
            const slots = generateSlotsFromSchedule(DEFAULT_SCHEDULE, 'sunday');
            expect(slots).toEqual([]);
        });
        
        it('should handle custom schedule', () => {
            const customSchedule = {
                monday: { enabled: true, start: '10:00', end: '14:00' }
            };
            
            const slots = generateSlotsFromSchedule(customSchedule, 'monday');
            
            expect(slots).toEqual(['10:00', '11:00', '12:00', '13:00']);
        });
        
        it('should return empty for non-existent day', () => {
            const slots = generateSlotsFromSchedule({}, 'monday');
            expect(slots).toEqual([]);
        });
    });
    
    describe('isDateInVacation', () => {
        const vacationPeriods = [
            { startDate: '2025-07-01', endDate: '2025-07-15' },
            { startDate: '2025-12-24', endDate: '2025-12-31' }
        ];
        
        it('should return true for date within vacation period', () => {
            expect(isDateInVacation('2025-07-05', vacationPeriods)).toBe(true);
            expect(isDateInVacation('2025-12-25', vacationPeriods)).toBe(true);
        });
        
        it('should return true for vacation start date', () => {
            expect(isDateInVacation('2025-07-01', vacationPeriods)).toBe(true);
        });
        
        it('should return true for vacation end date', () => {
            expect(isDateInVacation('2025-07-15', vacationPeriods)).toBe(true);
        });
        
        it('should return false for date outside vacation', () => {
            expect(isDateInVacation('2025-06-30', vacationPeriods)).toBe(false);
            expect(isDateInVacation('2025-07-16', vacationPeriods)).toBe(false);
            expect(isDateInVacation('2025-09-01', vacationPeriods)).toBe(false);
        });
        
        it('should return false for empty vacation periods', () => {
            expect(isDateInVacation('2025-07-05', [])).toBe(false);
        });
    });
});
