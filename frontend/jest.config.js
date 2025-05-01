module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^\.\./config$': '<rootDir>/src/config.ts',
    '^\.\./\.\./config$': '<rootDir>/src/config.ts',
    '^\.\./\.\./\.\./config$': '<rootDir>/src/config.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],
  setupFilesAfterEnv: [
    './jest.setup.js'
  ],
};
