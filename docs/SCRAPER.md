# Scraper

Node 22 project in `scraper/` (ESM, no build step). Fetches the three HUN-REN BTK ZTI Bartok
databases politely, parses them into the canonical schema (`docs/DATA-SCHEMA.md`) and writes
`data/songs.json`, `data/places.json`, `data/facets.json`, `data/BUILD.md`.

```
cd scraper && npm i && npm test
```

## Commands (in order)

| step | command | what it does |
| --- | --- | --- |
| 1 probe | `node src/cli.js probe <url> [<url>...]` | fetches pages into the cache (1 req/s) and prints a DOM outline: title, headings, tables with header rows, `<dl>`, forms, media counts, ids/classes, link patterns. Use it to confirm the `SELECTORS` blocks. |
| 2 confirm | edit `src/sites/{fmbc,bsys,gyujtesek}.js` | each parser starts with a `SELECTORS` object; comments say what is CONFIRMED against live HTML and what is still TO CONFIRM. |
| 3 crawl | `node src/cli.js crawl <fmbc\|bsys\|gyuj\|all> [--max N] [--offline] [--force-listings] [--ignore-robots]` | discovers listings from the seeds, writes `raw/<site>/listings.json` + `urls.json` (record URLs with listing-row context), then fetches every record page into `cache/<host>/<sha1>.html` (+ `.json` sidecar). Progress is logged every 100 pages. Run long crawls detached: `nohup node src/cli.js crawl gyuj > cache/crawl-gyuj.log 2>&1 &`. |
| 4 parse | `node src/cli.js parse <site\|all>` | offline; parses cached pages into `raw/<site>/records.json`. Records whose page is not cached yet are emitted from the listing row with `fields._partial`. |
| 5 gazetteer | `node src/cli.js gazetteer` | merges the modern names and map coordinates printed by bartok-nepzene.zti.hu into `data/gazetteer.json`. |
| 6 build | `node src/cli.js build` | normalises, merges bsys/gyuj pairs, resolves places, writes `data/*.json` and `data/BUILD.md` (counts, unresolved places). |
| 7 validate | `node src/cli.js validate [songs.json]` | Ajv (2020-12) validation of songs, places, facets; checks id uniqueness and parent links. Exit code 1 on failure. |

Re-running `crawl` costs nothing for cached pages; `crawl --offline` re-runs discovery from the
cache without touching the network. `parse`, `gazetteer`, `build`, `validate` never use the network.

## What is where

```
scraper/src/fetch.js         polite fetcher: cache, robots.txt, 1 req/s per host, retries with backoff
scraper/src/crawl.js         generic discover -> fetch -> parse driver
scraper/src/sites/common.js  cheerio helpers, DOM outline, shared ZTI-platform parsers, style helper
scraper/src/sites/fmbc.js    bartok-nepzene.zti.hu   (record pages, "Folk Music Source" tab)
scraper/src/sites/bsys.js    systems.zti.hu/br/en    (74 category tables -> 13,817 record pages)
scraper/src/sites/gyujtesek.js bartok-gyujtesek.zti.hu (101 collection tables -> 2,332 record pages)
scraper/src/normalize.js     genre/performance/instrument mapping, date parsing, place resolution
scraper/src/gazetteer.js     diacritics-insensitive gazetteer lookup, historical county map
scraper/src/gazetteer-extend.js  site coordinates -> data/gazetteer.json
scraper/src/geo.js           country from coordinates (optional data/geo/borders-now.json)
scraper/src/build.js         merge, places, facets, BUILD.md
scraper/src/validate.js      Ajv validators
scraper/fixtures/            trimmed real pages (fetched 2026-09-28) used by the tests
scraper/tests/               node --test suite (36 tests)
scraper/cache/               HTML cache + crawl logs (git-ignored)
scraper/raw/                 per-site intermediate JSON (git-ignored)
scraper/STATUS.md            crawl status and counts
```

## Site structure as found (2026-09-28)

**bartok-nepzene.zti.hu (fmbc)** - `/en/browse/` lists all 261 records in `#accordian`
(`a[href*="/en/browse/record/"]`, grouped under 51 works, 4 sections). Record page
`/en/browse/record/<BBnnn-Lnnn-nn>/`: `.col-lg-2 h3` Lampert number, `.col-lg-10 h3` movement
title, `h4` work "(year; BB nn)", melody image `a[href*="/media/images/melody/"]`, tabs `#source`
(Folk Music Source), `#recording` (composition audio + score), `#words`, `#comparison`.
`#source .datas > .row` holds `Recording:`, `Collecting:` (with a `/en/map/?lat=..&lng=..` link),
`Informant:`, `Performance:`, `Ethnicity:`, `Remarks:`; a second `.datas` block describes the
source of the words when it differs. `Collecting:` formats: `Hist/Modern (HistCounty/ModernCounty
County), Month Year, Collector`, `Hist (HistCounty County; now: Modern, Country), ...`, and
bracketed `[...]` for uncertain data. No JSON endpoints.

**systems.zti.hu/br/en (bsys)** - `/br/en/browse` has 74 category links `/br/en/browse/<id>/`
(class A/B/C by rhythm and syllable count, Appendix instrumental / not classified). A category page
is one `#record table` with all rows (largest 1,448; no pagination; `?sort=N` re-orders):
`BR number | Text incipit or designation | Locality | County | Year | Collector | Sound`, first cell
`a.link[href="/br/en/browse/<cat>/<rec>"]`. Record page `#record`: `h3` title, `<p>` lines
`Place (County), yyyy.mm.`, `Informant:`, `Place of origin:`, `Collector:`, `Inventory number:`,
`Publication:` (tooltip has the full citation), `BR number:`, `Number of melodic variants:` (link to
`search?sys=`), `Cadence:`, `Sound recording:`; notation image `/media/images/BR/BR_nnnnn_01.jpg`.
`robots.txt`: `User-agent: * Disallow: /` (Googlebot allowed).

**bartok-gyujtesek.zti.hu (gyuj)** - `/en/browse` has 101 collection links `/en/browse/<id>`
labelled "Month, Year. Place (count)" in `#accordian a.list`. Collection page: same `#record table`
template (`Text incipit | Locality | County | Date | Informant | Sound`) linking to
`/en/browse/<coll>/<rec>`. Record page: same template as bsys. Shares backend record ids with bsys.

## Volumes

| site | listing pages | record pages | time at 1 req/s |
| --- | --- | --- | --- |
| fmbc | 1 | 261 | 5 min |
| gyuj | 101 | 2,332 | 40 min |
| bsys | 74 | 13,817 | 3 h 50 min |

Cache size: about 25 KB per page, roughly 400 MB for everything.

## Ethics and access

- 1 request per second per host, one sequential connection, `User-Agent:
  BartokRomaniaViewer/0.1 (+repo; research scraper of HUN-REN BTK ZTI Bartok databases; 1 req/s;
  contact tsaar@maltandbrew.com)`.
- Every page is fetched once and kept in `scraper/cache/`; re-runs are free. 429/503 responses back
  off 60 s; other failures retry with exponential backoff (max 4 retries).
- `robots.txt` is honoured by default. bartok-nepzene.zti.hu and bartok-gyujtesek.zti.hu publish
  none (the URL returns their HTML homepage). **systems.zti.hu disallows all crawlers except
  Googlebot.** At the owner's instruction, for this academic project, it was crawled with
  `--ignore-robots` at 1 req/s with the mitigations above. Recommendation: ask HUN-REN BTK ZTI
  (br@zti.hu is printed on the site) for a data export or permission, and credit them.
- Attribution: all data originates from the HUN-REN BTK Institute for Musicology (Zenetudomanyi
  Intezet), Budapest: "Folk Music in Bartok's Compositions", "The Bartok System" and "Bela Bartok,
  the Ethnomusicologist". Every record keeps its original URL and site identifier; the viewer must
  show them and link back.
- Node's built-in `fetch` ignores `HTTPS_PROXY`; `src/fetch.js` installs undici's
  `EnvHttpProxyAgent` so the container's egress proxy is used (equivalent to `NODE_USE_ENV_PROXY=1`).

## Selector assumptions: what was confirmed and what to re-check

Confirmed against live HTML on 2026-09-28 (fixtures in `scraper/fixtures/` are trimmed copies):
fmbc browse tree and record page; bsys browse tree, category table and record page; gyuj browse
tree, collection table and record page.

Still to confirm or extend:

1. fmbc `Collecting:` free-text variants beyond the three handled forms (a handful of records use
   `; ma:` or `; now: <village>; <country>`; the parser tolerates them, check `rawFields.Collecting`
   for anything that ends up in `location.raw` unparsed).
2. fmbc `#comparison` tab: currently only harvested for record links (`related[]`); its content is
   not modelled.
3. bsys/gyuj `Sound recording:` label: audio players appear only on some records; confirm the
   `<audio>` markup on one such page (grep the cache for `audioplayer`).
4. bsys record pages for the Appendix categories (82 instrumental, 83 not classified) may carry
   extra labels; run `probe` on one of each once the crawl reaches them.
5. `/en/map/` on fmbc was not needed (coordinates are on the record pages) and was not fetched.
6. `data/geo/borders-now.json` (from the geo agent) is optional: when present, `location.country`
   is filled from coordinates for records the gazetteer cannot place.
