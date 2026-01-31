import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Получаем E2E токен из auth state или env
 */
function getE2EToken() {
  // Сначала пробуем из environment variable
  if (process.env.E2E_TEST_TOKEN) {
    return process.env.E2E_TEST_TOKEN;
  }
  
  // Затем из auth state файла
  const authFile = path.join(__dirname, '../.auth/admin.json');
  if (fs.existsSync(authFile)) {
    const authState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    if (authState.e2eToken) {
      return authState.e2eToken;
    }
    // Проверяем localStorage
    const origin = authState.origins?.find(o => o.localStorage);
    const tokenEntry = origin?.localStorage?.find(l => l.name === 'e2e_token');
    if (tokenEntry) {
      return tokenEntry.value;
    }
  }
  return null;
}

/**
 * Выполняем админ-действия через API напрямую (обходит SWA auth)
 */
async function performAdminActionsViaAPI(request, apiBase, e2eToken, bookedDate, testUserName) {
  const headers = { 'X-E2E-Token': e2eToken };
  
  // 1. Получаем список бронирований
  console.log(`📋 Загружаем бронирования...`);
  
  const bookingsResponse = await request.get(`${apiBase}/dashboard/bookings`, { headers });
  
  if (!bookingsResponse.ok()) {
    const errorText = await bookingsResponse.text();
    throw new Error(`❌ Ошибка загрузки бронирований: ${bookingsResponse.status()} - ${errorText}`);
  }
  
  const bookingsData = await bookingsResponse.json();
  
  // Ищем наше тестовое бронирование
  const testBooking = bookingsData.bookings?.find(b => 
    b.name === testUserName || b.clientName === testUserName
  );
  
  if (!testBooking) {
    console.log('Все бронирования:', JSON.stringify(bookingsData.bookings?.slice(0, 5), null, 2));
    throw new Error(`❌ Тестовое бронирование "${testUserName}" не найдено в API!`);
  }
  
  const bookingId = testBooking.id;
  console.log(`✅ Найдено бронирование: ${bookingId}`);
  
  // 2. Подтверждаем бронирование (PATCH с status: confirmed)
  console.log(`📝 Подтверждаем бронирование ${bookingId}...`);
  
  const confirmResponse = await request.patch(`${apiBase}/dashboard/bookings/${bookingId}`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: { status: 'confirmed' }
  });
  
  if (!confirmResponse.ok()) {
    const errorText = await confirmResponse.text();
    throw new Error(`❌ Ошибка подтверждения: ${confirmResponse.status()} - ${errorText}`);
  }
  
  console.log('✅ Часть 2: Бронирование подтверждено через API!');
  
  // 3. Отменяем бронирование (PATCH с status: cancelled)
  console.log(`❌ Отменяем бронирование ${bookingId}...`);
  
  const cancelResponse = await request.patch(`${apiBase}/dashboard/bookings/${bookingId}`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: { status: 'cancelled' }
  });
  
  if (!cancelResponse.ok()) {
    const errorText = await cancelResponse.text();
    throw new Error(`❌ Ошибка отмены: ${cancelResponse.status()} - ${errorText}`);
  }
  
  console.log('✅ Часть 3: Бронирование отменено через API!');
  console.log('🎉 Полный E2E тест пройден успешно!');
}

/**
 * 🔴 КРИТИЧНЫЙ ТЕСТ: Полное бронирование визита + Админка
 * 
 * Если этот тест падает - КЛИЕНТЫ НЕ МОГУТ ЗАПИСАТЬСЯ К ДОКТОРУ!
 */
test('Полное бронирование: клиент + подтверждение/отмена в админке', async ({ page, request }) => {
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
  // ЧАСТЬ 2+3: АДМИН ДЕЙСТВИЯ ЧЕРЕЗ API
  // ============================================
  
  const e2eToken = getE2EToken();
  
  if (!e2eToken) {
    console.log('⚠️  E2E_TEST_TOKEN не настроен - пропускаем админ-часть теста');
    console.log('   Для полного теста настройте E2E_TEST_TOKEN в Azure и GitHub');
    console.log('✅ Часть 1 (клиентское бронирование) пройдена успешно!');
    return;
  }
  
  // Используем API напрямую с E2E токеном (обходит SWA auth)
  const apiBase = 'https://sofija-nutrition-api.azurewebsites.net/api';
  
  await performAdminActionsViaAPI(request, apiBase, e2eToken, bookedDate, testUserName);
});
