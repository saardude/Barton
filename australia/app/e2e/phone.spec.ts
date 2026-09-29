// Phone layout (390 px): bottom tabs, filter sheet, map tab.
import { expect, gotoApp, test } from './fixtures'

test.describe('Phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone project only')

  test('bottom tabs switch between list, map and places; the filter sheet opens', async ({ page }) => {
    await gotoApp(page, '/')
    await expect(page.getByRole('tab', { name: /Songs/ })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('tab', { name: 'Places' }).click()
    await expect(page.getByRole('button', { name: 'Filter to New South Wales' })).toBeVisible()
    await page.getByRole('tab', { name: 'Map' }).click()
    await expect(page.locator('.map-view')).toBeVisible()
    await page.getByRole('tab', { name: /Songs/ }).click()
    await page.getByRole('button', { name: /Filters \(\d+\)/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Filters' })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
