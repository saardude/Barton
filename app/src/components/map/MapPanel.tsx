// MapPanel (FRONTEND-SPEC 7, MAP-SPEC): MapView + controls, legend, hover card, accessible list,
// not-mapped notice. County mode at zoom <= 7 with no county selected, village mode otherwise.
import type L from 'leaflet'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCatalogReady } from '../../app/catalog'
import { usePrefs } from '../../app/prefs'
import { useDerived, useQuery } from '../../app/query'
import { genreLabel, t } from '../../i18n/en'
import { placeText } from '../../state/placeName'
import { applyPatch, GENRE_ORDER, type GenreId } from '../../state/query'
import { buildMapPoints, countryPredicate, filterSongs, type MapPoint } from '../../state/selectors'
import { countryName } from '../../state/placeName'
import { toSearch } from '../../state/urlCodec'
import { GenreBar, GenreSwatch } from '../Genre'
import { PlaceLabel } from '../PlaceLabel'
import { EmptyState } from '../States'
import { MapPointSheet } from '../phone/MapPointSheet'
import { MapView, pointAriaLabel, ROMANIA_BOUNDS, type HoverInfo, type TileProvider } from './MapView'

// Below this zoom (with no county selected) the map shows county bubbles; above it, village dots.
const COUNTY_ZOOM_MAX = 8
// Never render more DOM markers than this in the zoom-driven village mode (MAP-SPEC D7).
const VILLAGE_DOM_LIMIT = 2000

function yearSpan(p: MapPoint): string {
  if (p.yearMin === undefined || p.yearMax === undefined) return t('facet.noDate')
  const span = p.yearMin === p.yearMax ? String(p.yearMin) : t('map.yearSpan', { from: p.yearMin, to: p.yearMax })
  return p.unknownYear > 0 ? `${span} and ${t('facet.noDate')}` : span
}

/** The card body shared by the desktop hover card and the touch MapPointSheet. */
function PointCard({ p, hint }: { p: MapPoint; hint?: boolean }) {
  const top3 = GENRE_ORDER.map((g) => ({ g, n: p.genreCounts[g] ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
  const path = [p.level === 'village' ? p.place.county : null, p.place.region, p.place.country].filter(Boolean).join(' / ')
  return (
    <>
      <div className="hover-card__name">
        <PlaceLabel place={p.place} showMarkers />
      </div>
      {path && <div className="hover-card__path">{path}</div>}
      <div className="hover-card__count">{p.level === 'county' ? t('map.melodiesIn', { n: p.count, v: p.villageCount ?? 0 }) : t('results.count', { n: p.count })}</div>
      <div className="hover-card__genres">
        <div style={{ width: 80 }}>
          <GenreBar counts={p.genreCounts} total={p.count} height={8} width={80} />
        </div>
        <span>{top3.length ? top3.map((x) => `${genreLabel(x.g).split(' / ')[0]} ${x.n}`).join(', ') : t('facet.noGenre')}</span>
      </div>
      <div>{yearSpan(p)}</div>
      {(p.audioCount > 0 || p.notationCount > 0) && (
        <div>{[p.audioCount > 0 ? t('map.recordings', { n: p.audioCount }) : null, p.notationCount > 0 ? t('map.notations', { n: p.notationCount }) : null].filter(Boolean).join(', ')}</div>
      )}
      {p.level === 'county' && (p.unmappedVillages ?? 0) > 0 && <div>{t('map.villagesNotMapped', { n: p.unmappedVillages })}</div>}
      {hint && <div className="hover-card__hint">{p.selected ? t('map.clickClear') : p.level === 'county' ? t('map.clickCounty') : t('map.clickVillage')}</div>}
    </>
  )
}

function HoverCard({ info, width, height }: { info: HoverInfo; width: number; height: number }) {
  const cardW = 260
  const left = Math.max(8, Math.min(width - cardW - 8, info.x - cardW / 2))
  const flip = info.y < 190
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
  const { colourByGenre, setColourByGenre } = usePrefs()
  const [zoom, setZoom] = useState(6)
  const [map, setMap] = useState<L.Map | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [provider, setProvider] = useState<TileProvider>('carto')
  const [size, setSize] = useState({ width: 800, height: 500 })

  const placeSelected = Boolean(query.county || query.village)
  const zoomedIn = zoom > COUNTY_ZOOM_MAX
  const level: 'county' | 'village' = placeSelected || zoomedIn ? 'village' : 'county'
  const selectedId = level === 'village' ? query.village : query.county

  // Drill-down point set (owner feedback): with a county selected, its village dots plus the
  // other counties' bubbles (counted over every filter except place) and a hollow ring for the
  // selected county, so any circle stays clickable: another county re-selects, a village narrows,
  // the selected item deselects.
  const { points, unmappedCount } = useMemo(() => {
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
    const counties = buildMapPoints(exceptPlace, catalog.index, 'county', county, undefined).points
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

  const fitLabel = query.county
    ? t('map.fitCounty')
    : query.country === 'ro'
      ? t('map.fitRomania')
      : query.country
        ? t('map.fitCountry', { name: countryName(query.country) })
        : t('map.fitAll')

  // Drill-down: a county bubble selects that county (the map fits it and shows its villages);
  // the selected county's ring deselects it (fit back out); a village dot selects the village,
  // the selected village deselects it and the county stays.
  const select = useCallback(
    (p: MapPoint) => {
      if (p.level === 'county') setQuery({ county: p.placeId === query.county ? undefined : p.placeId })
      else setQuery({ village: p.placeId === query.village ? undefined : p.placeId })
    },
    [query.county, query.village, setQuery],
  )
  const onSelect = useCallback(
    (p: MapPoint) => {
      setHover(null)
      if (touchSheet) setSheetPoint(p)
      else select(p)
    },
    [touchSheet, select],
  )
  const onHover = useCallback((info: HoverInfo | null) => setHover(touchSheet ? null : info), [touchSheet])
  const closeSheet = useCallback(() => setSheetPoint(null), [])
  const showMelodies = useCallback(
    (p: MapPoint) => {
      setSheetPoint(null)
      select(p)
      onShowMelodies?.()
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
  const selectedUnmapped = selectedId && !points.some((p) => p.placeId === selectedId) && catalog.index.placeById.get(selectedId)?.lat === null
  const unmappedSearch = toSearch(applyPatch(query, { unmapped: true }))

  return (
    <div className="map-panel">
      <MapView
        points={points}
        level={level}
        selectedId={selectedId}
        highlightId={highlightPlaceId}
        colourByGenre={colourByGenre}
        fitBounds={fitBounds}
        fitKey={fitKey}
        onSelect={onSelect}
        onHover={onHover}
        onZoom={setZoom}
        onTileFallback={setProvider}
        onReady={onReady}
      />
      <div className="map-controls">
        <button type="button" className="map-ctl" aria-label={t('map.zoomIn')} title={t('map.zoomIn')} onClick={() => map?.zoomIn()}>
          +
        </button>
        <button type="button" className="map-ctl" aria-label={t('map.zoomOut')} title={t('map.zoomOut')} onClick={() => map?.zoomOut()}>
          &minus;
        </button>
        <button type="button" className="map-ctl" aria-label={fitLabel} title={fitLabel} onClick={() => map?.fitBounds(fitBounds, { padding: [24, 24] })}>
          <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      <div className="map-controls map-controls--right">
        <button type="button" className="map-ctl" aria-pressed={colourByGenre} aria-label={t('colourByGenre')} title={t('colourByGenre')} onClick={() => setColourByGenre(!colourByGenre)}>
          <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <circle cx="6" cy="6" r="3.5" fill="var(--genre-colinda)" />
            <circle cx="12" cy="6" r="3.5" fill="var(--genre-joc)" />
            <circle cx="9" cy="12" r="3.5" fill="var(--genre-cantec)" />
          </svg>
        </button>
      </div>
      {provider === 'osm' && <div className="map-tiles-notice">{t('map.osmFallback')}</div>}
      <div className="map-legend" aria-label={t('map.legend')}>
        {colourByGenre ? (
          <>
            <div className="map-legend__row">{t('map.legendGenre')}</div>
            {GENRE_ORDER.map((g) => (
              <button
                key={g}
                type="button"
                className="map-legend__genre"
                aria-pressed={query.genre.includes(g)}
                onClick={() => setQuery({ genre: query.genre.includes(g) ? query.genre.filter((x) => x !== g) : [...query.genre, g] })}
              >
                <GenreSwatch genre={g as GenreId} size={8} />
                <span>{genreLabel(g).split(' / ')[0]}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="map-legend__row">{t('map.legendSize')}</div>
            {[1, Math.max(1, Math.round(nMax / 2)), Math.max(1, nMax)].map((n, i) => {
              const r = Math.sqrt(n / Math.max(1, nMax))
              const d = legendLevel === 'county' ? 10 + 30 * r : 4 + 18 * r
              return (
                <div key={i} className="map-legend__row">
                  <span className="map-legend__dot" style={{ width: d, height: d }} />
                  <span>{n.toLocaleString('en')}</span>
                </div>
              )
            })}
          </>
        )}
      </div>
      {(unmappedCount > 0 || selectedUnmapped) && (
        <Link className="map-notice" to={{ pathname: '/', search: unmappedSearch }}>
          {selectedUnmapped ? t('map.selectedNotMapped') : unmappedCount === 1 ? t('map.notMappedOne') : t('map.notMapped', { n: unmappedCount })}
        </Link>
      )}
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
                {yearSpan(p)}
                {p.level === 'county' ? `, ${t('map.melodiesIn', { n: p.count, v: p.villageCount ?? 0 })}` : ''}
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
