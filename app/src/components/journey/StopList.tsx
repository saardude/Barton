// StopList (FRONTEND-SPEC 14.4, AC-39, AC-41, AC-42): the ordered stops with then -> now names,
// status badge, dates, what was recorded, the records with SourceLinks, "Show melodies" into
// the explorer, and the "Not mapped" section for stops without coordinates (never dropped).
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { genreLabel, instrumentLabel, melodies, t } from '../../i18n/en'
import { stopDateText, type JourneyStop } from '../../state/journeys'
import { applyPatch, DEFAULT_QUERY, type Query } from '../../state/query'
import { toSearch } from '../../state/urlCodec'
import { songDisplayTitle } from '../SongRow'
import { SourceLink } from '../SourceLink'
import { VillageStatusBadge } from './VillageStatusBadge'
import type { JourneyView, StopView } from './journeyView'

const RECORDS_SHOWN = 10

/** `/` with the stop's place and the trip kept (FRONTEND-SPEC 14.5). */
export function explorerSearchForStop(stop: JourneyStop, tripId: string, query: Query): string {
  const base: Query = { ...DEFAULT_QUERY, sort: query.sort, dir: query.dir }
  const q = applyPatch(base, { trip: tripId, village: stop.placeId ?? undefined, country: stop.placeId ? undefined : (stop.country?.toLowerCase() ?? 'all') })
  return toSearch(q)
}

export function ThenNow({ s }: { s: StopView }) {
  const hasNow = s.nameNow && s.nameNow !== s.nameThen
  return (
    <span className="then-now">
      <span lang="hu" className="then-now__then">
        {s.nameThen}
      </span>
      <span className="then-now__year mono"> ({s.year})</span>
      {hasNow && (
        <>
          <span className="then-now__arrow" aria-hidden="true">
            {' '}
            &rarr;{' '}
          </span>
          <span className="visually-hidden">, now </span>
          <span lang="ro" className="then-now__now">
            {s.nameNow}
          </span>
          <span className="then-now__today muted"> (today)</span>
        </>
      )}
    </span>
  )
}

function factsLine(s: StopView): string | null {
  const parts: string[] = []
  if (s.facts.genres.length) parts.push(`${t('journey.genres')}: ${s.facts.genres.slice(0, 3).map(([g, n]) => `${genreLabel(g).split(' / ')[0]} ${n}`).join(', ')}`)
  if (s.facts.ethnicities.length) parts.push(`${t('journey.ethnicities')}: ${s.facts.ethnicities.map(([e, n]) => `${e} ${n}`).join(', ')}`)
  if (s.facts.instruments.length) parts.push(`${t('journey.instruments')}: ${s.facts.instruments.map(([i, n]) => `${instrumentLabel(i)} ${n}`).join(', ')}`)
  return parts.length ? parts.join('; ') : null
}

function RecordsDisclosure({ s, explorerSearch }: { s: StopView; explorerSearch: string }) {
  const songs = s.facts.songs
  if (!songs.length) return null
  const shown = songs.slice(0, RECORDS_SHOWN)
  return (
    <details className="stop-row__records">
      <summary>{t('journey.records', { n: songs.length })}</summary>
      <ul className="stop-row__record-list">
        {shown.map((song) => (
          <li key={song.id} className="stop-row__record">
            <Link to={`/song/${encodeURIComponent(song.id)}`} className="stop-row__record-title">
              {songDisplayTitle(song).text}
            </Link>{' '}
            <SourceLink song={song} size="row" />
          </li>
        ))}
      </ul>
      {songs.length > shown.length && (
        <Link to={{ pathname: '/', search: explorerSearch }} className="stop-row__more">
          {t('journey.recordsMore', { n: songs.length - shown.length })}
        </Link>
      )}
    </details>
  )
}

export interface StopListProps {
  view: JourneyView
  query: Query
  selectedSeq?: number
  onSelect: (seq: number | undefined) => void
  onHover: (seq: number | undefined) => void
}

export function StopList({ view, query, selectedSeq, onSelect, onHover }: StopListProps) {
  const j = view.journey
  const listRef = useRef<HTMLOListElement>(null)

  // Selecting a stop on the map scrolls its row into view (AC-39).
  useEffect(() => {
    if (selectedSeq === undefined) return
    const row = listRef.current?.querySelector<HTMLElement>(`[data-seq="${selectedSeq}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selectedSeq])

  const onKey = (e: KeyboardEvent<HTMLOListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button.stop-row__main') ?? [])
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    e.preventDefault()
    buttons[e.key === 'ArrowDown' ? Math.min(buttons.length - 1, i + 1) : Math.max(0, i - 1)]?.focus()
  }

  const unresolved = view.stops.filter((s) => !s.resolved)
  const cluster = j.kind === 'cluster'

  return (
    <section className="stop-list" aria-labelledby="stops-title">
      <h2 id="stops-title" className="panel-title">
        {t('journey.stops')} <span className="muted">({j.stops.length})</span>
        {cluster && <span className="badge-text"> {t('journey.orderUnknown')}</span>}
      </h2>
      <ol className="stop-list__items" ref={listRef} onKeyDown={onKey}>
        <li className="stop-row stop-row--endpoint">
          <span className="stop-row__num stop-row__num--endpoint" aria-hidden="true">
            D
          </span>
          <div className="stop-row__body">
            <div className="stop-row__name">{j.departure.confidence === 'assumed' ? t('journey.departureAssumed', { name: j.departure.name }) : t('journey.departureLine', { name: j.departure.name })}</div>
            {j.departure.note && <div className="stop-row__meta muted">{j.departure.note}</div>}
          </div>
        </li>
        {view.stops.map((s) => {
          const stop = s.stop
          const selected = selectedSeq === stop.seq
          const dimmed = view.filtersActive && stop.recordCount > 0 && s.matching === 0
          const explorerSearch = explorerSearchForStop(stop, j.id, query)
          const dates = stopDateText(stop)
          const kind = stop.locationConfidence === 'label-region' ? t('journey.regionStop') : stop.locationConfidence === 'label' ? t('journey.labelStop') : null
          const facts = factsLine(s)
          return (
            <li key={stop.seq} className={`stop-row${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}${s.resolved ? '' : ' is-unresolved'}`} data-seq={stop.seq}>
              <button
                type="button"
                className="stop-row__main"
                aria-pressed={selected}
                aria-label={
                  dates
                    ? t('journey.stopLabel', { i: stop.seq, n: j.stops.length, then: s.nameThen, year: s.year, now: s.nameNow ?? s.nameThen, m: stop.recordCount, dates })
                    : t('journey.stopLabelNoDate', { i: stop.seq, n: j.stops.length, then: s.nameThen, now: s.nameNow ?? s.nameThen, m: stop.recordCount })
                }
                disabled={!s.resolved}
                onClick={() => onSelect(selected ? undefined : stop.seq)}
                onMouseEnter={() => onHover(stop.seq)}
                onMouseLeave={() => onHover(undefined)}
                onFocus={() => onHover(stop.seq)}
                onBlur={() => onHover(undefined)}
              >
                <span className="stop-row__num" aria-hidden="true">
                  {stop.seq}
                </span>
                <span className="stop-row__body">
                  <span className="stop-row__name">
                    <ThenNow s={s} />
                  </span>
                  <span className="stop-row__meta">
                    {[stop.county ?? stop.countyHistorical, dates, melodies(stop.recordCount)].filter(Boolean).join(' / ')}
                    {stop.kmFromPrevious !== null && ` / ${Math.round(stop.kmFromPrevious)} km`}
                    {!s.resolved && ` / ${t('journey.stopNoCoords')}`}
                    {kind && ` / ${kind}`}
                    {dimmed && ` / ${t('journey.stopDimmed', { n: stop.recordCount })}`}
                    {!dimmed && view.filtersActive && s.matching < stop.recordCount && ` / ${t('journey.stopMatch', { m: s.matching, n: stop.recordCount })}`}
                  </span>
                </span>
              </button>
              <div className="stop-row__details">
                <VillageStatusBadge status={s.status} />
                {facts && <div className="stop-row__facts">{facts}</div>}
                <RecordsDisclosure s={s} explorerSearch={explorerSearch} />
                {stop.recordCount > 0 && (
                  <Link className="btn btn--sm" to={{ pathname: '/', search: explorerSearch }}>
                    {t('journey.showMelodies')}
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {unresolved.length > 0 && (
        <section className="stop-list__unmapped" aria-labelledby="unmapped-title">
          <h3 id="unmapped-title" className="panel-title">
            {t('journey.notMappedStops', { n: unresolved.length })}
          </h3>
          <p className="muted">{t('journey.unmappedBody')}</p>
          <ul className="stop-list__unmapped-items">
            {unresolved.map((s) => (
              <li key={s.stop.seq}>
                <span className="mono">{s.stop.seq}.</span> <ThenNow s={s} /> <span className="badge-text">{t('journey.unmappedReasonPlace')}</span>
                {s.facts.songs.length > 0 && (
                  <ul className="stop-row__record-list">
                    {s.facts.songs.slice(0, RECORDS_SHOWN).map((song) => (
                      <li key={song.id} className="stop-row__record">
                        <Link to={`/song/${encodeURIComponent(song.id)}`}>{songDisplayTitle(song).text}</Link> <SourceLink song={song} size="row" />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
