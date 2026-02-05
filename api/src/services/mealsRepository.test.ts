import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MealsRepository } from './mealsRepository';
import type { Meal } from '../types/food';

// Mock TableClient
jest.mock('@azure/data-tables', () => ({
  TableClient: {
    fromConnectionString: jest.fn(() => ({
      createEntity: jest.fn(),
      listEntities: jest.fn(),
      getEntity: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntity: jest.fn()
    }))
  }
}));

describe('MealsRepository', () => {
  let repository: MealsRepository;
  const mockConnectionString = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test';

  beforeEach(() => {
    repository = new MealsRepository(mockConnectionString);
  });

  const mockMeal: Meal = {
    PartitionKey: 'user123_2026-02-02',
    RowKey: '1738483200000',
    userId: 'user123',
    mealType: 'lunch',
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
      }
    ],
    totalCalories: 248,
    totalProtein: 31,
    totalFat: 13,
    totalCarbs: 0,
    confirmed: true,
    createdAt: '2026-02-02T12:30:00Z'
  };

  it('should create repository instance', () => {
    expect(repository).toBeDefined();
  });

  it('should have saveMeal method', () => {
    expect(repository.saveMeal).toBeDefined();
  });

  it('should have getMealsByDate method', () => {
    expect(repository.getMealsByDate).toBeDefined();
  });

  it('should have getDailyStats method', () => {
    expect(repository.getDailyStats).toBeDefined();
  });
});
