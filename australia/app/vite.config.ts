/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Australia collection is served under /australia/ on the Bartok site (culegeri.vercel.app):
// every asset URL, the data manifest and the router basename carry that prefix (see BASE_PATH).
export const BASE_PATH = '/australia/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  build: {
    // VITE_OUT_DIR lets the e2e run build and preview from its own folder (dist-e2e).
    outDir: process.env.VITE_OUT_DIR ?? 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
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
