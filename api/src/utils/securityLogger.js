/**
 * Security Logger
 * Logs security-related events for monitoring and alerting
 * 
 * Categories of security events:
 * - AUTH_FAILURE: Failed authentication attempts
 * - AUTH_SUCCESS: Successful logins (for audit trail)
 * - RATE_LIMIT: Rate limit exceeded
 * - SUSPICIOUS_REQUEST: Unusual request patterns
 * - ADMIN_ACCESS: Admin panel access attempts
 */

/**
 * Security event types
 */
const SecurityEventType = {
    AUTH_FAILURE: 'AUTH_FAILURE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
    ADMIN_ACCESS_DENIED: 'ADMIN_ACCESS_DENIED',
    ADMIN_ACCESS_GRANTED: 'ADMIN_ACCESS_GRANTED',
    INVALID_INPUT: 'INVALID_INPUT',
    POTENTIAL_INJECTION: 'POTENTIAL_INJECTION'
};

/**
 * Severity levels for security events
 */
const Severity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

/**
 * Extract client information from request
 * @param {Request} request - HTTP request
 * @returns {Object} Client info
 */
function extractClientInfo(request) {
    const forwardedFor = request.headers?.get?.('x-forwarded-for');
    const ip = forwardedFor 
        ? forwardedFor.split(',')[0].trim() 
        : request.headers?.get?.('x-client-ip') || 
          request.headers?.get?.('x-real-ip') || 
          'unknown';
    
    return {
        ip,
        userAgent: request.headers?.get?.('user-agent') || 'unknown',
        origin: request.headers?.get?.('origin') || 'unknown',
        referer: request.headers?.get?.('referer') || 'unknown',
        method: request.method || 'unknown',
        url: request.url || 'unknown'
    };
}

/**
 * Format security event for logging
 * @param {Object} event - Security event details
 * @returns {Object} Formatted log entry
 */
function formatSecurityEvent(event) {
    return {
        timestamp: new Date().toISOString(),
        type: 'SECURITY_EVENT',
        ...event
    };
}

/**
 * Log a security event
 * @param {Object} context - Azure Functions context
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 * @param {Request} [request] - Optional HTTP request
 */
function logSecurityEvent(context, eventType, details, request = null) {
    const event = formatSecurityEvent({
        eventType,
        severity: getSeverity(eventType),
        ...details,
        ...(request && { clientInfo: extractClientInfo(request) })
    });
    
    // Use appropriate log level based on severity
    switch (event.severity) {
        case Severity.CRITICAL:
        case Severity.HIGH:
            context.error('[SECURITY]', JSON.stringify(event));
            break;
        case Severity.MEDIUM:
            context.warn('[SECURITY]', JSON.stringify(event));
            break;
        default:
            context.log('[SECURITY]', JSON.stringify(event));
    }
    
    return event;
}

/**
 * Get severity level for event type
 */
function getSeverity(eventType) {
    const severityMap = {
        [SecurityEventType.AUTH_FAILURE]: Severity.MEDIUM,
        [SecurityEventType.AUTH_SUCCESS]: Severity.LOW,
        [SecurityEventType.RATE_LIMIT_EXCEEDED]: Severity.MEDIUM,
        [SecurityEventType.SUSPICIOUS_REQUEST]: Severity.HIGH,
        [SecurityEventType.ADMIN_ACCESS_DENIED]: Severity.HIGH,
        [SecurityEventType.ADMIN_ACCESS_GRANTED]: Severity.LOW,
        [SecurityEventType.INVALID_INPUT]: Severity.LOW,
        [SecurityEventType.POTENTIAL_INJECTION]: Severity.CRITICAL
    };
    return severityMap[eventType] || Severity.MEDIUM;
}

/**
 * Log failed authentication attempt
 */
function logAuthFailure(context, request, reason) {
    return logSecurityEvent(context, SecurityEventType.AUTH_FAILURE, {
        reason,
        endpoint: request.url
    }, request);
}

/**
 * Log successful authentication
 */
function logAuthSuccess(context, request, user, method) {
    return logSecurityEvent(context, SecurityEventType.AUTH_SUCCESS, {
        userId: user.id,
        userName: user.name,
        authMethod: method,
        endpoint: request.url
    }, request);
}

/**
 * Log rate limit exceeded
 */
function logRateLimitExceeded(context, request, endpoint, limit) {
    return logSecurityEvent(context, SecurityEventType.RATE_LIMIT_EXCEEDED, {
        endpoint,
        limit,
        message: `Rate limit exceeded for ${endpoint}`
    }, request);
}

/**
 * Log admin access denied
 */
function logAdminAccessDenied(context, request, reason) {
    return logSecurityEvent(context, SecurityEventType.ADMIN_ACCESS_DENIED, {
        reason,
        endpoint: request.url
    }, request);
}

/**
 * Log admin access granted
 */
function logAdminAccessGranted(context, request, user, method) {
    return logSecurityEvent(context, SecurityEventType.ADMIN_ACCESS_GRANTED, {
        userId: user.id,
        userName: user.name,
        authMethod: method,
        endpoint: request.url
    }, request);
}

/**
 * Log suspicious request (potential attack)
 */
function logSuspiciousRequest(context, request, reason, details = {}) {
    return logSecurityEvent(context, SecurityEventType.SUSPICIOUS_REQUEST, {
        reason,
        ...details
    }, request);
}

/**
 * Log potential injection attempt
 */
function logPotentialInjection(context, request, field, value) {
    // Truncate suspicious value for logging
    const truncatedValue = String(value).substring(0, 100);
    
    return logSecurityEvent(context, SecurityEventType.POTENTIAL_INJECTION, {
        field,
        suspiciousValue: truncatedValue,
        message: `Potential injection attempt detected in field: ${field}`
    }, request);
}

/**
 * Check for common injection patterns
 * @param {string} value - Value to check
 * @returns {boolean} True if suspicious
 */
function isSuspiciousInput(value) {
    if (typeof value !== 'string') return false;
    
    const suspiciousPatterns = [
        // SQL injection
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|SET|TABLE)\b)/i,
        // NoSQL injection
        /\$(?:where|gt|lt|ne|eq|regex)/i,
        // Script injection
        /<script\b[^>]*>[\s\S]*?<\/script>/i,
        // Event handlers
        /\bon\w+\s*=/i,
        // JavaScript protocol
        /javascript:/i,
        // Command injection
        /[;&|`$]|\$\(/,
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate and log if input is suspicious
 * @returns {boolean} True if input is safe
 */
function validateAndLogSuspiciousInput(context, request, field, value) {
    if (isSuspiciousInput(value)) {
        logPotentialInjection(context, request, field, value);
        return false;
    }
    return true;
}

/**
 * Create a security-aware request logger middleware
 * @param {Object} options - Logger options
 * @returns {Function} Middleware function
 */
function createSecurityMiddleware(options = {}) {
    const { 
        logAllRequests = false,
        detectInjection = true 
    } = options;
    
    return (request, context, next) => {
        // Log all requests if enabled (for debugging)
        if (logAllRequests) {
            context.log('[REQUEST]', {
                method: request.method,
                url: request.url,
                clientInfo: extractClientInfo(request)
            });
        }
        
        return next();
    };
}

module.exports = {
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
    extractClientInfo,
    createSecurityMiddleware
};
