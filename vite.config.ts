import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'express',
        'mysql2',
        'cors',
        'path',
        'url',
        'fs'
      ]
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});