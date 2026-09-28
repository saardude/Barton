// MapView (MAP-SPEC 1 to 5): Leaflet 1.9 with CARTO Positron tiles and an OpenStreetMap fallback.
// One marker type per level: county bubbles (count inside when the bubble is large enough) and
// village dots, both accessible <button>s inside divIcon markers. One selected state: filled
// accent with a halo. Provider-independent inputs: MapPoint[].
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { genreLabel, t } from '../../i18n/en'
import { placeText } from '../../state/placeName'
import type { GenreId } from '../../state/query'
import type { MapPoint } from '../../state/selectors'
import { diameter, LABEL_MIN_D } from './markerSize'

export const ROMANIA_BOUNDS: L.LatLngBoundsLiteral = [
  [43.6, 20.2],
  [48.3, 29.7],
]
// Wide enough for every plotted locality (Hungary, Slovakia, Serbia, Ukraine, Croatia too).
const MAX_BOUNDS: L.LatLngBoundsLiteral = [
  [39.5, 12.0],
  [52.5, 36.0],
]

// CARTO raster basemaps need an API key (watermarked without one). The key is public by
// nature (it travels in tile URLs) and is set at build time from VITE_CARTO_KEY.
const CARTO_KEY = (import.meta.env.VITE_CARTO_KEY as string | undefined) ?? ''
const CARTO_URL = CARTO_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
  : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

export const TILE_PROVIDERS = {
  carto: {
    url: CARTO_URL,
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
  /** Fill dots by dominant genre (county page local map); the explorer leaves it off. */
  colourByGenre?: boolean
  /** Bounds to fit; the map refits whenever `fitKey` changes. */
  fitBounds: L.LatLngBoundsLiteral
  fitKey: string
  onSelect: (point: MapPoint) => void
  onHover: (info: HoverInfo | null) => void
  onZoom?: (zoom: number) => void
  onTileFallback?: (provider: TileProvider) => void
  /** Escape pressed while the map has focus (after the hover card is hidden). */
  onEscape?: () => void
  /** Exposes the map for the zoom / reset controls and the border layers. */
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

function markerHtml(p: MapPoint, d: number, colourByGenre: boolean, selected: boolean, highlighted: boolean): string {
  const genre: GenreId | null = colourByGenre ? p.dominantGenre : null
  const fill = colourByGenre ? `var(--genre-${genre ?? 'other'})` : p.level === 'county' ? 'var(--surface)' : 'var(--map-dot)'
  const labelInk = colourByGenre ? 'var(--genre-label-ink)' : 'var(--ink)'
  const cls = ['dot', p.level === 'county' ? 'dot--county' : 'dot--village', selected ? 'dot--selected' : '', highlighted ? 'dot--highlight' : ''].filter(Boolean).join(' ')
  const label = p.level === 'county' && d >= LABEL_MIN_D ? `<span class="dot__label" aria-hidden="true">${p.count}</span>` : ''
  const title = genre ? ` title="${esc(genreLabel(genre))}"` : ''
  return `<button type="button" class="${cls}" data-place-id="${esc(p.placeId)}" aria-label="${esc(pointAriaLabel(p))}" aria-pressed="${selected}" aria-describedby="map-hover-card"${title} style="--d:${d}px;--fill:${fill};--label-ink:${labelInk}">${label}</button>`
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
    // Only the data credits are shown; the library prefix is noise for a first-time reader.
    map.attributionControl.setPrefix(false)
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
    // Guarded: a queued observation must not touch a map that the cleanup has already removed.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => mapRef.current === map && map.invalidateSize()) : null
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
      if (e.key === 'Escape') {
        hover(undefined)
        propsRef.current.onEscape?.()
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
      mapRef.current = null
      layerRef.current = null
      map.stop()
      // Leaflet 1.9 finishes a CSS zoom through a 250 ms setTimeout fallback (_onZoomTransitionEnd)
      // that remove() does not cancel; on a removed map it reads the deleted pane (_leaflet_pos).
      const anim = map as unknown as { _animatingZoom?: boolean; _onZoomTransitionEnd?: () => void }
      anim._animatingZoom = false
      anim._onZoomTransitionEnd = () => {}
      map.remove()
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

  // Rebuild markers only when the points, the selection, the highlight or the colour mode
  // change. Depending on the whole props object here re-created every icon on each parent
  // re-render (a hover state change), which replaced the hovered button, fired mouseout, and
  // flickered the card and the markers.
  const { points, selectedId, highlightId, colourByGenre = false } = props
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    // Sizes are relative within a level (counties and villages can share the map in drill-down).
    let nMaxCounty = 0
    let nMaxVillage = 0
    for (const p of points) {
      if (p.level === 'county') nMaxCounty = Math.max(nMaxCounty, p.count)
      else nMaxVillage = Math.max(nMaxVillage, p.count)
    }
    const markers = markersRef.current
    const seen = new Set<string>()
    pointsRef.current = new Map(points.map((p) => [p.placeId, p]))
    for (const p of points) {
      seen.add(p.placeId)
      const d = diameter(p, p.level === 'county' ? nMaxCounty : nMaxVillage)
      const selected = p.placeId === selectedId || p.selected
      const highlighted = !selected && p.placeId === highlightId
      const hit = Math.max(24, Math.ceil(d) + 8)
      const icon = L.divIcon({
        className: '',
        html: markerHtml(p, d, colourByGenre, selected, highlighted),
        iconSize: [hit, hit],
        iconAnchor: [hit / 2, hit / 2],
      })
      const z = selected ? 1000 : highlighted ? 500 : 0
      const existing = markers.get(p.placeId)
      if (existing) {
        existing.setIcon(icon)
        existing.setZIndexOffset(z)
      } else {
        const m = L.marker([p.lat, p.lon], { icon, keyboard: false, zIndexOffset: z, riseOnHover: true })
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
  }, [points, selectedId, highlightId, colourByGenre])

  // Pan to a highlighted dot only when it is off-screen (MAP-SPEC 3.4).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !highlightId) return
    const p = pointsRef.current.get(highlightId)
    if (p && !map.getBounds().contains([p.lat, p.lon])) map.panTo([p.lat, p.lon], { animate: false })
  }, [highlightId])

  return <div className="map-view" ref={containerRef} />
}
