module.exports = {
  testEnvironment: 'jsdom',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js'],
  collectCoverage: false,
  
  // Use projects to run tests with different configurations
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      transform: {}
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/api/tests/**/*.test.js'],
      rootDir: '.',
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: '<rootDir>/api/tsconfig.json',
          isolatedModules: true
        }],
        '^.+\\.jsx?$': 'babel-jest'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      moduleNameMapper: {
        '@azure/data-tables': '<rootDir>/api/tests/__mocks__/azure-data-tables.js'
      }
    }
  ]
};
