// JourneyTimeline (FRONTEND-SPEC 14.4): the compact, collapsible year strip above the journeys
// list. One button per year with a bar for the number of trips; pressing a year narrows the
// list to that year (pressing it again clears). The list, not the strip, is the primary control.
import { useMemo } from 'react'
import { t } from '../../i18n/en'
import { journeysPerYear, type Journey } from '../../state/journeys'

export interface JourneyTimelineProps {
  journeys: Journey[]
  year?: number
  onYear: (year: number | undefined) => void
  open?: boolean
}

export function JourneyTimeline({ journeys, year, onYear, open = true }: JourneyTimelineProps) {
  const years = useMemo(() => journeysPerYear(journeys), [journeys])
  const max = years.reduce((m, y) => Math.max(m, y.n), 1)
  return (
    <section className="year-strip" aria-label={t('journey.timeline')}>
      <details className="year-strip__details" open={open || undefined}>
      <summary className="year-strip__summary">
        <span>{t('journey.timeline')}</span>
        {year !== undefined && (
          <button type="button" className="btn btn--link year-strip__clear" onClick={() => onYear(undefined)}>
            {t('journey.allYears')}
          </button>
        )}
      </summary>
      <div className="year-strip__track" role="group" aria-label={t('journey.yearStrip')}>
        {years.map((y) => (
          <button
            key={y.year}
            type="button"
            className={`year-strip__year${y.n === 0 ? ' is-empty' : ''}`}
            aria-pressed={year === y.year}
            aria-label={t('journey.yearTrips', { year: String(y.year), n: y.n })}
            title={t('journey.yearTrips', { year: String(y.year), n: y.n })}
            disabled={y.n === 0}
            onClick={() => onYear(year === y.year ? undefined : y.year)}
          >
            <span className="year-strip__bar" style={{ height: `${Math.max(2, Math.round((y.n / max) * 24))}px` }} aria-hidden="true" />
            <span className="year-strip__label" aria-hidden="true">
              {y.year % 5 === 0 || years.length <= 12 ? y.year : String(y.year).slice(2)}
            </span>
          </button>
        ))}
      </div>
      </details>
    </section>
  )
}
