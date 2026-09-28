// JourneyMap (FRONTEND-SPEC 14.4, MAP-SPEC 11): Leaflet map showing only the route (casing +
// line, dashed where assumed), the numbered stop buttons, the departure square and the border
// layer (then / now / compare via the shared `useBorderLayers`). A short legend and a
// four-line stop hover card; everything else lives in the stop list.
import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { melodies, t } from '../../i18n/en'
import { eraDescription, stopDateText, type Era, type JourneyStop } from '../../state/journeys'
import type { BordersMode } from '../../state/query'
import { ROMANIA_BOUNDS, TILE_PROVIDERS, type TileProvider } from '../map/MapView'
import { BorderToggle, type CompareMode } from './BorderToggle'
import { useBorderLayers } from './borderLayers'
import { CompareDivider } from './CompareDivider'
import { ThenNow } from './StopList'
import { availableEras } from './useJourneyData'
import type { JourneyView, StopView } from './journeyView'

const PANES = { route: 'pane-route', stops: 'pane-stops' } as const

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

export function stopAriaLabel(s: StopView, n: number, dimmed: boolean): string {
  const dates = stopDateText(s.stop)
  const base = dates
    ? t('journey.stopLabel', { i: s.stop.seq, n, then: s.nameThen, year: String(s.year), now: s.nameNow ?? s.nameThen, m: s.stop.recordCount, dates })
    : t('journey.stopLabelNoDate', { i: s.stop.seq, n, then: s.nameThen, now: s.nameNow ?? s.nameThen, m: s.stop.recordCount })
  return dimmed ? `${base}; ${t('journey.stopDimmed', { n: s.stop.recordCount })}` : base
}

function stopMarkerHtml(s: StopView, n: number, selected: boolean, highlighted: boolean, dimmed: boolean): string {
  const cls = ['stop-marker', selected ? 'is-selected' : '', highlighted ? 'is-highlight' : '', dimmed ? 'is-dimmed' : ''].filter(Boolean).join(' ')
  return `<button type="button" class="${cls}" data-seq="${s.stop.seq}" aria-label="${esc(stopAriaLabel(s, n, dimmed))}" aria-pressed="${selected}" aria-describedby="journey-hover-card"><span aria-hidden="true">${s.stop.seq}</span></button>`
}

function departureHtml(name: string, assumed: boolean): string {
  const label = assumed ? t('journey.departureAssumed', { name }) : t('journey.departureLine', { name })
  return `<span class="stop-marker stop-marker--endpoint" role="img" aria-label="${esc(label)}" title="${esc(label)}"><span aria-hidden="true">D</span></span>`
}

export interface JourneyMapProps {
  view: JourneyView | null
  borders: BordersMode
  era: Era
  selectedSeq?: number
  highlightSeq?: number
  onStop: (seq: number | undefined) => void
  onBorders: (mode: BordersMode) => void
  onEra: (era: Era) => void
  /** Attribution strings of the loaded border files, for the export. */
  onAttributions?: (lines: string[]) => void
}

interface HoverState {
  seq: number
  x: number
  y: number
}

export function JourneyMap({ view, borders, era, selectedSeq, highlightSeq, onStop, onBorders, onEra, onAttributions }: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeRef = useRef<L.LayerGroup | null>(null)
  const stopsRef = useRef<L.LayerGroup | null>(null)
  const fitRef = useRef<L.LatLngBounds | null>(null)
  const pendingFocusRef = useRef<number | null>(null)
  const propsRef = useRef({ view, onStop, selectedSeq })
  useEffect(() => {
    propsRef.current = { view, onStop, selectedSeq }
  })

  const [map, setMap] = useState<L.Map | null>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [compare, setCompare] = useState(50)
  const [compareMode, setCompareMode] = useState<CompareMode>('swipe')

  const eras = useMemo(() => availableEras(), [])
  const borderState = useBorderLayers({ map, borders, era, compare, compareMode, onAttributions })

  // Create the map once.
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return
    const m = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      zoomSnap: 0.5,
      minZoom: 4,
      maxZoom: 14,
      keyboard: true,
    })
    m.attributionControl.setPrefix(false)
    el.setAttribute('role', 'application')
    el.setAttribute('aria-roledescription', 'map')
    el.setAttribute('aria-label', t('journey.mapLabel'))
    el.setAttribute('tabindex', '0')
    el.setAttribute('title', t('journey.mapHint'))
    m.createPane(PANES.route).style.zIndex = '430'
    m.createPane(PANES.stops).style.zIndex = '440'

    // Tiles: reuse the explorer's providers (CARTO with key from VITE_CARTO_KEY, OSM fallback).
    let prov: TileProvider = 'carto'
    let errors = 0
    let loaded = false
    const start = Date.now()
    let tiles = L.tileLayer(TILE_PROVIDERS.carto.url, { ...TILE_PROVIDERS.carto, crossOrigin: true }).addTo(m)
    const fallback = () => {
      if (prov !== 'carto') return
      prov = 'osm'
      m.removeLayer(tiles)
      tiles = L.tileLayer(TILE_PROVIDERS.osm.url, { ...TILE_PROVIDERS.osm, crossOrigin: true }).addTo(m)
    }
    tiles.on('load', () => {
      loaded = true
    })
    tiles.on('tileerror', () => {
      errors++
      if (errors >= 4 && Date.now() - start < 5000 && !loaded) fallback()
    })
    const timer = window.setTimeout(() => {
      if (!loaded && prov === 'carto') fallback()
    }, 8000)

    routeRef.current = L.layerGroup().addTo(m)
    stopsRef.current = L.layerGroup().addTo(m)
    mapRef.current = m
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => mapRef.current === m && m.invalidateSize()) : null
    ro?.observe(el)
    m.fitBounds(ROMANIA_BOUNDS, { padding: [24, 24] })
    const updateSize = () => {
      const s = m.getSize()
      setSize({ width: s.x, height: s.y })
    }
    updateSize()
    m.on('resize', updateSize)
    // The panel settles its height after mount; keep the route in view.
    m.on('resize', () => {
      if (fitRef.current) m.fitBounds(fitRef.current, { padding: [32, 32], animate: false, maxZoom: 10 })
    })

    // Stop buttons: event delegation.
    const findSeq = (target: EventTarget | null): number | undefined => {
      const btn = (target as HTMLElement | null)?.closest?.('button.stop-marker') as HTMLElement | null
      const v = btn?.dataset.seq
      return v ? Number(v) : undefined
    }
    const hoverAt = (seq: number | undefined) => {
      if (seq === undefined) {
        setHover(null)
        return
      }
      const stop = propsRef.current.view?.journey.stops.find((s) => s.seq === seq)
      if (!stop || stop.lat === null || stop.lng === null) return
      const pt = m.latLngToContainerPoint([stop.lat, stop.lng])
      setHover({ seq, x: pt.x, y: pt.y })
    }
    let lastZoomAt = 0
    m.on('zoomstart', () => {
      lastZoomAt = Date.now()
    })
    const onClick = (e: MouseEvent) => {
      const seq = findSeq(e.target)
      if (seq === undefined) return
      if (Date.now() - lastZoomAt < 300) return
      e.preventDefault()
      e.stopPropagation()
      propsRef.current.onStop(propsRef.current.selectedSeq === seq ? undefined : seq)
    }
    const onOver = (e: Event) => {
      const seq = findSeq(e.target)
      if (seq !== undefined) hoverAt(seq)
    }
    const onOut = (e: Event) => {
      if (findSeq(e.target) !== undefined) hoverAt(undefined)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hoverAt(undefined)
      if (e.key === '[' || e.key === ']') {
        const v = propsRef.current.view
        if (!v) return
        const seqs = v.resolved.map((s) => s.seq)
        if (!seqs.length) return
        const cur = propsRef.current.selectedSeq
        const i = cur === undefined ? -1 : seqs.indexOf(cur)
        const next = e.key === ']' ? seqs[Math.min(seqs.length - 1, i + 1)] : seqs[Math.max(0, i <= 0 ? 0 : i - 1)]
        e.preventDefault()
        pendingFocusRef.current = next
        propsRef.current.onStop(next)
      }
    }
    el.addEventListener('click', onClick, true)
    el.addEventListener('mouseover', onOver)
    el.addEventListener('mouseout', onOut)
    el.addEventListener('focusin', onOver)
    el.addEventListener('focusout', onOut)
    el.addEventListener('keydown', onKey)
    m.on('movestart zoomstart', () => setHover(null))
    setMap(m)

    return () => {
      window.clearTimeout(timer)
      ro?.disconnect()
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('mouseover', onOver)
      el.removeEventListener('mouseout', onOut)
      el.removeEventListener('focusin', onOver)
      el.removeEventListener('focusout', onOut)
      el.removeEventListener('keydown', onKey)
      mapRef.current = null
      routeRef.current = null
      stopsRef.current = null
      m.remove()
      setMap(null)
    }
  }, [])

  // Route and fit.
  useEffect(() => {
    const group = routeRef.current
    if (!map || !group) return
    group.clearLayers()
    if (!view) {
      fitRef.current = null
      map.fitBounds(ROMANIA_BOUNDS, { padding: [24, 24] })
      return
    }
    const j = view.journey
    for (const leg of view.legs) {
      const cls = leg.kind === 'assumed' ? 'route-line--assumed' : 'route-line--known'
      L.polyline([leg.from, leg.to], { pane: PANES.route, className: 'route-casing', interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(group)
      L.polyline([leg.from, leg.to], { pane: PANES.route, className: `route-line ${cls}`, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(group)
    }
    const pts: L.LatLngTuple[] = view.resolved.map((s) => [s.lat as number, s.lng as number])
    if (j.departure && j.departure.lat !== null && j.departure.lng !== null) pts.push([j.departure.lat, j.departure.lng])
    const b = L.latLngBounds(pts)
    fitRef.current = b.isValid() ? b.pad(0.15) : null
    if (fitRef.current) map.fitBounds(fitRef.current, { padding: [32, 32], animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, maxZoom: 10 })
  }, [view, map])

  // Stop markers (rebuilt on selection / highlight changes).
  useEffect(() => {
    const group = stopsRef.current
    if (!map || !group) return
    group.clearLayers()
    if (!view) return
    const j = view.journey
    const n = j.stops.length
    const seen = new Map<string, number>()
    const dep = L.divIcon({ className: '', html: departureHtml(j.departure.name, j.departure.confidence === 'assumed'), iconSize: [24, 24], iconAnchor: [12, 12] })
    if (j.departure && j.departure.lat !== null && j.departure.lng !== null) L.marker([j.departure.lat, j.departure.lng], { icon: dep, pane: PANES.stops, keyboard: false, interactive: false }).addTo(group)
    for (const s of view.stops) {
      if (!s.resolved) continue
      const stop = s.stop
      const key = `${stop.lat},${stop.lng}`
      const dup = seen.get(key) ?? 0
      seen.set(key, dup + 1)
      const selected = selectedSeq === stop.seq
      const highlighted = !selected && highlightSeq === stop.seq
      const dimmed = view.filtersActive && stop.recordCount > 0 && s.matching === 0
      const hit = 34
      const icon = L.divIcon({ className: '', html: stopMarkerHtml(s, n, selected, highlighted, dimmed), iconSize: [hit, hit], iconAnchor: [hit / 2 - dup * 8, hit / 2 + dup * 8] })
      L.marker([stop.lat as number, stop.lng as number], { icon, pane: PANES.stops, keyboard: false, zIndexOffset: selected ? 1000 : highlighted ? 500 : 0, riseOnHover: true }).addTo(group)
    }
    // Keyboard navigation ([ / ]) rebuilds the buttons: move focus to the newly selected stop.
    const pending = pendingFocusRef.current
    if (pending !== null) {
      pendingFocusRef.current = null
      containerRef.current?.querySelector<HTMLButtonElement>(`button.stop-marker[data-seq="${pending}"]`)?.focus()
    }
  }, [view, selectedSeq, highlightSeq, map])

  // Pan to a highlighted stop only when it is off-screen.
  useEffect(() => {
    if (!map || !view || highlightSeq === undefined) return
    const s = view.journey.stops.find((x) => x.seq === highlightSeq)
    if (s && s.lat !== null && s.lng !== null && !map.getBounds().contains([s.lat, s.lng])) map.panTo([s.lat, s.lng], { animate: false })
  }, [view, highlightSeq, map])

  const fitRoute = () => {
    if (!map) return
    if (fitRef.current) map.fitBounds(fitRef.current, { padding: [32, 32], maxZoom: 10 })
    else map.fitBounds(ROMANIA_BOUNDS, { padding: [24, 24] })
  }

  const { thenSet, unavailable, loading, underPointer } = borderState
  const legendTitle = borders === 'now' ? t('journey.legendTitle.now') : borders === 'both' ? t('journey.legendTitle.both', { era }) : t('journey.legendTitle.then', { era: borders })
  const hoveredStop = hover && view ? view.stops.find((s) => s.stop.seq === hover.seq) : undefined
  const hasRoute = Boolean(view && view.legs.length > 0)

  return (
    <div className="journey-map map-panel" ref={panelRef}>
      <div className="map-view journey-map__view" ref={containerRef} />
      <div className="map-controls">
        <button type="button" className="map-ctl" aria-label={t('map.zoomIn')} title={t('map.zoomIn')} onClick={() => map?.zoomIn()}>
          +
        </button>
        <button type="button" className="map-ctl" aria-label={t('map.zoomOut')} title={t('map.zoomOut')} onClick={() => map?.zoomOut()}>
          &minus;
        </button>
        <button type="button" className="map-ctl map-ctl--text" title={view ? t('journey.fitRoute') : t('map.fitRomania')} onClick={fitRoute}>
          {view ? t('journey.fitRoute') : t('map.fitRomania')}
        </button>
      </div>
      <div className="map-controls map-controls--right journey-map__toggle">
        <BorderToggle value={borders} era={era} eras={eras} disabled={unavailable} loading={loading} compare={compare} compareMode={compareMode} onChange={onBorders} onEra={onEra} onCompare={setCompare} onCompareMode={setCompareMode} />
      </div>
      {borders === 'both' && compareMode === 'swipe' && !unavailable && <CompareDivider compare={compare} onCompare={setCompare} boundsRef={panelRef} />}
      <div className="map-legend journey-legend" aria-label={t('journey.legend')}>
        <div className="map-legend__row journey-legend__title">{legendTitle}</div>
        {view && (
          <>
            {hasRoute && (
              <div className="map-legend__row">
                <svg width="28" height="8" aria-hidden="true">
                  <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--known" />
                </svg>
                <span>{t('journey.legendKnown')}</span>
              </div>
            )}
            {hasRoute && view.journey.departure.confidence === 'assumed' && (
              <div className="map-legend__row">
                <svg width="28" height="8" aria-hidden="true">
                  <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--assumed" />
                </svg>
                <span>{t('journey.legendAssumed')}</span>
              </div>
            )}
            <div className="map-legend__row">
              <span className="legend-stop" aria-hidden="true">
                1
              </span>
              <span>{view.journey.kind === 'cluster' ? t('journey.legendCluster') : t('journey.legendStop')}</span>
              <span className="legend-stop legend-stop--endpoint" aria-hidden="true">
                D
              </span>
              <span>{t('journey.legendDeparture')}</span>
            </div>
            {view.unresolved.length > 0 && <div className="map-legend__row muted">{t('journey.legendNoCoords', { n: view.unresolved.length })}</div>}
            {view.journey.kind === 'route' && view.resolved.length < 2 && <div className="map-legend__row muted">{t('journey.noRoute')}</div>}
          </>
        )}
        {thenSet && !unavailable && (
          <div className="map-legend__row">
            <svg width="28" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--then-state" />
            </svg>
            <span title={eraDescription(thenSet)}>{thenSet === '1910' ? `${t('journey.legendThenState', { era: thenSet })}, ${t('journey.legendThenCounty', { era: thenSet })}` : t('journey.legendThenState', { era: thenSet })}</span>
          </div>
        )}
        {(borders === 'now' || borders === 'both') && !unavailable && (
          <div className="map-legend__row">
            <svg width="28" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--now-state" />
            </svg>
            <span>
              {t('journey.legendNowState')}, {t('journey.legendNowCounty')}
            </span>
          </div>
        )}
        {unavailable && <div className="map-legend__row muted">{t('journey.bordersUnavailable')}</div>}
        {underPointer && (underPointer.then || underPointer.now) && (
          <div className="map-legend__row journey-legend__pointer">
            {underPointer.then && thenSet ? `${underPointer.then} (${thenSet})` : ''}
            {underPointer.then && underPointer.now ? ' / ' : ''}
            {underPointer.now ? `${underPointer.now} (now)` : ''}
          </div>
        )}
      </div>
      {hoveredStop && hover && <StopHoverCard s={hoveredStop} n={view?.journey.stops.length ?? 0} x={hover.x} y={hover.y} width={size.width} height={size.height} />}
    </div>
  )
}

function StopHoverCard({ s, n, x, y, width, height }: { s: StopView; n: number; x: number; y: number; width: number; height: number }) {
  const cardW = 260
  const left = Math.max(8, Math.min(width - cardW - 8, x - cardW / 2))
  const flip = y < 140
  const style = flip ? { left, top: y + 22 } : { left, bottom: height - y + 18 }
  const dates = stopDateText(s.stop)
  return (
    <div className="hover-card journey-hover-card" role="tooltip" id="journey-hover-card" style={style}>
      <div className="hover-card__name">
        <span className="mono">{s.stop.seq}</span>/{n} <ThenNow s={s} />
      </div>
      {dates && <div className="mono">{dates}</div>}
      <div className="hover-card__count">{melodies(s.stop.recordCount)}</div>
      <div className="hover-card__hint">{t('journey.selectStop')}</div>
    </div>
  )
}

export type { JourneyStop }
