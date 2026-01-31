import { test, expect } from '@playwright/test';

/**
 * Вспомогательная функция для выполнения действий в админке
 */
async function performAdminActions(page, bookedDate, bookedTime, testUserName) {
  // Ждём загрузки календаря админки
  const adminCalendar = page.locator('#calendar-grid');
  await expect(adminCalendar).toBeVisible({ timeout: 15000 });
  
  // Навигация к нужному месяцу
  const [bookedYear, bookedMonth] = bookedDate.split('-').map(Number);
  
  async function getCurrentDisplayedMonth() {
    const monthText = await page.locator('#current-month').textContent();
    const monthNames = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 
                        'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
    const parts = monthText.trim().split(' ');
    const month = monthNames.indexOf(parts[0]) + 1;
    const year = parseInt(parts[1]);
    return { month, year };
  }
  
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
  
  // Обновляем данные бронирований
  await page.locator('#refresh-bookings').click();
  await page.waitForTimeout(2000);
  
  // Ищём день с бронированием
  const dayCell = page.locator(`.calendar-cell[title="${bookedDate}"]`);
  await expect(dayCell).toBeVisible({ timeout: 10000 });
  await dayCell.click();
  
  // Ждём появления панели деталей дня
  const dayDetails = page.locator('#day-details');
  await expect(dayDetails).toBeVisible({ timeout: 5000 });
  
  // Ищём карточку бронирования
  const bookingCard = page.locator('.booking-card', { hasText: testUserName });
  await expect(bookingCard).toBeVisible({ timeout: 5000 });
  
  // Перехватываем confirm диалог
  page.on('dialog', dialog => dialog.accept());
  
  // Подтверждаем бронирование
  const confirmBtn = bookingCard.locator('button:has-text("Apstiprināt")');
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();
  
  await page.waitForTimeout(2000);
  
  // Проверяем подтверждение
  await dayCell.click();
  await expect(dayDetails).toBeVisible();
  const confirmedCard = page.locator('.booking-card.confirmed', { hasText: testUserName });
  await expect(confirmedCard).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Часть 2: Бронирование подтверждено!');
  
  // Отменяем бронирование
  const cancelBtn = confirmedCard.locator('button:has-text("Atcelt")');
  await expect(cancelBtn).toBeVisible();
  await cancelBtn.click();
  
  await page.waitForTimeout(2000);
  
  // Проверяем отмену
  await dayCell.click();
  await expect(dayDetails).toBeVisible();
  const cancelledCard = page.locator('.booking-card.cancelled', { hasText: testUserName });
  await expect(cancelledCard).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Часть 3: Бронирование отменено!');
  console.log('🎉 Полный E2E тест пройден успешно!');
}

/**
 * 🔴 КРИТИЧНЫЙ ТЕСТ: Полное бронирование визита + Админка
 * 
 * Если этот тест падает - КЛИЕНТЫ НЕ МОГУТ ЗАПИСАТЬСЯ К ДОКТОРУ!
 */
test('Полное бронирование: клиент + подтверждение/отмена в админке', async ({ page, context }) => {
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
  // ЧАСТЬ 1.5: ПРОВЕРКА ЧТО СЛОТ ЗАНЯТ
  // ============================================
  
  // 12. Обновляем страницу и проверяем, что забронированное время занято
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  
  // Ждём загрузки календаря
  await expect(page.locator('#bookingCalendar')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000); // Даём время на загрузку API
  
  // Находим забронированный день и кликаем на него
  const bookedDayCell = page.locator(`#bookingCalendar .day[data-date="${bookedDate}"]`);
  await expect(bookedDayCell).toBeVisible({ timeout: 10000 });
  await bookedDayCell.click();
  await page.waitForTimeout(500);
  
  // Проверяем, что забронированное время НЕ отображается как доступное
  // (слот должен быть занят или отсутствовать)
  const bookedTimeSlot = page.locator(`#bookingCalendar .time-slot:has-text("${bookedTime.trim()}")`);
  const isSlotVisible = await bookedTimeSlot.isVisible();
  
  if (isSlotVisible) {
    throw new Error(`❌ Слот ${bookedTime.trim()} всё ещё доступен после бронирования!`);
  }
  
  console.log(`✅ Часть 1.5: Слот ${bookedTime.trim()} успешно занят!`);
  
  // ============================================
  // ЧАСТЬ 2: АДМИН ПОДТВЕРЖДАЕТ БРОНИРОВАНИЕ
  // ============================================
  
  // Переходим в админку (auth state загружается автоматически из playwright.config.js)
  console.log('🔐 Переход в админку с сохранённой авторизацией...');
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  
  // Выполняем действия в админке (уже авторизованы благодаря storageState)
  await performAdminActions(page, bookedDate, bookedTime, testUserName);
});
