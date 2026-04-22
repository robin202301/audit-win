import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
    },
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@components': resolve(__dirname, 'src/renderer/components'),
      '@views': resolve(__dirname, 'src/renderer/views'),
      '@stores': resolve(__dirname, 'src/renderer/stores'),
      '@hooks': resolve(__dirname, 'src/renderer/hooks'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
