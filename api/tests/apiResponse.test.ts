/**
 * API Response Helper Tests
 */

import {
    successResponse,
    errorResponse,
    paginatedResponse,
    createdResponse,
    noContentResponse,
    CommonErrors,
    transformLegacyResponse,
    withStandardResponse
} from '../src/utils/apiResponse';

describe('API Response Helper', () => {
    describe('successResponse', () => {
        it('should create a success response with data', () => {
            const data = { id: 1, name: 'Test' };
            const response = successResponse(data);
            
            expect(response.status).toBe(200);
            expect(response.jsonBody.success).toBe(true);
            expect(response.jsonBody.data).toEqual(data);
            expect(response.jsonBody.meta.timestamp).toBeDefined();
        });
        
        it('should accept custom status code', () => {
            const response = successResponse({ id: 1 }, { status: 201 });
            expect(response.status).toBe(201);
        });
        
        it('should include request ID when provided', () => {
            const response = successResponse({ id: 1 }, { requestId: 'req-123' });
            
            expect(response.headers['X-Request-Id']).toBe('req-123');
            expect(response.jsonBody.meta.requestId).toBe('req-123');
        });
        
        it('should include custom headers', () => {
            const response = successResponse({ id: 1 }, { 
                headers: { 'X-Custom': 'value' } 
            });
            
            expect(response.headers['X-Custom']).toBe('value');
            expect(response.headers['Content-Type']).toBe('application/json');
        });
        
        it('should include custom meta', () => {
            const response = successResponse({ id: 1 }, { 
                meta: { version: '1.0' } 
            });
            
            expect(response.jsonBody.meta.version).toBe('1.0');
        });
    });
    
    describe('errorResponse', () => {
        it('should create an error response', () => {
            const response = errorResponse('VALIDATION_ERROR', 'Email is required');
            
            expect(response.status).toBe(400);
            expect(response.jsonBody.success).toBe(false);
            expect(response.jsonBody.error.code).toBe('VALIDATION_ERROR');
            expect(response.jsonBody.error.message).toBe('Email is required');
        });
        
        it('should include details when provided', () => {
            const response = errorResponse('VALIDATION_ERROR', 'Invalid input', {
                details: { field: 'email', error: 'required' }
            });
            
            expect(response.jsonBody.error.details).toEqual({ field: 'email', error: 'required' });
        });
        
        it('should accept custom status code', () => {
            const response = errorResponse('NOT_FOUND', 'Resource not found', { status: 404 });
            expect(response.status).toBe(404);
        });
        
        it('should include request ID', () => {
            const response = errorResponse('ERROR', 'Test', { requestId: 'req-456' });
            
            expect(response.headers['X-Request-Id']).toBe('req-456');
            expect(response.jsonBody.meta.requestId).toBe('req-456');
        });
    });
    
    describe('paginatedResponse', () => {
        it('should create paginated response', () => {
            const items = [{ id: 1 }, { id: 2 }];
            const response = paginatedResponse(items, { page: 1, pageSize: 10, total: 25 });
            
            expect(response.jsonBody.success).toBe(true);
            expect(response.jsonBody.data).toEqual(items);
            expect(response.jsonBody.meta.pagination).toEqual({
                page: 1,
                pageSize: 10,
                total: 25,
                totalPages: 3,
                hasNext: true,
                hasPrev: false
            });
        });
        
        it('should handle last page', () => {
            const items = [{ id: 1 }];
            const response = paginatedResponse(items, { page: 3, pageSize: 10, total: 25 });
            
            expect(response.jsonBody.meta.pagination.hasNext).toBe(false);
            expect(response.jsonBody.meta.pagination.hasPrev).toBe(true);
        });
        
        it('should default total to items length', () => {
            const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const response = paginatedResponse(items, { page: 1, pageSize: 20 });
            
            expect(response.jsonBody.meta.pagination.total).toBe(3);
        });
    });
    
    describe('createdResponse', () => {
        it('should create 201 response', () => {
            const data = { id: 'new-123' };
            const response = createdResponse(data);
            
            expect(response.status).toBe(201);
            expect(response.jsonBody.success).toBe(true);
            expect(response.jsonBody.data).toEqual(data);
        });
    });
    
    describe('noContentResponse', () => {
        it('should create 204 response with no body', () => {
            const response = noContentResponse();
            
            expect(response.status).toBe(204);
            expect(response.body).toBeNull();
        });
    });
    
    describe('CommonErrors', () => {
        it('should create badRequest error', () => {
            const response = CommonErrors.badRequest('Invalid data');
            
            expect(response.status).toBe(400);
            expect(response.jsonBody.error.code).toBe('BAD_REQUEST');
        });
        
        it('should create validation error', () => {
            const response = CommonErrors.validation('Validation failed', [{ field: 'email' }]);
            
            expect(response.status).toBe(400);
            expect(response.jsonBody.error.code).toBe('VALIDATION_ERROR');
            expect(response.jsonBody.error.details).toEqual([{ field: 'email' }]);
        });
        
        it('should create unauthorized error', () => {
            const response = CommonErrors.unauthorized();
            
            expect(response.status).toBe(401);
            expect(response.jsonBody.error.code).toBe('UNAUTHORIZED');
        });
        
        it('should create forbidden error', () => {
            const response = CommonErrors.forbidden();
            
            expect(response.status).toBe(403);
            expect(response.jsonBody.error.code).toBe('FORBIDDEN');
        });
        
        it('should create notFound error', () => {
            const response = CommonErrors.notFound('Booking');
            
            expect(response.status).toBe(404);
            expect(response.jsonBody.error.message).toBe('Booking not found');
        });
        
        it('should create conflict error', () => {
            const response = CommonErrors.conflict('Resource already exists');
            
            expect(response.status).toBe(409);
            expect(response.jsonBody.error.code).toBe('CONFLICT');
        });
        
        it('should create slotTaken error', () => {
            const response = CommonErrors.slotTaken('2026-01-15', '10:00');
            
            expect(response.status).toBe(409);
            expect(response.jsonBody.error.code).toBe('SLOT_TAKEN');
            expect(response.jsonBody.error.details).toEqual({ date: '2026-01-15', time: '10:00' });
        });
        
        it('should create slotLocked error', () => {
            const response = CommonErrors.slotLocked('2026-01-15', '10:00');
            
            expect(response.status).toBe(409);
            expect(response.jsonBody.error.code).toBe('SLOT_LOCKED');
        });
        
        it('should create rateLimitExceeded error', () => {
            const response = CommonErrors.rateLimitExceeded(60);
            
            expect(response.status).toBe(429);
            expect(response.jsonBody.error.code).toBe('RATE_LIMIT_EXCEEDED');
            expect(response.headers['Retry-After']).toBe('60');
        });
        
        it('should create internalError', () => {
            const response = CommonErrors.internalError();
            
            expect(response.status).toBe(500);
            expect(response.jsonBody.error.code).toBe('INTERNAL_ERROR');
        });
        
        it('should create serviceUnavailable error', () => {
            const response = CommonErrors.serviceUnavailable();
            
            expect(response.status).toBe(503);
            expect(response.jsonBody.error.code).toBe('SERVICE_UNAVAILABLE');
        });
    });
    
    describe('transformLegacyResponse', () => {
        it('should pass through already formatted responses', () => {
            const formatted = {
                status: 200,
                jsonBody: {
                    success: true,
                    data: { id: 1 },
                    meta: { timestamp: '2026-01-01' }
                }
            };
            
            const result = transformLegacyResponse(formatted);
            expect(result).toEqual(formatted);
        });
        
        it('should transform legacy error response', () => {
            const legacy = {
                status: 400,
                jsonBody: {
                    error: 'Invalid input',
                    errorCode: 'VALIDATION_ERROR'
                }
            };
            
            const result = transformLegacyResponse(legacy);
            
            expect(result.jsonBody.success).toBe(false);
            expect(result.jsonBody.error.code).toBe('VALIDATION_ERROR');
            expect(result.jsonBody.error.message).toBe('Invalid input');
        });
        
        it('should transform legacy success response', () => {
            const legacy = {
                status: 200,
                jsonBody: {
                    bookings: [{ id: 1 }]
                }
            };
            
            const result = transformLegacyResponse(legacy);
            
            expect(result.jsonBody.success).toBe(true);
            expect(result.jsonBody.data).toEqual({ bookings: [{ id: 1 }] });
        });
    });
    
    describe('withStandardResponse', () => {
        it('should wrap handler and add request ID', async () => {
            const handler = jest.fn().mockResolvedValue({ items: [1, 2, 3] });
            const wrapped = withStandardResponse(handler);
            
            const mockRequest = {};
            const mockContext = {};
            
            const result = await wrapped(mockRequest, mockContext);
            
            expect(result.status).toBe(200);
            expect(result.jsonBody.success).toBe(true);
            expect(result.jsonBody.data).toEqual({ items: [1, 2, 3] });
            expect(result.jsonBody.meta.requestId).toBeDefined();
        });
        
        it('should pass through already formatted responses', async () => {
            const handler = jest.fn().mockResolvedValue({
                status: 201,
                jsonBody: {
                    success: true,
                    data: { id: 'new-123' },
                    meta: {}
                }
            });
            const wrapped = withStandardResponse(handler);
            
            const result = await wrapped({}, {});
            
            expect(result.status).toBe(201);
            expect(result.jsonBody.meta.requestId).toBeDefined();
        });
        
        it('should set context.requestId', async () => {
            const handler = jest.fn().mockResolvedValue({ ok: true });
            const wrapped = withStandardResponse(handler);
            const mockContext = {};
            
            await wrapped({}, mockContext);
            
            expect(mockContext.requestId).toBeDefined();
            expect(typeof mockContext.requestId).toBe('string');
            expect(mockContext.requestId.length).toBeGreaterThan(5);
        });
        
        it('should rethrow errors for error handler', async () => {
            const handler = jest.fn().mockRejectedValue(new Error('Test error'));
            const wrapped = withStandardResponse(handler);
            
            await expect(wrapped({}, {})).rejects.toThrow('Test error');
        });
    });
});

