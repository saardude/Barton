// Lyrics as stanzas (collapsed with "Show all" when long) and Mark Gregory's notes with the
// links from the source page.
import { useId, useState } from 'react'
import { t } from '../../i18n/en'
import type { Song } from '../../types/song'

const COLLAPSE_LINES = 24

export function Lyrics({ stanzas }: { stanzas: string[][] }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const lineCount = stanzas.reduce((n, s) => n + s.length, 0)
  const long = lineCount > COLLAPSE_LINES
  const collapsed = long && !expanded
  return (
    <section className="song-text" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="caps-label">
        {t('song.lyrics')}
      </h2>
      {stanzas.length ? (
        <>
          <div id={`${id}-body`} className={`song-text__body song-text__stanzas${collapsed ? ' is-collapsed' : ''}`} lang="en">
            {stanzas.map((st, i) => (
              <p className="song-text__stanza" key={i}>
                {st.map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < st.length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))}
          </div>
          {long && (
            <button type="button" className="btn btn--link" aria-expanded={expanded} aria-controls={`${id}-body`} onClick={() => setExpanded((v) => !v)}>
              {expanded ? t('song.textShowLess') : t('song.textShowAll')}
            </button>
          )}
        </>
      ) : (
        <p className="muted">{t('song.lyricsNone')}</p>
      )}
    </section>
  )
}

export function Notes({ notes }: { notes: Song['notes'] }) {
  const id = useId()
  const paragraphs = notes.text ? notes.text.split(/\n\s*\n/) : []
  return (
    <section className="song-text song-notes" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="caps-label">
        {t('song.notes')}
      </h2>
      {paragraphs.length ? (
        <>
          {paragraphs.map((p, i) => (
            <p className="song-text__remarks" key={i}>
              {p}
            </p>
          ))}
          <p className="muted song-notes__credit">{t('song.notesBy')}</p>
        </>
      ) : (
        <p className="muted">{t('song.notesNone')}</p>
      )}
      {notes.links.length > 0 && (
        <>
          <h3 className="caps-label">{t('song.links')}</h3>
          <ul className="related__links">
            {notes.links.map((l, i) => (
              <li key={l.href + i}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.text || l.href}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
