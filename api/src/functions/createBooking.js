/**
 * createBooking HTTP Handler
 * 
 * Thin HTTP layer that handles request/response, validation, and rate limiting.
 * Business logic is delegated to BookingService.
 */

const { app } = require('@azure/functions');
const { checkRateLimit, rateLimitExceededResponse } = require('../utils/rateLimiter');
const { validateBookingInput, validationErrorResponse } = require('../utils/validation');
const { createBooking, BookingError } = require('../services/bookingService');

app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'bookings',
    handler: async (request, context) => {
        context.log('Processing booking request');
        
        try {
            // Rate limiting (HTTP concern)
            const rateCheck = checkRateLimit(request, 'createBooking');
            if (!rateCheck.allowed) {
                context.log.warn('Rate limit exceeded for createBooking');
                return rateLimitExceededResponse(rateCheck);
            }

            const body = await request.json();
            
            // Input validation & sanitization (HTTP concern)
            const validation = validateBookingInput({
                ...body,
                serviceId: body.service // map service -> serviceId
            });
            
            if (!validation.valid) {
                context.log.warn('Validation failed:', validation.errors);
                return validationErrorResponse(validation.errors);
            }

            // Delegate to service layer
            const result = await createBooking(validation.data, {
                onLog: (msg, ...args) => context.log(msg, ...args),
                onWarn: (msg, ...args) => context.log.warn(msg, ...args),
                onError: (msg, ...args) => context.log.error(msg, ...args)
            });

            return {
                status: 200,
                jsonBody: {
                    success: result.success,
                    message: result.message,
                    bookingId: result.bookingId
                }
            };

        } catch (error) {
            // Handle known booking errors
            if (error instanceof BookingError) {
                context.log.warn(`Booking error [${error.code}]:`, error.message);
                return error.toResponse();
            }

            // Handle unexpected errors
            context.log.error('Unexpected booking error:', error);
            return {
                status: 500,
                jsonBody: { 
                    error: 'Failed to process booking', 
                    details: error.message 
                }
            };
        }
    }
});
