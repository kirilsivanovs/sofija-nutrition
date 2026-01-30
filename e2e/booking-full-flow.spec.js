import { test, expect } from '@playwright/test';

/**
 * 🔴 КРИТИЧНЫЙ ТЕСТ: Полное бронирование визита
 * 
 * Если этот тест падает - КЛИЕНТЫ НЕ МОГУТ ЗАПИСАТЬСЯ К ДОКТОРУ!
 */
test('Полное бронирование: от главной страницы до подтверждения', async ({ page }) => {
  // Увеличиваем таймаут для медленных соединений
  test.setTimeout(60000);
  
  // 1. Открываем главную страницу
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // 2. Нажимаем кнопку "Pieteikties" (запись на приём)
  const bookingBtn = page.locator('a[href="#contact"], button:has-text("Pieteikties")').first();
  await expect(bookingBtn).toBeVisible();
  await bookingBtn.click();
  
  // 3. Ждём появления календаря
  const calendar = page.locator('#bookingCalendar');
  await expect(calendar).toBeVisible({ timeout: 10000 });
  
  // 4. Ждём загрузки доступных дат (API) и кликаем на первую
  const availableDay = page.locator('#bookingCalendar .day.available').first();
  await expect(availableDay).toBeVisible({ timeout: 15000 });
  await availableDay.click();
  
  // 5. Выбираем первый доступный слот времени
  const timeSlot = page.locator('#bookingCalendar .time-slot').first();
  await expect(timeSlot).toBeVisible({ timeout: 5000 });
  await timeSlot.click();
  
  // 6. Форма должна появиться
  const bookingForm = page.locator('#bookingCalendar .booking-form-section');
  await expect(bookingForm).toBeVisible({ timeout: 5000 });
  
  // 7. Выбираем формат консультации (онлайн)
  await page.locator('#bookingCalendar label.format-option').first().click();
  
  // 8. Заполняем обязательные поля
  await page.locator('#bookingCalendar input[name="name"]').fill('E2E Test User');
  await page.locator('#bookingCalendar input[name="email"]').fill('e2e-test@example.com');
  
  // 9. Нажимаем кнопку подтверждения
  const submitBtn = page.locator('#bookingCalendar .booking-submit-btn');
  await submitBtn.click();
  
  // 10. Проверяем появление модального окна успеха
  const successModal = page.locator('#bookingCalendar .booking-success-modal');
  await expect(successModal).toBeVisible({ timeout: 10000 });
  
  console.log('✅ Бронирование успешно завершено!');
});
