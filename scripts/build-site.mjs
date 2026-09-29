#!/usr/bin/env node
// Builds both collections into one static tree for Vercel:
//   app/dist/            the Bartok Romania viewer (site root)
//   app/dist/australia/  the Australian Folk Songs viewer (served under /australia/)
// Each app keeps its own package.json, build and tests; this only sequences the two builds and
// copies the second into the first's output. Run from the repository root:
//   node scripts/build-site.mjs        (what vercel.json's buildCommand runs)
import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const run = (cmd, cwd) => {
  console.log(`\n$ ${cmd}  (${cwd})`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

run('npm run build', join(root, 'app'))
run('npm run build', join(root, 'australia', 'app'))

const target = join(root, 'app', 'dist', 'australia')
rmSync(target, { recursive: true, force: true })
cpSync(join(root, 'australia', 'app', 'dist'), target, { recursive: true })
if (!existsSync(join(target, 'index.html'))) throw new Error('build-site: australia/app/dist/index.html missing after copy')
console.log(`\nbuild-site: ok (app/dist + app/dist/australia)`)
