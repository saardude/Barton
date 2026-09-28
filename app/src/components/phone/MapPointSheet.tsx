// MapPointSheet (FRONTEND-SPEC 10, AC-25): on touch, tapping a county bubble or village dot opens
// a bottom sheet with the hover-card content plus "Show melodies" and "Open county page".
// role="dialog", focus moves in on open and returns to the opener on close; Escape and the
// scrim close it. Rendered by MapPanel when `touchSheet` is on.
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { t } from '../../i18n/en'
import { placeText } from '../../state/placeName'
import type { MapPoint } from '../../state/selectors'

export function countyIdOf(point: MapPoint): string | undefined {
  const parts = point.placeId.split('/')
  return parts.length >= 3 ? parts.slice(0, 3).join('/') : undefined
}

export function MapPointSheet({
  point,
  search,
  onClose,
  onShowMelodies,
  children,
}: {
  point: MapPoint
  /** `?...` for the county link. */
  search: string
  onClose: () => void
  onShowMelodies: (point: MapPoint) => void
  /** The card body (shared with the desktop hover card). */
  children: ReactNode
}) {
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

  const countyId = countyIdOf(point)
  const name = placeText(point.place, point.placeId)
  // Portal: .map-panel isolates its stacking context, which would trap the sheet under the fixed bottom tabs.
  return createPortal(
    <div className="sheet point-sheet" onClick={onClose} data-testid="map-point-sheet">
      <div className="sheet__panel point-sheet__panel" role="dialog" aria-modal="true" aria-label={name} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="point-sheet__handle" aria-hidden="true" />
        <div className="point-sheet__body">{children}</div>
        <div className="sheet__footer point-sheet__footer">
          <button type="button" className="btn btn--primary" onClick={() => onShowMelodies(point)}>
            {point.selected ? t('phone.clearPlace') : t('map.showMelodies')}
          </button>
          {countyId && (
            <Link className="btn" to={{ pathname: `/county/${countyId}`, search }} onClick={onClose}>
              {t('nav.openCounty')}
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
