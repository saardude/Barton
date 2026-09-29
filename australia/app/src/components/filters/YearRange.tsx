// YearRange: From / To number inputs, a 5-year histogram and two native
// range inputs for the thumbs. Number inputs commit on blur or Enter; sliders on change.
// Setting both ends back to the bounds removes both params.
import { t } from '../../i18n/en'
import type { Bin } from '../../state/selectors'

interface Props {
  min: number
  max: number
  from?: number
  to?: number
  histogram: Bin[]
  onChange: (next: { from?: number; to?: number }) => void
}

export function YearRange({ min, max, from, to, histogram, onChange }: Props) {
  const lo = from ?? min
  const hi = to ?? max

  const commit = (nextFrom: number, nextTo: number) => {
    let a = Math.min(Math.max(nextFrom, min), max)
    let b = Math.min(Math.max(nextTo, min), max)
    if (a > b) [a, b] = [b, a]
    onChange({ from: a <= min ? undefined : a, to: b >= max ? undefined : b })
  }
  const parse = (s: string, fallback: number) => {
    const n = parseInt(s, 10)
    return Number.isFinite(n) ? n : fallback
  }

  const maxCount = Math.max(1, ...histogram.map((b) => b.count))
  const w = 100
  const barW = histogram.length ? w / histogram.length : w
  const summary = histogram.length
    ? `Songs per 5 years, ${histogram[0].from} to ${histogram[histogram.length - 1].to}; most in ${histogram.reduce((a, b) => (b.count > a.count ? b : a)).from}s`
    : ''

  return (
    <div className="year-range">
      <div className="year-range__inputs">
        <label>
          {t('facet.yearFrom')}
          <input
            key={`from-${lo}`}
            className="input"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            defaultValue={lo}
            onBlur={(e) => commit(parse(e.currentTarget.value, min), hi)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(parse(e.currentTarget.value, min), hi)
            }}
          />
        </label>
        <label>
          {t('facet.yearTo')}
          <input
            key={`to-${hi}`}
            className="input"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            defaultValue={hi}
            onBlur={(e) => commit(lo, parse(e.currentTarget.value, max))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(lo, parse(e.currentTarget.value, max))
            }}
          />
        </label>
      </div>
      {histogram.length > 0 && (
        <svg className="year-range__hist" viewBox={`0 0 ${w} 20`} preserveAspectRatio="none" role="img" aria-label={summary}>
          {histogram.map((b, i) => {
            const h = (b.count / maxCount) * 20
            const out = b.to < lo || b.from > hi
            return <rect key={b.from} className={out ? 'is-out' : undefined} x={i * barW + 0.2} y={20 - h} width={Math.max(0.4, barW - 0.4)} height={h} />
          })}
        </svg>
      )}
      <div className="year-range__sliders">
        <label className="visually-hidden" htmlFor="year-from-slider">
          {t('facet.yearFrom')}
        </label>
        <input id="year-from-slider" type="range" min={min} max={max} value={lo} onChange={(e) => commit(parseInt(e.target.value, 10), hi)} />
        <label className="visually-hidden" htmlFor="year-to-slider">
          {t('facet.yearTo')}
        </label>
        <input id="year-to-slider" type="range" min={min} max={max} value={hi} onChange={(e) => commit(lo, parseInt(e.target.value, 10))} />
      </div>
    </div>
  )
}
