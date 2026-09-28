// LocalMapPanel (FRONTEND-SPEC 8): MapView bounded to the county's villages, village dots only.
import type L from 'leaflet'
import { useMemo, useState } from 'react'
import type { CatalogIndex } from '../../data/catalogIndex'
import { t } from '../../i18n/en'
import { placeText } from '../../state/placeName'
import { buildMapPoints } from '../../state/selectors'
import type { Place } from '../../types/place'
import type { Song } from '../../types/song'
import { PlaceLabel } from '../PlaceLabel'
import { MapView, type HoverInfo } from '../map/MapView'

export function countyBounds(county: Place, index: CatalogIndex): L.LatLngBoundsLiteral {
  const coords: [number, number][] = []
  for (const v of index.childrenOf(county.id)) if (v.lat !== null && v.lng !== null) coords.push([v.lat, v.lng])
  if (!coords.length && county.lat !== null && county.lng !== null) coords.push([county.lat - 0.3, county.lng - 0.4], [county.lat + 0.3, county.lng + 0.4])
  if (!coords.length) {
    return [
      [43.6, 20.2],
      [48.3, 29.7],
    ]
  }
  const lats = coords.map((c) => c[0])
  const lngs = coords.map((c) => c[1])
  return [
    [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
    [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
  ]
}

export function LocalMapPanel({
  county,
  songs,
  index,
  selectedVillage,
  colourByGenre,
  onSelect,
}: {
  county: Place
  songs: Song[]
  index: CatalogIndex
  selectedVillage?: string
  colourByGenre: boolean
  onSelect: (placeId: string) => void
}) {
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const { points, unmappedCount } = useMemo(() => buildMapPoints(songs, index, 'village', selectedVillage, undefined), [songs, index, selectedVillage])
  const bounds = useMemo(() => countyBounds(county, index), [county, index])
  return (
    <div className="local-map" aria-label={t('county.mapLabel', { name: placeText(county, county.id) })}>
      <MapView points={points} level="village" selectedId={selectedVillage} colourByGenre={colourByGenre} fitBounds={bounds} fitKey={county.id} onSelect={(p) => onSelect(p.placeId)} onHover={setHover} />
      <div className="local-map__status" aria-live="polite">
        {hover ? (
          <span>
            <PlaceLabel place={hover.point.place} showMarkers />: {t('results.count', { n: hover.point.count })}
          </span>
        ) : (
          <span className="muted">
            {t('map.listVillages', { n: points.length })}
            {unmappedCount > 0 && `, ${t('map.notMapped', { n: unmappedCount })}`}
          </span>
        )}
      </div>
    </div>
  )
}
