// ChipFacet (FRONTEND-SPEC 7, AC-06 to AC-08): toggle buttons with aria-pressed inside role="group";
// `single` behaves like a radio group. Instruments with count 0 are hidden; above 12 values "Show all".
import { useState } from 'react'
import { t } from '../../i18n/en'
import type { Counts } from '../../state/selectors'

export function ChipFacet({
  label,
  values,
  counts,
  selected,
  single,
  hideZero,
  onChange,
  labelOf,
}: {
  label: string
  values: string[]
  counts: Counts
  selected: string[]
  single?: boolean
  hideZero?: boolean
  onChange: (next: string[]) => void
  labelOf: (v: string) => string
}) {
  const [showAll, setShowAll] = useState(false)
  let visible = hideZero ? values.filter((v) => (counts.get(v) ?? 0) > 0 || selected.includes(v)) : values
  const total = visible.length
  if (!showAll && total > 12) visible = visible.slice(0, 12)
  const toggle = (v: string) => {
    const on = selected.includes(v)
    if (single) onChange(on ? [] : [v])
    else onChange(on ? selected.filter((x) => x !== v) : [...selected, v])
  }
  return (
    <div className="chip-facet" role="group" aria-label={label}>
      {visible.map((v) => {
        const n = counts.get(v) ?? 0
        const on = selected.includes(v)
        return (
          <button key={v} type="button" className="chip-facet__chip" aria-pressed={on} disabled={n === 0 && !on} onClick={() => toggle(v)}>
            <span>{labelOf(v)}</span>
            <span className="chip-facet__count">{n === 0 ? t('facet.zero') : n.toLocaleString('en')}</span>
          </button>
        )
      })}
      {total > 12 && (
        <button type="button" className="btn btn--link" onClick={() => setShowAll((s) => !s)}>
          {showAll ? t('facet.showFewer') : t('facet.showAll', { n: total })}
        </button>
      )}
    </div>
  )
}
