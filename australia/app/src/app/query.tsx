// QueryProvider: URL <-> Query and the derived state. The URL is the state: setQuery encodes the
// patched query and navigates (push by default, replace while typing); decode runs on every
// location change.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { MIN_QUERY_LENGTH } from '../data/search'
import { applyPatch, resetQuery, type Query } from '../state/query'
import { derive, type Derived } from '../state/selectors'
import { decodeQuery, toSearch } from '../state/urlCodec'
import { useCatalogReady } from './catalog'

export interface SetQueryOptions {
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
    () => (index ? { placeExists: index.placeExists, papers: new Set(index.newspaperKeys), books: new Set(index.songbookIds) } : {}),
    [index],
  )
  const decoded = useMemo(() => decodeQuery(location.search, decodeOptions), [location.search, decodeOptions])
  const query = decoded.query
  const search = useMemo(() => toSearch(query), [query])

  const pathname = location.pathname
  const tab = new URLSearchParams(location.search).get('tab')

  const setQuery = useCallback(
    (patch: Partial<Query>, opts?: SetQueryOptions) => {
      const next = applyPatch(query, patch)
      const nextSearch = toSearch(next)
      if (nextSearch === search) return
      const tabPart = tab ? `tab=${encodeURIComponent(tab)}` : ''
      const full = tabPart ? (nextSearch ? `${nextSearch}&${tabPart}` : `?${tabPart}`) : nextSearch
      navigate({ pathname, search: full }, { replace: opts?.replace })
    },
    [navigate, pathname, query, search, tab],
  )

  const reset = useCallback(() => {
    navigate({ pathname, search: toSearch(resetQuery(query)) })
  }, [navigate, pathname, query])

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

  const value = useMemo<QueryContextValue>(() => ({ query, warnings: decoded.warnings, setQuery, reset, search }), [query, decoded.warnings, setQuery, reset, search])

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

export function useDerived(): Derived | null {
  return useContext(DerivedContext)
}
