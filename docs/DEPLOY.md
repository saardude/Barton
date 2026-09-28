# Deploy runbook: Vercel via CLI, new project

How the Bartok Romania viewer is hosted, built and deployed. Written 2026-09-28 against
Vercel CLI 60.1.3. Architecture: ARCHITECTURE.md. Plan: PLAN.md (step 7).

## 0. TL;DR

```
# once, from a machine (or this environment) with VERCEL_TOKEN or an interactive login
cd /home/user/Barton
npx vercel@60 link --yes --project culegeri    # creates + links the project
npx vercel@60 deploy                                        # preview deployment
npx vercel@60 deploy --prod                                 # production
cat .vercel/project.json                                    # orgId / projectId for CI secrets
```

Everything is driven by `vercel.json` at the repository root. There is no server, no
environment variable and no dashboard-only setting the app depends on.

## 1. Stack decision

**Vite + React + TypeScript, built to static files. Data shipped as static JSON under
`app/public/data/`. No server.**

Why this and not Next.js:

- The product is a read-only explorer over a dataset that changes only when the scraper is
  re-run. Every page can be computed in the browser from one JSON download. There is nothing
  for a server to do at request time, so serverless functions, ISR, middleware and edge
  runtimes would be paid-for complexity with no consumer.
- A static site has one deployment artefact (`app/dist`), one cache policy, no cold starts,
  and works on any static host if we ever leave Vercel. It is also the simplest thing to reason
  about for a small team: `npm run build` locally produces byte-for-byte what is deployed.
- Vite's dev server and build are fast, and the React + TypeScript template is standard.

When Next.js (or another server-capable framework) would be needed:

- The data grows past roughly 20 MB uncompressed, or the initial payload cannot be kept under
  the 3 MB gzip budget even after splitting, and records need to be fetched individually
  through an API instead of loaded up front.
- Per-record routes must be server-rendered for SEO or link previews with real content
  (Open Graph images per song, crawlable record pages). A static SPA serves the same
  `index.html` for every path; search engines see the shell, not the record.
- Server-side features appear: authentication, user annotations or bookmarks stored
  centrally, a write API, rate-limited proxying of the source sites' audio.

If that day comes, the data layer (`useCatalog`, query codec, selectors) carries over
unchanged; only routing and data fetching move.

## 2. Repository as Vercel sees it

The Vercel project is linked at the **repository root**, not in `app/`. Reason: the build
copies `data/*.json` into `app/public/data/`, and a project whose root directory is `app/`
does not upload `../data` when deploying from the CLI. Rooting at the repository keeps
`data/` (the single source of truth) inside the deployment and avoids the "include files
outside the root directory" dashboard toggle. Note that PLAN.md step 7 says `cd app`; use
the repository root instead.

`vercel.json` (repository root) sets:

| Setting | Value | Where it lives |
| --- | --- | --- |
| Project name | `bartok-romania-viewer` | chosen at `vercel link --project ...`; dashboard afterwards |
| Root directory | `.` (repository root) | project setting; default, never changed |
| Framework preset | none (`"framework": null`) | `vercel.json` |
| Install command | `npm ci --prefix app` | `vercel.json` |
| Build command | `npm run build --prefix app` | `vercel.json` |
| Output directory | `app/dist` | `vercel.json` |
| Node.js version | 22.x | project setting (dashboard > Settings > General); 22.x is the default for new projects. `.nvmrc` covers local and CI. |

`vercel.json` values take precedence over dashboard values for install, build and output.
`.vercelignore` keeps `docs/`, `scraper/`, `.github/` and any `node_modules` out of uploads.

### vercel.json, explained

```json
{
  "framework": null,
  "installCommand": "npm ci --prefix app",
  "buildCommand": "npm run build --prefix app",
  "outputDirectory": "app/dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [ ...see the file... ]
}
```

- **SPA rewrite.** `/(.*)` to `/index.html`. Vercel checks the filesystem before applying
  rewrites, so `/assets/*`, `/data/*`, `/favicon.svg` are served as files and every other path
  (`/song/brsys-A204`, `/county/arad?genre=ballad`) gets the app shell. Deep links and
  reloads work; the router reads the URL.
- **Immutable data.** `/data/(.*)` gets `Cache-Control: public, max-age=31536000, immutable`.
  This is safe only because filenames are content-hashed: the build's sync step writes
  `songs.<sha256:8>.json` and records the name in `app/src/generated/data-manifest.ts`, which
  the bundle imports. A new dataset produces a new filename and a new bundle; the old file
  can be cached forever. Never place an un-hashed file under `public/data/`.
- **Immutable assets.** `/assets/(.*)` (Vite's hashed JS and CSS) gets the same header.
- **`index.html`** is `max-age=0, must-revalidate` so a deploy is picked up on the next load.
- **Security headers** on every path: `nosniff`, `X-Frame-Options: DENY`, a strict referrer
  policy, a Permissions-Policy that disables camera, microphone, geolocation and payment,
  HSTS, and a Content-Security-Policy. The CSP allows scripts only from the site itself,
  images from the site, the basemap tile hosts (`*.basemaps.cartocdn.com`,
  `*.tile.openstreetmap.org`) and `*.zti.hu` (notation images), media and `connect-src` from
  `*.zti.hu` (audio), inline styles (Leaflet and React set inline styles), and blob workers.
  If the map provider or a font CDN changes, update `img-src` / `font-src` / `style-src`
  in the same change; a CSP violation shows in the browser console as a blocked request.

### Build contract for app/package.json

Whoever scaffolds `app/` wires these scripts; CI and Vercel call them by name:

```json
{
  "scripts": {
    "sync-data": "node scripts/sync-data.mjs",
    "dev": "npm run sync-data && vite",
    "build": "npm run sync-data && tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

`scripts/sync-data.mjs` (about 30 lines): for each `../data/*.json`, compute sha256, copy to
`public/data/<name>.<hash8>.json` after emptying that folder, then write
`src/generated/data-manifest.ts` exporting `{ songs: '/data/songs.<hash8>.json', ... }`.
Both output folders are gitignored. It must fail with a clear message if `../data/songs.json`
is missing, so a broken checkout cannot deploy an empty site.

## 3. Prerequisites

| Requirement | Status in this environment (2026-09-28) |
| --- | --- |
| Node 22, npm 10 | Node 22.22.2, npm 10.9.7 present |
| Vercel CLI (local install, no globals) | `npm i vercel@latest` installs 60.1.3; `npx vercel --version` prints `Vercel CLI 60.1.3` |
| Registry access | `registry.npmjs.org` reachable; create-vite 9.2.1, react 19.3.0, vite 8.3.1, leaflet 1.9.4, react-leaflet 5.0.0, maplibre-gl 6.11.2, minisearch 7.2.0, vitest 5.0.2 published |
| Network access to Vercel | `api.vercel.com` and `vercel.com` reachable (the API answers 403 "missing token" without a token, which is the expected unauthenticated response) |
| Network access to the source sites | the `zti.hu` hosts reachable (needed for scraping only, not for deployment) |
| A Vercel account and token | **not present**: no `VERCEL_TOKEN` in the environment, no login |

Note on TypeScript: `npm view typescript version` returns 7.0.2. Use the version the
`create-vite` template pins rather than `latest`; do not upgrade TypeScript majors as part of
the scaffold.

## 4. Authentication

Two ways; the CLI accepts either.

- **Interactive** (a developer laptop): `npx vercel login` opens the browser or emails a
  link. Credentials are stored in the user's Vercel config directory, not in the repo.
- **Non-interactive** (this cloud environment, CI): set `VERCEL_TOKEN` and pass it as
  `--token "$VERCEL_TOKEN"` (or the CLI reads the variable itself). Create the token at
  vercel.com > Account Settings > Tokens, scope it to the team that will own the project,
  with an expiry. Never paste the token into chat, commits or docs.

Team scope: if the token belongs to a user who is a member of several teams, add
`--scope <team-slug>` to `link` (or set `VERCEL_ORG_ID`, which `pull`/`build`/`deploy` read
when a `.vercel/` folder is absent).

## 5. First deployment (new project), exact sequence

Run from the repository root. `app/` must exist and `data/songs.json` must be committed.

```
cd /home/user/Barton

# 1. Sanity: build locally exactly as Vercel will.
npm ci --prefix app && npm run build --prefix app && ls app/dist/data

# 2. Create and link the project without prompts. `--yes` accepts defaults (root ".",
#    settings from vercel.json). Creates .vercel/project.json (gitignored).
npx vercel@60 link --yes --project culegeri --token "$VERCEL_TOKEN"
#    Alternative on the first run: `npx vercel@60 --yes` creates the project named after the
#    directory ("barton") and deploys a preview in one step; rename in the dashboard later.

# 3. Preview deployment (builds on Vercel's side using vercel.json). Prints the URL.
npx vercel@60 deploy --token "$VERCEL_TOKEN"

# 4. Smoke test the preview (section 8), then promote by deploying production.
npx vercel@60 deploy --prod --token "$VERCEL_TOKEN"

# 5. Capture ids for CI secrets.
cat .vercel/project.json      # {"orgId":"team_...","projectId":"prj_..."}
```

Alternatively, build locally and upload the output instead of letting Vercel build (this is
what CI does; useful when the Vercel build image lacks something):

```
npx vercel@60 pull --yes --environment=production --token "$VERCEL_TOKEN"
npx vercel@60 build --prod --token "$VERCEL_TOKEN"        # writes .vercel/output
npx vercel@60 deploy --prebuilt --prod --token "$VERCEL_TOKEN"
```

Useful afterwards: `npx vercel ls` (deployments), `npx vercel inspect <url>`,
`npx vercel rollback` (previous production), `npx vercel promote <url>` (make a preview
production without rebuilding), `npx vercel domains add <domain>` (custom domain; the owner
decides, see PLAN.md open decisions).

## 6. Environment variables

- **The app needs none.** Everything is static; there are no keys (the chosen tile providers
  need no API key). Do not add `VITE_*` variables unless a provider with a key is chosen; if
  one is, it is public in the bundle by design, so restrict it by referrer on the provider.
- **CI needs three repository secrets** (GitHub > Settings > Secrets and variables > Actions):
  `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`orgId` from `.vercel/project.json`), `VERCEL_PROJECT_ID`
  (`projectId` from the same file). With `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set, the
  CLI does not need a `.vercel/` folder, which is why the runner never runs `vercel link`.

## 7. GitHub Actions

Two workflows are in `.github/workflows/`.

**`deploy.yml`**

- `push` to `main` and `workflow_dispatch`: job `production`. Steps: checkout, Node 22 from
  `.nvmrc`, `vercel pull --environment=production`, `vercel build --prod` (runs the
  `vercel.json` install and build commands on the runner), writes the gzip size of each
  `data/*.json` to the job summary, then `vercel deploy --prebuilt --prod`. The deployment URL
  is exposed as the job's environment URL.
- `pull_request` from a branch of this repository: job `preview`. Same steps with
  `--environment=preview --git-branch=<head>` and no `--prod`; the preview URL is posted as a
  PR comment (updated in place on later pushes). Forked PRs are skipped because secrets are
  not exposed to them.
- The CLI is pinned to `vercel@60` via `npx --yes`; bump deliberately.
- Concurrency cancels superseded runs per ref, so rapid pushes do not queue deployments.

**`ci.yml`** (push to `main`, every pull request, manual)

- `app`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, then a
  budget check that fails if any `dist/data/songs.*.json` exceeds 3 MB gzip and warns if the
  JS total exceeds 300 KB gzip.
- `scraper`: `npm ci`, `npm run lint --if-present`, `npm test` (node --test over fixtures;
  no network).
- `data-gates`: `node qa/checks/data-gates.mjs` on `data/songs.json` (falls back to the QA
  fixture until the first real dataset is committed).
- The `app` and `scraper` jobs skip themselves with a notice while their `package-lock.json`
  does not exist, so the workflow can be enabled before the app is scaffolded.

Recommended branch protection on `main`: require `CI / App`, `CI / Scraper (tests)` and
`CI / Data quality gates`; `Deploy / Production` only runs after merge.

## 8. Post-deploy verification

```
URL=https://culegeri.vercel.app     # or the preview URL
curl -sI "$URL/"                              | grep -iE 'cache-control|content-security|x-frame'
curl -sI "$URL/song/anything"                 | grep -iE '^HTTP|content-type'   # 200 text/html (SPA)
curl -sI "$URL/data/$(curl -s $URL/ | grep -o 'songs\.[a-f0-9]*\.json' | head -1)" | grep -i cache-control  # immutable
curl -s "$URL/data/does-not-exist.json" -o /dev/null -w '%{http_code}\n'        # 200 (SPA shell) is expected
```

Then in a browser: load `/`, apply filters, copy the URL, open it in a private window (state
restores), open a record, check the console for CSP violations, check the map attribution is
visible, run Lighthouse (QA-PLAN targets: performance >= 90, accessibility >= 95).

## 9. What must be true in this cloud environment before deploying from it

1. **Network access.** The environment's network policy must allow `api.vercel.com`,
   `vercel.com` and `*.vercel.app` (deploy and smoke test), and for scraping the source hosts
   `bartok-nepzene.zti.hu`, `systems.zti.hu`, `sys.zti.hu`, `bartok-gyujtesek.zti.hu`,
   `db.zti.hu`. As of 2026-09-28 the environment has this access (verified: `api.vercel.com`
   and `vercel.com` respond; `bartok-nepzene.zti.hu` returns 200). If a future session is
   denied, the setting is in the cloud environment menu in the session title bar > Edit >
   Network access: add the hosts to the allowed domains or choose a broader access level.
2. **`VERCEL_TOKEN` as an environment secret.** Not set today. Add it in the same environment
   editor (API credentials section where offered, otherwise as an environment variable named
   `VERCEL_TOKEN`); a new session picks it up. Until then no `login`, `link` or `deploy` is
   run from here; the CLI itself is verified (`npx vercel --version` works).
3. `app/` scaffolded with the build contract above and `data/songs.json` committed.

GitHub Actions has unrestricted egress, so once the three repository secrets exist the
workflows deploy regardless of this environment's policy.

## 10. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `curl: (56) CONNECT tunnel failed, response 403` or the CLI hangs on `api.vercel.com` | Egress denied by the environment network policy; see section 9, item 1 |
| `Error: No existing credentials found. Please run 'vercel login' or pass "--token"` | `VERCEL_TOKEN` missing; section 4 |
| `Error: Your codebase isn't linked to a project on Vercel` | Run `vercel link --yes --project ...`, or set `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` |
| Build fails: `sync-data: ../data/songs.json not found` | The dataset is not committed or `.vercelignore` excludes it; `data/` must be in the upload |
| Build fails: `npm ci` lockfile mismatch | Regenerate `app/package-lock.json` with npm 10 and commit it |
| Deep link returns 404 | `rewrites` missing or `cleanUrls` interplay; confirm `vercel.json` is at the linked root |
| Old data after a deploy | A file under `public/data/` was written without a content hash; fix `sync-data` |
| CSP blocks tiles, images or audio | Provider host not in `img-src` / `media-src` / `connect-src`; update `vercel.json` |
| `vercel build` fails on the runner but works locally | Node version differs; `.nvmrc` is 22, project setting should be 22.x |

## Project as created on 2026-09-28

| Setting | Value |
| --- | --- |
| Vercel team (scope) | Tutti (`tutti3`, org id `team_pxirNsKcxcCK1zYdohIdOxc2`) |
| Project | `culegeri` (renamed from `bartok-romania-viewer` on 2026-09-28; project id `prj_x46xY2sd0ramFgQcPUa57zu1QdGy`) |
| Linked from | repository root (`.vercel/project.json`, git-ignored) |
| Node version (project setting) | 24.x at creation; the repo pins 22 in `.nvmrc` and CI, change the project setting to 22.x in the dashboard or leave both on 24 |
| Deployments so far | none |

For GitHub Actions set the repository secrets `VERCEL_TOKEN` (a token scoped to the Tutti team), `VERCEL_ORG_ID` = the org id above, `VERCEL_PROJECT_ID` = the project id above. The ids are identifiers, not secrets, but they are kept out of the workflow file so the same workflow works for a fork.

The account has no personal (Hobby) scope, so the project had to live in a team. If the academic project should be separated from the Tutti workspace, create a new team in the Vercel dashboard, transfer the project to it (Project Settings, General, Transfer), and re-run `npx vercel link --yes --project culegeri --scope <new-team>` here.

## Static deploy of a local build (used for the first live deployment, 2026-09-28)

`scripts/deploy-dist.sh` uploads `app/dist` as a static production deployment with the
root `vercel.json` rewrites and headers, and install/build disabled. It exists because
uploading the whole repository (40 MB raw catalogue) aborted through the cloud proxy, and
because the project-level install command (`npm ci --prefix app`) is applied even to
prebuilt uploads unless the deployed `vercel.json` sets `installCommand` to an empty
string. Sequence: `cd app && npm run build && cd .. && scripts/deploy-dist.sh`.
Verified on the first run: `/` serves the app, `/data/songs.<hash>.json` returns 200 with
`cache-control: public, max-age=31536000, immutable`.
