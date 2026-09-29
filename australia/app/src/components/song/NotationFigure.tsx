// NotationFigure + Lightbox: one <figure> per media.images[] item (a notation scan or the paper's
// masthead), lazy <img> hot-linked from
// folkstream.com, click or "View full size" opens a modal dialog (focus trapped, Esc closes,
// Left / Right between images); load errors show a retry link.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { t } from '../../i18n/en'

export interface NotationItem {
  url: string
  type: string
  role: 'notation' | 'masthead'
}

export function notationAlt(title: string, ref: string, index: number, total: number, role: 'notation' | 'masthead' = 'notation'): string {
  const base = t(role === 'masthead' ? 'song.mastheadAlt' : 'song.notationAlt', { title, ref })
  return total > 1 ? `${base}, image ${index + 1}` : base
}

export function NotationFigure({ items, title, refText }: { items: NotationItem[]; title: string; refText: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [failed, setFailed] = useState<Record<number, number>>({})
  const openerRef = useRef<HTMLElement | null>(null)

  const show = (i: number, opener: HTMLElement | null) => {
    openerRef.current = opener
    setOpen(i)
  }
  const close = useCallback(() => {
    setOpen(null)
    const el = openerRef.current
    window.requestAnimationFrame(() => el?.focus())
  }, [])

  if (!items.length) {
    return (
      <div className="notation notation--empty" aria-label={t('song.notationNone')}>
        <span>{t('song.notationNone')}</span>
      </div>
    )
  }
  return (
    <div className="notation">
      {items.map((item, i) => {
        const attempt = failed[i]
        const errored = attempt !== undefined && attempt < 0
        const alt = notationAlt(title, refText, i, items.length, item.role)
        return (
          <figure className="notation__figure" key={item.url + i}>
            {errored ? (
              <div className="notation__error" role="status">
                <span>{t('song.notationError')}</span>{' '}
                <button type="button" className="btn btn--link" onClick={() => setFailed((f) => ({ ...f, [i]: Math.abs(f[i] ?? 0) + 1 }))}>
                  {t('song.notationRetry')}
                </button>
              </div>
            ) : (
              <button type="button" className="notation__open" aria-label={`${t('song.notationView')}: ${alt}`} title={t('song.notationClick')} onClick={(e) => show(i, e.currentTarget)}>
                <img key={attempt ?? 0} src={attempt ? `${item.url}${item.url.includes('?') ? '&' : '?'}retry=${attempt}` : item.url} alt={alt} loading="lazy" decoding="async" onError={() => setFailed((f) => ({ ...f, [i]: -(Math.abs(f[i] ?? 0) + 1) }))} />
              </button>
            )}
            <figcaption>
              <span className="muted">{item.role === 'masthead' ? t('song.mastheadCaption') : t('song.notationCredit')}</span>
              {!errored && (
                <button type="button" className="btn btn--sm" onClick={(e) => show(i, e.currentTarget)}>
                  {t('song.notationView')}
                </button>
              )}
            </figcaption>
          </figure>
        )
      })}
      {open !== null && items[open] && <Lightbox items={items} index={open} title={title} refText={refText} onIndex={setOpen} onClose={close} />}
    </div>
  )
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Lightbox({ items, index, title, refText, onIndex, onClose }: { items: NotationItem[]; index: number; title: string; refText: string; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      onIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < items.length - 1) {
      e.preventDefault()
      onIndex(index + 1)
    } else if (e.key === 'Tab') {
      const nodes = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || !nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
  const item = items[index]
  return (
    <div className="lightbox" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lightbox__dialog" role="dialog" aria-modal="true" aria-label={t('song.lightbox')} ref={ref} onKeyDown={onKeyDown}>
        <div className="lightbox__bar">
          <span className="mono">{items.length > 1 ? t('song.lightboxPage', { i: index + 1, n: items.length }) : refText}</span>
          <div className="lightbox__controls">
            {items.length > 1 && (
              <>
                <button type="button" className="btn btn--sm" disabled={index <= 0} onClick={() => onIndex(index - 1)} aria-label={t('song.lightboxPrev')}>
                  &larr;
                </button>
                <button type="button" className="btn btn--sm" disabled={index >= items.length - 1} onClick={() => onIndex(index + 1)} aria-label={t('song.lightboxNext')}>
                  &rarr;
                </button>
              </>
            )}
            <a className="btn btn--sm" href={item.url} target="_blank" rel="noopener noreferrer">
              {t('song.notationView')} &nearr;
            </a>
            <button type="button" className="btn btn--sm" ref={closeRef} onClick={onClose} aria-label={t('song.close')}>
              &times;
            </button>
          </div>
        </div>
        <div className="lightbox__body">
          <img src={item.url} alt={notationAlt(title, refText, index, items.length, item.role)} />
        </div>
      </div>
    </div>
  )
}
