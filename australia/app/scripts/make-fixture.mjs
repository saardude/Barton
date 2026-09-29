// Builds src/test/fixtures/{songs,places,facets,sources}.small.json from ../data: a deterministic
// 40-record sample that keeps every state, both image roles, MIDI, a songbook, a singer, a
// collector, related links and an unplaced record, so unit and route tests cover each path.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(here, '..', '..', 'data')
const outDir = resolve(here, '..', 'src', 'test', 'fixtures')
mkdirSync(outDir, { recursive: true })

const songs = JSON.parse(readFileSync(join(dataDir, 'songs.json'), 'utf8'))
const places = JSON.parse(readFileSync(join(dataDir, 'places.json'), 'utf8'))
const sources = JSON.parse(readFileSync(join(dataDir, 'sources.json'), 'utf8'))

const picked = new Map()
const take = (pred, n = 1) => {
  for (const s of songs) {
    if (picked.size >= 40) break
    if (n <= 0) break
    if (!picked.has(s.id) && pred(s)) {
      picked.set(s.id, s)
      n--
    }
  }
}
for (const st of ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS']) take((s) => s.location.state === st && s.location.town !== null, 2)
take((s) => s.media.midi.length > 0, 3)
take((s) => s.media.images.some((i) => i.role === 'notation'), 2)
take((s) => s.provenance.songbooks.length > 0, 2)
take((s) => s.provenance.singers.length > 0, 2)
take((s) => s.provenance.collectors.length > 0, 2)
take((s) => s.related.length > 0, 2)
take((s) => s.kind === 'poem', 2)
take((s) => s.location.placeId === null, 3)
take((s) => s.year.value === null, 1)
take((s) => s.location.basis === 'newspaper-state', 2)
take(() => true, 40)

const out = [...picked.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
const ids = new Set(out.map((s) => s.id))
for (const s of out) s.related = s.related.filter((r) => ids.has(r.id))
const placeIds = new Set()
for (const s of out) {
  if (!s.location.placeId) continue
  const parts = s.location.placeId.split('/')
  for (let i = 1; i <= parts.length; i++) placeIds.add(parts.slice(0, i).join('/'))
}
const smallPlaces = places.filter((p) => placeIds.has(p.id)).map((p) => ({ ...p, songIds: p.songIds.filter((id) => ids.has(id)) }))
const paperKeys = new Set(out.map((s) => s.provenance.newspaper?.key).filter(Boolean))
const bookIds = new Set(out.flatMap((s) => s.provenance.songbooks))
const smallSources = {
  site: sources.site,
  songbooks: sources.songbooks.filter((b) => bookIds.has(b.id)),
  articles: sources.articles.slice(0, 3),
  newspapers: sources.newspapers.filter((n) => paperKeys.has(n.key)).map((n) => ({ ...n, songIds: n.songIds.filter((id) => ids.has(id)) })),
}
const facets = { _meta: { songCount: out.length }, decade: {}, year: {}, kind: {}, state: {}, town: {}, newspaper: {}, songbook: {}, singer: {}, collector: {}, author: {}, hasNotation: {}, hasMasthead: {}, hasMidi: {}, yearFrom: {} }

writeFileSync(join(outDir, 'songs.small.json'), JSON.stringify(out, null, 1))
writeFileSync(join(outDir, 'places.small.json'), JSON.stringify(smallPlaces, null, 1))
writeFileSync(join(outDir, 'sources.small.json'), JSON.stringify(smallSources, null, 1))
writeFileSync(join(outDir, 'facets.small.json'), JSON.stringify(facets, null, 1))
console.log(`make-fixture: ${out.length} songs, ${smallPlaces.length} places, ${smallSources.newspapers.length} newspapers`)
