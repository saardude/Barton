import { describe, expect, it } from 'vitest'
import { fixtureIndex, fixtureSongs, shuffled } from '../test/fixture'
import type { Song } from '../types/song'
import { normalize, roBase } from './normalize'
import { comparator, sortSongs } from './sort'

const index = fixtureIndex()
const lookup = (id: string) => index.placeById.get(id)
const titles = (songs: Song[]) => songs.map((s) => s.title)

describe('sort orders (QA 3.4)', () => {
  it('title: Romanian collation puts diacritic letters next to their base letters, null last both ways', () => {
    const asc = sortSongs(shuffled(fixtureSongs), 'title', 'asc', lookup)
    const known = asc.filter((s) => s.title)
    const order = known.map((s) => normalize(s.title))
    const idx = (t: string) => order.indexOf(normalize(t))
    expect(idx('Adio, dragă, adio')).toBeLessThan(idx('Ardeleana'))
    expect(idx('Ardeleana')).toBeLessThan(idx('Ârsul de la munte'))
    expect(idx('Ârsul de la munte')).toBeLessThan(idx('Bade, bade'))
    expect(idx('Șapte văi')).toBeLessThan(idx('Sara pe deal')) // Ș among S: "sap" < "sar"
    expect(idx('Sara pe deal')).toBeLessThan(idx('Segg nóta'))
    expect(idx('Segg nóta')).toBeLessThan(idx('Țara mea')) // Ț among T, after S
    expect(idx('Țara mea')).toBeLessThan(idx('Zăpada'))
    expect(idx('Île de jos')).toBeLessThan(idx('Ineu joc')) // Î among I
    expect(idx('Ördög útja')).toBeLessThan(idx('Őszi harmat után'))
    expect(idx('Őszi harmat után')).toBeLessThan(idx('Pe loc'))
    expect(idx('Cântec 2')).toBeLessThan(idx('Cântec 10')) // numeric
    // nulls (no title) are last in both directions
    const nullIds = fixtureSongs.filter((s) => !s.title).map((s) => s.id)
    expect(asc.slice(-nullIds.length).map((s) => s.id).sort()).toEqual(nullIds.sort())
    const desc = sortSongs(shuffled(fixtureSongs, 3), 'title', 'desc', lookup)
    expect(desc.slice(-nullIds.length).map((s) => s.id).sort()).toEqual(nullIds.sort())
    expect(titles(desc.filter((s) => s.title))).toEqual(titles(known).reverse())
  })

  it('title: case-insensitive and stable for equal keys (ties broken by id)', () => {
    const asc = sortSongs(fixtureSongs, 'title', 'asc', lookup)
    const adios = asc.filter((s) => s.title === 'Adio, dragă, adio').map((s) => s.id)
    expect(adios).toEqual(['bsys-1', 'bsys-17'])
    const a = { ...fixtureSongs[0], id: 'x1', title: 'sara' }
    const b = { ...fixtureSongs[0], id: 'x2', title: 'SARA' }
    expect(comparator('title', 'asc')(a, b)).toBeLessThan(0)
  })

  it('style: collator order on the verbatim string, null last both ways, ties by title', () => {
    for (const dir of ['asc', 'desc'] as const) {
      const sorted = sortSongs(shuffled(fixtureSongs), 'style', dir, lookup)
      const styles = sorted.map((s) => s.style)
      const firstNull = styles.indexOf(null)
      expect(styles.slice(firstNull).every((s) => s === null)).toBe(true)
      const known = styles.slice(0, firstNull) as string[]
      const expected = [...known].sort((a, b) => roBase.compare(a, b))
      expect(known).toEqual(dir === 'asc' ? expected : expected.reverse())
      // ties by title within one style
      const old = sorted.filter((s) => s.style === 'old style' && s.title)
      const oldTitles = old.map((s) => normalize(s.title))
      const oldSorted = [...oldTitles].sort((a, b) => roBase.compare(a, b))
      expect(oldTitles).toEqual(dir === 'asc' ? oldSorted : oldSorted.reverse())
    }
  })

  it('location: county, village, then title; records with no county last in both directions', () => {
    for (const dir of ['asc', 'desc'] as const) {
      const sorted = sortSongs(shuffled(fixtureSongs), 'location', dir, lookup)
      const counties = sorted.map((s) => s.location.county)
      const firstNull = counties.indexOf(null)
      expect(counties.slice(firstNull).every((c) => c === null)).toBe(true)
      const known = counties.slice(0, firstNull) as string[]
      const expected = [...new Set(known)].sort((a, b) => roBase.compare(a, b))
      const seen = [...new Set(known)]
      expect(seen).toEqual(dir === 'asc' ? expected : expected.reverse())
      const bihor = sorted.filter((s) => s.location.county === 'Bihor')
      const villages = bihor.map((s) => s.location.village)
      const lastVillage = villages.lastIndexOf(villages.find((v) => v !== null) ?? null)
      expect(villages.slice(lastVillage + 1).every((v) => v === null)).toBe(true)
    }
    const asc = sortSongs(fixtureSongs, 'location', 'asc', lookup)
    const bihorVillages = [...new Set(asc.filter((s) => s.location.county === 'Bihor' && s.location.village).map((s) => s.location.village))]
    expect(bihorVillages).toEqual(['Beiuș', 'Ineu', 'Tărcaia'])
  })

  it('year: numeric, null last both ways, ties by title', () => {
    for (const dir of ['asc', 'desc'] as const) {
      const sorted = sortSongs(shuffled(fixtureSongs, 11), 'year', dir, lookup)
      const years = sorted.map((s) => s.collected.year)
      const firstNull = years.indexOf(null)
      expect(firstNull).toBeGreaterThan(0)
      expect(years.slice(firstNull).every((y) => y === null)).toBe(true)
      const known = years.slice(0, firstNull) as number[]
      for (let i = 1; i < known.length; i++) {
        if (dir === 'asc') expect(known[i]).toBeGreaterThanOrEqual(known[i - 1])
        else expect(known[i]).toBeLessThanOrEqual(known[i - 1])
      }
      const y1912 = sorted.filter((s) => s.collected.year === 1912).map((s) => normalize(s.title ?? ''))
      const tie = [...y1912].sort((a, b) => roBase.compare(a, b))
      expect(y1912).toEqual(dir === 'asc' ? tie : tie.reverse())
    }
  })

  it('source: site order fmbc, bsys, gyuj, rfm; natural number order; null last; stable', () => {
    const asc = sortSongs(shuffled(fixtureSongs, 5), 'source', 'asc', lookup)
    const sites = asc.map((s) => s.source.site)
    expect([...new Set(sites)]).toEqual(['fmbc', 'bsys', 'gyuj', 'rfm'])
    const bsys = asc.filter((s) => s.source.site === 'bsys').map((s) => s.source.number)
    expect(bsys.indexOf('BR_0009')).toBeLessThan(bsys.indexOf('BR_0010'))
    expect(bsys.indexOf('BR_0010')).toBeLessThan(bsys.indexOf('BR_0204'))
    expect(bsys.indexOf('BR_0204')).toBeLessThan(bsys.indexOf('BR_1001'))
    expect(bsys[bsys.length - 1]).toBeNull() // bsys-29 has no number and no reference code
    const gyuj = asc.filter((s) => s.source.site === 'gyuj').map((s) => s.source.number)
    expect(gyuj).toEqual(['21/612', '21/5398'])
    const rfm = asc.filter((s) => s.source.site === 'rfm').map((s) => s.source.number)
    expect(rfm).toEqual(['1a', '1b', '12', '112'])
    const desc = sortSongs(shuffled(fixtureSongs, 9), 'source', 'desc', lookup)
    expect(desc[0].source.site).toBe('rfm')
    const descBsys = desc.filter((s) => s.source.site === 'bsys')
    expect(descBsys[descBsys.length - 1].source.number).toBeNull()
    expect(descBsys[0].source.number).toBe('BR_12010')
  })

  it('every sort is a total order: shuffled input yields the same sequence', () => {
    for (const sort of ['title', 'style', 'location', 'year', 'source'] as const) {
      const a = sortSongs(shuffled(fixtureSongs, 1), sort, 'asc', lookup).map((s) => s.id)
      const b = sortSongs(shuffled(fixtureSongs, 2), sort, 'asc', lookup).map((s) => s.id)
      expect(a).toEqual(b)
    }
  })
})
