/**
 * API Response Helper (TypeScript)
 * Provides standardized response format for all API endpoints
 * 
 * Standard format:
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: { code: string, message: string, details?: any },
 *   meta: { timestamp: string, requestId?: string }
 * }
 */

import { generateRequestId } from './errorHandler';

// ============================================
// Types
// ============================================

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationInfo;
  [key: string]: unknown;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface SuccessResponseBody<T = unknown> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ErrorResponseBody {
  success: false;
  error: ErrorBody;
  meta: ApiResponseMeta;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers?: Record<string, string>;
  jsonBody?: T;
  body?: unknown;
}

export interface ResponseOptions {
  status?: number;
  requestId?: string | null;
  headers?: Record<string, string>;
  meta?: Record<string, unknown>;
  details?: unknown;
}

export interface FunctionContext {
  requestId?: string;
  log: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface HttpRequest {
  method?: string;
  url?: string;
  headers?: {
    get?(name: string): string | null;
  };
}

// ============================================
// Success Responses
// ============================================

/**
 * Create a successful response
 */
export function successResponse<T>(
  data: T,
  options: ResponseOptions = {}
): HttpResponse<SuccessResponseBody<T>> {
  const {
    status = 200,
    requestId = null,
    headers = {},
    meta = {}
  } = options;

  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-Id': requestId }),
      ...headers
    },
    jsonBody: {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
        ...meta
      }
    }
  };
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  options: ResponseOptions = {}
): HttpResponse<SuccessResponseBody<T>> {
  return successResponse(data, { ...options, status: 201 });
}

/**
 * Create a no content response (204)
 */
export function noContentResponse(): HttpResponse<null> {
  return {
    status: 204,
    body: null
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: { page?: number; pageSize?: number; total?: number },
  options: ResponseOptions = {}
): HttpResponse<SuccessResponseBody<T[]>> {
  const {
    page = 1,
    pageSize = 20,
    total = items.length
  } = pagination;

  const totalPages = Math.ceil(total / pageSize);

  return successResponse(items, {
    ...options,
    meta: {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      ...options.meta
    }
  });
}

// ============================================
// Error Responses
// ============================================

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  options: ResponseOptions = {}
): HttpResponse<ErrorResponseBody> {
  const {
    status = 400,
    details = null,
    requestId = null,
    headers = {}
  } = options;

  const errorBody: ErrorBody = {
    code,
    message
  };

  if (details) {
    errorBody.details = details;
  }

  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-Id': requestId }),
      ...headers
    },
    jsonBody: {
      success: false,
      error: errorBody,
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId })
      }
    }
  };
}

/**
 * Common error responses
 */
export const CommonErrors = {
  badRequest: (message = 'Bad request', details: unknown = null) =>
    errorResponse('BAD_REQUEST', message, { status: 400, details }),

  validation: (message = 'Validation failed', details: unknown = null) =>
    errorResponse('VALIDATION_ERROR', message, { status: 400, details }),

  unauthorized: (message = 'Authentication required') =>
    errorResponse('UNAUTHORIZED', message, { status: 401 }),

  forbidden: (message = 'Access denied') =>
    errorResponse('FORBIDDEN', message, { status: 403 }),

  notFound: (resource = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`, { status: 404 }),

  conflict: (message = 'Resource conflict') =>
    errorResponse('CONFLICT', message, { status: 409 }),

  slotTaken: (date: string, time: string) =>
    errorResponse('SLOT_TAKEN', 'Time slot already booked', {
      status: 409,
      details: { date, time }
    }),

  slotLocked: (date: string, time: string) =>
    errorResponse('SLOT_LOCKED', 'Time slot is being booked by another user', {
      status: 409,
      details: { date, time }
    }),

  rateLimitExceeded: (retryAfter: number) =>
    errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests', {
      status: 429,
      details: { retryAfter },
      headers: { 'Retry-After': String(retryAfter) }
    }),

  internalError: (message = 'Internal server error', requestId: string | null = null) =>
    errorResponse('INTERNAL_ERROR', message, {
      status: 500,
      requestId
    }),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    errorResponse('SERVICE_UNAVAILABLE', message, { status: 503 })
};

// ============================================
// Response Transformation
// ============================================

/**
 * Transform legacy response to new format
 * Useful for gradual migration
 */
export function transformLegacyResponse(
  legacyResponse: HttpResponse
): HttpResponse<SuccessResponseBody | ErrorResponseBody> {
  const { status, jsonBody, headers } = legacyResponse;

  // Already in new format
  if (jsonBody && typeof (jsonBody as Record<string, unknown>).success === 'boolean') {
    return legacyResponse as HttpResponse<SuccessResponseBody | ErrorResponseBody>;
  }

  const body = jsonBody as Record<string, unknown> | undefined;

  // Error response
  if (body && body.error) {
    return {
      status: status || 500,
      headers,
      jsonBody: {
        success: false,
        error: {
          code: (body.errorCode as string) || 'ERROR',
          message: typeof body.error === 'string'
            ? body.error
            : (body.error as { message?: string })?.message || 'Unknown error'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  // Success response
  return {
    status: status || 200,
    headers,
    jsonBody: {
      success: true,
      data: jsonBody,
      meta: {
        timestamp: new Date().toISOString()
      }
    }
  };
}

/**
 * Wrap handler to use standardized responses
 */
export function withStandardResponse<TRequest extends HttpRequest>(
  handler: (request: TRequest, context: FunctionContext) => Promise<HttpResponse | unknown>
): (request: TRequest, context: FunctionContext) => Promise<HttpResponse> {
  return async (request: TRequest, context: FunctionContext): Promise<HttpResponse> => {
    const requestId = generateRequestId();
    context.requestId = requestId;

    try {
      const result = await handler(request, context);

      // Already formatted response
      if (result && typeof result === 'object' && 'jsonBody' in result) {
        const response = result as HttpResponse;
        const body = response.jsonBody as Record<string, unknown> | undefined;
        if (body && typeof body.success === 'boolean') {
          // Add request ID if missing
          if (!body.meta || !(body.meta as Record<string, unknown>).requestId) {
            (body as Record<string, unknown>).meta = {
              ...(body.meta as Record<string, unknown> || {}),
              requestId
            };
          }
          return response;
        }

        // Transform legacy response
        return transformLegacyResponse(response);
      }

      // Raw data - wrap in success response
      if (result && typeof result === 'object' && !('status' in result)) {
        return successResponse(result, { requestId });
      }

      // Return as is if it's a proper response
      return result as HttpResponse;

    } catch (error) {
      // Let error handler deal with it
      throw error;
    }
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  CommonErrors,
  transformLegacyResponse,
  withStandardResponse
};
