import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * Azure Function for food photo analysis
 * AI functionality temporarily disabled
 */
export async function foodAnalyze(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing food analysis request');

  // AI functionality temporarily disabled
  return {
    status: 501,
    jsonBody: { 
      error: 'AI functionality is not available',
      message: 'Food photo analysis is temporarily disabled'
    }
  };
}

app.http('food-analyze', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'food/analyze',
  handler: foodAnalyze
});
