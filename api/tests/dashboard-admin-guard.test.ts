/**
 * Every /api/dashboard/* handler must reject non-admin callers before touching storage.
 */
import * as fs from 'fs';
import * as path from 'path';

jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

jest.mock('../src/services/tableClientFactory', () => ({
  createTableClient: jest.fn(),
  isTableStorageConfigured: jest.fn().mockReturnValue(true),
}));

import { app } from '@azure/functions';
import { createTableClient } from '../src/services/tableClientFactory';

process.env.ADMIN_EMAILS = 'admin@example.test';

import '../src/functions/admin/tableData.function';
import '../src/functions/admin/settings.function';
import '../src/functions/admin/serviceSettings.function';
import '../src/functions/admin/me.function';
import '../src/functions/admin/patients.function';
import '../src/functions/admin/foodAccess.function';
import '../src/functions/admin/meals.function';
import '../src/functions/admin/bookings.function';
import '../src/functions/booking/confirmPayment.function';

const EXPECTED_ROUTE_COUNT = 24;
const FUNCTIONS_DIR = path.join(__dirname, '..', 'src', 'functions');
const IMPORTED_MODULES = [
  'admin/tableData',
  'admin/settings',
  'admin/serviceSettings',
  'admin/me',
  'admin/patients',
  'admin/foodAccess',
  'admin/meals',
  'admin/bookings',
  'booking/confirmPayment',
].map((name) => `${name}.function.ts`);

interface Registration {
  route: string;
  methods?: string[];
  handler: (request: unknown, context: unknown) => Promise<{ status?: number }>;
}

const registrations: Registration[] = (app.http as jest.Mock).mock.calls
  .map(([, options]) => options as Registration)
  .filter((options) => typeof options.route === 'string' && options.route.startsWith('dashboard/'));

const routes = registrations.map((registration) => [
  `${(registration.methods ?? ['GET']).join('|')} ${registration.route}`,
  registration,
]) as [string, Registration][];

function listFunctionSources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFunctionSources(fullPath);
    return entry.name.endsWith('.function.ts') ? [fullPath] : [];
  });
}

function fakeRequest(principal?: object) {
  const header = principal ? Buffer.from(JSON.stringify(principal)).toString('base64') : null;
  return {
    method: 'POST',
    url: 'https://example.test/api/dashboard/x',
    headers: { get: (name: string) => (name === 'x-ms-client-principal' ? header : null) },
    params: { id: 'SN-TEST001', patientId: 'patient-test', date: '2026-01-01', key: 'test' },
    query: new URLSearchParams(),
    json: async () => ({}),
    text: async () => '{}',
  };
}

function fakeContext() {
  return { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() };
}

const NON_ADMIN = { userId: 'user-test', identityProvider: 'aad', userDetails: 'user@example.test' };

describe('dashboard admin guard', () => {
  beforeEach(() => {
    (createTableClient as jest.Mock).mockClear();
  });

  it('registers every dashboard route found in the function sources', () => {
    const filesWithDashboardRoutes = listFunctionSources(FUNCTIONS_DIR)
      .filter((file) => fs.readFileSync(file, 'utf-8').includes("route: 'dashboard/"))
      .map((file) => path.relative(FUNCTIONS_DIR, file).split(path.sep).join('/'));

    expect(filesWithDashboardRoutes.filter((file) => !IMPORTED_MODULES.includes(file))).toEqual([]);
    expect(routes).toHaveLength(EXPECTED_ROUTE_COUNT);
  });

  it.each(routes)('returns 403 without touching storage when a non-admin calls %s', async (_name, registration) => {
    const response = await registration.handler(fakeRequest(NON_ADMIN), fakeContext());

    expect(response.status).toBe(403);
    expect(createTableClient).not.toHaveBeenCalled();
  });

  it.each(routes)('returns 401 when no principal calls %s', async (_name, registration) => {
    const response = await registration.handler(fakeRequest(), fakeContext());

    expect(response.status).toBe(401);
    expect(createTableClient).not.toHaveBeenCalled();
  });
});
