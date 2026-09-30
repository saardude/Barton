// StatusBar: canonical query string, Copy link, "N of M songs", "N not mapped", Export JSON.
import { useRef } from 'react'
import { Link } from 'react-router'
import { useDerived, useQuery } from '../app/query'
import { useToast } from '../app/toast'
import { songsOf, t } from '../i18n/en'
import { applyPatch } from '../state/query'
import { encodeQuery, toSearch } from '../state/urlCodec'
import { ExportButton } from './ExportButton'

export function StatusBar() {
  const { query } = useQuery()
  const derived = useDerived()
  const toast = useToast()
  const codeRef = useRef<HTMLElement>(null)
  const qs = encodeQuery(query)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast(t('linkCopied'))
    } catch {
      const el = codeRef.current
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
    <div className="statusbar" role="status" aria-label="Query status">
      <code className="statusbar__query" ref={codeRef} title={qs ? `?${qs}` : '/'}>
        {qs ? `?${qs}` : '/'}
      </code>
      <button type="button" className="btn btn--sm" onClick={copy}>
        {t('copyLink')}
      </button>
      {derived && (
        <span className="statusbar__count">
          {songsOf(derived.filteredSongs.length, derived.total)}
          {derived.unmappedCount > 0 && !query.unmapped && (
            <>
              {', '}
              <Link to={{ pathname: '/', search: toSearch(applyPatch(query, { unmapped: true })) }} title={t('map.unmappedBody')}>
                {t('map.notMapped', { n: derived.unmappedCount })}
              </Link>
            </>
          )}
        </span>
      )}
      <ExportButton songs={derived?.sortedSongs ?? []} query={query} small />
    </div>
  )
}
