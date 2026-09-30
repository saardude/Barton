// Collector facet: name normalisation, URL round trip, "any of" predicate and all-but-this counts.
import { describe, expect, it } from 'vitest'
import { buildIndex } from './catalogIndex'
import { collectorsFromString, collectorsOf, UNKNOWN_COLLECTOR } from './collectors'
import { hydrateSong } from './hydrate'
import { applyPatch, DEFAULT_QUERY } from '../state/query'
import { derive, filterSongs, buildPredicates } from '../state/selectors'
import { decodeQuery, encodeQuery } from '../state/urlCodec'
import { fixturePlaces, fixtureSongs } from '../test/fixture'
import type { Song } from '../types/song'

describe('collector name normalisation', () => {
  it('folds Western-order variants to Hungarian order', () => {
    expect(collectorsFromString('Béla Bartók')).toEqual(['Bartók Béla'])
    expect(collectorsFromString('Béla Vikár')).toEqual(['Vikár Béla'])
    expect(collectorsFromString('Zoltán Kodály')).toEqual(['Kodály Zoltán'])
    expect(collectorsFromString('Bartók Béla')).toEqual(['Bartók Béla'])
  })
  it('splits multi-collector strings and deduplicates', () => {
    expect(collectorsFromString('Seemayer Vilmos, Bartók Béla, Lajtha László')).toEqual(['Seemayer Vilmos', 'Bartók Béla', 'Lajtha László'])
    expect(collectorsFromString('Béla Bartók, Bartók Béla')).toEqual(['Bartók Béla'])
    expect(collectorsFromString('  Kodály  Zoltán ')).toEqual(['Kodály Zoltán'])
  })
  it('unknown collector is an empty list', () => {
    expect(collectorsFromString(null)).toEqual([])
    expect(collectorsFromString('')).toEqual([])
  })
  it('prefers the data\'s `collectors` field and falls back to the split string', () => {
    expect(collectorsOf(['Kodály Zoltán'], 'Zoltán Kodály')).toEqual(['Kodály Zoltán'])
    expect(collectorsOf([], 'Zoltán Kodály')).toEqual(['Kodály Zoltán'])
    expect(collectorsOf(undefined, 'Béla Vikár, Lajtha László')).toEqual(['Vikár Béla', 'Lajtha László'])
  })
  it('hydrate derives `collectors` from `collector` when the field is absent', () => {
    const placeById = new Map(fixturePlaces.map((p) => [p.id, p]))
    expect(hydrateSong({ id: 'x', source: { site: 'bsys', url: 'u' }, collector: 'Béla Bartók, Kodály Zoltán' }, placeById).collectors).toEqual(['Bartók Béla', 'Kodály Zoltán'])
    expect(hydrateSong({ id: 'y', source: { site: 'bsys', url: 'u' }, collector: 'Béla Bartók', collectors: ['Bartók Béla'] }, placeById).collectors).toEqual(['Bartók Béla'])
    expect(hydrateSong({ id: 'z', source: { site: 'bsys', url: 'u' } }, placeById).collectors).toEqual([])
  })
})

/** Fixture plus a few collector variants: 40 Bartók/unknown records, 3 Kodály, 2 Vikár + Bartók, 1 Lajtha. */
function songsWithCollectors(): Song[] {
  const base = fixtureSongs
  const mk = (id: string, collectors: string[], from: Song = base[0]): Song => ({ ...from, id, collector: collectors.join(', ') || null, collectors })
  return [
    ...base,
    mk('c-k1', ['Kodály Zoltán']),
    mk('c-k2', ['Kodály Zoltán'], base[1]),
    mk('c-k3', ['Kodály Zoltán'], base[2]),
    mk('c-vb1', ['Vikár Béla', 'Bartók Béla']),
    mk('c-vb2', ['Vikár Béla', 'Bartók Béla'], base[3]),
    mk('c-l1', ['Lajtha László'], base[4]),
  ]
}

describe('collector facet', () => {
  const songs = songsWithCollectors()
  const index = buildIndex(songs, fixturePlaces)
  const run = (collector: string[], extra: Partial<ReturnType<typeof applyPatch>> = {}) =>
    derive({ query: applyPatch(DEFAULT_QUERY, { collector, ...extra }), index, searchIds: null })
  const bartok = songs.filter((s) => s.collectors.includes('Bartók Béla'))
  const unknown = songs.filter((s) => s.collectors.length === 0)

  it('index lists collectors most frequent first', () => {
    expect(index.collectors[0]).toBe('Bartók Béla')
    expect(index.collectors).toEqual(expect.arrayContaining(['Kodály Zoltán', 'Vikár Béla', 'Lajtha László']))
    expect(index.collectors.indexOf('Kodály Zoltán')).toBeLessThan(index.collectors.indexOf('Lajtha László'))
  })

  it('URL round trip: comma list, percent-encoded, `none` for the unknown collector; unknown names dropped with a warning', () => {
    const q = applyPatch(DEFAULT_QUERY, { collector: ['Kodály Zoltán', 'Bartók Béla', UNKNOWN_COLLECTOR] })
    const s = encodeQuery(q)
    expect(s).toBe('collector=Bart%C3%B3k%20B%C3%A9la,Kod%C3%A1ly%20Zolt%C3%A1n,none')
    const back = decodeQuery(s, { collectors: new Set(index.collectors) })
    expect(back.warnings).toEqual([])
    expect(back.query.collector).toEqual(['Bartók Béla', 'Kodály Zoltán', 'none'])
    expect(encodeQuery(back.query)).toBe(s)
    const bad = decodeQuery('collector=Nobody,Kod%C3%A1ly%20Zolt%C3%A1n', { collectors: new Set(index.collectors) })
    expect(bad.query.collector).toEqual(['Kodály Zoltán'])
    expect(bad.warnings.join('\n')).toMatch(/Nobody/)
  })

  it('predicate is "any of" over collectors[]; `none` selects records with no collector', () => {
    expect(run(['Kodály Zoltán']).filteredSongs.map((s) => s.id).sort()).toEqual(['c-k1', 'c-k2', 'c-k3'])
    expect(run(['Vikár Béla']).filteredSongs.map((s) => s.id).sort()).toEqual(['c-vb1', 'c-vb2'])
    expect(run(['Bartók Béla']).filteredSongs.length).toBe(bartok.length)
    expect(run(['Kodály Zoltán', 'Lajtha László']).filteredSongs.length).toBe(4)
    expect(run([UNKNOWN_COLLECTOR]).filteredSongs.length).toBe(unknown.length)
    expect(run([UNKNOWN_COLLECTOR, 'Lajtha László']).filteredSongs.length).toBe(unknown.length + 1)
    expect(run([]).filteredSongs.length).toBe(songs.length)
    // ANDs with other facets through the shared predicates
    const p = buildPredicates({ query: applyPatch(DEFAULT_QUERY, { collector: ['Bartók Béla'], county: 'ro/crisana/bihor' }), index, searchIds: null })
    expect(filterSongs(songs, p).every((s) => s.collectors.includes('Bartók Béla') && s.location.placeId?.startsWith('ro/crisana/bihor'))).toBe(true)
  })

  it('facet counts follow the all-facets-but-this rule and include the unknown entry', () => {
    const none = run([])
    expect(none.facetCounts.collector.get('Bartók Béla')).toBe(bartok.length)
    expect(none.facetCounts.collector.get(UNKNOWN_COLLECTOR)).toBe(unknown.length)
    expect(none.facetCounts.collector.get('Kodály Zoltán')).toBe(3)
    // the active collector facet keeps every option's count
    const active = run(['Kodály Zoltán'])
    expect(active.facetCounts.collector).toEqual(none.facetCounts.collector)
    // other facets see the collector filter, and the collector counts see other facets
    expect(active.facetCounts.genre.get('colinda')).toBeLessThanOrEqual(none.facetCounts.genre.get('colinda') ?? 0)
    const bihor = run([], { county: 'ro/crisana/bihor' })
    expect(bihor.facetCounts.collector.get('Kodály Zoltán')).toBe(songs.filter((s) => s.collectors.includes('Kodály Zoltán') && s.location.placeId?.startsWith('ro/crisana/bihor')).length)
    // chips and clear all
    expect(active.activeChips.map((c) => `${c.key}:${c.value}`)).toEqual(['collector:Kodály Zoltán'])
    expect(run([UNKNOWN_COLLECTOR]).activeChips[0].label).toBe('(unknown collector)')
  })
})
