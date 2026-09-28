# Build plan: Bartók Romania field-collection viewer

Status: planning and pre-scrape complete; scraping blocked on network access (see Step 0).
Companion docs: CONTEXT.md (brief), DATA-SCHEMA.md, SCRAPER.md, ARCHITECTURE.md,
FRONTEND-SPEC.md, DESIGN-TOKENS.md, MAP-SPEC.md, UI-COPY.md, QA-PLAN.md,
ACCEPTANCE-CRITERIA.md, DEPLOY.md.

## Team and ownership

| Role | Owns | Produced in this phase |
| --- | --- | --- |
| Orchestrator / product | scope, sequencing, sign-off, commits | this plan, CONTEXT.md, wireframe |
| Data engineer | `scraper/`, `data/`, schema, gazetteer | schema, scraper framework, tests, gazetteer seed |
| System engineer | stack, repo hygiene, CI, Vercel | DEPLOY.md, ARCHITECTURE.md, workflows, README |
| Front-end designer | `app/` UI, tokens, map | FRONTEND-SPEC.md, DESIGN-TOKENS.md, MAP-SPEC.md, UI-COPY.md |
| QA | gates, tests, acceptance | QA-PLAN.md, ACCEPTANCE-CRITERIA.md, `qa/checks/` |

## What the sources actually are

Neither site is a "Romanian collection" database. Site 1 (Folk Music in Bartók's
Compositions) documents the folk sources behind Bartók's own works, with a locality map.
Site 2 (The Bartók System) is his Hungarian folk-song classification, 13,000+ melodies, where
Romanian, Slovak and other collections are listed without melodic search. A third site found
during research, bartok-gyujtesek.zti.hu (Béla Bartók, the Ethnomusicologist), has
browseable record pages and is the most likely home of the Romanian field material. The
scraper covers all three; the viewer filters to present-day Romania by default and keeps a
country switch so nothing is thrown away.

## Step 0: unblock the network (user action, 5 minutes)

In this cloud environment's settings (title bar > environment menu > Edit > Network access)
add these hosts to the allowed domains, or choose a broader access level:

- `bartok-nepzene.zti.hu`, `systems.zti.hu`, `sys.zti.hu`, `bartok-gyujtesek.zti.hu`,
  `db.zti.hu`, `zti.hu` (scraping)
- `api.vercel.com`, `vercel.com` (deployment)

Then add `VERCEL_TOKEN` as an environment secret (Vercel dashboard > Account > Tokens).
Without Step 0 nothing after Step 2 can run from this environment.

## Step 1: confirm selectors (data engineer, 1 hour after Step 0)

1. `cd scraper && npm i`
2. `node src/cli.js probe https://bartok-nepzene.zti.hu/en/browse/` and one record page per
   site; read the printed DOM outline.
3. Fix the `SELECTORS` block at the top of each `src/sites/*.js`; update the fixtures in
   `scraper/fixtures/` to real saved pages (trimmed); `npm test` green.

## Step 2: crawl, parse, build the JSON (data engineer, 2 to 6 hours wall clock)

1. `node src/cli.js crawl fmbc`, `crawl bsys`, `crawl gyujtesek` (1 request/s, cached on disk,
   resumable).
2. `node src/cli.js parse <site>` for each; `node src/cli.js build` writes `data/songs.json`,
   `data/places.json`, `data/facets.json`.
3. `node qa/checks/data-gates.mjs` must pass all blocking gates; review the warning lists
   (unresolved places, out-of-range years) and extend `data/gazetteer.json` until >= 95 % of
   Romanian-locality records resolve to a modern county with coordinates.
4. Commit the data with a `data/BUILD.md` stamp (date, counts per site, gate report).

## Step 3: scaffold the app (system engineer, 1 hour)

1. `npm create vite@latest app -- --template react-ts`; add ESLint, Prettier, Vitest,
   Playwright, `app-tokens/tokens.css`.
2. `vercel.json` (SPA rewrite, cache headers), `.github/workflows/ci.yml` and `deploy.yml`
   are already written; wire the app's scripts to them.
3. Build step copies `data/*.json` into `app/public/data/` with a content hash in the filename.

## Step 4: data layer and state (front-end, 1 day)

1. Types generated from `data/schema/*.schema.json` (json-schema-to-typescript).
2. `useCatalog()` loads songs.json once; indexes (by id, by county, by village, search index)
   built in a web worker when > 5k records.
3. `Query` <-> URL codec exactly as FRONTEND-SPEC.md; selectors for filtered set, facet
   counts, place tree, map points; the five sort comparators.
4. Unit tests from QA-PLAN.md: round trip, filters, facets, sorts, place tree.

## Step 5: screens (front-end, 2 to 3 days)

Build in this order so each screen is usable as soon as it lands:

1. Explorer shell: top bar, filter rail (place tree, genre, style/performance, instrument,
   year), results list with sort and chips, status bar with the query string.
2. Map: Leaflet + OSM tiles, county bubbles, village dots, hover card, click to narrow;
   SVG fallback for county level.
3. Song record: header, notation image (zoomable), audio, text, related, metadata rail,
   Raw JSON tab, prev/next within the filtered set.
4. County drill-down: header stats, villages table, tabs, melodies table.
5. Phone layout: filter sheet, compact map, list, bottom tabs.
6. Export JSON of the current filtered set; attribution footer on every screen.

## Step 6: QA pass (QA, 1 day, overlaps Step 5)

1. Vitest suite green; Playwright journeys green on desktop and 390 px viewport.
2. axe-core clean on all four screens; Lighthouse performance >= 90, accessibility >= 95.
3. Walk ACCEPTANCE-CRITERIA.md; log gaps as issues; manual checklist signed.

## Step 7: deploy (system engineer, 30 minutes)

1. From the repository root (not `app/`, because the build copies `data/*.json` into the app):
   `npx vercel link --yes --project bartok-romania-viewer`, then `npx vercel` for a preview and
   `npx vercel --prod` for production. `vercel.json` at the root sets the app build. Full
   runbook: DEPLOY.md.
2. Preview URL smoke test, then production; verify cache headers with curl; deep-link 404 test.
3. Enable the GitHub Actions deploy workflow with `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID` secrets so every push to main redeploys.

## Step 8: hand-over

README covers running the scraper, refreshing data, and redeploying. Data attribution to
HUN-REN BTK Institute for Musicology on every page. Licence for the app code and for
redistributing scraped text, images and audio remains an open decision for the owner; the
default until then is to link to the source record for audio and notation rather than
mirroring the files.

## Journey mapper (scope added 2026-09-28)

Goal: pick a date or a trip and see where Bartók departed from, where he went, in what order,
what the borders looked like then and now, the villages' names then and now, and whether each
village still exists, with a strip of sourced geopolitical context alongside.

Data (geo engineer): `data/journeys.json` derived from dated records (collector = Bartók,
sorted by date, split at gaps > 10 days; departure defaults to Budapest and is labelled
"assumed"); `data/geo/borders-1910|1914|1920|now.json` from open historical GIS datasets
(historical-basemaps, GISta Hungarorum 1910 counties, Natural Earth), simplified for the web;
`data/villages.json` from Wikidata (status existing / renamed / merged / abandoned / unknown,
with evidence); `data/context-events.json`, a hand-curated, cited list of border changes,
publications, Bartók's own statements on nationalism and folk music, and press reception.
The context layer presents sources; it does not editorialise. Spec: docs/JOURNEY-SPEC.md,
sources and attribution: docs/GEO-SOURCES.md.

UI (front-end): a Journeys screen (wireframe artboard 5): timeline of trips with the 1914 and
1920 markers, route map with numbered stops, then/now border toggle and comparison slider,
stop list with name-then to name-now and status badge, context strip with citations. Spec
additions in FRONTEND-SPEC.md, MAP-SPEC.md, UI-COPY.md.

Build steps: after Step 4 add "Step 4b: journeys derivation + geo layers" and after Step 5
add "Step 5b: Journeys screen"; QA adds acceptance criteria AC-36 onwards (trip split rule,
border year auto-selection by trip date, village status badges, citations visible).

Data-gate note (from QA): the 95 % county-resolution gate applies to records whose locality is
in present-day Romania, not to the 13,000 Hungarian records of the Bartók System.

## Romanian repertoire from print (scope added 2026-09-28)

Finding: the online databases hold no records of Bartók's Romanian melodies; the "Rumanian
Folk Music" system is named but not published. The printed edition (ed. Suchoff, Nijhoff
1967-1975) is on the Internet Archive. Volumes 4 (Carols and Christmas Songs) and 5
(Maramureș County) are open items with Archive-generated OCR; volumes 1 (Instrumental) and 2
(Vocal Melodies) are restricted lending items and are not used.

Pipeline (print-source engineer): `print/` fetches the open volumes' OCR text, parses the
melody entries (number, locality with Hungarian name and historical county, performer, date,
class or category) into `data/rfm.json` in the song schema, with `source.url` pointing at the
exact scanned page and `genre` populated (colinda for vol. 4; mapped categories for vol. 5).
Only facts and incipits are indexed; song texts and notation are not republished. Spec and
counts: docs/PRINT-SOURCES.md. The build merges `data/rfm.json` into `songs.json` as site
`rfm`, and the viewer's Romania view shows them alongside the database records.

## Decisions log

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | URL params: comma lists (`genre=colinda,joc`), place params carry schema path ids (`county=ro/crisana/bihor`) | Matches QA tests; ids are stable across renames |
| D2 | `county` and `performance` are single-valued; villages, genres, styles, instruments are multi | The place tree is a drill-down; QA to adjust AC-03 and AC-07 |
| D3 | Default is all countries (no `country` param); Romania is the first option in the country switch. Superseded the earlier Romania-only default on owner feedback 2026-09-28 | The map with no selection must show every collection point |
| D4 | History: pushState for filter changes, replaceState while typing in search | Back button restores filters (AC-22); ARCHITECTURE.md updated to match |
| D5 | Fonts self-hosted via `@fontsource/ibm-plex-sans` and `-mono`; no Google Fonts in the app | Keeps the CSP tight and works offline |
| D6 | Tiles: CARTO Positron with OpenStreetMap fallback | Quieter base under data; both already in the CSP |
| D7 | Map markers are accessible `<button>` divIcons; switch to canvas only above ~2,000 visible markers | Keyboard and screen-reader access first |
| D8 | Source link text priority: referenceCode, then system position, then site + number; always links to `source.url` | Academic integrity requirement |
| D9 | Style sort uses collator order on the verbatim style string | No controlled vocabulary for style in the sources |
| D10 | UI in English; Romanian and Hungarian shown as secondary labels for facets, genres and place names | Wireframe language; sources are HU/RO |
| D12 | The project is non-commercial and academic only. The site is publicly readable; any management or editing functions (corrections, annotations, curation) are gated to scholars. CC BY-NC border data and the GPL-licensed basemaps are acceptable on that basis; the app shows their attribution. | Owner decision 2026-09-28 |
| D11 | Crawl of systems.zti.hu proceeds with `--ignore-robots` at the owner's instruction, 1 req/s, cached | Owner decision 2026-09-28; recommend requesting an export from ZTI |

## Open decisions for the owner

1. Mirror notation images and audio, or link out to the source pages? (Legal and storage.)
2. Default view: Romania only, or all countries with Romania preselected?
3. Do we need the Hungarian-language record labels shown alongside English?
4. Project name on Vercel and a custom domain, if any.
6. Scholar-gated management: which functions need a login (corrections to place resolution, annotations, flagging OCR errors), and who administers accounts. Phase 2; the read-only site needs no auth.
5. Journey split rule (10-day gap) and the assumed Budapest departure: confirm or adjust.
