// MapPanel: MapView + zoom / reset controls, a two-line legend, a hover card, the accessible
// list and the touch sheet. State bubbles at low zoom with no state selected, town dots
// otherwise. State click = zoom + select, town click = select, Esc or Reset = clear.
import type L from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useCatalogReady } from '../../app/catalog'
import { useDerived, useQuery } from '../../app/query'
import { stateName, t } from '../../i18n/en'
import { placeLevelOf } from '../../state/query'
import { buildMapPoints, filterSongs, type MapLevel, type MapPoint } from '../../state/selectors'
import { EmptyState } from '../States'
import { MapPointSheet } from '../phone/MapPointSheet'
import { AUSTRALIA_BOUNDS, MapView, pointAriaLabel, type HoverInfo } from './MapView'
import { diameter, LABEL_MIN_D } from './markerSize'

const STATE_ZOOM_MAX = 4.5

function PointCard({ p, hint }: { p: MapPoint; hint?: boolean }) {
  return (
    <>
      <div className="hover-card__name">
        <span className="place-label">{p.place.name}</span>
        {p.level === 'town' && p.place.state && <span className="hover-card__path"> {stateName(p.place.state)}</span>}
      </div>
      <div className="hover-card__count">{p.level === 'state' ? t('map.songsIn', { n: p.count, v: p.townCount ?? 0 }) : t('results.count', { n: p.count })}</div>
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

export function MapPanel({ highlightPlaceId, touchSheet = false, onShowSongs }: { highlightPlaceId: string | null; touchSheet?: boolean; onShowSongs?: () => void }) {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, search } = useQuery()
  const [sheetPoint, setSheetPoint] = useState<MapPoint | null>(null)
  const [zoom, setZoom] = useState(4)
  const [map, setMap] = useState<L.Map | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const panelRef = useRef<HTMLDivElement>(null)

  const placeLevel = query.place ? placeLevelOf(query.place) : undefined
  const stateSelected = placeLevel === 'state' || placeLevel === 'town'
  const stateId = query.place && stateSelected ? catalog?.index.stateIdOf(query.place) : undefined
  const zoomedIn = zoom > STATE_ZOOM_MAX
  const level: MapLevel = stateSelected || zoomedIn ? 'town' : 'state'
  const selectedId = level === 'town' ? (placeLevel === 'town' ? query.place : undefined) : query.place

  // With a state selected: its town dots plus the other states' bubbles (counted over every filter except place).
  const { points } = useMemo(() => {
    if (!catalog || !derived) return { points: [] as MapPoint[], unmappedCount: 0 }
    const towns = level === derived.mapLevel ? { points: derived.mapPoints, unmappedCount: derived.unmappedCount } : buildMapPoints(derived.filteredSongs, catalog.index, level, selectedId, undefined)
    if (!stateId) return towns
    const exceptPlace = filterSongs(catalog.index.songs, derived.predicates, 'place')
    const states = buildMapPoints(exceptPlace, catalog.index, 'state', undefined, undefined).points.filter((p) => p.placeId !== stateId)
    const inState = exceptPlace.filter((s) => s.location.placeId === stateId || s.location.placeId?.startsWith(stateId + '/'))
    const stateTowns = buildMapPoints(inState, catalog.index, 'town', placeLevel === 'town' ? query.place : undefined, undefined).points
    return { points: [...states, ...stateTowns], unmappedCount: towns.unmappedCount }
  }, [catalog, derived, level, selectedId, stateId, placeLevel, query.place])

  const { fitBounds, fitKey } = useMemo(() => {
    if (!catalog) return { fitBounds: AUSTRALIA_BOUNDS, fitKey: 'au' }
    if (stateId) {
      const coords: [number, number][] = []
      const node = catalog.index.placeById.get(stateId)
      for (const v of catalog.index.childrenOf(stateId)) if (v.lat !== null && v.lng !== null) coords.push([v.lat, v.lng])
      if (!coords.length && node && node.lat !== null && node.lng !== null) coords.push([node.lat - 2, node.lng - 3], [node.lat + 2, node.lng + 3])
      if (coords.length) {
        const lats = coords.map((c) => c[0])
        const lngs = coords.map((c) => c[1])
        const b: L.LatLngBoundsLiteral = [
          [Math.min(...lats) - 0.3, Math.min(...lngs) - 0.3],
          [Math.max(...lats) + 0.3, Math.max(...lngs) + 0.3],
        ]
        return { fitBounds: b, fitKey: stateId }
      }
    }
    return { fitBounds: AUSTRALIA_BOUNDS, fitKey: 'au' }
  }, [catalog, stateId])

  const resetTitle = stateId && catalog ? t('map.fitState', { name: catalog.index.placeById.get(stateId)?.name ?? stateId }) : t('map.fitAll')

  const select = useCallback(
    (p: MapPoint) => {
      if (p.level === 'state') setQuery({ place: p.placeId })
      else setQuery({ place: p.placeId === query.place ? catalog?.index.stateIdOf(p.placeId) : p.placeId })
    },
    [query.place, setQuery, catalog],
  )
  const onSelect = useCallback(
    (p: MapPoint) => {
      setHover(null)
      if (touchSheet) setSheetPoint(p)
      else select(p)
    },
    [touchSheet, select],
  )
  const onEscape = useCallback(() => {
    if (placeLevel === 'town' && query.place) setQuery({ place: catalog?.index.stateIdOf(query.place) })
    else if (query.place) setQuery({ place: undefined })
  }, [placeLevel, query.place, setQuery, catalog])
  const reset = useCallback(() => {
    if (query.place) setQuery({ place: undefined })
    else map?.fitBounds(fitBounds, { padding: [24, 24] })
  }, [query.place, setQuery, map, fitBounds])
  const onHover = useCallback((info: HoverInfo | null) => setHover(touchSheet ? null : info), [touchSheet])
  const closeSheet = useCallback(() => setSheetPoint(null), [])
  const showSongs = useCallback(
    (p: MapPoint) => {
      setSheetPoint(null)
      onShowSongs?.()
      select(p)
    },
    [select, onShowSongs],
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

  const legendLevel: MapLevel = stateId ? 'town' : level
  const nMax = points.reduce((m, p) => (p.level === legendLevel ? Math.max(m, p.count) : m), 0)
  const legendD = legendLevel === 'state' ? Math.max(LABEL_MIN_D, diameter({ level: 'state', count: nMax }, nMax) * 0.6) : diameter({ level: 'town', count: nMax }, nMax) * 0.7
  const selectedUnmapped = Boolean(selectedId && !points.some((p) => p.placeId === selectedId) && catalog.index.placeById.get(selectedId)?.lat === null)

  return (
    <div className="map-panel" ref={panelRef}>
      <MapView points={points} level={level} selectedId={selectedId} highlightId={highlightPlaceId} fitBounds={fitBounds} fitKey={fitKey} onSelect={onSelect} onHover={onHover} onZoom={setZoom} onEscape={onEscape} onReady={onReady} />
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
      <div className="map-legend" aria-label={t('map.legend')}>
        <div className="map-legend__row">
          <span className={`map-legend__dot map-legend__dot--${legendLevel === 'state' ? 'county' : 'village'}`} style={{ width: legendD, height: legendD }} aria-hidden="true">
            {legendLevel === 'state' ? nMax.toLocaleString('en') : ''}
          </span>
          <span>{legendLevel === 'state' ? t('map.legendState') : t('map.legendTown')}</span>
        </div>
        {legendLevel === 'town' && (
          <div className="map-legend__row">
            <span className="map-legend__dot map-legend__dot--selected" style={{ width: 12, height: 12 }} aria-hidden="true" />
            <span>{t('map.legendSelected')}</span>
          </div>
        )}
      </div>
      {selectedUnmapped && <div className="map-notice">{t('map.selectedNotMapped')}</div>}
      {hover && !touchSheet && <HoverCard info={hover} width={size.width} height={size.height} />}
      {sheetPoint && touchSheet && (
        <MapPointSheet point={sheetPoint} search={search} onClose={closeSheet} onShowSongs={showSongs}>
          <PointCard p={sheetPoint} />
        </MapPointSheet>
      )}
    </div>
  )
}

/** Keyboard-operable list of the same points and actions as the map. */
export function MapAccessibleList() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery } = useQuery()
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState<MapPoint | null>(null)
  if (!catalog || !derived || query.unmapped) return null
  const level = derived.mapLevel
  const points = derived.mapPoints
  const label = level === 'state' ? t('map.listStates', { n: points.length }) : t('map.listTowns', { n: points.length })
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
              onClick={() => setQuery({ place: p.selected ? (p.level === 'town' ? catalog.index.stateIdOf(p.placeId) : undefined) : p.placeId })}
            >
              <span>{p.place.name}</span>
              <span className="tree__count">{p.count.toLocaleString('en')}</span>
            </button>
            {focused?.placeId === p.placeId && (
              <div id="map-list-card" className="muted" style={{ padding: '0 8px 8px', fontSize: 'var(--fs-12)' }}>
                {p.level === 'state' ? t('map.songsIn', { n: p.count, v: p.townCount ?? 0 }) : t('results.count', { n: p.count })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
