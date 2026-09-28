// Capture labelled screenshots for the About page.
// Usage: node scripts/capture-figures.mjs figures.json  (run with the preview server on :4174)
// Each entry: { n, path, width?, height?, clip?, click?: selector[], wait?: ms, focus?: selector }
// Map tiles are fetched server-side through Node fetch (honours the proxy CA) so the sandbox can render them.
import { chromium } from '/tmp/claude-0/-home-user-Barton/ece056fb-e580-5d13-9138-c521b4d23aaf/scratchpad/pw/node_modules/playwright/index.mjs'
import { readFileSync } from 'node:fs'
const figures = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const base = process.env.BASE_URL || 'http://localhost:4174'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const f of figures) {
  const page = await browser.newPage({ viewport: { width: f.width || 1440, height: f.height || 900 }, deviceScaleFactor: 2, colorScheme: 'light' })
  await page.route(/basemaps\.cartocdn\.com|tile\.openstreetmap\.org|zti\.hu/, async (route) => {
    try {
      const res = await fetch(route.request().url(), { headers: { 'User-Agent': 'bartok-viewer-figures' } })
      const buf = Buffer.from(await res.arrayBuffer())
      await route.fulfill({ status: res.status, contentType: res.headers.get('content-type') || 'image/png', body: buf })
    } catch { await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.alloc(0) }) }
  })
  await page.goto(base + f.path, { waitUntil: 'networkidle', timeout: 90000 })
  for (const sel of f.click || []) { await page.locator(sel).first().click({ timeout: 10000 }); await page.waitForTimeout(600) }
  if (f.focus) await page.locator(f.focus).first().focus()
  await page.waitForTimeout(f.wait ?? 2500)
  const out = `public/about/figure-${f.n}.png`
  await page.screenshot({ path: out, clip: f.clip, fullPage: !!f.fullPage })
  console.log('wrote', out, f.path)
  await page.close()
}
await browser.close()
