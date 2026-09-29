// AudioPlayer: one native <audio controls preload="none"> per media.audio[] item (MP3 hot-linked
// from folkstream.com) with a download link and the credit line.
import { useState } from 'react'
import { t } from '../../i18n/en'
import type { Song } from '../../types/song'

function basename(url: string): string {
  try {
    const path = new URL(url).pathname
    return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1)) || url
  } catch {
    return url
  }
}

export function AudioPlayer({ url, title }: { url: string; title: string }) {
  const [error, setError] = useState(false)
  return (
    <figure className="audio">
      <figcaption className="audio__caption">
        <span className="mono">{basename(url)}</span>
      </figcaption>
      {error ? (
        <p className="audio__error" role="status">
          {t('song.audioError')}
        </p>
      ) : (
        <audio controls preload="none" aria-label={t('song.audioLabel', { title })} onError={() => setError(true)}>
          <source src={url} type="audio/mpeg" />
        </audio>
      )}
      <p className="audio__meta muted">
        <a href={url} download target="_blank" rel="noopener noreferrer">
          {t('song.audioDownload')}
        </a>
        <span> &middot; {t('song.audioCredit')}</span>
      </p>
    </figure>
  )
}

export function AudioList({ song, title }: { song: Song; title: string }) {
  if (!song.media.audio.length) return null
  return (
    <div className="audio-list">
      {song.media.audio.map((a) => (
        <AudioPlayer key={a.url} url={a.url} title={title} />
      ))}
    </div>
  )
}
