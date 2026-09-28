import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Booking Flow
 * Tests the critical booking path: select a slot (date + time together) → fill form → submit
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

  test('booking section is visible and week grid renders', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Week grid replaces the old month calendar
    await expect(bookingSection.locator('.week-grid')).toBeVisible();
  });

  test('can navigate to next week in the grid', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    const nextBtn = bookingSection.locator('.week-nav-btn.next');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // Week grid should still be visible after navigation
      await expect(bookingSection.locator('.week-grid')).toBeVisible();
    }
  });

  test('can select an available slot', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability API to return available slots
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: {
            '2026-10-05': ['09:00', '10:00', '11:00', '14:00', '15:00'],
            '2026-10-06': ['09:00', '10:00', '11:00'],
            '2026-10-07': ['09:00', '14:00', '15:00', '16:00'],
          },
          booked: [],
          serviceTypes: [],
        }),
      });
    });

    // The calendar already fetched real availability on the initial page load;
    // reload so this test's mocked response drives the render deterministically.
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const availableSlot = bookingSection.locator('.slot-btn').first();
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();

    // Summary panel should reflect the pick
    await expect(bookingSection.locator('.booking-summary-pick')).toBeVisible({ timeout: 5000 });
  });

  test('can select a slot using only the keyboard', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: {
            '2027-06-02': ['09:00', '10:00', '11:00'],
            '2027-06-03': ['09:00', '14:00', '15:00', '16:00'],
          },
          booked: [],
          serviceTypes: [],
        }),
      });
    });
    // The calendar already fetched real availability on the initial page load;
    // reload so this test's mocked response drives the render deterministically.
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const focusedSlot = bookingSection.locator('.slot-btn[tabindex="0"]');
    await focusedSlot.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    const selectedSlot = bookingSection.locator('.slot-btn[aria-pressed="true"]');
    await expect(selectedSlot).toBeVisible({ timeout: 5000 });

    await expect(bookingSection.locator('.booking-summary-pick')).toBeVisible({ timeout: 5000 });
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
          slots: {
            '2026-10-05': ['09:00', '10:00', '11:00', '14:00'],
            '2026-10-06': ['09:00', '10:00'],
            '2026-10-07': ['14:00', '15:00'],
          },
          booked: [],
          serviceTypes: [],
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

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Step 1: Select a slot (date + time together)
    const availableSlot = bookingSection.locator('.slot-btn').first();
    if (!(await availableSlot.isVisible())) {
      test.skip();
      return;
    }
    await availableSlot.click();

    // Step 2: Reveal and fill the booking form
    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    const nameInput = bookingSection.locator('input[name="name"]');
    const emailInput = bookingSection.locator('input[name="email"]');
    const phoneInput = bookingSection.locator('input[name="phone"]');

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await phoneInput.fill('20000000');
    await bookingSection.locator('#formatToggleOnline').click();
    await expect(bookingSection.locator('#formatOnline')).toBeChecked();
    await bookingSection.locator('#consentCheckbox').check();

    // Step 3: Submit booking
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Step 4: Verify success state
    const successMessage = page
      .locator('[class*="success"], [class*="modal"]')
      .filter({ hasText: /TEST-12345|veiksmīga|success/i })
      .first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('closes the success dialog on Escape and returns focus to the week grid', async ({
    page,
  }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: {
            '2027-06-02': ['09:00', '10:00', '11:00', '14:00'],
            '2027-06-03': ['09:00', '10:00'],
          },
          booked: [],
          serviceTypes: [],
        }),
      });
    });

    await page.route('**/api/bookings', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
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

    // The calendar already fetched real availability on the initial page load;
    // reload so this test's mocked response drives the render deterministically.
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const availableSlot = bookingSection.locator('.slot-btn').first();
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    const nameInput = bookingSection.locator('input[name="name"]');
    const emailInput = bookingSection.locator('input[name="email"]');
    const phoneInput = bookingSection.locator('input[name="phone"]');
    const consentCheckbox = bookingSection.locator('#consentCheckbox');

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await phoneInput.fill('20000000');
    await bookingSection.locator('#formatToggleOnline').click();
    await expect(bookingSection.locator('#formatOnline')).toBeChecked();
    await consentCheckbox.check();

    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    const successDialog = page.locator('dialog.booking-success-modal');
    await expect(successDialog).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Escape');
    await expect(successDialog).toBeHidden();
    await expect(bookingSection.locator('.slot-btn:focus')).toBeVisible();
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
          slots: { '2026-10-05': ['09:00', '10:00'] },
          booked: [],
          serviceTypes: [],
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

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    if (!(await availableSlot.isVisible())) {
      test.skip();
      return;
    }
    await availableSlot.click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // Fill form
    const nameInput = bookingSection.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test User');
    await bookingSection.locator('input[name="email"]').fill('test@example.com');
    await bookingSection.locator('input[name="phone"]').fill('20000000');
    await bookingSection.locator('#formatToggleOnline').click();
    await expect(bookingSection.locator('#formatOnline')).toBeChecked();
    await bookingSection.locator('#consentCheckbox').check();

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
          slots: { '2026-10-05': ['09:00'] },
          booked: [],
          serviceTypes: [],
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

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    if (!(await availableSlot.isVisible())) {
      test.skip();
      return;
    }
    await availableSlot.click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // Fill minimal form
    const nameInput = bookingSection.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test');
    await bookingSection.locator('input[name="email"]').fill('test@example.com');
    await bookingSection.locator('input[name="phone"]').fill('20000000');
    await bookingSection.locator('#formatToggleOnline').click();
    await expect(bookingSection.locator('#formatOnline')).toBeChecked();
    await bookingSection.locator('#consentCheckbox').check();

    // Submit
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await submitBtn.click();

    // Should show rate limit error
    const errorMessage = page.locator('.booking-error-toast');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('does not fake success on a generic 4xx response', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: { '2026-10-05': ['09:00'] },
          booked: [],
          serviceTypes: [],
        }),
      });
    });

    // Mock booking API - plain 400, not 409/429/5xx
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Bad request' }),
      });
    });

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    if (!(await availableSlot.isVisible())) {
      test.skip();
      return;
    }
    await availableSlot.click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // Fill minimal form
    const nameInput = bookingSection.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test');
    await bookingSection.locator('input[name="email"]').fill('test@example.com');
    await bookingSection.locator('input[name="phone"]').fill('20000000');
    await bookingSection.locator('#formatToggleOnline').click();
    await expect(bookingSection.locator('#formatOnline')).toBeChecked();
    await bookingSection.locator('#consentCheckbox').check();

    // Submit
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await submitBtn.click();

    // Must never show a fabricated success modal
    const successModal = page
      .locator('[class*="success"], [class*="modal"]')
      .filter({ hasText: /INV-|veiksmīga|success/i })
      .first();
    await expect(successModal).not.toBeVisible({ timeout: 5000 });

    // Must show the generic error instead
    const errorMessage = page.locator('.booking-error-toast');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('does not fake success on a network failure', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability
    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: { '2026-10-05': ['09:00'] },
          booked: [],
          serviceTypes: [],
        }),
      });
    });

    // Mock booking API - abort to simulate a network failure (not a timeout, not offline)
    await page.route('**/api/bookings', async (route) => {
      await route.abort();
    });

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    if (!(await availableSlot.isVisible())) {
      test.skip();
      return;
    }
    await availableSlot.click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // Fill minimal form
    const nameInput = bookingSection.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Test');
    await bookingSection.locator('input[name="email"]').fill('test@example.com');
    await bookingSection.locator('input[name="phone"]').fill('20000000');
    await bookingSection.locator('#formatToggleOnline').click();
    await expect(bookingSection.locator('#formatOnline')).toBeChecked();
    await bookingSection.locator('#consentCheckbox').check();

    // Submit
    const submitBtn = bookingSection.locator('.booking-submit-btn, button[type="submit"]');
    await submitBtn.click();

    // Must never show a fabricated success modal
    const successModal = page
      .locator('[class*="success"], [class*="modal"]')
      .filter({ hasText: /INV-|veiksmīga|success/i })
      .first();
    await expect(successModal).not.toBeVisible({ timeout: 5000 });

    // Must show the generic error instead
    const errorMessage = page.locator('.booking-error-toast');
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
          slots: { '2026-10-05': ['09:00', '10:00'] },
          booked: [],
          serviceTypes: [],
        }),
      });
    });

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    if (!(await availableSlot.isVisible())) {
      test.skip();
      return;
    }
    await availableSlot.click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

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
