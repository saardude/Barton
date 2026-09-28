// Song record (FRONTEND-SPEC 9, wireframe artboard 3): breadcrumb, prev / next within the current
// filtered and sorted set (AC-19), Record | Raw JSON tabs (AC-20), header, notation, audio, text,
// related melodies and the metadata rail. The Query from the URL is preserved on this route.
import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useCatalogReady } from '../app/catalog'
import { useDerived, useQuery } from '../app/query'
import { t } from '../i18n/en'
import { Breadcrumb, type Crumb } from '../components/Breadcrumb'
import { PlaceLabel } from '../components/PlaceLabel'
import { songDisplayTitle } from '../components/SongRow'
import { sourceLinkText } from '../components/SourceLink'
import { Skeleton, EmptyState } from '../components/States'
import { Tabstrip, tabPanelProps } from '../components/Tabstrip'
import { AudioList } from '../components/song/AudioPlayer'
import { NotationFigure } from '../components/song/NotationFigure'
import { RawJson } from '../components/song/RawJson'
import { RelatedMelodies } from '../components/song/RelatedMelodies'
import { SongHeader } from '../components/song/SongHeader'
import { SongNav } from '../components/song/SongNav'
import { placeNodes, SongRail } from '../components/song/SongRail'
import { SongText } from '../components/song/SongText'
import { placeText } from '../state/placeName'
import { applyPatch, DEFAULT_QUERY } from '../state/query'
import { prevNext } from '../state/songNav'
import { readTab, withTab } from '../state/tabParam'
import { toSearch } from '../state/urlCodec'
import type { Song } from '../types/song'

const TABS = ['record', 'raw'] as const
type SongTab = (typeof TABS)[number]

export function songDocumentTitle(title: string): string {
  return `${title} · ${t('app.titleSuffix')}`
}

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}

/** Explorer query that certainly contains the song: its village (or county), nothing else. */
export function showInExplorerSearch(song: Song): string {
  const id = song.location.placeId
  if (id) return toSearch(applyPatch(DEFAULT_QUERY, { village: id }))
  if (song.location.country && song.location.country !== 'RO') return toSearch(applyPatch(DEFAULT_QUERY, { country: 'all', q: sourceLinkText(song) }))
  return toSearch(applyPatch(DEFAULT_QUERY, { q: sourceLinkText(song) }))
}

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node || !node.closest) return false
  if (node.isContentEditable) return true
  return Boolean(node.closest('input, textarea, select, audio, video, [role="dialog"], [role="tablist"]'))
}

export function SongPage() {
  const { songId = '' } = useParams()
  const catalog = useCatalogReady()
  const derived = useDerived()
  const { query, search } = useQuery()
  const location = useLocation()
  const navigate = useNavigate()
  const song = catalog?.index.songById.get(songId)
  const tab = readTab(location.search, TABS, 'record')

  const title = song ? songDisplayTitle(song).text : t('state.notFound')
  useDocumentTitle(song ? songDocumentTitle(title) : t('state.notFound'))

  const ids = useMemo(() => (derived ? derived.sortedSongs.map((s) => s.id) : []), [derived])
  const position = useMemo(() => (derived && !derived.searching ? prevNext(songId, ids) : null), [derived, ids, songId])

  const hrefFor = (id: string) => ({ pathname: `/song/${id}`, search: withTab(search, tab, 'record') })
  const from = (location.state as { from?: unknown } | null)?.from
  const backTo = { pathname: typeof from === 'string' && from.startsWith('/county/') ? from : '/', search }

  // Keyboard: [ / ] and Left / Right move between records when focus is not in a control (AC-19).
  useEffect(() => {
    if (!position) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return
      const target = e.key === '[' || e.key === 'ArrowLeft' ? position.prevId : e.key === ']' || e.key === 'ArrowRight' ? position.nextId : undefined
      if (!target) return
      e.preventDefault()
      navigate(hrefFor(target))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // hrefFor is derived from search + tab, both covered below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, navigate, search, tab])

  if (!catalog || !derived) {
    return (
      <main className="song-page" aria-busy="true">
        <p className="muted">{t('loadingCollection')}</p>
        <Skeleton rows={8} />
      </main>
    )
  }
  if (!song) {
    return (
      <main className="song-page">
        <EmptyState
          title={t('state.songNotFound', { id: songId })}
          actions={
            <Link className="btn" to={{ pathname: '/', search }}>
              {t('state.backToExplorer')}
            </Link>
          }
        />
      </main>
    )
  }

  const nodes = placeNodes(song, catalog.index)
  const crumbs: Crumb[] = []
  if (nodes.country) crumbs.push({ key: 'country', label: placeText(nodes.country, nodes.country.id), to: { pathname: '/', search: toSearch(applyPatch(query, { country: nodes.country.id })) } })
  if (nodes.region) crumbs.push({ key: 'region', label: placeText(nodes.region, nodes.region.id), to: { pathname: '/', search: toSearch(applyPatch(query, { region: nodes.region.id })) } })
  if (nodes.county) crumbs.push({ key: 'county', label: <PlaceLabel place={nodes.county} />, to: { pathname: '/', search: toSearch(applyPatch(query, { county: nodes.county.id })) } })
  if (nodes.village) crumbs.push({ key: 'village', label: <PlaceLabel place={nodes.village} />, to: { pathname: '/', search: toSearch(applyPatch(query, { village: nodes.village.id })) } })
  crumbs.push({ key: 'song', label: title })

  const refText = sourceLinkText(song)
  const setTab = (next: SongTab) => navigate({ pathname: location.pathname, search: withTab(search, next, 'record') }, { replace: true })

  return (
    <main className="song-page">
      <Breadcrumb items={crumbs} />
      <SongNav position={position} hrefFor={hrefFor} backTo={backTo} backLabel={t('nav.backToResults')} showInExplorerTo={{ pathname: '/', search: showInExplorerSearch(song) }} />
      <Tabstrip
        idPrefix="song"
        label={t('song.tab.record')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'record', label: t('song.tab.record') },
          { id: 'raw', label: t('song.tab.raw') },
        ]}
      />
      {tab === 'record' ? (
        <div className="song-layout" {...tabPanelProps('song', 'record')}>
          <div className="song-main">
            <SongHeader song={song} />
            <section className="song-section" aria-label={t('facet.notation')}>
              <h2 className="caps-label">{t('facet.notation')}</h2>
              <NotationFigure items={song.media.notation} title={title} refText={refText} />
            </section>
            <section className="song-section" aria-label={t('facet.audio')}>
              <h2 className="caps-label">{t('facet.audio')}</h2>
              <AudioList song={song} title={title} />
            </section>
            <SongText text={song.text} remarks={song.remarks} lang={song.performer.ethnicity && /hungar|magyar/i.test(song.performer.ethnicity) ? 'hu' : 'ro'} />
            <RelatedMelodies song={song} index={catalog.index} search={search} />
          </div>
          <SongRail song={song} index={catalog.index} />
        </div>
      ) : (
        <div {...tabPanelProps('song', 'raw')}>
          <RawJson song={song} />
        </div>
      )}
    </main>
  )
}
