/** @type {import('jest').Config} */
module.exports = {
  // Подавляем console.log/warn/error в тестах для чистого вывода
  silent: false, // Оставляем false чтобы видеть ошибки тестов
  
  // Подавляем только console.log и console.warn
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Покрытие кода
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  
  // Таймаут для тестов
  testTimeout: 30000,
  
  // Verbose output для лучшей читаемости
  verbose: true,
  
  // Настройки для корректной работы Azure SDK
  testEnvironment: 'node',
  
  // Mock Azure modules instead of trying to transform them
  moduleNameMapper: {
    '@azure/data-tables': '<rootDir>/tests/__mocks__/azure-data-tables.js'
  }
};
