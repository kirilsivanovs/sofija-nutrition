import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MealsRepository } from '../../services/mealsRepository';
import { checkAuthorizationWithLogging, unauthorizedResponse } from '../../utils/authMiddleware';

/**
 * Admin endpoint to fetch meals for any user by date
 * GET /api/dashboard/meals?userId={userId}&date={YYYY-MM-DD}
 */
export async function adminGetMeals(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Admin GET meals request');

  const auth = checkAuthorizationWithLogging(request, context);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  try {
    const userId = request.query.get('userId');
    const date = request.query.get('date');

    if (!userId || !date) {
      return {
        status: 400,
        jsonBody: { error: 'userId and date are required' }
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
    context.error('Error getting admin meals:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get meals' }
    };
  }
}

app.http('admin-meals-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/meals',
  handler: adminGetMeals
});

/**
 * Admin endpoint to fetch meals for a date range
 * GET /api/dashboard/meals/range?userId={userId}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}
 */
export async function adminGetMealsRange(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Admin GET meals range request');

  const auth = checkAuthorizationWithLogging(request, context);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  try {
    const userId = request.query.get('userId');
    const startDate = request.query.get('startDate');
    const endDate = request.query.get('endDate');

    if (!userId || !startDate || !endDate) {
      return {
        status: 400,
        jsonBody: { error: 'userId, startDate, and endDate are required' }
      };
    }

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    // Get meals for each day in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allMeals: any[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayMeals = await repository.getMealsByDate(userId, dateStr);
      allMeals.push(...dayMeals);
    }

    return {
      status: 200,
      jsonBody: allMeals
    };
  } catch (error) {
    context.error('Error getting admin meals range:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get meals range' }
    };
  }
}

app.http('admin-meals-range-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/meals/range',
  handler: adminGetMealsRange
});