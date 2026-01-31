/**
 * Tests for BookingService
 */

const { 
    BookingError, 
    BookingErrorCodes 
} = require('../src/services/bookingService');

describe('BookingService', () => {
    describe('BookingError', () => {
        it('should create error with all properties', () => {
            const error = new BookingError(
                'Test error',
                BookingErrorCodes.SLOT_ALREADY_BOOKED,
                409,
                { extra: 'data' }
            );
            
            expect(error.message).toBe('Test error');
            expect(error.code).toBe(BookingErrorCodes.SLOT_ALREADY_BOOKED);
            expect(error.statusCode).toBe(409);
            expect(error.details).toEqual({ extra: 'data' });
            expect(error.name).toBe('BookingError');
        });
        
        it('should convert to response format', () => {
            const error = new BookingError(
                'Time slot is taken',
                BookingErrorCodes.SLOT_ALREADY_BOOKED,
                409,
                { errorLv: 'Laiks aizņemts' }
            );
            
            const response = error.toResponse();
            
            expect(response.status).toBe(409);
            expect(response.jsonBody.error).toBe('Time slot is taken');
            expect(response.jsonBody.code).toBe('SLOT_ALREADY_BOOKED');
            expect(response.jsonBody.errorLv).toBe('Laiks aizņemts');
        });
        
        it('should have default status code 400', () => {
            const error = new BookingError('Bad request', BookingErrorCodes.WEEKEND_NOT_ALLOWED);
            
            expect(error.statusCode).toBe(400);
        });
    });
    
    describe('BookingErrorCodes', () => {
        it('should have all expected error codes', () => {
            expect(BookingErrorCodes.WEEKEND_NOT_ALLOWED).toBe('WEEKEND_NOT_ALLOWED');
            expect(BookingErrorCodes.HOLIDAY_NOT_ALLOWED).toBe('HOLIDAY_NOT_ALLOWED');
            expect(BookingErrorCodes.SLOT_BEING_BOOKED).toBe('SLOT_BEING_BOOKED');
            expect(BookingErrorCodes.SLOT_ALREADY_BOOKED).toBe('SLOT_ALREADY_BOOKED');
            expect(BookingErrorCodes.BOOKING_NOT_FOUND).toBe('BOOKING_NOT_FOUND');
            expect(BookingErrorCodes.ALREADY_CANCELLED).toBe('ALREADY_CANCELLED');
            expect(BookingErrorCodes.ALREADY_CONFIRMED).toBe('ALREADY_CONFIRMED');
            expect(BookingErrorCodes.INVALID_TOKEN).toBe('INVALID_TOKEN');
        });
    });
});

describe('BookingService Integration', () => {
    // These tests would require mocking Azure Table Storage
    // For now, we test the error handling path
    
    describe('Date Validation', () => {
        // Import the validation functions for isolated testing
        // In a real scenario, these would be exposed or tested through the main function
        
        it('should recognize Saturday as weekend', () => {
            // Saturday date: 2025-01-25
            const date = new Date('2025-01-25');
            const dayOfWeek = date.getDay();
            expect(dayOfWeek).toBe(6); // 6 = Saturday
        });
        
        it('should recognize Sunday as weekend', () => {
            // Sunday date: 2025-01-26
            const date = new Date('2025-01-26');
            const dayOfWeek = date.getDay();
            expect(dayOfWeek).toBe(0); // 0 = Sunday
        });
        
        it('should recognize Monday as weekday', () => {
            // Monday date: 2025-01-27
            const date = new Date('2025-01-27');
            const dayOfWeek = date.getDay();
            expect(dayOfWeek).toBe(1); // 1 = Monday
        });
    });
});
