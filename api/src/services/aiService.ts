/**
 * AI Service following Dependency Inversion Principle
 * Interface for food analysis AI service
 */
import type { FoodAnalysisResult, MealItem } from '../types/food.js';
import JSON5 from 'json5';

export interface IAIService {
  analyzeFoodPhoto(photoBase64: string): Promise<FoodAnalysisResult>;
}

// OpenAI API response types
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Gemini API response types
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
}

/**
 * Azure OpenAI implementation of IAIService
 * Following Single Responsibility Principle - only handles AI integration
 */
export class AzureOpenAIService implements IAIService {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;

  constructor(endpoint: string, apiKey: string, deploymentName = 'gpt-4-vision') {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.deploymentName = deploymentName;
  }

  async analyzeFoodPhoto(photoBase64: string): Promise<FoodAnalysisResult> {
    const systemPrompt = `You are a nutrition analysis AI. Analyze food photos and return structured JSON.

For each food item visible in the photo:
1. Identify the food item
2. Estimate the weight in grams based on visual cues (plate size, portions)
3. Calculate nutritional values per estimated weight

Return JSON format:
{
  "items": [
    {
      "name": "название на русском",
      "nameEn": "english name",
      "weight": 150,
      "calories": 248,
      "protein": 31,
      "fat": 13,
      "carbs": 0,
      "confidence": 0.85,
      "userAdjusted": false
    }
  ],
  "totalCalories": 248,
  "totalProtein": 31,
  "totalFat": 13,
  "totalCarbs": 0,
  "mealType": "lunch"
}

Be conservative with estimates. If unsure, provide lower confidence score.
Use standard nutritional databases (USDA) for calculations.`;

    try {
      const response = await fetch(
        `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Analyze this meal:' },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${photoBase64}` }
                  }
                ]
              }
            ],
            max_tokens: 1000,
            temperature: 0.3
          })
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as OpenAIResponse;
      const content = data.choices[0].message.content;
      
      return JSON.parse(content) as FoodAnalysisResult;
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error('Failed to analyze food photo');
    }
  }
}

/**
 * Google Gemini implementation - FREE tier available!
 * Best choice for MVP and development
 */
export class GeminiAIService implements IAIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async requestGemini(photoBase64: string, prompt: string, maxOutputTokens: number) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    console.log('🤖 Calling Gemini API:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
    console.log('📤 Sending to Gemini:', { model: this.model, imageSize: photoBase64.length, maxOutputTokens });

    const parts = [{ text: prompt } as { text: string } | { inline_data: { mime_type: string; data: string } }];
    if (photoBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: photoBase64
        }
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json() as GeminiResponse;
    console.log('📥 Gemini response:', JSON.stringify(data, null, 2));

    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini response missing text content');
    }

    return {
      text,
      finishReason: candidate?.finishReason as string | undefined
    };
  }

  async analyzeFoodPhoto(photoBase64: string): Promise<FoodAnalysisResult> {
    const systemPrompt = `Return ONLY valid JSON.
Schema:
{
  "items": [{"name":"...","nameEn":"...","weight":0,"calories":0,"protein":0,"fat":0,"carbs":0,"confidence":0,"userAdjusted":false}],
  "totalCalories":0,
  "totalProtein":0,
  "totalFat":0,
  "totalCarbs":0,
  "mealType":"breakfast|lunch|dinner|snack"
}
Identify foods in the photo as precisely as possible. Be skeptical: if the visual cues are ambiguous, choose a more general but accurate dish name and LOWER confidence. Do not invent details; avoid overconfident labels. Prefer the most likely local/Eastern-European dish names when applicable. If the same food appears multiple times (e.g., cut in half), MERGE into a single item with total weight. Avoid duplicate items. Be concise and use realistic confidence (0.3-0.9).`;

    const retryPrompt = `Return ONLY valid JSON with this schema:
{"items":[{"name":"...","nameEn":"...","weight":0,"calories":0,"protein":0,"fat":0,"carbs":0,"confidence":0,"userAdjusted":false}],"totalCalories":0,"totalProtein":0,"totalFat":0,"totalCarbs":0,"mealType":"breakfast|lunch|dinner|snack"}
Keep values minimal, no extra text.`;

    try {
      const first = await this.requestGemini(photoBase64, systemPrompt, 4096);

      if (first.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Gemini response truncated, retrying with shorter prompt.');
        const retry = await this.requestGemini(photoBase64, retryPrompt, 4096);
        return this.mergeDuplicateItems(this.parseGeminiJson(retry.text));
      }

      return this.mergeDuplicateItems(this.parseGeminiJson(first.text));
    } catch (error) {
      console.error('Gemini Analysis error:', error);
      throw new Error('Failed to analyze food photo with Gemini');
    }
  }

  async estimateNutritionByName(name: string, weight: number): Promise<MealItem> {
    const prompt = `Return ONLY valid JSON with this schema:
{"name":"...","nameEn":"...","weight":${weight},"calories":0,"protein":0,"fat":0,"carbs":0,"confidence":0,"userAdjusted":false}
Food name: ${name}
If unsure, keep the provided name and set low confidence (0.2-0.5). Do not change weight.`;

    try {
      const response = await this.requestGemini('', prompt, 1024);
      const parsed = this.parseJson(response.text) as MealItem;

      return {
        name: parsed.name || name,
        nameEn: parsed.nameEn || parsed.name || name,
        weight: Number.isFinite(parsed.weight) ? parsed.weight : weight,
        calories: Number(parsed.calories || 0),
        protein: Number(parsed.protein || 0),
        fat: Number(parsed.fat || 0),
        carbs: Number(parsed.carbs || 0),
        confidence: Number(parsed.confidence || 0),
        userAdjusted: false
      };
    } catch (error) {
      console.error('Gemini estimate error:', error);
      throw new Error('Failed to estimate nutrition');
    }
  }

  private parseGeminiJson(text: string): FoodAnalysisResult {
    return this.parseJson(text) as FoodAnalysisResult;
  }

  private parseJson(text: string): unknown {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : cleaned;

    try {
      return JSON.parse(jsonText);
    } catch (parseError) {
      return JSON5.parse(jsonText);
    }
  }

  private mergeDuplicateItems(result: FoodAnalysisResult): FoodAnalysisResult {
    const map = new Map<string, FoodAnalysisResult['items'][number]>();

    for (const item of result.items ?? []) {
      const key = (item.nameEn || item.name || '').toLowerCase().trim();
      if (!key) {
        continue;
      }

      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...item });
        continue;
      }

      const totalWeight = (existing.weight ?? 0) + (item.weight ?? 0);
      const existingWeight = existing.weight ?? 0;
      const itemWeight = item.weight ?? 0;
      const weightSum = totalWeight || 1;

      existing.weight = totalWeight;
      existing.calories = (existing.calories ?? 0) + (item.calories ?? 0);
      existing.protein = (existing.protein ?? 0) + (item.protein ?? 0);
      existing.fat = (existing.fat ?? 0) + (item.fat ?? 0);
      existing.carbs = (existing.carbs ?? 0) + (item.carbs ?? 0);
      existing.confidence =
        ((existing.confidence ?? 0) * existingWeight + (item.confidence ?? 0) * itemWeight) / weightSum;
    }

    const items = Array.from(map.values());
    const totals = items.reduce(
      (acc, item) => {
        acc.totalCalories += item.calories ?? 0;
        acc.totalProtein += item.protein ?? 0;
        acc.totalFat += item.fat ?? 0;
        acc.totalCarbs += item.carbs ?? 0;
        return acc;
      },
      { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 }
    );

    return {
      ...result,
      items,
      totalCalories: totals.totalCalories,
      totalProtein: totals.totalProtein,
      totalFat: totals.totalFat,
      totalCarbs: totals.totalCarbs
    };
  }
}

/**
 * Mock implementation for development/testing
 * Following Dependency Inversion Principle
 */
export class MockAIService implements IAIService {
  async analyzeFoodPhoto(photoBase64: string): Promise<FoodAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response
    return {
      items: [
        {
          name: 'Куриная грудка',
          nameEn: 'Chicken breast',
          weight: 150,
          calories: 248,
          protein: 31,
          fat: 13,
          carbs: 0,
          confidence: 0.85,
          userAdjusted: false
        },
        {
          name: 'Рис',
          nameEn: 'Rice',
          weight: 120,
          calories: 156,
          protein: 3,
          fat: 0,
          carbs: 34,
          confidence: 0.92,
          userAdjusted: false
        },
        {
          name: 'Брокколи',
          nameEn: 'Broccoli',
          weight: 100,
          calories: 34,
          protein: 3,
          fat: 0,
          carbs: 7,
          confidence: 0.88,
          userAdjusted: false
        }
      ],
      totalCalories: 438,
      totalProtein: 37,
      totalFat: 13,
      totalCarbs: 41,
      mealType: 'lunch'
    };
  }
}
