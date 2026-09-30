// ChipFacet: toggle buttons with aria-pressed inside role="group"; `single` behaves like a radio
// group. Values with count 0 can be hidden; above `limit` values a "Show all" toggle appears.
// Values are ordered by count (then label) when `byCount` is set, so the busiest papers come first.
import { useState } from 'react'
import { t } from '../../i18n/en'
import { enBase } from '../../state/normalize'
import type { Counts } from '../../state/selectors'

export function ChipFacet({ label, values, counts, selected, single, hideZero, byCount, limit = 12, onChange, labelOf }: { label: string; values: string[]; counts: Counts; selected: string[]; single?: boolean; hideZero?: boolean; byCount?: boolean; limit?: number; onChange: (next: string[]) => void; labelOf: (v: string) => string }) {
  const [showAll, setShowAll] = useState(false)
  let visible = hideZero ? values.filter((v) => (counts.get(v) ?? 0) > 0 || selected.includes(v)) : values
  if (byCount) visible = [...visible].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || enBase.compare(labelOf(a), labelOf(b)))
  const total = visible.length
  if (!showAll && total > limit) visible = visible.slice(0, limit)
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
      {total > limit && (
        <button type="button" className="btn btn--link" onClick={() => setShowAll((s) => !s)}>
          {showAll ? t('facet.showFewer') : t('facet.showAll', { n: total })}
        </button>
      )}
    </div>
  )
}
