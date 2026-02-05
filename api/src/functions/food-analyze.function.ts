import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import type { FoodAnalysisResult } from '../types/food.js';
import type { IAIService } from '../services/aiService';
import { AzureOpenAIService, GeminiAIService, MockAIService } from '../services/aiService';

/**
 * Azure Function for food photo analysis
 * Following Single Responsibility Principle
 */
export async function foodAnalyze(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing food analysis request');

  try {
    // Validate request
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed' }
      };
    }

    const body = await request.json() as { photo: string };
    
    if (!body.photo) {
      return {
        status: 400,
        jsonBody: { error: 'Missing photo data' }
      };
    }

    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const photoBase64 = body.photo.replace(/^data:image\/\w+;base64,/, '');

    // Select AI service based on environment
    const useMock = process.env.USE_MOCK_AI === 'true';
    const useGemini = process.env.USE_GEMINI === 'true';
    
    let aiService: IAIService;
    
    if (useMock) {
      aiService = new MockAIService();
    } else if (useGemini) {
      const { GeminiAIService } = await import('../services/aiService');
      aiService = new GeminiAIService(
        process.env.GEMINI_API_KEY || '',
        process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      );
    } else {
      aiService = new AzureOpenAIService(
        process.env.AZURE_OPENAI_ENDPOINT || '',
        process.env.AZURE_OPENAI_KEY || ''
      );
    }

    // Analyze photo
    const result: FoodAnalysisResult = await aiService.analyzeFoodPhoto(photoBase64);

    context.log('Analysis completed successfully');

    return {
      status: 200,
      jsonBody: result,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    context.error('Error analyzing food photo:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Failed to analyze photo',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

app.http('food-analyze', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'food/analyze',
  handler: foodAnalyze
});
