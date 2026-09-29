import { describe, expect, it } from 'vitest'
import { fixtureIndex, fixtureSongs } from '../test/fixture'
import { pageNumber, sortSongs } from './sort'

const index = fixtureIndex()
const lookup = (id: string) => index.placeById.get(id)

describe('sort', () => {
  it('year: unknown years last in both directions', () => {
    const asc = sortSongs(fixtureSongs, 'year', 'asc', lookup)
    const desc = sortSongs(fixtureSongs, 'year', 'desc', lookup)
    const known = (list: typeof asc) => list.filter((s) => s.year.value !== null).map((s) => s.year.value as number)
    expect(known(asc)).toEqual([...known(asc)].sort((a, b) => a - b))
    expect(known(desc)).toEqual([...known(desc)].sort((a, b) => b - a))
    expect(asc[asc.length - 1].year.value).toBeNull()
    expect(desc[desc.length - 1].year.value).toBeNull()
  })

  it('number: by page number, with a lettered page after its number', () => {
    const asc = sortSongs(fixtureSongs, 'number', 'asc', lookup)
    const nums = asc.map(pageNumber)
    expect(nums).toEqual([...nums].sort((a, b) => a - b))
    expect(pageNumber({ source: { siteId: '052a' } } as never)).toBe(52.5)
  })

  it('location: unplaced records last', () => {
    const asc = sortSongs(fixtureSongs, 'location', 'asc', lookup)
    const firstNull = asc.findIndex((s) => s.location.placeId === null)
    if (firstNull >= 0) for (const s of asc.slice(firstNull)) expect(s.location.placeId).toBeNull()
  })

  it('is deterministic under shuffling', () => {
    const shuffled = [...fixtureSongs].reverse()
    expect(sortSongs(shuffled, 'title', 'asc', lookup).map((s) => s.id)).toEqual(sortSongs(fixtureSongs, 'title', 'asc', lookup).map((s) => s.id))
  })
})
