// MidiLinks: browsers do not play MIDI natively, so each file is a download link with a hint.
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

export function MidiLinks({ song }: { song: Song }) {
  const items = song.media.midi
  if (!items.length) return <p className="audio audio--none muted">{t('song.midiNone')}</p>
  return (
    <div className="audio-list">
      {items.map((item) => (
        <figure className="audio" key={item.url}>
          <figcaption className="audio__caption">
            <span className="mono">{basename(item.url)}</span>
          </figcaption>
          <p className="audio__meta">
            <a className="btn btn--sm" href={item.url} download target="_blank" rel="noopener noreferrer">
              {t('song.midiDownload')}
            </a>
          </p>
          <p className="audio__meta muted">{t('song.midiHint')}</p>
        </figure>
      ))}
    </div>
  )
}
