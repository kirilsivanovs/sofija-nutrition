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
      displayName: 'frontend-ts',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.test.ts'],
      testPathIgnorePatterns: [
        '/node_modules/',
        'booking-state.test.ts',
        'booking-formatters.test.ts',
        'apiClient.test.ts'
      ],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json',
          isolatedModules: true,
          diagnostics: false
        }]
      },
      moduleNameMapper: {
        '\\.\\./constants': '<rootDir>/tests/__mocks__/constants.ts',
        '\\.\\./errors': '<rootDir>/tests/__mocks__/errors.ts'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
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
