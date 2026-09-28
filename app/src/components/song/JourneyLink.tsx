// JourneyLink: "Collected on: <journey>, <dates>, stop n of m: <village>" with the quality badge
// and "Explore this journey" -> /journeys?trip=<id>&stop=<seq>. Omitted when the record is on
// no journey; one line per journey otherwise (index trip and curated trip both listed).
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useQuery } from '../../app/query'
import { t } from '../../i18n/en'
import { journeyDateText, qualityLabel } from '../../state/journeys'
import { applyPatch } from '../../state/query'
import { journeysForSong, stopPlaceName, type SongJourneyRef } from '../../state/songJourneys'
import { toSearch } from '../../state/urlCodec'
import type { Song } from '../../types/song'
import { useCuratedJourneys, useJourneys } from '../journey/useJourneyData'

export function useSongJourneys(song: Song): SongJourneyRef[] {
  const journeys = useJourneys()
  const curated = useCuratedJourneys()
  return useMemo(() => journeysForSong(song, journeys, curated), [song, journeys, curated])
}

export function JourneyLink({ refs, compact }: { refs: SongJourneyRef[]; compact?: boolean }) {
  const { query } = useQuery()
  if (!refs.length) return null
  return (
    <ul
      className={`journey-link${compact ? ' journey-link--compact' : ''}`}
      aria-label={t('song.collectedOn')}
    >
      {refs.map((r) => {
        const j = r.journey
        const date = journeyDateText(j)
        const stopName = r.stop ? stopPlaceName(r.stop) : null
        const to = {
          pathname: '/journeys',
          search: toSearch(applyPatch(query, { trip: j.id, stop: r.stop?.seq })),
        }
        return (
          <li key={j.id} className="journey-link__item">
            {compact && <span className="muted">{t('song.collectedOn')}: </span>}
            <span className="journey-link__title">{r.title}</span>
            <span className="journey-link__meta muted">
              , <span title={date.wording}>{date.text}</span>
              {r.stop && r.stopIndex !== undefined && (
                <>, {t('song.journeyStop', { n: r.stopIndex, m: r.stopCount, name: stopName ?? '' })}</>
              )}
            </span>{' '}
            <span className="journey-link__quality mono" title={t(`journey.qualityTitle.${r.quality}`)}>
              {qualityLabel(r.quality)}
            </span>{' '}
            <Link className="journey-link__explore" to={to} title={r.title}>
              {t('song.exploreJourney')}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
