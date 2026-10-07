import { expect, test } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sofija Ivanova/i);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('renders no Astro dev toolbar when served locally', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('astro-dev-toolbar')).toHaveCount(0);
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

test('shows the portrait crop and name instead of a burger at 375px on the landing page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await expect(page.locator('.mobile-menu-btn')).toHaveCount(0);
  await expect(page.locator('.app-logo-crop')).toBeVisible();
  await expect(page.locator('.app-logo-name')).toHaveText('Sofija Ivanova');
});

test('shows the pre-footer CTA heading with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  // Old final-CTA band is retired (SN-015.2); question 6's "Kā pieteikties?"
  // is now the heading closest to the footer that needs no JS to render.
  await expect(page.getByRole('heading', { name: /Kā pieteikties/i })).toBeVisible();
  await context.close();
});

test('shows the hero title with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const heroTitle = page.locator('#hero-title');
  await expect(heroTitle).toBeVisible();
  const { opacity, visibility } = await heroTitle.evaluate((el) => {
    const style = getComputedStyle(el);
    return { opacity: style.opacity, visibility: style.visibility };
  });
  expect(opacity).toBe('1');
  expect(visibility).toBe('visible');
  const text = await heroTitle.textContent();
  expect(text?.trim()).not.toBe('');
  await context.close();
});

test('renders a Phosphor icon without contacting an external CDN', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('i.ph.ph-arrow-right').first()).toBeVisible();
  expect(requests.some((u) => u.includes('unpkg.com'))).toBe(false);
});

test('has no WhatsApp link or placeholder phone number in the structured data', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
  const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(ldJson ?? '').not.toContain('+37120000000');
});

test('a direct link to #faq scrolls the FAQ section into view', async ({ page }) => {
  await page.goto('/#faq');
  await expect(page.locator('#faq')).toBeInViewport();
});

test('aligns the header logo, hero title and footer brand on one left edge at every width', async ({
  page,
}) => {
  for (const path of ['/', '/ru/', '/en/']) {
    for (const width of [375, 764, 1024, 1280, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const logoSelector = width > 760 ? '.app-logo-name' : '.app-logo-crop';
      const logo = await page.locator(logoSelector).first().boundingBox();
      const title = await page.locator('.landing-hero__title').first().boundingBox();
      const brand = await page.locator('.site-footer__brand').first().boundingBox();
      const firstLink = await page.locator('.site-footer__links a').first().boundingBox();
      expect(Math.abs(logo!.x - title!.x), `${path} @${width} logo/title`).toBeLessThanOrEqual(1);
      expect(Math.abs(brand!.x - title!.x), `${path} @${width} brand/title`).toBeLessThanOrEqual(1);
      // the link box carries 4px of padding before its text
      expect(Math.abs(firstLink!.x + 4 - title!.x), `${path} @${width} link/title`).toBeLessThanOrEqual(1);
    }
  }
});

test('aligns the header actions with the hero credentials panel on the right edge at desktop widths', async ({
  page,
}) => {
  for (const width of [1024, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const actions = await page.locator('.app-public-actions').first().boundingBox();
    const cred = await page.locator('.hero-cred').first().boundingBox();
    expect(
      Math.abs(actions!.x + actions!.width - (cred!.x + cred!.width)),
      `@${width}`,
    ).toBeLessThanOrEqual(1);
  }
});

test('limits the hero title to four lines in every language at 1024px and 1280px', async ({
  page,
}) => {
  for (const path of ['/', '/ru/', '/en/']) {
    for (const width of [1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const title = page.locator('.landing-hero__title').first();
      const box = await title.boundingBox();
      const lineHeight = await title.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
      expect(Math.round(box!.height / lineHeight), `${path} @${width}`).toBeLessThanOrEqual(4);
    }
  }
});

test('hides the Russian header subtitle and keeps a one-row header below 1160px', async ({
  page,
}) => {
  for (const width of [1024, 1100]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/ru/');
    await expect(page.locator('.app-header--public .app-logo-sub')).toBeHidden();
    const inner = await page.locator('.app-header--public .app-header-inner').boundingBox();
    expect(inner!.height, `@${width}`).toBeLessThanOrEqual(60);
  }
});
