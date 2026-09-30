// The shared Query object, its defaults and invariants. The URL is the state; every field here
// round-trips through the query string (urlCodec.ts).
import type { Song } from '../types/song'

export type Kind = Song['kind']
export type SortKey = 'title' | 'year' | 'location' | 'newspaper' | 'number'
export type SortDir = 'asc' | 'desc'
export type Tune = 'notation' | 'midi' | 'audio'

export interface Query {
  q: string
  /** Place id at any level: 'au', 'au/nsw', 'au/nsw/kiama', 'nz'. */
  place?: string
  kind: Kind[]
  /** Newspaper keys (sources.json newspapers[].key). */
  paper: string[]
  /** Songbook ids (book-001). */
  book: string[]
  singer: string[]
  collector: string[]
  author: string[]
  tune?: Tune
  yearFrom?: number
  yearTo?: number
  sort: SortKey
  dir: SortDir
  page: number
  unmapped?: boolean
}

export const DEFAULT_QUERY: Query = {
  q: '',
  kind: [],
  paper: [],
  book: [],
  singer: [],
  collector: [],
  author: [],
  sort: 'title',
  dir: 'asc',
  page: 1,
}

export const PAGE_SIZE = 50

export const KIND_ORDER: Kind[] = ['song', 'poem', 'unknown']
export const SORT_KEYS: SortKey[] = ['title', 'year', 'location', 'newspaper', 'number']
export const TUNES: Tune[] = ['notation', 'midi', 'audio']

export type PlaceLevel = 'country' | 'state' | 'town'
export const PLACE_LEVELS: PlaceLevel[] = ['country', 'state', 'town']

export function isKind(v: string): v is Kind {
  return (KIND_ORDER as string[]).includes(v)
}
export function isSortKey(v: string): v is SortKey {
  return (SORT_KEYS as string[]).includes(v)
}
export function isTune(v: string): v is Tune {
  return (TUNES as string[]).includes(v)
}

/** Ancestors of a place id path, shallowest first, excluding the id itself. */
export function ancestorIds(id: string): string[] {
  const parts = id.split('/')
  const out: string[] = []
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join('/'))
  return out
}

export function placeLevelOf(id: string): PlaceLevel | undefined {
  return PLACE_LEVELS[id.split('/').length - 1]
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.length > 0))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

function sortedKinds(values: string[]): Kind[] {
  const set = new Set(values.filter(isKind))
  return KIND_ORDER.filter((k) => set.has(k))
}

/** Fields that do not reset the page. */
const PAGE_NEUTRAL = new Set<keyof Query>(['page', 'sort', 'dir'])

/** Apply a patch while enforcing every invariant (sorted lists, page reset, year order). */
export function applyPatch(base: Query, patch: Partial<Query>): Query {
  const next: Query = { ...base }
  const keys = Object.keys(patch) as (keyof Query)[]
  for (const k of keys) {
    switch (k) {
      case 'q':
        next.q = patch.q ?? ''
        break
      case 'place':
        next.place = patch.place && placeLevelOf(patch.place) ? patch.place : undefined
        break
      case 'kind':
        next.kind = sortedKinds(patch.kind ?? [])
        break
      case 'paper':
        next.paper = sortedUnique(patch.paper ?? [])
        break
      case 'book':
        next.book = sortedUnique(patch.book ?? [])
        break
      case 'singer':
        next.singer = sortedUnique(patch.singer ?? [])
        break
      case 'collector':
        next.collector = sortedUnique(patch.collector ?? [])
        break
      case 'author':
        next.author = sortedUnique(patch.author ?? [])
        break
      case 'tune':
        next.tune = patch.tune && isTune(patch.tune) ? patch.tune : undefined
        break
      case 'yearFrom':
        next.yearFrom = intOrUndefined(patch.yearFrom)
        break
      case 'yearTo':
        next.yearTo = intOrUndefined(patch.yearTo)
        break
      case 'sort':
        next.sort = patch.sort && isSortKey(patch.sort) ? patch.sort : 'title'
        break
      case 'dir':
        next.dir = patch.dir === 'desc' ? 'desc' : 'asc'
        break
      case 'page':
        next.page = Math.max(1, Math.floor(patch.page ?? 1))
        break
      case 'unmapped':
        next.unmapped = patch.unmapped ? true : undefined
        break
    }
  }
  if (next.yearFrom !== undefined && next.yearTo !== undefined && next.yearFrom > next.yearTo) {
    const t = next.yearFrom
    next.yearFrom = next.yearTo
    next.yearTo = t
  }
  if (keys.some((k) => !PAGE_NEUTRAL.has(k))) next.page = 1
  return dropUndefined(next)
}

function intOrUndefined(v: number | undefined): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : undefined
}

function dropUndefined(q: Query): Query {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(q)) if (v !== undefined) out[k] = v
  return out as unknown as Query
}

/** Clear everything except sort and dir. */
export function resetQuery(q: Query): Query {
  return dropUndefined({ ...DEFAULT_QUERY, sort: q.sort, dir: q.dir })
}

export function hasActiveFilters(q: Query): boolean {
  return Boolean(
    q.q.trim() ||
      q.place ||
      q.kind.length ||
      q.paper.length ||
      q.book.length ||
      q.singer.length ||
      q.collector.length ||
      q.author.length ||
      q.tune ||
      q.yearFrom !== undefined ||
      q.yearTo !== undefined ||
      q.unmapped,
  )
}

export function queriesEqual(a: Query, b: Query): boolean {
  return JSON.stringify(dropUndefined(a)) === JSON.stringify(dropUndefined(b))
}
