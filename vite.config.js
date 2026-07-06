// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Forzar la importación del minificado para evitar problemas de build
      'tesseract.js': path.resolve(__dirname, 'node_modules/tesseract.js/dist/tesseract.min.js')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa tesseract en su propio archivo JS para carga diferida
          tesseract: ['tesseract.js']
        }
      }
    }
  }
});