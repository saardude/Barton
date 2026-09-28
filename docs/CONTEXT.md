# Project context: Bartók Romania field-collection viewer

Shared brief for everyone working on this repository. Read this before anything else.

## Goal

A static, JSON-driven web app that lets a user explore Béla Bartók's ethnographic field
collection with a focus on Romania: browse by country → region → county → village on a map,
filter by genre / style / performance / instrument / year, sort by song title, style, location,
year or source number, and open a full record (notation image, audio where available, text,
metadata, raw JSON). Hosted on Vercel, deployed with the Vercel CLI.

A wireframe already exists (private artifact, four artboards: Explorer, County drill-down,
Song record, Phone explorer). Its structure:

- **Explorer**: left filter rail (place tree, genre checkboxes, style/performance chips,
  instrument chips, year range), centre map of Romania with dots sized by count and a hover
  card per county, right results list with sort dropdown and active-filter chips, status bar
  showing the shareable query string.
- **County drill-down**: county header with counts, villages table (name, melodies, genre bar,
  year), tabs (melodies / by genre / by performer / timeline / local map), sortable melodies table.
- **Song record**: title + incipit, genre/performance chips, notation image, audio player, text,
  related melodies, right rail with Where / Who-when / Music / Source, Raw JSON tab.
- **Phone explorer**: search + filter sheet, small map, list, bottom tabs.

Visual language: greyscale wireframe, ground `#f4f2ec`, ink `#1c1b18`, one accent `#b5502e`,
IBM Plex Sans body, IBM Plex Mono for annotations/codes.

## Data sources (all run by HUN-REN BTK Institute for Musicology, Budapest)

1. `https://bartok-nepzene.zti.hu/en/` — "Folk Music in Bartók's Compositions". Folk sources of
   Bartók's works. Known pages from search-engine listings: `/en/browse/`, `/en/search/`,
   `/en/map`. Record "Folk Music Source" tab lists: reference code, place and date of the
   recording, collector, informant name and age, performance, ethnicity of informant, remarks,
   phonograph recording where available.
2. `https://systems.zti.hu/br/en` (alias `sys.zti.hu`) — "The Bartók System", Bartók's complete
   Hungarian folk-song collection, >13,000 melodies. Pages seen in listings: `/br/en/search`
   (`?sys=A+204` style queries), `/br/en/browse/<id>/`, `/br/en/history`. Record cards carry
   locality (collection place / informant origin, shown "A / B"), date, informant, collector,
   position in the Bartók System, text incipit, line-ending cadences, rhythm tables, audio.
   Romanian, Slovak, Serbian, Turkish and Arabic collections are "indicated in the list" but
   without melodic search results.
3. Discovered in passing, likely relevant: `https://bartok-gyujtesek.zti.hu/en` ("Béla Bartók,
   the Ethnomusicologist"), with record pages like `/en/browse/21/5398`. Older ASP database:
   `http://db.zti.hu/nza/br_en.asp`.

Important nuance for the plan: neither site is a dedicated "Romanian collection" database.
Romanian material appears as localities in what is now Romania (Transylvania, Banat, Bihor,
Maramureș, etc.), often under historical Hungarian county and place names. The viewer must
hold both historical and modern names and derive the modern country from the modern county.

## Environment facts (as of 2026-09-28)

- The container's egress proxy **blocks** every `*.zti.hu` host, `web.archive.org`, and
  `api.vercel.com`. Do not keep retrying them; one probe at most. Scraping and deployment run
  only after the user adds those hosts to the environment's allowed domains.
- `registry.npmjs.org` is reachable. Node 22.22, npm 10.9, Python 3 available. No Vercel CLI
  installed and no `VERCEL_TOKEN` set.
- Repo: `/home/user/Barton`, branch `claude/bartok-ethnographic-viewer-kvjt8j`, currently empty
  apart from `docs/`.

## Repository layout (agreed)

```
docs/          plans and specs (this file, PLAN.md, DATA-SCHEMA.md, SCRAPER.md,
               FRONTEND-SPEC.md, QA-PLAN.md, DEPLOY.md)
scraper/       Node scraper + normaliser (package.json, src/, fixtures/, tests/)
data/          outputs: songs.json, places.json, facets.json; schema/*.schema.json
app/           the web app (Vite + React + TypeScript), added in the build phase
```

## Conventions

- Plain ASCII punctuation in code and docs; no em-dashes.
- Everything the scraper writes is deterministic and diffable (sorted keys, stable ids).
- Do not commit; the orchestrator commits. Do not create pull requests.
- Do not install global packages; use local `npm i` inside `scraper/` or `app/`.
