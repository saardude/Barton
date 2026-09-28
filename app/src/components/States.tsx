// EmptyState, ErrorState, Skeleton (FRONTEND-SPEC 11).
import type { ReactNode } from 'react'
import { t } from '../i18n/en'

export function EmptyState({ title, body, actions }: { title: string; body?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="error-state" role="alert">
      <h2>{t('state.dataErrorTitle')}</h2>
      <p className="muted">{t('state.dataErrorBody')}</p>
      <p className="mono muted">{error.message}</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        {t('state.retry')}
      </button>
    </div>
  )
}

export function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__row" />
      ))}
    </div>
  )
}
