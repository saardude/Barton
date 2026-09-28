// JourneyTimeline (FRONTEND-SPEC 14.4, AC-44): a track from the first to the last year with one
// bar per trip (width = days, min 6 px), index entries and date-gap trips in separate lane
// groups, fuzzy trips hatched, the 1914 and 1920 reference ticks from context-events.json.
// The bars form a listbox with roving tabindex; a month input and a select are the
// alternatives for people who prefer them.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { melodies, t } from '../../i18n/en'
import { formatIsoDate, journeyDateText, referenceEvents, startDay, timelineLayout, timelinePosition, type ContextEvent, type Journey } from '../../state/journeys'
import { journeyTitle } from './journeyView'

const LANE_H = 7
const LANE_GAP = 1
const AXIS_H = 18
const GROUP_GAP = 10
const MIN_BAR_PX = 6

export interface JourneyTimelineProps {
  journeys: Journey[]
  events: ContextEvent[]
  selectedId?: string
  date?: string
  unmappedCount: number
  onSelect: (id: string | undefined) => void
  onDate: (date: string) => void
  onUnmapped: () => void
}

export function JourneyTimeline({ journeys, events, selectedId, date, unmappedCount, onSelect, onDate, onUnmapped }: JourneyTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1000)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const typeahead = useRef<{ buf: string; at: number }>({ buf: '', at: 0 })

  useEffect(() => {
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 1000))
    ro.observe(el)
    setWidth(el.clientWidth || 1000)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(() => timelineLayout(journeys, MIN_BAR_PX / Math.max(1, width)), [journeys, width])
  const sorted = useMemo(() => [...journeys].sort((a, b) => startDay(a.dateStart) - startDay(b.dateStart) || a.id.localeCompare(b.id)), [journeys])
  const byId = useMemo(() => new Map(journeys.map((j) => [j.id, j])), [journeys])
  const refs = useMemo(() => referenceEvents(events), [events])

  const years: number[] = []
  for (let y = layout.yearMin; y <= layout.yearMax; y++) years.push(y)
  const pxPerYear = width / Math.max(1, years.length)
  const labelEvery = pxPerYear >= 34 ? 1 : pxPerYear >= 18 ? 2 : 5

  const indexTop = AXIS_H
  const gapTop = indexTop + layout.lanes.index * (LANE_H + LANE_GAP) + (layout.lanes.index ? GROUP_GAP : 0)
  const height = gapTop + layout.lanes.gap * (LANE_H + LANE_GAP) + 4

  const activeId = selectedId && byId.has(selectedId) ? selectedId : sorted[0]?.id
  const [focusId, setFocusId] = useState<string | undefined>(undefined)
  const tabId = focusId && byId.has(focusId) ? focusId : activeId

  useEffect(() => {
    // Keep the selected marker in view when the track scrolls horizontally (phone).
    if (!selectedId) return
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`)
    el?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [selectedId])

  const focusMarker = (id: string) => {
    setFocusId(id)
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)
    el?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    const i = sorted.findIndex((j) => j.id === id)
    if (i < 0) return
    let next: number | undefined
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = Math.min(sorted.length - 1, i + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = Math.max(0, i - 1)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = sorted.length - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(id)
        return
      case 'Escape':
        e.preventDefault()
        onSelect(undefined)
        return
      default: {
        if (/^\d$/.test(e.key)) {
          const now = e.timeStamp
          const ta = typeahead.current
          ta.buf = now - ta.at < 1000 ? ta.buf + e.key : e.key
          ta.at = now
          const hit = sorted.find((j) => j.dateStart.startsWith(ta.buf))
          if (hit) {
            e.preventDefault()
            focusMarker(hit.id)
            onSelect(hit.id)
          }
        }
        return
      }
    }
    e.preventDefault()
    const target = sorted[next]
    if (target) {
      focusMarker(target.id)
      onSelect(target.id)
    }
  }

  const hovered = hoverId ? byId.get(hoverId) : undefined
  const hoveredMark = hovered ? layout.marks.find((m) => m.id === hovered.id) : undefined

  return (
    <div className="timeline" aria-label={t('journey.timeline')}>
      <div className="timeline__controls">
        <label className="timeline__control">
          <span className="caps-label">{t('journey.goToDate')}</span>
          <input
            type="month"
            className="input"
            min={`${layout.yearMin}-01`}
            max={`${layout.yearMax}-12`}
            value={date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : ''}
            onChange={(e) => e.target.value && onDate(e.target.value)}
            aria-label={t('journey.goToDate')}
          />
        </label>
        <label className="timeline__control">
          <span className="caps-label">{t('journey.pickTrip')}</span>
          <select className="select" value={selectedId ?? ''} onChange={(e) => onSelect(e.target.value || undefined)} aria-label={t('journey.pickTrip')}>
            <option value="">{t('journey.pickTripNone')}</option>
            {sorted.map((j) => (
              <option key={j.id} value={j.id}>
                {journeyTitle(j)} ({melodies(j.recordCount)})
              </option>
            ))}
          </select>
        </label>
        {unmappedCount > 0 && (
          <button type="button" className="btn btn--sm timeline__unmapped" onClick={onUnmapped}>
            {t('journey.unmappedTitle', { n: unmappedCount })}
          </button>
        )}
      </div>
      <div className="timeline__scroller">
        <div className="timeline__track" ref={trackRef} style={{ height }}>
          <div className="timeline__axis" aria-hidden="true">
            {years.map((y, i) => {
              const x = (i / years.length) * 100
              return (
                <span key={y} className={`timeline__year${i % labelEvery === 0 ? '' : ' timeline__year--tick'}`} style={{ left: `${x}%` }}>
                  {i % labelEvery === 0 ? y : ''}
                </span>
              )
            })}
          </div>
          {refs.map((r) => (
            <div key={r.date} className="timeline__ref" style={{ left: `${timelinePosition(r.date, layout) * 100}%` }} title={r.title} aria-hidden="true">
              <span className="timeline__ref-label">{r.label}</span>
            </div>
          ))}
          {date && !selectedId && <div className="timeline__cursor" style={{ left: `${timelinePosition(date, layout) * 100}%` }} aria-hidden="true" />}
          <div className="timeline__lane-labels" aria-hidden="true">
            {layout.lanes.index > 0 && (
              <span className="timeline__lane-label" style={{ top: indexTop }} title={t('journey.laneIndex')}>
                {t('journey.laneIndexShort')}
              </span>
            )}
            {layout.lanes.gap > 0 && (
              <span className="timeline__lane-label" style={{ top: gapTop }} title={t('journey.laneGap')}>
                {t('journey.laneGapShort')}
              </span>
            )}
          </div>
          <div role="listbox" aria-label={t('journey.timelineLabel')} className="timeline__marks">
            {layout.marks.map((m) => {
              const j = byId.get(m.id)
              if (!j) return null
              const top = (m.group === 'index' ? indexTop : gapTop) + m.lane * (LANE_H + LANE_GAP)
              const selected = j.id === selectedId
              const label = t('journey.markerLabel', { label: journeyTitle(j), from: formatIsoDate(j.dateStart), to: formatIsoDate(j.dateEnd), stops: j.stops.length, n: j.recordCount })
              return (
                <div
                  key={m.id}
                  role="option"
                  aria-selected={selected}
                  aria-label={label}
                  tabIndex={j.id === tabId ? 0 : -1}
                  data-id={j.id}
                  className={`timeline__mark timeline__mark--${m.group}${m.fuzzy ? ' timeline__mark--fuzzy' : ''}${selected ? ' is-selected' : ''}${!j.recordsOnline ? ' timeline__mark--offline' : ''}`}
                  style={{ left: `${m.x0 * 100}%`, width: `${Math.max(0, (m.x1 - m.x0) * 100)}%`, top, height: LANE_H }}
                  onClick={() => onSelect(selected ? undefined : j.id)}
                  onKeyDown={(e) => onKey(e, j.id)}
                  onFocus={() => {
                    setFocusId(j.id)
                    setHoverId(j.id)
                  }}
                  onBlur={() => setHoverId((h) => (h === j.id ? null : h))}
                  onMouseEnter={() => setHoverId(j.id)}
                  onMouseLeave={() => setHoverId((h) => (h === j.id ? null : h))}
                />
              )
            })}
          </div>
          {hovered && hoveredMark && (
            <div className="timeline__card" style={{ left: `${Math.min(hoveredMark.x0 * 100, 80)}%`, top: height }} role="tooltip">
              <div className="timeline__card-title">{journeyTitle(hovered)}</div>
              <div className="mono">{journeyDateText(hovered).text}</div>
              <div className="muted">
                {t('journey.hoverStops', { n: hovered.stops.length })}, {melodies(hovered.recordCount)}
                {' / '}
                {hovered.derivedFrom === 'gyuj-collections' ? t('journey.markerIndex') : t('journey.markerGap')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
