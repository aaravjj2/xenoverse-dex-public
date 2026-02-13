import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js', 'tools/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
  },
});
