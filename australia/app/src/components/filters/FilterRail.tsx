// FilterRail: place tree, kind, tune, year, newspaper, songbook, singer, collector, author, Clear all.
// Also used inside the FilterSheet under 1024 px. All controls are disabled while loading.
import { useEffect, useRef, type ReactNode } from 'react'
import { useCatalogReady } from '../../app/catalog'
import { useDerived, useQuery } from '../../app/query'
import { kindLabel, songs, t, tuneLabel } from '../../i18n/en'
import { hasActiveFilters, KIND_ORDER, TUNES, type Kind, type Tune } from '../../state/query'
import { CheckboxFacet } from './CheckboxFacet'
import { ChipFacet } from './ChipFacet'
import { FacetGroup } from './FacetGroup'
import { PlaceTree } from './PlaceTree'
import { YearRange } from './YearRange'

export function FilterRailContent() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, reset } = useQuery()

  if (!catalog || !derived) {
    return (
      <fieldset disabled style={{ border: 0, padding: 0, margin: 0 }} aria-busy="true">
        <FacetGroup id="place" title={t('facet.place')} activeCount={0}>
          <p className="muted">{t('loadingCollection')}</p>
        </FacetGroup>
        <FacetGroup id="year" title={t('facet.year')} activeCount={0}>
          <p className="muted">&nbsp;</p>
        </FacetGroup>
      </fieldset>
    )
  }
  const { index } = catalog
  const c = derived.facetCounts
  const yearActive = (query.yearFrom !== undefined ? 1 : 0) + (query.yearTo !== undefined ? 1 : 0)
  return (
    <>
      <PlaceFacet />
      <FacetGroup id="year" title={t('facet.year')} activeCount={yearActive} onClear={() => setQuery({ yearFrom: undefined, yearTo: undefined })}>
        {index.yearMin !== undefined && index.yearMax !== undefined ? (
          <YearRange min={index.yearMin} max={index.yearMax} from={query.yearFrom} to={query.yearTo} histogram={derived.yearHistogram} onChange={({ from, to }) => setQuery({ yearFrom: from, yearTo: to })} />
        ) : (
          <p className="muted">{t('facet.noDate')}</p>
        )}
      </FacetGroup>
      <FacetGroup id="kind" title={t('facet.kind')} activeCount={query.kind.length} onClear={() => setQuery({ kind: [] })}>
        <CheckboxFacet label={t('facet.kind')} values={KIND_ORDER} counts={c.kind} selected={query.kind} onChange={(kind) => setQuery({ kind: kind as Kind[] })} labelOf={kindLabel} swatch />
      </FacetGroup>
      <FacetGroup id="tune" title={t('facet.tune')} activeCount={query.tune ? 1 : 0} onClear={() => setQuery({ tune: undefined })}>
        <ChipFacet label={t('facet.tune')} values={TUNES} counts={c.tune} selected={query.tune ? [query.tune] : []} single onChange={(v) => setQuery({ tune: v[0] as Tune | undefined })} labelOf={tuneLabel} />
      </FacetGroup>
      <FacetGroup id="paper" title={t('facet.newspaper')} activeCount={query.paper.length} onClear={() => setQuery({ paper: [] })}>
        <ChipFacet label={t('facet.newspaper')} values={index.newspaperKeys} counts={c.paper} selected={query.paper} hideZero byCount onChange={(paper) => setQuery({ paper })} labelOf={index.newspaperTitle} />
      </FacetGroup>
      <FacetGroup id="book" title={t('facet.songbook')} activeCount={query.book.length} onClear={() => setQuery({ book: [] })} defaultOpen={false}>
        <ChipFacet label={t('facet.songbook')} values={index.songbookIds} counts={c.book} selected={query.book} hideZero byCount onChange={(book) => setQuery({ book })} labelOf={index.songbookTitle} />
      </FacetGroup>
      <FacetGroup id="singer" title={t('facet.singer')} activeCount={query.singer.length} onClear={() => setQuery({ singer: [] })} defaultOpen={false}>
        <ChipFacet label={t('facet.singer')} values={index.singers} counts={c.singer} selected={query.singer} hideZero byCount onChange={(singer) => setQuery({ singer })} labelOf={(v) => v} />
      </FacetGroup>
      <FacetGroup id="collector" title={t('facet.collector')} activeCount={query.collector.length} onClear={() => setQuery({ collector: [] })} defaultOpen={false}>
        <ChipFacet label={t('facet.collector')} values={index.collectors} counts={c.collector} selected={query.collector} hideZero byCount onChange={(collector) => setQuery({ collector })} labelOf={(v) => v} />
      </FacetGroup>
      <FacetGroup id="author" title={t('facet.author')} activeCount={query.author.length} onClear={() => setQuery({ author: [] })} defaultOpen={false}>
        <ChipFacet label={t('facet.author')} values={index.authors} counts={c.author} selected={query.author} hideZero byCount onChange={(author) => setQuery({ author })} labelOf={(v) => v} />
      </FacetGroup>
      <div className="rail__clear">
        <button type="button" className="btn" onClick={reset} disabled={!hasActiveFilters(query)}>
          {t('facet.clearAll')}
        </button>
      </div>
    </>
  )
}

/** The Place group alone; also the phone "Places" tab. */
export function PlaceFacet({ onSelect }: { onSelect?: () => void }) {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery } = useQuery()
  if (!catalog || !derived) {
    return (
      <FacetGroup id="place" title={t('facet.place')} activeCount={0}>
        <p className="muted">{t('loadingCollection')}</p>
      </FacetGroup>
    )
  }
  return (
    <FacetGroup id="place" title={t('facet.place')} hint={t('facet.placeHint')} activeCount={query.place ? 1 : 0} onClear={() => setQuery({ place: undefined })}>
      <PlaceTree
        tree={derived.placeTree}
        query={query}
        onSelect={(id) => {
          setQuery({ place: id })
          if (id) onSelect?.()
        }}
      />
    </FacetGroup>
  )
}

export function FilterRail() {
  return (
    <aside className="rail rail--desktop" aria-label={t('facet.filters')}>
      <div className="rail__header">
        <h2>{t('facet.filters')}</h2>
      </div>
      <FilterRailContent />
    </aside>
  )
}

/** Bottom sheet with the same content for narrow viewports. */
export function FilterSheet({ open, onClose, resultCount, children }: { open: boolean; onClose: () => void; resultCount: number; children?: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { reset } = useQuery()
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('select, input, button')?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      opener?.focus()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-label={t('facet.filters')} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="rail__header">
          <h2>{t('facet.filters')}</h2>
          <button type="button" className="btn btn--sm" onClick={onClose} aria-label={t('phone.closeSheet')}>
            &times;
          </button>
        </div>
        {children ?? <FilterRailContent />}
        <div className="sheet__footer">
          <button type="button" className="btn" onClick={reset}>
            {t('facet.clearAll')}
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {resultCount === 1 ? t('phone.showResultsOne') : t('phone.showResults', { n: resultCount })}
          </button>
        </div>
        <span className="visually-hidden" aria-live="polite">
          {songs(resultCount)}
        </span>
      </div>
    </div>
  )
}
