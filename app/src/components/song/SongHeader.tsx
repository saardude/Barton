// SongHeader (FRONTEND-SPEC 9): title, SourceLink + database name, incipit, facet link chips.
import { Link } from 'react-router'
import {
  genreLabel,
  genreTitle,
  instrumentLabel,
  performanceLabel,
  siteName,
  styleLabel,
  t,
} from '../../i18n/en'
import { applyPatch, DEFAULT_QUERY, type Query } from '../../state/query'
import { toSearch } from '../../state/urlCodec'
import type { Song } from '../../types/song'
import { GenreSwatch } from '../Genre'
import { songDisplayTitle } from '../SongRow'
import { SourceLink, sourceLinkText } from '../SourceLink'
import { JourneyLink, useSongJourneys } from './JourneyLink'

function only(patch: Partial<Query>): { pathname: string; search: string } {
  return { pathname: '/', search: toSearch(applyPatch(DEFAULT_QUERY, patch)) }
}

export function SongHeader({ song }: { song: Song }) {
  const title = songDisplayTitle(song)
  const journeyRefs = useSongJourneys(song)
  const incipit = song.incipit?.trim()
  const showIncipit = incipit && incipit !== song.title?.trim()
  return (
    <header className="song-header">
      <h1 className={`song-header__title${title.untitled ? ' song-header__title--untitled' : ''}`}>
        {title.text}
        {title.untitled && <span className="song-header__ref mono"> {sourceLinkText(song)}</span>}
      </h1>
      <p className="song-header__source">
        <SourceLink song={song} size="header" /> <span className="muted">{siteName(song.source.site)}</span>
      </p>
      {showIncipit && (
        <p className="song-header__incipit" lang="ro">
          {incipit}
        </p>
      )}
      <ul className="song-chips" role="list" aria-label="Facets">
        {song.genre && (
          <li>
            <Link
              className="chip chip--link"
              to={only({ genre: [song.genre] })}
              title={genreTitle(song.genre)}
            >
              <GenreSwatch genre={song.genre} size={8} />
              <span lang="ro">{genreLabel(song.genre)}</span>
            </Link>
          </li>
        )}
        <li>
          <Link className="chip chip--link" to={only({ performance: song.performance })}>
            {t('facet.performance')}: {performanceLabel(song.performance)}
          </Link>
        </li>
        {song.style && (
          <li>
            <Link className="chip chip--link" to={only({ style: [song.style] })}>
              {t('facet.style')}: {styleLabel(song.style)}
            </Link>
          </li>
        )}
        {song.instrument.map((i) => (
          <li key={i}>
            <Link className="chip chip--link" to={only({ instrument: [i] })}>
              {instrumentLabel(i)}
            </Link>
          </li>
        ))}
      </ul>
      {journeyRefs.length > 0 && (
        <div className="song-header__journey">
          <JourneyLink refs={journeyRefs} compact />
        </div>
      )}
    </header>
  )
}
