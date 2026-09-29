// Indexes built once per catalogue: lookups by id, place hierarchy (country > state > town),
// songs per place, vocabularies and year bounds. Pure and deterministic.
import { enBase } from '../state/normalize'
import { titleKey } from '../state/sort'
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import type { Sources } from '../types/sources'

export interface CatalogIndex {
  songs: Song[]
  places: Place[]
  sources: Sources
  songById: Map<string, Song>
  placeById: Map<string, Place>
  /** Children of a place id, sorted by name. */
  childrenOf: (id: string) => Place[]
  ancestorsOf: (id: string) => string[]
  /** Songs whose `location.placeId` is exactly this id. */
  songsAt: (id: string) => Song[]
  /** Songs at this id or under it. */
  songsUnder: (id: string) => Song[]
  /** Top-level place nodes: Australia first, then the other countries by name. */
  countries: Place[]
  /** State id ('au/nsw') of a place id at any depth, or the country id for foreign places. */
  stateIdOf: (placeId: string) => string
  newspaperKeys: string[]
  newspaperTitle: (key: string) => string
  songbookIds: string[]
  songbookTitle: (id: string) => string
  singers: string[]
  collectors: string[]
  authors: string[]
  yearMin: number | undefined
  yearMax: number | undefined
  searchKey: (song: Song) => string
  placeExists: (id: string) => boolean
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const list = m.get(k)
  if (list) list.push(v)
  else m.set(k, [v])
}

export function stateIdOf(placeId: string): string {
  const parts = placeId.split('/')
  return parts[0] === 'au' ? parts.slice(0, 2).join('/') : parts[0]
}

export function buildIndex(songs: Song[], places: Place[], sources: Sources): CatalogIndex {
  const songById = new Map<string, Song>()
  for (const s of songs) songById.set(s.id, s)
  const placeById = new Map<string, Place>()
  for (const p of places) placeById.set(p.id, p)

  const childMap = new Map<string, Place[]>()
  for (const p of places) {
    if (!p.parent) continue
    push(childMap, p.parent, p)
  }
  for (const list of childMap.values()) list.sort((a, b) => enBase.compare(a.name, b.name) || (a.id < b.id ? -1 : 1))

  const at = new Map<string, Song[]>()
  const under = new Map<string, Song[]>()
  const singers = new Map<string, number>()
  const collectors = new Map<string, number>()
  const authors = new Map<string, number>()
  let yearMin: number | undefined
  let yearMax: number | undefined
  const keys = new WeakMap<Song, string>()
  for (const s of songs) {
    const id = s.location.placeId
    if (id) {
      push(at, id, s)
      const parts = id.split('/')
      for (let i = 1; i <= parts.length; i++) push(under, parts.slice(0, i).join('/'), s)
    }
    for (const x of s.provenance.singers) singers.set(x, (singers.get(x) ?? 0) + 1)
    for (const x of s.provenance.collectors) collectors.set(x, (collectors.get(x) ?? 0) + 1)
    if (s.author.name) authors.set(s.author.name, (authors.get(s.author.name) ?? 0) + 1)
    const y = s.year.value
    if (y !== null) {
      if (yearMin === undefined || y < yearMin) yearMin = y
      if (yearMax === undefined || y > yearMax) yearMax = y
    }
    keys.set(s, titleKey(s))
  }
  const byName = (m: Map<string, number>) => [...m.keys()].sort((a, b) => enBase.compare(a, b))

  const countries = places.filter((p) => p.type === 'country').sort((a, b) => (a.id === 'au' ? -1 : b.id === 'au' ? 1 : enBase.compare(a.name, b.name)))
  const paperTitle = new Map(sources.newspapers.map((n) => [n.key, n.title]))
  const bookTitle = new Map(sources.songbooks.map((b) => [b.id, b.title]))
  const empty: Song[] = []
  return {
    songs,
    places,
    sources,
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
    stateIdOf,
    newspaperKeys: sources.newspapers.map((n) => n.key),
    newspaperTitle: (key) => paperTitle.get(key) ?? key,
    songbookIds: sources.songbooks.map((b) => b.id),
    songbookTitle: (id) => bookTitle.get(id) ?? id,
    singers: byName(singers),
    collectors: byName(collectors),
    authors: byName(authors),
    yearMin,
    yearMax,
    searchKey: (s) => keys.get(s) ?? titleKey(s),
    placeExists: (id) => placeById.has(id),
  }
}
