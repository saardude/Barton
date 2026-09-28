# Journey mapper: data specification

How Bartok's individual field trips are reconstructed from the dated song records, what
`data/journeys.json` contains, and how the geopolitical context layers attach to it. The
UI side (how a route or cluster is drawn, the timeline scrubber, the border toggle) is for
FRONTEND-SPEC.md / MAP-SPEC.md; this document is the data contract.

Files:

| File | Produced by | Schema |
| --- | --- | --- |
| `data/collections-gyuj.json` | `node geo/parse-gyuj-collections.mjs` from the bartok-gyujtesek.zti.hu trip index | described in section 2.1 |
| `data/journeys-curated.json` | hand-curated (research engineer), see docs/JOURNEY-SOURCES.md | `_meta.fields` in the file |
| `data/journeys.json` | `node geo/derive-journeys.mjs` from `data/collections-gyuj.json` + `data/journeys-curated.json` + `data/songs.json` + `data/gazetteer.json` | `data/schema/journey.schema.json` |
| `data/villages.json` | `node geo/enrich-wikidata.mjs` from `data/gazetteer.json` (+ `data/places.json`) | described in section 5 |
| `data/geo/borders-{1910,1914,1920,now}.json` | `node geo/build.mjs` from `geo/raw/` | GeoJSON, section 4 |
| `data/context-events.json` | hand-curated | section 6 |

All scripts live in `geo/` (own `package.json`; `cd geo && npm i` once). Nothing in
`scraper/` or `data/songs.json` is touched.

## 1. Inputs

1. **The trip index of bartok-gyujtesek.zti.hu** (`/en/browse`): 101 entries grouped by
   year, each a label such as "July-August, 1909. Upper region of the river Fekete-Koros"
   or "February 3-4, 1909. Zobordarazs", with the online record count in parentheses when
   records exist, linking to `/en/browse/<id>` (the records of that trip). This is a curated
   index made by the Institute and is the **primary source** of journeys.
   `geo/parse-gyuj-collections.mjs` parses it into `data/collections-gyuj.json` (label
   verbatim, parsed dates, resolved places, flags). It reads the scraper's cached copy of
   the page when present, otherwise fetches it once (cached under `geo/cache/gyuj/`).
2. **The canonical song record** (`data/schema/song.schema.json`). Fields used:
   `collector` (filter), `collected.{year,month,day}` (null when unknown; never invented),
   `location.{placeId,village,villageHistorical,county,countyHistorical,country,lat,lng,raw}`
   (stop identity and coordinates), `performer.ethnicity`, `instrument[]`, `genre`,
   `performer.name` (derived facts), `id`, `source.url` (collection membership: a gyuj
   record's URL is `/en/browse/<collection>/<record>`, and its id `gyuj-<collection>-<record>`).
3. `data/gazetteer.json` for resolving the label's localities and the curated stops
   without `placeId` (`geo/fill-gazetteer.mjs` adds missing Romanian villages with
   Wikidata coordinates and a confidence: high = exact label and county, medium = folded
   name within 20 km of the county centroid, low = within 80 km; unresolved ones are
   listed, never guessed) (historical Hungarian name,
   modern name or alias, folded), plus a built-in table of regions and counties named in
   the index (Fekete-Koros valley, Mezoseg, Kis-Szamos, Mocvidek, Felso-Maros mente,
   Nyarad mente, Banat, the 1910 counties, Algeria) with approximate centres.

## 2. Derivation

Implemented in `geo/derive-journeys.mjs` (`deriveJourneys(songs, config)`), deterministic,
no network. Two passes:

### 2.1 Primary pass: index entries (`derivedFrom: "gyuj-collections"`)

1. **Parse the label** (`parse-gyuj-collections.mjs`): split off the trailing "(n)" count,
   then the date expression from the place text. The site mixes English ("End of August -
   Beginning of September. Mezoseg (Campia Transilvaniei)"), Hungarian ("1914. aprilis
   3-10. Felso-Maros mente"), and numeric forms ("27-29. 12. 1915, Zolyom county"). The
   date grammar: one or more comma-separated periods; each period is one endpoint or a
   range of two; an endpoint has an optional qualifier (Beginning of / Middle of / End of
   / After, Hungarian eleje / kozepe / vege), a month (name in either language or a number),
   optional day or day range, optional year. Missing years come from the other endpoint or
   from the accordion year of the index (`yearFromGroup: true`). Qualifiers map to windows:
   beginning 1-10, middle 11-20, end 21-last day, after D = D+1 to last day. Precision per
   period: `day`, `phrase` (a qualifier window), `month`, `season`, `year`; the trip's
   `dateConfidence` is the coarsest of its periods. Every parsed value sits next to the
   verbatim `label`, `labelDateRaw` and `labelPlaceRaw`.
2. **Resolve the places**: split on " / " and ", "; strip "(?)" (kept as `uncertain`);
   keep a parenthesised alternative name (`nameAlt`); look up the region table first,
   then the gazetteer by folded name; a locality still unresolved (the gazetteer covers
   present-day Romania only) is looked up on Wikidata by its Hungarian label, restricted
   to settlements in HU/SK/UA/RS/HR/RO/AT, and accepted only as a single hit with
   coordinates (`resolution: "wikidata"`, with `qid`, cached, 1 request/s). Results:
   `gazetteer` (38), `region-table` (28), `wikidata` (37), `ambiguous` (2: Gyula,
   Dunapentele, candidates listed), `unresolved` (6, kept as text: Gerlicepuszta,
   Tokesujfalu, Apatkolos, Nagygut, Ponik, Felsoszaszberek).
3. **Attach records**: every Bartok record whose `source.url` (or id) names a collection id
   present in the index joins that journey. Stops are grouped by place as in 2.2; the
   journey is a `route` when every attached record has a full date, otherwise a `cluster`.
   `recordCount`, `songIds`, `recordDateRange` and `facts` come from the attached records;
   `countOnline` is the count the index prints.
4. **Entries without online records** (37 of 101; e.g. "July-August, 1909. Upper region of
   the river Fekete-Koros") exist as journeys with `recordsOnline: false`, `recordCount: 0`
   and stops built from the label's places (`locationConfidence: "label"` for a gazetteer
   locality, `"label-region"` for a region or county centre, `"unresolved"` otherwise).
   Region stops are drawn as a cluster circle at the region centre, never as a route.
5. **Romanian material**: `romanianMaterial.value/confidence` is a curated flag
   (`documented` = the county/region and date match the collecting chronology in Rumanian
   Folk Music, Suchoff ed.; `inferred` = Romanian-speaking area, not checked entry by entry;
   `unknown` = present-day Romania but language not checked, which is where the Szekely
   Hungarian trips fall). `nowIn` lists the present-day countries of the stops so the app
   can show the Romanian trips even where the melodies are not online.
6. **Id** = `gyuj-<collection id>`, the site's own stable id. `sourceUrl` links the entry.

### 2.1a Curated layer (`data/journeys-curated.json`, merged over the index)

`data/journeys-curated.json` (63 cited entries, 1904-1918, see docs/JOURNEY-SOURCES.md) is
merged over the index entries by `derive-journeys.mjs`:

1. An entry with `matchesCollection` merges into journey `gyuj-<id>`: the curated
   `dateStart`/`dateEnd`/`datePrecision`, `departure` (place text, evidence; Budapest
   coordinates only when the text names Budapest), `return`, `companions`, `summary`,
   `sources[]`, `evidenceQuality` and `title` are carried into the journey (`curatedId`
   links back). The index entries listed in `alsoMatchesCollections` are folded into the
   same journey (`subsumedCollections[]`, their records attached, a `notes` entry per
   folded entry) and are not emitted as separate journeys.
2. Entries with `matchesCollection: null` become new journeys with the curated id
   (`cur-YYYY-MM-nn`, `derivedFrom: "curated"`); rfm records attach to them by date +
   county like to index entries.
3. Stops are the curated ordered stops (`seq`, `arrival`, `departure`, `confidence:
   documented|inferred`, `note`, `placeIdNote`). Coordinates come from the curated stop,
   else from the gazetteer by `placeId`, else by a unique folded (modern or historical
   name, county) lookup in the gazetteer (`placeIdSource: "gazetteer-lookup"`). Attached
   records are assigned to the stop whose `placeId` or folded village name matches; records
   at places the itinerary does not name are appended as extra stops with
   `confidence: "inferred"` and a note. `kind` is `route` when `evidenceQuality` starts
   with "documented itinerary" (distances along the curated order), else `cluster`.
4. `quality` (the app's badge): `sourced itinerary` = documented itinerary with day
   precision and every stop documented; `documented itinerary` = other documented
   itineraries; `dates only` = curated "dates only" entries and all date-gap trips; `index
   only` = index entries without curated research.
5. Conflicts are never resolved silently: `notes[]` keeps, verbatim, stop and source notes
   that report a differing date or place, the parenthetical of an evidence quality such as
   "dates only (conflicting)", departure/return notes, and the folded index entries.
6. `romanianMaterial` comes from the curated boolean (`confidence: documented`) when
   present, else from the index flag.

### 2.2 Fallback pass: records outside the index (`derivedFrom: "date-gap"`)

Records of the other two sites (and any gyuj record whose collection is not in the index,
counted as `orphanCollectionRecords`) are grouped by the date-gap heuristic:

1. **Filter collector.** Keep records whose `collector` matches `/bart[oó]k/i` (config
   `collectorPattern`). Records with `collected.year == null` are skipped (counted).
2. **Split by date precision.** `day` precision records go to the route pass; `month` and
   `year` precision records to the fuzzy pass. A record is never in both.
3. **Route pass.** Sort by full date, then stop key, then id. Start a new trip when:
   `start` (first record); `gap` (more than `gapDays`, default **10**, since the previous
   record); `jump` (previous record on the same or preceding day at a different stop, both
   with coordinates, more than `jumpKm`, default **250** km, apart). Movement over two or
   more days is never split by distance.
4. **Fuzzy pass.** Month-precision records grouped per calendar month, year-precision per
   year; each group is a `cluster` (section 3).
5. **Stops.** Records grouped by stop key (`placeId`, else folded village + county, else
   folded historical names, else the raw string). Route stops ordered by first record date
   with `arrival`/`departure` = earliest/latest record date; a village visited twice with
   another stop in between appears twice. Stops without coordinates are `unresolved`.
6. **Departure point.** Route trips start from `config.departure`, default Budapest
   (47.4979, 19.0402), `confidence: "assumed"`; `kmFromPrevious` of stop 1 is measured from
   it and `distanceKm` sums departure -> stops (no return leg). Clusters carry the departure
   object but no distance.
7. **Ids** `J-YYYY-MM-nn` (year-month of the first record, 01-based sequence, routes before
   clusters; `MM = 00` for year-only clusters). Stable while the input dates are; a
   re-scrape that adds an earlier trip in the same month shifts `nn` (a key, not a permalink).

### 2.3 Common

- **Facts** per trip: `villages` (resolved stops), `counties` / `countiesHistorical`
  (records plus label stops), `ethnicGroups`, `instruments`, `genres` (counts),
  `performers` (distinct folded names).
- **Output** `{ _meta, journeys[] }` sorted by `dateStart` then id, keys sorted, two-space
  indent. `_meta.counts` reports records in/outside collections, index entries with and
  without records, and route/cluster totals.
- Tunables: `--gap 10 --jump 250 --collector "bart[oó]k" --collections <file>
  --no-collections --curated <file> --no-curated --gazetteer <file>`. Values used are written into each journey's `derivation`.

Worked example (`node geo/derive-journeys.mjs --in <synthetic> --out <file>`): two
records with URLs `/en/browse/32/...` join `gyuj-32` ("July, 1907. Csikszentmihaly (5)",
cluster, month precision); index entry 50 without records becomes `gyuj-50`
("July-August, 1909. Upper region of the river Fekete-Koros", `recordsOnline: false`, one
`label-region` stop at the Crisul Negru valley centre, `romanianMaterial` documented);
records with no collection on 3, 4, 5 August 1909 form `J-1909-08-01`, a record 300 km away
on 6 August starts `J-1909-08-02` with reason `jump`; "1910. apr." records form cluster
`J-1910-04-01`; "1910" records form `J-1910-00-01`.

## 3. Fuzzy trips (month or year only)

A month- or year-only trip is honest about what is known:

- `kind: "cluster"`, `dateConfidence: "month" | "year"`, `days: null`, `distanceKm: null`,
  every stop `kmFromPrevious: null`, `seq` is alphabetical and carries no order.
- The UI shows the stops as a cluster (hull or bubbles) with the date label "April 1910"
  or "1910", not as a route, and says "order of visits unknown".
- Index entries with `phrase` precision ("End of March") are clusters with a 10-day window;
  the UI shows the label text as the date, not the window bounds.
- When the same month also has a route trip (some records with day, some without), both
  exist side by side (`J-1910-04-01` route, `J-1910-04-02` cluster). They are not merged:
  the day-less records may or may not belong to the dated trip, and the data does not say.
  The UI may offer "show undated records of this month" on the route trip.
- Year-only clusters (`MM = 00`) sort before the months of that year.

## 4. Border layers

`data/geo/borders-1910.json`, `borders-1914.json`, `borders-1920.json`, `borders-now.json`
(GeoJSON FeatureCollections, each < 500 KB, see docs/GEO-SOURCES.md for sources, licences
and the attribution lines to show). Common feature properties:

| Property | Meaning |
| --- | --- |
| `year` | 1910, 1914, 1920, or null for the present-day layer |
| `level` | `country` or `county` |
| `name` | Display name (English or, for 1910 counties, the Hungarian name) |
| `nameHu` | Hungarian name or null |
| `nameRo` | Romanian name or null (1910 counties: the interwar Romanian county name for counties in present-day Romania) |
| `source` | Id of the source dataset, resolved in the file's top-level `meta.sources` |

Extra properties per file: 1910 counties carry `country`, `region` (nagytaj), `idMegye`,
`nowInRomania`; historical states carry `sourceYear`, `subjectTo`, `borderPrecision`;
present-day features carry `iso2`, `iso3`, and counties `code` (ISO 3166-2).

Which layer a trip gets: `1910` for trips dated up to 1913 (the 1910 county map is the
administrative frame of Bartok's collecting; the state outline is the 1914 one because no
1910 file exists and the borders in this window did not change between 1908 and 1914),
`1914` for 1914 to 1918, `1920` for anything later, and `now` as the toggle on every trip.
The rule is `layerForYear(y) = y <= 1913 ? 1910 : y <= 1918 ? 1914 : 1920`, a pure
function the app can keep next to the data loader.

## 5. Villages (`data/villages.json`)

Keyed by gazetteer id (`<country>/<region>/<county-slug>/<name-slug>`, the shape of
`place.schema.json` ids; `data/places.json` village ids are used directly once it exists).
Each entry: `status` (`existing | renamed | merged | abandoned | unknown`), `qid`,
`wikidataUrl`, `coord`, `distanceFromGazetteerKm`, `names` (`ro`, `hu`, `en`, `native[]`,
`historical[]` with `until`, aliases per language), `admin` (commune, county with QIDs),
`dissolved`, `inception`, `replacedBy`, `population` (`value`, `asOf`), `instanceOf[]`,
`candidates[]`, `evidence[]` (why the match was accepted or rejected), `matchedVia[]`. The
`_meta` block spells out the status rules and counts. `unknown` is never guessed; the
evidence says what was found.

Join from a journey stop: `stop.placeId` (when the scraper resolves through the gazetteer
these are the same ids) or by folded `village` + `county`.

## 6. Context events (`data/context-events.json`)

A short, sourced list of dated events (borders, publications, Bartok's statements, the
reception of his Romanian work, biography). Each entry: `id`, `date` (ISO date, month or
year), optional `dateEnd`, `dateConfidence` (`exact | approximate`), `kind`
(`border | publication | statement | reception | biography`), `title`, `summary` (one
neutral paragraph), `source` (`citation`, optional `url`), optional `places[]` and
`quote`. The timeline shows events whose date range overlaps the visible trip range; the
layer presents documented material and does not editorialise (`_meta.note`).

## 7. Open points

- The index is the Institute's curation; where an index entry and a date-gap trip of the
  other sites overlap in time and place (the same 1907 Csik trip appears in the Bartok
  System too), the app should show the index entry and list the date-gap trip as
  "records of the same dates from other databases". A join by date window + county is
  straightforward and left to the app.
- 8 of the index's 111 place mentions remain unresolved or ambiguous after the gazetteer
  and the Wikidata lookup (see 2.1); they need a manual entry (e.g. Dunapentele is today's
  Dunaujvaros, Ponik is Poniky in Slovakia) with a source before they are drawn.
- Bartok's documented itineraries (letters, the Bartok Archives' chronology) could refine
  the date-gap trips; the schema allows `departure.confidence: "documented"` and a `note`.
- Records with `collected.day` but a wrong month on the source site will produce spurious
  `jump` splits; `qa` gate G6 lists out-of-range years, and a similar warning for
  single-record trips with reason `jump` is worth adding to `qa/checks/data-gates.mjs`.
- Collector names other than Bartok (Kodaly, Lajtha, Bușiția's own material) are dropped by
  the filter; a `--collector` flag exists if trips for another collector are wanted.
