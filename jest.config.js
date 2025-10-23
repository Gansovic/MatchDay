const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './apps/player',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment
  testEnvironment: 'jsdom', // Use jsdom for component tests (default)
  
  // Module path mapping for TypeScript imports
  moduleNameMapper: {
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^@/(.*)$': '<rootDir>/apps/player/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@matchday/(.*)$': '<rootDir>/packages/$1/src',
  },
  
  // Test file patterns - now looking in the organized tests directory
  testMatch: [
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/apps/**/src/**/*.{test,spec}.{js,jsx,ts,tsx}', // Keep for any remaining inline tests
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'apps/player/src/**/*.{js,jsx,ts,tsx}',
    'apps/admin/src/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/app/**/layout.tsx',
    '!**/app/**/loading.tsx',
    '!**/app/**/error.tsx',
    '!**/app/**/not-found.tsx',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**',
  ],

  // Coverage reporters - HTML for dashboard + text for console
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Coverage thresholds - enforce minimum coverage
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
    // Higher thresholds for critical code
    './packages/services/src/**/*.ts': {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Increase test timeout for integration tests
  testTimeout: 30000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)