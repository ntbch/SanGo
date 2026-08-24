/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Workspace package @courthub/shared: dùng trực tiếp TS source khi test,
  // độc lập với thứ tự build trong CI (lint -> typecheck -> test -> build).
  moduleNameMapper: {
    '^@courthub/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
