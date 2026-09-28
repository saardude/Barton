// MiniSearch over the fields FRONTEND-SPEC section 4 lists, with the diacritics normaliser as
// processTerm for both indexing and querying (AC-12, AC-13). Shared by the main thread and the worker.
import MiniSearch from 'minisearch'
import { normalize } from '../state/normalize'
import type { Song } from '../types/song'

export interface SearchDoc {
  id: string
  title: string
  incipit: string
  text: string
  village: string
  villageHistorical: string
  county: string
  countyHistorical: string
  performer: string
  collector: string
  referenceCode: string
}

export const SEARCH_FIELDS: (keyof SearchDoc)[] = [
  'title',
  'incipit',
  'text',
  'village',
  'villageHistorical',
  'county',
  'countyHistorical',
  'performer',
  'collector',
  'referenceCode',
]

export const MIN_QUERY_LENGTH = 2

export function toSearchDoc(s: Song): SearchDoc {
  return {
    id: s.id,
    title: s.title ?? '',
    incipit: s.incipit ?? '',
    text: s.text ?? '',
    village: s.location.village ?? '',
    villageHistorical: s.location.villageHistorical ?? '',
    county: s.location.county ?? '',
    countyHistorical: s.location.countyHistorical ?? '',
    performer: s.performer.name ?? '',
    collector: s.collector ?? '',
    referenceCode: s.source.referenceCode ?? '',
  }
}

/** Tokenise on whitespace and punctuation but keep letters with diacritics together (normalize folds them). */
function tokenize(text: string): string[] {
  return text.split(/[\s,;:!?()[\]"'/\\|]+/u).filter(Boolean)
}

export function createMiniSearch(): MiniSearch<SearchDoc> {
  return new MiniSearch<SearchDoc>({
    fields: SEARCH_FIELDS,
    storeFields: [],
    idField: 'id',
    tokenize,
    processTerm: (term) => {
      const n = normalize(term)
      return n.length ? n : null
    },
    searchOptions: {
      prefix: true,
      fuzzy: 0.1,
      combineWith: 'AND',
      boost: { title: 3, village: 2, villageHistorical: 2 },
    },
  })
}

export interface SearchService {
  /** Ids of matching records, in relevance order. Returns null when the query is too short (no constraint). */
  search(q: string): Promise<string[] | null>
  dispose(): void
}

/** Same-thread implementation; used under the worker threshold and in unit tests. */
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
