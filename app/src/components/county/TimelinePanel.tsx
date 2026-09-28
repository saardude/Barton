// TimelinePanel (FRONTEND-SPEC 8): inline SVG column chart, one column per year from the set's
// min to max year, stacked by genre when "colour by genre" is on; columns focusable with a label
// "1912: 38 melodies"; click sets from = to = year; a visually hidden table mirrors the data.
import { genreLabel, t } from '../../i18n/en'
import type { Timeline } from '../../state/countyStats'
import { GENRE_ORDER } from '../../state/query'

const H = 160
const PAD_BOTTOM = 22
const PAD_LEFT = 32

export function TimelinePanel({ timeline, colourByGenre, onPickYear, selectedYear }: { timeline: Timeline; colourByGenre: boolean; onPickYear: (year: number) => void; selectedYear?: number }) {
  const { perYear, unknownYear, max } = timeline
  if (!perYear.length) {
    return <p className="muted">{t('county.timelineUnknown', { n: unknownYear })}</p>
  }
  const n = perYear.length
  const colW = Math.max(6, Math.min(40, Math.floor(560 / n)))
  const gap = colW >= 12 ? 3 : 1
  const W = PAD_LEFT + n * (colW + gap)
  const scale = (v: number) => (max ? (v / max) * (H - PAD_BOTTOM - 8) : 0)
  const labelEvery = n <= 12 ? 1 : n <= 30 ? 5 : 10
  return (
    <div className="timeline">
      <svg className="timeline__chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-label={t('county.timelineCaption')}>
        <line x1={PAD_LEFT} y1={H - PAD_BOTTOM} x2={W} y2={H - PAD_BOTTOM} stroke="var(--line-strong)" />
        <text x={PAD_LEFT - 4} y={12} textAnchor="end" className="timeline__tick">
          {max}
        </text>
        <text x={PAD_LEFT - 4} y={H - PAD_BOTTOM} textAnchor="end" className="timeline__tick">
          0
        </text>
        {perYear.map((bar, i) => {
          const x = PAD_LEFT + i * (colW + gap)
          const total = scale(bar.count)
          const label = t('county.timelineLabel', { year: bar.year, n: bar.count })
          const selected = bar.year === selectedYear
          let y = H - PAD_BOTTOM
          const segs = colourByGenre
            ? GENRE_ORDER.filter((g) => (bar.genreCounts[g] ?? 0) > 0).map((g) => ({ g, h: scale(bar.genreCounts[g] ?? 0) }))
            : [{ g: null, h: total }]
          const unclassified = colourByGenre ? total - segs.reduce((s, x) => s + x.h, 0) : 0
          return (
            <g key={bar.year} className={`timeline__col${selected ? ' is-selected' : ''}`} role="img" aria-label={label} tabIndex={0} onClick={() => onPickYear(bar.year)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPickYear(bar.year))}>
              <title>{label}</title>
              <rect x={x} y={8} width={colW} height={H - PAD_BOTTOM - 8} fill="transparent" />
              {segs.map((s) => {
                y -= s.h
                return <rect key={s.g ?? 'all'} x={x} y={y} width={colW} height={s.h} fill={s.g ? `var(--genre-${s.g})` : 'var(--ink-2)'} />
              })}
              {unclassified > 0 && <rect x={x} y={y - unclassified} width={colW} height={unclassified} fill="var(--genre-other)" />}
              {i % labelEvery === 0 && (
                <text x={x + colW / 2} y={H - 6} textAnchor="middle" className="timeline__tick">
                  {bar.year}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {colourByGenre && (
        <ul className="timeline__legend" aria-label={t('map.legendGenre')}>
          {GENRE_ORDER.map((g) => (
            <li key={g}>
              <span className="swatch swatch--8" style={{ background: `var(--genre-${g})` }} aria-hidden="true" /> {genreLabel(g)}
            </li>
          ))}
        </ul>
      )}
      <p className="muted">{t('county.timelineUnknown', { n: unknownYear })}</p>
      <table className="visually-hidden">
        <caption>{t('county.timelineCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('county.col.year')}</th>
            <th scope="col">{t('county.col.melodies')}</th>
          </tr>
        </thead>
        <tbody>
          {perYear.map((bar) => (
            <tr key={bar.year}>
              <td>{bar.year}</td>
              <td>{bar.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
