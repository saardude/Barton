// County drill-down (FRONTEND-SPEC 8, wireframe artboard 2): breadcrumb, header with stats,
// villages table, tabs (Melodies | By genre | By performer | Timeline | Local map). The active
// non-place filters apply; the county is added to the Query when absent so the Explorer link
// and the results panel agree.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { usePrefs } from '../app/prefs'
import { useDerived, useQuery } from '../app/query'
import { t } from '../i18n/en'
import { ActiveFilterChips } from '../components/ActiveFilterChips'
import { Breadcrumb, type Crumb } from '../components/Breadcrumb'
import { ResultsPanel } from '../components/ResultsPanel'
import { EmptyState, Skeleton } from '../components/States'
import { Tabstrip, tabPanelProps } from '../components/Tabstrip'
import { ByGenrePanel } from '../components/county/ByGenrePanel'
import { ByPerformerPanel } from '../components/county/ByPerformerPanel'
import { CountyHeader } from '../components/county/CountyHeader'
import { LocalMapPanel } from '../components/county/LocalMapPanel'
import { TimelinePanel } from '../components/county/TimelinePanel'
import { VillagesTable, type TableSort } from '../components/county/VillagesTable'
import { countyStats, genreRows, performerRows, sortPerformerRows, sortVillageRows, styleRows, timeline, villageRows, type PerformerSortKey, type VillageSortKey } from '../state/countyStats'
import { placeText } from '../state/placeName'
import { applyPatch } from '../state/query'
import { filterSongs } from '../state/selectors'
import { sortSongs } from '../state/sort'
import { readTab, withTab } from '../state/tabParam'
import { toSearch } from '../state/urlCodec'

const TABS = ['melodies', 'genre', 'performer', 'timeline', 'map'] as const
type CountyTab = (typeof TABS)[number]

export function CountyPage() {
  const params = useParams()
  const countyId = params['*'] ?? ''
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, search } = useQuery()
  const { colourByGenre } = usePrefs()
  const location = useLocation()
  const navigate = useNavigate()
  const tab = readTab(location.search, TABS, 'melodies')
  const tabsRef = useRef<HTMLDivElement>(null)
  const [villageSort, setVillageSort] = useState<TableSort<VillageSortKey>>({ key: 'village', dir: 'asc' })
  const [performerSort, setPerformerSort] = useState<TableSort<PerformerSortKey>>({ key: 'count', dir: 'desc' })

  const county = catalog?.index.placeById.get(countyId)
  const valid = Boolean(county && county.type === 'county')
  const title = county && valid ? placeText(county, county.id) : t('state.notFound')
  useEffect(() => {
    document.title = valid ? `${title} · ${t('app.titleSuffix')}` : t('state.notFound')
  }, [title, valid])

  // The county page adds `county` to the Query if it is absent (FRONTEND-SPEC 2).
  const inCounty = query.county === countyId || Boolean(query.village && query.village.startsWith(countyId + '/'))
  useEffect(() => {
    if (valid && !inCounty) setQuery({ county: countyId }, { replace: true })
  }, [valid, inCounty, countyId, setQuery])

  // Whole county under the active non-place filters (the villages table and the header), and the
  // narrowed set (village if selected) for the tab panels.
  const countySongs = useMemo(() => (catalog && derived ? filterSongs(catalog.index.songsUnder(countyId), derived.predicates, 'place') : []), [catalog, derived, countyId])
  const panelSongs = useMemo(() => (derived && inCounty ? derived.filteredSongs : countySongs), [derived, inCounty, countySongs])
  const rows = useMemo(() => (catalog ? sortVillageRows(villageRows(countySongs, catalog.index, countyId), villageSort.key, villageSort.dir) : []), [catalog, countySongs, countyId, villageSort])
  const stats = useMemo(() => countyStats(countySongs, rows), [countySongs, rows])
  const exportSongs = useMemo(() => (catalog ? sortSongs(countySongs, query.sort, query.dir, (id) => catalog.index.placeById.get(id)) : []), [catalog, countySongs, query.sort, query.dir])
  const performers = useMemo(() => (catalog ? sortPerformerRows(performerRows(panelSongs, catalog.index), performerSort.key, performerSort.dir) : []), [catalog, panelSongs, performerSort])
  const years = useMemo(() => timeline(panelSongs), [panelSongs])

  if (!catalog || !derived) {
    return (
      <main className="county-page" aria-busy="true">
        <p className="muted">{t('loadingCollection')}</p>
        <Skeleton rows={8} />
      </main>
    )
  }
  if (!county || !valid) {
    return (
      <main className="county-page">
        <EmptyState
          title={t('state.countyNotFound', { id: countyId })}
          actions={
            <Link className="btn" to={{ pathname: '/', search }}>
              {t('state.backToExplorer')}
            </Link>
          }
        />
      </main>
    )
  }

  const index = catalog.index
  const region = county.parent ? index.placeById.get(county.parent) : undefined
  const country = region?.parent ? index.placeById.get(region.parent) : undefined
  const crumbs: Crumb[] = []
  if (country) crumbs.push({ key: 'country', label: placeText(country, country.id), to: { pathname: '/', search: toSearch(applyPatch(query, { country: country.id })) } })
  if (region) crumbs.push({ key: 'region', label: placeText(region, region.id), to: { pathname: '/', search: toSearch(applyPatch(query, { region: region.id })) } })
  crumbs.push({ key: 'county', label: title })

  const setTab = (next: CountyTab) => navigate({ pathname: location.pathname, search: withTab(search, next, 'melodies') })
  const selectVillage = (id: string) => {
    setQuery({ village: id === query.village ? undefined : id })
    window.requestAnimationFrame(() => tabsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }))
  }
  const chips = derived.activeChips.filter((c) => c.key !== 'country' && (c.key !== 'place' || c.value.split('/').length > 3))
  const tabs = TABS.map((id) => ({ id, label: t(`county.tab.${id}`) }))

  return (
    <main className="county-page">
      <Breadcrumb items={crumbs} />
      <CountyHeader county={county} region={region} stats={stats} songs={exportSongs} query={query} search={search} />
      {chips.length > 0 && (
        <div className="county-filters">
          <ActiveFilterChips chips={chips} hideCountry />
          <p className="muted county-filters__note">{t('county.filteredNote')}</p>
        </div>
      )}
      <VillagesTable rows={rows} sort={villageSort} onSort={setVillageSort} selectedVillage={query.village} onSelect={selectVillage} countyLabel={county.name} />
      <div ref={tabsRef} className="county-tabs">
        <Tabstrip idPrefix="county" label={title} active={tab} onChange={setTab} tabs={tabs} />
        {tab === 'melodies' && (
          <section className="county-panel results" {...tabPanelProps('county', 'melodies')} aria-label={t('results.label')}>
            {inCounty ? <ResultsPanel hideCountyLink /> : <Skeleton rows={8} />}
          </section>
        )}
        {tab === 'genre' && (
          <section className="county-panel" {...tabPanelProps('county', 'genre')}>
            <ByGenrePanel genres={genreRows(panelSongs)} styles={styleRows(panelSongs)} total={panelSongs.length} query={query} setQuery={setQuery} />
          </section>
        )}
        {tab === 'performer' && (
          <section className="county-panel" {...tabPanelProps('county', 'performer')}>
            <ByPerformerPanel rows={performers} sort={performerSort} onSort={setPerformerSort} onPick={(name) => setQuery({ q: name })} />
          </section>
        )}
        {tab === 'timeline' && (
          <section className="county-panel" {...tabPanelProps('county', 'timeline')}>
            <TimelinePanel timeline={years} colourByGenre={colourByGenre} selectedYear={query.yearFrom !== undefined && query.yearFrom === query.yearTo ? query.yearFrom : undefined} onPickYear={(year) => setQuery({ yearFrom: year, yearTo: year })} />
          </section>
        )}
        {tab === 'map' && (
          <section className="county-panel" {...tabPanelProps('county', 'map')}>
            <LocalMapPanel county={county} songs={countySongs} index={index} selectedVillage={query.village} colourByGenre={colourByGenre} onSelect={selectVillage} />
          </section>
        )}
      </div>
    </main>
  )
}
