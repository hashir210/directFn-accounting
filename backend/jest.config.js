module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  setupFiles: ['dotenv/config'],
  moduleNameMapper: {
    '^puppeteer$': '<rootDir>/src/__mocks__/puppeteer.js',
  },
};
