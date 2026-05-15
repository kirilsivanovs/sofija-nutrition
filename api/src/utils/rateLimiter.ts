/**
 * Rate Limiter для Azure Functions (TypeScript)
 * Защита от DDoS и спама бронирований
 *
 * Использует in-memory storage (достаточно для single-instance Azure Functions)
 * Для multi-instance deployment нужен Redis или Azure Cache
 */

import { rateLimits as RATE_LIMITS } from '../config';
import { logRateLimitExceeded } from './securityLogger';

// ============================================
// Types
// ============================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

export interface RateLimitData {
  count: number;
  windowStart: number;
  windowMs: number;
}

export interface HttpRequest {
  headers: {
    get(name: string): string | null | undefined;
  };
}

export interface FunctionContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn?: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: (...args: any[]) => void;
}

export interface RateLimitResponse {
  status: 429;
  headers: {
    'Retry-After': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
  };
  jsonBody: {
    success: false;
    error: {
      code: 'RATE_LIMIT_EXCEEDED';
      message: string;
    };
    meta: {
      timestamp: string;
      retryAfter: number;
    };
  };
}

// ============================================
// State
// ============================================

const requestCounts = new Map<string, RateLimitData>();

// ============================================
// Helper Functions
// ============================================

/**
 * Получить IP адрес клиента
 */
export function getClientIP(request: HttpRequest): string {
  // Azure Functions / Azure Front Door
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Берём первый IP (оригинальный клиент)
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback
  return request.headers.get('x-client-ip') || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Очистка устаревших записей (вызывается периодически)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > data.windowMs * 2) {
      requestCounts.delete(key);
    }
  }
}

// ============================================
// Public API
// ============================================

/**
 * Проверить rate limit для запроса
 */
export function checkRateLimit(request: HttpRequest, endpoint: string): RateLimitResult {
  const ip = getClientIP(request);
  const config = (RATE_LIMITS as Record<string, RateLimitConfig>)[endpoint] || RATE_LIMITS.default;
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
      windowMs: config.windowMs,
    };
    requestCounts.set(key, data);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
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
      message: config.message,
    };
  }

  return {
    allowed: true,
    remaining,
    resetTime,
  };
}

/**
 * Создать HTTP response для rate limit exceeded
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  context: FunctionContext | null = null,
  request: HttpRequest | null = null,
  endpoint: string | null = null
): RateLimitResponse {
  // Log security event if context provided
  if (context && request && endpoint) {
    const config =
      (RATE_LIMITS as Record<string, RateLimitConfig>)[endpoint] || RATE_LIMITS.default;
    logRateLimitExceeded(context, request, endpoint, config.maxRequests);
  }

  return {
    status: 429,
    headers: {
      'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': result.resetTime.toString(),
    },
    jsonBody: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: result.message || 'Too many requests',
      },
      meta: {
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
    },
  };
}

/**
 * Добавить rate limit headers к response
 */
export function addRateLimitHeaders<T extends { headers?: Record<string, string> }>(
  response: T,
  result: RateLimitResult
): T {
  return {
    ...response,
    headers: {
      ...(response.headers || {}),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
    },
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  checkRateLimit,
  rateLimitExceededResponse,
  addRateLimitHeaders,
  getClientIP,
  RATE_LIMITS,
};
