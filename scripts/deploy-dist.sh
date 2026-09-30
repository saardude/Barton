#!/usr/bin/env bash
# Deploy the whole site (both collections) to Vercel as a static production deployment.
#
#   scripts/deploy-dist.sh              build both apps with scripts/build-site.mjs, then upload app/dist
#   scripts/deploy-dist.sh --no-build   upload the existing app/dist (it is still checked)
#   scripts/deploy-dist.sh --force      skip the "checkout is up to date with origin" check
#
# Requires a Vercel login or VERCEL_TOKEN, and .vercel/project.json at the repo root.
# The upload is refused when app/dist/australia/index.html is missing or vercel.json lacks the
# /australia rewrite, so a build of the Bartok app alone can never replace the live site
# (that happened on 2026-09-30; see docs/DEPLOY.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD=1
FORCE=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --no-build) BUILD=0 ;;
    --force) FORCE=1 ;;
    *) ARGS+=("$a") ;;
  esac
done

# 1. The checkout must be the tip of the deployed branch, not a stale clone.
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"
if [ "$FORCE" = 0 ]; then
  git -C "$ROOT" fetch -q origin "$BRANCH" || { echo "deploy-dist: cannot fetch origin/$BRANCH; use --force to deploy anyway" >&2; exit 1; }
  LOCAL="$(git -C "$ROOT" rev-parse HEAD)"
  REMOTE="$(git -C "$ROOT" rev-parse "origin/$BRANCH")"
  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "deploy-dist: $BRANCH is at ${LOCAL:0:7} but origin/$BRANCH is at ${REMOTE:0:7}; pull first (or --force)" >&2
    exit 1
  fi
  if [ -n "$(git -C "$ROOT" status --porcelain -- app australia vercel.json scripts)" ]; then
    echo "deploy-dist: uncommitted changes under app/, australia/, vercel.json or scripts/; commit or stash them (or --force)" >&2
    exit 1
  fi
fi

# 2. Build both collections (app/dist + app/dist/australia).
if [ "$BUILD" = 1 ]; then
  node "$ROOT/scripts/build-site.mjs"
fi

# 3. Refuse an incomplete tree.
[ -f "$ROOT/app/dist/index.html" ] || { echo "deploy-dist: app/dist/index.html missing; run node scripts/build-site.mjs" >&2; exit 1; }
[ -f "$ROOT/app/dist/australia/index.html" ] || { echo "deploy-dist: app/dist/australia/index.html missing; the Australia app was not built (use scripts/build-site.mjs, not 'npm run build' in app/)" >&2; exit 1; }
grep -q '"/australia/((?!data/|assets/).*)"' "$ROOT/vercel.json" || { echo "deploy-dist: vercel.json has no /australia rewrite; this checkout predates the Australia collection" >&2; exit 1; }
ls "$ROOT/app/dist/australia/data"/songs.*.json >/dev/null 2>&1 || { echo "deploy-dist: app/dist/australia/data has no songs file" >&2; exit 1; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp -r "$ROOT/app/dist/." "$STAGE/"
mkdir -p "$STAGE/.vercel"
# Only the project link, not the pulled project settings (those carry install/build commands).
node -e 'const p=require(process.argv[1]);const o={projectId:p.projectId,orgId:p.orgId,projectName:p.projectName};require("fs").writeFileSync(process.argv[2],JSON.stringify(o))' "$ROOT/.vercel/project.json" "$STAGE/.vercel/project.json"
# Root vercel.json minus build settings: keep rewrites, headers, cleanUrls; disable install and build.
node -e 'const c=require(process.argv[1]);for(const k of ["git"])delete c[k];c.framework=null;c.installCommand="";c.buildCommand="";c.outputDirectory=".";require("fs").writeFileSync(process.argv[2],JSON.stringify(c,null,2))' "$ROOT/vercel.json" "$STAGE/vercel.json"
echo "deploy-dist: uploading $(du -sh "$STAGE" | cut -f1) from $BRANCH @ $(git -C "$ROOT" rev-parse --short HEAD) (with /australia)"
cd "$STAGE"
export NODE_USE_ENV_PROXY=${NODE_USE_ENV_PROXY:-1} NODE_NO_WARNINGS=1
exec npx --prefix "$ROOT" vercel deploy --prod --yes "${ARGS[@]+"${ARGS[@]}"}"
