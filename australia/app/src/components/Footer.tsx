// Attribution footer: on every route, in the DOM before data loads.
import { Link } from 'react-router'
import { siteName, siteUrl, t } from '../i18n/en'

export function Footer() {
  return (
    <footer className="footer">
      <p>
        Data:{' '}
        <a href={siteUrl('afs')} target="_blank" rel="noopener noreferrer">
          {siteName('afs')}
        </a>
        , a research collection compiled by Mark Gregory, online since 1994.
      </p>
      <p>{t('footer.independent')}</p>
      <p>{t('footer.trove')}</p>
      <p>
        {t('footer.map')}: &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>{' '}
        contributors, &copy;{' '}
        <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">
          CARTO
        </a>
        . {t('map.attributionBounds')}.
      </p>
      <p>
        <Link to="/about">{t('nav.about')}</Link> &middot; <a href="/">{t('nav.bartok')}</a>
      </p>
    </footer>
  )
}
