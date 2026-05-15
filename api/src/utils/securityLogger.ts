/**
 * Security Logger (TypeScript)
 * Logs security-related events for monitoring and alerting
 *
 * Categories of security events:
 * - AUTH_FAILURE: Failed authentication attempts
 * - AUTH_SUCCESS: Successful logins (for audit trail)
 * - RATE_LIMIT: Rate limit exceeded
 * - SUSPICIOUS_REQUEST: Unusual request patterns
 * - ADMIN_ACCESS: Admin panel access attempts
 */

// ============================================
// Types
// ============================================

export interface ClientInfo {
  ip: string;
  userAgent: string;
  origin: string;
  referer: string;
  method: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
}

export interface SecurityEventDetails {
  reason?: string;
  endpoint?: string;
  userId?: string;
  userName?: string;
  authMethod?: string;
  limit?: number;
  message?: string;
  field?: string;
  suspiciousValue?: string;
  [key: string]: unknown;
}

export interface SecurityEvent {
  timestamp: string;
  type: 'SECURITY_EVENT';
  eventType: SecurityEventType;
  severity: Severity;
  clientInfo?: ClientInfo;
  [key: string]: unknown;
}

export interface HttpRequest {
  headers?: {
    get?(name: string): string | null | undefined;
  };
  method?: string;
  url?: string;
}

export interface FunctionContext {
  log: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export type NextFunction = () => unknown;

// ============================================
// Enums
// ============================================

/**
 * Security event types
 */
export enum SecurityEventType {
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  ADMIN_ACCESS_DENIED = 'ADMIN_ACCESS_DENIED',
  ADMIN_ACCESS_GRANTED = 'ADMIN_ACCESS_GRANTED',
  INVALID_INPUT = 'INVALID_INPUT',
  POTENTIAL_INJECTION = 'POTENTIAL_INJECTION',
}

/**
 * Severity levels for security events
 */
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract client information from request
 */
export function extractClientInfo(request: HttpRequest): ClientInfo {
  const forwardedFor = request.headers?.get?.('x-forwarded-for');
  const ip = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : request.headers?.get?.('x-client-ip') || request.headers?.get?.('x-real-ip') || 'unknown';

  return {
    ip,
    userAgent: request.headers?.get?.('user-agent') || 'unknown',
    origin: request.headers?.get?.('origin') || 'unknown',
    referer: request.headers?.get?.('referer') || 'unknown',
    method: request.method || 'unknown',
    url: request.url || 'unknown',
  };
}

/**
 * Format security event for logging
 */
function formatSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'type'>): SecurityEvent {
  return Object.assign({}, event, {
    timestamp: new Date().toISOString(),
    type: 'SECURITY_EVENT' as const,
  }) as SecurityEvent;
}

/**
 * Get severity level for event type
 */
function getSeverity(eventType: SecurityEventType): Severity {
  const severityMap: Record<SecurityEventType, Severity> = {
    [SecurityEventType.AUTH_FAILURE]: Severity.MEDIUM,
    [SecurityEventType.AUTH_SUCCESS]: Severity.LOW,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: Severity.MEDIUM,
    [SecurityEventType.SUSPICIOUS_REQUEST]: Severity.HIGH,
    [SecurityEventType.ADMIN_ACCESS_DENIED]: Severity.HIGH,
    [SecurityEventType.ADMIN_ACCESS_GRANTED]: Severity.LOW,
    [SecurityEventType.INVALID_INPUT]: Severity.LOW,
    [SecurityEventType.POTENTIAL_INJECTION]: Severity.CRITICAL,
  };
  return severityMap[eventType] || Severity.MEDIUM;
}

// ============================================
// Logging Functions
// ============================================

/**
 * Log a security event
 */
export function logSecurityEvent(
  context: FunctionContext,
  eventType: SecurityEventType,
  details: SecurityEventDetails,
  request: HttpRequest | null = null
): SecurityEvent {
  const event = formatSecurityEvent({
    eventType,
    severity: getSeverity(eventType),
    ...details,
    ...(request && { clientInfo: extractClientInfo(request) }),
  });

  // Use appropriate log level based on severity
  switch (event.severity) {
    case Severity.CRITICAL:
    case Severity.HIGH:
      (context.error || context.log)('[SECURITY]', JSON.stringify(event));
      break;
    case Severity.MEDIUM:
      (context.warn || context.log)('[SECURITY]', JSON.stringify(event));
      break;
    default:
      context.log('[SECURITY]', JSON.stringify(event));
  }

  return event;
}

/**
 * Log failed authentication attempt
 */
export function logAuthFailure(
  context: FunctionContext,
  request: HttpRequest,
  reason: string
): SecurityEvent {
  return logSecurityEvent(
    context,
    SecurityEventType.AUTH_FAILURE,
    {
      reason,
      endpoint: request.url,
    },
    request
  );
}

/**
 * Log successful authentication
 */
export function logAuthSuccess(
  context: FunctionContext,
  request: HttpRequest,
  user: User,
  method: string
): SecurityEvent {
  return logSecurityEvent(
    context,
    SecurityEventType.AUTH_SUCCESS,
    {
      userId: user.id,
      userName: user.name,
      authMethod: method,
      endpoint: request.url,
    },
    request
  );
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  context: FunctionContext,
  request: HttpRequest,
  endpoint: string,
  limit: number
): SecurityEvent {
  return logSecurityEvent(
    context,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    {
      endpoint,
      limit,
      message: `Rate limit exceeded for ${endpoint}`,
    },
    request
  );
}

/**
 * Log admin access denied
 */
export function logAdminAccessDenied(
  context: FunctionContext,
  request: HttpRequest,
  reason: string
): SecurityEvent {
  return logSecurityEvent(
    context,
    SecurityEventType.ADMIN_ACCESS_DENIED,
    {
      reason,
      endpoint: request.url,
    },
    request
  );
}

/**
 * Log admin access granted
 */
export function logAdminAccessGranted(
  context: FunctionContext,
  request: HttpRequest,
  user: User,
  method: string
): SecurityEvent {
  return logSecurityEvent(
    context,
    SecurityEventType.ADMIN_ACCESS_GRANTED,
    {
      userId: user.id,
      userName: user.name,
      authMethod: method,
      endpoint: request.url,
    },
    request
  );
}

/**
 * Log suspicious request (potential attack)
 */
export function logSuspiciousRequest(
  context: FunctionContext,
  request: HttpRequest,
  reason: string,
  details: Record<string, unknown> = {}
): SecurityEvent {
  return logSecurityEvent(
    context,
    SecurityEventType.SUSPICIOUS_REQUEST,
    {
      reason,
      ...details,
    },
    request
  );
}

/**
 * Log potential injection attempt
 */
export function logPotentialInjection(
  context: FunctionContext,
  request: HttpRequest,
  field: string,
  value: unknown
): SecurityEvent {
  // Truncate suspicious value for logging
  const truncatedValue = String(value).substring(0, 100);

  return logSecurityEvent(
    context,
    SecurityEventType.POTENTIAL_INJECTION,
    {
      field,
      suspiciousValue: truncatedValue,
      message: `Potential injection attempt detected in field: ${field}`,
    },
    request
  );
}

// ============================================
// Input Validation
// ============================================

/**
 * Check for common injection patterns
 */
export function isSuspiciousInput(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const lowered = value.toLowerCase();
  if (lowered.includes('<script')) return true;
  if (lowered.includes('javascript:')) return true;

  const suspiciousPatterns = [
    // SQL injection
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|SET|TABLE)\b)/i,
    // NoSQL injection
    /\$(?:where|gt|lt|ne|eq|regex)/i,
    // Event handlers
    /\bon\w+\s*=/i,
    // Command injection
    /[;&|`$]|\$\(/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
}

/**
 * Validate and log if input is suspicious
 */
export function validateAndLogSuspiciousInput(
  context: FunctionContext,
  request: HttpRequest,
  field: string,
  value: unknown
): boolean {
  if (isSuspiciousInput(value)) {
    logPotentialInjection(context, request, field, value);
    return false;
  }
  return true;
}

/**
 * Create a security-aware request logger middleware
 */
export function createSecurityMiddleware(
  options: {
    logAllRequests?: boolean;
    detectInjection?: boolean;
  } = {}
): (request: HttpRequest, context: FunctionContext, next: NextFunction) => unknown {
  const { logAllRequests = false, detectInjection = true } = options;

  return (request: HttpRequest, context: FunctionContext, next: NextFunction) => {
    // Log all requests if enabled (for debugging)
    if (logAllRequests) {
      context.log('[REQUEST]', {
        method: request.method,
        url: request.url,
        clientInfo: extractClientInfo(request),
      });
    }

    return next();
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

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
  createSecurityMiddleware,
};
