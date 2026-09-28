/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Function form: the object form is not accepted by the current Rolldown/Vite typings.
        manualChunks(id: string) {
          if (id.includes('/node_modules/leaflet/')) return 'leaflet'
          if (id.includes('/node_modules/minisearch/')) return 'search'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
