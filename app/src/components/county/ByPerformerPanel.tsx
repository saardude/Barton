// ByPerformerPanel (FRONTEND-SPEC 8): performers with counts, sortable by name / count / village;
// unnamed performers grouped as "Unnamed performer (n)"; a row click sets `q` to the name.
import { t } from '../../i18n/en'
import type { PerformerRow, PerformerSortKey } from '../../state/countyStats'
import { yearSpanText } from '../../state/countyStats'
import { SortHeader, type TableSort } from './VillagesTable'

export function ByPerformerPanel({ rows, sort, onSort, onPick }: { rows: PerformerRow[]; sort: TableSort<PerformerSortKey>; onSort: (s: TableSort<PerformerSortKey>) => void; onPick: (name: string) => void }) {
  return (
    <table className="table performers-table">
      <caption>{t('county.tab.performer')}</caption>
      <thead>
        <tr>
          <SortHeader column="name" label={t('county.col.performer')} sort={sort} onSort={onSort} />
          <th scope="col">{t('county.col.age')}</th>
          <th scope="col">{t('county.col.ethnicity')}</th>
          <SortHeader column="village" label={t('county.col.village')} sort={sort} onSort={onSort} />
          <SortHeader column="count" label={t('county.col.melodies')} sort={sort} onSort={onSort} numeric />
          <th scope="col">{t('county.col.years')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="muted">
              {t('county.noRows')}
            </td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.key}>
            <td>
              {r.name ? (
                <button type="button" className="count-table__pick" aria-label={t('county.performerFilter', { name: r.name })} onClick={() => onPick(r.name as string)}>
                  {r.name}
                </button>
              ) : (
                <span className="muted">{t('county.unnamedPerformer', { n: r.count })}</span>
              )}
            </td>
            <td className="mono">{r.age !== null ? r.age : ''}</td>
            <td>{r.ethnicity ?? ''}</td>
            <td>{r.name ? r.villageLabel : ''}</td>
            <td className="mono is-numeric">{r.count}</td>
            <td className="mono">{yearSpanText(r.yearMin, r.yearMax)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
