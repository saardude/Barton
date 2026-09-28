// QA 3.6: prevNext(id, filteredIds) at start, middle and end; no wraparound; unknown id.
import { describe, expect, it } from 'vitest'
import { fixtureIndex, fixtureSongs } from '../test/fixture'
import { DEFAULT_QUERY } from './query'
import { derive } from './selectors'
import { prevNext } from './songNav'

const ids = ['a', 'b', 'c', 'd']

describe('prevNext (AC-19)', () => {
  it('first record: no previous, next is the second', () => {
    expect(prevNext('a', ids)).toEqual({ index: 0, total: 4, prevId: null, nextId: 'b' })
  })
  it('middle record: both neighbours', () => {
    expect(prevNext('c', ids)).toEqual({ index: 2, total: 4, prevId: 'b', nextId: 'd' })
  })
  it('last record: no next (no wraparound)', () => {
    expect(prevNext('d', ids)).toEqual({ index: 3, total: 4, prevId: 'c', nextId: null })
  })
  it('a single-record set has neither neighbour', () => {
    expect(prevNext('a', ['a'])).toEqual({ index: 0, total: 1, prevId: null, nextId: null })
  })
  it('an id outside the set (or unknown) returns null', () => {
    expect(prevNext('zzz', ids)).toBeNull()
    expect(prevNext('a', [])).toBeNull()
  })
  it('follows the filtered and sorted set of the default query over the fixture', () => {
    const index = fixtureIndex()
    const derived = derive({ query: { ...DEFAULT_QUERY, sort: 'year', dir: 'desc' }, index, searchIds: null })
    const sortedIds = derived.sortedSongs.map((s) => s.id)
    const first = sortedIds[0]
    const pos = prevNext(first, sortedIds)
    expect(pos?.prevId).toBeNull()
    expect(pos?.nextId).toBe(sortedIds[1])
    expect(pos?.total).toBe(derived.filteredSongs.length)
    // the Hungarian record is outside the default (country = ro) set
    const hu = fixtureSongs.find((s) => s.location.placeId === 'hu/unresolved/ujszasz')
    expect(hu).toBeDefined()
    expect(prevNext(hu!.id, sortedIds)).toBeNull()
  })
})
