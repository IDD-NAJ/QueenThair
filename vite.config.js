import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false, // Allow fallback to other ports
    open: true,
    host: true, // Allow external connections
    cors: true, // Enable CORS for development
    hmr: {
      overlay: true, // Show error overlay
      clientPort: undefined // Auto-detect port
    }
  },
  build: {
    failOnWarn: false,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          animations: ['framer-motion'],
          icons: ['lucide-react'],
          charts: ['recharts'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          state: ['zustand']
        }
      },
      onwarn(warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  // Clear console on each restart
  clearScreen: false
})
