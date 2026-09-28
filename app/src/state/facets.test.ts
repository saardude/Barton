import { describe, expect, it } from 'vitest'
import { fixtureIndex, fixtureSongs } from '../test/fixture'
import { applyPatch, DEFAULT_QUERY, GENRE_ORDER, type Query } from './query'
import { derive, type PlaceNode } from './selectors'
import { find } from '../test/tree'

const index = fixtureIndex()
const run = (patch: Partial<Query>) => derive({ query: applyPatch(DEFAULT_QUERY, patch), index, searchIds: null })
const sum = (m: Map<string, number>, keys?: string[]) =>
  [...m.entries()].filter(([k]) => !keys || keys.includes(k)).reduce((n, [, v]) => n + v, 0)

describe('facet counting (QA 3.3)', () => {
  it('counts for facet F ignore F itself, so options in the active facet keep their counts', () => {
    const none = run({ county: 'ro/crisana/bihor' })
    const withGenre = run({ county: 'ro/crisana/bihor', genre: ['joc'] })
    expect(withGenre.facetCounts.genre).toEqual(none.facetCounts.genre)
    expect(withGenre.facetCounts.genre.get('colinda')).toBeGreaterThan(0)
    // other facets do see the genre filter
    expect(sum(withGenre.facetCounts.style)).toBeLessThan(sum(none.facetCounts.style))
  })

  it('the sum of genre counts equals the size of the set filtered by everything except genre', () => {
    const d = run({ county: 'ro/crisana/bihor', genre: ['joc'], yearFrom: 1910 })
    const exceptGenre = run({ county: 'ro/crisana/bihor', yearFrom: 1910 }).filteredSongs
    expect(sum(d.facetCounts.genre, [...GENRE_ORDER, 'null'])).toBe(exceptGenre.length)
  })

  it('zero-count options are reported with 0, in the fixed order', () => {
    const d = run({ village: 'ro/crisana/bihor/beius' })
    expect([...d.facetCounts.genre.keys()].slice(0, GENRE_ORDER.length)).toEqual(GENRE_ORDER)
    expect(d.facetCounts.genre.get('doina')).toBe(2)
    expect(d.facetCounts.instrument.get('bagpipe')).toBe(0)
    expect(d.facetCounts.performance.get('mixed')).toBe(0)
  })

  it('place tree counts equal the sum of the children plus county-level records', () => {
    const d = run({ genre: ['cantec', 'colinda', 'joc', 'nunta', 'doina', 'bocet', 'other'] })
    const check = (n: PlaceNode) => {
      if (n.children.length) {
        const childSum = n.children.reduce((s, c) => s + c.count, 0)
        expect(n.count).toBe(childSum)
        n.children.forEach(check)
      }
    }
    d.placeTree.forEach(check)
    const bihor = find(d.placeTree, 'ro/crisana/bihor')!
    const unknown = bihor.children.find((c) => c.synthetic === 'village-unknown')!
    expect(unknown).toBeDefined()
    expect(unknown.count).toBe(fixtureSongs.filter((s) => s.location.placeId === 'ro/crisana/bihor' && s.genre).length)
  })

  it('tree counts use every predicate except place, so siblings keep their counts', () => {
    const d = run({ county: 'ro/crisana/bihor', genre: ['joc'] })
    const cluj = find(d.placeTree, 'ro/transylvania/cluj')!
    expect(cluj.count).toBe(fixtureSongs.filter((s) => s.genre === 'joc' && s.location.placeId?.startsWith('ro/transylvania/cluj')).length)
  })

  it('counts are stable under sort', () => {
    const a = run({ county: 'ro/crisana/bihor', sort: 'title' })
    const b = run({ county: 'ro/crisana/bihor', sort: 'year', dir: 'desc' })
    expect(a.facetCounts).toEqual(b.facetCounts)
    expect(a.placeTree).toEqual(b.placeTree)
    expect(a.filteredSongs.length).toBe(b.filteredSongs.length)
  })

  it('"N of M": total is the country-only set (every country when none is selected)', () => {
    const d = run({ county: 'ro/crisana/bihor', genre: ['joc'] })
    expect(d.total).toBe(fixtureSongs.filter((s) => s.location.country === 'RO').length)
    expect(run({ genre: ['joc'] }).total).toBe(fixtureSongs.length)
    expect(d.filteredSongs.length).toBeLessThan(d.total)
  })
})
