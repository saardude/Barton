// CollectorFacet: checkboxes for the collectors, top 8 by count with "Show all (n)", a
// type-to-filter box, and an "(unknown collector)" entry (URL value `none`).
import { useId, useState } from 'react'
import { UNKNOWN_COLLECTOR } from '../../data/collectors'
import { t } from '../../i18n/en'
import { normalize, roBase } from '../../state/normalize'
import type { Counts } from '../../state/selectors'

const TOP = 8

export function collectorLabel(value: string): string {
  return value === UNKNOWN_COLLECTOR ? t('facet.unknownCollector') : value
}

export function CollectorFacet({ values, counts, selected, onChange }: { values: string[]; counts: Counts; selected: string[]; onChange: (next: string[]) => void }) {
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState('')
  const inputId = useId()
  const needle = normalize(filter)
  const all = [...values, UNKNOWN_COLLECTOR]
  const matching = needle ? all.filter((v) => normalize(collectorLabel(v)).includes(needle) || selected.includes(v)) : all
  // by live count, then name; selected entries always stay visible
  const ordered = [...matching].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || roBase.compare(collectorLabel(a), collectorLabel(b)))
  const visible = showAll || needle ? ordered : [...ordered.slice(0, TOP), ...ordered.slice(TOP).filter((v) => selected.includes(v))]
  const hidden = ordered.length - visible.length
  const toggle = (v: string, on: boolean) => onChange(on ? [...selected, v] : selected.filter((x) => x !== v))
  return (
    <div className="checkbox-facet" role="group" aria-label={t('facet.collector')}>
      <label className="visually-hidden" htmlFor={inputId}>
        {t('facet.filterCollectors')}
      </label>
      <input
        id={inputId}
        className="input"
        type="search"
        value={filter}
        placeholder={t('facet.filterCollectors')}
        autoComplete="off"
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: 'var(--space-2)' }}
      />
      {visible.map((v) => {
        const n = counts.get(v) ?? 0
        const checked = selected.includes(v)
        return (
          <label key={v} className={`checkbox-facet__row${n === 0 && !checked ? ' is-zero' : ''}`}>
            <input type="checkbox" checked={checked} disabled={n === 0 && !checked} onChange={(e) => toggle(v, e.target.checked)} />
            <span className="checkbox-facet__label" lang={v === UNKNOWN_COLLECTOR ? undefined : 'hu'}>
              {collectorLabel(v)}
            </span>
            <span className="checkbox-facet__count">{n === 0 ? t('facet.zero') : n.toLocaleString('en')}</span>
          </label>
        )
      })}
      {needle && visible.length === 0 && <p className="muted">{t('facet.noMatch')}</p>}
      {!needle && (hidden > 0 || showAll) && (
        <button type="button" className="btn btn--link" onClick={() => setShowAll((s) => !s)}>
          {showAll ? t('facet.showFewer') : t('facet.showAll', { n: ordered.length })}
        </button>
      )}
    </div>
  )
}
