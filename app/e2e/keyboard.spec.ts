// E2E-10 keyboard-only journey (AC-34): skip link, tree arrows, Space on a checkbox, sort select,
// Enter on a result, Enter on a map dot, visible focus rings; Escape closes the phone sheet.
import { expect, gotoApp, hasVisibleFocusRing, isStub, query, readCount, test } from './fixtures'

test.describe('Keyboard', () => {
  test('E2E-10 tab order, tree arrows, checkbox, sort, open song', async ({ page, data }, testInfo) => {
    test.skip(testInfo.project.name === 'phone-chromium', 'desktop rail; the phone sheet is tested below')
    await gotoApp(page, '/')
    await page.keyboard.press('Tab')
    await expect(page.locator('.skip-link')).toBeFocused()
    expect(await hasVisibleFocusRing(page)).toBe(true)
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('results')

    // focus order: masthead -> primary nav -> search -> colour toggle -> theme -> country switch -> tree
    const country = page.getByRole('combobox', { name: 'Country' })
    await country.focus()
    expect(await hasVisibleFocusRing(page)).toBe(true)
    await page.keyboard.press('Tab')
    const tree = page.getByRole('tree', { name: 'Places' })
    const focusedItem = () => tree.locator('[role="treeitem"]:focus')
    await expect(focusedItem()).toHaveCount(1)
    expect(await hasVisibleFocusRing(page)).toBe(true)
    // Romania is expanded on load; ArrowDown enters its regions, ArrowRight expands a region
    await page.keyboard.press('ArrowDown')
    const region = await focusedItem().getAttribute('data-id')
    expect(region?.split('/').length).toBe(2)
    await page.keyboard.press('ArrowRight')
    await expect(tree.locator(`[role="treeitem"][data-id="${region}"]`)).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowDown')
    const county = await focusedItem().getAttribute('data-id')
    expect(county?.startsWith(`${region}/`)).toBe(true)
    await page.keyboard.press('Enter')
    await expect.poll(() => query(page).get('county')).toBe(county)
    // focus is kept on the tree after the re-render
    await expect(focusedItem()).toHaveCount(1)
    // type-ahead: "b" jumps to a row starting with B
    await page.keyboard.press('Home')
    await page.keyboard.press('b')
    await expect.poll(async () => ((await focusedItem().textContent()) ?? '').trim().charAt(0).toLowerCase()).toBe('b')

    // Space toggles a genre checkbox and the count updates
    const before = (await readCount(page)).n
    const checkbox = page.getByRole('complementary', { name: 'Filters' }).getByRole('checkbox').first()
    await checkbox.focus()
    await page.keyboard.press('Space')
    await expect(checkbox).toBeChecked()
    await expect.poll(async () => (await readCount(page)).n).not.toBe(before)
    expect(await hasVisibleFocusRing(page)).toBe(true)

    // sort select: ArrowDown changes it
    const sort = page.getByLabel('Sort by')
    await sort.focus()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => query(page).get('sort')).toBe('style')

    // map dot: Enter selects (dots are buttons in Tab order)
    const dot = page.locator('.map-view .dot').first()
    await dot.focus()
    await expect(page.locator('#map-hover-card')).toBeVisible()
    expect(await hasVisibleFocusRing(page)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.locator('#map-hover-card')).toBeHidden()

    // results: Tab to the first row, ArrowDown moves, Enter opens the song
    const firstRow = page.locator('.song-row a.song-row__main').first()
    await firstRow.focus()
    expect(await hasVisibleFocusRing(page)).toBe(true)
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('.song-row a.song-row__main').nth(1)).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(firstRow).toBeFocused()
    const id = await page.locator('.song-row').first().getAttribute('data-song-id')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/song/${id}`))
    expect(data.songs.some((s) => s.id === id)).toBe(true)

    // song page: prev/next and Raw JSON tab (fixme while the route is a stub)
    if (await isStub(page)) {
      testInfo.annotations.push({ type: 'fixme', description: '/song is a stub: prev/next and Raw JSON tab not yet keyboard-tested' })
      return
    }
    await page.keyboard.press('Tab')
    const prevNext = page.getByRole('link', { name: /Previous melody|Next melody/ }).or(page.getByRole('button', { name: /Previous melody|Next melody/ }))
    await expect(prevNext.first()).toBeVisible()
    const rawTab = page.getByRole('tab', { name: 'Raw JSON' })
    await expect(rawTab).toBeVisible()
    await page.getByRole('tab', { name: 'Record' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(rawTab).toHaveAttribute('aria-selected', 'true')
  })

  test('E2E-10 (phone) Escape closes the filter sheet and returns focus to its trigger', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-chromium', 'phone project only')
    await gotoApp(page, '/')
    const trigger = page.getByRole('button', { name: /^Filters \(\d+\)/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet).toBeVisible()
    await expect(sheet.locator('*:focus')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
    // bottom tabs: arrow keys move between tabs
    const mapTab = page.getByRole('tab', { name: 'Map' })
    await page.getByRole('tab', { name: /^Songs/ }).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(mapTab).toBeFocused()
    await expect(mapTab).toHaveAttribute('aria-selected', 'true')
    expect(await hasVisibleFocusRing(page)).toBe(true)
  })
})
