// CheckboxFacet: native checkboxes for a small fixed vocabulary (kind); count 0 disabled unless selected.
import { t } from '../../i18n/en'
import type { Counts } from '../../state/selectors'

export function CheckboxFacet({ label, values, counts, selected, onChange, labelOf, swatch }: { label: string; values: string[]; counts: Counts; selected: string[]; onChange: (next: string[]) => void; labelOf: (v: string) => string; swatch?: boolean }) {
  return (
    <div className="checkbox-facet" role="group" aria-label={label}>
      {values.map((v) => {
        const n = counts.get(v) ?? 0
        const checked = selected.includes(v)
        return (
          <label key={v} className={`checkbox-facet__row${n === 0 && !checked ? ' is-zero' : ''}`}>
            <input type="checkbox" checked={checked} disabled={n === 0 && !checked} onChange={(e) => onChange(e.target.checked ? [...selected, v] : selected.filter((x) => x !== v))} />
            {swatch && <span className={`swatch swatch--${v}`} aria-hidden="true" />}
            <span className="checkbox-facet__label">{labelOf(v)}</span>
            <span className="checkbox-facet__count">{n === 0 ? t('facet.zero') : n.toLocaleString('en')}</span>
          </label>
        )
      })}
    </div>
  )
}
