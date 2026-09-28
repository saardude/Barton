// CountyHeader (FRONTEND-SPEC 8): modern and historical county names, region / country line,
// then / now note, mono figures, a 16 px GenreBar, View in explorer, Copy link, Export county JSON.
import { Link } from 'react-router'
import { useToast } from '../../app/toast'
import { t } from '../../i18n/en'
import type { CountyStats } from '../../state/countyStats'
import { yearSpanText } from '../../state/countyStats'
import { countryName } from '../../state/placeName'
import type { Query } from '../../state/query'
import type { Place } from '../../types/place'
import type { Song } from '../../types/song'
import { ExportButton } from '../ExportButton'
import { GenreBar } from '../Genre'
import { PlaceLabel } from '../PlaceLabel'

export function CountyHeader({ county, region, stats, songs, query, search }: { county: Place; region?: Place; stats: CountyStats; songs: Song[]; query: Query; search: string }) {
  const toast = useToast()
  const country = county.country ? countryName(county.country) : null
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast(t('linkCopied'))
    } catch {
      toast(t('copyManual'))
    }
  }
  const thenNow = county.nameHistorical && county.nameHistorical !== county.name ? t('county.thenNow', { then: county.nameHistorical, now: [county.name, country].filter(Boolean).join(', ') }) : null
  return (
    <header className="county-header">
      <h1 className="county-header__title">
        <PlaceLabel place={county} />
      </h1>
      <p className="county-header__path muted">{[region ? region.name : county.region, country].filter(Boolean).join(' / ')}</p>
      {thenNow && <p className="county-header__thennow mono muted">{thenNow}</p>}
      <dl className="county-stats">
        <div>
          <dd className="stats__n">{stats.melodies}</dd>
          <dt className="stats__label">{t('county.stats.melodies')}</dt>
        </div>
        <div>
          <dd className="stats__n">{stats.villages}</dd>
          <dt className="stats__label">{t('county.stats.villages')}</dt>
        </div>
        <div>
          <dd className="stats__n">{stats.performers}</dd>
          <dt className="stats__label">{t('county.stats.performers')}</dt>
        </div>
        <div>
          <dd className="stats__n">{yearSpanText(stats.yearMin, stats.yearMax)}</dd>
          <dt className="stats__label">{t('county.stats.years')}</dt>
        </div>
        <div>
          <dd className="stats__n">{stats.withAudio}</dd>
          <dt className="stats__label">{t('county.stats.audio')}</dt>
        </div>
        <div>
          <dd className="stats__n">{stats.withNotation}</dd>
          <dt className="stats__label">{t('county.stats.notation')}</dt>
        </div>
      </dl>
      <div className="county-header__bar">
        <GenreBar counts={stats.genreCounts} total={stats.melodies} height={16} width={400} />
      </div>
      <div className="county-header__actions">
        <Link className="btn btn--sm" to={{ pathname: '/', search }}>
          {t('nav.viewInExplorer')}
        </Link>
        <button type="button" className="btn btn--sm" onClick={copy}>
          {t('copyLink')}
        </button>
        <ExportButton songs={songs} query={query} small label={t('county.exportCounty')} />
      </div>
    </header>
  )
}
