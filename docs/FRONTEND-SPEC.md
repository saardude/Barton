# Front-end specification

Vite + React + TypeScript, static JSON in, no server. This document turns the wireframe
in `CONTEXT.md` into components, props, state and behaviour, and it fixes the URL codec
that `QA-PLAN.md` and `ACCEPTANCE-CRITERIA.md` test against. Design tokens are in
`DESIGN-TOKENS.md` / `app-tokens/tokens.css`, the map in `MAP-SPEC.md`, strings in
`UI-COPY.md`, data shapes in `data/schema/*.schema.json`, loading and budgets in
`ARCHITECTURE.md`. Nothing here is code yet; the build phase implements it.

Conventions: `Props` blocks are TypeScript-shaped; "reads" lists the derived state a
component consumes; "emits" lists the `Query` patches it produces. AC-nn refers to
`ACCEPTANCE-CRITERIA.md`.

## 0. Stack and libraries

| Concern    | Choice                                                     | Notes                                                  |
|------------|------------------------------------------------------------|--------------------------------------------------------|
| Build      | Vite, React 19, TypeScript strict                          | `app/` per repo layout; versions per DEPLOY.md         |
| Routing    | `react-router-dom` 6 (`BrowserRouter`)                     | `vercel.json` rewrites every path to `index.html`      |
| State      | React context + `useMemo` selectors, no store library      | the whole state is `Query` + the loaded catalogue      |
| URL sync   | custom codec (section 3.1) over `useSearchParams`          | one module encodes and decodes                          |
| Data       | `useCatalog()` + worker-built indexes (ARCHITECTURE.md)    | content-hashed URLs from `data-manifest.ts`            |
| Map        | Leaflet 1.9 + react-leaflet 5 + leaflet.markercluster       | `MAP-SPEC.md`                                          |
| Search     | MiniSearch with the diacritics normaliser (section 4)       | prefix + fuzzy, field boosts on title and place        |
| Collation  | `Intl.Collator('ro')`                                       | section 5                                              |
| Styling    | plain CSS modules + `tokens.css`                            | no CSS-in-JS                                           |
| Fonts      | IBM Plex Sans / Mono                                        | Google Fonts per DESIGN-TOKENS.md, or `@fontsource/*` self-hosted; the CSP in DEPLOY.md must allow whichever is chosen (decision 7) |
| Charts     | inline SVG (genre bars, timeline, journey timeline)         | no chart library                                       |
| Tests      | Vitest + Testing Library, Playwright, axe-core             | QA-PLAN.md sections 3 to 5                              |

## 1. Data the app reads

Loaded once by `useCatalog()` from the content-hashed URLs in
`app/src/generated/data-manifest.ts`: `songs.json`, `places.json`, `facets.json`, and for
the journey mapper (section 14) `journeys.json`, `villages.json`, `context-events.json`.
TypeScript types are generated from `data/schema/*.schema.json` (PLAN.md step 4); the
field names used in this document are the schema's. The parts the UI depends on:

- `Song`: `id` (`fmbc-...`, `bsys-...`, `gyuj-...`); `source { site, url, referenceCode,
  volume, number }`; `title | null`; `incipit`; `genre` (`colinda | doina | bocet | cantec |
  joc | nunta | other | null`); `genreRaw`; `style` (verbatim string or null);
  `performance` (`vocal | instrumental | mixed | unknown`); `instrument[]`;
  `performer { name, age, sex, ethnicity }`; `collector`; `collected { year, month, day, raw }`;
  `location { country, region, county, countyHistorical, village, villageHistorical, lat,
  lng, raw, placeId, origin, resolution }`; `media { notation[], audio[] }` of
  `{ url, type, caption }`; `music { systemPosition, cadences, rhythm, mode, ambitus,
  syllables, form }`; `text`; `remarks`; `related[] { id, url, label, relation }`;
  `composition[] { work, movement, catalogue, raw }`; `rawFields`.
- `Place`: `id` is a slash path (`ro`, `ro/crisana`, `ro/crisana/bihor`,
  `ro/crisana/bihor/beius`; unresolved localities under `<cc or xx>/unresolved/<slug>`);
  `type`; `name` (modern); `nameHistorical`; `parent`; `country`; `region`; `county`;
  `countyHistorical`; `lat`; `lng`; `coordSource`; `counts { total, byGenre, byPerformance,
  bySite }`; `years { min, max }`; `songIds` (villages); `confidence`.
- `Facets`: per facet a `value -> count` map with sorted keys, nulls under `"null"`, and
  `_meta.songCount`. The UI uses these only for the static vocabularies (genre, style,
  performance, instrument lists and the year bounds); live counts come from the selectors.
- Journey files: section 14.1.

Null is the schema's value for unknown; the UI never renders the string "null" and never
invents a value (a missing title is shown as "Untitled", a missing year as "n.d.").

Indexes built once (in the worker above 5,000 records, on the main thread below; same
interface): `songById`, `placeById`, `childrenOf(placeId)`, `ancestorsOf(placeId)` (from
`parent`), `songsByPlace` (from `location.placeId`), the MiniSearch index, and
`searchKey(song)` for the sort tie-breaks.

## 2. Routes and screens

| Route                 | Screen              | Notes                                                                 |
|-----------------------|---------------------|-----------------------------------------------------------------------|
| `/`                   | Explorer            | phone layout under 768 px is the Phone explorer (section 10)          |
| `/county/:countyId`   | County drill-down   | `:countyId` is the place id path, e.g. `/county/ro/crisana/bihor`; `?tab=` plus Query |
| `/song/:songId`       | Song record         | `?tab=record|raw` plus Query (so back returns to the same list)       |
| `/journeys`           | Journey mapper      | section 14; `?trip=`, `?stop=`, `?date=`, `?borders=` plus Query      |
| `/about`              | About and sources   | static text, attribution, glossary                                    |
| anything else         | NotFound            | `<title>` "Not found", link to `/` (AC-32, E2E-11)                    |

The Query string (section 3) is preserved across all routes. Explorer -> County -> Song
never drops filters; the county page adds `county` to the Query if it is absent.

## 3. Shared state: `Query`

```ts
interface Query {
  q: string;                 // free text
  country?: string;          // place id path, e.g. "ro"; the string "all" removes the country constraint
  region?: string;           // place id path
  county?: string;           // place id path
  village?: string;          // place id path
  genre: GenreId[];
  style: string[];           // verbatim style strings from the data
  performance?: Performance; // 'vocal' | 'instrumental' | 'mixed' | 'unknown'
  instrument: string[];
  yearFrom?: number;
  yearTo?: number;
  sort: 'title' | 'style' | 'location' | 'year' | 'source';
  dir: 'asc' | 'desc';
  page: number;              // 1-based
  unmapped?: boolean;        // extension: only songs without coordinates (MAP-SPEC section 8)
  trip?: string;             // extension: journey (trip) id (section 14)
  stop?: number;             // extension: selected stop number within the trip, 1-based
  date?: string;             // extension: 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD' (section 14)
  borders?: '1910' | '1920' | 'now' | 'both';  // extension: border layer on the journey map
}
const DEFAULT_QUERY: Query = {
  q: '', country: 'ro', genre: [], style: [], instrument: [], sort: 'title', dir: 'asc', page: 1,
};
const PAGE_SIZE = 50;        // fixed, not in the URL
```

Invariants (enforced by `setQuery`, never by callers):

- Place ids are paths, so the deepest set level implies the others: setting `village`
  to `ro/crisana/bihor/beius` sets `county` `ro/crisana/bihor`, `region` `ro/crisana`,
  `country` `ro`. Setting `county` clears `village`; setting `region` clears `county` and
  `village`; setting `country` clears the rest. Clearing a level clears every level below it
  and keeps the levels above.
- `country` defaults to `ro` (AC-01). The country switch in the place tree sets another
  country id or `all`; `all` means no country constraint.
- Any change other than `page`, `sort`, `dir`, `borders`, `stop` resets `page` to 1.
- Array facets are deduplicated and sorted: genre by the fixed genre order, style and
  instrument by `roBase` collation (section 5) so the canonical string is stable.
- `yearFrom <= yearTo` when both are set; if the user inverts them they are swapped.
- Ids that do not exist in the catalogue are dropped on decode and recorded in the
  decoder's `warnings` array (QA 3.1); nothing throws.
- `trip`, `stop`, `date` and `borders` are only meaningful on `/journeys` but survive on
  other routes so that a link back keeps the trip selected. `stop` is dropped when `trip`
  changes or is cleared.

### 3.1 URL codec

The codec is hand-written (`app/src/state/urlCodec.ts`), not `URLSearchParams`, so that
place-id slashes and list commas stay readable and round-trip exactly. Parameter names
and encoding, in canonical order:

| Field        | Param      | Encoding                                                                                     |
|--------------|------------|----------------------------------------------------------------------------------------------|
| q            | `q`        | trimmed; omitted when empty; percent-encoded, space as `+`                                   |
| country      | `country`  | omitted when `ro` (the default); `all` or a country place id otherwise                       |
| region       | `region`   | place id path; written only when it is the deepest selected level                            |
| county       | `county`   | place id path; written only when it is the deepest selected level                            |
| village      | `village`  | place id path                                                                                |
| genre[]      | `genre`    | comma list: `genre=colinda,joc`                                                              |
| style[]      | `style`    | comma list of the verbatim strings, each percent-encoded; a literal comma inside a value is `%2C` |
| performance  | `perf`     | single id                                                                                    |
| instrument[] | `instr`    | comma list                                                                                   |
| yearFrom     | `from`     | integer, four digits                                                                         |
| yearTo       | `to`       | integer                                                                                      |
| sort         | `sort`     | omitted when `title`                                                                         |
| dir          | `dir`      | omitted when `asc`                                                                           |
| page         | `page`     | omitted when 1                                                                               |
| unmapped     | `unmapped` | `unmapped=1`; omitted when false                                                             |
| trip         | `trip`     | trip id (AC-39)                                                                              |
| stop         | `stop`     | integer, 1-based stop number; only with `trip` (AC-39)                                       |
| date         | `date`     | `YYYY`, `YYYY-MM` or `YYYY-MM-DD`                                                            |
| borders      | `borders`  | `1910`, `1920`, `now` or `both` (AC-40); omitted when it equals the default for the state (section 14.3) |

Rules:

- Only one place param is written, the deepest; on decode a deeper param wins and fills its
  ancestors, and a shallower param that disagrees with it is ignored with a warning. So
  `?county=ro/crisana/bihor` is the canonical form of "Bihor selected" and
  `?region=ro/crisana&county=ro/crisana/bihor` decodes to the same Query.
- Encoding: each value is `encodeURIComponent`-encoded, then `%2F` is restored to `/`
  (RFC 3986 allows `/` in a query) and, for list params, values are joined with a raw `,`.
  `%2C` inside a value therefore means a literal comma. Decoding splits on `&`, then on the
  first `=`, then for list params on raw `,`, and only then percent-decodes each piece.
  `+` and `%20` both decode to a space.
- Defaults are omitted, so the empty query is `/` with no `?`, and `encode(decode(s)) === s`
  for every canonical string (QA 3.1).
- Parameters are written in table order; list values in the order given by the
  invariants above. Two equal queries always produce the same string, which the status
  bar shows and users share (AC-22, AC-23).
- Tolerant decode: unknown params are ignored and dropped on the next write; repeated
  single-value params take the last occurrence; non-integer `from`, `to`, `page` are
  ignored; `page` beyond the last page clamps after filtering; empty list params
  (`genre=`) mean "none". Every dropped item is named in `warnings`.
- Route params (`:countyId`, `:songId`) are path segments; the Query stays in the search
  string. On `/county/...` the path wins if `?county=` disagrees. There is no `song`
  query param; the song id is always the path.
- History: typing in the search box uses `history.replaceState` (debounced 200 ms) so
  Back does not step through keystrokes; every other filter, sort or place change uses
  `pushState` (AC-22). Route changes push. (ARCHITECTURE.md says "filter changes use
  replaceState"; AC-22 is the tested behaviour and wins.)

### 3.2 Hooks

- `useCatalog(): { status: 'loading' | 'ready' | 'error'; error?: Error; songs; places;
  facets; journeys?; villages?; contextEvents?; index; retry() }`.
- `useQuery(): [query: Query, setQuery: (patch: Partial<Query>) => void, reset: () => void]`;
  `reset` clears everything except `sort`, `dir`, `borders` (AC-11); on `/journeys` it also keeps `trip`.
- `useDerived(): Derived` (section 4), memoised on `[query, catalogue]`. Above 5,000
  records the filtering step runs in the worker and returns ids; the selectors are written
  as pure functions over ids so both paths share code.

## 4. Derived selectors

Pure functions in `app/src/state/selectors.ts`, unit-tested per QA 3.2 to 3.6. `Derived`
is built in one `useMemo` chain so that a change in `page` does not recompute filtering.

```ts
interface Derived {
  predicates: Record<FacetKey, (s: Song) => boolean>;  // place, q, genre, style, performance, instrument, year, unmapped, journey
  filteredSongs: Song[];            // all predicates AND-ed
  total: number;                    // size of the default set (country only), for "N of M"
  sortedSongs: Song[];              // filteredSongs ordered by sort/dir
  pagedSongs: Song[];
  pageCount: number;
  facetCounts: { genre: Counts; style: Counts; performance: Counts; instrument: Counts };
  yearHistogram: { from: number; to: number; count: number }[];   // 5-year bins over "all but year"
  placeTree: PlaceNode[];           // with counts
  mapPoints: MapPoint[];            // MAP-SPEC section 6
  unmappedCount: number;
  activeChips: Chip[];
  journey?: JourneyDerived;         // section 14.2
}
type Counts = Map<string, number>;
```

- `normalize(s)`: NFD, strip combining marks (U+0300 to U+036F), lowercase, collapse
  whitespace. This folds Romanian `ă â î ș ş ț ţ` and Hungarian `á é í ó ö ő ú ü ű` to
  their base letters; comma-below and cedilla variants therefore match each other.
  MiniSearch uses it as `processTerm` for both indexing and querying (AC-13).
- `predicates.q`: MiniSearch over `title`, `incipit`, `text`, `location.village`,
  `location.villageHistorical`, `location.county`, `location.countyHistorical`,
  `performer.name`, `collector`, `source.referenceCode`, with `prefix: true`, `fuzzy: 0.1`,
  `combineWith: 'AND'` (every whitespace token must match, AC-12) and boosts
  `{ title: 3, village: 2, villageHistorical: 2 }`. Active only when `q.trim().length >= 2`.
  The result is a `Set` of ids; the predicate is membership.
- `predicates.place`: with `country = 'all'` no constraint; otherwise the song's
  `location.placeId` starts with the deepest selected id followed by `/` or equals it.
  Songs whose `placeId` is null but whose `location.country` matches are included at the
  country level only (they are "(county unknown)" in the tree).
- `predicates.genre` etc: empty array means no constraint; otherwise membership (OR within
  a facet). `style` and `instrument` exclude null / empty records while active (AC-06,
  AC-08). `performance` is single-valued.
- `predicates.year`: `collected.year` between `yearFrom` and `yearTo` inclusive; null-year
  records are excluded only when at least one bound is set (AC-09).
- `predicates.unmapped`: `location.lat` or `location.lng` is null (only when `query.unmapped`).
- `predicates.journey`: id is in the selected trip's `songIds` (section 14).
- **facetCounts**: for facet F, count values over the songs that satisfy every predicate
  except F (AC-05, QA 3.3). Values with count 0 are still listed; the UI disables them.
  The sum of genre counts equals the size of the set filtered by everything except genre.
- **placeTree**: built from `places.json` via `parent`; children sorted with `roBase` on
  `name`. Each node's `count` is the number of songs under it that satisfy every predicate
  except `place`. Records that resolve to a county but not to a village appear in a
  synthetic "(village unknown)" leaf under that county (AC-04, QA 3.5); records with a
  country but no county appear in a "(county unknown)" leaf under the region if known, else
  under the country. Historical names are attached to nodes, never extra nodes. Nodes with
  count 0 are collapsed and greyed, not removed, unless a whole country has 0 (hidden) or
  is not the selected country (collapsed). Building the tree is deterministic.
- **mapPoints**: from `filteredSongs`, grouped by county (county mode) or by village
  (village mode); songs whose place has no coordinates go to `unmappedCount` (MAP-SPEC 6).
- **total**: size of the set with only the country predicate applied; the results header
  reads "N of M melodies" (AC-10).

## 5. Sort keys

`sortedSongs = [...filteredSongs].sort(comparator(sort, dir))`. `Array.prototype.sort` is
stable, but the comparator still ends with `id` so results are identical across engines.
`dir = 'desc'` reverses the comparison of known values only; records with an unknown
key stay last in both directions (AC-14 to AC-18).

Collators (created once):

```ts
const roBase = new Intl.Collator('ro', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
const roFull = new Intl.Collator('ro', { sensitivity: 'variant', numeric: true });
const titleKey = (s: Song) => normalize(s.title ?? s.incipit ?? '');
```

| sort       | Key, in order of comparison                                                                                                   |
|------------|-------------------------------------------------------------------------------------------------------------------------------|
| `title`    | 1. null or empty title last (AC-14). 2. `roBase.compare(titleKey(a), titleKey(b))`: the strings are pre-folded because the Romanian ICU tailoring treats a / ă / â as distinct primary letters, so `sensitivity: 'base'` alone would not place "Șapte" among the S entries; `numeric` orders "Cantec 2" before "Cantec 10". 3. `roFull.compare(a.title, b.title)` keeps "Sara" and "Șara" in a fixed relative order. 4. `id`. |
| `style`    | 1. null style last. 2. `roBase.compare(normalize(a.style), normalize(b.style))` (the schema keeps `style` verbatim, so there is no vocabulary order, AC-15). 3. title key. |
| `location` | 1. country name (`roBase`, from `placeById(country).name`), 2. region, 3. county, 4. village, 5. title key. A null level sorts after all present values at that level; records with no county are last in both directions (AC-16). Names compare on `name`, falling back to `nameHistorical`. |
| `year`     | 1. `collected.year` numeric; null last regardless of dir. 2. title key. (AC-17)               |
| `source`   | 1. site in the fixed order `fmbc`, `bsys`, `gyuj`. 2. `source.volume` via `roBase` (numeric, so "RFM I" sorts by its Roman numeral only if the scraper normalises it; otherwise as text), null last. 3. `source.number` via `roBase` with `numeric: true` ("21/612" before "21/5398", "A 9" before "A 10"), null last. 4. `source.referenceCode` via `roBase` numeric (the fallback when volume and number are both null, AC-18). 5. `id`. |

County-page column sorts reuse the same comparator plus two local keys: `genre` (fixed
genre order, null last) and `village` (village name via `roBase`, then title).

## 6. Shared components (app shell)

```
<App>
  <CatalogProvider>              useCatalog(): loads the manifest URLs, exposes status
    <QueryProvider>              URL <-> Query, exposes useQuery() / useDerived()
      <SkipLink/>                "Skip to results", first in DOM, --z-skip
      <TopBar/>
      <Routes/>                  ExplorerPage | CountyPage | SongPage | JourneyPage | AboutPage | NotFound
      <StatusBar/>               desktop only
      <Footer/>                  present before data loads (AC-33)
```

**TopBar** `{ compact?: boolean }`: masthead ("Bartok / Romania", `--fs-40` on the Explorer,
`--fs-24` elsewhere), primary nav (Explorer, Journeys, About), `SearchInput`, "Colour by
genre" toggle (Explorer only; local state remembered in `localStorage` key
`bartok.colourByGenre`, wrapped in try/catch), theme toggle (auto / light / dark, key
`bartok.theme`, sets `data-theme` on `<html>`). Height `--topbar-h`, sticky, `--z-sticky`.

**SearchInput** `{ value; onChange(v); placeholder; resultCount? }`: `<input type="search">`
with `aria-label`, clear button (44 px), debounced 200 ms into `setQuery({ q })` with
`replaceState`. Enter moves focus to the results list. The count is announced through the
results `aria-live` region, not here (one announcement per change).

**StatusBar** reads `query`, `filteredSongs.length`, `total`, `unmappedCount`. Shows the
canonical query string in mono (`--fs-11`), "Copy link" (copies `location.href`, toast
"Link copied"; on clipboard failure selects the text and shows "Press Ctrl+C to copy"),
"N of M melodies", "N not mapped" (MAP-SPEC section 8), and `ExportButton`.

**ExportButton** `{ songs: Song[]; query: Query }` (AC-21): downloads
`bartok-romania-<N>-<yyyymmdd>.json` containing `{ query: canonicalString, count, generatedAt,
attribution, records }` with `records` in display order and each record byte-identical to
`songs.json` (sorted keys), and `attribution` = the footer text plus the three database
URLs (section 15). Disabled when N = 0; when the serialised size exceeds 10 MB a
confirm dialog ("This export is about 14 MB. Download?") precedes the download. Built with
a `Blob` and an object URL that is revoked after the click.

**Footer**: attribution text from `UI-COPY.md` section 12 with the three source links; also
rendered on NotFound and the error state.

**ActiveFilterChips** `{ chips: Chip[]; onRemove(chip); onClearAll() }` where
`Chip = { key: FacetKey; value: string; label: string }`. Each chip is a `<button>` with
`aria-label="Remove filter: {label}"`, 28 px tall on desktop with a 44 px hit area via
padding, 44 px on touch. "Clear all filters" is last. Order: place (deepest only, "Bihor
(Bihar)" or "Beiuș, Bihor" for a village per AC-04), genre..., style..., performance,
instrument..., year ("1909-1912", "from 1909", "to 1912"), q ("\"text\""), unmapped,
trip. Removing a chip moves focus to the next chip or to "Clear all".

**GenreSwatch** `{ genre: GenreId | null; size?: 8 | 12 }`: coloured square, `aria-hidden`;
the genre name is always adjacent as text. Null genre renders the hatched "other" swatch.

**GenreBar** `{ counts: Partial<Record<GenreId, number>>; total: number; height?: 8 | 16 | 24; showLegend?: boolean }`:
stacked horizontal bar in inline SVG, segments in fixed genre order (bocet, colinda,
doina, joc, nunta, cantec, other), `role="img"` with `aria-label="Genres: 12 colinda, 5 joc, ..."`,
tooltip per segment on hover and focus. Labels inside segments only at height 24 and
width >= 32 px, in `--genre-label-ink`.

**Pagination** `{ page; pageCount; onPage(n) }`: Prev / "Page n of m" / Next and a page
input; hidden when `pageCount <= 1`; `<nav aria-label="Results pages">`.

**PlaceLabel** `{ place: Pick<Place, 'name' | 'nameHistorical' | 'confidence' | 'coordSource'>; level?: Place['type'] }`:
renders "Beiuș (Belényes)" per MAP-SPEC section 7; the historical part in `--muted` mono
inside `<span lang="hu">`. Adds the text marker "location uncertain" (with `title`) when
`confidence === 'low'` or `coordSource === 'gazetteer-approx'`, and "not mapped" when
there are no coordinates.

**EmptyState** `{ title; body?; actions?: ReactNode }`, **ErrorState** `{ error; onRetry }`,
**Skeleton** `{ rows: number }`: section 11.

## 7. Explorer

Layout at >= 1024 px: three columns, `FilterRail` (`--rail-w`) | `MapPanel` (flex 1) |
`ResultsPanel` (`--results-w`), each scrolling independently under the sticky TopBar,
StatusBar fixed at the bottom. 768 to 1023 px: the rail collapses into a "Filters" button
that opens the same `FilterSheet` as the phone; map and results stack. Under 768 px:
section 10.

```
<ExplorerPage>
  <FilterRail>
    <PlaceTree/>                                   with the country switch in its header
    <FacetGroup id="genre"><CheckboxFacet/></FacetGroup>
    <FacetGroup id="style"><ChipFacet/></FacetGroup>
    <FacetGroup id="performance"><ChipFacet single/></FacetGroup>
    <FacetGroup id="instrument"><ChipFacet/></FacetGroup>
    <FacetGroup id="year"><YearRange/></FacetGroup>
    <ClearAllButton/>
  </FilterRail>
  <MapPanel>                                       MAP-SPEC (simplified 2026-09-28)
    <MapView/> zoom +/- and "Reset view", <BorderToggle compact/> + <CompareDivider/>,
    two-line legend, three-line hover card; <MapAccessibleList/> after the panel
  </MapPanel>
  <ResultsPanel>
    <ResultsHeader> <ResultCount/> <SortSelect/> <ExportButton/> <ActiveFilterChips/> </ResultsHeader>
    <SongList> <SongRow/>* </SongList>
    <Pagination/>
  </ResultsPanel>
```

**FilterRail** `{ disabled?: boolean; children }`: `<aside aria-label="Filters">`. Groups
are disclosures, all open by default on desktop; open state is local. While the catalogue
is loading every control is disabled (AC-31).

**FacetGroup** `{ id: FacetKey; title; hint?; activeCount; children }`: heading in uppercase
mono, the ro / hu hint under it (UI-COPY), active-count badge, "Clear" link when
`activeCount > 0`.

**PlaceTree** `{ tree: PlaceNode[]; selected: { country?, region?, county?, village? }; countryOptions: Place[]; onSelect(level, id | undefined); onCountry(id | 'all') }`.
Reads `derived.placeTree`. Emits `setQuery({ [level]: id })` (invariants fill in the
ancestors). Header: the country switch, a native `<select>` labelled "Country" listing the
countries present in the data plus "All countries", default Romania (AC-01). Tree:
`role="tree"`, rows `role="treeitem"` with `aria-level`, `aria-expanded`, `aria-selected`;
each row shows `PlaceLabel` and a mono count right-aligned; synthetic "(village unknown)" and
"(county unknown)" leaves are selectable like villages (they set a `placeId`-less
predicate: county-known-village-null). Keyboard: Up/Down move, Right expands or enters
children, Left collapses or goes to the parent, Home/End, Enter or Space selects, type-ahead
by first letters (E2E-10). Clicking the selected row again clears that level. The selected
branch is always expanded; the selected country is expanded to regions on load (AC-01).
Rows are 32 px on desktop and 44 px on touch; indent 16 px per level.

**CheckboxFacet** `{ facet: 'genre'; values; counts; selected; onChange(next) }`: native
`<input type="checkbox">` per value, label = `GenreSwatch` + "colindă / winter carol" +
mono count; count 0 disables unless selected (AC-05). Includes a "no genre" value for
null when the data has such records, keyed `null` in the URL as the literal `none`
(decision 8).

**ChipFacet** `{ facet: 'style' | 'performance' | 'instrument'; values; counts; selected; single?; onChange(next) }`:
toggle buttons with `aria-pressed` inside `role="group"` labelled by the facet title.
`single` (performance) behaves like a radio group; pressing the active chip clears it.
Style values are the distinct verbatim strings from `facets.json` (AC-06). Instruments
with count 0 are hidden (the list can be long) except selected ones; above 12 visible
values show 12 and "Show all (n)".

**YearRange** `{ min; max; from?; to?; histogram: Bin[]; onChange({ from?, to? }) }`: two
`<input type="number">` (From / To, `inputmode="numeric"`, 44 px tall) above a 5-year
histogram (inline SVG, `role="img"` with a summary label, bins outside the range dimmed)
and two overlaid native `<input type="range">` for the dual thumbs (native inputs keep
keyboard and screen-reader behaviour). Number inputs commit on blur or Enter; sliders on
`change`. Bounds from `facets.year` keys (min and max non-null years). Setting both ends
back to the bounds removes both params (AC-09).

**ClearAllButton**: emits `reset()`.

**ResultsHeader**: `ResultCount` ("1,204 of 13,212 melodies", `aria-live="polite"`,
`aria-atomic`), `SortSelect`, `ExportButton`, `ActiveFilterChips`. Sticky inside
ResultsPanel (`--z-sticky`).

**SortSelect** `{ sort; dir; onChange({ sort, dir }) }`: native `<select>` with the five
keys (UI-COPY section 6) and a direction toggle (`aria-pressed`, label "Descending").

**SongList** `{ songs: Song[]; selectedId?: string }`: `<ol aria-label="Results">` of
`SongRow`. Roving tabindex: Up/Down move between rows, Tab leaves the list. Hovering or
focusing a row highlights its village dot (`MapPanel` receives `highlightPlaceId`).

**SongRow** `{ song; place?; showPlace?: boolean }`: link to `/song/:id?<query>`. Line 1:
title or "Untitled" (`--fs-14 --fw-medium`) with genre swatch; line 2 `--fs-12 --muted`:
village (historical) / county, year or "n.d.", then the `SourceLink` (section 15); right
edge: icons for `media.audio.length > 0` and `media.notation.length > 0` with visually
hidden text. Min height 56 px; the title link covers the row except the source link.

**Interactions on the Explorer**

| Action                                   | Effect                                                                 |
|------------------------------------------|------------------------------------------------------------------------|
| type in search                           | `q`, debounced, replaceState; list, map and counts update within 300 ms |
| change country switch                    | `country`, clears deeper levels; tree re-roots                         |
| select a tree node                       | place level set, pushState, map fits to that place                      |
| click county bubble / village dot        | same as tree select (MAP-SPEC section 5); Esc or "Reset view" clears     |
| borders then / now / compare (map)       | `borders` (omitted when `now`); era from the year filter, else 1910      |
| toggle a facet value                     | facet updated, page 1                                                   |
| change year                              | bounds, page 1                                                          |
| change sort                              | `sort` / `dir`, page unchanged                                          |
| click a chip                             | that value removed; "Clear all" -> `reset()`                            |
| "Open county page"                       | `/county/<id>?<query>` (hover card, tree row action, results header when a county is selected) |
| click a row                              | `/song/<id>?<query>`                                                    |
| Export JSON / Copy link                  | section 6                                                               |

## 8. County drill-down

Route `/county/:countyId`. Layout: `Breadcrumb` (Romania > Crișana > Bihor), `CountyHeader`,
`CountyTabs`. No filter rail; the active non-place filters apply and are listed as
`ActiveFilterChips` under the header with the note "Counts reflect the active filters".
Under 768 px the tab strip scrolls horizontally and tables become card lists.

**Breadcrumb** `{ items: { label; to }[] }`: `<nav aria-label="Breadcrumb">`; each
ancestor links to the Explorer with that place set.

**CountyHeader** `{ county: Place; stats: CountyStats }` with
`CountyStats = { melodies, villages, withAudio, withNotation, yearMin?, yearMax?, genreCounts }`:
`PlaceLabel` at `--fs-24`, region / country line, four mono figures, a 16 px `GenreBar`,
"View in explorer", "Copy link", `ExportButton`.

**CountyTabs** `{ tab: TabId; onChange }` with `TabId = 'melodies' | 'genre' | 'performer' | 'timeline' | 'map'`:
`role="tablist"`, tabs `role="tab"` with `aria-selected`, Left/Right move, `role="tabpanel"`.
`?tab=` in the URL (default `melodies`, omitted; E2E-05 "tab switch keeps URL in sync").

Above the tabs on every tab: **VillagesTable** `{ rows: VillageRow[]; sort: { key, dir }; onSort; selectedVillage?; onSelect(villageId) }`,
`VillageRow = { place: Place; melodies; genreCounts; yearMin?; yearMax?; mapped: boolean }`.
Columns: Village (`PlaceLabel`), Melodies (mono, right), Genres (`GenreBar` 8 px, counts in
its accessible label), Years ("1909-1912" or "n.d."). Header cells are buttons with
`aria-sort`; sort is local state, default village name ascending. The "(village unknown)"
row is last. Clicking a row sets `village` in the Query (narrows every tab); the selected
row gets the accent left border. `<table>` with `<caption>` ("Villages in Bihor, 34"),
sticky header, zebra rows with `--surface-2`.

Tab panels:

- **MelodiesTable** `{ songs; sort; onSort }`: Title (link), Genre, Performance, Village,
  Year, Source (`SourceLink`, section 15), audio / notation icons. Column sort writes `sort` /
  `dir` into the Query for title / style / location / year / source; `genre` and `village`
  are local. 50 rows per page with `Pagination`.
- **ByGenrePanel** `{ genreCounts; total; onPick(genre) }`: one row per genre: swatch,
  "colindă / winter carol", bar scaled to the max (inline SVG), count and "{pct}% of
  {total}" in mono. Clicking toggles that genre in the Query.
- **ByPerformerPanel** `{ rows: PerformerRow[] }`, `PerformerRow = { name, age?, sex?, ethnicity?, village: Place, count, years }`:
  sortable by name / count / village; unnamed performers grouped as "Unnamed performer
  (n)". Clicking a row sets `q` to the performer's name.
- **TimelinePanel** `{ perYear: { year; count; genreCounts }[]; unknownYear: number }`:
  inline SVG column chart from the county's min to max year, stacked by genre when
  "colour by genre" is on, otherwise `--ink-2`; columns focusable (`role="img"`, label
  "1912: 38 melodies"); click sets `from = to = year`; a visually hidden `<table>` mirrors
  the data; "N melodies without a year" as text.
- **LocalMapPanel** `{ county: Place; points: MapPoint[]; selectedVillage? }`: `MapView`
  bounded to the county, village dots only, no clustering; 420 px high, 320 px on phone.

## 9. Song record

Route `/song/:songId`. Layout at >= 1024 px: main column (max 760 px) + right rail
(320 px); below, one column with the rail sections after the text.

```
<SongPage>
  <Breadcrumb/>                         Romania > Bihor > Beiuș (Belényes) > title
  <SongNav/>                            Previous / Next within sortedSongs, "n of N", Back to results
  <SongTabs tab="record|raw"/>
  record:  <SongHeader/> <NotationFigure/> <AudioPlayer/>* <SongText/> <RelatedMelodies/>
           <SongRail> where | who-when | music | works | source </SongRail>
  raw:     <RawJson/>
```

**SongNav** reads `derived.sortedSongs`; position "n of N"; Previous disabled on the first
record, Next on the last (no wrap, AC-19); the Query string is kept on the song URL. A
deep link without a query uses the default set (country `ro`) in the default sort. Keyboard:
Left / Right arrow when focus is not in an input or the audio element. "Back to results"
goes to `/` (or the county page it came from, via `state.from`) with the Query; the
Explorer restores the scroll position of the list from `sessionStorage`.

**SongHeader** `{ song }`: title `--fs-36` (falls back to `incipit`, then "Untitled" with
the reference code), `SourceLink size="header"` with the database name directly under the
title (section 15), incipit under it in `--fs-16` italic when distinct, then a
`role="list"` of link chips: genre with swatch, performance, style, each instrument; each
links to the Explorer with only that facet set (`/?genre=colinda`).

**NotationFigure** `{ items: MediaItem[]; title: string; ref?: string }`: one `<figure>`
per `media.notation[]` item (`<img loading="lazy">`, `alt` = "Notation for {title}"
plus ", page n" when several, `figcaption` from `caption`), a "View full size" button
opening `Lightbox` (`role="dialog"`, `aria-modal`, focus trapped, Esc closes, `--scrim`,
`--z-sheet`, Left / Right between pages). PDF items render as a link "Open notation (PDF)".
Empty array: dashed 3:2 placeholder "No notation image for this record" (E2E-06).
`onError`: "The notation image could not be loaded" with a retry link, never a broken
image icon.

**AudioPlayer** `{ item: MediaItem; title; index; total }`: one native
`<audio controls preload="none">` per `media.audio[]` item, labelled "Recording of {title}"
(plus "n of m"), caption, "Download recording" link, credit line. Empty array: one line
"No recording available". `onError` swaps in "The recording could not be loaded".

**SongText** `{ text; lang? }`: `<section>` headed "Text", `white-space: pre-wrap`,
`lang="ro"` by default (the collection's texts are Romanian unless `performer.ethnicity`
says otherwise), `--fs-16`, `max-width: 60ch`. Null: "No text recorded". `remarks` render
under it as "Remarks" when present.

**RelatedMelodies** `{ song; catalogue }`: first the schema's `related[]` entries grouped by
`relation` (variant, same-source, same-informant, same-place, cross-site, link); resolved
ids render as `SongRow`, unresolved ones as external links with their `label`. If fewer
than 3 result, pad with computed neighbours: same `performer.name` in the same village,
then same village, then adjacent `source.number` in the same volume; up to 6 in total.
Group headings name the relation ("Variants", "Also from Beiuș").

**SongRail / RailSection** `{ id; title; rows: { label; value; mono? }[] }`: `<dl>` per
section, uppercase mono headings; a row is omitted when its value is null.

| Section        | Rows                                                                                                                                              |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Where          | Village (`PlaceLabel`, links to the Explorer filtered), County, Region, Country, Informant's origin (from `location.origin`, when different), Coordinates (mono; "not mapped" when null), Place as printed (`location.raw`, mono), static mini map (MAP-SPEC section 9) when mapped |
| Who / when     | Performer, Age, Sex, Ethnicity (as stated by the source), Collector, Date (`collected.raw`), Year                                                  |
| Music          | Genre (with `genreRaw` in mono when it differs), Performance, Style, Instruments, System position, Cadences, Rhythm, Mode, Ambitus, Syllables, Form |
| In Bartók's works | one row per `composition[]` item: "{work}, {movement}" with catalogue number in mono (site 1 only; section omitted when empty)                   |
| Source         | Reference (`SourceLink`), Volume, Number, Database (human name of `source.site`), "Open record on {site}" (`target="_blank" rel="noopener noreferrer"`, AC-33, AC-36), Record id (mono) |

**RawJson** `{ value: Song }`: `<pre><code>` of the record with sorted keys, 2-space
indent, deep-equal to `songs.json` including `rawFields` (AC-20); "Copy JSON" button;
`tabindex=0` on the `<pre>`; above 200 KB render the first 200 KB with "Show all".

## 10. Phone explorer (< 768 px)

Same route `/`. Single column: `PhoneHeader` (compact masthead, `SearchInput`, "Filters (n)"
button) then the view chosen by `BottomTabs`.

**BottomTabs** `{ tab: 'map' | 'list' | 'filters'; counts: { results; filters } }`: fixed
bottom, `--bottomtabs-h`, three 44 px+ buttons with icon and label, `role="tablist"`.
`map` shows `MapMini` full height with a "N melodies, view list" bar; `list` shows
`SongList` with `ResultsHeader` and `Pagination`; `filters` opens `FilterSheet` and returns
to the previous tab on close. Local state, default `list`; a deep link with a place set
defaults to `map`. The URL scheme is identical to desktop (AC-28).

**MapMini**: `MapView` with cluster radius 56 px; tap opens `MapPointSheet` (bottom sheet
with the hover card content plus "Show melodies" and "Open county page", AC-25).

**FilterSheet** `{ open; onClose }`: `role="dialog" aria-modal="true"`, slides up to 92%
height, scrim, focus trapped, background `inert`, closes on the primary button, backdrop
tap, swipe down (a 60 px downward drag on the handle) or Escape, returning focus to the
"Filters" tab (AC-29). Contains the same `FilterRail` children; footer has "Clear all
filters" and the primary "Show N melodies" updating live. Changes apply immediately (no
draft state).

Touch specifics: rows 44 px min, inputs 16 px font, 44 px slider thumbs, tree rows 44 px.

## 11. States

| State                    | Where                   | Behaviour                                                                                                                                                       |
|--------------------------|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Loading catalogue        | whole app               | TopBar and Footer render; rail controls disabled; results region shows `Skeleton` (8 rows) with `aria-busy="true"`; map area shows the ground colour and "Loading the collection..."; fixed column widths so nothing shifts; no "0 results" flash (AC-31) |
| Catalogue error          | whole app               | `ErrorState` in `<main>`: "The collection could not be loaded." + one structured `console.error` + "Retry" (refetches and then renders the deep-linked state); footer stays (AC-32) |
| No results               | Results, Map            | `EmptyState` "No melodies match these filters." with the active chips listed, "Remove last filter" and "Clear all filters"; count reads "0 of M"; map shows no points; Export disabled (AC-30) |
| No results for `q`       | same                    | title "No melodies match \"{q}\"", action "Clear search", hint on what search covers (E2E-04)                                                                   |
| Page out of range        | Results                 | clamp silently                                                                                                                                                  |
| Song / county not found  | SongPage, CountyPage    | `EmptyState` "No record with id {id}" / "No county with id {id}" + "Back to explorer"; `<title>` "Not found"                                                     |
| Unknown route            | NotFound                | same, with the footer (E2E-11)                                                                                                                                  |
| Not mapped               | Map, StatusBar          | MAP-SPEC section 8                                                                                                                                              |
| Tiles unavailable        | Map                     | MAP-SPEC section 9                                                                                                                                              |
| Media missing / failed   | SongPage                | section 9                                                                                                                                                       |
| Clipboard denied         | StatusBar               | select the text and show "Press Ctrl+C to copy"                                                                                                                 |
| Export too large         | ExportButton            | confirm dialog above 10 MB                                                                                                                                      |
| Offline                  | app                     | if the catalogue is cached the app works; one toast "You are offline; map tiles may not load"                                                                    |
| Journey states           | JourneyPage             | section 14.7                                                                                                                                                    |

## 12. Keyboard and accessibility

- Landmarks: `<header>` (TopBar), `<nav>` (primary, breadcrumb, pagination, bottom tabs),
  `<aside aria-label="Filters">`, `<main>` with `<section aria-label="Map">` and
  `<section aria-label="Results">`, `<footer>`; the status bar is `role="status"`.
- Focus order on the Explorer: skip link -> masthead -> primary nav -> search ->
  colour-by-genre -> theme -> filter rail top to bottom (country switch, tree, genre, style,
  performance, instrument, year, clear) -> map (container, zoom in, zoom out, fit, layer
  toggle, "List counties" / "List villages" control) -> results (count, sort, direction,
  export, chips, rows, pagination) -> status bar (copy link, export) -> footer. The skip
  link targets the results section (AC-34). No positive `tabindex`.
- Focus is never lost on re-render: rows and chips are keyed by stable ids; removing a
  chip moves focus to the next chip or "Clear all"; closing a sheet or lightbox returns
  focus to its opener.
- Map: the Leaflet container has `tabindex=0`, `role="application"`,
  `aria-roledescription="map"` and `aria-label` from UI-COPY; arrow keys pan, `+` / `-`
  zoom. Dots are `<button>`s inside `divIcon` markers with
  `aria-label="Beiuș (Belényes), Bihor: 24 melodies"` and `aria-pressed` when selected,
  in Tab order north to south. Because dots are hard to discover by keyboard,
  `MapAccessibleList` ("List counties" in county mode, "List villages" in village mode,
  AC-27) is a disclosure after the map containing a `<ul>` of buttons with the same
  labels and actions; clusters are buttons "Cluster of n places, m melodies; press to zoom".
- Hover cards also show on focus, `role="tooltip"`, linked by `aria-describedby`,
  dismissed with Esc.
- Targets: every control has a 44 x 44 px minimum hit area on `pointer: coarse` and
  24 x 24 px on fine pointers, including map dots (padded beyond the visible circle) and
  table header sort buttons. Result rows are full-width links.
- Contrast: text >= 4.5:1, components and dots >= 3:1 (DESIGN-TOKENS.md, with a unit test
  over the token pairs per QA section 5). Colour is never the only cue: genre also appears
  as text, selected rows also get a border, disabled facets also read "(0)".
- Live regions: result count (`polite`), toasts, the filter-sheet count. One announcement
  per change.
- Reduced motion honoured (tokens); no autoplay audio; no parallax.
- Language: `<html lang="en">`; Romanian and Hungarian names and song texts get `lang`.
- Zoom: works at 200% browser zoom and at 320 px wide without horizontal scroll.
- Automated: axe-core in Playwright per QA section 5; E2E-10 keyboard walkthrough.

## 13. Performance notes

- Budgets are in ARCHITECTURE.md (3 MB gzip JSON, 300 KB gzip JS). The shell and footer
  render before the catalogue arrives.
- Filtering 13,000 records with plain predicates takes milliseconds; MiniSearch answers
  in the worker above 5,000 records. `ancestorsOf` and `searchKey` are computed at load.
- Lists page at 50 rows; no virtualisation. Map points recompute only when
  `filteredSongs` or the level changes.
- The journey page's border GeoJSON files load lazily on first visit to `/journeys`.

## 14. Journey mapper

Route `/journeys` (wireframe artboard 5). Shows each of Bartók's field trips, reconstructed
by the data agent from the record dates (AC-38: dated records grouped while the gap between
successive dates is 10 days or less), as a route on the map with the borders of the time,
the stops in order, what was recorded at each stop, and a dated context strip with
citations. Everything shown comes from data files; the UI adds no interpretation (copy
rule in UI-COPY section 13). ACCEPTANCE-CRITERIA.md AC-38 to AC-44 are the contract;
PLAN.md names `JOURNEY-SPEC.md` (data derivation) and `GEO-SOURCES.md` (attribution),
which this section does not duplicate.

### 14.1 Data (assumed shapes; reconcile with the schemas the data agent writes)

```ts
interface Journey {                 // one trip; `trip` in the URL
  id: string;                       // "t-1909-07-bihor"
  label: string;                    // "Bihor, July 1909"
  dateFrom: string; dateTo: string; // ISO dates; precision says how much of them is known
  precision: 'day' | 'month' | 'year';
  fuzzy: boolean;                   // true when only year or month is known for most stops
  departure: JourneyEndpoint;       // { placeId?, name, lat, lng, assumed: boolean }  default Budapest, assumed: true
  return?: JourneyEndpoint;         // same shape; absent when unknown
  stops: JourneyStop[];             // ordered
  distanceKm?: number;              // null when any leg is unresolved
  songIds: string[];
  unmapped: { songId: string; reason: 'no-date' | 'place-not-located' }[];   // AC-42
  notes?: string;                   // how the trip was reconstructed, from the data agent
}
interface JourneyStop {
  order: number;                    // 1-based
  placeId: string | null;
  nameThen: string;                 // "Belényes"
  nameNow: string | null;           // "Beiuș"
  lat: number | null; lng: number | null;
  dateFrom: string | null; dateTo: string | null; precision: 'day' | 'month' | 'year' | null;
  songIds: string[];
  genres: Record<string, number>;
  ethnicities: Record<string, number>;   // performer.ethnicity as stated by the sources
  instruments: Record<string, number>;
}
interface VillageStatus {           // villages.json, keyed by placeId
  placeId: string; status: 'existing' | 'renamed' | 'merged' | 'abandoned' | 'unknown';
  nameThen: string; nameNow: string | null; mergedInto?: string; note?: string; source?: string;
}
interface ContextEvent {            // context-events.json
  id: string; date: string; dateTo?: string;
  type: 'border' | 'publication' | 'statement' | 'press' | 'other';
  title: string; summary: string;   // one sentence, factual
  citation: { source: string; url?: string; locator?: string };   // locator: page, column, issue
  journeyIds?: string[];
}
```

Border files (MAP-SPEC section 11): `data/geo/borders-1910.json`, `data/geo/borders-1920.json`,
`data/geo/borders-now.json`, optionally `borders-1914.json` (PLAN.md); the UI treats any
`borders-<year>.json` in the manifest as an era, so adding one needs no UI change.
Records with a year but no month belong to no trip and are listed under "Unmapped" on the
timeline (AC-38, AC-42).

### 14.2 Derived (`derived.journey`)

```ts
interface JourneyDerived {
  journeys: Journey[];                 // all, sorted by dateFrom
  selected?: Journey;                  // by query.trip, or the trip containing query.date
  selectedStop?: number;               // query.stop when it exists in the trip
  atDate?: string;                     // query.date when no trip matches it
  era: '1910' | '1920';                // from dateFrom (or query.date): before 1918-01-01 -> '1910', else '1920' (AC-40)
  bordersDefault: '1910' | '1920' | 'now';   // the era when a trip or date is selected, else 'now'
  route: RouteLeg[];                   // legs between resolved points, each { from, to, kind: 'assumed' | 'known' | 'return', fuzzy, km? }
  stops: (JourneyStop & { status: VillageStatus['status']; statusNote?: string; resolved: boolean })[];  // 'unknown' when absent from villages.json (AC-41)
  unmapped: { song: Song; reason: 'no-date' | 'place-not-located' }[];   // AC-42
  events: ContextEvent[];              // cited events within [dateFrom - 2 years, dateTo + 2 years] (AC-43); uncited events never shown
  unmappedTrips: { song: Song; reason: 'no-date' }[];   // year-only records, the timeline's "Unmapped" section
}
```

`predicates.journey` narrows `filteredSongs` to `selected.songIds`, so the existing
results list, export and status bar work unchanged on `/journeys`. Other facets still
apply (a genre filter dims stops with no matching songs rather than removing them).

### 14.3 Query and URL

Fields `trip`, `stop`, `date`, `borders` (section 3). Rules: setting `trip` clears `date`
and `stop`; setting `date` clears `trip` unless a trip contains that date, in which case
the trip is set instead; `stop` is written only while it names an existing stop of the
trip. `borders` is omitted from the URL when it equals `bordersDefault` (the era while a
trip or date is selected, `now` otherwise); the "Borders then" control writes the era
value explicitly (`borders=1910` or `borders=1920`) so a shared link shows the same set
(AC-40). The comparison handle position (`BorderToggle`) is local state, not in the URL.

### 14.4 Components

```
<JourneyPage>                                 (revised 2026-09-28: the list is the primary control)
  <JourneyList>                               left column, 240-300 px (a sheet under 1024 px)
    search, "Show all derived trips" toggle, <JourneyTimeline/> (collapsible year strip),
    listbox "Trips by date" grouped by year: place, dates, melodies, stops, quality badge
  </JourneyList>
  <JourneyMap>                                centre (MAP-SPEC section 11): route, numbered stops, departure, borders
    <BorderToggle/> <CompareDivider/> <JourneyLegend/> <JourneyAccessibleList/>
  </JourneyMap>
  <JourneyPanel>                              right, --results-w + 40
    <JourneyHeader/> (known / inferred) <StopList/> <details "Context (n)"><ContextStrip headless/></details>
  </JourneyPanel>
</JourneyPage>
```

**JourneyList** `{ journeys; curated: Map<id, CuratedJourney>; selectedId?; featuredId?; onSelect(id); compactStrip?; footer? }`:
the left-hand list. A search box ("Place or year", folded match on the index label, the
counties and the stop names), a checkbox "Show all derived trips (n hidden)" that reveals
the date-gap trips one record or one stop wide (`isMinorDerived`; hidden by default so the
list is not flooded with machine-made trips; a selected trip is always listed), the year
strip, then a `role="listbox"` named "Trips by date" of `role="option"` rows inside
`role="group"`s labelled by year. Each row: the place named on the index (or the
historical counties), the date wording, "n melodies", "n stops" when more than one, a
"Featured trip" badge on the default trip, and a text data-quality badge from
`journeyQuality`: "sourced itinerary" (a `journeys-curated.json` entry with citations),
"documented itinerary" (index entry with records), "dates only" (date-gap trip), "index
only" (index entry without any record online); the badge's `title` explains it. Keyboard:
roving tabindex, Up / Down / Home / End move, Enter or Space select, type-ahead by year
digits or the first letters of the place. Under 1024 px the list opens in
`JourneyListSheet` (`role="dialog"`, Escape closes) from a "Journeys (n)" button in a bar
above the map that also names the open trip.

**JourneyTimeline** (year strip) `{ journeys; year?; onYear(year | undefined); open? }`: a
`<section aria-label="Timeline">` holding a `<details>` (open on desktop, collapsed in the
sheet) with one 44 px button per year from the first to the last trip, a bar proportional
to the number of trips, `aria-pressed` for the active year and "All years" to clear. It
narrows the list; it is no longer the primary control and no longer carries lanes, a date
input or a select.

**Data quality and the featured trip** (`state/journeys.ts`): `journeyQuality`,
`isMinorDerived`, `featuredJourney` (a curated `featured: true` entry, else the trip with
the best quality, most records and most stops: currently the March 1913 Máramaros trip with
367 melodies), `visibleJourneys`, `groupJourneysByYear`, `journeysPerYear`, `explorerEra`.
`data/journeys-curated.json` is optional and loaded through the manifest
(`useCuratedJourneys`): `{ journeys: [{ id, featured?, title?, summary?, itinerary?: [{ date?, place, placeNow?, note? }], sources: [{ citation, url? }] }] }`,
keyed by the `journeys.json` id; the header shows its summary and sources when present.

**JourneyMap** `{ journey?: JourneyDerived; borders: '1910' | '1920' | 'now' | 'both'; era; selectedStop?; onStop(order); highlightStop? }`:
`MapView` with the route and border layers of MAP-SPEC section 11; fits to the route
bounds (departure included) when a journey is selected, else to Romania. Stop markers are
numbered buttons (Tab order = stop order), `aria-label="Stop 3 of 9: Belényes (1909), now
Beiuș; 12 melodies, 3 to 5 July 1909"`, `aria-pressed` when selected. `[` and `]` move
between stops when the map has focus.

**BorderToggle** `{ value: '1910' | '1920' | 'now' | 'both'; era: '1910' | '1920'; opacity: number; onChange; onOpacity }`:
a `role="radiogroup"` of three 44 px buttons "Borders then ({era})", "Borders now",
"Compare", plus, when the data ships more than one historical set, an "Era" `<select>`
(1910 / 1920) so the user can override the automatic choice; and in Compare mode an `<input type="range" min=0 max=100>` labelled
"Comparison: then / now" that drives both the swipe position (a vertical divider across the
map, MAP-SPEC 11.4) and, when the user prefers, the opacity of the "then" layer (a second
toggle "Swipe / Fade"). The range input is the keyboard path; dragging the on-map handle
writes back to it. The era is chosen automatically from the trip date (before 1918: 1910;
from 1918: 1920, AC-40) and is stated in the button text and the legend; a `title`
explains "1910 counties and the Austria-Hungary frontier" / "1920 borders after the Treaty
of Trianon".

**JourneyHeader** `{ view; villages; curated?; borderAttributions; onClearFilters? }`: the
quality badge and kind line, the title `--fs-24`, "n stops, m unmapped records; k melodies,
d km" (AC-42; distance omitted when null), then two plain lists that state what is known
and what is inferred. Known: 'listed on the trip index as "..."', "dates: ... (dated to
the day / month known, days unknown / ...)", "n records with a date and a place, at v
places" or "No melodies online for this trip", "itinerary from cited sources" when
curated. Inferred: "departure from Budapest (not documented)", "order of visits (the
source gives no itinerary)" for clusters, "travel between stops (straight lines)",
"records attached by date and county, not listed under this entry", "state at the time:
Kingdom of Hungary (Austria-Hungary) (from the date and present-day country)", the
Romanian-material flag when inferred. Then the curated summary and sources, the filter
notices, the index link and the journey export.

**StopList** `{ stops; selectedOrder?; onSelect(order); onHover(order | undefined) }`: an
`<ol>` (the same order as the route) of stop rows: number, then-and-now name line
"Belényes (1909) -> Beiuș (today)" rendered with `<span lang="hu">` and `<span lang="ro">`,
`VillageStatusBadge`, dates, "12 melodies", and a details line with genres (top three as
"colindă 8, joc 3, doină 1"), ethnicities as stated ("Romanian 11, Hungarian 1"),
instruments. Rows are buttons (`aria-pressed`); Enter selects and pans the map; Up / Down
move; hovering highlights the marker. Unresolved stops (no coordinates) show "location
unknown" and are not drawn, but keep their number. Departure and return are the first and
last items, styled as endpoints, with "(assumed)" when flagged. Each row ends with a
"n records" disclosure listing each record's title and its `SourceLink` (section 15).
After the stops, an "Unmapped (n)" section lists the trip's records with no usable date or
no located place, each with the reason ("no date", "place not located") and its
`SourceLink` (AC-42); they stay in the header count.

**VillageStatusBadge** `{ status: VillageStatus['status']; mergedInto?; note? }`: a text
badge (uppercase mono `--fs-11`, `--border-strong`, no colour coding) reading "existing",
"renamed", "merged into {name}", "abandoned" or "status unknown"; `title` = `note` when
present. Never colour-only.

**ContextStrip** `{ events: EventInWindow[]; headless? }`: rendered inside a collapsible
`<details>` "Context (n)" after the stop list (closed by default; `headless` drops its own
heading). A vertical list of dated cards ordered by date, each: date, type
label ("Border change", "Publication", "Statement", "Press"), title, one-sentence summary,
and the citation "Source: {author}, {title} ({year}), {locator}" linked to `citation.url`
when present (`rel="noopener noreferrer"`). Only events dated within the trip's start
minus 2 years to its end plus 2 years are shown, and an event without a citation is never
rendered (AC-43). Events inside the trip's date range are marked "during this trip". The strip is `role="list"`; cards are `role="listitem"`; the strip scrolls
horizontally with Left / Right when a card is focused. A footer line reads "Context
entries are quoted from the cited sources and are listed for chronology only." Copy rule:
the UI never adds adjectives, judgements or summaries of its own to an event; it shows the
`title`, `summary` and `citation` fields verbatim.

**JourneyAccessibleList**: the non-map fallback, always rendered after the map behind a
disclosure "List route (n stops)": an `<ol>` with departure, each stop ("3. Belényes (1909),
now Beiuș, existing, 12 melodies, 3 to 5 July 1909, 41 km from previous stop") and return.
It is also the whole map replacement when tiles and the SVG fallback are both unavailable.

### 14.5 Interactions

| Action                               | Effect                                                                      |
|--------------------------------------|-----------------------------------------------------------------------------|
| select a trip (list, keyboard)       | `trip` set, `date` and `stop` cleared, map fits the route, panel fills, results narrow; the sheet closes |
| press a year in the strip            | the list narrows to that year (local state); "All years" clears                |
| `date=` in the URL                   | journey containing it selected, else the nearest with the "No trip on ..." notice |
| click a stop (map, list)             | `stop=<n>` set (pushState), marker highlighted, list scrolls, card shows (AC-39) |
| click a stop again                   | `stop` cleared                                                              |
| "Show melodies" on a stop            | `/` with `village` set to the stop's placeId and `journey` kept              |
| Borders then / now / compare         | `borders=1910|1920|now|both`; compare shows the handle                        |
| genre etc. chips (from the shell)    | still apply; stops with no matching songs render dimmed with "0 of n"        |
| Export JSON                          | the journey's songs in stop order                                            |

### 14.6 Keyboard and accessibility

Focus order: skip link -> top bar -> timeline (listbox, date input, journey select) ->
map (container, zoom, fit, border toggle, compare range, stop buttons in order, "List
route") -> panel (header actions, stop list, context strip) -> status bar -> footer.
Every route stop, border mode and context card is reachable by keyboard; the timeline
listbox and the stop list use roving tabindex. Names then and now carry `lang`. Border
line styles differ by dash pattern as well as colour (MAP-SPEC 11.3), the legend states
both, and the compare handle has a visible focus ring.

### 14.7 States

| State                                   | Behaviour                                                                                                    |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `journeys.json` missing or empty        | `EmptyState` "No trips could be reconstructed: no dated records." + "Back to explorer"; the nav entry stays |
| no trip in the URL                      | the featured trip is open (`featuredJourney`), the list marks it "Featured trip", the URL stays clean; the prompt only shows when there are no journeys |
| date with no trip                       | map shows the era's borders for that date; panel says "No trip on {date}. Nearest: {label} ({from})" with a link |
| trip with unresolved coordinates        | route drawn between resolved stops only; a dashed gap marker "n stops without coordinates" in the legend; unresolved stops listed with "location unknown"; if fewer than 2 resolved points, no route and the notice "Route cannot be drawn: fewer than two located stops" |
| fuzzy trip                              | header badge "approximate dates", route dotted, stops ordered by best-known date then by source order         |
| assumed departure                       | "(assumed)" on the endpoint and a dashed first leg; the legend explains it                                     |
| no context events in range              | strip shows "No context entries for this period."                                                            |
| filters remove every song of a trip     | stops all dimmed; header "0 of n melodies match the active filters" with "Clear all filters"                  |
| year-only records (no trip)             | listed under "Unmapped (n)" on the timeline with the reason "no date" and a `SourceLink` each (AC-42)          |
| border files fail to load               | map without border layers; toggle disabled with "Border layers unavailable"                                   |

### 14.8 Phone layout

Under 1024 px: a bar above the map with a "Journeys (n)" button that opens the list as a
bottom sheet (`JourneyListSheet`, the year strip collapsed inside it) and the open trip's
place and date; the map (440 px), then the panel (header, stops, collapsible context)
stacked below. Picking a trip closes the sheet. The border toggle keeps its three buttons
with short labels under 768 px.

## 15. Cross-cutting: source identifiers and attribution (AC-36, AC-37)

Owner requirement, academic integrity. Every catalogued record is traceable to the
original record on the source database from wherever it appears, and every page says
where the data comes from.

**SourceLink** `{ song: Pick<Song, 'source' | 'music'>; size?: 'row' | 'header' }`: renders
the record's source identifier as visible text followed by an external-link icon, as one
`<a href={song.source.url} target="_blank" rel="noopener noreferrer">`. The text is
`source.referenceCode`; when that is null, `music.systemPosition`; when both are null,
`source.number` prefixed by the site's short name ("FMBC 5398"); never empty (the record
id is the last resort). The icon is `aria-hidden`; the link's `aria-label` is "Open
original record on {site name}" where the site name is the database's human name (UI-COPY
section 9: "Folk Music in Bartók's Compositions", "The Bartók System", "Béla Bartók, the
Ethnomusicologist"). The identifier text is mono `--fs-12` (`--fs-14` in the song header),
underlined like every link, colour `--accent`; the hit area is at least 24 x 24 px on fine
pointers and 44 px on touch. Inside a result row the `SourceLink` is a sibling of the
title link, not nested in it (the row is a `<li>` holding both), so both stay separately
focusable and the row's click target excludes the source link.

Where it appears (each is required):

| Place                                  | Component                                      | Form                                                            |
|----------------------------------------|------------------------------------------------|-----------------------------------------------------------------|
| Explorer results row                   | `SongRow` line 2, right of the year            | `SourceLink size="row"`                                          |
| County melodies table                  | `MelodiesTable` "Source" column                | `SourceLink size="row"`; the column is never hidden, also in phone cards |
| Song record header                     | `SongHeader` under the title                   | `SourceLink size="header"` followed by the database name as visible text |
| Song metadata rail                     | `RailSection id="source"` "Reference" row      | `SourceLink` plus the "Open record on {site}" row (both to `source.url`) |
| Related melodies rows                  | `SongRow`                                      | as the results row                                               |
| Journey stop list                      | `StopList` record disclosure and Unmapped list | `SourceLink size="row"` per record                              |
| Export JSON                            | `ExportButton`                                 | every record keeps `source.url`, `source.referenceCode`, `music.systemPosition` verbatim; the top-level `attribution` field carries the footer text and the three database URLs |
| Map hover card / point sheet           | aggregate, no record ids                       | "Show melodies" leads to rows that carry the link                |

Rules: the link is never an icon alone and never hidden behind hover; it is present in
the DOM at every viewport; `source.url` is used exactly as stored; if `source.url` were
missing (the schema requires it) the text renders without a link and the data gate reports
the record.

**Attribution footer** (`Footer`, AC-37): rendered on every route including `/journeys`,
NotFound and the catalogue error state, on desktop and phone, in the DOM before data
loads. It contains the attribution sentence to HUN-REN BTK Institute for Musicology,
Budapest, the three database links (UI-COPY section 12) with `rel="noopener noreferrer"`,
the map credits, and on `/journeys` the historical GIS credits (MAP-SPEC 11.6,
GEO-SOURCES.md). On the phone the footer sits below the list content, above the bottom
tabs' safe area, never overlapped by them.

## 16. Open decisions for the orchestrator

1. URL param names follow the QA assumptions: `perf`, `instr`, `from`, `to`, and comma
   lists for arrays (not repeated params). QA-PLAN and ACCEPTANCE-CRITERIA already test
   this form; the brief's "repeated params" would need both QA docs changed.
2. Place params carry the place id path (`county=ro/crisana/bihor`), not the display name
   used in the QA examples (`county=Bihor`); the E2E fixtures should use ids.
3. `county` and `performance` stay single-valued as in the brief's `Query`; AC-03
   ("selecting a second county adds it") and AC-07 (multiple performance chips) assume
   multi-select. One of the two documents must change.
4. `unmapped`, `trip`, `stop`, `date`, `borders` extend the specified `Query` shape, with
   the journey names taken from AC-39 and AC-40 (`trip`, `stop`, `borders=1910|1920|now|both`).
5. Default country is `ro` (AC-01) with a country switch; `country=all` removes it.
6. History policy follows AC-22 (replace for typing, push for other changes), not
   ARCHITECTURE.md's "replace for filters".
7. Fonts: Google Fonts (as briefed) requires `font-src https://fonts.gstatic.com` and
   `style-src https://fonts.googleapis.com` added to the CSP in DEPLOY.md; self-hosting
   via `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` avoids the CSP change
   and the third-party request and is the designer's recommendation.
8. A "no genre" checkbox for null-genre records, encoded as `genre=none`, is proposed but
   optional.
9. Map dot hit areas are 44 px on touch and 24 px on fine pointers; clustering guarantees
   spacing (MAP-SPEC).
10. The UI is English; Romanian and Hungarian appear as secondary labels, not as a locale
    switch (PLAN.md open decision 3).
11. Journey data shapes in 14.1 are assumptions until the data agent publishes schemas
    and `JOURNEY-SPEC.md`; the era cutoff (1918-01-01 per AC-40) and the 10-day split
    rule (PLAN.md open decision 5) are the data agent's to confirm.
12. `SourceLink` text order (referenceCode, then systemPosition, then site + number) is
    for the owner to confirm; Bartók System records have both, and the header shows both.
