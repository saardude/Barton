// SongRow / SongList: the row is an <li> holding the title link and the SourceLink as siblings
// so both stay separately focusable.
import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import type { CatalogIndex } from '../data/catalogIndex'
import { stateName, t } from '../i18n/en'
import { hasNotation } from '../state/selectors'
import type { Song } from '../types/song'
import { SourceLink } from './SourceLink'

/** "Kiama, NSW" from the place node when resolved, else the state alone. */
export function songPlaceLine(song: Song): string {
  const loc = song.location
  const parts: string[] = []
  if (loc.town) parts.push(loc.town)
  if (loc.state) parts.push(loc.town ? loc.state : stateName(loc.state))
  return parts.join(', ')
}

/** "The Worker, 1891" */
export function songSourceLine(song: Song): string {
  const n = song.provenance.newspaper
  return n ? n.title : ''
}

export function SongRow({
  song,
  index,
  search,
  selected,
  tabIndex,
  onHover,
  onFocus,
  onKeyDown,
}: {
  song: Song
  index?: CatalogIndex
  search: string
  selected?: boolean
  tabIndex?: number
  onHover?: (placeId: string | null) => void
  onFocus?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLAnchorElement>) => void
}) {
  void index
  const place = songPlaceLine(song)
  const paper = songSourceLine(song)
  const year = song.year.value ?? t('facet.noDate')
  const meta = [paper, place].filter(Boolean).join(' / ')
  return (
    <li className={`song-row${selected ? ' is-selected' : ''}`} data-song-id={song.id} onMouseEnter={() => onHover?.(song.location.placeId ?? null)} onMouseLeave={() => onHover?.(null)}>
      <Link
        className="song-row__main"
        to={{ pathname: `/song/${song.id}`, search }}
        tabIndex={tabIndex}
        onFocus={() => {
          onFocus?.()
          onHover?.(song.location.placeId ?? null)
        }}
        onBlur={() => onHover?.(null)}
        onKeyDown={onKeyDown}
      >
        <span className="song-row__title">
          <span className={`swatch swatch--8 swatch--${song.kind}`} aria-hidden="true" />
          <span>{song.title}</span>
        </span>
        <span className="song-row__meta">
          {meta && <span>{meta}, </span>}
          <span>{year}</span>
        </span>
      </Link>
      <div className="song-row__side">
        <SourceLink song={song} size="row" />
        <span className="song-row__icons">
          {(song.media.midi.length > 0 || song.media.audio.length > 0) && (
            <span title={song.media.audio.length ? t('results.hasAudio') : t('results.hasMidi')}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3 6v4h3l4 3V3L6 6H3z" fill="currentColor" />
                <path d="M12 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span className="visually-hidden">{song.media.audio.length ? t('results.hasAudio') : t('results.hasMidi')}</span>
            </span>
          )}
          {hasNotation(song) && (
            <span title={t('results.hasNotation')}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M2 4h12M2 7h12M2 10h12M2 13h12" stroke="currentColor" strokeWidth="1" />
                <circle cx="6" cy="10" r="1.6" fill="currentColor" />
                <path d="M7.5 10V4.5l3 1" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span className="visually-hidden">{t('results.hasNotation')}</span>
            </span>
          )}
        </span>
      </div>
    </li>
  )
}

export function SongList({ songs, index, search, selectedId, onHover }: { songs: Song[]; index?: CatalogIndex; search: string; selectedId?: string; onHover?: (placeId: string | null) => void }) {
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)

  const move = useCallback((from: number, delta: number) => {
    const list = listRef.current
    if (!list) return
    const links = list.querySelectorAll<HTMLAnchorElement>('a.song-row__main')
    const next = Math.min(links.length - 1, Math.max(0, from + delta))
    links[next]?.focus()
  }, [])

  return (
    <ol ref={listRef} id="results" className="song-list" aria-label={t('results.label')} tabIndex={-1}>
      {songs.map((song, i) => (
        <SongRow
          key={song.id}
          song={song}
          index={index}
          search={search}
          selected={song.id === selectedId}
          tabIndex={i === Math.min(active, songs.length - 1) ? 0 : -1}
          onHover={onHover}
          onFocus={() => setActive(i)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              move(i, 1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              move(i, -1)
            } else if (e.key === 'Home') {
              e.preventDefault()
              move(i, -i)
            } else if (e.key === 'End') {
              e.preventDefault()
              move(i, songs.length)
            }
          }}
        />
      ))}
    </ol>
  )
}
