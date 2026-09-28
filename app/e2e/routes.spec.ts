// Route-level journeys: E2E-05 county, E2E-06 song, E2E-07 prev/next, E2E-11 404s, E2E-12 loading
// and error, E2E-14 console cleanliness, E2E-15 source links, E2E-16 journeys.
// Song / county / journeys specs mark themselves fixme while the route still renders the stub.
import { expect, expectOnlyCatalogError, gotoApp, isStub, query, readCount, seededSample, showSongsTab, test, waitForCatalog } from './fixtures'

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
    const names = await table.locator('tbody tr').evaluateAll((rows) => rows.map((r) => r.querySelector('th, td')?.textContent?.trim() ?? ''))
    expect(names.length).toBeGreaterThan(1)
    // default: sorted by village name (the app's roBase collation; assert the header state)
    await expect(table.locator('th[aria-sort]').filter({ hasText: 'Village' })).toHaveAttribute('aria-sort', 'ascending')
    const melodiesHeader = table.getByRole('button', { name: /Sort by Melodies/ })
    const melodiesTh = table.locator('th').filter({ hasText: 'Melodies' })
    await melodiesHeader.click()
    await expect(melodiesTh).toHaveAttribute('aria-sort', 'ascending')
    await melodiesHeader.click()
    await expect(melodiesTh).toHaveAttribute('aria-sort', 'descending')
    const counts = await table.locator('tbody tr').evaluateAll((rows) =>
      rows.slice(0, 5).map((r) => Number((Array.from(r.querySelectorAll('td, th'))[1]?.textContent ?? '').replace(/[^\d]/g, ''))),
    )
    for (let i = 1; i < counts.length; i++) expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i])
    await page.getByRole('tab', { name: 'By genre' }).click()
    await expect.poll(() => query(page).get('tab')).toMatch(/genre/)
    await expect(page.getByRole('tab', { name: 'By genre' })).toHaveAttribute('aria-selected', 'true')
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
    await expect(page.getByRole('tabpanel')).toContainText(`"${song.id}"`)
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

  test('E2E-12 loading skeleton, error state with retry', async ({ page, data, consoleLog }) => {
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
    await showSongsTab(page)
    await expect(page.getByRole('button', { name: /Remove filter: Bihor/ })).toBeVisible()
    expectOnlyCatalogError(consoleLog)
  })

  test('E2E-14 no console errors on every route', async ({ page, data, consoleLog }) => {
    const song = data.song((s) => !!s.source.url)
    for (const path of ['/', `/county/${data.countyId('Bihor')}`, `/song/${song.id}`, '/journeys', '/about', '/nope']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('contentinfo')).toBeVisible()
      // let the catalogue finish loading before the next navigation aborts its fetch
      await expect(page.getByText('Loading the collection...')).toHaveCount(0)
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
      if (path === '/') await waitForCatalog(page)
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

  test('E2E-16 journey mapper', async ({ page, data }, testInfo) => {
    const phone = testInfo.project.name === 'phone-chromium'
    await page.goto(`/journeys?county=${data.countyId('Bihor')}`)
    await expect(page.getByRole('contentinfo')).toBeVisible()
    test.fixme(await isStub(page), '/journeys is still a stub: timeline, trip route, borders and stops not implemented yet')
    await expect(page.getByText('Loading the collection...')).toHaveCount(0)
    // a featured trip is open by default with a clean URL (no trip=)
    await expect(page.getByRole('complementary', { name: 'Trip' }).locator('h1')).toBeVisible()
    expect(query(page).get('trip')).toBeNull()
    const stops = page.locator('ol.stop-list__items')
    await expect(stops).toBeVisible()

    // the trip list: an aside on desktop, a sheet behind "Journeys (n)" on the phone
    const openList = async () => {
      if (!phone) return page.getByRole('complementary', { name: 'Journeys' })
      const button = page.getByRole('button', { name: /^Journeys \(\d+\)/ })
      await button.click()
      const dialog = page.getByRole('dialog', { name: 'Journeys' })
      await expect(dialog).toBeVisible()
      return dialog
    }
    let list = await openList()
    // the timeline is a collapsible year strip; the trips are a listbox grouped by year
    await expect(list.getByRole('region', { name: 'Timeline' })).toBeVisible()
    const trips = list.getByRole('listbox', { name: 'Trips by date' })
    const optionCount = await trips.getByRole('option').count()
    expect(optionCount).toBeGreaterThan(1)
    // pick the first trip (of the first dozen) that has at least one resolved stop
    let tripId: string | null = null
    for (let i = 0; i < Math.min(12, optionCount); i++) {
      if (phone && i > 0) list = await openList()
      const option = list.getByRole('listbox', { name: 'Trips by date' }).getByRole('option').nth(i)
      await option.scrollIntoViewIfNeeded()
      await option.click()
      await expect.poll(() => query(page).get('trip')).not.toBeNull()
      if (phone) await expect(page.getByRole('dialog', { name: 'Journeys' })).toBeHidden()
      await expect(stops).toBeVisible()
      if ((await stops.locator('li.stop-row[data-seq] button:enabled').count()) > 0) {
        tripId = query(page).get('trip')
        break
      }
    }
    expect(tripId, 'a trip with a resolved stop among the first twelve').not.toBeNull()
    await expect(page.getByRole('complementary', { name: 'Trip' }).locator('h1')).toBeVisible()
    expect(await stops.locator('li').count()).toBeGreaterThan(0)
    // context: a collapsed details "Context (n)" that opens to a list of cited entries
    const context = page.locator('details.context-section')
    await expect(context.locator('summary')).toHaveText(/Context \(\d+\)/)
    expect(await context.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(false)
    await context.locator('summary').click()
    await expect(context).toHaveJSProperty('open', true)
    // borders: then / now / compare update the URL when the toggle is offered here
    const borders = page.getByRole('radiogroup', { name: 'Borders' })
    if (await borders.count()) {
      await borders.getByRole('radio', { name: /Borders now/ }).click()
      await expect.poll(() => query(page).get('borders')).toBe('now')
      await borders.getByRole('radio', { name: /Compare/ }).click()
      await expect.poll(() => query(page).get('borders')).toBe('both')
    } else {
      testInfo.annotations.push({ type: 'note', description: 'journeys: no "Borders" radiogroup in the current markup; border toggle not exercised' })
    }
    // opening a stop selects it in the URL
    await stops.locator('li.stop-row[data-seq] button:enabled').first().click()
    await expect.poll(() => query(page).get('stop')).not.toBeNull()
    // back to the explorer keeps the Query
    await page.getByRole('link', { name: 'Bartok / Romania' }).click()
    await waitForCatalog(page)
    expect(query(page).get('county')).toBe(data.countyId('Bihor'))
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
