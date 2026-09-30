// Axe on the four main screens, desktop and phone.
import AxeBuilder from '@axe-core/playwright'
import { expect, gotoApp, test } from './fixtures'

const pages = [
  { name: 'explorer', path: '/' },
  { name: 'sources', path: '/sources' },
  { name: 'about', path: '/about' },
]

for (const p of pages) {
  test(`axe: ${p.name}`, async ({ page }) => {
    if (p.path === '/') await gotoApp(page, p.path)
    else {
      await page.goto(p.path.replace(/^\//, ''))
      await expect(page.locator('h1')).toBeVisible()
    }
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.leaflet-container').analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })
}

test('axe: song record', async ({ page, data }) => {
  const song = data.song((s) => s.media.images.length > 0)
  await page.goto(`song/${song.id}`)
  await expect(page.locator('h1')).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})
