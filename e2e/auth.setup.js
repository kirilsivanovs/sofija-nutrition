/**
 * Скрипт для сохранения сессии авторизации Microsoft
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Локально запустить: npx playwright test e2e/auth.setup.js --headed
 * 2. В браузере нажать Cancel на Windows Hello и войти через пароль
 * 3. Файл .auth/admin.json будет создан автоматически
 * 4. Скопировать содержимое в GitHub Secret AUTH_STATE
 * 
 * После этого все E2E тесты будут переиспользовать сохранённую сессию!
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('Подготовка auth state для Microsoft', async ({ page }) => {
  // Создаём директорию .auth если не существует
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Если уже есть сохранённая сессия - проверяем её валидность
  if (fs.existsSync(authFile)) {
    console.log('📂 Найден существующий auth state, проверяем...');
    
    // Загружаем существующую сессию
    const existingState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    await page.context().addCookies(existingState.cookies || []);
    
    // Пробуем зайти в админку
    const adminUrl = process.env.PLAYWRIGHT_BASE_URL 
      ? `${process.env.PLAYWRIGHT_BASE_URL}/admin`
      : 'https://wonderful-bay-0fb550403.4.azurestaticapps.net/admin';
    
    await page.goto(adminUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Если мы в админке - сессия валидна
    const isInAdmin = !page.url().includes('login.microsoftonline.com') && 
                      !page.url().includes('login.live.com');
    
    if (isInAdmin) {
      const calendar = page.locator('#calendar-grid');
      if (await calendar.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('✅ Существующая сессия валидна!');
        return;
      }
    }
    
    console.log('⚠️ Сессия истекла, нужна новая авторизация');
  }
  
  // В CI используем готовый auth state из переменной окружения
  if (process.env.CI && process.env.AUTH_STATE) {
    console.log('🔄 Используем AUTH_STATE из переменной окружения');
    fs.writeFileSync(authFile, process.env.AUTH_STATE, 'utf-8');
    console.log('✅ Auth state восстановлен');
    return;
  }
  
  // В CI без AUTH_STATE - пропускаем
  if (process.env.CI && !process.env.AUTH_STATE) {
    console.log('⚠️ AUTH_STATE не найден');
    console.log('💡 Добавьте GitHub Secret AUTH_STATE');
    setup.skip();
    return;
  }
  
  // ============================================
  // РУЧНАЯ АВТОРИЗАЦИЯ (только локально)
  // ============================================
  console.log('\n🔐 ═══════════════════════════════════════════');
  console.log('   РУЧНАЯ АВТОРИЗАЦИЯ MICROSOFT');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('📌 Инструкция:');
  console.log('   1. В открывшемся браузере появится Windows Hello');
  console.log('   2. Нажмите "Cancel" или "Отмена"');
  console.log('   3. Нажмите "Sign-in options" (Способы входа)');  
  console.log('   4. Выберите "Password" (Пароль)');
  console.log('   5. Введите пароль: Natavasja1!');
  console.log('   6. Дождитесь входа в админку');
  console.log('');
  console.log('⏳ Ожидание авторизации (2 минуты)...\n');
  
  const adminUrl = process.env.PLAYWRIGHT_BASE_URL 
    ? `${process.env.PLAYWRIGHT_BASE_URL}/admin`
    : 'https://wonderful-bay-0fb550403.4.azurestaticapps.net/admin';
  
  await page.goto(adminUrl);
  await page.waitForLoadState('domcontentloaded');
  
  // Ждём пока пользователь авторизуется вручную
  await page.waitForURL('**/admin**', { timeout: 120000 });
  
  // Проверяем что мы в админке
  await expect(page.locator('#calendar-grid')).toBeVisible({ timeout: 30000 });
  
  // Сохраняем состояние сессии
  await page.context().storageState({ path: authFile });
  
  console.log('\n✅ ═══════════════════════════════════════════');
  console.log('   АВТОРИЗАЦИЯ УСПЕШНА!');
  console.log('═══════════════════════════════════════════════');
  console.log(`\n💾 Сессия сохранена: ${authFile}`);
  console.log('\n📋 Следующий шаг для CI:');
  console.log('   1. Откройте файл .auth/admin.json');
  console.log('   2. Скопируйте всё содержимое');
  console.log('   3. Добавьте GitHub Secret: AUTH_STATE');
  console.log('   4. Вставьте содержимое как значение\n');
});
