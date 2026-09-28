// SourceLink (FRONTEND-SPEC 15, AC-36, D8): the record's source identifier as visible mono text
// plus an external-link icon, one <a> to source.url, aria-label "Open original record on {site}".
import { siteName, siteShort, t } from '../i18n/en'
import type { Song } from '../types/song'

export function sourceLinkText(song: Pick<Song, 'id' | 'source' | 'music'>): string {
  const { source, music } = song
  if (source.referenceCode) return source.referenceCode
  if (music.systemPosition) return music.systemPosition
  if (source.number) return `${siteShort(source.site)} ${source.number}`
  if (source.siteId) return source.siteId
  return song.id
}

export function SourceLink({ song, size = 'row' }: { song: Pick<Song, 'id' | 'source' | 'music'>; size?: 'row' | 'header' }) {
  const text = sourceLinkText(song)
  const site = siteName(song.source.site)
  if (!song.source.url) {
    return (
      <span className="source-link--none" title={t('source.noUrl')}>
        {text}
      </span>
    )
  }
  return (
    <a
      className={`source-link${size === 'header' ? ' source-link--header' : ''}`}
      href={song.source.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('source.open', { site })}
      title={t('source.open', { site })}
    >
      <span>{text}</span>
      <svg className="source-link__icon" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M7 1h4v4M11 1 5.5 6.5M9 7v3.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7A.5.5 0 0 1 1.5 3H5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}
