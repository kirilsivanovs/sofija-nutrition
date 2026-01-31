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
  verbose: true
};
