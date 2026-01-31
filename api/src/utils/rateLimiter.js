/**
 * Rate Limiter для Azure Functions
 * Защита от DDoS и спама бронирований
 * 
 * Использует in-memory storage (достаточно для single-instance Azure Functions)
 * Для multi-instance deployment нужен Redis или Azure Cache
 */

const { rateLimits: RATE_LIMITS } = require('../config');
const { logRateLimitExceeded } = require('./securityLogger');

const requestCounts = new Map();

/**
 * Получить IP адрес клиента
 */
function getClientIP(request) {
    // Azure Functions / Azure Front Door
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Берём первый IP (оригинальный клиент)
        return forwardedFor.split(',')[0].trim();
    }
    
    // Fallback
    return request.headers.get('x-client-ip') || 
           request.headers.get('x-real-ip') || 
           'unknown';
}

/**
 * Очистка устаревших записей (вызывается периодически)
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.windowStart > data.windowMs * 2) {
            requestCounts.delete(key);
        }
    }
}

/**
 * Проверить rate limit для запроса
 * @param {Request} request - HTTP запрос
 * @param {string} endpoint - Название эндпоинта (createBooking, getAvailability, etc.)
 * @returns {{ allowed: boolean, remaining: number, resetTime: number, message?: string }}
 */
function checkRateLimit(request, endpoint) {
    const ip = getClientIP(request);
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    
    // Периодическая очистка (каждый 100-й запрос)
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }
    
    let data = requestCounts.get(key);
    
    // Новое окно или первый запрос
    if (!data || now - data.windowStart > config.windowMs) {
        data = {
            count: 1,
            windowStart: now,
            windowMs: config.windowMs
        };
        requestCounts.set(key, data);
        
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs
        };
    }
    
    // Инкремент счётчика
    data.count++;
    requestCounts.set(key, data);
    
    const remaining = Math.max(0, config.maxRequests - data.count);
    const resetTime = data.windowStart + config.windowMs;
    
    if (data.count > config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime,
            message: config.message
        };
    }
    
    return {
        allowed: true,
        remaining,
        resetTime
    };
}

/**
 * Создать HTTP response для rate limit exceeded
 * @param {Object} result - Rate limit check result
 * @param {Object} [context] - Azure Functions context for logging
 * @param {Request} [request] - HTTP request for logging
 * @param {string} [endpoint] - Endpoint name for logging
 */
function rateLimitExceededResponse(result, context = null, request = null, endpoint = null) {
    // Log security event if context provided
    if (context && request && endpoint) {
        const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
        logRateLimitExceeded(context, request, endpoint, config.maxRequests);
    }
    
    return {
        status: 429,
        headers: {
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString()
        },
        jsonBody: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: result.message || 'Too many requests'
            },
            meta: {
                timestamp: new Date().toISOString(),
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            }
        }
    };
}

/**
 * Добавить rate limit headers к response
 */
function addRateLimitHeaders(response, result) {
    if (!response.headers) {
        response.headers = {};
    }
    response.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    response.headers['X-RateLimit-Reset'] = result.resetTime.toString();
    return response;
}

module.exports = {
    checkRateLimit,
    rateLimitExceededResponse,
    addRateLimitHeaders,
    getClientIP,
    RATE_LIMITS
};
