import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'backend/vitest.config.ts',
      'admin/vite.config.ts',
      {
        test: {
          name: 'overlay',
          include: ['overlay/**/*.test.js'],
          environment: 'node',
        },
      },
    ],
  },
});
