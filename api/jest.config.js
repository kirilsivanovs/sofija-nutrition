/** @type {import('jest').Config} */
module.exports = {
  // Подавляем console.log/warn/error в тестах для чистого вывода
  silent: false, // Оставляем false чтобы видеть ошибки тестов
  
  // Подавляем только console.log и console.warn
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Покрытие кода
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/index.ts',
    '!src/functions/**', // Exclude Azure Functions handlers (covered by E2E tests)
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds - CI/CD gate
  // Note: Functions are excluded as they're covered by E2E tests
  // Focus on business logic in services, utils, templates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Таймаут для тестов
  testTimeout: 30000,
  
  // Verbose output для лучшей читаемости
  verbose: true,
  
  // Настройки для корректной работы Azure SDK
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }],
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Mock Azure modules instead of trying to transform them
  moduleNameMapper: {
    '@azure/data-tables': '<rootDir>/tests/__mocks__/azure-data-tables.js'
  },
  
  // Расширения файлов для резолвинга модулей
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
