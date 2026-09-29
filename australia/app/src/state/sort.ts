// Sort comparators. Unknown values stay last in both directions; every comparator ends with id.
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import { enBase, enFull, titleSortKey } from './normalize'
import type { SortDir, SortKey } from './query'

export type PlaceLookup = (id: string) => Place | undefined

const keyCache = new WeakMap<Song, string>()
export function titleKey(s: Song): string {
  let k = keyCache.get(s)
  if (k === undefined) {
    k = titleSortKey(s.title)
    keyCache.set(s, k)
  }
  return k
}

function knownFirst<T>(a: T | null | undefined, b: T | null | undefined, dir: SortDir, cmp: (x: T, y: T) => number): number {
  const an = a === null || a === undefined || a === ''
  const bn = b === null || b === undefined || b === ''
  if (an && bn) return 0
  if (an) return 1
  if (bn) return -1
  const r = cmp(a as T, b as T)
  return dir === 'desc' ? -r : r
}

function byTitle(a: Song, b: Song, dir: SortDir): number {
  const ka = titleKey(a)
  const kb = titleKey(b)
  let r = knownFirst(ka, kb, dir, (x, y) => enBase.compare(x, y))
  if (r !== 0) return r
  r = enFull.compare(a.title, b.title)
  return dir === 'desc' ? -r : r
}

/** Numeric page id ("052a" -> 52.5 so the suffixed page sorts after its number). */
export function pageNumber(s: Song): number {
  const m = s.source.siteId.match(/^(\d+)([a-z]?)$/)
  if (!m) return Number.MAX_SAFE_INTEGER
  return parseInt(m[1], 10) + (m[2] ? 0.5 : 0)
}

function byId(a: Song, b: Song): number {
  const d = pageNumber(a) - pageNumber(b)
  return d !== 0 ? d : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

function stateName(s: Song, lookup: PlaceLookup): string | null {
  const id = s.location.placeId
  if (!id) return null
  const parts = id.split('/')
  const stateId = parts[0] === 'au' ? parts.slice(0, 2).join('/') : parts[0]
  return lookup(stateId)?.name ?? s.location.state ?? null
}

export function comparator(sort: SortKey, dir: SortDir, lookup: PlaceLookup = () => undefined): (a: Song, b: Song) => number {
  const title = (a: Song, b: Song) => byTitle(a, b, dir)
  switch (sort) {
    case 'title':
      return (a, b) => title(a, b) || byId(a, b)
    case 'year':
      return (a, b) => knownFirst(a.year.value, b.year.value, dir, (x, y) => x - y) || title(a, b) || byId(a, b)
    case 'location':
      return (a, b) =>
        knownFirst(stateName(a, lookup), stateName(b, lookup), dir, (x, y) => enBase.compare(x, y)) ||
        knownFirst(a.location.town, b.location.town, dir, (x, y) => enBase.compare(x, y)) ||
        title(a, b) ||
        byId(a, b)
    case 'newspaper':
      return (a, b) =>
        knownFirst(a.provenance.newspaper?.key, b.provenance.newspaper?.key, dir, (x, y) => enBase.compare(x, y)) ||
        knownFirst(a.year.value, b.year.value, dir, (x, y) => x - y) ||
        title(a, b) ||
        byId(a, b)
    case 'number':
      return (a, b) => (dir === 'desc' ? -byId(a, b) : byId(a, b))
  }
}

export function sortSongs(songs: Song[], sort: SortKey, dir: SortDir, lookup?: PlaceLookup): Song[] {
  return [...songs].sort(comparator(sort, dir, lookup))
}
