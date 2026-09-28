// GenreSwatch and GenreBar (FRONTEND-SPEC 6); colours come from the genre tokens.
import { genreLabel, t } from '../i18n/en'
import { GENRE_ORDER, type GenreId } from '../state/query'

export function genreColour(genre: GenreId | null): string {
  return `var(--genre-${genre ?? 'other'})`
}

export function GenreSwatch({ genre, size = 12 }: { genre: GenreId | null; size?: 8 | 12 }) {
  const other = !genre || genre === 'other'
  return (
    <span
      className={`swatch${size === 8 ? ' swatch--8' : ''}${other ? ' swatch--other' : ''}`}
      style={other ? undefined : { background: genreColour(genre) }}
      aria-hidden="true"
    />
  )
}

/** Stacked horizontal genre bar, inline SVG, segments in fixed genre order. */
export function GenreBar({ counts, total, height = 8, width = 200 }: { counts: Partial<Record<GenreId, number>>; total: number; height?: 8 | 16 | 24; width?: number }) {
  const parts = GENRE_ORDER.map((g) => ({ g, n: counts[g] ?? 0 })).filter((p) => p.n > 0)
  const label = parts.length ? `Genres: ${parts.map((p) => `${p.n} ${genreLabel(p.g)}`).join(', ')}` : t('facet.noGenre')
  let x = 0
  return (
    <svg className="genre-bar" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <pattern id="genre-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2" height="4" fill="var(--genre-other)" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="var(--line)" />
      {total > 0 &&
        parts.map((p) => {
          const w = (p.n / total) * width
          const el = (
            <rect key={p.g} x={x} y="0" width={w} height={height} fill={p.g === 'other' ? 'url(#genre-hatch)' : genreColour(p.g)}>
              <title>{`${genreLabel(p.g)}: ${p.n}`}</title>
            </rect>
          )
          x += w
          return el
        })}
    </svg>
  )
}
