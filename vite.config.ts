import { defineConfig } from 'vite';

export default defineConfig({
  // No base path needed for Vercel - serves from root
  server: {
    open: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Optimize for production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['p5']
        }
      }
    }
  },
  // Optimize dependencies for better performance
  optimizeDeps: {
    include: ['p5']
  }
}); 