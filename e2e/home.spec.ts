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

test('shows exactly one header element on the landing page', async ({ page }) => {
  await page.goto('/');
  // Scoped to body > header: the dev-only astro-dev-toolbar custom element
  // renders its own <header>s inside a shadow root, which a bare 'header'
  // locator also matches since Playwright pierces open shadow roots.
  await expect(page.locator('body > header')).toHaveCount(1);
});

test('opens and closes the mobile nav menu from the single AppHeader burger button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const btn = page.locator('.mobile-menu-btn');
  await btn.click();
  await expect(page.locator('.mobile-nav-menu')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-nav-menu')).not.toHaveClass(/open/);
  await expect(btn).toBeFocused();
});

test('shows the pre-footer CTA heading with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /labāku veselību/i })).toBeVisible();
  await context.close();
});

test('renders a Phosphor icon without contacting an external CDN', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('i.ph.ph-arrow-right').first()).toBeVisible();
  expect(requests.some((u) => u.includes('unpkg.com'))).toBe(false);
});
