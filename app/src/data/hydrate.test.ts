import { describe, expect, it } from 'vitest'
import { fixturePlaces } from '../test/fixture'
import songsJson from '../test/fixtures/songs.small.json'
import type { Song } from '../types/song'
import { collectorsFromString } from './collectors'
import { hydrateSong, hydrateSongs } from './hydrate'

describe('hydrate (slim app copy -> schema Song)', () => {
  const placeById = new Map(fixturePlaces.map((p) => [p.id, p]))

  it('passes full schema records through unchanged (except the optional rawFields)', () => {
    const songs = hydrateSongs(songsJson, fixturePlaces)
    expect(songs.length).toBe(songsJson.length)
    for (let i = 0; i < songs.length; i++) {
      const original = songsJson[i] as unknown as Song
      expect(songs[i]).toEqual({
        ...original,
        source: { ...original.source, referenceCode: original.source.referenceCode ?? original.source.siteId },
        // app-side field derived from `collector` until the schema ships `collectors`
        collectors: collectorsFromString(original.collector),
      })
    }
  })

  it('restores location fields, defaults and site names for a slim record', () => {
    const slim = {
      id: 'bsys-10-12593',
      source: { site: 'bsys', siteId: 'C 1034', url: 'https://systems.zti.hu/br/en/browse/10/12593', number: 'BR_12010' },
      title: 'Segg nóta, az biza',
      style: 'mixed style',
      performer: { name: 'Péntek Gyugyi Györgyné', age: 34 },
      collector: 'Bartók Béla',
      collected: { year: 1908, month: 3 },
      location: { placeId: 'ro/crisana/bihor/beius' },
      media: { notation: [{ url: 'https://systems.zti.hu/media/images/BR/BR_12010_01.jpg' }] },
      music: { systemPosition: 'C 1034', cadences: '(1) 1' },
    }
    const s = hydrateSong(slim, placeById)
    expect(s.location).toMatchObject({
      country: 'RO',
      region: 'Crișana',
      county: 'Bihor',
      countyHistorical: 'Bihar',
      village: 'Beiuș',
      villageHistorical: 'Belényes',
      lat: 46.66,
      lng: 22.35,
      placeId: 'ro/crisana/bihor/beius',
    })
    expect(s.performance).toBe('unknown')
    expect(s.genre).toBeNull()
    expect(s.instrument).toEqual([])
    expect(s.media.audio).toEqual([])
    expect(s.media.notation[0]).toEqual({ url: 'https://systems.zti.hu/media/images/BR/BR_12010_01.jpg', type: null, caption: null })
    expect(s.source.referenceCode).toBe('C 1034')
    expect(s.source.siteName).toMatch(/Bartok System/)
    expect(s.source.alternates).toEqual([])
    expect(s.collected).toEqual({ year: 1908, month: 3, day: null, raw: null })
    expect(s.related).toEqual([])
    expect(s.rawFields).toBeUndefined()
  })

  it('a record without a place id keeps its own printed names and no coordinates', () => {
    const s = hydrateSong({ id: 'x', source: { site: 'fmbc', siteId: '1', url: 'https://bartok-nepzene.zti.hu/en/browse/1' }, location: { villageHistorical: 'Cigánd', countyHistorical: 'Zemplén' } }, placeById)
    expect(s.location.placeId).toBeNull()
    expect(s.location.villageHistorical).toBe('Cigánd')
    expect(s.location.lat).toBeNull()
  })
})
