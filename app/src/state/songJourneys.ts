// Song -> journeys lookup for the record page: a record is on a journey when its id is in the
// journey's songIds or in one of its stops' songIds; index trips can also be matched through
// the record's `journey.collectionId` (journey id `gyuj-<collectionId>`).
import type { Song } from '../types/song'
import {
  journeyPlaceTitle,
  journeyQuality,
  startDay,
  type CuratedJourney,
  type Journey,
  type JourneyQuality,
  type JourneyStop,
} from './journeys'

export interface SongJourneyRef {
  journey: Journey
  quality: JourneyQuality
  /** The stop that holds the record, when a stop lists it. */
  stop?: JourneyStop
  /** 1-based position of that stop in the journey's stop order. */
  stopIndex?: number
  stopCount: number
  title: string
}

const RANK: Record<JourneyQuality, number> = { sourced: 3, documented: 2, dates: 1, index: 0 }

export function stopPlaceName(stop: JourneyStop): string | null {
  const modern = stop.village ?? stop.county
  const hist = stop.villageHistorical ?? (stop.village ? null : stop.countyHistorical)
  if (modern && hist && hist !== modern) return `${modern} (${hist})`
  return modern ?? hist
}

export function journeysForSong(
  song: Pick<Song, 'id' | 'journey'>,
  journeys: Journey[],
  curated?: Map<string, CuratedJourney>,
): SongJourneyRef[] {
  const id = song.id
  const collection = song.journey?.collectionId ? `gyuj-${song.journey.collectionId}` : null
  const out: SongJourneyRef[] = []
  for (const journey of journeys) {
    const stops = [...journey.stops].sort((a, b) => a.seq - b.seq)
    const stopIdx = stops.findIndex((s) => s.songIds.includes(id))
    const member =
      stopIdx >= 0 || journey.songIds.includes(id) || (collection !== null && journey.id === collection)
    if (!member) continue
    const withTitle = journey as Journey & { title?: string | null }
    out.push({
      journey,
      quality: journeyQuality(journey, curated?.get(journey.id)),
      stop: stopIdx >= 0 ? stops[stopIdx] : undefined,
      stopIndex: stopIdx >= 0 ? stopIdx + 1 : undefined,
      stopCount: stops.length,
      title: withTitle.title?.trim() || journeyPlaceTitle(journey),
    })
  }
  return out.sort(
    (a, b) =>
      RANK[b.quality] - RANK[a.quality] ||
      startDay(a.journey.dateStart) - startDay(b.journey.dateStart) ||
      (a.journey.id < b.journey.id ? -1 : 1),
  )
}
