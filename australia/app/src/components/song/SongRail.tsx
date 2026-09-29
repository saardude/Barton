// SongRail: Where, When and who, Provenance, Source. A <dl> per section; null rows are omitted.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useQuery } from '../../app/query'
import type { CatalogIndex } from '../../data/catalogIndex'
import { basisLabel, kindLabel, siteName, stateName, t, yearFromLabel } from '../../i18n/en'
import { applyPatch, type Query } from '../../state/query'
import { toSearch } from '../../state/urlCodec'
import type { Song } from '../../types/song'
import { SourceLink } from '../SourceLink'

export interface RailRow {
  label: string
  value: ReactNode
  mono?: boolean
}

export function RailSection({ id, title, rows }: { id: string; title: string; rows: (RailRow | null | undefined | false)[] }) {
  const list = rows.filter((r): r is RailRow => Boolean(r) && (r as RailRow).value !== null && (r as RailRow).value !== undefined && (r as RailRow).value !== '')
  if (!list.length) return null
  return (
    <section className="rail-section" id={`rail-${id}`} aria-labelledby={`rail-${id}-h`}>
      <h2 id={`rail-${id}-h`} className="caps-label">
        {title}
      </h2>
      <dl>
        {list.map((r, i) => (
          <div className="rail-section__row" key={i}>
            <dt>{r.label}</dt>
            <dd className={r.mono ? 'mono' : undefined}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function filterLink(query: Query, patch: Partial<Query>, label: ReactNode): ReactNode {
  return <Link to={{ pathname: '/', search: toSearch(applyPatch(query, patch)) }}>{label}</Link>
}

export function newspaperDate(d: { year: number; month: number | null; day: number | null; raw: string } | null): string | null {
  if (!d) return null
  return d.raw
}

export function SongRail({ song, index }: { song: Song; index: CatalogIndex }) {
  const { query } = useQuery()
  const loc = song.location
  const paper = song.provenance.newspaper
  const stateId = loc.placeId ? index.stateIdOf(loc.placeId) : null
  const stateNode = stateId ? index.placeById.get(stateId) : undefined
  const townNode = loc.placeId && loc.town ? index.placeById.get(loc.placeId) : undefined
  const coords = loc.lat !== null && loc.lng !== null ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : t('tree.notMapped')
  const people = (list: string[], key: 'singer' | 'collector') =>
    list.length ? (
      <span>
        {list.map((x, i) => (
          <span key={x}>
            {i > 0 && ', '}
            {filterLink(query, { [key]: [x] }, x)}
          </span>
        ))}
      </span>
    ) : null

  return (
    <aside className="song-rail" aria-label="Record details">
      <RailSection
        id="where"
        title={t('song.rail.where')}
        rows={[
          { label: t('song.row.town'), value: townNode ? filterLink(query, { place: townNode.id }, townNode.name) : loc.town },
          { label: t('song.row.state'), value: stateNode ? filterLink(query, { place: stateNode.id }, stateNode.name) : loc.state ? stateName(loc.state) : null },
          { label: t('song.row.basis'), value: basisLabel(loc.basis) },
          loc.placeId ? { label: t('song.row.coordinates'), value: coords, mono: true } : null,
        ]}
      />
      <RailSection
        id="when"
        title={t('song.rail.when')}
        rows={[
          { label: t('song.row.year'), value: song.year.value !== null ? `${song.year.approx ? 'c. ' : ''}${song.year.value}` : null, mono: true },
          { label: t('song.row.yearFrom'), value: yearFromLabel(song.year.from) },
          { label: t('song.row.kind'), value: kindLabel(song.kind) },
          { label: t('song.row.author'), value: song.author.name ? filterLink(query, { author: [song.author.name] }, song.author.name) : null },
          song.author.signature && song.author.signature !== song.author.name ? { label: t('song.row.signature'), value: song.author.signature, mono: true } : null,
          { label: t('song.row.singers'), value: people(song.provenance.singers, 'singer') },
          { label: t('song.row.collectors'), value: people(song.provenance.collectors, 'collector') },
        ]}
      />
      <RailSection
        id="provenance"
        title={t('song.rail.provenance')}
        rows={[
          { label: t('song.row.newspaper'), value: paper ? filterLink(query, { paper: [paper.key] }, paper.title) : null },
          { label: t('song.row.date'), value: paper ? newspaperDate(paper.date) : null },
          { label: t('song.row.page'), value: paper && paper.page !== null ? String(paper.page) : null, mono: true },
          {
            label: t('song.row.trove'),
            value:
              paper && paper.troveUrl ? (
                <a href={paper.troveUrl} target="_blank" rel="noopener noreferrer">
                  {t('song.trove.open', { id: paper.troveArticleId ?? '' })}
                </a>
              ) : null,
          },
          {
            label: t('song.row.songbooks'),
            value: song.provenance.songbooks.length ? (
              <span>
                {song.provenance.songbooks.map((b, i) => (
                  <span key={b}>
                    {i > 0 && '; '}
                    {filterLink(query, { book: [b] }, index.songbookTitle(b))}
                  </span>
                ))}
              </span>
            ) : null,
          },
        ]}
      />
      <RailSection
        id="source"
        title={t('song.rail.source')}
        rows={[
          { label: t('song.row.reference'), value: <SourceLink song={song} size="row" /> },
          { label: t('song.row.site'), value: siteName(song.source.site) },
          {
            label: t('song.rail.source'),
            value: (
              <a href={song.source.url} target="_blank" rel="noopener noreferrer">
                {t('song.openSource')}
              </a>
            ),
          },
          { label: t('song.row.id'), value: song.id, mono: true },
          song.warnings.length ? { label: t('song.warnings'), value: song.warnings.join('; '), mono: true } : null,
        ]}
      />
    </aside>
  )
}
