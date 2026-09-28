// CheckboxFacet (FRONTEND-SPEC 7, AC-05): native checkboxes for genre, count 0 disabled unless selected.
import { genreLabel, genreTitle, t } from '../../i18n/en'
import { GENRE_ORDER, type GenreId } from '../../state/query'
import type { Counts } from '../../state/selectors'
import { GenreSwatch } from '../Genre'

export function CheckboxFacet({ counts, selected, onChange }: { counts: Counts; selected: GenreId[]; onChange: (next: GenreId[]) => void }) {
  return (
    <div className="checkbox-facet" role="group" aria-label={t('facet.genre')}>
      {GENRE_ORDER.map((g) => {
        const n = counts.get(g) ?? 0
        const checked = selected.includes(g)
        return (
          <label key={g} className={`checkbox-facet__row${n === 0 && !checked ? ' is-zero' : ''}`} title={genreTitle(g)}>
            <input
              type="checkbox"
              checked={checked}
              disabled={n === 0 && !checked}
              onChange={(e) => onChange(e.target.checked ? [...selected, g] : selected.filter((x) => x !== g))}
            />
            <GenreSwatch genre={g} />
            <span className="checkbox-facet__label">{genreLabel(g)}</span>
            <span className="checkbox-facet__count">{n === 0 ? t('facet.zero') : n.toLocaleString('en')}</span>
          </label>
        )
      })}
    </div>
  )
}
