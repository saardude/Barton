// Loads the 40-record fixture (scripts/make-fixture.mjs) and builds the index for unit tests.
import { buildIndex, type CatalogIndex } from '../data/catalogIndex'
import type { Place } from '../types/place'
import type { Song } from '../types/song'
import type { Sources } from '../types/sources'
import placesJson from './fixtures/places.small.json'
import songsJson from './fixtures/songs.small.json'
import sourcesJson from './fixtures/sources.small.json'

export const fixturePlaces = placesJson as unknown as Place[]
export const fixtureSongs = songsJson as unknown as Song[]
export const fixtureSources = sourcesJson as unknown as Sources

export function fixtureIndex(songs: Song[] = fixtureSongs): CatalogIndex {
  return buildIndex(songs, fixturePlaces, fixtureSources)
}
