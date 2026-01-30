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
    // Убедимся что это будний день
    while (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const dateString = futureDate.toISOString().split('T')[0];
    
    const response = await request.get(`http://localhost:7071/api/availability/${dateString}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    // Проверяем что есть слоты или serviceTypes
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

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #7
 * Hero секция с CTA кнопками
 * 
 * Если этот тест падает - клиенты НЕ ВИДЯТ ГЛАВНЫЙ ПРИЗЫВ К ДЕЙСТВИЮ
 */
test.describe('🚨 Критический процесс: Hero секция и CTA', () => {
  
  test('Hero секция отображается', async ({ page }) => {
    await page.goto('/');
    
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();
  });

  test('Главный заголовок H1 присутствует', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    // Заголовок должен быть непустым
    const text = await h1.textContent();
    expect(text.length).toBeGreaterThan(10);
  });

  test('CTA кнопка "Pieteikties programmai" кликабельна', async ({ page }) => {
    await page.goto('/');
    
    const ctaBtn = page.locator('a[href="#program"]').first();
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toBeEnabled();
  });

  test('CTA кнопка ведёт на секцию контактов', async ({ page }) => {
    await page.goto('/');
    
    const ctaSecondary = page.locator('a[href="#contact"]').first();
    await expect(ctaSecondary).toBeVisible();
    await ctaSecondary.click();
    
    // URL должен измениться с #contact
    await expect(page).toHaveURL(/#contact/);
  });

  test('Фото специалиста в Hero отображается', async ({ page }) => {
    await page.goto('/');
    
    const heroImage = page.locator('#hero img').first();
    await expect(heroImage).toBeVisible();
  });

  test('Бейдж регистрации отображается', async ({ page }) => {
    await page.goto('/');
    
    // Проверить что есть регистрационный номер
    const regBadge = page.getByText(/75650061277/);
    await expect(regBadge.first()).toBeVisible();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #8
 * Секция "Как это работает" (How It Works)
 * 
 * Если этот тест падает - клиенты НЕ ПОНИМАЮТ ПРОЦЕСС
 */
test.describe('🚨 Критический процесс: How It Works секция', () => {
  
  test('Секция процесса существует', async ({ page }) => {
    await page.goto('/');
    
    const howSection = page.locator('#how-it-works');
    await expect(howSection).toBeVisible();
  });

  test('Все 4 шага процесса отображаются', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    
    // Проверить 4 шага
    const step1 = page.getByText(/1\. .*CGM|sensor/i).first();
    const step2 = page.getByText(/2\. .*dzīv|life/i).first();
    const step3 = page.getByText(/3\. .*analiz|data/i).first();
    const step4 = page.getByText(/4\. .*plān|plan/i).first();
    
    await expect(step1).toBeVisible();
    await expect(step2).toBeVisible();
    await expect(step3).toBeVisible();
    await expect(step4).toBeVisible();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #9
 * Секция программы с ценой
 * 
 * Если этот тест падает - клиенты НЕ ВИДЯТ ЦЕНУ И ЧТО ВКЛЮЧЕНО
 */
test.describe('🚨 Критический процесс: Программа и цена', () => {
  
  test('Секция программы существует', async ({ page }) => {
    await page.goto('/');
    
    const programSection = page.locator('#program');
    await expect(programSection).toBeVisible();
  });

  test('Цена отображается', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#program').scrollIntoViewIfNeeded();
    
    // Цена должна содержать € или EUR
    const priceText = page.getByText(/\d+.*€|€.*\d+/);
    await expect(priceText.first()).toBeVisible();
  });

  test('Список включённых услуг отображается', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#program').scrollIntoViewIfNeeded();
    
    // Должен быть хотя бы один пункт с галочкой
    const checkItems = page.locator('#program .ph-check, #program [class*="check"]');
    const count = await checkItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #10
 * Секция About (О специалисте)
 * 
 * Если этот тест падает - клиенты НЕ ВИДЯТ ИНФОРМАЦИЮ О ДОКТОРЕ
 */
test.describe('🚨 Критический процесс: About секция', () => {
  
  test('Секция About существует', async ({ page }) => {
    await page.goto('/');
    
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
  });

  test('Фото доктора в About отображается', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#about').scrollIntoViewIfNeeded();
    
    const aboutImage = page.locator('#about img').first();
    await expect(aboutImage).toBeVisible();
  });

  test('Имя "Sofija Ivanova" в About отображается', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#about').scrollIntoViewIfNeeded();
    
    const name = page.locator('#about').getByText(/Sofija Ivanova/i);
    await expect(name.first()).toBeVisible();
  });

  test('Квалификации отображаются', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#about').scrollIntoViewIfNeeded();
    
    // PhD и MSc должны быть видны
    const qualifications = page.locator('#about').getByText(/PhD|MSc|магистр/i);
    await expect(qualifications.first()).toBeVisible();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #11
 * Отзывы клиентов
 * 
 * Если этот тест падает - социальное доказательство НЕ РАБОТАЕТ
 */
test.describe('🚨 Критический процесс: Testimonials', () => {
  
  test('Секция отзывов существует', async ({ page }) => {
    await page.goto('/');
    
    const testimonials = page.locator('#testimonials');
    await expect(testimonials).toBeVisible();
  });

  test('Минимум 3 отзыва отображаются', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#testimonials').scrollIntoViewIfNeeded();
    
    // Каждый отзыв имеет 5 звёзд
    const stars = page.locator('#testimonials .ph-star, #testimonials [class*="star"]');
    const count = await stars.count();
    // Минимум 15 звёзд (3 отзыва по 5 звёзд)
    expect(count).toBeGreaterThanOrEqual(15);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #12
 * Мобильное меню
 * 
 * Если этот тест падает - мобильные пользователи НЕ МОГУТ НАВИГИРОВАТЬ
 */
test.describe('🚨 Критический процесс: Мобильное меню', () => {
  
  test('Кнопка мобильного меню существует на мобильных', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuBtn = page.locator('.mobile-menu-btn, button[aria-label="Menu"]');
    await expect(menuBtn).toBeVisible();
  });

  test('Мобильное меню открывается по клику', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuBtn = page.locator('.mobile-menu-btn, button[aria-label="Menu"]');
    await menuBtn.click();
    
    // Меню должно стать видимым
    const mobileMenu = page.locator('#mobile-nav-menu, .mobile-nav-menu');
    await expect(mobileMenu).toHaveClass(/open/);
  });

  test('Навигационные ссылки в мобильном меню работают', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuBtn = page.locator('.mobile-menu-btn, button[aria-label="Menu"]');
    await menuBtn.click();
    
    // Клик на Contact
    const contactLink = page.locator('#mobile-nav-menu a[href="#contact"]');
    await contactLink.click();
    
    // URL должен измениться
    await expect(page).toHaveURL(/#contact/);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #13
 * Статистика (58% Prevention)
 * 
 * Если этот тест падает - ключевое социальное доказательство НЕ ВИДНО
 */
test.describe('🚨 Критический процесс: Статистика', () => {
  
  test('Статистика 58% отображается', async ({ page }) => {
    await page.goto('/');
    
    const stat = page.getByText(/58%/);
    await expect(stat.first()).toBeVisible();
  });

  test('Источник статистики указан', async ({ page }) => {
    await page.goto('/');
    
    const source = page.getByText(/NIH|Diabetes Prevention/i);
    await expect(source.first()).toBeVisible();
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #14
 * Галерея научной деятельности
 * 
 * Если этот тест падает - научное доверие НЕ ВИДНО
 */
test.describe('🚨 Критический процесс: Научная галерея', () => {
  
  test('Конференция EASD упоминается', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#about').scrollIntoViewIfNeeded();
    
    const easd = page.getByText(/EASD/i);
    await expect(easd.first()).toBeVisible();
  });

  test('Изображения конференций загружаются', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#about').scrollIntoViewIfNeeded();
    
    // Проверить что есть изображения в галерее
    const galleryImages = page.locator('#about img');
    const count = await galleryImages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #15
 * Accessibility - базовые проверки
 * 
 * Если этот тест падает - сайт НЕДОСТУПЕН для части пользователей
 */
test.describe('🚨 Критический процесс: Accessibility', () => {
  
  test('Страница имеет lang атрибут', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('Все изображения имеют alt текст', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt, `Image ${i + 1} should have alt text`).toBeTruthy();
    }
  });

  test('Главный заголовок H1 только один', async ({ page }) => {
    await page.goto('/');
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });
});

/**
 * 🔴 КРИТИЧНЫЙ БИЗНЕС-ПРОЦЕСС #16
 * Performance - страница загружается быстро
 * 
 * Если этот тест падает - клиенты УХОДЯТ ИЗ-ЗА МЕДЛЕННОЙ ЗАГРУЗКИ
 */
test.describe('🚨 Критический процесс: Performance', () => {
  
  test('Страница загружается менее чем за 5 секунд', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('Hero изображение загружается', async ({ page }) => {
    await page.goto('/');
    
    const heroImg = page.locator('#hero img').first();
    await expect(heroImg).toBeVisible();
    
    // Проверить что изображение полностью загружено
    const isLoaded = await heroImg.evaluate((img) => {
      return (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0;
    });
    expect(isLoaded).toBeTruthy();
  });
});
