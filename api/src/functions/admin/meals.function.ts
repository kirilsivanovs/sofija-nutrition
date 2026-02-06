import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MealsRepository } from '../services/mealsRepository';
import { checkAuthorizationWithLogging, unauthorizedResponse } from '../utils/authMiddleware';

/**
 * Admin endpoint to fetch meals for any user by date
 * GET /api/dashboard/meals?userId={userId}&date={YYYY-MM-DD}
 */
export async function adminGetMeals(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Admin GET meals request');

  const auth = checkAuthorizationWithLogging(request, context as any);
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