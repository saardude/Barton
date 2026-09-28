// Web worker: builds the MiniSearch index off the main thread (ARCHITECTURE.md, > 5,000 records)
// and answers search queries with arrays of record ids.
import { createMiniSearch, searchIds, type SearchDoc } from './search'
import type MiniSearch from 'minisearch'

type InMessage = { type: 'init'; docs: SearchDoc[] } | { type: 'search'; id: number; q: string }
type OutMessage = { type: 'ready'; count: number } | { type: 'result'; id: number; ids: string[] | null }

let index: MiniSearch<SearchDoc> | null = null

self.onmessage = (ev: MessageEvent<InMessage>) => {
  const msg = ev.data
  if (msg.type === 'init') {
    index = createMiniSearch()
    index.addAll(msg.docs)
    post({ type: 'ready', count: msg.docs.length })
  } else if (msg.type === 'search') {
    post({ type: 'result', id: msg.id, ids: index ? searchIds(index, msg.q) : null })
  }
}

function post(m: OutMessage): void {
  ;(self as unknown as Worker).postMessage(m)
}
