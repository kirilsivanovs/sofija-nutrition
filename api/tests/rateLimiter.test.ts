/**
 * Rate Limiter Tests
 */

const { checkRateLimit, rateLimitExceededResponse, getClientIP, RATE_LIMITS } = require('../src/utils/rateLimiter');

describe('Rate Limiter', () => {
    // Сбрасываем состояние между тестами
    beforeEach(() => {
        // Rate limiter использует in-memory Map, нужен уникальный IP для изоляции тестов
    });

    function createMockRequest(ip = '192.168.1.1') {
        return {
            headers: {
                get: (name) => {
                    if (name === 'x-forwarded-for') return ip;
                    return null;
                }
            }
        };
    }

    describe('checkRateLimit', () => {
        test('should allow first request', () => {
            const ip = `test-${Date.now()}-${Math.random()}`;
            const request = createMockRequest(ip);
            
            const result = checkRateLimit(request, 'createBooking');
            
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(RATE_LIMITS.createBooking.maxRequests - 1);
        });

        test('should track request count', () => {
            const ip = `test-${Date.now()}-${Math.random()}`;
            const request = createMockRequest(ip);
            
            // Первый запрос
            const result1 = checkRateLimit(request, 'getAvailability');
            expect(result1.remaining).toBe(RATE_LIMITS.getAvailability.maxRequests - 1);
            
            // Второй запрос
            const result2 = checkRateLimit(request, 'getAvailability');
            expect(result2.remaining).toBe(RATE_LIMITS.getAvailability.maxRequests - 2);
        });

        test('should block after limit exceeded', () => {
            const ip = `test-${Date.now()}-${Math.random()}`;
            const request = createMockRequest(ip);
            const limit = RATE_LIMITS.createBooking.maxRequests;
            
            // Исчерпываем лимит
            for (let i = 0; i < limit; i++) {
                const result = checkRateLimit(request, 'createBooking');
                expect(result.allowed).toBe(true);
            }
            
            // Следующий запрос должен быть заблокирован
            const blockedResult = checkRateLimit(request, 'createBooking');
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.message).toBeDefined();
        });

        test('should use different limits for different endpoints', () => {
            const ip = `test-${Date.now()}-${Math.random()}`;
            const request = createMockRequest(ip);
            
            const bookingResult = checkRateLimit(request, 'createBooking');
            const availabilityResult = checkRateLimit(request, 'getAvailability');
            
            // createBooking имеет лимит 5, getAvailability - 60
            expect(bookingResult.remaining).toBe(4); // 5 - 1
            expect(availabilityResult.remaining).toBe(59); // 60 - 1
        });

        test('should track different IPs separately', () => {
            const ip1 = `test-ip1-${Date.now()}`;
            const ip2 = `test-ip2-${Date.now()}`;
            const request1 = createMockRequest(ip1);
            const request2 = createMockRequest(ip2);
            
            // IP1 делает несколько запросов
            checkRateLimit(request1, 'createBooking');
            checkRateLimit(request1, 'createBooking');
            checkRateLimit(request1, 'createBooking');
            
            // IP2 начинает с полного лимита
            const result = checkRateLimit(request2, 'createBooking');
            expect(result.remaining).toBe(RATE_LIMITS.createBooking.maxRequests - 1);
        });

        test('should use default limit for unknown endpoints', () => {
            const ip = `test-${Date.now()}-${Math.random()}`;
            const request = createMockRequest(ip);
            
            const result = checkRateLimit(request, 'unknownEndpoint');
            
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(RATE_LIMITS.default.maxRequests - 1);
        });
    });

    describe('getClientIP', () => {
        test('should extract IP from x-forwarded-for', () => {
            const request = {
                headers: {
                    get: (name) => name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null
                }
            };
            
            expect(getClientIP(request)).toBe('1.2.3.4');
        });

        test('should fallback to x-client-ip', () => {
            const request = {
                headers: {
                    get: (name) => name === 'x-client-ip' ? '10.0.0.1' : null
                }
            };
            
            expect(getClientIP(request)).toBe('10.0.0.1');
        });

        test('should return unknown if no IP headers', () => {
            const request = {
                headers: {
                    get: () => null
                }
            };
            
            expect(getClientIP(request)).toBe('unknown');
        });
    });

    describe('rateLimitExceededResponse', () => {
        test('should return 429 status', () => {
            const result = {
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 60000,
                message: 'Too many requests'
            };
            
            const response = rateLimitExceededResponse(result);
            
            expect(response.status).toBe(429);
            expect(response.jsonBody.success).toBe(false);
            expect(response.jsonBody.error.code).toBe('RATE_LIMIT_EXCEEDED');
            expect(response.jsonBody.error.message).toBe('Too many requests');
            expect(response.headers['Retry-After']).toBeDefined();
        });
    });
});
