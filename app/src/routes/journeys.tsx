// /journeys (FRONTEND-SPEC 14): journeys list (left) | route map with border toggle (centre) |
// panel with the header, the numbered stops and a collapsible context section (right). A
// featured, well-documented trip is open on arrival; the URL carries trip, stop, date and
// borders (AC-39, AC-40). Under 1024 px the list opens as a sheet from a "Journeys" button.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useDerived, useQuery } from '../app/query'
import { ContextStrip } from '../components/journey/ContextStrip'
import { JourneyAccessibleList } from '../components/journey/JourneyAccessibleList'
import { JourneyHeader } from '../components/journey/JourneyHeader'
import { JourneyList } from '../components/journey/JourneyList'
import { JourneyListSheet } from '../components/journey/JourneyListSheet'
import { JourneyMap } from '../components/journey/JourneyMap'
import { StopList } from '../components/journey/StopList'
import { buildJourneyView, journeyTitle, type JourneyView } from '../components/journey/journeyView'
import { useContextEvents, useCuratedJourneys, useJourneys, useVillages } from '../components/journey/useJourneyData'
import { useMediaQuery } from '../components/phone/useMediaQuery'
import { songDisplayTitle } from '../components/SongRow'
import { SourceLink } from '../components/SourceLink'
import { EmptyState } from '../components/States'
import { t } from '../i18n/en'
import { bordersDefault, eraForDate, featuredJourney, formatIsoDate, journeyPlaceTitle, selectTrip, undatedBartokSongs, type Era, type TripSelection } from '../state/journeys'
import { FACET_KEYS, type FacetKey } from '../state/selectors'
import type { BordersMode } from '../state/query'

const UNMAPPED_SHOWN = 100
const NARROW_QUERY = '(max-width: 1023px)'

export function JourneysPage() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, reset, search } = useQuery()
  const journeys = useJourneys()
  const villages = useVillages()
  const events = useContextEvents()
  const curated = useCuratedJourneys()
  const narrow = useMediaQuery(NARROW_QUERY)
  const [highlightSeq, setHighlightSeq] = useState<number | undefined>(undefined)
  const [showUnmapped, setShowUnmapped] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [eraOverride, setEraOverride] = useState<Era | undefined>(undefined)
  const [borderAttributions, setBorderAttributions] = useState<string[]>([])

  // The trip to show: the URL's, else the featured one (a real, documented trip on arrival).
  const featured = useMemo(() => featuredJourney(journeys, curated), [journeys, curated])
  const selection = useMemo<TripSelection | undefined>(() => {
    const sel = selectTrip(journeys, { trip: query.trip, date: query.date })
    if (sel) return sel
    return featured ? { journey: featured, by: 'trip' } : undefined
  }, [journeys, query.trip, query.date, featured])

  // Filters other than the trip and the default country narrow the trip's records (14.2).
  const placeActive = Boolean(query.region || query.county || query.village || (query.country && query.country !== 'ro' && query.country !== 'all'))
  const filtersActive = Boolean(query.q.trim() || query.genre.length || query.style.length || query.performance || query.instrument.length || query.yearFrom !== undefined || query.yearTo !== undefined || query.unmapped || placeActive)
  const matching = useMemo(() => {
    if (!derived || !selection || !filtersActive) return { ids: null, filtersActive }
    const keys = FACET_KEYS.filter((k: FacetKey) => k !== 'journey' && (k !== 'place' || placeActive))
    const ids = new Set<string>()
    for (const id of selection.journey.songIds) {
      const s = catalog?.index.songById.get(id)
      if (s && keys.every((k) => derived.predicates[k](s))) ids.add(id)
    }
    return { ids, filtersActive }
  }, [derived, selection, filtersActive, placeActive, catalog])

  const view: JourneyView | null = useMemo(() => {
    if (!catalog || !selection) return null
    return buildJourneyView(selection, catalog.index, villages.data, events.data, matching)
  }, [catalog, selection, villages.data, events.data, matching])

  useEffect(() => {
    document.title = `${view ? `${journeyTitle(view.journey)} | ` : ''}${t('journey.title')} | ${t('app.title')}`
  }, [view])

  const era: Era = eraOverride ?? (view ? view.era : eraForDate(query.date))
  const borders: BordersMode = query.borders ?? (view ? view.bordersDefault : bordersDefault({ date: query.date }))
  const selectedSeq = view && query.stop !== undefined && view.journey.stops.some((s) => s.seq === query.stop) ? query.stop : undefined

  const undated = useMemo(() => (catalog ? undatedBartokSongs(catalog.songs) : []), [catalog])

  const onSelect = useCallback(
    (id: string) => {
      setListOpen(false)
      setQuery({ trip: id, date: undefined })
    },
    [setQuery],
  )
  const onStop = useCallback((seq: number | undefined) => setQuery({ stop: seq }), [setQuery])
  const onBorders = useCallback(
    (mode: BordersMode) => {
      if (mode !== 'now' && mode !== 'both') setEraOverride(mode)
      setQuery({ borders: mode })
    },
    [setQuery],
  )
  const onEra = useCallback(
    (e: Era) => {
      setEraOverride(e)
      if (borders !== 'both' && borders !== 'now') setQuery({ borders: e })
    },
    [borders, setQuery],
  )
  const closeList = useCallback(() => setListOpen(false), [])

  if (!catalog) return <div className="page">{t('loadingCollection')}</div>
  if (journeys.length === 0) {
    return (
      <div className="page">
        <EmptyState
          title={t('journey.noTrips')}
          actions={
            <Link className="btn" to={{ pathname: '/', search }}>
              {t('state.backToExplorer')}
            </Link>
          }
        />
      </div>
    )
  }

  const selectedId = view?.journey.id
  const listFooter =
    undated.length > 0 ? (
      <button type="button" className="btn btn--link journey-list__undated" aria-pressed={showUnmapped} onClick={() => setShowUnmapped((v) => !v)}>
        {t('journey.undatedRecords', { n: undated.length })}
      </button>
    ) : null
  const list = (compact: boolean) => <JourneyList journeys={journeys} curated={curated} selectedId={selectedId} featuredId={featured?.id} onSelect={onSelect} compactStrip={compact} footer={listFooter} />

  return (
    <div className="journeys">
      <main className="journeys__body">
        {!narrow && (
          <aside className="journeys__list" aria-label={t('journey.list')}>
            {list(false)}
          </aside>
        )}
        <section className="journeys__map" aria-label={t('journey.mapLabel')}>
          {narrow && (
            <div className="journeys__bar">
              <button type="button" className="btn" onClick={() => setListOpen(true)} aria-haspopup="dialog">
                {t('journey.openList')} ({journeys.length})
              </button>
              {view && (
                <span className="journeys__bar-title" title={journeyTitle(view.journey)}>
                  {journeyPlaceTitle(view.journey)}, {formatIsoDate(view.journey.dateStart)}
                </span>
              )}
            </div>
          )}
          <JourneyMap view={view} borders={borders} era={era} selectedSeq={selectedSeq} highlightSeq={highlightSeq} onStop={onStop} onBorders={onBorders} onEra={onEra} onAttributions={setBorderAttributions} />
          {view && <JourneyAccessibleList view={view} onSelectStop={onStop} />}
        </section>
        <aside className="journeys__panel" id="results" aria-label={t('journey.trip')}>
          {view ? (
            <>
              {view.by === 'nearest' && view.date && (
                <p className="journey-prompt" role="status">
                  {t('journey.noTripOnDate', { date: formatIsoDate(view.date), label: journeyTitle(view.journey), from: formatIsoDate(view.journey.dateStart) })}{' '}
                  <button type="button" className="btn btn--link" onClick={() => onSelect(view.journey.id)}>
                    {t('journey.tripCard')}
                  </button>
                </p>
              )}
              <JourneyHeader view={view} villages={villages.data} curated={curated.get(view.journey.id)} borderAttributions={borderAttributions} onClearFilters={reset} />
              <StopList view={view} query={query} selectedSeq={selectedSeq} onSelect={onStop} onHover={setHighlightSeq} />
              <details className="context-section">
                <summary className="panel-title context-section__summary">{t('journey.contextSection', { n: view.events.length })}</summary>
                <ContextStrip events={view.events} headless />
              </details>
            </>
          ) : (
            <p className="journey-prompt">{t('journey.prompt')}</p>
          )}
          {showUnmapped && (
            <section className="journey-unmapped" aria-labelledby="journey-unmapped-title">
              <h2 id="journey-unmapped-title" className="panel-title">
                {t('journey.unmappedTitle', { n: undated.length })}
              </h2>
              <p className="muted">{t('journey.unmappedTimeline')}</p>
              <ul>
                {undated.slice(0, UNMAPPED_SHOWN).map((s) => (
                  <li key={s.id} className="stop-row__record">
                    <Link to={`/song/${encodeURIComponent(s.id)}`}>{songDisplayTitle(s).text}</Link> <span className="badge-text">{t('journey.unmappedReasonDate')}</span> <SourceLink song={s} size="row" />
                  </li>
                ))}
              </ul>
              {undated.length > UNMAPPED_SHOWN && <p className="muted">{t('journey.recordsMore', { n: undated.length - UNMAPPED_SHOWN })}</p>}
            </section>
          )}
        </aside>
      </main>
      {narrow && (
        <JourneyListSheet open={listOpen} onClose={closeList}>
          {list(true)}
        </JourneyListSheet>
      )}
    </div>
  )
}
