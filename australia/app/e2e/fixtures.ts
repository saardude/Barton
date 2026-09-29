// Shared Playwright fixtures: every test fails on console.error / pageerror; external hosts
// (map tiles, folkstream.com media) are stubbed so runs are hermetic; `data` exposes the built
// dataset for computing expected counts.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test as base, type Page } from '@playwright/test'
import type { Place } from '../src/types/place'
import type { Song } from '../src/types/song'

export { expect }

const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const IGNORED_CONSOLE = [/ERR_CERT_AUTHORITY_INVALID/, /cartocdn|openstreetmap|tile\./i, /ERR_TUNNEL_CONNECTION_FAILED/, /ERR_PROXY/, /net::ERR_/]

export interface DataFixture {
  songs: Song[]
  places: Place[]
  placeById: Map<string, Place>
  located: Song[]
  song(pred: (s: Song) => boolean): Song
}

function loadData(): DataFixture {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', process.env.VITE_OUT_DIR ?? 'dist-e2e', 'data')
  const files = readdirSync(dir)
  const read = <T,>(prefix: string): T => {
    const f = files.find((x) => x.startsWith(prefix + '.') && x.endsWith('.json'))
    if (!f) throw new Error(`${dir}/${prefix}.*.json not found; run VITE_OUT_DIR=dist-e2e npm run build`)
    return JSON.parse(readFileSync(join(dir, f), 'utf8')) as T
  }
  const songs = read<Song[]>('songs')
  const places = read<Place[]>('places')
  return {
    songs,
    places,
    placeById: new Map(places.map((p) => [p.id, p])),
    located: songs.filter((s) => s.location.placeId !== null),
    song: (pred) => {
      const s = songs.find(pred)
      if (!s) throw new Error('no song matches the predicate')
      return s
    },
  }
}

let cached: DataFixture | null = null

export const test = base.extend<{ data: DataFixture; consoleErrors: string[] }>({
  // eslint-disable-next-line no-empty-pattern
  data: async ({}, use) => {
    cached ??= loadData()
    await use(cached)
  },
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error' && !IGNORED_CONSOLE.some((re) => re.test(m.text()))) errors.push(m.text())
      })
      page.on('pageerror', (e) => errors.push(String(e)))
      await page.route('**/*', (route) => {
        const url = new URL(route.request().url())
        if (LOCAL_HOSTS.has(url.hostname)) return route.continue()
        if (/\.(png|gif|jpe?g)(\?|$)/i.test(url.pathname)) return route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG })
        return route.fulfill({ status: 204, body: '' })
      })
      await use(errors)
      expect(errors, 'console errors').toEqual([])
    },
    { auto: true },
  ],
})

export async function gotoApp(page: Page, path = '/') {
  await page.goto(path.replace(/^\//, ''))
  await waitForCatalog(page)
}

export async function waitForCatalog(page: Page) {
  await expect(page.getByText(/[\d,]+ of [\d,]+ songs/).first()).toBeVisible({ timeout: 30_000 })
}

/** Numbers as the UI prints them (thousands separator). */
export function fmt(n: number): string {
  return n.toLocaleString('en')
}

export function query(page: Page): URLSearchParams {
  return new URL(page.url()).searchParams
}
