// TopBar (FRONTEND-SPEC 6): masthead, primary nav, search, colour-by-genre and theme toggles.
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
  const { colourByGenre, setColourByGenre, theme, setTheme } = usePrefs()
  const onExplorer = pathname === '/'
  // Colour by genre only affects the county page (local map dots, timeline stacks); the explorer
  // map is monochrome by design, so the toggle is offered where it does something.
  const onCounty = pathname.startsWith('/county/')
  return (
    <header className="topbar">
      <NavLink className={`topbar__masthead${onExplorer ? ' topbar__masthead--large' : ''}`} to={{ pathname: '/', search }} aria-label={t('app.title')}>
        {t('app.title')}
      </NavLink>
      <nav className="topbar__nav" aria-label="Primary">
        <NavLink to={{ pathname: '/', search }} end>
          {t('nav.explorer')}
        </NavLink>
        <NavLink to={{ pathname: '/journeys', search }}>{t('nav.journeys')}</NavLink>
        <NavLink to={{ pathname: '/about', search }}>{t('nav.about')}</NavLink>
      </nav>
      <div className="topbar__search">
        <SearchInput value={query.q} onChange={(q) => setQuery({ q }, { replace: true })} />
      </div>
      <div className="topbar__tools">
        {onCounty && (
          <button type="button" className="toggle" aria-pressed={colourByGenre} onClick={() => setColourByGenre(!colourByGenre)}>
            {t('colourByGenre')}
          </button>
        )}
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
