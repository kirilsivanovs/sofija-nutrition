import { expect, test, type Page } from '@playwright/test';

// Next week's Monday is always 1-7 days ahead (never today) and the seven days share one rendered week.
// Local date parts match the page's formatDateISO; toISOString() would shift the day in UTC+2/+3.
function nextWeekIsoDates(): string[] {
  const today = new Date();
  const daysUntilNextMonday = 8 - (today.getDay() || 7);
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + daysUntilNextMonday + offset
    );
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    return `${day.getFullYear()}-${month}-${date}`;
  });
}

const fixtureDays = nextWeekIsoDates();

async function mockAvailability(page: Page, slots: Record<string, string[]>) {
  await page.route('**/api/availability**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slots,
        booked: [],
        serviceTypes: [
          {
            id: 'consultation',
            duration: 60,
            name: {
              lv: 'Uztura konsultācija (60 min)',
              ru: 'Консультация по питанию (60 мин)',
              en: 'Nutrition Consultation (60 min)',
            },
            allowOnline: true,
            allowInPerson: true,
          },
        ],
      }),
    });
  });
}

/**
 * E2E Tests for Booking Flow
 * Tests the critical booking path: select a slot (date + time together) → fill form → submit
 */

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
    await mockAvailability(page, {
      [fixtureDays[0]]: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      [fixtureDays[1]]: ['09:00', '10:00', '11:00'],
      [fixtureDays[2]]: ['09:00', '14:00', '15:00', '16:00'],
    });

    // The calendar already fetched real availability on the initial page load;
    // reload so this test's mocked response drives the render deterministically.
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const availableSlot = bookingSection.locator('.slot-btn').first();
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

    // Summary panel should reflect the pick
    await expect(bookingSection.locator('.booking-summary-pick')).toBeVisible({ timeout: 5000 });
  });

  test('can select a slot using only the keyboard', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    await mockAvailability(page, {
      [fixtureDays[0]]: ['09:00', '10:00', '11:00'],
      [fixtureDays[1]]: ['09:00', '14:00', '15:00', '16:00'],
    });
    // The calendar already fetched real availability on the initial page load;
    // reload so this test's mocked response drives the render deterministically.
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const focusedSlot = bookingSection.locator('.slot-btn[tabindex="0"]:visible');
    await focusedSlot.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    const selectedSlot = bookingSection.locator('.slot-btn[aria-pressed="true"]:visible');
    await expect(selectedSlot).toBeVisible({ timeout: 5000 });

    await expect(bookingSection.locator('.booking-summary-pick')).toBeVisible({ timeout: 5000 });
  });

  test('full booking flow with mocked API', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    // Mock availability API
    await mockAvailability(page, {
      [fixtureDays[0]]: ['09:00', '10:00', '11:00', '14:00'],
      [fixtureDays[1]]: ['09:00', '10:00'],
      [fixtureDays[2]]: ['14:00', '15:00'],
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
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

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
    await expect(bookingSection.locator('#formatToggleOnline')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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

    await mockAvailability(page, {
      [fixtureDays[0]]: ['09:00', '10:00', '11:00', '14:00'],
      [fixtureDays[1]]: ['09:00', '10:00'],
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
    await bookingSection.locator('#formatToggleInPerson').click();

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
    await expect(bookingSection.locator('#formatToggleOnline')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
    await mockAvailability(page, { [fixtureDays[0]]: ['09:00', '10:00'] });

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
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

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
    await expect(bookingSection.locator('#formatToggleOnline')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
    await mockAvailability(page, { [fixtureDays[0]]: ['09:00'] });

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
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

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
    await expect(bookingSection.locator('#formatToggleOnline')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
    await mockAvailability(page, { [fixtureDays[0]]: ['09:00'] });

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
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

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
    await expect(bookingSection.locator('#formatToggleOnline')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
    await mockAvailability(page, { [fixtureDays[0]]: ['09:00'] });

    // Mock booking API - abort to simulate a network failure (not a timeout, not offline)
    await page.route('**/api/bookings', async (route) => {
      await route.abort();
    });

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

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
    await expect(bookingSection.locator('#formatToggleOnline')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
    await mockAvailability(page, { [fixtureDays[0]]: ['09:00', '10:00'] });

    await page.reload();
    await expect(bookingSection).toBeVisible();

    // Select a slot
    const availableSlot = bookingSection.locator('.slot-btn').first();
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

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

  async function openBookingForm(page: Page) {
    const bookingSection = page.locator('#bookingCalendar');
    await mockAvailability(page, { [fixtureDays[0]]: ['09:00', '10:00'] });
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const availableSlot = bookingSection.locator('.slot-btn').first();
    await expect(availableSlot).toBeVisible({ timeout: 5000 });
    await availableSlot.click();
    await bookingSection.locator('#formatToggleInPerson').click();

    const continueBtn = bookingSection.locator('.booking-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();
    return bookingSection;
  }

  test('renders consent links inline without padding when the booking form is open', async ({
    page,
  }) => {
    const bookingSection = await openBookingForm(page);
    const links = bookingSection.locator('.consent-checkbox a');
    await expect(links.first()).toBeVisible({ timeout: 5000 });

    for (const link of await links.all()) {
      const style = await link.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          display: computed.display,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
        };
      });
      expect(style).toEqual({ display: 'inline', paddingLeft: '0px', paddingRight: '0px' });
    }
  });

  test('shows a 3px focus outline on the phone wrapper when the phone input is focused', async ({
    page,
  }) => {
    const bookingSection = await openBookingForm(page);
    const phoneInput = bookingSection.locator('input[name="phone"]');
    await expect(phoneInput).toBeVisible({ timeout: 5000 });
    await phoneInput.focus();

    const wrapper = bookingSection.locator('.phone-input-wrapper');
    await expect(wrapper).toHaveCSS('outline-width', '3px');
  });

  test('picking the in-person format releases the online toggle', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    const formatToggleInPerson = bookingSection.locator('#formatToggleInPerson');
    const formatToggleOnline = bookingSection.locator('#formatToggleOnline');

    await formatToggleInPerson.click();

    await expect(formatToggleInPerson).toHaveAttribute('aria-pressed', 'true');
    await expect(formatToggleOnline).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Booking calendar at 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('keeps the next-week button inside the calendar at 375px', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    await mockAvailability(page, {
      [fixtureDays[0]]: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      [fixtureDays[1]]: ['09:00', '10:00', '11:00'],
      [fixtureDays[2]]: ['09:00', '14:00', '15:00', '16:00'],
    });

    // The calendar already fetched real availability on the initial page load;
    // reload so this test's mocked response drives the render deterministically.
    await page.reload();
    await expect(bookingSection).toBeVisible();

    const nextBtn = bookingSection.locator('.week-nav-btn.next');
    const bookingBody = bookingSection.locator('.booking-body');
    await expect(nextBtn).toBeVisible();

    const nextBtnBox = await nextBtn.boundingBox();
    const bookingBodyBox = await bookingBody.boundingBox();
    expect(nextBtnBox).not.toBeNull();
    expect(bookingBodyBox).not.toBeNull();

    const nextBtnRightEdge = nextBtnBox!.x + nextBtnBox!.width;
    const bookingBodyRightEdge = bookingBodyBox!.x + bookingBodyBox!.width;
    expect(nextBtnRightEdge).toBeLessThanOrEqual(bookingBodyRightEdge + 1);
  });

  test('picks a day-strip chip and a slot in the day detail at 375px', async ({ page }) => {
    const bookingSection = page.locator('#bookingCalendar');
    await expect(bookingSection).toBeVisible();

    await mockAvailability(page, {
      [fixtureDays[0]]: ['09:00', '10:00'],
      [fixtureDays[1]]: ['11:00', '14:00'],
    });

    await page.reload();
    await expect(bookingSection).toBeVisible();

    const enabledChips = bookingSection.locator('.week-day-chip:visible[aria-disabled="false"]');
    const targetChip = enabledChips.last();
    await targetChip.click();
    await expect(targetChip).toHaveAttribute('aria-selected', 'true');

    const detailSlot = bookingSection.locator('.week-day-detail .slot-btn:visible').first();
    await detailSlot.click();
    await expect(detailSlot).toHaveAttribute('aria-pressed', 'true');
  });
});
