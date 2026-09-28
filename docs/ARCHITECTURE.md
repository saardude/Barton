# Architecture

One page on how the Bartok Romania viewer is built. Brief: CONTEXT.md. Deployment: DEPLOY.md.

## Shape

A static site. No server, no database, no API. The scraper runs offline and commits JSON;
the app ships that JSON as immutable static assets and does everything else (facets, search,
sorting, map) in the browser. Vercel serves files from its CDN.

## Pipeline

```
zti.hu sites  --crawl-->  scraper/cache/ (raw HTML, gitignored, resumable)
              --parse-->  per-site normalised records
              --build-->  data/songs.json, data/places.json, data/facets.json   (committed)
                          data/schema/*.schema.json validates them; qa/checks/data-gates.mjs gates them
app build     --sync-->   app/public/data/<name>.<sha256:8>.json               (gitignored)
                          app/src/generated/data-manifest.ts  (name -> hashed URL)
vite build    ------->    app/dist/  (index.html, assets/*.<hash>.js|css, data/*.json)
vercel deploy ------->    CDN; /data/* and /assets/* immutable for a year, index.html revalidated
```

Rules: scraper output is deterministic (sorted keys, stable ids) so data diffs are reviewable;
`data/` is the single source of truth; `app/public/data` is always regenerated, never edited.
The sync step is `app/scripts/sync-data.mjs`, run by `npm run dev` and `npm run build`.

## Data loading in the browser

1. `index.html` loads the app bundle; the bundle imports `data-manifest.ts`, so it knows the
   content-hashed URL of `songs.json` without an extra round trip.
2. `useCatalog()` fetches `songs.json` once (plus `places.json`, `facets.json`) and keeps the
   parsed arrays in a module-level store. Nothing is refetched during the session.
3. If the catalog has more than 5,000 records, index building moves to a Web Worker
   (`new Worker(new URL('./catalog.worker.ts', import.meta.url), { type: 'module' })`):
   the worker builds the id map, county and village buckets, facet counts and the search index,
   and answers query messages with arrays of record ids. Below 5,000 the same code runs on the
   main thread; the interface is identical so the threshold is one constant.
4. URL is the state. The whole query (place, genre, style, performance, instrument, year range,
   sort, free text) round-trips through the query string (codec in FRONTEND-SPEC.md); records
   are `/song/<id>`, counties `/county/<slug>`. Filter changes use `history.replaceState`,
   navigation uses `pushState`. Any URL is shareable and reload-safe because `vercel.json`
   rewrites every path to `index.html`.
5. Record media is never in the JSON: notation images are lazy `<img loading="lazy">` and audio
   is `<audio preload="none">`, both pointing at the source host (see risks).

Size plan: the budget is 3 MB gzip for the initial JSON. At roughly 13,000 records the full
record set should fit; if a build exceeds the budget (CI fails the build), split `songs.json`
into a list-level file (fields needed for list, map and facets) and sharded detail files
(`records/<shard>.json`) loaded on demand. The manifest and cache headers already cover any
number of files under `/data/`.

## Map

Recommendation: Leaflet 1.9 with react-leaflet 5 and raster tiles, not MapLibre.

- Leaflet is about 40 KB gzip; MapLibre GL is about 250 KB and needs a vector tile source.
  The map is dots-on-a-basemap with a hover card, which Leaflet does with `CircleMarker` on a
  canvas renderer (`preferCanvas: true`) comfortably at a few thousand points.
- Basemap: CARTO Positron (light, greyscale, matches the wireframe) as the default tile URL
  (`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`), with OpenStreetMap
  standard tiles as a one-line fallback. Both are allowed in the CSP `img-src`.
- Attribution is mandatory and must stay visible on the map: OpenStreetMap data is ODbL, so
  show "(c) OpenStreetMap contributors" linked to openstreetmap.org/copyright; CARTO tiles add
  "(c) CARTO". OSM's tile usage policy forbids heavy or bulk use and requires a valid Referer;
  CARTO's free tier is for low-volume, non-commercial use. If traffic grows, self-host a
  Romania extract as PMTiles with MapLibre; the `MapView` component boundary is the only
  thing that changes.
- County-level view: bubbles sized by count at county centroids from `places.json`; village
  level: dots at village coordinates. An SVG fallback for the county view keeps the explorer
  usable if tiles are blocked (some institutional networks) or offline.

## Search

Client-side only. MiniSearch (about 7 KB gzip) over title, incipit, text, performer, place
names (modern and historical), with a normaliser that strips diacritics (Hungarian and
Romanian) so "Borosjeno" finds "Borosjenő" and "Ineu" finds the same record. Prefix and fuzzy
matching on; field boosts favour title and place. The index is built in the worker described
above and serialised with `JSON.stringify(miniSearch)` only if build time is measured above
300 ms; otherwise it is rebuilt on load. Structured facets are plain array filters over
pre-bucketed ids, not search queries.

## Performance budget

| Metric | Budget | How it is enforced |
| --- | --- | --- |
| Initial JSON (songs + places + facets) | < 3 MB gzip | CI `Performance budget` step fails the build |
| JS bundle | < 300 KB gzip (Leaflet + React + MiniSearch fits in ~200) | CI warning; Lighthouse in QA |
| First paint on 4G, mid-range phone | < 2 s | Lighthouse performance >= 90 (QA-PLAN) |
| Interactive with data loaded | < 4 s on 4G | shell renders before JSON arrives; skeleton list |
| Tiles, images, audio | lazy, never in the critical path | `loading="lazy"`, `preload="none"` |

Vite code-splits the record page and the county page; the map library is loaded with the
explorer, which is the landing page, so it is not deferred.

## Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Source HTML changes or the sites go down | Scraper breaks; app is unaffected because data is committed | Selectors isolated per site in `scraper/src/sites/*.js`; fixture tests fail loudly; `probe` prints the DOM outline; keep the last good `data/` in git |
| Network access from the build/scrape environment | Nothing can be scraped or deployed without egress to the zti.hu hosts and api.vercel.com | Environment allowlist documented in DEPLOY.md; scraping is resumable from the disk cache; deployments run in GitHub Actions, which has open egress |
| Licensing of source material, notation images and audio | Redistribution rights are unclear; mirroring could be infringing | Default is to hot-link media from the source records and show attribution on every screen; mirroring is an owner decision (PLAN.md open decisions); scraper stores only text and metadata in `data/` |
| Place-name ambiguity | Wrong county or country for a record, dots in the wrong place | Gazetteer maps historical Hungarian names to modern names with coordinates; unresolved places stay `null` (never guessed) and are listed by the data gates; the UI shows both names and a "location uncertain" mark |
| Scale (13,000+ records) | Slow first load or laggy filtering | Size budget in CI; worker-built indexes above 5k; split into list plus shards if needed |
| Tile provider policy or outage | Empty map | Configurable tile URL, OSM fallback, SVG county fallback |
| Vercel free-tier limits | Bandwidth cap (100 GB/month on Hobby) | Immutable caching keeps repeat visits cheap; data is a few MB; no media served from Vercel |
| Deterministic output regressions | Noisy data diffs hide real changes | Sorted keys and stable ids are tested in the scraper suite |
