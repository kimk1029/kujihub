import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://kimk1029.synology.me:9933', changeOrigin: true },
      '/health': { target: 'http://kimk1029.synology.me:9933', changeOrigin: true },
    },
  },
})
