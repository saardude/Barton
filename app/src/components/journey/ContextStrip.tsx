// ContextStrip (FRONTEND-SPEC 14.4, UI-COPY 13.3, AC-43): cited events within the trip window,
// shown verbatim (date, kind label, title, summary, citation); nothing editorial is added.
import { useRef, type KeyboardEvent } from 'react'
import { t } from '../../i18n/en'
import { eventKindLabel, formatIsoDate, type EventInWindow } from '../../state/journeys'

function eventDate(e: EventInWindow['event']): string {
  const a = formatIsoDate(e.date)
  if (e.dateEnd && e.dateEnd !== e.date) return `${a} to ${formatIsoDate(e.dateEnd)}`
  return e.dateConfidence === 'approximate' ? `${a} (approximate)` : a
}

export function ContextStrip({ events, title, headless = false }: { events: EventInWindow[]; title?: string; /** Rendered inside a disclosure that already carries the heading. */ headless?: boolean }) {
  const listRef = useRef<HTMLDivElement>(null)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const cards = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="listitem"]') ?? [])
    const i = cards.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    e.preventDefault()
    const next = cards[e.key === 'ArrowRight' ? Math.min(cards.length - 1, i + 1) : Math.max(0, i - 1)]
    next?.focus()
    next?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }
  return (
    <section className="context-strip" aria-labelledby={headless ? undefined : 'context-title'} aria-label={headless ? (title ?? t('journey.context')) : undefined}>
      {!headless && (
        <h2 id="context-title" className="panel-title">
          {title ?? t('journey.context')}
        </h2>
      )}
      {events.length === 0 ? (
        <p className="muted context-strip__empty">{t('journey.contextEmpty')}</p>
      ) : (
        <div className="context-strip__list" role="list" ref={listRef} onKeyDown={onKey}>
          {events.map(({ event, duringTrip }) => (
            <article key={event.id} className="context-card" role="listitem" tabIndex={0} aria-label={`${eventKindLabel(event.kind)}: ${event.title}`}>
              <div className="context-card__head">
                <span className="context-card__date mono">{eventDate(event)}</span>
                <span className="context-card__kind">{eventKindLabel(event.kind)}</span>
                {duringTrip && <span className="context-card__during">{t('journey.duringTrip')}</span>}
              </div>
              <h3 className="context-card__title">{event.title}</h3>
              <p className="context-card__summary">{event.summary}</p>
              {event.quote && (
                <blockquote className="context-card__quote">
                  <span className="mono">{event.quote}</span>
                </blockquote>
              )}
              <p className="context-card__source">
                {t('journey.citationSource')}{' '}
                {event.source?.url ? (
                  <a href={event.source.url} target="_blank" rel="noopener noreferrer">
                    {event.source.citation}
                  </a>
                ) : (
                  event.source?.citation
                )}
              </p>
            </article>
          ))}
        </div>
      )}
      <p className="context-strip__note muted">{t('journey.contextNote')}</p>
    </section>
  )
}
