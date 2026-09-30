// Indexes built once per catalogue (FRONTEND-SPEC section 1): lookups by id, place hierarchy,
// songs per place, vocabularies and year bounds. Pure and deterministic; unit-tested via the fixture.
import { normalize, roBase } from '../state/normalize'
import { titleKey } from '../state/sort'
import type { Place } from '../types/place'
import type { Song } from '../types/song'

export interface CatalogIndex {
  songs: Song[]
  places: Place[]
  songById: Map<string, Song>
  placeById: Map<string, Place>
  /** Children of a place id, sorted by name with the Romanian base collator. */
  childrenOf: (id: string) => Place[]
  /** Ancestor ids, shallowest first (from the id path; nodes are always present in places.json). */
  ancestorsOf: (id: string) => string[]
  /** Songs whose `location.placeId` is exactly this id (villages, or county-level records). */
  songsAt: (id: string) => Song[]
  /** Songs at this id or under it (prefix match on the id path). */
  songsUnder: (id: string) => Song[]
  /** Country place ids present in the data, `ro` first, then by name. */
  countries: Place[]
  styles: string[]
  instruments: string[]
  /** Distinct collector names, most frequent first (then by name). */
  collectors: string[]
  yearMin: number | undefined
  yearMax: number | undefined
  /** Pre-folded title key for sort tie-breaks. */
  searchKey: (song: Song) => string
  /** True for ids of real places and for synthetic "<county>/unknown" leaves. */
  placeExists: (id: string) => boolean
}

export const UNKNOWN_LEAF = 'unknown'

export function isUnknownLeaf(id: string): boolean {
  return id.endsWith('/' + UNKNOWN_LEAF)
}

export function buildIndex(songs: Song[], places: Place[]): CatalogIndex {
  const songById = new Map<string, Song>()
  for (const s of songs) songById.set(s.id, s)
  const placeById = new Map<string, Place>()
  for (const p of places) placeById.set(p.id, p)

  const childMap = new Map<string, Place[]>()
  for (const p of places) {
    if (!p.parent) continue
    let list = childMap.get(p.parent)
    if (!list) childMap.set(p.parent, (list = []))
    list.push(p)
  }
  for (const list of childMap.values()) list.sort((a, b) => roBase.compare(a.name, b.name) || (a.id < b.id ? -1 : 1))

  const at = new Map<string, Song[]>()
  const under = new Map<string, Song[]>()
  for (const s of songs) {
    const id = s.location.placeId
    if (!id) continue
    push(at, id, s)
    const parts = id.split('/')
    for (let i = 1; i <= parts.length; i++) push(under, parts.slice(0, i).join('/'), s)
  }

  const styles = new Set<string>()
  const instruments = new Set<string>()
  const collectorCounts = new Map<string, number>()
  let yearMin: number | undefined
  let yearMax: number | undefined
  const keys = new WeakMap<Song, string>()
  for (const s of songs) {
    if (s.style) styles.add(s.style)
    for (const i of s.instrument) instruments.add(i)
    for (const c of s.collectors) collectorCounts.set(c, (collectorCounts.get(c) ?? 0) + 1)
    const y = s.collected.year
    if (y !== null) {
      if (yearMin === undefined || y < yearMin) yearMin = y
      if (yearMax === undefined || y > yearMax) yearMax = y
    }
    keys.set(s, titleKey(s))
  }

  const countries = places
    .filter((p) => p.type === 'country')
    .sort((a, b) => (a.id === 'ro' ? -1 : b.id === 'ro' ? 1 : roBase.compare(a.name, b.name)))

  const empty: Song[] = []
  return {
    songs,
    places,
    songById,
    placeById,
    childrenOf: (id) => childMap.get(id) ?? [],
    ancestorsOf: (id) => {
      const parts = id.split('/')
      const out: string[] = []
      for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join('/'))
      return out
    },
    songsAt: (id) => at.get(id) ?? empty,
    songsUnder: (id) => under.get(id) ?? empty,
    countries,
    styles: [...styles].sort((a, b) => roBase.compare(normalize(a), normalize(b))),
    instruments: [...instruments].sort((a, b) => roBase.compare(normalize(a), normalize(b))),
    collectors: [...collectorCounts.entries()].sort((a, b) => b[1] - a[1] || roBase.compare(normalize(a[0]), normalize(b[0]))).map(([c]) => c),
    yearMin,
    yearMax,
    searchKey: (s) => keys.get(s) ?? titleKey(s),
    placeExists: (id) => placeById.has(id) || (isUnknownLeaf(id) && placeById.has(id.slice(0, -UNKNOWN_LEAF.length - 1))),
  }
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const list = m.get(k)
  if (list) list.push(v)
  else m.set(k, [v])
}
