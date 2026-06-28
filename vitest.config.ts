import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@database': path.resolve(__dirname, 'src/database'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@stores': path.resolve(__dirname, 'src/renderer/stores'),
    },
  },
});
