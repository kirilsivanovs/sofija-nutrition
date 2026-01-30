import { test, expect } from '@playwright/test';

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #1
 * Клиент может увидеть доступные услуги и выбрать дату
 * 
 * Если этот тест падает - клиенты НЕ МОГУТ БРОНИРОВАТЬ
 */
test.describe('🚨 Критический процесс: Просмотр услуг и выбор даты', () => {
  
  test('Клиент видит список услуг на главной странице', async ({ page }) => {
    // Открыть главную страницу
    await page.goto('/');
    
    // Проверить что страница загрузилась
    await expect(page).toHaveTitle(/Sofija/i);
    
    // Должен быть заголовок страницы
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Должна быть форма бронирования
    const bookingForm = page.locator('form').first();
    await expect(bookingForm).toBeVisible();
  });

  test('Клиент может выбрать услугу из списка', async ({ page }) => {
    await page.goto('/');
    
    // Найти select для услуги
    const serviceSelect = page.locator('select#service, select[name="service"]').first();
    await expect(serviceSelect).toBeVisible();
    
    // Проверить что есть опции услуг
    const options = serviceSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // Минимум placeholder + 1 услуга
    
    // Выбрать первую услугу (не placeholder)
    const firstServiceValue = await options.nth(1).getAttribute('value');
    await serviceSelect.selectOption(firstServiceValue);
    
    // Проверить что выбрано
    await expect(serviceSelect).toHaveValue(firstServiceValue);
  });

  test('Клиент видит календарь для выбора даты', async ({ page }) => {
    await page.goto('/');
    
    // Найти input для даты
    const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
    await expect(dateInput).toBeVisible();
    await expect(dateInput).toBeEnabled();
  });

  test('Клиент может выбрать дату', async ({ page }) => {
    await page.goto('/');
    
    // Выбрать услугу сначала
    const serviceSelect = page.locator('select#service, select[name="service"]').first();
    const options = serviceSelect.locator('option');
    const firstServiceValue = await options.nth(1).getAttribute('value');
    await serviceSelect.selectOption(firstServiceValue);
    
    // Выбрать дату (через несколько дней от сегодня)
    const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // +7 дней
    const dateString = futureDate.toISOString().split('T')[0];
    
    await dateInput.fill(dateString);
    await expect(dateInput).toHaveValue(dateString);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #2
 * Клиент видит доступные временные слоты
 * 
 * Если этот тест падает - клиенты НЕ МОГУТ ВЫБРАТЬ ВРЕМЯ
 */
test.describe('🚨 Критический процесс: Загрузка доступных слотов', () => {
  
  test('После выбора даты загружаются доступные слоты времени', async ({ page }) => {
    await page.goto('/');
    
    // Выбрать услугу
    const serviceSelect = page.locator('select#service, select[name="service"]').first();
    const options = serviceSelect.locator('option');
    const firstServiceValue = await options.nth(1).getAttribute('value');
    await serviceSelect.selectOption(firstServiceValue);
    
    // Выбрать дату
    const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    await dateInput.fill(dateString);
    
    // Подождать загрузки слотов (может быть анимация загрузки)
    await page.waitForTimeout(1000);
    
    // Должны появиться слоты времени (кнопки или радио-кнопки)
    const timeSlots = page.locator('[data-testid="time-slot"], .time-slot, input[type="radio"][name="time"]').first();
    await expect(timeSlots).toBeVisible({ timeout: 5000 });
  });

  test('Клиент может выбрать временной слот', async ({ page }) => {
    await page.goto('/');
    
    // Выбрать услугу
    const serviceSelect = page.locator('select#service, select[name="service"]').first();
    const options = serviceSelect.locator('option');
    const firstServiceValue = await options.nth(1).getAttribute('value');
    await serviceSelect.selectOption(firstServiceValue);
    
    // Выбрать дату
    const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    await dateInput.fill(dateString);
    
    // Подождать загрузки
    await page.waitForTimeout(1000);
    
    // Кликнуть на первый доступный слот
    const firstSlot = page.locator('[data-testid="time-slot"], .time-slot, input[type="radio"][name="time"]').first();
    await firstSlot.click();
    
    // Проверить что слот выбран (должен получить класс selected или checked)
    await expect(firstSlot).toHaveClass(/selected|checked|active/);
  });

  test('Показывается сообщение если нет доступных слотов', async ({ page }) => {
    await page.goto('/');
    
    // Выбрать услугу
    const serviceSelect = page.locator('select#service, select[name="service"]').first();
    const options = serviceSelect.locator('option');
    const firstServiceValue = await options.nth(1).getAttribute('value');
    await serviceSelect.selectOption(firstServiceValue);
    
    // Выбрать дату в прошлом или выходной
    const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7); // -7 дней (прошлое)
    const dateString = pastDate.toISOString().split('T')[0];
    await dateInput.fill(dateString);
    
    // Подождать загрузки
    await page.waitForTimeout(1000);
    
    // Должно быть сообщение о недоступности
    const noSlotsMessage = page.getByText(/нет доступных|недоступн|no available|not available/i);
    await expect(noSlotsMessage).toBeVisible({ timeout: 5000 });
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #3
 * Клиент может заполнить форму и создать бронирование
 * 
 * Если этот тест падает - БРОНИРОВАНИЯ НЕ СОЗДАЮТСЯ
 */
test.describe('🚨 Критический процесс: Создание бронирования', () => {
  
  test('Форма бронирования имеет все обязательные поля', async ({ page }) => {
    await page.goto('/');
    
    // Проверить наличие всех обязательных полей
    await expect(page.locator('input[name="name"], #name')).toBeVisible();
    await expect(page.locator('input[name="email"], #email')).toBeVisible();
    await expect(page.locator('input[name="phone"], #phone')).toBeVisible();
    await expect(page.locator('select[name="service"], #service')).toBeVisible();
    await expect(page.locator('input[name="date"], #date')).toBeVisible();
  });

  test('Клиент может успешно создать бронирование', async ({ page }) => {
    await page.goto('/');
    
    // Заполнить имя
    await page.locator('input[name="name"], #name').fill('E2E Test User');
    
    // Заполнить email
    await page.locator('input[name="email"], #email').fill('e2e.test@example.com');
    
    // Заполнить телефон
    await page.locator('input[name="phone"], #phone').fill('+37120000000');
    
    // Выбрать услугу
    const serviceSelect = page.locator('select[name="service"], #service');
    const options = serviceSelect.locator('option');
    const firstServiceValue = await options.nth(1).getAttribute('value');
    await serviceSelect.selectOption(firstServiceValue);
    
    // Выбрать дату
    const dateInput = page.locator('input[name="date"], #date');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    await dateInput.fill(dateString);
    
    // Подождать загрузки слотов
    await page.waitForTimeout(1500);
    
    // Выбрать первый слот
    const firstSlot = page.locator('[data-testid="time-slot"], .time-slot, input[type="radio"][name="time"]').first();
    await firstSlot.click();
    
    // Выбрать формат (онлайн/офлайн)
    const formatSelect = page.locator('select[name="format"], #format, input[type="radio"][name="format"]').first();
    if (await formatSelect.count() > 0) {
      if (formatSelect.getAttribute('type') === 'radio') {
        await formatSelect.click();
      } else {
        await formatSelect.selectOption({ index: 1 });
      }
    }
    
    // Нажать кнопку отправки
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Проверить что показалось сообщение об успехе
    // (может быть модалка, новая страница, или сообщение на той же странице)
    const successMessage = page.getByText(/успешно|success|подтверждение|confirmation/i);
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('Валидация: форма не отправляется без обязательных полей', async ({ page }) => {
    await page.goto('/');
    
    // Попробовать отправить пустую форму
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Должна сработать HTML5 валидация или показаться ошибки
    // Проверить что мы все еще на той же странице (не произошла отправка)
    await expect(page).toHaveURL(/\//);
    
    // Проверить что поле name имеет атрибут required или показывается ошибка
    const nameInput = page.locator('input[name="name"], #name');
    const isRequired = await nameInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #4
 * API эндпоинты работают корректно
 * 
 * Если этот тест падает - BACKEND НЕ РАБОТАЕТ
 */
test.describe('🚨 Критический процесс: API работает', () => {
  
  test('API Health check возвращает успешный статус', async ({ request }) => {
    const response = await request.get('http://localhost:7071/api/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('API возвращает список услуг', async ({ request }) => {
    const response = await request.get('http://localhost:7071/api/availability');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.serviceTypes).toBeDefined();
    expect(Array.isArray(data.serviceTypes)).toBeTruthy();
    expect(data.serviceTypes.length).toBeGreaterThan(0);
  });

  test('API возвращает доступные слоты для конкретной даты', async ({ request }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    
    const response = await request.get(`http://localhost:7071/api/availability/${dateString}`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.slots).toBeDefined();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #5
 * Мультиязычность работает
 * 
 * Если этот тест падает - часть клиентов не увидят контент на своем языке
 */
test.describe('🚨 Критический процесс: Переключение языка', () => {
  
  test('Страница поддерживает латышский язык', async ({ page }) => {
    await page.goto('/');
    
    // Искать латышские слова с диакритическими знаками
    const latvianText = page.getByText(/konsultācija|rezervācija|pakalpojum/i);
    
    // Если есть переключатель языка, переключить на латышский
    const langSwitcher = page.locator('[data-lang="lv"], button:has-text("LV"), a:has-text("LV")');
    if (await langSwitcher.count() > 0) {
      await langSwitcher.click();
      await page.waitForTimeout(500);
    }
    
    // Должен быть контент на латышском
    const count = await latvianText.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Страница поддерживает английский язык', async ({ page }) => {
    await page.goto('/');
    
    // Если есть переключатель языка
    const langSwitcher = page.locator('[data-lang="en"], button:has-text("EN"), a:has-text("EN")');
    if (await langSwitcher.count() > 0) {
      await langSwitcher.click();
      await page.waitForTimeout(500);
      
      // Должен быть контент на английском
      const englishText = page.getByText(/consultation|booking|service/i);
      const count = await englishText.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Страница поддерживает русский язык', async ({ page }) => {
    await page.goto('/');
    
    // Если есть переключатель языка
    const langSwitcher = page.locator('[data-lang="ru"], button:has-text("RU"), a:has-text("RU")');
    if (await langSwitcher.count() > 0) {
      await langSwitcher.click();
      await page.waitForTimeout(500);
      
      // Должен быть контент на русском (кириллица)
      const russianText = page.getByText(/консультация|бронирование|услуг/i);
      const count = await russianText.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
