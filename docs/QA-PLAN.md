# QA plan: Bartók Romania field-collection viewer

Owner: QA. Companion documents: CONTEXT.md (brief), PLAN.md (sequencing),
ACCEPTANCE-CRITERIA.md (Given/When/Then, AC-01..), DATA-SCHEMA.md, FRONTEND-SPEC.md,
DEPLOY.md. Written before the scraper and app exist; where a name below depends on a
document that is not yet final, it is marked "assumed" and must be reconciled when that
document lands.

## 0. Test pyramid and where each layer runs

| Layer | Tool | Runs | Gate |
| --- | --- | --- | --- |
| Data quality gates | `node qa/checks/data-gates.mjs` | CI after `scraper build`; locally before committing data | blocking gates fail the job |
| Scraper unit tests | `node --test` (scraper/tests) | CI on every push touching `scraper/`; locally via `npm test` | must be green |
| App unit tests | Vitest (app/src/**/*.test.ts) | CI on every push touching `app/` or `data/` | must be green |
| App e2e | Playwright, Chromium from `/opt/pw-browsers` | CI on every PR; locally `npx playwright test` | must be green on desktop and 390 px |
| Accessibility | axe-core inside Playwright | with e2e | zero serious/critical violations |
| Performance | Lighthouse CI against `vite preview` | CI on PR to main and before release | thresholds in section 6 |
| Manual acceptance | checklist in section 7 | before each release | signed by QA |
| Release smoke | checklist in section 8 | on preview and production URL | signed by system engineer + QA |

CI ordering (single workflow, jobs in this order so cheaper checks fail first):
`scraper test` -> `scraper build` (or reuse committed `data/`) -> `data gates` -> `app unit`
-> `app build` -> `app e2e + axe` -> `lighthouse`.

## 1. Data quality gates

Implemented in `qa/checks/data-gates.mjs` (Node 22, no dependencies beyond built-ins and
the scraper's `ajv`). It reads `data/songs.json` and `data/schema/song.schema.json`, prints
one line per gate (`PASS` / `WARN` / `FAIL` / `SKIP`), and exits 1 when any blocking gate
fails, 2 on a usage or input error.

```
node qa/checks/data-gates.mjs                                  # data/songs.json
node qa/checks/data-gates.mjs --file data/songs.sample.json    # any other file
node qa/checks/data-gates.mjs --report qa/out/gates.json       # full offender lists as JSON
node qa/checks/data-gates.mjs --strict                         # warnings fail too (release branch)
```

### 1.1 Record shape assumed by the gates

The gates use tolerant accessors (`place.county` or `place.modernCounty` or `county`, and so
on) until DATA-SCHEMA.md is final. The shape the fixture and the gates assume:

```
id                  string, unique, stable across runs (site prefix + site record id)
source.site         "fmbc" | "bsys" | "gyujtesek"   (assumed: the CLI site keys in PLAN.md)
source.recordId     the record id as the source site prints it
source.url          absolute http(s) URL of the source record page
title, incipit      strings (incipit nullable)
genre               string from the genre vocabulary (schema enum; fallback data/facets.json)
style, performance  string | null
instrument          string[]
year                integer | null
place.village, place.villageHistorical, place.county (modern, null when unresolved),
place.countyHistorical, place.region, place.country, place.lat, place.lng (both or neither)
collector, informant {name, age} | null, ethnicity, text, remarks
notationImage, audio  absolute URL | null
raw                 untouched source fields; never scanned for HTML
```

### 1.2 Gates

| # | Check name | What it checks | Threshold | Blocks or warns |
| --- | --- | --- | --- | --- |
| G1 | `schema-valid` | Every record validates against `data/schema/song.schema.json` (Ajv 2020-12, `allErrors`, formats via ajv-formats) | 100 % valid | Blocks. Skipped with a warning while the schema file or `ajv` is missing; once the schema exists this must never skip in CI |
| G2 | `id-unique` | `id` present, non-empty, unique across the whole file | 0 duplicates, 0 missing | Blocks |
| G3 | `source-url` | `source.url` is an absolute `http(s)://` URL | 100 % of records | Blocks |
| G4 | `county-resolved` | `place.county` (modern county) is a non-empty string | >= 95 % of records | Blocks below 95 %; between 95 % and 100 % the unresolved list is printed as a warning for gazetteer work |
| G5 | `coords-in-romania` | `lat` 43.6..48.3 and `lng` 20.2..29.7, or both null. One of the pair null, or non-numeric, is an error | 0 violations | Blocks |
| G6 | `year-range` | `year` is an integer 1904..1918 or null | 0 out of range is the target; any out-of-range or null year is listed | Warns only. The listed ids feed the data engineer's review; records from other collectors or later dates are legitimate and are kept |
| G7 | `genre-vocab` | `genre` is in the vocabulary: the schema's `genre` enum, else `data/facets.json`, else the built-in fallback list in the script (with a warning) | 100 % in vocabulary | Blocks |
| G8 | `no-html` | No `<tag>` or `&entity;` in any string field except `raw.*` and keys matching `url/href/src/image/audio/link` | 0 offending fields | Blocks |
| G9 | `dup-site-record` | Same `source.site` + normalised `source.recordId` appears twice | 0 | Blocks (means the crawler visited a record twice or ids collide) |
| G10 | `dup-cross-site` | Same normalised title + village + year appears under different sites (report), and repeated within one site (count) | 0 is ideal | Warns only. Cross-site duplicates are expected (the sites overlap); the report is the input for a later "related melodies" link, not for dropping records |

Normalisation for G9/G10: NFD, strip combining marks, lower-case, collapse non-alphanumerics
to single spaces. "Borosjenő" and "Borosjeno" compare equal.

### 1.3 Additional gates to add once `places.json` and `facets.json` exist

These are specified now and will be added to the same script when the files exist:

| Check name | What | Threshold | Blocks |
| --- | --- | --- | --- |
| `places-referential` | every `place.county` / `place.village` in songs.json exists in places.json and vice versa (no orphan nodes) | 100 % | Blocks |
| `facets-counts` | facet counts in facets.json equal counts recomputed from songs.json | exact | Blocks |
| `deterministic-output` | keys sorted, `\n` line endings, trailing newline, records sorted by id | exact | Blocks |
| `payload-size` | `songs.json` gzip size (as Vercel serves it) | <= 2.5 MB gzip; warn above 1.5 MB | Blocks (also enforced in section 6) |

### 1.4 CI wiring

```yaml
- run: cd scraper && npm ci && npm test
- run: cd scraper && npm run build          # or skip when data/ is committed
- run: node qa/checks/data-gates.mjs --report qa/out/gates.json
- uses: actions/upload-artifact@v4
  with: { name: data-gates, path: qa/out/gates.json }
```

On the release branch run with `--strict` so warnings must be explicitly accepted by
editing the data (or the gazetteer) rather than ignored.

## 2. Scraper tests (`scraper/tests`, `node --test`)

Site module names below follow PLAN.md (`fmbc`, `bsys`, `gyujtesek`); adjust to
SCRAPER.md if it renames them.

### 2.1 Fixture-based parser tests

Fixtures are trimmed, saved HTML pages in `scraper/fixtures/<site>/` with a matching
`<name>.expected.json`. One list page and at least two record pages per site (one rich
record with audio and remarks, one sparse record with missing fields).

| Test | Expectation |
| --- | --- |
| `parse list page` | returns the record URLs in document order, absolute, de-duplicated; pagination link detected or `null` on the last page |
| `parse rich record` | output deep-equals `expected.json`: title, incipit, genre, performance, informant name and age, collector, place strings (historical and as printed), date -> year, audio URL, notation image URL, remarks |
| `parse sparse record` | missing fields are `null` / `[]`, never `undefined` or `""`; parser does not throw |
| `strips markup` | text fields contain no tags or entities; `<br>` becomes `\n`; `&nbsp;` becomes a space; whitespace collapsed; leading/trailing trimmed |
| `keeps raw` | `raw` holds the label -> value pairs as printed (for the Raw JSON tab), keys sorted |
| `locality "A / B" split` (bsys) | collection place and informant origin split into two fields; single-value case gives origin `null` |
| `date parsing` | "1910. jan." -> 1910; "1910-12" -> 1910; "?" and "" -> `null`; a century-only or clearly wrong date -> `null` plus a `warnings[]` entry on the record |
| `place normalisation` | historical name resolves via `data/gazetteer.json` to modern village, county, region, country RO, lat/lng; unknown name gives `county: null` and the name is appended to the unresolved report, not dropped |
| `id derivation` | id is `<site>-<slug(recordId)>`, stable, URL-safe, and identical for the same input on every run |
| `genre mapping` | source labels (HU/EN/RO variants) map into the genre vocabulary; unknown label -> `"other"` plus a warning, so that G7 cannot fail on mapping drift silently |
| `unicode` | diacritics survive round-trip (ș, ț, ő, ű), NFC normalised on output |

### 2.2 Fetcher tests (mock HTTP; no network in tests)

Use a local `http.createServer` on an ephemeral port or inject a fake `fetch`.

| Test | Expectation |
| --- | --- |
| rate limit | 10 sequential requests to one host take >= 9 x interval (default 1 s; test with 50 ms); concurrent requests are serialised per host |
| cache hit | second request for the same URL is served from `scraper/cache/` without hitting the server (server hit counter stays at 1); cache key is the full URL; cache file includes status, headers and body |
| cache miss on different query | `?page=2` is not served from the `?page=1` entry |
| retry on 503 | server returns 503, 503, 200: fetcher returns the 200 body after two retries with backoff (test with tiny delays); `Retry-After` header honoured when present |
| retry exhausted | 503 x (maxRetries + 1) -> rejects with an error naming the URL and status; the failure is recorded in the run log and the crawl continues with the next URL |
| no retry on 404 | 404 is not retried; recorded as missing; not cached as success |
| robots.txt respected | `Disallow: /en/search/` in the mocked robots.txt makes the fetcher refuse `/en/search/...` (no request made, reason logged); allowed paths proceed; missing robots.txt (404) means allow all; `Crawl-delay` raises the interval when larger than the default |
| user agent | every request carries the project UA with a contact URL |
| timeout | a hanging response is aborted after the configured timeout and treated like a 503 for retry purposes |

### 2.3 Idempotent re-run

| Test | Expectation |
| --- | --- |
| `build twice` | run `build` on the same cache twice; `songs.json`, `places.json`, `facets.json` are byte-identical (compare SHA-256); no timestamps inside the data files (a build stamp goes to `data/BUILD.md` instead) |
| `order independence` | shuffling the input record order before `build` still produces identical bytes (records sorted by id, keys sorted, arrays with defined order) |
| `re-crawl no-op` | running `crawl` again with a warm cache makes zero network requests and leaves the cache unchanged |

## 3. App unit tests (Vitest, `app/src/**/*.test.ts`)

Test data: a hand-written 40 record fixture at `app/src/test/fixtures/songs.small.json`
generated deterministically (seeded) from `qa/fixtures/songs.sample.json` shapes, covering:
3 counties, 6 villages, every genre, every style, records with null year, null county,
diacritics in titles (Ș, ș, Ț, ț, Ő, ő, Ű, ű, Â, Î), same title in two villages, one record
with all fields null except id/source/title.

URL parameter names below are assumed until FRONTEND-SPEC.md fixes the codec:
`country`, `region`, `county`, `village`, `genre`, `style`, `perf`, `instr`, `from`, `to`,
`q`, `sort`, `dir`, `song`. Multi-value params are comma separated, values are
percent-encoded, and the canonical string has params in that fixed order.

### 3.1 Query <-> URL round trip

- `encode(decode(s)) === s` for every canonical string in a table of 20 cases, including
  empty query, one facet, all facets, diacritics (`village=Ineu`, `village=Beiu%C8%99`),
  comma inside a value, year range one-sided, unknown params ignored.
- `decode(encode(q))` deep-equals `q` for property-based cases (fast-check optional; if not
  installed, a 200-case seeded loop).
- Unknown or malformed values (`from=abc`, `sort=nope`, `genre=` empty) decode to defaults
  without throwing; a `warnings` array names what was dropped.
- Canonical ordering: `?genre=x&county=y` and `?county=y&genre=x` decode to the same query
  and re-encode identically.
- Default values are omitted from the string (empty query encodes to `""`).

### 3.2 Filter logic

- Place hierarchy: selecting a county returns all songs in its villages; selecting a
  village narrows within it; selecting a region returns all its counties; country RO is the
  default and country switch reveals non-RO records.
- Inside one facet values OR together (genre ballad + genre dance = union); across facets
  they AND.
- Year range is inclusive at both ends; null year records are excluded when a range is set
  and included when it is not.
- Instrument filter matches any element of `instrument[]`.
- Search `q`: case-insensitive, diacritic-insensitive (`sculati` matches `Sculați`), matches
  title, incipit, text, village (modern and historical), informant name; tokens AND; empty
  `q` is no filter.
- Clear-all returns the full set and the canonical empty query.
- Combined: county + genre + year + q reduce monotonically (each additional filter yields a
  subset of the previous result).

### 3.3 Facet counting

- Counts for facet F are computed with every filter applied except F itself (so options in
  the active facet keep their counts and do not collapse to 1 value).
- Sum of genre counts equals the size of the set filtered by everything except genre.
- Zero-count options are reported with count 0 (the UI decides whether to hide them).
- Place tree node counts equal the sum of their children plus records that resolve to the
  node but not to a child (county-known, village-unknown).
- Counts are stable under sort (sorting never changes counts).

### 3.4 Sort orders

For each of the five sorts (title, style, location, year, source number), ascending and
descending:

- `title`: locale-aware with `Intl.Collator('ro', { sensitivity: 'base' })`; ordering
  `Adio < Ardeleana < Ârsul < Bade < Șapte < Sara < Ț...` must place diacritic letters
  next to their base letters (Ș between S entries), not after Z; case-insensitive; empty or
  null title last in both directions.
- `style`: vocabulary order (old, new, mixed) rather than alphabetical if
  FRONTEND-SPEC.md says so; unknown/null last in both directions; ties broken by title.
- `location`: county, then village, then title, collator as above; null county last.
- `year`: numeric; null last in both directions; ties broken by title.
- `source number`: natural sort (`A 9 < A 10 < A 204 < B 1`; `21/5398` after `21/612`);
  ties by site key; null last.
- Sort is stable: two equal keys keep their input order.
- "Unknown last" holds in descending order too (test both directions explicitly).

### 3.5 Place tree building

- From a flat record list, build country -> region -> county -> village with counts and
  sorted children (collator).
- Records with county but no village appear as a synthetic "(village unknown)" leaf, or in
  the county count only, per FRONTEND-SPEC.md; test whichever is chosen.
- Records with no county go under "(county unknown)" within their region if known, else
  under the country.
- Historical names are attached to nodes for display and search but do not create extra
  nodes.
- Building the tree twice from the same input yields deep-equal output; building from a
  shuffled input yields the same tree.

### 3.6 Other units

- `prevNext(id, filteredIds)` returns correct neighbours at start, middle and end; wraps or
  disables per spec.
- `exportJson(filteredSet)` output validates against `song.schema.json` and is pretty-printed
  with sorted keys; file name includes the count and the canonical query.

## 4. App e2e tests (Playwright, Chromium)

Config: `app/playwright.config.ts` with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`,
projects `desktop-chromium` (1366x800) and `phone-chromium` (390x844, touch, device scale
2). `webServer` runs `vite preview` on the built app with the small fixture copied to
`app/public/data/` so runs are deterministic and do not depend on the real scrape.
Every test asserts `page.on('console')` records no `error` entries and `page.on('pageerror')`
never fires (a shared fixture in `e2e/fixtures.ts`).

| Id | Journey | Steps and assertions |
| --- | --- | --- |
| E2E-01 | Land, pick county on map, results narrow, sort by style, open song, back keeps filters | 1. `/` loads; results count equals fixture size; map shows one bubble per county. 2. Click the "Arad" bubble; county chip appears; count equals the fixture's Arad count; URL contains `county=Arad`. 3. Choose sort "Style"; first result has style `old` (or vocabulary-first); URL has `sort=style`. 4. Click first result; song route opens with that title; prev/next present. 5. Browser back; explorer shows the same county chip, sort, count, and scroll position within 50 px. |
| E2E-02 | URL paste restores state | Open `/?county=Bihor&genre=colinda,dance&from=1909&to=1912&sort=year&dir=desc` directly; the filter rail reflects every value (tree node selected, checkboxes checked, range inputs set, sort dropdown), chips listed, results count matches the unit-test computed count, status bar shows the same canonical string. |
| E2E-03 | Clear all | From E2E-02 state, click "Clear all"; URL is `/`; count equals full size; no chips. |
| E2E-04 | Search | Type `sculati` in search; results contain the colinda; type `zzzz` -> empty state with a "Clear search" action that restores results. |
| E2E-05 | County drill-down | Click county header link from results or map; drill-down shows counts, villages table sorted by name; sort by melodies desc reorders; tab switch keeps URL in sync; back returns to explorer with filters intact. |
| E2E-06 | Song record | Notation image renders (natural width > 0) or placeholder shown when null; audio element present when `audio` non-null with `controls`; Raw JSON tab shows the record with the same `id`; "Source" link has `href` equal to `source.url` and `rel="noopener"`; attribution footer visible. |
| E2E-07 | Prev/next within filtered set | Open `/?county=Arad&sort=title` then the second result; "Previous" opens the first, "Next" the third; at the last result "Next" is disabled (or wraps, per spec); URL keeps the query string on the song route. |
| E2E-08 | Export JSON | With a filter active, click "Export JSON"; the download event's suggested filename contains the count; the file parses; its length equals the shown count; each item has an `id` present in the results. |
| E2E-09 | Phone viewport journey | On `phone-chromium`: `/` shows search, small map, list, bottom tabs; open filter sheet, pick genre, close; count updates; open a song; the metadata rail is stacked below the text (no horizontal scroll: `document.documentElement.scrollWidth <= innerWidth`); bottom tab "Map" shows the map full-width. |
| E2E-10 | Keyboard-only journey | Start at `/`; `Tab` reaches skip link first; `Enter` skips to results; tab through filter rail: place tree is arrow-key navigable (`ArrowRight` expands, `ArrowDown` moves), `Space` toggles a checkbox, count updates; `Tab` to sort select, `ArrowDown` changes it; `Tab` to first result, `Enter` opens the song; `Tab` reaches prev/next and the Raw JSON tab (`ArrowRight` switches tabs); `Escape` closes the phone filter sheet and returns focus to the trigger. A visible focus ring is asserted by computed `outline-style !== 'none'` or box-shadow on each focused element. |
| E2E-11 | Deep link 404 and unknown song | `/song/does-not-exist` shows the not-found state with a link back to the explorer, HTTP 200 (SPA) but `<title>` says "Not found"; `/random/path` likewise. |
| E2E-12 | Error and loading states | Block `**/data/songs*.json` with `route.abort()`; the app shows the error state with a retry button; unblock and retry loads; while loading a skeleton/spinner with `aria-busy="true"` is visible on the results region. |
| E2E-13 | Map interactions | Hover a county bubble shows the card with county name and count; click narrows; click the same bubble again (or the chip's x) clears it; at village zoom, village dots show and clicking one selects the village; map is keyboard reachable via a "List counties" fallback control. |
| E2E-14 | No console errors | Shared assertion across all tests, plus a dedicated test that visits each of the four screens and waits for network idle. |

Visual regression is out of scope for v1; if added later, use Playwright screenshots on the
four screens at both viewports with a 0.2 % pixel threshold.

## 5. Accessibility checks

- axe-core via `@axe-core/playwright` on each of the four screens, desktop and phone, in
  their default state and with a filter applied and a modal/sheet open. Fail on any
  `serious` or `critical` violation; `moderate` and `minor` are reported.
- Tags: `wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`.
- Contrast: ink `#1c1b18` on ground `#f4f2ec` (about 15:1) and accent `#b5502e` on ground
  (about 4.6:1) pass AA for text; accent must not be used for text under 18 px bold / 24 px
  regular unless it stays >= 4.5:1; grey annotation text must be >= 4.5:1 (axe checks this;
  add a unit test over DESIGN-TOKENS.md pairs using a contrast function).
- Focus order: matches visual order (skip link, top bar, filter rail, map, results, footer);
  asserted in E2E-10; no positive `tabindex`.
- Every interactive control has an accessible name (map bubbles are buttons with
  `aria-label="Arad, 123 melodies"`); images have alt text (notation: "Notation for <title>");
  audio has a label; chips are removable with a named button.
- Live region: results count announced on change (`aria-live="polite"`).
- Reduced motion: `prefers-reduced-motion` disables map fly-to animation (unit test on the
  hook, manual check).
- Zoom to 200 % and 400 % on desktop: no loss of content, no horizontal scroll at 320 px
  CSS width (manual, section 7).

## 6. Performance budget

Lighthouse CI (`@lhci/cli`) against `vite preview`, three runs, median, mobile preset with
simulated throttling, on `/`, `/county/Arad` (assumed route), one song route.

| Metric | Threshold | Action |
| --- | --- | --- |
| Performance score | >= 90 | fail |
| Accessibility score | >= 95 | fail |
| Best practices | >= 90 | warn |
| SEO | >= 80 | warn |
| LCP | <= 2.5 s | fail |
| CLS | <= 0.1 | fail |
| TBT | <= 300 ms | warn |
| JS bundle (gzip, initial route) | <= 250 KB | fail (size-limit or a script over `dist/`) |
| Map library chunk | lazy loaded, not in the initial bundle | fail |
| `songs.json` transferred | <= 2.5 MB gzip; warn above 1.5 MB | fail (same check as `payload-size` in 1.3) |
| Any single image on song page | <= 600 KB or lazy loaded | warn |
| Time to interactive with 15k records on a 4x CPU slowdown | <= 5 s | manual, warn |

If `songs.json` exceeds the budget the plan is: split by country (`songs.RO.json` default)
and lazy load the rest, or move text fields into a per-record fetch.

## 7. Manual acceptance checklist (mapped to the four wireframe screens)

Tick each item on the preview deployment on desktop Chromium and Firefox, and on a real
phone (iOS Safari or Android Chrome). Reference the AC ids in ACCEPTANCE-CRITERIA.md.

### 7.1 Explorer

- [ ] Filter rail: place tree expands country -> region -> county -> village; counts shown; selecting at any level narrows (AC-01..AC-04)
- [ ] Genre checkboxes, style/performance chips, instrument chips, year range each filter and show counts (AC-05..AC-09)
- [ ] Combined filters AND across facets, OR within (AC-10); clear all (AC-11)
- [ ] Search box filters as typed, diacritic-insensitive (AC-12..AC-13)
- [ ] Map: bubbles sized by count, hover card, click narrows, click again clears (AC-24..AC-27)
- [ ] Results list: sort dropdown offers title, style, location, year, source number, both directions (AC-14..AC-18)
- [ ] Active filter chips removable one by one (AC-11)
- [ ] Status bar shows the canonical query string, copy button works, pasted URL restores state (AC-22..AC-23)
- [ ] Empty state when no results, with clear action (AC-30)
- [ ] Attribution to HUN-REN BTK Institute for Musicology visible in the footer (AC-33)
- [ ] Wireframe fidelity: greyscale, ground `#f4f2ec`, ink `#1c1b18`, accent `#b5502e` only for the primary action and selection; IBM Plex Sans / Mono loaded (no FOUT longer than one frame after cache)

### 7.2 County drill-down

- [ ] Header shows county name (modern, with historical name in mono), melody count, village count, year span
- [ ] Villages table: name, melodies, genre bar, year; sortable by each column; row click narrows to village
- [ ] Tabs: melodies, by genre, by performer, timeline, local map; each renders with the county's data; tab in URL
- [ ] Melodies table sortable; row opens song; back returns to the same tab and sort
- [ ] Local map shows only this county's villages
- [ ] Attribution present (AC-33)

### 7.3 Song record

- [ ] Title and incipit; genre/performance chips link back to explorer with that filter applied
- [ ] Notation image zoomable; placeholder when absent; alt text present
- [ ] Audio player when audio exists; otherwise a "no recording" line, not an empty player
- [ ] Text with preserved line breaks; historical and modern place names both shown in Where
- [ ] Who/when: collector, informant, age, ethnicity, year; Music: style, cadences, rhythm if available; Source: site, record id, link to source record opens in new tab
- [ ] Related melodies list (same village or cross-site duplicate from gate G10) opens records
- [ ] Raw JSON tab shows the record verbatim, copyable (AC-20)
- [ ] Prev/next within the filtered set with position "n of N" (AC-19)
- [ ] Attribution present (AC-33)

### 7.4 Phone explorer

- [ ] Search at top, filter sheet opens and closes, filters apply on close, sheet is scrollable and dismissible by swipe/Escape/backdrop (AC-28..AC-29)
- [ ] Small map usable; tapping a bubble narrows; hover card replaced by tap card
- [ ] List scrolls independently; tap opens song; back keeps position
- [ ] Bottom tabs switch map / list / filters; active tab indicated
- [ ] No horizontal scroll at 320 px and 390 px; tap targets >= 44 px
- [ ] Song record stacks the rail below content; audio controls usable
- [ ] Attribution present in the footer of every screen (AC-33)

### 7.5 Cross-cutting

- [ ] Keyboard-only walk through all four screens (AC-34)
- [ ] 200 % zoom on desktop: no clipped content
- [ ] Reload on any deep link restores the same view (AC-23)
- [ ] Error state when data fails to load, with retry (AC-32)
- [ ] `document.title` changes per screen ("Arad county - Bartók Romania viewer" and so on)

## 8. Release checklist (Vercel)

Preconditions: CI green on the commit, data gates report attached, DEPLOY.md runbook
followed. Replace `<preview>` and `<prod>` with the URLs `vercel` prints.

1. Preview smoke test (`npx vercel` from `app/`):
   - [ ] `curl -sI https://<preview>/ | head -20` -> `200`, `content-type: text/html`
   - [ ] Open `/`, one county, one song on desktop and phone; no console errors (DevTools)
   - [ ] E2E-02 URL pasted into the preview restores state
   - [ ] Export JSON downloads on the preview
2. Cache headers (must match `vercel.json`):
   - [ ] `curl -sI https://<preview>/data/songs.<hash>.json` -> `200`,
     `cache-control: public, max-age=31536000, immutable`, `content-encoding: br` or `gzip`,
     `content-type: application/json`
   - [ ] `curl -sI https://<preview>/assets/index-<hash>.js` -> same immutable header
   - [ ] `curl -sI https://<preview>/` -> `cache-control` with `max-age=0` and
     `must-revalidate` (or `s-maxage` with revalidation); HTML must not be immutable
   - [ ] `curl -sI https://<preview>/` -> `x-content-type-options: nosniff`,
     `referrer-policy` set, `strict-transport-security` present (Vercel default)
3. Deep links and 404 handling:
   - [ ] `curl -s -o /dev/null -w '%{http_code}\n' https://<preview>/song/bsys-a204` -> `200`
     (SPA rewrite) and the page renders the song
   - [ ] `curl -s -o /dev/null -w '%{http_code}\n' https://<preview>/song/does-not-exist` ->
     `200` with the in-app not-found view (or `404` if DEPLOY.md chooses a prerendered 404;
     either way the user sees the not-found screen with a link home)
   - [ ] `curl -s -o /dev/null -w '%{http_code}\n' https://<preview>/data/missing.json` ->
     `404`, JSON or plain text, not the SPA HTML (rewrite must exclude `/data/` and `/assets/`)
   - [ ] Trailing slash variants (`/song/bsys-a204/`) redirect or render, never 404
4. Production (`npx vercel --prod`):
   - [ ] Repeat steps 1 to 3 against `<prod>`
   - [ ] `curl -sI https://<prod>/ | grep -i x-vercel-id` present; deployment id matches the
     Vercel dashboard
   - [ ] Lighthouse against `<prod>` meets section 6 (mobile preset)
   - [ ] Attribution footer and source links resolve to `*.zti.hu` record pages (open two by hand)
   - [ ] Tag the commit `data-<YYYYMMDD>` / `app-vX.Y.Z` (orchestrator commits and tags)
5. Rollback path verified once: `vercel rollback` (or promote previous deployment in the
   dashboard) documented in DEPLOY.md and tried on the preview project.

## 9. Exit criteria for the QA phase (PLAN.md Step 6)

- All blocking data gates pass on the committed `data/songs.json`; warning lists reviewed and
  attached to `data/BUILD.md`.
- Scraper, Vitest and Playwright suites green in CI on desktop and phone projects.
- axe: zero serious/critical on four screens x two viewports.
- Lighthouse: performance >= 90, accessibility >= 95 on the three audited routes.
- Every AC in ACCEPTANCE-CRITERIA.md has a linked automated test or a ticked manual item;
  open gaps are filed as issues and listed in the release notes.
- Section 8 signed for the production URL.
