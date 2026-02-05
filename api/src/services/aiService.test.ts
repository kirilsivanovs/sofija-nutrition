import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockAIService } from './aiService';

describe('MockAIService', () => {
  let service: MockAIService;

  beforeEach(() => {
    service = new MockAIService();
  });

  it('should return food analysis result', async () => {
    const result = await service.analyzeFoodPhoto('base64data');

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('totalCalories');
    expect(result).toHaveProperty('totalProtein');
    expect(result).toHaveProperty('totalFat');
    expect(result).toHaveProperty('totalCarbs');
    expect(result).toHaveProperty('mealType');
  });

  it('should return multiple food items', async () => {
    const result = await service.analyzeFoodPhoto('base64data');

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty('name');
    expect(result.items[0]).toHaveProperty('nameEn');
    expect(result.items[0]).toHaveProperty('weight');
    expect(result.items[0]).toHaveProperty('calories');
    expect(result.items[0]).toHaveProperty('confidence');
  });

  it('should have correct total nutrition', async () => {
    const result = await service.analyzeFoodPhoto('base64data');

    const calculatedTotal = result.items.reduce(
      (sum, item) => sum + item.calories,
      0
    );

    expect(result.totalCalories).toBe(calculatedTotal);
  });

  it('should have confidence between 0 and 1', async () => {
    const result = await service.analyzeFoodPhoto('base64data');

    result.items.forEach(item => {
      expect(item.confidence).toBeGreaterThanOrEqual(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should return valid meal type', async () => {
    const result = await service.analyzeFoodPhoto('base64data');

    expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(result.mealType);
  });
});
