/**
 * Health Check HTTP Handler (TypeScript)
 */

import { app, HttpRequest, InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';

// ============================================
// Types
// ============================================

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
}

// ============================================
// Handler
// ============================================

async function healthHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };

  return {
    status: 200,
    jsonBody: response
  };
}

// ============================================
// Register Function
// ============================================

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: healthHandler
});

// ============================================
// Export for testing
// ============================================

export { healthHandler };
