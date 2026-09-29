// State drill-down: header with counts, then tabs: Songs (the explorer list scoped to the state),
// Towns (sortable table), Newspapers (sortable table), Timeline (songs per decade).
import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useDerived, useQuery } from '../app/query'
import { songs as songsLabel, t } from '../i18n/en'
import { Breadcrumb, type Crumb } from '../components/Breadcrumb'
import { ResultsPanel } from '../components/ResultsPanel'
import { EmptyState, Skeleton } from '../components/States'
import { Tabstrip, tabPanelProps } from '../components/Tabstrip'
import { applyPatch } from '../state/query'
import { readTab, withTab } from '../state/tabParam'
import { toSearch } from '../state/urlCodec'
import type { Song } from '../types/song'

const TABS = ['songs', 'towns', 'papers', 'timeline'] as const
type StateTab = (typeof TABS)[number]

export function decadeCounts(songs: Song[]): { decade: string; count: number }[] {
  const m = new Map<string, number>()
  for (const s of songs) if (s.year.decade) m.set(s.year.decade, (m.get(s.year.decade) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([decade, count]) => ({ decade, count }))
}

export function StatePage() {
  const { stateSlug = '' } = useParams()
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, search } = useQuery()
  const location = useLocation()
  const navigate = useNavigate()
  const stateId = `au/${stateSlug}`
  const node = catalog?.index.placeById.get(stateId)
  const tab = readTab(location.search, TABS, 'songs')

  useEffect(() => {
    document.title = `${node ? node.name : t('state.notFound')} · ${t('app.titleSuffix')}`
  }, [node])

  // The page is scoped to its state: a URL without the place (or with another) is corrected.
  useEffect(() => {
    if (!catalog || !node) return
    const inState = query.place === stateId || (query.place?.startsWith(stateId + '/') ?? false)
    if (!inState) setQuery({ place: stateId }, { replace: true })
  }, [catalog, node, query.place, stateId, setQuery])

  const inState = useMemo(() => (catalog && node ? catalog.index.songsUnder(stateId) : []), [catalog, node, stateId])
  const filtered = useMemo(() => (derived ? derived.filteredSongs.filter((s) => s.location.placeId === stateId || s.location.placeId?.startsWith(stateId + '/')) : []), [derived, stateId])

  if (!catalog || !derived) {
    return (
      <main className="county-page" aria-busy="true">
        <Skeleton rows={8} />
      </main>
    )
  }
  if (!node) {
    return (
      <main className="county-page">
        <EmptyState
          title={t('state.stateNotFound', { id: stateSlug })}
          actions={
            <Link className="btn" to={{ pathname: '/', search }}>
              {t('state.backToExplorer')}
            </Link>
          }
        />
      </main>
    )
  }

  const towns = catalog.index.childrenOf(stateId).map((p) => ({ place: p, count: filtered.filter((s) => s.location.placeId === p.id).length, total: p.counts.total }))
  const papers = new Map<string, { title: string; key: string; count: number; min: number | null; max: number | null }>()
  for (const s of filtered) {
    const n = s.provenance.newspaper
    if (!n) continue
    const e = papers.get(n.key) ?? { title: n.title, key: n.key, count: 0, min: null, max: null }
    e.count++
    if (n.date) {
      e.min = e.min === null ? n.date.year : Math.min(e.min, n.date.year)
      e.max = e.max === null ? n.date.year : Math.max(e.max, n.date.year)
    }
    papers.set(n.key, e)
  }
  const paperRows = [...papers.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
  const decades = decadeCounts(filtered)
  const maxDecade = Math.max(1, ...decades.map((d) => d.count))
  const setTab = (next: StateTab) => navigate({ pathname: location.pathname, search: withTab(search, next, 'songs') }, { replace: true })
  const crumbs: Crumb[] = [
    { key: 'au', label: 'Australia', to: { pathname: '/', search: toSearch(applyPatch(query, { place: 'au' })) } },
    { key: stateId, label: node.name },
  ]

  return (
    <main className="county-page">
      <Breadcrumb items={crumbs} />
      <header className="county-header">
        <h1>{node.name}</h1>
        <p className="county-header__counts mono muted">
          {songsLabel(filtered.length)} {filtered.length !== inState.length && `(${t('results.countOf', { n: filtered.length, m: inState.length })})`}
          {node.years.min !== null && ` · ${node.years.min}-${node.years.max}`}
        </p>
        <p>
          <Link className="btn btn--sm" to={{ pathname: '/', search: toSearch(applyPatch(query, { place: stateId })) }}>
            {t('statePage.viewInExplorer')}
          </Link>
        </p>
      </header>
      <Tabstrip
        idPrefix="state"
        label={t('statePage.title', { name: node.name })}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'songs', label: t('statePage.tab.songs') },
          { id: 'towns', label: t('statePage.tab.towns') },
          { id: 'papers', label: t('statePage.tab.papers') },
          { id: 'timeline', label: t('statePage.tab.timeline') },
        ]}
      />
      {tab === 'songs' && (
        <section className="results county-results" {...tabPanelProps('state', 'songs')}>
          <ResultsPanel hideStateLink />
        </section>
      )}
      {tab === 'towns' && (
        <section {...tabPanelProps('state', 'towns')}>
          <table className="county-table">
            <thead>
              <tr>
                <th scope="col">{t('statePage.town')}</th>
                <th scope="col" className="num">
                  {t('statePage.count')}
                </th>
                <th scope="col">{t('statePage.years')}</th>
              </tr>
            </thead>
            <tbody>
              {towns.map(({ place, count }) => (
                <tr key={place.id}>
                  <th scope="row">
                    <Link to={{ pathname: '/', search: toSearch(applyPatch(query, { place: place.id })) }}>{place.name}</Link>
                  </th>
                  <td className="num mono">{count}</td>
                  <td className="mono">{place.years.min !== null ? `${place.years.min}-${place.years.max}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {tab === 'papers' && (
        <section {...tabPanelProps('state', 'papers')}>
          {paperRows.length ? (
            <table className="county-table">
              <thead>
                <tr>
                  <th scope="col">{t('statePage.paper')}</th>
                  <th scope="col" className="num">
                    {t('statePage.count')}
                  </th>
                  <th scope="col">{t('statePage.years')}</th>
                </tr>
              </thead>
              <tbody>
                {paperRows.map((p) => (
                  <tr key={p.key}>
                    <th scope="row">
                      <Link to={{ pathname: '/', search: toSearch(applyPatch(query, { paper: [p.key] })) }}>{p.title}</Link>
                    </th>
                    <td className="num mono">{p.count}</td>
                    <td className="mono">{p.min !== null ? (p.min === p.max ? String(p.min) : `${p.min}-${p.max}`) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">{t('statePage.noPapers')}</p>
          )}
        </section>
      )}
      {tab === 'timeline' && (
        <section {...tabPanelProps('state', 'timeline')}>
          <table className="county-table timeline-table" aria-label={t('statePage.timelineLabel')}>
            <tbody>
              {decades.map((d) => (
                <tr key={d.decade}>
                  <th scope="row" className="mono">
                    {d.decade}
                  </th>
                  <td>
                    <span className="timeline-bar" style={{ width: `${(d.count / maxDecade) * 100}%` }} aria-hidden="true" />
                  </td>
                  <td className="num mono">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}
