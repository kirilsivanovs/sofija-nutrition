import { expect, test } from '@playwright/test';
import { signInAsAdmin, signInAsPatient } from './support/signed-in';

// SWA enforces sign-in on deployed hosts (staticwebapp.config.json), so the stubs only make sense locally.
test.skip(({ baseURL }) => !baseURL?.startsWith('http://localhost'), 'local dev server only');

test('opens the add-food dialog when a synthetic patient is signed in', async ({ page }) => {
  await signInAsPatient(page);
  await page.goto('/cabinet');
  await expect(page.locator('#diary')).toBeVisible();
  await page.locator('#fab-add').click();
  await expect(page.locator('#add-sheet')).toHaveAttribute('open', '');
});

test('shows the admin dashboard when a synthetic admin is signed in', async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto('/admin/');
  await expect(page.locator('#admin-content')).toBeVisible();
  await expect(page.locator('#unauthorized-page')).toBeHidden();
});

const screenshotPrefix = process.env.SIGNED_IN_SCREENSHOT_PREFIX;

test('saves signed-in screenshots when SIGNED_IN_SCREENSHOT_PREFIX is set', async ({ page }) => {
  test.skip(!screenshotPrefix, 'set SIGNED_IN_SCREENSHOT_PREFIX to take screenshots');
  const pages = [
    { name: 'cabinet', path: '/cabinet', waitFor: '#diary', signIn: signInAsPatient },
    { name: 'admin', path: '/admin/', waitFor: '#admin-content', signIn: signInAsAdmin },
  ];
  for (const { name, path, waitFor, signIn } of pages) {
    await page.unrouteAll();
    await signIn(page);
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator(waitFor)).toBeVisible();
      await page.screenshot({ path: `${screenshotPrefix}-${name}-${width}.png`, fullPage: true });
    }
  }
});
