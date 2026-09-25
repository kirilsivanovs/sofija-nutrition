/**
 * Meals function authorization tests
 * Identity comes only from the SWA client principal; a claimed userId is
 * checked against it, never trusted.
 */
jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

import { HttpRequest, InvocationContext } from '@azure/functions';
import { getMeals, createMeal, updateMeal, deleteMeal, getDailyStats } from '../src/functions/food/meals.function';
import { FoodAccessRepository } from '../src/services/foodAccessRepository';
import { clearMockTables } from './__mocks__/azure-data-tables';

const PATIENT_A = 'patient-a';
const PATIENT_B = 'patient-b';

function encodePrincipal(principal: Record<string, unknown> | null): string | null {
  if (!principal) return null;
  return Buffer.from(JSON.stringify(principal)).toString('base64');
}

function createFakeRequest(options: {
  principal?: Record<string, unknown> | null;
  query?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
}): HttpRequest {
  const headers = new Map<string, string>();
  const encoded = encodePrincipal(options.principal ?? null);
  if (encoded) {
    headers.set('x-ms-client-principal', encoded);
  }

  const query = new URLSearchParams(options.query ?? {});

  return {
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    query,
    params: options.params ?? {},
    json: async () => options.body,
  } as unknown as HttpRequest;
}

function createFakeContext(): InvocationContext {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as InvocationContext;
}

const principalA = { userId: PATIENT_A, identityProvider: 'aad', userDetails: 'patient-a@example.test' };

async function enableAccess(userId: string) {
  const repository = new FoodAccessRepository('DefaultEndpointsProtocol=https;AccountName=test');
  await repository.setAccess(userId, true, {});
}

describe('meals function authorization', () => {
  beforeEach(async () => {
    clearMockTables();
    process.env.AZURE_STORAGE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test==;EndpointSuffix=core.windows.net';
    await enableAccess(PATIENT_A);
  });

  afterEach(() => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
  });

  it('returns 401 when no principal for getMeals', async () => {
    const response = await getMeals(createFakeRequest({ principal: null, query: { userId: PATIENT_A } }), createFakeContext());
    expect(response.status).toBe(401);
  });

  it('returns 401 when no principal for createMeal', async () => {
    const response = await createMeal(createFakeRequest({ principal: null, body: { userId: PATIENT_A, items: [] } }), createFakeContext());
    expect(response.status).toBe(401);
  });

  it('returns 401 when no principal for updateMeal', async () => {
    const response = await updateMeal(
      createFakeRequest({ principal: null, query: { userId: PATIENT_A, date: '2026-05-15' }, params: { mealId: 'meal-1' }, body: {} }),
      createFakeContext()
    );
    expect(response.status).toBe(401);
  });

  it('returns 401 when no principal for deleteMeal', async () => {
    const response = await deleteMeal(
      createFakeRequest({ principal: null, query: { userId: PATIENT_A, date: '2026-05-15' }, params: { mealId: 'meal-1' } }),
      createFakeContext()
    );
    expect(response.status).toBe(401);
  });

  it('returns 401 when no principal for getDailyStats', async () => {
    const response = await getDailyStats(createFakeRequest({ principal: null, query: { userId: PATIENT_A } }), createFakeContext());
    expect(response.status).toBe(401);
  });

  it('returns 403 when userId param differs from principal', async () => {
    const response = await getMeals(
      createFakeRequest({ principal: principalA, query: { userId: PATIENT_B } }),
      createFakeContext()
    );
    expect(response.status).toBe(403);
  });

  it('returns 403 when food access is disabled', async () => {
    const repository = new FoodAccessRepository('DefaultEndpointsProtocol=https;AccountName=test');
    await repository.setAccess(PATIENT_A, false, {});

    const response = await getMeals(
      createFakeRequest({ principal: principalA, query: { userId: PATIENT_A } }),
      createFakeContext()
    );
    expect(response.status).toBe(403);
  });

  it('returns 403 when no food access record exists', async () => {
    const response = await getMeals(
      createFakeRequest({ principal: { userId: PATIENT_B, identityProvider: 'aad' }, query: { userId: PATIENT_B } }),
      createFakeContext()
    );
    expect(response.status).toBe(403);
  });

  it('returns meals of the principal when access is enabled', async () => {
    const response = await getMeals(
      createFakeRequest({ principal: principalA, query: { userId: PATIENT_A, date: '2026-05-15' } }),
      createFakeContext()
    );
    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual([]);
  });

  it('ignores keys and userId in PATCH body', async () => {
    const createResponse = await createMeal(
      createFakeRequest({
        principal: principalA,
        body: {
          userId: PATIENT_A,
          mealType: 'lunch',
          items: [{ name: 'Test', nameEn: 'Test', weight: 100, calories: 100, protein: 1, fat: 1, carbs: 1, confidence: 1, userAdjusted: false }],
          totalCalories: 100,
          totalProtein: 1,
          totalFat: 1,
          totalCarbs: 1,
          confirmed: false,
          createdAt: '2026-05-15T12:00:00.000Z',
        },
      }),
      createFakeContext()
    );
    expect(createResponse.status).toBe(201);
    const created = createResponse.jsonBody as { PartitionKey: string; RowKey: string; userId: string };

    const patchResponse = await updateMeal(
      createFakeRequest({
        principal: principalA,
        query: { userId: PATIENT_A, date: '2026-05-15' },
        params: { mealId: created.RowKey },
        body: {
          PartitionKey: 'not-the-real-partition-key',
          RowKey: 'spoofed-row',
          userId: PATIENT_B,
          mealType: 'dinner',
        },
      }),
      createFakeContext()
    );

    expect(patchResponse.status).toBe(200);
    const updated = patchResponse.jsonBody as { PartitionKey: string; RowKey: string; userId: string; mealType: string };
    expect(updated.PartitionKey).toBe(created.PartitionKey);
    expect(updated.RowKey).toBe(created.RowKey);
    expect(updated.userId).toBe(PATIENT_A);
    expect(updated.mealType).toBe('dinner');
  });

  it('stores POST under the principal partition ignoring client RowKey', async () => {
    const response = await createMeal(
      createFakeRequest({
        principal: principalA,
        body: {
          userId: PATIENT_A,
          RowKey: 'attacker-row',
          mealType: 'breakfast',
          items: [{ name: 'Test', nameEn: 'Test', weight: 100, calories: 100, protein: 1, fat: 1, carbs: 1, confidence: 1, userAdjusted: false }],
          totalCalories: 100,
          totalProtein: 1,
          totalFat: 1,
          totalCarbs: 1,
          confirmed: false,
        },
      }),
      createFakeContext()
    );

    expect(response.status).toBe(201);
    const saved = response.jsonBody as { PartitionKey: string; RowKey: string; userId: string };
    expect(saved.userId).toBe(PATIENT_A);
    expect(saved.PartitionKey.startsWith(`${PATIENT_A}_`)).toBe(true);
    expect(saved.RowKey).not.toBe('attacker-row');
  });

  it('returns 400 when mealId or date is malformed', async () => {
    const badDate = await getMeals(
      createFakeRequest({ principal: principalA, query: { userId: PATIENT_A, date: 'not-a-date' } }),
      createFakeContext()
    );
    expect(badDate.status).toBe(400);

    const badMealId = await updateMeal(
      createFakeRequest({
        principal: principalA,
        query: { userId: PATIENT_A, date: '2026-05-15' },
        params: { mealId: "bad' or '1'='1" },
        body: {},
      }),
      createFakeContext()
    );
    expect(badMealId.status).toBe(400);
  });
});
