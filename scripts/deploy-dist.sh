#!/usr/bin/env bash
# Deploy the already-built app (app/dist) to Vercel as a static production deployment.
# Use when uploading the whole repository is too slow or the remote build is not wanted.
# Requires: `cd app && npm run build` done, a Vercel login or VERCEL_TOKEN, and .vercel/project.json at the repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
[ -d "$ROOT/app/dist" ] || { echo "app/dist missing: run 'cd app && npm run build' first" >&2; exit 1; }
cp -r "$ROOT/app/dist/." "$STAGE/"
mkdir -p "$STAGE/.vercel"
# Only the project link, not the pulled project settings (those carry install/build commands).
node -e 'const p=require(process.argv[1]);const o={projectId:p.projectId,orgId:p.orgId,projectName:p.projectName};require("fs").writeFileSync(process.argv[2],JSON.stringify(o))' "$ROOT/.vercel/project.json" "$STAGE/.vercel/project.json"
# Root vercel.json minus build settings: keep rewrites, headers, cleanUrls; disable install and build.
node -e 'const c=require(process.argv[1]);for(const k of ["git"])delete c[k];c.framework=null;c.installCommand="";c.buildCommand="";c.outputDirectory=".";require("fs").writeFileSync(process.argv[2],JSON.stringify(c,null,2))' "$ROOT/vercel.json" "$STAGE/vercel.json"
cd "$STAGE"
export NODE_USE_ENV_PROXY=${NODE_USE_ENV_PROXY:-1} NODE_NO_WARNINGS=1
exec npx --prefix "$ROOT" vercel deploy --prod --yes "$@"
