// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lấy URL từ environment variable hoặc dùng mặc định
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://datnwebshopplatform-production.up.railway.app';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url, '->', options.target + proxyReq.path);
          });
        }
      },
      '/ws': {
        target: BACKEND_URL.replace('https', 'wss'),
        ws: true,
        changeOrigin: true,
        secure: true
      }
    }
  }
})