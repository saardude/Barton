// Journey mapper state (FRONTEND-SPEC 14, JOURNEY-SPEC): types mirroring data/journeys.json,
// data/villages.json, data/context-events.json and data/geo/borders-*.json, plus the pure
// functions the screen needs (trip selection by id or date, border era by date, the context
// window, village status join, date wording, timeline layout, export). No React, no fetch.
import { t } from '../i18n/en'
import type { Song } from '../types/song'
import { normalize } from './normalize'
import { countryName } from './placeName'
import type { BordersMode } from './query'

// ---- Data shapes (data/schema/journey.schema.json, JOURNEY-SPEC 2-6) ------------------------

export type DatePrecision = 'day' | 'phrase' | 'month' | 'season' | 'year'
export type LocationConfidence = 'resolved' | 'label' | 'label-region' | 'unresolved'

export interface JourneyStop {
  seq: number
  placeId: string | null
  village: string | null
  villageHistorical: string | null
  county: string | null
  countyHistorical: string | null
  country: string | null
  lat: number | null
  lng: number | null
  arrival: string | null
  departure: string | null
  recordCount: number
  songIds: string[]
  kmFromPrevious: number | null
  locationConfidence: LocationConfidence
}

export interface JourneyDeparture {
  name: string
  lat: number
  lng: number
  confidence: 'documented' | 'assumed'
  note: string | null
}

export interface DatePeriod {
  start: string
  end: string
  precision: DatePrecision
  qualifiers: string[]
  raw: string | null
  uncertain: boolean
}

export interface Journey {
  id: string
  derivedFrom: 'gyuj-collections' | 'date-gap'
  kind: 'route' | 'cluster'
  collector: string
  label: string | null
  labelDateRaw: string | null
  labelPlaceRaw: string | null
  sourceUrl: string | null
  countOnline: number | null
  recordsOnline: boolean
  dateStart: string
  dateEnd: string
  dateConfidence: DatePrecision
  datePeriods: DatePeriod[]
  recordDateRange: { start: string; end: string } | null
  days: number | null
  departure: JourneyDeparture
  stops: JourneyStop[]
  distanceKm: number | null
  recordCount: number
  facts: {
    villages: number
    counties: string[]
    countiesHistorical: string[]
    ethnicGroups: Record<string, number>
    instruments: Record<string, number>
    genres: Record<string, number>
    performers: number
  }
  songIds: string[]
  nowIn: string[]
  romanianMaterial: { value: boolean | null; confidence: 'documented' | 'inferred' | 'unknown' } | null
  derivation: {
    gapDays: number
    jumpKm: number
    splitReasons: string[]
    generator: string
    attachedRecords?: { byMembership: number; byDateCounty: number }
  }
}

export type VillageStatus = 'existing' | 'renamed' | 'merged' | 'abandoned' | 'unknown'

export interface VillageEntry {
  id: string
  status: VillageStatus
  name: string | null
  nameHistorical: string | null
  qid: string | null
  wikidataUrl: string | null
  coord: { lat: number; lng: number } | null
  county: string | null
  countyHistorical: string | null
  names: {
    ro: string | null
    hu: string | null
    en: string | null
    native: string[]
    historical: { name?: string; until?: string | null; lang?: string }[] | string[]
    aliasesRo?: string[]
    aliasesHu?: string[]
  }
  admin: { commune: string | null; county: string | null; countyRo: string | null }
  dissolved: string | null
  inception: string | null
  replacedBy: string | { label?: string; name?: string; qid?: string } | null
  population: { value: number; asOf: string } | null
  evidence: string[]
  matchedVia?: string[]
}

export interface VillagesFile {
  _meta?: { attribution?: string; statusValues?: Record<string, string> }
  villages: Record<string, VillageEntry>
}

export type EventKind = 'border' | 'publication' | 'statement' | 'reception' | 'biography' | 'press' | 'other'

export interface ContextEvent {
  id: string
  date: string
  dateEnd?: string
  dateConfidence?: 'exact' | 'approximate'
  kind: EventKind
  title: string
  summary: string
  source?: { citation?: string; url?: string } | null
  places?: string[]
  quote?: string
}

export interface ContextEventsFile {
  _meta?: { note?: string }
  events: ContextEvent[]
}

export interface BorderSource {
  id: string
  title: string
  url: string
  licence: string
  attribution: string
}

export interface BorderFeatureProps {
  year: number | null
  level: 'country' | 'county'
  name: string
  nameHu: string | null
  nameRo: string | null
  source: string
  [k: string]: unknown
}

export interface BorderFile {
  type: 'FeatureCollection'
  meta?: { year?: number | null; description?: string; sources?: BorderSource[]; notes?: string[] }
  features: { type: 'Feature'; properties: BorderFeatureProps; geometry: GeoJSON.Geometry }[]
}

export type Era = '1910' | '1914' | '1920'
export const ERAS: Era[] = ['1910', '1914', '1920']
export const HISTORICAL_SETS: Era[] = ERAS

// ---- Dates ----------------------------------------------------------------------------------

export interface DateParts {
  y: number
  m?: number
  d?: number
}

/** Parse "YYYY", "YYYY-MM" or "YYYY-MM-DD"; undefined for anything else. */
export function parseIsoDate(s: string | null | undefined): DateParts | undefined {
  if (!s) return undefined
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s.trim())
  if (!m) return undefined
  const y = Number(m[1])
  const mo = m[2] ? Number(m[2]) : undefined
  const d = m[3] ? Number(m[3]) : undefined
  if (mo !== undefined && (mo < 1 || mo > 12)) return undefined
  if (d !== undefined && (d < 1 || d > 31)) return undefined
  return { y, m: mo, d }
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** Day number (days since 1970-01-01, may be negative) of the first day of the period. */
export function startDay(s: string): number {
  const p = parseIsoDate(s)
  if (!p) return Number.NaN
  return Date.UTC(p.y, (p.m ?? 1) - 1, p.d ?? 1) / 86400000
}

/** Day number of the last day of the period (end of year / month / the day itself). */
export function endDay(s: string): number {
  const p = parseIsoDate(s)
  if (!p) return Number.NaN
  const m = p.m ?? 12
  const d = p.d ?? daysInMonth(p.y, m)
  return Date.UTC(p.y, m - 1, d) / 86400000
}

export function yearOf(s: string): number {
  return parseIsoDate(s)?.y ?? Number.NaN
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function monthName(m: number): string {
  return MONTHS[m - 1] ?? String(m)
}

/** "3 July 1909", "July 1909", "1909". */
export function formatIsoDate(s: string): string {
  const p = parseIsoDate(s)
  if (!p) return s
  if (p.d !== undefined && p.m !== undefined) return `${p.d} ${monthName(p.m)} ${p.y}`
  if (p.m !== undefined) return `${monthName(p.m)} ${p.y}`
  return String(p.y)
}

/** "3 to 21 July 1909", "27 December 1915 to 2 January 1916", "July to August 1909". */
export function formatDateRange(start: string, end: string): string {
  const a = parseIsoDate(start)
  const b = parseIsoDate(end)
  if (!a || !b) return start === end ? start : `${start} to ${end}`
  if (start === end) return formatIsoDate(start)
  if (a.d !== undefined && b.d !== undefined && a.m !== undefined && b.m !== undefined) {
    if (a.y === b.y && a.m === b.m) return `${a.d} to ${b.d} ${monthName(a.m)} ${a.y}`
    if (a.y === b.y) return `${a.d} ${monthName(a.m)} to ${b.d} ${monthName(b.m)} ${a.y}`
    return `${formatIsoDate(start)} to ${formatIsoDate(end)}`
  }
  if (a.m !== undefined && b.m !== undefined) {
    if (a.y === b.y) return `${monthName(a.m)} to ${monthName(b.m)} ${a.y}`
    return `${formatIsoDate(start)} to ${formatIsoDate(end)}`
  }
  return `${formatIsoDate(start)} to ${formatIsoDate(end)}`
}

export const PRECISION_WORDING: Record<DatePrecision, string> = {
  day: 'dated to the day',
  phrase: 'approximate: a ten-day window from the index wording',
  month: 'month known, days unknown',
  season: 'season known, dates unknown',
  year: 'year known only',
}

/**
 * The header's date line: index entries keep the printed wording verbatim; date-gap trips are
 * formatted to their precision (UI-COPY journey.dates.*).
 */
export function journeyDateText(j: Journey): { text: string; precision: DatePrecision; wording: string } {
  const precision = j.dateConfidence
  const wording = PRECISION_WORDING[precision]
  if (j.labelDateRaw) return { text: j.labelDateRaw, precision, wording }
  if (precision === 'year') return { text: t('journey.dates.year', { year: String(yearOf(j.dateStart)) }), precision, wording }
  return { text: formatDateRange(j.dateStart, j.dateEnd), precision, wording }
}

export function stopDateText(stop: JourneyStop): string | null {
  if (!stop.arrival) return null
  if (!stop.departure || stop.departure === stop.arrival) return formatIsoDate(stop.arrival)
  return formatDateRange(stop.arrival, stop.departure)
}

// ---- Selection ------------------------------------------------------------------------------

export interface TripSelection {
  journey: Journey
  /** How the journey was chosen: by id, because it covers the date, or as the nearest to the date. */
  by: 'trip' | 'date' | 'nearest'
  date?: string
}

/** Days between a date window and a journey range; 0 when they overlap. */
function distanceDays(j: Journey, from: number, to: number): number {
  const s = startDay(j.dateStart)
  const e = endDay(j.dateEnd)
  if (e < from) return from - e
  if (s > to) return s - to
  return 0
}

/**
 * Pick the journey for `query.trip` (by id) or for `query.date` (the journey covering that
 * day / month / year; when several do, the shortest; when none does, the nearest in time).
 */
export function selectTrip(journeys: Journey[], sel: { trip?: string; date?: string }): TripSelection | undefined {
  if (sel.trip) {
    const j = journeys.find((x) => x.id === sel.trip)
    if (j) return { journey: j, by: 'trip' }
  }
  if (sel.date && parseIsoDate(sel.date)) {
    const from = startDay(sel.date)
    const to = endDay(sel.date)
    let best: Journey | undefined
    let bestScore = Number.POSITIVE_INFINITY
    let covering = false
    for (const j of journeys) {
      const d = distanceDays(j, from, to)
      const span = endDay(j.dateEnd) - startDay(j.dateStart)
      if (d === 0) {
        if (!covering || span < bestScore) {
          best = j
          bestScore = span
          covering = true
        }
      } else if (!covering && d < bestScore) {
        best = j
        bestScore = d
      }
    }
    if (best) return { journey: best, by: covering ? 'date' : 'nearest', date: sel.date }
  }
  return undefined
}

// ---- Borders --------------------------------------------------------------------------------

/** AC-40: the 1910 set for dates before 1918-01-01, the 1920 set from 1918 onwards. */
export function eraForDate(date: string | undefined): '1910' | '1920' {
  const y = date ? yearOf(date) : Number.NaN
  if (Number.isNaN(y)) return '1910'
  return y < 1918 ? '1910' : '1920'
}

/** JOURNEY-SPEC 4: the finest historical layer for a year (1914 for the war years). */
export function layerForYear(y: number): Era {
  return y <= 1913 ? '1910' : y <= 1918 ? '1914' : '1920'
}

/** The historical border set for the explorer: from the year filter when set, else 1910 (AC-40). */
export function explorerEra(yearFrom: number | undefined, yearTo: number | undefined, eras: Era[]): Era {
  const y = yearFrom ?? yearTo
  if (y === undefined) return eras.includes('1910') ? '1910' : (eras[0] ?? '1910')
  const fine = layerForYear(y)
  if (eras.includes(fine)) return fine
  const coarse = eraForDate(String(y))
  return eras.includes(coarse) ? coarse : (eras[0] ?? coarse)
}

/** The default `borders` value: the trip's era when a trip or date is selected, else `now`. */
export function bordersDefault(sel: { journey?: Journey; date?: string }): BordersMode {
  if (sel.journey) return eraForDate(sel.journey.dateStart)
  if (sel.date) return eraForDate(sel.date)
  return 'now'
}

/** Which historical set a `borders` mode draws (`now` draws none; `both` uses the era). */
export function thenSetFor(mode: BordersMode, era: Era): Era | null {
  if (mode === 'now') return null
  if (mode === 'both') return era
  return mode
}

export function eraDescription(era: Era | 'now'): string {
  return t(`era.${era}`)
}

// ---- Context events -------------------------------------------------------------------------

const DAYS_2Y = 731

export interface EventInWindow {
  event: ContextEvent
  duringTrip: boolean
}

/** True when the event carries a citation; uncited events are never rendered (AC-43). */
export function isCited(e: ContextEvent): boolean {
  return Boolean(e.source && typeof e.source.citation === 'string' && e.source.citation.trim().length > 0)
}

/**
 * AC-43: cited events whose date range overlaps [start - 2 years, end + 2 years], sorted by
 * date; `duringTrip` marks the ones overlapping the trip's own range.
 */
export function contextEventsInWindow(events: ContextEvent[], dateStart: string, dateEnd: string): EventInWindow[] {
  const s = startDay(dateStart)
  const e = endDay(dateEnd)
  if (Number.isNaN(s) || Number.isNaN(e)) return []
  const from = s - DAYS_2Y
  const to = e + DAYS_2Y
  const out: EventInWindow[] = []
  for (const ev of events) {
    if (!isCited(ev)) continue
    const es = startDay(ev.date)
    const ee = endDay(ev.dateEnd ?? ev.date)
    if (Number.isNaN(es) || Number.isNaN(ee)) continue
    if (ee < from || es > to) continue
    out.push({ event: ev, duringTrip: ee >= s && es <= e })
  }
  return out.sort((a, b) => startDay(a.event.date) - startDay(b.event.date) || a.event.id.localeCompare(b.event.id))
}

export function eventKindLabel(kind: string): string {
  const key = `event.${kind}`
  const label = t(key)
  return label === key ? t('event.other') : label
}

/** The timeline's reference ticks: the outbreak of the war (1914) and Trianon (4 June 1920). */
export function referenceEvents(events: ContextEvent[]): { date: string; label: string; title: string }[] {
  const out: { date: string; label: string; title: string }[] = []
  const war = events.find((e) => e.kind === 'border' && e.date.startsWith('1914'))
  const trianon = events.find((e) => e.kind === 'border' && e.date === '1920-06-04')
  if (war) out.push({ date: war.date, label: '1914', title: war.title })
  else out.push({ date: '1914-07-28', label: '1914', title: '1914' })
  if (trianon) out.push({ date: trianon.date, label: '4 June 1920', title: trianon.title })
  else out.push({ date: '1920-06-04', label: '4 June 1920', title: '1920' })
  return out
}

// ---- Villages -------------------------------------------------------------------------------

export interface VillageLookup {
  byId: Map<string, VillageEntry>
  byName: Map<string, VillageEntry[]>
  attribution?: string
}

function nameKeys(v: VillageEntry): string[] {
  const keys = new Set<string>()
  const add = (s: string | null | undefined) => {
    if (s) keys.add(normalize(s))
  }
  add(v.name)
  add(v.nameHistorical)
  add(v.names?.ro)
  add(v.names?.hu)
  add(v.names?.en)
  return [...keys]
}

export function buildVillageLookup(file: VillagesFile | null | undefined): VillageLookup {
  const byId = new Map<string, VillageEntry>()
  const byName = new Map<string, VillageEntry[]>()
  if (file?.villages) {
    for (const [id, v] of Object.entries(file.villages)) {
      const entry = { ...v, id: v.id ?? id }
      byId.set(id, entry)
      for (const k of nameKeys(entry)) {
        const list = byName.get(k)
        if (list) list.push(entry)
        else byName.set(k, [entry])
      }
    }
  }
  return { byId, byName, attribution: file?._meta?.attribution }
}

export interface StopStatus {
  status: VillageStatus
  entry?: VillageEntry
  /** For `merged`: the name of the settlement it was merged into, when the data names it. */
  mergedInto?: string
  /** Modern name from Wikidata when the stop has none. */
  nameNow: string | null
  evidence: string[]
}

function replacedByName(v: VillageEntry): string | undefined {
  const r = v.replacedBy
  if (!r) return undefined
  if (typeof r === 'string') return r
  return r.label ?? r.name ?? r.qid
}

/**
 * AC-41: the status badge for a stop, joined by placeId, else by folded village + county;
 * a village missing from villages.json is `unknown`, never blank.
 */
export function stopStatus(lookup: VillageLookup | null | undefined, stop: Pick<JourneyStop, 'placeId' | 'village' | 'villageHistorical' | 'county' | 'countyHistorical'>): StopStatus {
  let entry = stop.placeId && lookup ? lookup.byId.get(stop.placeId) : undefined
  if (!entry && lookup) {
    const names = [stop.village, stop.villageHistorical].filter((n): n is string => Boolean(n))
    for (const n of names) {
      const cands = lookup.byName.get(normalize(n)) ?? []
      const county = stop.county ? normalize(stop.county) : null
      const countyHist = stop.countyHistorical ? normalize(stop.countyHistorical) : null
      const hit =
        cands.find((c) => (county && c.county && normalize(c.county) === county) || (countyHist && c.countyHistorical && normalize(c.countyHistorical) === countyHist)) ??
        (cands.length === 1 ? cands[0] : undefined)
      if (hit) {
        entry = hit
        break
      }
    }
  }
  if (!entry) return { status: 'unknown', nameNow: stop.village, evidence: [t('journey.statusNoEntry')] }
  const status: VillageStatus = (['existing', 'renamed', 'merged', 'abandoned', 'unknown'] as VillageStatus[]).includes(entry.status) ? entry.status : 'unknown'
  return {
    status,
    entry,
    mergedInto: status === 'merged' ? replacedByName(entry) : undefined,
    nameNow: stop.village ?? entry.names?.ro ?? entry.name ?? null,
    evidence: entry.evidence ?? [],
  }
}

export function statusBadgeText(s: Pick<StopStatus, 'status' | 'mergedInto'>): string {
  if (s.status === 'merged') return t('status.merged', { name: s.mergedInto ?? t('facet.unknown') })
  return t(`status.${s.status}`)
}

// ---- Polity then / now ---------------------------------------------------------------------

/** Countries whose Bartok-era stops lay in the Kingdom of Hungary (Transleithania). */
const TRANSLEITHANIA = new Set(['HU', 'SK', 'RO', 'RS', 'UA', 'HR'])

/**
 * The state a stop belonged to at the trip date, derived from the year and the present-day
 * country only (not from the source). Before 1918: the Kingdom of Hungary within
 * Austria-Hungary; 1919: in transition; from 1920 (Trianon): the successor state.
 */
export function polityThen(year: number, country: string | null): string {
  if (!country) return t('facet.unknown')
  const c = country.toUpperCase()
  if (Number.isNaN(year)) return countryName(c)
  if (year <= 1918) {
    if (TRANSLEITHANIA.has(c)) return t('journey.polity.kingdomOfHungary')
    if (c === 'AT') return t('journey.polity.austriaHungary')
    if (c === 'DZ') return t('journey.polity.frenchAlgeria')
    return countryName(c)
  }
  if (year === 1919) return t('journey.polity.transition')
  switch (c) {
    case 'RO':
      return 'Romania'
    case 'HU':
      return 'Hungary'
    case 'SK':
    case 'UA':
      return 'Czechoslovakia'
    case 'RS':
    case 'HR':
      return year < 1929 ? t('journey.polity.scs') : 'Yugoslavia'
    case 'DZ':
      return t('journey.polity.frenchAlgeria')
    default:
      return countryName(c)
  }
}

/** Distinct "then" polities and "now" countries of a journey's stops (label counts). */
export function journeyPolities(j: Journey): { then: string[]; now: string[] } {
  const y = yearOf(j.dateStart)
  const countries = j.stops.map((s) => s.country).filter((c): c is string => Boolean(c))
  const nowCodes = countries.length ? [...new Set(countries)] : j.nowIn
  const then = [...new Set(nowCodes.map((c) => polityThen(y, c)))]
  const now = nowCodes.map((c) => countryName(c))
  return { then, now }
}

// ---- Timeline layout ------------------------------------------------------------------------

export interface TimelineMark {
  id: string
  /** 0..1 along the track. */
  x0: number
  x1: number
  lane: number
  group: 'index' | 'gap'
  fuzzy: boolean
}

export interface TimelineLayout {
  yearMin: number
  yearMax: number
  marks: TimelineMark[]
  lanes: { index: number; gap: number }
}

/** Auto range: first year of the earliest start to the last year of the latest end, inclusive. */
export function journeyYearRange(journeys: Journey[]): { yearMin: number; yearMax: number } {
  let yearMin = Number.POSITIVE_INFINITY
  let yearMax = Number.NEGATIVE_INFINITY
  for (const j of journeys) {
    const a = yearOf(j.dateStart)
    const b = yearOf(j.dateEnd)
    if (!Number.isNaN(a)) yearMin = Math.min(yearMin, a)
    if (!Number.isNaN(b)) yearMax = Math.max(yearMax, b)
  }
  if (!Number.isFinite(yearMin)) return { yearMin: 1904, yearMax: 1945 }
  return { yearMin, yearMax }
}

/**
 * Position every journey on a track from 1 January of yearMin to 31 December of yearMax;
 * width = days (callers enforce the 6 px minimum). Index entries and date-gap trips are packed
 * into separate lane groups so overlapping bars never hide one another.
 */
export function timelineLayout(journeys: Journey[], minWidthFraction = 0): TimelineLayout {
  const { yearMin, yearMax } = journeyYearRange(journeys)
  const t0 = startDay(String(yearMin))
  const t1 = endDay(String(yearMax)) + 1
  const span = Math.max(1, t1 - t0)
  const lanesEnd: Record<'index' | 'gap', number[]> = { index: [], gap: [] }
  const marks: TimelineMark[] = []
  const sorted = [...journeys].sort((a, b) => startDay(a.dateStart) - startDay(b.dateStart) || a.id.localeCompare(b.id))
  for (const j of sorted) {
    const s = startDay(j.dateStart)
    const e = endDay(j.dateEnd) + 1
    if (Number.isNaN(s) || Number.isNaN(e)) continue
    const x0 = (s - t0) / span
    const x1 = Math.max((e - t0) / span, x0 + minWidthFraction)
    const group: 'index' | 'gap' = j.derivedFrom === 'gyuj-collections' ? 'index' : 'gap'
    const ends = lanesEnd[group]
    let lane = ends.findIndex((end) => end <= x0)
    if (lane < 0) {
      lane = ends.length
      ends.push(x1)
    } else ends[lane] = x1
    marks.push({ id: j.id, x0, x1, lane, group, fuzzy: j.kind === 'cluster' })
  }
  return { yearMin, yearMax, marks, lanes: { index: lanesEnd.index.length, gap: lanesEnd.gap.length } }
}

/** 0..1 position of a date on the same track. */
export function timelinePosition(date: string, layout: Pick<TimelineLayout, 'yearMin' | 'yearMax'>): number {
  const t0 = startDay(String(layout.yearMin))
  const t1 = endDay(String(layout.yearMax)) + 1
  const d = startDay(date)
  if (Number.isNaN(d)) return 0
  return Math.min(1, Math.max(0, (d - t0) / (t1 - t0)))
}

// ---- Facts per stop -------------------------------------------------------------------------

export interface StopFacts {
  genres: [string, number][]
  ethnicities: [string, number][]
  instruments: [string, number][]
  songs: Song[]
}

function topCounts(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** What was recorded at a stop, from the catalogue's records (ethnicity as stated by the source). */
export function stopFacts(stop: JourneyStop, songById: Map<string, Song>): StopFacts {
  const genres = new Map<string, number>()
  const eth = new Map<string, number>()
  const ins = new Map<string, number>()
  const songs: Song[] = []
  for (const id of stop.songIds) {
    const s = songById.get(id)
    if (!s) continue
    songs.push(s)
    if (s.genre) genres.set(s.genre, (genres.get(s.genre) ?? 0) + 1)
    if (s.performer.ethnicity) eth.set(s.performer.ethnicity, (eth.get(s.performer.ethnicity) ?? 0) + 1)
    for (const i of s.instrument) ins.set(i, (ins.get(i) ?? 0) + 1)
  }
  return { genres: topCounts(genres), ethnicities: topCounts(eth), instruments: topCounts(ins), songs }
}

/** Songs with a collector matching Bartok and no year: in no trip, listed as unmapped (AC-42). */
export function undatedBartokSongs(songs: Song[]): Song[] {
  const re = /bart[oó]k/i
  return songs.filter((s) => s.collected.year === null && s.collector !== null && re.test(s.collector))
}

// ---- Route geometry -------------------------------------------------------------------------

export interface RouteLeg {
  from: [number, number]
  to: [number, number]
  kind: 'assumed' | 'known'
  fromSeq: number
  toSeq: number
}

/** Legs between consecutive resolved points, departure first (JOURNEY-SPEC 2.2, MAP-SPEC 11.2). */
export function routeLegs(j: Journey): RouteLeg[] {
  if (j.kind !== 'route') return []
  const legs: RouteLeg[] = []
  let prev: { pt: [number, number]; seq: number } | null = { pt: [j.departure.lat, j.departure.lng], seq: 0 }
  for (const s of j.stops) {
    if (s.lat === null || s.lng === null || s.locationConfidence === 'unresolved') continue
    const pt: [number, number] = [s.lat, s.lng]
    if (prev) legs.push({ from: prev.pt, to: pt, kind: prev.seq === 0 && j.departure.confidence === 'assumed' ? 'assumed' : 'known', fromSeq: prev.seq, toSeq: s.seq })
    prev = { pt, seq: s.seq }
  }
  return legs
}

export function resolvedStops(j: Journey): JourneyStop[] {
  return j.stops.filter((s) => s.lat !== null && s.lng !== null && s.locationConfidence !== 'unresolved')
}

export function unresolvedStops(j: Journey): JourneyStop[] {
  return j.stops.filter((s) => s.lat === null || s.lng === null || s.locationConfidence === 'unresolved')
}

// ---- Export ---------------------------------------------------------------------------------

export interface JourneyExport {
  generatedAt: string
  attribution: { text: string; villages?: string; borders: string[] }
  journey: Journey
  stops: (JourneyStop & { status: VillageStatus; mergedInto?: string; wikidataUrl?: string | null })[]
  records: Song[]
}

export function buildJourneyExport(j: Journey, songs: Song[], lookup: VillageLookup | null, borderAttributions: string[], now = new Date()): JourneyExport {
  const stops = j.stops.map((s) => {
    const st = stopStatus(lookup, s)
    return { ...s, status: st.status, mergedInto: st.mergedInto, wikidataUrl: st.entry?.wikidataUrl ?? null }
  })
  return {
    generatedAt: now.toISOString(),
    attribution: { text: `${t('footer.data')} ${t('footer.independent')}`, villages: lookup?.attribution, borders: borderAttributions },
    journey: j,
    stops,
    records: songs,
  }
}

export function journeyFileName(j: Journey): string {
  return `bartok-journey-${j.id}.json`
}

/** True when the loose catalogue journey list has the full journeys.json shape. */
export function isJourney(x: unknown): x is Journey {
  if (!x || typeof x !== 'object') return false
  const j = x as Record<string, unknown>
  return typeof j.id === 'string' && typeof j.dateStart === 'string' && typeof j.dateEnd === 'string' && Array.isArray(j.stops) && typeof j.departure === 'object' && j.departure !== null
}

// ---- Journey list: data quality, featured trip, grouping (owner feedback, FRONTEND-SPEC 14.4) ----

/**
 * Optional hand-researched itineraries (data/journeys-curated.json), keyed by the journeys.json
 * id. Designed for the research agent's output; every field is optional so a partial file works.
 */
export interface CuratedJourney {
  id: string
  featured?: boolean
  title?: string
  summary?: string
  itinerary?: { date?: string | null; place: string; placeNow?: string | null; note?: string | null }[]
  sources?: { citation: string; url?: string | null }[]
}

export interface CuratedFile {
  _meta?: Record<string, unknown>
  journeys: CuratedJourney[]
}

export type JourneyQuality = 'sourced' | 'documented' | 'dates' | 'index'

export function buildCuratedLookup(file: CuratedFile | CuratedJourney[] | null | undefined): Map<string, CuratedJourney> {
  const list = Array.isArray(file) ? file : (file?.journeys ?? [])
  return new Map(list.filter((c) => c && typeof c.id === 'string').map((c) => [c.id, c]))
}

/**
 * What the data can vouch for: `sourced` (a curated itinerary with citations), `documented`
 * (a trip index entry with records), `index` (an index entry without any record online) or
 * `dates` (a run of record dates only, no itinerary source). Text badges, never colour-coded.
 */
export function journeyQuality(j: Journey, curated?: CuratedJourney | null): JourneyQuality {
  if (curated && (curated.sources?.length ?? 0) > 0) return 'sourced'
  if (j.derivedFrom === 'date-gap') return 'dates'
  return j.recordCount > 0 ? 'documented' : 'index'
}

export function qualityLabel(q: JourneyQuality): string {
  return t(`journey.quality.${q}`)
}

/** Machine-made date-gap trips with one record or one stop: hidden behind "Show all derived trips". */
export function isMinorDerived(j: Journey): boolean {
  return j.derivedFrom === 'date-gap' && (j.recordCount <= 1 || j.stops.length <= 1)
}

/** The trip to open on arrival: a curated `featured` entry, else the best-documented trip. */
export function featuredJourney(journeys: Journey[], curated?: Map<string, CuratedJourney>): Journey | undefined {
  const flagged = journeys.filter((j) => curated?.get(j.id)?.featured)
  if (flagged.length) return flagged.sort((a, b) => b.recordCount - a.recordCount)[0]
  const rank = (j: Journey) => {
    const q = journeyQuality(j, curated?.get(j.id))
    return q === 'sourced' ? 3 : q === 'documented' ? 2 : q === 'dates' && !isMinorDerived(j) ? 1 : 0
  }
  return [...journeys].sort((a, b) => rank(b) - rank(a) || b.recordCount - a.recordCount || b.stops.length - a.stops.length || startDay(a.dateStart) - startDay(b.dateStart))[0]
}

/** The list row's title: the place named on the index, else the historical counties, else the label. */
export function journeyPlaceTitle(j: Journey): string {
  if (j.labelPlaceRaw) return j.labelPlaceRaw
  const counties = j.facts.countiesHistorical.length ? j.facts.countiesHistorical : j.facts.counties
  if (counties.length) return counties.join(', ')
  const places = [...new Set(j.stops.map((s) => s.villageHistorical ?? s.village).filter((n): n is string => Boolean(n)))]
  return places.length ? places.slice(0, 3).join(', ') : j.label || j.id
}

function searchText(j: Journey): string {
  return normalize(
    [j.label, j.labelPlaceRaw, j.labelDateRaw, j.dateStart.slice(0, 4), ...j.facts.counties, ...j.facts.countiesHistorical, ...j.stops.map((s) => `${s.village ?? ''} ${s.villageHistorical ?? ''}`)]
      .filter(Boolean)
      .join(' '),
  )
}

export interface JourneyListFilter {
  showAll: boolean
  search: string
  year?: number
  /** Always kept in the list (the selected trip), even when it would otherwise be hidden. */
  keepId?: string
}

/** The trips the list shows, in date order. */
export function visibleJourneys(journeys: Journey[], f: JourneyListFilter): Journey[] {
  const q = normalize(f.search.trim())
  return [...journeys]
    .filter((j) => {
      if (j.id === f.keepId) return true
      if (!f.showAll && isMinorDerived(j)) return false
      if (f.year !== undefined && yearOf(j.dateStart) !== f.year) return false
      if (q && !searchText(j).includes(q)) return false
      return true
    })
    .sort((a, b) => startDay(a.dateStart) - startDay(b.dateStart) || a.id.localeCompare(b.id))
}

export function groupJourneysByYear(journeys: Journey[]): { year: number; journeys: Journey[] }[] {
  const groups = new Map<number, Journey[]>()
  for (const j of journeys) {
    const y = yearOf(j.dateStart)
    const list = groups.get(y)
    if (list) list.push(j)
    else groups.set(y, [j])
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([year, list]) => ({ year, journeys: list }))
}

/** Trips per year for the compact year strip (every year from the first to the last). */
export function journeysPerYear(journeys: Journey[]): { year: number; n: number }[] {
  const { yearMin, yearMax } = journeyYearRange(journeys)
  const counts = new Map<number, number>()
  for (const j of journeys) {
    const y = yearOf(j.dateStart)
    if (!Number.isNaN(y)) counts.set(y, (counts.get(y) ?? 0) + 1)
  }
  const out: { year: number; n: number }[] = []
  for (let y = yearMin; y <= yearMax; y++) out.push({ year: y, n: counts.get(y) ?? 0 })
  return out
}
