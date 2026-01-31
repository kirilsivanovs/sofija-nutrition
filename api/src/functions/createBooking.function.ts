/**
 * createBooking HTTP Handler (TypeScript)
 * 
 * Thin HTTP layer that handles request/response, validation, and rate limiting.
 * Business logic is delegated to BookingService.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { checkRateLimit, rateLimitExceededResponse } from '../utils/rateLimiter';
import { validateBookingInput, validationErrorResponse } from '../utils/validation';
import { createBooking, BookingError } from '../services/bookingService';

// ============================================
// Handler
// ============================================

async function createBookingHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing booking request');

  try {
    // Rate limiting (HTTP concern)
    const rateCheck = checkRateLimit(request as any, 'createBooking');
    if (!rateCheck.allowed) {
      context.warn('Rate limit exceeded for createBooking');
      return rateLimitExceededResponse(rateCheck);
    }

    const body = await request.json() as Record<string, unknown>;

    // Input validation & sanitization (HTTP concern)
    const validation = validateBookingInput({
      ...body,
      serviceId: body.service as string // map service -> serviceId
    });

    if (!validation.valid) {
      context.warn('Validation failed:', validation.errors);
      return validationErrorResponse(validation.errors || {});
    }

    // Delegate to service layer
    const result = await createBooking(validation.data, {
      onLog: (msg: unknown, ...args: unknown[]) => context.log(String(msg), ...args),
      onWarn: (msg: unknown, ...args: unknown[]) => context.warn(String(msg), ...args),
      onError: (msg: unknown, ...args: unknown[]) => context.error(String(msg), ...args)
    });

    return {
      status: 200,
      jsonBody: {
        success: result.success,
        message: result.message,
        bookingId: result.bookingId
      }
    };

  } catch (error: unknown) {
    // Handle known booking errors
    if (error instanceof BookingError) {
      context.warn(`Booking error [${error.code}]:`, error.message);
      return error.toResponse();
    }

    // Handle unexpected errors
    const err = error as { message?: string };
    context.error('Unexpected booking error:', err);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to process booking',
        details: err.message
      }
    };
  }
}

// ============================================
// Register Function
// ============================================

app.http('createBooking', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'bookings',
  handler: createBookingHandler
});

// ============================================
// Export for testing
// ============================================

export { createBookingHandler };
