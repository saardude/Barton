// CompareDivider (MAP-SPEC 11.4): the on-map swipe handle for the borders compare mode, a
// slider (arrow keys 2% per step, 10% with Shift) that also drags with the pointer.
import { useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { t } from '../../i18n/en'

/** The on-map swipe handle: a slider (arrow keys, 2% per step, 10% with Shift) that also drags. */
export function CompareDivider({ compare, onCompare, boundsRef }: { compare: number; onCompare: (v: number) => void; boundsRef: RefObject<HTMLElement | null> }) {
  const dragging = useRef(false)
  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const el = boundsRef.current
    if (!dragging.current || !el) return
    const rect = el.getBoundingClientRect()
    onCompare(Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))))
  }
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key === 'ArrowLeft') onCompare(Math.max(0, compare - step))
    else if (e.key === 'ArrowRight') onCompare(Math.min(100, compare + step))
    else return
    e.preventDefault()
  }
  return (
    <div className="compare-divider" style={{ left: `${compare}%` } as CSSProperties}>
      <button
        type="button"
        className="compare-divider__handle"
        aria-label={t('journey.compareLabel')}
        aria-valuenow={compare}
        aria-valuemin={0}
        aria-valuemax={100}
        role="slider"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M8 4 3 10l5 6M12 4l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
