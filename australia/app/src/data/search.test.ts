import { describe, expect, it } from 'vitest'
import { fixtureSongs } from '../test/fixture'
import { createSearchService } from './search'

describe('search', () => {
  const service = createSearchService(fixtureSongs)

  it('returns null for a query under the minimum length', async () => {
    expect(await service.search('a')).toBeNull()
  })

  it('finds a record by a word of its title and by its page number', async () => {
    const s = fixtureSongs.find((x) => x.title.split(' ').some((w) => w.length > 5))!
    const word = s.title.split(' ').find((w) => w.length > 5)!
    const ids = await service.search(word)
    expect(ids).toContain(s.id)
    expect(await service.search(s.source.siteId)).toContain(s.id)
  })

  it('finds a record by a word of its lyrics', async () => {
    const s = fixtureSongs.find((x) => x.text.stanzas.length > 0)!
    const word = s.text.stanzas[0].join(' ').split(/\s+/).find((w) => /^[A-Za-z]{7,}$/.test(w))
    if (!word) return
    expect(await service.search(word)).toContain(s.id)
  })
})
