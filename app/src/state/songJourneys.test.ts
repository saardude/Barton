// Song -> journeys lookup: by songIds, by stop songIds, by collectionId, several journeys, none.
import { describe, expect, it } from 'vitest'
import { fixtureJourneys } from './journeys.fixture'
import type { Journey } from './journeys'
import { journeysForSong, stopPlaceName } from './songJourneys'
import { fixtureIndex } from '../test/fixture'

const index = fixtureIndex()
const song = (id: string) => index.songById.get(id)!

describe('journeysForSong', () => {
  it('finds the journey and the stop that lists the record (stop n of m)', () => {
    const refs = journeysForSong(song('bsys-8'), fixtureJourneys)
    expect(refs.map((r) => r.journey.id)).toEqual(['J-1910-07-01'])
    expect(refs[0].stop?.seq).toBe(1)
    expect(refs[0].stopIndex).toBe(1)
    expect(refs[0].stopCount).toBe(2)
    expect(refs[0].quality).toBe('dates')
    expect(stopPlaceName(refs[0].stop!)).toBe('Beiuș (Belényes)')
    const last = journeysForSong(song('rfm-3'), fixtureJourneys)[0]
    expect(last.journey.id).toBe('J-1913-03-01')
    expect(last.stopIndex).toBe(3)
    expect(last.stopCount).toBe(3)
  })

  it('matches a journey by top-level songIds when no stop lists the record, and by collectionId', () => {
    const j: Journey = { ...fixtureJourneys[1], id: 'J-x', songIds: ['bsys-1'], stops: [] }
    const refs = journeysForSong(song('bsys-1'), [j])
    expect(refs.length).toBe(1)
    expect(refs[0].stop).toBeUndefined()
    expect(refs[0].stopIndex).toBeUndefined()
    expect(refs[0].stopCount).toBe(0)
    // index trip via journey.collectionId -> gyuj-<id>
    const withCollection = { ...song('bsys-1'), journey: { collectionId: '50', label: null } }
    expect(journeysForSong(withCollection, fixtureJourneys).map((r) => r.journey.id)).toEqual(['gyuj-50'])
    expect(journeysForSong(withCollection, fixtureJourneys)[0].title).toBe(
      'Upper region of the river Fekete-Koros',
    )
  })

  it('lists every journey the record is on, best-documented first', () => {
    const curatedLike: Journey = {
      ...fixtureJourneys[0],
      id: 'gyuj-99',
      recordCount: 5,
      songIds: ['bsys-8'],
      stops: [],
    }
    const refs = journeysForSong(song('bsys-8'), [...fixtureJourneys, curatedLike])
    expect(refs.map((r) => r.journey.id)).toEqual(['gyuj-99', 'J-1910-07-01'])
    expect(refs.map((r) => r.quality)).toEqual(['documented', 'dates'])
  })

  it('returns nothing for a record on no journey', () => {
    expect(journeysForSong(song('bsys-1'), fixtureJourneys)).toEqual([])
    expect(journeysForSong(song('bsys-8'), [])).toEqual([])
  })
})
