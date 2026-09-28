// Border layers shared by the journey map and the explorer map (MAP-SPEC 11.4, AC-40): the
// "then" and "now" GeoJSON sets in their own panes on any Leaflet map, the per-dataset
// attribution taken from each file's `meta.sources`, and the compare mode (clip-path swipe
// or fade) with its draggable divider. No React tree of its own beyond `CompareDivider`.
import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { thenSetFor, type BorderFeatureProps, type BorderFile, type Era } from '../../state/journeys'
import type { BordersMode } from '../../state/query'
import type { CompareMode } from './BorderToggle'
import { useBorderFile } from './useJourneyData'

export const BORDER_PANES = { now: 'pane-borders-now', then: 'pane-borders-then' } as const

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

/** Creates the two border panes once per map (below the route / marker panes). */
export function ensureBorderPanes(map: L.Map): void {
  if (!map.getPane(BORDER_PANES.now)) map.createPane(BORDER_PANES.now).style.zIndex = '410'
  if (!map.getPane(BORDER_PANES.then)) map.createPane(BORDER_PANES.then).style.zIndex = '415'
}

export interface UnderPointer {
  then?: string
  now?: string
}

export interface UseBorderLayersOptions {
  map: L.Map | null
  borders: BordersMode
  era: Era
  compare: number
  compareMode: CompareMode
  onAttributions?: (lines: string[]) => void
}

export interface BorderLayersState {
  /** The historical set drawn, or null in `now` mode. */
  thenSet: Era | null
  unavailable: boolean
  loading: boolean
  /** County under the pointer, then / now names (for the legend line). */
  underPointer: UnderPointer | null
}

export function useBorderLayers({ map, borders, era, compare, compareMode, onAttributions }: UseBorderLayersOptions): BorderLayersState {
  const thenRef = useRef<L.GeoJSON | null>(null)
  const nowRef = useRef<L.GeoJSON | null>(null)
  const attributionsRef = useRef<Set<string>>(new Set())
  const [underPointer, setUnderPointer] = useState<UnderPointer | null>(null)

  const thenSet = thenSetFor(borders, era)
  const nowFile = useBorderFile('now')
  const thenFile = useBorderFile(thenSet ?? era)
  const unavailable = Boolean(nowFile.error && thenFile.error)
  const loading = nowFile.loading || thenFile.loading

  const pointer = useMemo(
    () => ({
      then: (p: BorderFeatureProps) => setUnderPointer((u) => ({ ...u, then: p.name })),
      now: (p: BorderFeatureProps) => setUnderPointer((u) => ({ ...u, now: p.nameRo ?? p.name })),
      clear: () => setUnderPointer(null),
    }),
    [],
  )

  const addAttributions = useCallback(
    (file: BorderFile | null) => {
      if (!map || !file?.meta?.sources) return
      for (const src of file.meta.sources) {
        if (attributionsRef.current.has(src.attribution)) continue
        attributionsRef.current.add(src.attribution)
        map.attributionControl?.addAttribution(`<span title="${esc(src.licence)}">${esc(src.attribution)}</span>`)
      }
      onAttributions?.([...attributionsRef.current])
    },
    [map, onAttributions],
  )

  const buildLayer = useCallback(
    (file: BorderFile, set: Era | 'now'): L.GeoJSON => {
      const isThen = set !== 'now'
      return L.geoJSON(file as unknown as GeoJSON.FeatureCollection, {
        pane: isThen ? BORDER_PANES.then : BORDER_PANES.now,
        style: (f) => {
          const p = (f?.properties ?? {}) as BorderFeatureProps
          const level = p.level === 'county' ? 'county' : 'state'
          return { className: `border-line border-line--${isThen ? 'then' : 'now'} border-line--${level}`, interactive: level === 'county' }
        },
        onEachFeature: (f, layer) => {
          const p = f.properties as BorderFeatureProps
          if (p.level !== 'county') return
          layer.on('mouseover', () => (isThen ? pointer.then(p) : pointer.now(p)))
          layer.on('mouseout', pointer.clear)
        },
      })
    },
    [pointer],
  )

  useEffect(() => {
    if (!map) return
    ensureBorderPanes(map)
  }, [map])

  useEffect(() => {
    if (!map) return
    nowRef.current?.remove()
    nowRef.current = null
    const showNow = borders === 'now' || borders === 'both'
    if (showNow && nowFile.data) {
      ensureBorderPanes(map)
      nowRef.current = buildLayer(nowFile.data, 'now').addTo(map)
      addAttributions(nowFile.data)
    }
    return () => {
      nowRef.current?.remove()
      nowRef.current = null
    }
  }, [map, borders, nowFile.data, buildLayer, addAttributions])

  useEffect(() => {
    if (!map) return
    thenRef.current?.remove()
    thenRef.current = null
    if (thenSet && thenFile.data) {
      ensureBorderPanes(map)
      thenRef.current = buildLayer(thenFile.data, thenSet).addTo(map)
      addAttributions(thenFile.data)
    }
    return () => {
      thenRef.current?.remove()
      thenRef.current = null
    }
  }, [map, thenSet, thenFile.data, buildLayer, addAttributions])

  // Compare: clip the "then" pane left of the divider and the "now" pane right of it (swipe),
  // or set the "then" pane's opacity (fade). Panes move with the map, so the clip polygon is
  // recomputed in pane coordinates on every move / zoom / resize.
  useEffect(() => {
    if (!map) return
    ensureBorderPanes(map)
    const thenPane = map.getPane(BORDER_PANES.then)
    const nowPane = map.getPane(BORDER_PANES.now)
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
  }, [map, borders, compare, compareMode])

  return { thenSet, unavailable, loading, underPointer }
}
