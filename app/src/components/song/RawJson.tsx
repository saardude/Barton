// RawJson (FRONTEND-SPEC 9, AC-20): the hydrated record pretty-printed with sorted keys,
// 2-space indent, a "Copy JSON" button; above 200 KB the first 200 KB with "Show all".
import { useMemo, useRef, useState } from 'react'
import { sortKeys } from '../../app/exportJson'
import { useToast } from '../../app/toast'
import { t } from '../../i18n/en'
import type { Song } from '../../types/song'

const LIMIT = 200 * 1024

export function rawJsonText(song: Song): string {
  return JSON.stringify(sortKeys(song), null, 2)
}

export function RawJson({ song }: { song: Song }) {
  const toast = useToast()
  const [showAll, setShowAll] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)
  const text = useMemo(() => rawJsonText(song), [song])
  const truncated = text.length > LIMIT && !showAll
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast(t('song.jsonCopied'))
    } catch {
      const el = preRef.current
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
      toast(t('copyManual'))
    }
  }
  return (
    <div className="raw-json">
      <div className="raw-json__bar">
        <span className="mono muted">{song.id}</span>
        <button type="button" className="btn btn--sm" onClick={copy}>
          {t('song.copyJson')}
        </button>
      </div>
      <pre className="raw-json__pre" tabIndex={0} ref={preRef} aria-label={`${t('song.tab.raw')}, ${song.id}`}>
        <code>{truncated ? text.slice(0, LIMIT) : text}</code>
      </pre>
      {truncated && (
        <button type="button" className="btn btn--sm" onClick={() => setShowAll(true)}>
          {t('song.showAllJson')}
        </button>
      )}
    </div>
  )
}
