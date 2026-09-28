import { downloadExport } from '../app/exportJson'
import { t } from '../i18n/en'
import type { Query } from '../state/query'
import type { Song } from '../types/song'

export function ExportButton({ songs, query, small, label }: { songs: Song[]; query: Query; small?: boolean; label?: string }) {
  const n = songs.length
  return (
    <button
      type="button"
      className={`btn${small ? ' btn--sm' : ''}`}
      disabled={n === 0}
      title={n === 0 ? t('results.exportDisabled') : t('results.exportAria', { n })}
      aria-label={n === 0 ? t('results.exportDisabled') : t('results.exportAria', { n })}
      onClick={() => downloadExport(songs, query)}
    >
      {label ?? t('results.export')}
    </button>
  )
}
