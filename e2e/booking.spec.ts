import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Booking Flow
 * Tests the critical booking path: select date → select time → fill form → submit
 */

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for cookie consent banner to appear and dismiss it
    const banner = page.locator('#cookie-consent-banner');
    const rejectBtn = page.locator('#consent-reject-all');
    try {
      await banner.waitFor({ state: 'visible', timeout: 5000 });
      await rejectBtn.click();
      await banner.waitFor({ state: 'detached', timeout: 5000 });
    } catch {
      // Banner may not appear if cookies already accepted
    }
  });

  test('booking section is visible and calendar renders', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Calendar should have month navigation
    await expect(bookingSection.locator('.calendar-nav')).toBeVisible();
  });

  test('can navigate to next month in calendar', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Find and click next month button
    const nextBtn = bookingSection
      .locator('button:has(i.ph-caret-right), .calendar-next-btn, [aria-label*="next"]')
      .first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // Calendar should still be visible after navigation
      await expect(bookingSection).toBeVisible();
    }
  });

  test('can select an available date and see time slots', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability API to return available slots
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableDates: {
            '2026-05-18': ['09:00', '10:00', '11:00', '14:00', '15:00'],
            '2026-05-19': ['09:00', '10:00', '11:00'],
            '2026-05-20': ['09:00', '14:00', '15:00', '16:00'],
          },
        }),
      });
    });

    // Click on an available date (weekday)
    const availableDay = bookingSection
      .locator('.calendar-day:not(.disabled):not(.weekend)')
      .first();
    if (await availableDay.isVisible()) {
      await availableDay.click();

      // Time slots should appear
      const timeSlots = bookingSection.locator('.time-slot, .time-btn, [class*="time"]');
      await expect(timeSlots.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('full booking flow with mocked API', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability API
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableDates: {
            '2026-05-18': ['09:00', '10:00', '11:00', '14:00'],
            '2026-05-19': ['09:00', '10:00'],
            '2026-05-20': ['14:00', '15:00'],
          },
        }),
      });
    });

    // Mock booking API - success response
    await page.route('**/api/bookings', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');

      // Verify required fields are sent
      expect(body.name).toBeTruthy();
      expect(body.email).toContain('@');
      expect(body.date).toBeTruthy();
      expect(body.time).toBeTruthy();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          bookingId: 'TEST-12345',
          booking: {
            id: 'TEST-12345',
            bookingId: 'TEST-12345',
            name: body.name,
            email: body.email,
            date: body.date,
            time: body.time,
            service: body.service || 'consultation',
            serviceName: 'Konsultācija',
            price: 65,
          },
        }),
      });
    });

    // Step 1: Select a date
    const availableDay = bookingSection
      .locator('.calendar-day:not(.disabled):not(.weekend)')
      .first();
    if (!(await availableDay.isVisible())) {
      test.skip();
      return;
    }
    await availableDay.click();

    // Step 2: Select a time slot
    const timeSlot = bookingSection.locator('.time-slot, .time-btn, [class*="time-slot"]').first();
    await expect(timeSlot).toBeVisible({ timeout: 5000 });
    await timeSlot.click();

    // Step 3: Fill the booking form
    const nameInput = bookingSection.locator('input[name="name"]');
    const emailInput = bookingSection.locator('input[name="email"]');
    const phoneInput = bookingSection.locator('input[name="phone"]');

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await phoneInput.fill('+37120000000');

    // Step 4: Submit booking
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Step 5: Verify success state
    const successMessage = page
      .locator('[class*="success"], [class*="modal"]')
      .filter({ hasText: /TEST-12345|veiksmīga|success/i });
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('shows error when slot is already taken (409)', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability API
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableDates: {
            '2026-05-18': ['09:00', '10:00'],
          },
        }),
      });
    });

    // Mock booking API - 409 conflict (slot taken)
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Time slot already booked',
          code: 'SLOT_ALREADY_BOOKED',
        }),
      });
    });

    // Select date and time
    const availableDay = bookingSection
      .locator('.calendar-day:not(.disabled):not(.weekend)')
      .first();
    if (!(await availableDay.isVisible())) {
      test.skip();
      return;
    }
    await availableDay.click();

    const timeSlot = bookingSection.locator('.time-slot, .time-btn, [class*="time-slot"]').first();
    await expect(timeSlot).toBeVisible({ timeout: 5000 });
    await timeSlot.click();

    // Fill form
    const nameInput = bookingSection.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test User');
    await bookingSection.locator('input[name="email"]').fill('test@example.com');

    // Submit
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await submitBtn.click();

    // Should show error about slot being taken
    const errorMessage = page
      .locator('[class*="error"], [class*="modal"]')
      .filter({ hasText: /aizņemts|taken|занят/i });
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('shows rate limit error (429)', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableDates: { '2026-05-18': ['09:00'] },
        }),
      });
    });

    // Mock booking API - 429 rate limited
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests' }),
      });
    });

    // Select date and time
    const availableDay = bookingSection
      .locator('.calendar-day:not(.disabled):not(.weekend)')
      .first();
    if (!(await availableDay.isVisible())) {
      test.skip();
      return;
    }
    await availableDay.click();

    const timeSlot = bookingSection.locator('.time-slot, .time-btn, [class*="time-slot"]').first();
    await expect(timeSlot).toBeVisible({ timeout: 5000 });
    await timeSlot.click();

    // Fill minimal form
    const nameInput = bookingSection.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test');
    await bookingSection.locator('input[name="email"]').fill('test@example.com');

    // Submit
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await submitBtn.click();

    // Should show rate limit error
    const errorMessage = page.locator('[class*="error"], [class*="modal"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('booking form validates required fields', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableDates: { '2026-05-18': ['09:00', '10:00'] },
        }),
      });
    });

    // Select date and time
    const availableDay = bookingSection
      .locator('.calendar-day:not(.disabled):not(.weekend)')
      .first();
    if (!(await availableDay.isVisible())) {
      test.skip();
      return;
    }
    await availableDay.click();

    const timeSlot = bookingSection.locator('.time-slot, .time-btn, [class*="time-slot"]').first();
    await expect(timeSlot).toBeVisible({ timeout: 5000 });
    await timeSlot.click();

    // Try to submit without filling required fields
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Form should not submit - check that we're still on the form
      // (no success message, no API call made)
      const nameInput = bookingSection.locator('input[name="name"]');
      await expect(nameInput).toBeVisible();
    }
  });
});
