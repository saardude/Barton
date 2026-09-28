// FacetGroup (FRONTEND-SPEC 7): a disclosure with an uppercase mono heading, ro / hu hint,
// active-count badge and a "Clear" link when something is active.
import { useState, type ReactNode } from 'react'
import { facetHints, roHu, t } from '../../i18n/en'

export function FacetGroup({
  id,
  title,
  activeCount,
  onClear,
  defaultOpen = true,
  children,
}: {
  id: string
  title: string
  activeCount: number
  onClear?: () => void
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hint = roHu(facetHints[id])
  return (
    <details className="facet-group" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="facet-group__summary caps-label" aria-controls={`facet-${id}`}>
        <span className="facet-group__title">
          {title}
          {hint && <span className="facet-group__hint">{hint}</span>}
        </span>
        {activeCount > 0 && <span className="facet-group__badge">{t('facet.activeCount', { n: activeCount })}</span>}
      </summary>
      <div className="facet-group__body" id={`facet-${id}`}>
        {children}
        {activeCount > 0 && onClear && (
          <button type="button" className="btn btn--link facet-group__clear" onClick={onClear}>
            {t('facet.clear')}
          </button>
        )}
      </div>
    </details>
  )
}
