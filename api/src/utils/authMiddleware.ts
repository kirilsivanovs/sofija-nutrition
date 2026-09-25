/**
 * Authentication Middleware for Admin API (TypeScript)
 *
 * Поддерживает один метод авторизации:
 * 1. SWA Built-in Auth (Microsoft OAuth) - через x-ms-client-principal header
 *
 * ВАЖНО: Доступ к admin API разрешен только определенным email'ам,
 * указанным в переменной окружения ADMIN_EMAILS (разделенные запятыми).
 * Если ADMIN_EMAILS не задан — админов нет.
 */

import {
  logAuthFailure,
  logAuthSuccess,
  logAdminAccessDenied,
  logAdminAccessGranted,
} from './securityLogger';

// ============================================
// Admin Email Configuration
// ============================================

/**
 * Получает список разрешенных admin email'ов
 */
export function getAllowedAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS ?? '';
  return adminEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Проверяет, является ли email администратором
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const allowedEmails = getAllowedAdminEmails();
  return allowedEmails.includes(email.toLowerCase());
}

// ============================================
// Types
// ============================================

export interface AuthUser {
  id: string;
  name: string;
  provider: string;
  roles: string[];
}

export interface AuthResult {
  authorized: boolean;
  user?: AuthUser;
  method?: string;
  error?: string;
}

export interface HttpRequest {
  headers: {
    get(name: string): string | null | undefined;
  };
  url?: string;
}

export interface FunctionContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn?: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: (...args: any[]) => void;
}

export interface UnauthorizedResponse {
  status: 401;
  jsonBody: {
    success: false;
    error: {
      code: 'UNAUTHORIZED';
      message: string;
    };
    meta: {
      timestamp: string;
      hint: string;
    };
  };
}

interface ClientPrincipal {
  userId?: string;
  identityProvider?: string;
  userDetails?: string;
  userRoles?: string[];
}

// ============================================
// Authorization Functions
// ============================================

/**
 * Проверяет авторизацию запроса
 */
export function checkAuthorization(
  request: HttpRequest,
  context: FunctionContext | null = null
): AuthResult {
  // Метод 1: SWA Built-in Auth
  const clientPrincipal = request.headers.get('x-ms-client-principal');
  if (clientPrincipal) {
    try {
      const decoded = Buffer.from(clientPrincipal, 'base64').toString('utf-8');
      const principal: ClientPrincipal = JSON.parse(decoded);

      // Проверяем что пользователь authenticated и является администратором
      if (principal.userId && principal.identityProvider) {
        const userEmail = principal.userDetails;

        // Проверяем email на список разрешенных администраторов
        if (!isAdminEmail(userEmail)) {
          return {
            authorized: false,
            error: 'Access denied: not authorized for admin access',
          };
        }

        return {
          authorized: true,
          user: {
            id: principal.userId,
            name: principal.userDetails || 'Admin',
            provider: principal.identityProvider,
            roles: principal.userRoles || [],
          },
          method: 'swa-auth',
        };
      }
    } catch {
      // Invalid principal, continue to next method
    }
  }

  return {
    authorized: false,
    error: 'Unauthorized: Missing valid authentication',
  };
}

/**
 * Проверяет авторизацию с логированием
 */
export function checkAuthorizationWithLogging(
  request: HttpRequest,
  context: FunctionContext
): AuthResult {
  const result = checkAuthorization(request, context);

  if (result.authorized && result.user && result.method) {
    logAdminAccessGranted(context, request, result.user, result.method);
  } else if (result.error) {
    logAdminAccessDenied(context, request, result.error);
  }

  return result;
}

/**
 * Создаёт HTTP response для неавторизованного запроса
 */
export function unauthorizedResponse(message = 'Unauthorized'): UnauthorizedResponse {
  return {
    status: 401,
    jsonBody: {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        hint: 'Sign in through SWA auth',
      },
    },
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  checkAuthorization,
  checkAuthorizationWithLogging,
  unauthorizedResponse,
  isAdminEmail,
  getAllowedAdminEmails,
};
