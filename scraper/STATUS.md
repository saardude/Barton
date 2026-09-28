# Scraper status

Last update: 2026-09-28 11:35 UTC (data engineer). Updated whenever a crawl is launched or a build lands.

## Crawls (launched by the coordinator, one nohup process per site, logs in `scraper/cache/crawl-<site>.log`)

| site | state | progress | check |
| --- | --- | --- | --- |
| fmbc (bartok-nepzene.zti.hu) | finished | 261/261 record pages cached | `cat scraper/cache/crawl-fmbc.log` |
| gyuj (bartok-gyujtesek.zti.hu) | finished | 2,332/2,332 record pages cached | `cat scraper/cache/crawl-gyuj.log` |
| bsys (systems.zti.hu, `--ignore-robots`, owner decision, pid 7106) | running | 8,500/13,817 at 11:30 UTC (ETA ~1.5 h) | `tail -n 2 scraper/cache/crawl-bsys.log` |

Do not launch a second crawl for a site while its process runs (`ps aux | grep "cli.js crawl"`).

## Rebuild from the growing cache (offline, safe at any time, ~1 min)

```
cd scraper
node src/cli.js crawl all --offline   # re-run discovery from cached listing pages (no network)
node src/cli.js parse all             # cached record pages -> raw/<site>/records.json (listing rows fill the gaps)
node src/cli.js gazetteer             # fold fmbc's printed modern names/coordinates into data/gazetteer.json
node src/cli.js build                 # data/songs.json, places.json, facets.json, BUILD.md
node src/cli.js validate              # schema gate
cd .. && node qa/checks/data-gates.mjs --file data/songs.json   # QA gates (summary line)
```

`data/rfm.json` (printed Rumanian Folk Music IV-V, 830 records from print/parse-rfm.mjs) is read by `build` as a
fourth source; do not regenerate it here. `print/places-rfm.json` is folded into the gazetteer lookup read-only.

## Current build (11:33 UTC; bsys 8,657 of 13,817 record pages parsed, the rest from listing rows)

- songs: 14,910 = fmbc 261 + bsys 13,817 + gyuj 2,332 + rfm 830 (printed volumes, data/rfm.json), minus 2,330 bsys/gyuj pairs merged (`source.alternates[]` keeps the gyuj link and its former id)
- present-day Romania: 4,072; with coordinates 3,385
- resolution: county 7,893, gazetteer 3,638, unresolved 3,140, site 239; gazetteer 418 places (+60 read-only from print/places-rfm.json)
- genre: 830 rfm records (colinda 497, cantec 173, joc 113, bocet 21, other 17, doina 9), null for the 14,080 site records (no site prints a genre); style set on 13,819
- listing-only rows still awaiting their page (`rawFields._partial`): 4,214
- files: data/songs.json 40.5 MB (archival, with rawFields); data/songs.slim.json 9.13 MB (app copy, spec in docs/DATA-SCHEMA.md)
- gates: `npm test` 36/36; `validate` OK (songs 14,910, places 923, facets); `qa/checks/data-gates.mjs`: 8 pass, 4 warn, 1 blocking fail (journeys-valid: data/journeys.json stops lack the `date`/`recordIds` fields the gate expects; a geo-agent output to regenerate after each build; `alternates[].id` maps old gyuj ids)

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
