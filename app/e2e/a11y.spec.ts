// axe-core (QA-PLAN section 5): the four screens at desktop and phone, default state, with a
// filter applied and with the sheet open. serious / critical fail; moderate / minor are reported
// as annotations.
import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import { expect, expectOnlyCatalogError, gotoApp, test, waitForCatalog, waitForMapIdle } from './fixtures'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']

async function scan(page: Page, testInfo: TestInfo, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const minor = results.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
  for (const v of minor) {
    testInfo.annotations.push({ type: `axe-${v.impact}`, description: `${label}: ${v.id} (${v.nodes.length} nodes): ${v.help}` })
  }
  const describe = (v: (typeof serious)[number]) => `${v.id} [${v.impact}] ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`
  expect(serious.map(describe), `${label}: serious/critical axe violations`).toEqual([])
}

test.describe('Accessibility (axe)', () => {
  test('explorer: default, filtered, sheet open', async ({ page, data }, testInfo) => {
    await gotoApp(page, '/')
    await scan(page, testInfo, '/ default')
    await gotoApp(page, `/?county=${data.countyId('Bihor')}&genre=colinda`)
    await scan(page, testInfo, '/ filtered')
    const filters = page.getByRole('button', { name: /^Filters \(\d+\)/ })
    if (await filters.isVisible()) {
      await filters.click()
      await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
      await scan(page, testInfo, '/ filter sheet open')
      await page.keyboard.press('Escape')
    }
    if (testInfo.project.name === 'phone-chromium') {
      await page.getByRole('tab', { name: 'Map' }).click()
      await scan(page, testInfo, '/ phone map tab')
      await waitForMapIdle(page)
      await page.locator('.map-view .dot').first().tap()
      await expect(page.getByRole('dialog')).toBeVisible()
      await scan(page, testInfo, '/ phone map point sheet')
      await page.keyboard.press('Escape')
      await page.getByRole('tab', { name: 'Places' }).click()
      await scan(page, testInfo, '/ phone places tab')
    }
  })

  test('county page', async ({ page, data }, testInfo) => {
    await page.goto(`/county/${data.countyId('Bihor')}`)
    await expect(page.locator('h1')).toBeVisible()
    await scan(page, testInfo, '/county')
  })

  test('song page', async ({ page, data }, testInfo) => {
    const song = data.song((s) => s.media.notation.length > 0 && !!s.source.url)
    await page.goto(`/song/${song.id}`)
    await expect(page.locator('h1')).toBeVisible()
    await scan(page, testInfo, '/song')
  })

  test('journeys page', async ({ page }, testInfo) => {
    await page.goto('/journeys')
    await expect(page.locator('h1')).toBeVisible()
    await scan(page, testInfo, '/journeys')
  })

  test('not found and about', async ({ page }, testInfo) => {
    await page.goto('/random/path')
    await expect(page.getByText('Page not found')).toBeVisible()
    await scan(page, testInfo, '/random/path')
    await page.goto('/about')
    await expect(page.locator('h1')).toBeVisible()
    await scan(page, testInfo, '/about')
  })

  test('error state', async ({ page, consoleLog }, testInfo) => {
    await page.route('**/data/songs*.json', (route) => route.abort('failed'))
    await page.goto('/')
    await expect(page.getByRole('alert')).toBeVisible()
    await scan(page, testInfo, '/ error state')
    await page.unroute('**/data/songs*.json')
    await page.getByRole('button', { name: 'Retry' }).click()
    await waitForCatalog(page)
    expectOnlyCatalogError(consoleLog)
  })
})
