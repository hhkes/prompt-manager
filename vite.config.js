import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build: use /prompt-manager/ base on GitHub Pages, / locally
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/prompt-manager/' : '/',
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
