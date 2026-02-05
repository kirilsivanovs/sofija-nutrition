import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { GeminiAIService } from '../services/aiService';

/**
 * Azure Function for estimating nutrition by food name and weight
 */
export async function foodEstimate(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing food estimate request');

  try {
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed' }
      };
    }

    const body = await request.json() as { name: string; weight: number };
    if (!body?.name || !body?.weight) {
      return {
        status: 400,
        jsonBody: { error: 'name and weight are required' }
      };
    }

    if (process.env.USE_GEMINI !== 'true') {
      return {
        status: 400,
        jsonBody: { error: 'Gemini is disabled' }
      };
    }

    const aiService = new GeminiAIService(
      process.env.GEMINI_API_KEY || '',
      process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    );

    const item = await aiService.estimateNutritionByName(body.name, body.weight);

    return {
      status: 200,
      jsonBody: item,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    context.error('Error estimating nutrition:', error);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to estimate nutrition',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

app.http('food-estimate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'food/estimate',
  handler: foodEstimate
});