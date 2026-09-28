// JourneyHeader (FRONTEND-SPEC 14.4, AC-42): the trip's title, then two plain lists, "Known"
// (what the source states: index label, dates and their precision, records) and "Inferred"
// (what the viewer adds: departure, order of visits, straight-line travel, attached records,
// the state at the time), the counts, the curated sources when present, and the export.
import { melodies, t } from '../../i18n/en'
import { buildJourneyExport, formatCitation, journeyDateText, journeyFileName, journeyPolities, journeyQuality, qualityLabel, type CuratedJourney, type VillageLookup } from '../../state/journeys'
import { sortKeys } from '../../app/exportJson'
import { countryName } from '../../state/placeName'
import { journeyTitle, type JourneyView } from './journeyView'

function download(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(sortKeys(data), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface JourneyHeaderProps {
  view: JourneyView
  villages: VillageLookup | null
  curated?: CuratedJourney | null
  borderAttributions: string[]
  onClearFilters?: () => void
}

export function JourneyHeader({ view, villages, curated, borderAttributions, onClearFilters }: JourneyHeaderProps) {
  const j = view.journey
  const date = journeyDateText(j)
  const unmappedRecords = view.unresolved.reduce((n, s) => n + s.recordCount, 0)
  const polities = journeyPolities(j)
  const quality = journeyQuality(j, curated)
  const rm = j.romanianMaterial
  const rmKey = rm ? (rm.value === true ? (rm.confidence === 'documented' ? 'documented' : 'inferred') : rm.value === false ? 'notRomanian' : 'unknown') : null
  const noMatch = view.filtersActive && view.songs.length > 0 && view.matchingSongs.length === 0
  const placesWithRecords = j.stops.filter((s) => s.recordCount > 0).length

  const known: React.ReactNode[] = []
  if (j.derivedFrom === 'gyuj-collections' && j.label) known.push(<span lang="hu">{t('journey.knownIndex', { label: j.label })}</span>)
  known.push(t('journey.knownDates', { text: date.text, wording: date.wording }))
  if (j.recordCount > 0) known.push(t('journey.knownRecords', { n: j.recordCount, v: placesWithRecords }))
  else known.push(t('journey.noRecordsOnline'))
  if (j.recordCount === 0 && j.nowIn.length > 0) known.push(`${t('journey.nowIn')}: ${j.nowIn.map((c) => countryName(c)).join(', ')}`)
  if (curated?.sources?.length) known.push(t('journey.knownCurated'))
  if (rmKey === 'documented') known.push(t('journey.romanianMaterial.documented'))

  const inferred: string[] = []
  if (j.departure.confidence === 'assumed') inferred.push(t('journey.inferredDeparture', { name: j.departure.name }))
  if (j.kind === 'cluster' && j.stops.length > 1) inferred.push(t('journey.inferredOrder'))
  if (j.kind === 'route' && view.legs.length > 0) inferred.push(t('journey.inferredRoute'))
  if (!j.recordsOnline && j.recordCount > 0) inferred.push(t('journey.inferredAttached'))
  if (polities.then.length) inferred.push(t('journey.inferredPolity', { then: polities.then.join(' / ') }))
  if (rmKey && rmKey !== 'documented') inferred.push(t(`journey.romanianMaterial.${rmKey}`))

  return (
    <header className="journey-header">
      <div className="journey-header__kind caps-label">
        <span className="badge-text" title={t(`journey.qualityTitle.${quality}`)}>
          {qualityLabel(quality)}
        </span>{' '}
        {j.derivedFrom === 'gyuj-collections' ? t('journey.indexEntry') : t('journey.markerGap')}
        {j.kind === 'cluster' && <span className="badge-text"> {t('journey.approximate')}</span>}
      </div>
      <h1 className="journey-header__title">{curated?.title ?? journeyTitle(j)}</h1>
      <p className="journey-header__stats">
        {t('journey.headerStats', { stops: j.stops.length, unmapped: unmappedRecords })}
        {'; '}
        {j.distanceKm !== null ? t('journey.headerMelodies', { n: j.recordCount, km: Math.round(j.distanceKm) }) : t('journey.headerMelodiesNoKm', { n: j.recordCount })}
      </p>
      <dl className="journey-header__facts">
        <div>
          <dt>{t('journey.known')}</dt>
          <dd>
            <ul>
              {known.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>{t('journey.inferred')}</dt>
          <dd>
            <ul>{inferred.length ? inferred.map((k) => <li key={k}>{k}</li>) : <li>{t('journey.inferredNone')}</li>}</ul>
          </dd>
        </div>
      </dl>
      {curated?.summary && <p className="journey-header__summary">{curated.summary}</p>}
      {curated?.sources && curated.sources.length > 0 && (
        <div className="journey-header__sources">
          <span className="caps-label">{t('journey.curatedSources')}</span>
          <ul>
            {curated.sources.map((s, i) => (
              <li key={i}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {formatCitation(s)}
                  </a>
                ) : (
                  formatCitation(s)
                )}
                {s.note && <span className="journey-header__source-note"> {s.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {noMatch && (
        <p className="journey-header__notice" role="status">
          {t('journey.noMatch', { n: view.songs.length })}{' '}
          {onClearFilters && (
            <button type="button" className="btn btn--link" onClick={onClearFilters}>
              {t('facet.clearAll')}
            </button>
          )}
        </p>
      )}
      {!noMatch && view.filtersActive && view.matchingSongs.length < view.songs.length && (
        <p className="muted" role="status">
          {t('journey.matchOf', { m: view.matchingSongs.length, n: view.songs.length })}
        </p>
      )}
      <div className="journey-header__actions">
        {j.sourceUrl && (
          <a className="btn btn--sm" href={j.sourceUrl} target="_blank" rel="noopener noreferrer" title={t('journey.openIndex')}>
            {t('journey.openIndex')}
          </a>
        )}
        <button
          type="button"
          className="btn btn--sm"
          aria-label={t('journey.exportAria', { n: view.songs.length })}
          onClick={() => download(journeyFileName(j), buildJourneyExport(j, view.songs, villages, borderAttributions))}
        >
          {t('journey.export')}
        </button>
        <span className="muted mono">{melodies(view.songs.length)}</span>
      </div>
    </header>
  )
}
