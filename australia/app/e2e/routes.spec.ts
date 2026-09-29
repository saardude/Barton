// Song record, state page, sources page, 404s.
import { expect, gotoApp, query, test } from './fixtures'

test.describe('Routes', () => {
  test('song record: image, lyrics, notes, source link, raw JSON', async ({ page, data }) => {
    const song = data.song((s) => s.media.images.length > 0 && s.text.stanzas.length > 0 && s.notes.text !== null)
    await page.goto(`song/${song.id}`)
    await expect(page.locator('h1')).toContainText(song.title)
    const source = page.locator('.source-link').first()
    await expect(source).toHaveAttribute('href', song.source.url)
    await expect(source).toHaveAttribute('target', '_blank')
    await expect(page.getByRole('img', { name: /Notation of|Masthead of/ }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Lyrics' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible()
    await page.getByRole('tab', { name: 'Raw JSON' }).click()
    await expect(page.getByRole('tabpanel')).toContainText(`"${song.id}"`)
  })

  test('prev / next within the filtered set', async ({ page, isMobile }) => {
    await gotoApp(page, '/?place=au/nsw&sort=title')
    // A deep link with a place opens the phone explorer on the map; the list is a tab away.
    if (isMobile) await page.getByRole('tab', { name: /Songs/ }).click()
    const ids = await page.locator('.song-row').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.songId))
    expect(ids.length).toBeGreaterThan(2)
    await page.locator('.song-row a.song-row__main').nth(1).click()
    await expect(page).toHaveURL(new RegExp(`/song/${ids[1]}\\?place=`))
    await page.getByRole('link', { name: 'Previous song' }).click()
    await expect(page).toHaveURL(new RegExp(`/song/${ids[0]}\\?place=`))
    await page.getByRole('link', { name: 'Next song' }).click()
    await page.getByRole('link', { name: 'Next song' }).click()
    await expect(page).toHaveURL(new RegExp(`/song/${ids[2]}\\?place=`))
    expect(query(page).get('place')).toBe('au/nsw')
  })

  test('state page: header, towns and newspapers tabs', async ({ page, data }) => {
    await page.goto('state/nsw')
    await expect(page.locator('h1')).toContainText('New South Wales')
    await page.getByRole('tab', { name: 'Towns' }).click()
    const rows = page.getByRole('table').locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBe(data.places.filter((p) => p.parent === 'au/nsw').length)
    await page.getByRole('tab', { name: 'Newspapers' }).click()
    await expect(page.getByRole('table').locator('tbody tr').first()).toBeVisible()
    await expect.poll(() => query(page).get('tab')).toBe('papers')
  })

  test('sources page lists newspapers with places', async ({ page }) => {
    await page.goto('sources')
    await expect(page.locator('h1')).toHaveText('Sources')
    await expect(page.getByRole('heading', { name: 'Newspapers cited' })).toBeVisible()
    await expect(page.getByRole('table').first().locator('tbody tr').first()).toContainText(/New South Wales|Victoria|Queensland|South Australia|Western Australia|Tasmania/)
  })

  test('deep-link 404s', async ({ page }) => {
    const res = await page.goto('song/does-not-exist')
    expect(res?.status()).toBe(200)
    await expect(page.getByText(/No record with id does-not-exist/)).toBeVisible()
    await page.goto('no-such-route')
    await expect(page.getByText('Page not found')).toBeVisible()
  })
})
