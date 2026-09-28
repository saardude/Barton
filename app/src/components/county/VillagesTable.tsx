// VillagesTable (FRONTEND-SPEC 8): Village (PlaceLabel), Melodies, Genres (8 px GenreBar), Years;
// sortable header buttons with aria-sort; a row click sets `village` in the Query.
import { t } from '../../i18n/en'
import type { VillageRow, VillageSortKey } from '../../state/countyStats'
import { yearSpanText } from '../../state/countyStats'
import type { SortDir } from '../../state/query'
import { GenreBar } from '../Genre'
import { PlaceLabel } from '../PlaceLabel'

export interface TableSort<K extends string> {
  key: K
  dir: SortDir
}

export function SortHeader<K extends string>({ column, label, sort, onSort, numeric }: { column: K; label: string; sort: TableSort<K>; onSort: (s: TableSort<K>) => void; numeric?: boolean }) {
  const active = sort.key === column
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  return (
    <th scope="col" aria-sort={ariaSort} className={numeric ? 'is-numeric' : undefined}>
      <button
        type="button"
        className="table__sort"
        aria-label={t('sort.column', { column: label })}
        onClick={() => onSort({ key: column, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
      >
        {label}
        <span className="table__sort-mark" aria-hidden="true">
          {active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
        </span>
      </button>
    </th>
  )
}

export function VillagesTable({
  rows,
  sort,
  onSort,
  selectedVillage,
  onSelect,
  countyLabel,
}: {
  rows: VillageRow[]
  sort: TableSort<VillageSortKey>
  onSort: (s: TableSort<VillageSortKey>) => void
  selectedVillage?: string
  onSelect: (id: string) => void
  countyLabel: string
}) {
  return (
    <div className="villages">
      <table className="table villages-table">
        <caption>{t('county.villagesIn', { name: countyLabel, n: rows.length })}</caption>
        <thead>
          <tr>
            <SortHeader column="village" label={t('county.col.village')} sort={sort} onSort={onSort} />
            <SortHeader column="melodies" label={t('county.col.melodies')} sort={sort} onSort={onSort} numeric />
            <th scope="col">{t('county.col.genres')}</th>
            <SortHeader column="years" label={t('county.col.years')} sort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                {t('county.noVillages')}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const selected = row.id === selectedVillage
            const name = row.label
            return (
              <tr key={row.id} className={`villages-table__row${selected ? ' is-selected' : ''}`} aria-selected={selected} data-village-id={row.id} onClick={() => onSelect(row.id)}>
                <td>
                  <button
                    type="button"
                    className="villages-table__pick"
                    aria-pressed={selected}
                    aria-label={selected ? t('county.clearVillage') : t('county.selectVillage', { name })}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(row.id)
                    }}
                  >
                    {row.place ? <PlaceLabel place={row.place} showMarkers /> : <span>{row.label}</span>}
                  </button>
                </td>
                <td className="mono is-numeric">{row.melodies}</td>
                <td className="villages-table__bar">
                  <GenreBar counts={row.genreCounts} total={row.melodies} height={8} width={120} />
                </td>
                <td className="mono">
                  {yearSpanText(row.yearMin, row.yearMax)}
                  {row.unknownYear > 0 && row.yearMin !== undefined && <span className="muted"> +{t('facet.noDate')}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
