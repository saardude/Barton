// Attribution footer (UI-COPY 12, AC-37): on every route, in the DOM before data loads.
import { Link } from 'react-router'
import { siteName, siteUrl, t } from '../i18n/en'

const SITES = ['fmbc', 'bsys', 'gyuj'] as const

export function Footer() {
  return (
    <footer className="footer">
      <p>
        {t('footer.dataPrefix')}{' '}
        {SITES.map((s, i) => (
          <span key={s}>
            {i > 0 && (i === SITES.length - 1 ? ' and ' : ', ')}
            &quot;
            <a href={siteUrl(s)} target="_blank" rel="noopener noreferrer">
              {siteName(s)}
            </a>
            &quot;
          </span>
        ))}
        .
      </p>
      <p>{t('footer.independent')}</p>
      <p>
        {t('footer.printPrefix')}{' '}
        <Link to="/about#the-printed-edition">{t('footer.printLink')}</Link>
        {t('footer.printSuffix')}
      </p>
      <p>
        Map: &copy;{' '}
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
        <Link to="/about">{t('nav.about')}</Link>
      </p>
    </footer>
  )
}
