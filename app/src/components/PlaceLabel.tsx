// PlaceLabel (FRONTEND-SPEC 6, MAP-SPEC 7): "Beiuș (Belényes)" with the historical name in mono,
// plus the "location uncertain" / "not mapped" text markers.
import { t } from '../i18n/en'
import { normalize } from '../state/normalize'
import { displayName } from '../state/placeName'
import type { Place } from '../types/place'

type Props = {
  place: Pick<Place, 'name' | 'nameHistorical'> & Partial<Pick<Place, 'type' | 'confidence' | 'coordSource' | 'lat' | 'lng' | 'id'>>
  showMarkers?: boolean
}

export function PlaceLabel({ place, showMarkers = false }: Props) {
  const modern = displayName(place, place.id)
  const hist = place.nameHistorical
  const showHist = hist && place.type !== 'region' && place.type !== 'country' && normalize(hist) !== normalize(modern)
  const uncertain = place.confidence === 'low' || place.coordSource === 'gazetteer-approx'
  const unmapped = showMarkers && place.lat !== undefined && (place.lat === null || place.lng === null)
  return (
    <span className="place-label">
      <span lang={place.type === 'country' ? undefined : 'ro'}>{modern}</span>
      {showHist && (
        <>
          {' '}
          <span className="place-label__hist" lang="hu">
            ({hist})
          </span>
        </>
      )}
      {showMarkers && uncertain && !unmapped && (
        <span className="place-label__mark" title={t('map.locationUncertain')}>
          {t('map.locationUncertain')}
        </span>
      )}
      {unmapped && <span className="place-label__mark">{t('tree.notMapped')}</span>}
    </span>
  )
}
