import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MealsRepository } from '../../services/mealsRepository';
import { checkAuthorizationWithLogging, unauthorizedResponse } from '../../utils/authMiddleware';

/**
 * Admin endpoint to list patients who have meals
 * GET /api/dashboard/patients?limit={number}
 */
export async function adminListPatients(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Admin GET patients request');

  const auth = checkAuthorizationWithLogging(request, context as any);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  try {
    const limitParam = request.query.get('limit');
    const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 200, 1), 1000) : 200;

    const repository = new MealsRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const patients = await repository.listPatientSummaries(limit);

    return {
      status: 200,
      jsonBody: patients
    };
  } catch (error) {
    context.error('Error getting admin patients:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get patients' }
    };
  }
}

app.http('admin-patients-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/patients',
  handler: adminListPatients
});