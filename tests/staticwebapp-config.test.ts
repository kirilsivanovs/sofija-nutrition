import fs from 'fs';
import path from 'path';

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'public', 'staticwebapp.config.json'), 'utf-8')
);

describe('staticwebapp.config.json', () => {
  it('redirects to the Entra ID login and back to the requested page when a protected route returns 401', () => {
    expect(config.responseOverrides['401']).toEqual({
      redirect: '/.auth/login/aad?post_login_redirect_uri=.referrer',
      statusCode: 302,
    });
  });

  it('requires authentication for every cabinet URL form when the cabinet route is matched', () => {
    const cabinetRoute = config.routes.find((r: { route: string }) => r.route === '/cabinet*');
    expect(cabinetRoute).toBeDefined();
    expect(cabinetRoute.allowedRoles).toEqual(['authenticated']);

    const oldCabinetRoute = config.routes.find((r: { route: string }) => r.route === '/cabinet');
    expect(oldCabinetRoute).toBeUndefined();
  });
});
