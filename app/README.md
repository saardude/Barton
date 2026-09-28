# Bartok / Romania viewer (app)

Vite + React 19 + TypeScript, static JSON in, no server. Specs live in `../docs/`
(FRONTEND-SPEC.md, MAP-SPEC.md, DESIGN-TOKENS.md, UI-COPY.md); the build contract is in
`../docs/DEPLOY.md`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | syncs `../data/*.json` into `public/data/<name>.<hash>.json`, then starts Vite |
| `npm run build` | sync, `tsc -b`, `vite build` into `dist/` |
| `npm run lint` / `npm run typecheck` / `npm test` | ESLint, `tsc -b --noEmit`, Vitest (jsdom) |
| `npm run gen-types` | regenerates `src/types/*.ts` from `../data/schema/*.schema.json` |
| `npm run gen-fixture` | regenerates the 40-record unit-test fixture in `src/test/fixtures/` |

Node 22 and 24 are supported (Vercel runs 24.x).

## Layout

```
src/app/         providers: catalog (load + index + search), query (URL <-> Query, derived), prefs, toast, export
src/state/       Query, URL codec, selectors, sort, normalize (pure, unit-tested)
src/data/        hydrate (slim -> schema shape), catalogIndex, MiniSearch (+ worker above 5,000 records)
src/components/  shell (TopBar, StatusBar, Footer), results, filters/, map/ (Leaflet)
src/pages/       Explorer; County, Song, Journeys, About and NotFound are stubs for now
src/i18n/en.ts   every user-facing string (UI-COPY.md keys) plus ro / hu secondary labels
src/generated/   written by scripts/sync-data.mjs (data manifest, tokens.css); not committed
```

`public/data/` and `src/generated/` are regenerated on every dev/build run; never edit them.
Fonts are self-hosted via `@fontsource` (Latin + Latin Extended subsets only).
