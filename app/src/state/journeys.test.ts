// Unit tests for the journey mapper's pure functions (AC-38 to AC-43): trip selection by date,
// border era by date (1917-12-31 vs 1918-01-01), the +/- 2 year context window, the status
// badge mapping, date wording and the timeline layout.
import { describe, expect, it } from 'vitest'
import {
  bordersDefault,
  buildVillageLookup,
  contextEventsInWindow,
  eraForDate,
  formatDateRange,
  journeyDateText,
  journeyPolities,
  layerForYear,
  polityThen,
  routeLegs,
  selectTrip,
  statusBadgeText,
  stopStatus,
  timelineLayout,
  type ContextEvent,
  type Journey,
  type JourneyStop,
  type VillagesFile,
} from './journeys'
import { fixtureJourneys, fixtureVillages } from './journeys.fixture'

const journeys: Journey[] = fixtureJourneys
const byId = (id: string) => journeys.find((j) => j.id === id)!

describe('selectTrip', () => {
  it('selects by id first', () => {
    expect(selectTrip(journeys, { trip: 'gyuj-50', date: '1913-03' })?.journey.id).toBe('gyuj-50')
  })
  it('an unknown id falls through to the date', () => {
    const sel = selectTrip(journeys, { trip: 'nope', date: '1909-07' })
    expect(sel?.by).toBe('date')
    expect(sel?.journey.id).toBe('gyuj-50')
  })
  it('date=YYYY-MM picks the trip covering that month', () => {
    const sel = selectTrip(journeys, { date: '1913-03' })
    expect(sel?.by).toBe('date')
    expect(sel?.journey.id).toBe('J-1913-03-01')
  })
  it('a day inside a route trip selects it; several covering trips: the shortest wins', () => {
    expect(selectTrip(journeys, { date: '1913-03-16' })?.journey.id).toBe('J-1913-03-01')
    // 1910 is covered by the year cluster and by the July route; the shorter route wins for July
    expect(selectTrip(journeys, { date: '1910-07-05' })?.journey.id).toBe('J-1910-07-01')
    // April 1910 is covered only by the year cluster
    expect(selectTrip(journeys, { date: '1910-04' })?.journey.id).toBe('J-1910-00-01')
  })
  it('a date no trip covers selects the nearest and says so', () => {
    const sel = selectTrip(journeys, { date: '1911-02' })
    expect(sel?.by).toBe('nearest')
    // the 1910 year cluster ends 31 December 1910, nearer than the July route
    expect(sel?.journey.id).toBe('J-1910-00-01')
    expect(sel?.date).toBe('1911-02')
    const later = selectTrip(journeys, { date: '1925' })
    expect(later?.journey.id).toBe('J-1918-05-01')
  })
  it('returns undefined without trip or date, or with a malformed date', () => {
    expect(selectTrip(journeys, {})).toBeUndefined()
    expect(selectTrip(journeys, { date: '19x' })).toBeUndefined()
  })
})

describe('border era (AC-40)', () => {
  it('1917-12-31 is the 1910 set, 1918-01-01 the 1920 set', () => {
    expect(eraForDate('1917-12-31')).toBe('1910')
    expect(eraForDate('1918-01-01')).toBe('1920')
    expect(eraForDate('1909-07')).toBe('1910')
    expect(eraForDate('1938')).toBe('1920')
  })
  it('the default borders value is the era of the trip or date, else now', () => {
    expect(bordersDefault({ journey: byId('gyuj-50') })).toBe('1910')
    expect(bordersDefault({ journey: byId('J-1918-05-01') })).toBe('1920')
    expect(bordersDefault({ date: '1917-12-31' })).toBe('1910')
    expect(bordersDefault({ date: '1918-01-01' })).toBe('1920')
    expect(bordersDefault({})).toBe('now')
  })
  it('layerForYear follows JOURNEY-SPEC 4 (1914 for the war years)', () => {
    expect(layerForYear(1913)).toBe('1910')
    expect(layerForYear(1914)).toBe('1914')
    expect(layerForYear(1918)).toBe('1914')
    expect(layerForYear(1919)).toBe('1920')
  })
})

const events: ContextEvent[] = [
  { id: 'e1907', date: '1907-07', dateEnd: '1907-08', kind: 'biography', title: 'A', summary: 's', source: { citation: 'c' } },
  { id: 'e1911', date: '1911-06', kind: 'publication', title: 'B', summary: 's', source: { citation: 'c', url: 'https://example.org' } },
  { id: 'e1913', date: '1913', kind: 'publication', title: 'C', summary: 's', source: { citation: 'c' } },
  { id: 'e1914', date: '1914-07-28', dateEnd: '1918-11-11', kind: 'border', title: 'War', summary: 's', source: { citation: 'c' } },
  { id: 'e1920', date: '1920-06-04', kind: 'border', title: 'Trianon', summary: 's', source: { citation: 'c' } },
  { id: 'uncited', date: '1909-08', kind: 'statement', title: 'X', summary: 's', source: { citation: '' } },
  { id: 'nosource', date: '1909-09', kind: 'statement', title: 'Y', summary: 's' },
]

describe('contextEventsInWindow (AC-43)', () => {
  it('keeps events within start - 2 years to end + 2 years, sorted, and drops uncited ones', () => {
    const out = contextEventsInWindow(events, '1909-07-03', '1909-07-21')
    expect(out.map((e) => e.event.id)).toEqual(['e1907', 'e1911'])
    expect(out.every((e) => !['uncited', 'nosource'].includes(e.event.id))).toBe(true)
  })
  it('an event range overlapping the window counts even when it starts before it', () => {
    const out = contextEventsInWindow(events, '1918-05-18', '1918-05-18')
    // Trianon (1920-06-04) is 748 days after 18 May 1918: outside the two-year window
    expect(out.map((e) => e.event.id)).toEqual(['e1914'])
    expect(out[0].duringTrip).toBe(true)
    expect(contextEventsInWindow(events, '1918-05-18', '1918-06-05').map((e) => e.event.id)).toEqual(['e1914', 'e1920'])
  })
  it('edge: exactly two years away is included, a day further is not', () => {
    // trip ends 1911-06-30; e1913 is a year-precision event starting 1913-01-01 (within 731 days)
    expect(contextEventsInWindow(events, '1911-06', '1911-06').map((e) => e.event.id)).toEqual(['e1911', 'e1913'])
    expect(contextEventsInWindow(events, '1910-10', '1910-10').map((e) => e.event.id)).toEqual(['e1911'])
  })
})

describe('village status badge (AC-41)', () => {
  const lookup = buildVillageLookup(fixtureVillages as VillagesFile)
  const stop = (over: Partial<JourneyStop>): JourneyStop => ({
    seq: 1,
    placeId: null,
    village: null,
    villageHistorical: null,
    county: null,
    countyHistorical: null,
    country: 'RO',
    lat: 46,
    lng: 22,
    arrival: '1909-07-03',
    departure: '1909-07-03',
    recordCount: 1,
    songIds: [],
    kmFromPrevious: null,
    locationConfidence: 'resolved',
    ...over,
  })
  it('maps every status to its badge text and joins by placeId', () => {
    expect(statusBadgeText(stopStatus(lookup, stop({ placeId: 'ro/crisana/bihor/beius' })))).toBe('existing')
    expect(statusBadgeText(stopStatus(lookup, stop({ placeId: 'ro/crisana/bihor/ineu' })))).toBe('renamed')
    expect(statusBadgeText(stopStatus(lookup, stop({ placeId: 'ro/crisana/bihor/nomap' })))).toBe('status unknown')
    expect(statusBadgeText(stopStatus(lookup, stop({ placeId: 'hu/unresolved/gyoma' })))).toBe('abandoned')
    expect(statusBadgeText(stopStatus(lookup, stop({ placeId: 'ro/transylvania/cluj/merged' })))).toBe('merged into Izvoru Crișului')
  })
  it('a village missing from villages.json is unknown, never blank', () => {
    const s = stopStatus(lookup, stop({ placeId: 'ro/nowhere/x/y', village: 'Nowhere' }))
    expect(s.status).toBe('unknown')
    expect(statusBadgeText(s)).toBe('status unknown')
    expect(s.evidence.length).toBeGreaterThan(0)
    expect(stopStatus(null, stop({})).status).toBe('unknown')
  })
  it('falls back to a folded name + county join when the placeId is missing', () => {
    const s = stopStatus(lookup, stop({ village: 'Beius', county: 'Bihor' }))
    expect(s.status).toBe('existing')
    expect(s.entry?.id).toBe('ro/crisana/bihor/beius')
    const hist = stopStatus(lookup, stop({ villageHistorical: 'Köröskisjenő', countyHistorical: 'Bihar' }))
    expect(hist.status).toBe('renamed')
  })
  it('the status expander carries the evidence and the Wikidata link', () => {
    const s = stopStatus(lookup, stop({ placeId: 'ro/crisana/bihor/ineu' }))
    expect(s.evidence[0]).toMatch(/score/)
    expect(s.entry?.wikidataUrl).toMatch(/^https:\/\/www\.wikidata\.org/)
  })
})

describe('date wording', () => {
  it('formats ranges to their precision', () => {
    expect(formatDateRange('1909-07-03', '1909-07-21')).toBe('3 to 21 July 1909')
    expect(formatDateRange('1915-12-27', '1916-01-02')).toBe('27 December 1915 to 2 January 1916')
    expect(formatDateRange('1909-07', '1909-08')).toBe('July to August 1909')
    expect(formatDateRange('1909-07', '1909-07')).toBe('July 1909')
    expect(formatDateRange('1910', '1910')).toBe('1910')
  })
  it('index entries keep the printed date wording; date-gap trips are formatted', () => {
    expect(journeyDateText(byId('gyuj-50')).text).toBe('July-August, 1909')
    expect(journeyDateText(byId('gyuj-50')).precision).toBe('month')
    expect(journeyDateText(byId('J-1913-03-01')).text).toBe('15 to 17 March 1913')
    expect(journeyDateText(byId('J-1910-00-01')).text).toBe('1910, approximate')
  })
})

describe('polity then / now', () => {
  it('Kingdom of Hungary before 1918, Romania after 1920 for stops now in RO', () => {
    expect(polityThen(1909, 'RO')).toBe('Kingdom of Hungary (Austria-Hungary)')
    expect(polityThen(1918, 'RO')).toBe('Kingdom of Hungary (Austria-Hungary)')
    expect(polityThen(1920, 'RO')).toBe('Romania')
    expect(polityThen(1938, 'SK')).toBe('Czechoslovakia')
    expect(polityThen(1919, 'RO')).toMatch(/^1919/)
    const p = journeyPolities(byId('gyuj-50'))
    expect(p.then).toEqual(['Kingdom of Hungary (Austria-Hungary)'])
    expect(p.now).toEqual(['Romania'])
  })
})

describe('route legs and timeline layout', () => {
  it('draws legs between resolved points only, the departure leg assumed', () => {
    const legs = routeLegs(byId('J-1913-03-01'))
    expect(legs.map((l) => `${l.fromSeq}-${l.toSeq}:${l.kind}`)).toEqual(['0-1:assumed', '1-3:known'])
    expect(routeLegs(byId('gyuj-50'))).toEqual([])
  })
  it('positions every trip on the track in separate lane groups', () => {
    const layout = timelineLayout(journeys)
    expect(layout.yearMin).toBe(1909)
    expect(layout.yearMax).toBe(1918)
    expect(layout.marks.length).toBe(journeys.length)
    const gyuj = layout.marks.find((m) => m.id === 'gyuj-50')!
    expect(gyuj.group).toBe('index')
    expect(gyuj.x0).toBeGreaterThanOrEqual(0)
    expect(gyuj.x1).toBeGreaterThan(gyuj.x0)
    const cluster = layout.marks.find((m) => m.id === 'J-1910-00-01')!
    expect(cluster.fuzzy).toBe(true)
    // the July 1910 route overlaps the 1910 year cluster, so it sits on another lane
    const route = layout.marks.find((m) => m.id === 'J-1910-07-01')!
    expect(route.lane).not.toBe(cluster.lane)
  })
})
