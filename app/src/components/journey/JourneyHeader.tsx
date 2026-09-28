// JourneyHeader (FRONTEND-SPEC 14.4, AC-42): label verbatim, dates to their precision, stops /
// melodies / km, departure line, the "then" polity and "now" country, index link, Romanian
// material flag, the no-records-online state, and the journey export.
import { melodies, t } from '../../i18n/en'
import { buildJourneyExport, journeyDateText, journeyFileName, journeyPolities, type VillageLookup } from '../../state/journeys'
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
  borderAttributions: string[]
  onClearFilters?: () => void
}

export function JourneyHeader({ view, villages, borderAttributions, onClearFilters }: JourneyHeaderProps) {
  const j = view.journey
  const date = journeyDateText(j)
  const unmappedRecords = view.unresolved.reduce((n, s) => n + s.recordCount, 0)
  const polities = journeyPolities(j)
  const rm = j.romanianMaterial
  const rmKey = rm ? (rm.value === true ? (rm.confidence === 'documented' ? 'documented' : 'inferred') : rm.value === false ? 'notRomanian' : 'unknown') : null
  const noMatch = view.filtersActive && view.songs.length > 0 && view.matchingSongs.length === 0
  return (
    <header className="journey-header">
      <div className="journey-header__kind caps-label">
        {j.derivedFrom === 'gyuj-collections' ? t('journey.indexEntry') : t('journey.markerGap')}
        {j.kind === 'cluster' && <span className="badge-text"> {t('journey.approximate')}</span>}
      </div>
      <h1 className="journey-header__title">{journeyTitle(j)}</h1>
      <p className="journey-header__dates">
        <span className="mono">{date.text}</span> <span className="muted">({date.wording})</span>
      </p>
      <p className="journey-header__stats">
        {t('journey.headerStats', { stops: j.stops.length, unmapped: unmappedRecords })}
        {'; '}
        {j.distanceKm !== null ? t('journey.headerMelodies', { n: j.recordCount, km: Math.round(j.distanceKm) }) : t('journey.headerMelodiesNoKm', { n: j.recordCount })}
      </p>
      <p className="journey-header__departure">
        {j.departure.confidence === 'assumed' ? t('journey.departureAssumed', { name: j.departure.name }) : t('journey.departureLine', { name: j.departure.name })}
      </p>
      <dl className="journey-header__polity" title={t('journey.polityNote')}>
        <div>
          <dt>{t('journey.polityThen')}</dt>
          <dd>{polities.then.join(' / ') || t('facet.unknown')}</dd>
        </div>
        <div>
          <dt>{t('journey.polityNow')}</dt>
          <dd>{polities.now.join(' / ') || t('facet.unknown')}</dd>
        </div>
      </dl>
      {!j.recordsOnline && (
        <div className="journey-header__notice">
          <p>{t('journey.noRecordsOnline')}</p>
          {j.labelPlaceRaw && (
            <p>
              <span className="caps-label">{t('journey.placesNamed')}</span> <span lang="hu">{j.labelPlaceRaw}</span>
            </p>
          )}
          {j.nowIn.length > 0 && (
            <p>
              <span className="caps-label">{t('journey.nowIn')}</span> {j.nowIn.map((c) => countryName(c)).join(', ')}
            </p>
          )}
        </div>
      )}
      {j.recordsOnline && j.recordCount === 0 && <p className="journey-header__notice">{t('journey.noRecordsOnline')}</p>}
      {rmKey && <p className={`journey-header__flag journey-header__flag--${rmKey}`}>{t(`journey.romanianMaterial.${rmKey}`)}</p>}
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
