import { describe, expect, it } from 'vitest'
import { fixtureIndex } from '../test/fixture'
import { applyPatch, DEFAULT_QUERY, type Query } from './query'
import { decodeQuery, encodeQuery } from './urlCodec'

const index = fixtureIndex()
const opts = { placeExists: index.placeExists }

describe('URL codec round trip (QA 3.1)', () => {
  const canonical = [
    '',
    'q=sculati',
    'q=Beiu%C8%99',
    'q=boieri+mari',
    'country=ro',
    'country=hu',
    'region=ro/crisana',
    'county=ro/crisana/bihor',
    'village=ro/crisana/bihor/beius',
    'village=ro/crisana/bihor/unknown',
    'genre=colinda',
    'genre=colinda,joc',
    'genre=bocet,colinda,doina,joc,nunta,cantec,other',
    'style=old%20style',
    'style=new%20style,old%20style',
    'style=a%2Cb',
    'perf=vocal',
    'instr=fluier,violin',
    'from=1909',
    'to=1912',
    'from=1909&to=1912',
    'sort=year',
    'sort=year&dir=desc',
    'dir=desc',
    'page=3',
    'unmapped=1',
    'trip=t-1909-07-bihor',
    'trip=t-1909-07-bihor&stop=3',
    'date=1910-02',
    'borders=1910',
    'q=sculati&county=ro/crisana/bihor&genre=colinda,joc&style=old%20style&perf=vocal&instr=fluier&from=1909&to=1912&sort=year&dir=desc&page=2&unmapped=1',
    'village=ro/crisana/bihor/ineu&genre=joc&sort=source',
  ]
  it.each(canonical)('encode(decode(%j)) is identity', (s) => {
    const { query, warnings } = decodeQuery(s, opts)
    expect(warnings).toEqual([])
    expect(encodeQuery(query)).toBe(s)
  })

  it('decode(encode(q)) deep-equals q for 200 seeded queries', () => {
    let seed = 42
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)]
    const maybe = <T>(v: T): T | undefined => (rnd() < 0.5 ? v : undefined)
    for (let i = 0; i < 200; i++) {
      const place = pick([
        {},
        { country: 'ro' },
        { country: 'hu' },
        { region: 'ro/crisana' },
        { county: 'ro/transylvania/cluj' },
        { village: 'ro/crisana/bihor/beius' },
      ])
      const q = applyPatch(DEFAULT_QUERY, {
        q: pick(['', 'sculati', 'Beiuș', 'a b']),
        ...place,
        genre: pick([[], ['colinda'], ['joc', 'colinda'], ['other']]),
        style: pick([[], ['old style'], ['new style', 'old style'], ['a,b']]),
        performance: maybe(pick(['vocal', 'instrumental', 'mixed', 'unknown'] as const)),
        instrument: pick([[], ['violin'], ['fluier', 'violin']]),
        yearFrom: maybe(1900 + Math.floor(rnd() * 40)),
        yearTo: maybe(1900 + Math.floor(rnd() * 40)),
        sort: pick(['title', 'style', 'location', 'year', 'source'] as const),
        dir: pick(['asc', 'desc'] as const),
        unmapped: maybe(true),
      })
      const page = 1 + Math.floor(rnd() * 5)
      const withPage: Query = { ...q, page }
      const back = decodeQuery(encodeQuery(withPage), opts).query
      expect(back).toEqual(withPage)
    }
  })

  it('canonical ordering: param order in the input does not matter', () => {
    const a = decodeQuery('genre=joc,colinda&county=ro/crisana/bihor', opts).query
    const b = decodeQuery('county=ro/crisana/bihor&genre=colinda,joc', opts).query
    expect(a).toEqual(b)
    expect(encodeQuery(a)).toBe('county=ro/crisana/bihor&genre=colinda,joc')
    expect(encodeQuery(b)).toBe(encodeQuery(a))
  })

  it('defaults are omitted: the default query encodes to ""', () => {
    expect(encodeQuery(DEFAULT_QUERY)).toBe('')
    expect(decodeQuery('?', opts).query).toEqual(DEFAULT_QUERY)
    expect(decodeQuery('sort=title&dir=asc&page=1', opts).query).toEqual(DEFAULT_QUERY)
    // no country by default; `country=all` is a legacy alias for the default
    expect(decodeQuery('country=all', opts).query).toEqual(DEFAULT_QUERY)
    expect(decodeQuery('country=ro', opts).query).toEqual({ ...DEFAULT_QUERY, country: 'ro' })
  })

  it('tolerates unknown or malformed values and names what it dropped', () => {
    const { query, warnings } = decodeQuery('from=abc&sort=nope&genre=&dir=sideways&perf=loud&foo=bar&page=0&x', opts)
    expect(query).toEqual(DEFAULT_QUERY)
    expect(warnings.join('\n')).toMatch(/from/)
    expect(warnings.join('\n')).toMatch(/sort/)
    expect(warnings.join('\n')).toMatch(/dir/)
    expect(warnings.join('\n')).toMatch(/perf/)
    expect(warnings.join('\n')).toMatch(/foo/)
    expect(warnings.join('\n')).toMatch(/page/)
    expect(warnings.some((w) => w.includes('genre'))).toBe(false) // empty list means none, not an error
  })

  it('drops unknown ids and genres with a warning, never throws', () => {
    const r = decodeQuery('county=ro/nowhere/x&genre=ballad,colinda&village=%E0%A4%A', opts)
    expect(r.query.county).toBeUndefined()
    expect(r.query.genre).toEqual(['colinda'])
    expect(r.warnings.length).toBeGreaterThanOrEqual(2)
  })

  it('the deepest place wins and fills its ancestors; a disagreeing shallower param is ignored', () => {
    const r = decodeQuery('region=ro/transylvania&county=ro/crisana/bihor', opts)
    expect(r.query.county).toBe('ro/crisana/bihor')
    expect(r.query.region).toBe('ro/crisana')
    expect(r.query.country).toBe('ro')
    expect(r.warnings.length).toBe(1)
    expect(encodeQuery(r.query)).toBe('county=ro/crisana/bihor')
    const same = decodeQuery('region=ro/crisana&county=ro/crisana/bihor', opts)
    expect(same.warnings).toEqual([])
    expect(same.query).toEqual(r.query)
  })

  it('a literal comma in a value survives as %2C; + and %20 both mean space', () => {
    expect(decodeQuery('style=a%2Cb,c', opts).query.style).toEqual(['a,b', 'c'])
    expect(decodeQuery('q=a+b', opts).query.q).toBe('a b')
    expect(decodeQuery('q=a%20b', opts).query.q).toBe('a b')
  })

  it('repeated single params take the last occurrence; inverted years are swapped', () => {
    expect(decodeQuery('sort=year&sort=style', opts).query.sort).toBe('style')
    const q = decodeQuery('from=1920&to=1910', opts).query
    expect(q.yearFrom).toBe(1910)
    expect(q.yearTo).toBe(1920)
  })
})

describe('Query invariants', () => {
  it('setting a village fills its ancestors, setting a county clears the village', () => {
    let q = applyPatch(DEFAULT_QUERY, { village: 'ro/crisana/bihor/beius' })
    expect(q).toMatchObject({ country: 'ro', region: 'ro/crisana', county: 'ro/crisana/bihor', village: 'ro/crisana/bihor/beius' })
    q = applyPatch(q, { county: 'ro/transylvania/cluj' })
    expect(q.village).toBeUndefined()
    expect(q.region).toBe('ro/transylvania')
    q = applyPatch(q, { county: undefined })
    expect(q.region).toBe('ro/transylvania')
    expect(q.county).toBeUndefined()
    q = applyPatch(q, { country: 'all' })
    expect(q.country).toBeUndefined()
    expect(q.region).toBeUndefined()
    expect(applyPatch(q, { country: 'ro' }).country).toBe('ro')
  })
  it('non-page changes reset the page; sort and dir keep it; arrays are deduplicated and ordered', () => {
    let q = applyPatch(DEFAULT_QUERY, { page: 4 })
    q = applyPatch(q, { sort: 'year' })
    expect(q.page).toBe(4)
    q = applyPatch(q, { genre: ['joc', 'colinda', 'joc'] })
    expect(q.page).toBe(1)
    expect(q.genre).toEqual(['colinda', 'joc'])
    expect(applyPatch(q, { style: ['old style', 'new style', 'old style'] }).style).toEqual(['new style', 'old style'])
  })
})
