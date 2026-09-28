// /journeys (FRONTEND-SPEC 14, wireframe artboard 5): timeline strip, route map with border
// toggle, and the panel (header, stops, context). The URL is the state: trip, stop, date,
// borders (AC-39, AC-40); everything shown comes from the data files.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useDerived, useQuery } from '../app/query'
import { ContextStrip } from '../components/journey/ContextStrip'
import { JourneyAccessibleList } from '../components/journey/JourneyAccessibleList'
import { JourneyHeader } from '../components/journey/JourneyHeader'
import { JourneyMap } from '../components/journey/JourneyMap'
import { JourneyTimeline } from '../components/journey/JourneyTimeline'
import { StopList } from '../components/journey/StopList'
import { buildJourneyView, journeyTitle, type JourneyView } from '../components/journey/journeyView'
import { useContextEvents, useJourneys, useVillages } from '../components/journey/useJourneyData'
import { songDisplayTitle } from '../components/SongRow'
import { SourceLink } from '../components/SourceLink'
import { EmptyState } from '../components/States'
import { melodies, t } from '../i18n/en'
import { bordersDefault, eraForDate, formatIsoDate, journeyDateText, selectTrip, undatedBartokSongs, type Era } from '../state/journeys'
import { FACET_KEYS, type FacetKey } from '../state/selectors'
import type { BordersMode } from '../state/query'

const UNMAPPED_SHOWN = 100

export function JourneysPage() {
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, setQuery, reset, search } = useQuery()
  const journeys = useJourneys()
  const villages = useVillages()
  const events = useContextEvents()
  const [highlightSeq, setHighlightSeq] = useState<number | undefined>(undefined)
  const [showUnmapped, setShowUnmapped] = useState(false)
  const [eraOverride, setEraOverride] = useState<Era | undefined>(undefined)
  const [borderAttributions, setBorderAttributions] = useState<string[]>([])

  const selection = useMemo(() => selectTrip(journeys, { trip: query.trip, date: query.date }), [journeys, query.trip, query.date])

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

  const onSelect = useCallback((id: string | undefined) => setQuery({ trip: id, date: undefined }), [setQuery])
  const onDate = useCallback(
    (date: string) => {
      const sel = selectTrip(journeys, { date })
      if (sel && sel.by === 'date') setQuery({ trip: sel.journey.id, date: undefined })
      else setQuery({ trip: undefined, date })
    },
    [journeys, setQuery],
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

  const nIndex = journeys.filter((j) => j.derivedFrom === 'gyuj-collections').length

  return (
    <div className="journeys">
      <section className="journeys__timeline" aria-label={t('journey.timeline')}>
        <JourneyTimeline
          journeys={journeys}
          events={events.data ?? []}
          selectedId={view?.by === 'trip' ? view.journey.id : undefined}
          date={query.date}
          unmappedCount={undated.length}
          onSelect={onSelect}
          onDate={onDate}
          onUnmapped={() => setShowUnmapped((v) => !v)}
        />
      </section>
      <main className="journeys__body">
        <section className="journeys__map" aria-label={t('journey.mapLabel')}>
          <JourneyMap view={view} borders={borders} era={era} selectedSeq={selectedSeq} highlightSeq={highlightSeq} onStop={onStop} onBorders={onBorders} onEra={onEra} onAttributions={setBorderAttributions} />
          {view && <JourneyAccessibleList view={view} onSelectStop={onStop} />}
        </section>
        <aside className="journeys__panel" id="results" aria-label={t('journey.trip')}>
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
              <JourneyHeader view={view} villages={villages.data} borderAttributions={borderAttributions} onClearFilters={reset} />
              <StopList view={view} query={query} selectedSeq={selectedSeq} onSelect={onStop} onHover={setHighlightSeq} />
              <ContextStrip events={view.events} />
            </>
          ) : (
            <>
              <div className="journey-prompt">
                <p>{t('journey.prompt')}</p>
                <p className="muted">{t('journey.tripsCount', { n: journeys.length, index: nIndex, gap: journeys.length - nIndex })}</p>
              </div>
              <div className="journey-cards">
                {journeys.map((j) => (
                  <button key={j.id} type="button" className="journey-card" onClick={() => onSelect(j.id)} aria-label={`${t('journey.tripCard')}: ${journeyTitle(j)}`}>
                    <div className="journey-card__title">{journeyTitle(j)}</div>
                    <div className="journey-card__meta mono">
                      {journeyDateText(j).text} / {t('journey.hoverStops', { n: j.stops.length })} / {melodies(j.recordCount)}
                      {!j.recordsOnline && ` / ${t('facet.notMapped')}`}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
