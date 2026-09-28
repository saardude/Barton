// Local preferences (FRONTEND-SPEC 6, TopBar): colour-by-genre and theme, remembered in
// localStorage behind try/catch; the theme sets data-theme on <html>.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'auto' | 'light' | 'dark'

interface Prefs {
  colourByGenre: boolean
  setColourByGenre: (v: boolean) => void
  theme: Theme
  setTheme: (t: Theme) => void
}

const PrefsContext = createContext<Prefs | null>(null)

function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function writePref(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // storage unavailable: the preference lives for the session only
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [colourByGenre, setColour] = useState(() => readPref('bartok.colourByGenre') === '1')
  const [theme, setThemeState] = useState<Theme>(() => {
    const v = readPref('bartok.theme')
    return v === 'light' || v === 'dark' ? v : 'auto'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const setColourByGenre = useCallback((v: boolean) => {
    setColour(v)
    writePref('bartok.colourByGenre', v ? '1' : '0')
  }, [])
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    writePref('bartok.theme', t)
  }, [])

  const value = useMemo(() => ({ colourByGenre, setColourByGenre, theme, setTheme }), [colourByGenre, setColourByGenre, theme, setTheme])
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider')
  return ctx
}
