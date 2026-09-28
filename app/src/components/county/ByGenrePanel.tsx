// ByGenrePanel (FRONTEND-SPEC 8): counts per genre and per style with bars scaled to the max;
// clicking a row toggles that value in the Query.
import { genreLabel, genreTitle, styleLabel, t } from '../../i18n/en'
import type { GenreRow, StyleRow } from '../../state/countyStats'
import type { GenreId, Query } from '../../state/query'
import { GenreSwatch } from '../Genre'

function pct(n: number, total: number): string {
  return total ? String(Math.round((n / total) * 100)) : '0'
}

function Bar({ n, max, genre }: { n: number; max: number; genre?: GenreId | null }) {
  const w = max ? (n / max) * 100 : 0
  return (
    <svg className="count-bar" width="100%" height="10" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width={w} height="10" fill={genre === undefined ? 'var(--ink-2)' : genre === null || genre === 'other' ? 'var(--genre-other)' : `var(--genre-${genre})`} />
    </svg>
  )
}

export function ByGenrePanel({ genres, styles, total, query, setQuery }: { genres: GenreRow[]; styles: StyleRow[]; total: number; query: Query; setQuery: (patch: Partial<Query>) => void }) {
  const gMax = genres.reduce((m, r) => Math.max(m, r.count), 0)
  const sMax = styles.reduce((m, r) => Math.max(m, r.count), 0)
  const toggleGenre = (g: GenreId) => setQuery({ genre: query.genre.includes(g) ? query.genre.filter((x) => x !== g) : [...query.genre, g] })
  const toggleStyle = (s: string) => setQuery({ style: query.style.includes(s) ? query.style.filter((x) => x !== s) : [...query.style, s] })
  return (
    <div className="by-genre">
      <table className="table count-table">
        <caption>{t('county.byGenre')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('county.col.genre')}</th>
            <th scope="col" className="count-table__bar" aria-hidden="true"></th>
            <th scope="col" className="is-numeric">
              {t('county.col.count')}
            </th>
            <th scope="col" className="is-numeric">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {genres.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                {t('county.noRows')}
              </td>
            </tr>
          )}
          {genres.map((r) => {
            const active = r.genre !== null && query.genre.includes(r.genre)
            return (
              <tr key={r.genre ?? 'null'} className={active ? 'is-selected' : undefined}>
                <td>
                  {r.genre ? (
                    <button type="button" className="count-table__pick" aria-pressed={active} title={genreTitle(r.genre)} onClick={() => toggleGenre(r.genre as GenreId)}>
                      <GenreSwatch genre={r.genre} size={8} /> <span lang="ro">{genreLabel(r.genre)}</span>
                    </button>
                  ) : (
                    <span>
                      <GenreSwatch genre={null} size={8} /> {t('facet.noGenre')}
                    </span>
                  )}
                </td>
                <td className="count-table__bar">
                  <Bar n={r.count} max={gMax} genre={r.genre} />
                </td>
                <td className="mono is-numeric">{r.count}</td>
                <td className="mono is-numeric muted">{t('county.genrePct', { pct: pct(r.count, total), total })}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <table className="table count-table">
        <caption>{t('county.byStyle')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('county.col.style')}</th>
            <th scope="col" className="count-table__bar" aria-hidden="true"></th>
            <th scope="col" className="is-numeric">
              {t('county.col.count')}
            </th>
            <th scope="col" className="is-numeric">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {styles.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                {t('county.noRows')}
              </td>
            </tr>
          )}
          {styles.map((r) => {
            const active = r.style !== null && query.style.includes(r.style)
            return (
              <tr key={r.style ?? 'null'} className={active ? 'is-selected' : undefined}>
                <td>
                  {r.style ? (
                    <button type="button" className="count-table__pick" aria-pressed={active} onClick={() => toggleStyle(r.style as string)}>
                      {styleLabel(r.style)}
                    </button>
                  ) : (
                    <span className="muted">{t('facet.unknown')}</span>
                  )}
                </td>
                <td className="count-table__bar">
                  <Bar n={r.count} max={sMax} />
                </td>
                <td className="mono is-numeric">{r.count}</td>
                <td className="mono is-numeric muted">{t('county.genrePct', { pct: pct(r.count, total), total })}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
