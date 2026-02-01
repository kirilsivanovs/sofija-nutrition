/**
 * Error Handler Tests
 */

const { 
    AppError, 
    ErrorCodes, 
    Errors, 
    withErrorHandling,
    generateRequestId 
} = require('../src/utils/errorHandler');

describe('AppError', () => {
    it('should create an error with all properties', () => {
        const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'test' });
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe('TEST_ERROR');
        expect(error.details).toEqual({ field: 'test' });
        expect(error.isOperational).toBe(true);
        expect(error.name).toBe('AppError');
    });

    it('should have a stack trace', () => {
        const error = new AppError('Test', 400, 'TEST');
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('AppError');
    });

    it('should convert to JSON correctly', () => {
        const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', { field: 'email' });
        const json = error.toJSON();
        
        expect(json).toEqual({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: { field: 'email' }
            }
        });
    });

    it('should omit details when null', () => {
        const error = new AppError('Not found', 404, 'NOT_FOUND');
        const json = error.toJSON();
        
        expect(json.error.details).toBeUndefined();
    });
});

describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
        expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
        expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
        expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
        expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
        expect(ErrorCodes.CONFLICT).toBe('CONFLICT');
        expect(ErrorCodes.SLOT_TAKEN).toBe('SLOT_TAKEN');
        expect(ErrorCodes.SLOT_LOCKED).toBe('SLOT_LOCKED');
        expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
});

describe('Errors factory', () => {
    it('should create validation error', () => {
        const error = Errors.validation('Email is required', { field: 'email' });
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should create unauthorized error', () => {
        const error = Errors.unauthorized();
        
        expect(error.statusCode).toBe(401);
        expect(error.errorCode).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Authentication required');
    });

    it('should create forbidden error', () => {
        const error = Errors.forbidden('Admin only');
        
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Admin only');
    });

    it('should create not found error', () => {
        const error = Errors.notFound('Booking');
        
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Booking not found');
    });

    it('should create slot taken error with date and time', () => {
        const error = Errors.slotTaken('2026-02-15', '10:00');
        
        expect(error.statusCode).toBe(409);
        expect(error.errorCode).toBe('SLOT_TAKEN');
        expect(error.details).toEqual({ date: '2026-02-15', time: '10:00' });
    });

    it('should create slot locked error', () => {
        const error = Errors.slotLocked('2026-02-15', '11:00');
        
        expect(error.statusCode).toBe(409);
        expect(error.errorCode).toBe('SLOT_LOCKED');
    });

    it('should create rate limit error with retry after', () => {
        const error = Errors.rateLimitExceeded(60);
        
        expect(error.statusCode).toBe(429);
        expect(error.details).toEqual({ retryAfter: 60 });
    });

    it('should create weekend booking error', () => {
        const error = Errors.weekendBooking();
        
        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe('WEEKEND_BOOKING');
    });

    it('should create holiday booking error', () => {
        const error = Errors.holidayBooking('Jāņi');
        
        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe('HOLIDAY_BOOKING');
        expect(error.details).toEqual({ holiday: 'Jāņi' });
    });
});

describe('withErrorHandling', () => {
    let mockContext;
    let mockRequest;

    beforeEach(() => {
        mockContext = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        mockRequest = {};
    });

    it('should pass through successful responses', async () => {
        const handler = jest.fn().mockResolvedValue({
            status: 200,
            jsonBody: { success: true }
        });

        const wrapped = withErrorHandling(handler);
        const result = await wrapped(mockRequest, mockContext);

        expect(result.status).toBe(200);
        expect(result.jsonBody.success).toBe(true);
    });

    it('should add requestId to context', async () => {
        const handler = jest.fn().mockImplementation((req, ctx) => {
            expect(ctx.requestId).toMatch(/^req-[a-z0-9]+-[a-z0-9]+$/);
            return { status: 200 };
        });

        const wrapped = withErrorHandling(handler);
        await wrapped(mockRequest, mockContext);

        expect(mockContext.requestId).toBeDefined();
    });

    it('should handle AppError and return proper response', async () => {
        const handler = jest.fn().mockRejectedValue(
            new AppError('Validation failed', 400, 'VALIDATION_ERROR', { field: 'email' })
        );

        const wrapped = withErrorHandling(handler);
        const result = await wrapped(mockRequest, mockContext);

        expect(result.status).toBe(400);
        expect(result.jsonBody.success).toBe(false);
        expect(result.jsonBody.error.code).toBe('VALIDATION_ERROR');
        expect(result.headers['X-Request-Id']).toBeDefined();
    });

    it('should handle unexpected errors with 500', async () => {
        const handler = jest.fn().mockRejectedValue(new Error('Unexpected DB error'));

        const wrapped = withErrorHandling(handler);
        const result = await wrapped(mockRequest, mockContext);

        expect(result.status).toBe(500);
        expect(result.jsonBody.error.code).toBe('INTERNAL_ERROR');
        expect(result.jsonBody.error.message).toBe('An unexpected error occurred');
    });

    it('should log operational errors as warnings', async () => {
        const handler = jest.fn().mockRejectedValue(
            new AppError('Not found', 404, 'NOT_FOUND')
        );

        const wrapped = withErrorHandling(handler);
        await wrapped(mockRequest, mockContext);

        expect(mockContext.warn).toHaveBeenCalled();
    });

    it('should log unexpected errors as errors', async () => {
        const handler = jest.fn().mockRejectedValue(new Error('Crash'));

        const wrapped = withErrorHandling(handler);
        await wrapped(mockRequest, mockContext);

        expect(mockContext.error).toHaveBeenCalled();
    });

    it('should not log when logErrors is false', async () => {
        const handler = jest.fn().mockResolvedValue({ status: 200 });

        const wrapped = withErrorHandling(handler, { logErrors: false });
        await wrapped(mockRequest, mockContext);

        expect(mockContext.log).not.toHaveBeenCalled();
    });

    it('should include stack in non-production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const handler = jest.fn().mockRejectedValue(new Error('Dev error'));

        const wrapped = withErrorHandling(handler, { includeStack: true });
        const result = await wrapped(mockRequest, mockContext);

        expect(result.jsonBody.error.stack).toBeDefined();

        process.env.NODE_ENV = originalEnv;
    });
});

describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
        const id1 = generateRequestId();
        const id2 = generateRequestId();

        expect(id1).not.toBe(id2);
    });

    it('should match expected format', () => {
        const id = generateRequestId();
        // Format: timestamp_base36-random_base36
        expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
});
