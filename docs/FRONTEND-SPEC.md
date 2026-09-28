# Front-end specification

Vite + React 18 + TypeScript, static JSON in, no server. This document turns the
wireframe in `CONTEXT.md` into components, props, state and behaviour. Design tokens are
in `DESIGN-TOKENS.md` / `app-tokens/tokens.css`, the map in `MAP-SPEC.md`, strings in
`UI-COPY.md`. Nothing here is code yet; the build phase implements it.

Conventions used below: `Props` blocks are TypeScript-shaped; "reads" lists the derived
state a component consumes; "emits" lists the `Query` patches it produces.

## 0. Stack and libraries

| Concern        | Choice                                             | Notes                                           |
|----------------|----------------------------------------------------|-------------------------------------------------|
| Build          | Vite 5, React 18, TypeScript strict                | `app/` per repo layout                          |
| Routing        | `react-router-dom` 6 (`BrowserRouter`)             | `vercel.json` rewrite `/* -> /index.html`       |
| State          | React context + `useMemo` selectors, no store lib  | the whole state is `Query` + loaded data        |
| URL sync       | `useSearchParams` wrapped by `useQuery()`          | one place serialises/parses (section 3)         |
| Map            | Leaflet 1.9 + react-leaflet 4 + leaflet.markercluster | see `MAP-SPEC.md`                            |
| Search         | in-memory normalised substring match, phase 1       | MiniSearch is the upgrade if needed             |
| Collation      | `Intl.Collator`                                    | section 5                                       |
| Styling        | plain CSS modules + tokens.css                     | no CSS-in-JS                                    |
| Charts         | inline SVG (genre bars, timeline)                  | no chart library                                |
| Tests          | Vitest + Testing Library                           | selectors and sort keys get unit tests          |

## 1. Data the app reads

Loaded once at startup from `/data/*.json` (copied from repo `data/` into `app/public/data/`
at build; Vercel serves them gzipped). The shapes below are what the front end assumes.
`DATA-SCHEMA.md` is the source of truth; reconcile these interfaces against it in the build
phase and adjust selectors, not the other way round.

```ts
type GenreId = 'colinda' | 'doina' | 'bocet' | 'cantec' | 'joc' | 'nunta' | 'other';
type PerformanceId = 'vocal' | 'instrumental' | 'vocal-instrumental' | 'unknown';

interface Song {
  id: string;                     // stable, ASCII, e.g. "bn-01234", "br-A0204"
  source: 'bartok-nepzene' | 'bartok-system' | 'bartok-gyujtesek';
  sourceUrl: string;              // record page on the zti.hu site
  ref: {                          // "source number" for sorting
    raw: string;                  // as printed, e.g. "II/157b"
    volume?: string;              // "II"
    number?: number;              // 157
    suffix?: string;              // "b"
  };
  title: string;                  // text incipit or given title (display form)
  incipit?: string;               // first line of text if distinct from title
  genre: GenreId;
  style?: string;                 // facet id from facets.json (e.g. "old", "new", "mixed")
  performance: PerformanceId;
  instruments: string[];          // facet ids from facets.json
  year?: number;                  // collection year, absent when unknown
  date?: string;                  // as recorded, free text
  placeId: string;                // key into places.json (village level)
  performer?: { name?: string; age?: number; ethnicity?: string };
  collector?: string;
  notationImage?: string;         // URL
  audio?: string;                 // URL
  text?: string;                  // song text, may be multi-line
  textLang?: 'ro' | 'hu' | 'other';
  music?: { systemPosition?: string; cadences?: string; rhythm?: string; scale?: string; remarks?: string };
  raw: unknown;                   // untouched scraped record, shown in the Raw JSON tab
}

interface PlaceName { modern?: string; historical?: string; lang?: 'ro' | 'hu' }

interface Place {
  id: string;                     // ASCII slug, e.g. "ro-bh-beius"
  level: 'country' | 'region' | 'county' | 'village';
  parentId?: string;
  name: PlaceName;                // village: modern "Beius", historical "Belenyes"
  countryCode?: string;           // ISO 3166-1 alpha-2 of the modern country, e.g. "RO"
  lat?: number; lon?: number;     // absent when not geocoded
  bbox?: [number, number, number, number]; // counties only, [w, s, e, n]
}

interface Facets {
  genre: FacetValue[]; style: FacetValue[]; performance: FacetValue[]; instrument: FacetValue[];
  years: { min: number; max: number };
}
interface FacetValue { id: string; label: { en: string; ro?: string; hu?: string }; order: number }
```

The app builds these indexes once after load (all `Map`s, all in a `useMemo`):
`songById`, `placeById`, `childrenOf(placeId)`, `ancestorsOf(placeId)` (village -> county ->
region -> country), `songsByPlace`, and `searchKey(song)` (section 4).

## 2. Routes and screens

| Route                    | Screen              | Notes                                                     |
|--------------------------|---------------------|-----------------------------------------------------------|
| `/`                      | Explorer            | phone layout under 768 px is the Phone explorer            |
| `/county/:countyId`      | County drill-down   | `?tab=melodies|genre|performer|timeline|map` plus Query   |
| `/song/:songId`          | Song record         | `?tab=record|raw` plus Query (so back returns to the list) |
| `/about`                 | About / sources     | static text, attribution                                   |
| anything else            | NotFound            |                                                            |

The Query string (section 3) is preserved across all routes. Navigating Explorer ->
County -> Song never drops filters; the county page adds `county` to the Query if absent.

## 3. Shared state: `Query`

```ts
interface Query {
  q: string;                 // free text
  country?: string;          // place ids (level country / region / county / village)
  region?: string;
  county?: string;
  village?: string;
  genre: GenreId[];
  style: string[];
  performance?: PerformanceId;
  instrument: string[];
  yearFrom?: number;
  yearTo?: number;
  sort: 'title' | 'style' | 'location' | 'year' | 'source';
  dir: 'asc' | 'desc';
  page: number;              // 1-based
  unmapped?: boolean;        // extension: list only songs without coordinates (MAP-SPEC section 8)
}
const DEFAULT_QUERY: Query = { q: '', genre: [], style: [], instrument: [], sort: 'title', dir: 'asc', page: 1 };
const PAGE_SIZE = 50;        // fixed, not in the URL
```

Invariants (enforced by `setQuery`, not by callers):

- Place levels are consistent: setting `village` also sets its county, region and country;
  setting `county` clears `village` and sets region and country; and so on. Clearing a level
  clears every level below it.
- Any change other than `page` resets `page` to 1.
- Array facets are deduplicated and sorted by the facet's `order`.
- `yearFrom <= yearTo` when both set; if the user inverts them, they are swapped.
- Unknown ids (a genre not in facets, a place not in places) are dropped on parse.

### 3.1 URL serialisation

Exact parameter names and encoding, in canonical order:

| Field        | Param        | Encoding                                                    |
|--------------|--------------|-------------------------------------------------------------|
| q            | `q`          | trimmed; omitted when empty; `URLSearchParams` percent-encoding, space as `+` |
| country      | `country`    | place id                                                     |
| region       | `region`     | place id                                                     |
| county       | `county`     | place id                                                     |
| village      | `village`    | place id                                                     |
| genre[]      | `genre`      | repeated: `genre=colinda&genre=joc`; one value per param     |
| style[]      | `style`      | repeated                                                     |
| performance  | `performance`| single id                                                    |
| instrument[] | `instrument` | repeated                                                     |
| yearFrom     | `from`       | integer, four digits                                         |
| yearTo       | `to`         | integer                                                      |
| sort         | `sort`       | omitted when `title`                                         |
| dir          | `dir`        | omitted when `asc`                                           |
| page         | `page`       | omitted when 1                                               |
| unmapped     | `unmapped`   | `unmapped=1`; omitted when false                             |

Rules:

- Defaults are omitted so the empty query is `/` with no `?`.
- Parameters are written in the table order; array values in facet order. Two equal
  queries therefore always produce the same string (the status bar shows it and users
  share it).
- Parsing is tolerant: unknown params are ignored and dropped on the next write; `%20`
  and `+` both read as space; repeated single-value params take the last occurrence;
  non-integer `from`/`to`/`page` are ignored; `page` above the last page clamps to the
  last page after filtering.
- Place ids and facet ids are ASCII slugs, so they never need encoding; `q` is the only
  value that may contain non-ASCII and it is encoded by `URLSearchParams`.
- Route params (`:countyId`, `:songId`) are path segments; the Query stays in the search
  string. On `/county/:countyId` the path wins if it disagrees with `?county=`.
- History: filter changes use `replace` while the user is typing in the search box
  (debounced 200 ms) and `push` for every other change, so Back steps through filter
  states but not through keystrokes.

### 3.2 Hooks

- `useData(): { status: 'loading' | 'ready' | 'error'; error?: Error; songs; places; facets; index }`
- `useQuery(): [query: Query, setQuery: (patch: Partial<Query>) => void, reset: () => void]`
- `useDerived(): Derived` (below), memoised on `[query, data]`.

## 4. Derived selectors

All pure functions in `app/src/state/selectors.ts`, unit-tested. `Derived` is built in
one `useMemo` chain so that a change in `page` does not recompute filtering.

```ts
interface Derived {
  predicates: Record<FacetKey, (s: Song) => boolean>;  // one per facet incl. 'place', 'q', 'year', 'unmapped'
  filteredSongs: Song[];            // all predicates AND-ed
  sortedSongs: Song[];              // filteredSongs ordered by sort/dir
  pagedSongs: Song[];               // slice for query.page
  pageCount: number;
  facetCounts: { genre: Counts; style: Counts; performance: Counts; instrument: Counts };
  yearHistogram: { from: number; to: number; count: number }[];   // 5-year bins over "all but year"
  placeTree: PlaceNode[];           // with counts
  mapPoints: MapPoint[];            // see MAP-SPEC
  unmappedCount: number;
  activeChips: Chip[];              // for ActiveFilterChips
}
type Counts = Map<string, number>;
```

- `predicates.q`: `searchKey(song).includes(normalize(query.q))` where `searchKey` is the
  normalised concatenation of title, incipit, performer name, collector, ref.raw, and the
  modern and historical names of the village and county. Multiple words in `q` must all
  match (AND over whitespace-split terms).
- `normalize(s)`: NFD, remove combining marks (U+0300-036F), then map the remaining
  Romanian and Hungarian specials that NFD does not split (`ß`, `đ`, `ł` are not needed;
  `ș ş ț ţ` all become `s`/`t` via NFD, `ő ű` become `o`/`u` via NFD), lowercase, collapse
  whitespace. This is also the key for the title sort.
- `predicates.place`: song's ancestor chain contains the deepest selected place id.
- `predicates.genre` etc: empty array means "no constraint"; otherwise membership (OR
  within the facet). `instrument` matches if any of the song's instruments is selected.
- `predicates.year`: `year` between `yearFrom` and `yearTo` inclusive; songs without a
  year are excluded only when at least one bound is set.
- `predicates.unmapped`: place has no lat/lon (only when `query.unmapped`).
- **facetCounts**: for facet F, count values over the songs that satisfy every predicate
  except F ("what would I get if I added this value"). Values with count 0 are still
  listed, disabled, so the rail does not jump. Performance is single-select but counted the
  same way.
- **placeTree**: full tree from `places.json`; each node's `count` is the number of songs
  under it that satisfy every predicate except `place`. Nodes with count 0 are collapsed
  and greyed, not removed, unless the whole country has 0 (then it is hidden). Counts of
  unmapped places are included in the tree.
- **mapPoints**: from `filteredSongs`, grouped by county (when no county is selected and
  zoom <= 7) or by village; each point carries `placeId`, `lat`, `lon`, `count`,
  `genreCounts`, `yearMin`, `yearMax`, `audioCount`, `notationCount`, `selected`.
  Songs whose place has no coordinates are counted in `unmappedCount` and excluded here.

## 5. Sort keys

`sortedSongs = [...filteredSongs].sort(comparator(sort, dir))`. `Array.prototype.sort` is
stable, but the comparator still ends with `id` so results are deterministic across
engines. `dir = 'desc'` reverses the comparison of known values only; records with an
unknown key stay last in both directions.

Collators (created once):

```ts
const roBase = new Intl.Collator('ro', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
const roFull = new Intl.Collator('ro', { sensitivity: 'variant', numeric: true });
```

| sort       | Key, in order of comparison                                                                 |
|------------|---------------------------------------------------------------------------------------------|
| `title`    | 1. `roBase.compare(normalize(a.title), normalize(b.title))` (diacritics-insensitive: the strings are pre-folded because Romanian ICU tailoring treats a/ă/â as different primary letters, so `sensitivity: 'base'` alone would not fold them; `numeric` makes "Cantec 2" sort before "Cantec 10"). 2. `roFull.compare(a.title, b.title)` to keep "Sara" and "Șara" in a fixed relative order. 3. `id`. |
| `style`    | 1. facet `order` of `style` from facets.json (unknown/absent last). 2. title key. |
| `location` | 1. country modern name (`roBase`), 2. region, 3. county, 4. village, 5. title key. A missing level (e.g. a song known only to county level) sorts after all present values at that level. Names compare on `name.modern ?? name.historical`. |
| `year`     | 1. `year` numeric; unknown last regardless of dir. 2. title key. |
| `source`   | 1. `ref.volume` via `roBase` (numeric: "II" and "10" are compared as strings, Roman numerals are a display form: the scraper provides `volume` already normalised to a sortable string, e.g. zero-padded or Arabic; if it does not, the front end maps I..X to 1..10). 2. `ref.number` numeric. 3. `ref.suffix` via `roBase`. 4. `id`. Records with no `ref.number` last. |

Table column sort on the County page reuses the same comparator with two extras that
only exist there: `genre` (facet order) and `village` (village name via `roBase`, then
title).

## 6. Shared components (app shell)

```
<App>
  <DataProvider>                 loads /data/*.json, exposes useData()
    <QueryProvider>              URL <-> Query, exposes useQuery()/useDerived()
      <SkipLink/>                "Skip to results", first in DOM, --z-skip
      <TopBar/>
      <Routes/>                  ExplorerPage | CountyPage | SongPage | AboutPage | NotFound
      <StatusBar/>               desktop only
      <Footer/>
```

**TopBar** `{ compact?: boolean }`. Contains the masthead ("Bartok / Romania", `--fs-40`
on Explorer, `--fs-24` elsewhere), `SearchInput`, a "Colour by genre" toggle (Explorer
only; local state, remembered in `localStorage` key `bartok.colourByGenre`), theme toggle
(auto / light / dark, `localStorage` key `bartok.theme`, sets `data-theme` on `<html>`),
and a link to About. Height `--topbar-h`, sticky, `--z-sticky`.

**SearchInput** `{ value: string; onChange(v: string); placeholder: string; resultCount?: number }`.
`<input type="search">` with `aria-label`, clear button (44 px), debounced 200 ms to
`setQuery({ q })`. Enter moves focus to the results list. Announces `"{n} melodies"` via
`aria-live="polite"` after each change.

**StatusBar** reads `query`, `filteredSongs.length`, `unmappedCount`. Shows the canonical
query string in mono (`--fs-11`), a "Copy link" button (copies `location.href`, confirms
with a toast "Link copied"), the result count, and "N not mapped" (MAP-SPEC section 8).

**Footer**: attribution text from `UI-COPY.md` section 12, links to the three source sites.

**ActiveFilterChips** `{ chips: Chip[]; onRemove(chip); onClearAll() }` where
`Chip = { key: FacetKey; value: string; label: string }`. Each chip is a `<button>` with
`aria-label="Remove filter: {label}"`, 44 px tall on touch, 28 px on desktop with a 44 px
hit area via padding. "Clear all" is last. Chips come from `derived.activeChips` in Query
order: place (deepest only, labelled "Bihor (Bihar)"), genre..., style..., performance,
instrument..., year ("1909-1917", "from 1909", "to 1917"), q ("\"text\""), unmapped.

**GenreSwatch** `{ genre: GenreId; size?: 8 | 12 }`: coloured square with `aria-hidden`
(the genre name is always adjacent as text).

**GenreBar** `{ counts: Partial<Record<GenreId, number>>; total: number; height?: 8 | 16 | 24; showLegend?: boolean }`:
stacked horizontal bar in inline SVG, segments in fixed genre order (bocet, colinda,
doina, joc, nunta, cantec, other), `role="img"` with `aria-label="Genres: 12 colinda, 5 joc, ..."`,
tooltip per segment on hover/focus. Labels inside segments only at height 24 and width
>= 32 px, in `--genre-label-ink`.

**Pagination** `{ page; pageCount; onPage(n) }`: Prev / "page n of m" / Next, plus a page
number input. Hidden when `pageCount <= 1`. `aria-label="Results pages"` nav.

**PlaceLabel** `{ name: PlaceName; level?: Place['level'] }`: renders `Beius (Belenyes)`
per MAP-SPEC section 7; the historical part in `--muted` mono, wrapped in
`<span lang="hu">` when `lang` says so.

**EmptyState** `{ title; body?; actions?: ReactNode }`, **ErrorState** `{ error; onRetry }`,
**Skeleton** `{ rows: number }`: see section 11.

## 7. Explorer

Layout at >= 1024 px: three columns, `FilterRail` (`--rail-w`) | `MapPanel` (flex 1) |
`ResultsPanel` (`--results-w`), each scrolling independently under the sticky TopBar,
StatusBar fixed at the bottom. 768-1023 px: rail collapses into a "Filters" button that
opens the same `FilterSheet` as the phone; map and results stack vertically. Under 768 px:
section 10.

```
<ExplorerPage>
  <FilterRail>
    <PlaceTree/>
    <FacetGroup id="genre"><CheckboxFacet/></FacetGroup>
    <FacetGroup id="style"><ChipFacet/></FacetGroup>
    <FacetGroup id="performance"><ChipFacet single/></FacetGroup>
    <FacetGroup id="instrument"><ChipFacet/></FacetGroup>
    <FacetGroup id="year"><YearRange/></FacetGroup>
    <ClearAllButton/>
  </FilterRail>
  <MapPanel>                       see MAP-SPEC
    <MapView/> <MapLegend/> <MapHoverCard/> <MapAccessibleList/> <NotMappedNotice/>
  </MapPanel>
  <ResultsPanel>
    <ResultsHeader> <ResultCount/> <SortSelect/> <ActiveFilterChips/> </ResultsHeader>
    <SongList> <SongRow/>* </SongList>
    <Pagination/>
  </ResultsPanel>
```

**FilterRail** `{ children }`: `<aside aria-label="Filters">`. Groups are `<details>`-like
disclosures, all open by default on desktop; open state is local.

**FacetGroup** `{ id: FacetKey; title: string; hint?: string; activeCount: number; children }`:
heading in uppercase mono, active count badge, "clear" link when activeCount > 0.

**PlaceTree** `{ tree: PlaceNode[]; selected: { country?, region?, county?, village? }; onSelect(level, id | undefined) }`.
Reads `derived.placeTree`. Emits `setQuery({ [level]: id })` (invariants fill in ancestors).
Rendering: `role="tree"`, rows `role="treeitem"` with `aria-level`, `aria-expanded`,
`aria-selected`; the row shows `PlaceLabel` and a mono count right-aligned; village rows
with no coordinates get a small "not mapped" marker (text, not colour). Keyboard: Up/Down
move, Right expands or moves into children, Left collapses or moves to parent, Home/End,
Enter or Space selects, type-ahead by first letters. Clicking the selected row again clears
that level. Countries expand by default when only one country has counts; the selected
branch is always expanded. Rows are 32 px on desktop, 44 px on touch. Max depth 4.

**CheckboxFacet** `{ facet: 'genre'; values: FacetValue[]; counts: Counts; selected: string[]; onChange(next: string[]) }`.
Native `<input type="checkbox">` per value, label = `GenreSwatch` + label in the form
"colindă / winter carol", count in mono. Values with count 0 are disabled unless selected.
Emits `setQuery({ genre: next })`.

**ChipFacet** `{ facet: 'style' | 'performance' | 'instrument'; values; counts; selected: string[]; single?: boolean; onChange(next) }`.
Toggle buttons `aria-pressed`, wrapped in a `role="group"` with the facet title as
`aria-label`. `single` (performance) behaves like radio: pressing the active chip clears
it. Instruments with count 0 are hidden (the list can be long) but selected ones always
show. If more than 12 instruments have counts, show 12 and a "Show all (n)" toggle.

**YearRange** `{ min: number; max: number; from?: number; to?: number; histogram: Bin[]; onChange({ from?, to? }) }`.
Two `<input type="number">` (from / to, `inputmode="numeric"`, 44 px tall) above a 5-year
histogram (inline SVG, `role="img"` with a summary label, bins outside the range dimmed)
and a native dual-thumb range built from two `<input type="range">` overlaid (native
inputs keep keyboard and screen-reader behaviour). Commits on blur/Enter for the number
inputs and on `change` for the sliders. Bounds come from `facets.years`.

**ClearAllButton**: emits `reset()` (keeps `sort`/`dir`).

**ResultsHeader**: `ResultCount` ("1,204 melodies", `aria-live="polite"`), `SortSelect`,
`ActiveFilterChips`. Sticky inside ResultsPanel (`--z-sticky`).

**SortSelect** `{ sort; dir; onChange({ sort, dir }) }`: native `<select>` with the five
sort keys (labels in UI-COPY section 6) and a direction toggle button (`aria-pressed`,
`aria-label="Descending"`).

**SongList** `{ songs: Song[]; selectedId?: string }`: `<ol>` with `aria-label="Results"`,
rows are `SongRow`. Keyboard: normal Tab through row links; Up/Down within the list move
between rows (roving tabindex) so a long list is fast to scan. Hovering a row highlights
the matching village dot on the map (`MapPanel` receives `highlightPlaceId`); focusing a
row does the same.

**SongRow** `{ song: Song; place: Place; county?: Place; showPlace?: boolean }`: link to
`/song/:id?<query>`. Layout: line 1 title (`--fs-14`, `--fw-medium`) with genre swatch;
line 2 `--fs-12 --muted`: village (historical) / county, year or "n.d.", `ref.raw` in mono;
right edge: icons for audio and notation availability with visually hidden text
("has audio"). Row min height 56 px; touch target is the whole row.

**Interactions on the Explorer**

| Action                                  | Effect                                                              |
|-----------------------------------------|---------------------------------------------------------------------|
| type in search                          | `q`, debounced, list + map + counts update                          |
| select tree node                        | place level set, map fits to that place (county: bbox, village: zoom 11) |
| click county bubble / village dot       | same as tree select (MAP-SPEC section 5)                             |
| toggle a facet value                    | facet updated, page 1                                                |
| change year                             | year bounds, page 1                                                  |
| change sort                             | `sort`/`dir`, page unchanged                                         |
| click a chip                            | that value removed                                                   |
| "Open county page" (hover card, tree row context, results header when a county is selected) | navigates to `/county/:id?<query>` |
| click row                               | `/song/:id?<query>`                                                  |
| Copy link                               | clipboard, toast                                                     |

## 8. County drill-down

Route `/county/:countyId`. Layout: `Breadcrumb` (Romania > Transilvania > Bihor), then
`CountyHeader`, then `CountyTabs`. The filter rail is not shown; the active non-place
filters from the Query apply and are listed as `ActiveFilterChips` under the header so the
user knows the counts are filtered. Under 768 px the tabs become a horizontally scrollable
tab strip and tables become card lists.

**Breadcrumb** `{ items: { label: string; to: string }[] }`: `<nav aria-label="Breadcrumb">`,
each ancestor links back to the Explorer with that place set.

**CountyHeader** `{ county: Place; stats: CountyStats }` where `CountyStats = { melodies, villages, withAudio, withNotation, yearMin?, yearMax?, genreCounts }`.
Title `PlaceLabel` at `--fs-24` plus the region / country line, then a stats row of four
mono figures and a 16 px `GenreBar`. Contains "View in explorer" (back to `/` with the
county selected) and "Copy link".

**CountyTabs** `{ tab: TabId; onChange(tab) }` with `TabId = 'melodies' | 'genre' | 'performer' | 'timeline' | 'map'`.
`role="tablist"`, tabs `role="tab"` with `aria-selected`, Left/Right arrows move, panel
`role="tabpanel"`. Tab is stored in `?tab=` (default `melodies`, omitted).

Above the tabs on every tab: **VillagesTable** `{ rows: VillageRow[]; sort: { key, dir }; onSort; selectedVillage?; onSelect(villageId) }`
where `VillageRow = { place: Place; melodies: number; genreCounts; yearMin?; yearMax?; mapped: boolean }`.
Columns: Village (`PlaceLabel`, "not mapped" marker), Melodies (mono, right), Genres
(`GenreBar` 8 px, the bar's accessible label carries the counts), Years ("1909-1912" or
"n.d."). Header cells are buttons with `aria-sort`; sorting is local state (not in the
Query). Clicking a row sets `village` in the Query, which narrows every tab; the selected
row gets the accent left border. The table is `<table>` with `<caption>` ("Villages in
Bihor, 34"), sticky header, zebra rows using `--surface-2`.

Tab panels:

- **MelodiesTable** `{ songs: Song[]; sort; onSort }`: columns Title (link), Genre,
  Performance, Village, Year, Source (`ref.raw` mono), Audio/Notation icons. Sorting via
  the section 5 comparators plus `genre` and `village`; column sort writes `sort`/`dir`
  into the Query for title/style/location/year/source so the Explorer list agrees when
  the user goes back. 50 rows per page with `Pagination`.
- **ByGenrePanel** `{ genreCounts; total; onPick(genre) }`: one row per genre: swatch,
  name "colindă / winter carol", horizontal bar scaled to the max (inline SVG), count and
  percentage in mono. Clicking a row toggles that genre in the Query.
- **ByPerformerPanel** `{ rows: PerformerRow[] }` with `PerformerRow = { name, age?, ethnicity?, village: Place, count, years }`.
  Table sortable by name / count / village. Performer names as recorded; rows without a
  name are grouped as "Unnamed performer (n)". Clicking a row sets `q` to the performer's
  name (there is no performer facet).
- **TimelinePanel** `{ perYear: { year: number; count: number; genreCounts }[]; unknownYear: number }`:
  inline SVG column chart, one column per year from the county's min to max, stacked by
  genre when "colour by genre" is on, otherwise `--ink-2`. Each column is focusable
  (`tabindex=0`, `role="img"`, label "1912: 38 melodies") and clicking sets
  `from = to = year`. A visually hidden `<table>` mirrors the data. "N melodies without a
  year" shown under the chart as text.
- **LocalMapPanel** `{ county: Place; points: MapPoint[]; selectedVillage? }`: `MapView`
  bounded to the county bbox, village dots only, no clustering, same hover card and click
  behaviour; height 420 px, 320 px on phone.

## 9. Song record

Route `/song/:songId`. Layout at >= 1024 px: main column (max 760 px) + right rail
(320 px). Below: single column, rail sections after the text.

```
<SongPage>
  <Breadcrumb/>                         Romania > Bihor > Beius (Belenyes) > title
  <SongNav/>                            Prev / Next within sortedSongs, "Back to results"
  <SongTabs tab="record|raw"/>
  tab record:
    <SongHeader/>
    <NotationFigure/>
    <AudioPlayer/>
    <SongText/>
    <RelatedMelodies/>
    <SongRail>
      <RailSection id="where"/> <RailSection id="who-when"/> <RailSection id="music"/> <RailSection id="source"/>
    </SongRail>
  tab raw:
    <RawJson/>
```

**SongNav** reads `derived.sortedSongs` to find the current index; if the song is not in
the current result set (deep link), Prev/Next are hidden and "Back to results" goes to `/`
with the Query. Prev/Next keep the Query string. Keyboard: `[` and `]` when focus is not
in an input.

**SongHeader** `{ song }`: title `--fs-36` (falls back to `incipit`, then to `ref.raw`
with a "Untitled" label), incipit under it in `--fs-16` italic when distinct, then chips
(not buttons; `role="list"`): genre with swatch, performance, style, instruments. Each
chip links to the Explorer with that single facet set (so "colinda" chip -> `/?genre=colinda`).

**NotationFigure** `{ src?: string; alt: string; caption?: string }`: `<figure>` with
`<img loading="lazy">`, `alt` = "Notation of {title}, source {ref.raw}", a "View full
size" button opening a `Lightbox` (`role="dialog"`, `aria-modal`, focus trapped, Esc
closes, scrim `--scrim`, `--z-sheet`). Missing image: dashed 3:2 placeholder with the text
"No notation image for this record".

**AudioPlayer** `{ src?: string; title: string }`: native `<audio controls preload="none">`
labelled by the title, with a "Download" link and the source note "Recording: HUN-REN BTK
ZTI". Missing: one line "No recording available" (no player). `onError` swaps in "The
recording could not be loaded" with a retry link.

**SongText** `{ text?: string; lang?: string }`: `<section>` with heading "Text",
`white-space: pre-wrap`, `lang` attribute set, `--fs-16` with `max-width: 60ch`. Missing:
"No text recorded".

**RelatedMelodies** `{ items: Song[]; reason: 'same-village' | 'same-performer' | 'adjacent-source' }`:
up to 6 `SongRow`s in this priority: same performer (name match), then same village, then
adjacent `ref.number` in the same volume. Heading names the reason ("Also from Beius").

**SongRail / RailSection** `{ id; title; rows: { label: string; value: ReactNode; mono?: boolean }[] }`:
definition lists (`<dl>`), uppercase mono headings. Contents:

| Section   | Rows (omit a row when the value is absent)                                                                                     |
|-----------|--------------------------------------------------------------------------------------------------------------------------------|
| Where     | Village (`PlaceLabel`, link to Explorer filtered), County (`PlaceLabel`), Region, Country, Coordinates (mono, "not mapped" if none), static mini map: an 240x160 SVG from the fallback county outlines with a dot (MAP-SPEC section 9), or omitted when unmapped |
| Who / when| Performer, Age, Ethnicity, Collector, Date (as recorded), Year                                                                   |
| Music     | Genre, Performance, Style, Instruments, System position, Cadences, Rhythm, Scale, Remarks (all mono except Remarks)             |
| Source    | Reference (`ref.raw`), Database (human name of `song.source`), "Open record on zti.hu" external link (`rel="noopener"`), id (mono) |

**RawJson** `{ value: unknown }`: `<pre><code>` of `JSON.stringify(value, null, 2)` with
sorted keys, "Copy JSON" button, `tabindex=0` on the `<pre>` so keyboard users can scroll
it. Large payloads (> 200 KB) render the first 200 KB with "Show all".

## 10. Phone explorer (< 768 px)

Same route `/`. Single column: `PhoneHeader` (masthead compact + `SearchInput` + "Filters (n)"
button), then the active view chosen by `BottomTabs`.

**BottomTabs** `{ tab: 'map' | 'list' | 'filters'; counts: { results: number; filters: number } }`:
fixed bottom, `--bottomtabs-h`, three 44 px+ buttons with icon and label, `role="tablist"`.
`map` shows `MapMini` (full height minus header/tabs) with a bottom "N melodies, view list"
bar; `list` shows `SongList` with `ResultsHeader` (sort + chips) and `Pagination`; `filters`
opens `FilterSheet` and returns to the previous tab on close. The tab is local state,
default `list` (a list loads faster and works without tiles); deep links with a place set
default to `map`.

**MapMini**: `MapView` with the same behaviour, cluster radius 56 px, hover card replaced
by a bottom sheet (`MapPointSheet`) that opens on tap and holds the same content plus
"Filter to this place" and "Open county page" buttons.

**FilterSheet** `{ open; onClose }`: `role="dialog"` `aria-modal="true"`, slides from the
bottom to 92% height, scrim, focus trapped, Esc and the "Close" button close it, body
scroll locked. Contains the same `FilterRail` children; the footer has "Clear all" and a
primary "Show N melodies" (N from `filteredSongs.length`, updates live). Facet changes are
applied immediately to the Query (no draft state), so the count is always true.

Touch specifics: all rows 44 px min, inputs 16 px font, the year sliders get 44 px thumbs,
the place tree indents 16 px per level with 44 px rows.

## 11. States

| State                    | Where                       | Behaviour                                                                                                           |
|--------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------|
| Loading data             | whole app                   | TopBar renders; rail, map and list show `Skeleton` (8 rows), map area shows ground colour and "Loading the collection..."; `aria-busy="true"` on `<main>`; no layout shift when data lands (fixed column widths) |
| Data error               | whole app                   | `ErrorState` in `<main>`: "The collection could not be loaded." + technical detail in mono + "Retry" (refetches). Nothing else renders. |
| No results               | ResultsPanel, MapPanel      | `EmptyState`: "No melodies match these filters." Actions: "Remove last filter" (pops the most recently added chip) and "Clear all". Map keeps its position but shows no points; hover card hidden; facet counts remain (they are computed excluding each facet, so they show the way out). |
| No results for `q`       | same                        | Title becomes "No melodies match \"{q}\"" with hint "Search matches titles, incipits, performers, collectors, reference codes and place names." |
| Page out of range        | ResultsPanel                | clamp, no message                                                                                                    |
| Song not found           | SongPage                    | `EmptyState` "No record with id {id}" + "Back to explorer"                                                           |
| County not found         | CountyPage                  | same pattern                                                                                                         |
| Not mapped               | MapPanel, StatusBar         | MAP-SPEC section 8                                                                                                   |
| Tiles unavailable        | MapPanel                    | MAP-SPEC section 9 (SVG fallback)                                                                                    |
| Image / audio missing    | SongPage                    | section 9 placeholders                                                                                                |
| Image / audio failed     | SongPage                    | inline error with retry, never a broken-image icon                                                                    |
| Clipboard denied         | StatusBar                   | select the query text instead and show "Press Ctrl+C to copy"                                                        |
| Offline                  | app                         | if data is cached by the browser the app works; a toast "You are offline; map tiles may not load" once per session    |

Loading of the map tiles is independent of data loading; the map container shows the
ground colour until the first tile paints.

## 12. Keyboard and accessibility

- Landmarks: `<header>` (TopBar), `<nav>` (breadcrumb, pagination, bottom tabs),
  `<aside aria-label="Filters">`, `<main>` containing the map region
  (`<section aria-label="Map">`) and results (`<section aria-label="Results">`),
  `<footer>`. The status bar is `role="status"`.
- Focus order on the Explorer: skip link -> masthead link -> search -> colour-by-genre
  toggle -> theme -> About -> filter rail top to bottom (tree, genre, style, performance,
  instrument, year, clear) -> map (container, zoom in, zoom out, layer toggle, then the
  accessible point list) -> results (count, sort, direction, chips, rows, pagination) ->
  status bar (copy link) -> footer links. The skip link targets the results section.
- Focus is never lost on re-render: rows and chips are keyed by stable ids; removing a
  chip moves focus to the next chip or to "Clear all"; closing a sheet or lightbox returns
  focus to its opener.
- Map: the Leaflet container has `tabindex=0`, `role="application"`,
  `aria-label="Map of melodies; use the list after the map for keyboard access"` and
  `aria-roledescription="map"`; arrow keys pan and +/- zoom (Leaflet default). Dots are
  real `<button>` elements inside `divIcon` markers with `aria-label="Beius (Belenyes),
  Bihor: 24 melodies"`, `aria-pressed` for selected, and they are reachable with Tab in
  map order (north to south, then west to east). Because keyboard users cannot easily
  discover dots, `MapAccessibleList` (a `<ul>` after the map, visually collapsed behind a
  "List map points (n)" disclosure) lists every visible point as a button with the same
  label and action. Clusters are buttons labelled "Cluster of n places, press to zoom".
- Hover cards are also shown on focus, positioned relative to the marker, `role="tooltip"`,
  linked with `aria-describedby`, dismissed on Esc.
- Targets: every interactive element has a 44 x 44 px minimum hit area on touch devices
  (`pointer: coarse`) and 24 x 24 px on fine pointers, including map dots (their hit area
  is padded beyond the visible circle) and table header sort buttons. Result rows are
  full-width links.
- Contrast: text >= 4.5:1, UI components and dots >= 3:1, as documented in
  `DESIGN-TOKENS.md`. Colour is never the only cue: genre also appears as text, selected
  rows also get a border, disabled facets also get "(0)".
- `aria-live="polite"` regions: result count, "Link copied", filter-sheet count. Never
  more than one announcement per change (the count region is the one that speaks).
- Reduced motion honoured (tokens); no autoplay audio; no parallax.
- Language: `<html lang="en">`; Romanian and Hungarian names and song texts get `lang`
  attributes so screen readers switch voices.
- Zoom: layout works at 200% browser zoom (rail collapses to the sheet at the effective
  width) and at 320 px wide without horizontal scroll.
- Automated checks in QA: axe-core in Vitest for each screen with fixture data, and a
  keyboard walkthrough script in `QA-PLAN.md`.

## 13. Performance notes

- `songs.json` for > 13,000 records is expected around 4-8 MB raw; Vercel gzips to
  roughly a quarter. Show the skeleton, do not block on fonts.
- Filtering 13k records with plain predicates is a few milliseconds; memoise `searchKey`
  and `ancestorsOf` at load so the `q` and place predicates stay O(1) per song.
- Result list renders 50 rows per page; no virtualisation needed. The County
  `MelodiesTable` also pages.
- Map points are recomputed only when `filteredSongs` changes, not on pan.

## 14. Open decisions for the orchestrator

1. URL params for the year bounds are `from` / `to` (short), not `yearFrom` / `yearTo`.
2. `unmapped` is an extension of the specified `Query` shape, used for the "not mapped"
   list view.
3. The UI is English; Romanian and Hungarian appear as secondary labels on genres,
   facets and place names, not as a full locale switch.
4. Default sort is `title` ascending; page size 50.
5. Map dot hit areas are 44 px on touch and 24 px on fine pointers (a true 44 px area on
   every 4 px dot would overlap neighbours); clustering guarantees spacing.
6. Data interfaces in section 1 are assumptions until `DATA-SCHEMA.md` exists.
