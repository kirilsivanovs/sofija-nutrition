module.exports = {
  // Только фронтенд-тесты (tests/).
  // API-тесты запускаются отдельно через api/jest.config.js
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.{js,ts}'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    // Custom transformer: replaces Astro's import.meta.env → process.env, then runs ts-jest
    '^.+\\.tsx?$': '<rootDir>/tests/transforms/astro-ts-jest.cjs'
  },
  collectCoverage: false
};
