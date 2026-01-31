/**
 * Rate Limiter для Azure Functions
 * Защита от DDoS и спама бронирований
 * 
 * Использует in-memory storage (достаточно для single-instance Azure Functions)
 * Для multi-instance deployment нужен Redis или Azure Cache
 */

const requestCounts = new Map();

// Конфигурация лимитов
const RATE_LIMITS = {
    // Критичные эндпоинты с низкими лимитами
    createBooking: {
        windowMs: 60000,      // 1 минута
        maxRequests: 5,       // 5 бронирований в минуту с одного IP
        message: 'Too many booking attempts. Please try again in a minute.'
    },
    confirmPayment: {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Too many confirmation attempts.'
    },
    
    // Публичные эндпоинты со средними лимитами
    getAvailability: {
        windowMs: 60000,
        maxRequests: 60,      // 60 запросов в минуту (обновление календаря)
        message: 'Too many requests. Please slow down.'
    },
    
    // Admin эндпоинты (защищены auth, но всё равно лимитируем)
    admin: {
        windowMs: 60000,
        maxRequests: 100,
        message: 'Rate limit exceeded for admin operations.'
    },
    
    // Дефолт для неизвестных эндпоинтов
    default: {
        windowMs: 60000,
        maxRequests: 100,
        message: 'Too many requests.'
    }
};

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
 */
function rateLimitExceededResponse(result) {
    return {
        status: 429,
        headers: {
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString()
        },
        jsonBody: {
            error: 'Too Many Requests',
            message: result.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
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
