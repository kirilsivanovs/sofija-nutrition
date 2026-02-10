/**
 * Admin Me Function
 * Returns current user info and admin status.
 * Used by frontend to check admin access without hardcoding emails.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { checkAuthorization, unauthorizedResponse } from '../../utils/authMiddleware';

app.http('admin-me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/me',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request, context);

    if (!auth.authorized || !auth.user) {
      return unauthorizedResponse(auth.error || 'Unauthorized');
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        user: {
          id: auth.user.id,
          name: auth.user.name,
          provider: auth.user.provider,
          roles: auth.user.roles,
        },
      },
    };
  },
});
