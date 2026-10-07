import type { Page } from '@playwright/test';
import type { Meal } from '../../shared/types/food';

const PATIENT_ID = 'synthetic-patient-0001';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function stubSignedInPrincipal(page: Page, userId: string, userDetails: string) {
  // Registered first: Playwright runs later routes first, so the specific stubs below win
  // and any unstubbed /api call is answered here instead of reaching the :7071 proxy.
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('**/.auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        clientPrincipal: {
          identityProvider: 'aad',
          userId,
          userDetails,
          userRoles: ['anonymous', 'authenticated'],
        },
      }),
    }),
  );
}

function syntheticMeal(): Meal {
  const date = today();
  return {
    PartitionKey: `${PATIENT_ID}_${date}`,
    RowKey: 'synthetic-meal-one',
    userId: PATIENT_ID,
    mealType: 'breakfast',
    items: [
      {
        name: 'Auzu putra',
        nameEn: 'Oatmeal',
        weight: 200,
        calories: 150,
        protein: 5,
        fat: 3,
        carbs: 27,
        confidence: 1,
        userAdjusted: false,
      },
    ],
    totalCalories: 150,
    totalProtein: 5,
    totalFat: 3,
    totalCarbs: 27,
    confirmed: true,
    createdAt: `${date}T08:00:00.000Z`,
    confirmedAt: `${date}T08:05:00.000Z`,
  };
}

export async function signInAsPatient(page: Page) {
  await stubSignedInPrincipal(page, PATIENT_ID, 'patient@example.test');
  await page.route('**/api/food/access**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"enabled":true}' }),
  );
  await page.route('**/api/meals**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([syntheticMeal()]),
    }),
  );
}

export async function signInAsAdmin(page: Page) {
  await stubSignedInPrincipal(page, 'synthetic-admin-0001', 'admin@example.test');
  await page.route('**/api/dashboard/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}
