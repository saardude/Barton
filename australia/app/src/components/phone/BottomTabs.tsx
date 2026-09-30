// BottomTabs: fixed bottom bar under 768 px with Map / Songs / Places as tabs (role="tablist",
// roving tabindex, Left/Right arrows) and Sources as a link.
import { useRef, type KeyboardEvent } from 'react'
import { NavLink } from 'react-router'
import { formatNumber, t } from '../../i18n/en'

export type PhoneTab = 'map' | 'list' | 'places'

const TABS: { id: PhoneTab; label: string; icon: string }[] = [
  { id: 'map', label: t('phone.tab.map'), icon: 'M3 5l4-2 4 2 4-2v11l-4 2-4-2-4 2V5zm4-2v11m4-9v11' },
  { id: 'list', label: t('phone.tab.songs'), icon: 'M3 4h12M3 8h12M3 12h8' },
  { id: 'places', label: t('phone.tab.places'), icon: 'M9 15s-5-4.5-5-8a5 5 0 0 1 10 0c0 3.5-5 8-5 8zm0-6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
]

export function panelId(tab: PhoneTab): string {
  return `phone-panel-${tab}`
}
export function tabId(tab: PhoneTab): string {
  return `phone-tab-${tab}`
}

export function BottomTabs({ tab, onTab, resultCount, search }: { tab: PhoneTab; onTab: (tab: PhoneTab) => void; resultCount?: number; search: string }) {
  const listRef = useRef<HTMLDivElement>(null)
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const moves: Record<string, number> = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i - 1 + TABS.length) % TABS.length, Home: 0, End: TABS.length - 1 }
    const next = moves[e.key]
    if (next === undefined) return
    e.preventDefault()
    onTab(TABS[next].id)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }
  return (
    <nav className="bottom-tabs" aria-label={t('phone.views')}>
      <div className="bottom-tabs__list" role="tablist" aria-label={t('phone.views')} ref={listRef}>
        {TABS.map((item, i) => {
          const selected = item.id === tab
          return (
            <button key={item.id} type="button" role="tab" id={tabId(item.id)} className="bottom-tabs__tab" aria-selected={selected} aria-controls={selected ? panelId(item.id) : undefined} tabIndex={selected ? 0 : -1} onClick={() => onTab(item.id)} onKeyDown={(e) => onKey(e, i)}>
              <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="bottom-tabs__label">
                {item.label}
                {item.id === 'list' && resultCount !== undefined && (
                  <span className="bottom-tabs__count" aria-hidden="true">
                    {' '}
                    {formatNumber(resultCount)}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <NavLink className="bottom-tabs__tab bottom-tabs__link" to={{ pathname: '/sources', search }}>
        <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
          <path d="M4 3h10v12H4zM6 6h6M6 9h6M6 12h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="bottom-tabs__label">{t('phone.tab.sources')}</span>
      </NavLink>
    </nav>
  )
}
