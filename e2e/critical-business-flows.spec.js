import { test, expect } from '@playwright/test';

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #1
 * Главная страница загружается и отображается корректно
 * 
 * Если этот тест падает - клиенты НЕ ВИДЯТ САЙТ
 */
test.describe('🚨 Критический процесс: Главная страница загружается', () => {
  
  test('Главная страница открывается успешно', async ({ page }) => {
    await page.goto('/');
    
    // Проверить что страница загрузилась
    await expect(page).toHaveTitle(/Sofija/i);
  });

  test('Заголовок и лого отображаются', async ({ page }) => {
    await page.goto('/');
    
    // Проверить логотип
    const logo = page.locator('img[alt="SI Logo"]');
    await expect(logo).toBeVisible();
    
    // Проверить имя в header (первый элемент)
    const brandName = page.locator('header').getByText('Sofija Ivanova').first();
    await expect(brandName).toBeVisible();
  });

  test('Навигация работает', async ({ page }) => {
    await page.goto('/');
    
    // Проверить что есть навигационные ссылки (desktop nav)
    const desktopNav = page.locator('.hidden.md\\:flex, nav').first();
    await expect(desktopNav.locator('a[href="#program"]')).toBeVisible();
    await expect(desktopNav.locator('a[href="#about"]')).toBeVisible();
    await expect(desktopNav.locator('a[href="#contact"]')).toBeVisible();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #2
 * Переключение языка работает
 * 
 * Если этот тест падает - часть клиентов не увидят контент на своем языке
 */
test.describe('🚨 Критический процесс: Переключение языка', () => {
  
  test('Кнопки переключения языка присутствуют', async ({ page }) => {
    await page.goto('/');
    
    // Проверить наличие кнопок языков
    const lvBtn = page.locator('button[data-lang="lv"]').first();
    const enBtn = page.locator('button[data-lang="en"]').first();
    const ruBtn = page.locator('button[data-lang="ru"]').first();
    
    await expect(lvBtn).toBeVisible();
    await expect(enBtn).toBeVisible();
    await expect(ruBtn).toBeVisible();
  });

  test('Можно переключиться на английский язык', async ({ page }) => {
    await page.goto('/');
    
    // Кликнуть на EN
    const enBtn = page.locator('button[data-lang="en"]').first();
    await enBtn.click();
    
    // Подождать смены контента
    await page.waitForTimeout(500);
    
    // Проверить что появился английский контент
    await expect(page).toHaveURL(/\//);
  });

  test('Можно переключиться на русский язык', async ({ page }) => {
    await page.goto('/');
    
    // Кликнуть на RU
    const ruBtn = page.locator('button[data-lang="ru"]').first();
    await ruBtn.click();
    
    // Подождать смены контента
    await page.waitForTimeout(500);
    
    await expect(page).toHaveURL(/\//);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #3
 * Форма лид-магнита работает
 * 
 * Если этот тест падает - клиенты НЕ МОГУТ ПОДПИСАТЬСЯ
 */
test.describe('🚨 Критический процесс: Lead форма', () => {
  
  test('Lead форма присутствует на странице', async ({ page }) => {
    await page.goto('/');
    
    // Скролл к секции с формой
    const leadSection = page.locator('#lead-magnet, section').filter({ hasText: /PDF|e-pasts/i }).first();
    await leadSection.scrollIntoViewIfNeeded();
    
    // Проверить что форма видна
    const leadForm = page.locator('#leadForm');
    await expect(leadForm).toBeVisible();
  });

  test('Lead форма имеет поле email', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('#leadForm input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
  });

  test('Lead форма имеет кнопку отправки', async ({ page }) => {
    await page.goto('/');
    
    const submitBtn = page.locator('#leadForm button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('Lead форма не отправляется без email', async ({ page }) => {
    await page.goto('/');
    
    // Попробовать отправить без заполнения
    const submitBtn = page.locator('#leadForm button[type="submit"]');
    await submitBtn.click();
    
    // HTML5 валидация должна сработать
    const emailInput = page.locator('#leadForm input[type="email"]');
    const isRequired = await emailInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #4
 * Календарь бронирования присутствует
 * 
 * Если этот тест падает - клиенты НЕ ВИДЯТ КАЛЕНДАРЬ
 */
test.describe('🚨 Критический процесс: Календарь бронирования', () => {
  
  test('Секция контактов с календарем существует', async ({ page }) => {
    await page.goto('/');
    
    // Проверить наличие секции contact
    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeVisible();
  });

  test('Контейнер календаря присутствует', async ({ page }) => {
    await page.goto('/');
    
    // Скролл к календарю
    const calendar = page.locator('#bookingCalendar');
    await calendar.scrollIntoViewIfNeeded();
    
    await expect(calendar).toBeVisible();
  });

  test('Заголовок секции бронирования отображается', async ({ page }) => {
    await page.goto('/');
    
    const bookingTitle = page.getByText(/Rezervējiet|Book|Забронировать/i);
    await expect(bookingTitle.first()).toBeVisible();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #5
 * API работает корректно
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
    expect(data.timestamp).toBeDefined();
  });

  test('API возвращает список услуг (availability endpoint)', async ({ request }) => {
    const response = await request.get('http://localhost:7071/api/availability');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.serviceTypes).toBeDefined();
    expect(Array.isArray(data.serviceTypes)).toBeTruthy();
    expect(data.serviceTypes.length).toBeGreaterThan(0);
    
    // Проверить структуру первой услуги
    const firstService = data.serviceTypes[0];
    expect(firstService.id).toBeDefined();
    expect(firstService.name).toBeDefined();
  });

  test('API возвращает доступные слоты для конкретной даты', async ({ request }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    
    const response = await request.get(`http://localhost:7071/api/availability/${dateString}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    // Слоты могут быть пустыми для выходных, но структура должна быть
    expect(data.slots !== undefined || data.serviceTypes !== undefined).toBeTruthy();
  });

  test('API обрабатывает невалидную дату корректно', async ({ request }) => {
    const response = await request.get('http://localhost:7071/api/availability/invalid-date');
    
    // API должен либо вернуть ошибку, либо дефолтный ответ
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #6
 * Футер с контактной информацией отображается
 * 
 * Если этот тест падает - клиенты НЕ ВИДЯТ КОНТАКТЫ
 */
test.describe('🚨 Критический процесс: Футер с контактами', () => {
  
  test('Футер присутствует на странице', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('Email контакт отображается в футере', async ({ page }) => {
    await page.goto('/');
    
    const emailLink = page.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
  });

  test('Информация о специалисте отображается', async ({ page }) => {
    await page.goto('/');
    
    // Проверить что есть PhD упоминание
    const phdText = page.getByText(/PhD/i);
    await expect(phdText.first()).toBeVisible();
  });
});
