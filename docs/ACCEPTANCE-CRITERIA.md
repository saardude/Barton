# Acceptance criteria: Bartók Romania field-collection viewer

Numbered AC-01 onwards; each is Given / When / Then and names the test that proves it
(unit = Vitest in QA-PLAN.md section 3, E2E-nn = Playwright in section 4, manual = section 7).
Vocabulary: "the filtered set" is the list of records after all active filters and search;
"the canonical query string" is the URL query as FRONTEND-SPEC.md's codec encodes it.
Counts quoted in examples refer to the e2e fixture, not the real data.

Assumed URL parameter names (until FRONTEND-SPEC.md fixes them): `country`, `region`,
`county`, `village`, `genre`, `style`, `perf`, `instr`, `from`, `to`, `q`, `sort`, `dir`,
`song`.

## Place hierarchy filtering

**AC-01 Default country**
Given a fresh visit to `/`
When the explorer loads
Then only records whose `location.country` is `RO` are in the filtered set, the place tree
shows "Romania" expanded to its regions with counts, and a country switch exposes other
countries without reloading the page. (unit 3.2, E2E-01)

**AC-02 Region selection**
Given the explorer with no filters
When the user selects a region node (for example "Transilvania")
Then the filtered set contains exactly the records whose modern county belongs to that
region, the region chip appears, the county nodes under it show their counts, and the URL
contains `region=<value>`. (unit 3.2, 3.5; manual 7.1)

**AC-03 County selection**
Given the explorer with a region selected or not
When the user selects a county node (or a county bubble on the map)
Then the filtered set contains exactly the records of that county, its villages expand
underneath with counts, the county chip appears, the map centres on that county, and the URL
contains `county=<value>`. Selecting a second county adds it (OR within the place facet).
(unit 3.2, E2E-01, E2E-13)

**AC-04 Village selection and unknown villages**
Given a county selected
When the user selects a village node
Then the filtered set narrows to that village, the URL contains `village=<value>`, and the
county chip is replaced by a village chip showing "Village, County". Records that resolve to
the county but not to any village are counted in the county node and appear in a
"(village unknown)" leaf. (unit 3.5, manual 7.1)

## Facets

**AC-05 Genre**
Given the explorer
When the user checks one or more genre checkboxes
Then the filtered set contains records whose genre is any of the checked values, each
checkbox shows the count it would yield given every other active filter, and the URL
contains `genre=a,b`. Unchecking the last genre removes the parameter. (unit 3.2, 3.3;
E2E-02)

**AC-06 Style**
Given the explorer
When the user selects one or more style chips (the distinct `style` strings in the data,
for example "old style", "new style", "parlando")
Then records with any selected style are shown, counts on chips follow AC-05's rule,
records with null style are excluded while any style chip is active, and the URL contains
`style=`. (unit 3.2, 3.3)

**AC-07 Performance**
Given the explorer
When the user selects performance chips (vocal, instrumental, ...)
Then records with any selected performance are shown and the URL contains `perf=`.
(unit 3.2)

**AC-08 Instrument**
Given the explorer
When the user selects instrument chips
Then records whose `instrument[]` contains any selected value are shown; records with an
empty array are excluded while an instrument chip is active; the URL contains `instr=`.
(unit 3.2)

**AC-09 Year range**
Given the explorer with the year range at its defaults (data min and max)
When the user sets from=1909 and to=1912
Then records with 1909 <= `collected.year` <= 1912 are shown, records with null year are excluded, the
chip reads "1909-1912", and the URL contains `from=1909&to=1912`. Setting only one end is
allowed (`from` alone or `to` alone). Resetting both ends removes the chip and the
parameters, and null-year records return. (unit 3.2, E2E-02)

## Combined filters, clear-all

**AC-10 Combination rule**
Given any combination of place, genre, style, performance, instrument, year and search
When more than one facet is active
Then values inside one facet combine with OR and different facets combine with AND, each
added filter yields a subset of the previous filtered set, facet counts are computed with
every other facet applied (AC-05), the results header shows "N of M melodies", and the
canonical query string contains every active value in the fixed parameter order.
(unit 3.2, 3.3; E2E-02)

**AC-11 Clear all and chip removal**
Given at least one active filter or search
When the user clicks "Clear all"
Then the filtered set is the full default set (AC-01), no chips remain, the search box is
empty, the sort is unchanged, and the URL is `/` (sort parameters remain if non-default).
When the user removes a single chip with its x button, only that value is removed and the
rest stay. (unit 3.2, E2E-03)

## Search

**AC-12 Text search**
Given the explorer
When the user types at least two characters into the search box
Then within 300 ms the filtered set narrows to records where every whitespace-separated
token matches, case-insensitively, the title, incipit, text, modern or historical village
name, or performer name; the URL contains `q=<text>`; the count updates in the live region.
Clearing the box restores the previous set. (unit 3.2, E2E-04)

**AC-13 Diacritic-insensitive search**
Given the record "Sculați, sculați, boieri mari" in the data
When the user searches `sculati` or `SCULAȚI`
Then that record is in the filtered set. Searching `Beiuș` and `Beius` return the same set.
(unit 3.2)

## Sorting

**AC-14 Sort by title**
Given any filtered set
When the user chooses "Title" (ascending, then descending)
Then records are ordered by title with a Romanian locale collator, case-insensitive,
diacritic letters adjacent to their base letters (Ș among S, Ț among T, Â/Î among A/I),
records with a missing title last in both directions, and the URL contains `sort=title`
(and `dir=desc` when descending). (unit 3.4, manual 7.1)

**AC-15 Sort by style**
Given any filtered set
When the user chooses "Style"
Then records are ordered by the `style` string with the AC-14 collator (or by the
vocabulary order if FRONTEND-SPEC.md defines one), null style last in both directions, ties
broken by title; the URL contains `sort=style`. (unit 3.4, E2E-01)

**AC-16 Sort by location**
Given any filtered set
When the user chooses "Location"
Then records are ordered by modern county, then modern village, then title, with the same
collator as AC-14; records with no county last in both directions; the URL contains
`sort=location`. (unit 3.4)

**AC-17 Sort by year**
Given any filtered set
When the user chooses "Year"
Then records are ordered numerically by year, ties by title, null year last in both
directions; the URL contains `sort=year`. (unit 3.4, E2E-02)

**AC-18 Sort by source number**
Given any filtered set
When the user chooses "Source number"
Then records are ordered by site key then by natural-sorted `source.referenceCode`
(fallback `source.number`) ("A 9" before "A 10" before "A 204"; "RFM I 12" before
"RFM I 112"; "21/612" before "21/5398"), null last; the URL contains `sort=source`.
The sort is stable: equal keys keep their previous relative order. (unit 3.4)

## Song navigation

**AC-19 Previous / next within the filtered set**
Given the user opened a song from a filtered, sorted results list (or a song URL that
carries the query string)
When they use "Previous" or "Next" (buttons or arrow keys)
Then the adjacent record in that same filtered set and sort opens, the position reads
"n of N", the query string is preserved on the song URL, "Previous" is disabled on the first
record and "Next" on the last, and browser back returns to the results with the same filters,
sort and scroll position. Opening a song by direct URL without a query string shows the record
with prev/next computed over the default set (AC-01) in the default sort. (unit 3.6, E2E-01,
E2E-07)

**AC-20 Raw JSON tab**
Given a song record
When the user opens the "Raw JSON" tab
Then the record is shown pretty-printed with sorted keys, deep-equal to the record in
`songs.json` (same id, including `rawFields`), with a "Copy" button that copies the JSON, and the tab is reflected
in the URL (`#raw` or `?tab=raw`) so reload keeps it. (E2E-06, manual 7.3)

## Export and sharing

**AC-21 Export JSON of the filtered set**
Given a filtered set of N records (N >= 1)
When the user clicks "Export JSON"
Then a file named `bartok-romania-<N>-<yyyymmdd>.json` downloads containing a JSON object
with `query` (the canonical query string), `count` N, `generatedAt`, `attribution`, and
`records` (the N records, sorted as displayed, each validating against `song.schema.json`).
With N = 0 the button is disabled. Exports above 10 MB show a confirmation before download.
(unit 3.6, E2E-08)

**AC-22 Shareable URL in the status bar**
Given any state of the explorer
When filters, search or sort change
Then the status bar shows the canonical query string, a "Copy link" button copies the full
absolute URL, and `history.replaceState` (not push) is used for each keystroke in search
while chip and checkbox changes push one history entry each. (unit 3.1, manual 7.1)

**AC-23 URL paste restores state**
Given a URL such as
`/?county=Bihor&genre=colinda,dance&from=1909&to=1912&q=sculati&sort=year&dir=desc`
When it is opened in a new tab or the page is reloaded
Then the filter rail, chips, search box, sort dropdown, map selection, results and status bar
all reflect exactly those values, the results count equals the count computed by the unit
tests for that query, and re-encoding the state yields the identical canonical string.
Unknown parameters are ignored and malformed values fall back to defaults without an error
dialog. (unit 3.1, E2E-02)

## Map interactions

**AC-24 County bubbles sized by count**
Given the explorer map
When it renders with the current filtered set
Then one bubble per county with at least one record is drawn at the county centroid, its
area proportional to the record count (min and max radius clamped), counties with zero
records in the current set are drawn hollow or hidden per MAP-SPEC.md, and the map reflects
filter changes without a full re-render flash. (E2E-13, manual 7.1)

**AC-25 Hover card**
Given a county bubble
When the pointer hovers over it (or it receives keyboard focus)
Then a card shows the modern county name, the historical county name in mono, the record
count in the current set, and the top three genres; the card disappears on leave/blur.
On touch devices a tap shows the card with a "Show melodies" action. (E2E-13, manual 7.4)

**AC-26 Click to narrow and toggle**
Given a county bubble
When the user clicks it
Then the county is added to the place filter (AC-03) and the map zooms to the county; a
second click on the same selected bubble removes it; clicking the map background does not
change filters. (E2E-01, E2E-13)

**AC-27 Village level and keyboard fallback**
Given a single county selected
When the map is zoomed past the county threshold
Then village dots appear for that county (sized by count) and clicking one selects the
village (AC-04). A "List counties" control offers the same selections as a keyboard-operable
list so no filter is reachable only by mouse. (E2E-10, E2E-13)

## Phone layout

**AC-28 Phone explorer layout**
Given a viewport of 390 x 844 (and 320 px wide)
When `/` loads
Then the layout shows a search field, a compact map, the results list and bottom tabs
(Map / List / Filters); there is no horizontal scroll; tap targets are at least 44 x 44 px;
the same URL scheme applies so desktop links open correctly on the phone. (E2E-09)

**AC-29 Filter sheet**
Given the phone explorer
When the user taps "Filters"
Then a bottom sheet opens with the same facets as the desktop rail, focus moves into it,
background is inert, filters apply on change with the count shown on the sheet's "Show N
melodies" button, and the sheet closes via that button, the backdrop, swipe down or Escape,
returning focus to the "Filters" tab. (E2E-09, E2E-10)

## Empty, loading, error states

**AC-30 Empty state**
Given filters or search that match no record
When the results list renders
Then it shows "No melodies match" with the active chips listed and a "Clear all" action, the
map shows no bubbles, the count reads "0 of M", and Export JSON is disabled. (E2E-04)

**AC-31 Loading state**
Given `songs.json` has not yet arrived
When any screen renders
Then the results region shows a skeleton with `aria-busy="true"`, the filter rail controls
are disabled, no "0 results" flash occurs, and the loading state lasts less than 3 s on a
mid-range phone for the budgeted payload. (E2E-12)

**AC-32 Error state**
Given `songs.json` fails to load (network error or non-2xx)
When any screen renders
Then an error panel explains that the catalogue could not be loaded, offers "Retry", logs
nothing to `console.error` beyond one structured message, and a successful retry renders
the intended state (including any deep-linked filters). An unknown song id or route shows a
"Not found" screen with a link to the explorer. (E2E-11, E2E-12)

## Attribution and cross-cutting

**AC-33 Attribution on every page**
Given any of the four screens (and the not-found and error screens)
When it renders on desktop or phone
Then a footer states that the data comes from the HUN-REN BTK Institute for Musicology
(Budapest) databases, names the three sources with links, and each song record links to its
source page (`source.url`) with `target="_blank"` and `rel="noopener noreferrer"`. The
footer is present in the DOM before data loads. (E2E-06, E2E-14, manual 7.x)

**AC-34 Keyboard-only operation**
Given a keyboard-only user
When they traverse the explorer, county drill-down, song record and phone explorer
Then every filter, sort, map selection (via AC-27's list), result, tab, prev/next and export
is reachable and operable by Tab/Shift+Tab, arrow keys, Space, Enter and Escape, with a
visible focus indicator and a skip link to results as the first tab stop. (E2E-10)

**AC-35 No console errors**
Given any of the journeys in QA-PLAN.md section 4
When they run in Chromium
Then no `console.error` entries and no uncaught page errors are recorded, on desktop and
phone projects. (E2E-14 and shared fixture)
