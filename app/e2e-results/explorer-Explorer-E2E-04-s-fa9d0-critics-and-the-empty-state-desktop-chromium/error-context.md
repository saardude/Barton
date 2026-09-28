# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: explorer.spec.ts >> Explorer >> E2E-04 search, with diacritics, and the empty state
- Location: e2e/explorer.spec.ts:95:3

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator: getByRole('button', { name: /Export/ }).first()
Expected: disabled
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeDisabled" getByRole('button', { name: /Export/ }).first() with timeout 15000ms
  - waiting for getByRole('button', { name: /Export/ }).first()

```

```yaml
- link "Skip to results":
  - /url: "#results"
- banner:
  - link "Bartok / Romania":
    - /url: /?q=zzzzqqqq
  - navigation "Primary":
    - link "Explorer":
      - /url: /?q=zzzzqqqq
    - link "Journeys":
      - /url: /journeys?q=zzzzqqqq
    - link "About and sources":
      - /url: /about?q=zzzzqqqq
  - searchbox "Search melodies": zzzzqqqq
  - button "Clear search": ×
  - button "Colour by genre"
  - text: Theme
  - combobox "Theme":
    - option "Auto" [selected]
    - option "Light"
    - option "Dark"
- complementary "Filters":
  - heading "Filters" [level=2]
  - group:
    - text: Place Loc / Hely Country
    - combobox "Country":
      - option "Romania" [selected]
      - option "Croatia"
      - option "Hungary"
      - option "Serbia"
      - option "Slovakia"
      - option "Ukraine"
      - option "Unknown country"
      - option "All countries"
    - tree "Places":
      - treeitem "Romania 0" [expanded] [level=1] [selected]
      - treeitem "Banat 0" [level=2]
      - treeitem "Bukovina 0" [level=2]
      - treeitem "Crișana 0" [level=2]
      - treeitem "Maramureș 0" [level=2]
      - treeitem "Moldavia 0" [level=2]
      - treeitem "Transylvania 0" [level=2]
      - treeitem "(county unknown)not mapped 0" [level=2]
      - treeitem "Croatia 0" [level=1]
      - treeitem "Hungary 0" [level=1]
      - treeitem "Serbia 0" [level=1]
      - treeitem "Slovakia 0" [level=1]
      - treeitem "Ukraine 0" [level=1]
      - treeitem "Unknown countrynot mapped 0" [level=1]
  - group:
    - text: Genre Gen / Műfaj
    - group "Genre":
      - checkbox "bocet / lament (0)" [disabled]
      - text: bocet / lament (0)
      - checkbox "colindă / winter carol (0)" [disabled]
      - text: colindă / winter carol (0)
      - checkbox "doină / lyrical improvised song (hora lungă) (0)" [disabled]
      - text: doină / lyrical improvised song (hora lungă) (0)
      - checkbox "joc / dance tune (0)" [disabled]
      - text: joc / dance tune (0)
      - checkbox "cântec de nuntă / wedding song (0)" [disabled]
      - text: cântec de nuntă / wedding song (0)
      - checkbox "cântec (propriu-zis) / song proper (0)" [disabled]
      - text: cântec (propriu-zis) / song proper (0)
      - checkbox "altele / other / unclassified (0)" [disabled]
      - text: altele / other / unclassified (0)
  - group:
    - text: Style Stil / Stílus
    - group "Style":
      - button "instrumental (0)" [disabled]
      - button "mixed style (0)" [disabled]
      - button "new style (0)" [disabled]
      - button "not classified (0)" [disabled]
      - button "old style (0)" [disabled]
  - group:
    - text: Performance Interpretare / Előadásmód
    - group "Performance":
      - button "vocal (0)" [disabled]
      - button "instrumental (0)" [disabled]
      - button "vocal and instrumental (0)" [disabled]
      - button "unknown (0)" [disabled]
  - group:
    - text: Instrument Instrument / Hangszer
    - group "Instrument"
  - group:
    - text: Year An / Év From
    - spinbutton "From": "1865"
    - text: To
    - spinbutton "To": "1943"
    - img "Melodies per 5 years, 1865 to 1944; most in 1865s"
    - text: From
    - slider "From": "1865"
    - text: To
    - slider "To": "1943"
  - button "Clear all filters"
- main:
  - region "Map":
    - application "Map of melodies; use the list after the map for keyboard access":
      - link "Leaflet":
        - /url: https://leafletjs.com
      - text: ©
      - link "OpenStreetMap":
        - /url: https://www.openstreetmap.org/copyright
      - text: contributors ©
      - link "CARTO":
        - /url: https://carto.com/attributions
    - button "Zoom in": +
    - button "Zoom out": −
    - button "Fit to Romania"
    - button "Colour by genre"
    - text: "Dot size: melodies 1 1 1"
    - group: List counties (0)
  - region "Results":
    - text: 0 of 4,072 melodies Sort by
    - combobox "Sort by":
      - option "Title" [selected]
      - option "Style"
      - option "Location"
      - option "Year"
      - option "Source number"
    - button "Toggle sort direction": ↑
    - button "Nothing to export" [disabled]: Export JSON
    - 'button "Remove filter: \"zzzzqqqq\""': "\"zzzzqqqq\""
    - button "Clear all filters"
    - heading "No melodies match \"zzzzqqqq\"." [level=3]
    - paragraph: Search matches titles, incipits, performers, collectors, reference codes and place names.
    - button "Clear search"
    - button "Clear all filters"
- status "Query status":
  - code: "?q=zzzzqqqq"
  - button "Copy link"
  - text: 0 of 4,072 melodies
  - button "Nothing to export" [disabled]: Export JSON
- contentinfo:
  - paragraph:
    - text: "Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives): \""
    - link "Folk Music in Bartók's Compositions":
      - /url: https://bartok-nepzene.zti.hu/en/
    - text: "\", \""
    - link "The Bartók System":
      - /url: https://systems.zti.hu/br/en
    - text: "\" and \""
    - link "Béla Bartók, the Ethnomusicologist":
      - /url: https://bartok-gyujtesek.zti.hu/en
    - text: "\"."
  - paragraph: Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
  - paragraph:
    - text: "Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975),"
    - link "open volumes on the Internet Archive":
      - /url: https://archive.org/details/rumanianfolkmusi0004blab
    - text: ; only facts and incipits are indexed.
  - paragraph:
    - text: "Map: ©"
    - link "OpenStreetMap":
      - /url: https://www.openstreetmap.org/copyright
    - text: contributors, ©
    - link "CARTO":
      - /url: https://carto.com/attributions
    - text: ". County boundaries: Natural Earth."
  - paragraph:
    - link "About and sources":
      - /url: /about
- status
```

# Test source

```ts
  13  |     for (const s of data.ro) {
  14  |       const id = s.location.placeId
  15  |       if (!id) continue
  16  |       const parts = id.split('/')
  17  |       if (parts.length < 3) continue
  18  |       const county = parts.slice(0, 3).join('/')
  19  |       const p = data.placeById.get(county)
  20  |       if (p && p.lat !== null && p.lng !== null) mappedCounties.add(county)
  21  |     }
  22  |     await expect(page.locator('.map-view .dot--county')).toHaveCount(mappedCounties.size)
  23  | 
  24  |     // 2. click Arad
  25  |     const arad = countyDot(page, 'Arad')
  26  |     const label = (await arad.getAttribute('aria-label')) ?? ''
  27  |     const bubbleCount = Number(/: ([\d,]+) melodies/.exec(label)?.[1].replace(/,/g, ''))
  28  |     await arad.click()
  29  |     await expect(page.getByRole('button', { name: /Remove filter: Arad/ })).toBeVisible()
  30  |     await expect.poll(() => query(page).get('county')).toBe(data.countyId('Arad'))
  31  |     const c1 = await readCount(page)
  32  |     expect(c1.n).toBe(bubbleCount)
  33  |     expect(c1.n).toBe(data.under(data.countyId('Arad')).length)
  34  |     expect(c1.n).toBeLessThan(c0.n)
  35  | 
  36  |     // 3. sort by style
  37  |     await page.getByLabel('Sort by').selectOption('style')
  38  |     await expect.poll(() => query(page).get('sort')).toBe('style')
  39  |     const firstId = await page.locator('.song-row').first().getAttribute('data-song-id')
  40  |     const first = data.songs.find((s) => s.id === firstId)
  41  |     expect(first).toBeTruthy()
  42  |     if (data.under(data.countyId('Arad')).some((s) => s.style !== null)) expect(first?.style).not.toBeNull()
  43  | 
  44  |     // remember the results scroll position, then open the first song
  45  |     const results = page.locator('.results')
  46  |     await results.evaluate((el) => el.scrollTo(0, 300))
  47  |     const scrollBefore = await results.evaluate((el) => el.scrollTop)
  48  |     await page.locator('.song-row a.song-row__main').first().click()
  49  |     await expect(page).toHaveURL(new RegExp(`/song/${firstId}\\?.*county=`))
  50  |     await expect(page.locator('h1')).toContainText(first?.title?.trim() || first?.incipit?.trim() || 'Untitled')
  51  | 
  52  |     // 5. back keeps county chip, sort, count and scroll position
  53  |     await page.goBack()
  54  |     await waitForCatalog(page)
  55  |     await expect(page.getByRole('button', { name: /Remove filter: Arad/ })).toBeVisible()
  56  |     await expect(page.getByLabel('Sort by')).toHaveValue('style')
  57  |     expect((await readCount(page)).n).toBe(c1.n)
  58  |     await expect.poll(() => results.evaluate((el) => el.scrollTop)).toBeGreaterThan(scrollBefore - 50)
  59  |   })
  60  | 
  61  |   test('E2E-02 URL paste restores state', async ({ page, data }) => {
  62  |     const bihor = data.countyId('Bihor')
  63  |     await gotoApp(page, `/?county=${bihor}&genre=colinda,joc&from=1909&to=1912&sort=year&dir=desc`)
  64  |     const expected = data.under(bihor).filter((s) => (s.genre === 'colinda' || s.genre === 'joc') && s.collected.year !== null && s.collected.year >= 1909 && s.collected.year <= 1912)
  65  |     expect((await readCount(page)).n).toBe(expected.length)
  66  |     // chips
  67  |     for (const name of [/Remove filter: Bihor/, /Remove filter: colind/, /Remove filter: joc/, /Remove filter: 1909-1912/]) {
  68  |       await expect(page.getByRole('button', { name })).toBeVisible()
  69  |     }
  70  |     await expect(page.getByLabel('Sort by')).toHaveValue('year')
  71  |     await expect(page.getByRole('button', { name: 'Toggle sort direction' })).toHaveAttribute('aria-pressed', 'true')
  72  |     // the status bar shows the canonical string
  73  |     await expect(page.locator('.statusbar__query')).toHaveText(`?county=${bihor}&genre=colinda,joc&from=1909&to=1912&sort=year&dir=desc`)
  74  |     // the filter rail (desktop) or sheet (phone) reflects every value
  75  |     const isPhone = (await page.locator('.explorer--phone').count()) > 0
  76  |     if (isPhone) await page.getByRole('button', { name: /^Filters/ }).click()
  77  |     const rail = isPhone ? page.getByRole('dialog', { name: 'Filters' }) : page.getByRole('complementary', { name: 'Filters' })
  78  |     await expect(rail.locator(`[role="treeitem"][data-id="${bihor}"]`)).toHaveAttribute('aria-selected', 'true')
  79  |     await expect(rail.getByRole('checkbox', { name: /colind/ })).toBeChecked()
  80  |     await expect(rail.getByRole('checkbox', { name: /^joc/ })).toBeChecked()
  81  |     await expect(rail.getByRole('spinbutton', { name: 'From' })).toHaveValue('1909')
  82  |     await expect(rail.getByRole('spinbutton', { name: 'To' })).toHaveValue('1912')
  83  |   })
  84  | 
  85  |   test('E2E-03 clear all', async ({ page, data }) => {
  86  |     const bihor = data.countyId('Bihor')
  87  |     await gotoApp(page, `/?county=${bihor}&genre=colinda,joc&from=1909&to=1912&sort=year&dir=desc`)
  88  |     await page.locator('.results__chips').getByRole('button', { name: 'Clear all filters' }).click()
  89  |     await expect(page).toHaveURL(/\/$/)
  90  |     expect(query(page).toString()).toBe('')
  91  |     expect((await readCount(page)).n).toBe(data.ro.length)
  92  |     await expect(page.locator('.results__chips .chip')).toHaveCount(0)
  93  |   })
  94  | 
  95  |   test('E2E-04 search, with diacritics, and the empty state', async ({ page, data }) => {
  96  |     await gotoApp(page, '/')
  97  |     const box = searchBox(page)
  98  |     await box.fill('sculati')
  99  |     await expect.poll(() => query(page).get('q')).toBe('sculati')
  100 |     await expect(page.locator('.song-row').first()).toBeVisible()
  101 |     const titles = await page.locator('.song-row__title').allTextContents()
  102 |     expect(titles.some((t) => /scula/i.test(t))).toBe(true)
  103 |     // diacritics: "Sculați" finds the same records (diacritic-insensitive, FRONTEND-SPEC 4)
  104 |     await box.fill('Sculați')
  105 |     await expect.poll(async () => (await readCount(page)).n).toBeGreaterThan(0)
  106 |     const withDiacritics = (await readCount(page)).n
  107 |     await box.fill('sculati')
  108 |     await expect.poll(async () => (await readCount(page)).n).toBe(withDiacritics)
  109 |     expect(data.songs.some((s) => /scula/i.test(`${s.title ?? ''} ${s.incipit ?? ''}`))).toBe(true)
  110 |     // nonsense -> empty state with "Clear search"
  111 |     await box.fill('zzzzqqqq')
  112 |     await expect(page.getByText(/No melodies match "zzzzqqqq"/)).toBeVisible()
> 113 |     await expect(page.getByRole('button', { name: /Export/ }).first()).toBeDisabled()
      |                                                                        ^ Error: expect(locator).toBeDisabled() failed
  114 |     await page.getByRole('button', { name: 'Clear search' }).click()
  115 |     await expect.poll(async () => (await readCount(page)).n).toBe(data.ro.length)
  116 |     await expect(box).toHaveValue('')
  117 |   })
  118 | 
  119 |   test('E2E-13 map interactions: hover card, click narrows, clear, village dots, list fallback', async ({ page, data }, testInfo) => {
  120 |     test.skip(testInfo.project.name === 'phone-chromium', 'touch map interactions are covered by E2E-09')
  121 |     await gotoApp(page, '/')
  122 |     const bihor = countyDot(page, 'Bihor')
  123 |     await bihor.hover()
  124 |     const card = page.locator('#map-hover-card')
  125 |     await expect(card).toBeVisible()
  126 |     await expect(card).toContainText('Bihor')
  127 |     await expect(card).toContainText(/\d+ melodies in \d+ villages/)
  128 |     await bihor.click()
  129 |     const bihorId = data.countyId('Bihor')
  130 |     await expect.poll(() => query(page).get('county')).toBe(bihorId)
  131 |     // village mode: dots for the villages of Bihor
  132 |     await expect(page.locator('.map-view .dot--village').first()).toBeVisible()
  133 |     const villageDots = page.locator('.map-view .dot--village')
  134 |     expect(await villageDots.count()).toBeGreaterThan(1)
  135 |     const villageLabel = (await villageDots.first().getAttribute('aria-label')) ?? ''
  136 |     await villageDots.first().click()
  137 |     await expect.poll(() => query(page).get('village')).toMatch(new RegExp(`^${bihorId}/`))
  138 |     await expect(page.getByRole('button', { name: new RegExp(`Remove filter: ${villageLabel.split(',')[0].replace(/[()]/g, '\\$&').slice(0, 12)}`) })).toBeVisible()
  139 |     // clearing with the chip's x goes back to the county
  140 |     await page.getByRole('button', { name: /Remove filter: / }).first().click()
  141 |     await expect.poll(() => query(page).get('village')).toBeNull()
  142 |     await page.getByRole('button', { name: /Remove filter: Bihor/ }).click()
  143 |     await expect.poll(() => query(page).get('county')).toBeNull()
  144 |     // keyboard fallback list
  145 |     const summary = page.getByText(/List counties \(\d+\)/)
  146 |     await expect(summary).toBeVisible()
  147 |     await summary.click()
  148 |     const item = page.locator('.map-list__item').first()
  149 |     await expect(item).toBeVisible()
  150 |     await item.focus()
  151 |     await page.keyboard.press('Enter')
  152 |     await expect.poll(() => query(page).get('county')).not.toBeNull()
  153 |   })
  154 | })
  155 | 
```