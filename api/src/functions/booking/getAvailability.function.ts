/**
 * getAvailability HTTP Handler (TypeScript)
 * 
 * Thin HTTP layer that handles request/response.
 * Business logic is delegated to AvailabilityService.
 */

import { app, HttpRequest, InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';
import { getAvailability } from '../services/availabilityService';
import { addCorsHeaders } from '../utils/cors';

// ============================================
// Handler
// ============================================

async function getAvailabilityHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const date = request.params.date;

    // Delegate to service layer
    const result = await getAvailability({
      specificDate: date || null,
      daysAhead: 90
    });

    return {
      status: 200,
      jsonBody: result
    };

  } catch (error: unknown) {
    const err = error as { message?: string };
    context.error('Error getting availability:', err);
    return addCorsHeaders({
      status: 500,
      jsonBody: { error: 'Internal server error', details: err.message }
    }, request as any);
  }
}

// ============================================
// Register Function
// ============================================

app.http('getAvailability', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'availability/{date?}',
  handler: getAvailabilityHandler
});

// ============================================
// Export for testing
// ============================================

export { getAvailabilityHandler };
