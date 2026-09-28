// Playwright (QA-PLAN section 4): desktop-chromium 1366x800 and phone-chromium 390x844 (touch,
// DSF 2) against `vite preview` on http://localhost:4173. The container ships Chromium under
// /opt/pw-browsers; we point at it directly and never run `playwright install`.
import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers'
const PORT = 4173
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined)
// Build first unless dist/ already exists (set E2E_BUILD=1 to force a rebuild).
const needsBuild = process.env.E2E_BUILD === '1' || !existsSync(new URL('./dist/index.html', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]] : 'list',
  outputDir: 'e2e-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 } },
    },
    {
      name: 'phone-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
      },
    },
  ],
  webServer: {
    command: `${needsBuild ? 'npm run build && ' : ''}npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
