// Stub routes (FRONTEND-SPEC 2): Journeys, About, NotFound. Each renders the shell and the footer.
// County and Song live in CountyPage.tsx and SongPage.tsx.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useQuery } from '../app/query'
import { genreLabels, siteName, siteUrl, t } from '../i18n/en'
import { EmptyState } from '../components/States'

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${t('app.title')}`
  }, [title])
}

export function JourneysPage() {
  useTitle(t('journey.title'))
  const catalog = useCatalogReady()
  return (
    <div className="page">
      <h1>{t('journey.title')}</h1>
      {catalog && catalog.journeys.length === 0 ? <p>{t('journey.noTrips')}</p> : <p>{t('journey.prompt')}</p>}
      {catalog && <p className="muted">{catalog.journeys.length} trips reconstructed from dated records.</p>}
      <p className="muted">{t('state.placeholder')}</p>
    </div>
  )
}

export function AboutPage() {
  useTitle(t('about.title'))
  return (
    <div className="page">
      <h1>{t('about.title')}</h1>
      <h2>What this is</h2>
      <p>{t('app.subtitle')}. A static viewer over Bela Bartok's ethnographic field collection with a focus on localities in present-day Romania: browse by country, region, county and village on a map, filter by genre, style, performance, instrument and year, and open every record on the database that holds it.</p>
      <h2>Sources</h2>
      <ul>
        {(['fmbc', 'bsys', 'gyuj', 'rfm'] as const).map((s) => (
          <li key={s}>
            <a href={siteUrl(s)} target="_blank" rel="noopener noreferrer">
              {siteName(s)}
            </a>
          </li>
        ))}
      </ul>
      <p>{t('footer.institute.en')} / <span lang="ro">{t('footer.institute.ro')}</span> / <span lang="hu">{t('footer.institute.hu')}</span></p>
      <h2>Names of places</h2>
      <p>Places are shown by their modern name first, with the historical (usually Hungarian) name in parentheses in monospace, e.g. Beiuș (Belényes). The historical name is the key that links back to the source databases.</p>
      <h2>Genres</h2>
      <ul>
        {Object.entries(genreLabels).map(([id, g]) => (
          <li key={id}>
            <span lang="ro">{g.ro}</span> / {g.en} / <span lang="hu">{g.hu}</span>
          </li>
        ))}
      </ul>
      <h2>How to cite</h2>
      <p>Cite the original record on zti.hu; every result row and song page links to it.</p>
      <h2>Colophon</h2>
      <p>Fonts: IBM Plex (OFL). Map: Leaflet, CARTO Positron tiles, OpenStreetMap data.</p>
    </div>
  )
}

export function NotFoundPage() {
  useTitle(t('state.notFound'))
  const { search } = useQuery()
  return (
    <div className="page">
      <EmptyState
        title={t('state.notFound')}
        actions={
          <Link className="btn" to={{ pathname: '/', search }}>
            {t('state.backToExplorer')}
          </Link>
        }
      />
    </div>
  )
}
