// JourneyListSheet (FRONTEND-SPEC 14.8): under 1024 px the journeys list opens as a bottom
// sheet (role="dialog"); picking a trip closes it. Focus moves in on open and back on close.
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../../i18n/en'

export function JourneyListSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('input, button, [tabindex="0"]')?.focus()
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
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="sheet journey-sheet" onClick={onClose} data-testid="journey-list-sheet">
      <div className="sheet__panel journey-sheet__panel" role="dialog" aria-modal="true" aria-label={t('journey.list')} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        {children}
        <div className="sheet__footer">
          <button type="button" className="btn" onClick={onClose}>
            {t('journey.closeList')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
