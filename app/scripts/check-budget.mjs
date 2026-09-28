// Performance budget over dist/ (ARCHITECTURE.md, QA-PLAN section 6, .github/workflows/ci.yml):
//   fail  if any JS chunk        > 300 KB gzip   (BUDGET_JS_CHUNK_KB)
//   fail  if the songs data file > 3 MB gzip     (BUDGET_SONGS_MB)
//   warn  if all JS together     > 300 KB gzip   (the CI workflow warns on the same total)
// Run after `npm run build`: `npm run check-budget` (or `--dir=dist-e2e`). Exit code 1 on a failed budget.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const dirArg = process.argv.find((a) => a.startsWith('--dir='))?.slice(6)
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', dirArg ?? process.env.BUDGET_DIST ?? 'dist')
const JS_CHUNK_KB = Number(process.env.BUDGET_JS_CHUNK_KB ?? 300)
const JS_TOTAL_KB = Number(process.env.BUDGET_JS_TOTAL_KB ?? 300)
const SONGS_MB = Number(process.env.BUDGET_SONGS_MB ?? 3)

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'
let failed = false
const fail = (msg) => {
  failed = true
  console.error(`FAIL  ${msg}`)
}

let assets
try {
  assets = readdirSync(join(dist, 'assets'))
} catch {
  console.error(`check-budget: ${dist}/assets not found; run npm run build first`)
  process.exit(1)
}

console.log('JS chunks (gzip -9):')
let jsTotal = 0
for (const f of assets.filter((x) => x.endsWith('.js')).sort()) {
  const size = gz(join(dist, 'assets', f))
  jsTotal += size
  const over = size > JS_CHUNK_KB * 1024
  console.log(`  ${over ? '!!' : '  '} ${kb(size)}  ${f}`)
  if (over) fail(`${f} is ${kb(size).trim()} gzip, over the ${JS_CHUNK_KB} KB per-chunk budget`)
}
console.log(`  total JS ${kb(jsTotal).trim()} gzip (budget ${JS_TOTAL_KB} KB${jsTotal > JS_TOTAL_KB * 1024 ? ', WARNING: over' : ''})`)

console.log('Data files (gzip -9):')
const dataDir = join(dist, 'data')
for (const f of readdirSync(dataDir).filter((x) => x.endsWith('.json')).sort()) {
  const p = join(dataDir, f)
  const raw = statSync(p).size
  const size = gz(p)
  const isSongs = f.startsWith('songs.')
  const over = isSongs && size > SONGS_MB * 1048576
  console.log(`  ${over ? '!!' : '  '} ${kb(size)}  ${f}  (raw ${(raw / 1048576).toFixed(2)} MB)`)
  if (over) fail(`${f} is ${(size / 1048576).toFixed(2)} MB gzip, over the ${SONGS_MB} MB budget`)
}

const css = assets.filter((x) => x.endsWith('.css')).reduce((n, f) => n + gz(join(dist, 'assets', f)), 0)
console.log(`CSS total ${kb(css).trim()} gzip`)

if (failed) {
  console.error('check-budget: budget exceeded')
  process.exit(1)
}
console.log('check-budget: ok')
