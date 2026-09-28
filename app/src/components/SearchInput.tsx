// SearchInput (FRONTEND-SPEC 6): <input type="search"> debounced 200 ms; Enter moves focus to results.
import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n/en'

export function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  const timer = useRef<number | undefined>(undefined)
  const lastSent = useRef(value)

  // External changes (Back button, chip removal, Clear all) update the box.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value
      setLocal(value)
    }
  }, [value])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const send = (v: string, immediate = false) => {
    setLocal(v)
    window.clearTimeout(timer.current)
    const fire = () => {
      lastSent.current = v
      onChange(v)
    }
    if (immediate) fire()
    else timer.current = window.setTimeout(fire, 200)
  }

  return (
    <div className="search">
      <input
        className="input search__input"
        type="search"
        value={local}
        aria-label={t('search.label')}
        placeholder={t('search.placeholder')}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => send(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            send(local, true)
            const list = document.getElementById('results')
            list?.focus()
          }
        }}
      />
      {local && (
        <button type="button" className="search__clear" aria-label={t('search.clear')} onClick={() => send('', true)}>
          &times;
        </button>
      )}
    </div>
  )
}
