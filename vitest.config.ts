import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
      include: ['**/*.test.ts'], // Only include test files
      globals: true, // Enbale vitest's globals API
      environment: 'node', // Use node.js environment
      typecheck: {
        tsconfig: 'tsconfig.json', // Ensure that vitest uses the correct tsconfig file
      },
    },
  });