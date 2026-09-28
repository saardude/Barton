// MapView (MAP-SPEC 1 to 5): Leaflet 1.9 with CARTO Positron tiles and an OpenStreetMap fallback,
// county bubbles and village dots as accessible <button>s inside divIcon markers, two-ring
// selection, hover / focus reporting for the hover card. Provider-independent inputs: MapPoint[].
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { genreLabel, t } from '../../i18n/en'
import { placeText } from '../../state/placeName'
import type { GenreId } from '../../state/query'
import type { MapPoint } from '../../state/selectors'

export const ROMANIA_BOUNDS: L.LatLngBoundsLiteral = [
  [43.6, 20.2],
  [48.3, 29.7],
]
const MAX_BOUNDS: L.LatLngBoundsLiteral = [
  [41.0, 15.0],
  [50.5, 33.0],
]

export const TILE_PROVIDERS = {
  carto: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    subdomains: '',
    maxZoom: 19,
  },
} as const

export type TileProvider = keyof typeof TILE_PROVIDERS

export interface HoverInfo {
  point: MapPoint
  x: number
  y: number
}

export interface MapViewProps {
  points: MapPoint[]
  level: 'county' | 'village'
  selectedId?: string
  highlightId?: string | null
  colourByGenre: boolean
  /** Bounds to fit; the map refits whenever `fitKey` changes. */
  fitBounds: L.LatLngBoundsLiteral
  fitKey: string
  onSelect: (point: MapPoint) => void
  onHover: (info: HoverInfo | null) => void
  onZoom?: (zoom: number) => void
  onTileFallback?: (provider: TileProvider) => void
  /** Exposes the map for the zoom / fit controls. */
  onReady?: (map: L.Map) => void
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

export function pointAriaLabel(p: MapPoint): string {
  const name = placeText(p.place, p.placeId)
  if (p.level === 'county') return t('map.countyLabel', { name, n: p.count, v: p.villageCount ?? 0 })
  const county = p.place.county ?? p.place.countyHistorical ?? ''
  return county ? t('map.pointLabel', { name, county, n: p.count }) : `${name}: ${t('results.count', { n: p.count })}`
}

function diameter(p: MapPoint, nMax: number): number {
  const r = Math.sqrt(p.count / Math.max(1, nMax))
  return p.level === 'county' ? Math.min(40, Math.max(10, 10 + 30 * r)) : Math.min(22, Math.max(4, 4 + 18 * r))
}

function markerHtml(p: MapPoint, d: number, colourByGenre: boolean, selected: boolean, highlighted: boolean): string {
  const genre: GenreId | null = colourByGenre ? p.dominantGenre : null
  const fill = colourByGenre ? `var(--genre-${genre ?? 'other'})` : p.level === 'county' ? 'var(--surface)' : 'var(--map-dot)'
  const labelInk = colourByGenre ? 'var(--genre-label-ink)' : 'var(--ink)'
  const cls = ['dot', p.level === 'county' ? 'dot--county' : 'dot--village', highlighted ? 'dot--highlight' : ''].filter(Boolean).join(' ')
  const label =
    p.level === 'county'
      ? d >= 22
        ? `<span class="dot__label" aria-hidden="true">${p.count}</span>`
        : `<span class="dot__label dot__label--beside" aria-hidden="true">${p.count}</span>`
      : ''
  const title = genre ? ` title="${esc(genreLabel(genre))}"` : ''
  return `<button type="button" class="${cls}" data-place-id="${esc(p.placeId)}" aria-label="${esc(pointAriaLabel(p))}" aria-pressed="${selected}"${title} style="--d:${d}px;--fill:${fill};--label-ink:${labelInk}">${label}</button>`
}

export function MapView(props: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const pointsRef = useRef<Map<string, MapPoint>>(new Map())
  const propsRef = useRef(props)
  useEffect(() => {
    propsRef.current = props
  })

  // Create the map once.
  useEffect(() => {
    const el = containerRef.current
    const markers = markersRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      zoomSnap: 0.5,
      minZoom: 5,
      maxZoom: 14,
      maxBounds: MAX_BOUNDS,
      maxBoundsViscosity: 0.8,
      keyboard: true,
    })
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>')
    el.setAttribute('role', 'application')
    el.setAttribute('aria-roledescription', 'map')
    el.setAttribute('aria-label', t('map.label'))
    el.setAttribute('tabindex', '0')

    // Tiles: CARTO first; after 4 tile errors within 5 s (or no load within 8 s) fall back to OSM (D6).
    let provider: TileProvider = 'carto'
    let errors = 0
    let loaded = false
    const start = Date.now()
    let tiles = L.tileLayer(TILE_PROVIDERS.carto.url, { ...TILE_PROVIDERS.carto, crossOrigin: true }).addTo(map)
    const fallback = () => {
      if (provider !== 'carto') return
      provider = 'osm'
      map.removeLayer(tiles)
      tiles = L.tileLayer(TILE_PROVIDERS.osm.url, { ...TILE_PROVIDERS.osm, crossOrigin: true }).addTo(map)
      propsRef.current.onTileFallback?.('osm')
    }
    tiles.on('load', () => {
      loaded = true
    })
    tiles.on('tileerror', () => {
      errors++
      if (errors >= 4 && Date.now() - start < 5000 && !loaded) fallback()
    })
    const timer = window.setTimeout(() => {
      if (!loaded && provider === 'carto') fallback()
    }, 8000)

    const layer = L.layerGroup().addTo(map)
    layerRef.current = layer
    mapRef.current = map
    // Keep Leaflet's size in sync with the panel (the grid resizes with the viewport).
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null
    ro?.observe(el)
    map.fitBounds(propsRef.current.fitBounds, { padding: [24, 24] })
    map.on('zoomend', () => propsRef.current.onZoom?.(map.getZoom()))
    propsRef.current.onZoom?.(map.getZoom())
    propsRef.current.onReady?.(map)

    // Event delegation for the dot buttons.
    const findPoint = (target: EventTarget | null): MapPoint | undefined => {
      const btn = (target as HTMLElement | null)?.closest?.('button.dot') as HTMLElement | null
      const id = btn?.dataset.placeId
      return id ? pointsRef.current.get(id) : undefined
    }
    const hover = (p: MapPoint | undefined) => {
      if (!p) {
        propsRef.current.onHover(null)
        return
      }
      const pt = map.latLngToContainerPoint([p.lat, p.lon])
      propsRef.current.onHover({ point: p, x: pt.x, y: pt.y })
    }
    let lastZoomAt = 0
    map.on('zoomstart', () => {
      lastZoomAt = Date.now()
    })
    const onClick = (e: MouseEvent) => {
      const p = findPoint(e.target)
      if (!p) return
      // ignore the click of a double-click zoom
      if (Date.now() - lastZoomAt < 300) return
      e.preventDefault()
      e.stopPropagation()
      propsRef.current.onSelect(p)
    }
    const onOver = (e: Event) => {
      const p = findPoint(e.target)
      if (p) hover(p)
    }
    const onOut = (e: Event) => {
      if (findPoint(e.target)) hover(undefined)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hover(undefined)
      if ((e.key === 'Enter' || e.key === ' ') && findPoint(e.target)) {
        // native button activation fires click; nothing extra
      }
    }
    el.addEventListener('click', onClick, true)
    el.addEventListener('mouseover', onOver)
    el.addEventListener('mouseout', onOut)
    el.addEventListener('focusin', onOver)
    el.addEventListener('focusout', onOut)
    el.addEventListener('keydown', onKey)
    map.on('movestart zoomstart', () => propsRef.current.onHover(null))

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
      layerRef.current = null
      markers.clear()
    }
  }, [])

  // Refit when the fit key changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.fitBounds(props.fitBounds, { padding: [24, 24], animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.fitKey])

  // Rebuild markers when the points, the selection, the highlight or the colour mode change.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    const { points, selectedId, highlightId, colourByGenre } = props
    const nMax = points.reduce((m, p) => Math.max(m, p.count), 0)
    const markers = markersRef.current
    const seen = new Set<string>()
    pointsRef.current = new Map(points.map((p) => [p.placeId, p]))
    for (const p of points) {
      seen.add(p.placeId)
      const d = diameter(p, nMax)
      const selected = p.placeId === selectedId
      const highlighted = !selected && p.placeId === highlightId
      const hit = Math.max(24, Math.ceil(d) + 8)
      const icon = L.divIcon({
        className: '',
        html: markerHtml(p, d, colourByGenre, selected, highlighted),
        iconSize: [hit, hit],
        iconAnchor: [hit / 2, hit / 2],
      })
      const existing = markers.get(p.placeId)
      if (existing) {
        existing.setIcon(icon)
        existing.setZIndexOffset(selected ? 1000 : highlighted ? 500 : 0)
      } else {
        const m = L.marker([p.lat, p.lon], { icon, keyboard: false, zIndexOffset: selected ? 1000 : 0, riseOnHover: true })
        m.addTo(layer)
        markers.set(p.placeId, m)
      }
    }
    for (const [id, m] of markers) {
      if (!seen.has(id)) {
        layer.removeLayer(m)
        markers.delete(id)
      }
    }
    // Pan to a highlighted dot only when it is off-screen (MAP-SPEC 3.4).
    if (highlightId) {
      const p = pointsRef.current.get(highlightId)
      if (p && !map.getBounds().contains([p.lat, p.lon])) map.panTo([p.lat, p.lon], { animate: false })
    }
  }, [props])

  return <div className="map-view" ref={containerRef} />
}
