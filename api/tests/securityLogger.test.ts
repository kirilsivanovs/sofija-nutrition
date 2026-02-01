/**
 * Security Logger Tests
 */

const {
    SecurityEventType,
    Severity,
    logSecurityEvent,
    logAuthFailure,
    logAuthSuccess,
    logRateLimitExceeded,
    logAdminAccessDenied,
    logAdminAccessGranted,
    logSuspiciousRequest,
    logPotentialInjection,
    isSuspiciousInput,
    validateAndLogSuspiciousInput,
    extractClientInfo
} = require('../src/utils/securityLogger');

describe('Security Logger', () => {
    let mockContext;
    let mockRequest;
    
    beforeEach(() => {
        mockContext = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        
        mockRequest = {
            method: 'POST',
            url: 'https://example.com/api/test',
            headers: {
                get: jest.fn((name) => {
                    const headers = {
                        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
                        'user-agent': 'Mozilla/5.0 Test Browser',
                        'origin': 'https://example.com',
                        'referer': 'https://example.com/page'
                    };
                    return headers[name.toLowerCase()];
                })
            }
        };
    });
    
    describe('extractClientInfo', () => {
        it('should extract IP from x-forwarded-for header', () => {
            const info = extractClientInfo(mockRequest);
            expect(info.ip).toBe('192.168.1.1');
        });
        
        it('should extract user agent', () => {
            const info = extractClientInfo(mockRequest);
            expect(info.userAgent).toBe('Mozilla/5.0 Test Browser');
        });
        
        it('should handle missing headers gracefully', () => {
            const emptyRequest = {
                headers: { get: () => null }
            };
            const info = extractClientInfo(emptyRequest);
            expect(info.ip).toBe('unknown');
            expect(info.userAgent).toBe('unknown');
        });
        
        it('should extract origin and referer', () => {
            const info = extractClientInfo(mockRequest);
            expect(info.origin).toBe('https://example.com');
            expect(info.referer).toBe('https://example.com/page');
        });
    });
    
    describe('logSecurityEvent', () => {
        it('should log event with timestamp', () => {
            const event = logSecurityEvent(mockContext, SecurityEventType.AUTH_SUCCESS, {
                userId: 'user-123'
            });
            
            expect(event.timestamp).toBeDefined();
            expect(event.type).toBe('SECURITY_EVENT');
            expect(event.eventType).toBe(SecurityEventType.AUTH_SUCCESS);
        });
        
        it('should include client info when request provided', () => {
            const event = logSecurityEvent(mockContext, SecurityEventType.AUTH_FAILURE, {
                reason: 'Invalid token'
            }, mockRequest);
            
            expect(event.clientInfo).toBeDefined();
            expect(event.clientInfo.ip).toBe('192.168.1.1');
        });
        
        it('should use context.error for HIGH severity', () => {
            logSecurityEvent(mockContext, SecurityEventType.ADMIN_ACCESS_DENIED, {
                reason: 'No token'
            });
            
            expect(mockContext.error).toHaveBeenCalled();
        });
        
        it('should use context.warn for MEDIUM severity', () => {
            logSecurityEvent(mockContext, SecurityEventType.RATE_LIMIT_EXCEEDED, {
                endpoint: 'createBooking'
            });
            
            expect(mockContext.warn).toHaveBeenCalled();
        });
        
        it('should use context.log for LOW severity', () => {
            logSecurityEvent(mockContext, SecurityEventType.AUTH_SUCCESS, {
                userId: 'user-123'
            });
            
            expect(mockContext.log).toHaveBeenCalled();
        });
    });
    
    describe('logAuthFailure', () => {
        it('should log auth failure with reason', () => {
            const event = logAuthFailure(mockContext, mockRequest, 'Invalid credentials');
            
            expect(event.eventType).toBe(SecurityEventType.AUTH_FAILURE);
            expect(event.reason).toBe('Invalid credentials');
            expect(event.severity).toBe(Severity.MEDIUM);
        });
    });
    
    describe('logAuthSuccess', () => {
        it('should log successful auth', () => {
            const user = { id: 'user-123', name: 'Test User' };
            const event = logAuthSuccess(mockContext, mockRequest, user, 'swa-auth');
            
            expect(event.eventType).toBe(SecurityEventType.AUTH_SUCCESS);
            expect(event.userId).toBe('user-123');
            expect(event.authMethod).toBe('swa-auth');
        });
    });
    
    describe('logRateLimitExceeded', () => {
        it('should log rate limit exceeded', () => {
            const event = logRateLimitExceeded(mockContext, mockRequest, 'createBooking', 5);
            
            expect(event.eventType).toBe(SecurityEventType.RATE_LIMIT_EXCEEDED);
            expect(event.endpoint).toBe('createBooking');
            expect(event.limit).toBe(5);
        });
    });
    
    describe('logAdminAccessDenied', () => {
        it('should log admin access denied', () => {
            const event = logAdminAccessDenied(mockContext, mockRequest, 'Missing token');
            
            expect(event.eventType).toBe(SecurityEventType.ADMIN_ACCESS_DENIED);
            expect(event.reason).toBe('Missing token');
            expect(event.severity).toBe(Severity.HIGH);
        });
    });
    
    describe('logAdminAccessGranted', () => {
        it('should log admin access granted', () => {
            const user = { id: 'admin-1', name: 'Admin' };
            const event = logAdminAccessGranted(mockContext, mockRequest, user, 'e2e-token');
            
            expect(event.eventType).toBe(SecurityEventType.ADMIN_ACCESS_GRANTED);
            expect(event.userId).toBe('admin-1');
            expect(event.authMethod).toBe('e2e-token');
        });
    });
    
    describe('logSuspiciousRequest', () => {
        it('should log suspicious request', () => {
            const event = logSuspiciousRequest(mockContext, mockRequest, 'Unusual pattern', {
                pattern: 'SQL injection attempt'
            });
            
            expect(event.eventType).toBe(SecurityEventType.SUSPICIOUS_REQUEST);
            expect(event.reason).toBe('Unusual pattern');
            expect(event.severity).toBe(Severity.HIGH);
        });
    });
    
    describe('logPotentialInjection', () => {
        it('should log potential injection with truncated value', () => {
            const longValue = 'SELECT * FROM users WHERE 1=1; DROP TABLE users; --'.repeat(5);
            const event = logPotentialInjection(mockContext, mockRequest, 'email', longValue);
            
            expect(event.eventType).toBe(SecurityEventType.POTENTIAL_INJECTION);
            expect(event.field).toBe('email');
            expect(event.suspiciousValue.length).toBeLessThanOrEqual(100);
            expect(event.severity).toBe(Severity.CRITICAL);
        });
    });
    
    describe('isSuspiciousInput', () => {
        it('should detect SQL injection patterns', () => {
            expect(isSuspiciousInput('SELECT * FROM users')).toBe(true);
            expect(isSuspiciousInput("1'; DROP TABLE users;--")).toBe(true);
            expect(isSuspiciousInput('UNION SELECT password FROM users')).toBe(true);
        });
        
        it('should detect NoSQL injection patterns', () => {
            expect(isSuspiciousInput('{"$where": "1==1"}')).toBe(true);
            expect(isSuspiciousInput('{"$gt": ""}')).toBe(true);
        });
        
        it('should detect script injection', () => {
            expect(isSuspiciousInput('<script>alert("xss")</script>')).toBe(true);
            expect(isSuspiciousInput('javascript:alert(1)')).toBe(true);
            expect(isSuspiciousInput('<img onerror=alert(1) src=x>')).toBe(true);
        });
        
        it('should detect command injection', () => {
            expect(isSuspiciousInput('test; rm -rf /')).toBe(true);
            expect(isSuspiciousInput('test | cat /etc/passwd')).toBe(true);
            expect(isSuspiciousInput('$(whoami)')).toBe(true);
        });
        
        it('should not flag normal input', () => {
            expect(isSuspiciousInput('John Doe')).toBe(false);
            expect(isSuspiciousInput('user@example.com')).toBe(false);
            expect(isSuspiciousInput('+371 20000000')).toBe(false);
            expect(isSuspiciousInput('Vēlos konsultēties par veselīgu uzturu.')).toBe(false);
        });
        
        it('should handle non-string input', () => {
            expect(isSuspiciousInput(123)).toBe(false);
            expect(isSuspiciousInput(null)).toBe(false);
            expect(isSuspiciousInput(undefined)).toBe(false);
            expect(isSuspiciousInput({})).toBe(false);
        });
    });
    
    describe('validateAndLogSuspiciousInput', () => {
        it('should return true for safe input', () => {
            const result = validateAndLogSuspiciousInput(
                mockContext, mockRequest, 'name', 'John Doe'
            );
            expect(result).toBe(true);
            expect(mockContext.error).not.toHaveBeenCalled();
        });
        
        it('should return false and log for suspicious input', () => {
            const result = validateAndLogSuspiciousInput(
                mockContext, mockRequest, 'name', '<script>alert(1)</script>'
            );
            expect(result).toBe(false);
            expect(mockContext.error).toHaveBeenCalled();
        });
    });
    
    describe('SecurityEventType enum', () => {
        it('should have all expected event types', () => {
            expect(SecurityEventType.AUTH_FAILURE).toBe('AUTH_FAILURE');
            expect(SecurityEventType.AUTH_SUCCESS).toBe('AUTH_SUCCESS');
            expect(SecurityEventType.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
            expect(SecurityEventType.SUSPICIOUS_REQUEST).toBe('SUSPICIOUS_REQUEST');
            expect(SecurityEventType.ADMIN_ACCESS_DENIED).toBe('ADMIN_ACCESS_DENIED');
            expect(SecurityEventType.ADMIN_ACCESS_GRANTED).toBe('ADMIN_ACCESS_GRANTED');
            expect(SecurityEventType.INVALID_INPUT).toBe('INVALID_INPUT');
            expect(SecurityEventType.POTENTIAL_INJECTION).toBe('POTENTIAL_INJECTION');
        });
    });
    
    describe('Severity enum', () => {
        it('should have all severity levels', () => {
            expect(Severity.LOW).toBe('LOW');
            expect(Severity.MEDIUM).toBe('MEDIUM');
            expect(Severity.HIGH).toBe('HIGH');
            expect(Severity.CRITICAL).toBe('CRITICAL');
        });
    });
});
