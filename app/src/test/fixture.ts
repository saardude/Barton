// Loads the 40-record fixture (scripts/make-fixture.mjs) and builds the index for unit tests.
import { buildIndex, type CatalogIndex } from '../data/catalogIndex'
import { hydrateSongs } from '../data/hydrate'
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import placesJson from './fixtures/places.small.json'
import songsJson from './fixtures/songs.small.json'

export const fixturePlaces = placesJson as unknown as Place[]
export const fixtureSongs: Song[] = hydrateSongs(songsJson, fixturePlaces)

export function fixtureIndex(songs: Song[] = fixtureSongs): CatalogIndex {
  return buildIndex(songs, fixturePlaces)
}

/** Deterministic shuffle (LCG) for order-independence tests. */
export function shuffled<T>(arr: T[], seed = 7): T[] {
  const out = [...arr]
  let s = seed
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
