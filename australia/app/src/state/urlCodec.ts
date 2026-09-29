// Hand-written URL codec. Place ids keep their slashes, list params use raw commas, `%2C` inside
// a value is a literal comma, `+` and `%20` both decode to a space. Decoding never throws; every
// dropped item is named in `warnings`.
import { applyPatch, DEFAULT_QUERY, isKind, isSortKey, isTune, placeLevelOf, type Kind, type Query } from './query'

export interface DecodeOptions {
  placeExists?: (id: string) => boolean
  papers?: ReadonlySet<string>
  books?: ReadonlySet<string>
}

export interface DecodeResult {
  query: Query
  warnings: string[]
}

const PARAM_ORDER = ['q', 'place', 'kind', 'paper', 'book', 'singer', 'collector', 'author', 'tune', 'from', 'to', 'sort', 'dir', 'page', 'unmapped'] as const
const KNOWN = new Set<string>(PARAM_ORDER)

function enc(v: string): string {
  return encodeURIComponent(v).replace(/%2F/gi, '/')
}
function encQ(v: string): string {
  return enc(v).replace(/%20/g, '+')
}
function dec(v: string): string {
  try {
    return decodeURIComponent(v.replace(/\+/g, ' '))
  } catch {
    return v
  }
}

/** Encode a query to its canonical string (no leading `?`; empty for the default query). */
export function encodeQuery(q: Query): string {
  const parts: string[] = []
  const put = (k: string, v: string) => parts.push(`${k}=${v}`)
  if (q.q.trim()) put('q', encQ(q.q.trim()))
  if (q.place) put('place', enc(q.place))
  if (q.kind.length) put('kind', q.kind.map(enc).join(','))
  if (q.paper.length) put('paper', q.paper.map(enc).join(','))
  if (q.book.length) put('book', q.book.map(enc).join(','))
  if (q.singer.length) put('singer', q.singer.map(enc).join(','))
  if (q.collector.length) put('collector', q.collector.map(enc).join(','))
  if (q.author.length) put('author', q.author.map(enc).join(','))
  if (q.tune) put('tune', q.tune)
  if (q.yearFrom !== undefined) put('from', String(q.yearFrom))
  if (q.yearTo !== undefined) put('to', String(q.yearTo))
  if (q.sort !== 'title') put('sort', q.sort)
  if (q.dir !== 'asc') put('dir', q.dir)
  if (q.page > 1) put('page', String(q.page))
  if (q.unmapped) put('unmapped', '1')
  return parts.join('&')
}

function pairs(search: string): [string, string][] {
  const s = search.startsWith('?') ? search.slice(1) : search
  if (!s) return []
  return s
    .split('&')
    .filter(Boolean)
    .map((p) => {
      const i = p.indexOf('=')
      return i < 0 ? [dec(p), ''] : [dec(p.slice(0, i)), p.slice(i + 1)]
    })
}

export function decodeQuery(search: string, opts: DecodeOptions = {}): DecodeResult {
  const warnings: string[] = []
  const raw = new Map<string, string>()
  for (const [k, v] of pairs(search)) {
    if (k === 'tab') continue // belongs to the song / state routes
    if (!KNOWN.has(k)) {
      warnings.push(`unknown param "${k}" ignored`)
      continue
    }
    raw.set(k, v)
  }
  const list = (k: string): string[] => {
    const v = raw.get(k)
    if (v === undefined) return []
    return v
      .split(',')
      .map(dec)
      .map((x) => x.trim())
      .filter(Boolean)
  }
  const single = (k: string): string | undefined => {
    const v = raw.get(k)
    return v === undefined ? undefined : dec(v)
  }
  const int = (k: string): number | undefined => {
    const v = single(k)
    if (v === undefined) return undefined
    if (!/^-?\d+$/.test(v.trim())) {
      warnings.push(`non-integer ${k}="${v}" ignored`)
      return undefined
    }
    return parseInt(v, 10)
  }

  const patch: Partial<Query> = {}
  const q = single('q')
  if (q !== undefined) patch.q = q

  const place = single('place')
  if (place) {
    if (!placeLevelOf(place)) warnings.push(`place="${place}" is not a place id, ignored`)
    else if (opts.placeExists && !opts.placeExists(place)) warnings.push(`unknown place "${place}" dropped`)
    else patch.place = place
  }

  const kinds: Kind[] = []
  for (const k of list('kind')) {
    if (isKind(k)) kinds.push(k)
    else warnings.push(`unknown kind "${k}" dropped`)
  }
  if (raw.has('kind')) patch.kind = kinds

  const papers: string[] = []
  for (const p of list('paper')) {
    if (opts.papers && !opts.papers.has(p)) warnings.push(`unknown newspaper "${p}" dropped`)
    else papers.push(p)
  }
  if (raw.has('paper')) patch.paper = papers

  const books: string[] = []
  for (const b of list('book')) {
    if (opts.books && !opts.books.has(b)) warnings.push(`unknown songbook "${b}" dropped`)
    else books.push(b)
  }
  if (raw.has('book')) patch.book = books

  if (raw.has('singer')) patch.singer = list('singer')
  if (raw.has('collector')) patch.collector = list('collector')
  if (raw.has('author')) patch.author = list('author')

  const tune = single('tune')
  if (tune !== undefined) {
    if (isTune(tune)) patch.tune = tune
    else warnings.push(`unknown tune "${tune}" dropped`)
  }

  const from = int('from')
  if (from !== undefined) patch.yearFrom = from
  const to = int('to')
  if (to !== undefined) patch.yearTo = to

  const sort = single('sort')
  if (sort !== undefined) {
    if (isSortKey(sort)) patch.sort = sort
    else warnings.push(`unknown sort "${sort}" dropped`)
  }
  const dir = single('dir')
  if (dir !== undefined) {
    if (dir === 'asc' || dir === 'desc') patch.dir = dir
    else warnings.push(`unknown dir "${dir}" dropped`)
  }
  const page = int('page')
  if (page !== undefined) {
    if (page >= 1) patch.page = page
    else warnings.push(`page=${page} out of range, ignored`)
  }
  const unmapped = single('unmapped')
  if (unmapped !== undefined) {
    if (unmapped === '1' || unmapped === 'true') patch.unmapped = true
    else warnings.push(`unmapped="${unmapped}" ignored`)
  }

  let query = applyPatch(DEFAULT_QUERY, patch)
  if (patch.page !== undefined) query = { ...query, page: patch.page }
  return { query, warnings }
}

/** `?...` for use in links; empty string when the query is the default. */
export function toSearch(q: Query): string {
  const s = encodeQuery(q)
  return s ? `?${s}` : ''
}
