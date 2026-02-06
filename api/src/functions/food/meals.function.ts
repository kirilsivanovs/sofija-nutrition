import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import type { Meal } from '../types/food.js';
import { MealsRepository } from '../services/mealsRepository';
import { format } from 'date-fns';

/**
 * Azure Function for meals CRUD operations
 * Following RESTful API design and Single Responsibility Principle
 */

// GET /api/meals?userId={userId}&date={YYYY-MM-DD}
export async function getMeals(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET meals request');

  try {
    const userId = request.query.get('userId');
    const date = request.query.get('date') || format(new Date(), 'yyyy-MM-dd');

    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: 'userId is required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const meals = await repository.getMealsByDate(userId, date);

    return {
      status: 200,
      jsonBody: meals
    };
  } catch (error) {
    context.error('Error getting meals:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get meals' }
    };
  }
}

// POST /api/meals
export async function createMeal(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('POST meal request');

  try {
    const meal = await request.json() as Meal;

    if (!meal.userId || !meal.items || meal.items.length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'Invalid meal data' }
      };
    }

    // Strip oversized photoUrl to avoid Azure Table payload limits
    if (meal.photoUrl && meal.photoUrl.length > 50000) {
      context.warn?.('photoUrl too large, omitting from storage');
      meal.photoUrl = undefined;
    }

    // Generate IDs if not present
    const date = format(new Date(meal.createdAt || new Date()), 'yyyy-MM-dd');
    meal.PartitionKey = `${meal.userId}_${date}`;
    meal.RowKey = meal.RowKey || Date.now().toString();

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const savedMeal = await repository.saveMeal(meal);

    return {
      status: 201,
      jsonBody: savedMeal
    };
  } catch (error) {
    context.error('Error creating meal:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to create meal' }
    };
  }
}

// PATCH /api/meals/{mealId}
export async function updateMeal(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('PATCH meal request');

  try {
    const mealId = request.params.mealId;
    const updates = await request.json() as Partial<Meal>;
    const userId = request.query.get('userId');
    const date = request.query.get('date');

    if (!userId || !date || !mealId) {
      return {
        status: 400,
        jsonBody: { error: 'userId, date, and mealId are required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const existingMeal = await repository.getMealById(userId, date, mealId);
    if (!existingMeal) {
      return {
        status: 404,
        jsonBody: { error: 'Meal not found' }
      };
    }

    if (updates.photoUrl && updates.photoUrl.length > 50000) {
      context.warn?.('photoUrl too large, omitting from storage');
      updates.photoUrl = undefined;
    }

    const updatedMeal = { ...existingMeal, ...updates };
    await repository.updateMeal(updatedMeal);

    return {
      status: 200,
      jsonBody: updatedMeal
    };
  } catch (error) {
    context.error('Error updating meal:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to update meal' }
    };
  }
}

// DELETE /api/meals/{mealId}
export async function deleteMeal(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('DELETE meal request');

  try {
    const mealId = request.params.mealId;
    const userId = request.query.get('userId');
    const date = request.query.get('date');

    if (!userId || !date || !mealId) {
      return {
        status: 400,
        jsonBody: { error: 'userId, date, and mealId are required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    await repository.deleteMeal(userId, date, mealId);

    return {
      status: 204
    };
  } catch (error) {
    context.error('Error deleting meal:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to delete meal' }
    };
  }
}

// GET /api/meals/stats?userId={userId}&date={YYYY-MM-DD}
export async function getDailyStats(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET daily stats request');

  try {
    const userId = request.query.get('userId');
    const date = request.query.get('date') || format(new Date(), 'yyyy-MM-dd');

    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: 'userId is required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const stats = await repository.getDailyStats(userId, date);

    return {
      status: 200,
      jsonBody: stats
    };
  } catch (error) {
    context.error('Error getting daily stats:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get daily stats' }
    };
  }
}

// Register HTTP triggers
app.http('meals-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'meals',
  handler: getMeals
});

app.http('meals-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'meals',
  handler: createMeal
});

app.http('meals-update', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'meals/{mealId}',
  handler: updateMeal
});

app.http('meals-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'meals/{mealId}',
  handler: deleteMeal
});

app.http('meals-stats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'meals/stats',
  handler: getDailyStats
});
