/**
 * Centralized Error Handler (TypeScript)
 * Provides consistent error handling across all Azure Functions
 */

// ============================================
// Types
// ============================================

export interface AppErrorDetails {
  [key: string]: unknown;
}

export interface ErrorJson {
  success: false;
  error: {
    code: string;
    message: string;
    details?: AppErrorDetails;
  };
}

export interface HttpResponse {
  status: number;
  headers?: Record<string, string>;
  jsonBody?: unknown;
  body?: unknown;
}

export interface HttpRequest {
  method?: string;
  url?: string;
  headers?: {
    get?(name: string): string | null;
  };
}

export interface FunctionContext {
  requestId?: string;
  log: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStack?: boolean;
}

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
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
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// AppError Class
// ============================================

/**
 * Custom application error class
 * Use this for operational errors that should be returned to the client
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: AppErrorDetails | null;
  public readonly isOperational: boolean = true;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details: AppErrorDetails | null = null
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON response format
   */
  toJSON(): ErrorJson {
    const error: ErrorJson['error'] = {
      code: this.errorCode,
      message: this.message
    };

    if (this.details) {
      error.details = this.details;
    }

    return {
      success: false,
      error
    };
  }

  /**
   * Convert to HTTP response
   */
  toResponse(): HttpResponse {
    return {
      status: this.statusCode,
      jsonBody: this.toJSON()
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// Error Handler Wrapper
// ============================================

/**
 * Wrapper function for Azure Function handlers
 * Provides centralized error handling and logging
 */
export function withErrorHandling(
  handler: (request: HttpRequest, context: FunctionContext) => Promise<HttpResponse>,
  options: ErrorHandlerOptions = {}
): (request: HttpRequest, context: FunctionContext) => Promise<HttpResponse> {
  const {
    logErrors = true,
    includeStack = process.env.NODE_ENV !== 'production'
  } = options;

  return async (request: HttpRequest, context: FunctionContext): Promise<HttpResponse> => {
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

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const err = error as { 
        isOperational?: boolean; 
        statusCode?: number; 
        errorCode?: string; 
        message?: string;
        stack?: string;
      };

      // Handle operational errors (expected errors)
      if (err instanceof AppError || err.isOperational) {
        if (logErrors) {
          (context.warn || context.log)(`[${requestId}] Operational error (${duration}ms):`, err.message);
        }

        if (err instanceof AppError) {
          return {
            status: err.statusCode,
            headers: { 'X-Request-Id': requestId },
            jsonBody: {
              ...err.toJSON(),
              meta: {
                requestId,
                timestamp: new Date().toISOString()
              }
            }
          };
        }

        return {
          status: err.statusCode || 400,
          headers: { 'X-Request-Id': requestId },
          jsonBody: {
            success: false,
            error: {
              code: err.errorCode || 'ERROR',
              message: err.message || 'An error occurred'
            },
            meta: {
              requestId,
              timestamp: new Date().toISOString()
            }
          }
        };
      }

      // Handle unexpected errors (programming errors, system failures)
      (context.error || context.log)(`[${requestId}] Unexpected error (${duration}ms):`, err.message);
      if (includeStack && err.stack) {
        (context.error || context.log)(`[${requestId}] Stack:`, err.stack);
      }

      return {
        status: 500,
        headers: { 'X-Request-Id': requestId },
        jsonBody: {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            ...(includeStack && { stack: err.stack })
          },
          meta: {
            requestId,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  };
}

// ============================================
// Factory Functions for Common Errors
// ============================================

export function createValidationError(message: string, details?: AppErrorDetails): AppError {
  return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
}

export function createUnauthorizedError(message = 'Authentication required'): AppError {
  return new AppError(message, 401, ErrorCodes.UNAUTHORIZED);
}

export function createForbiddenError(message = 'Access denied'): AppError {
  return new AppError(message, 403, ErrorCodes.FORBIDDEN);
}

export function createNotFoundError(resource = 'Resource'): AppError {
  return new AppError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND);
}

export function createConflictError(message: string, details?: AppErrorDetails): AppError {
  return new AppError(message, 409, ErrorCodes.CONFLICT, details);
}

export function createSlotTakenError(date: string, time: string): AppError {
  return new AppError('Time slot already booked', 409, ErrorCodes.SLOT_TAKEN, { date, time });
}

export function createSlotLockedError(date: string, time: string): AppError {
  return new AppError('Time slot is being booked by another user', 409, ErrorCodes.SLOT_LOCKED, { date, time });
}

// ============================================
// Errors Factory Object (for backward compatibility)
// ============================================

export const Errors = {
  validation: (message: string, details?: AppErrorDetails) => 
    new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details),
  
  unauthorized: (message = 'Authentication required') => 
    new AppError(message, 401, ErrorCodes.UNAUTHORIZED),
  
  forbidden: (message = 'Access denied') => 
    new AppError(message, 403, ErrorCodes.FORBIDDEN),
  
  notFound: (resource: string) => 
    new AppError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND),
  
  slotTaken: (date: string, time: string) => 
    new AppError('Time slot already booked', 409, ErrorCodes.SLOT_TAKEN, { date, time }),
  
  slotLocked: (date: string, time: string) => 
    new AppError('Time slot is being booked by another user', 409, ErrorCodes.SLOT_LOCKED, { date, time }),
  
  rateLimitExceeded: (retryAfter = 60) => 
    new AppError('Rate limit exceeded', 429, ErrorCodes.RATE_LIMIT_EXCEEDED, { retryAfter }),
  
  weekendBooking: () => 
    new AppError('Bookings are not available on weekends', 400, ErrorCodes.WEEKEND_BOOKING),
  
  holidayBooking: (holiday: string) => 
    new AppError(`Bookings are not available on ${holiday}`, 400, ErrorCodes.HOLIDAY_BOOKING, { holiday }),
  
  internal: (message = 'Internal server error') => 
    new AppError(message, 500, ErrorCodes.INTERNAL_ERROR)
};

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  AppError,
  ErrorCodes,
  Errors,
  withErrorHandling,
  generateRequestId,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createSlotTakenError,
  createSlotLockedError
};
