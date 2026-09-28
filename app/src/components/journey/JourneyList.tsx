// JourneyList (owner feedback c): the left-hand list of trips grouped by year, searchable, each
// row with the place, dates, melody count, stop count and a data-quality badge. Machine-made
// date-gap trips one record or one stop wide are hidden behind "Show all derived trips". The
// rows form a listbox (roving tabindex, arrows move, Enter selects, type-ahead by year).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { melodies, t } from '../../i18n/en'
import { groupJourneysByYear, isMinorDerived, journeyDateText, journeyPlaceTitle, journeyQuality, qualityLabel, visibleJourneys, type CuratedJourney, type Journey } from '../../state/journeys'
import { JourneyTimeline } from './JourneyTimeline'

export interface JourneyListProps {
  journeys: Journey[]
  curated: Map<string, CuratedJourney>
  selectedId?: string
  featuredId?: string
  onSelect: (id: string) => void
  /** Phone sheet: the year strip starts collapsed. */
  compactStrip?: boolean
  /** Rendered under the list (the undated-records link). */
  footer?: React.ReactNode
}

export function JourneyList({ journeys, curated, selectedId, featuredId, onSelect, compactStrip = false, footer }: JourneyListProps) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [year, setYear] = useState<number | undefined>(undefined)
  const [focusId, setFocusId] = useState<string | undefined>(undefined)
  const listRef = useRef<HTMLDivElement>(null)
  const typeahead = useRef<{ buf: string; at: number }>({ buf: '', at: 0 })

  const visible = useMemo(() => visibleJourneys(journeys, { showAll, search, year, keepId: selectedId }), [journeys, showAll, search, year, selectedId])
  const groups = useMemo(() => groupJourneysByYear(visible), [visible])
  const hidden = useMemo(() => journeys.filter(isMinorDerived).length, [journeys])
  const tabId = focusId && visible.some((j) => j.id === focusId) ? focusId : selectedId && visible.some((j) => j.id === selectedId) ? selectedId : visible[0]?.id

  // Keep the selected row in view when the selection comes from elsewhere (URL, map, keyboard).
  useEffect(() => {
    if (!selectedId) return
    listRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedId])

  const focusRow = (id: string) => {
    setFocusId(id)
    listRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    const i = visible.findIndex((j) => j.id === id)
    if (i < 0) return
    let next: number | undefined
    switch (e.key) {
      case 'ArrowDown':
        next = Math.min(visible.length - 1, i + 1)
        break
      case 'ArrowUp':
        next = Math.max(0, i - 1)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = visible.length - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(id)
        return
      default: {
        if (/^[\w]$/.test(e.key)) {
          const now = e.timeStamp
          const ta = typeahead.current
          ta.buf = now - ta.at < 1000 ? ta.buf + e.key.toLowerCase() : e.key.toLowerCase()
          ta.at = now
          const hit = visible.find((j) => j.dateStart.startsWith(ta.buf) || journeyPlaceTitle(j).toLowerCase().startsWith(ta.buf))
          if (hit) {
            e.preventDefault()
            focusRow(hit.id)
          }
        }
        return
      }
    }
    e.preventDefault()
    const target = visible[next]
    if (target) focusRow(target.id)
  }

  return (
    <section className="journey-list" aria-labelledby="journeys-title">
      <h2 id="journeys-title" className="panel-title journey-list__title">
        {t('journey.list')} <span className="muted">({visible.length})</span>
      </h2>
      <div className="journey-list__tools">
        <input
          type="search"
          className="input journey-list__search"
          value={search}
          placeholder={t('journey.searchPlaceholder')}
          aria-label={t('journey.searchJourneys')}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="journey-list__toggle" title={t('journey.derivedNote')}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          <span>{hidden > 0 ? t('journey.showAllDerived', { n: hidden }) : t('journey.showAllDerivedNone')}</span>
        </label>
      </div>
      <JourneyTimeline journeys={journeys} year={year} onYear={setYear} open={!compactStrip} />
      <div role="listbox" aria-label={t('journey.timelineLabel')} className="journey-list__items" ref={listRef}>
        {groups.length === 0 && <p className="muted journey-list__empty">{t('journey.noJourneysMatch')}</p>}
        {groups.map((g) => (
          <div key={g.year} role="group" aria-label={String(g.year)} className="journey-list__group">
            <div className="journey-list__year mono" aria-hidden="true">
              {g.year}
            </div>
            {g.journeys.map((j) => {
              const selected = j.id === selectedId
              const q = journeyQuality(j, curated.get(j.id))
              const title = curated.get(j.id)?.title ?? journeyPlaceTitle(j)
              const date = journeyDateText(j).text
              return (
                <div
                  key={j.id}
                  role="option"
                  aria-selected={selected}
                  aria-label={`${title}, ${date}, ${melodies(j.recordCount)}, ${qualityLabel(q)}`}
                  tabIndex={j.id === tabId ? 0 : -1}
                  data-id={j.id}
                  className={`journey-item${selected ? ' is-selected' : ''} journey-item--${q}`}
                  onClick={() => onSelect(j.id)}
                  onKeyDown={(e) => onKey(e, j.id)}
                  onFocus={() => setFocusId(j.id)}
                >
                  <div className="journey-item__title">
                    <span lang={j.labelPlaceRaw ? 'hu' : undefined}>{title}</span>
                    {j.id === featuredId && <span className="badge-text journey-item__featured">{t('journey.featured')}</span>}
                  </div>
                  <div className="journey-item__meta mono">
                    {date} &middot; {melodies(j.recordCount)}
                    {j.stops.length > 1 && ` · ${t('journey.hoverStops', { n: j.stops.length })}`}
                  </div>
                  <span className={`badge-text journey-item__badge`} title={t(`journey.qualityTitle.${q}`)}>
                    {qualityLabel(q)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {footer}
    </section>
  )
}
