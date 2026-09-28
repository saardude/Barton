// MapPanel (FRONTEND-SPEC 7, MAP-SPEC): MapView + zoom / reset controls, the borders toggle
// (then | now | compare, shared with the journey map), a two-line legend, a three-line hover
// card, the accessible list and the touch sheet. County mode at zoom <= 8 with no county
// selected, village mode otherwise. County click = zoom + select, village click = select,
// Esc or Reset = clear; the results panel follows the Query.
import type L from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useCatalogReady } from '../../app/catalog'
import { useDerived, useQuery } from '../../app/query'
import { t } from '../../i18n/en'
import { explorerEra } from '../../state/journeys'
import { countryName, placeText } from '../../state/placeName'
import type { BordersMode } from '../../state/query'
import { buildMapPoints, countryPredicate, filterSongs, type MapPoint } from '../../state/selectors'
import { BorderToggle } from '../journey/BorderToggle'
import { useBorderLayers } from '../journey/borderLayers'
import { CompareDivider } from '../journey/CompareDivider'
import { availableEras } from '../journey/useJourneyData'
import { PlaceLabel } from '../PlaceLabel'
import { EmptyState } from '../States'
import { MapPointSheet } from '../phone/MapPointSheet'
import { MapView, pointAriaLabel, ROMANIA_BOUNDS, type HoverInfo } from './MapView'
import { diameter, LABEL_MIN_D } from './markerSize'

// Below this zoom (with no county selected) the map shows county bubbles; above it, village dots.
const COUNTY_ZOOM_MAX = 8
// Never render more DOM markers than this in the zoom-driven village mode (MAP-SPEC D7).
const VILLAGE_DOM_LIMIT = 2000

/** The card body shared by the desktop hover card and the touch MapPointSheet: place, count, hint. */
function PointCard({ p, hint }: { p: MapPoint; hint?: boolean }) {
  return (
    <>
      <div className="hover-card__name">
        <PlaceLabel place={p.place} showMarkers />
        {p.level === 'village' && p.place.county && <span className="hover-card__path"> {p.place.county}</span>}
      </div>
      <div className="hover-card__count">{p.level === 'county' ? t('map.melodiesIn', { n: p.count, v: p.villageCount ?? 0 }) : t('results.count', { n: p.count })}</div>
      {hint && <div className="hover-card__hint">{p.selected ? t('map.clickClear') : t('map.clickOpen')}</div>}
    </>
  )
}

function HoverCard({ info, width, height }: { info: HoverInfo; width: number; height: number }) {
  const cardW = 240
  const left = Math.max(8, Math.min(width - cardW - 8, info.x - cardW / 2))
  const flip = info.y < 120
  const style = flip ? { left, top: info.y + 20 } : { left, bottom: height - info.y + 16 }
  return (
    <div className="hover-card" role="tooltip" id="map-hover-card" style={style}>
      <PointCard p={info.point} hint />
    </div>
  )
}

export function MapPanel({
  highlightPlaceId,
  touchSheet = false,
  onShowMelodies,
}: {
  highlightPlaceId: string | null
  /** Touch mode (phone / coarse pointer): tapping a dot opens MapPointSheet instead of selecting. */
  touchSheet?: boolean
  /** Called after "Show melodies" in the sheet so the phone layout can switch to the list. */
  onShowMelodies?: () => void
}) {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, search } = useQuery()
  const [sheetPoint, setSheetPoint] = useState<MapPoint | null>(null)
  const [zoom, setZoom] = useState(6)
  const [map, setMap] = useState<L.Map | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [compare, setCompare] = useState(50)
  const panelRef = useRef<HTMLDivElement>(null)

  const placeSelected = Boolean(query.county || query.village)
  const zoomedIn = zoom > COUNTY_ZOOM_MAX
  const level: 'county' | 'village' = placeSelected || zoomedIn ? 'village' : 'county'
  const selectedId = level === 'village' ? query.village : query.county

  // Borders (owner feedback b): the journey map's then / now / compare on the explorer too.
  const eras = useMemo(() => availableEras(), [])
  const era = explorerEra(query.yearFrom, query.yearTo, eras)
  const borders: BordersMode = query.borders ?? 'now'
  const borderState = useBorderLayers({ map, borders, era, compare, compareMode: 'swipe' })
  const onBorders = useCallback((mode: BordersMode) => setQuery({ borders: mode }, { replace: true }), [setQuery])

  // Drill-down point set: with a county selected, its village dots plus the other counties'
  // bubbles (counted over every filter except place), so a neighbouring county is one click
  // away. The selected county itself is not drawn as a bubble: its villages stand for it.
  const { points } = useMemo(() => {
    if (!catalog || !derived) return { points: [] as MapPoint[], unmappedCount: 0 }
    const villages =
      level === derived.mapLevel
        ? { points: derived.mapPoints, unmappedCount: derived.unmappedCount }
        : buildMapPoints(derived.filteredSongs, catalog.index, level, selectedId, undefined)
    if (level === 'village' && !placeSelected && villages.points.length > VILLAGE_DOM_LIMIT) {
      // too many dots for DOM markers: stay on county bubbles until the user picks a county
      return buildMapPoints(derived.filteredSongs, catalog.index, 'county', undefined, undefined)
    }
    const county = query.county
    if (!county) return villages
    const inCountry = countryPredicate(query)
    const exceptPlace = filterSongs(catalog.index.songs, derived.predicates, 'place').filter(inCountry)
    const counties = buildMapPoints(exceptPlace, catalog.index, 'county', undefined, undefined).points.filter((p) => p.placeId !== county)
    // Every village of the selected county stays visible (and clickable) while one is selected.
    const inCounty = exceptPlace.filter((s) => s.location.placeId === county || s.location.placeId?.startsWith(county + '/'))
    const countyVillages = buildMapPoints(inCounty, catalog.index, 'village', query.village, undefined).points
    return { points: [...counties, ...countyVillages], unmappedCount: villages.unmappedCount }
  }, [catalog, derived, level, selectedId, placeSelected, query])

  const { fitBounds, fitKey } = useMemo(() => {
    if (!catalog) return { fitBounds: ROMANIA_BOUNDS, fitKey: 'ro' }
    const county = query.county
    if (county) {
      const coords: [number, number][] = []
      const node = catalog.index.placeById.get(county)
      for (const v of catalog.index.childrenOf(county)) if (v.lat !== null && v.lng !== null) coords.push([v.lat, v.lng])
      if (!coords.length && node && node.lat !== null && node.lng !== null) coords.push([node.lat - 0.3, node.lng - 0.4], [node.lat + 0.3, node.lng + 0.4])
      if (coords.length) {
        const lats = coords.map((c) => c[0])
        const lngs = coords.map((c) => c[1])
        const b: L.LatLngBoundsLiteral = [
          [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
          [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
        ]
        return { fitBounds: b, fitKey: county }
      }
    }
    // No county: fit every plotted place of the selected country, or of every country by default.
    const country = query.country
    const pts = catalog.places.filter((p) => p.lat !== null && p.lng !== null && (!country || p.id === country || p.id.startsWith(country + '/')))
    if (pts.length) {
      let s = 90
      let n = -90
      let w = 180
      let e = -180
      for (const p of pts) {
        const lat = p.lat as number
        const lng = p.lng as number
        if (lat < s) s = lat
        if (lat > n) n = lat
        if (lng < w) w = lng
        if (lng > e) e = lng
      }
      const b: L.LatLngBoundsLiteral = [
        [s - 0.1, w - 0.1],
        [n + 0.1, e + 0.1],
      ]
      return { fitBounds: b, fitKey: country ?? 'all' }
    }
    return { fitBounds: ROMANIA_BOUNDS, fitKey: country ?? 'all' }
  }, [catalog, query.county, query.country])

  const resetTitle = query.country === 'ro' ? t('map.fitRomania') : query.country ? t('map.fitCountry', { name: countryName(query.country) }) : t('map.fitAll')

  // County click = zoom + select (the map fits the county and shows its villages); village
  // click = select, click again = clear the village (the county stays).
  const select = useCallback(
    (p: MapPoint) => {
      if (p.level === 'county') setQuery({ county: p.placeId })
      else setQuery({ village: p.placeId === query.village ? undefined : p.placeId })
    },
    [query.village, setQuery],
  )
  const onSelect = useCallback(
    (p: MapPoint) => {
      setHover(null)
      if (touchSheet) setSheetPoint(p)
      else select(p)
    },
    [touchSheet, select],
  )
  // Esc clears the deepest selection; Reset clears the place and fits the country again.
  const onEscape = useCallback(() => {
    if (query.village) setQuery({ village: undefined })
    else if (query.county) setQuery({ county: undefined })
  }, [query.village, query.county, setQuery])
  const reset = useCallback(() => {
    // clearing the county clears the village with it (applyPatch applies the deepest level only)
    if (query.county) setQuery({ county: undefined })
    else if (query.village) setQuery({ village: undefined })
    else map?.fitBounds(fitBounds, { padding: [24, 24] })
  }, [query.county, query.village, setQuery, map, fitBounds])
  const onHover = useCallback((info: HoverInfo | null) => setHover(touchSheet ? null : info), [touchSheet])
  const closeSheet = useCallback(() => setSheetPoint(null), [])
  const showMelodies = useCallback(
    (p: MapPoint) => {
      setSheetPoint(null)
      // switch the phone tab first so the unmounting full-height map never starts the fit animation
      onShowMelodies?.()
      select(p)
    },
    [select, onShowMelodies],
  )

  const onReady = useCallback((m: L.Map) => {
    setMap(m)
    const update = () => {
      const s = m.getSize()
      setSize({ width: s.x, height: s.y })
    }
    update()
    m.on('resize', update)
  }, [])

  if (!catalog || !derived) {
    return (
      <div className="map-panel">
        <div className="map-loading">{t('map.loading')}</div>
      </div>
    )
  }

  if (query.unmapped) {
    return (
      <div className="map-panel">
        <EmptyState
          title={t('map.unmappedTitle', { n: derived.filteredSongs.length })}
          body={t('map.unmappedBody')}
          actions={
            <button type="button" className="btn" onClick={() => setQuery({ unmapped: undefined })}>
              {t('map.backToMap')}
            </button>
          }
        />
      </div>
    )
  }

  const legendLevel: 'county' | 'village' = query.county ? 'village' : level
  const nMax = points.reduce((m, p) => (p.level === legendLevel ? Math.max(m, p.count) : m), 0)
  const legendD = legendLevel === 'county' ? Math.max(LABEL_MIN_D, diameter({ level: 'county', count: nMax }, nMax) * 0.6) : diameter({ level: 'village', count: nMax }, nMax) * 0.7
  const selectedUnmapped = Boolean(selectedId && !points.some((p) => p.placeId === selectedId) && catalog.index.placeById.get(selectedId)?.lat === null)

  return (
    <div className="map-panel" ref={panelRef}>
      <MapView
        points={points}
        level={level}
        selectedId={selectedId}
        highlightId={highlightPlaceId}
        fitBounds={fitBounds}
        fitKey={fitKey}
        onSelect={onSelect}
        onHover={onHover}
        onZoom={setZoom}
        onEscape={onEscape}
        onReady={onReady}
      />
      <div className="map-controls">
        <button type="button" className="map-ctl" aria-label={t('map.zoomIn')} title={t('map.zoomIn')} onClick={() => map?.zoomIn()}>
          +
        </button>
        <button type="button" className="map-ctl" aria-label={t('map.zoomOut')} title={t('map.zoomOut')} onClick={() => map?.zoomOut()}>
          &minus;
        </button>
        <button type="button" className="map-ctl map-ctl--text" title={resetTitle} onClick={reset}>
          {t('map.resetView')}
        </button>
      </div>
      <div className="map-controls map-controls--right">
        <BorderToggle compact value={borders} era={era} eras={eras} disabled={borderState.unavailable} loading={borderState.loading} onChange={onBorders} />
      </div>
      {borders === 'both' && !borderState.unavailable && <CompareDivider compare={compare} onCompare={setCompare} boundsRef={panelRef} />}
      <div className="map-legend" aria-label={t('map.legend')}>
        <div className="map-legend__row">
          <span className={`map-legend__dot map-legend__dot--${legendLevel}`} style={{ width: legendD, height: legendD }} aria-hidden="true">
            {legendLevel === 'county' ? nMax.toLocaleString('en') : ''}
          </span>
          <span>{legendLevel === 'county' ? t('map.legendCounty') : t('map.legendVillage')}</span>
        </div>
        <div className="map-legend__row">
          {legendLevel === 'county' ? (
            <>
              <span className="map-legend__dot map-legend__dot--county" style={{ width: 12, height: 12 }} aria-hidden="true" />
              <span>{t('map.legendClickCounty')}</span>
            </>
          ) : (
            <>
              <span className="map-legend__dot map-legend__dot--selected" style={{ width: 12, height: 12 }} aria-hidden="true" />
              <span>{t('map.legendSelected')}</span>
            </>
          )}
        </div>
        {borderState.underPointer && (borderState.underPointer.then || borderState.underPointer.now) && (
          <div className="map-legend__row map-legend__pointer mono">
            {borderState.underPointer.then && borderState.thenSet ? `${borderState.underPointer.then} (${borderState.thenSet})` : ''}
            {borderState.underPointer.then && borderState.underPointer.now ? ' / ' : ''}
            {borderState.underPointer.now ? `${borderState.underPointer.now} (now)` : ''}
          </div>
        )}
      </div>
      {selectedUnmapped && <div className="map-notice">{t('map.selectedNotMapped')}</div>}
      {hover && !touchSheet && <HoverCard info={hover} width={size.width} height={size.height} />}
      {sheetPoint && touchSheet && (
        <MapPointSheet point={sheetPoint} search={search} onClose={closeSheet} onShowMelodies={showMelodies}>
          <PointCard p={sheetPoint} />
        </MapPointSheet>
      )}
    </div>
  )
}

/** Keyboard-operable list of the same points and actions as the map (AC-27). */
export function MapAccessibleList() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery } = useQuery()
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState<MapPoint | null>(null)
  if (!catalog || !derived || query.unmapped) return null
  const level = derived.mapLevel
  const points = derived.mapPoints
  const label = level === 'county' ? t('map.listCounties', { n: points.length }) : t('map.listVillages', { n: points.length })
  return (
    <details className="map-list" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="map-list__summary">{label}</summary>
      <ul className="map-list__items">
        {points.map((p) => (
          <li key={p.placeId}>
            <button
              type="button"
              className="map-list__item"
              aria-pressed={p.selected}
              aria-label={pointAriaLabel(p)}
              aria-describedby={focused?.placeId === p.placeId ? 'map-list-card' : undefined}
              onFocus={() => setFocused(p)}
              onBlur={() => setFocused(null)}
              onClick={() => (p.level === 'county' ? setQuery({ county: p.selected ? undefined : p.placeId }) : setQuery({ village: p.selected ? undefined : p.placeId }))}
            >
              <span>{placeText(p.place, p.placeId)}</span>
              <span className="tree__count">{p.count.toLocaleString('en')}</span>
            </button>
            {focused?.placeId === p.placeId && (
              <div id="map-list-card" className="muted" style={{ padding: '0 8px 8px', fontSize: 'var(--fs-12)' }}>
                {p.level === 'county' ? t('map.melodiesIn', { n: p.count, v: p.villageCount ?? 0 }) : t('results.count', { n: p.count })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
