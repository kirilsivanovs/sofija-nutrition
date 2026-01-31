/**
 * API Response Helper
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

const { generateRequestId } = require('./errorHandler');

/**
 * Create a successful response
 * @param {any} data - Response data
 * @param {Object} options - Additional options
 * @returns {Object} HTTP response object
 */
function successResponse(data, options = {}) {
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
 * Create an error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {Object} HTTP response object
 */
function errorResponse(code, message, options = {}) {
    const { 
        status = 400, 
        details = null,
        requestId = null,
        headers = {}
    } = options;
    
    const errorBody = {
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
 * Create a paginated response
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info
 * @returns {Object} HTTP response object
 */
function paginatedResponse(items, pagination, options = {}) {
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

/**
 * Create a created response (201)
 * @param {any} data - Created resource
 * @param {Object} options - Additional options
 * @returns {Object} HTTP response object
 */
function createdResponse(data, options = {}) {
    return successResponse(data, { ...options, status: 201 });
}

/**
 * Create a no content response (204)
 * @returns {Object} HTTP response object
 */
function noContentResponse() {
    return {
        status: 204,
        body: null
    };
}

/**
 * Common error responses
 */
const CommonErrors = {
    badRequest: (message = 'Bad request', details = null) =>
        errorResponse('BAD_REQUEST', message, { status: 400, details }),
    
    validation: (message = 'Validation failed', details = null) =>
        errorResponse('VALIDATION_ERROR', message, { status: 400, details }),
    
    unauthorized: (message = 'Authentication required') =>
        errorResponse('UNAUTHORIZED', message, { status: 401 }),
    
    forbidden: (message = 'Access denied') =>
        errorResponse('FORBIDDEN', message, { status: 403 }),
    
    notFound: (resource = 'Resource') =>
        errorResponse('NOT_FOUND', `${resource} not found`, { status: 404 }),
    
    conflict: (message = 'Resource conflict') =>
        errorResponse('CONFLICT', message, { status: 409 }),
    
    slotTaken: (date, time) =>
        errorResponse('SLOT_TAKEN', 'Time slot already booked', { 
            status: 409, 
            details: { date, time } 
        }),
    
    slotLocked: (date, time) =>
        errorResponse('SLOT_LOCKED', 'Time slot is being booked by another user', { 
            status: 409, 
            details: { date, time } 
        }),
    
    rateLimitExceeded: (retryAfter) =>
        errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests', { 
            status: 429, 
            details: { retryAfter },
            headers: { 'Retry-After': String(retryAfter) }
        }),
    
    internalError: (message = 'Internal server error', requestId = null) =>
        errorResponse('INTERNAL_ERROR', message, { 
            status: 500, 
            requestId 
        }),
    
    serviceUnavailable: (message = 'Service temporarily unavailable') =>
        errorResponse('SERVICE_UNAVAILABLE', message, { status: 503 })
};

/**
 * Transform legacy response to new format
 * Useful for gradual migration
 * @param {Object} legacyResponse - Old response format
 * @returns {Object} New format response
 */
function transformLegacyResponse(legacyResponse) {
    const { status, jsonBody, headers } = legacyResponse;
    
    // Already in new format
    if (jsonBody && typeof jsonBody.success === 'boolean') {
        return legacyResponse;
    }
    
    // Error response
    if (jsonBody && jsonBody.error) {
        return {
            status,
            headers,
            jsonBody: {
                success: false,
                error: {
                    code: jsonBody.errorCode || 'ERROR',
                    message: typeof jsonBody.error === 'string' 
                        ? jsonBody.error 
                        : jsonBody.error.message || 'Unknown error'
                },
                meta: {
                    timestamp: new Date().toISOString()
                }
            }
        };
    }
    
    // Success response
    return {
        status,
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
 * @param {Function} handler - Original handler
 * @returns {Function} Wrapped handler
 */
function withStandardResponse(handler) {
    return async (request, context) => {
        const requestId = generateRequestId();
        context.requestId = requestId;
        
        try {
            const result = await handler(request, context);
            
            // Already formatted response
            if (result && result.jsonBody && typeof result.jsonBody.success === 'boolean') {
                // Add request ID if missing
                if (!result.jsonBody.meta?.requestId) {
                    result.jsonBody.meta = {
                        ...result.jsonBody.meta,
                        requestId
                    };
                }
                return result;
            }
            
            // Raw data - wrap in success response
            if (result && !result.status) {
                return successResponse(result, { requestId });
            }
            
            // Transform legacy response
            return transformLegacyResponse(result);
            
        } catch (error) {
            // Let error handler deal with it
            throw error;
        }
    };
}

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
