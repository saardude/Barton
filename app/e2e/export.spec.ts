// E2E-08 Export JSON (AC-21).
import { expect, gotoApp, readCount, test } from './fixtures'

test('E2E-08 export JSON matches the shown count and ids', async ({ page, data }, testInfo) => {
  test.skip(testInfo.project.name === 'phone-chromium', 'downloads are exercised on desktop')
  const arad = data.countyId('Arad')
  await gotoApp(page, `/?county=${arad}`)
  const { n } = await readCount(page)
  const button = page.locator('.results__header').getByRole('button', { name: /Export/ })
  await expect(button).toBeEnabled()
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  expect(download.suggestedFilename()).toMatch(new RegExp(`^culegeri-${n}-\\d{8}\\.json$`))
  const path = await download.path()
  expect(path).toBeTruthy()
  const { readFileSync } = await import('node:fs')
  const body = JSON.parse(readFileSync(path as string, 'utf8')) as { count: number; query: string; attribution: unknown; records: { id: string }[] }
  expect(body.count).toBe(n)
  expect(body.records).toHaveLength(n)
  expect(body.query).toContain(`county=${arad}`)
  expect(body.attribution).toBeTruthy()
  const ids = new Set(data.under(arad).map((s) => s.id))
  for (const r of body.records) expect(ids.has(r.id), r.id).toBe(true)
})
