import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/fractal-sound/' : '/',
  server: { open: true, port: 3000 },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: true }
}); 