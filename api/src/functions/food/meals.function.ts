import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import type { Meal } from '../../types/food.js';
import { MealsRepository } from '../../services/mealsRepository';
import { FoodAccessRepository } from '../../services/foodAccessRepository';
import { getClientPrincipal } from '../../utils/clientPrincipal';
import { validateDateFormat } from '../../utils/odataSanitizer';
import { format } from 'date-fns';

/**
 * Azure Function for meals CRUD operations
 * Following RESTful API design and Single Responsibility Principle
 */

const MEAL_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const EDITABLE_MEAL_FIELDS = [
  'mealType',
  'items',
  'totalCalories',
  'totalProtein',
  'totalFat',
  'totalCarbs',
  'photoUrl',
  'confirmed',
  'confirmedAt',
] as const;

/**
 * Identity comes only from the SWA client principal. A claimed userId
 * (query/body) is only ever compared to it, never trusted as the identity.
 */
async function authorizeDiaryPatient(
  request: HttpRequest,
  claimedUserId: string | null
): Promise<{ userId: string } | HttpResponseInit> {
  const principal = getClientPrincipal(request);
  if (!principal) {
    return { status: 401, jsonBody: { error: 'Unauthorized' } };
  }

  if (claimedUserId && claimedUserId !== principal.userId) {
    return { status: 403, jsonBody: { error: 'Forbidden' } };
  }

  const accessRepository = new FoodAccessRepository(
    process.env.AZURE_STORAGE_CONNECTION_STRING || ''
  );
  const access = await accessRepository.getAccess(principal.userId);
  if (!access || !access.enabled) {
    return { status: 403, jsonBody: { error: 'Forbidden' } };
  }

  return { userId: principal.userId };
}

function isHttpResponse(value: { userId: string } | HttpResponseInit): value is HttpResponseInit {
  return (value as HttpResponseInit).status !== undefined;
}

function pickEditableFields(updates: Partial<Meal>): Partial<Meal> {
  const picked: Partial<Meal> = {};
  for (const field of EDITABLE_MEAL_FIELDS) {
    if (field in updates) {
      (picked as Record<string, unknown>)[field] = (updates as Record<string, unknown>)[field];
    }
  }
  return picked;
}

// GET /api/meals?userId={userId}&date={YYYY-MM-DD}
export async function getMeals(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET meals request');

  try {
    const claimedUserId = request.query.get('userId');
    const authz = await authorizeDiaryPatient(request, claimedUserId);
    if (isHttpResponse(authz)) return authz;

    const rawDate = request.query.get('date');
    const date = rawDate ? validateDateFormat(rawDate) : format(new Date(), 'yyyy-MM-dd');
    if (!date) {
      return { status: 400, jsonBody: { error: 'Invalid date' } };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const meals = await repository.getMealsByDate(authz.userId, date);

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
    const claimedUserId = meal.userId || null;
    const authz = await authorizeDiaryPatient(request, claimedUserId);
    if (isHttpResponse(authz)) return authz;

    if (!meal.items || meal.items.length === 0) {
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

    // Owner and keys are derived from the principal, never the client
    meal.userId = authz.userId;
    let date = format(new Date(), 'yyyy-MM-dd');
    if (meal.createdAt) {
      const parsed = new Date(meal.createdAt);
      if (isNaN(parsed.getTime())) {
        return { status: 400, jsonBody: { error: 'Invalid createdAt' } };
      }
      date = format(parsed, 'yyyy-MM-dd');
    }
    meal.PartitionKey = `${authz.userId}_${date}`;
    meal.RowKey = Date.now().toString();

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
    const claimedUserId = request.query.get('userId');
    const rawDate = request.query.get('date');

    const authz = await authorizeDiaryPatient(request, claimedUserId);
    if (isHttpResponse(authz)) return authz;

    const date = rawDate ? validateDateFormat(rawDate) : null;
    if (!date || !mealId || !MEAL_ID_PATTERN.test(mealId)) {
      return {
        status: 400,
        jsonBody: { error: 'date and mealId are required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const existingMeal = await repository.getMealById(authz.userId, date, mealId);
    if (!existingMeal) {
      return {
        status: 404,
        jsonBody: { error: 'Meal not found' }
      };
    }

    const editableUpdates = pickEditableFields(updates);

    if (editableUpdates.photoUrl && editableUpdates.photoUrl.length > 50000) {
      context.warn?.('photoUrl too large, omitting from storage');
      editableUpdates.photoUrl = undefined;
    }

    const updatedMeal = { ...existingMeal, ...editableUpdates };
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
    const claimedUserId = request.query.get('userId');
    const rawDate = request.query.get('date');

    const authz = await authorizeDiaryPatient(request, claimedUserId);
    if (isHttpResponse(authz)) return authz;

    const date = rawDate ? validateDateFormat(rawDate) : null;
    if (!date || !mealId || !MEAL_ID_PATTERN.test(mealId)) {
      return {
        status: 400,
        jsonBody: { error: 'date and mealId are required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const existingMeal = await repository.getMealById(authz.userId, date, mealId);
    if (!existingMeal) {
      return {
        status: 404,
        jsonBody: { error: 'Meal not found' }
      };
    }

    await repository.deleteMeal(authz.userId, date, mealId);

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
    const claimedUserId = request.query.get('userId');
    const authz = await authorizeDiaryPatient(request, claimedUserId);
    if (isHttpResponse(authz)) return authz;

    const rawDate = request.query.get('date');
    const date = rawDate ? validateDateFormat(rawDate) : format(new Date(), 'yyyy-MM-dd');
    if (!date) {
      return { status: 400, jsonBody: { error: 'Invalid date' } };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const stats = await repository.getDailyStats(authz.userId, date);

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
