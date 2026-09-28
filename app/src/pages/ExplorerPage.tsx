// Explorer (FRONTEND-SPEC 7): filter rail | map | results at >= 1024 px; below that the rail
// collapses into a "Filters (n)" button that opens the FilterSheet, and map and results stack.
import { useEffect, useState } from 'react'
import { useCatalogReady } from '../app/catalog'
import { useDerived } from '../app/query'
import { FilterRail, FilterSheet } from '../components/filters/FilterRail'
import { MapAccessibleList, MapPanel } from '../components/map/MapPanel'
import { ResultsPanel } from '../components/ResultsPanel'
import { t } from '../i18n/en'

export function ExplorerPage() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const [highlightPlaceId, setHighlight] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  useEffect(() => {
    document.title = t('app.title')
  }, [])

  const activeFilters = derived ? derived.activeChips.filter((c) => c.key !== 'place' || c.value.split('/').length > 1).length : 0

  return (
    <div className="explorer">
      <FilterRail />
      <main className="explorer__main">
        <button type="button" className="btn filters-toggle" onClick={() => setSheetOpen(true)} disabled={!catalog} aria-haspopup="dialog">
          {t('facet.filtersOpen', { n: activeFilters })}
        </button>
        <section className="map-section" aria-label="Map">
          <MapPanel highlightPlaceId={highlightPlaceId} />
          <MapAccessibleList />
        </section>
        <section className="results" aria-label={t('results.label')}>
          <ResultsPanel onHoverPlace={setHighlight} />
        </section>
      </main>
      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={derived?.filteredSongs.length ?? 0} />
    </div>
  )
}
