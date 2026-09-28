// Chooses the search implementation: a worker above WORKER_THRESHOLD records (when Workers exist),
// the same code on the main thread otherwise. The interface is identical (FRONTEND-SPEC 3.2).
import { createLocalSearch, toSearchDoc, type SearchDoc, type SearchService } from './search'
import type { Song } from '../types/song'

export const WORKER_THRESHOLD = 5000

export function createSearchService(songs: Song[]): SearchService {
  const docs = songs.map(toSearchDoc)
  if (songs.length > WORKER_THRESHOLD && typeof Worker !== 'undefined' && typeof window !== 'undefined') {
    try {
      return createWorkerSearch(docs)
    } catch {
      // fall through to the main thread
    }
  }
  return createLocalSearch(docs)
}

function createWorkerSearch(docs: SearchDoc[]): SearchService {
  const worker = new Worker(new URL('./catalog.worker.ts', import.meta.url), { type: 'module' })
  let ready: () => void = () => {}
  const readyPromise = new Promise<void>((resolve) => {
    ready = resolve
  })
  let seq = 0
  const pending = new Map<number, (ids: string[] | null) => void>()
  worker.onmessage = (ev: MessageEvent<{ type: string; id?: number; ids?: string[] | null }>) => {
    const m = ev.data
    if (m.type === 'ready') ready()
    else if (m.type === 'result' && m.id !== undefined) {
      pending.get(m.id)?.(m.ids ?? null)
      pending.delete(m.id)
    }
  }
  worker.postMessage({ type: 'init', docs })
  return {
    search: async (q) => {
      if (q.trim().length < 2) return null
      await readyPromise
      const id = ++seq
      return new Promise((resolve) => {
        pending.set(id, resolve)
        worker.postMessage({ type: 'search', id, q })
      })
    },
    dispose: () => worker.terminate(),
  }
}
