# Data schema

Canonical JSON produced by `scraper/` for the viewer. Machine-readable definitions (JSON Schema
draft 2020-12) live in `data/schema/`:

- `song.schema.json` - one melody (`data/songs.json` is an array of these)
- `place.schema.json` - one node of the place hierarchy (`data/places.json` is an array)
- `facets.schema.json` - value -> count maps per facet (`data/facets.json`)

`data/songs.sample.json` holds three records (one per site) that validate against the song schema.
Everything is written with sorted keys and 2-space indentation so diffs are stable.

## Principles

- **Never invent.** A field the site does not print is `null` (arrays are `[]`). Derived values are
  limited to controlled-vocabulary mappings and gazetteer look-ups, and `location.resolution` says
  how far derivation went.
- **Attribution.** Every record keeps `source.url` (the page that was fetched, verbatim),
  `source.siteId` (the identifier the site itself displays) and `source.siteName`. When the same
  underlying record exists on two sites, the other link is kept in `source.alternates[]`.
- **Historical and modern names side by side.** `location.villageHistorical` / `countyHistorical`
  are what the site prints (pre-1920 Hungarian names); `village` / `county` / `country` / `region`
  are present-day, derived from the site's own "now:" data where it exists, else from
  `data/gazetteer.json`.

## Song record

| field | type | notes |
| --- | --- | --- |
| `id` | string | `<site>-<siteRecordId>`: `fmbc-BB068-L132-05`, `bsys-15-3417`, `gyuj-56-1234`. Stable across builds; bsys/gyuj pairs keep the bsys id. |
| `source.site` | `fmbc` \| `bsys` \| `gyuj` | fmbc = bartok-nepzene.zti.hu, bsys = systems.zti.hu/br, gyuj = bartok-gyujtesek.zti.hu |
| `source.siteName` | string | human-readable, includes "HUN-REN BTK ZTI" |
| `source.siteId` | string | fmbc: Lampert number `L 132`; bsys: BR number `A 1101a`; gyuj: inventory number `BR_12388` |
| `source.url` | uri | record page as fetched |
| `source.referenceCode` | string? | fmbc: Lampert number; bsys/gyuj: BR number (Bartok System position) |
| `source.volume` | string? | bsys/gyuj "Publication" (fmbc: none) |
| `source.number` | string? | fmbc: phonograph cylinder (`MH_0863b`); bsys: inventory number; gyuj: URL record number |
| `source.siteRecordId` | string? | raw id from the URL |
| `source.fetchedAt` | date-time? | from the cache sidecar; null for listing-only rows |
| `source.alternates[]` | {site, siteName, siteId, url} | the same record on the other site (bsys <-> gyuj) |
| `title` | string? | fmbc: movement title; bsys/gyuj: text incipit or designation |
| `incipit` | string? | bsys/gyuj: same as title (kept separately for sorting) |
| `genre` | enum? | `colinda, doina, bocet, cantec, joc, nunta, other` or null. **No site prints a genre label**, so it is null throughout the current data (see below). |
| `genreRaw` | string? | the site's label, verbatim |
| `style` | string? | `old style` (Bartok System class A), `new style` (B), `mixed style` (C), `instrumental`, `not classified`; null for fmbc |
| `styleRaw` | string? | category path, e.g. `Class A: old style > I. parlando-rubato or fixed rhythm > number of syllables: 8` |
| `performance` | enum | `vocal, instrumental, mixed, unknown` from fmbc "Performance:" (voice / violin / bagpipe ...) or the bsys Appendix "instrumental" category |
| `instrument[]` | string[] | canonical names (`violin`, `fluier`, `bagpipe`, `fujara`, ...) found in performance text |
| `performer` | {name, age, sex, ethnicity} | "Dósa Lidi (18)" -> name/age; "young man", "girls" -> sex only; `ethnicity` only on fmbc |
| `collector` | string? | verbatim ("Bartók Béla", "Béla Bartók", "Vikár Béla" ...) |
| `collected` | {year, month, day, raw} | parsed from `1904.11.`, `February 1910`, `1914. április 3-10.`, `1912. VI. 12` ...; ranges keep the first date; year range 1800-1960 because the Bartok System holds 19th-century collections |
| `location` | object | see below |
| `media.notation[]` | {url, type, caption} | fmbc: melody image (`media/images/melody/*.jpg`), facsimiles (caption `facsimile: <manuscript>`), composition score (`score (composition)`); bsys/gyuj: `media/images/BR/BR_nnnnn_01.jpg` |
| `media.audio[]` | {url, type, caption} | fmbc: `source recording MH_...` and `composition recording: ...`; bsys/gyuj: player when the record has a sound recording |
| `music` | {systemPosition, cadences, rhythm, mode, ambitus, syllables, form} | bsys/gyuj: BR number, "Cadence: (5) 4", rhythm/syllables/form from the category tree; fmbc: all null |
| `text` | string? | fmbc "Words" tab, original language, lines joined with `\n`; translation in `rawFields["Words (translation)"]` |
| `remarks` | string? | fmbc "Remarks:" plus the site's editorial remark line |
| `related[]` | {id, url, label, relation} | `variant` (same BR group via `search?sys=`), `link` (previous/next/comparison links), `cross-site` |
| `composition[]` | {work, movement, catalogue, raw} | fmbc only: work title, movement, `BB nn` |
| `journey` | {collectionId, label, dateRaw, place, url}? | the bartok-gyujtesek collecting trip ("February, 1910. Upper region of the river Fekete-Koros ...") |
| `rawFields` | object? | every label -> value pair as extracted, for the Raw JSON tab; `_partial` marks a record built from a listing row only |

### `location`

| field | notes |
| --- | --- |
| `raw` | place string as printed, e.g. `Kibéd (Maros-Torda)`, `Belényes/Beiuș (Bihar/Bihor County)` |
| `villageHistorical`, `countyHistorical` | as printed (Hungarian) |
| `village`, `county`, `region`, `country` | present-day; `country` is ISO 3166-1 alpha-2 |
| `lat`, `lng` | WGS84; from the fmbc map link (exact) or the gazetteer (approximate) |
| `placeId` | id of the node in `places.json` |
| `origin` | the B part of "A / B" (collection place / informant's home), resolved the same way |
| `resolution` | `site` (site printed modern name and/or coordinates), `gazetteer` (village matched in `data/gazetteer.json`), `county` (village unknown, but the historical county lies wholly in one present-day country: country, and region/county when unique, are derived; no coordinates), `unresolved` |

Split historical counties (Bihar, Szatmár, Arad, Temes, Torontál, Máramaros, Ugocsa, Csanád,
Bukovina, Moldva, Hont, Gömör, Komárom ...) never yield a country on their own; those villages
need an entry in `data/gazetteer.json` (the build report lists the missing ones).

### Why `genre` is null

None of the three databases prints a genre or function label per melody. fmbc prints
`Performance` and `Ethnicity`; bsys/gyuj print the Bartok System classification (style, rhythm,
syllable count, cadences). The mapping in `scraper/src/normalize.js` (`mapGenre`) is in place and
tested for Romanian/Hungarian/English labels, so `genre` fills in automatically if a source with
labels is added (e.g. the RFM volumes' genre headings). Until then, `style` is the primary
musical facet; the fmbc "Remarks" sometimes quote Bartok's own designation ("táncdallam").

## Place node (`places.json`)

Flat array; the tree is rebuilt from `parent`. Ids are slug paths:
`ro`, `ro/crisana`, `ro/crisana/bihor`, `ro/crisana/bihor/beius`; localities whose modern name
is unknown live under `<country>/unresolved/<historical-slug>` (`hu/unresolved/felsoireg`,
`xx/unresolved/...` when even the country is unknown). Each node carries `counts.total`,
`counts.byGenre`, `counts.byPerformance`, `counts.bySite`, `years.{min,max}`, `songIds` (villages
only), coordinates with `coordSource` (`site`, `gazetteer-approx`, `centroid-of-children`).

## Facets (`facets.json`)

`{ _meta: {songCount, sites}, genre, style, performance, instrument, year, country, region,
county, village, collector, ethnicity, site }`, each a `{ value: count }` map with sorted keys;
missing values are counted under `"null"`.

## Gazetteer (`data/gazetteer.json`)

- `counties[]`: modern Romanian counties with their historical names, region, approximate centre.
- `historicalCounties{}`: pre-1920 county -> `{country, region, county, exclusive, countries}`;
  includes Romanian-language forms that fmbc prints ("Mureș-Turda") and the Hungarian/Slovak
  counties needed to derive `HU`/`SK`.
- `places[]`: localities with modern name, historical name, aliases, county, coordinates,
  `confidence` (high/medium/low) and `coordSource` (`site:fmbc` when taken from the site's map
  link, otherwise approximate seed values entered from general knowledge - verify before relying
  on them for anything finer than a county map).
- `node src/cli.js gazetteer` merges fmbc's printed modern names and coordinates into `places[]`.

## Identity across sites

systems.zti.hu (`/br/en/browse/<category>/<rec>`) and bartok-gyujtesek.zti.hu
(`/en/browse/<collection>/<rec>`) share the backend `<rec>` id and show the same melody (verified:
2,328 pairs with identical incipits, 0 conflicts). The build keeps one record per `<rec>` under
the bsys id, fills gaps from the gyuj page (journey, informant, cadences) and records the gyuj
link in `source.alternates`. fmbc records are distinct (Lampert catalogue); fmbc facsimile
captions mention the Bartok System number ("Bartók System, A-I 1071b (BR 03245)") but that link is
not resolved automatically.
