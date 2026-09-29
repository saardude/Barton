// ResultsPanel: header (count, sort, export, chips), SongList, Pagination.
import { Link } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useDerived, useQuery } from '../app/query'
import { songsOf, t } from '../i18n/en'
import { placeLevelOf, SORT_KEYS, type SortKey } from '../state/query'
import { ActiveFilterChips } from './ActiveFilterChips'
import { ExportButton } from './ExportButton'
import { Pagination } from './Pagination'
import { SongList } from './SongRow'
import { EmptyState, Skeleton } from './States'

export function SortSelect() {
  const { query, setQuery } = useQuery()
  return (
    <div className="sort">
      <label htmlFor="sort-select" className="visually-hidden">
        {t('sort.label')}
      </label>
      <select id="sort-select" className="select" value={query.sort} onChange={(e) => setQuery({ sort: e.target.value as SortKey })}>
        {SORT_KEYS.map((k) => (
          <option key={k} value={k}>
            {t(`sort.${k}`)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn--sm"
        aria-pressed={query.dir === 'desc'}
        aria-label={t('sort.toggleDir')}
        title={query.dir === 'desc' ? t('sort.desc') : t('sort.asc')}
        onClick={() => setQuery({ dir: query.dir === 'desc' ? 'asc' : 'desc' })}
      >
        {query.dir === 'desc' ? '↓' : '↑'}
      </button>
    </div>
  )
}

/** The state page id for the current place filter, if any ('au/nsw' -> 'nsw'). */
export function stateSlugOf(placeId: string | undefined): string | undefined {
  if (!placeId) return undefined
  const parts = placeId.split('/')
  if (parts[0] !== 'au' || parts.length < 2) return undefined
  return parts[1]
}

export function ResultsPanel({ onHoverPlace, hideStateLink }: { onHoverPlace?: (placeId: string | null) => void; hideStateLink?: boolean }) {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, reset, search } = useQuery()

  if (!catalog || !derived) {
    return (
      <div className="results__body" aria-busy="true">
        <div className="results__header">
          <div className="results__count">{t('loadingCollection')}</div>
        </div>
        <Skeleton rows={8} />
      </div>
    )
  }

  const n = derived.filteredSongs.length
  const qActive = query.q.trim().length >= 2
  const stateSlug = query.place && placeLevelOf(query.place) !== 'country' ? stateSlugOf(query.place) : undefined
  return (
    <>
      <div className="results__header">
        <div className="results__count" aria-live="polite" aria-atomic="true">
          {derived.searching ? t('state.loading') : songsOf(n, derived.total)}
        </div>
        <div className="results__controls">
          <SortSelect />
          <ExportButton songs={derived.sortedSongs} query={query} small />
          {stateSlug && !hideStateLink && (
            <Link className="btn btn--sm" to={{ pathname: `/state/${stateSlug}`, search }}>
              {t('nav.openState')}
            </Link>
          )}
        </div>
        <div className="results__chips">
          <ActiveFilterChips chips={derived.activeChips} />
        </div>
      </div>
      {n === 0 && !derived.searching ? (
        <EmptyState
          title={qActive ? t('state.emptySearchTitle', { q: query.q.trim() }) : t('state.emptyTitle')}
          body={qActive ? t('search.hint') : t('state.emptyBody')}
          actions={
            <>
              {qActive && (
                <button type="button" className="btn" onClick={() => setQuery({ q: '' })}>
                  {t('state.clearSearch')}
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={reset}>
                {t('facet.clearAll')}
              </button>
            </>
          }
        />
      ) : (
        <>
          <SongList songs={derived.pagedSongs} index={catalog.index} search={search} onHover={onHoverPlace} />
          <Pagination page={derived.page} pageCount={derived.pageCount} onPage={(page) => setQuery({ page })} />
        </>
      )}
    </>
  )
}
