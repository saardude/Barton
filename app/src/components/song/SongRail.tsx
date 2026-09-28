// SongRail / RailSection (FRONTEND-SPEC 9): Where, Who / when, Music, In Bartok's works, Source.
// A <dl> per section; a row is omitted when its value is null.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useQuery } from '../../app/query'
import type { CatalogIndex } from '../../data/catalogIndex'
import {
  genreLabel,
  genreTitle,
  instrumentLabel,
  performanceLabel,
  siteName,
  styleLabel,
  t,
} from '../../i18n/en'
import { countryName, placeText } from '../../state/placeName'
import { applyPatch, type Query } from '../../state/query'
import { toSearch } from '../../state/urlCodec'
import type { Place } from '../../types/place'
import type { Song } from '../../types/song'
import { GenreSwatch } from '../Genre'
import { PlaceLabel } from '../PlaceLabel'
import { SourceLink } from '../SourceLink'
import { audioLabel } from './AudioPlayer'
import { JourneyLink, useSongJourneys } from './JourneyLink'

export interface RailRow {
  label: string
  value: ReactNode
  mono?: boolean
}

export function RailSection({
  id,
  title,
  rows,
}: {
  id: string
  title: string
  rows: (RailRow | null | undefined | false)[]
}) {
  const list = rows.filter(
    (r): r is RailRow =>
      Boolean(r) &&
      (r as RailRow).value !== null &&
      (r as RailRow).value !== undefined &&
      (r as RailRow).value !== '',
  )
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

function placeLink(query: Query, patch: Partial<Query>, label: ReactNode): ReactNode {
  return <Link to={{ pathname: '/', search: toSearch(applyPatch(query, patch)) }}>{label}</Link>
}

/** The place nodes on the record's path by type. */
export function placeNodes(song: Song, index: CatalogIndex): Partial<Record<Place['type'], Place>> {
  const out: Partial<Record<Place['type'], Place>> = {}
  const id = song.location.placeId
  if (!id) return out
  const parts = id.split('/')
  for (let i = 1; i <= parts.length; i++) {
    const p = index.placeById.get(parts.slice(0, i).join('/'))
    if (p && p.name !== 'unresolved') out[p.type] = p
  }
  return out
}

export function collectedDate(song: Song): string | null {
  const c = song.collected
  if (c.raw) return c.raw
  if (c.year === null) return null
  const parts = [String(c.year)]
  if (c.month !== null) parts.push(String(c.month).padStart(2, '0'))
  if (c.month !== null && c.day !== null) parts.push(String(c.day).padStart(2, '0'))
  return parts.join('-')
}

export function SongRail({ song, index }: { song: Song; index: CatalogIndex }) {
  const { query } = useQuery()
  const journeyRefs = useSongJourneys(song)
  const loc = song.location
  const nodes = placeNodes(song, index)
  const village = nodes.village
  const county = nodes.county
  const region = nodes.region
  const country = nodes.country
  const countryLabel = country
    ? placeText(country, country.id)
    : loc.country
      ? countryName(loc.country)
      : null
  const villageValue = village
    ? placeLink(query, { village: village.id }, <PlaceLabel place={village} showMarkers />)
    : loc.village || loc.villageHistorical
      ? [
          loc.village,
          loc.villageHistorical && loc.villageHistorical !== loc.village
            ? `(${loc.villageHistorical})`
            : null,
        ]
          .filter(Boolean)
          .join(' ')
      : null
  const countyValue = county
    ? placeLink(query, { county: county.id }, <PlaceLabel place={county} />)
    : loc.county || loc.countyHistorical
      ? [
          loc.county,
          loc.countyHistorical && loc.countyHistorical !== loc.county ? `(${loc.countyHistorical})` : null,
        ]
          .filter(Boolean)
          .join(' ')
      : null
  const regionValue = region
    ? placeLink(query, { region: region.id }, placeText(region, region.id))
    : loc.region
  const thenNow =
    loc.countyHistorical && (loc.county || countryLabel)
      ? t('song.thenNow', {
          then: loc.countyHistorical,
          now: [loc.county ?? county?.name, countryLabel].filter(Boolean).join(', '),
        })
      : null
  const origin = loc.origin
  const originText =
    origin && (origin.village || origin.villageHistorical || origin.county)
      ? [origin.village ?? origin.villageHistorical, origin.county ?? origin.countyHistorical]
          .filter(Boolean)
          .join(', ')
      : null
  const coords =
    loc.lat !== null && loc.lng !== null
      ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
      : t('tree.notMapped')
  const recording = song.media.audio.length
    ? song.media.audio.map((a) => audioLabel(a, song)).join(', ')
    : null

  const sex =
    song.performer.sex === 'm' ? t('facet.sexM') : song.performer.sex === 'f' ? t('facet.sexF') : null
  const alternates = song.source.alternates ?? []

  return (
    <aside className="song-rail" aria-label="Record details">
      <RailSection
        id="where"
        title={t('song.rail.where')}
        rows={[
          { label: t('song.row.village'), value: villageValue },
          { label: t('song.row.county'), value: countyValue },
          { label: t('song.row.region'), value: regionValue },
          { label: t('song.row.country'), value: countryLabel },
          { label: t('song.row.thenNow'), value: thenNow },
          {
            label: t('song.row.origin'),
            value:
              originText && originText !== [loc.village, loc.county].filter(Boolean).join(', ')
                ? originText
                : null,
          },
          { label: t('song.row.coordinates'), value: coords, mono: true },
          { label: t('song.row.placeRaw'), value: loc.raw, mono: true },
        ]}
      />
      <RailSection
        id="who"
        title={t('song.rail.whoWhen')}
        rows={[
          { label: t('song.row.performer'), value: song.performer.name },
          {
            label: t('song.row.age'),
            value: song.performer.age !== null ? String(song.performer.age) : null,
          },
          { label: t('song.row.sex'), value: sex },
          { label: t('song.row.ethnicity'), value: song.performer.ethnicity },
          { label: t('song.row.date'), value: collectedDate(song) },
          song.collected.raw && song.collected.year !== null
            ? { label: t('song.row.year'), value: String(song.collected.year), mono: true }
            : null,
          { label: t('song.row.collector'), value: song.collector },
          {
            label: t('song.collectedOn'),
            value: journeyRefs.length ? <JourneyLink refs={journeyRefs} /> : null,
          },
          { label: t('song.row.recording'), value: recording, mono: true },
        ]}
      />
      <RailSection
        id="music"
        title={t('song.rail.music')}
        rows={[
          {
            label: t('song.row.genre'),
            value: song.genre ? (
              <span title={genreTitle(song.genre)}>
                <GenreSwatch genre={song.genre} size={8} /> <span lang="ro">{genreLabel(song.genre)}</span>
                {song.genreRaw && song.genreRaw !== song.genre && (
                  <span className="mono muted"> ({song.genreRaw})</span>
                )}
              </span>
            ) : song.genreRaw ? (
              <span className="mono">{song.genreRaw}</span>
            ) : null,
          },
          { label: t('song.row.performance'), value: performanceLabel(song.performance) },
          { label: t('song.row.style'), value: song.style ? styleLabel(song.style) : null },
          {
            label: t('song.row.instruments'),
            value: song.instrument.length ? song.instrument.map(instrumentLabel).join(', ') : null,
          },
          { label: t('song.row.system'), value: song.music.systemPosition, mono: true },
          { label: t('song.row.cadences'), value: song.music.cadences, mono: true },
          { label: t('song.row.rhythm'), value: song.music.rhythm, mono: true },
          { label: t('song.row.mode'), value: song.music.mode },
          { label: t('song.row.ambitus'), value: song.music.ambitus, mono: true },
          { label: t('song.row.syllables'), value: song.music.syllables, mono: true },
          { label: t('song.row.form'), value: song.music.form, mono: true },
        ]}
      />
      <RailSection
        id="works"
        title={t('song.rail.works')}
        rows={song.composition.map((c) => ({
          label: t('song.row.works'),
          value: (
            <span>
              {[c.work, c.movement].filter(Boolean).join(', ') || c.raw}
              {c.catalogue && <span className="mono muted"> {c.catalogue}</span>}
            </span>
          ),
        }))}
      />
      <RailSection
        id="source"
        title={t('song.rail.source')}
        rows={[
          { label: t('song.row.reference'), value: <SourceLink song={song} size="row" /> },
          { label: t('song.row.volume'), value: song.source.volume, mono: true },
          { label: t('song.row.number'), value: song.source.number, mono: true },
          { label: t('song.row.database'), value: siteName(song.source.site) },
          {
            label: t('song.rail.source'),
            value: song.source.url ? (
              <a href={song.source.url} target="_blank" rel="noopener noreferrer">
                {song.source.site === 'rfm' ? t('song.openPage') : t('song.openSource', { site: siteName(song.source.site) })}
              </a>
            ) : null,
          },
          ...alternates.map((a) => ({
            label: t('song.row.reference'),
            value: (
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {t('song.alsoCatalogued', { id: a.siteId || a.id || a.url, site: siteName(a.site) })}
              </a>
            ),
          })),
          { label: t('song.row.id'), value: song.id, mono: true },
        ]}
      />
    </aside>
  )
}
