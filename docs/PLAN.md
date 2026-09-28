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

1. `cd app && npx vercel --yes` creates the new Vercel project on first run (name
   `bartok-romania-viewer`); `npx vercel --prod` for production. Full runbook: DEPLOY.md.
2. Preview URL smoke test, then production; verify cache headers with curl; deep-link 404 test.
3. Enable the GitHub Actions deploy workflow with `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID` secrets so every push to main redeploys.

## Step 8: hand-over

README covers running the scraper, refreshing data, and redeploying. Data attribution to
HUN-REN BTK Institute for Musicology on every page. Licence for the app code and for
redistributing scraped text, images and audio remains an open decision for the owner; the
default until then is to link to the source record for audio and notation rather than
mirroring the files.

## Open decisions for the owner

1. Mirror notation images and audio, or link out to the source pages? (Legal and storage.)
2. Default view: Romania only, or all countries with Romania preselected?
3. Do we need the Hungarian-language record labels shown alongside English?
4. Project name on Vercel and a custom domain, if any.
