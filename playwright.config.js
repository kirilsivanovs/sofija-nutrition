import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Tests
 * Защита критических бизнес-процессов от некачественного кода
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Максимальное время на один тест */
  timeout: 30 * 1000,
  
  /* Таймаут для expect assertions */
  expect: {
    timeout: 5000
  },
  
  /* Запускать тесты параллельно */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL для тестов */
    baseURL: 'http://localhost:4321',
    
    /* API endpoint */
    apiURL: 'http://localhost:7071',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Locale for tests */
    locale: 'lv-LV',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Раскомментировать для тестирования в Firefox и Safari
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // В CI серверы запускаются автоматически
  // Локально нужно запустить вручную: npm run dev и cd api && npm start
  webServer: process.env.CI ? [
    {
      command: 'npm run dev',
      url: 'http://localhost:4321',
      name: 'Frontend',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run start',
      cwd: './api',
      url: 'http://localhost:7071/api/health',
      name: 'Backend API',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    }
  ] : undefined,
});
