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
    // Fail build on errors
    failOnWarn: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings that don't break the build
        if (warning.code === 'THIS_IS_UNDEFINED') return
        warn(warning)
      }
    }
  },
  // Clear console on each restart
  clearScreen: false
})
