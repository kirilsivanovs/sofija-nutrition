import { HttpRequest } from '@azure/functions';

/**
 * SWA client principal decoded from the x-ms-client-principal header
 */
export interface ClientPrincipal {
  userId: string;
  identityProvider: string;
  userDetails?: string;
  userRoles?: string[];
}

/**
 * Decode the SWA client principal header. Identity comes only from here,
 * never from a query/body parameter.
 */
export function getClientPrincipal(request: HttpRequest): ClientPrincipal | null {
  const principalHeader = request.headers.get('x-ms-client-principal');
  if (!principalHeader) return null;

  try {
    const decoded = Buffer.from(principalHeader, 'base64').toString('utf-8');
    const principal = JSON.parse(decoded) as Partial<ClientPrincipal>;
    if (!principal || !principal.userId || !principal.identityProvider) {
      return null;
    }
    return principal as ClientPrincipal;
  } catch {
    return null;
  }
}
