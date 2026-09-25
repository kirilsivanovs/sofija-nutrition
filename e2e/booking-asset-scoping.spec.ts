import { expect, test } from '@playwright/test';

// Matches the hashed booking.css chunk or booking-calendar.js script, not
// unrelated requests such as the admin dashboard's /api/dashboard/bookings.
const isBookingAsset = (url: string) => !url.includes('/api/') && /booking/i.test(url);

test('requests a booking stylesheet and the booking calendar script on the landing page', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  expect(requests.some(isBookingAsset)).toBe(true);
});

test('requests no booking asset on /cabinet', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/cabinet');
  expect(requests.some(isBookingAsset)).toBe(false);
});

test('requests no booking asset on /terms/', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/terms/');
  expect(requests.some(isBookingAsset)).toBe(false);
});

test('requests no booking asset on /privacy-policy/', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/privacy-policy/');
  expect(requests.some(isBookingAsset)).toBe(false);
});

test('requests no booking asset on /admin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/admin');
  expect(requests.some(isBookingAsset)).toBe(false);
});
