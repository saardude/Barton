# Culegeri

A static, JSON-driven web app for exploring Bela Bartok's ethnographic field
collection with a focus on localities in present-day Romania. Browse by
country, region, county and village on a map; filter by genre, style,
performance, instrument and year; open a full record with notation image,
audio where available, text and raw metadata.

There is no server. A scraper produces JSON files, the app ships them as
static assets, and everything (search, facets, map) runs in the browser.

## Layout

```
docs/      brief, plan, data schema, scraper and frontend specs, QA, deploy runbook
scraper/   Node scraper + normaliser (package.json, src/, fixtures/, tests/)
data/      scraper output: songs.json, places.json, facets.json; schema/*.schema.json
app/       the web app (Vite + React + TypeScript)
vercel.json, .github/workflows/   hosting and CI configuration
```

Start with `docs/CONTEXT.md`, then `docs/ARCHITECTURE.md`.

## Requirements

Node 22 (see `.nvmrc`) and npm 10. No global packages; each of `scraper/` and
`app/` has its own `package.json`.

## Run the scraper

```
cd scraper
npm ci
npm test            # runs against recorded fixtures, no network
npm run scrape      # needs network access to the zti.hu hosts
```

Output is written to `data/` deterministically (sorted keys, stable ids), so
re-runs produce clean diffs.

## Run the app

```
cd app
npm ci
npm run dev         # copies data/*.json into app/public/data, starts Vite
npm run build       # production build in app/dist
```

## Deploy

Hosted on Vercel as a static site. The full runbook, including the GitHub
Actions workflows and what has to be enabled in the cloud environment first,
is in `docs/DEPLOY.md`.

## Data attribution

All source material comes from databases run by the HUN-REN BTK Institute for
Musicology, Budapest (Zenetudomanyi Intezet): "Folk Music in Bartok's
Compositions" (bartok-nepzene.zti.hu), "The Bartok System" (systems.zti.hu)
and "Bela Bartok, the Ethnomusicologist" (bartok-gyujtesek.zti.hu). Notation
images and audio remain the property of the Institute and are referenced, not
redistributed. Please cite the Institute when using anything derived from this
project.

## Licence

Licence to be decided by the owner. No LICENSE file is included yet; until one
is added, all rights are reserved.
