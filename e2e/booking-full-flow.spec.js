import { test, expect } from '@playwright/test';

/**
 * 🔴 КРИТИЧНЫЙ ТЕСТ: Полное бронирование визита + Админка
 * 
 * Если этот тест падает - КЛИЕНТЫ НЕ МОГУТ ЗАПИСАТЬСЯ К ДОКТОРУ!
 */
test('Полное бронирование: клиент + подтверждение/отмена в админке', async ({ page }) => {
  // Увеличиваем таймаут для медленных соединений
  test.setTimeout(120000);
  
  // ============================================
  // ЧАСТЬ 1: КЛИЕНТ ДЕЛАЕТ БРОНИРОВАНИЕ
  // ============================================
  
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
  
  // 4. Ждём загрузки доступных дат (API)
  // Ждём пока появится хотя бы один доступный день
  await page.waitForTimeout(2000); // Даём время на загрузку API
  
  // Выбираем первый рабочий день (пропускаем выходные)
  // API не возвращает слоты для выходных, поэтому ищем день с data-date, который есть в API
  const availableDays = page.locator('#bookingCalendar .day.available');
  await expect(availableDays.first()).toBeVisible({ timeout: 15000 });
  
  // Кликаем на первый доступный день и проверяем, что есть слоты
  let bookedDate = null;
  const daysCount = await availableDays.count();
  
  for (let i = 0; i < daysCount; i++) {
    const day = availableDays.nth(i);
    const dateStr = await day.getAttribute('data-date');
    
    // Пропускаем выходные (субботу и воскресенье)
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = воскресенье, 6 = суббота
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`⏭️ Пропускаем выходной: ${dateStr}`);
      continue;
    }
    
    await day.click();
    await page.waitForTimeout(500);
    
    // Проверяем, появились ли слоты времени
    const timeSlots = page.locator('#bookingCalendar .time-slot');
    const slotsCount = await timeSlots.count();
    if (slotsCount > 0) {
      bookedDate = dateStr;
      console.log(`📅 Бронируем дату: ${bookedDate} (${slotsCount} слотов)`);
      break;
    }
  }
  
  if (!bookedDate) {
    throw new Error('Не найден рабочий день с доступными слотами');
  }
  
  // 5. Выбираем первый доступный слот времени
  const timeSlot = page.locator('#bookingCalendar .time-slot').first();
  await expect(timeSlot).toBeVisible({ timeout: 5000 });
  const bookedTime = await timeSlot.textContent();
  console.log(`🕐 Бронируем время: ${bookedTime}`);
  await timeSlot.click();
  
  // 6. Форма должна появиться
  const bookingForm = page.locator('#bookingCalendar .booking-form-section');
  await expect(bookingForm).toBeVisible({ timeout: 5000 });
  
  // 7. Скроллим к форме чтобы все элементы были видны
  await bookingForm.scrollIntoViewIfNeeded();
  
  // 8. Выбираем формат консультации (кликаем на опцию "Klātienē" в форме)
  await bookingForm.getByText('Klātienē', { exact: true }).click();
  
  // 9. Заполняем обязательные поля - уникальное имя для поиска
  const testUserName = `E2E Test ${Date.now()}`;
  await page.locator('#bookingCalendar input[name="name"]').fill(testUserName);
  await page.locator('#bookingCalendar input[name="email"]').fill('e2e-test@example.com');
  
  // 10. Нажимаем кнопку подтверждения
  const submitBtn = page.locator('#bookingCalendar .booking-submit-btn');
  await submitBtn.click();
  
  // 11. Проверяем появление модального окна успеха
  const successModal = page.locator('#bookingCalendar .booking-success-modal');
  await expect(successModal).toBeVisible({ timeout: 10000 });
  
  console.log('✅ Часть 1: Бронирование успешно создано!');
  
  // ============================================
  // ЧАСТЬ 2: АДМИН ПОДТВЕРЖДАЕТ БРОНИРОВАНИЕ
  // ============================================
  
  // 12. Переходим в админку (потребуется авторизация Microsoft)
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  
  // 13. Если нужна авторизация Microsoft
  // Проверяем, попали ли мы на страницу входа Microsoft
  const currentUrl = page.url();
  if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('login.live.com')) {
    console.log('🔐 Авторизация Microsoft...');
    
    // Вводим email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('ivanovs.kirils95@gmail.com');
    await page.locator('input[type="submit"], button[type="submit"]').click();
    
    // Ждём страницу пароля
    await page.waitForTimeout(2000);
    
    // Вводим пароль
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('Natavasja1!');
    await page.locator('input[type="submit"], button[type="submit"]').click();
    
    // Если спросит "Stay signed in?" - нажимаем No
    await page.waitForTimeout(3000);
    const staySignedIn = page.locator('input[value="No"], button:has-text("No")');
    if (await staySignedIn.isVisible()) {
      await staySignedIn.click();
    }
    
    // Ждём перенаправления обратно в админку
    await page.waitForURL('**/admin**', { timeout: 30000 });
    console.log('🔓 Авторизация успешна!');
  }
  
  // 14. Ждём загрузки календаря админки
  const adminCalendar = page.locator('#calendar-grid');
  await expect(adminCalendar).toBeVisible({ timeout: 15000 });
  
  // 14.1 Навигация к нужному месяцу (bookedDate формат YYYY-MM-DD)
  const [bookedYear, bookedMonth] = bookedDate.split('-').map(Number);
  
  // Функция для получения текущего отображаемого месяца
  async function getCurrentDisplayedMonth() {
    const monthText = await page.locator('#current-month').textContent();
    // Формат: "Februāris 2026"
    const monthNames = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 
                        'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
    const parts = monthText.trim().split(' ');
    const month = monthNames.indexOf(parts[0]) + 1;
    const year = parseInt(parts[1]);
    return { month, year };
  }
  
  // Навигируем к нужному месяцу
  let displayedMonth = await getCurrentDisplayedMonth();
  const targetDate = new Date(bookedYear, bookedMonth - 1, 1);
  const displayedDate = new Date(displayedMonth.year, displayedMonth.month - 1, 1);
  
  while (displayedDate < targetDate) {
    await page.locator('#next-month').click();
    await page.waitForTimeout(500);
    displayedMonth = await getCurrentDisplayedMonth();
    displayedDate.setFullYear(displayedMonth.year);
    displayedDate.setMonth(displayedMonth.month - 1);
  }
  
  while (displayedDate > targetDate) {
    await page.locator('#prev-month').click();
    await page.waitForTimeout(500);
    displayedMonth = await getCurrentDisplayedMonth();
    displayedDate.setFullYear(displayedMonth.year);
    displayedDate.setMonth(displayedMonth.month - 1);
  }
  
  console.log(`📅 Админ-календарь: ${displayedMonth.month}/${displayedMonth.year}`);
  
  // 15. Обновляем данные бронирований (новая запись может ещё не отображаться)
  await page.locator('#refresh-bookings').click();
  await page.waitForTimeout(2000);
  
  // 16. Ищём день с бронированием (по дате)
  // В админ-календаре используется атрибут title, а не data-date
  const dayCell = page.locator(`.calendar-cell[title="${bookedDate}"]`);
  await expect(dayCell).toBeVisible({ timeout: 10000 });
  await dayCell.click();
  
  // 17. Ждём появления панели деталей дня
  const dayDetails = page.locator('#day-details');
  await expect(dayDetails).toBeVisible({ timeout: 5000 });
  
  // 18. Ищём карточку бронирования с нашим тестовым пользователем
  const bookingCard = page.locator('.booking-card', { hasText: testUserName });
  await expect(bookingCard).toBeVisible({ timeout: 5000 });
  
  // 19. Нажимаем кнопку "Apstiprināt" (подтвердить)
  // Перехватываем confirm диалог
  page.on('dialog', dialog => dialog.accept());
  
  const confirmBtn = bookingCard.locator('button:has-text("Apstiprināt")');
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();
  
  // 18. Ждём обновления статуса
  await page.waitForTimeout(2000);
  
  // Проверяем что бронирование перешло в статус "Apstiprināts"
  await dayCell.click();
  await expect(dayDetails).toBeVisible();
  const confirmedCard = page.locator('.booking-card.confirmed', { hasText: testUserName });
  await expect(confirmedCard).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Часть 2: Бронирование подтверждено!');
  
  // ============================================
  // ЧАСТЬ 3: АДМИН ОТМЕНЯЕТ БРОНИРОВАНИЕ
  // ============================================
  
  // 19. Нажимаем кнопку "Atcelt" (отменить)
  const cancelBtn = confirmedCard.locator('button:has-text("Atcelt")');
  await expect(cancelBtn).toBeVisible();
  await cancelBtn.click();
  
  // 20. Ждём обновления статуса
  await page.waitForTimeout(2000);
  
  // Проверяем что бронирование перешло в статус "Atcelts"
  await dayCell.click();
  await expect(dayDetails).toBeVisible();
  const cancelledCard = page.locator('.booking-card.cancelled', { hasText: testUserName });
  await expect(cancelledCard).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Часть 3: Бронирование отменено!');
  console.log('🎉 Полный E2E тест пройден успешно!');
});
