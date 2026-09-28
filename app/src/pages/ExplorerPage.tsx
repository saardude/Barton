// Explorer (FRONTEND-SPEC 7): filter rail | map | results at >= 1024 px; below that the rail
// collapses into a "Filters (n)" button that opens the FilterSheet, and map and results stack.
// Under 768 px (FRONTEND-SPEC 10, wireframe artboard 4) the same route renders the phone
// explorer: Filters button, then the view chosen by the bottom tabs (Map / Songs / Places).
import { useCallback, useEffect, useState } from 'react'
import { useCatalogReady } from '../app/catalog'
import { useDerived, useQuery } from '../app/query'
import { FilterRail, FilterSheet, PlaceFacet } from '../components/filters/FilterRail'
import { MapAccessibleList, MapPanel } from '../components/map/MapPanel'
import { BottomTabs, panelId, tabId, type PhoneTab } from '../components/phone/BottomTabs'
import { COARSE_POINTER_QUERY, PHONE_QUERY, useMediaQuery } from '../components/phone/useMediaQuery'
import { ResultsPanel } from '../components/ResultsPanel'
import { melodiesOf, t } from '../i18n/en'

export function ExplorerPage() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, search } = useQuery()
  const [highlightPlaceId, setHighlight] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const phone = useMediaQuery(PHONE_QUERY)
  const coarse = useMediaQuery(COARSE_POINTER_QUERY)
  // Phone tab: default list; a deep link with a place set opens on the map (FRONTEND-SPEC 10).
  const [tab, setTab] = useState<PhoneTab>(() => (query.county || query.village ? 'map' : 'list'))
  const showList = useCallback(() => setTab('list'), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  useEffect(() => {
    document.title = t('app.title')
  }, [])

  const activeFilters = derived ? derived.activeChips.length : 0
  const resultCount = derived?.filteredSongs.length ?? 0

  const filtersButton = (
    <button type="button" className="btn filters-toggle" onClick={() => setSheetOpen(true)} disabled={!catalog} aria-haspopup="dialog">
      {t('facet.filtersOpen', { n: activeFilters })}
    </button>
  )
  const sheet = <FilterSheet open={sheetOpen} onClose={closeSheet} resultCount={resultCount} />

  if (phone) {
    return (
      <div className="explorer explorer--phone">
        <div className="phone-header">
          {filtersButton}
          {derived && (
            <span className="phone-header__count mono muted" aria-hidden="true">
              {melodiesOf(resultCount, derived.total)}
            </span>
          )}
        </div>
        <main className="explorer__main">
          {tab === 'map' && (
            <div id={panelId('map')} role="tabpanel" aria-labelledby={tabId('map')} className="phone-panel phone-panel--map">
              <section className="map-section map-section--full" aria-label="Map">
                <MapPanel highlightPlaceId={highlightPlaceId} touchSheet onShowMelodies={showList} />
              </section>
              <button type="button" className="phone-viewlist" onClick={showList}>
                {t('phone.viewList', { n: resultCount })}
              </button>
              <MapAccessibleList />
            </div>
          )}
          {tab === 'list' && (
            <div id={panelId('list')} role="tabpanel" aria-labelledby={tabId('list')} className="phone-panel phone-panel--list">
              <section className="map-section map-section--mini" aria-label="Map">
                <MapPanel highlightPlaceId={highlightPlaceId} touchSheet onShowMelodies={showList} />
              </section>
              <section className="results" aria-label={t('results.label')}>
                <ResultsPanel onHoverPlace={setHighlight} />
              </section>
            </div>
          )}
          {tab === 'places' && (
            <div id={panelId('places')} role="tabpanel" aria-labelledby={tabId('places')} className="phone-panel phone-panel--places">
              <aside className="rail rail--phone" aria-label={t('facet.place')}>
                <PlaceFacet onSelect={showList} />
              </aside>
            </div>
          )}
        </main>
        <BottomTabs tab={tab} onTab={setTab} resultCount={derived ? resultCount : undefined} search={search} />
        {sheet}
      </div>
    )
  }

  return (
    <div className="explorer">
      <FilterRail />
      <main className="explorer__main">
        {filtersButton}
        <section className="map-section" aria-label="Map">
          <MapPanel highlightPlaceId={highlightPlaceId} touchSheet={coarse} onShowMelodies={undefined} />
          <MapAccessibleList />
        </section>
        <section className="results" aria-label={t('results.label')}>
          <ResultsPanel onHoverPlace={setHighlight} />
        </section>
      </main>
      {sheet}
    </div>
  )
}
