// Route-level journeys: E2E-05 county, E2E-06 song, E2E-07 prev/next, E2E-11 404s, E2E-12 loading
// and error, E2E-14 console cleanliness, E2E-15 source links, E2E-16 journeys.
// Song / county / journeys specs mark themselves fixme while the route still renders the stub.
import { expect, gotoApp, isStub, query, readCount, seededSample, test, waitForCatalog } from './fixtures'

test.describe('Routes', () => {
  test('E2E-05 county drill-down', async ({ page, data }) => {
    const bihor = data.countyId('Bihor')
    await gotoApp(page, `/?county=${bihor}`)
    await page.getByRole('link', { name: 'Open county page' }).first().click()
    await expect(page).toHaveURL(new RegExp(`/county/${bihor}`))
    await expect(page.locator('h1')).toContainText('Bihor')
    test.fixme(await isStub(page), '/county is still a stub: villages table, tabs and sorting not implemented yet')
    const table = page.getByRole('table').first()
    await expect(table).toBeVisible()
    const names = await table.locator('tbody tr td:first-child').allTextContents()
    expect(names.length).toBeGreaterThan(1)
    await table.getByRole('button', { name: /Sort by Melodies/ }).click()
    await expect.poll(() => table.locator('tbody tr td:first-child').first().textContent()).not.toBe(names[0])
    await page.getByRole('tab', { name: 'By genre' }).click()
    await expect.poll(() => query(page).get('tab')).toBe('genre')
    await page.goBack()
    await page.goBack()
    await waitForCatalog(page)
    await expect.poll(() => query(page).get('county')).toBe(bihor)
  })

  test('E2E-06 song record: notation, audio, raw JSON, source link, attribution', async ({ page, data }) => {
    const song = data.song((s) => s.media.notation.length > 0 && s.media.audio.length > 0 && !!s.source.url)
    await page.goto(`/song/${song.id}`)
    await expect(page.locator('h1')).toBeVisible()
    // source link and footer are already in the stub (AC-33, AC-36)
    const source = page.locator('.source-link').first()
    await expect(source).toHaveAttribute('href', song.source.url ?? '')
    await expect(source).toHaveAttribute('target', '_blank')
    await expect(source).toHaveAttribute('rel', /noopener/)
    await expect(page.getByRole('contentinfo')).toContainText('HUN-REN BTK Institute for Musicology')
    test.fixme(await isStub(page), '/song is still a stub: notation image, audio player and Raw JSON tab not implemented yet')
    const notation = page.getByRole('img', { name: /Notation/ }).first()
    await expect(notation).toBeVisible()
    await expect(page.locator('audio[controls]')).toHaveCount(song.media.audio.length)
    await page.getByRole('tab', { name: 'Raw JSON' }).click()
    await expect(page.locator('pre, code').filter({ hasText: `"id": "${song.id}"` }).first()).toBeVisible()
  })

  test('E2E-07 prev / next within the filtered set', async ({ page, data }) => {
    const arad = data.countyId('Arad')
    await gotoApp(page, `/?county=${arad}&sort=title`)
    const ids = await page.locator('.song-row').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.songId))
    expect(ids.length).toBeGreaterThan(2)
    await page.locator('.song-row a.song-row__main').nth(1).click()
    await expect(page).toHaveURL(new RegExp(`/song/${ids[1]}\\?county=`))
    test.fixme(await isStub(page), '/song is still a stub: Previous / Next not implemented yet')
    const prev = page.getByRole('link', { name: 'Previous melody' })
    const next = page.getByRole('link', { name: 'Next melody' })
    await prev.click()
    await expect(page).toHaveURL(new RegExp(`/song/${ids[0]}\\?county=`))
    await next.click()
    await next.click()
    await expect(page).toHaveURL(new RegExp(`/song/${ids[2]}\\?county=`))
    expect(query(page).get('county')).toBe(arad)
  })

  test('E2E-11 deep-link 404: unknown song and unknown route', async ({ page }) => {
    const res = await page.goto('/song/does-not-exist')
    expect(res?.status()).toBe(200)
    await expect(page.getByText(/No record with id does-not-exist/)).toBeVisible()
    await expect(page).toHaveTitle(/not found/i)
    await expect(page.getByRole('link', { name: 'Back to explorer' })).toHaveAttribute('href', /^\/(\?.*)?$/)
    await expect(page.getByRole('contentinfo')).toBeVisible()

    const res2 = await page.goto('/random/path')
    expect(res2?.status()).toBe(200)
    await expect(page.getByText('Page not found')).toBeVisible()
    await expect(page).toHaveTitle(/not found/i)
    await page.getByRole('link', { name: 'Back to explorer' }).click()
    await waitForCatalog(page)
  })

  test('E2E-12 loading skeleton, error state with retry', async ({ page, data }) => {
    // slow songs -> the loading state is observable
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => (release = r))
    await page.route('**/data/songs*.json', async (route) => {
      await gate
      await route.continue()
    })
    await page.goto('/')
    const busy = page.locator('[aria-busy="true"]').first()
    await expect(busy).toBeVisible()
    await expect(page.locator('.skeleton__row').first()).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.locator('.results__count')).not.toHaveText(/^0 of/)
    release()
    await page.unroute('**/data/songs*.json')
    await waitForCatalog(page)

    // failing songs -> error state; retry recovers, keeping the deep-linked filters
    await page.route('**/data/songs*.json', (route) => route.abort('failed'))
    await page.goto(`/?county=${data.countyId('Bihor')}`)
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('The collection could not be loaded')
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await page.unroute('**/data/songs*.json')
    await alert.getByRole('button', { name: 'Retry' }).click()
    await waitForCatalog(page)
    await expect(page.getByRole('button', { name: /Remove filter: Bihor/ })).toBeVisible()
  })

  test('E2E-14 no console errors on every route', async ({ page, data, consoleLog }) => {
    const song = data.song((s) => !!s.source.url)
    for (const path of ['/', `/county/${data.countyId('Bihor')}`, `/song/${song.id}`, '/journeys', '/about', '/nope']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('contentinfo')).toBeVisible()
    }
    expect(consoleLog.errors).toEqual([])
    expect(consoleLog.pageErrors).toEqual([])
  })

  test('E2E-15 source links: rows and record pages point at source.url', async ({ page, data }, testInfo) => {
    test.setTimeout(180_000)
    await gotoApp(page, '/')
    // every visible row: the source link href equals the record's source.url
    const rows = page.locator('.song-row')
    const n = Math.min(await rows.count(), 20)
    for (let i = 0; i < n; i++) {
      const id = await rows.nth(i).getAttribute('data-song-id')
      const song = data.songs.find((s) => s.id === id)
      expect(song, id ?? '').toBeTruthy()
      const link = rows.nth(i).locator('a.source-link')
      if (song?.source.url) {
        await expect(link).toHaveAttribute('href', song.source.url)
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', /noopener/)
      }
    }
    // footer: the three source databases
    const footer = page.getByRole('contentinfo')
    for (const host of ['bartok-nepzene.zti.hu', 'systems.zti.hu', 'bartok-gyujtesek.zti.hu']) {
      await expect(footer.locator(`a[href*="${host}"]`)).toHaveCount(1)
    }
    // 20 seeded record pages (desktop only: the phone run repeats the same assertions)
    if (testInfo.project.name === 'phone-chromium') return
    const sample = seededSample(
      data.songs.filter((s) => !!s.source.url),
      20,
    )
    for (const song of sample) {
      await page.goto(`/song/${song.id}`)
      const link = page.locator('a.source-link').first()
      await expect(link).toHaveAttribute('href', song.source.url ?? '')
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
    }
  })

  test('E2E-16 journey mapper', async ({ page }) => {
    await page.goto('/journeys')
    await expect(page.locator('h1')).toContainText('Journeys')
    await expect(page.getByRole('contentinfo')).toBeVisible()
    test.fixme(await isStub(page), '/journeys is still a stub: timeline, trip route, borders and stops not implemented yet')
    const listbox = page.getByRole('listbox').first()
    await expect(listbox).toBeVisible()
    await listbox.getByRole('option').first().click()
    await expect.poll(() => query(page).get('trip')).not.toBeNull()
    await expect(page.locator('ol').filter({ hasText: /1/ }).first()).toBeVisible()
    await page.getByRole('button', { name: /now/i }).click()
    await expect.poll(() => query(page).get('borders')).toBe('now')
  })

  test('explorer count is consistent with the county page', async ({ page, data }) => {
    const bihor = data.countyId('Bihor')
    await gotoApp(page, `/?county=${bihor}`)
    const n = (await readCount(page)).n
    expect(n).toBe(data.under(bihor).length)
    await page.getByRole('link', { name: 'Open county page' }).first().click()
    await expect(page.locator('.stats__n').first()).toHaveText(String(n))
  })
})
