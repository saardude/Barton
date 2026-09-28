import { describe, expect, it } from 'vitest'
import { createLocalSearch, toSearchDoc } from '../data/search'
import { fixtureIndex, fixtureSongs } from '../test/fixture'
import { applyPatch, DEFAULT_QUERY, resetQuery, type Query } from './query'
import { derive, filterSongs, buildPredicates } from './selectors'
import { encodeQuery } from './urlCodec'

const index = fixtureIndex()
const search = createLocalSearch(fixtureSongs.map(toSearchDoc))
const run = (patch: Partial<Query>, searchIds: string[] | null = null) =>
  derive({ query: applyPatch(DEFAULT_QUERY, patch), index, searchIds })
const ids = (songs: { id: string }[]) => songs.map((s) => s.id).sort()
const inRO = fixtureSongs.filter((s) => s.location.country === 'RO')

describe('filter logic (QA 3.2)', () => {
  it('no country by default (every country counts); the country switch narrows to one', () => {
    expect(run({}).filteredSongs).toHaveLength(fixtureSongs.length)
    expect(run({}).total).toBe(fixtureSongs.length)
    expect(ids(run({ country: 'ro' }).filteredSongs)).toEqual(ids(inRO))
    expect(run({ country: 'ro' }).total).toBe(inRO.length)
    expect(run({ country: 'all' }).filteredSongs).toHaveLength(fixtureSongs.length)
    expect(ids(run({ country: 'hu' }).filteredSongs)).toEqual(['bsys-26'])
  })

  it('place hierarchy: region > county > village narrow monotonically', () => {
    const region = run({ region: 'ro/crisana' }).filteredSongs
    const county = run({ county: 'ro/crisana/bihor' }).filteredSongs
    const village = run({ village: 'ro/crisana/bihor/beius' }).filteredSongs
    expect(ids(region)).toEqual(ids(fixtureSongs.filter((s) => s.location.placeId?.startsWith('ro/crisana/'))))
    expect(ids(county)).toEqual(ids(region)) // the fixture's only Crișana county is Bihor
    expect(ids(village)).toEqual(ids(fixtureSongs.filter((s) => s.location.placeId === 'ro/crisana/bihor/beius')))
    expect(village.length).toBeLessThan(county.length)
    expect(ids(run({ county: 'ro/transylvania/cluj' }).filteredSongs)).toEqual(
      ids(fixtureSongs.filter((s) => s.location.placeId?.startsWith('ro/transylvania/cluj'))),
    )
  })

  it('the synthetic "(village unknown)" leaf selects county-level records only', () => {
    expect(ids(run({ village: 'ro/crisana/bihor/unknown' }).filteredSongs)).toEqual(['bsys-10', 'bsys-9', 'rfm-4'].sort())
  })

  it('values inside one facet OR together, facets AND', () => {
    const colinda = run({ genre: ['colinda'] }).filteredSongs
    const joc = run({ genre: ['joc'] }).filteredSongs
    const both = run({ genre: ['colinda', 'joc'] }).filteredSongs
    expect(both.length).toBe(colinda.length + joc.length)
    expect(ids(both)).toEqual(ids([...colinda, ...joc]))
    const and = run({ genre: ['colinda', 'joc'], county: 'ro/crisana/bihor' }).filteredSongs
    expect(and.every((s) => s.location.placeId?.startsWith('ro/crisana/bihor'))).toBe(true)
    expect(and.every((s) => s.genre === 'colinda' || s.genre === 'joc')).toBe(true)
  })

  it('style and instrument exclude null / empty records while active', () => {
    const old = run({ style: ['old style'] }).filteredSongs
    expect(old.every((s) => s.style === 'old style')).toBe(true)
    const instr = run({ instrument: ['violin'] }).filteredSongs
    expect(instr.every((s) => s.instrument.includes('violin'))).toBe(true)
    const any = run({ instrument: ['violin', 'fluier'] }).filteredSongs
    expect(any.every((s) => s.instrument.includes('violin') || s.instrument.includes('fluier'))).toBe(true)
    expect(any.length).toBeGreaterThan(instr.length)
    expect(run({ performance: 'instrumental' }).filteredSongs.every((s) => s.performance === 'instrumental')).toBe(true)
  })

  it('year range is inclusive; null years are excluded only while a bound is set', () => {
    const ranged = run({ yearFrom: 1909, yearTo: 1912 }).filteredSongs
    expect(ranged.length).toBeGreaterThan(0)
    expect(ranged.every((s) => s.collected.year !== null && s.collected.year >= 1909 && s.collected.year <= 1912)).toBe(true)
    expect(ranged.some((s) => s.collected.year === 1909)).toBe(true)
    expect(ranged.some((s) => s.collected.year === 1912)).toBe(true)
    expect(run({ yearFrom: 1913 }).filteredSongs.every((s) => (s.collected.year ?? 0) >= 1913)).toBe(true)
    expect(run({}).filteredSongs.some((s) => s.collected.year === null)).toBe(true)
    expect(run({ yearTo: 1950 }).filteredSongs.some((s) => s.collected.year === null)).toBe(false)
  })

  it('search q is case- and diacritic-insensitive, ANDs tokens, matches title, text, village names and performer', async () => {
    const find = async (q: string) => ids(run({ q, country: 'all' }, await search.search(q)).filteredSongs)
    expect(await find('sculati')).toContain('bsys-8')
    expect(await find('SCULAȚI')).toContain('bsys-8')
    expect(await find('Beiuș')).toEqual(await find('Beius'))
    expect((await find('Beius')).length).toBeGreaterThan(0)
    expect(await find('Belenyes')).toEqual(await find('Beius')) // historical village name
    expect(await find('buciumul')).toContain('bsys-6') // text
    expect(await find('Tepes')).toEqual(['bsys-8']) // performer
    expect(await find('sculati boieri')).toEqual(['bsys-8']) // tokens AND
    expect(await find('sculati nomatchxyz')).toEqual([])
    expect(await search.search('s')).toBeNull() // too short: no filter
    expect(run({ q: '' }).filteredSongs.length).toBe(fixtureSongs.length)
  })

  it('clear-all returns the full default set and the canonical empty query', () => {
    const q = applyPatch(DEFAULT_QUERY, { county: 'ro/crisana/bihor', genre: ['joc'], q: 'x', sort: 'year', dir: 'desc' })
    const reset = resetQuery(q)
    expect(encodeQuery(reset)).toBe('sort=year&dir=desc')
    expect(derive({ query: reset, index, searchIds: null }).filteredSongs.length).toBe(fixtureSongs.length)
    expect(encodeQuery(resetQuery(DEFAULT_QUERY))).toBe('')
  })

  it('combined filters reduce monotonically', async () => {
    const steps: Partial<Query>[] = [
      { county: 'ro/crisana/bihor' },
      { county: 'ro/crisana/bihor', genre: ['cantec', 'colinda'] },
      { county: 'ro/crisana/bihor', genre: ['cantec', 'colinda'], yearFrom: 1909, yearTo: 1913 },
      { county: 'ro/crisana/bihor', genre: ['cantec', 'colinda'], yearFrom: 1909, yearTo: 1913, q: 'adio' },
    ]
    let prev: Set<string> | null = null
    for (const step of steps) {
      const searchIds = step.q ? await search.search(step.q) : null
      const cur = new Set(run(step, searchIds).filteredSongs.map((s) => s.id))
      if (prev) for (const id of cur) expect(prev.has(id)).toBe(true)
      if (prev) expect(cur.size).toBeLessThanOrEqual(prev.size)
      prev = cur
    }
    expect(prev!.size).toBeGreaterThan(0)
  })

  it('filterSongs with an exception ignores that predicate', () => {
    const query = applyPatch(DEFAULT_QUERY, { genre: ['joc'], county: 'ro/crisana/bihor' })
    const preds = buildPredicates({ query, index, searchIds: null })
    const exceptGenre = filterSongs(index.songs, preds, 'genre')
    expect(exceptGenre.some((s) => s.genre !== 'joc')).toBe(true)
    expect(exceptGenre.every((s) => s.location.placeId?.startsWith('ro/crisana/bihor'))).toBe(true)
  })
})
