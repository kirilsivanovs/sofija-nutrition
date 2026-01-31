/**
 * Authentication Middleware for Admin API (TypeScript)
 * 
 * Поддерживает два типа авторизации:
 * 1. SWA Built-in Auth (Microsoft OAuth) - через x-ms-client-principal header
 * 2. E2E Token Auth - через X-E2E-Token header (только для тестов)
 */

import {
  logAuthFailure,
  logAuthSuccess,
  logAdminAccessDenied,
  logAdminAccessGranted
} from './securityLogger';

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
    get(name: string): string | null;
  };
  url?: string;
}

export interface FunctionContext {
  log: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
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
export function checkAuthorization(request: HttpRequest, context: FunctionContext | null = null): AuthResult {
  // Метод 1: SWA Built-in Auth
  const clientPrincipal = request.headers.get('x-ms-client-principal');
  if (clientPrincipal) {
    try {
      const decoded = Buffer.from(clientPrincipal, 'base64').toString('utf-8');
      const principal: ClientPrincipal = JSON.parse(decoded);

      // Проверяем что пользователь authenticated
      if (principal.userId && principal.identityProvider) {
        return {
          authorized: true,
          user: {
            id: principal.userId,
            name: principal.userDetails || 'Admin',
            provider: principal.identityProvider,
            roles: principal.userRoles || []
          },
          method: 'swa-auth'
        };
      }
    } catch {
      // Invalid principal, continue to next method
    }
  }

  // Метод 2: E2E Token Auth
  const e2eToken = request.headers.get('x-e2e-token');
  const expectedToken = process.env.E2E_TEST_TOKEN;

  if (e2eToken && expectedToken && e2eToken === expectedToken) {
    return {
      authorized: true,
      user: {
        id: 'e2e-test-user',
        name: 'E2E Test Runner',
        provider: 'e2e-token',
        roles: ['authenticated', 'admin']
      },
      method: 'e2e-token'
    };
  }

  // Метод 3: Проверка что запрос идёт с доверенного origin (для локальной разработки)
  const origin = request.headers.get('origin') || '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
  const isDevMode = process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_WORKER_RUNTIME === 'node';

  if (isLocalhost && isDevMode) {
    return {
      authorized: true,
      user: {
        id: 'local-dev',
        name: 'Local Developer',
        provider: 'localhost',
        roles: ['authenticated', 'admin']
      },
      method: 'localhost'
    };
  }

  return {
    authorized: false,
    error: 'Unauthorized: Missing valid authentication'
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
        message
      },
      meta: {
        timestamp: new Date().toISOString(),
        hint: 'Use SWA auth or provide X-E2E-Token header'
      }
    }
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  checkAuthorization,
  checkAuthorizationWithLogging,
  unauthorizedResponse
};
