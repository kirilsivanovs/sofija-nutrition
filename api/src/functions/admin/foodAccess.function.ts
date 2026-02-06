import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { FoodAccessRepository } from '../../services/foodAccessRepository';
import { checkAuthorizationWithLogging, unauthorizedResponse } from '../../utils/authMiddleware';

/**
 * Admin endpoint to list or update food access
 * GET /api/dashboard/food-access?userId={userId}
 * PUT /api/dashboard/food-access?userId={userId}
 */
export async function adminFoodAccess(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = checkAuthorizationWithLogging(request, context as any);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  let repository: FoodAccessRepository;

  try {
    repository = new FoodAccessRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );
  } catch (error) {
    context.error('Food access repository init failed:', error);
    return { status: 500, jsonBody: { error: 'Storage is not configured' } };
  }

  if (request.method === 'GET') {
    const userId = request.query.get('userId');
    try {
      if (userId) {
        const access = await repository.getAccess(userId);
        return {
          status: 200,
          jsonBody: access || { userId, enabled: false }
        };
      }

      const accessList = await repository.listAccess();
      return {
        status: 200,
        jsonBody: accessList
      };
    } catch (error) {
      context.error('Food access GET failed:', error);
      return { status: 500, jsonBody: { error: 'Failed to fetch access list' } };
    }
  }

  if (request.method === 'PUT') {
    const userId = request.query.get('userId');
    if (!userId) {
      return { status: 400, jsonBody: { error: 'userId is required' } };
    }

    try {
      const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
      const enabled = Boolean(body?.enabled);
      const access = await repository.setAccess(userId, enabled);
      return {
        status: 200,
        jsonBody: access
      };
    } catch (error) {
      context.error('Food access PUT failed:', error);
      return { status: 500, jsonBody: { error: 'Failed to update access' } };
    }
  }

  return { status: 405, jsonBody: { error: 'Method not allowed' } };
}

app.http('admin-food-access', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'dashboard/food-access',
  handler: adminFoodAccess
});