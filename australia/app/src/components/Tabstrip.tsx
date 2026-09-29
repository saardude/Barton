// Tabstrip: role="tablist" with roving focus (Left / Right / Home / End), used by the song record
// (Record | Raw JSON) and the state page. The parent owns the
// active tab and keeps `?tab=` in the URL.
import { useRef, type KeyboardEvent } from 'react'

export interface TabDef<T extends string> {
  id: T
  label: string
}

export function Tabstrip<T extends string>({
  tabs,
  active,
  onChange,
  idPrefix,
  label,
}: {
  tabs: TabDef<T>[]
  active: T
  onChange: (id: T) => void
  idPrefix: string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((tab) => tab.id === active)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    window.requestAnimationFrame(() => {
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
    })
  }
  return (
    <div className="tabstrip" role="tablist" aria-label={label} ref={ref} onKeyDown={onKeyDown}>
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`tabstrip__tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function tabPanelProps(idPrefix: string, id: string) {
  return { role: 'tabpanel' as const, id: `${idPrefix}-panel-${id}`, 'aria-labelledby': `${idPrefix}-tab-${id}`, tabIndex: -1 }
}
