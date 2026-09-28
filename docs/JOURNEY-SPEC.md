# Journey mapper: data specification

How Bartok's individual field trips are reconstructed from the dated song records, what
`data/journeys.json` contains, and how the geopolitical context layers attach to it. The
UI side (how a route or cluster is drawn, the timeline scrubber, the border toggle) is for
FRONTEND-SPEC.md / MAP-SPEC.md; this document is the data contract.

Files:

| File | Produced by | Schema |
| --- | --- | --- |
| `data/journeys.json` | `node geo/derive-journeys.mjs` from `data/songs.json` | `data/schema/journey.schema.json` |
| `data/villages.json` | `node geo/enrich-wikidata.mjs` from `data/gazetteer.json` (+ `data/places.json`) | described in section 5 |
| `data/geo/borders-{1910,1914,1920,now}.json` | `node geo/build.mjs` from `geo/raw/` | GeoJSON, section 4 |
| `data/context-events.json` | hand-curated | section 6 |

All scripts live in `geo/` (own `package.json`; `cd geo && npm i` once). Nothing in
`scraper/` or `data/songs.json` is touched.

## 1. Input

The canonical song record (`data/schema/song.schema.json`). The fields used:

- `collector` (string or null): filter.
- `collected.year`, `collected.month`, `collected.day`: integers or null. The scraper never
  invents a date, so `day` can be null while `month` is set, and `month` null while `year`
  is set. `collected.raw` is kept in the record for display but not used here.
- `location.placeId`, `.village`, `.villageHistorical`, `.county`, `.countyHistorical`,
  `.country`, `.lat`, `.lng`: stop identity and coordinates.
- `performer.ethnicity`, `instrument[]`, `genre`, `performer.name`: derived facts.
- `id`: membership lists.

## 2. Derivation algorithm

Implemented in `geo/derive-journeys.mjs` (`deriveJourneys(songs, config)`), deterministic,
no network.

1. **Filter collector.** Keep records whose `collector` matches `/bart[oó]k/i` (config
   `collectorPattern`; the sites print "Bartok Bela", "Bartók Béla", "B. B."-style values
   are not matched and are reported in `_meta.counts.skippedRecords`). Records with
   `collected.year == null` are skipped too; they cannot be placed in time at all.
2. **Split by date precision.** `day` precision records go to the route pass (step 3);
   `month` and `year` precision records go to the fuzzy pass (step 4). A record is never in
   both.
3. **Route pass.** Sort by full date, then by stop key, then by id. Walk the sorted list and
   start a new trip when any of these hold, recording the reason(s):
   - `start`: the first record.
   - `gap`: more than `gapDays` (default **10**) days since the previous record.
   - `jump`: the previous record is on the same or the preceding day, at a different stop,
     both stops have coordinates, and the great-circle distance is more than `jumpKm`
     (default **250** km). Two different villages recorded 300 km apart on consecutive days
     are two trips (or a data error) rather than one journey; this is what the threshold
     encodes. Movement over two or more days is never split by distance.
   Trips are therefore maximal runs of dated records with no gap larger than 10 days.
4. **Fuzzy pass.** `month`-precision records are grouped per calendar month, `year`-precision
   records per year. Each group is one trip of `kind: "cluster"` with `splitReasons`
   `["precision"]` (month) or `["year"]` (year). No route order exists inside a cluster, so
   stops are sorted alphabetically and carry `kmFromPrevious: null`; the UI draws a convex
   hull or a bubble cluster, never a polyline (section 3).
5. **Stops.** Inside a trip, records are grouped by stop key: `location.placeId` when
   resolved, otherwise the folded modern village + county, otherwise the folded historical
   village + historical county, otherwise the folded raw place string. For route trips stops
   are ordered by first record date; `arrival` = earliest record date at the stop,
   `departure` = latest. A village visited twice with another stop in between appears
   twice (two stops, same placeId), which is what the record dates say. Stops without
   coordinates get `locationConfidence: "unresolved"`, are kept in the list and skipped for
   distances.
6. **Departure point.** Every route trip starts from `config.departure`, default Budapest
   (47.4979, 19.0402), Bartok's home base from 1907, with `confidence: "assumed"`. The
   scraped records never document where a trip began, so this is a labelled assumption; if
   a trip's start is later documented (a letter, a diary), set `confidence: "documented"`
   and a `note` per trip by hand. `kmFromPrevious` of stop 1 is the distance from the
   departure point; `distanceKm` sums departure -> stop 1 -> ... -> last stop (no return
   leg). Clusters have no departure distance (`distanceKm: null`) but still carry the
   departure object so the UI can show the base.
7. **Ids.** `J-YYYY-MM-nn`: year and month of the first record, `nn` a 01-based sequence
   within that year-month, route trips before clusters, then by start date. Year-only
   clusters use `MM = 00` (`J-1912-00-01`). Ids are stable as long as the input dates are;
   a re-scrape that adds a record inside an existing trip does not change ids, one that
   adds an earlier trip in the same month does (the id is a key, not a permalink).
8. **Derived facts** per trip: `villages` (distinct resolved stops), `counties` and
   `countiesHistorical` (sorted distinct), `ethnicGroups` (performer.ethnicity -> count),
   `instruments` (instrument -> count), `genres` (genre -> count), `performers` (distinct
   folded names). Null values are not counted.
9. **Output.** `{ _meta, journeys[] }`, journeys sorted by id, all object keys sorted, two
   space indent, trailing newline. `_meta.config` repeats the thresholds and the departure
   config, `_meta.counts` gives input/used/skipped record counts and route/cluster counts.

Worked example (from `qa/fixtures` plus synthetic records, `node geo/derive-journeys.mjs
--in <file> --out <file>`): records on 18, 19, 21 July 1909 in Beius and Vascau form
`J-1909-07-01` (2 stops, 4 days); a record on 3 August is 13 days later and starts
`J-1909-08-01`; consecutive-day records 300 km apart start `J-1909-08-02` with reason
`jump`; "1910. apr." records form cluster `J-1910-04-01`; "1910" records form
`J-1910-00-01`.

Tunables are CLI flags: `--gap 10 --jump 250 --collector "bart[oó]k"`. Changing them
changes ids; the values used are written into each journey's `derivation` block.

## 3. Fuzzy trips (month or year only)

A month- or year-only trip is honest about what is known:

- `kind: "cluster"`, `dateConfidence: "month" | "year"`, `days: null`, `distanceKm: null`,
  every stop `kmFromPrevious: null`, `seq` is alphabetical and carries no order.
- The UI shows the stops as a cluster (hull or bubbles) with the date label "April 1910"
  or "1910", not as a route, and says "order of visits unknown".
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

- Bartok's documented itineraries (letters, the Bartok Archives' chronology) could replace
  the gap heuristic trip by trip; the schema already allows `departure.confidence:
  "documented"` and a `note`. That is manual work and out of scope for the derivation.
- Records with `collected.day` but a wrong month on the source site will produce spurious
  `jump` splits; `qa` gate G6 lists out-of-range years, and a similar warning for
  single-record trips with reason `jump` is worth adding to `qa/checks/data-gates.mjs`.
- Collector names other than Bartok (Kodaly, Lajtha, Bușiția's own material) are dropped by
  the filter; a `--collector` flag exists if trips for another collector are wanted.
