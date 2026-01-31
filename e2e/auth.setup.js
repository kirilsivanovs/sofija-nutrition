/**
 * E2E Test Authentication Setup
 * 
 * Для E2E тестов используем токен который проверяется API.
 * Админ-действия выполняются напрямую через API с X-E2E-Token header.
 * 
 * НАСТРОЙКА:
 * 1. Сгенерируй токен: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 2. Добавь в Azure → Function App → Configuration: E2E_TEST_TOKEN=<токен>
 * 3. Добавь в GitHub Secrets: E2E_TEST_TOKEN=<тот же токен>
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('Подготовка auth state для E2E тестов', async ({ request }) => {
  // Создаём директорию .auth если не существует
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'https://wonderful-bay-0fb550403.4.azurestaticapps.net';
  const apiBase = 'https://sofija-nutrition-api.azurewebsites.net/api';
  const e2eToken = process.env.E2E_TEST_TOKEN;

  // ============================================
  // Используем E2E Token
  // ============================================
  if (e2eToken) {
    console.log('🔑 Проверяем E2E_TEST_TOKEN...');
    
    try {
      // Проверяем токен через dashboard API
      const response = await request.get(`${apiBase}/dashboard/bookings?limit=1`, {
        headers: { 'X-E2E-Token': e2eToken }
      });
      
      if (response.ok()) {
        console.log('✅ E2E токен валиден!');
        
        // Сохраняем токен в auth state
        const authState = {
          cookies: [],
          origins: [{
            origin: baseUrl,
            localStorage: [{
              name: 'e2e_token',
              value: e2eToken
            }]
          }],
          e2eToken: e2eToken  // Для использования в тестах
        };
        
        fs.writeFileSync(authFile, JSON.stringify(authState, null, 2));
        console.log(`💾 Auth state сохранён: ${authFile}`);
        console.log('');
        console.log('📋 E2E тесты будут использовать API напрямую с токеном');
        return;
      } else if (response.status() === 401) {
        console.log('⚠️  E2E токен невалиден (401 Unauthorized)');
        console.log('   Проверьте E2E_TEST_TOKEN в Azure Function App Settings');
      } else {
        console.log(`⚠️  API вернул статус ${response.status()}`);
      }
    } catch (error) {
      console.log('⚠️  Ошибка проверки токена:', error.message);
    }
  }

  // ============================================
  // CI без токена - создаём пустой auth state
  // ============================================
  console.log('');
  console.log('⚠️  E2E_TEST_TOKEN не настроен');
  console.log('');
  console.log('📋 Для полного теста (включая админ-часть):');
  console.log('');
  console.log('   1. Сгенерируйте токен:');
  console.log('      node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.log('');
  console.log('   2. Добавьте в Azure → Function App → Configuration:');
  console.log('      E2E_TEST_TOKEN=<ваш токен>');
  console.log('');
  console.log('   3. Добавьте в GitHub → Secrets:');
  console.log('      E2E_TEST_TOKEN=<тот же токен>');
  console.log('');
  console.log('⏭️  Тесты запустятся без админ-части');
  
  // Создаём пустой auth state чтобы тесты могли запуститься
  const authState = {
    cookies: [],
    origins: []
  };
  
  fs.writeFileSync(authFile, JSON.stringify(authState, null, 2));
});
