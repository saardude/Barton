// SongText (FRONTEND-SPEC 9): "Text" section, pre-wrap, lang="ro", collapsed with "Show all"
// when long; "Remarks" under it when present.
import { useId, useState } from 'react'
import { t } from '../../i18n/en'

const COLLAPSE_CHARS = 600
const COLLAPSE_LINES = 12

export function isLongText(text: string): boolean {
  return text.length > COLLAPSE_CHARS || text.split('\n').length > COLLAPSE_LINES
}

export function SongText({ text, remarks, lang = 'ro' }: { text: string | null; remarks: string | null; lang?: string }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const long = text ? isLongText(text) : false
  const collapsed = long && !expanded
  return (
    <section className="song-text" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="caps-label">
        {t('song.text')}
      </h2>
      {text ? (
        <>
          <div id={`${id}-body`} className={`song-text__body${collapsed ? ' is-collapsed' : ''}`} lang={lang}>
            {text}
          </div>
          {long && (
            <button type="button" className="btn btn--link" aria-expanded={expanded} aria-controls={`${id}-body`} onClick={() => setExpanded((v) => !v)}>
              {expanded ? t('song.textShowLess') : t('song.textShowAll')}
            </button>
          )}
        </>
      ) : (
        <p className="muted">{t('song.textNone')}</p>
      )}
      {remarks && (
        <>
          <h3 className="caps-label">{t('song.remarks')}</h3>
          <p className="song-text__remarks">{remarks}</p>
        </>
      )}
    </section>
  )
}
