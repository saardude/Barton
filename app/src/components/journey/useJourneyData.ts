// Lazy loaders for the journey mapper's files (villages, context events, border sets): fetched
// on first use through the content-hashed manifest and cached for the session (MAP-SPEC 11.4).
// journeys.json itself already arrives with the catalogue (app/catalog.tsx).
import { useEffect, useMemo, useState } from 'react'
import { useCatalogReady } from '../../app/catalog'
import { manifest } from '../../app/manifest'
import { buildVillageLookup, isJourney, type BorderFile, type ContextEvent, type ContextEventsFile, type Era, type Journey, type VillageLookup, type VillagesFile } from '../../state/journeys'

const cache = new Map<string, Promise<unknown>>()

function loadJson<T>(name: string): Promise<T> {
  const url = manifest[name]
  if (!url) return Promise.reject(new Error(`data file "${name}" is not in the manifest`))
  let p = cache.get(name)
  if (!p) {
    p = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
      return res.json() as Promise<unknown>
    })
    p.catch(() => cache.delete(name))
    cache.set(name, p)
  }
  return p as Promise<T>
}

export interface Loaded<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

/** Load one manifest file once; `enabled: false` leaves it untouched. */
export function useJson<T>(name: string | null): Loaded<T> {
  const [state, setState] = useState<{ name: string | null; data: T | null; error: Error | null }>({ name: null, data: null, error: null })
  useEffect(() => {
    if (!name) return
    let cancelled = false
    loadJson<T>(name)
      .then((data) => {
        if (!cancelled) setState({ name, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ name, data: null, error: err instanceof Error ? err : new Error(String(err)) })
      })
    return () => {
      cancelled = true
    }
  }, [name])
  if (!name) return { data: null, error: null, loading: false }
  if (state.name !== name) return { data: null, error: null, loading: true }
  return { data: state.data, error: state.error, loading: false }
}

/** The full journeys from the catalogue (already fetched), typed. */
export function useJourneys(): Journey[] {
  const catalog = useCatalogReady()
  return useMemo(() => (catalog ? catalog.journeys.filter(isJourney) : []), [catalog])
}

export function useVillages(): Loaded<VillageLookup> {
  const file = useJson<VillagesFile>(manifest.villages ? 'villages' : null)
  const lookup = useMemo(() => (file.data ? buildVillageLookup(file.data) : null), [file.data])
  return { data: lookup, error: file.error, loading: file.loading }
}

export function useContextEvents(): Loaded<ContextEvent[]> {
  const file = useJson<ContextEventsFile | ContextEvent[]>(manifest['context-events'] ? 'context-events' : null)
  const events = useMemo(() => (file.data ? (Array.isArray(file.data) ? file.data : (file.data.events ?? [])) : null), [file.data])
  return { data: events, error: file.error, loading: file.loading }
}

export function borderFileName(set: Era | 'now'): string {
  return `geo/borders-${set}`
}

/** Historical sets present in the manifest (any `geo/borders-<year>` file counts as an era). */
export function availableEras(): Era[] {
  return (['1910', '1914', '1920'] as Era[]).filter((e) => Boolean(manifest[borderFileName(e)]))
}

export function useBorderFile(set: Era | 'now' | null): Loaded<BorderFile> {
  const name = set && manifest[borderFileName(set)] ? borderFileName(set) : null
  const loaded = useJson<BorderFile>(name)
  if (set && !name) return { data: null, error: new Error(`border set ${set} not shipped`), loading: false }
  return loaded
}
