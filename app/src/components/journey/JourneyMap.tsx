// JourneyMap (FRONTEND-SPEC 14.4, MAP-SPEC 11): Leaflet map with its own panes for the border
// sets, the route (casing + line + direction arrows) and the numbered stop buttons; the border
// toggle with the compare divider (clip-path swipe or fade); the legend; and the per-dataset
// attribution taken from each border file's `meta.sources`.
import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { genreLabel, instrumentLabel, melodies, t } from '../../i18n/en'
import { eraDescription, statusBadgeText, stopDateText, thenSetFor, type BorderFeatureProps, type BorderFile, type Era, type JourneyStop } from '../../state/journeys'
import type { BordersMode } from '../../state/query'
import { ROMANIA_BOUNDS, TILE_PROVIDERS, type TileProvider } from '../map/MapView'
import { BorderToggle, type CompareMode } from './BorderToggle'
import { VillageStatusBadge } from './VillageStatusBadge'
import { availableEras, useBorderFile } from './useJourneyData'
import { ThenNow } from './StopList'
import type { JourneyView, StopView } from './journeyView'

const PANES = { bordersNow: 'pane-borders-now', bordersThen: 'pane-borders-then', route: 'pane-route', stops: 'pane-stops' } as const
const ARROW_EVERY = 96
const ARROW_MIN_LEG = 48

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

export function stopAriaLabel(s: StopView, n: number, dimmed: boolean): string {
  const dates = stopDateText(s.stop)
  const base = dates
    ? t('journey.stopLabel', { i: s.stop.seq, n, then: s.nameThen, year: s.year, now: s.nameNow ?? s.nameThen, m: s.stop.recordCount, dates })
    : t('journey.stopLabelNoDate', { i: s.stop.seq, n, then: s.nameThen, now: s.nameNow ?? s.nameThen, m: s.stop.recordCount })
  return dimmed ? `${base}; ${t('journey.stopDimmed', { n: s.stop.recordCount })}` : base
}

function stopMarkerHtml(s: StopView, n: number, selected: boolean, highlighted: boolean, dimmed: boolean): string {
  const cls = ['stop-marker', selected ? 'is-selected' : '', highlighted ? 'is-highlight' : '', dimmed ? 'is-dimmed' : '', s.stop.locationConfidence === 'label-region' ? 'stop-marker--region' : ''].filter(Boolean).join(' ')
  return `<button type="button" class="${cls}" data-seq="${s.stop.seq}" aria-label="${esc(stopAriaLabel(s, n, dimmed))}" aria-pressed="${selected}" aria-describedby="journey-hover-card"><span aria-hidden="true">${s.stop.seq}</span></button>`
}

function departureHtml(name: string, assumed: boolean): string {
  const label = assumed ? t('journey.departureAssumed', { name }) : t('journey.departureLine', { name })
  return `<span class="stop-marker stop-marker--endpoint" role="img" aria-label="${esc(label)}" title="${esc(label)}"><span aria-hidden="true">D</span></span>`
}

function bearingDeg(a: L.Point, b: L.Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

/** Convex hull (monotone chain) of lat/lng points, for cluster trips with 3+ located stops. */
function hull(points: [number, number][]): [number, number][] {
  const pts = [...points].sort((p, q) => p[1] - q[1] || p[0] - q[0])
  if (pts.length < 3) return pts
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1])
  const lower: [number, number][] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
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
  const mapRef = useRef<L.Map | null>(null)
  const routeRef = useRef<L.LayerGroup | null>(null)
  const arrowsRef = useRef<L.LayerGroup | null>(null)
  const stopsRef = useRef<L.LayerGroup | null>(null)
  const thenRef = useRef<L.GeoJSON | null>(null)
  const nowRef = useRef<L.GeoJSON | null>(null)
  const legsRef = useRef<{ from: L.LatLng; to: L.LatLng }[]>([])
  const attributionsRef = useRef<Set<string>>(new Set())
  const propsRef = useRef({ view, onStop, selectedSeq })
  useEffect(() => {
    propsRef.current = { view, onStop, selectedSeq }
  })

  const [ready, setReady] = useState(false)
  const [provider, setProvider] = useState<TileProvider>('carto')
  const [hover, setHover] = useState<HoverState | null>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [compare, setCompare] = useState(50)
  const [compareMode, setCompareMode] = useState<CompareMode>('swipe')
  const [underPointer, setUnderPointer] = useState<{ then?: string; now?: string } | null>(null)

  const eras = useMemo(() => availableEras(), [])
  const thenSet = thenSetFor(borders, era)
  const nowFile = useBorderFile('now')
  const thenFile = useBorderFile(thenSet ?? era)
  const bordersUnavailable = Boolean(nowFile.error && thenFile.error)
  const bordersLoading = nowFile.loading || thenFile.loading

  // Create the map once.
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      zoomSnap: 0.5,
      minZoom: 4,
      maxZoom: 14,
      keyboard: true,
    })
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>')
    el.setAttribute('role', 'application')
    el.setAttribute('aria-roledescription', 'map')
    el.setAttribute('aria-label', t('journey.mapLabel'))
    el.setAttribute('tabindex', '0')
    el.setAttribute('title', t('journey.mapHint'))
    for (const [name, z] of [
      [PANES.bordersNow, 410],
      [PANES.bordersThen, 415],
      [PANES.route, 430],
      [PANES.stops, 440],
    ] as const) {
      const pane = map.createPane(name)
      pane.style.zIndex = String(z)
    }

    // Tiles: reuse the explorer's providers (CARTO with key from VITE_CARTO_KEY, OSM fallback).
    let prov: TileProvider = 'carto'
    let errors = 0
    let loaded = false
    const start = Date.now()
    let tiles = L.tileLayer(TILE_PROVIDERS.carto.url, { ...TILE_PROVIDERS.carto, crossOrigin: true }).addTo(map)
    const fallback = () => {
      if (prov !== 'carto') return
      prov = 'osm'
      map.removeLayer(tiles)
      tiles = L.tileLayer(TILE_PROVIDERS.osm.url, { ...TILE_PROVIDERS.osm, crossOrigin: true }).addTo(map)
      setProvider('osm')
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

    routeRef.current = L.layerGroup().addTo(map)
    arrowsRef.current = L.layerGroup().addTo(map)
    stopsRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null
    ro?.observe(el)
    map.fitBounds(ROMANIA_BOUNDS, { padding: [24, 24] })
    const updateSize = () => {
      const s = map.getSize()
      setSize({ width: s.x, height: s.y })
    }
    updateSize()
    map.on('resize', updateSize)

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
      const pt = map.latLngToContainerPoint([stop.lat, stop.lng])
      setHover({ seq, x: pt.x, y: pt.y })
    }
    let lastZoomAt = 0
    map.on('zoomstart', () => {
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
        propsRef.current.onStop(next)
        const btn = el.querySelector<HTMLButtonElement>(`button.stop-marker[data-seq="${next}"]`)
        btn?.focus()
      }
    }
    el.addEventListener('click', onClick, true)
    el.addEventListener('mouseover', onOver)
    el.addEventListener('mouseout', onOut)
    el.addEventListener('focusin', onOver)
    el.addEventListener('focusout', onOut)
    el.addEventListener('keydown', onKey)
    map.on('movestart zoomstart', () => setHover(null))
    setReady(true)

    return () => {
      window.clearTimeout(timer)
      ro?.disconnect()
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('mouseover', onOver)
      el.removeEventListener('mouseout', onOut)
      el.removeEventListener('focusin', onOver)
      el.removeEventListener('focusout', onOut)
      el.removeEventListener('keydown', onKey)
      map.remove()
      mapRef.current = null
      routeRef.current = null
      arrowsRef.current = null
      stopsRef.current = null
      thenRef.current = null
      nowRef.current = null
      setReady(false)
    }
  }, [])

  // Direction arrows: one chevron every 96 px of screen length, recomputed on zoomend.
  const drawArrows = useCallback(() => {
    const map = mapRef.current
    const group = arrowsRef.current
    if (!map || !group) return
    group.clearLayers()
    for (const leg of legsRef.current) {
      const a = map.latLngToLayerPoint(leg.from)
      const b = map.latLngToLayerPoint(leg.to)
      const len = a.distanceTo(b)
      if (len < ARROW_MIN_LEG) continue
      const n = Math.max(1, Math.floor(len / ARROW_EVERY))
      const deg = bearingDeg(a, b)
      for (let k = 1; k <= n; k++) {
        const f = (k - 0.5) / n
        const p = L.point(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f)
        const icon = L.divIcon({
          className: '',
          html: `<svg class="route-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false" style="transform:rotate(${deg.toFixed(1)}deg)"><path d="M2 1.5 8.5 6 2 10.5" fill="none" stroke="var(--surface)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 1.5 8.5 6 2 10.5" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
        L.marker(map.layerPointToLatLng(p), { icon, interactive: false, keyboard: false, pane: PANES.route }).addTo(group)
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.on('zoomend', drawArrows)
    return () => {
      map.off('zoomend', drawArrows)
    }
  }, [ready, drawArrows])

  // Route, cluster shapes and fit.
  useEffect(() => {
    const map = mapRef.current
    const group = routeRef.current
    if (!map || !group || !ready) return
    group.clearLayers()
    legsRef.current = []
    if (!view) {
      map.fitBounds(ROMANIA_BOUNDS, { padding: [24, 24] })
      drawArrows()
      return
    }
    const j = view.journey
    const fuzzy = j.kind === 'cluster'
    for (const leg of view.legs) {
      const cls = leg.kind === 'assumed' ? 'route-line--assumed' : 'route-line--known'
      L.polyline([leg.from, leg.to], { pane: PANES.route, className: 'route-casing', interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(group)
      L.polyline([leg.from, leg.to], { pane: PANES.route, className: `route-line ${cls}${fuzzy ? ' route-line--fuzzy' : ''}`, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(group)
      legsRef.current.push({ from: L.latLng(leg.from), to: L.latLng(leg.to) })
    }
    if (fuzzy) {
      const pts = view.resolved.filter((s) => s.locationConfidence !== 'label-region').map((s) => [s.lat as number, s.lng as number] as [number, number])
      if (pts.length >= 3) L.polygon(hull(pts), { pane: PANES.route, className: 'route-hull', interactive: false }).addTo(group)
      else for (const p of pts) L.circle(p, { pane: PANES.route, radius: 12000, className: 'route-hull', interactive: false }).addTo(group)
    }
    for (const s of view.resolved.filter((s) => s.locationConfidence === 'label-region')) {
      L.circle([s.lat as number, s.lng as number], { pane: PANES.route, radius: 30000, className: 'route-region', interactive: false }).addTo(group)
    }
    const pts: L.LatLngTuple[] = view.resolved.map((s) => [s.lat as number, s.lng as number])
    pts.push([j.departure.lat, j.departure.lng])
    const b = L.latLngBounds(pts)
    if (b.isValid()) map.fitBounds(b.pad(0.15), { padding: [32, 32], animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, maxZoom: 10 })
    drawArrows()
  }, [view, ready, drawArrows])

  // Stop markers (rebuilt on selection / highlight changes).
  useEffect(() => {
    const map = mapRef.current
    const group = stopsRef.current
    if (!map || !group || !ready) return
    group.clearLayers()
    if (!view) return
    const j = view.journey
    const n = j.stops.length
    const seen = new Map<string, number>()
    const dep = L.divIcon({ className: '', html: departureHtml(j.departure.name, j.departure.confidence === 'assumed'), iconSize: [24, 24], iconAnchor: [12, 12] })
    L.marker([j.departure.lat, j.departure.lng], { icon: dep, pane: PANES.stops, keyboard: false, interactive: false }).addTo(group)
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
  }, [view, selectedSeq, highlightSeq, ready])

  // Pan to a highlighted stop only when it is off-screen.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !view || highlightSeq === undefined) return
    const s = view.journey.stops.find((x) => x.seq === highlightSeq)
    if (s && s.lat !== null && s.lng !== null && !map.getBounds().contains([s.lat, s.lng])) map.panTo([s.lat, s.lng], { animate: false })
  }, [view, highlightSeq])

  // Border layers.
  const pointerHandlers = useMemo(
    () => ({
      then: (p: BorderFeatureProps) => setUnderPointer((u) => ({ ...u, then: p.name })),
      now: (p: BorderFeatureProps) => setUnderPointer((u) => ({ ...u, now: p.nameRo ?? p.name })),
      clear: () => setUnderPointer(null),
    }),
    [],
  )
  const addAttributions = useCallback(
    (file: BorderFile | null) => {
      const map = mapRef.current
      if (!map || !file?.meta?.sources) return
      for (const src of file.meta.sources) {
        if (attributionsRef.current.has(src.attribution)) continue
        attributionsRef.current.add(src.attribution)
        map.attributionControl.addAttribution(`<span title="${esc(src.licence)}">${esc(src.attribution)}</span>`)
      }
      onAttributions?.([...attributionsRef.current])
    },
    [onAttributions],
  )

  const buildLayer = useCallback(
    (file: BorderFile, set: Era | 'now'): L.GeoJSON => {
      const isThen = set !== 'now'
      return L.geoJSON(file as unknown as GeoJSON.FeatureCollection, {
        pane: isThen ? PANES.bordersThen : PANES.bordersNow,
        style: (f) => {
          const p = (f?.properties ?? {}) as BorderFeatureProps
          const level = p.level === 'county' ? 'county' : 'state'
          return { className: `border-line border-line--${isThen ? 'then' : 'now'} border-line--${level}`, interactive: level === 'county' }
        },
        onEachFeature: (f, layer) => {
          const p = f.properties as BorderFeatureProps
          if (p.level !== 'county') return
          layer.on('mouseover', () => (isThen ? pointerHandlers.then(p) : pointerHandlers.now(p)))
          layer.on('mouseout', pointerHandlers.clear)
        },
      })
    },
    [pointerHandlers],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    nowRef.current?.remove()
    nowRef.current = null
    const showNow = borders === 'now' || borders === 'both'
    if (showNow && nowFile.data) {
      nowRef.current = buildLayer(nowFile.data, 'now').addTo(map)
      addAttributions(nowFile.data)
    }
    return () => {
      nowRef.current?.remove()
      nowRef.current = null
    }
  }, [borders, nowFile.data, ready, buildLayer, addAttributions])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    thenRef.current?.remove()
    thenRef.current = null
    if (thenSet && thenFile.data) {
      thenRef.current = buildLayer(thenFile.data, thenSet).addTo(map)
      addAttributions(thenFile.data)
    }
    return () => {
      thenRef.current?.remove()
      thenRef.current = null
    }
  }, [thenSet, thenFile.data, ready, buildLayer, addAttributions])

  // Compare: clip the "then" pane left of the divider and the "now" pane right of it (swipe),
  // or set the "then" pane's opacity (fade). Panes move with the map, so the clip polygon is
  // recomputed in pane coordinates on every move / zoom / resize.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const thenPane = map.getPane(PANES.bordersThen)
    const nowPane = map.getPane(PANES.bordersNow)
    if (!thenPane || !nowPane) return
    const reset = () => {
      thenPane.style.clipPath = ''
      nowPane.style.clipPath = ''
      thenPane.style.opacity = ''
    }
    if (borders !== 'both') {
      reset()
      return
    }
    if (compareMode === 'fade') {
      reset()
      thenPane.style.opacity = String(compare / 100)
      return
    }
    thenPane.style.opacity = ''
    const apply = () => {
      const sz = map.getSize()
      const x = (sz.x * compare) / 100
      const clip = (pane: HTMLElement, x0: number, x1: number) => {
        const pos = L.DomUtil.getPosition(pane) ?? L.point(0, 0)
        const left = x0 - pos.x
        const right = x1 - pos.x
        const top = -pos.y
        const bottom = sz.y - pos.y
        pane.style.clipPath = `polygon(${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px)`
      }
      clip(thenPane, 0, x)
      clip(nowPane, x, sz.x)
    }
    apply()
    map.on('move zoom zoomend moveend resize viewreset', apply)
    return () => {
      map.off('move zoom zoomend moveend resize viewreset', apply)
      reset()
    }
  }, [borders, compare, compareMode, ready])

  // Divider drag.
  const dragging = useRef(false)
  const onDividerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDividerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)))
    setCompare(pct)
  }
  const onDividerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const onDividerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key === 'ArrowLeft') setCompare((c) => Math.max(0, c - step))
    else if (e.key === 'ArrowRight') setCompare((c) => Math.min(100, c + step))
    else return
    e.preventDefault()
  }

  const fitRoute = () => {
    const map = mapRef.current
    if (!map) return
    if (!view) {
      map.fitBounds(ROMANIA_BOUNDS, { padding: [24, 24] })
      return
    }
    const pts: L.LatLngTuple[] = view.resolved.map((s) => [s.lat as number, s.lng as number])
    pts.push([view.journey.departure.lat, view.journey.departure.lng])
    const b = L.latLngBounds(pts)
    if (b.isValid()) map.fitBounds(b.pad(0.15), { padding: [32, 32], maxZoom: 10 })
  }

  const legendTitle = borders === 'now' ? t('journey.legendTitle.now') : borders === 'both' ? t('journey.legendTitle.both', { era }) : t('journey.legendTitle.then', { era: borders })
  const hoveredStop = hover && view ? view.stops.find((s) => s.stop.seq === hover.seq) : undefined
  const nResolved = view?.resolved.length ?? 0

  return (
    <div className="journey-map map-panel">
      <div className="map-view journey-map__view" ref={containerRef} />
      <div className="map-controls">
        <button type="button" className="map-ctl" aria-label={t('map.zoomIn')} title={t('map.zoomIn')} onClick={() => mapRef.current?.zoomIn()}>
          +
        </button>
        <button type="button" className="map-ctl" aria-label={t('map.zoomOut')} title={t('map.zoomOut')} onClick={() => mapRef.current?.zoomOut()}>
          &minus;
        </button>
        <button type="button" className="map-ctl" aria-label={view ? t('journey.fitRoute') : t('map.fitRomania')} title={view ? t('journey.fitRoute') : t('map.fitRomania')} onClick={fitRoute}>
          <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      <div className="map-controls map-controls--right journey-map__toggle">
        <BorderToggle
          value={borders}
          era={era}
          eras={eras}
          disabled={bordersUnavailable}
          loading={bordersLoading}
          compare={compare}
          compareMode={compareMode}
          onChange={onBorders}
          onEra={onEra}
          onCompare={setCompare}
          onCompareMode={setCompareMode}
        />
      </div>
      {borders === 'both' && compareMode === 'swipe' && !bordersUnavailable && (
        <div className="compare-divider" style={{ left: `${compare}%` } as CSSProperties} aria-hidden="false">
          <button
            type="button"
            className="compare-divider__handle"
            aria-label={t('journey.compareLabel')}
            aria-valuenow={compare}
            aria-valuemin={0}
            aria-valuemax={100}
            role="slider"
            onPointerDown={onDividerDown}
            onPointerMove={onDividerMove}
            onPointerUp={onDividerUp}
            onPointerCancel={onDividerUp}
            onKeyDown={onDividerKey}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M8 4 3 10l5 6M12 4l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {provider === 'osm' && <div className="map-tiles-notice">{t('map.osmFallback')}</div>}
      <div className="map-legend journey-legend" aria-label={t('journey.legend')}>
        <div className="map-legend__row journey-legend__title">{legendTitle}</div>
        {view && (
          <>
            {view.journey.kind === 'route' ? (
              <>
                <div className="map-legend__row">
                  <svg width="28" height="8" aria-hidden="true">
                    <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--known" />
                  </svg>
                  <span>{t('journey.legendKnown')}</span>
                </div>
                {view.journey.departure.confidence === 'assumed' && (
                  <div className="map-legend__row">
                    <svg width="28" height="8" aria-hidden="true">
                      <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--assumed" />
                    </svg>
                    <span>{t('journey.legendAssumed')}</span>
                  </div>
                )}
                <div className="map-legend__row">
                  <svg width="28" height="12" aria-hidden="true">
                    <path d="M10 2 16 6l-6 4" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
                  </svg>
                  <span>{t('journey.legendArrow')}</span>
                </div>
              </>
            ) : (
              <div className="map-legend__row">
                <svg width="28" height="8" aria-hidden="true">
                  <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--fuzzy" />
                </svg>
                <span>{t('journey.legendCluster')}</span>
              </div>
            )}
            {view.resolved.some((s) => s.locationConfidence === 'label-region') && (
              <div className="map-legend__row">
                <svg width="28" height="12" aria-hidden="true">
                  <circle cx="14" cy="6" r="5" className="legend-region" />
                </svg>
                <span>{t('journey.legendRegion')}</span>
              </div>
            )}
            <div className="map-legend__row">
              <span className="legend-stop" aria-hidden="true">
                1
              </span>
              <span>{t('journey.legendStop')}</span>
            </div>
            <div className="map-legend__row">
              <span className="legend-stop legend-stop--endpoint" aria-hidden="true">
                D
              </span>
              <span>{t('journey.legendDeparture')}</span>
            </div>
            {view.unresolved.length > 0 && <div className="map-legend__row muted">{t('journey.legendNoCoords', { n: view.unresolved.length })}</div>}
            {view.journey.kind === 'route' && nResolved < 2 && view.legs.length < 1 && <div className="map-legend__row muted">{t('journey.noRoute')}</div>}
          </>
        )}
        {thenSet && !bordersUnavailable && (
          <>
            {thenSet === '1910' && (
              <div className="map-legend__row">
                <svg width="28" height="8" aria-hidden="true">
                  <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--then-county" />
                </svg>
                <span>{t('journey.legendThenCounty', { era: thenSet })}</span>
              </div>
            )}
            <div className="map-legend__row">
              <svg width="28" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--then-state" />
              </svg>
              <span title={eraDescription(thenSet)}>{t('journey.legendThenState', { era: thenSet })}</span>
            </div>
          </>
        )}
        {(borders === 'now' || borders === 'both') && !bordersUnavailable && (
          <>
            <div className="map-legend__row">
              <svg width="28" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--now-county" />
              </svg>
              <span>{t('journey.legendNowCounty')}</span>
            </div>
            <div className="map-legend__row">
              <svg width="28" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="28" y2="4" className="legend-line legend-line--now-state" />
              </svg>
              <span>{t('journey.legendNowState')}</span>
            </div>
          </>
        )}
        {bordersUnavailable && <div className="map-legend__row muted">{t('journey.bordersUnavailable')}</div>}
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
  const cardW = 280
  const left = Math.max(8, Math.min(width - cardW - 8, x - cardW / 2))
  const flip = y < 200
  const style = flip ? { left, top: y + 22 } : { left, bottom: height - y + 18 }
  const dates = stopDateText(s.stop)
  return (
    <div className="hover-card journey-hover-card" role="tooltip" id="journey-hover-card" style={style}>
      <div className="hover-card__name">
        <span className="mono">{s.stop.seq}</span>/{n} <ThenNow s={s} />
      </div>
      <div className="journey-hover-card__badge">
        <VillageStatusBadge status={s.status} compact />
        {s.status.status === 'unknown' ? '' : ''}
      </div>
      {(s.stop.county || s.stop.countyHistorical) && <div className="hover-card__path">{[s.stop.county, s.stop.countyHistorical ? `(${s.stop.countyHistorical})` : null].filter(Boolean).join(' ')}</div>}
      {dates && <div className="mono">{dates}</div>}
      <div className="hover-card__count">{melodies(s.stop.recordCount)}</div>
      {s.facts.genres.length > 0 && <div>{s.facts.genres.slice(0, 3).map(([g, k]) => `${genreLabel(g).split(' / ')[0]} ${k}`).join(', ')}</div>}
      {s.facts.ethnicities.length > 0 && (
        <div>
          {t('journey.ethnicities')}: {s.facts.ethnicities.map(([e, k]) => `${e} ${k}`).join(', ')}
        </div>
      )}
      {s.facts.instruments.length > 0 && <div>{s.facts.instruments.map(([i, k]) => `${instrumentLabel(i)} ${k}`).join(', ')}</div>}
      <div className="hover-card__hint">{statusBadgeText(s.status) === t('status.unknown') ? t('journey.statusNoEntry') : t('journey.selectStop')}</div>
    </div>
  )
}

export type { JourneyStop }
