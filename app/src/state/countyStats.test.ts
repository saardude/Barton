// County aggregations over the 40-record fixture: villages table rows, performers, timeline,
// header stats, genre / style counts.
import { describe, expect, it } from 'vitest'
import { fixtureIndex, fixtureSongs } from '../test/fixture'
import { countyStats, genreRows, performerRows, relatedNeighbours, sortPerformerRows, sortVillageRows, styleRows, timeline, villageRows, yearSpanText } from './countyStats'

const COUNTY = 'ro/crisana/bihor'
const index = fixtureIndex()
const bihor = index.songsUnder(COUNTY)
const expectedVillageCount = (id: string) => fixtureSongs.filter((s) => s.location.placeId === id).length

describe('villageRows', () => {
  const rows = villageRows(bihor, index, COUNTY)
  it('one row per village with songs, counts matching the fixture, "(village unknown)" last', () => {
    const ids = rows.map((r) => r.id)
    expect(ids).toEqual(['ro/crisana/bihor/beius', 'ro/crisana/bihor/ineu', 'ro/crisana/bihor/nomap', `${COUNTY}/unknown`])
    for (const r of rows) expect(r.melodies).toBe(r.unknown ? expectedVillageCount(COUNTY) : expectedVillageCount(r.id))
    expect(rows[rows.length - 1].unknown).toBe(true)
    expect(rows[rows.length - 1].label).toBe('(village unknown)')
  })
  it('labels are "Modern (Historical)" and mapped reflects the coordinates', () => {
    const beius = rows.find((r) => r.id === 'ro/crisana/bihor/beius')!
    expect(beius.label).toBe('Beiuș (Belényes)')
    expect(beius.mapped).toBe(true)
    expect(rows.find((r) => r.id === 'ro/crisana/bihor/nomap')!.mapped).toBe(false)
  })
  it('genre counts and year span per row', () => {
    const beius = rows.find((r) => r.id === 'ro/crisana/bihor/beius')!
    const songs = fixtureSongs.filter((s) => s.location.placeId === 'ro/crisana/bihor/beius')
    const total = Object.values(beius.genreCounts).reduce((a, b) => a + (b ?? 0), 0)
    expect(total).toBe(songs.filter((s) => s.genre !== null).length)
    const years = songs.map((s) => s.collected.year).filter((y): y is number => y !== null)
    expect(beius.yearMin).toBe(Math.min(...years))
    expect(beius.yearMax).toBe(Math.max(...years))
    expect(beius.unknownYear).toBe(songs.filter((s) => s.collected.year === null).length)
  })
  it('sorts by melodies desc and by years, keeping the unknown row last', () => {
    const byCount = sortVillageRows(rows, 'melodies', 'desc')
    expect(byCount[0].melodies).toBeGreaterThanOrEqual(byCount[1].melodies)
    expect(byCount[byCount.length - 1].unknown).toBe(true)
    const byYear = sortVillageRows(rows, 'years', 'asc')
    const known = byYear.filter((r) => !r.unknown)
    for (let i = 1; i < known.length; i++) expect(known[i - 1].yearMin! <= known[i].yearMin!).toBe(true)
    expect(byYear[byYear.length - 1].unknown).toBe(true)
    // name sort descending reverses the village order
    expect(sortVillageRows(rows, 'village', 'desc').map((r) => r.id)).toEqual(['ro/crisana/bihor/nomap', 'ro/crisana/bihor/ineu', 'ro/crisana/bihor/beius', `${COUNTY}/unknown`])
  })
  it('ignores songs outside the county', () => {
    expect(villageRows(fixtureSongs, index, COUNTY).map((r) => r.id)).toEqual(rows.map((r) => r.id))
  })
})

describe('countyStats', () => {
  it('counts melodies, villages, distinct performers, media and the year span', () => {
    const rows = villageRows(bihor, index, COUNTY)
    const stats = countyStats(bihor, rows)
    expect(stats.melodies).toBe(bihor.length)
    expect(stats.villages).toBe(3)
    const names = new Set(bihor.map((s) => s.performer.name).filter(Boolean))
    expect(stats.performers).toBe(names.size)
    expect(stats.withAudio).toBe(bihor.filter((s) => s.media.audio.length).length)
    expect(stats.withNotation).toBe(bihor.filter((s) => s.media.notation.length).length)
    expect(stats.yearMin).toBe(1909)
    expect(stats.yearMax).toBe(1917)
    expect(yearSpanText(stats.yearMin, stats.yearMax)).toBe('1909-1917')
    expect(yearSpanText(undefined, undefined)).toBe('n.d.')
    expect(yearSpanText(1912, 1912)).toBe('1912')
  })
})

describe('performerRows', () => {
  const rows = performerRows(bihor, index)
  it('groups by name and village, unnamed performers as one trailing row', () => {
    const unnamed = rows[rows.length - 1]
    expect(unnamed.name).toBeNull()
    expect(unnamed.count).toBe(bihor.filter((s) => !s.performer.name).length)
    const named = rows.filter((r) => r.name)
    // Ion Pop sang in Beiuș and in Ineu: two rows
    expect(named.filter((r) => r.name === 'Ion Pop').length).toBe(2)
    expect(named.reduce((n, r) => n + r.count, 0)).toBe(bihor.filter((s) => s.performer.name).length)
  })
  it('default order is count desc then name; name and village sorts keep the unnamed row last', () => {
    for (let i = 1; i < rows.length - 1; i++) expect(rows[i - 1].count >= rows[i].count).toBe(true)
    const byName = sortPerformerRows(rows, 'name', 'asc')
    expect(byName[0].name).toBe('Gheorghe Țepeș')
    expect(byName[byName.length - 1].name).toBeNull()
    const byVillage = sortPerformerRows(rows, 'village', 'desc')
    expect(byVillage[0].villageLabel.startsWith('Ineu')).toBe(true)
    expect(byVillage[byVillage.length - 1].name).toBeNull()
  })
})

describe('timeline', () => {
  it('one zero-filled bar per year from min to max, with the no-year count', () => {
    const tl = timeline(bihor)
    expect(tl.perYear.map((b) => b.year)).toEqual([1909, 1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917])
    expect(tl.perYear.reduce((n, b) => n + b.count, 0)).toBe(bihor.filter((s) => s.collected.year !== null).length)
    expect(tl.unknownYear).toBe(bihor.filter((s) => s.collected.year === null).length)
    expect(tl.max).toBe(Math.max(...tl.perYear.map((b) => b.count)))
    const y1910 = tl.perYear.find((b) => b.year === 1910)!
    expect(y1910.count).toBe(bihor.filter((s) => s.collected.year === 1910).length)
    expect(Object.values(y1910.genreCounts).reduce((a, b) => a + (b ?? 0), 0)).toBe(bihor.filter((s) => s.collected.year === 1910 && s.genre).length)
  })
  it('an all-undated set has no bars', () => {
    const tl = timeline(bihor.filter((s) => s.collected.year === null))
    expect(tl.perYear).toEqual([])
    expect(tl.unknownYear).toBeGreaterThan(0)
  })
})

describe('genreRows / styleRows', () => {
  it('genres in fixed order with a trailing null row; styles by count desc', () => {
    const g = genreRows(bihor)
    expect(g.map((r) => r.genre)).toEqual(['bocet', 'colinda', 'doina', 'joc', 'nunta', 'cantec'])
    expect(g.reduce((n, r) => n + r.count, 0)).toBe(bihor.length)
    // a null-genre record adds a trailing row
    const withNull = genreRows(index.songsUnder('ro/transylvania/cluj'))
    expect(withNull[withNull.length - 1].genre).toBeNull()
    const s = styleRows(bihor)
    for (let i = 1; i < s.length - 1; i++) expect(s[i - 1].count >= s[i].count).toBe(true)
    expect(s[s.length - 1].style).toBeNull()
    expect(s.reduce((n, r) => n + r.count, 0)).toBe(bihor.length)
  })
})

describe('relatedNeighbours', () => {
  it('same performer in the same village first, then the village (same genre first), up to the limit', () => {
    const song = index.songById.get('bsys-1')! // Ion Pop, Beiuș, cantec
    const groups = relatedNeighbours(song, index, 6, new Set())
    // Ion Pop's other song is in Ineu, not Beiuș: no performer group, the village group comes first
    expect(groups[0].heading).toBe('Also from Beiuș (Belényes)')
    const village = groups[0]
    expect(village.songs.length).toBeLessThanOrEqual(6)
    expect(village.songs.every((s) => s.id !== song.id && s.location.placeId === 'ro/crisana/bihor/beius')).toBe(true)
    expect(village.songs[0].genre).toBe('cantec')
    expect(groups.reduce((n, g) => n + g.songs.length, 0)).toBe(6)
  })
})
