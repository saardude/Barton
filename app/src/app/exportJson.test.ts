import { describe, expect, it } from 'vitest'
import { fixtureSongs } from '../test/fixture'
import { applyPatch, DEFAULT_QUERY } from '../state/query'
import { buildExport, exportFileName, sortKeys } from './exportJson'

describe('export JSON (QA 3.6, AC-21)', () => {
  it('carries the canonical query, count, attribution and records with sorted keys in display order', () => {
    const query = applyPatch(DEFAULT_QUERY, { genre: ['colinda'], county: 'ro/crisana/bihor' })
    const songs = fixtureSongs.slice(0, 3)
    const out = buildExport(songs, query, new Date('2026-09-28T10:00:00Z'))
    expect(out.query).toBe('county=ro/crisana/bihor&genre=colinda')
    expect(out.count).toBe(3)
    expect(out.generatedAt).toBe('2026-09-28T10:00:00.000Z')
    expect(out.attribution.sources.map((s) => s.url)).toEqual(['https://bartok-nepzene.zti.hu/en/', 'https://systems.zti.hu/br/en', 'https://bartok-gyujtesek.zti.hu/en'])
    expect(out.attribution.text).toContain('HUN-REN BTK Institute for Musicology')
    expect(out.records.map((r) => r.id)).toEqual(songs.map((s) => s.id))
    expect(Object.keys(out.records[0])).toEqual([...Object.keys(out.records[0])].sort())
    expect(out.records[0].source.url).toBe(songs[0].source.url)
    // deep-equal to the input record (sorted keys only change order)
    expect(out.records[0]).toEqual(songs[0])
  })

  it('sortKeys is recursive and leaves arrays in order', () => {
    expect(JSON.stringify(sortKeys({ b: [{ z: 1, a: 2 }], a: null }))).toBe('{"a":null,"b":[{"a":2,"z":1}]}')
  })

  it('names the file culegeri-<N>-<yyyymmdd>.json', () => {
    expect(exportFileName(1204, new Date(2026, 8, 28))).toBe('culegeri-1204-20260928.json')
  })
})
