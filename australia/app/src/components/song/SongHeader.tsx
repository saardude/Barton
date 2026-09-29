// SongHeader: title, SourceLink + collection name, first line, facet link chips.
import { Link } from 'react-router'
import { kindLabel, siteName, t } from '../../i18n/en'
import { applyPatch, DEFAULT_QUERY, type Query } from '../../state/query'
import { hasNotation } from '../../state/selectors'
import { toSearch } from '../../state/urlCodec'
import type { Song } from '../../types/song'
import { SourceLink } from '../SourceLink'

function only(patch: Partial<Query>): { pathname: string; search: string } {
  return { pathname: '/', search: toSearch(applyPatch(DEFAULT_QUERY, patch)) }
}

export function SongHeader({ song }: { song: Song }) {
  const incipit = song.text.incipit?.trim()
  const showIncipit = incipit && incipit.toLowerCase() !== song.title.toLowerCase()
  const paper = song.provenance.newspaper
  return (
    <header className="song-header">
      <h1 className="song-header__title">
        {song.title}
        {song.year.value !== null && <span className="song-header__ref mono"> ({song.year.approx ? 'c. ' : ''}{song.year.value})</span>}
      </h1>
      <p className="song-header__source">
        <SourceLink song={song} size="header" /> <span className="muted">{siteName(song.source.site)}</span>
      </p>
      {showIncipit && <p className="song-header__incipit">{incipit}</p>}
      {song.titleAlt.length > 0 && (
        <p className="muted">
          {t('song.alsoListedAs')}: {song.titleAlt.join('; ')}
        </p>
      )}
      <ul className="song-chips" role="list" aria-label="Facets">
        <li>
          <Link className="chip chip--link" to={only({ kind: [song.kind] })}>
            <span className={`swatch swatch--8 swatch--${song.kind}`} aria-hidden="true" />
            <span>{kindLabel(song.kind)}</span>
          </Link>
        </li>
        {paper && (
          <li>
            <Link className="chip chip--link" to={only({ paper: [paper.key] })}>
              {paper.title}
            </Link>
          </li>
        )}
        {song.location.placeId && (
          <li>
            <Link className="chip chip--link" to={only({ place: song.location.placeId })}>
              {song.location.town ?? song.location.state}
            </Link>
          </li>
        )}
        {song.author.name && (
          <li>
            <Link className="chip chip--link" to={only({ author: [song.author.name] })}>
              {t('song.row.author')}: {song.author.name}
            </Link>
          </li>
        )}
        {hasNotation(song) && (
          <li>
            <Link className="chip chip--link" to={only({ tune: 'notation' })}>
              {t('facet.tune.notation')}
            </Link>
          </li>
        )}
        {song.media.midi.length > 0 && (
          <li>
            <Link className="chip chip--link" to={only({ tune: 'midi' })}>
              {t('facet.tune.midi')}
            </Link>
          </li>
        )}
      </ul>
    </header>
  )
}
