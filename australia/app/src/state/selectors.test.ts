import { describe, expect, it } from 'vitest'
import { fixtureIndex, fixtureSongs } from '../test/fixture'
import { applyPatch, DEFAULT_QUERY } from './query'
import { buildMapPoints, derive, filterSongs } from './selectors'

const index = fixtureIndex()

describe('derive', () => {
  it('returns every song for the default query, sorted by title with articles ignored', () => {
    const d = derive({ query: DEFAULT_QUERY, index, searchIds: null })
    expect(d.filteredSongs.length).toBe(fixtureSongs.length)
    const keys = d.sortedSongs.map((s) => s.title.toLowerCase().replace(/^(the|a|an) /, ''))
    const sorted = [...keys].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true, ignorePunctuation: true }))
    expect(keys).toEqual(sorted)
    expect(d.activeChips).toEqual([])
  })

  it('filters by place prefix and counts facets over the other predicates', () => {
    const nsw = derive({ query: applyPatch(DEFAULT_QUERY, { place: 'au/nsw' }), index, searchIds: null })
    expect(nsw.filteredSongs.length).toBeGreaterThan(0)
    for (const s of nsw.filteredSongs) expect(s.location.placeId?.startsWith('au/nsw')).toBe(true)
    // the place tree counts ignore the place predicate: Australia keeps its full count
    const au = nsw.placeTree.find((n) => n.id === 'au')
    expect(au?.count).toBe(fixtureSongs.filter((s) => s.location.placeId?.startsWith('au')).length)
    expect(nsw.activeChips[0]).toMatchObject({ key: 'place', value: 'au/nsw' })
  })

  it('kind, tune and year predicates compose with AND', () => {
    const q = applyPatch(DEFAULT_QUERY, { kind: ['song'], tune: 'midi', yearFrom: 1800, yearTo: 1950 })
    const d = derive({ query: q, index, searchIds: null })
    for (const s of d.filteredSongs) {
      expect(s.kind).toBe('song')
      expect(s.media.midi.length).toBeGreaterThan(0)
      expect(s.year.value).not.toBeNull()
    }
    expect(d.filteredSongs).toEqual(filterSongs(index.songs, d.predicates))
  })

  it('search ids constrain the set and an empty result yields no songs', () => {
    const first = fixtureSongs[0]
    const d = derive({ query: applyPatch(DEFAULT_QUERY, { q: 'xx' }), index, searchIds: [first.id] })
    expect(d.filteredSongs.map((s) => s.id)).toEqual([first.id])
    expect(derive({ query: applyPatch(DEFAULT_QUERY, { q: 'xx' }), index, searchIds: [] }).filteredSongs).toEqual([])
  })

  it('map points aggregate by state, then by town, north to south', () => {
    const states = buildMapPoints(fixtureSongs, index, 'state', undefined, undefined)
    const total = states.points.reduce((n, p) => n + p.count, 0) + states.unmappedCount
    expect(total).toBe(fixtureSongs.length)
    for (let i = 1; i < states.points.length; i++) expect(states.points[i - 1].lat).toBeGreaterThanOrEqual(states.points[i].lat)
    const towns = buildMapPoints(fixtureSongs, index, 'town', undefined, undefined)
    for (const p of towns.points) expect(p.place.type).toBe('town')
  })

  it('unmapped keeps only records without coordinates', () => {
    const d = derive({ query: applyPatch(DEFAULT_QUERY, { unmapped: true }), index, searchIds: null })
    for (const s of d.filteredSongs) expect(s.location.lat === null || s.location.lng === null).toBe(true)
  })
})
