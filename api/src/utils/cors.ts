/**
 * CORS Headers Utility (TypeScript)
 * Adds CORS headers to responses for local development and production
 */

// ============================================
// Types
// ============================================

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age': string;
}

export interface HttpRequest {
  headers: {
    get(name: string): string | null | undefined;
  };
}

export interface HttpResponse {
  status?: number;
  headers?: Record<string, string>;
  jsonBody?: unknown;
  body?: unknown;
}

// ============================================
// Constants
// ============================================

const allowedOrigins: string[] = [
  'http://localhost:4321',
  'http://localhost:3000',
  'https://www.sofijaivanova.lv',
  'https://sofijaivanova.lv',
  'https://www.sofija-nutrition.lv',
  'https://sofija-nutrition.lv',
];

// ============================================
// Functions
// ============================================

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(request: HttpRequest): CorsHeaders {
  const origin = request.headers.get('origin') || request.headers.get('Origin');

  // Check if origin is allowed
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Add CORS headers to a response object
 */
export function addCorsHeaders<T extends HttpResponse>(response: T, request: HttpRequest): T {
  const corsHeaders = getCorsHeaders(request);

  return {
    ...response,
    headers: {
      ...corsHeaders,
      ...(response.headers || {}),
    },
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  getCorsHeaders,
  addCorsHeaders,
};
