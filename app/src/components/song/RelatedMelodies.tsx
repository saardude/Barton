// RelatedMelodies (FRONTEND-SPEC 9): the schema's related[] grouped by relation (resolved ids
// as SongRow, unresolved as external links), padded with computed neighbours up to 6 in total.
import { useId } from 'react'
import { t } from '../../i18n/en'
import type { CatalogIndex } from '../../data/catalogIndex'
import { relatedNeighbours } from '../../state/countyStats'
import type { Song } from '../../types/song'
import { SongRow } from '../SongRow'

const MAX_TOTAL = 6
const RELATION_KEY: Record<Song['related'][number]['relation'], string> = {
  variant: 'song.related.variants',
  'same-source': 'song.related.sameSource',
  'same-informant': 'song.related.sameInformant',
  'same-place': 'song.related.samePlace',
  'cross-site': 'song.related.crossSite',
  link: 'song.related.link',
}
const RELATION_ORDER = Object.keys(RELATION_KEY) as (keyof typeof RELATION_KEY)[]

interface Group {
  heading: string
  songs: Song[]
  links: { url: string; label: string }[]
}

export function relatedGroups(song: Song, index: CatalogIndex): Group[] {
  const groups: Group[] = []
  const seen = new Set<string>([song.id])
  for (const relation of RELATION_ORDER) {
    const entries = song.related.filter((r) => r.relation === relation)
    if (!entries.length) continue
    const g: Group = { heading: t(RELATION_KEY[relation]), songs: [], links: [] }
    for (const r of entries) {
      const target = r.id ? index.songById.get(r.id) : undefined
      if (target) {
        if (seen.has(target.id)) continue
        seen.add(target.id)
        g.songs.push(target)
      } else if (r.url) {
        g.links.push({ url: r.url, label: r.label ?? r.id ?? r.url })
      }
    }
    if (g.songs.length || g.links.length) groups.push(g)
  }
  const resolved = groups.reduce((n, g) => n + g.songs.length, 0)
  if (resolved < MAX_TOTAL) {
    for (const n of relatedNeighbours(song, index, MAX_TOTAL - resolved, seen)) groups.push({ heading: n.heading, songs: n.songs, links: [] })
  }
  return groups
}

export function RelatedMelodies({ song, index, search }: { song: Song; index: CatalogIndex; search: string }) {
  const id = useId()
  const groups = relatedGroups(song, index)
  if (!groups.length) return null
  return (
    <section className="related" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="caps-label">
        {t('song.related')}
      </h2>
      {groups.map((g, gi) => (
        <div className="related__group" key={gi}>
          <h3>{g.heading}</h3>
          {g.songs.length > 0 && (
            <ol className="song-list related__list">
              {g.songs.map((s) => (
                <SongRow key={s.id} song={s} index={index} search={search} />
              ))}
            </ol>
          )}
          {g.links.length > 0 && (
            <ul className="related__links">
              {g.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="mono">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  )
}
