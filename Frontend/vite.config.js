import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('@react-oauth')) return 'vendor-google';
            if (id.includes('lucide-react')) return 'vendor-ui';
            return 'vendor';
          }
          if (id.includes('/pages/jobseeker/')) return 'jobseeker';
          if (id.includes('/pages/employer/')) return 'employer';
          if (id.includes('/pages/admin/')) return 'admin';
        },
      },
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})