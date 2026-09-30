// `?tab=` lives next to the Query in the URL (song `?tab=record|raw`, state
// `?tab=melodies|...`). The Query codec ignores it, so these helpers read and re-attach it.

export function readTab<T extends string>(search: string, allowed: readonly T[], fallback: T): T {
  const v = new URLSearchParams(search).get('tab')
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

/** Attach `tab` to a canonical query search string; the default tab is omitted. */
export function withTab(search: string, tab: string, fallback: string): string {
  const base = search.startsWith('?') ? search.slice(1) : search
  if (tab === fallback) return base ? `?${base}` : ''
  const part = `tab=${encodeURIComponent(tab)}`
  return base ? `?${base}&${part}` : `?${part}`
}
