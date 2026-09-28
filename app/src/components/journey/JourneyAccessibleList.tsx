// JourneyAccessibleList (FRONTEND-SPEC 14.4, AC-44): the ordered-list fallback of the whole
// route, always rendered after the map behind a disclosure; the map replacement when no map.
import { melodies, t } from '../../i18n/en'
import { statusBadgeText, stopDateText } from '../../state/journeys'
import type { JourneyView } from './journeyView'

export function JourneyAccessibleList({ view, open = false, onSelectStop }: { view: JourneyView; open?: boolean; onSelectStop?: (seq: number) => void }) {
  const j = view.journey
  const n = j.stops.length
  return (
    <details className="map-list journey-list" open={open || undefined}>
      <summary className="map-list__summary">{t('journey.listRoute', { n })}</summary>
      <ol className="map-list__items journey-list__items">
        <li className="journey-list__endpoint">
          {j.departure.confidence === 'assumed' ? t('journey.departureAssumed', { name: j.departure.name }) : t('journey.departureLine', { name: j.departure.name })}
        </li>
        {view.stops.map((s) => {
          const parts = [
            `${s.stop.seq}. ${s.nameThen}${s.year ? ` (${s.year})` : ''}`,
            s.nameNow && s.nameNow !== s.nameThen ? `now ${s.nameNow}` : null,
            statusBadgeText(s.status),
            s.resolved ? null : t('journey.stopNoCoords'),
            melodies(s.stop.recordCount),
            stopDateText(s.stop),
            s.stop.kmFromPrevious !== null ? (s.stop.seq === 1 ? t('journey.kmFromDeparture', { km: Math.round(s.stop.kmFromPrevious) }) : t('journey.kmFromPrevious', { km: Math.round(s.stop.kmFromPrevious) })) : null,
          ].filter(Boolean)
          const text = parts.join(', ')
          return (
            <li key={s.stop.seq}>
              {onSelectStop && s.resolved ? (
                <button type="button" className="map-list__item" onClick={() => onSelectStop(s.stop.seq)}>
                  {text}
                </button>
              ) : (
                <span className="map-list__item">{text}</span>
              )}
            </li>
          )
        })}
      </ol>
    </details>
  )
}
