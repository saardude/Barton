// E2E-09 phone viewport journey (AC-28, AC-29) plus the MapPointSheet (AC-25).
import { expect, gotoApp, query, readCount, searchBox, test, waitForCatalog, waitForMapIdle } from './fixtures'

test.describe('Phone explorer', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-chromium', 'phone project only')
  })

  async function noHorizontalScroll(page: import('@playwright/test').Page) {
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
    expect(scrollWidth, 'no horizontal scroll').toBeLessThanOrEqual(innerWidth)
  }

  test('E2E-09 search, small map, list, bottom tabs, filter sheet, song, map tab', async ({ page, data }) => {
    await gotoApp(page, '/')
    await expect(searchBox(page)).toBeVisible()
    await expect(page.locator('.map-section--mini .map-view')).toBeVisible()
    await expect(page.locator('.song-row').first()).toBeVisible()
    const tabs = page.getByRole('navigation', { name: 'Views' })
    await expect(tabs).toBeVisible()
    for (const name of ['Map', /^Songs/, 'Places']) await expect(tabs.getByRole('tab', { name })).toBeVisible()
    await expect(tabs.getByRole('link', { name: 'Journeys' })).toBeVisible()
    await noHorizontalScroll(page)

    // 44 px targets on the bottom bar and the Filters button
    for (const el of await tabs.getByRole('tab').all()) {
      const box = await el.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    }
    const filtersBtn = page.getByRole('button', { name: /^Filters \(\d+\)/ })
    expect((await filtersBtn.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)

    // filter sheet: pick a genre, count updates live, close returns focus
    const before = await readCount(page)
    await filtersBtn.click()
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet).toBeVisible()
    await expect(sheet.locator('*:focus')).toHaveCount(1)
    const colinda = sheet.getByRole('checkbox', { name: /colind/ })
    await colinda.click()
    await expect(colinda).toBeChecked()
    await expect(sheet.getByRole('button', { name: /^Show [\d,]+ melod/ })).toBeVisible()
    await expect.poll(() => query(page).get('genre')).toBe('colinda')
    await expect(sheet.getByRole('button', { name: /^Show [\d,]+ melod/ })).not.toHaveText(/Show 0 /)
    await sheet.getByRole('button', { name: /^Show [\d,]+ melod/ }).click()
    await expect(sheet).toBeHidden()
    await expect(filtersBtn).toBeFocused()
    const after = await readCount(page)
    expect(after.n).toBeLessThan(before.n)
    expect(after.n).toBe(data.ro.filter((s) => s.genre === 'colinda').length)
    await expect(filtersBtn).toHaveText('Filters (1)')

    // open a song: stacked layout, no horizontal scroll
    await page.locator('.song-row a.song-row__main').first().click()
    await expect(page).toHaveURL(/\/song\/.+genre=colinda/)
    await expect(page.locator('h1')).toBeVisible()
    await noHorizontalScroll(page)
    await page.goBack()
    await waitForCatalog(page)

    // Map tab: the map fills the width
    await tabs.getByRole('tab', { name: 'Map' }).click()
    const full = page.locator('.map-section--full .map-view')
    await expect(full).toBeVisible()
    const box = await full.boundingBox()
    expect(box?.width).toBe(390)
    expect(box?.height ?? 0).toBeGreaterThan(300)
    await expect(page.getByRole('button', { name: /^[\d,]+ melodies, view list/ })).toBeVisible()
    await noHorizontalScroll(page)

    // Places tab shows the tree; picking a county filters and returns to Songs
    await tabs.getByRole('tab', { name: 'Places' }).click()
    const tree = page.getByRole('tree', { name: 'Places' })
    await expect(tree).toBeVisible()
    const row = tree.locator(`[role="treeitem"][data-id="${data.countyId('Bihor')}"] .tree__row`)
    await expect(row).toBeVisible()
    expect((await row.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
    await row.click()
    await expect.poll(() => query(page).get('county')).toBe(data.countyId('Bihor'))
    await expect(tabs.getByRole('tab', { name: /^Songs/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.song-row').first()).toBeVisible()
    await noHorizontalScroll(page)
  })

  test('MapPointSheet: tapping a dot opens a bottom sheet with the card and actions', async ({ page, data }) => {
    await gotoApp(page, '/')
    await page.getByRole('tab', { name: 'Map' }).click()
    await waitForMapIdle(page)
    const dot = page.locator('.map-view .dot--county[aria-label^="Bihor ("]')
    await expect(dot).toBeVisible()
    expect((await dot.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44)
    await dot.tap()
    const sheet = page.getByRole('dialog', { name: /Bihor/ })
    await expect(sheet).toBeVisible()
    await expect(sheet).toContainText(/\d+ melodies in \d+ villages/)
    await expect(sheet.getByRole('link', { name: 'Open county page' })).toHaveAttribute('href', new RegExp(`/county/${data.countyId('Bihor')}`))
    // no filter applied yet
    expect(query(page).get('county')).toBeNull()
    // Escape closes and returns focus to the dot
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(dot).toBeFocused()
    // Show melodies filters to the county and switches to the list
    await dot.tap()
    await sheet.getByRole('button', { name: 'Show melodies' }).click()
    await expect.poll(() => query(page).get('county')).toBe(data.countyId('Bihor'))
    await expect(page.getByRole('tab', { name: /^Songs/ })).toHaveAttribute('aria-selected', 'true')
    expect((await readCount(page)).n).toBe(data.under(data.countyId('Bihor')).length)
  })

  test('deep link with a place opens on the Map tab; 320 px has no horizontal scroll', async ({ page, data }) => {
    await gotoApp(page, `/?county=${data.countyId('Bihor')}`)
    await expect(page.getByRole('tab', { name: 'Map' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.map-section--full .map-view')).toBeVisible()
    await page.setViewportSize({ width: 320, height: 640 })
    await page.getByRole('tab', { name: /^Songs/ }).click()
    await expect(page.locator('.song-row').first()).toBeVisible()
    await noHorizontalScroll(page)
  })
})
