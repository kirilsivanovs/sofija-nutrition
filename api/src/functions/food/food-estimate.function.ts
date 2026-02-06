import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * Azure Function for estimating nutrition by food name and weight
 * AI functionality temporarily disabled
 */
export async function foodEstimate(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing food estimate request');

  // AI functionality temporarily disabled
  return {
    status: 501,
    jsonBody: { 
      error: 'AI functionality is not available',
      message: 'Food nutrition estimation is temporarily disabled'
    }
  };
}

app.http('food-estimate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'food/estimate',
  handler: foodEstimate
});