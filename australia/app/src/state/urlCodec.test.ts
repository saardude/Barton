import { describe, expect, it } from 'vitest'
import { applyPatch, DEFAULT_QUERY } from './query'
import { decodeQuery, encodeQuery, toSearch } from './urlCodec'

describe('urlCodec', () => {
  it('encodes the default query as an empty string', () => {
    expect(encodeQuery(DEFAULT_QUERY)).toBe('')
    expect(toSearch(DEFAULT_QUERY)).toBe('')
  })

  it('round-trips every field in canonical order', () => {
    const q = applyPatch(DEFAULT_QUERY, {
      q: 'shearer strike',
      place: 'au/nsw/kiama',
      kind: ['poem', 'song'],
      paper: ['worker', 'kiama independent'],
      book: ['book-006'],
      singer: ['Sally Sloane'],
      collector: ['John Meredith'],
      author: ['Henry Lawson'],
      tune: 'midi',
      yearFrom: 1890,
      yearTo: 1900,
      sort: 'year',
      dir: 'desc',
      unmapped: true,
    })
    const s = encodeQuery({ ...q, page: 3 })
    expect(s).toBe(
      'q=shearer+strike&place=au/nsw/kiama&kind=song,poem&paper=kiama%20independent,worker&book=book-006&singer=Sally%20Sloane&collector=John%20Meredith&author=Henry%20Lawson&tune=midi&from=1890&to=1900&sort=year&dir=desc&page=3&unmapped=1',
    )
    const back = decodeQuery('?' + s)
    expect(back.warnings).toEqual([])
    expect(back.query).toEqual({ ...q, page: 3 })
  })

  it('drops unknown values with a warning and keeps the rest', () => {
    const r = decodeQuery('?kind=song,ballad&sort=nope&dir=up&page=0&tune=vinyl&foo=1&tab=raw')
    expect(r.query.kind).toEqual(['song'])
    expect(r.query.sort).toBe('title')
    expect(r.query.dir).toBe('asc')
    expect(r.query.page).toBe(1)
    expect(r.query.tune).toBeUndefined()
    expect(r.warnings.length).toBe(6)
  })

  it('validates places and newspapers against the catalogue when given', () => {
    const r = decodeQuery('?place=au/nsw/nowhere&paper=worker,ghost', { placeExists: (id) => id === 'au/nsw', papers: new Set(['worker']) })
    expect(r.query.place).toBeUndefined()
    expect(r.query.paper).toEqual(['worker'])
    expect(r.warnings).toEqual(['unknown place "au/nsw/nowhere" dropped', 'unknown newspaper "ghost" dropped'])
  })

  it('swaps a reversed year range and resets the page on a filter change', () => {
    const q = applyPatch({ ...DEFAULT_QUERY, page: 4 }, { yearFrom: 1900, yearTo: 1850 })
    expect(q.yearFrom).toBe(1850)
    expect(q.yearTo).toBe(1900)
    expect(q.page).toBe(1)
    expect(applyPatch({ ...DEFAULT_QUERY, page: 4 }, { sort: 'year' }).page).toBe(4)
  })
})
