// County drill-down aggregations (FRONTEND-SPEC 8): villages table rows, header stats,
// performers, per-year timeline, genre / style counts. Pure functions over Song[]; unit-tested.
import { t } from '../i18n/en'
import { isUnknownLeaf, UNKNOWN_LEAF, type CatalogIndex } from '../data/catalogIndex'
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import { normalize, roBase } from './normalize'
import { placeText } from './placeName'
import { GENRE_ORDER, type GenreId, type SortDir } from './query'
import { titleKey } from './sort'

export type GenreCounts = Partial<Record<GenreId, number>>

export interface VillageRow {
  /** Place id, or `<county>/unknown` for records resolved to the county only. */
  id: string
  place?: Place
  label: string
  melodies: number
  genreCounts: GenreCounts
  yearMin?: number
  yearMax?: number
  unknownYear: number
  mapped: boolean
  unknown: boolean
}

export interface CountyStats {
  melodies: number
  villages: number
  performers: number
  withAudio: number
  withNotation: number
  yearMin?: number
  yearMax?: number
  unknownYear: number
  genreCounts: GenreCounts
}

export interface PerformerRow {
  key: string
  name: string | null
  age: number | null
  sex: 'm' | 'f' | null
  ethnicity: string | null
  villageId: string | null
  villageLabel: string
  count: number
  yearMin?: number
  yearMax?: number
}

export interface YearBar {
  year: number
  count: number
  genreCounts: GenreCounts
}

export interface Timeline {
  perYear: YearBar[]
  unknownYear: number
  max: number
}

export type VillageSortKey = 'village' | 'melodies' | 'years'
export type PerformerSortKey = 'name' | 'count' | 'village'

function addGenre(counts: GenreCounts, s: Song): void {
  if (s.genre) counts[s.genre] = (counts[s.genre] ?? 0) + 1
}

interface Span {
  yearMin?: number
  yearMax?: number
  unknownYear: number
}

function spanOf(songs: Song[]): Span {
  let yearMin: number | undefined
  let yearMax: number | undefined
  let unknownYear = 0
  for (const s of songs) {
    const y = s.collected.year
    if (y === null) unknownYear++
    else {
      if (yearMin === undefined || y < yearMin) yearMin = y
      if (yearMax === undefined || y > yearMax) yearMax = y
    }
  }
  return { yearMin, yearMax, unknownYear }
}

/** "1909-1912", "1912", or "n.d." */
export function yearSpanText(min: number | undefined, max: number | undefined): string {
  if (min === undefined || max === undefined) return t('facet.noDate')
  return min === max ? String(min) : `${min}-${max}`
}

/**
 * One row per village of the county that has at least one song in `songs`, plus a
 * "(village unknown)" row (last) for records resolved to the county itself.
 * Order: village name ascending (the default sort).
 */
export function villageRows(songs: Song[], index: CatalogIndex, countyId: string): VillageRow[] {
  const groups = new Map<string, Song[]>()
  for (const s of songs) {
    const id = s.location.placeId
    if (!id) continue
    const key = id === countyId ? `${countyId}/${UNKNOWN_LEAF}` : id
    if (key !== `${countyId}/${UNKNOWN_LEAF}` && !key.startsWith(countyId + '/')) continue
    const list = groups.get(key)
    if (list) list.push(s)
    else groups.set(key, [s])
  }
  const rows: VillageRow[] = []
  for (const [id, list] of groups) {
    const unknown = isUnknownLeaf(id)
    const place = unknown ? undefined : index.placeById.get(id)
    const genreCounts: GenreCounts = {}
    for (const s of list) addGenre(genreCounts, s)
    const span = spanOf(list)
    rows.push({
      id,
      place,
      label: unknown ? t('facet.villageUnknown') : place ? placeText(place, place.id) : id,
      melodies: list.length,
      genreCounts,
      yearMin: span.yearMin,
      yearMax: span.yearMax,
      unknownYear: span.unknownYear,
      mapped: Boolean(place && place.lat !== null && place.lng !== null),
      unknown,
    })
  }
  return sortVillageRows(rows, 'village', 'asc')
}

/** Sort rows; the "(village unknown)" row is always last, unknown years last in both directions. */
export function sortVillageRows(rows: VillageRow[], key: VillageSortKey, dir: SortDir): VillageRow[] {
  const sign = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    if (a.unknown !== b.unknown) return a.unknown ? 1 : -1
    let r: number
    if (key === 'melodies') r = (a.melodies - b.melodies) * sign
    else if (key === 'years') {
      const an = a.yearMin === undefined
      const bn = b.yearMin === undefined
      if (an !== bn) return an ? 1 : -1
      r = an ? 0 : ((a.yearMin as number) - (b.yearMin as number) || (a.yearMax as number) - (b.yearMax as number)) * sign
    } else r = roBase.compare(normalize(a.label), normalize(b.label)) * sign
    return r || roBase.compare(a.label, b.label) || (a.id < b.id ? -1 : 1)
  })
}

export function countyStats(songs: Song[], rows: VillageRow[]): CountyStats {
  const genreCounts: GenreCounts = {}
  const performers = new Set<string>()
  let withAudio = 0
  let withNotation = 0
  for (const s of songs) {
    addGenre(genreCounts, s)
    if (s.performer.name) performers.add(normalize(s.performer.name))
    if (s.media.audio.length) withAudio++
    if (s.media.notation.length) withNotation++
  }
  const span = spanOf(songs)
  return {
    melodies: songs.length,
    villages: rows.filter((r) => !r.unknown).length,
    performers: performers.size,
    withAudio,
    withNotation,
    yearMin: span.yearMin,
    yearMax: span.yearMax,
    unknownYear: span.unknownYear,
    genreCounts,
  }
}

function villageLabelOf(s: Song, index: CatalogIndex): { id: string | null; label: string } {
  const id = s.location.placeId ?? null
  const place = id ? index.placeById.get(id) : undefined
  if (place && place.type === 'village') return { id, label: placeText(place, place.id) }
  const own = s.location.village ?? s.location.villageHistorical
  return { id, label: own ?? t('facet.villageUnknown') }
}

/**
 * Performers grouped by (normalised name, village); unnamed performers form one
 * "Unnamed performer (n)" row. Default order: count descending, then name.
 */
export function performerRows(songs: Song[], index: CatalogIndex): PerformerRow[] {
  const groups = new Map<string, { row: PerformerRow; songs: Song[] }>()
  for (const s of songs) {
    const name = s.performer.name?.trim() || null
    const village = name ? villageLabelOf(s, index) : { id: null, label: '' }
    const key = name ? `${normalize(name)}|${village.id ?? ''}` : '|unnamed'
    let g = groups.get(key)
    if (!g) {
      g = {
        row: {
          key,
          name,
          age: s.performer.age,
          sex: s.performer.sex,
          ethnicity: s.performer.ethnicity,
          villageId: village.id,
          villageLabel: village.label,
          count: 0,
        },
        songs: [],
      }
      groups.set(key, g)
    } else {
      if (g.row.age === null && s.performer.age !== null) g.row.age = s.performer.age
      if (g.row.sex === null && s.performer.sex !== null) g.row.sex = s.performer.sex
      if (g.row.ethnicity === null && s.performer.ethnicity !== null) g.row.ethnicity = s.performer.ethnicity
    }
    g.songs.push(s)
  }
  const rows: PerformerRow[] = []
  for (const g of groups.values()) {
    const span = spanOf(g.songs)
    rows.push({ ...g.row, count: g.songs.length, yearMin: span.yearMin, yearMax: span.yearMax })
  }
  return sortPerformerRows(rows, 'count', 'desc')
}

/** Sort performer rows; the unnamed group is always last. */
export function sortPerformerRows(rows: PerformerRow[], key: PerformerSortKey, dir: SortDir): PerformerRow[] {
  const sign = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const an = a.name === null
    const bn = b.name === null
    if (an !== bn) return an ? 1 : -1
    const r =
      key === 'count'
        ? (a.count - b.count) * sign
        : key === 'village'
          ? roBase.compare(normalize(a.villageLabel), normalize(b.villageLabel)) * sign
          : roBase.compare(normalize(a.name ?? ''), normalize(b.name ?? '')) * sign
    return r || roBase.compare(normalize(a.name ?? ''), normalize(b.name ?? '')) || b.count - a.count || (a.key < b.key ? -1 : 1)
  })
}

/** Per-year bars from the min to the max year of the set (zero-filled), plus the no-year count. */
export function timeline(songs: Song[]): Timeline {
  const span = spanOf(songs)
  if (span.yearMin === undefined || span.yearMax === undefined) return { perYear: [], unknownYear: span.unknownYear, max: 0 }
  const perYear: YearBar[] = []
  for (let y = span.yearMin; y <= span.yearMax; y++) perYear.push({ year: y, count: 0, genreCounts: {} })
  for (const s of songs) {
    const y = s.collected.year
    if (y === null) continue
    const bar = perYear[y - span.yearMin]
    bar.count++
    addGenre(bar.genreCounts, s)
  }
  return { perYear, unknownYear: span.unknownYear, max: perYear.reduce((m, b) => Math.max(m, b.count), 0) }
}

export interface GenreRow {
  genre: GenreId | null
  count: number
}

/** Counts per genre in fixed genre order (zero rows omitted), with a trailing null-genre row when present. */
export function genreRows(songs: Song[]): GenreRow[] {
  const counts: GenreCounts = {}
  let none = 0
  for (const s of songs) {
    if (s.genre) counts[s.genre] = (counts[s.genre] ?? 0) + 1
    else none++
  }
  const rows: GenreRow[] = GENRE_ORDER.filter((g) => (counts[g] ?? 0) > 0).map((g) => ({ genre: g, count: counts[g] ?? 0 }))
  if (none > 0) rows.push({ genre: null, count: none })
  return rows
}

export interface StyleRow {
  style: string | null
  count: number
}

/** Counts per verbatim style string, count descending, then name; null style last. */
export function styleRows(songs: Song[]): StyleRow[] {
  const counts = new Map<string, number>()
  let none = 0
  for (const s of songs) {
    if (s.style) counts.set(s.style, (counts.get(s.style) ?? 0) + 1)
    else none++
  }
  const rows: StyleRow[] = [...counts].map(([style, count]) => ({ style, count }))
  rows.sort((a, b) => b.count - a.count || roBase.compare(normalize(a.style ?? ''), normalize(b.style ?? '')))
  if (none > 0) rows.push({ style: null, count: none })
  return rows
}

/** Computed neighbours for the song record (FRONTEND-SPEC 9 RelatedMelodies): same performer in the
 *  same village, then same village (same genre first), then same county with the same genre. */
export function relatedNeighbours(song: Song, index: CatalogIndex, limit: number, exclude: Set<string>): { heading: string; songs: Song[] }[] {
  const out: { heading: string; songs: Song[] }[] = []
  const seen = new Set(exclude)
  seen.add(song.id)
  let left = limit
  const take = (heading: string, candidates: Song[]) => {
    if (left <= 0) return
    const picked: Song[] = []
    for (const c of candidates) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      picked.push(c)
      if (picked.length >= left) break
    }
    if (picked.length) {
      out.push({ heading, songs: picked })
      left -= picked.length
    }
  }
  const byTitle = (a: Song, b: Song) => roBase.compare(titleKey(a), titleKey(b)) || (a.id < b.id ? -1 : 1)
  const placeId = song.location.placeId ?? null
  const place = placeId ? index.placeById.get(placeId) : undefined
  const villageName = place && place.type === 'village' ? placeText(place, place.id) : (song.location.village ?? null)
  const name = song.performer.name?.trim()
  if (placeId && place?.type === 'village') {
    const here = index.songsAt(placeId)
    if (name) {
      const key = normalize(name)
      take(
        t('song.relatedPerformer', { name }),
        here.filter((s) => s.performer.name && normalize(s.performer.name) === key).sort(byTitle),
      )
    }
    const sameGenreFirst = [...here].sort((a, b) => Number(b.genre === song.genre) - Number(a.genre === song.genre) || byTitle(a, b))
    take(t('song.relatedVillage', { name: villageName ?? '' }), sameGenreFirst)
  }
  if (left > 0 && placeId && song.genre) {
    const parts = placeId.split('/')
    if (parts.length >= 3) {
      const countyId = parts.slice(0, 3).join('/')
      const county = index.placeById.get(countyId)
      if (county && county.type === 'county') {
        take(
          t('song.related.sameGenre', { name: placeText(county, county.id) }),
          index
            .songsUnder(countyId)
            .filter((s) => s.genre === song.genre)
            .sort(byTitle),
        )
      }
    }
  }
  return out
}
