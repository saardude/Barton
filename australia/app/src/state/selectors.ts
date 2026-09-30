// Derived state: pure functions over the Query and the catalogue index.
import { stateName, t } from '../i18n/en'
import type { CatalogIndex } from '../data/catalogIndex'
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import { KIND_ORDER, PAGE_SIZE, placeLevelOf, type PlaceLevel, type Query } from './query'
import { sortSongs } from './sort'

export type FacetKey = 'place' | 'q' | 'kind' | 'paper' | 'book' | 'singer' | 'collector' | 'author' | 'tune' | 'year' | 'unmapped'
export const FACET_KEYS: FacetKey[] = ['place', 'q', 'kind', 'paper', 'book', 'singer', 'collector', 'author', 'tune', 'year', 'unmapped']

export type Predicate = (s: Song) => boolean
export type Counts = Map<string, number>

export interface PlaceNode {
  id: string
  place: Place
  level: PlaceLevel
  label: string
  count: number
  children: PlaceNode[]
  mapped: boolean
}

export type MapLevel = 'state' | 'town'

export interface MapPoint {
  placeId: string
  level: MapLevel
  place: Place
  lat: number
  lon: number
  count: number
  yearMin?: number
  yearMax?: number
  notationCount: number
  townCount?: number
  selected: boolean
  highlighted: boolean
}

export interface Chip {
  key: FacetKey
  value: string
  label: string
}

export interface Bin {
  from: number
  to: number
  count: number
}

export interface Derived {
  predicates: Record<FacetKey, Predicate>
  filteredSongs: Song[]
  total: number
  sortedSongs: Song[]
  pagedSongs: Song[]
  page: number
  pageCount: number
  facetCounts: { kind: Counts; paper: Counts; book: Counts; singer: Counts; collector: Counts; author: Counts; tune: Counts }
  yearHistogram: Bin[]
  placeTree: PlaceNode[]
  mapLevel: MapLevel
  mapPoints: MapPoint[]
  unmappedCount: number
  activeChips: Chip[]
  searching: boolean
}

export interface DeriveInput {
  query: Query
  index: CatalogIndex
  searchIds: string[] | null
  searching?: boolean
  mapLevel?: MapLevel
  highlightPlaceId?: string
}

const TRUE: Predicate = () => true

/** True when the record carries a music scan (not just the newspaper's masthead). */
export function hasNotation(s: Song): boolean {
  return s.media.images.some((i) => i.role === 'notation')
}

export function placePredicate(query: Query): Predicate {
  const id = query.place
  if (!id) return TRUE
  const prefix = id + '/'
  return (s) => {
    const p = s.location.placeId
    return p !== null && (p === id || p.startsWith(prefix))
  }
}

export function buildPredicates(input: DeriveInput): Record<FacetKey, Predicate> {
  const { query, searchIds } = input
  const kind = new Set<string>(query.kind)
  const paper = new Set(query.paper)
  const book = new Set(query.book)
  const singer = new Set(query.singer)
  const collector = new Set(query.collector)
  const author = new Set(query.author)
  const search = searchIds ? new Set(searchIds) : null
  const from = query.yearFrom
  const to = query.yearTo
  return {
    place: placePredicate(query),
    q: search ? (s) => search.has(s.id) : TRUE,
    kind: kind.size ? (s) => kind.has(s.kind) : TRUE,
    paper: paper.size ? (s) => s.provenance.newspaper !== null && paper.has(s.provenance.newspaper.key) : TRUE,
    book: book.size ? (s) => s.provenance.songbooks.some((b) => book.has(b)) : TRUE,
    singer: singer.size ? (s) => s.provenance.singers.some((x) => singer.has(x)) : TRUE,
    collector: collector.size ? (s) => s.provenance.collectors.some((x) => collector.has(x)) : TRUE,
    author: author.size ? (s) => s.author.name !== null && author.has(s.author.name) : TRUE,
    tune: query.tune === 'notation' ? (s) => hasNotation(s) : query.tune === 'midi' ? (s) => s.media.midi.length > 0 : query.tune === 'audio' ? (s) => s.media.audio.length > 0 : TRUE,
    year:
      from === undefined && to === undefined
        ? TRUE
        : (s) => {
            const y = s.year.value
            if (y === null) return false
            if (from !== undefined && y < from) return false
            if (to !== undefined && y > to) return false
            return true
          },
    unmapped: query.unmapped ? (s) => s.location.lat === null || s.location.lng === null : TRUE,
  }
}

/** Filter with every predicate except `except`. */
export function filterSongs(songs: Song[], predicates: Record<FacetKey, Predicate>, except?: FacetKey): Song[] {
  const active = FACET_KEYS.filter((k) => k !== except && predicates[k] !== TRUE).map((k) => predicates[k])
  if (!active.length) return songs
  return songs.filter((s) => active.every((p) => p(s)))
}

function inc(m: Counts, k: string, n = 1): void {
  m.set(k, (m.get(k) ?? 0) + n)
}

export function placeLabel(p: Place): string {
  if (p.type === 'state' || p.type === 'country') return p.name
  return p.name
}

/** Tree from places.json; counts are "all predicates except place". */
export function buildPlaceTree(index: CatalogIndex, exceptPlace: Song[]): PlaceNode[] {
  const counts: Counts = new Map()
  for (const s of exceptPlace) {
    const id = s.location.placeId
    if (!id) continue
    const parts = id.split('/')
    for (let i = 1; i <= parts.length; i++) inc(counts, parts.slice(0, i).join('/'))
  }
  const build = (p: Place): PlaceNode => ({
    id: p.id,
    place: p,
    level: p.type,
    label: placeLabel(p),
    count: counts.get(p.id) ?? 0,
    children: index.childrenOf(p.id).map(build),
    mapped: p.lat !== null && p.lng !== null,
  })
  return index.countries.map(build).filter((r) => r.count > 0 || index.songsUnder(r.id).length > 0)
}

export function mapLevelFor(query: Query, explicit?: MapLevel): MapLevel {
  if (explicit) return explicit
  const level = query.place ? placeLevelOf(query.place) : undefined
  return level === 'state' || level === 'town' ? 'town' : 'state'
}

function groupKey(s: Song, index: CatalogIndex, level: MapLevel): string | null {
  const id = s.location.placeId
  if (!id) return null
  if (level === 'town') {
    const p = index.placeById.get(id)
    return p && p.type === 'town' ? id : null
  }
  const stateId = index.stateIdOf(id)
  const st = index.placeById.get(stateId)
  return st ? stateId : null
}

export function buildMapPoints(filtered: Song[], index: CatalogIndex, level: MapLevel, selectedId: string | undefined, highlightId: string | undefined): { points: MapPoint[]; unmappedCount: number } {
  const groups = new Map<string, Song[]>()
  let unmapped = 0
  for (const s of filtered) {
    const key = groupKey(s, index, level)
    if (!key) {
      unmapped++
      continue
    }
    const list = groups.get(key)
    if (list) list.push(s)
    else groups.set(key, [s])
  }
  const points: MapPoint[] = []
  for (const [id, songs] of groups) {
    const place = index.placeById.get(id)
    if (!place || place.lat === null || place.lng === null) {
      unmapped += songs.length
      continue
    }
    let yearMin: number | undefined
    let yearMax: number | undefined
    let notation = 0
    const towns = new Set<string>()
    for (const s of songs) {
      const y = s.year.value
      if (y !== null) {
        if (yearMin === undefined || y < yearMin) yearMin = y
        if (yearMax === undefined || y > yearMax) yearMax = y
      }
      if (hasNotation(s)) notation++
      if (level === 'state' && s.location.placeId && s.location.placeId !== id) towns.add(s.location.placeId)
    }
    points.push({
      placeId: id,
      level,
      place,
      lat: place.lat,
      lon: place.lng,
      count: songs.length,
      yearMin,
      yearMax,
      notationCount: notation,
      townCount: level === 'state' ? towns.size : undefined,
      selected: id === selectedId,
      highlighted: id === highlightId,
    })
  }
  points.sort((a, b) => b.lat - a.lat || a.lon - b.lon || (a.placeId < b.placeId ? -1 : 1))
  return { points, unmappedCount: unmapped }
}

export function placeChipLabel(id: string, index: CatalogIndex): string {
  const p = index.placeById.get(id)
  if (!p) return id
  if (p.type === 'town') return `${p.name}, ${stateName(p.state)}`
  return p.name
}

export function buildChips(query: Query, index: CatalogIndex): Chip[] {
  const chips: Chip[] = []
  if (query.place) chips.push({ key: 'place', value: query.place, label: placeChipLabel(query.place, index) })
  for (const k of query.kind) chips.push({ key: 'kind', value: k, label: t(`facet.kind.${k}`) })
  for (const p of query.paper) chips.push({ key: 'paper', value: p, label: index.newspaperTitle(p) })
  for (const b of query.book) chips.push({ key: 'book', value: b, label: index.songbookTitle(b) })
  for (const s of query.singer) chips.push({ key: 'singer', value: s, label: s })
  for (const c of query.collector) chips.push({ key: 'collector', value: c, label: c })
  for (const a of query.author) chips.push({ key: 'author', value: a, label: a })
  if (query.tune) chips.push({ key: 'tune', value: query.tune, label: t(`facet.tune.${query.tune}`) })
  if (query.yearFrom !== undefined || query.yearTo !== undefined) {
    const label =
      query.yearFrom !== undefined && query.yearTo !== undefined ? `${query.yearFrom}-${query.yearTo}` : query.yearFrom !== undefined ? `from ${query.yearFrom}` : `to ${query.yearTo}`
    chips.push({ key: 'year', value: 'year', label })
  }
  if (query.q.trim()) chips.push({ key: 'q', value: query.q.trim(), label: `"${query.q.trim()}"` })
  if (query.unmapped) chips.push({ key: 'unmapped', value: '1', label: t('facet.notMapped') })
  return chips
}

const COUNTED: FacetKey[] = ['kind', 'paper', 'book', 'singer', 'collector', 'author', 'tune']

function countFacet(s: Song, facet: FacetKey, c: Derived['facetCounts']): void {
  switch (facet) {
    case 'kind':
      inc(c.kind, s.kind)
      break
    case 'paper':
      if (s.provenance.newspaper) inc(c.paper, s.provenance.newspaper.key)
      break
    case 'book':
      for (const b of s.provenance.songbooks) inc(c.book, b)
      break
    case 'singer':
      for (const x of s.provenance.singers) inc(c.singer, x)
      break
    case 'collector':
      for (const x of s.provenance.collectors) inc(c.collector, x)
      break
    case 'author':
      if (s.author.name) inc(c.author, s.author.name)
      break
    case 'tune':
      if (hasNotation(s)) inc(c.tune, 'notation')
      if (s.media.midi.length) inc(c.tune, 'midi')
      if (s.media.audio.length) inc(c.tune, 'audio')
      break
    default:
      break
  }
}

export function derive(input: DeriveInput): Derived {
  const { query, index } = input
  const predicates = buildPredicates(input)
  const songs = index.songs
  const facetCounts: Derived['facetCounts'] = {
    kind: new Map(KIND_ORDER.map((k) => [k, 0])),
    paper: new Map(),
    book: new Map(),
    singer: new Map(),
    collector: new Map(),
    author: new Map(),
    tune: new Map([
      ['notation', 0],
      ['midi', 0],
      ['audio', 0],
    ]),
  }
  const exceptPlace: Song[] = []
  const exceptYear: Song[] = []
  const filtered: Song[] = []
  const keys = FACET_KEYS.filter((k) => predicates[k] !== TRUE)
  for (const s of songs) {
    let fails = 0
    let failing: FacetKey | null = null
    for (const k of keys) {
      if (!predicates[k](s)) {
        fails++
        failing = k
        if (fails > 1) break
      }
    }
    if (fails === 0) {
      filtered.push(s)
      exceptPlace.push(s)
      exceptYear.push(s)
      for (const f of COUNTED) countFacet(s, f, facetCounts)
    } else if (fails === 1 && failing) {
      if (failing === 'place') exceptPlace.push(s)
      else if (failing === 'year') exceptYear.push(s)
      else if (COUNTED.includes(failing)) countFacet(s, failing, facetCounts)
    }
  }

  const sorted = sortSongs(filtered, query.sort, query.dir, (id) => index.placeById.get(id))
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, query.page), pageCount)
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const level = mapLevelFor(query, input.mapLevel)
  const selectedId = query.place && placeLevelOf(query.place) === 'town' ? query.place : level === 'state' ? query.place : undefined
  const { points, unmappedCount } = buildMapPoints(filtered, index, level, selectedId, input.highlightPlaceId)

  return {
    predicates,
    filteredSongs: filtered,
    total: songs.length,
    sortedSongs: sorted,
    pagedSongs: paged,
    page,
    pageCount,
    facetCounts,
    yearHistogram: histogram(exceptYear, index.yearMin, index.yearMax),
    placeTree: buildPlaceTree(index, exceptPlace),
    mapLevel: level,
    mapPoints: points,
    unmappedCount,
    activeChips: buildChips(query, index),
    searching: Boolean(input.searching),
  }
}

export function histogram(songs: Song[], min: number | undefined, max: number | undefined): Bin[] {
  if (min === undefined || max === undefined) return []
  const start = Math.floor(min / 5) * 5
  const bins: Bin[] = []
  for (let y = start; y <= max; y += 5) bins.push({ from: y, to: y + 4, count: 0 })
  for (const s of songs) {
    const y = s.year.value
    if (y === null) continue
    const i = Math.floor((y - start) / 5)
    if (bins[i]) bins[i].count++
  }
  return bins
}
