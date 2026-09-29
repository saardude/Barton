// MapPointSheet: on touch, tapping a state bubble or town dot opens a bottom sheet with the
// hover-card content plus "Show songs" and "Open state page". role="dialog", focus moves in on
// open and returns to the opener on close; Escape and the scrim close it.
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { t } from '../../i18n/en'
import type { MapPoint } from '../../state/selectors'

export function stateSlugOfPoint(point: MapPoint): string | undefined {
  const parts = point.placeId.split('/')
  return parts[0] === 'au' && parts.length >= 2 ? parts[1] : undefined
}

export function MapPointSheet({ point, search, onClose, onShowSongs, children }: { point: MapPoint; search: string; onClose: () => void; onShowSongs: (point: MapPoint) => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('button, a')?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [onClose])

  const slug = stateSlugOfPoint(point)
  return createPortal(
    <div className="sheet point-sheet" onClick={onClose} data-testid="map-point-sheet">
      <div className="sheet__panel point-sheet__panel" role="dialog" aria-modal="true" aria-label={point.place.name} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="point-sheet__handle" aria-hidden="true" />
        <div className="point-sheet__body">{children}</div>
        <div className="sheet__footer point-sheet__footer">
          <button type="button" className="btn btn--primary" onClick={() => onShowSongs(point)}>
            {point.selected ? t('phone.clearPlace') : t('map.showSongs')}
          </button>
          {slug && (
            <Link className="btn" to={{ pathname: `/state/${slug}`, search }} onClick={onClose}>
              {t('nav.openState')}
            </Link>
          )}
          <button type="button" className="btn btn--icon" onClick={onClose} aria-label={t('song.close')}>
            &times;
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
