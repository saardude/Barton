// Breadcrumb: <nav aria-label="Breadcrumb">; every ancestor links to the
// Explorer with that place set (and the rest of the Query kept); the last item is the page.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { t } from '../i18n/en'

export interface Crumb {
  key: string
  label: ReactNode
  to?: { pathname: string; search?: string }
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label={t('nav.breadcrumb')}>
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={item.key}>
              {item.to && !last ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              )}
              {!last && (
                <span className="breadcrumb__sep" aria-hidden="true">
                  &rsaquo;
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
