// Explorer: load, count, place filter via the tree, search, chips, sort, deep link.
import { expect, fmt, gotoApp, query, test, waitForCatalog } from './fixtures'

test.describe('Explorer', () => {
  test('loads under /australia/ and shows every record', async ({ page, data }) => {
    await gotoApp(page, '/')
    await expect(page).toHaveURL(/\/australia\/?$/)
    await expect(page.getByText(`${fmt(data.songs.length)} of ${fmt(data.songs.length)} songs`).first()).toBeVisible()
    await expect(page.getByRole('contentinfo')).toContainText('Mark Gregory')
  })

  test('selecting a state in the tree filters the list and writes the URL', async ({ page, data, isMobile }) => {
    await gotoApp(page, '/')
    const nsw = data.placeById.get('au/nsw')!
    // On the phone the tree lives in the Places tab; picking a place switches back to the list.
    if (isMobile) await page.getByRole('tab', { name: 'Places' }).click()
    await page.getByRole('button', { name: 'Filter to New South Wales' }).click()
    await expect.poll(() => query(page).get('place')).toBe('au/nsw')
    await expect(page.getByText(`${fmt(nsw.counts.total)} of ${fmt(data.songs.length)} songs`).first()).toBeVisible()
    await page.getByRole('button', { name: /Remove filter: New South Wales/ }).click()
    await expect.poll(() => query(page).get('place')).toBeNull()
  })

  test('search narrows the results and a deep link restores it', async ({ page, data }) => {
    await gotoApp(page, '/')
    // The whole title as the query: every word must match, so the record lands on the first page.
    const s = data.song((x) => x.title.split(' ').filter((w) => w.length > 3).length >= 3)
    const q = s.title
    await page.getByRole('searchbox', { name: 'Search songs' }).fill(q)
    await expect.poll(() => query(page).get('q')).toBe(q)
    await expect(page.locator(`.song-row[data-song-id="${s.id}"]`)).toBeVisible()
    await page.goto(`?q=${encodeURIComponent(q)}`)
    await waitForCatalog(page)
    await expect(page.locator(`.song-row[data-song-id="${s.id}"]`)).toBeVisible()
  })

  test('sort by year descending puts the latest dated record first', async ({ page, data }) => {
    await gotoApp(page, '/?sort=year&dir=desc')
    const latest = Math.max(...data.songs.map((s) => s.year.value ?? -1))
    const first = page.locator('.song-row').first()
    await expect(first).toContainText(String(latest))
  })
})
