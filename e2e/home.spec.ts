import { expect, test } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sofija Ivanova/i);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('keeps the hero-to-footer content inside <body> in the raw HTML', async ({ request }) => {
  const response = await request.get('/');
  const html = await response.text();
  const bodyClose = html.indexOf('</body>');
  const mainStart = html.indexOf('<main id="main-content"');
  expect(mainStart).toBeGreaterThan(-1);
  expect(mainStart).toBeLessThan(bodyClose);
  expect(html.trim().endsWith('</html>')).toBe(true);
});
