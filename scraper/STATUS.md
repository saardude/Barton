# Scraper status

Last update: 2026-09-28 09:25 UTC (data engineer). Updated whenever a crawl is launched or a build lands.

## Crawls (launched by the coordinator, one nohup process per site, logs in `scraper/cache/crawl-<site>.log`)

| site | state | progress | check |
| --- | --- | --- | --- |
| fmbc (bartok-nepzene.zti.hu) | finished | 261/261 record pages cached | `cat scraper/cache/crawl-fmbc.log` |
| gyuj (bartok-gyujtesek.zti.hu) | running | 1,600/2,332 at 09:23 UTC (ETA ~12 min) | `tail -n 2 scraper/cache/crawl-gyuj.log` |
| bsys (systems.zti.hu, `--ignore-robots`, owner decision) | running | 900/13,817 at 09:23 UTC (ETA ~3.5 h) | `tail -n 2 scraper/cache/crawl-bsys.log` |

Do not launch a second crawl for a site while its process runs (`ps aux | grep "cli.js crawl"`).

## Rebuild from the growing cache (offline, safe at any time, ~1 min)

```
cd scraper
node src/cli.js crawl all --offline   # re-run discovery from cached listing pages (no network)
node src/cli.js parse all             # cached record pages -> raw/<site>/records.json (listing rows fill the gaps)
node src/cli.js gazetteer             # fold fmbc's printed modern names/coordinates into data/gazetteer.json
node src/cli.js build                 # data/songs.json, places.json, facets.json, BUILD.md
node src/cli.js validate              # schema gate
```

## Current build (09:22 UTC, bsys 655 and gyuj 1,385 record pages parsed; the rest from listing rows)

- songs: 14,080 (16,410 raw records; 2,330 bsys/gyuj pairs merged into one record each with `source.alternates`)
- present-day Romania: 3,246 (bsys 3,159, fmbc 87); 2,616 of them with coordinates
- resolution: county 7,852, unresolved 3,460, gazetteer 2,529, site 239; countries: HU 6,148, null 3,472, RO 3,246, SK 1,204, UA 7, RS 2, HR 1
- style set on 13,819 (old style 5,196, new style 4,630, mixed 3,263, not classified 373, instrumental 357); genre null everywhere (no site prints a genre label)
- with audio 737, with notation image 2,276, with sung text 113 (fmbc), with ethnicity 261 (fmbc only)
- listing-only rows still awaiting their page (`rawFields._partial`): 11,804 (drops as the bsys crawl progresses)
- places: 867 nodes; gazetteer: 386 places; unresolved place strings: 232; Romanian localities resolved to county only: 75 names (listed in data/BUILD.md)
- validate: OK for songs.json (14,080), places.json (867), facets.json; `npm test`: 36/36 pass
- data/songs.json is 30 MB with `rawFields`; the app should ship a slimmed copy (drop `rawFields`, keep it for the Raw JSON tab on demand)

## Confirmed against live HTML

All three sites' browse trees, listing tables and record pages (see docs/SCRAPER.md, "Site structure as
found"); fixtures in `scraper/fixtures/` are trimmed real pages. No JSON/XHR endpoints exist; the pages are
server-rendered. bsys and gyuj share backend record ids (2,328 identical incipits, 0 conflicts).

## Open items

1. When the bsys crawl finishes: `parse all`, `gazetteer`, `build`, `validate` again (partial rows -> pages).
2. 75 Romanian localities resolve to county only and 232 place strings stay unresolved: extend
   `data/gazetteer.json` from the lists in data/BUILD.md (top: Kászonaltíz/Kászonfeltíz, Csíkszentgyörgy
   variants, Székelylengyelfalva, ...). Coordinates in the seed are approximate; fmbc's map coordinates are exact.
3. `data/geo/borders-now.json` from the geo agent is optional; when present `location.country` is filled from
   coordinates for the remaining null-country records with coordinates (currently 0 of the fmbc set need it).
4. The auto-mode permission classifier denies network fetches from this session's Node processes, so probes and
   crawls must be run by the owner/coordinator (they are). All parsing/building here is offline.
