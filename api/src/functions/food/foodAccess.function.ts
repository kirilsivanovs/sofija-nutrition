import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { FoodAccessRepository } from '../../services/foodAccessRepository';

interface ClientPrincipal {
  userId?: string;
  identityProvider?: string;
  userDetails?: string;
  userRoles?: string[];
}

function getPrincipal(request: HttpRequest): ClientPrincipal | null {
  const principalHeader = request.headers.get('x-ms-client-principal');
  if (!principalHeader) return null;

  try {
    const decoded = Buffer.from(principalHeader, 'base64').toString('utf-8');
    const principal = JSON.parse(decoded) as ClientPrincipal;
    return principal || null;
  } catch {
    return null;
  }
}

/**
 * Patient endpoint to check access to food diary
 * GET /api/food/access
 */
export async function getFoodAccess(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const principal = getPrincipal(request);
  const userId = principal?.userId || null;
  if (!userId) {
    return { status: 401, jsonBody: { error: 'Unauthorized' } };
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

  try {
    const access = await repository.getAccess(userId);
    const displayName = principal?.userDetails || undefined;
    const email = principal?.userDetails || undefined;

    if (!access) {
      const created = await repository.setAccess(userId, false, { displayName, email });
      return {
        status: 200,
        jsonBody: {
          userId,
          enabled: created.enabled
        }
      };
    }

    if ((displayName && !access.displayName) || (email && !access.email)) {
      await repository.setAccess(userId, access.enabled, { displayName, email });
      access.displayName = access.displayName || displayName;
      access.email = access.email || email;
    }

    return {
      status: 200,
      jsonBody: {
        userId,
        enabled: access.enabled
      }
    };
  } catch (error) {
    context.error('Error getting food access:', error);
    return { status: 500, jsonBody: { error: 'Failed to get access' } };
  }
}

app.http('food-access', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'food/access',
  handler: getFoodAccess
});