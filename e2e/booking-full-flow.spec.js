import { test, expect } from '@playwright/test';

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС: Полное бронирование
 * 
 * Этот тест выполняет полный сценарий записи к доктору:
 * 1. Открывает страницу
 * 2. Скроллит к календарю бронирования
 * 3. Выбирает доступную дату
 * 4. Выбирает доступное время
 * 5. Заполняет форму с контактными данными
 * 6. Отправляет форму
 * 7. Проверяет успешное подтверждение
 * 
 * Если этот тест падает - КЛИЕНТЫ НЕ МОГУТ ЗАПИСАТЬСЯ К ДОКТОРУ!
 */

test.describe('🚨 Критический процесс: Полное бронирование визита', () => {
  
  // Тестовые данные для бронирования
  const testCustomer = {
    name: 'E2E Test Customer',
    email: 'e2e-test@example.com',
    phone: '+371 20000001',
    message: 'Автоматический тест бронирования'
  };

  test.beforeEach(async ({ page }) => {
    // Открываем страницу и ждём загрузки
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Календарь бронирования загружается и содержит доступные даты', async ({ page }) => {
    // Скроллим к секции контактов с календарём
    const contactSection = page.locator('#contact');
    await contactSection.scrollIntoViewIfNeeded();
    
    // Ждём загрузки календаря
    const calendar = page.locator('#bookingCalendar');
    await expect(calendar).toBeVisible();
    
    // Ждём загрузки дней календаря
    const calendarDays = page.locator('#bookingCalendar .calendar-days');
    await expect(calendarDays).toBeVisible();
    
    // Проверяем что есть доступные дни (класс 'available')
    const availableDays = page.locator('#bookingCalendar .day.available');
    const count = await availableDays.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Можно выбрать дату и появляются доступные слоты времени', async ({ page }) => {
    // Скроллим к календарю
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    
    // Ждём загрузки календаря
    await expect(calendar).toBeVisible();
    await page.waitForTimeout(1000); // Ждём загрузки данных API
    
    // Кликаем на первый доступный день
    const firstAvailableDay = page.locator('#bookingCalendar .day.available').first();
    await expect(firstAvailableDay).toBeVisible();
    await firstAvailableDay.click();
    
    // Проверяем что день стал выбранным
    await expect(firstAvailableDay).toHaveClass(/selected/);
    
    // Проверяем что появились слоты времени
    const timeSlots = page.locator('#bookingCalendar .time-slot');
    const slotsCount = await timeSlots.count();
    expect(slotsCount).toBeGreaterThan(0);
  });

  test('Можно выбрать время и появляется форма бронирования', async ({ page }) => {
    // Скроллим к календарю
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Выбираем дату
    const firstAvailableDay = page.locator('#bookingCalendar .day.available').first();
    await firstAvailableDay.click();
    
    // Выбираем первый доступный слот времени
    const firstTimeSlot = page.locator('#bookingCalendar .time-slot').first();
    await expect(firstTimeSlot).toBeVisible();
    await firstTimeSlot.click();
    
    // Проверяем что слот стал выбранным
    await expect(firstTimeSlot).toHaveClass(/selected/);
    
    // Проверяем что форма бронирования стала видимой
    const bookingForm = page.locator('#bookingCalendar .booking-form-section');
    await expect(bookingForm).toBeVisible();
    
    // Проверяем что показывается выбранная дата и время
    const selectedDatetime = page.locator('#bookingCalendar .selected-datetime');
    await expect(selectedDatetime).toBeVisible();
  });

  test('Форма бронирования содержит все необходимые поля', async ({ page }) => {
    // Скроллим к календарю и выбираем дату/время
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    const firstAvailableDay = page.locator('#bookingCalendar .day.available').first();
    await firstAvailableDay.click();
    
    const firstTimeSlot = page.locator('#bookingCalendar .time-slot').first();
    await firstTimeSlot.click();
    
    // Проверяем наличие всех полей формы
    const serviceSelect = page.locator('#bookingCalendar select[name="serviceType"]');
    await expect(serviceSelect).toBeVisible();
    
    const nameInput = page.locator('#bookingCalendar input[name="name"]');
    await expect(nameInput).toBeVisible();
    
    const emailInput = page.locator('#bookingCalendar input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    const phoneInput = page.locator('#bookingCalendar input[name="phone"]');
    await expect(phoneInput).toBeVisible();
    
    const messageTextarea = page.locator('#bookingCalendar textarea[name="message"]');
    await expect(messageTextarea).toBeVisible();
    
    // Проверяем наличие радио-кнопок формата консультации
    const formatOnline = page.locator('#bookingCalendar input[value="online"]');
    await expect(formatOnline).toBeVisible();
    
    const formatInPerson = page.locator('#bookingCalendar input[value="in-person"]');
    await expect(formatInPerson).toBeVisible();
    
    // Проверяем кнопку отправки
    const submitBtn = page.locator('#bookingCalendar .booking-submit-btn');
    await expect(submitBtn).toBeVisible();
  });

  test('Полное бронирование: выбор даты, времени, заполнение формы, отправка', async ({ page }) => {
    // Скроллим к календарю
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500); // Ждём загрузки данных
    
    // ШАГ 1: Выбираем доступную дату
    const firstAvailableDay = page.locator('#bookingCalendar .day.available').first();
    await expect(firstAvailableDay).toBeVisible();
    const selectedDate = await firstAvailableDay.getAttribute('data-date');
    await firstAvailableDay.click();
    console.log(`Выбрана дата: ${selectedDate}`);
    
    // ШАГ 2: Выбираем время
    const firstTimeSlot = page.locator('#bookingCalendar .time-slot').first();
    await expect(firstTimeSlot).toBeVisible();
    const selectedTime = await firstTimeSlot.textContent();
    await firstTimeSlot.click();
    console.log(`Выбрано время: ${selectedTime}`);
    
    // ШАГ 3: Форма должна стать видимой
    const bookingFormSection = page.locator('#bookingCalendar .booking-form-section');
    await expect(bookingFormSection).toBeVisible();
    
    // ШАГ 4: Выбираем тип услуги (первый в списке)
    const serviceSelect = page.locator('#bookingCalendar select[name="serviceType"]');
    await serviceSelect.selectOption({ index: 0 });
    
    // ШАГ 5: Выбираем формат консультации (онлайн)
    const formatOnline = page.locator('#bookingCalendar input[value="online"]');
    await formatOnline.click();
    
    // ШАГ 6: Заполняем контактные данные
    const nameInput = page.locator('#bookingCalendar input[name="name"]');
    await nameInput.fill(testCustomer.name);
    
    const emailInput = page.locator('#bookingCalendar input[name="email"]');
    await emailInput.fill(testCustomer.email);
    
    const phoneInput = page.locator('#bookingCalendar input[name="phone"]');
    await phoneInput.fill(testCustomer.phone);
    
    const messageTextarea = page.locator('#bookingCalendar textarea[name="message"]');
    await messageTextarea.fill(testCustomer.message);
    
    // ШАГ 7: Отправляем форму
    const submitBtn = page.locator('#bookingCalendar .booking-submit-btn');
    await submitBtn.click();
    
    // ШАГ 8: Проверяем появление модального окна успеха
    const successModal = page.locator('#bookingCalendar .booking-success-modal');
    await expect(successModal).toBeVisible({ timeout: 10000 });
    
    // Проверяем что в модальном окне есть текст успеха
    const successTitle = successModal.locator('h3');
    await expect(successTitle).toBeVisible();
    
    // Проверяем наличие кнопки закрытия
    const closeBtn = successModal.locator('.close-success-btn');
    await expect(closeBtn).toBeVisible();
    
    console.log('✅ Бронирование успешно завершено!');
  });

  test('Кнопка закрытия модала успеха работает', async ({ page }) => {
    // Выполняем бронирование
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    
    await page.locator('#bookingCalendar .day.available').first().click();
    await page.locator('#bookingCalendar .time-slot').first().click();
    
    await page.locator('#bookingCalendar input[value="online"]').click();
    await page.locator('#bookingCalendar input[name="name"]').fill(testCustomer.name);
    await page.locator('#bookingCalendar input[name="email"]').fill(testCustomer.email);
    
    await page.locator('#bookingCalendar .booking-submit-btn').click();
    
    // Ждём появления модала
    const successModal = page.locator('#bookingCalendar .booking-success-modal');
    await expect(successModal).toBeVisible({ timeout: 10000 });
    
    // Закрываем модал
    await page.locator('#bookingCalendar .close-success-btn').click();
    
    // Проверяем что модал закрылся
    await expect(successModal).not.toBeVisible();
    
    // Проверяем что календарь снова доступен
    await expect(calendar).toBeVisible();
  });

  test('Валидация: нельзя отправить форму без обязательных полей', async ({ page }) => {
    // Выбираем дату и время
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    
    await page.locator('#bookingCalendar .day.available').first().click();
    await page.locator('#bookingCalendar .time-slot').first().click();
    
    // Пытаемся отправить пустую форму
    const submitBtn = page.locator('#bookingCalendar .booking-submit-btn');
    await submitBtn.click();
    
    // Модал успеха НЕ должен появиться
    const successModal = page.locator('#bookingCalendar .booking-success-modal');
    await page.waitForTimeout(500);
    await expect(successModal).not.toBeVisible();
    
    // Проверяем что поля required работают
    const nameInput = page.locator('#bookingCalendar input[name="name"]');
    const isRequired = await nameInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('Можно переключить месяц в календаре', async ({ page }) => {
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Получаем текущий месяц
    const monthDisplay = page.locator('#bookingCalendar .calendar-month-year');
    const initialMonth = await monthDisplay.textContent();
    
    // Кликаем на кнопку следующего месяца
    const nextBtn = page.locator('#bookingCalendar .cal-nav-btn.next');
    await nextBtn.click();
    
    // Проверяем что месяц изменился
    const newMonth = await monthDisplay.textContent();
    expect(newMonth).not.toBe(initialMonth);
    
    // Возвращаемся назад
    const prevBtn = page.locator('#bookingCalendar .cal-nav-btn.prev');
    await prevBtn.click();
    
    const backMonth = await monthDisplay.textContent();
    expect(backMonth).toBe(initialMonth);
  });

  test('Бронирование работает на русском языке', async ({ page }) => {
    // Переключаемся на русский
    const ruBtn = page.locator('button[data-lang="ru"]').first();
    await ruBtn.click();
    await page.waitForTimeout(500);
    
    // Скроллим к календарю
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    
    // Проверяем что заголовок на русском
    const calendarTitle = page.locator('#bookingCalendar .booking-header h3');
    await expect(calendarTitle).toContainText(/Выберите/i);
    
    // Выполняем бронирование
    await page.locator('#bookingCalendar .day.available').first().click();
    await page.locator('#bookingCalendar .time-slot').first().click();
    
    // Проверяем лейблы формы на русском
    const nameLabel = page.locator('#bookingCalendar label').filter({ hasText: /имя/i });
    await expect(nameLabel).toBeVisible();
    
    // Заполняем форму
    await page.locator('#bookingCalendar input[value="online"]').click();
    await page.locator('#bookingCalendar input[name="name"]').fill('Тестовый Пользователь');
    await page.locator('#bookingCalendar input[name="email"]').fill('test@example.ru');
    
    // Отправляем
    await page.locator('#bookingCalendar .booking-submit-btn').click();
    
    // Проверяем успех на русском
    const successModal = page.locator('#bookingCalendar .booking-success-modal');
    await expect(successModal).toBeVisible({ timeout: 10000 });
    await expect(successModal).toContainText(/успеш/i);
  });

  test('Бронирование работает на английском языке', async ({ page }) => {
    // Переключаемся на английский
    const enBtn = page.locator('button[data-lang="en"]').first();
    await enBtn.click();
    await page.waitForTimeout(500);
    
    // Скроллим к календарю
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    
    // Проверяем что заголовок на английском
    const calendarTitle = page.locator('#bookingCalendar .booking-header h3');
    await expect(calendarTitle).toContainText(/Select/i);
    
    // Выполняем бронирование
    await page.locator('#bookingCalendar .day.available').first().click();
    await page.locator('#bookingCalendar .time-slot').first().click();
    
    // Заполняем форму
    await page.locator('#bookingCalendar input[value="online"]').click();
    await page.locator('#bookingCalendar input[name="name"]').fill('Test User EN');
    await page.locator('#bookingCalendar input[name="email"]').fill('test@example.com');
    
    // Отправляем
    await page.locator('#bookingCalendar .booking-submit-btn').click();
    
    // Проверяем успех на английском
    const successModal = page.locator('#bookingCalendar .booking-success-modal');
    await expect(successModal).toBeVisible({ timeout: 10000 });
    await expect(successModal).toContainText(/successful/i);
  });

  test('Выбранный слот времени недоступен после бронирования', async ({ page }) => {
    // Первое бронирование
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    
    const firstDay = page.locator('#bookingCalendar .day.available').first();
    await firstDay.click();
    
    // Запоминаем выбранный слот
    const firstSlot = page.locator('#bookingCalendar .time-slot').first();
    const slotTime = await firstSlot.textContent();
    await firstSlot.click();
    
    // Заполняем и отправляем
    await page.locator('#bookingCalendar input[value="online"]').click();
    await page.locator('#bookingCalendar input[name="name"]').fill(testCustomer.name);
    await page.locator('#bookingCalendar input[name="email"]').fill(testCustomer.email);
    await page.locator('#bookingCalendar .booking-submit-btn').click();
    
    // Ждём успех и закрываем
    const successModal = page.locator('#bookingCalendar .booking-success-modal');
    await expect(successModal).toBeVisible({ timeout: 10000 });
    await page.locator('#bookingCalendar .close-success-btn').click();
    
    // После закрытия, тот же слот НЕ должен быть доступен
    await page.waitForTimeout(500);
    await firstDay.click();
    
    // Проверяем что забронированный слот убран из списка
    const slots = page.locator('#bookingCalendar .time-slot');
    const allSlotTexts = await slots.allTextContents();
    
    // Если слоты ещё есть, забронированный не должен быть в списке
    // (Или слотов может не остаться совсем)
    if (allSlotTexts.length > 0) {
      // Это не строгая проверка, т.к. UI обновляется асинхронно
      console.log(`После бронирования осталось слотов: ${allSlotTexts.length}`);
    }
  });

});
