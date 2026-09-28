// QueryProvider: URL <-> Query (FRONTEND-SPEC 3, 3.1, D1, D4) and the derived state (section 4).
// The URL is the state: setQuery encodes the patched query and navigates (push by default,
// replace while typing in search); decode runs on every location change.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { MIN_QUERY_LENGTH } from '../data/search'
import { applyPatch, resetQuery, type Query } from '../state/query'
import { derive, type Derived } from '../state/selectors'
import { decodeQuery, toSearch } from '../state/urlCodec'
import { useCatalogReady } from './catalog'

export interface SetQueryOptions {
  /** Use history.replaceState instead of pushState (typing in the search box). */
  replace?: boolean
}

interface QueryContextValue {
  query: Query
  warnings: string[]
  setQuery: (patch: Partial<Query>, opts?: SetQueryOptions) => void
  reset: () => void
  /** `?...` for links that must carry the current query (empty when default). */
  search: string
}

const QueryContext = createContext<QueryContextValue | null>(null)
const DerivedContext = createContext<Derived | null>(null)

export function QueryProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const catalog = useCatalogReady()
  const index = catalog?.index

  const decodeOptions = useMemo(
    () =>
      index
        ? { placeExists: index.placeExists, styles: new Set(index.styles), instruments: new Set(index.instruments) }
        : {},
    [index],
  )
  const decoded = useMemo(() => decodeQuery(location.search, decodeOptions), [location.search, decodeOptions])
  const query = decoded.query
  const search = useMemo(() => toSearch(query), [query])

  const pathname = location.pathname

  const setQuery = useCallback(
    (patch: Partial<Query>, opts?: SetQueryOptions) => {
      const next = applyPatch(query, patch)
      const nextSearch = toSearch(next)
      if (nextSearch === search) return
      navigate({ pathname, search: nextSearch }, { replace: opts?.replace })
    },
    [navigate, pathname, query, search],
  )

  const reset = useCallback(() => {
    const next = resetQuery(query, pathname === '/journeys')
    navigate({ pathname, search: toSearch(next) })
  }, [navigate, pathname, query])

  // Free-text search: ask the search service for ids whenever q changes (the input debounces).
  const [searchState, setSearchState] = useState<{ q: string; ids: string[] | null }>({ q: '', ids: null })
  const q = query.q.trim()
  const qActive = q.length >= MIN_QUERY_LENGTH
  useEffect(() => {
    if (!catalog || !qActive) return
    let cancelled = false
    catalog.search.search(q).then((ids) => {
      if (!cancelled) setSearchState({ q, ids })
    })
    return () => {
      cancelled = true
    }
  }, [catalog, q, qActive])

  const searching = qActive && searchState.q !== q
  const derived = useMemo(() => {
    if (!index) return null
    const searchIds = qActive ? (searchState.q === q ? searchState.ids : []) : null
    return derive({ query, index, searchIds, searching })
  }, [index, query, qActive, q, searchState, searching])

  const value = useMemo<QueryContextValue>(
    () => ({ query, warnings: decoded.warnings, setQuery, reset, search }),
    [query, decoded.warnings, setQuery, reset, search],
  )

  return (
    <QueryContext.Provider value={value}>
      <DerivedContext.Provider value={derived}>{children}</DerivedContext.Provider>
    </QueryContext.Provider>
  )
}

export function useQuery(): QueryContextValue {
  const ctx = useContext(QueryContext)
  if (!ctx) throw new Error('useQuery must be used inside QueryProvider')
  return ctx
}

/** Derived state, or null until the catalogue is ready. */
export function useDerived(): Derived | null {
  return useContext(DerivedContext)
}
