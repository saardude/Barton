// RelatedSongs: related[] grouped by relation (variants, see-also, linked from the notes),
// padded with songs from the same newspaper up to 6 in total.
import { useId } from 'react'
import { t } from '../../i18n/en'
import type { CatalogIndex } from '../../data/catalogIndex'
import type { Song } from '../../types/song'
import { SongRow } from '../SongRow'

const MAX_TOTAL = 6
const RELATION_KEY: Record<Song['related'][number]['relation'], string> = {
  variant: 'song.related.variant',
  see: 'song.related.see',
  linked: 'song.related.linked',
}
const RELATION_ORDER = Object.keys(RELATION_KEY) as (keyof typeof RELATION_KEY)[]

interface Group {
  heading: string
  songs: Song[]
}

export function relatedGroups(song: Song, index: CatalogIndex): Group[] {
  const groups: Group[] = []
  const seen = new Set<string>([song.id])
  for (const relation of RELATION_ORDER) {
    const entries = song.related.filter((r) => r.relation === relation)
    if (!entries.length) continue
    const g: Group = { heading: t(RELATION_KEY[relation]), songs: [] }
    for (const r of entries) {
      const target = index.songById.get(r.id)
      if (target && !seen.has(target.id)) {
        seen.add(target.id)
        g.songs.push(target)
      }
    }
    if (g.songs.length) groups.push(g)
  }
  const resolved = groups.reduce((n, g) => n + g.songs.length, 0)
  const paper = song.provenance.newspaper?.key
  if (resolved < MAX_TOTAL && paper) {
    const same = index.songs.filter((s) => !seen.has(s.id) && s.provenance.newspaper?.key === paper).slice(0, MAX_TOTAL - resolved)
    if (same.length) groups.push({ heading: t('song.related.samePaper'), songs: same })
  }
  return groups
}

export function RelatedSongs({ song, index, search }: { song: Song; index: CatalogIndex; search: string }) {
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
          <ol className="song-list related__list">
            {g.songs.map((s) => (
              <SongRow key={s.id} song={s} index={index} search={search} />
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}
