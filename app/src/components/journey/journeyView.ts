// The per-screen derived object shared by the journey components (FRONTEND-SPEC 14.2): the
// selected journey with its stops joined to villages.json and the catalogue, the route legs,
// the context events in the +/- 2 year window and the border era.
import type { CatalogIndex } from '../../data/catalogIndex'
import {
  bordersDefault,
  formatDateRange,
  contextEventsInWindow,
  eraForDate,
  resolvedStops,
  routeLegs,
  stopFacts,
  stopStatus,
  unresolvedStops,
  yearOf,
  type ContextEvent,
  type EventInWindow,
  type Journey,
  type JourneyStop,
  type RouteLeg,
  type StopFacts,
  type StopStatus,
  type TripSelection,
  type VillageLookup,
} from '../../state/journeys'
import type { BordersMode } from '../../state/query'
import type { Song } from '../../types/song'

export interface StopView {
  stop: JourneyStop
  status: StopStatus
  facts: StopFacts
  /** Name as printed on the source (usually Hungarian). */
  nameThen: string
  /** Modern name, or null when unknown. */
  nameNow: string | null
  year: number
  resolved: boolean
  /** Records of this stop matching the active filters (equals recordCount without filters). */
  matching: number
}

export interface JourneyView {
  journey: Journey
  by: TripSelection['by']
  date?: string
  era: '1910' | '1920'
  bordersDefault: BordersMode
  stops: StopView[]
  resolved: JourneyStop[]
  unresolved: JourneyStop[]
  legs: RouteLeg[]
  events: EventInWindow[]
  songs: Song[]
  /** Songs of the trip matching the active filters. */
  matchingSongs: Song[]
  filtersActive: boolean
}

export function stopNames(stop: JourneyStop): { nameThen: string; nameNow: string | null } {
  const nameThen = stop.villageHistorical ?? stop.village ?? stop.countyHistorical ?? stop.county ?? '?'
  const nameNow = stop.village ?? (stop.villageHistorical ? null : (stop.county ?? null))
  return { nameThen, nameNow }
}

export function buildJourneyView(
  sel: TripSelection,
  index: CatalogIndex,
  villages: VillageLookup | null,
  events: ContextEvent[] | null,
  matching: { ids: Set<string> | null; filtersActive: boolean },
): JourneyView {
  const j = sel.journey
  const year = yearOf(j.dateStart)
  const stops: StopView[] = j.stops.map((stop) => {
    const facts = stopFacts(stop, index.songById)
    const status = stopStatus(villages, stop)
    const { nameThen, nameNow } = stopNames(stop)
    const stopYear = stop.arrival ? yearOf(stop.arrival) : year
    const resolved = stop.lat !== null && stop.lng !== null && stop.locationConfidence !== 'unresolved'
    const matchingCount = matching.ids ? stop.songIds.filter((id) => matching.ids!.has(id)).length : stop.recordCount
    return { stop, status, facts, nameThen, nameNow: nameNow ?? status.nameNow, year: Number.isNaN(stopYear) ? year : stopYear, resolved, matching: matchingCount }
  })
  const songs = j.songIds.map((id) => index.songById.get(id)).filter((s): s is Song => Boolean(s))
  const matchingSongs = matching.ids ? songs.filter((s) => matching.ids!.has(s.id)) : songs
  return {
    journey: j,
    by: sel.by,
    date: sel.date,
    era: eraForDate(j.dateStart),
    bordersDefault: bordersDefault({ journey: j }),
    stops,
    resolved: resolvedStops(j),
    unresolved: unresolvedStops(j),
    legs: routeLegs(j),
    events: events ? contextEventsInWindow(events, j.dateStart, j.dateEnd) : [],
    songs,
    matchingSongs,
    filtersActive: matching.filtersActive,
  }
}

/** The label shown for a journey everywhere: the index label verbatim, else a derived one. */
export function journeyTitle(j: Journey): string {
  if (j.label) return j.label
  const places = j.facts.countiesHistorical.length ? j.facts.countiesHistorical.join(', ') : j.facts.counties.join(', ')
  const dates = formatDateRange(j.dateStart, j.dateEnd)
  return places ? `${dates}: ${places}` : `${dates} (${j.id})`
}
