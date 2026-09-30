# Culegeri Australia

**Australian folk songs and poems, by place, paper and year.**
Live site: https://culegeri.vercel.app/australia

A second collection built on the Culegeri model: a polite crawler, a normaliser that writes
deterministic JSON, and a static explorer with a map, filters, a record page and a sources page.
The source is Mark Gregory's *Australian Folk Songs* (https://folkstream.com/, online since
1994): about 1,100 songs and poems, most of them rediscovered in digitised Australian newspapers
on the National Library's Trove, each with lyrics, notes and a link to the article.

Where Bartók's records carry structured fields (genre, performer, village), these pages carry
prose. The normaliser reads provenance from the notes by explicit patterns only (the newspaper
cited, its date and page, songbooks, singers, collectors), and the map shows where each
newspaper was published, resolved through Wikidata, GeoNames and a curated table. What is
derived is marked as such, and every record links back to its page.

## Layout

```
australia/
  scraper/   crawler (1 req/s, on-disk cache), parser, normaliser, build, validate; tests + fixtures
  data/      songs.json, places.json, facets.json, sources.json, newspapers.json (gazetteer),
             newspapers-overrides.json (curated), schema/
  geo/       resolve-newspapers.mjs: Wikidata + GeoNames + overrides -> data/newspapers.json
  qa/        data-gates.mjs, run in CI on the committed dataset
  app/       Vite + React + TypeScript viewer, served under /australia/ (base path in vite.config.ts)
  docs/      STATUS.md (crawl and coverage), DATA.md (record shape and heuristics)
```

## Running it

Node 22 and npm 10. Each package installs its own dependencies.

```
# the app, against the committed data
cd australia/app && npm ci && npm run dev          # http://localhost:5173/australia/

# checks
cd australia/app && npm run lint && npm run typecheck && npm test && npm run test:e2e
cd australia/scraper && npm ci && npm test && npm run validate
node australia/qa/checks/data-gates.mjs

# rebuild the dataset (network needed for a fresh crawl; the cache makes re-runs offline)
cd australia/scraper && npm ci
node src/cli.js crawl --probe-gaps      # songs.html -> every record page -> ancillary pages
node src/images.js                      # image sizes (notation scan vs newspaper masthead)
node src/cli.js parse && node src/cli.js build && node src/cli.js validate
cd ../geo && node resolve-newspapers.mjs   # needs geo/cache/AU.txt from the GeoNames AU.zip
cd ../scraper && node src/cli.js build     # again, now with the gazetteer
```

The whole site (both collections) is built by `node scripts/build-site.mjs` at the repository
root, which is what `vercel.json` runs; the Australia app lands in `app/dist/australia/`.

## Sources and attribution

Records: Mark Gregory, *Australian Folk Songs*, https://folkstream.com/. Lyrics, notes, images,
MIDI and MP3 files remain his; the viewer indexes text and metadata and shows media from his
site. Newspaper articles: National Library of Australia, Trove. Newspapers and places: Wikidata
(CC0), GeoNames (CC BY 4.0). Map tiles: © OpenStreetMap contributors, © CARTO.

Licence: academic use only, as for the rest of the repository (see ../LICENSE).
