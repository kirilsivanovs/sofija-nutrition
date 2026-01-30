/**
 * Скрипт для сохранения сессии авторизации Microsoft
 * 
 * Запустить локально один раз:
 * npx playwright test e2e/auth.setup.js --headed
 * 
 * Это создаст файл .auth/admin.json с cookies и storage
 * Этот файл нужно добавить в GitHub Secrets как AUTH_STATE
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('Сохранение сессии авторизации Microsoft', async ({ page }) => {
  // Создаём директорию .auth если не существует
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Переходим в админку
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  
  const currentUrl = page.url();
  
  if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('login.live.com')) {
    console.log('🔐 Авторизация Microsoft...');
    console.log('⏳ Пожалуйста, войдите вручную в открывшемся окне браузера');
    
    // Ждём пока пользователь авторизуется вручную
    // (это для первоначальной настройки)
    await page.waitForURL('**/admin**', { timeout: 120000 });
    
    console.log('✅ Авторизация успешна!');
  }
  
  // Проверяем что мы в админке
  await expect(page.locator('#calendar-grid')).toBeVisible({ timeout: 30000 });
  
  // Сохраняем состояние сессии
  await page.context().storageState({ path: authFile });
  
  console.log(`💾 Сессия сохранена в ${authFile}`);
  console.log('📋 Скопируйте содержимое файла в GitHub Secret AUTH_STATE');
});
