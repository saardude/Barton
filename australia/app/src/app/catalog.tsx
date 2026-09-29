// CatalogProvider / useCatalog: loads the content-hashed JSON files once, builds the index and
// the search service, exposes status + retry.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildIndex, type CatalogIndex } from '../data/catalogIndex'
import { createSearchService, type SearchService } from '../data/search'
import { manifest } from './manifest'
import type { Facets } from '../types/facets'
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import type { Sources } from '../types/sources'

export interface CatalogReady {
  status: 'ready'
  songs: Song[]
  places: Place[]
  facets: Facets
  sources: Sources
  index: CatalogIndex
  search: SearchService
}

export type CatalogState = { status: 'loading' } | { status: 'error'; error: Error } | CatalogReady

interface CatalogContextValue {
  state: CatalogState
  retry: () => void
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

async function fetchJson<T>(url: string | undefined, name: string): Promise<T> {
  if (!url) throw new Error(`data file "${name}" is not in the manifest`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} for ${url}`)
  return (await res.json()) as T
}

async function loadCatalog(): Promise<Omit<CatalogReady, 'status' | 'search'>> {
  const [songs, places, facets, sources] = await Promise.all([
    fetchJson<Song[]>(manifest.songs, 'songs'),
    fetchJson<Place[]>(manifest.places, 'places'),
    fetchJson<Facets>(manifest.facets, 'facets'),
    fetchJson<Sources>(manifest.sources, 'sources'),
  ])
  if (!Array.isArray(songs)) throw new Error('songs: not an array')
  const index = buildIndex(songs, places, sources)
  return { songs, places, facets, sources, index }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const searchRef = useRef<SearchService | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((loaded) => {
        if (cancelled) return
        searchRef.current?.dispose()
        const search = createSearchService(loaded.songs)
        searchRef.current = search
        setState({ status: 'ready', search, ...loaded })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('catalog: load failed', { message: error.message, attempt })
        setState({ status: 'error', error })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => () => searchRef.current?.dispose(), [])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])
  const value = useMemo(() => ({ state, retry }), [state, retry])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider')
  return ctx
}

export function useCatalogReady(): CatalogReady | null {
  const { state } = useCatalog()
  return state.status === 'ready' ? state : null
}
