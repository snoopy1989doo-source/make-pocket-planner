import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative base path so that it runs successfully inside Capacitor (Android)
  // as well as on GitHub Pages subfolder.
  base: './',
  build: {
    outDir: 'www',
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  }
})
