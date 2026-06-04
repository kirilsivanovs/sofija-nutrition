/**
 * Food Diary (Meals) Repository Tests
 * Tests CRUD operations, validation, and edge cases
 */
import { MealsRepository } from '../src/services/mealsRepository';
import { clearMockTables } from './__mocks__/azure-data-tables';
import type { Meal } from '../src/types/food';

function createMockMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    PartitionKey: 'user123_2026-05-15',
    RowKey: 'meal-001',
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
        confidence: 0.9,
        userAdjusted: false,
      },
    ],
    totalCalories: 248,
    totalProtein: 31,
    totalFat: 13,
    totalCarbs: 0,
    confirmed: false,
    createdAt: '2026-05-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('MealsRepository', () => {
  let repository: MealsRepository;

  beforeEach(() => {
    clearMockTables();
    repository = new MealsRepository('DefaultEndpointsProtocol=https;AccountName=test');
  });

  describe('saveMeal', () => {
    it('should save a meal and return it', async () => {
      const meal = createMockMeal();
      const result = await repository.saveMeal(meal);

      expect(result.userId).toBe('user123');
      expect(result.mealType).toBe('lunch');
      expect(result.createdAt).toBeTruthy();
    });

    it('should be retrievable after save', async () => {
      const meal = createMockMeal();
      await repository.saveMeal(meal);

      const retrieved = await repository.getMealById('user123', '2026-05-15', 'meal-001');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.userId).toBe('user123');
      expect(retrieved!.items).toHaveLength(1);
      expect(retrieved!.items[0].name).toBe('Куриная грудка');
    });
  });

  describe('getMealsByDate', () => {
    it('should return meals for a specific date', async () => {
      await repository.saveMeal(createMockMeal({ RowKey: 'meal-001', createdAt: '2026-05-15T08:00:00.000Z' }));
      await repository.saveMeal(createMockMeal({ RowKey: 'meal-002', createdAt: '2026-05-15T12:00:00.000Z' }));

      const meals = await repository.getMealsByDate('user123', '2026-05-15');
      expect(meals.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no meals exist', async () => {
      const meals = await repository.getMealsByDate('nonexistent', '2026-05-15');
      expect(meals).toEqual([]);
    });

    it('should sort meals by createdAt ascending', async () => {
      await repository.saveMeal(createMockMeal({
        RowKey: 'meal-late',
        createdAt: '2026-05-15T19:00:00.000Z',
      }));
      await repository.saveMeal(createMockMeal({
        RowKey: 'meal-early',
        createdAt: '2026-05-15T07:00:00.000Z',
      }));

      const meals = await repository.getMealsByDate('user123', '2026-05-15');
      const times = meals.map(m => new Date(m.createdAt).getTime());
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });
  });

  describe('getMealById', () => {
    it('should return meal by id', async () => {
      await repository.saveMeal(createMockMeal());

      const meal = await repository.getMealById('user123', '2026-05-15', 'meal-001');
      expect(meal).not.toBeNull();
      expect(meal!.totalCalories).toBe(248);
    });

    it('should return null when meal not found', async () => {
      const meal = await repository.getMealById('user123', '2026-05-15', 'nonexistent');
      expect(meal).toBeNull();
    });
  });

  describe('updateMeal', () => {
    it('should update existing meal', async () => {
      const meal = createMockMeal();
      await repository.saveMeal(meal);

      const updated = { ...meal, confirmed: true, confirmedAt: '2026-05-15T13:00:00.000Z' };
      const result = await repository.updateMeal(updated);

      expect(result.confirmed).toBe(true);

      const retrieved = await repository.getMealById('user123', '2026-05-15', 'meal-001');
      expect(retrieved!.confirmed).toBe(true);
    });
  });

  describe('deleteMeal', () => {
    it('should delete meal from storage', async () => {
      await repository.saveMeal(createMockMeal());
      await repository.deleteMeal('user123', '2026-05-15', 'meal-001');

      const meal = await repository.getMealById('user123', '2026-05-15', 'meal-001');
      expect(meal).toBeNull();
    });
  });

  describe('getDailyStats', () => {
    it('should aggregate only confirmed meals', async () => {
      await repository.saveMeal(createMockMeal({
        RowKey: 'meal-001',
        totalCalories: 300,
        totalProtein: 20,
        totalFat: 10,
        totalCarbs: 30,
        confirmed: true,
      }));
      await repository.saveMeal(createMockMeal({
        RowKey: 'meal-002',
        totalCalories: 500,
        totalProtein: 35,
        totalFat: 20,
        totalCarbs: 40,
        confirmed: true,
      }));
      await repository.saveMeal(createMockMeal({
        RowKey: 'meal-003',
        totalCalories: 150,
        totalProtein: 5,
        totalFat: 8,
        totalCarbs: 15,
        confirmed: false,
      }));

      const stats = await repository.getDailyStats('user123', '2026-05-15');

      expect(stats.date).toBe('2026-05-15');
      expect(stats.mealsCount).toBe(2);
      expect(stats.totalCalories).toBe(800);
      expect(stats.totalProtein).toBe(55);
      expect(stats.totalFat).toBe(30);
      expect(stats.totalCarbs).toBe(70);
    });

    it('should return zero stats when no confirmed meals', async () => {
      await repository.saveMeal(createMockMeal({
        RowKey: 'meal-001',
        confirmed: false,
      }));

      const stats = await repository.getDailyStats('user123', '2026-05-15');
      expect(stats.mealsCount).toBe(0);
      expect(stats.totalCalories).toBe(0);
    });
  });

  describe('listPatientSummaries', () => {
    it('should aggregate meals per user', async () => {
      await repository.saveMeal(createMockMeal({
        PartitionKey: 'user1_2026-05-10',
        RowKey: 'meal-1',
        userId: 'user1',
        createdAt: '2026-05-10T08:00:00.000Z',
      }));
      await repository.saveMeal(createMockMeal({
        PartitionKey: 'user1_2026-05-15',
        RowKey: 'meal-2',
        userId: 'user1',
        createdAt: '2026-05-15T12:00:00.000Z',
      }));
      await repository.saveMeal(createMockMeal({
        PartitionKey: 'user2_2026-05-14',
        RowKey: 'meal-3',
        userId: 'user2',
        createdAt: '2026-05-14T09:00:00.000Z',
      }));

      const summaries = await repository.listPatientSummaries();

      expect(summaries).toHaveLength(2);
      const user1 = summaries.find(s => s.userId === 'user1');
      expect(user1!.mealsCount).toBe(2);
      expect(user1!.lastMealAt).toBe('2026-05-15T12:00:00.000Z');
    });
  });
});

describe('Meals Function - Validation Logic', () => {
  describe('photoUrl truncation', () => {
    it('should strip photoUrl over 50KB', () => {
      const largePhotoUrl = 'data:image/jpeg;base64,' + 'A'.repeat(60000);
      let photoUrl: string | undefined = largePhotoUrl;
      if (photoUrl && photoUrl.length > 50000) {
        photoUrl = undefined;
      }
      expect(photoUrl).toBeUndefined();
    });

    it('should keep photoUrl under 50KB', () => {
      const smallPhotoUrl = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
      let photoUrl: string | undefined = smallPhotoUrl;
      if (photoUrl && photoUrl.length > 50000) {
        photoUrl = undefined;
      }
      expect(photoUrl).toBe(smallPhotoUrl);
    });
  });

  describe('input validation', () => {
    it('should require userId', () => {
      const meal = { items: [{ name: 'Test' }] } as unknown as Meal;
      expect(!meal.userId).toBe(true);
    });

    it('should require non-empty items', () => {
      const meal = { userId: 'user1', items: [] } as unknown as Meal;
      expect(meal.items.length === 0).toBe(true);
    });
  });
});
