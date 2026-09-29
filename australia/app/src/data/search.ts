// MiniSearch over title, first line, lyrics, notes, people and places, with the folding
// normaliser as processTerm for both indexing and querying.
import MiniSearch from 'minisearch'
import { normalize } from '../state/normalize'
import type { Song } from '../types/song'

export interface SearchDoc {
  id: string
  title: string
  titleAlt: string
  incipit: string
  text: string
  notes: string
  newspaper: string
  town: string
  state: string
  people: string
  pageId: string
}

export const SEARCH_FIELDS: (keyof SearchDoc)[] = ['title', 'titleAlt', 'incipit', 'text', 'notes', 'newspaper', 'town', 'state', 'people', 'pageId']

export const MIN_QUERY_LENGTH = 2

export function toSearchDoc(s: Song): SearchDoc {
  return {
    id: s.id,
    title: s.title,
    titleAlt: s.titleAlt.join(' '),
    incipit: s.text.incipit ?? '',
    text: s.text.stanzas.map((st) => st.join(' ')).join(' '),
    notes: s.notes.text ?? '',
    newspaper: s.provenance.newspaper?.title ?? '',
    town: s.location.town ?? '',
    state: s.location.state ?? '',
    people: [...s.provenance.singers, ...s.provenance.collectors, s.author.name ?? ''].join(' '),
    pageId: s.source.siteId,
  }
}

function tokenize(text: string): string[] {
  return text.split(/[\s,;:!?()[\]"/\\|.]+/u).filter(Boolean)
}

export function createMiniSearch(): MiniSearch<SearchDoc> {
  return new MiniSearch<SearchDoc>({
    fields: SEARCH_FIELDS,
    storeFields: [],
    idField: 'id',
    tokenize,
    processTerm: (term) => {
      const n = normalize(term).replace(/^['‘’]+|['‘’]+$/g, '')
      return n.length ? n : null
    },
    searchOptions: {
      prefix: true,
      fuzzy: 0.1,
      combineWith: 'AND',
      boost: { title: 4, titleAlt: 3, incipit: 2, newspaper: 2, town: 2, people: 2 },
    },
  })
}

export interface SearchService {
  /** Ids of matching records in relevance order; null when the query is too short (no constraint). */
  search(q: string): Promise<string[] | null>
  dispose(): void
}

export function createLocalSearch(docs: SearchDoc[]): SearchService {
  const ms = createMiniSearch()
  ms.addAll(docs)
  return {
    search: async (q) => searchIds(ms, q),
    dispose: () => {},
  }
}

export function searchIds(ms: MiniSearch<SearchDoc>, q: string): string[] | null {
  const trimmed = q.trim()
  if (trimmed.length < MIN_QUERY_LENGTH) return null
  return ms.search(trimmed).map((r) => String(r.id))
}

/** About 1,100 records: the index builds on the main thread in a few milliseconds. */
export function createSearchService(songs: Song[]): SearchService {
  return createLocalSearch(songs.map(toSearchDoc))
}
