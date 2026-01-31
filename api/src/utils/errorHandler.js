/**
 * Centralized Error Handler
 * Provides consistent error handling across all Azure Functions
 */

/**
 * Custom application error class
 * Use this for operational errors that should be returned to the client
 */
class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Application error code (e.g., 'VALIDATION_ERROR')
     * @param {Object} [details] - Additional error details
     */
    constructor(message, statusCode, errorCode, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true;
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert to JSON response format
     */
    toJSON() {
        return {
            success: false,
            error: {
                code: this.errorCode,
                message: this.message,
                ...(this.details && { details: this.details })
            }
        };
    }
}

// Common error codes
const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    SLOT_TAKEN: 'SLOT_TAKEN',
    SLOT_LOCKED: 'SLOT_LOCKED',
    WEEKEND_BOOKING: 'WEEKEND_BOOKING',
    HOLIDAY_BOOKING: 'HOLIDAY_BOOKING',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * Wrapper function for Azure Function handlers
 * Provides centralized error handling and logging
 * 
 * @param {Function} handler - Async function handler
 * @param {Object} options - Configuration options
 * @returns {Function} Wrapped handler
 */
function withErrorHandling(handler, options = {}) {
    const { 
        logErrors = true,
        includeStack = process.env.NODE_ENV !== 'production'
    } = options;

    return async (request, context) => {
        const startTime = Date.now();
        const requestId = generateRequestId();

        try {
            // Add request ID to context for logging
            context.requestId = requestId;
            
            const result = await handler(request, context);
            
            // Log successful request
            if (logErrors) {
                const duration = Date.now() - startTime;
                context.log(`[${requestId}] Request completed in ${duration}ms`);
            }
            
            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            // Handle operational errors (expected errors)
            if (error instanceof AppError || error.isOperational) {
                if (logErrors) {
                    context.warn(`[${requestId}] Operational error (${duration}ms):`, error.message);
                }

                return {
                    status: error.statusCode || 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-Id': requestId
                    },
                    jsonBody: error.toJSON ? error.toJSON() : {
                        success: false,
                        error: {
                            code: error.errorCode || ErrorCodes.INTERNAL_ERROR,
                            message: error.message
                        }
                    }
                };
            }

            // Handle unexpected errors
            if (logErrors) {
                context.error(`[${requestId}] Unexpected error (${duration}ms):`, error);
            }

            const responseBody = {
                success: false,
                error: {
                    code: ErrorCodes.INTERNAL_ERROR,
                    message: 'An unexpected error occurred',
                    requestId
                }
            };

            // Include stack trace in non-production environments
            if (includeStack && error.stack) {
                responseBody.error.stack = error.stack;
            }

            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-Id': requestId
                },
                jsonBody: responseBody
            };
        }
    };
}

/**
 * Generate a unique request ID for tracking
 * @returns {string}
 */
function generateRequestId() {
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Factory functions for common errors
 */
const Errors = {
    validation: (message, details = null) => 
        new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details),
    
    unauthorized: (message = 'Authentication required') => 
        new AppError(message, 401, ErrorCodes.UNAUTHORIZED),
    
    forbidden: (message = 'Access denied') => 
        new AppError(message, 403, ErrorCodes.FORBIDDEN),
    
    notFound: (resource = 'Resource') => 
        new AppError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND),
    
    conflict: (message) => 
        new AppError(message, 409, ErrorCodes.CONFLICT),
    
    slotTaken: (date, time) => 
        new AppError(
            'Time slot already booked', 
            409, 
            ErrorCodes.SLOT_TAKEN,
            { date, time }
        ),
    
    slotLocked: (date, time) => 
        new AppError(
            'Time slot is being booked by another user', 
            409, 
            ErrorCodes.SLOT_LOCKED,
            { date, time }
        ),
    
    rateLimitExceeded: (retryAfter) => 
        new AppError(
            'Too many requests', 
            429, 
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            { retryAfter }
        ),
    
    weekendBooking: () => 
        new AppError(
            'Booking on weekends is not available',
            400,
            ErrorCodes.WEEKEND_BOOKING
        ),
    
    holidayBooking: (holidayName) => 
        new AppError(
            `Booking on holidays is not available: ${holidayName}`,
            400,
            ErrorCodes.HOLIDAY_BOOKING,
            { holiday: holidayName }
        ),
    
    internal: (message = 'Internal server error') => 
        new AppError(message, 500, ErrorCodes.INTERNAL_ERROR)
};

module.exports = {
    AppError,
    ErrorCodes,
    Errors,
    withErrorHandling,
    generateRequestId
};
