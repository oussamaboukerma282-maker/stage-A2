import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api -> backend Express (évite les problèmes CORS en développement).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
