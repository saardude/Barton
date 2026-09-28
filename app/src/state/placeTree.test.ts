import { describe, expect, it } from 'vitest'
import { buildIndex } from '../data/catalogIndex'
import { fixtureIndex, fixturePlaces, fixtureSongs, shuffled } from '../test/fixture'
import { find } from '../test/tree'
import { DEFAULT_QUERY } from './query'
import { buildPlaceTree, derive, type PlaceNode } from './selectors'

const index = fixtureIndex()

describe('place tree building (QA 3.5)', () => {
  const tree = buildPlaceTree(index, fixtureSongs, 'ro')

  it('builds country > region > county > village with sorted children and counts', () => {
    expect(tree.map((n) => n.id)).toEqual(['ro', 'hu'])
    const ro = tree[0]
    expect(ro.level).toBe('country')
    expect(ro.label).toBe('Romania')
    expect(ro.children.map((n) => n.id)).toEqual(['ro/crisana', 'ro/transylvania'])
    const crisana = ro.children[0]
    expect(crisana.children.map((n) => n.id)).toEqual(['ro/crisana/bihor'])
    const bihor = crisana.children[0]
    expect(bihor.label).toBe('Bihor (Bihar)')
    expect(bihor.children.map((n) => n.label)).toEqual(['Beiuș (Belényes)', 'Ineu (Köröskisjenő)', 'Tărcaia (Tárkány)', '(village unknown)'])
    expect(bihor.count).toBe(fixtureSongs.filter((s) => s.location.placeId?.startsWith('ro/crisana/bihor')).length)
    expect(ro.count).toBe(fixtureSongs.filter((s) => s.location.country === 'RO').length)
  })

  it('records with a county but no village appear in a synthetic "(village unknown)" leaf', () => {
    const bihor = find(tree, 'ro/crisana/bihor')!
    const leaf = bihor.children.find((c) => c.synthetic === 'village-unknown')!
    expect(leaf.id).toBe('ro/crisana/bihor/unknown')
    expect(leaf.count).toBe(3)
    expect(bihor.count).toBe(bihor.children.reduce((n, c) => n + c.count, 0))
    // a county with no direct records gets no synthetic leaf
    const harghita = find(tree, 'ro/transylvania/harghita')!
    expect(harghita.children.some((c) => c.synthetic)).toBe(true) // bsys-25 is at county level
    expect(harghita.children.filter((c) => c.synthetic).length).toBe(1)
  })

  it('records with no county appear under "(county unknown)" within their country', () => {
    const hu = tree[1]
    expect(hu.label).toBe('Hungary')
    expect(hu.children.map((n) => n.label)).toEqual(['(county unknown)'])
    expect(hu.children[0].children.map((n) => n.label)).toEqual(['Újszász'])
    expect(hu.children[0].count).toBe(1)
    // a record with a country but no place id at all goes under a synthetic leaf of the country
    const orphan = { ...fixtureSongs[0], id: 'orphan', location: { ...fixtureSongs[0].location, placeId: null, country: 'RO' } }
    const t2 = buildPlaceTree(buildIndex([...fixtureSongs, orphan], fixturePlaces), [...fixtureSongs, orphan], 'ro')
    const leaf = t2[0].children.find((c) => c.synthetic === 'county-unknown')!
    expect(leaf).toBeDefined()
    expect(leaf.count).toBe(1)
  })

  it('historical names are attached to nodes, never extra nodes', () => {
    const all: PlaceNode[] = []
    const walk = (n: PlaceNode) => {
      all.push(n)
      n.children.forEach(walk)
    }
    tree.forEach(walk)
    const real = all.filter((n) => !n.synthetic)
    expect(real.length).toBe(fixturePlaces.length)
    expect(real.every((n) => n.place !== undefined)).toBe(true)
    expect(find(tree, 'ro/crisana/bihor/beius')!.place!.nameHistorical).toBe('Belényes')
  })

  it('is deterministic: same input twice, and shuffled input, yield deep-equal trees', () => {
    const a = buildPlaceTree(index, fixtureSongs, 'ro')
    const b = buildPlaceTree(index, fixtureSongs, 'ro')
    expect(a).toEqual(b)
    const shuffledIndex = buildIndex(shuffled(fixtureSongs), shuffled(fixturePlaces, 3))
    const c = buildPlaceTree(shuffledIndex, shuffled(fixtureSongs, 5), 'ro')
    expect(c).toEqual(a)
  })

  it('map points: county mode groups by county centroid; unmapped villages are counted', () => {
    const d = derive({ query: DEFAULT_QUERY, index, searchIds: null })
    expect(d.mapLevel).toBe('county')
    expect(d.mapPoints.map((p) => p.placeId).sort()).toEqual(['ro/crisana/bihor', 'ro/transylvania/cluj', 'ro/transylvania/harghita'])
    const bihor = d.mapPoints.find((p) => p.placeId === 'ro/crisana/bihor')!
    expect(bihor.count).toBe(find(d.placeTree, 'ro/crisana/bihor')!.count)
    expect(bihor.unmappedVillages).toBe(1) // Tărcaia has no coordinates
    expect(bihor.villageCount).toBe(3)
    expect(d.unmappedCount).toBe(0)
    const v = derive({ query: { ...DEFAULT_QUERY, county: 'ro/crisana/bihor', region: 'ro/crisana' }, index, searchIds: null })
    expect(v.mapLevel).toBe('village')
    expect(v.mapPoints.map((p) => p.placeId).sort()).toEqual(['ro/crisana/bihor/beius', 'ro/crisana/bihor/ineu'])
    expect(v.unmappedCount).toBe(1 + 3) // Tărcaia (1) + the three county-level records
    expect(v.mapPoints[0].lat).toBeGreaterThan(v.mapPoints[1].lat) // north to south
  })
})
