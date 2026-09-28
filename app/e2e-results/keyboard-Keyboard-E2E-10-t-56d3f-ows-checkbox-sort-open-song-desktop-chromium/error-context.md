# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: keyboard.spec.ts >> Keyboard >> E2E-10 tab order, tree arrows, checkbox, sort, open song
- Location: e2e/keyboard.spec.ts:6:3

# Error details

```
Error: expect(locator).toBeChecked() failed

Locator:  getByRole('complementary', { name: 'Filters' }).getByRole('checkbox').first()
Expected: checked
Received: unchecked
Timeout:  15000ms

Call log:
  - Expect "toBeChecked" getByRole('complementary', { name: 'Filters' }).getByRole('checkbox').first() with timeout 15000ms
  - waiting for getByRole('complementary', { name: 'Filters' }).getByRole('checkbox').first()
    33 × locator resolved to <input disabled type="checkbox"/>
       - unexpected value "unchecked"

```

```yaml
- checkbox "bocet / lament (0)" [disabled]
```

# Test source

```ts
  1   | // E2E-10 keyboard-only journey (AC-34): skip link, tree arrows, Space on a checkbox, sort select,
  2   | // Enter on a result, Enter on a map dot, visible focus rings; Escape closes the phone sheet.
  3   | import { expect, gotoApp, hasVisibleFocusRing, isStub, query, readCount, test } from './fixtures'
  4   | 
  5   | test.describe('Keyboard', () => {
  6   |   test('E2E-10 tab order, tree arrows, checkbox, sort, open song', async ({ page, data }, testInfo) => {
  7   |     test.skip(testInfo.project.name === 'phone-chromium', 'desktop rail; the phone sheet is tested below')
  8   |     await gotoApp(page, '/')
  9   |     await page.keyboard.press('Tab')
  10  |     await expect(page.locator('.skip-link')).toBeFocused()
  11  |     expect(await hasVisibleFocusRing(page)).toBe(true)
  12  |     await page.keyboard.press('Enter')
  13  |     await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('results')
  14  | 
  15  |     // focus order: masthead -> primary nav -> search -> colour toggle -> theme -> country switch -> tree
  16  |     const country = page.getByRole('combobox', { name: 'Country' })
  17  |     await country.focus()
  18  |     expect(await hasVisibleFocusRing(page)).toBe(true)
  19  |     await page.keyboard.press('Tab')
  20  |     const tree = page.getByRole('tree', { name: 'Places' })
  21  |     const focusedItem = () => tree.locator('[role="treeitem"]:focus')
  22  |     await expect(focusedItem()).toHaveCount(1)
  23  |     expect(await hasVisibleFocusRing(page)).toBe(true)
  24  |     // Romania is expanded on load; ArrowDown enters its regions, ArrowRight expands a region
  25  |     await page.keyboard.press('ArrowDown')
  26  |     const region = await focusedItem().getAttribute('data-id')
  27  |     expect(region?.split('/').length).toBe(2)
  28  |     await page.keyboard.press('ArrowRight')
  29  |     await expect(tree.locator(`[role="treeitem"][data-id="${region}"]`)).toHaveAttribute('aria-expanded', 'true')
  30  |     await page.keyboard.press('ArrowDown')
  31  |     const county = await focusedItem().getAttribute('data-id')
  32  |     expect(county?.startsWith(`${region}/`)).toBe(true)
  33  |     await page.keyboard.press('Enter')
  34  |     await expect.poll(() => query(page).get('county')).toBe(county)
  35  |     // focus is kept on the tree after the re-render
  36  |     await expect(focusedItem()).toHaveCount(1)
  37  |     // type-ahead: "b" jumps to a row starting with B
  38  |     await page.keyboard.press('Home')
  39  |     await page.keyboard.press('b')
  40  |     await expect.poll(async () => ((await focusedItem().textContent()) ?? '').trim().charAt(0).toLowerCase()).toBe('b')
  41  | 
  42  |     // Space toggles a genre checkbox and the count updates
  43  |     const before = (await readCount(page)).n
  44  |     const checkbox = page.getByRole('complementary', { name: 'Filters' }).getByRole('checkbox').first()
  45  |     await checkbox.focus()
  46  |     await page.keyboard.press('Space')
> 47  |     await expect(checkbox).toBeChecked()
      |                            ^ Error: expect(locator).toBeChecked() failed
  48  |     await expect.poll(async () => (await readCount(page)).n).not.toBe(before)
  49  |     expect(await hasVisibleFocusRing(page)).toBe(true)
  50  | 
  51  |     // sort select: ArrowDown changes it
  52  |     const sort = page.getByLabel('Sort by')
  53  |     await sort.focus()
  54  |     await page.keyboard.press('ArrowDown')
  55  |     await expect.poll(() => query(page).get('sort')).toBe('style')
  56  | 
  57  |     // map dot: Enter selects (dots are buttons in Tab order)
  58  |     const dot = page.locator('.map-view .dot').first()
  59  |     await dot.focus()
  60  |     await expect(page.locator('#map-hover-card')).toBeVisible()
  61  |     expect(await hasVisibleFocusRing(page)).toBe(true)
  62  |     await page.keyboard.press('Escape')
  63  |     await expect(page.locator('#map-hover-card')).toBeHidden()
  64  | 
  65  |     // results: Tab to the first row, ArrowDown moves, Enter opens the song
  66  |     const firstRow = page.locator('.song-row a.song-row__main').first()
  67  |     await firstRow.focus()
  68  |     expect(await hasVisibleFocusRing(page)).toBe(true)
  69  |     await page.keyboard.press('ArrowDown')
  70  |     await expect(page.locator('.song-row a.song-row__main').nth(1)).toBeFocused()
  71  |     await page.keyboard.press('ArrowUp')
  72  |     await expect(firstRow).toBeFocused()
  73  |     const id = await page.locator('.song-row').first().getAttribute('data-song-id')
  74  |     await page.keyboard.press('Enter')
  75  |     await expect(page).toHaveURL(new RegExp(`/song/${id}`))
  76  |     expect(data.songs.some((s) => s.id === id)).toBe(true)
  77  | 
  78  |     // song page: prev/next and Raw JSON tab (fixme while the route is a stub)
  79  |     if (await isStub(page)) {
  80  |       testInfo.annotations.push({ type: 'fixme', description: '/song is a stub: prev/next and Raw JSON tab not yet keyboard-tested' })
  81  |       return
  82  |     }
  83  |     await page.keyboard.press('Tab')
  84  |     const prevNext = page.getByRole('link', { name: /Previous melody|Next melody/ }).or(page.getByRole('button', { name: /Previous melody|Next melody/ }))
  85  |     await expect(prevNext.first()).toBeVisible()
  86  |     const rawTab = page.getByRole('tab', { name: 'Raw JSON' })
  87  |     await expect(rawTab).toBeVisible()
  88  |     await page.getByRole('tab', { name: 'Record' }).focus()
  89  |     await page.keyboard.press('ArrowRight')
  90  |     await expect(rawTab).toHaveAttribute('aria-selected', 'true')
  91  |   })
  92  | 
  93  |   test('E2E-10 (phone) Escape closes the filter sheet and returns focus to its trigger', async ({ page }, testInfo) => {
  94  |     test.skip(testInfo.project.name !== 'phone-chromium', 'phone project only')
  95  |     await gotoApp(page, '/')
  96  |     const trigger = page.getByRole('button', { name: /^Filters \(\d+\)/ })
  97  |     await trigger.focus()
  98  |     await page.keyboard.press('Enter')
  99  |     const sheet = page.getByRole('dialog', { name: 'Filters' })
  100 |     await expect(sheet).toBeVisible()
  101 |     await expect(sheet.locator('*:focus')).toHaveCount(1)
  102 |     await page.keyboard.press('Escape')
  103 |     await expect(sheet).toBeHidden()
  104 |     await expect(trigger).toBeFocused()
  105 |     // bottom tabs: arrow keys move between tabs
  106 |     const mapTab = page.getByRole('tab', { name: 'Map' })
  107 |     await page.getByRole('tab', { name: /^Songs/ }).focus()
  108 |     await page.keyboard.press('ArrowLeft')
  109 |     await expect(mapTab).toBeFocused()
  110 |     await expect(mapTab).toHaveAttribute('aria-selected', 'true')
  111 |     expect(await hasVisibleFocusRing(page)).toBe(true)
  112 |   })
  113 | })
  114 | 
```