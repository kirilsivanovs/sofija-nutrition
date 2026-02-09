import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MealsRepository } from '../../services/mealsRepository';
import { FoodAccessRepository } from '../../services/foodAccessRepository';
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

    const mealsRepository = new MealsRepository(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
    const accessRepository = new FoodAccessRepository(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );

    const patients = await mealsRepository.listPatientSummaries(limit);
    const accessRecords = await accessRepository.listAccess();

    // Enrich patient data with email and displayName from FoodAccess
    const enrichedPatients = patients.map((patient) => {
      const access = accessRecords.find((a) => a.userId === patient.userId);
      return {
        ...patient,
        email: access?.email,
        displayName: access?.displayName,
        accessEnabled: access?.enabled ?? false,
      };
    });

    return {
      status: 200,
      jsonBody: enrichedPatients,
    };
  } catch (error) {
    context.error('Error getting admin patients:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get patients' },
    };
  }
}

app.http('admin-patients-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/patients',
  handler: adminListPatients,
});

/**
 * Admin endpoint to delete a patient and all their meals
 * DELETE /api/dashboard/patients/:userId
 */
export async function adminDeletePatient(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Admin DELETE patient request');

  const auth = checkAuthorizationWithLogging(request, context as any);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized');
  }

  try {
    const userId = request.params.userId;
    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: 'userId is required' },
      };
    }

    const repository = new MealsRepository(process.env.AZURE_STORAGE_CONNECTION_STRING || '');

    const deletedCount = await repository.deleteAllUserMeals(userId);

    context.log(`Deleted ${deletedCount} meals for user ${userId}`);

    return {
      status: 200,
      jsonBody: {
        message: 'Patient deleted successfully',
        deletedMeals: deletedCount,
      },
    };
  } catch (error) {
    context.error('Error deleting patient:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to delete patient' },
    };
  }
}

app.http('admin-patients-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'dashboard/patients/{userId}',
  handler: adminDeletePatient,
});
