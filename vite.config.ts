import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Supprimer les console.log en production uniquement
    removeConsole({
      includes: ['log', 'warn'], // Supprimer console.log et console.warn
      excludes: ['error'], // Conserver console.error pour le débogage critique
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
