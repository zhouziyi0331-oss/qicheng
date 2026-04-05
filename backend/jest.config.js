/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^../config$': '<rootDir>/config/index.ts',
    '^../../config$': '<rootDir>/config/index.ts',
  },
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',
  // Set NODE_ENV before any module is imported so rate limiters use test config
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  // runs before each test file, after test framework is installed
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  testTimeout: 15000,
  forceExit: true,
};
