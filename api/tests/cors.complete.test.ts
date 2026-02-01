/**
 * Complete CORS Tests - 100% Coverage
 */

import { getCorsHeaders, addCorsHeaders } from '../src/utils/cors';

describe('CORS Utility - Complete Coverage', () => {
    describe('getCorsHeaders', () => {
        it('should return CORS headers for allowed origin', () => {
            const request = {
                headers: {
                    get: jest.fn((name: string) => {
                        if (name === 'origin' || name === 'Origin') {
                            return 'http://localhost:4321';
                        }
                        return null;
                    })
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
            expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS');
            expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
            expect(headers['Access-Control-Max-Age']).toBe('86400');
        });

        it('should use default origin for disallowed origin', () => {
            const request = {
                headers: {
                    get: jest.fn((name: string) => {
                        if (name === 'origin' || name === 'Origin') {
                            return 'http://evil.com';
                        }
                        return null;
                    })
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
        });

        it('should use default origin when no origin header', () => {
            const request = {
                headers: {
                    get: jest.fn(() => null)
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
        });

        it('should allow localhost:3000', () => {
            const request = {
                headers: {
                    get: jest.fn((name: string) => {
                        if (name === 'origin' || name === 'Origin') {
                            return 'http://localhost:3000';
                        }
                        return null;
                    })
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
        });

        it('should allow production domain with www', () => {
            const request = {
                headers: {
                    get: jest.fn((name: string) => {
                        if (name === 'origin' || name === 'Origin') {
                            return 'https://www.sofija-nutrition.lv';
                        }
                        return null;
                    })
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Allow-Origin']).toBe('https://www.sofija-nutrition.lv');
        });

        it('should allow production domain without www', () => {
            const request = {
                headers: {
                    get: jest.fn((name: string) => {
                        if (name === 'origin' || name === 'Origin') {
                            return 'https://sofija-nutrition.lv';
                        }
                        return null;
                    })
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Allow-Origin']).toBe('https://sofija-nutrition.lv');
        });

        it('should check Origin header with capital O', () => {
            const request = {
                headers: {
                    get: jest.fn((name: string) => {
                        if (name === 'Origin') {
                            return 'http://localhost:4321';
                        }
                        return null;
                    })
                }
            };

            const headers = getCorsHeaders(request);

            expect(request.headers.get).toHaveBeenCalledWith('origin');
            expect(request.headers.get).toHaveBeenCalledWith('Origin');
            expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
        });
    });

    describe('addCorsHeaders', () => {
        it('should add CORS headers to empty response', () => {
            const request = {
                headers: {
                    get: jest.fn(() => 'http://localhost:4321')
                }
            };

            const response = {
                status: 200,
                jsonBody: { success: true }
            };

            const result = addCorsHeaders(response, request);

            expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
            expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
            expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
            expect(result.headers).toHaveProperty('Access-Control-Max-Age');
            expect(result.status).toBe(200);
            expect(result.jsonBody).toEqual({ success: true });
        });

        it('should preserve existing response headers', () => {
            const request = {
                headers: {
                    get: jest.fn(() => 'http://localhost:4321')
                }
            };

            const response = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Custom-Header': 'custom-value'
                },
                jsonBody: { success: true }
            };

            const result = addCorsHeaders(response, request);

            expect(result.headers?.['Content-Type']).toBe('application/json');
            expect(result.headers?.['X-Custom-Header']).toBe('custom-value');
            expect(result.headers?.['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
        });

        it('should handle response without headers property', () => {
            const request = {
                headers: {
                    get: jest.fn(() => null)
                }
            };

            const response = {
                status: 404,
                body: 'Not found'
            };

            const result = addCorsHeaders(response, request);

            expect(result.headers).toBeDefined();
            expect(result.headers?.['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
            expect(result.status).toBe(404);
            expect(result.body).toBe('Not found');
        });

        it('should preserve all response properties', () => {
            const request = {
                headers: {
                    get: jest.fn(() => 'https://sofija-nutrition.lv')
                }
            };

            const response = {
                status: 201,
                headers: {
                    'Content-Type': 'application/json'
                },
                jsonBody: { id: '123', created: true },
                body: undefined
            };

            const result = addCorsHeaders(response, request);

            expect(result.status).toBe(201);
            expect(result.jsonBody).toEqual({ id: '123', created: true });
            expect(result.body).toBeUndefined();
            expect(result.headers?.['Content-Type']).toBe('application/json');
            expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://sofija-nutrition.lv');
        });
    });

    describe('Allowed Origins', () => {
        const testOrigins = [
            { origin: 'http://localhost:4321', shouldAllow: true },
            { origin: 'http://localhost:3000', shouldAllow: true },
            { origin: 'https://www.sofija-nutrition.lv', shouldAllow: true },
            { origin: 'https://sofija-nutrition.lv', shouldAllow: true },
            { origin: 'http://evil.com', shouldAllow: false },
            { origin: 'https://malicious.com', shouldAllow: false },
            { origin: 'http://localhost:8080', shouldAllow: false }
        ];

        testOrigins.forEach(({ origin, shouldAllow }) => {
            it(`should ${shouldAllow ? 'allow' : 'reject'} ${origin}`, () => {
                const request = {
                    headers: {
                        get: jest.fn((name: string) => {
                            if (name === 'origin' || name === 'Origin') {
                                return origin;
                            }
                            return null;
                        })
                    }
                };

                const headers = getCorsHeaders(request);

                if (shouldAllow) {
                    expect(headers['Access-Control-Allow-Origin']).toBe(origin);
                } else {
                    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
                }
            });
        });
    });

    describe('HTTP Methods', () => {
        it('should allow all standard HTTP methods', () => {
            const request = {
                headers: {
                    get: jest.fn(() => null)
                }
            };

            const headers = getCorsHeaders(request);
            const allowedMethods = headers['Access-Control-Allow-Methods'];

            expect(allowedMethods).toContain('GET');
            expect(allowedMethods).toContain('POST');
            expect(allowedMethods).toContain('PUT');
            expect(allowedMethods).toContain('PATCH');
            expect(allowedMethods).toContain('DELETE');
            expect(allowedMethods).toContain('OPTIONS');
        });
    });

    describe('HTTP Headers', () => {
        it('should allow Content-Type and Authorization headers', () => {
            const request = {
                headers: {
                    get: jest.fn(() => null)
                }
            };

            const headers = getCorsHeaders(request);
            const allowedHeaders = headers['Access-Control-Allow-Headers'];

            expect(allowedHeaders).toContain('Content-Type');
            expect(allowedHeaders).toContain('Authorization');
        });
    });

    describe('Cache Control', () => {
        it('should set max age to 24 hours (86400 seconds)', () => {
            const request = {
                headers: {
                    get: jest.fn(() => null)
                }
            };

            const headers = getCorsHeaders(request);

            expect(headers['Access-Control-Max-Age']).toBe('86400');
        });
    });
});
