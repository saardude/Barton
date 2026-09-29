// TopBar: masthead, primary nav, search and theme select.
import { NavLink, useLocation } from 'react-router'
import { usePrefs, type Theme } from '../app/prefs'
import { useQuery } from '../app/query'
import { t } from '../i18n/en'
import { SearchInput } from './SearchInput'

export function SkipLink() {
  return (
    <a className="skip-link" href="#results">
      {t('app.skipToResults')}
    </a>
  )
}

export function TopBar() {
  const { pathname } = useLocation()
  const { query, setQuery, search } = useQuery()
  const { theme, setTheme } = usePrefs()
  const onExplorer = pathname === '/'
  return (
    <header className="topbar">
      <NavLink className={`topbar__masthead${onExplorer ? ' topbar__masthead--large' : ''}`} to={{ pathname: '/', search }} aria-label={`${t('app.title')}: ${t('app.tagline')}`}>
        <span className="topbar__name">{t('app.title')}</span>
        <span className="topbar__tagline">{t('app.tagline')}</span>
      </NavLink>
      <nav className="topbar__nav" aria-label="Primary">
        <NavLink to={{ pathname: '/', search }} end>
          {t('nav.explorer')}
        </NavLink>
        <NavLink to={{ pathname: '/sources', search }}>{t('nav.sources')}</NavLink>
        <NavLink to={{ pathname: '/about', search }}>{t('nav.about')}</NavLink>
        <a href="/" className="topbar__sibling" title={t('footer.bartok')}>
          {t('nav.bartok')}
        </a>
      </nav>
      <div className="topbar__search">
        <SearchInput value={query.q} onChange={(q) => setQuery({ q }, { replace: true })} />
      </div>
      <div className="topbar__tools">
        <label className="visually-hidden" htmlFor="theme-select">
          {t('theme.label')}
        </label>
        <select id="theme-select" className="select" value={theme} onChange={(e) => setTheme(e.target.value as Theme)} title={t('theme.label')}>
          <option value="auto">{t('theme.auto')}</option>
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
        </select>
      </div>
    </header>
  )
}
