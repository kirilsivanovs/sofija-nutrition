/**
 * Authentication Middleware for Admin API
 * 
 * Поддерживает два типа авторизации:
 * 1. SWA Built-in Auth (Microsoft OAuth) - через x-ms-client-principal header
 * 2. E2E Token Auth - через X-E2E-Token header (только для тестов)
 */

/**
 * Проверяет авторизацию запроса
 * @param {object} request - HTTP request
 * @returns {{ authorized: boolean, user?: object, method?: string, error?: string }}
 */
function checkAuthorization(request) {
    // Метод 1: SWA Built-in Auth
    const clientPrincipal = request.headers.get('x-ms-client-principal');
    if (clientPrincipal) {
        try {
            const decoded = Buffer.from(clientPrincipal, 'base64').toString('utf-8');
            const principal = JSON.parse(decoded);
            
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
        } catch (e) {
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
 * Создаёт HTTP response для неавторизованного запроса
 */
function unauthorizedResponse(message = 'Unauthorized') {
    return {
        status: 401,
        jsonBody: { 
            error: message,
            hint: 'Use SWA auth or provide X-E2E-Token header'
        }
    };
}

module.exports = {
    checkAuthorization,
    unauthorizedResponse
};
